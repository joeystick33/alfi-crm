import { Check } from 'lucide-react';


export default function Checkbox({
  id,
  label,
  description,
  checked = false,
  onChange,
  disabled = false,
  error,
  className = '',
  ...props
}) {
  const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`flex items-start ${className}`}>
      <div className="flex items-center h-5">
        <input
          type="checkbox"
          id={checkboxId}
          checked={checked}
          onChange={(e) => onChange?.(e.target.checked)}
          disabled={disabled}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={description ? `${checkboxId}-description` : undefined}
          className="sr-only"
          {...props}
        />
        <div
          onClick={() => !disabled && onChange?.(!checked)}
          className={`
            w-5 h-5 rounded border-2 flex items-center justify-center
            transition-all cursor-pointer
            ${checked
              ? 'bg-primary-600 border-primary-600 dark:bg-primary-500 dark:border-primary-500'
              : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'
            }
            ${error ? 'border-red-500' : ''}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary-500'}
            focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2
          `}
          
        >
          {checked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
        </div>
      </div>
      {(label || description) && (
        <div className="ml-3">
          {label && (
            <label
              htmlFor={checkboxId}
              className={`
                text-sm font-medium text-gray-900 dark:text-white
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {label}
            </label>
          )}
          {description && (
            <p
              id={`${checkboxId}-description`}
              className="text-sm text-gray-500 dark:text-gray-400"
            >
              {description}
            </p>
          )}
          {error && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
