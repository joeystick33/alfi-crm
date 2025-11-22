'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDashboardCounters } from '@/hooks/use-api'
import { ErrorState, getErrorVariant } from '@/components/ui/ErrorState'
import { Sparkles, RefreshCw, Users, Calendar, CheckSquare, AlertCircle, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { cn } from '@/lib/utils'
import TodayWidget from '@/components/dashboard/TodayWidget'
import TasksWidget from '@/components/dashboard/TasksWidget'
import OpportunitiesWidget from '@/components/dashboard/OpportunitiesWidget'
import AlertsWidget from '@/components/dashboard/AlertsWidget'
import EmailsWidget from '@/components/dashboard/EmailsWidget'
import CelebrationsWidget from '@/components/dashboard/CelebrationsWidget'

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
        <ErrorState
          error={error as Error}
          variant={getErrorVariant(error as Error)}
          onRetry={() => refetch()}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8 container mx-auto max-w-[1600px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Tableau de Bord
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Vue d'ensemble • {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
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

      {/* KPIs - Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard 
          title="Clients Actifs" 
          value={counters?.clients?.active || 0} 
          icon={Users}
          subtitle={`${counters?.clients?.prospects || 0} prospects`}
          onClick={() => handleCardClick('/dashboard/clients')}
        />
        <KpiCard 
          title="Tâches du jour" 
          value={counters?.tasks?.today || 0} 
          icon={CheckSquare}
          subtitle={`${counters?.tasks?.overdue || 0} en retard`}
          variant={counters?.tasks?.overdue ? "warning" : "default"}
          onClick={() => handleCardClick('/dashboard/taches')}
        />
        <KpiCard 
          title="Rendez-vous" 
          value={counters?.appointments?.today || 0} 
          icon={Calendar}
          subtitle="Aujourd'hui"
          onClick={() => handleCardClick('/dashboard/agenda')}
        />
        <KpiCard 
          title="Alertes" 
          value={counters?.alerts?.total || 0} 
          icon={AlertCircle}
          subtitle="Nécessitent attention"
          variant={counters?.alerts?.total ? "destructive" : "default"}
          onClick={() => router.push('/dashboard/reclamations')} // Ou page alertes dédiée
        />
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Zone (Priority: Comms & Agenda) - 2/3 */}
        <div className="xl:col-span-2 space-y-6">
           {/* Emails Widget */}
           <div className="h-[500px]">
              <EmailsWidget />
           </div>
           
           {/* Agenda & Tasks Row */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <TodayWidget />
              <TasksWidget className="" onTaskUpdate={() => {}} />
           </div>

           {/* Opportunities - Full width in main column */}
           <OpportunitiesWidget />
        </div>

        {/* Right Zone (Context: Celebrations, Alerts) - 1/3 */}
        <div className="space-y-6">
           <CelebrationsWidget />
           <AlertsWidget />
           
           {/* Mini Stats / Secondary Info could go here */}
           <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 shadow-none">
             <CardContent className="p-4 flex items-center gap-4">
               <div className="p-2 bg-primary/20 rounded-full text-primary">
                 <TrendingUp className="h-5 w-5" />
               </div>
               <div>
                 <p className="text-sm font-medium text-primary-900 dark:text-primary-100">Performance</p>
                 <p className="text-xs text-primary-700 dark:text-primary-300">Votre activité est en hausse de 12% ce mois-ci.</p>
               </div>
             </CardContent>
           </Card>
        </div>
      </div>
    </div>
  )
}

function KpiCard({ title, value, icon: Icon, subtitle, variant = "default", onClick }: any) {
  const variants = {
    default: "bg-white dark:bg-gray-800 border-slate-200 dark:border-slate-700",
    warning: "bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800",
    destructive: "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800"
  }

  const iconColors = {
    default: "text-primary",
    warning: "text-amber-600 dark:text-amber-400",
    destructive: "text-red-600 dark:text-red-400"
  }

  return (
    <Card 
      className={cn(
        "shadow-sm hover:shadow-md transition-all cursor-pointer", 
        variants[variant as keyof typeof variants]
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-2xl font-bold mt-1">{value}</h3>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className={cn("p-2 rounded-lg bg-white/50 dark:bg-black/20", iconColors[variant as keyof typeof iconColors])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

