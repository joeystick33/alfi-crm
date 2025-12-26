/**
 * Chart Empty State Component
 * Displays a placeholder when chart data is empty
 * 
 * **Validates: Requirements 7.4**
 * WHEN chart data is empty THEN the System SHALL display a placeholder message instead of an empty chart
 */

import React from 'react'
import { BarChart3, LucideIcon } from 'lucide-react'
import { cn } from '@/app/_common/lib/utils'

export interface ChartEmptyStateProps {
  /** Custom icon to display (defaults to BarChart3) */
  icon?: React.ReactNode | LucideIcon
  /** Message to display (defaults to 'Aucune donnée disponible') */
  message?: string
  /** Height of the placeholder in pixels (defaults to 300) */
  height?: number
  /** Additional CSS classes */
  className?: string
}

/**
 * ChartEmptyState - Displays a placeholder when chart data is empty
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <ChartEmptyState />
 * 
 * // With custom message
 * <ChartEmptyState message="Aucune donnée de revenus disponible" />
 * 
 * // With custom icon
 * <ChartEmptyState icon={<PieChartIcon className="w-12 h-12 text-gray-400 mb-3" />} />
 * ```
 */
export function ChartEmptyState({ 
  icon, 
  message = 'Aucune donnée disponible',
  height = 300,
  className
}: ChartEmptyStateProps) {
  // Render the icon - handle both ReactNode and LucideIcon component
  const renderIcon = () => {
    if (!icon) {
      return <BarChart3 className="w-12 h-12 text-gray-400 mb-3" />
    }
    
    // If icon is a React element, render it directly
    if (React.isValidElement(icon)) {
      return icon
    }
    
    // If icon is a component (LucideIcon), instantiate it
    const IconComponent = icon as LucideIcon
    return <IconComponent className="w-12 h-12 text-gray-400 mb-3" />
  }

  return (
    <div 
      className={cn(
        'flex flex-col items-center justify-center text-gray-500 bg-gray-50 rounded-lg',
        className
      )}
      style={{ height }}
      role="status"
      aria-label={message}
    >
      {renderIcon()}
      <p className="text-sm text-center px-4">{message}</p>
    </div>
  )
}

/**
 * Helper function to check if chart data is empty
 * Returns true if data is null, undefined, or an empty array
 */
export function isChartDataEmpty(data: unknown[] | null | undefined): boolean {
  return !data || !Array.isArray(data) || data.length === 0
}

export default ChartEmptyState
