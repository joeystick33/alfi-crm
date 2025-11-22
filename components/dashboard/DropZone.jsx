'use client';

import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';

export default function DropZone({
  date,
  hour,
  onDragOver,
  onDragLeave,
  onDrop,
  isActive,
  hasConflict,
  children,
  className
}) {
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDragOver) {
      onDragOver({ date, hour }, e);
    }
  };

  const handleDragLeave = (e) => {
    e.stopPropagation();
    if (onDragLeave) {
      onDragLeave(e);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDrop) {
      onDrop({ date, hour }, e);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        'relative min-h-[60px] transition-all rounded-lg',
        isActive && !hasConflict && 'bg-blue-50 border-2 border-dashed border-blue-400',
        isActive && hasConflict && 'bg-red-50 border-2 border-dashed border-red-400',
        !isActive && 'border border-transparent hover:border-gray-200 hover:bg-gray-50',
        className
      )}
    >
      {children}
      
      {/* Drop Indicator */}
      {isActive && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium',
            hasConflict 
              ? 'bg-red-100 text-red-700 border border-red-300'
              : 'bg-blue-100 text-blue-700 border border-blue-300'
          )}>
            {hasConflict ? (
              <>
                <span>⚠️</span>
                <span>Conflit détecté</span>
              </>
            ) : (
              <>
                <Plus className="h-3 w-3" />
                <span>Déposer ici</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
