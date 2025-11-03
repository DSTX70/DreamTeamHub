import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AutonomySelect } from "@/components/AutonomySelect";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Save } from "lucide-react";
import type { InsertAgent, Pod } from "@shared/schema";

export default function AgentCreate() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state
  const [id, setId] = useState("");
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"dream_team" | "pod_role">("dream_team");
  const [pillar, setPillar] = useState<string>("");
  const [podId, setPodId] = useState<string>("");
  const [autonomy, setAutonomy] = useState<"L0" | "L1" | "L2" | "L3" | "">("L1");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [skillPackPath, setSkillPackPath] = useState("");
  const [promptText, setPromptText] = useState("");

  // Fetch pods for dropdown
  const { data: pods } = useQuery<Pod[]>({
    queryKey: ['/api/pods'],
  });

  // Create agent mutation
  const createMutation = useMutation({
    mutationFn: async (data: InsertAgent) => {
      return await apiRequest('POST', '/api/agents', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/agents'] });
      toast({
        title: "Agent created",
        description: "The agent has been successfully created.",
      });
      setLocation("/roles");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create agent",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id || !title || !autonomy) {
      toast({
        title: "Validation error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const agentData: InsertAgent = {
      id,
      title,
      type,
      pillar: pillar || null,
      podId: podId ? parseInt(podId) : null,
      podName: podId ? pods?.find(p => p.id === parseInt(podId))?.name || null : null,
      autonomyLevel: autonomy,
      status,
      skillPackPath: skillPackPath || null,
      promptText: promptText || null,
      toolsConfig: null,
      evalConfig: null,
      goldensPath: null,
      lastEvalScore: null,
      evalHistory: [],
      threadId: null,
      systemPrompt: null,
    };

    createMutation.mutate(agentData);
  };

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/roles")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Agents
        </Button>
      </div>

      <Card>
        <CardHeader>
          <h1 className="text-2xl font-grotesk font-semibold" data-testid="page-title">
            Create New Agent
          </h1>
          <p className="text-sm text-muted-foreground">
            Add a new AI agent with complete Skill Pack specifications
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-grotesk font-medium">Basic Information</h3>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="id">
                    Agent ID <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="id"
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                    placeholder="agent_example"
                    data-testid="input-id"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Lowercase, underscores only (e.g., agent_os, agent_helm)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">
                    Title <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Agent Title"
                    data-testid="input-title"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="type">Agent Type</Label>
                  <Select
                    value={type}
                    onValueChange={(value: "dream_team" | "pod_role") => setType(value)}
                  >
                    <SelectTrigger id="type" data-testid="select-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dream_team">Dream Team</SelectItem>
                      <SelectItem value="pod_role">Pod Role</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={status}
                    onValueChange={(value: "active" | "inactive") => setStatus(value)}
                  >
                    <SelectTrigger id="status" data-testid="select-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="pillar">Pillar</Label>
                  <Select
                    value={pillar}
                    onValueChange={setPillar}
                  >
                    <SelectTrigger id="pillar" data-testid="select-pillar">
                      <SelectValue placeholder="Select pillar..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      <SelectItem value="Imagination">Imagination</SelectItem>
                      <SelectItem value="Innovation">Innovation</SelectItem>
                      <SelectItem value="Impact">Impact</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pod">Pod Assignment</Label>
                  <Select
                    value={podId}
                    onValueChange={setPodId}
                  >
                    <SelectTrigger id="pod" data-testid="select-pod">
                      <SelectValue placeholder="Select pod..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {pods?.map((pod) => (
                        <SelectItem key={pod.id} value={pod.id.toString()}>
                          {pod.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <AutonomySelect
                value={autonomy}
                onChange={(v) => setAutonomy(v)}
              />
            </div>

            {/* Skill Pack Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-grotesk font-medium">Skill Pack</h3>
              
              <div className="space-y-2">
                <Label htmlFor="skillPackPath">Skill Pack Path</Label>
                <Input
                  id="skillPackPath"
                  value={skillPackPath}
                  onChange={(e) => setSkillPackPath(e.target.value)}
                  placeholder="agents/agent_example"
                  data-testid="input-skill-pack-path"
                />
                <p className="text-xs text-muted-foreground">
                  Path to agent's Skill Pack directory (optional)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="promptText">System Prompt</Label>
                <Textarea
                  id="promptText"
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  placeholder="Enter the agent's system prompt..."
                  className="min-h-32"
                  data-testid="input-prompt-text"
                />
                <p className="text-xs text-muted-foreground">
                  The agent's core instructions and behavior (optional)
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={createMutation.isPending}
                data-testid="button-create"
              >
                <Save className="h-4 w-4 mr-2" />
                {createMutation.isPending ? "Creating..." : "Create Agent"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setLocation("/roles")}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
