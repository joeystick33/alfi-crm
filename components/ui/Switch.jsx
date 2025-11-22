'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/design-system';
import { focusRing } from '@/lib/accessibility';

const Switch = forwardRef(({
  label,
  description,
  checked,
  onCheckedChange,
  disabled = false,
  className,
  id,
  ...props
}, ref) => {
  const switchId = id || `switch-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={cn('flex items-start gap-3', className)}>
      <button
        ref={ref}
        type="button"
        role="switch"
        id={switchId}
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onCheckedChange?.(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors',
          'disabled:cursor-not-allowed disabled:opacity-50',
          checked ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700',
          focusRing.default
        )}
        {...props}
      >
        <span
          className={cn(
            'inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform',
            checked ? 'translate-x-5' : 'translate-x-0.5',
            'mt-0.5'
          )}
          aria-hidden="true"
        />
      </button>

      {(label || description) && (
        <div className="flex-1">
          {label && (
            <label
              htmlFor={switchId}
              className={cn(
                'block text-sm font-medium cursor-pointer',
                disabled ? 'text-gray-400' : 'text-gray-700 dark:text-gray-300'
              )}
            >
              {label}
            </label>
          )}
          {description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
          )}
        </div>
      )}
    </div>
  );
});

Switch.displayName = 'Switch';

export default Switch;
