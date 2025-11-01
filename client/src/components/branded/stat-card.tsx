import { LucideIcon } from "lucide-react";
import { BrandedCard } from "./card";

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  variant?: 'default' | 'primary' | 'destructive';
  'data-testid'?: string;
}

export function StatCard({ title, value, icon: Icon, variant = 'default', 'data-testid': testId }: StatCardProps) {
  const valueColorClass = variant === 'primary' 
    ? 'text-primary' 
    : variant === 'destructive' 
    ? 'text-destructive' 
    : 'text-foreground';

  return (
    <BrandedCard data-testid={testId}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">{title}</span>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </div>
      <div className={`text-3xl font-semibold ${valueColorClass}`}>{value}</div>
    </BrandedCard>
  );
}
