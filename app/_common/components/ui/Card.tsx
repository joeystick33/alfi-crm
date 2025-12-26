/**
 * Premium Card Component
 * Inspired by Notion, Linear, and Stripe
 * 
 * Features:
 * - Refined border radius (12px)
 * - Subtle shadows with proper layering
 * - Smooth hover transitions
 * - Multiple variants for different contexts
 */

import * as React from 'react'
import { cn } from '@/app/_common/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

const cardVariants = cva(
  // Base styles - refined corners and transitions
  [
    'rounded-xl',
    'transition-all duration-200 ease-out',
  ],
  {
    variants: {
      variant: {
        // Default - Luminous Midnight Card
        default: [
          'bg-[hsl(var(--card))]',
          'text-[hsl(var(--card-foreground))]',
          'border border-[hsl(var(--border))]',
          'shadow-lg shadow-black/20',
        ],
        // Elevated - more prominent shadow
        elevated: [
          'bg-white',
          'border border-gray-100/50',
          'shadow-md shadow-gray-200/50',
        ],
        // Outline - visible border, no shadow
        outline: [
          'bg-[hsl(var(--card))]',
          'border border-[hsl(var(--border))]',
        ],
        // Ghost - no border or shadow
        ghost: [
          'bg-transparent',
        ],
        // Filled - subtle background
        filled: [
          'bg-gray-50',
          'border border-gray-100',
        ],
        // Gradient - subtle gradient background
        gradient: [
          'bg-gradient-to-br from-[hsl(var(--card))] to-[hsl(var(--muted))]',
          'border border-[hsl(var(--border))]',
          'shadow-sm',
        ],
      },
      interactive: {
        true: [
          'cursor-pointer',
          'hover:border-gray-200',
          'hover:shadow-lg hover:shadow-gray-200/50',
          'hover:-translate-y-0.5',
          'active:translate-y-0 active:shadow-md',
        ],
        false: '',
      },
      padding: {
        none: '',
        sm: 'p-4',
        md: 'p-5',
        lg: 'p-6',
      },
    },
    defaultVariants: {
      variant: 'default',
      interactive: false,
      padding: 'none',
    },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof cardVariants> { }

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, interactive, padding, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, interactive, padding, className }))}
      {...props}
    />
  )
)
Card.displayName = 'Card'

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    /** Add bottom border */
    bordered?: boolean
  }
>(({ className, bordered, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'px-5 py-4',
      bordered && 'border-b border-[hsl(var(--border))]',
      className
    )}
    {...props}
  />
))
CardHeader.displayName = 'CardHeader'

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement> & {
    /** Size variant */
    size?: 'sm' | 'md' | 'lg'
  }
>(({ className, size = 'md', ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'font-semibold text-[hsl(var(--card-foreground))] tracking-tight',
      size === 'sm' && 'text-sm',
      size === 'md' && 'text-base',
      size === 'lg' && 'text-lg',
      className
    )}
    {...props}
  />
))
CardTitle.displayName = 'CardTitle'

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-gray-500 mt-1 leading-relaxed', className)}
    {...props}
  />
))
CardDescription.displayName = 'CardDescription'

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('px-5 py-4', className)} {...props} />
))
CardContent.displayName = 'CardContent'

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    /** Background style */
    variant?: 'default' | 'muted'
  }
>(({ className, variant = 'default', ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'px-5 py-4 border-t border-[hsl(var(--border))] rounded-b-xl',
      variant === 'muted' && 'bg-[hsl(var(--muted))]',
      className
    )}
    {...props}
  />
))
CardFooter.displayName = 'CardFooter'

/**
 * Card section divider
 */
const CardDivider = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('border-t border-gray-100 mx-5', className)}
    {...props}
  />
))
CardDivider.displayName = 'CardDivider'

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  CardDivider,
  cardVariants,
}
