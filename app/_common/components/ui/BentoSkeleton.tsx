import * as React from 'react'
import { cn } from '@/app/_common/lib/utils'
import { Skeleton } from './Skeleton'

interface BentoSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  span?: {
    cols?: number
    rows?: number
  }
  variant?: 'kpi' | 'chart' | 'card'
}

const BentoSkeleton = React.forwardRef<HTMLDivElement, BentoSkeletonProps>(
  ({ className, span = { cols: 1, rows: 1 }, variant = 'card', ...props }, ref) => {
    const colSpan = span.cols || 1
    const rowSpan = span.rows || 1

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-lg border border-border bg-card p-6',
          `col-span-${colSpan}`,
          `row-span-${rowSpan}`,
          colSpan > 1 && 'md:col-span-' + colSpan,
          rowSpan > 1 && 'md:row-span-' + rowSpan,
          className
        )}
        {...props}
      >
        {variant === 'kpi' && (
          <div className="space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-20" />
          </div>
        )}

        {variant === 'chart' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-48 w-full mt-4" />
          </div>
        )}

        {variant === 'card' && (
          <div className="space-y-3">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
        )}
      </div>
    )
  }
)
BentoSkeleton.displayName = 'BentoSkeleton'

export { BentoSkeleton }
export type { BentoSkeletonProps }
