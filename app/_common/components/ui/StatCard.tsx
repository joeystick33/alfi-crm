// @ts-nocheck
'use client';

import { cn } from '@/app/_common/lib/utils';
import Card from './Card';

const StatCard = ({
  title,
  value,
  change,
  changeType = 'neutral',
  icon,
  trend,
  className
}) => {
  const changeColors = {
    positive: 'text-success-600 bg-success-50',
    negative: 'text-error-600 bg-error-50',
    neutral: 'text-gray-600 bg-gray-50'
  };
  
  return (
    <Card className={cn('relative overflow-hidden', className)}>
      <Card.Content>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">
              {title}
            </p>
            <p className="text-3xl font-bold text-gray-900 mb-2">
              {value}
            </p>
            {change !== undefined && (
              <div className="flex items-center gap-2">
                <span className={cn(
                  'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold',
                  changeColors[changeType]
                )}>
                  {changeType === 'positive' && '↑'}
                  {changeType === 'negative' && '↓'}
                  {change}
                </span>
                <span className="text-xs text-gray-500">vs mois dernier</span>
              </div>
            )}
          </div>
          
          {icon && (
            <div className="flex-shrink-0 p-3 bg-primary-50 rounded-lg">
              <div className="text-2xl text-primary-600">{icon}</div>
            </div>
          )}
        </div>
        
        {trend && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="h-12">
              {trend}
            </div>
          </div>
        )}
      </Card.Content>
    </Card>
  );
};

export default StatCard;
