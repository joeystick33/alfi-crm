'use client'

/**
 * Premium Stat Card Component
 * Inspired by Finary, Stripe Dashboard, and Mercury Bank
 * 
 * Features:
 * - Refined typography with proper tracking
 * - Subtle gradient backgrounds
 * - Smooth micro-animations
 * - Sparkline trend visualization
 * - Multiple size variants
 */

import { cn } from '@/app/_common/lib/utils'
import { ReactNode } from 'react'
import { TrendingUp, TrendingDown, Minus, ArrowUpRight, ArrowDownRight } from 'lucide-react'

interface StatCardProps {
  /** Label displayed above the value */
  label: string
  /** Main value to display */
  value: string | number
  /** Optional subtitle or additional context */
  subtitle?: string
  /** Change value (e.g., "+12.5%") */
  change?: string | number
  /** Direction of change */
  changeType?: 'positive' | 'negative' | 'neutral'
  /** Period for the change (e.g., "vs last month") */
  changePeriod?: string
  /** Icon component */
  icon?: ReactNode
  /** Icon color variant */
  iconVariant?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral'
  /** Sparkline or mini chart */
  sparkline?: ReactNode
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Make card interactive */
  interactive?: boolean
  /** Click handler */
  onClick?: () => void
  /** Additional classes */
  className?: string
}

const iconVariantStyles = {
  primary: 'bg-indigo-50 text-indigo-600',
  success: 'bg-emerald-50 text-emerald-600',
  warning: 'bg-amber-50 text-amber-600',
  danger: 'bg-rose-50 text-rose-600',
  neutral: 'bg-gray-100 text-gray-600',
}

const changeStyles = {
  positive: {
    text: 'text-emerald-700',
    bg: 'bg-emerald-50',
    icon: TrendingUp,
    arrow: ArrowUpRight,
  },
  negative: {
    text: 'text-rose-700',
    bg: 'bg-rose-50',
    icon: TrendingDown,
    arrow: ArrowDownRight,
  },
  neutral: {
    text: 'text-gray-600',
    bg: 'bg-gray-100',
    icon: Minus,
    arrow: Minus,
  },
}

const sizeStyles = {
  sm: {
    padding: 'p-4',
    labelSize: 'text-xs',
    valueSize: 'text-xl',
    iconSize: 'p-2',
    iconInnerSize: 'h-4 w-4',
  },
  md: {
    padding: 'p-5',
    labelSize: 'text-xs',
    valueSize: 'text-2xl',
    iconSize: 'p-2.5',
    iconInnerSize: 'h-5 w-5',
  },
  lg: {
    padding: 'p-6',
    labelSize: 'text-sm',
    valueSize: 'text-3xl',
    iconSize: 'p-3',
    iconInnerSize: 'h-6 w-6',
  },
}

export function StatCard({
  label,
  value,
  subtitle,
  change,
  changeType = 'neutral',
  changePeriod = 'vs période précédente',
  icon,
  iconVariant = 'primary',
  sparkline,
  size = 'md',
  interactive = false,
  onClick,
  className,
}: StatCardProps) {
  const styles = sizeStyles[size]
  const changeStyle = changeStyles[changeType]
  const ChangeIcon = changeStyle.arrow

  return (
    <div
      onClick={interactive ? onClick : undefined}
      className={cn(
        // Base styles
        'relative overflow-hidden rounded-xl border border-gray-100 bg-white',
        styles.padding,
        
        // Subtle gradient overlay
        'before:absolute before:inset-0 before:bg-gradient-to-br before:from-gray-50/50 before:to-transparent before:pointer-events-none',
        
        // Interactive styles
        interactive && [
          'cursor-pointer',
          'transition-all duration-200 ease-out',
          'hover:border-gray-200 hover:shadow-lg hover:shadow-gray-100/50',
          'hover:-translate-y-0.5',
          'active:translate-y-0 active:shadow-md',
        ],
        
        className
      )}
    >
      {/* Header: Label + Icon */}
      <div className="relative flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Label */}
          <p className={cn(
            styles.labelSize,
            'font-medium text-gray-500 uppercase tracking-wider mb-2'
          )}>
            {label}
          </p>
          
          {/* Value */}
          <p className={cn(
            styles.valueSize,
            'font-semibold text-gray-900 tracking-tight leading-none'
          )}>
            {value}
          </p>
          
          {/* Subtitle */}
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1.5">
              {subtitle}
            </p>
          )}
        </div>
        
        {/* Icon */}
        {icon && (
          <div className={cn(
            'flex-shrink-0 rounded-xl',
            styles.iconSize,
            iconVariantStyles[iconVariant]
          )}>
            <div className={styles.iconInnerSize}>
              {icon}
            </div>
          </div>
        )}
      </div>
      
      {/* Change indicator */}
      {change !== undefined && (
        <div className="relative flex items-center gap-2 mt-4">
          <span className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium',
            changeStyle.bg,
            changeStyle.text
          )}>
            <ChangeIcon className="h-3 w-3" />
            {change}
          </span>
          <span className="text-xs text-gray-400">
            {changePeriod}
          </span>
        </div>
      )}
      
      {/* Sparkline */}
      {sparkline && (
        <div className="relative mt-4 pt-4 border-t border-gray-100/80">
          <div className="h-10">
            {sparkline}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Compact stat for inline display
 */
export function StatInline({
  label,
  value,
  change,
  changeType = 'neutral',
  className,
}: Pick<StatCardProps, 'label' | 'value' | 'change' | 'changeType' | 'className'>) {
  const changeStyle = changeStyles[changeType]
  
  return (
    <div className={cn('flex items-center justify-between py-3', className)}>
      <span className="text-sm text-gray-500">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-gray-900">{value}</span>
        {change !== undefined && (
          <span className={cn(
            'text-xs font-medium',
            changeStyle.text
          )}>
            {change}
          </span>
        )}
      </div>
    </div>
  )
}

/**
 * Large hero stat for dashboards
 */
export function StatHero({
  label,
  value,
  subtitle,
  change,
  changeType = 'neutral',
  className,
}: Pick<StatCardProps, 'label' | 'value' | 'subtitle' | 'change' | 'changeType' | 'className'>) {
  const changeStyle = changeStyles[changeType]
  const ChangeIcon = changeStyle.arrow
  
  return (
    <div className={cn('text-center py-8', className)}>
      <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
        {label}
      </p>
      <p className="text-5xl font-bold text-gray-900 tracking-tight mb-2">
        {value}
      </p>
      {subtitle && (
        <p className="text-base text-gray-500 mb-4">
          {subtitle}
        </p>
      )}
      {change !== undefined && (
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100">
          <ChangeIcon className={cn('h-4 w-4', changeStyle.text)} />
          <span className={cn('text-sm font-medium', changeStyle.text)}>
            {change}
          </span>
        </div>
      )}
    </div>
  )
}

export default StatCard
