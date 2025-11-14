import { Calendar } from 'lucide-react';
import Input from './Input';

export default function DatePicker({
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
}) {
  return (
    <Input
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
