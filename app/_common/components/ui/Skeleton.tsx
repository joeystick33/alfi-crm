import { cn } from '@/app/_common/lib/utils'

function Skeleton({
  className,
  variant = 'default',
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { variant?: 'default' | 'circle' | 'text' }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-muted',
        variant === 'circle' && 'rounded-full',
        variant === 'text' && 'h-4 w-full',
        className
      )}
      {...props}
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="bg-card rounded-lg border shadow-sm p-6 space-y-4">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <div className="flex gap-3 pt-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  )
}

export function SkeletonTable({ rows = 5, columns = 4 }) {
  return (
    <div className="space-y-3">
      <div className="flex gap-4">
        {[...Array(columns)].map((_, i) => (
          <Skeleton key={i} className="h-10 flex-1" />
        ))}
      </div>
      {[...Array(rows)].map((_, rowIdx) => (
        <div key={rowIdx} className="flex gap-4">
          {[...Array(columns)].map((_, colIdx) => (
            <Skeleton key={colIdx} className="h-12 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function SkeletonList({ items = 5 }) {
  return (
    <div className="space-y-3">
      {[...Array(items)].map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton variant="circle" className="h-12 w-12" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function SkeletonChart() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-64 w-full" />
      <div className="flex gap-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  )
}

export { Skeleton }
export default Skeleton
