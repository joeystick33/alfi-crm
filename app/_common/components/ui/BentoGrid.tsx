import * as React from 'react'
import { cn } from '@/app/_common/lib/utils'

interface BentoGridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: {
    mobile?: number
    tablet?: number
    desktop?: number
  }
  rows?: number
  gap?: number
  children: React.ReactNode
}

const BentoGrid = React.forwardRef<HTMLDivElement, BentoGridProps>(
  ({ className, cols = { mobile: 1, tablet: 4, desktop: 6 }, rows, gap = 4, children, ...props }, ref) => {
    const gridCols = {
      mobile: cols.mobile || 1,
      tablet: cols.tablet || 4,
      desktop: cols.desktop || 6,
    }

    return (
      <div
        ref={ref}
        className={cn(
          'grid w-full',
          // Mobile columns
          `grid-cols-${gridCols.mobile}`,
          // Tablet columns
          `md:grid-cols-${gridCols.tablet}`,
          // Desktop columns
          `lg:grid-cols-${gridCols.desktop}`,
          // Gap
          `gap-${gap}`,
          // Rows if specified
          rows && `grid-rows-${rows}`,
          // Smooth transitions
          'transition-all duration-300 ease-in-out',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
BentoGrid.displayName = 'BentoGrid'

export { BentoGrid }
export type { BentoGridProps }
