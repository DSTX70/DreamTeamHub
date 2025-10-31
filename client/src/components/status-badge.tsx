import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  // Work Item Status
  todo: { label: 'To Do', variant: 'secondary' },
  in_progress: { label: 'In Progress', variant: 'default' },
  blocked: { label: 'Blocked', variant: 'destructive' },
  done: { label: 'Done', variant: 'outline' },
  
  // Priority
  low: { label: 'Low', variant: 'secondary' },
  medium: { label: 'Medium', variant: 'default' },
  high: { label: 'High', variant: 'destructive' },
  critical: { label: 'Critical', variant: 'destructive' },
  
  // Brainstorm Session
  planning: { label: 'Planning', variant: 'secondary' },
  diverging: { label: 'Diverging', variant: 'default' },
  clustering: { label: 'Clustering', variant: 'default' },
  scoring: { label: 'Scoring', variant: 'default' },
  committed: { label: 'Committed', variant: 'outline' },
  
  // Brainstorm Ideas
  active: { label: 'Active', variant: 'default' },
  merged: { label: 'Merged', variant: 'secondary' },
  discarded: { label: 'Discarded', variant: 'outline' },
  
  // Audit Status
  review: { label: 'Review', variant: 'default' },
  completed: { label: 'Completed', variant: 'outline' },
  
  // Audit Check Status
  pending: { label: 'Pending', variant: 'secondary' },
  passed: { label: 'Passed', variant: 'outline' },
  failed: { label: 'Failed', variant: 'destructive' },
  na: { label: 'N/A', variant: 'secondary' },
  
  // Decision Status
  superseded: { label: 'Superseded', variant: 'secondary' },
  archived: { label: 'Archived', variant: 'outline' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, variant: 'secondary' as const };
  
  return (
    <Badge variant={config.variant} className={cn("text-xs font-medium", className)} data-testid={`badge-${status}`}>
      {config.label}
    </Badge>
  );
}
