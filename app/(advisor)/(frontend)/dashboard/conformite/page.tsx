"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  useComplianceKPIs, 
  useComplianceAlerts, 
  useComplianceDocuments 
} from '@/app/_common/hooks/api/use-compliance-api'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_common/components/ui/Card'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Button } from '@/app/_common/components/ui/Button'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import { cn } from '@/app/_common/lib/utils'
import {
  Shield,
  FileCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight,
  RefreshCw,
  FileText,
  ClipboardCheck,
  MessageSquareWarning,
  Bell,
  TrendingUp,
  TrendingDown,
  Calendar,
} from 'lucide-react'
import {
  ALERT_SEVERITY_LABELS,
  ALERT_TYPE_LABELS,
  KYC_DOCUMENT_TYPE_LABELS,
  type AlertSeverity,
  type ComplianceAlert,
  type KYCDocument,
} from '@/lib/compliance/types'

// ============================================================================
// Types
// ============================================================================

interface KPICardProps {
  title: string
  value: number | string
  icon: React.ElementType
  subtitle?: string
  trend?: number
  color: 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky' | 'gray'
  onClick?: () => void
  loading?: boolean
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
}

const severityColors: Record<AlertSeverity, string> = {
  LOW: 'bg-gray-100 text-gray-700',
  WARNING: 'bg-amber-100 text-amber-700',
  HIGH: 'bg-orange-100 text-orange-700',
  CRITICAL: 'bg-rose-100 text-rose-700',
}

// ============================================================================
// KPI Card Component
// ============================================================================

function KPICard({ 
  title, 
  value, 
  icon: Icon, 
  subtitle, 
  trend,
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

        {trend !== undefined && trend !== 0 && (
          <div className="mt-4 pt-3 border-t border-gray-100">
            <div className={cn(
              'inline-flex items-center gap-1 text-xs font-medium',
              trend > 0 ? 'text-emerald-600' : 'text-rose-600'
            )}>
              {trend > 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              {trend > 0 ? '+' : ''}{trend}%
              <span className="text-gray-400 font-normal ml-1">vs mois dernier</span>
            </div>
          </div>
        )}

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
// Expiring Soon Section
// ============================================================================

function ExpiringSoonSection({ 
  documents, 
  loading,
  onViewAll 
}: { 
  documents: KYCDocument[]
  loading: boolean
  onViewAll: () => void 
}) {
  const expiringDocs = documents
    .filter(doc => doc.expiresAt && doc.status === 'VALIDE')
    .map(doc => {
      const daysUntil = Math.ceil(
        (new Date(doc.expiresAt!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
      return { ...doc, daysUntil }
    })
    .filter(doc => doc.daysUntil > 0 && doc.daysUntil <= 30)
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, 5)

  if (loading) {
    return (
      <Card>
        <CardHeader bordered>
          <div className="flex items-center justify-between">
            <CardTitle size="md" className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              Documents expirant bientôt
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-100">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader bordered>
        <div className="flex items-center justify-between">
          <CardTitle size="md" className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" />
            Documents expirant bientôt
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onViewAll}>
            Voir tout
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {expiringDocs.length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-900">Aucun document expirant</p>
            <p className="text-xs text-gray-500 mt-1">
              Tous vos documents sont à jour pour les 30 prochains jours
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {expiringDocs.map((doc) => (
              <ExpiringDocumentRow key={doc.id} document={doc} daysUntil={doc.daysUntil} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ExpiringDocumentRow({ 
  document, 
  daysUntil 
}: { 
  document: KYCDocument
  daysUntil: number 
}) {
  const router = useRouter()
  
  const urgencyColor = daysUntil <= 7 
    ? 'bg-rose-100 text-rose-700' 
    : daysUntil <= 14 
      ? 'bg-orange-100 text-orange-700' 
      : 'bg-amber-100 text-amber-700'

  return (
    <div 
      className="p-4 flex items-center gap-4 hover:bg-gray-50 cursor-pointer transition-colors"
      onClick={() => router.push(`/dashboard/conformite/documents?id=${document.id}`)}
    >
      <div className="p-2.5 bg-amber-50 rounded-lg">
        <FileText className="h-5 w-5 text-amber-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {KYC_DOCUMENT_TYPE_LABELS[document.type]}
        </p>
        <p className="text-xs text-gray-500">
          Expire le {new Date(document.expiresAt!).toLocaleDateString('fr-FR')}
        </p>
      </div>
      <Badge className={urgencyColor}>
        {daysUntil === 1 ? 'Demain' : `${daysUntil} jours`}
      </Badge>
    </div>
  )
}

// ============================================================================
// Critical Alerts Banner
// ============================================================================

function CriticalAlertsBanner({ 
  alerts, 
  loading,
  onViewAll 
}: { 
  alerts: ComplianceAlert[]
  loading: boolean
  onViewAll: () => void 
}) {
  const criticalAlerts = alerts.filter(
    a => (a.severity === 'CRITICAL' || a.severity === 'HIGH') && !a.resolved
  )

  if (loading) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
      </div>
    )
  }

  if (criticalAlerts.length === 0) {
    return null
  }

  return (
    <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
      <div className="flex items-center gap-4">
        <div className="p-2.5 bg-rose-100 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-rose-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-rose-900">
            {criticalAlerts.length} alerte{criticalAlerts.length > 1 ? 's' : ''} critique{criticalAlerts.length > 1 ? 's' : ''}
          </p>
          <p className="text-xs text-rose-700">
            {criticalAlerts[0]?.title}
            {criticalAlerts.length > 1 && ` et ${criticalAlerts.length - 1} autre${criticalAlerts.length > 2 ? 's' : ''}`}
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onViewAll}
          className="border-rose-300 text-rose-700 hover:bg-rose-100"
        >
          Voir les alertes
        </Button>
      </div>
    </div>
  )
}

// ============================================================================
// Recent Alerts Section
// ============================================================================

function RecentAlertsSection({ 
  alerts, 
  loading,
  onViewAll 
}: { 
  alerts: ComplianceAlert[]
  loading: boolean
  onViewAll: () => void 
}) {
  const recentAlerts = alerts
    .filter(a => !a.resolved)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  if (loading) {
    return (
      <Card>
        <CardHeader bordered>
          <CardTitle size="md" className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-rose-500" />
            Alertes récentes
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-100">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 flex items-center gap-4">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader bordered>
        <div className="flex items-center justify-between">
          <CardTitle size="md" className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-rose-500" />
            Alertes récentes
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onViewAll}>
            Voir tout
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {recentAlerts.length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-900">Aucune alerte active</p>
            <p className="text-xs text-gray-500 mt-1">
              Votre conformité est à jour
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentAlerts.map((alert) => (
              <AlertRow key={alert.id} alert={alert} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function AlertRow({ alert }: { alert: ComplianceAlert }) {
  const router = useRouter()
  
  return (
    <div 
      className="p-4 flex items-center gap-4 hover:bg-gray-50 cursor-pointer transition-colors"
      onClick={() => alert.actionUrl && router.push(alert.actionUrl)}
    >
      <div className={cn('p-2 rounded-full', severityColors[alert.severity])}>
        <AlertTriangle className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {alert.title}
        </p>
        <p className="text-xs text-gray-500">
          {ALERT_TYPE_LABELS[alert.type]} • {new Date(alert.createdAt).toLocaleDateString('fr-FR')}
        </p>
      </div>
      <Badge className={severityColors[alert.severity]} size="sm">
        {ALERT_SEVERITY_LABELS[alert.severity]}
      </Badge>
    </div>
  )
}

// ============================================================================
// Quick Actions Section
// ============================================================================

function QuickActionsSection() {
  const router = useRouter()

  const actions = [
    { 
      icon: FileCheck, 
      label: 'Documents KYC', 
      path: '/dashboard/conformite/documents',
      color: 'bg-blue-50 text-blue-600'
    },
    { 
      icon: ClipboardCheck, 
      label: 'Contrôles ACPR', 
      path: '/dashboard/conformite/controles',
      color: 'bg-violet-50 text-violet-600'
    },
    { 
      icon: MessageSquareWarning, 
      label: 'Réclamations', 
      path: '/dashboard/conformite/reclamations',
      color: 'bg-amber-50 text-amber-600'
    },
    { 
      icon: Bell, 
      label: 'Alertes', 
      path: '/dashboard/conformite/alertes',
      color: 'bg-rose-50 text-rose-600'
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

export default function ConformiteDashboardPage() {
  const router = useRouter()
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Fetch data
  const { 
    data: kpis, 
    isLoading: kpisLoading, 
    refetch: refetchKPIs 
  } = useComplianceKPIs()
  
  const { 
    data: alertsData, 
    isLoading: alertsLoading,
    refetch: refetchAlerts 
  } = useComplianceAlerts({ resolved: false })
  
  const { 
    data: documentsData, 
    isLoading: documentsLoading,
    refetch: refetchDocuments 
  } = useComplianceDocuments()

  const alerts = alertsData?.data || []
  const documents = documentsData?.data || []

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await Promise.all([refetchKPIs(), refetchAlerts(), refetchDocuments()])
    setIsRefreshing(false)
  }

  const criticalAlertsCount = alerts.filter(
    a => (a.severity === 'CRITICAL' || a.severity === 'HIGH') && !a.resolved
  ).length

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-[#7373FF]/10 rounded-xl">
              <Shield className="h-6 w-6 text-[#7373FF]" />
            </div>
            Conformité
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gérez vos obligations réglementaires et suivez votre conformité
          </p>
        </div>
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
      </header>

      {/* Critical Alerts Banner */}
      <CriticalAlertsBanner 
        alerts={alerts} 
        loading={alertsLoading}
        onViewAll={() => router.push('/dashboard/conformite/alertes?severity=CRITICAL,HIGH')}
      />

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard
          title="Taux de conformité"
          value={kpis ? `${Math.round(kpis.completionRate)}%` : '—'}
          icon={CheckCircle2}
          subtitle="Documents validés"
          color={kpis && kpis.completionRate >= 80 ? 'emerald' : 'amber'}
          onClick={() => router.push('/dashboard/conformite/documents')}
          loading={kpisLoading}
        />
        <KPICard
          title="Documents en attente"
          value={kpis?.documentsPending || 0}
          icon={FileCheck}
          subtitle="À valider"
          color="sky"
          onClick={() => router.push('/dashboard/conformite/documents?status=EN_ATTENTE')}
          loading={kpisLoading}
        />
        <KPICard
          title="Contrôles en retard"
          value={kpis?.controlsOverdue || 0}
          icon={ClipboardCheck}
          subtitle="Nécessitent action"
          color={kpis && kpis.controlsOverdue > 0 ? 'rose' : 'gray'}
          onClick={() => router.push('/dashboard/conformite/controles?overdueOnly=true')}
          loading={kpisLoading}
        />
        <KPICard
          title="Réclamations ouvertes"
          value={kpis?.openReclamations || 0}
          icon={MessageSquareWarning}
          subtitle={kpis?.slaBreachRate ? `${Math.round(kpis.slaBreachRate)}% SLA breach` : 'En cours'}
          color={kpis && kpis.openReclamations > 0 ? 'amber' : 'gray'}
          onClick={() => router.push('/dashboard/conformite/reclamations')}
          loading={kpisLoading}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column - Expiring Documents */}
        <div className="xl:col-span-2 space-y-6">
          <ExpiringSoonSection 
            documents={documents}
            loading={documentsLoading}
            onViewAll={() => router.push('/dashboard/conformite/documents?expiringSoon=true')}
          />
        </div>

        {/* Right Column - Alerts & Quick Actions */}
        <div className="space-y-6">
          <RecentAlertsSection 
            alerts={alerts}
            loading={alertsLoading}
            onViewAll={() => router.push('/dashboard/conformite/alertes')}
          />
          <QuickActionsSection />
        </div>
      </div>
    </div>
  )
}
