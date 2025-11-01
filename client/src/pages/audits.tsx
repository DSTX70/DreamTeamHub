import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { Plus, Shield, FileText, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { Audit } from "@shared/schema";
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
  const { data: audits, isLoading } = useQuery<Audit[]>({
    queryKey: ['/api/audits'],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-2" data-testid="page-title">Audit Engine</h1>
          <p className="text-sm text-muted-foreground">Cross-pod checklists with evidence capture and audit packs</p>
        </div>
        <Button data-testid="button-create-audit">
          <Plus className="h-4 w-4 mr-2" />
          New Audit
        </Button>
      </div>

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
            <article key={type} className="role-card cursor-pointer hover-elevate">
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
                      <Button variant="outline" size="sm">
                        View Audit
                      </Button>
                      <Button variant="outline" size="sm">
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
                onClick: () => {},
              }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
