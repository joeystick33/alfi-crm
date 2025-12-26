'use client';

import * as React from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/app/_common/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  showCount?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = false,
      required = false,
      disabled = false,
      rows = 4,
      maxLength,
      showCount = false,
      className,
      id,
      value,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const textareaId = id || `textarea-${generatedId}`;
    const errorId = error ? `${textareaId}-error` : undefined;
    const helperId = helperText ? `${textareaId}-helper` : undefined;
    const currentLength = value?.toString().length || 0;

    return (
      <div className={cn('space-y-1.5', fullWidth && 'w-full')}>
        <div className="flex items-center justify-between">
          {label && (
            <label
              htmlFor={textareaId}
              className="block text-sm font-medium text-gray-700"
            >
              {label}
              {required && (
                <span className="text-error-600 ml-1" aria-label="requis">
                  *
                </span>
              )}
            </label>
          )}
          {showCount && maxLength && (
            <span className="text-xs text-gray-500" aria-live="polite">
              {currentLength}/{maxLength}
            </span>
          )}
        </div>

        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          disabled={disabled}
          required={required}
          maxLength={maxLength}
          value={value}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={cn(errorId, helperId).trim() || undefined}
          className={cn(
            'w-full px-3 py-2 border rounded-lg text-sm transition-colors resize-y',
            'placeholder:text-gray-400',
            'disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60',
            error
              ? 'border-error-500 text-error-900 focus:ring-error-500 focus:border-error-500'
              : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500',
            'focus:outline-none focus:ring-2 focus:ring-offset-2',
            className
          )}
          {...props}
        />

        {error && (
          <p
            id={errorId}
            className="text-sm text-error-600 flex items-center gap-1"
            role="alert"
          >
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            {error}
          </p>
        )}

        {helperText && !error && (
          <p id={helperId} className="text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export { Textarea };
export default Textarea;
