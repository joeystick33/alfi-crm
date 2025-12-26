/**
 * Loading State Component
 * Reusable loading states with skeletons
 */

import React from 'react'
import { Skeleton } from './Skeleton'
import { Loader2 } from 'lucide-react'
import { cn } from '@/app/_common/lib/utils'

interface LoadingStateProps {
  variant?: 'cards' | 'table' | 'list' | 'form' | 'spinner'
  count?: number
  className?: string
  message?: string
}

export function LoadingState({
  variant = 'spinner',
  count = 3,
  className,
  message,
}: LoadingStateProps) {
  if (variant === 'spinner') {
    return (
      <div className={cn('flex flex-col items-center justify-center py-16', className)}>
        <div className="p-4 bg-gray-100 rounded-2xl mb-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
        {message && (
          <p className="text-sm text-gray-500">{message}</p>
        )}
      </div>
    )
  }

  if (variant === 'cards') {
    return (
      <div className={cn('grid gap-4 md:grid-cols-2 lg:grid-cols-3', className)}>
        {[...Array(count)].map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <div className="space-y-2 pt-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
            <div className="pt-3 border-t border-gray-100">
              <Skeleton className="h-5 w-24" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (variant === 'table') {
    return (
      <div className={cn('space-y-3', className)}>
        {/* Table header */}
        <div className="flex gap-4 pb-3 border-b">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
        </div>
        {/* Table rows */}
        {[...Array(count)].map((_, i) => (
          <div key={i} className="flex gap-4 py-3 border-b">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    )
  }

  if (variant === 'list') {
    return (
      <div className={cn('bg-white border border-gray-200 rounded-xl overflow-hidden', className)}>
        {[...Array(count)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-gray-100 last:border-b-0">
            <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-56" />
            </div>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
    )
  }

  if (variant === 'form') {
    return (
      <div className={cn('space-y-6', className)}>
        {[...Array(count)].map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    )
  }

  return null
}

/**
 * Inline loading spinner for buttons and small areas
 */
export function InlineLoader({ className }: { className?: string }) {
  return (
    <Loader2 className={cn('h-4 w-4 animate-spin', className)} />
  )
}
