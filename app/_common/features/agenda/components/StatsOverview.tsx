import { Users, Layers, Clock3, CheckCircle2 } from 'lucide-react'
import { Card, CardContent } from '@/app/_common/components/ui/Card'
import { cn } from '@/app/_common/lib/utils'

interface StatConfig {
  label: string
  value: string
  icon: typeof Users
  badgeClassName: string
}

export interface StatsOverviewProps {
  todayCount: number
  weekCount: number
  pendingCount: number
  attendanceRate: number | null
}

const statsConfig = ({ todayCount, weekCount, pendingCount, attendanceRate }: StatsOverviewProps): StatConfig[] => [
  {
    label: "Aujourd'hui",
    value: `${todayCount} RDV`,
    icon: Users,
    badgeClassName: 'bg-blue-100 text-blue-600',
  },
  {
    label: 'Cette semaine',
    value: `${weekCount} RDV`,
    icon: Layers,
    badgeClassName: 'bg-slate-100 text-slate-600',
  },
  {
    label: 'En attente',
    value: pendingCount.toString(),
    icon: Clock3,
    badgeClassName: 'bg-amber-100 text-amber-600',
  },
  {
    label: 'Taux de présence',
    value: attendanceRate !== null ? `${attendanceRate}%` : '—',
    icon: CheckCircle2,
    badgeClassName: 'bg-emerald-100 text-emerald-600',
  },
]

export function StatsOverview(props: StatsOverviewProps) {
  const stats = statsConfig(props)

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
          <CardContent className="p-6 text-slate-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">{stat.label}</p>
                <p className="mt-2 text-2xl font-semibold">{stat.value}</p>
              </div>
              <div className={cn('rounded-2xl p-3', stat.badgeClassName)}>
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
