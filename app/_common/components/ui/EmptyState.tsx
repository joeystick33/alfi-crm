/**
 * Empty State Component
 * Displays when no data is available with optional CTA
 */

import React from 'react'
import { LucideIcon } from 'lucide-react'
import { Button } from './Button'
import { cn } from '@/app/_common/lib/utils'

interface EmptyStateProps {
  icon?: LucideIcon | React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    icon?: LucideIcon
  } | (() => void)
  actionLabel?: string
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  actionLabel,
  className,
}: EmptyStateProps) {
  const isSimpleAction = typeof action === 'function';
  const actionObj = isSimpleAction ? { label: actionLabel || 'Action', onClick: action } : action;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-6 text-center border border-gray-200 rounded-xl bg-white',
        className
      )}
    >
      {Icon && (
        <div className="rounded-2xl bg-gray-100 p-4 mb-5">
          {/* Check if Icon is a valid React element or a component */}
          {React.isValidElement(Icon) ? (
            Icon
          ) : (() => {
            // Icon is a component (function or forwardRef)
            const IconComponent = Icon as LucideIcon
            return <IconComponent className="h-10 w-10 text-gray-400" />
          })()}
        </div>
      )}
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      
      {description && (
        <p className="text-sm text-gray-500 max-w-sm mb-6 leading-relaxed">
          {description}
        </p>
      )}
      
      {actionObj && (
        <Button onClick={actionObj.onClick} size="md">
          {actionObj.icon && <actionObj.icon className="h-4 w-4 mr-2" />}
          {actionObj.label}
        </Button>
      )}
    </div>
  )
}
