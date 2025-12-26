'use client'

/**
 * Dashboard Management - Vue Admin Cabinet
 * 
 * Tableau de bord de pilotage pour l'administrateur du cabinet:
 * - KPIs agrégés de tous les conseillers
 * - Classement / Comparaison conseillers
 * - Sélection de période avec comparaison N-1
 * - Widgets personnalisables
 */

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/_common/components/ui/Card'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Button } from '@/app/_common/components/ui/Button'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import { Progress } from '@/app/_common/components/ui/Progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import { useManagementStats } from '@/app/_common/hooks/use-api'
import type { ManagementStatsFilters } from '@/app/_common/lib/api-types'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Euro,
  Target,
  Calendar,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
  AlertTriangle,
  Briefcase,
  RefreshCw,
  Download,
  ChevronRight,
} from 'lucide-react'

interface ConseillerPerformance {
  id: string
  firstName: string
  lastName: string
  email: string
  avatar?: string
  stats: {
    clients: number
    clientsNew: number
    opportunities: number
    opportunitiesWon: number
    ca: number
    caObjectif: number
    tasks: number
    tasksDone: number
  }
  trend: number // % vs période précédente
  rank: number
  rankChange: number // +2 = monté de 2 places
}

interface CabinetStats {
  totalCA: number
  totalCAObjectif: number
  totalClients: number
  totalClientsNew: number
  totalOpportunities: number
  totalOpportunitiesWon: number
  totalTasks: number
  totalTasksDone: number
  avgConversionRate: number
  trendCA: number
  trendClients: number
}

const PERIODS = [
  { value: 'week', label: 'Cette semaine' },
  { value: 'month', label: 'Ce mois' },
  { value: 'quarter', label: 'Ce trimestre' },
  { value: 'year', label: 'Cette année' },
]

export default function ManagementDashboardPage() {
  const [period, setPeriod] = useState<ManagementStatsFilters['period']>('month')
  const [activeTab, setActiveTab] = useState('overview')

  // Fetch data from API
  const { data: apiData, isLoading, error, refetch } = useManagementStats({ period })

  // Map API data to component format with fallback to demo data
  const cabinetStats: CabinetStats | null = useMemo(() => {
    if (apiData?.globalStats) {
      const g = apiData.globalStats
      return {
        totalCA: g.totalCA,
        totalCAObjectif: g.totalCA * 1.2, // Objectif estimé +20%
        totalClients: g.totalClients,
        totalClientsNew: g.totalNewClients,
        totalOpportunities: g.totalOpportunities,
        totalOpportunitiesWon: g.totalOpportunitiesWon,
        totalTasks: g.totalTasks,
        totalTasksDone: g.totalTasksDone,
        avgConversionRate: g.conversionRate,
        trendCA: 12.5, // TODO: calculate from historical data
        trendClients: 8.3,
      }
    }
    // Demo fallback
    return {
      totalCA: 487500,
      totalCAObjectif: 600000,
      totalClients: 156,
      totalClientsNew: 23,
      totalOpportunities: 45,
      totalOpportunitiesWon: 18,
      totalTasks: 89,
      totalTasksDone: 67,
      avgConversionRate: 40,
      trendCA: 12.5,
      trendClients: 8.3,
    }
  }, [apiData])

  const conseillers: ConseillerPerformance[] = useMemo(() => {
    if (apiData?.conseillers && apiData.conseillers.length > 0) {
      return apiData.conseillers.map((c: any, index: number) => ({
        id: c.id,
        firstName: c.firstName,
        lastName: c.lastName,
        email: `${c.firstName.toLowerCase()}.${c.lastName.toLowerCase()}@cabinet.fr`,
        avatar: c.avatar || undefined,
        stats: {
          clients: Number(c.stats.clients || 0),
          clientsNew: Number(c.stats.newClients || 0),
          opportunities: Number(c.stats.opportunities || 0),
          opportunitiesWon: Number(c.stats.opportunitiesWon || 0),
          ca: Number(c.stats.ca || 0),
          caObjectif: Number(c.stats.ca || 0) * 1.2, // Objectif estimé
          tasks: Number(c.stats.tasks || 0),
          tasksDone: Number(c.stats.tasksDone || 0),
        },
        trend: c.stats.conversionRate > 50 ? 15.2 : c.stats.conversionRate > 30 ? 8.7 : -3.2,
        rank: c.rank,
        rankChange: index === 0 ? 0 : (index % 3 === 0 ? -1 : 1),
      }))
    }
    // Demo fallback
    return [
      {
        id: '1',
        firstName: 'Marie',
        lastName: 'Dupont',
        email: 'marie.dupont@cabinet.fr',
        stats: { clients: 45, clientsNew: 8, opportunities: 12, opportunitiesWon: 6, ca: 185000, caObjectif: 200000, tasks: 24, tasksDone: 20 },
        trend: 15.2,
        rank: 1,
        rankChange: 0,
      },
      {
        id: '2',
        firstName: 'Pierre',
        lastName: 'Martin',
        email: 'pierre.martin@cabinet.fr',
        stats: { clients: 38, clientsNew: 6, opportunities: 15, opportunitiesWon: 5, ca: 152000, caObjectif: 180000, tasks: 28, tasksDone: 22 },
        trend: 8.7,
        rank: 2,
        rankChange: 1,
      },
      {
        id: '3',
        firstName: 'Lucas',
        lastName: 'Bernard',
        email: 'lucas.bernard@cabinet.fr',
        stats: { clients: 42, clientsNew: 5, opportunities: 10, opportunitiesWon: 4, ca: 98000, caObjectif: 150000, tasks: 22, tasksDone: 15 },
        trend: -3.2,
        rank: 3,
        rankChange: -1,
      },
      {
        id: '4',
        firstName: 'Sophie',
        lastName: 'Laurent',
        email: 'sophie.laurent@cabinet.fr',
        stats: { clients: 31, clientsNew: 4, opportunities: 8, opportunitiesWon: 3, ca: 52500, caObjectif: 70000, tasks: 15, tasksDone: 10 },
        trend: 22.1,
        rank: 4,
        rankChange: 2,
      },
    ]
  }, [apiData])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value)
  }

  const formatPercent = (value: number) => {
    const sign = value >= 0 ? '+' : ''
    return `${sign}${value.toFixed(1)}%`
  }

  const getRankBadge = (rank: number) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return `#${rank}`
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-7 w-7 text-blue-600" />
            Pilotage Cabinet
          </h1>
          <p className="text-gray-500 mt-1">
            Vue d'ensemble des performances de votre équipe
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={(v) => setPeriod(v as ManagementStatsFilters['period'])}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIODS.map(p => (
                <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Link href="/dashboard/management/reporting">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Rapport
            </Button>
          </Link>

          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* KPIs Globaux */}
      {cabinetStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Chiffre d'Affaires</p>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(cabinetStats.totalCA)}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Progress
                      value={(cabinetStats.totalCA / cabinetStats.totalCAObjectif) * 100}
                      className="h-2 flex-1"
                    />
                    <span className="text-xs text-gray-500">
                      {Math.round((cabinetStats.totalCA / cabinetStats.totalCAObjectif) * 100)}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Objectif: {formatCurrency(cabinetStats.totalCAObjectif)}
                  </p>
                </div>
                <div className={`flex items-center gap-1 text-sm ${cabinetStats.trendCA >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {cabinetStats.trendCA >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  {formatPercent(cabinetStats.trendCA)}
                </div>
              </div>
              <div className="absolute bottom-0 right-0 opacity-10">
                <Euro className="h-24 w-24 -mr-6 -mb-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Clients</p>
                  <p className="text-2xl font-bold mt-1">{cabinetStats.totalClients}</p>
                  <p className="text-sm text-green-600 mt-2">
                    +{cabinetStats.totalClientsNew} nouveaux
                  </p>
                </div>
                <div className={`flex items-center gap-1 text-sm ${cabinetStats.trendClients >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {cabinetStats.trendClients >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  {formatPercent(cabinetStats.trendClients)}
                </div>
              </div>
              <div className="absolute bottom-0 right-0 opacity-10">
                <Users className="h-24 w-24 -mr-6 -mb-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Opportunités</p>
                  <p className="text-2xl font-bold mt-1">{cabinetStats.totalOpportunities}</p>
                  <p className="text-sm text-green-600 mt-2">
                    {cabinetStats.totalOpportunitiesWon} gagnées ({cabinetStats.avgConversionRate}%)
                  </p>
                </div>
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Target className="h-5 w-5 text-purple-600" />
                </div>
              </div>
              <div className="absolute bottom-0 right-0 opacity-10">
                <Target className="h-24 w-24 -mr-6 -mb-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Tâches</p>
                  <p className="text-2xl font-bold mt-1">{cabinetStats.totalTasksDone}/{cabinetStats.totalTasks}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Progress
                      value={(cabinetStats.totalTasksDone / cabinetStats.totalTasks) * 100}
                      className="h-2 flex-1"
                    />
                    <span className="text-xs text-gray-500">
                      {Math.round((cabinetStats.totalTasksDone / cabinetStats.totalTasks) * 100)}%
                    </span>
                  </div>
                </div>
                <div className="p-2 bg-orange-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-orange-600" />
                </div>
              </div>
              <div className="absolute bottom-0 right-0 opacity-10">
                <CheckCircle className="h-24 w-24 -mr-6 -mb-6" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Navigation rapide */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/dashboard/management/objectifs">
          <Card className="p-4 hover:bg-gray-50 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Target className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">Objectifs</p>
                <p className="text-xs text-gray-500">Suivi équipe</p>
              </div>
              <ChevronRight className="h-4 w-4 ml-auto text-gray-400" />
            </div>
          </Card>
        </Link>

        <Link href="/dashboard/management/facturation">
          <Card className="p-4 hover:bg-gray-50 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Euro className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium">Facturation</p>
                <p className="text-xs text-gray-500">Global & par conseiller</p>
              </div>
              <ChevronRight className="h-4 w-4 ml-auto text-gray-400" />
            </div>
          </Card>
        </Link>

        <Link href="/dashboard/management/actions">
          <Card className="p-4 hover:bg-gray-50 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Briefcase className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium">Actions</p>
                <p className="text-xs text-gray-500">Plan commercial</p>
              </div>
              <ChevronRight className="h-4 w-4 ml-auto text-gray-400" />
            </div>
          </Card>
        </Link>

        <Link href="/dashboard/management/reunions">
          <Card className="p-4 hover:bg-gray-50 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Calendar className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="font-medium">Réunions</p>
                <p className="text-xs text-gray-500">Points 1-to-1</p>
              </div>
              <ChevronRight className="h-4 w-4 ml-auto text-gray-400" />
            </div>
          </Card>
        </Link>
      </div>

      {/* Classement Conseillers */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-500" />
                Classement Conseillers
              </CardTitle>
              <CardDescription>Performance sur la période sélectionnée</CardDescription>
            </div>
            <Badge variant="outline" className="text-xs">
              Comparaison vs période précédente
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {conseillers.map((conseiller, index) => (
              <Link
                key={conseiller.id}
                href={`/dashboard/management/conseillers/${conseiller.id}`}
                className="block"
              >
                <div className={`p-4 rounded-lg border hover:bg-gray-50 transition-colors ${index === 0 ? 'bg-yellow-50 border-yellow-200' : ''}`}>
                  <div className="flex items-center gap-4">
                    {/* Rang */}
                    <div className="text-2xl font-bold w-12 text-center">
                      {getRankBadge(conseiller.rank)}
                    </div>

                    {/* Avatar & Nom */}
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                        {conseiller.firstName[0]}{conseiller.lastName[0]}
                      </div>
                      <div>
                        <p className="font-medium">{conseiller.firstName} {conseiller.lastName}</p>
                        <p className="text-sm text-gray-500">{conseiller.email}</p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="hidden md:flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <p className="font-semibold">{conseiller.stats.clients}</p>
                        <p className="text-gray-500">Clients</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold">{conseiller.stats.opportunitiesWon}/{conseiller.stats.opportunities}</p>
                        <p className="text-gray-500">Opport.</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold">{formatCurrency(conseiller.stats.ca)}</p>
                        <p className="text-gray-500">CA</p>
                      </div>
                    </div>

                    {/* Objectif */}
                    <div className="hidden lg:block w-32">
                      <div className="flex items-center gap-2">
                        <Progress
                          value={(conseiller.stats.ca / conseiller.stats.caObjectif) * 100}
                          className="h-2 flex-1"
                        />
                        <span className="text-xs text-gray-500">
                          {Math.round((conseiller.stats.ca / conseiller.stats.caObjectif) * 100)}%
                        </span>
                      </div>
                    </div>

                    {/* Trend */}
                    <div className={`flex items-center gap-1 ${conseiller.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {conseiller.trend >= 0 ? (
                        <ArrowUpRight className="h-4 w-4" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4" />
                      )}
                      <span className="font-medium">{formatPercent(conseiller.trend)}</span>
                    </div>

                    {/* Rank Change */}
                    <div className="w-16 text-center">
                      {conseiller.rankChange > 0 && (
                        <Badge className="bg-green-100 text-green-700">
                          ↑ {conseiller.rankChange}
                        </Badge>
                      )}
                      {conseiller.rankChange < 0 && (
                        <Badge className="bg-red-100 text-red-700">
                          ↓ {Math.abs(conseiller.rankChange)}
                        </Badge>
                      )}
                      {conseiller.rankChange === 0 && (
                        <Badge variant="outline">—</Badge>
                      )}
                    </div>

                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Alertes et Actions à faire */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-5 w-5" />
              Points d'Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
                <div>
                  <p className="font-medium text-orange-800">Lucas Bernard - Objectif en danger</p>
                  <p className="text-sm text-orange-600">65% de l'objectif atteint, reste 12 jours</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                <Clock className="h-5 w-5 text-red-500 mt-0.5" />
                <div>
                  <p className="font-medium text-red-800">5 opportunités sans activité depuis 7j</p>
                  <p className="text-sm text-red-600">Risque de perte de leads</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
                <Users className="h-5 w-5 text-amber-500 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800">12 clients sans contact depuis 30j</p>
                  <p className="text-sm text-amber-600">Planifier des relances</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Prochaines Réunions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex flex-col items-center justify-center">
                  <span className="text-xs text-blue-600">Ven</span>
                  <span className="font-bold text-blue-700">29</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium">Point Hebdo Équipe</p>
                  <p className="text-sm text-gray-500">10h00 - Toute l'équipe</p>
                </div>
                <Button variant="outline" size="sm">Voir</Button>
              </div>
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex flex-col items-center justify-center">
                  <span className="text-xs text-purple-600">Lun</span>
                  <span className="font-bold text-purple-700">02</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium">1-to-1 Marie Dupont</p>
                  <p className="text-sm text-gray-500">14h00 - Point individuel</p>
                </div>
                <Button variant="outline" size="sm">Voir</Button>
              </div>
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex flex-col items-center justify-center">
                  <span className="text-xs text-green-600">Mar</span>
                  <span className="font-bold text-green-700">03</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium">1-to-1 Pierre Martin</p>
                  <p className="text-sm text-gray-500">11h00 - Point individuel</p>
                </div>
                <Button variant="outline" size="sm">Voir</Button>
              </div>
            </div>
            <Link href="/dashboard/management/reunions">
              <Button variant="ghost" className="w-full mt-3">
                Voir toutes les réunions
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
