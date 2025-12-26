/**
 * MetricCard Component
 * Reusable card for displaying metrics with optional trend
 */

import { Card, CardContent } from '@/app/_common/components/ui/Card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { ReactNode } from 'react';

type MetricStatus = 'positive' | 'success' | 'negative' | 'danger' | 'warning' | 'neutral' | 'info';

interface MetricCardProps {
  icon?: ReactNode;
  label: string;
  value: string | number;
  trend?: number;
  status?: MetricStatus;
  subtitle?: string;
  className?: string;
  animated?: boolean;
}

export function MetricCard({ 
  icon, 
  label, 
  value, 
  trend, 
  status = 'neutral',
  subtitle,
  className = '',
  animated = true,
}: MetricCardProps) {
  const statusColors: Record<MetricStatus, string> = {
    positive: 'text-green-600',
    success: 'text-green-600',
    negative: 'text-red-600',
    danger: 'text-red-600',
    warning: 'text-orange-600',
    neutral: 'text-gray-600',
    info: 'text-blue-600',
  };

  const getTrendIcon = () => {
    if (trend === undefined || trend === null) return null;
    if (trend > 0) return <TrendingUp className="w-4 h-4" />;
    if (trend < 0) return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  const getTrendColor = () => {
    if (trend === undefined || trend === null) return 'text-gray-600';
    if (trend > 0) return 'text-green-600';
    if (trend < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <Card 
      className={`
        hover:shadow-lg transition-all duration-300
        ${animated ? 'animate-in fade-in duration-500' : ''}
        ${className}
      `}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-gray-600 text-sm">
            {icon && <span className="text-lg">{icon}</span>}
            <span>{label}</span>
          </div>
          {trend !== undefined && trend !== null && (
            <div className={`flex items-center gap-1 text-xs font-medium ${getTrendColor()}`}>
              {getTrendIcon()}
              <span>{Math.abs(trend)}%</span>
            </div>
          )}
        </div>
        
        <div className={`text-3xl font-bold ${statusColors[status] || statusColors.neutral}`}>
          {value}
        </div>

        {subtitle && (
          <div className="text-xs text-gray-500 mt-2">
            {subtitle}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default MetricCard;
