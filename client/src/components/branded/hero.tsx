import { ReactNode } from "react";

interface BrandedHeroProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}

export function BrandedHero({ title, subtitle, actions, className = '' }: BrandedHeroProps) {
  return (
    <div className={`hero ${className}`}>
      <h1 className="h1 font-grotesk bg-grad-orchestra bg-clip-text text-transparent">{title}</h1>
      {subtitle && <p className="sub text-text-secondary">{subtitle}</p>}
      {actions && <div className="hero-actions">{actions}</div>}
    </div>
  );
}
