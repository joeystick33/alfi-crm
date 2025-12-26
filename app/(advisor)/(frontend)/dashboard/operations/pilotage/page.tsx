"use client"

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  usePipelineStats,
  useOperationStats,
  useProviderPerformance,
  useOperationsDashboard,
  type PeriodFilter,
} from '@/app/_common/hooks/api/use-compliance-pilotage-api'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_common/components/ui/Card'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Button } from '@/app/_common/components/ui/Button'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import { Progress } from '@/app/_common/components/ui/Progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/_common/components/ui/Select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/app/_common/components/ui/DropdownMenu'
import { cn } from '@/app/_common/lib/utils'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Euro,
  Clock,
  Target,
  Users,
  FileText,
  Download,
  RefreshCw,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  PieChart,
  Activity,
  AlertCircle,
} from 'lucide-react'
import {
  AFFAIRE_STATUS_LABELS,
  PRODUCT_TYPE_LABELS,
  OPERATION_GESTION_TYPE_LABELS,
  type AffaireStatus,
  type ProductType,
  type OperationGestionType,
} from '@/lib/operations/types'

// ============================================================================
// Types
// ============================================================================

interface KPICardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: number
  trendLabel?: string
  icon: React.ElementType
  iconColor?: string
  loading?: boolean
}

// ============================================================================
// Period Labels
// ============================================================================

const PERIOD_LABELS: Record<PeriodFilter, string> = {
  week: 'Cette semaine',
  month: 'Ce mois',
  quarter: 'Ce trimestre',
  year: 'Cette année',
}

// ============================================================================
// KPI Card Component
// ============================================================================

function KPICard({
  title,
  value,
  subtitle,
  trend,
  trendLabel,
  icon: Icon,
  iconColor = 'text-[#7373FF]',
  loading,
}: KPICardProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-4 w-24 mb-4" />
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-20" />
        </CardContent>
      </Card>
    )
  }

  const isPositiveTrend = trend && trend > 0
  const isNegativeTrend = trend && trend < 0

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            {subtitle && (
              <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
          <div className={cn('p-3 rounded-xl bg-gray-100', iconColor.replace('text-', 'bg-').replace('600', '100'))}>
            <Icon className={cn('h-6 w-6', iconColor)} />
          </div>
        </div>
        {trend !== undefined && (
          <div className="flex items-center gap-1 mt-3">
            {isPositiveTrend ? (
              <ArrowUpRight className="h-4 w-4 text-emerald-600" />
            ) : isNegativeTrend ? (
              <ArrowDownRight className="h-4 w-4 text-rose-600" />
            ) : null}
            <span className={cn(
              'text-sm font-medium',
              isPositiveTrend ? 'text-emerald-600' : isNegativeTrend ? 'text-rose-600' : 'text-gray-500'
            )}>
              {trend > 0 ? '+' : ''}{trend}%
            </span>
            {trendLabel && (
              <span className="text-sm text-gray-500 ml-1">{trendLabel}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Pipeline Funnel Component
// ============================================================================

function PipelineFunnel({
  stages,
  loading,
}: {
  stages: Array<{ status: AffaireStatus; count: number; value: number; conversionRate: number }>
  loading?: boolean
}) {
  if (loading) {
    return (
      <Card>
        <CardHeader bordered>
          <CardTitle size="lg">Pipeline Commercial</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const maxValue = Math.max(...stages.map(s => s.value), 1)

  return (
    <Card>
      <CardHeader bordered>
        <CardTitle size="lg">Pipeline Commercial</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {stages.map((stage, idx) => (
            <div key={stage.status} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-900">
                  {AFFAIRE_STATUS_LABELS[stage.status]}
                </span>
                <div className="flex items-center gap-4">
                  <span className="text-gray-500">{stage.count} affaires</span>
                  <span className="font-semibold text-gray-900">
                    {stage.value.toLocaleString('fr-FR', { 
                      style: 'currency', 
                      currency: 'EUR',
                      maximumFractionDigits: 0,
                      notation: 'compact',
                    })}
                  </span>
                </div>
              </div>
              <div className="relative">
                <div className="h-8 bg-gray-100 rounded-lg overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-lg transition-all',
                      idx === 0 ? 'bg-blue-500' :
                      idx === 1 ? 'bg-indigo-500' :
                      idx === 2 ? 'bg-violet-500' :
                      idx === 3 ? 'bg-purple-500' :
                      'bg-emerald-500'
                    )}
                    style={{ width: `${(stage.value / maxValue) * 100}%` }}
                  />
                </div>
                {stage.conversionRate > 0 && idx < stages.length - 1 && (
                  <div className="absolute -bottom-1 right-0 text-xs text-gray-500">
                    → {stage.conversionRate}%
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Product Type Distribution Component
// ============================================================================

function ProductDistribution({
  data,
  loading,
}: {
  data: Array<{ productType: ProductType; count: number; value: number }>
  loading?: boolean
}) {
  if (loading) {
    return (
      <Card>
        <CardHeader bordered>
          <CardTitle size="lg">Répartition par Produit</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const totalValue = data.reduce((sum, d) => sum + d.value, 0)

  return (
    <Card>
      <CardHeader bordered>
        <CardTitle size="lg">Répartition par Produit</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-3">
          {data.slice(0, 6).map((item) => {
            const percentage = totalValue > 0 ? (item.value / totalValue) * 100 : 0
            return (
              <div key={item.productType} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{PRODUCT_TYPE_LABELS[item.productType]}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="default" size="xs">{item.count}</Badge>
                    <span className="font-medium text-gray-900 w-20 text-right">
                      {item.value.toLocaleString('fr-FR', { 
                        style: 'currency', 
                        currency: 'EUR',
                        maximumFractionDigits: 0,
                        notation: 'compact',
                      })}
                    </span>
                  </div>
                </div>
                <Progress value={percentage} className="h-2" />
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Provider Performance Component
// ============================================================================

function ProviderPerformanceTable({
  providers,
  loading,
}: {
  providers: Array<{
    providerId: string
    providerName: string
    totalVolume: number
    activeContracts: number
    averageProcessingTime: number
    rejectionRate: number
  }>
  loading?: boolean
}) {
  if (loading) {
    return (
      <Card>
        <CardHeader bordered>
          <CardTitle size="lg">Performance Fournisseurs</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader bordered>
        <CardTitle size="lg">Performance Fournisseurs</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fournisseur
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Volume
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contrats
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Délai moyen
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Taux rejet
                </th>
              </tr>
            </thead>
            <tbody>
              {providers.map((provider) => (
                <tr key={provider.providerId} className="border-b border-gray-100 hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-gray-100 rounded-lg">
                        <Building2 className="h-4 w-4 text-gray-500" />
                      </div>
                      <span className="font-medium text-gray-900">{provider.providerName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">
                    {provider.totalVolume.toLocaleString('fr-FR', { 
                      style: 'currency', 
                      currency: 'EUR',
                      maximumFractionDigits: 0,
                      notation: 'compact',
                    })}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">
                    {provider.activeContracts}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">
                    {provider.averageProcessingTime}j
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Badge 
                      variant={provider.rejectionRate < 5 ? 'success' : provider.rejectionRate < 10 ? 'warning' : 'danger'}
                      size="sm"
                    >
                      {provider.rejectionRate}%
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}


// ============================================================================
// Operations by Type Component
// ============================================================================

function OperationsByType({
  data,
  loading,
}: {
  data: Array<{
    type: OperationGestionType
    count: number
    totalAmount: number
    averageProcessingDays: number
  }>
  loading?: boolean
}) {
  if (loading) {
    return (
      <Card>
        <CardHeader bordered>
          <CardTitle size="lg">Opérations de Gestion</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader bordered>
        <CardTitle size="lg">Opérations de Gestion</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-3">
          {data.map((item) => (
            <div 
              key={item.type} 
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg border border-gray-200">
                  <Activity className="h-4 w-4 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {OPERATION_GESTION_TYPE_LABELS[item.type]}
                  </p>
                  <p className="text-xs text-gray-500">
                    Délai moyen: {item.averageProcessingDays}j
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">
                  {item.totalAmount.toLocaleString('fr-FR', { 
                    style: 'currency', 
                    currency: 'EUR',
                    maximumFractionDigits: 0,
                  })}
                </p>
                <p className="text-xs text-gray-500">{item.count} opérations</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Affaires En Cours Summary Component
// ============================================================================

function AffairesEnCoursSummary({
  data,
  loading,
}: {
  data: {
    total: number
    byInactivityCategory: { green: number; orange: number; red: number }
    withMissingDocuments: number
  }
  loading?: boolean
}) {
  if (loading) {
    return (
      <Card>
        <CardHeader bordered>
          <CardTitle size="lg">Affaires en Cours</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader bordered>
        <CardTitle size="lg">Affaires en Cours</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="text-center mb-6">
          <p className="text-4xl font-bold text-gray-900">{data.total}</p>
          <p className="text-sm text-gray-500">affaires nécessitant une action</p>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 bg-emerald-50 rounded-lg">
            <p className="text-2xl font-bold text-emerald-600">{data.byInactivityCategory.green}</p>
            <p className="text-xs text-emerald-700">{"< 7 jours"}</p>
          </div>
          <div className="text-center p-3 bg-amber-50 rounded-lg">
            <p className="text-2xl font-bold text-amber-600">{data.byInactivityCategory.orange}</p>
            <p className="text-xs text-amber-700">7-30 jours</p>
          </div>
          <div className="text-center p-3 bg-rose-50 rounded-lg">
            <p className="text-2xl font-bold text-rose-600">{data.byInactivityCategory.red}</p>
            <p className="text-xs text-rose-700">{"> 30 jours"}</p>
          </div>
        </div>

        {data.withMissingDocuments > 0 && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <span className="text-sm text-amber-800">
              {data.withMissingDocuments} affaire{data.withMissingDocuments > 1 ? 's' : ''} avec documents manquants
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function PilotageCommercialPage() {
  const router = useRouter()
  const [period, setPeriod] = useState<PeriodFilter>('month')
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Fetch data
  const { data: dashboardData, isLoading: dashboardLoading, refetch } = useOperationsDashboard({ period })
  const { data: pipelineData, isLoading: pipelineLoading } = usePipelineStats({ period })
  const { data: operationData, isLoading: operationLoading } = useOperationStats({ period })
  const { data: providerData, isLoading: providerLoading } = useProviderPerformance({ period })

  const isLoading = dashboardLoading || pipelineLoading || operationLoading || providerLoading

  // Mock data for demonstration (will be replaced by real API data)
  const mockPipelineStages = useMemo(() => {
    if (pipelineData?.stages) return pipelineData.stages
    return [
      { status: 'PROSPECT' as AffaireStatus, count: 45, value: 2250000, conversionRate: 78 },
      { status: 'QUALIFICATION' as AffaireStatus, count: 35, value: 1750000, conversionRate: 85 },
      { status: 'CONSTITUTION' as AffaireStatus, count: 28, value: 1400000, conversionRate: 90 },
      { status: 'SIGNATURE' as AffaireStatus, count: 22, value: 1100000, conversionRate: 95 },
      { status: 'VALIDE' as AffaireStatus, count: 18, value: 900000, conversionRate: 100 },
    ]
  }, [pipelineData])

  const mockProductDistribution = useMemo(() => {
    if (pipelineData?.byProductType) return pipelineData.byProductType
    return [
      { productType: 'ASSURANCE_VIE' as ProductType, count: 42, value: 3500000 },
      { productType: 'PER_INDIVIDUEL' as ProductType, count: 28, value: 1200000 },
      { productType: 'SCPI' as ProductType, count: 15, value: 800000 },
      { productType: 'COMPTE_TITRES' as ProductType, count: 12, value: 600000 },
      { productType: 'PEA' as ProductType, count: 8, value: 400000 },
    ]
  }, [pipelineData])

  const mockProviders = useMemo(() => {
    if (providerData?.topProviders) return providerData.topProviders
    return [
      { providerId: '1', providerName: 'AXA', totalVolume: 2500000, activeContracts: 45, averageProcessingTime: 12, rejectionRate: 3 },
      { providerId: '2', providerName: 'Generali', totalVolume: 1800000, activeContracts: 32, averageProcessingTime: 15, rejectionRate: 5 },
      { providerId: '3', providerName: 'Allianz', totalVolume: 1200000, activeContracts: 28, averageProcessingTime: 10, rejectionRate: 2 },
      { providerId: '4', providerName: 'Swiss Life', totalVolume: 900000, activeContracts: 18, averageProcessingTime: 18, rejectionRate: 8 },
    ]
  }, [providerData])

  const mockOperationsByType = useMemo(() => {
    if (operationData?.byType) return operationData.byType
    return [
      { type: 'VERSEMENT_COMPLEMENTAIRE' as OperationGestionType, count: 35, totalAmount: 450000, averageProcessingDays: 5 },
      { type: 'ARBITRAGE' as OperationGestionType, count: 28, totalAmount: 1200000, averageProcessingDays: 3 },
      { type: 'RACHAT_PARTIEL' as OperationGestionType, count: 15, totalAmount: 320000, averageProcessingDays: 8 },
      { type: 'MODIFICATION_BENEFICIAIRE' as OperationGestionType, count: 12, totalAmount: 0, averageProcessingDays: 10 },
    ]
  }, [operationData])

  const mockAffairesEnCours = useMemo(() => {
    if (dashboardData?.affairesEnCours) return dashboardData.affairesEnCours
    return {
      total: 23,
      byInactivityCategory: { green: 8, orange: 10, red: 5 },
      withMissingDocuments: 7,
    }
  }, [dashboardData])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refetch()
    setIsRefreshing(false)
  }

  const handleExport = (format: 'pdf' | 'excel') => {
    // TODO: Implement export functionality
    console.log(`Exporting as ${format}`)
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-xl">
              <BarChart3 className="h-6 w-6 text-indigo-600" />
            </div>
            Pilotage Commercial
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Suivi du pipeline, KPIs et performance commerciale
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Period Selector */}
          <Select value={period} onValueChange={(v) => setPeriod(v as PeriodFilter)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PERIOD_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
            Actualiser
          </Button>

          {/* Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Exporter
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('pdf')}>
                <FileText className="h-4 w-4 mr-2" />
                Export PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('excel')}>
                <FileText className="h-4 w-4 mr-2" />
                Export Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Pipeline Total"
          value={pipelineData?.totalPipelineValue?.toLocaleString('fr-FR', { 
            style: 'currency', 
            currency: 'EUR',
            maximumFractionDigits: 0,
            notation: 'compact',
          }) || '6.5M €'}
          subtitle="Valeur des affaires en cours"
          trend={pipelineData?.trends?.newAffairesTrend || 12}
          trendLabel="vs période précédente"
          icon={Euro}
          iconColor="text-emerald-600"
          loading={isLoading}
        />
        <KPICard
          title="Taux de Transformation"
          value={`${pipelineData?.conversionRate || 68}%`}
          subtitle="Prospect → Validé"
          trend={pipelineData?.trends?.closedAffairesTrend || 5}
          trendLabel="vs période précédente"
          icon={Target}
          iconColor="text-blue-600"
          loading={isLoading}
        />
        <KPICard
          title="Délai Moyen"
          value={`${pipelineData?.averageTimeToClose || 28}j`}
          subtitle="Prospect → Validé"
          trend={operationData?.trends?.averageProcessingTimeTrend || -8}
          trendLabel="vs période précédente"
          icon={Clock}
          iconColor="text-amber-600"
          loading={isLoading}
        />
        <KPICard
          title="Opérations Gestion"
          value={operationData?.totalOperations || 90}
          subtitle={`${(operationData?.trends?.totalAmount || 1970000).toLocaleString('fr-FR', { 
            style: 'currency', 
            currency: 'EUR',
            maximumFractionDigits: 0,
            notation: 'compact',
          })} traités`}
          trend={operationData?.trends?.totalOperationsTrend || 15}
          trendLabel="vs période précédente"
          icon={Activity}
          iconColor="text-violet-600"
          loading={isLoading}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline Funnel - Takes 2 columns */}
        <div className="lg:col-span-2">
          <PipelineFunnel stages={mockPipelineStages} loading={isLoading} />
        </div>

        {/* Affaires En Cours Summary */}
        <div>
          <AffairesEnCoursSummary data={mockAffairesEnCours} loading={isLoading} />
        </div>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Distribution */}
        <ProductDistribution data={mockProductDistribution} loading={isLoading} />

        {/* Operations by Type */}
        <OperationsByType data={mockOperationsByType} loading={isLoading} />
      </div>

      {/* Provider Performance Table */}
      <ProviderPerformanceTable providers={mockProviders} loading={isLoading} />

      {/* Quick Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Actions rapides:</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/dashboard/operations/affaires-nouvelles/nouvelle')}
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              Nouvelle affaire
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/dashboard/operations/en-cours')}
              className="gap-2"
            >
              <AlertCircle className="h-4 w-4" />
              Voir affaires en cours
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/dashboard/operations/gestion/nouvelle')}
              className="gap-2"
            >
              <Activity className="h-4 w-4" />
              Nouvelle opération
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
