'use client'

import * as React from 'react'
import { AlertTriangle, Info, CheckCircle } from 'lucide-react'
import { cn } from '@/app/_common/lib/utils'
import { Button } from './Button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './Dialog'

// ============================================================================
// Confirm Dialog Component
// ============================================================================

type ConfirmDialogVariant = 'danger' | 'warning' | 'info' | 'success'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void | Promise<void>
  onCancel?: () => void
  variant?: ConfirmDialogVariant
  loading?: boolean
}

const variantConfig: Record<ConfirmDialogVariant, {
  icon: React.ElementType
  iconBg: string
  iconColor: string
  buttonClass: string
}> = {
  danger: {
    icon: AlertTriangle,
    iconBg: 'bg-rose-100',
    iconColor: 'text-rose-600',
    buttonClass: 'bg-rose-600 hover:bg-rose-700 text-white',
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    buttonClass: 'bg-amber-600 hover:bg-amber-700 text-white',
  },
  info: {
    icon: Info,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    buttonClass: 'bg-blue-600 hover:bg-blue-700 text-white',
  },
  success: {
    icon: CheckCircle,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    buttonClass: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  },
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  onConfirm,
  onCancel,
  variant = 'danger',
  loading = false,
}: ConfirmDialogProps) {
  const config = variantConfig[variant]
  const Icon = config.icon

  const handleConfirm = async () => {
    await onConfirm()
    onOpenChange(false)
  }

  const handleCancel = () => {
    onCancel?.()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent role="alertdialog" aria-modal="true">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <div className={cn('p-3 rounded-full', config.iconBg)}>
              <Icon className={cn('h-6 w-6', config.iconColor)} aria-hidden="true" />
            </div>
            <div className="flex-1">
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription className="mt-2">
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleCancel}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            className={config.buttonClass}
            onClick={handleConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================================
// useConfirmDialog Hook
// ============================================================================

interface ConfirmDialogState {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  cancelLabel: string
  variant: ConfirmDialogVariant
  onConfirm: () => void | Promise<void>
}

export function useConfirmDialog() {
  const [state, setState] = React.useState<ConfirmDialogState>({
    open: false,
    title: '',
    description: '',
    confirmLabel: 'Confirmer',
    cancelLabel: 'Annuler',
    variant: 'danger',
    onConfirm: () => {},
  })
  const [loading, setLoading] = React.useState(false)

  const confirm = React.useCallback((options: {
    title: string
    description: string
    confirmLabel?: string
    cancelLabel?: string
    variant?: ConfirmDialogVariant
    onConfirm: () => void | Promise<void>
  }) => {
    setState({
      open: true,
      title: options.title,
      description: options.description,
      confirmLabel: options.confirmLabel || 'Confirmer',
      cancelLabel: options.cancelLabel || 'Annuler',
      variant: options.variant || 'danger',
      onConfirm: options.onConfirm,
    })
  }, [])

  const handleConfirm = React.useCallback(async () => {
    setLoading(true)
    try {
      await state.onConfirm()
    } finally {
      setLoading(false)
    }
  }, [state.onConfirm])

  const handleOpenChange = React.useCallback((open: boolean) => {
    setState(prev => ({ ...prev, open }))
  }, [])

  const ConfirmDialogComponent = React.useCallback(() => (
    <ConfirmDialog
      open={state.open}
      onOpenChange={handleOpenChange}
      title={state.title}
      description={state.description}
      confirmLabel={state.confirmLabel}
      cancelLabel={state.cancelLabel}
      variant={state.variant}
      onConfirm={handleConfirm}
      loading={loading}
    />
  ), [state, handleOpenChange, handleConfirm, loading])

  return {
    confirm,
    ConfirmDialog: ConfirmDialogComponent,
  }
}
