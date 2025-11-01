import { ReactNode } from "react";

interface ListItemProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'alert';
  'data-testid'?: string;
}

export function ListItem({ children, className = '', variant = 'default', 'data-testid': testId }: ListItemProps) {
  const variantClasses = variant === 'alert'
    ? 'border-destructive/50 bg-destructive/5'
    : 'border-border bg-background/20';

  return (
    <div 
      className={`rounded-lg border p-3 ${variantClasses} ${className}`}
      data-testid={testId}
    >
      {children}
    </div>
  );
}
