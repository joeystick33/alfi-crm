'use client'

import * as React from 'react'
import * as ProgressPrimitive from '@radix-ui/react-progress'
import { cn } from '@/app/_common/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

const progressVariants = cva(
  'relative w-full overflow-hidden rounded-full bg-secondary',
  {
    variants: {
      size: {
        sm: 'h-1',
        md: 'h-2',
        lg: 'h-3',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
)

const indicatorVariants = cva(
  'h-full w-full flex-1 transition-all',
  {
    variants: {
      variant: {
        default: 'bg-primary',
        primary: 'bg-primary',
        success: 'bg-green-600',
        warning: 'bg-yellow-600',
        error: 'bg-red-600',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>,
    VariantProps<typeof progressVariants>,
    VariantProps<typeof indicatorVariants> {
  showLabel?: boolean
  label?: string
  max?: number
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, size, variant, showLabel, label, max = 100, ...props }, ref) => {
  const percentage = Math.min(Math.max(((value || 0) / max) * 100, 0), 100)

  return (
    <div className="w-full">
      {(showLabel || label) && (
        <div className="flex items-center justify-between mb-2">
          {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
          {showLabel && <span className="text-sm text-gray-500">{Math.round(percentage)}%</span>}
        </div>
      )}
      <ProgressPrimitive.Root
        ref={ref}
        className={cn(progressVariants({ size }), className)}
        {...props}
      >
        <ProgressPrimitive.Indicator
          className={cn(indicatorVariants({ variant }))}
          style={{ transform: `translateX(-${100 - percentage}%)` }}
        />
      </ProgressPrimitive.Root>
    </div>
  )
})
Progress.displayName = ProgressPrimitive.Root.displayName

export default Progress
export { Progress }
