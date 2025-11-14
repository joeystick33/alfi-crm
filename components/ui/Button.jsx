'use client';

import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/design-system';
import { focusRing } from '@/lib/accessibility';

/**
 * Button - Composant bouton 100% accessible
 * WCAG 2.1 AA compliant
 * Toutes les variantes standardisées
 */

const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  type = 'button',
  className,
  onClick,
  ...props
}, ref) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white shadow-sm hover:shadow-md',
    secondary: 'bg-gray-200 hover:bg-gray-300 active:bg-gray-400 text-gray-900',
    success: 'bg-success-600 hover:bg-success-700 active:bg-success-800 text-white shadow-sm',
    warning: 'bg-warning-600 hover:bg-warning-700 active:bg-warning-800 text-white shadow-sm',
    error: 'bg-error-600 hover:bg-error-700 active:bg-error-800 text-white shadow-sm',
    ghost: 'bg-transparent hover:bg-gray-100 active:bg-gray-200 text-gray-700',
    outline: 'border-2 border-primary-600 text-primary-600 hover:bg-primary-50 active:bg-primary-100',
    link: 'bg-transparent text-primary-600 hover:text-primary-700 underline-offset-4 hover:underline',
  };
  
  const sizes = {
    xs: 'px-2.5 py-1.5 text-xs rounded-md gap-1',
    sm: 'px-3 py-2 text-sm rounded-md gap-1.5',
    md: 'px-4 py-2.5 text-sm rounded-lg gap-2',
    lg: 'px-5 py-3 text-base rounded-lg gap-2',
    xl: 'px-6 py-3.5 text-base rounded-xl gap-2.5',
  };

  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        focusRing.default,
        fullWidth && 'w-full',
        className
      )}
      aria-busy={loading}
      aria-disabled={isDisabled}
      {...props}
    >
      {loading && (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      )}
      {!loading && leftIcon && (
        <span className="shrink-0" aria-hidden="true">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!loading && rightIcon && (
        <span className="shrink-0" aria-hidden="true">{rightIcon}</span>
      )}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
