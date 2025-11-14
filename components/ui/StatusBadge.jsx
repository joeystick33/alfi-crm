/**
 * StatusBadge Component
 * Reusable badge with color-coded status
 */

import Badge from '@/components/ui/Badge';

export function StatusBadge({ status, label, size = 'default' }) {
  const variants = {
    good: 'bg-green-100 text-green-800 border-green-200',
    success: 'bg-green-100 text-green-800 border-green-200',
    medium: 'bg-orange-100 text-orange-800 border-orange-200',
    warning: 'bg-orange-100 text-orange-800 border-orange-200',
    high: 'bg-red-100 text-red-800 border-red-200',
    danger: 'bg-red-100 text-red-800 border-red-200',
    error: 'bg-red-100 text-red-800 border-red-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200',
    neutral: 'bg-gray-100 text-gray-800 border-gray-200',
    default: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    default: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  return (
    <Badge 
      className={`
        ${variants[status] || variants.default} 
        ${sizeClasses[size]}
        border font-medium transition-smooth
      `}
    >
      {label}
    </Badge>
  );
}
