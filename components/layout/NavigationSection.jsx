'use client';

import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

export default function NavigationSection({
  title,
  icon: Icon,
  children,
  isCollapsed = false,
  defaultExpanded = true,
  collapsible = true,
  className
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (isCollapsed) {
    // In collapsed sidebar mode, just render children without section header
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={cn('space-y-1', className)}>
      {/* Section Header */}
      {title && (
        <button
          onClick={() => collapsible && setIsExpanded(!isExpanded)}
          className={cn(
            'w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase',
            collapsible && 'hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer',
            !collapsible && 'cursor-default'
          )}
        >
          {Icon && <Icon className="h-4 w-4" />}
          <span className="flex-1 text-left">{title}</span>
          {collapsible && (
            isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )
          )}
        </button>
      )}

      {/* Section Content */}
      {isExpanded && (
        <div className="space-y-1">
          {children}
        </div>
      )}
    </div>
  );
}
