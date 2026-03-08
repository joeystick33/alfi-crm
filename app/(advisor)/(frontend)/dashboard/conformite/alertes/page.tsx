"use client"

import { Suspense, useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  useComplianceAlerts,
  useAcknowledgeComplianceAlert,
  useResolveComplianceAlert,
} from '@/app/_common/hooks/api/use-compliance-api'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_common/components/ui/Card'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Button } from '@/app/_common/components/ui/Button'
import { EmptyState } from '@/app/_common/components/ui/EmptyState'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/app/_common/components/ui/DropdownMenu'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import { cn } from '@/app/_common/lib/utils'
import {
  Bell,
  Filter,
  ChevronDown,
  X,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  ExternalLink,
  Eye,
  Clock,
  FileText,
  ClipboardCheck,
  MessageSquareWarning,
  Shield,
  RefreshCw,
} from 'lucide-react'
import { ClientLink } from '@/app/_common/components/ClientLink'
import {
  ALERT_SEVERITY,
  ALERT_TYPES,
  ALERT_SEVERITY_LABELS,
  ALERT_TYPE_LABELS,
  type ComplianceAlert,
  type AlertSeverity,
  type AlertType,
} from '@/lib/compliance/types'

// ============================================================================
// Types
// ============================================================================

interface AlertFiltersState {
  severity: AlertSeverity[]
  type: AlertType[]
  showResolved: boolean
}

// ============================================================================
// Severity & Type Styling
// ============================================================================

const severityConfig: Record<AlertSeverity, { 
  bg: string
  text: string
  border: string
  icon: string
  dot: string
}> = {
  LOW: {
    bg: 'bg-gray-50',
    text: 'text-gray-700',
    border: 'border-gray-200',
    icon: 'text-gray-500',
    dot: 'bg-gray-400',
  },
  WARNING: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    icon: 'text-amber-500',
    dot: 'bg-amber-400',
  },
  HIGH: {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
    icon: 'text-orange-500',
    dot: 'bg-orange-400',
  },
  CRITICAL: {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    icon: 'text-rose-500',
    dot: 'bg-rose-500',
  },
}

const typeIcons: Record<AlertType, React.ElementType> = {
  DOCUMENT_EXPIRING: Clock,
  DOCUMENT_EXPIRED: FileText,
  KYC_INCOMPLETE: FileText,
  CONTROL_OVERDUE: ClipboardCheck,
  RECLAMATION_SLA_BREACH: MessageSquareWarning,
  MIFID_OUTDATED: Shield,
  OPERATION_BLOCKED: AlertTriangle,
  AFFAIRE_INACTIVE: Clock,
}

// ============================================================================
// Filter Dropdown Component
// ============================================================================

interface FilterDropdownProps<T extends string> {
  label: string
  options: readonly T[]
  selected: T[]
  onChange: (selected: T[]) => void
  getLabel: (value: T) => string
  getColor?: (value: T) => string
}

function FilterDropdown<T extends string>({ 
  label, 
  options, 
  selected, 
  onChange,
  getLabel,
  getColor,
}: FilterDropdownProps<T>) {
  const toggleOption = (option: T) => {
    if (selected.includes(option)) {
      onChange(selected.filter(s => s !== option))
    } else {
      onChange([...selected, option])
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          {label}
          {selected.length > 0 && (
            <Badge variant="primary" size="xs">{selected.length}</Badge>
          )}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {options.map((option) => (
          <DropdownMenuItem
            key={option}
            onClick={() => toggleOption(option)}
            className="flex items-center gap-2"
          >
            <div className={cn(
              'h-4 w-4 rounded border flex items-center justify-center',
              selected.includes(option) 
                ? 'bg-[#7373FF] border-[#7373FF]' 
                : 'border-gray-300'
            )}>
              {selected.includes(option) && (
                <CheckCircle className="h-3 w-3 text-white" />
              )}
            </div>
            {getColor && (
              <span className={cn('w-2 h-2 rounded-full', getColor(option))} />
            )}
            {getLabel(option)}
          </DropdownMenuItem>
        ))}
        {selected.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onChange([])}>
              <X className="h-4 w-4 mr-2" />
              Effacer la sélection
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default function AlertesPage() {
  return (
    <Suspense fallback={null}>
      <AlertesPageInner />
    </Suspense>
  )
}

// ============================================================================
// Alert Card Component
// ============================================================================

function AlertCard({ 
  alert, 
  onAcknowledge, 
  onResolve,
  onNavigate,
  isAcknowledging,
  isResolving,
}: { 
  alert: ComplianceAlert
  onAcknowledge: () => void
  onResolve: () => void
  onNavigate: () => void
  isAcknowledging: boolean
  isResolving: boolean
}) {
  const config = severityConfig[alert.severity]
  const TypeIcon = typeIcons[alert.type]

  return (
    <Card className={cn(
      'transition-all',
      alert.resolved && 'opacity-60',
      !alert.acknowledged && !alert.resolved && config.border,
      !alert.acknowledged && !alert.resolved && 'border-l-4'
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={cn(
            'p-2.5 rounded-xl flex-shrink-0',
            config.bg
          )}>
            <TypeIcon className={cn('h-5 w-5', config.icon)} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900">{alert.title}</h3>
                  <Badge className={cn(config.bg, config.text)} size="xs">
                    {ALERT_SEVERITY_LABELS[alert.severity]}
                  </Badge>
                  {alert.acknowledged && !alert.resolved && (
                    <Badge variant="secondary" size="xs">Acquitté</Badge>
                  )}
                  {alert.resolved && (
                    <Badge variant="success" size="xs">Résolu</Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-2">{alert.description}</p>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {new Date(alert.createdAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <span>{ALERT_TYPE_LABELS[alert.type]}</span>
                  {alert.clientId && (
                    <ClientLink
                      clientId={alert.clientId}
                      showAvatar={false}
                      className="text-xs"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Action Required */}
            {!alert.resolved && (
              <div className={cn(
                'mt-3 p-3 rounded-lg',
                config.bg
              )}>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Action requise:
                </p>
                <p className="text-sm text-gray-600">{alert.actionRequired}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 mt-4">
              {alert.actionUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onNavigate}
                  className="gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Voir la source
                </Button>
              )}
              
              {!alert.acknowledged && !alert.resolved && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onAcknowledge}
                  loading={isAcknowledging}
                  className="gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Acquitter
                </Button>
              )}
              
              {!alert.resolved && (
                <Button
                  size="sm"
                  onClick={onResolve}
                  loading={isResolving}
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                >
                  <CheckCircle className="h-4 w-4" />
                  Résoudre
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Alert Skeleton
// ============================================================================

function AlertSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Stats Summary
// ============================================================================

function AlertStats({ alerts }: { alerts: ComplianceAlert[] }) {
  const stats = useMemo(() => {
    const unresolved = alerts.filter(a => !a.resolved)
    return {
      total: unresolved.length,
      critical: unresolved.filter(a => a.severity === 'CRITICAL').length,
      high: unresolved.filter(a => a.severity === 'HIGH').length,
      warning: unresolved.filter(a => a.severity === 'WARNING').length,
      low: unresolved.filter(a => a.severity === 'LOW').length,
      unacknowledged: unresolved.filter(a => !a.acknowledged).length,
    }
  }, [alerts])

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card className="border-rose-200 bg-rose-50/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-rose-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-rose-700">{stats.critical}</p>
              <p className="text-xs text-rose-600">Critiques</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-orange-200 bg-orange-50/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-700">{stats.high}</p>
              <p className="text-xs text-orange-600">Hautes</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Bell className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-700">{stats.warning}</p>
              <p className="text-xs text-amber-600">Avertissements</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Eye className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-700">{stats.unacknowledged}</p>
              <p className="text-xs text-blue-600">Non acquittées</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================================
// Main Page Component
// ============================================================================

function AlertesPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [processingAlertId, setProcessingAlertId] = useState<string | null>(null)
  const [processingAction, setProcessingAction] = useState<'acknowledge' | 'resolve' | null>(null)

  // Initialize filters from URL params
  const [filters, setFilters] = useState<AlertFiltersState>(() => {
    const severityParam = searchParams.get('severity')
    return {
      severity: severityParam ? severityParam.split(',') as AlertSeverity[] : [],
      type: [],
      showResolved: false,
    }
  })

  const { data: alertsData, isLoading, refetch } = useComplianceAlerts({
    severity: filters.severity.length > 0 ? filters.severity : undefined,
    type: filters.type.length > 0 ? filters.type : undefined,
    resolved: filters.showResolved ? undefined : false,
  })

  const acknowledgeMutation = useAcknowledgeComplianceAlert()
  const resolveMutation = useResolveComplianceAlert()

  const alerts = alertsData?.data || []

  // Sort alerts by severity and date
  const sortedAlerts = useMemo(() => {
    const severityOrder: Record<AlertSeverity, number> = {
      CRITICAL: 0,
      HIGH: 1,
      WARNING: 2,
      LOW: 3,
    }
    
    return [...alerts].sort((a, b) => {
      // Unresolved first
      if (a.resolved !== b.resolved) return a.resolved ? 1 : -1
      // Unacknowledged first
      if (a.acknowledged !== b.acknowledged) return a.acknowledged ? 1 : -1
      // Then by severity
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[a.severity] - severityOrder[b.severity]
      }
      // Then by date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [alerts])

  const handleAcknowledge = async (alertId: string) => {
    setProcessingAlertId(alertId)
    setProcessingAction('acknowledge')
    try {
      await acknowledgeMutation.mutateAsync(alertId)
      refetch()
    } finally {
      setProcessingAlertId(null)
      setProcessingAction(null)
    }
  }

  const handleResolve = async (alertId: string) => {
    setProcessingAlertId(alertId)
    setProcessingAction('resolve')
    try {
      await resolveMutation.mutateAsync(alertId)
      refetch()
    } finally {
      setProcessingAlertId(null)
      setProcessingAction(null)
    }
  }

  const handleNavigate = (alert: ComplianceAlert) => {
    if (alert.actionUrl) {
      router.push(alert.actionUrl)
    }
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.push('/dashboard/conformite')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-rose-50 rounded-xl">
                <Bell className="h-6 w-6 text-rose-600" />
              </div>
              Alertes
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Centre de gestion des alertes de conformité
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Actualiser
        </Button>
      </header>

      {/* Stats */}
      {!isLoading && <AlertStats alerts={alerts} />}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Filter className="h-4 w-4" />
              Filtres:
            </div>
            
            <FilterDropdown
              label="Sévérité"
              options={ALERT_SEVERITY}
              selected={filters.severity}
              onChange={(severity) => setFilters(prev => ({ ...prev, severity }))}
              getLabel={(s) => ALERT_SEVERITY_LABELS[s]}
              getColor={(s) => severityConfig[s].dot}
            />
            
            <FilterDropdown
              label="Type"
              options={ALERT_TYPES}
              selected={filters.type}
              onChange={(type) => setFilters(prev => ({ ...prev, type }))}
              getLabel={(t) => ALERT_TYPE_LABELS[t]}
            />
            
            <Button
              variant={filters.showResolved ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilters(prev => ({ ...prev, showResolved: !prev.showResolved }))}
              className="gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Afficher résolues
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Alerts List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <AlertSkeleton key={i} />
          ))}
        </div>
      ) : sortedAlerts.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="Aucune alerte"
          description={
            filters.severity.length > 0 || filters.type.length > 0
              ? "Aucune alerte ne correspond à vos critères de recherche."
              : "Votre conformité est à jour. Aucune alerte active."
          }
        />
      ) : (
        <div className="space-y-4">
          {sortedAlerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onAcknowledge={() => handleAcknowledge(alert.id)}
              onResolve={() => handleResolve(alert.id)}
              onNavigate={() => handleNavigate(alert)}
              isAcknowledging={processingAlertId === alert.id && processingAction === 'acknowledge'}
              isResolving={processingAlertId === alert.id && processingAction === 'resolve'}
            />
          ))}
        </div>
      )}
    </div>
  )
}
