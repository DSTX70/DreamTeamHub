import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/status-badge";
import { FilesPanel } from "@/components/FilesPanel";
import { WorkItemActionsPanel } from "@/components/workItems/WorkItemActionsPanel";
import { WorkItemPacksPanel } from "@/components/workItems/WorkItemPacksPanel";
import { ArrowLeft, Calendar, User, Target } from "lucide-react";
import { format } from "date-fns";
import type { WorkItem } from "@shared/schema";

export default function WorkItemDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const workItemId = parseInt(id || "0", 10);

  const { data: workItem, isLoading, error } = useQuery<WorkItem>({
    queryKey: ['/api/work-items', workItemId],
    enabled: workItemId > 0,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !workItem) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation('/intake')}
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-semibold">Work Item Not Found</h1>
        </div>
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            This work item does not exist or you don't have permission to view it.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="work-item-detail-page">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation('/intake')}
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-semibold mb-2" data-testid="text-title">
                {workItem.title}
              </h1>
              <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge status={workItem.status} />
                {workItem.priority && <StatusBadge status={workItem.priority} />}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {workItem.description && (
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap"
                  data-testid="text-description"
                >
                  {workItem.description}
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Actions Panel */}
          <Card>
            <CardHeader>
              <CardTitle>AI Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <WorkItemActionsPanel workItemId={workItem.id} />
            </CardContent>
          </Card>

          {/* Work Item Packs Viewer */}
          <WorkItemPacksPanel workItemId={workItem.id} />

          {/* Files */}
          {workItem.workOrderId && (
            <Card>
              <CardHeader>
                <CardTitle>Files</CardTitle>
              </CardHeader>
              <CardContent>
                <FilesPanel
                  workItemId={workItem.id}
                  workOrderId={workItem.workOrderId}
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Metadata */}
        <div className="space-y-6">
          {/* Metadata Card */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {workItem.ownerId && (
                <div className="flex items-start gap-3">
                  <User className="h-4 w-4 text-muted-foreground mt-1" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-muted-foreground mb-1">Owner</div>
                    <div className="text-sm font-medium" data-testid="text-owner">
                      Owner ID: {workItem.ownerId}
                    </div>
                  </div>
                </div>
              )}

              {workItem.podId && (
                <div className="flex items-start gap-3">
                  <Target className="h-4 w-4 text-muted-foreground mt-1" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-muted-foreground mb-1">Pod</div>
                    <div className="text-sm font-medium" data-testid="text-pod">
                      {workItem.podId}
                    </div>
                  </div>
                </div>
              )}

              {workItem.dueDate && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground mt-1" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-muted-foreground mb-1">Due Date</div>
                    <div className="text-sm font-medium" data-testid="text-due-date">
                      {format(new Date(workItem.dueDate), 'MMM d, yyyy')}
                    </div>
                  </div>
                </div>
              )}

              {workItem.milestone && (
                <div className="flex items-start gap-3">
                  <Target className="h-4 w-4 text-muted-foreground mt-1" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-muted-foreground mb-1">Milestone</div>
                    <div className="text-sm font-medium" data-testid="text-milestone">
                      {workItem.milestone}
                    </div>
                  </div>
                </div>
              )}

              {workItem.workOrderId && (
                <div className="flex items-start gap-3">
                  <Target className="h-4 w-4 text-muted-foreground mt-1" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-muted-foreground mb-1">Work Order</div>
                    <div className="text-sm font-medium" data-testid="text-work-order">
                      {workItem.workOrderId}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
