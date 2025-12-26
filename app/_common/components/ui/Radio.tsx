'use client';

import * as React from 'react';
import { cn } from '@/app/_common/lib/utils';

export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  id?: string;
  name?: string;
  label?: string;
  description?: string;
  value: string;
  checked?: boolean;
  onChange?: (value: string) => void;
  error?: string;
  className?: string;
}

const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  (
    {
      id,
      name,
      label,
      description,
      value,
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
    const radioId = id || `radio-${generatedId}`;

    return (
      <div className={cn('flex items-start', className)}>
        <div className="flex items-center h-5">
          <input
            ref={ref}
            type="radio"
            id={radioId}
            name={name}
            value={value}
            checked={checked}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange?.(e.target.value)}
            disabled={disabled}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={description ? `${radioId}-description` : undefined}
            className="sr-only"
            {...props}
          />
          <div
            onClick={() => !disabled && onChange?.(value)}
            className={cn(
              'w-5 h-5 rounded-full border-2 flex items-center justify-center',
              'transition-all cursor-pointer',
              checked
                ? 'bg-white border-primary-600'
                : 'bg-white border-gray-300',
              error ? 'border-red-500' : '',
              disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary-500',
              'focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2'
            )}
          >
            {checked && (
              <div className="w-2.5 h-2.5 rounded-full bg-primary-600" />
            )}
          </div>
        </div>
        {(label || description) && (
          <div className="ml-3">
            {label && (
              <label
                htmlFor={radioId}
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
                id={`${radioId}-description`}
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

Radio.displayName = 'Radio';

export interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function RadioGroup({ children, className = '', ...props }: RadioGroupProps) {
  return (
    <div role="radiogroup" className={cn('space-y-3', className)} {...props}>
      {children}
    </div>
  );
}

export default Radio;
