'use client';

import { ArrowUp, ArrowDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/design-system';

export default function KPICard({
  title,
  value,
  evolution,
  evolutionType,
  subtitle,
  icon: Icon,
  badge,
  onClick,
  loading = false,
}) {
  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-6">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-2" />
          <div className="h-3 bg-gray-200 rounded w-full" />
        </CardContent>
      </Card>
    );
  }

  const ariaLabel = `${title}: ${value}${evolution !== undefined ? `, évolution de ${evolution}%` : ''}${subtitle ? `, ${subtitle}` : ''}`;

  return (
    <Card
      interactive={!!onClick}
      onClick={onClick}
      className={cn(
        'relative overflow-hidden',
        onClick && 'cursor-pointer'
      )}
      role={onClick ? 'button' : 'article'}
      aria-label={ariaLabel}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="p-2 rounded-lg bg-primary-50 dark:bg-primary-900/20" aria-hidden="true">
                <Icon className="h-5 w-5 text-primary-600 dark:text-primary-400" aria-hidden="true" />
              </div>
            )}
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400" id={`kpi-title-${title.replace(/\s+/g, '-').toLowerCase()}`}>
              {title}
            </h3>
          </div>
          {badge !== undefined && badge > 0 && (
            <Badge variant="error" size="sm" aria-label={`${badge} éléments nécessitant attention`}>
              {badge}
            </Badge>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-3xl font-bold text-gray-900 dark:text-white" aria-describedby={`kpi-title-${title.replace(/\s+/g, '-').toLowerCase()}`}>
            {value}
          </p>

          {evolution !== undefined && (
            <div className="flex items-center gap-1" role="status" aria-label={`Évolution: ${evolutionType === 'positive' ? 'hausse' : 'baisse'} de ${Math.abs(evolution)} pourcent`}>
              {evolutionType === 'positive' ? (
                <ArrowUp className="h-4 w-4 text-success-600" aria-hidden="true" />
              ) : (
                <ArrowDown className="h-4 w-4 text-error-600" aria-hidden="true" />
              )}
              <span
                className={cn(
                  'text-sm font-medium',
                  evolutionType === 'positive' ? 'text-success-600' : 'text-error-600'
                )}
              >
                {Math.abs(evolution)}%
              </span>
            </div>
          )}

          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {subtitle}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
