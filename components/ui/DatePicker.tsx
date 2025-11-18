import * as React from 'react'
import { Calendar } from 'lucide-react'
import { Input } from './Input'

export interface DatePickerProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
  ({ label, error, ...props }, ref) => {
    return (
      <Input
        type="date"
        label={label}
        error={error}
        ref={ref}
        {...props}
      />
    )
  }
)

DatePicker.displayName = 'DatePicker'

export { DatePicker }
export default DatePicker
