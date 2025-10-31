import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { AlertCircle, CheckCircle2, Clock, Target } from "lucide-react";
import type { WorkItem } from "@shared/schema";
import { format } from "date-fns";

interface ControlTowerData {
  top5: WorkItem[];
  assignments: WorkItem[];
  escalations: WorkItem[];
  stats: {
    totalWorkItems: number;
    inProgress: number;
    blocked: number;
    dueThisWeek: number;
  };
}

export default function ControlTower() {
  const { data, isLoading } = useQuery<ControlTowerData>({
    queryKey: ['/api/control/dashboard'],
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Control Tower</h1>
          <p className="text-sm text-muted-foreground">Live priorities, assignments, and escalations</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const stats = data?.stats || {
    totalWorkItems: 0,
    inProgress: 0,
    blocked: 0,
    dueThisWeek: 0,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-2" data-testid="page-title">Control Tower</h1>
        <p className="text-sm text-muted-foreground">Live priorities, assignments, and escalations</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Work Items</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold" data-testid="stat-total">{stats.totalWorkItems}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-primary" data-testid="stat-in-progress">{stats.inProgress}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-destructive" data-testid="stat-blocked">{stats.blocked}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due This Week</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold" data-testid="stat-due-week">{stats.dueThisWeek}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Top 5 Priorities */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top-5 Priorities</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.top5 && data.top5.length > 0 ? (
              <div className="space-y-3">
                {data.top5.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 rounded-lg border p-3 hover-elevate"
                    data-testid={`top5-item-${index}`}
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{item.title}</div>
                      {item.dueDate && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Due {format(new Date(item.dueDate), 'MMM d')}
                        </div>
                      )}
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Target}
                title="No priorities yet"
                description="Top priority work items will appear here"
              />
            )}
          </CardContent>
        </Card>

        {/* Recent Assignments */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.assignments && data.assignments.length > 0 ? (
              <div className="space-y-3">
                {data.assignments.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border p-3 hover-elevate"
                    data-testid={`assignment-${item.id}`}
                  >
                    <div className="font-medium text-sm mb-2">{item.title}</div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={item.priority || 'medium'} />
                      <StatusBadge status={item.status} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Clock}
                title="No assignments"
                description="Work item assignments will appear here"
              />
            )}
          </CardContent>
        </Card>

        {/* Escalations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Escalations</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.escalations && data.escalations.length > 0 ? (
              <div className="space-y-3">
                {data.escalations.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-destructive/50 bg-destructive/5 p-3"
                    data-testid={`escalation-${item.id}`}
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                      <div className="font-medium text-sm flex-1">{item.title}</div>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={CheckCircle2}
                title="All clear"
                description="No escalated items at this time"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
