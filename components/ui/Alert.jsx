'use client';

import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/design-system';

export default function Alert({
  children,
  title,
  variant = 'info',
  onClose,
  className,
  ...props
}) {
  const variants = {
    info: {
      container: 'bg-info-50 border-info-200 text-info-900',
      icon: Info,
      iconColor: 'text-info-600',
    },
    success: {
      container: 'bg-success-50 border-success-200 text-success-900',
      icon: CheckCircle,
      iconColor: 'text-success-600',
    },
    warning: {
      container: 'bg-warning-50 border-warning-200 text-warning-900',
      icon: AlertTriangle,
      iconColor: 'text-warning-600',
    },
    error: {
      container: 'bg-error-50 border-error-200 text-error-900',
      icon: AlertCircle,
      iconColor: 'text-error-600',
    },
  };

  const config = variants[variant];
  const Icon = config.icon;

  return (
    <div
      role="alert"
      className={cn(
        'relative flex gap-3 p-4 border rounded-lg',
        config.container,
        className
      )}
      {...props}
    >
      <Icon className={cn('h-5 w-5 shrink-0 mt-0.5', config.iconColor)} aria-hidden="true" />
      
      <div className="flex-1 min-w-0">
        {title && (
          <h5 className="font-semibold mb-1">{title}</h5>
        )}
        <div className="text-sm">{children}</div>
      </div>

      {onClose && (
        <button
          onClick={onClose}
          className="shrink-0 text-current opacity-60 hover:opacity-100 transition-opacity"
          aria-label="Fermer l'alerte"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
