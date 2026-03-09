// @ts-nocheck
import { useState, useRef, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';
import Badge from './Badge';


export default function MultiSelect({
  label,
  options = [],
  value = [],
  onChange,
  placeholder = 'Sélectionner...',
  disabled = false,
  error,
  helperText,
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  const selectedOptions = options.filter(opt => value.includes(opt.value));

  const toggleOption = (optValue) => {
    const newValue = value.includes(optValue)
      ? value.filter(v => v !== optValue)
      : [...value, optValue];
    onChange?.(newValue);
  };

  const removeOption = (optValue) => {
    onChange?.(value.filter(v => v !== optValue));
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between px-3 py-2 border rounded-lg min-h-[42px]
          bg-white text-left
          ${error ? 'border-red-500' : 'border-gray-300'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400'}
        `}
        
      >
        <div className="flex flex-wrap gap-1 flex-1">
          {selectedOptions.length === 0 ? (
            <span className="text-gray-500">{placeholder}</span>
          ) : (
            selectedOptions.map(opt => (
              <Badge
                key={opt.value}
                variant="primary"
                size="sm"
                className="flex items-center gap-1"
              >
                {opt.label}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeOption(opt.value);
                  }}
                  className="hover:bg-primary-700 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))
          )}
        </div>
        <ChevronDown className="w-4 h-4 text-gray-500 ml-2" />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {options.map((option) => {
            const isSelected = value.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => toggleOption(option.value)}
                className={`
                  w-full flex items-center px-3 py-2 hover:bg-gray-100 text-left
                  ${isSelected ? 'bg-primary-50' : ''}
                `}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => {}}
                  className="mr-2"
                />
                <span className="text-gray-900">{option.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {(error || helperText) && (
        <p className={`mt-1 text-sm ${error ? 'text-red-600' : 'text-gray-500'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
}
