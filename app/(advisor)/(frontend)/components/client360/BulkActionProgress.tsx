'use client'

/**
 * BulkActionProgress Component
 * 
 * Displays progress indicators for bulk actions in Client360.
 * Shows progress bar, status messages, and completion state.
 * 
 * **Feature: client360-evolution**
 * **Validates: Requirements 15.3**
 */

import { useState, useCallback } from 'react'
import { CheckCircle, XCircle, Loader2, X, AlertTriangle } from 'lucide-react'
import { Button } from '@/app/_common/components/ui/Button'
import { Progress } from '@/app/_common/components/ui/Progress'
import { cn } from '@/app/_common/lib/utils'

export type BulkActionStatus = 'idle' | 'running' | 'completed' | 'error' | 'cancelled'

export interface BulkActionItem {
  id: string
  label: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  error?: string
}

export interface BulkActionProgressProps {
  title: string
  items: BulkActionItem[]
  status: BulkActionStatus
  onCancel?: () => void
  onClose?: () => void
  onRetry?: () => void
  showDetails?: boolean
  className?: string
}

export function BulkActionProgress({
  title,
  items,
  status,
  onCancel,
  onClose,
  onRetry,
  showDetails = true,
  className,
}: BulkActionProgressProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const completedCount = items.filter(i => i.status === 'completed').length
  const errorCount = items.filter(i => i.status === 'error').length
  const totalCount = items.length
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0


  const getStatusIcon = () => {
    switch (status) {
      case 'running':
        return <Loader2 className="h-5 w-5 animate-spin text-primary" />
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-success" />
      case 'error':
        return <XCircle className="h-5 w-5 text-destructive" />
      case 'cancelled':
        return <AlertTriangle className="h-5 w-5 text-warning" />
      default:
        return null
    }
  }

  const getStatusMessage = () => {
    switch (status) {
      case 'running':
        return `Traitement en cours... (${completedCount}/${totalCount})`
      case 'completed':
        return errorCount > 0
          ? `Terminé avec ${errorCount} erreur(s)`
          : 'Terminé avec succès'
      case 'error':
        return 'Une erreur est survenue'
      case 'cancelled':
        return 'Opération annulée'
      default:
        return ''
    }
  }

  const getProgressVariant = () => {
    if (status === 'error' || errorCount > 0) return 'destructive'
    if (status === 'completed') return 'success'
    return 'default'
  }

  if (status === 'idle') return null

  return (
    <div className={cn(
      'fixed bottom-4 right-4 z-50 w-96 bg-background border rounded-lg shadow-lg overflow-hidden',
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-muted/50">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="font-medium text-sm">{title}</span>
        </div>
        <div className="flex items-center gap-1">
          {status === 'running' && onCancel && (
            <Button variant="ghost" size="sm" onClick={onCancel}>
              Annuler
            </Button>
          )}
          {(status === 'completed' || status === 'error' || status === 'cancelled') && onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Progress */}
      <div className="p-3 space-y-2">
        <Progress value={progress} className="h-2" />
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{getStatusMessage()}</span>
          <span className="font-medium">{Math.round(progress)}%</span>
        </div>
      </div>

      {/* Details */}
      {showDetails && items.length > 0 && (
        <div className="border-t">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full px-3 py-2 text-sm text-muted-foreground hover:bg-muted/50 flex items-center justify-between"
          >
            <span>Détails ({completedCount}/{totalCount})</span>
            <span>{isExpanded ? '▲' : '▼'}</span>
          </button>
          
          {isExpanded && (
            <div className="max-h-48 overflow-y-auto px-3 pb-3 space-y-1">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-1 text-sm"
                >
                  <span className={cn(
                    'truncate flex-1',
                    item.status === 'error' && 'text-destructive'
                  )}>
                    {item.label}
                  </span>
                  <ItemStatusIcon status={item.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Retry button for errors */}
      {status === 'error' && onRetry && (
        <div className="p-3 border-t bg-muted/50">
          <Button onClick={onRetry} variant="outline" size="sm" className="w-full">
            Réessayer
          </Button>
        </div>
      )}
    </div>
  )
}

function ItemStatusIcon({ status }: { status: BulkActionItem['status'] }) {
  switch (status) {
    case 'completed':
      return <CheckCircle className="h-4 w-4 text-success shrink-0" />
    case 'error':
      return <XCircle className="h-4 w-4 text-destructive shrink-0" />
    case 'processing':
      return <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
    default:
      return <div className="h-4 w-4 rounded-full border-2 border-muted shrink-0" />
  }
}


/**
 * Hook for managing bulk action state
 */
export function useBulkAction<T extends { id: string }>(
  items: T[],
  getLabel: (item: T) => string
) {
  const [status, setStatus] = useState<BulkActionStatus>('idle')
  const [actionItems, setActionItems] = useState<BulkActionItem[]>([])
  const [isCancelled, setIsCancelled] = useState(false)

  const start = useCallback(() => {
    setStatus('running')
    setIsCancelled(false)
    setActionItems(items.map(item => ({
      id: item.id,
      label: getLabel(item),
      status: 'pending',
    })))
  }, [items, getLabel])

  const updateItem = useCallback((id: string, itemStatus: BulkActionItem['status'], error?: string) => {
    setActionItems(prev => prev.map(item =>
      item.id === id ? { ...item, status: itemStatus, error } : item
    ))
  }, [])

  const complete = useCallback(() => {
    setStatus('completed')
  }, [])

  const fail = useCallback(() => {
    setStatus('error')
  }, [])

  const cancel = useCallback(() => {
    setIsCancelled(true)
    setStatus('cancelled')
  }, [])

  const reset = useCallback(() => {
    setStatus('idle')
    setActionItems([])
    setIsCancelled(false)
  }, [])

  const processItems = useCallback(async (
    processor: (item: T) => Promise<void>,
    options?: { onProgress?: (completed: number, total: number) => void }
  ) => {
    start()
    let completed = 0
    let hasError = false

    for (const item of items) {
      if (isCancelled) break

      updateItem(item.id, 'processing')
      
      try {
        await processor(item)
        updateItem(item.id, 'completed')
        completed++
      } catch (error) {
        updateItem(item.id, 'error', error instanceof Error ? error.message : 'Unknown error')
        hasError = true
      }

      options?.onProgress?.(completed, items.length)
    }

    if (isCancelled) {
      setStatus('cancelled')
    } else if (hasError) {
      setStatus('error')
    } else {
      setStatus('completed')
    }
  }, [items, isCancelled, start, updateItem])

  return {
    status,
    items: actionItems,
    start,
    updateItem,
    complete,
    fail,
    cancel,
    reset,
    processItems,
    isCancelled,
  }
}

/**
 * Inline progress indicator for smaller bulk actions
 */
export function InlineProgress({
  current,
  total,
  label,
  className,
}: {
  current: number
  total: number
  label?: string
  className?: string
}) {
  const progress = total > 0 ? (current / total) * 100 : 0

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
      <div className="flex-1 min-w-0">
        <Progress value={progress} className="h-1.5" />
      </div>
      <span className="text-sm text-muted-foreground shrink-0">
        {label || `${current}/${total}`}
      </span>
    </div>
  )
}

/**
 * Toast-style progress notification
 */
export function ProgressToast({
  title,
  current,
  total,
  status,
  onClose,
}: {
  title: string
  current: number
  total: number
  status: BulkActionStatus
  onClose?: () => void
}) {
  const progress = total > 0 ? (current / total) * 100 : 0

  return (
    <div className="flex items-center gap-3 p-3 bg-background border rounded-lg shadow-md min-w-64">
      {status === 'running' ? (
        <Loader2 className="h-5 w-5 animate-spin text-primary shrink-0" />
      ) : status === 'completed' ? (
        <CheckCircle className="h-5 w-5 text-success shrink-0" />
      ) : (
        <XCircle className="h-5 w-5 text-destructive shrink-0" />
      )}
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{title}</p>
        <div className="flex items-center gap-2 mt-1">
          <Progress value={progress} className="h-1.5 flex-1" />
          <span className="text-xs text-muted-foreground">{Math.round(progress)}%</span>
        </div>
      </div>

      {onClose && status !== 'running' && (
        <Button variant="ghost" size="sm" onClick={onClose} className="shrink-0">
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}

export default BulkActionProgress
