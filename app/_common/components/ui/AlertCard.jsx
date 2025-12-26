/**
 * AlertCard Component
 * Reusable alert card with severity levels
 */

import { Alert, AlertDescription, AlertTitle } from '@/app/_common/components/ui/alert';
import { AlertTriangle, AlertCircle, Info, CheckCircle2 } from 'lucide-react';

export function AlertCard({ 
  severity = 'info', 
  title, 
  description, 
  icon,
  action,
  className = '',
  animated = true,
}) {
  const severityConfig = {
    error: {
      icon: AlertCircle,
      className: 'bg-red-50 border-red-200 text-red-900',
      iconColor: 'text-red-600',
    },
    warning: {
      icon: AlertTriangle,
      className: 'bg-orange-50 border-orange-200 text-orange-900',
      iconColor: 'text-orange-600',
    },
    info: {
      icon: Info,
      className: 'bg-blue-50 border-blue-200 text-blue-900',
      iconColor: 'text-blue-600',
    },
    success: {
      icon: CheckCircle2,
      className: 'bg-green-50 border-green-200 text-green-900',
      iconColor: 'text-green-600',
    },
  };

  const config = severityConfig[severity] || severityConfig.info;
  const IconComponent = icon || config.icon;

  return (
    <Alert 
      className={`
        ${config.className}
        ${animated ? 'animate-fade-in' : ''}
        transition-smooth
        ${className}
      `}
    >
      <IconComponent className={`w-5 h-5 ${config.iconColor}`} />
      {title && <AlertTitle className="font-semibold mb-1">{title}</AlertTitle>}
      <AlertDescription className="text-sm">
        {description}
        {action && (
          <div className="mt-3">
            {action}
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}
