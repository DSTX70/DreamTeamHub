import { ReactNode, ButtonHTMLAttributes } from "react";

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'success' | 'warning' | 'danger';
type ButtonSize = 'sm' | 'default' | 'lg';

interface BrandedButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  podVariant?: 'marketing' | 'ip' | 'product' | 'security' | 'brand' | 'finance' | 'control';
  isLoading?: boolean;
  className?: string;
  'data-testid'?: string;
}

export function BrandedButton({
  children,
  variant = 'primary',
  size = 'default',
  podVariant,
  isLoading = false,
  className = '',
  disabled,
  'data-testid': testId,
  ...props
}: BrandedButtonProps) {
  const variantClass = variant === 'primary' ? '' : `btn--${variant}`;
  const sizeClass = size === 'default' ? '' : `btn--${size}`;
  const loadingClass = isLoading ? 'is-loading' : '';
  const disabledClass = disabled ? 'is-disabled' : '';
  
  return (
    <button
      className={`btn ${variantClass} ${sizeClass} ${loadingClass} ${disabledClass} ${className}`.trim()}
      data-pod={podVariant}
      disabled={disabled || isLoading}
      data-testid={testId}
      {...props}
    >
      {children}
    </button>
  );
}
