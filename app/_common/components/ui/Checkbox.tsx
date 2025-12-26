'use client';

import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/app/_common/lib/utils';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  id?: string;
  label?: string;
  description?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  error?: string;
  className?: string;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      id,
      label,
      description,
      checked = false,
      onChange,
      disabled = false,
      error,
      className = '',
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const checkboxId = id || `checkbox-${generatedId}`;

    return (
      <div className={cn('flex items-start', className)}>
        <div className="flex items-center h-5">
          <input
            ref={ref}
            type="checkbox"
            id={checkboxId}
            checked={checked}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange?.(e.target.checked)}
            disabled={disabled}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={description ? `${checkboxId}-description` : undefined}
            className="sr-only"
            {...props}
          />
          <div
            onClick={() => !disabled && onChange?.(!checked)}
            className={cn(
              'w-5 h-5 rounded border-2 flex items-center justify-center',
              'transition-all cursor-pointer',
              checked
                ? 'bg-primary-600 border-primary-600'
                : 'bg-white border-gray-300',
              error ? 'border-red-500' : '',
              disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary-500',
              'focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2'
            )}
          >
            {checked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
          </div>
        </div>
        {(label || description) && (
          <div className="ml-3">
            {label && (
              <label
                htmlFor={checkboxId}
                className={cn(
                  'text-sm font-medium text-gray-900',
                  disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                )}
              >
                {label}
              </label>
            )}
            {description && (
              <p
                id={`${checkboxId}-description`}
                className="text-sm text-gray-500"
              >
                {description}
              </p>
            )}
            {error && (
              <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export default Checkbox;
