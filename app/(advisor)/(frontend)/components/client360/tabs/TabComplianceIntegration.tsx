'use client'

/**
 * TabComplianceIntegration - Section Conformité intégrée dans Client 360
 * 
 * Affiche:
 * - Statut KYC global du client
 * - Timeline conformité récente
 * - Alertes de conformité actives
 * - Liens vers les opérations du client
 * 
 * @requirements 25.4 - Intégration conformité dans Client 360
 */

import { useState, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/_common/components/ui/Card'
import { Button } from '@/app/_common/components/ui/Button'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Progress } from '@/app/_common/components/ui/Progress'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import { Alert, AlertDescription } from '@/app/_common/components/ui/Alert'
import { cn, formatDate } from '@/app/_common/lib/utils'
import { useToast } from '@/app/_common/hooks/use-toast'
import {
  useComplianceDocuments,
  useComplianceAlerts,
  useComplianceTimeline,
  useComplianceControls,
  useComplianceReclamations,
  useAcknowledgeComplianceAlert,
} from '@/app/_common/hooks/api/use-compliance-api'
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  FileText,
  AlertTriangle,
  AlertCircle,
  Clock,
  CheckCircle,
  ChevronRight,
  RefreshCw,
  ExternalLink,
  Bell,
  FileWarning,
  Scale,
  History,
  Briefcase,
} from 'lucide-react'
import type { ClientDetail } from '@/app/_common/lib/api-types'
import Link from 'next/link'

// ============================================================================
// Types
// ============================================================================

interface TabComplianceIntegrationProps {
  clientId: string
  client: ClientDetail
  onTabChange?: (tabId: string) => void
}

interface KYCStatusSummary {
  status: 'COMPLETE' | 'INCOMPLETE' | 'EXPIRED' | 'PENDING'
  completionRate: number
  validDocuments: number
  pendingDocuments: number
  expiredDocuments: number
  expiringDocuments: number
  totalRequired: number
}

// ============================================================================
// Constants
// ============================================================================

const KYC_STATUS_CONFIG = {
  COMPLETE: {
    label: 'Complet',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    icon: ShieldCheck,
    bgGradient: 'from-emerald-50 to-emerald-100',
  },
  INCOMPLETE: {
    label: 'Incomplet',
    color: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: ShieldAlert,
    bgGradient: 'from-amber-50 to-amber-100',
  },
  EXPIRED: {
    label: 'Expiré',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: ShieldAlert,
    bgGradient: 'from-red-50 to-red-100',
  },
  PENDING: {
    label: 'En attente',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: Clock,
    bgGradient: 'from-blue-50 to-blue-100',
  },
}

const ALERT_SEVERITY_CONFIG = {
  CRITICAL: { color: 'bg-red-100 text-red-800 border-red-200', icon: AlertCircle },
  HIGH: { color: 'bg-orange-100 text-orange-800 border-orange-200', icon: AlertTriangle },
  WARNING: { color: 'bg-amber-100 text-amber-800 border-amber-200', icon: AlertTriangle },
  LOW: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Bell },
}

const TIMELINE_EVENT_ICONS: Record<string, typeof FileText> = {
  DOCUMENT_UPLOADED: FileText,
  DOCUMENT_VALIDATED: CheckCircle,
  DOCUMENT_REJECTED: AlertCircle,
  DOCUMENT_EXPIRED: FileWarning,
  REMINDER_SENT: Bell,
  CONTROL_CREATED: Shield,
  CONTROL_COMPLETED: ShieldCheck,
  QUESTIONNAIRE_COMPLETED: Scale,
  RECLAMATION_CREATED: AlertTriangle,
  RECLAMATION_RESOLVED: CheckCircle,
  OPERATION_CREATED: Briefcase,
  OPERATION_STATUS_CHANGED: RefreshCw,
  DOCUMENT_GENERATED: FileText,
  DOCUMENT_SIGNED: CheckCircle,
  DOCUMENT_EXPORTED: ExternalLink,
}

// ============================================================================
// Component
// ============================================================================

export function TabComplianceIntegration({ clientId, client, onTabChange }: TabComplianceIntegrationProps) {
  const { toast } = useToast()
  const [refreshing, setRefreshing] = useState(false)

  // Fetch compliance data
  const { data: documentsData, isLoading: documentsLoading, refetch: refetchDocuments } = useComplianceDocuments(
    { clientId },
    { enabled: !!clientId }
  )
  
  const { data: alertsData, isLoading: alertsLoading, refetch: refetchAlerts } = useComplianceAlerts(
    { clientId, resolved: false },
    { enabled: !!clientId }
  )
  
  const { data: timelineData, isLoading: timelineLoading, refetch: refetchTimeline } = useComplianceTimeline(
    clientId,
    undefined,
    { enabled: !!clientId }
  )
  
  const { data: controlsData, isLoading: controlsLoading, refetch: refetchControls } = useComplianceControls(
    { clientId },
    { enabled: !!clientId }
  )
  
  const { data: reclamationsData, isLoading: reclamationsLoading, refetch: refetchReclamations } = useComplianceReclamations(
    { clientId },
    { enabled: !!clientId }
  )

  const acknowledgeAlert = useAcknowledgeComplianceAlert()

  const isLoading = documentsLoading || alertsLoading || timelineLoading || controlsLoading || reclamationsLoading

  // Calculate KYC status summary
  const kycStatus = useMemo((): KYCStatusSummary => {
    const documents = documentsData?.data || []
    const now = new Date()
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

    const validDocuments = documents.filter(d => d.status === 'VALIDE').length
    const pendingDocuments = documents.filter(d => d.status === 'EN_ATTENTE').length
    const expiredDocuments = documents.filter(d => d.status === 'EXPIRE').length
    const expiringDocuments = documents.filter(d => 
      d.status === 'VALIDE' && 
      d.expiresAt && 
      new Date(d.expiresAt) <= thirtyDaysFromNow &&
      new Date(d.expiresAt) > now
    ).length

    // Required document types (simplified)
    const totalRequired = 6 // PIECE_IDENTITE, JUSTIFICATIF_DOMICILE, RIB, AVIS_IMPOSITION, JUSTIFICATIF_PATRIMOINE, ORIGINE_FONDS
    const completionRate = Math.round((validDocuments / totalRequired) * 100)

    let status: KYCStatusSummary['status'] = 'PENDING'
    if (expiredDocuments > 0) {
      status = 'EXPIRED'
    } else if (completionRate >= 100) {
      status = 'COMPLETE'
    } else if (validDocuments > 0 || pendingDocuments > 0) {
      status = 'INCOMPLETE'
    }

    return {
      status,
      completionRate: Math.min(completionRate, 100),
      validDocuments,
      pendingDocuments,
      expiredDocuments,
      expiringDocuments,
      totalRequired,
    }
  }, [documentsData])

  // Get active alerts
  const activeAlerts = useMemo(() => {
    return (alertsData?.data || []).slice(0, 5)
  }, [alertsData])

  // Get recent timeline events
  const recentTimeline = useMemo(() => {
    return (timelineData?.data || []).slice(0, 8)
  }, [timelineData])

  // Get pending controls
  const pendingControls = useMemo(() => {
    return (controlsData?.data || []).filter(c => c.status !== 'TERMINE').slice(0, 3)
  }, [controlsData])

  // Get open reclamations
  const openReclamations = useMemo(() => {
    return (reclamationsData?.data || []).filter(r => r.status !== 'CLOTUREE').slice(0, 3)
  }, [reclamationsData])

  // Refresh all data
  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await Promise.all([
        refetchDocuments(),
        refetchAlerts(),
        refetchTimeline(),
        refetchControls(),
        refetchReclamations(),
      ])
      toast({ title: 'Données actualisées' })
    } catch {
      toast({ title: 'Erreur lors de l\'actualisation', variant: 'destructive' })
    } finally {
      setRefreshing(false)
    }
  }, [refetchDocuments, refetchAlerts, refetchTimeline, refetchControls, refetchReclamations, toast])

  // Handle alert acknowledgement
  const handleAcknowledgeAlert = useCallback(async (alertId: string) => {
    try {
      await acknowledgeAlert.mutateAsync(alertId)
    } catch {
      toast({ title: 'Erreur', variant: 'destructive' })
    }
  }, [acknowledgeAlert, toast])

  // Navigate to tab
  const navigateToTab = useCallback((tabId: string) => {
    if (onTabChange) {
      onTabChange(tabId)
    }
  }, [onTabChange])

  if (isLoading) {
    return <ComplianceIntegrationSkeleton />
  }

  const statusConfig = KYC_STATUS_CONFIG[kycStatus.status]
  const StatusIcon = statusConfig.icon

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-primary-50 rounded-lg">
              <Shield className="h-6 w-6 text-primary-600" />
            </div>
            Conformité
          </h2>
          <p className="text-sm text-gray-500 mt-1 ml-14">
            Statut KYC, alertes et historique de conformité
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
            Actualiser
          </Button>
          <Link href="/dashboard/conformite">
            <Button variant="outline">
              <ExternalLink className="h-4 w-4 mr-2" />
              Dashboard Conformité
            </Button>
          </Link>
        </div>
      </header>

      {/* KYC Status Card */}
      <Card className={cn("border-2", `bg-gradient-to-br ${statusConfig.bgGradient}`)}>
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className={cn("p-3 rounded-xl", statusConfig.color)}>
                <StatusIcon className="h-8 w-8" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-semibold">Statut KYC</h3>
                  <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {kycStatus.validDocuments} documents validés sur {kycStatus.totalRequired} requis
                </p>
              </div>
            </div>
            
            <div className="flex-1 max-w-md">
              <div className="flex justify-between text-sm mb-2">
                <span>Complétude</span>
                <span className="font-semibold">{kycStatus.completionRate}%</span>
              </div>
              <Progress value={kycStatus.completionRate} className="h-3" />
            </div>
          </div>

          {/* KYC Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <StatCard
              label="Validés"
              value={kycStatus.validDocuments}
              icon={CheckCircle}
              color="text-emerald-600"
            />
            <StatCard
              label="En attente"
              value={kycStatus.pendingDocuments}
              icon={Clock}
              color="text-blue-600"
            />
            <StatCard
              label="Expirés"
              value={kycStatus.expiredDocuments}
              icon={AlertCircle}
              color="text-red-600"
            />
            <StatCard
              label="Expirent bientôt"
              value={kycStatus.expiringDocuments}
              icon={AlertTriangle}
              color="text-amber-600"
            />
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-gray-200">
            <Button size="sm" onClick={() => navigateToTab('documents')}>
              <FileText className="h-4 w-4 mr-2" />
              Gérer les documents
            </Button>
            <Link href={`/dashboard/conformite/documents?clientId=${clientId}`}>
              <Button size="sm" variant="outline">
                <ExternalLink className="h-4 w-4 mr-2" />
                Documents KYC
              </Button>
            </Link>
            <Link href={`/dashboard/operations?clientId=${clientId}`}>
              <Button size="sm" variant="outline">
                <Briefcase className="h-4 w-4 mr-2" />
                Opérations
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Alerts Section */}
      {activeAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-amber-600" />
                  Alertes actives
                </CardTitle>
                <CardDescription>
                  {activeAlerts.length} alerte{activeAlerts.length > 1 ? 's' : ''} nécessitant votre attention
                </CardDescription>
              </div>
              <Link href={`/dashboard/conformite/alertes?clientId=${clientId}`}>
                <Button variant="ghost" size="sm">
                  Voir toutes <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeAlerts.map((alert) => {
              const severityConfig = ALERT_SEVERITY_CONFIG[alert.severity as keyof typeof ALERT_SEVERITY_CONFIG] || ALERT_SEVERITY_CONFIG.LOW
              const SeverityIcon = severityConfig.icon
              
              return (
                <Alert key={alert.id} className={cn("border", severityConfig.color)}>
                  <SeverityIcon className="h-4 w-4" />
                  <AlertDescription className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{alert.title}</p>
                      <p className="text-sm text-gray-600">{alert.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!alert.acknowledged && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleAcknowledgeAlert(alert.id)}
                          disabled={acknowledgeAlert.isPending}
                        >
                          Acquitter
                        </Button>
                      )}
                      {alert.actionUrl && (
                        <Link href={alert.actionUrl}>
                          <Button size="sm" variant="outline">
                            Action
                          </Button>
                        </Link>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Grid: Controls & Reclamations */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Pending Controls */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  Contrôles en cours
                </CardTitle>
                <CardDescription>Contrôles ACPR à compléter</CardDescription>
              </div>
              <Link href={`/dashboard/conformite/controles?clientId=${clientId}`}>
                <Button variant="ghost" size="sm">
                  Voir tous <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {pendingControls.length > 0 ? (
              <div className="space-y-3">
                {pendingControls.map((control) => (
                  <div
                    key={control.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                  >
                    <div>
                      <p className="font-medium text-sm">{control.type}</p>
                      <p className="text-xs text-gray-500">
                        Échéance: {formatDate(control.dueDate)}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        control.status === 'EN_RETARD' && 'border-red-200 bg-red-50 text-red-700',
                        control.status === 'EN_COURS' && 'border-blue-200 bg-blue-50 text-blue-700',
                        control.status === 'EN_ATTENTE' && 'border-gray-200 bg-gray-50 text-gray-700'
                      )}
                    >
                      {control.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Shield className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Aucun contrôle en cours</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Open Reclamations */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  Réclamations ouvertes
                </CardTitle>
                <CardDescription>Réclamations à traiter</CardDescription>
              </div>
              <Link href={`/dashboard/conformite/reclamations?clientId=${clientId}`}>
                <Button variant="ghost" size="sm">
                  Voir toutes <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {openReclamations.length > 0 ? (
              <div className="space-y-3">
                {openReclamations.map((reclamation) => (
                  <div
                    key={reclamation.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                  >
                    <div>
                      <p className="font-medium text-sm">{reclamation.reference}</p>
                      <p className="text-xs text-gray-500 truncate max-w-[200px]">
                        {reclamation.subject}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {reclamation.slaBreach && (
                        <Badge variant="destructive" className="text-xs">SLA</Badge>
                      )}
                      <Badge variant="outline">{reclamation.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Aucune réclamation ouverte</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Timeline Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-purple-600" />
                Historique conformité
              </CardTitle>
              <CardDescription>Événements récents de conformité</CardDescription>
            </div>
            <Link href={`/dashboard/conformite/timeline?clientId=${clientId}`}>
              <Button variant="ghost" size="sm">
                Voir tout <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentTimeline.length > 0 ? (
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200" />
              <div className="space-y-4">
                {recentTimeline.map((event, index) => {
                  const EventIcon = TIMELINE_EVENT_ICONS[event.type] || FileText
                  
                  return (
                    <div key={event.id} className="relative flex gap-4 pl-10">
                      <div className="absolute left-0 p-2 bg-white border rounded-full">
                        <EventIcon className="h-4 w-4 text-gray-600" />
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="font-medium text-sm">{event.title}</p>
                        <p className="text-xs text-gray-500">{event.description}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDate(event.createdAt)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <History className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Aucun événement de conformité</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================================
// Sub-components
// ============================================================================

function StatCard({ 
  label, 
  value, 
  icon: Icon, 
  color 
}: { 
  label: string
  value: number
  icon: typeof CheckCircle
  color: string 
}) {
  return (
    <div className="flex items-center gap-3 p-3 bg-white/60 rounded-lg border">
      <Icon className={cn("h-5 w-5", color)} />
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-gray-600">{label}</p>
      </div>
    </div>
  )
}

function ComplianceIntegrationSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <Skeleton className="h-48 w-full" />
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
      <Skeleton className="h-96 w-full" />
    </div>
  )
}

export default TabComplianceIntegration
