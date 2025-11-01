import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BrandedCard, BrandedHero, BrandedSection, CardIcon, CardTitle, CardOneliner, StatCard, ListItem, PriorityBadge } from "@/components/branded";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { AlertCircle, CheckCircle2, Clock, Target, MessageSquare, Lightbulb, ClipboardCheck, Mic, History, MessageCircle } from "lucide-react";
import type { WorkItem } from "@shared/schema";
import { format } from "date-fns";
import { QuickStartDialog } from "@/components/quick-start-dialog";

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

type QuickStartAction = 'discussion' | 'brainstorm' | 'audit' | 'conversation' | 'previous' | 'chat' | null;

export default function ControlTower() {
  const [selectedAction, setSelectedAction] = useState<QuickStartAction>(null);
  
  const { data, isLoading } = useQuery<ControlTowerData>({
    queryKey: ['/api/control/dashboard'],
  });

  const quickStartActions = [
    {
      id: 'discussion' as const,
      title: 'New Discussion',
      description: 'Start a new discussion',
      icon: MessageSquare,
    },
    {
      id: 'brainstorm' as const,
      title: 'New Brainstorm',
      description: 'Launch brainstorm session',
      icon: Lightbulb,
    },
    {
      id: 'audit' as const,
      title: 'Conduct an Audit',
      description: 'Run compliance checklist',
      icon: ClipboardCheck,
    },
    {
      id: 'conversation' as const,
      title: 'Start a Conversation',
      description: 'Begin verbal discussion',
      icon: Mic,
    },
    {
      id: 'previous' as const,
      title: 'Continue Previous',
      description: 'Resume past activity',
      icon: History,
    },
    {
      id: 'chat' as const,
      title: 'Quick Chat',
      description: 'Quick messaging',
      icon: MessageCircle,
    },
  ];

  if (isLoading) {
    return (
      <BrandedSection>
        <BrandedHero
          title="Dream Team Hub by i³ collective"
          subtitle="Live priorities, assignments, and escalations"
        />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <BrandedCard key={i}>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </BrandedCard>
          ))}
        </div>
      </BrandedSection>
    );
  }

  const stats = data?.stats || {
    totalWorkItems: 0,
    inProgress: 0,
    blocked: 0,
    dueThisWeek: 0,
  };

  return (
    <BrandedSection>
      <BrandedHero
        title="Dream Team Hub by i³ collective"
        subtitle="Live priorities, assignments, and escalations"
      />

      {/* Quick Start Section */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4 text-foreground">Quick Start</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {quickStartActions.map((action) => {
            const Icon = action.icon;
            return (
              <BrandedCard
                key={action.id}
                className="cursor-pointer"
                onClick={() => setSelectedAction(action.id)}
                podVariant="control"
                showRail
                data-testid={`quick-start-${action.id}`}
              >
                <div className="flex items-start gap-4">
                  <CardIcon>
                    <Icon />
                  </CardIcon>
                  <div className="flex-1 min-w-0">
                    <CardTitle>{action.title}</CardTitle>
                    <CardOneliner>{action.description}</CardOneliner>
                  </div>
                </div>
              </BrandedCard>
            );
          })}
        </div>
      </div>

      <QuickStartDialog
        action={selectedAction}
        open={selectedAction !== null}
        onOpenChange={(open: boolean) => !open && setSelectedAction(null)}
      />

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard
          title="Total Work Items"
          value={stats.totalWorkItems}
          icon={Target}
          data-testid="stat-total"
        />
        <StatCard
          title="In Progress"
          value={stats.inProgress}
          icon={Clock}
          variant="primary"
          data-testid="stat-in-progress"
        />
        <StatCard
          title="Blocked"
          value={stats.blocked}
          icon={AlertCircle}
          variant="destructive"
          data-testid="stat-blocked"
        />
        <StatCard
          title="Due This Week"
          value={stats.dueThisWeek}
          icon={CheckCircle2}
          data-testid="stat-due-week"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Top 5 Priorities */}
        <BrandedCard>
          <CardTitle className="mb-4">Top-5 Priorities</CardTitle>
          {data?.top5 && data.top5.length > 0 ? (
            <div className="space-y-3">
              {data.top5.map((item, index) => (
                <ListItem key={item.id} data-testid={`top5-item-${index}`}>
                  <div className="flex items-start gap-3">
                    <PriorityBadge rank={index + 1} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate text-foreground">{item.title}</div>
                      {item.dueDate && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Due {format(new Date(item.dueDate), 'MMM d')}
                        </div>
                      )}
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                </ListItem>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Target}
              title="No priorities yet"
              description="Top priority work items will appear here"
            />
          )}
        </BrandedCard>

        {/* Recent Assignments */}
        <BrandedCard>
          <CardTitle className="mb-4">Recent Assignments</CardTitle>
          {data?.assignments && data.assignments.length > 0 ? (
            <div className="space-y-3">
              {data.assignments.map((item) => (
                <ListItem key={item.id} data-testid={`assignment-${item.id}`}>
                  <div className="font-medium text-sm mb-2 text-foreground">{item.title}</div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={item.priority || 'medium'} />
                    <StatusBadge status={item.status} />
                  </div>
                </ListItem>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Clock}
              title="No assignments"
              description="Work item assignments will appear here"
            />
          )}
        </BrandedCard>

        {/* Escalations */}
        <BrandedCard>
          <CardTitle className="mb-4">Escalations</CardTitle>
          {data?.escalations && data.escalations.length > 0 ? (
            <div className="space-y-3">
              {data.escalations.map((item) => (
                <ListItem key={item.id} variant="alert" data-testid={`escalation-${item.id}`}>
                  <div className="flex items-start gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                    <div className="font-medium text-sm flex-1 text-foreground">{item.title}</div>
                  </div>
                  <StatusBadge status={item.status} />
                </ListItem>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={CheckCircle2}
              title="All clear"
              description="No escalated items at this time"
            />
          )}
        </BrandedCard>
      </div>
    </BrandedSection>
  );
}
