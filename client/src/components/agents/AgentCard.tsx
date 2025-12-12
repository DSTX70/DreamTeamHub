import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Shield, Bot, Beaker, Cog, Users, BookOpen, CheckCircle2, XCircle } from "lucide-react";
import type { Agent } from "@shared/schema";

interface AgentCardProps {
  agent: Agent;
  onClick?: () => void;
}

const TYPE_CONFIG = {
  dream_team: { label: "Dream Team", icon: Users, variant: "default" as const },
  pod_role: { label: "Pod Role", icon: BookOpen, variant: "secondary" as const },
  council: { label: "Council", icon: Users, variant: "outline" as const },
  system_capability: { label: "System", icon: Cog, variant: "outline" as const },
};

const AUTONOMY_COLORS: Record<string, string> = {
  L0: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30",
  L1: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30",
  L2: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/30",
  L3: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30",
};

const AUTONOMY_LABELS: Record<string, string> = {
  L0: "L0 - Human Required",
  L1: "L1 - Human-in-Loop",
  L2: "L2 - Bounded Autonomy",
  L3: "L3 - Full Autonomy",
};

export function AgentCard({ agent, onClick }: AgentCardProps) {
  const typeConfig = TYPE_CONFIG[agent.type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.dream_team;
  const TypeIcon = typeConfig.icon;
  
  const isAgentLabEligible = agent.type !== 'system_capability' && 
    agent.autonomyMax && ['L1', 'L2', 'L3'].includes(agent.autonomyMax);
  
  const isAgentMode = agent.type === 'system_capability';

  return (
    <Card 
      className="hover-elevate cursor-pointer transition-all"
      onClick={onClick}
      data-testid={`agent-card-${agent.id}`}
      data-pod={agent.podName || undefined}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base truncate" data-testid={`agent-title-${agent.id}`}>
              {agent.title || agent.id.replace('agent_', '')}
            </h3>
            {agent.role && (
              <p className="text-sm text-muted-foreground truncate">
                {agent.role}
              </p>
            )}
          </div>
          
          {agent.isActive !== false ? (
            <Badge variant="outline" className="shrink-0 bg-green-500/10 text-green-600 dark:text-green-400" data-testid={`badge-status-${agent.id}`}>
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Active
            </Badge>
          ) : (
            <Badge variant="outline" className="shrink-0 bg-muted text-muted-foreground" data-testid={`badge-status-${agent.id}`}>
              <XCircle className="h-3 w-3 mr-1" />
              Inactive
            </Badge>
          )}
        </div>
        
        <div className="flex flex-wrap gap-1.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant={typeConfig.variant} className="text-xs" data-testid={`badge-type-${agent.id}`}>
                <TypeIcon className="h-3 w-3 mr-1" />
                {typeConfig.label}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>Agent type classification</TooltipContent>
          </Tooltip>
          
          {agent.podName && (
            <Badge variant="outline" className="text-xs pod-chip" data-testid={`badge-pod-${agent.id}`}>
              {agent.podName}
            </Badge>
          )}
          
          {agent.pillar && (
            <Badge variant="outline" className="text-xs" data-testid={`badge-pillar-${agent.id}`}>
              {agent.pillar}
            </Badge>
          )}
        </div>
        
        <div className="flex flex-wrap gap-1.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge 
                variant="outline" 
                className={`text-xs ${AUTONOMY_COLORS[agent.autonomyLevel] || ''}`}
                data-testid={`badge-autonomy-${agent.id}`}
              >
                <Shield className="h-3 w-3 mr-1" />
                {agent.autonomyLevel}
                {agent.autonomyMax && agent.autonomyMax !== agent.autonomyLevel && (
                  <span className="ml-1 opacity-70">→ {agent.autonomyMax}</span>
                )}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              {AUTONOMY_LABELS[agent.autonomyLevel] || agent.autonomyLevel}
              {agent.autonomyMax && agent.autonomyMax !== agent.autonomyLevel && (
                <div className="text-xs opacity-70">Max: {AUTONOMY_LABELS[agent.autonomyMax] || agent.autonomyMax}</div>
              )}
            </TooltipContent>
          </Tooltip>
          
          {agent.canonVersion && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400" data-testid={`badge-canon-${agent.id}`}>
                  Canon {agent.canonVersion}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>Canonical specification version</TooltipContent>
            </Tooltip>
          )}
          
          {isAgentLabEligible && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-600 dark:text-purple-400" data-testid={`badge-agentlab-${agent.id}`}>
                  <Beaker className="h-3 w-3 mr-1" />
                  Agent Lab Eligible
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                Eligible for Agent Lab runs (goal-based iteration) if OS grants and constraints are defined.
              </TooltipContent>
            </Tooltip>
          )}
          
          {isAgentMode && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="text-xs bg-slate-500/10 text-slate-600 dark:text-slate-400" data-testid={`badge-agentmode-${agent.id}`}>
                  <Bot className="h-3 w-3 mr-1" />
                  Agent Mode
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                Execution-only. No planning. No judgment.
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        
        {agent.promptText && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {agent.promptText.substring(0, 150)}...
          </p>
        )}
      </CardContent>
    </Card>
  );
}
