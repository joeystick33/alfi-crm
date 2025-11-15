'use client';

import * as React from 'react';
import { Calendar } from 'lucide-react';
import Input from './Input';

export interface DatePickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  label?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  min?: string;
  max?: string;
  disabled?: boolean;
  error?: string;
  helperText?: string;
  required?: boolean;
}

const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
  (
    {
      label,
      value,
      onChange,
      min,
      max,
      disabled = false,
      error,
      helperText,
      required = false,
      ...props
    },
    ref
  ) => {
    return (
      <Input
        ref={ref}
        type="date"
        label={label}
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        disabled={disabled}
        error={error}
        helperText={helperText}
        required={required}
        rightIcon={<Calendar className="w-4 h-4" />}
        {...props}
      />
    );
  }
);

DatePicker.displayName = 'DatePicker';

export default DatePicker;
