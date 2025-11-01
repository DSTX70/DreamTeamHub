import { ReactNode } from "react";

interface BrandedBadgeProps {
  children: ReactNode;
  className?: string;
  'data-testid'?: string;
}

export function BrandedBadge({ children, className = '', 'data-testid': testId }: BrandedBadgeProps) {
  return (
    <span className={`chip ${className}`} data-testid={testId}>
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
