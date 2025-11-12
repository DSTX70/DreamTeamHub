import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft, Plus, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { insertProjectSchema } from "@shared/schema";
import { z } from "zod";
import type { Pod, Agent } from "@shared/schema";

// Form schema that accepts string dates and pod/agent IDs
const projectFormSchema = insertProjectSchema.extend({
  dueDate: z.string().optional(),
  podIds: z.array(z.number()).optional(),
  agentIds: z.array(z.string()).optional(),
});

export default function ProjectCreate() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedPods, setSelectedPods] = useState<number[]>([]);
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);

  // Fetch pods and agents for selection
  const { data: pods = [] } = useQuery<Pod[]>({
    queryKey: ['/api/pods'],
  });

  const { data: agents = [] } = useQuery<Agent[]>({
    queryKey: ['/api/agents'],
  });

  // Form setup
  const form = useForm({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "Imagination" as const,
      status: "planning" as const,
      priority: "medium" as const,
      dueDate: "",
    },
  });

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/projects', data);
      return res.json();
    },
    onSuccess: async (project) => {
      try {
        // Create pod assignments using local state
        for (const podId of selectedPods) {
          await apiRequest('POST', `/api/projects/${project.id}/pods`, { podId });
        }

        // Create agent assignments using local state
        for (const agentId of selectedAgents) {
          await apiRequest('POST', `/api/projects/${project.id}/agents`, { agentId });
        }

        // Invalidate all project queries
        await queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
        
        toast({
          title: "Project created",
          description: "Your project has been created successfully.",
        });
        setLocation("/projects");
      } catch (error: any) {
        toast({
          title: "Error creating assignments",
          description: error.message,
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: any) => {
    const projectData = {
      ...data,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    };
    createProjectMutation.mutate(projectData);
  };

  // Handle pod selection - use local state only
  const togglePod = (podId: number) => {
    setSelectedPods(prev =>
      prev.includes(podId)
        ? prev.filter(id => id !== podId)
        : [...prev, podId]
    );
  };

  // Handle agent selection - use local state only
  const toggleAgent = (agentId: string) => {
    setSelectedAgents(prev =>
      prev.includes(agentId)
        ? prev.filter(id => id !== agentId)
        : [...prev, agentId]
    );
  };

  return (
    <div className="h-full overflow-auto">
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/projects")}
            data-testid="button-back-to-projects"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold" data-testid="heading-create-project">
              Create New Project
            </h1>
            <p className="text-muted-foreground mt-1">
              Add a new project to one of the business pillars and assign pods and agents
            </p>
          </div>
        </div>

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
                <CardDescription>Basic information about the project</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter project title" data-testid="input-project-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          value={field.value || ""}
                          placeholder="Describe the project goals and scope" 
                          rows={4}
                          data-testid="input-project-description" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Pillar</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-project-category">
                              <SelectValue placeholder="Select pillar" />
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
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-project-status">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="planning">Planning</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="on_hold">On Hold</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-project-priority">
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Due Date (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            value={field.value || ""}
                            type="date" 
                            data-testid="input-project-due-date" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Pod Assignment */}
            <Card>
              <CardHeader>
                <CardTitle>Pod Assignment</CardTitle>
                <CardDescription>Select all pods that should work on this project</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pods.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No pods available</p>
                  ) : (
                    <>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {selectedPods.map(podId => {
                          const pod = pods.find(p => p.id === podId);
                          return pod ? (
                            <Badge
                              key={podId}
                              variant="secondary"
                              className="gap-1"
                              data-testid={`selected-pod-${podId}`}
                            >
                              {pod.name}
                              <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => togglePod(podId)}
                              />
                            </Badge>
                          ) : null;
                        })}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {pods.map((pod) => (
                          <div
                            key={pod.id}
                            className="flex items-center space-x-2 p-3 rounded-md border cursor-pointer hover-elevate"
                            onClick={() => togglePod(pod.id)}
                            data-testid={`pod-option-${pod.id}`}
                          >
                            <Checkbox
                              checked={selectedPods.includes(pod.id)}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <label className="flex-1 cursor-pointer">
                              <div className="font-medium">{pod.name}</div>
                              {pod.purpose && (
                                <div className="text-sm text-muted-foreground line-clamp-1">{pod.purpose}</div>
                              )}
                            </label>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Agent Assignment */}
            <Card>
              <CardHeader>
                <CardTitle>Agent Assignment</CardTitle>
                <CardDescription>Select all agents that should work on this project</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {agents.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No agents available</p>
                  ) : (
                    <>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {selectedAgents.map(agentId => {
                          const agent = agents.find(a => a.id === agentId);
                          return agent ? (
                            <Badge
                              key={agentId}
                              variant="secondary"
                              className="gap-1"
                              data-testid={`selected-agent-${agentId}`}
                            >
                              {agent.title}
                              <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => toggleAgent(agentId)}
                              />
                            </Badge>
                          ) : null;
                        })}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                        {agents.map((agent) => (
                          <div
                            key={agent.id}
                            className="flex items-center space-x-2 p-3 rounded-md border cursor-pointer hover-elevate"
                            onClick={() => toggleAgent(agent.id)}
                            data-testid={`agent-option-${agent.id}`}
                          >
                            <Checkbox
                              checked={selectedAgents.includes(agent.id)}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <label className="flex-1 cursor-pointer">
                              <div className="font-medium">{agent.title}</div>
                              {agent.pillar && (
                                <div className="text-sm text-muted-foreground line-clamp-1">{agent.pillar}</div>
                              )}
                            </label>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation("/projects")}
                data-testid="button-cancel-project"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createProjectMutation.isPending}
                data-testid="button-submit-project"
              >
                {createProjectMutation.isPending ? "Creating..." : "Create Project"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
