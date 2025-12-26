'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_common/components/ui/Card'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import { formatCurrency } from '@/app/_common/lib/utils'
import {
  AlertCircle,
  CheckCircle,
  TrendingUp,
  FileText,
  Target,
  Shield,
  ChevronRight,
  Info
} from 'lucide-react'
import type { ClientDetail, WealthSummary } from '@/app/_common/lib/api-types'
import { SimulationHistory } from './SimulationHistory'
import { PatrimonyDonutChart } from './charts/PatrimonyDonutChart'
import { EvolutionChart } from './charts/EvolutionChart'
import { BudgetEvolutionChart } from './charts/BudgetEvolutionChart'
import type {
  OverviewData,
  Alert
} from '@/app/_common/lib/services/overview-service'

interface TabOverviewProps {
  clientId: string
  client: ClientDetail
  wealth?: WealthSummary
  onTabChange?: (tabId: string) => void
}

// Alert severity badge mapping
const ALERT_BADGE_MAP: Record<string, { variant: 'destructive' | 'warning' | 'default' | 'success'; label: string }> = {
  CRITICAL: { variant: 'destructive', label: 'Urgent' },
  WARNING: { variant: 'warning', label: 'Attention' },
  INFO: { variant: 'default', label: 'Info' }
}

// Alert icon mapping
const ALERT_ICON_MAP: Record<string, typeof AlertCircle> = {
  CRITICAL: AlertCircle,
  WARNING: AlertCircle,
  INFO: Info
}

export function TabOverview({ clientId, client, wealth, onTabChange }: TabOverviewProps) {
  const [overviewData, setOverviewData] = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'monthly' | 'yearly'>('monthly')

  // Fetch overview data
  const fetchOverviewData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/advisor/clients/${clientId}/overview`)

      if (!response.ok) {
        throw new Error('Failed to fetch overview data')
      }

      const result = await response.json()
      setOverviewData(result.data)
    } catch (err) {
      console.error('Error fetching overview data:', err)
      setError('Impossible de charger les données')
    } finally {
      setLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    fetchOverviewData()
  }, [fetchOverviewData])

  // Handle KPI card click for navigation
  const handleKPIClick = (tabId: string) => {
    if (onTabChange) {
      onTabChange(tabId)
    }
  }

  // Loading state
  if (loading) {
    return <TabOverviewSkeleton />
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
        <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
        <p className="text-destructive font-medium">{error}</p>
        <button
          onClick={fetchOverviewData}
          className="mt-4 text-sm text-primary hover:underline"
        >
          Réessayer
        </button>
      </div>
    )
  }

  // Use fetched data or fallback to wealth prop
  const patrimonyData = overviewData?.patrimony || {
    totalGross: wealth?.totalActifs || 0,
    totalNet: wealth?.patrimoineNet || 0,
    allocation: wealth?.allocationByCategory?.map(item => ({
      category: item.category,
      value: item.value,
      percentage: item.percentage,
      color: getCategoryColor(item.category)
    })) || [],
    evolution: []
  }

  const indicators = overviewData?.indicators || {
    currentTaxation: 0,
    taxableIncome: Number(client.annualIncome) || 0,
    activeContractsCount: 0,
    riskLevel: client.riskProfile || 'MOYENNE',
    priorityObjectives: []
  }

  const alerts = overviewData?.alerts || generateFallbackAlerts(client)
  const budgetEvolution = overviewData?.budgetEvolution || []

  return (
    <div className="space-y-6">
      {/* Patrimony Summary with Donut Chart */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Donut Chart Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Répartition du patrimoine</span>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">
                  {formatCurrency(patrimonyData.totalNet)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Patrimoine net
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PatrimonyDonutChart
              allocation={patrimonyData.allocation}
              totalGross={patrimonyData.totalGross}
              totalNet={patrimonyData.totalNet}
            />
          </CardContent>
        </Card>

        {/* KPI Cards Grid */}
        <div className="grid gap-4 grid-cols-2">
          <KPICard
            title="Fiscalité actuelle"
            value={formatCurrency(indicators.currentTaxation)}
            subtitle="IR estimé"
            icon={TrendingUp}
            onClick={() => handleKPIClick('taxation')}
          />
          <KPICard
            title="Revenu imposable"
            value={formatCurrency(indicators.taxableIncome)}
            subtitle="Annuel"
            icon={TrendingUp}
            onClick={() => handleKPIClick('taxation')}
          />
          <KPICard
            title="Contrats actifs"
            value={indicators.activeContractsCount.toString()}
            subtitle="En cours"
            icon={FileText}
            onClick={() => handleKPIClick('contracts')}
          />
          <KPICard
            title="Profil de risque"
            value={getRiskLevelLabel(indicators.riskLevel)}
            subtitle="Niveau"
            icon={Shield}
            variant={getRiskLevelVariant(indicators.riskLevel)}
            onClick={() => handleKPIClick('kyc')}
          />
        </div>
      </div>

      {/* Evolution Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Patrimony Evolution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Évolution du patrimoine</span>
              <ViewModeToggle value={viewMode} onChange={setViewMode} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EvolutionChart
              data={patrimonyData.evolution}
              viewMode={viewMode}
            />
          </CardContent>
        </Card>

        {/* Budget Evolution (Revenue vs Expenses) */}
        <Card>
          <CardHeader>
            <CardTitle>Revenus vs Dépenses</CardTitle>
          </CardHeader>
          <CardContent>
            <BudgetEvolutionChart data={budgetEvolution} />
          </CardContent>
        </Card>
      </div>

      {/* Priority Objectives */}
      {indicators.priorityObjectives.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Objectifs prioritaires
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {indicators.priorityObjectives.map((objective, index) => (
                <Badge key={index} variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                  {objective}
                </Badge>
              ))}
            </div>
            <button
              onClick={() => handleKPIClick('objectives')}
              className="mt-4 text-sm text-primary hover:underline flex items-center gap-1"
            >
              Voir tous les objectifs
              <ChevronRight className="h-4 w-4" />
            </button>
          </CardContent>
        </Card>
      )}

      {/* Alerts Section */}
      <AlertsSection alerts={alerts} clientId={clientId} />

      {/* Simulation History */}
      <SimulationHistory clientId={clientId} />

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Activité récente</CardTitle>
        </CardHeader>
        <CardContent>
          {client.timelineEvents && client.timelineEvents.length > 0 ? (
            <div className="space-y-4">
              {client.timelineEvents.slice(0, 5).map((event) => (
                <div key={event.id} className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">{event.title}</p>
                    {event.description && (
                      <p className="text-sm text-muted-foreground">{event.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {new Date(event.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucune activité récente
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================================
// Sub-components
// ============================================================================

interface KPICardProps {
  title: string
  value: string
  subtitle: string
  icon: typeof TrendingUp
  variant?: 'default' | 'success' | 'warning' | 'destructive'
  onClick?: () => void
}

function KPICard({ title, value, subtitle, icon: Icon, variant = 'default', onClick }: KPICardProps) {
  const variantStyles = {
    default: 'text-foreground',
    success: 'text-success',
    warning: 'text-warning',
    destructive: 'text-destructive'
  }

  return (
    <Card
      className={onClick ? 'cursor-pointer hover:bg-muted/50 transition-colors' : ''}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Icon className="h-4 w-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${variantStyles[variant]}`}>
          {value}
        </div>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  )
}

interface ViewModeToggleProps {
  value: 'monthly' | 'yearly'
  onChange: (value: 'monthly' | 'yearly') => void
}

function ViewModeToggle({ value, onChange }: ViewModeToggleProps) {
  return (
    <div className="flex rounded-lg border p-1 text-sm">
      <button
        className={`px-3 py-1 rounded ${value === 'monthly' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        onClick={() => onChange('monthly')}
      >
        Mensuel
      </button>
      <button
        className={`px-3 py-1 rounded ${value === 'yearly' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        onClick={() => onChange('yearly')}
      >
        Annuel
      </button>
    </div>
  )
}

interface AlertsSectionProps {
  alerts: Alert[]
  clientId: string
}

function AlertsSection({ alerts, clientId: _clientId }: AlertsSectionProps) {
  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Alertes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 rounded-lg border border-success/50 bg-success/10 p-3">
            <CheckCircle className="h-5 w-5 text-success shrink-0" />
            <div>
              <p className="font-medium text-sm">Aucune alerte</p>
              <p className="text-sm text-muted-foreground">
                Tout est en ordre pour ce client
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alertes prioritaires</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.map((alert) => {
            const Icon = ALERT_ICON_MAP[alert.type] || Info
            const badgeConfig = ALERT_BADGE_MAP[alert.type] || { variant: 'default' as const, label: 'Info' }
            const borderColor = alert.type === 'CRITIQUE' ? 'border-destructive/50 bg-destructive/10' :
              alert.type === 'WARNING' ? 'border-warning/50 bg-warning/10' :
                'border-muted'
            const iconColor = alert.type === 'CRITIQUE' ? 'text-destructive' :
              alert.type === 'WARNING' ? 'text-warning' :
                'text-muted-foreground'

            return (
              <div
                key={alert.id}
                className={`flex items-start gap-3 rounded-lg border p-3 ${borderColor}`}
              >
                <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${iconColor}`} />
                <div className="flex-1">
                  <p className="font-medium text-sm">{alert.title}</p>
                  <p className="text-sm text-muted-foreground">{alert.message}</p>
                  {alert.actionLink && (
                    <a
                      href={alert.actionLink}
                      className="text-sm text-primary hover:underline mt-1 inline-block"
                    >
                      {alert.actionLabel || 'Voir détails'}
                    </a>
                  )}
                </div>
                <Badge variant={badgeConfig.variant}>{badgeConfig.label}</Badge>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

function TabOverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-80 w-full rounded-lg" />
        <div className="grid gap-4 grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-64 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
      <Skeleton className="h-48 w-full rounded-lg" />
    </div>
  )
}

// ============================================================================
// Helper Functions
// ============================================================================

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    IMMOBILIER: '#3B82F6',
    FINANCIER: '#10B981',
    PROFESSIONNEL: '#F59E0B',
    AUTRES: '#8B5CF6',
    AUTRE: '#8B5CF6'
  }
  return colors[category] || '#6B7280'
}

function getRiskLevelLabel(level: string): string {
  const labels: Record<string, string> = {
    LOW: 'Prudent',
    MEDIUM: 'Équilibré',
    HIGH: 'Dynamique',
    CONSERVATIVE: 'Prudent',
    BALANCED: 'Équilibré',
    AGGRESSIVE: 'Dynamique'
  }
  return labels[level] || level
}

function getRiskLevelVariant(level: string): 'default' | 'success' | 'warning' | 'destructive' {
  const variants: Record<string, 'default' | 'success' | 'warning' | 'destructive'> = {
    LOW: 'success',
    CONSERVATIVE: 'success',
    MEDIUM: 'default',
    BALANCED: 'default',
    HIGH: 'warning',
    AGGRESSIVE: 'warning'
  }
  return variants[level] || 'default'
}

function generateFallbackAlerts(client: ClientDetail): Alert[] {
  const alerts: Alert[] = []

  if (client.kycStatus === 'EXPIRE') {
    alerts.push({
      id: `kyc-expired-${client.id}`,
      type: 'CRITIQUE',
      title: 'KYC expiré',
      message: 'Le KYC de ce client a expiré et doit être renouvelé',
      actionLink: `/dashboard/clients/${client.id}?tab=kyc`,
      actionLabel: 'Renouveler KYC'
    })
  } else if (client.kycStatus === 'EN_ATTENTE') {
    alerts.push({
      id: `kyc-pending-${client.id}`,
      type: 'WARNING',
      title: 'KYC incomplet',
      message: 'Le KYC de ce client n\'est pas encore complété',
      actionLink: `/dashboard/clients/${client.id}?tab=kyc`,
      actionLabel: 'Compléter KYC'
    })
  }

  return alerts
}
