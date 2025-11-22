import * as React from 'react'
import { cn } from '@/lib/utils'

type BentoCardVariant = 'default' | 'hero' | 'accent' | 'gradient'

interface BentoCardProps extends React.HTMLAttributes<HTMLDivElement> {
  span?: {
    cols?: number
    rows?: number
  }
  variant?: BentoCardVariant
  hoverable?: boolean
  children: React.ReactNode
}

const variantStyles: Record<BentoCardVariant, string> = {
  default: 'bg-card border-border',
  hero: 'bg-gradient-to-br from-primary/10 via-card to-card border-primary/20',
  accent: 'bg-accent/5 border-accent/20',
  gradient: 'bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 border-purple-500/20',
}

const BentoCard = React.forwardRef<HTMLDivElement, BentoCardProps>(
  ({ className, span = { cols: 1, rows: 1 }, variant = 'default', hoverable = false, children, ...props }, ref) => {
    const colSpan = span.cols || 1
    const rowSpan = span.rows || 1

    return (
      <div
        ref={ref}
        role="region"
        aria-label={props['aria-label'] || 'Card content'}
        tabIndex={hoverable ? 0 : undefined}
        className={cn(
          // Base styles
          'rounded-lg border shadow-sm',
          'p-6',
          'overflow-hidden',
          // Variant styles
          variantStyles[variant],
          // Dark mode support
          'dark:bg-gray-900 dark:border-gray-700',
          variant === 'hero' && 'dark:from-primary/20 dark:via-gray-900 dark:to-gray-900 dark:border-primary/30',
          variant === 'accent' && 'dark:bg-accent/10 dark:border-accent/30',
          variant === 'gradient' && 'dark:from-blue-500/20 dark:via-purple-500/20 dark:to-pink-500/20 dark:border-purple-500/30',
          // Grid span
          `col-span-${colSpan}`,
          `row-span-${rowSpan}`,
          // Responsive spans - reduce on mobile
          colSpan > 1 && 'md:col-span-' + colSpan,
          rowSpan > 1 && 'md:row-span-' + rowSpan,
          // Hover effects
          hoverable && 'transition-all duration-300 hover:shadow-lg hover:scale-[1.02] cursor-pointer',
          // Focus indicators for accessibility
          hoverable && 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          // Smooth transitions
          'transition-colors duration-200',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
BentoCard.displayName = 'BentoCard'

const BentoCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 mb-4', className)}
    {...props}
  />
))
BentoCardHeader.displayName = 'BentoCardHeader'

const BentoCardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('font-semibold leading-none tracking-tight text-lg', className)}
    {...props}
  />
))
BentoCardTitle.displayName = 'BentoCardTitle'

const BentoCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
))
BentoCardDescription.displayName = 'BentoCardDescription'

const BentoCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('', className)} {...props} />
))
BentoCardContent.displayName = 'BentoCardContent'

export { BentoCard, BentoCardHeader, BentoCardTitle, BentoCardDescription, BentoCardContent }
export type { BentoCardProps, BentoCardVariant }
