import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus, FileText, Calendar } from "lucide-react";
import { BrandedBadge } from "@/components/branded";
import { StatusBadge } from "@/components/status-badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Decision, Pod } from "@shared/schema";
import { format } from "date-fns";
import { getPodRailClass } from "@/lib/pod-utils";

const decisionSchema = z.object({
  summary: z.string().min(1, "Summary is required"),
  rationale: z.string().min(1, "Rationale is required"),
  approver: z.string().min(1, "Approver is required"),
  effectiveAt: z.string(),
  status: z.string().default('active'),
  links: z.array(z.string()).default([]),
  podIds: z.array(z.coerce.number()).default([]),
  workItemIds: z.array(z.coerce.number()).default([]),
});

export default function Decisions() {
  const [showForm, setShowForm] = useState(false);
  const [editingDecision, setEditingDecision] = useState<Decision | null>(null);
  const { toast } = useToast();

  const { data: decisions, isLoading } = useQuery<Decision[]>({
    queryKey: ['/api/decisions'],
  });

  const { data: pods } = useQuery<Pod[]>({
    queryKey: ['/api/pods'],
  });

  const form = useForm<z.infer<typeof decisionSchema>>({
    resolver: zodResolver(decisionSchema),
    defaultValues: {
      summary: "",
      rationale: "",
      approver: "",
      effectiveAt: new Date().toISOString().split('T')[0],
      status: "active",
      links: [],
      podIds: [],
      workItemIds: [],
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: z.infer<typeof decisionSchema>) => 
      apiRequest('POST', '/api/decisions', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/decisions'] });
      toast({
        title: "Decision logged",
        description: "The decision has been added to the log",
      });
      form.reset();
      setShowForm(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to log decision",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: number; updates: z.infer<typeof decisionSchema> }) => 
      apiRequest('PUT', `/api/decisions/${data.id}`, data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/decisions'] });
      toast({
        title: "Decision updated",
        description: "The decision has been updated successfully",
      });
      form.reset();
      setEditingDecision(null);
      setShowForm(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update decision",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof decisionSchema>) => {
    if (editingDecision) {
      updateMutation.mutate({ id: editingDecision.id, updates: data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEditDecision = (decision: Decision) => {
    setEditingDecision(decision);
    setShowForm(true);
    
    // Parse the effectiveAt date properly - it's already an ISO string from backend
    const effectiveDate = typeof decision.effectiveAt === 'string' 
      ? decision.effectiveAt 
      : decision.effectiveAt instanceof Date 
        ? decision.effectiveAt.toISOString() 
        : new Date().toISOString();
    
    form.reset({
      summary: decision.summary,
      rationale: decision.rationale,
      approver: decision.approver,
      effectiveAt: effectiveDate.split('T')[0],
      status: decision.status,
      links: decision.links || [],
      podIds: decision.podIds || [],
      workItemIds: decision.workItemIds || [],
    });
  };

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-grotesk text-text-primary mb-1" data-testid="page-title">
            Decision Log
          </h1>
          <p className="text-sm text-text-secondary">
            Immutable decision tracking with approver, rationale, and artifacts.
          </p>
        </div>
        <Button 
          variant="default"
          onClick={() => {
            if (showForm) {
              setShowForm(false);
              setEditingDecision(null);
              form.reset();
            } else {
              setEditingDecision(null);
              form.reset({
                summary: "",
                rationale: "",
                approver: "",
                effectiveAt: new Date().toISOString().split('T')[0],
                status: "active",
                links: [],
                podIds: [],
                workItemIds: [],
              });
              setShowForm(true);
            }
          }}
          data-testid="button-log-decision"
        >
          <Plus className="h-4 w-4 mr-2" />
          {showForm ? "Cancel" : "Log Decision"}
        </Button>
      </header>

      {/* Create/Edit Form */}
      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{editingDecision ? "Edit Decision" : "Log New Decision"}</CardTitle>
            <CardDescription>
              {editingDecision ? "Update the decision details" : "Document a key decision with approver and rationale"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="summary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Summary</FormLabel>
                      <FormControl>
                        <Input placeholder="Brief decision summary" {...field} data-testid="input-summary" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="rationale"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rationale</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Why was this decision made?" 
                          className="min-h-24 resize-none"
                          {...field} 
                          data-testid="input-rationale"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="approver"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Approver</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., OS (Orchestrator)" {...field} data-testid="input-approver" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="effectiveAt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Effective Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-effective-date" />
                        </FormControl>
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
                            <SelectTrigger data-testid="select-status">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="superseded">Superseded</SelectItem>
                            <SelectItem value="archived">Archived</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setShowForm(false);
                      setEditingDecision(null);
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
                    {editingDecision 
                      ? (updateMutation.isPending ? "Updating..." : "Update Decision")
                      : (createMutation.isPending ? "Logging..." : "Log Decision")
                    }
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* Decision Cards */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <article key={i} className="role-card">
              <div className="rail pod-rail control h-1.5" />
              <div className="inner">
                <Skeleton className="h-6 w-96 mb-3" />
                <Skeleton className="h-4 w-full mb-4" />
                <Skeleton className="h-8 w-64" />
              </div>
            </article>
          ))}
        </div>
      ) : decisions && decisions.length > 0 ? (
        <div className="space-y-4">
          {decisions.map((decision) => {
            const relatedPods = decision.podIds 
              ? decision.podIds.map(id => pods?.find(p => p.id === id)).filter(Boolean) 
              : [];

            return (
              <article 
                key={decision.id} 
                className="role-card hover-elevate cursor-pointer"
                onClick={() => handleEditDecision(decision)}
                data-testid={`decision-${decision.id}`}
              >
                {/* Yellow rail at top (Decision Log pod color) */}
                <div className="rail pod-rail decision h-1.5" />
                
                <div className="inner grid gap-3">
                  {/* Icon badge + Title + Status badge */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      {/* Icon badge */}
                      <span className="icon-badge">
                        <FileText className="h-4 w-4 text-brand-teal" />
                      </span>
                      
                      {/* Title */}
                      <h2 className="text-lg md:text-xl font-grotesk text-text-primary">
                        {decision.summary}
                      </h2>
                    </div>
                    
                    {/* Status badge */}
                    <StatusBadge status={decision.status} />
                  </div>

                  {/* Rationale */}
                  <p className="text-text-secondary text-sm leading-relaxed">
                    {decision.rationale}
                  </p>

                  {/* Meta row: Approver + Date */}
                  <div className="flex flex-wrap gap-2">
                    <BrandedBadge variant="muted">
                      Approved by: {decision.approver}
                    </BrandedBadge>
                    <BrandedBadge variant="muted">
                      <Calendar className="h-3 w-3 inline mr-1" />
                      {format(new Date(decision.effectiveAt), 'MMM d, yyyy')}
                    </BrandedBadge>
                  </div>

                  {/* Related Pods */}
                  {relatedPods.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {relatedPods.map((pod) => (
                        <BrandedBadge key={pod!.id} variant="default">
                          {pod!.name}
                        </BrandedBadge>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <article className="role-card">
          <div className="rail pod-rail decision h-1.5" />
          <div className="inner py-12 text-center">
            <EmptyState
              icon={FileText}
              title="No decisions logged yet"
              description="Start documenting key decisions with approvers, rationale, and supporting artifacts"
              action={{
                label: "Log First Decision",
                onClick: () => {
                  setEditingDecision(null);
                  form.reset({
                    summary: "",
                    rationale: "",
                    approver: "",
                    effectiveAt: new Date().toISOString().split('T')[0],
                    status: "active",
                    links: [],
                    podIds: [],
                    workItemIds: [],
                  });
                  setShowForm(true);
                },
              }}
            />
          </div>
        </article>
      )}
    </div>
  );
}
