import { ReactNode } from "react";

interface PriorityBadgeProps {
  rank: number;
  className?: string;
}

export function PriorityBadge({ rank, className = '' }: PriorityBadgeProps) {
  return (
    <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground ${className}`}>
      {rank}
    </div>
  );
}
