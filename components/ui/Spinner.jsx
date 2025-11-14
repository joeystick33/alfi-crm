'use client';

import { cn } from '@/lib/utils';

const Spinner = ({ size = 'md', className }) => {
  const sizes = {
    xs: 'w-3 h-3 border',
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-2',
    xl: 'w-12 h-12 border-4'
  };
  
  return (
    <div
      className={cn(
        'animate-spin rounded-full',
        'border-gray-300 border-t-primary-600',
        sizes[size],
        className
      )}
      role="status"
      aria-label="Chargement"
    >
      <span className="sr-only">Chargement...</span>
    </div>
  );
};

export default Spinner;
