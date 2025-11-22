'use client'

import { type ReactNode } from 'react'
import { Plus, RefreshCw, type LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

import { Button, type ButtonProps } from './Button'

type QuickActionsProps = {
  onAdd?: () => void
  onRefresh?: () => void
  addLabel?: string
  addIcon?: LucideIcon
  showRefresh?: boolean
  children?: ReactNode
  className?: string
}

type QuickActionButtonProps = {
  icon?: LucideIcon
  label: ReactNode
  onClick?: () => void
  variant?: ButtonProps['variant']
  className?: string
}

export function QuickActions({
  onAdd,
  onRefresh,
  addLabel = 'Ajouter',
  addIcon = Plus,
  showRefresh = true,
  children,
  className,
}: QuickActionsProps) {
  const AddIcon = addIcon

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {children}

      {onAdd && (
        <Button onClick={onAdd} className="bg-blue-600 hover:bg-blue-700 transition-smooth">
          <AddIcon className="w-4 h-4 mr-2" />
          {addLabel}
        </Button>
      )}

      {showRefresh && onRefresh && (
        <Button
          variant="outline"
          onClick={onRefresh}
          className="transition-smooth hover-lift"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualiser
        </Button>
      )}
    </div>
  )
}

export function QuickActionButton({
  icon: Icon,
  label,
  onClick,
  variant = 'outline',
  className,
}: QuickActionButtonProps) {
  return (
    <Button
      variant={variant}
      onClick={onClick}
      className={cn('transition-smooth hover-lift', className)}
    >
      {Icon && <Icon className="w-4 h-4 mr-2" />}
      {label}
    </Button>
  )
}

export default QuickActions
