import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

type Agent = {
  id: string;
  title: string;
  type: 'dream_team' | 'pod_role';
  pillar: string;
  podId: number | null;
  podName: string;
  autonomyLevel: string;
  status: string;
  skillPackPath: string | null;
  promptText: string | null;
  toolsConfig: any | null;
  evalConfig: any | null;
  goldensPath: string | null;
  lastEvalScore: number | null;
  evalHistory: any | null;
};

export default function AgentConsole() {
  const [selectedAgent, setSelectedAgent] = useState<string>("");

  // Fetch all unified agents
  const { data: agentsData, isLoading: agentsLoading } = useQuery<Agent[]>({
    queryKey: ['/api/agents'],
  });

  const agents = agentsData || [];

  // Set first agent as selected when loaded
  useEffect(() => {
    if (agents.length > 0 && !selectedAgent) {
      setSelectedAgent(agents[0].id);
    }
  }, [agents, selectedAgent]);

  // Get currently selected agent details
  const currentAgent = agents.find(a => a.id === selectedAgent);

  if (agentsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Agent Console</h1>
          <p className="text-muted-foreground mt-1">
            Run tasks and teach agents through feedback
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Agent Selection */}
          <article className="role-card">
            {/* Cyan rail at top (Product pod color - Agent Console) */}
            <div className="rail pod-rail product h-1.5" />
            <div className="inner">
              <h2 className="text-lg font-grotesk text-text-primary mb-4">Skill Pack Explorer</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Browse unified agents and their Skill Pack specifications (prompt, tools, evaluations)
              </p>
              <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="agent-select">Select Agent</Label>
                <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                  <SelectTrigger id="agent-select" data-testid="select-agent">
                    <SelectValue placeholder="Choose an agent..." />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map((agent: Agent) => (
                      <SelectItem key={agent.id} value={agent.id} data-testid={`option-agent-${agent.id}`}>
                        <div className="flex items-center gap-2">
                          <Badge variant={agent.type === 'dream_team' ? 'default' : 'secondary'} className="text-xs">
                            {agent.type === 'dream_team' ? 'DT' : 'PR'}
                          </Badge>
                          <span>{agent.title}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Agent Skill Pack Info */}
              {currentAgent && currentAgent.promptText && (
                <div className="space-y-3 p-4 bg-muted/30 rounded-md border">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">Skill Pack Information</h3>
                    <Badge variant="outline">{currentAgent.autonomyLevel}</Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <span className="text-xs text-muted-foreground">Mission:</span>
                      <p className="text-sm mt-1 line-clamp-3">{currentAgent.promptText.slice(0, 200)}...</p>
                    </div>
                    
                    {currentAgent.toolsConfig?.tools && (
                      <div>
                        <span className="text-xs text-muted-foreground">Tools ({currentAgent.toolsConfig.tools.length}):</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {currentAgent.toolsConfig.tools.slice(0, 5).map((tool: any, idx: number) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {tool.name}
                            </Badge>
                          ))}
                          {currentAgent.toolsConfig.tools.length > 5 && (
                            <Badge variant="secondary" className="text-xs">
                              +{currentAgent.toolsConfig.tools.length - 5} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {currentAgent.lastEvalScore !== null && (
                      <div>
                        <span className="text-xs text-muted-foreground">Last Eval Score:</span>
                        <span className="text-sm font-semibold ml-2">{currentAgent.lastEvalScore.toFixed(1)}%</span>
                      </div>
                    )}
                  </div>
                </div>
              )}


              {/* Task execution coming soon */}
              <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-md border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>Note:</strong> Agent task execution will be enabled once Skill Pack prompts are wired into the execution engine (Task 8).
                </p>
              </div>
              </div>
            </div>
          </article>

          {/* Full Skill Pack Details */}
          {currentAgent && currentAgent.promptText && (
            <Card>
              <CardHeader>
                <CardTitle>Complete Mission Prompt</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-md max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm font-mono" data-testid="text-full-prompt">
                    {currentAgent.promptText}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Agent Metadata */}
        <div className="space-y-6">
          {/* Agent Stats */}
          {currentAgent && (
            <Card>
              <CardHeader>
                <CardTitle>Agent Metadata</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Type</span>
                    <Badge variant={currentAgent.type === 'dream_team' ? 'default' : 'secondary'}>
                      {currentAgent.type === 'dream_team' ? 'Dream Team' : 'Pod Role'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Pillar</span>
                    <Badge variant="outline">{currentAgent.pillar}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Pod</span>
                    <span className="text-sm font-medium">{currentAgent.podName}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Autonomy</span>
                    <Badge variant="outline">{currentAgent.autonomyLevel}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge variant={currentAgent.status === 'active' ? 'default' : 'secondary'}>
                      {currentAgent.status}
                    </Badge>
                  </div>
                </div>

                {/* Skill Pack Path */}
                {currentAgent.skillPackPath && (
                  <div className="pt-4 border-t">
                    <span className="text-xs text-muted-foreground">Skill Pack Path</span>
                    <p className="text-xs font-mono mt-1 text-muted-foreground">{currentAgent.skillPackPath}</p>
                  </div>
                )}

                {/* Goldens Path */}
                {currentAgent.goldensPath && (
                  <div>
                    <span className="text-xs text-muted-foreground">Golden Tests</span>
                    <p className="text-xs font-mono mt-1 text-muted-foreground">{currentAgent.goldensPath}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Tools List */}
          {currentAgent && currentAgent.toolsConfig?.tools && (
            <Card>
              <CardHeader>
                <CardTitle>Available Tools</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {currentAgent.toolsConfig.tools.map((tool: any, idx: number) => (
                    <div key={idx} className="p-3 bg-muted rounded-md">
                      <div className="font-medium text-sm">{tool.name}</div>
                      {tool.scopes && tool.scopes.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {tool.scopes.map((scope: string, sIdx: number) => (
                            <Badge key={sIdx} variant="secondary" className="text-xs">
                              {scope}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
