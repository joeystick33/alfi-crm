'use client'

/**
 * Page SuperAdmin - Statistiques Globales
 * 
 * Affiche les métriques clés de la plateforme SaaS:
 * - MRR/ARR
 * - Statistiques par plan
 * - Utilisation des features
 * - Tendances
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/_common/components/ui/Card'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Button } from '@/app/_common/components/ui/Button'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import {
  TrendingUp,
  Building2,
  Users,
  Activity,
  Database,
  RefreshCw,
  Calendar,
  Euro,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'

interface PlatformStats {
  // Cabinets
  totalCabinets: number
  activeCabinets: number
  trialCabinets: number
  suspendedCabinets: number
  newCabinetsThisMonth: number
  cabinetGrowth: number

  // Users
  totalUsers: number
  activeUsers: number
  newUsersThisMonth: number
  userGrowth: number

  // Clients
  totalClients: number
  newClientsThisMonth: number
  clientGrowth: number

  // Revenue (simulé pour l'instant)
  mrr: number
  arr: number
  mrrGrowth: number

  // Par plan
  byPlan: {
    plan: string
    count: number
    revenue: number
    percentage: number
  }[]

  // Utilisation
  totalSimulations: number
  totalExports: number
  storageUsed: number
  storageTotal: number

  // Features populaires
  topFeatures: {
    code: string
    name: string
    usageCount: number
    percentage: number
  }[]
}

// STARTER: CRM | BUSINESS: CRM + Calculateurs | PREMIUM: Tout
const PLAN_PRICES: Record<string, number> = {
  TRIAL: 0,
  STARTER: 59,
  BUSINESS: 99,
  PREMIUM: 199,
}

const PLAN_COLORS: Record<string, string> = {
  TRIAL: 'bg-gray-100 text-gray-700',
  STARTER: 'bg-blue-100 text-blue-700',
  BUSINESS: 'bg-green-100 text-green-700',
  PREMIUM: 'bg-purple-100 text-purple-700',
}

export default function StatsPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [period, setPeriod] = useState('month')

  useEffect(() => {
    loadStats()
  }, [period])

  const loadStats = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/superadmin/stats?period=${period}`, {
        credentials: 'include',
      })
      
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      } else {
        // Données de démo si l'API n'existe pas encore
        setStats({
          totalCabinets: 24,
          activeCabinets: 18,
          trialCabinets: 4,
          suspendedCabinets: 2,
          newCabinetsThisMonth: 3,
          cabinetGrowth: 14.2,
          totalUsers: 87,
          activeUsers: 72,
          newUsersThisMonth: 12,
          userGrowth: 16.0,
          totalClients: 1456,
          newClientsThisMonth: 234,
          clientGrowth: 19.1,
          mrr: 1959,
          arr: 23508,
          mrrGrowth: 8.5,
          byPlan: [
            { plan: 'TRIAL', count: 4, revenue: 0, percentage: 20 },
            { plan: 'STARTER', count: 8, revenue: 472, percentage: 40 },
            { plan: 'BUSINESS', count: 5, revenue: 495, percentage: 25 },
            { plan: 'PREMIUM', count: 3, revenue: 597, percentage: 15 },
          ],
          totalSimulations: 8432,
          totalExports: 2341,
          storageUsed: 45.6,
          storageTotal: 200,
          topFeatures: [
            { code: 'SIM_RETIREMENT', name: 'Simulateur Retraite', usageCount: 2341, percentage: 27.8 },
            { code: 'SIM_IMMOBILIER', name: 'Simulateur Immobilier', usageCount: 1892, percentage: 22.4 },
            { code: 'SIM_PER', name: 'Simulateur PER', usageCount: 1456, percentage: 17.3 },
            { code: 'CALC_INCOME_TAX', name: 'Calculateur IR', usageCount: 1234, percentage: 14.6 },
            { code: 'SIM_SUCCESSION', name: 'Simulateur Succession', usageCount: 987, percentage: 11.7 },
          ],
        })
      }
    } catch (error) {
      console.error('Erreur chargement stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('fr-FR').format(value)
  }

  const GrowthIndicator = ({ value }: { value: number }) => {
    const isPositive = value >= 0
    return (
      <div className={`flex items-center gap-1 text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? (
          <ArrowUpRight className="h-4 w-4" />
        ) : (
          <ArrowDownRight className="h-4 w-4" />
        )}
        {Math.abs(value).toFixed(1)}%
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[1, 2].map(i => <Skeleton key={i} className="h-64" />)}
        </div>
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Statistiques Globales</h1>
          <p className="text-gray-500 mt-1">Vue d'ensemble des performances de la plateforme</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Cette semaine</SelectItem>
              <SelectItem value="month">Ce mois</SelectItem>
              <SelectItem value="quarter">Ce trimestre</SelectItem>
              <SelectItem value="year">Cette année</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={loadStats} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* KPIs Revenus */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-green-200 rounded-lg">
                <Euro className="h-5 w-5 text-green-700" />
              </div>
              <GrowthIndicator value={stats.mrrGrowth} />
            </div>
            <p className="text-3xl font-bold text-green-800">{formatCurrency(stats.mrr)}</p>
            <p className="text-sm text-green-600 mt-1">MRR (Mensuel récurrent)</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-blue-200 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-700" />
              </div>
              <Badge className="bg-blue-200 text-blue-800">Annuel</Badge>
            </div>
            <p className="text-3xl font-bold text-blue-800">{formatCurrency(stats.arr)}</p>
            <p className="text-sm text-blue-600 mt-1">ARR (Annuel récurrent)</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-purple-200 rounded-lg">
                <Building2 className="h-5 w-5 text-purple-700" />
              </div>
              <GrowthIndicator value={stats.cabinetGrowth} />
            </div>
            <p className="text-3xl font-bold text-purple-800">{stats.totalCabinets}</p>
            <p className="text-sm text-purple-600 mt-1">
              Cabinets total ({stats.activeCabinets} actifs)
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-orange-200 rounded-lg">
                <Users className="h-5 w-5 text-orange-700" />
              </div>
              <GrowthIndicator value={stats.userGrowth} />
            </div>
            <p className="text-3xl font-bold text-orange-800">{stats.totalUsers}</p>
            <p className="text-sm text-orange-600 mt-1">
              Utilisateurs ({stats.activeUsers} actifs)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Stats secondaires */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Database className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Clients gérés</p>
                  <p className="text-sm text-gray-500">Total plateforme</p>
                </div>
              </div>
              <GrowthIndicator value={stats.clientGrowth} />
            </div>
            <p className="text-3xl font-bold text-gray-900">{formatNumber(stats.totalClients)}</p>
            <p className="text-sm text-gray-500 mt-2">
              +{stats.newClientsThisMonth} ce mois
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-50 rounded-lg">
                  <Activity className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Simulations</p>
                  <p className="text-sm text-gray-500">Total effectuées</p>
                </div>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{formatNumber(stats.totalSimulations)}</p>
            <p className="text-sm text-gray-500 mt-2">
              {formatNumber(stats.totalExports)} exports PDF
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <Database className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Stockage</p>
                  <p className="text-sm text-gray-500">Utilisation globale</p>
                </div>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.storageUsed.toFixed(1)} GB</p>
            <div className="mt-2">
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full"
                  style={{ width: `${(stats.storageUsed / stats.storageTotal) * 100}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {((stats.storageUsed / stats.storageTotal) * 100).toFixed(1)}% de {stats.storageTotal} GB
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distribution par plan & Features */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribution par plan */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-gray-500" />
              Distribution par Plan
            </CardTitle>
            <CardDescription>Répartition des cabinets et revenus</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.byPlan.map((plan) => (
                <div key={plan.plan} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge className={PLAN_COLORS[plan.plan]}>{plan.plan}</Badge>
                    <span className="text-sm text-gray-600">{plan.count} cabinets</span>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{formatCurrency(plan.revenue)}/mois</p>
                    <p className="text-xs text-gray-500">{plan.percentage.toFixed(1)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Features populaires */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-gray-500" />
              Features Populaires
            </CardTitle>
            <CardDescription>Les plus utilisées ce mois</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.topFeatures.map((feature, index) => (
                <div key={feature.code} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded-full text-xs font-medium">
                        {index + 1}
                      </span>
                      <span className="font-medium text-gray-900">{feature.name}</span>
                    </div>
                    <span className="text-sm text-gray-600">
                      {formatNumber(feature.usageCount)} utilisations
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${feature.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Nouveaux ce mois */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-500" />
            Nouveautés ce mois
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Building2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-3xl font-bold text-green-800">+{stats.newCabinetsThisMonth}</p>
              <p className="text-sm text-green-600">Nouveaux cabinets</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-3xl font-bold text-blue-800">+{stats.newUsersThisMonth}</p>
              <p className="text-sm text-blue-600">Nouveaux utilisateurs</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Database className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-3xl font-bold text-purple-800">+{stats.newClientsThisMonth}</p>
              <p className="text-sm text-purple-600">Nouveaux clients</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
