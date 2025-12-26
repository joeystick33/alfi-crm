'use client'

/**
 * Squelettes de chargement pour les tabs Client360
 * Provides consistent loading states for all tabs
 * 
 * **Feature: client360-evolution**
 * **Validates: Requirements 15.2**
 */

import { cn } from '@/app/_common/lib/utils'

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse rounded bg-gray-200', className)} />
  )
}

export function KPICardSkeleton() {
  return (
    <div className="border border-gray-200 bg-white rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <Skeleton className="h-5 w-5 rounded" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="h-8 w-20 mb-1" />
      <Skeleton className="h-3 w-16" />
    </div>
  )
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('border border-gray-200 bg-white rounded-lg p-4', className)}>
      <Skeleton className="h-5 w-32 mb-4" />
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
    </div>
  )
}

export function ChartSkeleton({ height = 'h-64' }: { height?: string }) {
  return (
    <div className={cn('border border-gray-200 bg-white rounded-lg p-4', height)}>
      <Skeleton className="h-5 w-40 mb-4" />
      <Skeleton className="h-full w-full rounded" />
    </div>
  )
}


// ============================================================================
// Tab-specific Skeletons
// ============================================================================

export function TabOverviewSkeleton() {
  return (
    <div className="space-y-6">
      {/* Patrimony Summary with Donut Chart */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="border border-gray-200 bg-white rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-5 w-40" />
            <div className="text-right">
              <Skeleton className="h-8 w-32 mb-1" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <Skeleton className="h-64 w-64 rounded-full mx-auto" />
        </div>
        <div className="grid gap-4 grid-cols-2">
          {[1, 2, 3, 4].map(i => <KPICardSkeleton key={i} />)}
        </div>
      </div>
      {/* Evolution Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
      {/* Alerts */}
      <CardSkeleton className="h-32" />
    </div>
  )
}

export function TabProfileSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-7 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
      {/* Identity Card */}
      <div className="border border-gray-200 bg-white rounded-lg p-6">
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i}>
              <Skeleton className="h-3 w-20 mb-1" />
              <Skeleton className="h-5 w-32" />
            </div>
          ))}
        </div>
      </div>
      {/* Legal Rights */}
      <CardSkeleton />
    </div>
  )
}


export function TabFamilySkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-10 w-40 rounded-lg" />
      </div>
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => <KPICardSkeleton key={i} />)}
      </div>
      {/* Members */}
      <div className="border border-gray-200 bg-white rounded-lg p-4">
        <Skeleton className="h-5 w-32 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function TabPatrimoineSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-7 w-40 mb-2" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-28 rounded-lg" />
          <Skeleton className="h-10 w-28 rounded-lg" />
        </div>
      </div>
      {/* Summary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <KPICardSkeleton key={i} />)}
      </div>
      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartSkeleton height="h-80" />
        <ChartSkeleton height="h-80" />
      </div>
      {/* Assets List */}
      <CardSkeleton className="h-64" />
    </div>
  )
}

export function TabBudgetSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-7 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <KPICardSkeleton key={i} />)}
      </div>
      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-2">
        {[1, 2, 3, 4, 5].map(i => (
          <Skeleton key={i} className="h-8 w-24 rounded" />
        ))}
      </div>
      {/* Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CardSkeleton className="h-64" />
        <ChartSkeleton height="h-64" />
      </div>
    </div>
  )
}


export function TabTaxationSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Skeleton className="h-7 w-40 mb-2" />
        <Skeleton className="h-4 w-56" />
      </div>
      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-2">
        {[1, 2].map(i => (
          <Skeleton key={i} className="h-8 w-32 rounded" />
        ))}
      </div>
      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2].map(i => (
          <div key={i} className="border border-gray-200 bg-white rounded-lg p-6">
            <Skeleton className="h-5 w-40 mb-4" />
            <Skeleton className="h-12 w-32 mb-4" />
            <div className="space-y-2">
              {[1, 2, 3].map(j => (
                <div key={j} className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {/* Simulation */}
      <CardSkeleton className="h-48" />
    </div>
  )
}

export function TabContractsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-10 w-36 rounded-lg" />
      </div>
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => <KPICardSkeleton key={i} />)}
      </div>
      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-2">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-8 w-24 rounded" />
        ))}
      </div>
      {/* Contracts */}
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="border border-gray-200 bg-white rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded" />
                <div>
                  <Skeleton className="h-4 w-40 mb-1" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <div className="text-right">
                <Skeleton className="h-5 w-24 mb-1" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


export function TabDocumentsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-7 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-40 rounded-lg" />
      </div>
      {/* KYC Status */}
      <div className="border border-gray-200 bg-white rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <Skeleton className="h-3 w-full rounded-full" />
      </div>
      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-2">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-8 w-28 rounded" />
        ))}
      </div>
      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="border border-gray-200 bg-white rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <Skeleton className="h-10 w-10 rounded" />
              <div className="flex-1">
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function TabKYCSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <Skeleton className="h-7 w-48" />
      {/* Progress */}
      <div className="border border-gray-200 bg-white rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-12" />
        </div>
        <Skeleton className="h-3 w-full rounded-full" />
      </div>
      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-2">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-8 w-28 rounded" />
        ))}
      </div>
      {/* Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2].map(i => (
          <div key={i} className="border border-gray-200 bg-white rounded-lg p-4">
            <Skeleton className="h-5 w-32 mb-4" />
            <div className="space-y-3">
              {[1, 2, 3].map(j => (
                <div key={j} className="flex justify-between items-center">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


export function TabObjectivesSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-7 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24 rounded-lg" />
          <Skeleton className="h-10 w-28 rounded-lg" />
        </div>
      </div>
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <KPICardSkeleton key={i} />)}
      </div>
      {/* Objectives List */}
      <div className="border border-gray-200 bg-white rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-5 w-6 rounded-full" />
        </div>
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="p-4 bg-gray-50 rounded-lg space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div>
                  <Skeleton className="h-4 w-40 mb-1" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {[1, 2, 3, 4].map(j => (
                  <div key={j}>
                    <Skeleton className="h-3 w-16 mb-1" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
              <Skeleton className="h-3 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>
      {/* Timeline */}
      <CardSkeleton className="h-48" />
    </div>
  )
}

export function TabOpportunitiesSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-7 w-40 mb-2" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-10 w-36 rounded-lg" />
      </div>
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => <KPICardSkeleton key={i} />)}
      </div>
      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-2">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-8 w-32 rounded" />
        ))}
      </div>
      {/* Opportunities */}
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="border border-gray-200 bg-white rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded" />
                <div>
                  <Skeleton className="h-5 w-48 mb-1" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  )
}


export function TabActivitesSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-7 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-28 rounded-lg" />
          <Skeleton className="h-10 w-36 rounded-lg" />
        </div>
      </div>
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <KPICardSkeleton key={i} />)}
      </div>
      {/* Filters */}
      <div className="border border-gray-200 bg-white rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-8 w-20 rounded" />
          ))}
        </div>
      </div>
      {/* Timeline */}
      <div className="border border-gray-200 bg-white rounded-lg p-4">
        <Skeleton className="h-5 w-40 mb-6" />
        <div className="space-y-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-12 w-12 rounded-full shrink-0" />
              <div className="flex-1 border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <Skeleton className="h-5 w-48 mb-2" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                  <div className="text-right">
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <Skeleton className="h-4 w-full mt-3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function TabParametresSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Skeleton className="h-7 w-40 mb-2" />
        <Skeleton className="h-4 w-56" />
      </div>
      {/* Sections */}
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="border border-gray-200 bg-white rounded-lg p-6">
          <Skeleton className="h-5 w-40 mb-4" />
          <div className="space-y-4">
            {[1, 2, 3].map(j => (
              <div key={j} className="flex items-center justify-between">
                <div>
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-10 w-32 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}


export function TabTimelineSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-7 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-36 rounded-lg" />
      </div>
      {/* Timeline */}
      <div className="border border-gray-200 bg-white rounded-lg p-6">
        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-px bg-gray-200" />
          <div className="space-y-8">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-12 w-12 rounded-full shrink-0 relative z-10" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-48 mb-2" />
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function TabSyntheseSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-7 w-40 mb-2" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-28 rounded-lg" />
          <Skeleton className="h-10 w-28 rounded-lg" />
        </div>
      </div>
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <KPICardSkeleton key={i} />)}
      </div>
      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartSkeleton height="h-80" />
        <ChartSkeleton height="h-80" />
      </div>
      {/* Summary */}
      <CardSkeleton className="h-48" />
    </div>
  )
}

export function TabWealthSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-7 w-40 mb-2" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-28 rounded-lg" />
          <Skeleton className="h-10 w-28 rounded-lg" />
        </div>
      </div>
      {/* Summary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <KPICardSkeleton key={i} />)}
      </div>
      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-2">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-8 w-28 rounded" />
        ))}
      </div>
      {/* Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartSkeleton height="h-80" />
        <CardSkeleton className="h-80" />
      </div>
    </div>
  )
}

// Generic tab skeleton for fallback
export function TabGenericSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-7 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <KPICardSkeleton key={i} />)}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <CardSkeleton className="h-64" />
        <CardSkeleton className="h-64" />
      </div>
      <CardSkeleton className="h-48" />
    </div>
  )
}

// Re-export Skeleton for convenience
export { Skeleton }
