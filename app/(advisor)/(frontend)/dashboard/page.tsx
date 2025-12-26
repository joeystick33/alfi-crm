"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useDashboardCounters, useTeamStats } from '@/app/_common/hooks/api/use-dashboard-api'
import { useAuth } from '@/app/_common/hooks/use-auth'
import { useProfile } from '@/app/_common/hooks/api/use-profile-api'
import { ErrorState, getErrorVariant } from '@/app/_common/components/ui/ErrorState'
import { 
  RefreshCw, 
  Users, 
  Calendar, 
  CheckSquare, 
  AlertTriangle, 
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  ChevronRight,
  Clock,
  Target,
  Wallet,
  FileText,
  Bell,
  UserCog,
  Crown,
  Eye
} from 'lucide-react'
import { Button } from '@/app/_common/components/ui/Button'
import { Card, CardContent } from '@/app/_common/components/ui/Card'
import { Badge } from '@/app/_common/components/ui/Badge'
import { cn } from '@/app/_common/lib/utils'
import { Avatar } from '@/app/_common/components/ui/Avatar'
import TodayWidget from '@/app/(advisor)/(frontend)/components/dashboard/TodayWidget'
import TasksWidget from '@/app/(advisor)/(frontend)/components/dashboard/TasksWidget'
import OpportunitiesWidget from '@/app/(advisor)/(frontend)/components/dashboard/OpportunitiesWidget'
import AlertsWidget from '@/app/(advisor)/(frontend)/components/dashboard/AlertsWidget'
import CelebrationsWidget from '@/app/(advisor)/(frontend)/components/dashboard/CelebrationsWidget'
import AgendaMiniCalendar from '@/app/(advisor)/(frontend)/components/dashboard/AgendaMiniCalendar'

const EmailsWidget = dynamic(
  () => import('@/app/(advisor)/(frontend)/components/dashboard/EmailsWidget'),
  { ssr: false }
)

type DashboardView = 'personal' | 'team'

// Fonction pour obtenir le message de salutation
function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Bonjour'
  if (hour < 18) return 'Bon après-midi'
  return 'Bonsoir'
}

export default function DashboardPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { data: profile } = useProfile()
  const [lastFetch, setLastFetch] = useState(Date.now())
  const [dashboardView, setDashboardView] = useState<DashboardView>('personal')
  const [selectedAdvisorId, setSelectedAdvisorId] = useState<string | undefined>(undefined)
  
  const isAdmin = user?.role === 'ADMIN'
  const isAssistant = user?.role === 'ASSISTANT'
  
  // Fetch counters - for admins viewing team, we don't pass advisorId (cabinet-wide)
  // For personal view or non-admins, the API handles scoping
  const advisorIdForQuery = isAdmin && dashboardView === 'team' ? undefined : selectedAdvisorId
  const { data: counters, isLoading, isError, error, refetch } = useDashboardCounters(advisorIdForQuery)
  
  // Fetch team stats for admins
  const { data: teamStats } = useTeamStats({ enabled: isAdmin })
  
  const fullName = profile
    ? [profile.firstName, profile.lastName].filter(Boolean).join(' ')
    : [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Conseiller'
  const avatarSrc = profile?.avatar || null

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
    <div className="space-y-6 pb-8">
      {/* Hero Header - Inspiré Hubspot/Finary */}
      <header className="relative overflow-hidden rounded-2xl bg-white border border-gray-200/60 shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-[#7373FF]/5 via-white to-[#9b9bff]/5" />
        <div className="relative px-6 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Greeting */}
            <div className="flex items-center gap-4">
              <Avatar
                size="2xl"
                variant="gradient"
                src={avatarSrc}
                name={fullName}
                ring
                ringColor="primary"
                className="shadow-lg shadow-[#7373FF]/15"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                  {getGreeting()}, {fullName}
                </h1>
                <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5" />
                  {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  <span className="text-gray-300">•</span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Synchronisé
                  </span>
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              {/* View Toggle for Admins */}
              {isAdmin && (
                <div className="flex items-center bg-gray-100 rounded-lg p-0.5 mr-2">
                  <button
                    onClick={() => setDashboardView('personal')}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                      dashboardView === 'personal'
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    )}
                  >
                    <UserCog className="h-3.5 w-3.5" />
                    Mon activité
                  </button>
                  <button
                    onClick={() => setDashboardView('team')}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                      dashboardView === 'team'
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    )}
                  >
                    <Users className="h-3.5 w-3.5" />
                    Vue équipe
                  </button>
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
                className="gap-2 bg-white"
              >
                <RefreshCw className={cn('h-3.5 w-3.5', isLoading && 'animate-spin')} />
                Actualiser
              </Button>
              <Button
                size="sm"
                onClick={() => router.push('/dashboard/clients?action=new')}
                className="gap-2 bg-gradient-to-r from-[#7373FF] to-[#8b8bff] hover:from-[#5c5ce6] hover:to-[#7373FF] shadow-md shadow-[#7373FF]/20"
              >
                <Users className="h-3.5 w-3.5" />
                Nouveau client
              </Button>
            </div>
          </div>

          {/* Quick Stats Bar */}
          <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
            <QuickStatPill
              label="Clients actifs"
              value={counters?.clients?.active || 0}
              icon={Users}
              color="indigo"
            />
            <QuickStatPill
              label="Tâches aujourd'hui"
              value={counters?.tasks?.today || 0}
              icon={CheckSquare}
              color="emerald"
              alert={counters?.tasks?.overdue}
            />
            <QuickStatPill
              label="Rendez-vous"
              value={counters?.appointments?.today || 0}
              icon={Calendar}
              color="violet"
            />
            <QuickStatPill
              label="Alertes"
              value={counters?.alerts?.total || 0}
              icon={Bell}
              color="rose"
            />
          </div>
        </div>
      </header>

      {/* KPIs - Premium Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <PremiumKpiCard
          title="Portefeuille Clients"
          value={counters?.clients?.active || 0}
          icon={Users}
          subtitle={`+${counters?.clients?.prospects || 0} prospects en attente`}
          trend={12}
          color="indigo"
          onClick={() => handleCardClick('/dashboard/clients')}
        />
        <PremiumKpiCard
          title="Tâches & Actions"
          value={counters?.tasks?.today || 0}
          icon={CheckSquare}
          subtitle={counters?.tasks?.overdue ? `${counters.tasks.overdue} en retard` : 'Tout est à jour'}
          trend={counters?.tasks?.overdue ? -counters.tasks.overdue : 5}
          color={counters?.tasks?.overdue ? "amber" : "emerald"}
          onClick={() => handleCardClick('/dashboard/taches?filter=today')}
        />
        <PremiumKpiCard
          title="Agenda du jour"
          value={counters?.appointments?.today || 0}
          icon={Calendar}
          subtitle="Rendez-vous programmés"
          color="violet"
          onClick={() => handleCardClick('/dashboard/agenda')}
        />
        <PremiumKpiCard
          title="Alertes Conformité"
          value={counters?.alerts?.total || 0}
          icon={AlertTriangle}
          subtitle="Nécessitent votre attention"
          color={counters?.alerts?.total ? "rose" : "gray"}
          onClick={() => router.push('/dashboard/reclamations')}
        />
      </div>

      {/* Team View for Admins */}
      {isAdmin && dashboardView === 'team' && teamStats && (
        <div className="space-y-5">
          {/* Team Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              <h2 className="text-sm font-semibold text-gray-900">Performance équipe</h2>
              <Badge variant="default" size="xs">{teamStats.totals.advisors} membres</Badge>
            </div>
          </div>

          {/* Team Totals */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#7373FF]/10 rounded-xl">
                    <Users className="h-5 w-5 text-[#7373FF]" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{teamStats.totals.clients}</p>
                    <p className="text-xs text-gray-500">Clients actifs (cabinet)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-50 rounded-xl">
                    <CheckSquare className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{teamStats.totals.tasks}</p>
                    <p className="text-xs text-gray-500">Tâches en cours (cabinet)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-50 rounded-xl">
                    <Target className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{teamStats.totals.opportunities}</p>
                    <p className="text-xs text-gray-500">Opportunités actives</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Team Members Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {teamStats.team.map((member) => (
              <Card
                key={member.advisor.id}
                className="border-gray-200 hover:border-[#7373FF]/30 hover:shadow-md transition-all cursor-pointer group"
                onClick={() => {
                  setSelectedAdvisorId(member.advisor.id)
                  setDashboardView('personal')
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar
                      size="lg"
                      variant="gradient"
                      src={member.advisor.avatar}
                      name={`${member.advisor.firstName} ${member.advisor.lastName}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-gray-900 truncate group-hover:text-[#7373FF] transition-colors">
                          {member.advisor.firstName} {member.advisor.lastName}
                        </h3>
                        {member.advisor.role === 'ADMIN' && (
                          <Crown className="h-3.5 w-3.5 text-amber-500" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        {member.advisor.role === 'ADMIN' ? 'Administrateur' : 'Conseiller'}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-[#7373FF] transition-colors" />
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <div className="grid grid-cols-2 gap-y-2 text-xs">
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-gray-600">{member.stats.clients} clients</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-gray-600">{member.stats.appointmentsToday} rdv</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckSquare className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-gray-600">{member.stats.tasks} tâches</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Target className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-gray-600">{member.stats.opportunities} opps</span>
                      </div>
                    </div>
                    {member.stats.overdueTasks > 0 && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-rose-600">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        {member.stats.overdueTasks} tâches en retard
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Personal Dashboard Grid - Premium Layout */}
      {(dashboardView === 'personal' || !isAdmin) && (
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* Left Zone - Main Content */}
        <div className="xl:col-span-2 space-y-5">
          {/* Section Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-[#7373FF]/100" />
              <h2 className="text-sm font-semibold text-gray-900">
                {isAssistant ? 'Activité du conseiller' : 'Priorités du jour'}
              </h2>
              {selectedAdvisorId && isAdmin && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedAdvisorId(undefined)}
                  className="text-xs text-gray-500 gap-1"
                >
                  <Eye className="h-3 w-3" />
                  Retour à ma vue
                </Button>
              )}
            </div>
            <Button variant="ghost" size="sm" className="text-xs text-gray-500 gap-1">
              Voir tout
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>

          {/* Emails Widget */}
          <div className="h-[400px]">
            <EmailsWidget />
          </div>

          {/* Agenda & Today */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AgendaMiniCalendar />
            <TodayWidget date={new Date()} />
          </div>

          {/* Tasks & Opportunities */}
          <TasksWidget className="" onTaskUpdate={() => { }} />
          <OpportunitiesWidget />
        </div>

        {/* Right Zone - Sidebar */}
        <div className="space-y-5">
          {/* Section Header */}
          <div className="flex items-center gap-2">
            <div className="h-1 w-1 rounded-full bg-rose-500" />
            <h2 className="text-sm font-semibold text-gray-900">Alertes & Événements</h2>
          </div>

          <div className="space-y-4">
            <CelebrationsWidget />
            <AlertsWidget />
          </div>

          {/* Performance Summary Card */}
          <Card className="overflow-hidden border-gray-200/60">
            <CardContent className="p-0">
              <div className="p-5 bg-gradient-to-br from-gray-50 to-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-[#7373FF]/15 rounded-lg">
                      <TrendingUp className="h-4 w-4 text-[#7373FF]" />
                    </div>
                    <span className="text-sm font-semibold text-gray-900">Performance</span>
                  </div>
                  <Badge variant="success" size="sm">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    +12%
                  </Badge>
                </div>
                
                {/* Mini Stats */}
                <div className="space-y-3">
                  <PerformanceRow label="Dossiers clôturés" value="8" trend="+3" />
                  <PerformanceRow label="Nouveaux clients" value="4" trend="+2" />
                  <PerformanceRow label="Encours géré" value="2.4M€" trend="+180K" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card className="border-gray-200/60">
            <CardContent className="p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Accès rapides</p>
              <div className="grid grid-cols-2 gap-2">
                <QuickLinkButton icon={FileText} label="Documents" onClick={() => router.push('/dashboard/documents')} />
                <QuickLinkButton icon={Target} label="Opportunités" onClick={() => router.push('/dashboard/opportunites')} />
                <QuickLinkButton icon={Wallet} label="Patrimoine" onClick={() => router.push('/dashboard/patrimoine')} />
                <QuickLinkButton icon={Users} label="Prospects" onClick={() => router.push('/dashboard/prospects')} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      )}
    </div>
  )
}

/**
 * Section Header Component
 */
function SectionHeader({ title }: { title: string }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
      {title}
    </h2>
  )
}

/**
 * Premium KPI Card - Inspired by Finary/Stripe
 */
interface PremiumKpiCardProps {
  title: string
  value: number
  icon: React.ElementType
  subtitle?: string
  trend?: number
  color?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky' | 'gray' | 'violet'
  onClick?: () => void
}

const colorConfig = {
  indigo: {
    bg: 'bg-[#7373FF]/10',
    icon: 'text-[#7373FF]',
    iconBg: 'bg-[#7373FF]/15',
    border: 'hover:border-[#7373FF]/30',
  },
  emerald: {
    bg: 'bg-emerald-50',
    icon: 'text-emerald-600',
    iconBg: 'bg-emerald-100',
    border: 'hover:border-emerald-200',
  },
  amber: {
    bg: 'bg-amber-50',
    icon: 'text-amber-600',
    iconBg: 'bg-amber-100',
    border: 'hover:border-amber-200',
  },
  rose: {
    bg: 'bg-rose-50',
    icon: 'text-rose-600',
    iconBg: 'bg-rose-100',
    border: 'hover:border-rose-200',
  },
  sky: {
    bg: 'bg-sky-50',
    icon: 'text-sky-600',
    iconBg: 'bg-sky-100',
    border: 'hover:border-sky-200',
  },
  violet: {
    bg: 'bg-violet-50',
    icon: 'text-violet-600',
    iconBg: 'bg-violet-100',
    border: 'hover:border-violet-200',
  },
  gray: {
    bg: 'bg-gray-50',
    icon: 'text-gray-600',
    iconBg: 'bg-gray-100',
    border: 'hover:border-gray-200',
  },
}

function PremiumKpiCard({ 
  title, 
  value, 
  icon: Icon, 
  subtitle, 
  trend,
  color = 'indigo',
  onClick 
}: PremiumKpiCardProps) {
  const config = colorConfig[color]
  const TrendIcon = trend && trend > 0 ? ArrowUpRight : trend && trend < 0 ? ArrowDownRight : Minus

  return (
    <Card
      interactive
      className={cn(
        'group relative overflow-hidden',
        config.border
      )}
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              {title}
            </p>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 tabular-nums tracking-tight">
                {value.toLocaleString('fr-FR')}
              </h3>
              {subtitle && (
                <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
              )}
            </div>
          </div>
          
          <div className={cn('p-2.5 rounded-xl', config.iconBg)}>
            <Icon className={cn('h-5 w-5', config.icon)} />
          </div>
        </div>

        {/* Trend indicator */}
        {trend !== undefined && trend !== 0 && (
          <div className="mt-4 pt-3 border-t border-gray-100">
            <div className={cn(
              'inline-flex items-center gap-1 text-xs font-medium',
              trend > 0 ? 'text-emerald-600' : 'text-rose-600'
            )}>
              <TrendIcon className="h-3.5 w-3.5" />
              {trend > 0 ? '+' : ''}{trend}%
              <span className="text-gray-400 font-normal ml-1">vs mois dernier</span>
            </div>
          </div>
        )}

        {/* Hover arrow */}
        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <ChevronRight className="h-4 w-4 text-gray-400" />
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Quick Stat Pill - Compact stat display for header
 */
const pillColors = {
  indigo: { bg: 'bg-[#7373FF]/10', text: 'text-[#5c5ce6]', icon: 'text-[#7373FF]' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: 'text-emerald-500' },
  violet: { bg: 'bg-violet-50', text: 'text-violet-700', icon: 'text-violet-500' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-700', icon: 'text-rose-500' },
}

function QuickStatPill({ 
  label, 
  value, 
  icon: Icon, 
  color,
  alert 
}: { 
  label: string
  value: number
  icon: React.ElementType
  color: 'indigo' | 'emerald' | 'violet' | 'rose'
  alert?: number
}) {
  const colors = pillColors[color]
  return (
    <div className={cn(
      'flex items-center gap-3 px-4 py-2.5 rounded-xl',
      colors.bg
    )}>
      <Icon className={cn('h-4 w-4', colors.icon)} />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 truncate">{label}</p>
        <div className="flex items-center gap-2">
          <span className={cn('text-lg font-bold tabular-nums', colors.text)}>
            {value}
          </span>
          {alert !== undefined && alert > 0 && (
            <span className="text-xs font-medium text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded">
              {alert} en retard
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Performance Row - Mini stat row
 */
function PerformanceRow({ label, value, trend }: { label: string; value: string; trend: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-gray-900 tabular-nums">{value}</span>
        <span className="text-xs font-medium text-emerald-600">{trend}</span>
      </div>
    </div>
  )
}

/**
 * Quick Link Button - Compact action button
 */
function QuickLinkButton({ 
  icon: Icon, 
  label, 
  onClick 
}: { 
  icon: React.ElementType
  label: string
  onClick: () => void 
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-left group"
    >
      <Icon className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
      <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{label}</span>
    </button>
  )
}
