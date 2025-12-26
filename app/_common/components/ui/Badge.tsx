/**
 * Premium Badge Component
 * Inspired by Linear, Notion, and Stripe
 * 
 * Features:
 * - Refined color palette with proper contrast
 * - Subtle borders for depth
 * - Multiple size variants
 * - Dot indicator option
 */

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/app/_common/lib/utils'

const badgeVariants = cva(
  // Base styles - refined typography
  [
    'inline-flex items-center gap-1.5',
    'font-medium',
    'transition-colors duration-150',
    'select-none',
  ],
  {
    variants: {
      variant: {
        // Neutral variants
        default: 'bg-gray-100 text-gray-700 border border-gray-200/50',
        secondary: 'bg-gray-50 text-gray-600 border border-gray-100',
        outline: 'bg-transparent text-gray-600 border border-gray-200',
        ghost: 'bg-transparent text-gray-500',
        
        // Semantic variants (Stripe-inspired muted colors)
        primary: 'bg-[#7373FF]/10 text-[#5c5ce6] border border-[#7373FF]/20',
        success: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
        warning: 'bg-amber-50 text-amber-700 border border-amber-100',
        danger: 'bg-rose-50 text-rose-700 border border-rose-100',
        destructive: 'bg-rose-50 text-rose-700 border border-rose-100',
        error: 'bg-rose-50 text-rose-700 border border-rose-100',
        info: 'bg-sky-50 text-sky-700 border border-sky-100',
        
        // Status variants (CRM specific)
        actif: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
        inactif: 'bg-gray-100 text-gray-500 border border-gray-200/50',
        prospect: 'bg-sky-50 text-sky-700 border border-sky-100',
        vip: 'bg-amber-50 text-amber-700 border border-amber-100',
        urgent: 'bg-rose-50 text-rose-700 border border-rose-100',
        opportunity: 'bg-violet-50 text-violet-700 border border-violet-100',
        
        // Solid variants (for emphasis)
        'solid-primary': 'bg-[#7373FF] text-white border border-[#7373FF]',
        'solid-success': 'bg-emerald-600 text-white border border-emerald-600',
        'solid-danger': 'bg-rose-600 text-white border border-rose-600',
        'solid-warning': 'bg-amber-500 text-white border border-amber-500',
      },
      size: {
        xs: 'px-1.5 py-0.5 text-[10px] leading-tight rounded',
        sm: 'px-2 py-0.5 text-xs rounded-md',
        md: 'px-2.5 py-1 text-xs rounded-md',
        lg: 'px-3 py-1.5 text-sm rounded-lg',
      },
      shape: {
        default: 'rounded-md',
        pill: 'rounded-full',
        square: 'rounded',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'sm',
      shape: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  /** Show a dot indicator before the text */
  dot?: boolean
  /** Dot color (defaults to variant color) */
  dotColor?: string
}

function Badge({ 
  className, 
  variant, 
  size, 
  shape, 
  dot,
  dotColor,
  children,
  ...props 
}: BadgeProps) {
  return (
    <div 
      className={cn(badgeVariants({ variant, size, shape }), className)} 
      {...props}
    >
      {dot && (
        <span 
          className={cn(
            'w-1.5 h-1.5 rounded-full flex-shrink-0',
            dotColor || 'bg-current opacity-70'
          )} 
        />
      )}
      {children}
    </div>
  )
}

/**
 * Status dot component for inline status indicators
 */
function StatusDot({ 
  status,
  className,
}: { 
  status: 'online' | 'offline' | 'busy' | 'away' | 'success' | 'warning' | 'error'
  className?: string 
}) {
  const colors = {
    online: 'bg-emerald-500',
    success: 'bg-emerald-500',
    offline: 'bg-gray-400',
    busy: 'bg-rose-500',
    error: 'bg-rose-500',
    away: 'bg-amber-500',
    warning: 'bg-amber-500',
  }
  
  return (
    <span 
      className={cn(
        'w-2 h-2 rounded-full',
        colors[status],
        className
      )} 
    />
  )
}

export { Badge, badgeVariants, StatusDot }
