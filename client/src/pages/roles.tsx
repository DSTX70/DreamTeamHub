import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Search, Users, Plus, ChevronDown, Brain, Wrench, Target, TrendingUp, Shield } from "lucide-react";
import type { Agent, Pod } from "@shared/schema";

export default function Roles() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPod, setSelectedPod] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);

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
      (agent.promptText && agent.promptText.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesPod = !selectedPod || agent.podName === selectedPod;
    const matchesType = !selectedType || agent.type === selectedType;
    
    return matchesSearch && matchesPod && matchesType;
  });

  // Get unique pod names from agents (filter out null/undefined)
  const agentPods = Array.from(new Set(agents?.map(a => a.podName).filter((name): name is string => Boolean(name)) || [])).sort();

  // Calculate counts from actual data
  const dreamTeamCount = agents?.filter(a => a.type === 'dream_team').length || 0;
  const podRoleCount = agents?.filter(a => a.type === 'pod_role').length || 0;
  const totalCount = agents?.length || 0;

  const autonomyLevelLabels: Record<string, string> = {
    'L0': 'L0 - Fully Autonomous',
    'L1': 'L1 - High Autonomy',
    'L2': 'L2 - Medium Autonomy',
    'L3': 'L3 - Human-in-Loop',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
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

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by ID, title, or mission..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search"
              />
            </div>

            <div className="flex flex-col gap-3">
              {/* Type Filter */}
              <div className="flex gap-2 flex-wrap items-center">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Type:</span>
                <Button
                  variant={selectedType === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedType(null)}
                  data-testid="filter-all-types"
                >
                  All Types
                </Button>
                <Button
                  variant={selectedType === 'dream_team' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedType('dream_team')}
                  data-testid="filter-type-dream-team"
                >
                  Dream Team ({dreamTeamCount})
                </Button>
                <Button
                  variant={selectedType === 'pod_role' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedType('pod_role')}
                  data-testid="filter-type-pod-role"
                >
                  Pod Roles ({podRoleCount})
                </Button>
              </div>

              {/* Pod Filter */}
              <div className="flex gap-2 flex-wrap items-center">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pod:</span>
                <Button
                  variant={selectedPod === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedPod(null)}
                  data-testid="filter-all-pods"
                >
                  All Pods
                </Button>
                {agentPods.map(podName => {
                  const isSelected = selectedPod === podName;
                  return (
                    <Button
                      key={podName}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedPod(podName)}
                      data-pod={podName}
                      className={isSelected ? "pod-accent" : ""}
                      data-testid={`filter-pod-${podName.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      {podName}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agents Grid */}
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-48 mb-4" />
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredAgents && filteredAgents.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredAgents.map((agent) => {
            const tools = agent.toolsConfig?.tools || [];
            
            return (
              <Collapsible key={agent.id} defaultOpen={false}>
                <div 
                  className="role-card" 
                  data-pod={agent.podName || undefined}
                  data-testid={`agent-card-${agent.id}`}
                >
                  {/* Pod-specific colored rail */}
                  <div className="pod-rail" />
                  <div className="inner">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
                      <p className="title" style={{ font: '800 22px/1 Inter', flex: 1 }}>
                        {agent.id.replace('agent_', '')}
                      </p>
                      <CollapsibleTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 group"
                          data-testid={`button-toggle-${agent.id}`}
                        >
                          <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                    
                    <p className="subtitle">{agent.title}</p>
                    
                    <div className="chips" style={{ marginBottom: 'var(--space-2)' }}>
                      {agent.podName && <span className="pod-chip">{agent.podName}</span>}
                      <span className="chip">{agent.type === 'dream_team' ? 'Dream Team' : 'Pod Role'}</span>
                      {agent.pillar && <span className="chip">{agent.pillar}</span>}
                    </div>

                    <div className="flex gap-2 mb-4">
                      <Badge variant="outline" className="text-xs" data-testid={`badge-autonomy-${agent.id}`}>
                        <Shield className="h-3 w-3 mr-1" />
                        {autonomyLevelLabels[agent.autonomyLevel] || agent.autonomyLevel}
                      </Badge>
                      {agent.status === 'active' && (
                        <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 dark:text-green-400" data-testid={`badge-status-${agent.id}`}>
                          Active
                        </Badge>
                      )}
                    </div>

                    {agent.promptText && (
                      <p style={{ 
                        color: 'var(--text-secondary)', 
                        marginBottom: 'var(--space-4)',
                        fontSize: '13px',
                        lineHeight: '1.5',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {agent.promptText.substring(0, 200)}...
                      </p>
                    )}

                    <CollapsibleContent className="space-y-3"
                      style={{ 
                        overflow: 'hidden',
                        transition: 'all 0.2s ease-in-out'
                      }}
                    >
                      {/* Full Mission/Prompt */}
                      {agent.promptText && (
                        <div style={{ marginBottom: 'var(--space-3)' }}>
                          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 'var(--space-2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            <Brain className="h-3 w-3 inline mr-1" />
                            Mission & Context
                          </div>
                          <p style={{ 
                            fontSize: '13px', 
                            color: 'var(--text-secondary)', 
                            lineHeight: '1.6',
                            whiteSpace: 'pre-wrap'
                          }}>
                            {agent.promptText}
                          </p>
                        </div>
                      )}

                      {/* Tools */}
                      {tools.length > 0 && (
                        <div style={{ marginBottom: 'var(--space-3)' }}>
                          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 'var(--space-2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            <Wrench className="h-3 w-3 inline mr-1" />
                            Tools & Capabilities ({tools.length})
                          </div>
                          <div className="chips">
                            {tools.map((tool, idx) => (
                              <span key={idx} className="chip" title={tool.scopes?.join(', ')}>
                                {tool.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Evaluation Config */}
                      {agent.evalConfig && (
                        <div style={{ marginBottom: 'var(--space-3)' }}>
                          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 'var(--space-2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            <Target className="h-3 w-3 inline mr-1" />
                            Evaluation
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            {agent.evalConfig.schedule && (
                              <Badge variant="outline" className="text-xs">
                                Schedule: {agent.evalConfig.schedule}
                              </Badge>
                            )}
                            {agent.evalConfig.threshold !== undefined && (
                              <Badge variant="outline" className="text-xs">
                                Threshold: {agent.evalConfig.threshold}%
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Latest Eval Score */}
                      {agent.lastEvalScore !== null && agent.lastEvalScore !== undefined && (
                        <div style={{ marginBottom: 'var(--space-3)' }}>
                          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 'var(--space-2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            <TrendingUp className="h-3 w-3 inline mr-1" />
                            Latest Score
                          </div>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              agent.lastEvalScore >= 80 
                                ? 'bg-green-500/10 text-green-600 dark:text-green-400' 
                                : agent.lastEvalScore >= 60 
                                ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                                : 'bg-red-500/10 text-red-600 dark:text-red-400'
                            }`}
                          >
                            {agent.lastEvalScore}% 
                            {agent.lastEvalAt && ` (${new Date(agent.lastEvalAt).toLocaleDateString()})`}
                          </Badge>
                        </div>
                      )}

                      {/* Skill Pack Path */}
                      {agent.skillPackPath && (
                        <div style={{ paddingTop: 'var(--space-3)', borderTop: '1px dashed var(--brand-line)' }}>
                          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 'var(--space-1)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Skill Pack
                          </div>
                          <code style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {agent.skillPackPath}
                          </code>
                        </div>
                      )}
                    </CollapsibleContent>
                  </div>
                </div>
              </Collapsible>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={Users}
              title="No agents found"
              description={searchQuery || selectedPod || selectedType ? "Try adjusting your filters" : "No agents available"}
              action={{
                label: "Create Agent",
                onClick: () => {},
              }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
