import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  GraduationCap, TrendingUp, Award, Target, Shield, Bot, Beaker, 
  Search, Lock, AlertCircle
} from "lucide-react";
import { PageBreadcrumb, buildBreadcrumbs } from "@/components/PageBreadcrumb";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AgentDetailDrawer } from "@/components/agents";
import type { Agent } from "@shared/schema";

interface AgentLabRole {
  id: number;
  handle: string;
  title: string;
  pod: string;
  toneVoice: string;
  category: string;
  definitionOfDone: string[];
  strengths: string[];
}

const AUTONOMY_COLORS: Record<string, string> = {
  L0: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30",
  L1: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30",
  L2: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/30",
  L3: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30",
};

const AUTONOMY_DESCRIPTIONS: Record<string, { label: string; description: string; requirement?: string }> = {
  L0: { 
    label: "Human Required", 
    description: "Agent cannot take any action without human approval" 
  },
  L1: { 
    label: "Human-in-Loop", 
    description: "Agent can propose actions but requires human approval" 
  },
  L2: { 
    label: "Bounded Autonomy", 
    description: "Agent can act within defined constraints",
    requirement: "Requires certification"
  },
  L3: { 
    label: "Full Autonomy", 
    description: "Agent can act independently within its scope",
    requirement: "Requires OS approval + audit trail"
  },
};

export default function AcademyPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  const handleAgentClick = (agent: Agent) => {
    setSelectedAgent(agent);
    setDrawerOpen(true);
  };
  const [selectedAutonomy, setSelectedAutonomy] = useState<string | null>(null);
  
  const { data: roles = [], isLoading: rolesLoading } = useQuery<AgentLabRole[]>({
    queryKey: ["/api/roles"],
  });
  
  const { data: agents = [], isLoading: agentsLoading } = useQuery<Agent[]>({
    queryKey: ["/api/agents"],
  });
  
  const isLoading = rolesLoading || agentsLoading;

  const agentLabEligible = agents.filter(agent => 
    agent.type !== 'system_capability' && 
    agent.autonomyMax && 
    ['L1', 'L2', 'L3'].includes(agent.autonomyMax)
  );
  
  const agentModeAgents = agents.filter(agent => agent.type === 'system_capability');

  const filteredAgents = agentLabEligible.filter(agent => {
    const matchesSearch = !searchQuery || 
      agent.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (agent.role && agent.role.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (agent.podName && agent.podName.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesAutonomy = !selectedAutonomy || agent.autonomyMax === selectedAutonomy;
    
    return matchesSearch && matchesAutonomy;
  });

  const groupedByAutonomy = {
    L1: filteredAgents.filter(a => a.autonomyMax === 'L1'),
    L2: filteredAgents.filter(a => a.autonomyMax === 'L2'),
    L3: filteredAgents.filter(a => a.autonomyMax === 'L3'),
  };

  const agentLabRoles = roles.filter(role => 
    role.category === "Agent Lab / Senior Advisers + Added Specialists"
  );

  const groupedByLevel = agentLabRoles.reduce((acc, role) => {
    const level = role.toneVoice || "Advisory";
    if (!acc[level]) acc[level] = [];
    acc[level].push(role);
    return acc;
  }, {} as Record<string, AgentLabRole[]>);

  const levelCounts = {
    L1: groupedByAutonomy.L1.length,
    L2: groupedByAutonomy.L2.length,
    L3: groupedByAutonomy.L3.length,
  };

  const breadcrumbs = buildBreadcrumbs({ page: "Agent Lab Academy" });

  return (
    <div className="space-y-6">
      <PageBreadcrumb segments={breadcrumbs} />
      
      <div className="border-b pb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <GraduationCap className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" data-testid="heading-academy">
              Agentic AI Lab & Training Academy
            </h1>
            <p className="text-sm text-muted-foreground">
              At-a-glance status of agents, training, and promotions
            </p>
          </div>
        </div>
      </div>
      
      <Card className="p-4 bg-muted/30 border-primary/20">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div className="space-y-2">
            <p className="text-sm font-medium">
              Agent Lab Academy trains operators for bounded autonomy (L1–L3). Agent Mode is execution-only.
            </p>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Beaker className="h-4 w-4 text-purple-500" />
                <span><strong>Agent Lab:</strong> Goal-based iteration within rails</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Bot className="h-4 w-4 text-slate-500" />
                <span><strong>Agent Mode:</strong> Execution-only, no planning, no judgment</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-500/10">
              <Shield className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <div className="text-3xl font-bold" data-testid="count-l1">
                {levelCounts.L1}
              </div>
              <div className="text-sm text-muted-foreground">L1 - Human-in-Loop</div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-500/10">
              <div className="relative">
                <Shield className="h-6 w-6 text-yellow-500" />
                <Lock className="h-3 w-3 text-yellow-600 absolute -bottom-0.5 -right-0.5" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold" data-testid="count-l2">
                {levelCounts.L2}
              </div>
              <div className="text-sm text-muted-foreground">
                L2 - Bounded
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="ml-1 text-xs text-yellow-600 cursor-help">(Cert Required)</span>
                  </TooltipTrigger>
                  <TooltipContent>L2 autonomy requires operator certification</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10">
              <div className="relative">
                <Shield className="h-6 w-6 text-green-500" />
                <Award className="h-3 w-3 text-green-600 absolute -bottom-0.5 -right-0.5" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold" data-testid="count-l3">
                {levelCounts.L3}
              </div>
              <div className="text-sm text-muted-foreground">
                L3 - Full Autonomy
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="ml-1 text-xs text-green-600 cursor-help">(OS Approval)</span>
                  </TooltipTrigger>
                  <TooltipContent>L3 requires OS approval and audit trail</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-500/10">
              <Bot className="h-6 w-6 text-slate-500" />
            </div>
            <div>
              <div className="text-3xl font-bold" data-testid="count-agent-mode">
                {agentModeAgents.length}
              </div>
              <div className="text-sm text-muted-foreground">Agent Mode</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h2 className="text-lg font-semibold">Agent Lab Eligible Agents</h2>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search agents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64"
                data-testid="input-search-academy"
              />
            </div>
          </div>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={selectedAutonomy === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedAutonomy(null)}
            data-testid="filter-all-autonomy"
          >
            All Levels ({agentLabEligible.length})
          </Button>
          {(['L1', 'L2', 'L3'] as const).map(level => (
            <Button
              key={level}
              variant={selectedAutonomy === level ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedAutonomy(level)}
              className={selectedAutonomy === level ? AUTONOMY_COLORS[level] : ''}
              data-testid={`filter-autonomy-${level.toLowerCase()}`}
            >
              {level} ({groupedByAutonomy[level].length})
              {AUTONOMY_DESCRIPTIONS[level].requirement && (
                <Lock className="h-3 w-3 ml-1" />
              )}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          Loading agents...
        </div>
      ) : filteredAgents.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center gap-2">
            <Beaker className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">
              No Agent Lab eligible agents found. Adjust your filters or import agents with L1+ autonomy.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAgents.map((agent) => (
            <Card key={agent.id} className="p-4 hover-elevate cursor-pointer" onClick={() => handleAgentClick(agent)} data-testid={`agent-card-${agent.id}`}>
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-base mb-2" data-testid={`agent-title-${agent.id}`}>
                    {agent.title}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${AUTONOMY_COLORS[agent.autonomyMax || ''] || ''}`} 
                      data-testid={`badge-autonomy-${agent.id}`}
                    >
                      <Shield className="h-3 w-3 mr-1" />
                      {agent.autonomyMax} - {AUTONOMY_DESCRIPTIONS[agent.autonomyMax || '']?.label || 'Unknown'}
                    </Badge>
                    {agent.podName && (
                      <Badge variant="secondary" className="text-xs" data-testid={`badge-pod-${agent.id}`}>
                        {agent.podName}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-600 dark:text-purple-400">
                      <Beaker className="h-3 w-3 mr-1" />
                      Agent Lab
                    </Badge>
                  </div>
                </div>

                {agent.meta?.scope && agent.meta.scope.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-1">
                      Scope
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {agent.meta.scope.slice(0, 2).map((item, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs bg-muted/50">
                          {item.length > 25 ? item.substring(0, 25) + "..." : item}
                        </Badge>
                      ))}
                      {agent.meta.scope.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{agent.meta.scope.length - 2}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {agent.meta?.definitionOfDone && agent.meta.definitionOfDone.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Target className="h-3 w-3" />
                    <span>{agent.meta.definitionOfDone.length} success criteria defined</span>
                  </div>
                )}
                
                {AUTONOMY_DESCRIPTIONS[agent.autonomyMax || '']?.requirement && (
                  <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                    <Lock className="h-3 w-3" />
                    <span>{AUTONOMY_DESCRIPTIONS[agent.autonomyMax || ''].requirement}</span>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {agentModeAgents.length > 0 && (
        <div className="space-y-4 pt-6 border-t">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Bot className="h-5 w-5 text-slate-500" />
            Agent Mode (Execution Only)
          </h2>
          <p className="text-sm text-muted-foreground">
            These system capabilities execute explicit instructions only. No planning, no judgment.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agentModeAgents.map((agent) => (
              <Card key={agent.id} className="p-4 hover-elevate cursor-pointer" onClick={() => handleAgentClick(agent)} data-testid={`agent-mode-card-${agent.id}`}>
                <div className="space-y-2">
                  <h3 className="font-semibold text-base">{agent.title}</h3>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-xs bg-slate-500/10 text-slate-600 dark:text-slate-400">
                      <Bot className="h-3 w-3 mr-1" />
                      Agent Mode
                    </Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Card className="p-6 bg-muted/30">
        <div className="flex items-start gap-3">
          <GraduationCap className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">About the Agent Lab Academy</h3>
            <p className="text-sm text-muted-foreground">
              The Agentic AI Lab & Training Academy provides a comprehensive framework for 
              developing, training, and promoting AI agents through autonomy levels (L0→L1→L2→L3). 
              Each agent undergoes rigorous evaluation across four gates: Safety, Performance, 
              Cost, and Auditability.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-sm">
              <div className="space-y-1">
                <div className="font-medium flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-orange-500" />
                  L1: Human-in-Loop
                </div>
                <p className="text-muted-foreground text-xs">Agent proposes, human approves</p>
              </div>
              <div className="space-y-1">
                <div className="font-medium flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-yellow-500" />
                  L2: Bounded Autonomy
                </div>
                <p className="text-muted-foreground text-xs">Requires certification. Acts within constraints.</p>
              </div>
              <div className="space-y-1">
                <div className="font-medium flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-green-500" />
                  L3: Full Autonomy
                </div>
                <p className="text-muted-foreground text-xs">Requires OS approval + audit trail</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              <strong>Current Status:</strong> {agentLabEligible.length} Agent Lab eligible agents, 
              {agentModeAgents.length} Agent Mode system capabilities.
            </p>
          </div>
        </div>
      </Card>
      
      <AgentDetailDrawer 
        agent={selectedAgent}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </div>
  );
}
