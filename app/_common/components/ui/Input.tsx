import * as React from 'react'
import { cn } from '@/app/_common/lib/utils'
import { AlertCircle } from 'lucide-react'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
  label?: string
  helperText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, label, helperText, leftIcon, rightIcon, fullWidth = true, id, ...props }, ref) => {
    const generatedId = React.useId()
    const inputId = id || generatedId
    const errorId = error ? `${inputId}-error` : undefined
    const helperId = helperText ? `${inputId}-helper` : undefined
    
    return (
      <div className={cn('space-y-1.5', fullWidth && 'w-full')}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700"
          >
            {label}
            {props.required && <span className="text-red-600 ml-1" aria-label="requis">*</span>}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              {leftIcon}
            </div>
          )}
          
          <input
            type={type}
            className={cn(
              'flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition-colors',
              'placeholder:text-gray-400',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:border-transparent',
              'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-100',
              error && 'border-red-500 focus-visible:ring-red-500 text-red-900',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              className
            )}
            id={inputId}
            ref={ref}
            aria-invalid={!!error}
            aria-describedby={cn(errorId, helperId).trim() || undefined}
            {...props}
          />
          
          {rightIcon && !error && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              {rightIcon}
            </div>
          )}

          {error && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 pointer-events-none">
              <AlertCircle className="h-5 w-5" />
            </div>
          )}
        </div>

        {error && (
          <p id={errorId} className="text-sm text-red-600 flex items-center gap-1" role="alert">
            {error}
          </p>
        )}

        {helperText && !error && (
          <p id={helperId} className="text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

export { Input }
