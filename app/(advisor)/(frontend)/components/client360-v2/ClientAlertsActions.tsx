'use client'

/**
 * ClientAlertsActions - Alertes et actions rapides
 * 
 * Barre d'alertes prioritaires avec actions contextuelles:
 * - Documents expirants
 * - Échéances à venir
 * - Tâches en retard
 * - Actions rapides (RDV, Note, Email, etc.)
 */

import { useState } from 'react'
import { cn } from '@/app/_common/lib/utils'
import {
  AlertTriangle,
  Clock,
  FileText,
  Calendar,
  CheckCircle2,
  X,
  Mail,
  Phone,
  FileEdit,
  Calculator,
  Download,
  Bell,
  Zap,
} from 'lucide-react'

// =============================================================================
// Types
// =============================================================================

interface Alert {
  id: string
  type: 'document' | 'deadline' | 'task' | 'kyc' | 'contract'
  severity: 'critical' | 'warning' | 'info'
  title: string
  description?: string
  dueDate?: Date
  action?: {
    label: string
    onClick: () => void
  }
}

interface QuickAction {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  onClick: () => void
  variant?: 'default' | 'primary' | 'success'
  shortcut?: string
}

interface ClientAlertsActionsProps {
  alerts: Alert[]
  quickActions?: QuickAction[]
  onDismissAlert?: (id: string) => void
  showAllAlerts?: boolean
  className?: string
}

// =============================================================================
// Configuration
// =============================================================================

const alertConfig = {
  document: { icon: FileText, label: 'Document' },
  deadline: { icon: Clock, label: 'Échéance' },
  task: { icon: CheckCircle2, label: 'Tâche' },
  kyc: { icon: AlertTriangle, label: 'KYC' },
  contract: { icon: FileText, label: 'Contrat' },
}

const severityConfig = {
  critical: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: 'text-red-600',
    text: 'text-red-700',
    dot: 'bg-red-500',
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: 'text-amber-600',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: 'text-blue-600',
    text: 'text-blue-700',
    dot: 'bg-blue-500',
  },
}

const defaultQuickActions: QuickAction[] = [
  { id: 'rdv', label: 'Nouveau RDV', icon: Calendar, variant: 'default', shortcut: 'R', onClick: () => {} },
  { id: 'note', label: 'Ajouter note', icon: FileEdit, variant: 'default', shortcut: 'N', onClick: () => {} },
  { id: 'email', label: 'Envoyer email', icon: Mail, variant: 'default', shortcut: 'E', onClick: () => {} },
  { id: 'appel', label: 'Appeler', icon: Phone, variant: 'default', onClick: () => {} },
  { id: 'simulation', label: 'Simuler', icon: Calculator, variant: 'primary', shortcut: 'S', onClick: () => {} },
  { id: 'rapport', label: 'Rapport', icon: Download, variant: 'default', onClick: () => {} },
]

// =============================================================================
// Composants internes
// =============================================================================

function AlertChip({ 
  alert, 
  onDismiss 
}: { 
  alert: Alert
  onDismiss?: () => void 
}) {
  const typeConfig = alertConfig[alert.type]
  const severity = severityConfig[alert.severity]
  const Icon = typeConfig.icon
  
  // Calculer le temps restant
  const getTimeRemaining = () => {
    if (!alert.dueDate) return null
    const now = new Date()
    const diff = alert.dueDate.getTime() - now.getTime()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    
    if (days < 0) return { text: 'En retard', urgent: true }
    if (days === 0) return { text: "Aujourd'hui", urgent: true }
    if (days === 1) return { text: 'Demain', urgent: true }
    if (days <= 7) return { text: `${days}j`, urgent: false }
    return { text: `${days}j`, urgent: false }
  }
  
  const timeRemaining = getTimeRemaining()

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border',
        'transition-all duration-200',
        severity.bg, severity.border
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full animate-pulse', severity.dot)} />
      <Icon className={cn('h-3.5 w-3.5', severity.icon)} />
      <span className={cn('text-xs font-medium max-w-[150px] truncate', severity.text)}>
        {alert.title}
      </span>
      
      {timeRemaining && (
        <span className={cn(
          'text-xs font-medium px-1.5 py-0.5 rounded',
          timeRemaining.urgent 
            ? 'bg-red-100 text-red-700' 
            : 'bg-gray-100 text-gray-600'
        )}>
          {timeRemaining.text}
        </span>
      )}
      
      {alert.action && (
        <button
          onClick={alert.action.onClick}
          className={cn(
            'text-xs font-medium hover:underline',
            severity.icon
          )}
        >
          {alert.action.label}
        </button>
      )}
      
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="p-0.5 rounded hover:bg-white/50 text-gray-400 hover:text-gray-600"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  )
}

function QuickActionButton({ action }: { action: QuickAction }) {
  const Icon = action.icon
  
  const variantClasses = {
    default: 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300',
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600',
  }

  return (
    <button
      onClick={action.onClick}
      title={action.shortcut ? `${action.label} (${action.shortcut})` : action.label}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border',
        'text-sm font-medium transition-all duration-200',
        'hover:shadow-sm',
        variantClasses[action.variant || 'default']
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">{action.label}</span>
      {action.shortcut && (
        <kbd className={cn(
          'hidden lg:inline-flex items-center justify-center',
          'h-4 min-w-[16px] px-1 rounded text-[10px] font-mono',
          action.variant === 'default' 
            ? 'bg-gray-100 text-gray-500'
            : 'bg-white/20 text-white/80'
        )}>
          {action.shortcut}
        </kbd>
      )}
    </button>
  )
}

// =============================================================================
// Composant Principal
// =============================================================================

export function ClientAlertsActions({
  alerts,
  quickActions = defaultQuickActions,
  onDismissAlert,
  showAllAlerts = false,
  className,
}: ClientAlertsActionsProps) {
  const [expanded, setExpanded] = useState(showAllAlerts)
  
  // Trier les alertes par sévérité
  const sortedAlerts = [...alerts].sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, info: 2 }
    return severityOrder[a.severity] - severityOrder[b.severity]
  })
  
  // Limiter les alertes affichées
  const displayedAlerts = expanded ? sortedAlerts : sortedAlerts.slice(0, 3)
  const hasMoreAlerts = sortedAlerts.length > 3

  if (alerts.length === 0 && quickActions.length === 0) {
    return null
  }

  return (
    <div className={cn(
      'bg-white rounded-xl border border-gray-200/60 shadow-sm',
      className
    )}>
      <div className="flex flex-col lg:flex-row lg:items-center gap-3 p-3">
        {/* Alertes */}
        {alerts.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
            <div className="flex items-center gap-1.5 shrink-0">
              <Bell className="h-4 w-4 text-gray-400" />
              <span className="text-xs font-medium text-gray-500">
                {alerts.length} alerte{alerts.length > 1 ? 's' : ''}
              </span>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              {displayedAlerts.map((alert) => (
                <AlertChip
                  key={alert.id}
                  alert={alert}
                  onDismiss={onDismissAlert ? () => onDismissAlert(alert.id) : undefined}
                />
              ))}
              
              {hasMoreAlerts && !expanded && (
                <button
                  onClick={() => setExpanded(true)}
                  className="text-xs font-medium text-[#7373FF] hover:text-[#5c5ce6] hover:underline"
                >
                  +{sortedAlerts.length - 3} autres
                </button>
              )}
              
              {expanded && hasMoreAlerts && (
                <button
                  onClick={() => setExpanded(false)}
                  className="text-xs font-medium text-gray-500 hover:text-gray-700 hover:underline"
                >
                  Réduire
                </button>
              )}
            </div>
          </div>
        )}
        
        {/* Séparateur */}
        {alerts.length > 0 && quickActions.length > 0 && (
          <div className="hidden lg:block w-px h-6 bg-gray-200" />
        )}
        
        {/* Actions rapides */}
        {quickActions.length > 0 && (
          <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto scrollbar-hide">
            <Zap className="h-4 w-4 text-gray-400 shrink-0" />
            {quickActions.map((action) => (
              <QuickActionButton key={action.id} action={action} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export type { Alert, QuickAction }
export { defaultQuickActions }
export default ClientAlertsActions
