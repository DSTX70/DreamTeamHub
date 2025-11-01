import { ReactNode } from "react";

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'muted';

interface BrandedBadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
  'data-testid'?: string;
}

export function BrandedBadge({ children, variant = 'default', className = '', 'data-testid': testId }: BrandedBadgeProps) {
  const variantClass = variant === 'default' ? '' : `chip--${variant}`;
  
  return (
    <span className={`chip ${variantClass} ${className}`.trim()} data-testid={testId}>
      {children}
    </span>
  );
}

interface BrandedBadgesProps {
  children: ReactNode;
  className?: string;
}

export function BrandedBadges({ children, className = '' }: BrandedBadgesProps) {
  return (
    <div className={`chips ${className}`}>
      {children}
    </div>
  );
}
