"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  useAffaires, 
  useAffairesEnCours, 
  useOperationsGestion,
  useOperationsStats 
} from '@/app/_common/hooks/api/use-operations-api'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_common/components/ui/Card'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Button } from '@/app/_common/components/ui/Button'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import { cn } from '@/app/_common/lib/utils'
import {
  Briefcase,
  TrendingUp,
  Clock,
  Settings,
  ChevronRight,
  RefreshCw,
  Plus,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  PauseCircle,
  ArrowRight,
  Euro,
  BarChart3,
  Target,
} from 'lucide-react'
import {
  AFFAIRE_STATUS_LABELS,
  PRODUCT_TYPE_LABELS,
  OPERATION_GESTION_TYPE_LABELS,
  type AffaireStatus,
  type ProductType,
} from '@/lib/operations/types'

// ============================================================================
// Types
// ============================================================================

interface KPICardProps {
  title: string
  value: number | string
  icon: React.ElementType
  subtitle?: string
  color: 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky' | 'gray' | 'violet'
  onClick?: () => void
  loading?: boolean
}

interface SectionCardProps {
  title: string
  description: string
  icon: React.ElementType
  color: 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky' | 'violet'
  stats: { label: string; value: number | string }[]
  onClick: () => void
  loading?: boolean
  badge?: { label: string; variant: 'warning' | 'danger' | 'success' }
}

// ============================================================================
// Color Configuration
// ============================================================================

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
  gray: {
    bg: 'bg-gray-50',
    icon: 'text-gray-600',
    iconBg: 'bg-gray-100',
    border: 'hover:border-gray-200',
  },
  violet: {
    bg: 'bg-violet-50',
    icon: 'text-violet-600',
    iconBg: 'bg-violet-100',
    border: 'hover:border-violet-200',
  },
}

const statusColors: Record<AffaireStatus, string> = {
  PROSPECT: 'bg-gray-100 text-gray-700',
  QUALIFICATION: 'bg-sky-100 text-sky-700',
  CONSTITUTION: 'bg-indigo-100 text-indigo-700',
  SIGNATURE: 'bg-violet-100 text-violet-700',
  ENVOYE: 'bg-amber-100 text-amber-700',
  EN_TRAITEMENT: 'bg-orange-100 text-orange-700',
  VALIDE: 'bg-emerald-100 text-emerald-700',
  REJETE: 'bg-rose-100 text-rose-700',
  ANNULE: 'bg-gray-100 text-gray-500',
}

// ============================================================================
// KPI Card Component
// ============================================================================

function KPICard({ 
  title, 
  value, 
  icon: Icon, 
  subtitle, 
  color,
  onClick,
  loading 
}: KPICardProps) {
  const config = colorConfig[color]

  if (loading) {
    return (
      <Card className="relative overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-3 flex-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-10 w-10 rounded-xl" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      interactive={!!onClick}
      className={cn('group relative overflow-hidden', onClick && config.border)}
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
                {typeof value === 'number' ? value.toLocaleString('fr-FR') : value}
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

        {onClick && (
          <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <ChevronRight className="h-4 w-4 text-gray-400" />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Section Card Component
// ============================================================================

function SectionCard({
  title,
  description,
  icon: Icon,
  color,
  stats,
  onClick,
  loading,
  badge,
}: SectionCardProps) {
  const config = colorConfig[color]

  if (loading) {
    return (
      <Card className="relative overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Skeleton className="h-12 w-12 rounded-xl" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
              <div className="flex gap-4 pt-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      interactive
      className={cn('group relative overflow-hidden cursor-pointer', config.border)}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className={cn('p-3 rounded-xl', config.iconBg)}>
            <Icon className={cn('h-6 w-6', config.icon)} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              {badge && (
                <Badge 
                  variant={badge.variant === 'warning' ? 'warning' : badge.variant === 'danger' ? 'danger' : 'success'}
                  size="xs"
                >
                  {badge.label}
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-500 mb-4">{description}</p>
            
            <div className="flex flex-wrap gap-4">
              {stats.map((stat, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-lg font-bold text-gray-900">
                    {typeof stat.value === 'number' ? stat.value.toLocaleString('fr-FR') : stat.value}
                  </span>
                  <span className="text-xs text-gray-500">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <ArrowRight className="h-5 w-5 text-gray-400" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Pipeline by Amount Section
// ============================================================================

function PipelineByAmountSection({ 
  pipelineByProductType,
  loading 
}: { 
  pipelineByProductType: Record<ProductType, number> | undefined
  loading: boolean 
}) {
  if (loading) {
    return (
      <Card>
        <CardHeader bordered>
          <CardTitle size="md" className="flex items-center gap-2">
            <Euro className="h-4 w-4 text-emerald-500" />
            Pipeline par montant
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-100">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-4 flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const sortedProducts = pipelineByProductType 
    ? Object.entries(pipelineByProductType)
        .filter(([, value]) => value > 0)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 6)
    : []

  const totalPipeline = sortedProducts.reduce((sum, [, value]) => sum + value, 0)

  return (
    <Card>
      <CardHeader bordered>
        <div className="flex items-center justify-between">
          <CardTitle size="md" className="flex items-center gap-2">
            <Euro className="h-4 w-4 text-emerald-500" />
            Pipeline par montant
          </CardTitle>
          <span className="text-sm font-semibold text-gray-900">
            {totalPipeline.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {sortedProducts.length === 0 ? (
          <div className="p-8 text-center">
            <BarChart3 className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-900">Aucune affaire en cours</p>
            <p className="text-xs text-gray-500 mt-1">
              Créez votre première affaire pour voir le pipeline
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {sortedProducts.map(([productType, amount]) => {
              const percentage = totalPipeline > 0 ? (amount / totalPipeline) * 100 : 0
              return (
                <div key={productType} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">
                      {PRODUCT_TYPE_LABELS[productType as ProductType] || productType}
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#7373FF] rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Status Counters Section
// ============================================================================

function StatusCountersSection({ 
  affairesByStatus,
  loading,
  onStatusClick
}: { 
  affairesByStatus: Record<AffaireStatus, number> | undefined
  loading: boolean
  onStatusClick: (status: AffaireStatus) => void
}) {
  const router = useRouter()

  if (loading) {
    return (
      <Card>
        <CardHeader bordered>
          <CardTitle size="md" className="flex items-center gap-2">
            <Target className="h-4 w-4 text-indigo-500" />
            Affaires par statut
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const statusOrder: AffaireStatus[] = [
    'PROSPECT', 'QUALIFICATION', 'CONSTITUTION', 
    'SIGNATURE', 'ENVOYE', 'EN_TRAITEMENT',
    'VALIDE', 'REJETE', 'ANNULE'
  ]

  return (
    <Card>
      <CardHeader bordered>
        <CardTitle size="md" className="flex items-center gap-2">
          <Target className="h-4 w-4 text-indigo-500" />
          Affaires par statut
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-3 gap-3">
          {statusOrder.map((status) => {
            const count = affairesByStatus?.[status] || 0
            return (
              <button
                key={status}
                onClick={() => onStatusClick(status)}
                className={cn(
                  'p-3 rounded-lg text-left transition-all hover:scale-[1.02]',
                  statusColors[status]
                )}
              >
                <div className="text-lg font-bold">{count}</div>
                <div className="text-xs truncate">{AFFAIRE_STATUS_LABELS[status]}</div>
              </button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Quick Actions Section
// ============================================================================

function QuickActionsSection() {
  const router = useRouter()

  const actions = [
    { 
      icon: Plus, 
      label: 'Nouvelle affaire', 
      path: '/dashboard/operations/affaires-nouvelles/nouvelle',
      color: 'bg-[#7373FF]/10 text-[#7373FF]'
    },
    { 
      icon: FileText, 
      label: 'Affaires nouvelles', 
      path: '/dashboard/operations/affaires-nouvelles',
      color: 'bg-sky-50 text-sky-600'
    },
    { 
      icon: Clock, 
      label: 'Affaires en cours', 
      path: '/dashboard/operations/en-cours',
      color: 'bg-amber-50 text-amber-600'
    },
    { 
      icon: Settings, 
      label: 'Opérations gestion', 
      path: '/dashboard/operations/gestion',
      color: 'bg-violet-50 text-violet-600'
    },
  ]

  return (
    <Card>
      <CardHeader bordered>
        <CardTitle size="md">Accès rapides</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action) => (
            <button
              key={action.path}
              onClick={() => router.push(action.path)}
              className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-left group"
            >
              <div className={cn('p-2 rounded-lg', action.color)}>
                <action.icon className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                {action.label}
              </span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Main Dashboard Component
// ============================================================================

export default function OperationsDashboardPage() {
  const router = useRouter()
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Fetch data
  const { 
    data: statsData, 
    isLoading: statsLoading, 
    refetch: refetchStats 
  } = useOperationsStats()
  
  const { 
    data: affairesEnCoursData, 
    isLoading: enCoursLoading,
    refetch: refetchEnCours 
  } = useAffairesEnCours()

  const { 
    data: operationsGestionData, 
    isLoading: gestionLoading,
    refetch: refetchGestion 
  } = useOperationsGestion()

  const stats = statsData
  const affairesEnCours = affairesEnCoursData?.data || []
  const operationsGestion = operationsGestionData?.data || []

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await Promise.all([refetchStats(), refetchEnCours(), refetchGestion()])
    setIsRefreshing(false)
  }

  // Calculate counts
  const affairesNouvellesCount = stats?.affairesNouvellesByStatus 
    ? Object.values(stats.affairesNouvellesByStatus).reduce((a, b) => a + b, 0)
    : 0
  
  const affairesEnCoursCount = stats?.affairesEnCoursCount || affairesEnCours.length
  
  const operationsGestionPendingCount = operationsGestion.filter(
    op => op.status !== 'EXECUTE' && op.status !== 'REJETE'
  ).length

  // Count affaires en cours by inactivity category
  const enCoursRed = affairesEnCours.filter(a => a.inactivityCategory === 'RED').length
  const enCoursOrange = affairesEnCours.filter(a => a.inactivityCategory === 'ORANGE').length

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-[#7373FF]/10 rounded-xl">
              <Briefcase className="h-6 w-6 text-[#7373FF]" />
            </div>
            Mes Opérations
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gérez vos affaires nouvelles, en cours et opérations de gestion
          </p>
        </div>
        <div className="flex items-center gap-3">
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
          <Button
            size="sm"
            onClick={() => router.push('/dashboard/operations/affaires-nouvelles/nouvelle')}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Nouvelle affaire
          </Button>
        </div>
      </header>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard
          title="Pipeline total"
          value={stats?.totalPipelineValue 
            ? stats.totalPipelineValue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
            : '0 €'
          }
          icon={Euro}
          subtitle="Montant en cours"
          color="emerald"
          onClick={() => router.push('/dashboard/operations/pilotage')}
          loading={statsLoading}
        />
        <KPICard
          title="Affaires nouvelles"
          value={affairesNouvellesCount}
          icon={TrendingUp}
          subtitle="Total en pipeline"
          color="indigo"
          onClick={() => router.push('/dashboard/operations/affaires-nouvelles')}
          loading={statsLoading}
        />
        <KPICard
          title="Affaires en cours"
          value={affairesEnCoursCount}
          icon={Clock}
          subtitle={enCoursRed > 0 ? `${enCoursRed} critique${enCoursRed > 1 ? 's' : ''}` : 'À reprendre'}
          color={enCoursRed > 0 ? 'rose' : enCoursOrange > 0 ? 'amber' : 'sky'}
          onClick={() => router.push('/dashboard/operations/en-cours')}
          loading={enCoursLoading}
        />
        <KPICard
          title="Opérations gestion"
          value={operationsGestionPendingCount}
          icon={Settings}
          subtitle="En attente"
          color="violet"
          onClick={() => router.push('/dashboard/operations/gestion')}
          loading={gestionLoading}
        />
      </div>

      {/* Main Sections */}
      <div className="grid grid-cols-1 gap-4">
        <SectionCard
          title="Affaires Nouvelles"
          description="Nouvelles souscriptions et ventes en cours de traitement"
          icon={TrendingUp}
          color="indigo"
          stats={[
            { label: 'en pipeline', value: affairesNouvellesCount },
            { label: 'en signature', value: stats?.affairesNouvellesByStatus?.SIGNATURE || 0 },
            { label: 'validées', value: stats?.affairesNouvellesByStatus?.VALIDE || 0 },
          ]}
          onClick={() => router.push('/dashboard/operations/affaires-nouvelles')}
          loading={statsLoading}
        />

        <SectionCard
          title="Affaires en Cours"
          description="Affaires nécessitant une action ou en attente de documents"
          icon={Clock}
          color="amber"
          stats={[
            { label: 'total', value: affairesEnCoursCount },
            { label: 'critiques', value: enCoursRed },
            { label: 'à surveiller', value: enCoursOrange },
          ]}
          onClick={() => router.push('/dashboard/operations/en-cours')}
          loading={enCoursLoading}
          badge={enCoursRed > 0 ? { label: `${enCoursRed} urgent${enCoursRed > 1 ? 's' : ''}`, variant: 'danger' } : undefined}
        />

        <SectionCard
          title="Opérations de Gestion"
          description="Arbitrages, rachats, versements et autres opérations post-vente"
          icon={Settings}
          color="violet"
          stats={[
            { label: 'en cours', value: operationsGestionPendingCount },
            { label: 'exécutées', value: operationsGestion.filter(op => op.status === 'EXECUTE').length },
          ]}
          onClick={() => router.push('/dashboard/operations/gestion')}
          loading={gestionLoading}
        />
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column - Pipeline by Amount */}
        <div className="xl:col-span-2">
          <PipelineByAmountSection 
            pipelineByProductType={stats?.pipelineByProductType}
            loading={statsLoading}
          />
        </div>

        {/* Right Column - Status Counters & Quick Actions */}
        <div className="space-y-6">
          <StatusCountersSection 
            affairesByStatus={stats?.affairesNouvellesByStatus}
            loading={statsLoading}
            onStatusClick={(status) => router.push(`/dashboard/operations/affaires-nouvelles?status=${status}`)}
          />
          <QuickActionsSection />
        </div>
      </div>
    </div>
  )
}
