import { ReactNode } from "react";

interface BrandedSectionProps {
  children: ReactNode;
  className?: string;
}

export function BrandedSection({ children, className = '' }: BrandedSectionProps) {
  return (
    <div className={`section ${className}`}>
      {children}
    </div>
  );
}

interface BrandedGridProps {
  children: ReactNode;
  className?: string;
}

export function BrandedGrid({ children, className = '' }: BrandedGridProps) {
  return (
    <div className={`grid ${className}`}>
      {children}
    </div>
  );
}
