'use client'

import { useDashboardCounters } from '@/hooks/use-api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { Users, CheckSquare, Calendar, TrendingUp, AlertCircle, Bell } from 'lucide-react'

export default function DashboardPage() {
  const { data: counters, isLoading } = useDashboardCounters()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Tableau de bord</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Tableau de bord</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Clients */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counters?.clients.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {counters?.clients.active || 0} actifs, {counters?.clients.prospects || 0} prospects
            </p>
          </CardContent>
        </Card>

        {/* Tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tâches</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counters?.tasks.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {counters?.tasks.overdue || 0} en retard, {counters?.tasks.today || 0} aujourd'hui
            </p>
          </CardContent>
        </Card>

        {/* Appointments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rendez-vous</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counters?.appointments.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {counters?.appointments.today || 0} aujourd'hui
            </p>
          </CardContent>
        </Card>

        {/* Opportunities */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Opportunités</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counters?.opportunities.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {counters?.opportunities.qualified || 0} qualifiées
            </p>
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertes</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counters?.alerts.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {counters?.alerts.kycExpiring || 0} KYC à renouveler
            </p>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notifications</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counters?.notifications.unread || 0}</div>
            <p className="text-xs text-muted-foreground">Non lues</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
