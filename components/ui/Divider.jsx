'use client';

import { cn } from '@/lib/utils';

const Divider = ({ 
  orientation = 'horizontal',
  className,
  children 
}) => {
  if (children) {
    return (
      <div className={cn('flex items-center gap-4 my-4', className)}>
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-sm text-gray-500">{children}</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>
    );
  }
  
  return (
    <div
      className={cn(
        orientation === 'horizontal' 
          ? 'w-full h-px bg-gray-200 my-4' 
          : 'h-full w-px bg-gray-200 mx-4',
        className
      )}
      role="separator"
      aria-orientation={orientation}
    />
  );
};

export default Divider;
