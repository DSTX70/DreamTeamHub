import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
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

  const onSubmit = (data: z.infer<typeof workItemSchema>) => {
    createMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-2" data-testid="page-title">Intake & Routing</h1>
          <p className="text-sm text-muted-foreground">Create and manage work items with pod assignments and milestones</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} data-testid="button-create-work-item">
          <Plus className="h-4 w-4 mr-2" />
          {showForm ? "Cancel" : "Create Work Item"}
        </Button>
      </div>

      {/* Create Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>New Work Item</CardTitle>
            <CardDescription>Add a new work item to the intake queue</CardDescription>
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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

                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit">
                    {createMutation.isPending ? "Creating..." : "Create Work Item"}
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
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-64" />
                <Skeleton className="h-4 w-96 mt-2" />
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : workItems && workItems.length > 0 ? (
        <div className="space-y-4">
          {workItems.map((item) => (
            <Card key={item.id} className="hover-elevate" data-testid={`work-item-${item.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                      <StatusBadge status={item.status} />
                      {item.priority && <StatusBadge status={item.priority} />}
                    </div>
                    {item.description && (
                      <CardDescription className="text-sm">{item.description}</CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  {item.milestone && (
                    <div>
                      <span className="font-medium">Milestone:</span> {item.milestone}
                    </div>
                  )}
                  {item.dueDate && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Due {format(new Date(item.dueDate), 'MMM d, yyyy')}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={Inbox}
              title="No work items yet"
              description="Create your first work item to start tracking assignments and milestones"
              action={{
                label: "Create Work Item",
                onClick: () => setShowForm(true),
              }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
