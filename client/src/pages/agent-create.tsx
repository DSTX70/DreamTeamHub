import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Save } from "lucide-react";
import { insertAgentSchema, type InsertAgent, type Pod } from "@shared/schema";
import { z } from "zod";

// Extended validation schema with custom rules
const agentCreateSchema = insertAgentSchema.extend({
  id: z.string().min(1, "Agent ID is required").regex(/^agent_[a-z0-9_]+$/, "ID must start with 'agent_' and contain only lowercase letters, numbers, and underscores"),
  title: z.string().min(1, "Title is required"),
  autonomyLevel: z.enum(["L0", "L1", "L2", "L3"], {
    required_error: "Autonomy level is required",
  }),
});

type AgentFormData = z.infer<typeof agentCreateSchema>;

export default function AgentCreate() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch pods for dropdown
  const { data: pods } = useQuery<Pod[]>({
    queryKey: ['/api/pods'],
  });

  // Initialize form with react-hook-form and zod validation
  const form = useForm<AgentFormData>({
    resolver: zodResolver(agentCreateSchema),
    defaultValues: {
      id: "",
      title: "",
      type: "dream_team",
      pillar: null,
      podId: null,
      podName: null,
      autonomyLevel: "L1",
      status: "active",
      skillPackPath: null,
      promptText: null,
      toolsConfig: null,
      evalConfig: null,
      goldensPath: null,
      lastEvalScore: null,
      evalHistory: [],
      threadId: null,
      systemPrompt: null,
    },
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

  const onSubmit = (data: AgentFormData) => {
    // Update podName based on podId
    const agentData: InsertAgent = {
      ...data,
      podName: data.podId ? pods?.find(p => p.id === data.podId)?.name || null : null,
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
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-grotesk font-medium">Basic Information</h3>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Agent ID <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="agent_example"
                            data-testid="input-id"
                          />
                        </FormControl>
                        <FormDescription>
                          Must start with 'agent_' and contain only lowercase letters, numbers, and underscores
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Title <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Agent Title"
                            data-testid="input-title"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Agent Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-type">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="dream_team">Dream Team</SelectItem>
                            <SelectItem value="pod_role">Pod Role</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-status">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="pillar"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pillar (Optional)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                          <FormControl>
                            <SelectTrigger data-testid="select-pillar">
                              <SelectValue placeholder="None" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Imagination">Imagination</SelectItem>
                            <SelectItem value="Innovation">Innovation</SelectItem>
                            <SelectItem value="Impact">Impact</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="podId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pod Assignment (Optional)</FormLabel>
                        <Select onValueChange={(val) => field.onChange(val ? parseInt(val) : null)} value={field.value?.toString() || undefined}>
                          <FormControl>
                            <SelectTrigger data-testid="select-pod">
                              <SelectValue placeholder="None" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {pods?.map((pod) => (
                              <SelectItem key={pod.id} value={pod.id.toString()}>
                                {pod.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="autonomyLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Autonomy Level <span className="text-destructive">*</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-autonomy">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="L0">L0 - Fully Autonomous</SelectItem>
                          <SelectItem value="L1">L1 - High Autonomy</SelectItem>
                          <SelectItem value="L2">L2 - Medium Autonomy</SelectItem>
                          <SelectItem value="L3">L3 - Human-in-Loop</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        L0 = Full autonomy, L3 = Requires human approval
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Skill Pack Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-grotesk font-medium">Skill Pack</h3>
                
                <FormField
                  control={form.control}
                  name="skillPackPath"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Skill Pack Path</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          placeholder="agents/agent_example"
                          data-testid="input-skill-pack-path"
                        />
                      </FormControl>
                      <FormDescription>
                        Path to agent's Skill Pack directory (optional)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="promptText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>System Prompt</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value || ""}
                          placeholder="Enter the agent's system prompt..."
                          className="min-h-32"
                          data-testid="input-prompt-text"
                        />
                      </FormControl>
                      <FormDescription>
                        The agent's core instructions and behavior (optional)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
