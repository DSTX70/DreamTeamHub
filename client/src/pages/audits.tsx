import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Shield, FileText, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Audit, Pod, Person } from "@shared/schema";
import { format } from "date-fns";

const auditTypeConfig: Record<string, { label: string; icon: any; description: string }> = {
  security_soc2: {
    label: 'Security/SOC2',
    icon: Shield,
    description: 'SOC2/ISO control spot-check, SBOM/license scan, incident readiness',
  },
  ip_readiness: {
    label: 'IP Readiness',
    icon: FileText,
    description: 'Claims ↔ feature map, figure legibility @66%, IDS/ADS stubs',
  },
  brand_lock: {
    label: 'Brand-Lock',
    icon: CheckCircle2,
    description: 'Palettes, typography, logo lockups, KDP/Shopify specs',
  },
  finance_ops: {
    label: 'Finance Ops',
    icon: AlertTriangle,
    description: 'CAC/COGS snapshot, budget variance, approvals',
  },
};

export default function Audits() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('');
  const [auditTitle, setAuditTitle] = useState('');
  const [auditDueDate, setAuditDueDate] = useState('');
  const [selectedPods, setSelectedPods] = useState<string[]>([]);
  const { toast } = useToast();

  const { data: audits, isLoading } = useQuery<Audit[]>({
    queryKey: ['/api/audits'],
  });

  const { data: pods } = useQuery<Pod[]>({
    queryKey: ['/api/pods'],
  });

  const createAuditMutation = useMutation({
    mutationFn: (data: { title: string; type: string; dueAt?: string; pods: string[] }) =>
      apiRequest('POST', '/api/audits', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/audits'] });
      setShowCreateDialog(false);
      setAuditTitle('');
      setSelectedType('');
      setAuditDueDate('');
      setSelectedPods([]);
      toast({
        title: 'Audit created',
        description: 'New audit has been created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create audit',
        variant: 'destructive',
      });
    },
  });

  const handleCreateAudit = () => {
    if (!auditTitle || !selectedType) {
      toast({
        title: 'Missing fields',
        description: 'Please provide a title and select an audit type',
        variant: 'destructive',
      });
      return;
    }

    createAuditMutation.mutate({
      title: auditTitle,
      type: selectedType,
      dueAt: auditDueDate || undefined,
      pods: selectedPods,
    });
  };

  const openCreateDialog = (type?: string) => {
    if (type) {
      setSelectedType(type);
      setAuditTitle(auditTypeConfig[type]?.label || '');
    }
    setShowCreateDialog(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-2" data-testid="page-title">Audit Engine</h1>
          <p className="text-sm text-muted-foreground">Cross-pod checklists with evidence capture and audit packs</p>
        </div>
        <Button onClick={() => openCreateDialog()} data-testid="button-create-audit">
          <Plus className="h-4 w-4 mr-2" />
          New Audit
        </Button>
      </div>

      {/* Create Audit Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent data-testid="dialog-create-audit">
          <DialogHeader>
            <DialogTitle>Create New Audit</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="audit-title">Audit Title</Label>
              <Input
                id="audit-title"
                data-testid="input-audit-title"
                value={auditTitle}
                onChange={(e) => setAuditTitle(e.target.value)}
                placeholder="e.g., Q1 Security Review"
              />
            </div>
            <div>
              <Label htmlFor="audit-type">Audit Type</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger id="audit-type" data-testid="select-audit-type">
                  <SelectValue placeholder="Select audit type..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(auditTypeConfig).map(([type, config]) => (
                    <SelectItem key={type} value={type} data-testid={`option-audit-type-${type}`}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="audit-due">Due Date (Optional)</Label>
              <Input
                id="audit-due"
                type="date"
                data-testid="input-audit-due"
                value={auditDueDate}
                onChange={(e) => setAuditDueDate(e.target.value)}
              />
            </div>
            <Button
              onClick={handleCreateAudit}
              disabled={!auditTitle || !selectedType || createAuditMutation.isPending}
              className="w-full"
              data-testid="button-submit-audit"
            >
              {createAuditMutation.isPending ? 'Creating...' : 'Create Audit'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Audit Type Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Object.entries(auditTypeConfig).map(([type, config]) => {
          const Icon = config.icon;
          // Map audit types to pod colors
          const podClass = type === 'security_soc2' ? 'security' 
            : type === 'ip_readiness' ? 'ip'
            : type === 'brand_lock' ? 'brand'
            : 'finance';
          
          return (
            <article 
              key={type} 
              className="role-card cursor-pointer hover-elevate active-elevate-2"
              onClick={() => openCreateDialog(type)}
              data-testid={`card-audit-template-${type}`}
            >
              {/* Pod-specific colored rail */}
              <div className={`rail pod-rail ${podClass} h-1.5`} />
              <div className="inner">
                <h3 className="text-sm font-grotesk text-text-primary mb-2">{config.label}</h3>
                <p className="text-xs text-text-secondary">{config.description}</p>
              </div>
            </article>
          );
        })}
      </div>

      {/* Audits List */}
      {isLoading ? (
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
      ) : audits && audits.length > 0 ? (
        <div className="space-y-4">
          {audits.map((audit) => {
            const typeConfig = auditTypeConfig[audit.type];
            const TypeIcon = typeConfig?.icon || Shield;
            
            return (
              <Card key={audit.id} className="hover-elevate" data-testid={`audit-${audit.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                          <TypeIcon className="h-4 w-4 text-primary" />
                        </div>
                        <CardTitle className="text-lg">{audit.title}</CardTitle>
                        <StatusBadge status={audit.status} />
                      </div>
                      {typeConfig && (
                        <CardDescription className="text-sm">{typeConfig.label}</CardDescription>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.location.href = `/audits/${audit.id}`}
                        data-testid={`button-view-audit-${audit.id}`}
                      >
                        View Audit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.location.href = `/audits/${audit.id}/export`}
                        data-testid={`button-export-audit-${audit.id}`}
                      >
                        Export Pack
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    {audit.pods && audit.pods.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Pods:</span>
                        <div className="flex flex-wrap gap-1">
                          {audit.pods.map((pod, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {pod}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {audit.dueAt && (
                      <div>
                        Due {format(new Date(audit.dueAt), 'MMM d, yyyy')}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={Shield}
              title="No audits yet"
              description="Create your first audit to start compliance checking across pods"
              action={{
                label: "Start New Audit",
                onClick: () => openCreateDialog(),
              }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
