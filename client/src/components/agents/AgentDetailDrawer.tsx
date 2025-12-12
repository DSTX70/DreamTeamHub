import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, Bot, Beaker, Cog, Users, BookOpen, CheckCircle2, XCircle,
  Target, AlertTriangle, Package, CheckSquare, Brain
} from "lucide-react";
import type { Agent } from "@shared/schema";

interface AgentDetailDrawerProps {
  agent: Agent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

function InfoSection({ 
  icon: Icon, 
  title, 
  children 
}: { 
  icon: typeof Target;
  title: string; 
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Icon className="h-4 w-4" />
        {title}
      </div>
      <div className="pl-6">{children}</div>
    </div>
  );
}

function ListItems({ items }: { items: string[] }) {
  if (!items || items.length === 0) {
    return <p className="text-sm text-muted-foreground italic">Not specified</p>;
  }
  return (
    <ul className="space-y-1.5">
      {items.map((item, idx) => (
        <li key={idx} className="text-sm flex items-start gap-2">
          <span className="text-muted-foreground mt-1.5 h-1.5 w-1.5 rounded-full bg-current shrink-0" />
          {item}
        </li>
      ))}
    </ul>
  );
}

export function AgentDetailDrawer({ agent, open, onOpenChange }: AgentDetailDrawerProps) {
  if (!agent) return null;
  
  const typeConfig = TYPE_CONFIG[agent.type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.dream_team;
  const TypeIcon = typeConfig.icon;
  
  const isAgentLabEligible = agent.type !== 'system_capability' && 
    agent.autonomyMax && ['L1', 'L2', 'L3'].includes(agent.autonomyMax);
  
  const isAgentMode = agent.type === 'system_capability';

  const meta = agent.meta || {};
  const scope = meta.scope || [];
  const outOfScope = meta.outOfScope || [];
  const deliverables = meta.deliverables || [];
  const definitionOfDone = meta.definitionOfDone || [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl" data-testid="agent-detail-drawer">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-xl" data-testid="drawer-title">
            {agent.title || agent.id.replace('agent_', '')}
          </SheetTitle>
          {agent.role && (
            <SheetDescription>{agent.role}</SheetDescription>
          )}
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-140px)] pr-4">
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
              <Badge variant={typeConfig.variant} data-testid="drawer-badge-type">
                <TypeIcon className="h-3 w-3 mr-1" />
                {typeConfig.label}
              </Badge>
              
              {agent.isActive !== false ? (
                <Badge variant="outline" className="bg-green-500/10 text-green-600 dark:text-green-400" data-testid="drawer-badge-status">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-muted text-muted-foreground" data-testid="drawer-badge-status">
                  <XCircle className="h-3 w-3 mr-1" />
                  Inactive
                </Badge>
              )}
              
              {agent.canonVersion && (
                <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400" data-testid="drawer-badge-canon">
                  Canon {agent.canonVersion}
                </Badge>
              )}
              
              {isAgentLabEligible && (
                <Badge variant="outline" className="bg-purple-500/10 text-purple-600 dark:text-purple-400" data-testid="drawer-badge-agentlab">
                  <Beaker className="h-3 w-3 mr-1" />
                  Agent Lab Eligible
                </Badge>
              )}
              
              {isAgentMode && (
                <Badge variant="outline" className="bg-slate-500/10 text-slate-600 dark:text-slate-400" data-testid="drawer-badge-agentmode">
                  <Bot className="h-3 w-3 mr-1" />
                  Agent Mode
                </Badge>
              )}
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">Pillar</div>
                <div className="text-sm font-medium">{agent.pillar || '—'}</div>
              </div>
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">Pod</div>
                <div className="text-sm font-medium">{agent.podName || '—'}</div>
              </div>
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">Role</div>
                <div className="text-sm font-medium">{agent.role || '—'}</div>
              </div>
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">Tone/Voice</div>
                <div className="text-sm font-medium">{agent.toneVoice || '—'}</div>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Shield className="h-4 w-4" />
                Autonomy Configuration
              </div>
              <div className="grid grid-cols-2 gap-4 pl-6">
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">Current Level</div>
                  <Badge 
                    variant="outline" 
                    className={AUTONOMY_COLORS[agent.autonomyLevel] || ''}
                    data-testid="drawer-autonomy-current"
                  >
                    {agent.autonomyLevel} - {AUTONOMY_LABELS[agent.autonomyLevel]?.split(' - ')[1] || 'Unknown'}
                  </Badge>
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">Maximum Allowed</div>
                  <Badge 
                    variant="outline" 
                    className={AUTONOMY_COLORS[agent.autonomyMax || ''] || ''}
                    data-testid="drawer-autonomy-max"
                  >
                    {agent.autonomyMax || 'Not set'} {agent.autonomyMax && `- ${AUTONOMY_LABELS[agent.autonomyMax]?.split(' - ')[1] || ''}`}
                  </Badge>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <Tabs defaultValue="scope" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="scope" data-testid="tab-scope">Scope</TabsTrigger>
                <TabsTrigger value="outOfScope" data-testid="tab-outofscope">Out of Scope</TabsTrigger>
                <TabsTrigger value="deliverables" data-testid="tab-deliverables">Deliverables</TabsTrigger>
                <TabsTrigger value="dod" data-testid="tab-dod">DoD</TabsTrigger>
              </TabsList>
              
              <TabsContent value="scope" className="mt-4">
                <InfoSection icon={Target} title="Scope">
                  <ListItems items={scope} />
                </InfoSection>
              </TabsContent>
              
              <TabsContent value="outOfScope" className="mt-4">
                <InfoSection icon={AlertTriangle} title="Out of Scope">
                  <ListItems items={outOfScope} />
                </InfoSection>
              </TabsContent>
              
              <TabsContent value="deliverables" className="mt-4">
                <InfoSection icon={Package} title="Deliverables">
                  <ListItems items={deliverables} />
                </InfoSection>
              </TabsContent>
              
              <TabsContent value="dod" className="mt-4">
                <InfoSection icon={CheckSquare} title="Definition of Done">
                  <ListItems items={definitionOfDone} />
                </InfoSection>
              </TabsContent>
            </Tabs>
            
            {agent.promptText && (
              <>
                <Separator />
                <InfoSection icon={Brain} title="Mission & Context">
                  <p className="text-sm whitespace-pre-wrap">{agent.promptText}</p>
                </InfoSection>
              </>
            )}
            
            {agent.skillPackPath && (
              <>
                <Separator />
                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground">Skill Pack Path</div>
                  <code className="text-xs bg-muted px-2 py-1 rounded block">
                    {agent.skillPackPath}
                  </code>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
