/**
 * Empty State Component
 * Displays when no data is available with optional CTA
 */

import React from 'react'
import { LucideIcon } from 'lucide-react'
import { Button } from './Button'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    icon?: LucideIcon
  }
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center border rounded-lg bg-muted/20',
        className
      )}
    >
      {Icon && (
        <div className="rounded-full bg-muted p-3 mb-4">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
      )}
      
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      
      {description && (
        <p className="text-sm text-muted-foreground max-w-md mb-4">
          {description}
        </p>
      )}
      
      {action && (
        <Button onClick={action.onClick} className="mt-2">
          {action.icon && <action.icon className="h-4 w-4 mr-2" />}
          {action.label}
        </Button>
      )}
    </div>
  )
}
