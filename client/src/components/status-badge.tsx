import { BrandedBadge } from "@/components/branded";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

type BrandedBadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'muted';

const statusConfig: Record<string, { label: string; variant: BrandedBadgeVariant }> = {
  // Work Item Status
  todo: { label: 'To Do', variant: 'muted' },
  in_progress: { label: 'In Progress', variant: 'primary' },
  blocked: { label: 'Blocked', variant: 'danger' },
  done: { label: 'Done', variant: 'success' },
  
  // Priority
  low: { label: 'Low', variant: 'muted' },
  medium: { label: 'Medium', variant: 'default' },
  high: { label: 'High', variant: 'warning' },
  critical: { label: 'Critical', variant: 'danger' },
  
  // Brainstorm Session
  planning: { label: 'Planning', variant: 'muted' },
  diverging: { label: 'Diverging', variant: 'primary' },
  clustering: { label: 'Clustering', variant: 'primary' },
  scoring: { label: 'Scoring', variant: 'primary' },
  committed: { label: 'Committed', variant: 'success' },
  
  // Brainstorm Ideas
  active: { label: 'Active', variant: 'primary' },
  merged: { label: 'Merged', variant: 'muted' },
  discarded: { label: 'Discarded', variant: 'muted' },
  
  // Audit Status
  review: { label: 'Review', variant: 'primary' },
  completed: { label: 'Completed', variant: 'success' },
  
  // Audit Check Status
  pending: { label: 'Pending', variant: 'muted' },
  passed: { label: 'Passed', variant: 'success' },
  failed: { label: 'Failed', variant: 'danger' },
  na: { label: 'N/A', variant: 'muted' },
  
  // Decision Status
  superseded: { label: 'Superseded', variant: 'muted' },
  archived: { label: 'Archived', variant: 'muted' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, variant: 'muted' as const };
  
  return (
    <BrandedBadge variant={config.variant} className={className} data-testid={`badge-${status}`}>
      {config.label}
    </BrandedBadge>
  );
}
