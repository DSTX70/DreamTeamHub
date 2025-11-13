import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { FilesPanel } from "@/components/FilesPanel";
import { Plus, Inbox, Calendar } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { WorkItem, Pod, Person } from "@shared/schema";
import { format } from "date-fns";

const workItemSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  podId: z.coerce.number().optional(),
  ownerId: z.coerce.number().optional(),
  status: z.string().default('todo'),
  priority: z.string().default('medium'),
  dueDate: z.string().optional(),
  milestone: z.string().optional(),
});

export default function Intake() {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<WorkItem | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: workItems, isLoading: isLoadingItems } = useQuery<WorkItem[]>({
    queryKey: ['/api/work-items'],
  });

  const { data: pods } = useQuery<Pod[]>({
    queryKey: ['/api/pods'],
  });

  const { data: persons } = useQuery<Person[]>({
    queryKey: ['/api/persons'],
  });

  const form = useForm<z.infer<typeof workItemSchema>>({
    resolver: zodResolver(workItemSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "todo",
      priority: "medium",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: z.infer<typeof workItemSchema>) => 
      apiRequest('POST', '/api/work-items', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/work-items'] });
      queryClient.invalidateQueries({ queryKey: ['/api/control/dashboard'] });
      toast({
        title: "Work item created",
        description: "The work item has been added to the intake queue",
      });
      form.reset();
      setShowForm(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create work item",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: number; updates: z.infer<typeof workItemSchema> }) => 
      apiRequest('PUT', `/api/work-items/${data.id}`, data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/work-items'] });
      queryClient.invalidateQueries({ queryKey: ['/api/control/dashboard'] });
      toast({
        title: "Work item updated",
        description: "The work item has been updated successfully",
      });
      form.reset();
      setEditingItem(null);
      setShowForm(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update work item",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof workItemSchema>) => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, updates: data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleViewItem = (item: WorkItem) => {
    setLocation(`/work-items/${item.id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-2" data-testid="page-title">Intake & Routing</h1>
          <p className="text-sm text-muted-foreground">Create and manage work items with pod assignments and milestones</p>
        </div>
        <Button 
          variant="default" 
          onClick={() => {
            if (showForm) {
              // Closing the form
              setShowForm(false);
              setEditingItem(null);
              form.reset();
            } else {
              // Opening create form
              setEditingItem(null);
              form.reset({
                title: "",
                description: "",
                status: "todo",
                priority: "medium",
              });
              setShowForm(true);
            }
          }} 
          data-testid="button-create-work-item"
        >
          <Plus className="h-4 w-4 mr-2" />
          {showForm ? "Cancel" : "Create Work Item"}
        </Button>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingItem ? "Edit Work Item" : "New Work Item"}</CardTitle>
            <CardDescription>
              {editingItem ? "Update the work item details" : "Add a new work item to the intake queue"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Work item title" {...field} data-testid="input-title" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe the work item..." 
                            className="min-h-24 resize-none"
                            {...field} 
                            data-testid="input-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="podId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pod</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger data-testid="select-pod">
                              <SelectValue placeholder="Select a pod" />
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

                  <FormField
                    control={form.control}
                    name="ownerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Owner</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger data-testid="select-owner">
                              <SelectValue placeholder="Select an owner" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {persons?.map((person) => (
                              <SelectItem key={person.id} value={person.id.toString()}>
                                {person.name} ({person.handle})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-priority">
                              <SelectValue />
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
                        <FormLabel>Due Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-due-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="milestone"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Milestone</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Q1 2025, MVP Launch" {...field} data-testid="input-milestone" />
                        </FormControl>
                        <FormDescription>Optional milestone or sprint name</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {editingItem && (
                  <div className="pt-6 border-t">
                    <FilesPanel workItemId={editingItem.id} />
                  </div>
                )}

                <div className="flex justify-end gap-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setShowForm(false);
                      setEditingItem(null);
                      form.reset();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending || updateMutation.isPending} 
                    data-testid="button-submit"
                  >
                    {editingItem 
                      ? (updateMutation.isPending ? "Updating..." : "Update Work Item")
                      : (createMutation.isPending ? "Creating..." : "Create Work Item")
                    }
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* Work Items List */}
      {isLoadingItems ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <article key={i} className="role-card">
              <div className="rail pod-rail intake h-1.5" />
              <div className="inner">
                <Skeleton className="h-6 w-64 mb-3" />
                <Skeleton className="h-4 w-96 mb-4" />
              </div>
            </article>
          ))}
        </div>
      ) : workItems && workItems.length > 0 ? (
        <div className="space-y-4">
          {workItems.map((item) => (
            <article 
              key={item.id} 
              className="role-card hover-elevate cursor-pointer" 
              onClick={() => handleViewItem(item)}
              data-testid={`work-item-${item.id}`}
            >
              {/* Teal rail at top (Intake & Routing pod color) */}
              <div className="rail pod-rail intake h-1.5" />
              
              <div className="inner grid gap-3">
                {/* Icon badge + Title + Status badges */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    {/* Icon badge */}
                    <span className="icon-badge">
                      <Inbox className="h-4 w-4 text-brand-teal" />
                    </span>
                    
                    {/* Title */}
                    <h2 className="text-lg md:text-xl font-grotesk text-text-primary">
                      {item.title}
                    </h2>
                  </div>
                  
                  {/* Status badges */}
                  <div className="flex items-center gap-2">
                    <StatusBadge status={item.status} />
                    {item.priority && <StatusBadge status={item.priority} />}
                  </div>
                </div>

                {/* Description */}
                {item.description && (
                  <p className="text-text-secondary text-sm leading-relaxed">
                    {item.description}
                  </p>
                )}

                {/* Meta row: Milestone + Due Date */}
                <div className="flex flex-wrap gap-2">
                  {item.milestone && (
                    <span className="chip">
                      Milestone: {item.milestone}
                    </span>
                  )}
                  {item.dueDate && (
                    <span className="chip">
                      <Calendar className="h-3 w-3 inline mr-1" />
                      Due {format(new Date(item.dueDate), 'MMM d, yyyy')}
                    </span>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <article className="role-card">
          <div className="rail pod-rail intake h-1.5" />
          <div className="inner py-12 text-center">
            <EmptyState
              icon={Inbox}
              title="No work items yet"
              description="Create your first work item to start tracking assignments and milestones"
              action={{
                label: "Create Work Item",
                onClick: () => setShowForm(true),
              }}
            />
          </div>
        </article>
      )}
    </div>
  );
}
