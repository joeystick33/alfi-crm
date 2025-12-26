'use client'
 

/**
 * Pilotage Commercial - Vue avec Tabs Admin
 * 
 * Pour les Admins: 2 tabs - "Mon Activité" et "Mon Équipe"
 * Pour les Conseillers: Vue personnelle uniquement
 */

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_common/components/ui/Card'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Button } from '@/app/_common/components/ui/Button'
import { Progress } from '@/app/_common/components/ui/Progress'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/_common/components/ui/Tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import { Avatar } from '@/app/_common/components/ui/Avatar'
import { 
  usePilotageCommercial, 
  usePilotageTeam,
  type AdvisorStats,
  type PipelineStage 
} from '@/app/_common/hooks/api/use-pilotage-api'
import { useAuth } from '@/app/_common/hooks/use-auth'
import { cn } from '@/app/_common/lib/utils'
import {
  TrendingUp,
  TrendingDown,
  Target,
  Users,
  Calendar,
  Phone,
  FileText,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  Zap,
  Award,
  BarChart3,
  PieChart,
  RefreshCw,
  Percent,
  AlertTriangle,
  User,
  Crown,
  Medal,
  Building2,
  UserCheck,
} from 'lucide-react'

type PeriodFilter = 'week' | 'month' | 'quarter' | 'year'
type ViewTab = 'personal' | 'team'

// ============================================================================
// Format Helpers
// ============================================================================

const formatCurrency = (value: number) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M€`
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K€`
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value)
}

const formatPercent = (value: number) => `${value.toFixed(0)}%`

// ============================================================================
// Personal View Component
// ============================================================================

function PersonalView({ 
  period, 
  data, 
  isLoading 
}: { 
  period: PeriodFilter
  data: any
  isLoading: boolean 
}) {
  const router = useRouter()

  const pipelineTotal = useMemo(() => {
    if (!data?.pipeline) return { count: 0, value: 0, weighted: 0 }
    return {
      count: data.pipeline.reduce((sum: number, s: PipelineStage) => sum + s.count, 0),
      value: data.pipeline.reduce((sum: number, s: PipelineStage) => sum + s.value, 0),
      weighted: data.pipeline.reduce((sum: number, s: PipelineStage) => sum + (s.value * (s.conversionRate || 50) / 100), 0),
    }
  }, [data?.pipeline])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-48" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CA Réalisé */}
        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500">CA Réalisé</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {formatCurrency(data?.objectives?.ca?.current || 0)}
                </p>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>Objectif: {formatCurrency(data?.objectives?.ca?.target || 0)}</span>
                    <span className="font-semibold">{Math.round((data?.objectives?.ca?.current || 0) / (data?.objectives?.ca?.target || 1) * 100)}%</span>
                  </div>
                  <Progress 
                    value={(data?.objectives?.ca?.current || 0) / (data?.objectives?.ca?.target || 1) * 100} 
                    className="h-2" 
                  />
                </div>
              </div>
              <div className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                (data?.objectives?.ca?.trend || 0) >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
              )}>
                {(data?.objectives?.ca?.trend || 0) >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {(data?.objectives?.ca?.trend || 0) >= 0 ? '+' : ''}{data?.objectives?.ca?.trend || 0}%
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pipeline Pondéré */}
        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pipeline Pondéré</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {formatCurrency(pipelineTotal.weighted)}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  {pipelineTotal.count} opportunités • {formatCurrency(pipelineTotal.value)} brut
                </p>
              </div>
              <div className="p-3 bg-violet-100 rounded-xl">
                <Target className="h-5 w-5 text-violet-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Taux de Transformation */}
        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Taux Transformation</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {formatPercent(data?.performance?.conversionRate || 0)}
                </p>
                <p className="text-xs text-gray-400 mt-2">R0 → Closing</p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-xl">
                <Percent className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Classement */}
        <Card className="bg-gradient-to-br from-[#7373FF] to-[#9b9bff] border-0 shadow-sm text-white">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-white/80">Classement Équipe</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <p className="text-4xl font-bold">{data?.performance?.rank || '-'}</p>
                  <span className="text-lg text-white/70">/ {data?.performance?.totalAdvisors || '-'}</span>
                </div>
                <p className="text-xs text-white/60 mt-2">
                  Top {Math.round((data?.performance?.rank || 1) / (data?.performance?.totalAdvisors || 1) * 100)}% du cabinet
                </p>
              </div>
              <div className="text-4xl">
                {data?.performance?.rank === 1 ? '🥇' : data?.performance?.rank === 2 ? '🥈' : data?.performance?.rank === 3 ? '🥉' : '🏆'}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Funnel */}
      <Card className="bg-white border-0 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <PieChart className="h-5 w-5 text-[#7373FF]" />
              Mon Pipeline
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/opportunites')}>
              Voir détails <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex items-stretch gap-2 h-24">
            {data?.pipeline?.map((stage: PipelineStage, index: number) => (
              <div 
                key={stage.id}
                className="flex-1 relative group cursor-pointer"
                onClick={() => router.push(`/dashboard/opportunites?stage=${stage.id}`)}
              >
                <div 
                  className={cn("h-full rounded-xl transition-all group-hover:scale-[1.02]", stage.color)}
                >
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-2">
                    <span className="text-xl font-bold">{stage.count}</span>
                    <span className="text-xs font-medium opacity-80">{stage.shortName}</span>
                  </div>
                </div>
                {index < (data.pipeline?.length || 0) - 1 && (
                  <div className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-1 shadow">
                    <ArrowRight className="h-3 w-3 text-gray-400" />
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-3 px-2">
            {data?.pipeline?.map((stage: PipelineStage) => (
              <div key={stage.id} className="text-center text-xs text-gray-500">
                {formatCurrency(stage.value)}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Deals */}
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              Mes Deals Prioritaires
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data?.topDeals?.slice(0, 5).map((deal: any, index: number) => (
                <div 
                  key={deal.id}
                  onClick={() => router.push(`/dashboard/opportunites/${deal.id}`)}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-[#7373FF]/30 cursor-pointer transition-all"
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold",
                    index === 0 ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"
                  )}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{deal.clientName}</p>
                    <p className="text-xs text-gray-500">{deal.nextAction}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">{formatCurrency(deal.value)}</p>
                    <p className="text-xs text-gray-400">{deal.probability}%</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Activity */}
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Mon Activité
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-blue-50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="text-xs text-blue-600">{data?.activity?.rdv?.current || 0}/{data?.activity?.rdv?.target || 0}</span>
                </div>
                <p className="text-xl font-bold text-blue-700">{data?.activity?.rdv?.current || 0}</p>
                <p className="text-xs text-blue-600">Rendez-vous</p>
              </div>
              <div className="p-4 bg-violet-50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <FileText className="h-4 w-4 text-violet-600" />
                  <span className="text-xs text-violet-600">{data?.activity?.proposals?.current || 0}/{data?.activity?.proposals?.target || 0}</span>
                </div>
                <p className="text-xl font-bold text-violet-700">{data?.activity?.proposals?.current || 0}</p>
                <p className="text-xs text-violet-600">Propositions</p>
              </div>
              <div className="p-4 bg-emerald-50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <Phone className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs text-emerald-600">{data?.activity?.calls?.current || 0}/{data?.activity?.calls?.target || 0}</span>
                </div>
                <p className="text-xl font-bold text-emerald-700">{data?.activity?.calls?.current || 0}</p>
                <p className="text-xs text-emerald-600">Appels</p>
              </div>
              <div className="p-4 bg-amber-50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <CheckCircle2 className="h-4 w-4 text-amber-600" />
                  <span className="text-xs text-amber-600">{data?.activity?.signatures?.current || 0}/{data?.activity?.signatures?.target || 0}</span>
                </div>
                <p className="text-xl font-bold text-amber-700">{data?.activity?.signatures?.current || 0}</p>
                <p className="text-xs text-amber-600">Signatures</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ============================================================================
// Team View Component (Admin only)
// ============================================================================

function TeamView({ 
  period, 
  data, 
  isLoading 
}: { 
  period: PeriodFilter
  data: any
  isLoading: boolean 
}) {
  const router = useRouter()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="h-5 w-5 text-amber-500" />
    if (index === 1) return <Medal className="h-5 w-5 text-gray-400" />
    if (index === 2) return <Medal className="h-5 w-5 text-amber-700" />
    return <span className="text-sm font-bold text-gray-400">{index + 1}</span>
  }

  return (
    <div className="space-y-6">
      {/* Cabinet KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-[#7373FF] to-[#9b9bff] border-0 shadow-lg text-white">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-white/80">CA Cabinet</p>
                <p className="text-3xl font-bold mt-1">{formatCurrency(data?.cabinetTotals?.totalCA || 0)}</p>
                <p className="text-xs text-white/60 mt-2">{data?.advisors?.length || 0} conseillers</p>
              </div>
              <Building2 className="h-8 w-8 text-white/30" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pipeline Total</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {formatCurrency(data?.cabinetTotals?.totalPipelineWeighted || 0)}
                </p>
                <p className="text-xs text-gray-400 mt-2">{formatCurrency(data?.cabinetTotals?.totalPipeline || 0)} brut</p>
              </div>
              <div className="p-3 bg-violet-100 rounded-xl">
                <Target className="h-5 w-5 text-violet-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Clients Actifs</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{data?.cabinetTotals?.totalClients || 0}</p>
                <p className="text-xs text-emerald-600 mt-2">+{data?.cabinetTotals?.totalNewClients || 0} ce mois</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Taux Conversion Moy.</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{data?.cabinetTotals?.avgConversionRate || 0}%</p>
                <p className="text-xs text-gray-400 mt-2">{data?.cabinetTotals?.totalDeals || 0} deals signés</p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-xl">
                <Percent className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {data?.alerts && data.alerts.length > 0 && (
        <Card className="bg-amber-50 border-amber-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-amber-800">
              <AlertTriangle className="h-5 w-5" />
              Alertes Équipe ({data.alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.alerts.slice(0, 5).map((alert: any, i: number) => (
                <div 
                  key={i}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg",
                    alert.severity === 'danger' ? 'bg-rose-100 border border-rose-200' : 'bg-amber-100 border border-amber-200'
                  )}
                >
                  <AlertTriangle className={cn("h-4 w-4", alert.severity === 'danger' ? 'text-rose-600' : 'text-amber-600')} />
                  <p className={cn("text-sm", alert.severity === 'danger' ? 'text-rose-700' : 'text-amber-700')}>
                    {alert.message}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leaderboard + Team Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Leaderboard */}
        <Card className="lg:col-span-3 bg-white border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500" />
              Classement Équipe
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data?.leaderboard?.map((advisor: AdvisorStats, index: number) => {
                const progress = (advisor.ca / (data.caTarget || 50000)) * 100
                
                return (
                  <div 
                    key={advisor.id}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-xl transition-all",
                      index === 0 ? "bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200" :
                      index === 1 ? "bg-gray-50 border border-gray-200" :
                      index === 2 ? "bg-orange-50 border border-orange-200" :
                      "bg-white border border-gray-100 hover:border-gray-200"
                    )}
                  >
                    {/* Rank */}
                    <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center">
                      {getRankIcon(index)}
                    </div>
                    
                    {/* Avatar + Name */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Avatar 
                        name={`${advisor.firstName} ${advisor.lastName}`} 
                        size="sm"
                        className="ring-2 ring-white"
                      />
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate">
                          {advisor.firstName} {advisor.lastName}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge size="xs" className={advisor.role === 'ADMIN' ? 'bg-[#7373FF]/10 text-[#7373FF]' : 'bg-gray-100 text-gray-600'}>
                            {advisor.role === 'ADMIN' ? 'Admin' : 'Conseiller'}
                          </Badge>
                          <span className="text-xs text-gray-400">{advisor.clientsCount} clients</span>
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">{formatCurrency(advisor.ca)}</p>
                      <div className="flex items-center gap-2 justify-end mt-1">
                        <Progress value={Math.min(progress, 100)} className="w-16 h-1.5" />
                        <span className="text-xs text-gray-500">{Math.round(progress)}%</span>
                      </div>
                    </div>

                    {/* Pipeline */}
                    <div className="hidden md:block text-right border-l border-gray-200 pl-4">
                      <p className="text-sm font-semibold text-violet-600">{formatCurrency(advisor.pipelineWeighted)}</p>
                      <p className="text-xs text-gray-400">{advisor.pipelineCount} opps</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Team Pipeline */}
        <Card className="lg:col-span-2 bg-white border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <PieChart className="h-5 w-5 text-[#7373FF]" />
              Pipeline Cabinet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data?.teamPipeline?.map((stage: PipelineStage) => (
                <div key={stage.id} className="flex items-center gap-3">
                  <div className={cn("w-3 h-3 rounded-full", stage.color)} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{stage.name}</span>
                      <span className="text-sm font-bold">{stage.count}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={(stage.value / (data.cabinetTotals?.totalPipeline || 1)) * 100} 
                        className="flex-1 h-2"
                      />
                      <span className="text-xs text-gray-500 w-16 text-right">{formatCurrency(stage.value)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Total Pipeline</span>
                <span className="text-lg font-bold text-gray-900">{formatCurrency(data?.cabinetTotals?.totalPipeline || 0)}</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-gray-500">Pondéré</span>
                <span className="text-sm font-semibold text-violet-600">{formatCurrency(data?.cabinetTotals?.totalPipelineWeighted || 0)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Activity Grid */}
      <Card className="bg-white border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-blue-600" />
            Activité par Conseiller
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Conseiller</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">CA</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Pipeline</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">RDV</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Tâches</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Conv.</th>
                </tr>
              </thead>
              <tbody>
                {data?.advisors?.map((advisor: AdvisorStats) => (
                  <tr key={advisor.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={`${advisor.firstName} ${advisor.lastName}`} size="xs" />
                        <span className="font-medium text-gray-900 text-sm">{advisor.firstName} {advisor.lastName}</span>
                      </div>
                    </td>
                    <td className="text-right py-3 px-4 font-semibold text-gray-900">{formatCurrency(advisor.ca)}</td>
                    <td className="text-right py-3 px-4 text-violet-600 font-medium">{formatCurrency(advisor.pipelineWeighted)}</td>
                    <td className="text-right py-3 px-4 text-gray-600">{advisor.rdvCount}</td>
                    <td className="text-right py-3 px-4">
                      <span className="text-emerald-600">{advisor.tasksCompleted}</span>
                      <span className="text-gray-400"> / </span>
                      <span className="text-amber-600">{advisor.tasksPending}</span>
                    </td>
                    <td className="text-right py-3 px-4">
                      <Badge size="xs" className={advisor.conversionRate >= 20 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}>
                        {advisor.conversionRate}%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function PilotageCommercialPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [period, setPeriod] = useState<PeriodFilter>('month')
  const [activeTab, setActiveTab] = useState<ViewTab>('personal')
  
  const isAdmin = user?.role === 'ADMIN'
  
  // Fetch personal data
  const { data: personalData, isLoading: personalLoading, refetch: refetchPersonal } = usePilotageCommercial({ period })
  
  // Fetch team data (only for admin)
  const { data: teamData, isLoading: teamLoading, refetch: refetchTeam } = usePilotageTeam(
    { period },
    { enabled: isAdmin }
  )

  const handleRefresh = () => {
    if (activeTab === 'personal') {
      refetchPersonal()
    } else {
      refetchTeam()
    }
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-[#7373FF]/10 rounded-xl">
              <BarChart3 className="h-6 w-6 text-[#7373FF]" />
            </div>
            Pilotage Commercial
          </h1>
          <p className="text-gray-500 mt-1">
            {isAdmin ? 'Pilotez votre activité et celle de votre équipe' : 'Suivez votre pipeline, vos objectifs et votre performance'}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={(v) => setPeriod(v as PeriodFilter)}>
            <SelectTrigger className="w-[160px] bg-white">
              <Calendar className="h-4 w-4 mr-2 text-gray-400" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Cette semaine</SelectItem>
              <SelectItem value="month">Ce mois</SelectItem>
              <SelectItem value="quarter">Ce trimestre</SelectItem>
              <SelectItem value="year">Cette année</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" onClick={handleRefresh} className="bg-white">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tabs for Admin */}
      {isAdmin ? (
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ViewTab)} className="w-full">
          <TabsList className="bg-white border border-gray-200 p-1">
            <TabsTrigger 
              value="personal" 
              className="flex items-center gap-2 data-[state=active]:bg-[#7373FF]/5 data-[state=active]:text-[#7373FF]"
            >
              <User className="h-4 w-4" />
              Mon Activité
            </TabsTrigger>
            <TabsTrigger 
              value="team"
              className="flex items-center gap-2 data-[state=active]:bg-[#7373FF]/5 data-[state=active]:text-[#7373FF]"
            >
              <Users className="h-4 w-4" />
              Mon Équipe
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="mt-6">
            <PersonalView period={period} data={personalData} isLoading={personalLoading} />
          </TabsContent>

          <TabsContent value="team" className="mt-6">
            <TeamView period={period} data={teamData} isLoading={teamLoading} />
          </TabsContent>
        </Tabs>
      ) : (
        /* Simple view for non-admin */
        <PersonalView period={period} data={personalData} isLoading={personalLoading} />
      )}
    </div>
  )
}
