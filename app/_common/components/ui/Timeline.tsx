'use client';

import { cn } from '@/app/_common/lib/utils';

const Timeline = ({ children, className }) => {
  return (
    <div className={cn('space-y-6', className)}>
      {children}
    </div>
  );
};

const TimelineItem = ({ 
  title,
  description,
  date,
  icon,
  iconColor = 'primary',
  isLast = false,
  className
}) => {
  const iconColors = {
    primary: 'bg-primary-100 text-primary-600',
    success: 'bg-success-100 text-success-600',
    warning: 'bg-warning-100 text-warning-600',
    error: 'bg-error-100 text-error-600',
    gray: 'bg-gray-100 text-gray-600'
  };
  
  return (
    <div className={cn('relative flex gap-4', className)}>
      <div className="flex flex-col items-center">
        <div className={cn(
          'flex items-center justify-center w-10 h-10 rounded-full',
          iconColors[iconColor]
        )}>
          {icon || (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        {!isLast && (
          <div className="w-0.5 h-full bg-gray-200 mt-2" />
        )}
      </div>
      
      <div className="flex-1 pb-8">
        <div className="flex items-start justify-between mb-1">
          <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
          {date && (
            <span className="text-xs text-gray-500">{date}</span>
          )}
        </div>
        {description && (
          <p className="text-sm text-gray-600">{description}</p>
        )}
      </div>
    </div>
  );
};

Timeline.Item = TimelineItem;

export default Timeline;
