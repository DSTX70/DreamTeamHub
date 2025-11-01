import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Play, MessageSquare } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";

type Agent = {
  handle: string;
  title: string;
  pod: string;
  purpose: string;
};

type AgentMemory = {
  id: number;
  kind: string;
  content: string;
  score: number;
  createdAt: string;
};

export default function AgentConsole() {
  const { toast } = useToast();
  const [selectedAgent, setSelectedAgent] = useState<string>("");
  const [task, setTask] = useState("Draft a marketing strategy for Q1");
  const [output, setOutput] = useState("");
  const [feedbackInput, setFeedbackInput] = useState("");

  // Fetch all agents
  const { data: agentsData, isLoading: agentsLoading } = useQuery({
    queryKey: ['/api/agents'],
  });

  const agents = (agentsData as any)?.agents || [];

  // Set first agent as selected when loaded
  useEffect(() => {
    if (agents.length > 0 && !selectedAgent) {
      setSelectedAgent(agents[0].handle);
    }
  }, [agents, selectedAgent]);

  // Fetch agent memories
  const { data: memoriesData } = useQuery({
    queryKey: ['/api/agents', selectedAgent, 'memory'],
    enabled: !!selectedAgent,
  });

  const memories = (memoriesData as any)?.items || [];

  // Run agent mutation
  const runAgentMutation = useMutation({
    mutationFn: async (data: { agent: string; task: string }) => {
      const response = await fetch('/api/agents/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to run agent');
      return await response.json();
    },
    onSuccess: (data: any) => {
      setOutput(data.output || '');
      queryClient.invalidateQueries({ queryKey: ['/api/agents', selectedAgent, 'memory'] });
      toast({
        title: "Task completed",
        description: `Agent executed the task in ${Math.round((data.duration || 0) / 1000)}s`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Send feedback mutation
  const feedbackMutation = useMutation({
    mutationFn: async (data: { agent: string; feedback: string; score: number; kind: string }) => {
      const response = await fetch('/api/agents/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to send feedback');
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/agents', selectedAgent, 'memory'] });
      setFeedbackInput("");
      toast({
        title: "Feedback recorded",
        description: "Agent memory updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleRunAgent = () => {
    if (!selectedAgent || !task.trim()) {
      toast({
        title: "Missing information",
        description: "Please select an agent and enter a task",
        variant: "destructive",
      });
      return;
    }
    runAgentMutation.mutate({ agent: selectedAgent, task });
  };

  const handleSendFeedback = () => {
    if (!selectedAgent || !feedbackInput.trim()) {
      return;
    }
    feedbackMutation.mutate({
      agent: selectedAgent,
      feedback: feedbackInput,
      score: 3,
      kind: 'feedback',
    });
  };

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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="w-5 h-5" />
                Run Agent Task
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="agent-select">Select Agent</Label>
                <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                  <SelectTrigger id="agent-select" data-testid="select-agent">
                    <SelectValue placeholder="Choose an agent..." />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map((agent: Agent) => (
                      <SelectItem key={agent.handle} value={agent.handle} data-testid={`option-agent-${agent.handle}`}>
                        {agent.handle} — {agent.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="task-input">Task Description</Label>
                <Textarea
                  id="task-input"
                  data-testid="input-task"
                  value={task}
                  onChange={(e) => setTask(e.target.value)}
                  placeholder="Describe the task you want the agent to perform..."
                  rows={4}
                />
              </div>

              <Button
                onClick={handleRunAgent}
                disabled={runAgentMutation.isPending}
                className="w-full"
                data-testid="button-run-agent"
              >
                {runAgentMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Run Agent
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Output */}
          {output && (
            <Card>
              <CardHeader>
                <CardTitle>Agent Output</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-md">
                  <pre className="whitespace-pre-wrap text-sm" data-testid="text-output">
                    {output}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Feedback */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Quick Feedback
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter feedback for this agent..."
                  value={feedbackInput}
                  onChange={(e) => setFeedbackInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSendFeedback();
                    }
                  }}
                  data-testid="input-feedback"
                />
                <Button
                  onClick={handleSendFeedback}
                  disabled={feedbackMutation.isPending || !feedbackInput.trim()}
                  data-testid="button-send-feedback"
                >
                  Send
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Press Enter or click Send to record feedback
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Agent Memories */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Agent Memory</CardTitle>
            </CardHeader>
            <CardContent>
              {memories.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No memories yet. Run tasks or send feedback to build the agent's memory.
                </p>
              ) : (
                <div className="space-y-3">
                  {memories.map((memory: AgentMemory) => (
                    <div
                      key={memory.id}
                      className="p-3 bg-muted rounded-md space-y-2"
                      data-testid={`memory-${memory.id}`}
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {memory.kind}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Score: {memory.score}
                        </span>
                      </div>
                      <p className="text-sm">{memory.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
