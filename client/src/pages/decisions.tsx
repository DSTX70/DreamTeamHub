import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { Plus, FileText, Calendar } from "lucide-react";
import type { Decision } from "@shared/schema";
import { format } from "date-fns";
import { getPodRailClass } from "@/lib/pod-utils";

// Map pod IDs to pod names and colors
const getPodChipClass = (podId: number): string => {
  const podMap: Record<number, string> = {
    1: "chip-pod-control",
    2: "chip-pod-product",
    3: "chip-pod-marketing",
    4: "chip-pod-finance",
    5: "chip-pod-brand",
    6: "chip-pod-ip",
    7: "chip-pod-security",
  };
  return podMap[podId] || "chip-pod-control";
};

export default function Decisions() {
  const { data: decisions, isLoading } = useQuery<Decision[]>({
    queryKey: ['/api/decisions'],
  });

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
          className="bg-brand-teal hover:bg-brand-teal/90 text-white border-0"
          data-testid="button-log-decision"
        >
          <Plus className="h-4 w-4 mr-2" />
          Log Decision
        </Button>
      </header>

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
          {decisions.map((decision) => (
            <article 
              key={decision.id} 
              className="role-card"
              data-testid={`decision-${decision.id}`}
            >
              {/* Blue rail at top */}
              <div className="rail pod-rail control h-1.5" />
              
              <div className="inner grid gap-3">
                {/* Icon badge + Title + Status pill */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {/* Icon badge */}
                    <span className="icon-badge">
                      <FileText className="h-4 w-4 text-brand-teal" />
                    </span>
                    
                    {/* Title */}
                    <h2 className="text-lg md:text-xl font-grotesk text-text-primary">
                      {decision.summary}
                    </h2>
                  </div>
                  
                  {/* Status pill */}
                  <span className={`status-pill ${decision.status === 'active' ? 'active' : decision.status === 'pending' ? 'pending' : 'archived'}`}>
                    {decision.status.charAt(0).toUpperCase() + decision.status.slice(1)}
                  </span>
                </div>

                {/* Rationale */}
                <p className="text-text-secondary text-sm leading-relaxed">
                  {decision.rationale}
                </p>

                {/* Meta row: Approver + Date */}
                <div className="flex flex-wrap gap-2">
                  <span className="chip">
                    Approved by: {decision.approver}
                  </span>
                  <span className="chip">
                    <Calendar className="h-3 w-3 inline mr-1" />
                    {format(new Date(decision.effectiveAt), 'MMM d, yyyy')}
                  </span>
                </div>

                {/* Related Pods (pod-tinted chips) */}
                {decision.podIds && decision.podIds.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {decision.podIds.map((podId, idx) => (
                      <span 
                        key={idx} 
                        className={`chip ${getPodChipClass(podId)}`}
                      >
                        Pod #{podId}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <article className="role-card">
          <div className="rail pod-rail control h-1.5" />
          <div className="inner py-12 text-center">
            <EmptyState
              icon={FileText}
              title="No decisions logged yet"
              description="Start documenting key decisions with approvers, rationale, and supporting artifacts"
              action={{
                label: "Log First Decision",
                onClick: () => {},
              }}
            />
          </div>
        </article>
      )}
    </div>
  );
}
