'use client'

/**
 * SmartDashboard - Dashboard intelligent pour CGP
 * 
 * Vue priorisée avec:
 * - Priorités du jour (RDV, tâches urgentes, alertes)
 * - KPIs principaux (AUM, collecte, clients)
 * - Suggestions IA contextuelles
 * - Actions rapides
 */

import { cn } from '@/app/_common/lib/utils'
import { Card, CardContent } from '@/app/_common/components/ui/Card'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Button } from '@/app/_common/components/ui/Button'
import {
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  Bell,
  Plus,
  ChevronRight,
  Sparkles,
  Lightbulb,
  FileText,
  Mail,
  ArrowRight,
  BarChart3,
  Zap,
} from 'lucide-react'

// =============================================================================
// Types
// =============================================================================

interface Priority {
  id: string
  type: 'rdv' | 'task' | 'alert' | 'kyc' | 'deadline'
  title: string
  subtitle?: string
  time?: string
  clientName?: string
  clientId?: string
  urgency: 'high' | 'medium' | 'low'
  action?: {
    label: string
    onClick: () => void
  }
}

interface KPI {
  id: string
  label: string
  value: string | number
  change?: number
  trend?: 'up' | 'down' | 'neutral'
  icon: React.ComponentType<{ className?: string }>
  color: string
}

interface Suggestion {
  id: string
  type: 'opportunity' | 'optimization' | 'action'
  title: string
  description: string
  clients?: number
  impact?: string
  action: {
    label: string
    onClick: () => void
  }
}

interface SmartDashboardProps {
  advisorName: string
  priorities: Priority[]
  kpis: KPI[]
  suggestions: Suggestion[]
  onNavigate: (path: string) => void
  onQuickAction: (action: string) => void
}

// =============================================================================
// Composants internes
// =============================================================================

function WelcomeHeader({ name, date }: { name: string; date: Date }) {
  const hour = date.getHours()
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'
  
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {greeting}, {name} 👋
        </h1>
        <p className="text-gray-500">
          {date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="gap-1.5">
          <Bell className="h-4 w-4" />
          <span className="hidden sm:inline">Notifications</span>
        </Button>
        <Button size="sm" className="gap-1.5 bg-indigo-600 hover:bg-indigo-700">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nouveau</span>
        </Button>
      </div>
    </div>
  )
}

function PriorityCard({ priority, onAction }: { priority: Priority; onAction?: () => void }) {
  const typeConfig = {
    rdv: { icon: Calendar, color: 'indigo', label: 'RDV' },
    task: { icon: CheckCircle2, color: 'emerald', label: 'Tâche' },
    alert: { icon: AlertTriangle, color: 'amber', label: 'Alerte' },
    kyc: { icon: FileText, color: 'red', label: 'KYC' },
    deadline: { icon: Clock, color: 'violet', label: 'Échéance' },
  }
  
  const config = typeConfig[priority.type]
  const Icon = config.icon
  
  const urgencyStyles = {
    high: 'border-l-4 border-l-red-500',
    medium: 'border-l-4 border-l-amber-500',
    low: 'border-l-4 border-l-gray-300',
  }

  return (
    <div
      onClick={onAction}
      className={cn(
        'flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200 cursor-pointer',
        'hover:shadow-md hover:border-gray-300 transition-all duration-200',
        urgencyStyles[priority.urgency]
      )}
    >
      <div className={cn('p-2.5 rounded-xl', `bg-${config.color}-100`)}>
        <Icon className={cn('h-5 w-5', `text-${config.color}-600`)} />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={cn(
            'text-xs font-medium px-1.5 py-0.5 rounded',
            `bg-${config.color}-100 text-${config.color}-700`
          )}>
            {config.label}
          </span>
          {priority.time && (
            <span className="text-xs text-gray-500">{priority.time}</span>
          )}
        </div>
        <h4 className="text-sm font-semibold text-gray-900 truncate">{priority.title}</h4>
        {priority.clientName && (
          <p className="text-xs text-gray-500 truncate">Client: {priority.clientName}</p>
        )}
      </div>
      
      {priority.action && (
        <Button size="sm" variant="ghost" className="shrink-0 gap-1">
          {priority.action.label}
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  )
}

function KPICard({ kpi }: { kpi: KPI }) {
  const Icon = kpi.icon
  const TrendIcon = kpi.trend === 'up' ? TrendingUp : kpi.trend === 'down' ? TrendingDown : null
  
  return (
    <Card className={cn('hover:shadow-md transition-shadow', `border-l-4 border-l-${kpi.color}-500`)}>
      <CardContent className="py-4">
        <div className="flex items-start justify-between">
          <div className={cn('p-2 rounded-lg', `bg-${kpi.color}-100`)}>
            <Icon className={cn('h-5 w-5', `text-${kpi.color}-600`)} />
          </div>
          {kpi.change !== undefined && TrendIcon && (
            <span className={cn(
              'flex items-center gap-1 text-xs font-medium',
              kpi.trend === 'up' ? 'text-emerald-600' : 'text-red-600'
            )}>
              <TrendIcon className="h-3.5 w-3.5" />
              {kpi.change > 0 ? '+' : ''}{kpi.change}%
            </span>
          )}
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold text-gray-900 tabular-nums">{kpi.value}</p>
          <p className="text-xs text-gray-500 mt-0.5">{kpi.label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function SuggestionCard({ suggestion }: { suggestion: Suggestion }) {
  const typeConfig = {
    opportunity: { icon: Lightbulb, color: 'amber' },
    optimization: { icon: Sparkles, color: 'indigo' },
    action: { icon: Zap, color: 'emerald' },
  }
  
  const config = typeConfig[suggestion.type]
  const Icon = config.icon

  return (
    <div className={cn(
      'p-4 rounded-xl border-2 border-dashed transition-all',
      `border-${config.color}-200 hover:border-${config.color}-400 hover:bg-${config.color}-50/50`
    )}>
      <div className="flex items-start gap-3">
        <div className={cn('p-2 rounded-lg', `bg-${config.color}-100`)}>
          <Icon className={cn('h-5 w-5', `text-${config.color}-600`)} />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-gray-900 mb-1">{suggestion.title}</h4>
          <p className="text-xs text-gray-600 mb-2">{suggestion.description}</p>
          <div className="flex items-center gap-3">
            {suggestion.clients && (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Users className="h-3 w-3" />
                {suggestion.clients} clients concernés
              </span>
            )}
            {suggestion.impact && (
              <span className="text-xs font-medium text-emerald-600">{suggestion.impact}</span>
            )}
          </div>
        </div>
      </div>
      <button
        onClick={suggestion.action.onClick}
        className={cn(
          'mt-3 w-full flex items-center justify-center gap-1 py-2 rounded-lg text-sm font-medium',
          `bg-${config.color}-100 text-${config.color}-700 hover:bg-${config.color}-200 transition-colors`
        )}
      >
        {suggestion.action.label}
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

function QuickActionsBar({ onAction }: { onAction: (action: string) => void }) {
  const actions = [
    { id: 'client', label: 'Nouveau client', icon: Users, shortcut: 'C' },
    { id: 'rdv', label: 'Nouveau RDV', icon: Calendar, shortcut: 'R' },
    { id: 'task', label: 'Nouvelle tâche', icon: CheckCircle2, shortcut: 'T' },
    { id: 'email', label: 'Envoyer email', icon: Mail, shortcut: 'E' },
    { id: 'simulation', label: 'Simulation', icon: BarChart3, shortcut: 'S' },
  ]

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2">
      {actions.map((action) => (
        <button
          key={action.id}
          onClick={() => onAction(action.id)}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl',
            'bg-white border border-gray-200 hover:border-indigo-300 hover:shadow-sm',
            'text-sm font-medium text-gray-700 hover:text-indigo-600',
            'transition-all duration-200 whitespace-nowrap'
          )}
        >
          <action.icon className="h-4 w-4" />
          {action.label}
          <kbd className="hidden md:inline-flex items-center justify-center h-5 min-w-[20px] px-1 rounded bg-gray-100 text-[10px] font-mono text-gray-500">
            {action.shortcut}
          </kbd>
        </button>
      ))}
    </div>
  )
}

// =============================================================================
// Composant Principal
// =============================================================================

export function SmartDashboard({
  advisorName,
  priorities,
  kpis,
  suggestions,
  onNavigate,
  onQuickAction,
}: SmartDashboardProps) {
  const today = new Date()
  
  // Filtrer les priorités par urgence
  const highPriorities = priorities.filter(p => p.urgency === 'high')
  const otherPriorities = priorities.filter(p => p.urgency !== 'high')

  return (
    <div className="space-y-6">
      {/* En-tête avec salutation */}
      <WelcomeHeader name={advisorName} date={today} />
      
      {/* Actions rapides */}
      <QuickActionsBar onAction={onQuickAction} />
      
      {/* Layout principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne gauche: Priorités + KPIs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Priorités du jour */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-indigo-600" />
                <h2 className="text-lg font-semibold text-gray-900">Priorités du jour</h2>
                {highPriorities.length > 0 && (
                  <Badge variant="error" size="xs">{highPriorities.length} urgent</Badge>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('/dashboard/taches')}>
                Voir tout
              </Button>
            </div>
            
            <div className="space-y-3">
              {priorities.slice(0, 5).map((priority) => (
                <PriorityCard
                  key={priority.id}
                  priority={priority}
                  onAction={priority.action?.onClick}
                />
              ))}
              
              {priorities.length === 0 && (
                <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-900">Aucune priorité urgente</p>
                  <p className="text-xs text-gray-500 mt-1">Toutes vos tâches sont à jour 🎉</p>
                </div>
              )}
            </div>
          </div>
          
          {/* KPIs */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-5 w-5 text-indigo-600" />
              <h2 className="text-lg font-semibold text-gray-900">Indicateurs clés</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {kpis.map((kpi) => (
                <KPICard key={kpi.id} kpi={kpi} />
              ))}
            </div>
          </div>
        </div>
        
        {/* Colonne droite: Suggestions IA */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-900">Suggestions IA</h2>
          </div>
          
          <div className="space-y-4">
            {suggestions.map((suggestion) => (
              <SuggestionCard key={suggestion.id} suggestion={suggestion} />
            ))}
            
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => onNavigate('/dashboard/opportunites')}
            >
              <Lightbulb className="h-4 w-4" />
              Voir toutes les opportunités
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SmartDashboard
