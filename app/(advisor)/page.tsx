'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDashboardCounters } from '@/hooks/use-api'
import { ErrorState, getErrorVariant } from '@/components/ui/ErrorState'
import { Users, CheckSquare, Calendar, TrendingUp, AlertCircle, Bell, Sparkles, RefreshCw } from 'lucide-react'
import { BentoGrid } from '@/components/ui/BentoGrid'
import { BentoCard, BentoCardHeader, BentoCardTitle, BentoCardContent } from '@/components/ui/BentoCard'
import { BentoSkeleton } from '@/components/ui/BentoSkeleton'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import TodayWidget from '@/components/dashboard/TodayWidget'
import TasksWidget from '@/components/dashboard/TasksWidget'
import CalendarCentralWidget from '@/components/dashboard/CalendarCentralWidget'
import OpportunitiesWidget from '@/components/dashboard/OpportunitiesWidget'
import AlertsWidget from '@/components/dashboard/AlertsWidget'

export default function DashboardPage() {
  const router = useRouter()
  const [lastFetch, setLastFetch] = useState(Date.now())
  const { data: counters, isLoading, isError, error, refetch } = useDashboardCounters()

  const handleRefresh = async () => {
    await refetch()
    setLastFetch(Date.now())
  }

  const handleCardClick = (route: string) => {
    router.push(route)
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-primary/80 shadow-lg">
              <Sparkles className="h-5 w-5 text-white" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Tableau de Bord
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Vue d'ensemble de votre activité
              </p>
            </div>
          </div>
        </div>
        <ErrorState
          error={error as Error}
          variant={getErrorVariant(error as Error)}
          onRetry={() => refetch()}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-primary/80 shadow-lg">
            <Sparkles className="h-5 w-5 text-white" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Tableau de Bord
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Vue d'ensemble de votre activité
              {lastFetch && (
                <span className="ml-2">
                  • Mis à jour {new Date(lastFetch).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </p>
          </div>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
          Actualiser
        </Button>
      </div>

      {/* Bento Grid KPIs - Asymmetric Layout */}
      <section aria-label="Statistiques rapides" aria-live="polite" aria-busy={isLoading}>
        {isLoading ? (
          <BentoGrid cols={{ mobile: 1, tablet: 4, desktop: 6 }}>
            <BentoSkeleton span={{ cols: 2, rows: 2 }} variant="kpi" />
            <BentoSkeleton span={{ cols: 2, rows: 1 }} variant="kpi" />
            <BentoSkeleton span={{ cols: 2, rows: 1 }} variant="kpi" />
            <BentoSkeleton span={{ cols: 2, rows: 1 }} variant="kpi" />
            <BentoSkeleton span={{ cols: 2, rows: 1 }} variant="kpi" />
            <BentoSkeleton span={{ cols: 2, rows: 1 }} variant="kpi" />
          </BentoGrid>
        ) : (
          <BentoGrid cols={{ mobile: 1, tablet: 4, desktop: 6 }}>
            {/* Hero Card - Clients (2x2) */}
            <BentoCard
              span={{ cols: 2, rows: 2 }}
              variant="hero"
              hoverable
              onClick={() => handleCardClick('/dashboard/clients')}
              aria-label={`Clients: ${counters?.clients.total || 0} total, ${counters?.clients.active || 0} actifs, ${counters?.clients.prospects || 0} prospects`}
            >
              <BentoCardHeader>
                <div className="flex items-center justify-between">
                  <BentoCardTitle className="text-base">Clients</BentoCardTitle>
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Users className="h-5 w-5 text-primary" aria-hidden="true" />
                  </div>
                </div>
              </BentoCardHeader>
              <BentoCardContent>
                <div className="space-y-4">
                  <div className="text-5xl font-bold text-gray-900 dark:text-white">
                    {counters?.clients.total || 0}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Actifs</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {counters?.clients.active || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Prospects</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {counters?.clients.prospects || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </BentoCardContent>
            </BentoCard>

            {/* Tasks Card (2x1) */}
            <BentoCard
              span={{ cols: 2, rows: 1 }}
              variant="default"
              hoverable
              onClick={() => handleCardClick('/dashboard/taches')}
              aria-label={`Tâches: ${counters?.tasks.total || 0} total, ${counters?.tasks.overdue || 0} en retard, ${counters?.tasks.today || 0} aujourd'hui`}
            >
              <BentoCardHeader>
                <div className="flex items-center justify-between">
                  <BentoCardTitle className="text-sm">Tâches</BentoCardTitle>
                  <CheckSquare className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                </div>
              </BentoCardHeader>
              <BentoCardContent>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {counters?.tasks.total || 0}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {counters?.tasks.overdue || 0} en retard • {counters?.tasks.today || 0} aujourd'hui
                </p>
              </BentoCardContent>
            </BentoCard>

            {/* Appointments Card (2x1) */}
            <BentoCard
              span={{ cols: 2, rows: 1 }}
              variant="default"
              hoverable
              onClick={() => handleCardClick('/dashboard/agenda')}
              aria-label={`Rendez-vous: ${counters?.appointments.total || 0} total, ${counters?.appointments.today || 0} aujourd'hui`}
            >
              <BentoCardHeader>
                <div className="flex items-center justify-between">
                  <BentoCardTitle className="text-sm">Rendez-vous</BentoCardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                </div>
              </BentoCardHeader>
              <BentoCardContent>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {counters?.appointments.total || 0}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {counters?.appointments.today || 0} aujourd'hui
                </p>
              </BentoCardContent>
            </BentoCard>

            {/* Opportunities Card (2x1) */}
            <BentoCard
              span={{ cols: 2, rows: 1 }}
              variant="accent"
              hoverable
              onClick={() => handleCardClick('/dashboard/opportunites')}
              aria-label={`Opportunités: ${counters?.opportunities.total || 0} total, ${counters?.opportunities.qualified || 0} qualifiées`}
            >
              <BentoCardHeader>
                <div className="flex items-center justify-between">
                  <BentoCardTitle className="text-sm">Opportunités</BentoCardTitle>
                  <TrendingUp className="h-4 w-4 text-accent" aria-hidden="true" />
                </div>
              </BentoCardHeader>
              <BentoCardContent>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {counters?.opportunities.total || 0}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {counters?.opportunities.qualified || 0} qualifiées
                </p>
              </BentoCardContent>
            </BentoCard>

            {/* Alerts Card (2x1) */}
            <BentoCard
              span={{ cols: 2, rows: 1 }}
              variant="default"
              hoverable
              aria-label={`Alertes: ${counters?.alerts.total || 0} total, ${counters?.alerts.kycExpiring || 0} KYC à renouveler`}
            >
              <BentoCardHeader>
                <div className="flex items-center justify-between">
                  <BentoCardTitle className="text-sm">Alertes</BentoCardTitle>
                  <AlertCircle className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                </div>
              </BentoCardHeader>
              <BentoCardContent>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {counters?.alerts.total || 0}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {counters?.alerts.kycExpiring || 0} KYC à renouveler
                </p>
              </BentoCardContent>
            </BentoCard>

            {/* Notifications Card (2x1) */}
            <BentoCard
              span={{ cols: 2, rows: 1 }}
              variant="default"
              hoverable
              aria-label={`Notifications: ${counters?.notifications.unread || 0} non lues`}
            >
              <BentoCardHeader>
                <div className="flex items-center justify-between">
                  <BentoCardTitle className="text-sm">Notifications</BentoCardTitle>
                  <Bell className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                </div>
              </BentoCardHeader>
              <BentoCardContent>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {counters?.notifications.unread || 0}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Non lues
                </p>
              </BentoCardContent>
            </BentoCard>
          </BentoGrid>
        )}
      </section>

      {/* Main Content Grid - Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column - Today & Tasks */}
        <div className="lg:col-span-3 space-y-6">
          <TodayWidget />
          <TasksWidget className="" onTaskUpdate={() => {}} />
        </div>

        {/* Center Column - Calendar & Opportunities */}
        <div className="lg:col-span-6 space-y-6">
          <CalendarCentralWidget />
          <OpportunitiesWidget />
        </div>

        {/* Right Column - Alerts */}
        <div className="lg:col-span-3">
          <AlertsWidget />
        </div>
      </div>
    </div>
  )
}
