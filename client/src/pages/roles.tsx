import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/empty-state";
import { AgentCard, AgentDetailDrawer } from "@/components/agents";
import { Search, Users, Plus, Info } from "lucide-react";
import { PageBreadcrumb, buildBreadcrumbs } from "@/components/PageBreadcrumb";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Agent, Pod } from "@shared/schema";

export default function Roles() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPod, setSelectedPod] = useState<string | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [selectedPillar, setSelectedPillar] = useState<string | null>(null);
  const [selectedAutonomy, setSelectedAutonomy] = useState<string | null>(null);
  const [selectedCanon, setSelectedCanon] = useState<string | null>("v1.0");
  const [activeOnly, setActiveOnly] = useState(true);
  
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  const toggleType = (type: string) => {
    setSelectedTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  const { data: agents, isLoading: agentsLoading } = useQuery<Agent[]>({
    queryKey: ['/api/agents'],
  });

  const { data: pods, isLoading: podsLoading } = useQuery<Pod[]>({
    queryKey: ['/api/pods'],
  });

  const isLoading = agentsLoading || podsLoading;

  const filteredAgents = agents?.filter(agent => {
    const matchesSearch = !searchQuery || 
      agent.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (agent.role && agent.role.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (agent.podName && agent.podName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (agent.pillar && agent.pillar.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesPod = !selectedPod || agent.podName === selectedPod;
    const matchesType = selectedTypes.size === 0 || selectedTypes.has(agent.type);
    const matchesPillar = !selectedPillar || agent.pillar === selectedPillar;
    const matchesAutonomy = !selectedAutonomy || 
      (agent.autonomyMax && ['L0', 'L1', 'L2', 'L3'].indexOf(agent.autonomyMax) >= ['L0', 'L1', 'L2', 'L3'].indexOf(selectedAutonomy));
    const matchesCanon = !selectedCanon || agent.canonVersion === selectedCanon;
    const matchesActive = !activeOnly || agent.isActive !== false;
    
    return matchesSearch && matchesPod && matchesType && matchesPillar && matchesAutonomy && matchesCanon && matchesActive;
  });

  const agentPods = Array.from(new Set(agents?.map(a => a.podName).filter((name): name is string => Boolean(name)) || [])).sort();
  const agentPillars = Array.from(new Set(agents?.map(a => a.pillar).filter((p): p is string => Boolean(p)) || [])).sort();
  const canonVersions = Array.from(new Set(agents?.map(a => a.canonVersion).filter((v): v is string => Boolean(v)) || [])).sort();

  const dreamTeamCount = agents?.filter(a => a.type === 'dream_team').length || 0;
  const podRoleCount = agents?.filter(a => a.type === 'pod_role').length || 0;
  const councilCount = agents?.filter(a => a.type === 'council').length || 0;
  const systemCount = agents?.filter(a => a.type === 'system_capability').length || 0;
  const totalCount = agents?.length || 0;

  const handleAgentClick = (agent: Agent) => {
    setSelectedAgent(agent);
    setDrawerOpen(true);
  };

  const breadcrumbs = buildBreadcrumbs({ page: "Agents" });

  return (
    <div className="space-y-6">
      <PageBreadcrumb segments={breadcrumbs} />
      
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold mb-2" data-testid="page-title">Dream Team Agents</h1>
          <p className="text-sm text-muted-foreground">
            {isLoading ? 'Loading agents...' : `${totalCount} AI agents with complete Skill Pack specifications`}
          </p>
        </div>
        <Button onClick={() => setLocation("/agents/new")} data-testid="button-create-agent">
          <Plus className="h-4 w-4 mr-2" />
          Add Agent
        </Button>
      </div>
      
      <Card className="bg-muted/30 border-primary/20">
        <CardContent className="py-3">
          <div className="flex items-start gap-3">
            <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground">
              Dream Team Hub canon governs these roles. Autonomy is gated. Agent Mode executes only explicit instructions. Agent Lab iterates within rails.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, role, pod, or pillar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search"
              />
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex gap-2 flex-wrap items-center">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide w-16">Type:</span>
                <Button
                  variant={selectedTypes.size === 0 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTypes(new Set())}
                  data-testid="filter-all-types"
                >
                  All Types
                </Button>
                <Button
                  variant={selectedTypes.has('dream_team') ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleType('dream_team')}
                  data-testid="filter-type-dream-team"
                >
                  Dream Team ({dreamTeamCount})
                </Button>
                <Button
                  variant={selectedTypes.has('pod_role') ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleType('pod_role')}
                  data-testid="filter-type-pod-role"
                >
                  Pod Roles ({podRoleCount})
                </Button>
                {councilCount > 0 && (
                  <Button
                    variant={selectedTypes.has('council') ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleType('council')}
                    data-testid="filter-type-council"
                  >
                    Council ({councilCount})
                  </Button>
                )}
                {systemCount > 0 && (
                  <Button
                    variant={selectedTypes.has('system_capability') ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleType('system_capability')}
                    data-testid="filter-type-system"
                  >
                    System ({systemCount})
                  </Button>
                )}
              </div>

              {agentPillars.length > 0 && (
                <div className="flex gap-2 flex-wrap items-center">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide w-16">Pillar:</span>
                  <Button
                    variant={selectedPillar === null ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedPillar(null)}
                    data-testid="filter-all-pillars"
                  >
                    All Pillars
                  </Button>
                  {agentPillars.map(pillar => (
                    <Button
                      key={pillar}
                      variant={selectedPillar === pillar ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedPillar(pillar)}
                      data-testid={`filter-pillar-${pillar.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      {pillar}
                    </Button>
                  ))}
                </div>
              )}

              <div className="flex gap-2 flex-wrap items-center">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide w-16">Pod:</span>
                <Button
                  variant={selectedPod === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedPod(null)}
                  data-testid="filter-all-pods"
                >
                  All Pods
                </Button>
                {agentPods.map(podName => (
                  <Button
                    key={podName}
                    variant={selectedPod === podName ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedPod(podName)}
                    data-pod={podName}
                    className={selectedPod === podName ? "pod-accent" : "pod-border"}
                    data-testid={`filter-pod-${podName.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {podName}
                  </Button>
                ))}
              </div>

              <div className="flex gap-2 flex-wrap items-center">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide w-16">
                  <Tooltip>
                    <TooltipTrigger>Autonomy:</TooltipTrigger>
                    <TooltipContent>Filter agents by minimum autonomy level</TooltipContent>
                  </Tooltip>
                </span>
                <Button
                  variant={selectedAutonomy === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedAutonomy(null)}
                  data-testid="filter-all-autonomy"
                >
                  All Levels
                </Button>
                {['L1', 'L2', 'L3'].map(level => (
                  <Button
                    key={level}
                    variant={selectedAutonomy === level ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedAutonomy(level)}
                    data-testid={`filter-autonomy-${level.toLowerCase()}`}
                  >
                    {level}+
                  </Button>
                ))}
              </div>

              {canonVersions.length > 0 && (
                <div className="flex gap-2 flex-wrap items-center">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide w-16">Canon:</span>
                  <Button
                    variant={selectedCanon === null ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCanon(null)}
                    data-testid="filter-all-canon"
                  >
                    All Versions
                  </Button>
                  {canonVersions.map(version => (
                    <Button
                      key={version}
                      variant={selectedCanon === version ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCanon(version)}
                      data-testid={`filter-canon-${version}`}
                    >
                      {version}
                    </Button>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-3 pt-2 border-t">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="active-only"
                    checked={activeOnly}
                    onCheckedChange={setActiveOnly}
                    data-testid="switch-active-only"
                  />
                  <Label htmlFor="active-only" className="text-sm">
                    Active only
                  </Label>
                </div>
                
                <span className="text-xs text-muted-foreground">
                  Showing {filteredAgents?.length || 0} of {totalCount} agents
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-48 mb-4" />
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredAgents && filteredAgents.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredAgents.map((agent) => (
            <AgentCard 
              key={agent.id} 
              agent={agent} 
              onClick={() => handleAgentClick(agent)}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={Users}
              title="No agents found"
              description={searchQuery || selectedPod || selectedTypes.size > 0 || selectedPillar || selectedAutonomy || selectedCanon 
                ? "Try adjusting your filters" 
                : "No agents available"}
              action={{
                label: "Create Agent",
                onClick: () => setLocation("/agents/new"),
              }}
            />
          </CardContent>
        </Card>
      )}
      
      <AgentDetailDrawer 
        agent={selectedAgent}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </div>
  );
}
