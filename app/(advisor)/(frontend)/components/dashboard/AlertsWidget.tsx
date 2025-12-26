'use client'

import { useState, useEffect, useCallback, KeyboardEvent } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_common/components/ui/Card'
import { Badge } from '@/app/_common/components/ui/Badge'
import { AlertTriangle, Clock, FileText, LucideIcon } from 'lucide-react'
import { apiCall } from '@/app/_common/lib/api-client'
import { useRouter } from 'next/navigation'
import { cn } from '@/app/_common/lib/utils'

type AlertSeverity = 'urgent' | 'high' | 'medium' | 'low'
type AlertType = 'document' | 'sla' | 'deadline' | 'other'

interface AlertAction {
  url: string
  label?: string
}

interface Alert {
  id: string
  title: string
  message: string
  type: AlertType
  severity: AlertSeverity
  particulierId?: {
    firstName: string
    lastName: string
  }
  reclamationId?: { id: string }
  projectId?: { id: string }
  actions?: AlertAction[]
}

export default function AlertsWidget() {
  const router = useRouter()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)

  const loadAlerts = useCallback(async () => {
    try {
      const data = await apiCall<{ alerts?: Alert[] }>('/api/advisor/alerts?urgent=true&limit=3')
      setAlerts(data.alerts ?? [])
    } catch (error) {
      console.error('Erreur chargement alertes:', error)
      setAlerts([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAlerts()
  }, [loadAlerts])

  const getAlertIcon = (type: AlertType): LucideIcon => {
    switch (type) {
      case 'document':
        return FileText
      case 'sla':
        return Clock
      default:
        return AlertTriangle
    }
  }

  const getAlertColor = (severity: AlertSeverity): string => {
    // WCAG AA compliant colors (4.5:1 contrast ratio)
    switch (severity) {
      case 'urgent':
        return 'bg-red-100 border-red-300 text-red-800'
      case 'high':
        return 'bg-orange-100 border-orange-300 text-orange-800'
      case 'medium':
        return 'bg-amber-100 border-amber-300 text-amber-900'
      default:
        return 'bg-slate-100 border-slate-300 text-slate-700'
    }
  }

  const handleAlertClick = useCallback((alert: Alert) => {
    if (alert.type === 'sla' && alert.reclamationId) {
      router.push(`/dashboard/reclamations/${alert.reclamationId.id}`)
    } else if (alert.type === 'deadline' && alert.projectId) {
      router.push(`/dashboard/projets/${alert.projectId.id}`)
    } else if (alert.actions?.[0]?.url) {
      router.push(alert.actions[0].url)
    }
  }, [router])

  const handleKeyDown = useCallback((e: KeyboardEvent, alert: Alert) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleAlertClick(alert)
    }
  }, [handleAlertClick])

  return (
    <Card className="border-slate-200" role="region" aria-label="Widget des alertes" aria-live="polite">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-slate-900" id="alerts-widget-title">
            <AlertTriangle className="h-5 w-5 text-orange-600" aria-hidden="true" />
            Alertes
          </CardTitle>
          <Badge variant="destructive" aria-label={`${alerts.length} alertes`}>{alerts.length}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2" role="status" aria-label="Chargement des alertes">
            <div className="h-12 bg-gray-200 rounded animate-pulse" aria-hidden="true"></div>
            <div className="h-12 bg-gray-200 rounded animate-pulse" aria-hidden="true"></div>
            <span className="sr-only">Chargement en cours...</span>
          </div>
        ) : alerts.length === 0 ? (
          <p className="text-sm text-slate-500 py-4" role="status">Aucune alerte</p>
        ) : (
          <div className="space-y-2" role="list" aria-labelledby="alerts-widget-title">
            {alerts.map((alert) => {
              const Icon = getAlertIcon(alert.type)
              const clientName = alert.particulierId?.firstName && alert.particulierId?.lastName
                ? `${alert.particulierId.firstName} ${alert.particulierId.lastName}`
                : null
              
              const severityLabel = alert.severity === 'urgent' ? 'urgente' : alert.severity === 'high' ? 'haute priorité' : alert.severity === 'medium' ? 'priorité moyenne' : 'priorité basse'
              const alertAriaLabel = `Alerte ${severityLabel}: ${alert.title}${clientName ? `, concernant ${clientName}` : ''}`

              return (
                <div
                  key={alert.id}
                  className={cn(
                    'p-3 rounded-lg border cursor-pointer hover:shadow-md transition-all',
                    getAlertColor(alert.severity)
                  )}
                  onClick={() => handleAlertClick(alert)}
                  role="listitem"
                  aria-label={alertAriaLabel}
                  tabIndex={0}
                  onKeyDown={(e) => handleKeyDown(e, alert)}
                >
                  <div className="flex items-start gap-2">
                    <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-tight mb-1">
                        {alert.title}
                      </p>
                      <p className="text-xs opacity-75 leading-tight">
                        {alert.message}
                      </p>
                      {clientName && (
                        <p className="text-xs opacity-60 mt-1">
                          {clientName}
                        </p>
                      )}
                    </div>
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
