import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Layers, Users, Target, TrendingUp, Shield } from "lucide-react";
import type { Pod, PodAgent } from "@shared/schema";

export default function Pods() {
  const [selectedPillar, setSelectedPillar] = useState<string>("all");

  const { data: pods, isLoading: isLoadingPods } = useQuery<Pod[]>({
    queryKey: ['/api/pods'],
  });

  const { data: allAgents, isLoading: isLoadingAgents } = useQuery<PodAgent[]>({
    queryKey: ['/api/pod-agents'],
  });

  const isLoading = isLoadingPods || isLoadingAgents;

  const pillars = ["all", "Imagination", "Innovation", "Impact"];
  
  const filteredPods = pods?.filter(pod => 
    selectedPillar === "all" || pod.pillar === selectedPillar
  ).sort((a, b) => {
    if (a.pillar !== b.pillar) {
      return (a.pillar || "").localeCompare(b.pillar || "");
    }
    return a.name.localeCompare(b.name);
  }) || [];

  const getAgentsForPod = (podId: number) => {
    return allAgents?.filter(agent => agent.podId === podId) || [];
  };

  const getPillarIcon = (pillar: string | null) => {
    switch (pillar) {
      case "Imagination": return Target;
      case "Innovation": return TrendingUp;
      case "Impact": return Shield;
      default: return Layers;
    }
  };

  const getPillarColor = (pillar: string | null) => {
    switch (pillar) {
      case "Imagination": return "text-violet-400";
      case "Innovation": return "text-teal-400";
      case "Impact": return "text-jade-400";
      default: return "text-muted-foreground";
    }
  };

  const getPriorityVariant = (priority: string | null): "default" | "secondary" | "destructive" => {
    switch (priority) {
      case "critical": return "destructive";
      case "high": return "default";
      default: return "secondary";
    }
  };

  const getAutonomyBadge = (level: string | null) => {
    if (!level) return null;
    const badges: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
      "L0": { label: "L0: Manual", variant: "outline" },
      "L1": { label: "L1: Assisted", variant: "secondary" },
      "L2": { label: "L2: Conditional", variant: "default" },
      "L3": { label: "L3: Autonomous", variant: "default" },
    };
    return badges[level] || null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-2" data-testid="page-title">Organizational Pods</h1>
          <p className="text-sm text-muted-foreground">
            Multi-pod orchestration across Imagination, Innovation, and Impact pillars
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" data-testid="badge-pod-count">
            {filteredPods.length} {filteredPods.length === 1 ? 'Pod' : 'Pods'}
          </Badge>
          <Badge variant="outline" data-testid="badge-agent-count">
            {allAgents?.length || 0} {allAgents?.length === 1 ? 'Agent' : 'Agents'}
          </Badge>
        </div>
      </div>

      <Tabs value={selectedPillar} onValueChange={setSelectedPillar} className="w-full">
        <TabsList className="w-full justify-start" data-testid="tabs-pillars">
          {pillars.map(pillar => (
            <TabsTrigger 
              key={pillar} 
              value={pillar}
              data-testid={`tab-${pillar.toLowerCase()}`}
            >
              {pillar === "all" ? "All Pillars" : pillar}
            </TabsTrigger>
          ))}
        </TabsList>

        {pillars.map(pillar => (
          <TabsContent key={pillar} value={pillar} className="mt-6">
            {isLoading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-32 mb-2" />
                      <Skeleton className="h-4 w-48" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-20 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredPods.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredPods.map((pod) => {
                  const agents = getAgentsForPod(pod.id);
                  const PillarIcon = getPillarIcon(pod.pillar);
                  const autonomyInfo = getAutonomyBadge(pod.autonomyLevel);
                  
                  return (
                    <Card key={pod.id} className="hover-elevate" data-testid={`pod-card-${pod.id}`}>
                      <CardHeader className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg bg-muted/50 ${getPillarColor(pod.pillar)}`}>
                              <PillarIcon className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-lg leading-tight" data-testid={`pod-name-${pod.id}`}>
                                {pod.name}
                              </CardTitle>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {pod.pillar && (
                            <Badge variant="outline" className="text-xs" data-testid={`pod-pillar-${pod.id}`}>
                              {pod.pillar}
                            </Badge>
                          )}
                          {pod.type && (
                            <Badge variant="secondary" className="text-xs" data-testid={`pod-type-${pod.id}`}>
                              {pod.type}
                            </Badge>
                          )}
                          {pod.priority && (
                            <Badge 
                              variant={getPriorityVariant(pod.priority)} 
                              className="text-xs"
                              data-testid={`pod-priority-${pod.id}`}
                            >
                              {pod.priority}
                            </Badge>
                          )}
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        {pod.purpose && (
                          <div>
                            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                              Purpose
                            </div>
                            <p className="text-sm text-secondary-foreground line-clamp-2" data-testid={`pod-purpose-${pod.id}`}>
                              {pod.purpose}
                            </p>
                          </div>
                        )}

                        {autonomyInfo && (
                          <div>
                            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                              Autonomy Level
                            </div>
                            <Badge variant={autonomyInfo.variant} className="text-xs" data-testid={`pod-autonomy-${pod.id}`}>
                              {autonomyInfo.label}
                            </Badge>
                          </div>
                        )}

                        {agents.length > 0 && (
                          <div>
                            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              Role-Based Agents ({agents.length})
                            </div>
                            <div className="space-y-1">
                              {agents.slice(0, 3).map((agent) => (
                                <div 
                                  key={agent.id} 
                                  className="text-sm text-secondary-foreground flex items-center gap-2"
                                  data-testid={`agent-${agent.id}`}
                                >
                                  <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                                  <span className="flex-1 truncate">{agent.title}</span>
                                </div>
                              ))}
                              {agents.length > 3 && (
                                <div className="text-xs text-muted-foreground pl-3.5">
                                  +{agents.length - 3} more
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {pod.linkedBUs && pod.linkedBUs.length > 0 && (
                          <div>
                            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                              Linked BUs
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {pod.linkedBUs.slice(0, 2).map((bu, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {bu}
                                </Badge>
                              ))}
                              {pod.linkedBUs.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{pod.linkedBUs.length - 2}
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12">
                  <EmptyState
                    icon={Layers}
                    title={`No pods in ${pillar === "all" ? "the system" : pillar}`}
                    description={`No pods found ${pillar !== "all" ? `for the ${pillar} pillar` : ""}`}
                  />
                </CardContent>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
