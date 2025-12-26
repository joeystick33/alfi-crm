'use client'

import type { ElementType } from 'react'
import { Users, UserCheck, UserPlus, AlertTriangle } from 'lucide-react'
import { Card } from '@/app/_common/components/ui/Card'
import { useDashboardCounters } from '@/app/_common/hooks/api/use-dashboard-api'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import { cn } from '@/app/_common/lib/utils'

interface StatCardProps {
  label: string
  value: number
  icon: ElementType
  trend?: {
    value: number
    isPositive: boolean
  }
  color: 'indigo' | 'emerald' | 'amber' | 'rose'
  isLoading?: boolean
}

function StatCard({ label, value, icon: Icon, color, isLoading }: StatCardProps) {
  const colorStyles = {
    indigo: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-600',
      border: 'border-indigo-100',
    },
    emerald: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-100',
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      border: 'border-amber-100',
    },
    rose: {
      bg: 'bg-rose-50',
      text: 'text-rose-600',
      border: 'border-rose-100',
    },
  }

  const style = colorStyles[color]

  if (isLoading) {
    return (
      <Card className="p-4 border border-gray-100">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-6 w-12" />
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className={cn("p-4 border transition-all duration-200 hover:shadow-md", style.border)}>
      <div className="flex items-center gap-4">
        <div className={cn("p-2.5 rounded-xl", style.bg)}>
          <Icon className={cn("h-5 w-5", style.text)} />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900 tracking-tight">
              {value.toLocaleString('fr-FR')}
            </span>
          </div>
        </div>
      </div>
    </Card>
  )
}

export function ClientStatsCards() {
  const { data: counters, isLoading } = useDashboardCounters()

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Total Clients"
        value={counters?.clients.total || 0}
        icon={Users}
        color="indigo"
        isLoading={isLoading}
      />
      <StatCard
        label="Clients Actifs"
        value={counters?.clients.active || 0}
        icon={UserCheck}
        color="emerald"
        isLoading={isLoading}
      />
      <StatCard
        label="Prospects"
        value={counters?.clients.prospects || 0}
        icon={UserPlus}
        color="amber"
        isLoading={isLoading}
      />
      <StatCard
        label="KYC à revoir"
        value={counters?.alerts.kycExpiring || 0}
        icon={AlertTriangle}
        color="rose"
        isLoading={isLoading}
      />
    </div>
  )
}
