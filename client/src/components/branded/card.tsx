import { ReactNode } from "react";

interface BrandedCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  podVariant?: 'marketing' | 'ip' | 'product' | 'security' | 'brand' | 'finance' | 'control';
  showRail?: boolean;
  'data-testid'?: string;
}

export function BrandedCard({ 
  children, 
  className = '', 
  onClick, 
  podVariant,
  showRail = false,
  'data-testid': testId 
}: BrandedCardProps) {
  const podClass = podVariant ? `pod-${podVariant}` : '';
  const cursorClass = onClick ? 'cursor-pointer' : '';
  
  return (
    <div 
      className={`card ${podClass} ${cursorClass} ${className}`}
      onClick={onClick}
      data-testid={testId}
    >
      {showRail && <div className="rail" />}
      <div className="inner">
        {children}
      </div>
    </div>
  );
}

interface CardIconProps {
  children: ReactNode;
  className?: string;
}

export function CardIcon({ children, className = '' }: CardIconProps) {
  return (
    <div className={`icon ${className}`}>
      {children}
    </div>
  );
}

interface CardTitleProps {
  children: ReactNode;
  className?: string;
}

export function CardTitle({ children, className = '' }: CardTitleProps) {
  return (
    <div className={`title ${className}`}>
      {children}
    </div>
  );
}

interface CardOnelinerProps {
  children: ReactNode;
  className?: string;
}

export function CardOneliner({ children, className = '' }: CardOnelinerProps) {
  return (
    <div className={`oneliner ${className}`}>
      {children}
    </div>
  );
}
