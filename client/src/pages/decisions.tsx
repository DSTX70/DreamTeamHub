import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { Plus, FileText, Link as LinkIcon, Calendar } from "lucide-react";
import type { Decision } from "@shared/schema";
import { format } from "date-fns";

export default function Decisions() {
  const { data: decisions, isLoading } = useQuery<Decision[]>({
    queryKey: ['/api/decisions'],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-2" data-testid="page-title">Decision Log</h1>
          <p className="text-sm text-muted-foreground">Immutable decision tracking with approver, rationale, and artifacts</p>
        </div>
        <Button data-testid="button-log-decision">
          <Plus className="h-4 w-4 mr-2" />
          Log Decision
        </Button>
      </div>

      {/* Timeline */}
      {isLoading ? (
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-6">
              <div className="flex flex-col items-center">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="w-px flex-1 bg-border mt-2" />
              </div>
              <Card className="flex-1">
                <CardHeader>
                  <Skeleton className="h-6 w-96" />
                  <Skeleton className="h-4 w-full mt-2" />
                </CardHeader>
              </Card>
            </div>
          ))}
        </div>
      ) : decisions && decisions.length > 0 ? (
        <div className="space-y-6">
          {decisions.map((decision, index) => (
            <div key={decision.id} className="flex gap-6" data-testid={`decision-${decision.id}`}>
              {/* Timeline Indicator */}
              <div className="flex flex-col items-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary bg-background">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                {index < (decisions.length - 1) && (
                  <div className="w-px flex-1 bg-border mt-2" />
                )}
              </div>

              {/* Decision Card */}
              <Card className="flex-1 hover-elevate">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-lg">{decision.summary}</CardTitle>
                        <StatusBadge status={decision.status} />
                      </div>
                      <CardDescription className="text-sm whitespace-pre-wrap">
                        {decision.rationale}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="shrink-0">
                      <Calendar className="h-3 w-3 mr-1" />
                      {format(new Date(decision.effectiveAt), 'MMM d, yyyy')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Approver */}
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-muted-foreground">Approved by:</span>
                      <Badge variant="secondary">{decision.approver}</Badge>
                    </div>

                    {/* Links */}
                    {decision.links && decision.links.length > 0 && (
                      <div>
                        <div className="text-sm font-medium text-muted-foreground mb-2">Artifacts & Links</div>
                        <div className="flex flex-wrap gap-2">
                          {decision.links.map((link, idx) => (
                            <Button
                              key={idx}
                              variant="outline"
                              size="sm"
                              className="h-auto py-1 px-2"
                              asChild
                            >
                              <a href={link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                                <LinkIcon className="h-3 w-3" />
                                <span className="text-xs truncate max-w-[200px]">{link}</span>
                              </a>
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Pod IDs */}
                    {decision.podIds && decision.podIds.length > 0 && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-muted-foreground">Related Pods:</span>
                        <div className="flex flex-wrap gap-1">
                          {decision.podIds.map((podId, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              Pod #{podId}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={FileText}
              title="No decisions logged yet"
              description="Start documenting key decisions with approvers, rationale, and supporting artifacts"
              action={{
                label: "Log First Decision",
                onClick: () => {},
              }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
