'use client'

import {
  Search, User, Database, ListTodo, CalendarPlus, AlertCircle,
  FileText, Sparkles, Bell, Brain, Trash2, Navigation, ArrowUpRight,
  Zap, CheckCircle2, Clock, Globe, Building2, TrendingUp, BarChart3,
  FileOutput, Compass
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AgentAction } from '../../hooks/useAI'
import type { AgentActionV2 } from '../../hooks/useAIv2'

export const TOOL_ICONS: Record<string, React.ElementType> = {
  search_clients: Search,
  get_client_detail: User,
  get_portfolio_summary: Database,
  get_upcoming_tasks: ListTodo,
  get_upcoming_appointments: CalendarPlus,
  get_kyc_alerts: AlertCircle,
  search_contracts: FileText,
  get_dashboard_stats: Sparkles,
  create_task: ListTodo,
  create_appointment: CalendarPlus,
  create_notification: Bell,
  save_instruction: Brain,
  save_fact: Brain,
  list_instructions: Brain,
  delete_instruction: Trash2,
  navigate_to_client: Navigation,
  navigate_to_page: ArrowUpRight,
  navigate_to: Compass,
  web_search: Globe,
  dvf_price_lookup: Building2,
  market_data: TrendingUp,
  analyze_patrimoine: BarChart3,
  generate_document_draft: FileOutput,
  get_client_details: User,
  get_client_patrimoine: Database,
  get_client_contrats: FileText,
  get_tasks: ListTodo,
  get_appointments: CalendarPlus,
  get_opportunities: TrendingUp,
}

export const TOOL_LABELS: Record<string, string> = {
  search_clients: 'Recherche clients',
  get_client_detail: 'Fiche client',
  get_portfolio_summary: 'Patrimoine',
  get_upcoming_tasks: 'Tâches à venir',
  get_upcoming_appointments: 'Agenda',
  get_kyc_alerts: 'Conformité KYC',
  search_contracts: 'Contrats',
  get_dashboard_stats: 'Tableau de bord',
  create_task: 'Tâche créée',
  create_appointment: 'RDV planifié',
  create_notification: 'Notification',
  save_instruction: 'Instruction mémorisée',
  save_fact: 'Fait mémorisé',
  list_instructions: 'Instructions',
  delete_instruction: 'Instruction supprimée',
  navigate_to_client: 'Ouverture dossier',
  navigate_to_page: 'Navigation',
  update_client: 'Client mis à jour',
  archive_client: 'Client archivé',
  create_actif: 'Actif ajouté',
  create_passif: 'Passif ajouté',
  create_contrat: 'Contrat créé',
  update_contrat: 'Contrat modifié',
  create_dossier: 'Dossier créé',
  update_dossier: 'Dossier modifié',
  list_dossiers: 'Dossiers',
  update_kyc_status: 'KYC mis à jour',
  send_email: 'Email envoyé',
  draft_email: 'Brouillon email',
  create_email_template: 'Template créé',
  list_email_templates: 'Templates email',
  update_appointment: 'RDV modifié',
  cancel_appointment: 'RDV annulé',
  run_simulation: 'Simulation',
  list_simulations: 'Simulations',
  generate_regulatory_doc: 'Document généré',
  create_commercial_action: 'Action commerciale',
  create_campaign: 'Campagne créée',
  create_opportunite: 'Opportunité créée',
  list_opportunites: 'Opportunités',
  update_task: 'Tâche modifiée',
  complete_task: 'Tâche terminée',
  run_workflow: 'Workflow lancé',
  mcp_search_datasets: 'Données publiques',
  mcp_query_data: 'Requête données',
  mcp_search_entreprise: 'Recherche entreprise',
  mcp_search_apis: 'APIs gouv',
  mcp_dvf_immobilier: 'Données DVF',
  navigate_to: 'Navigation',
  web_search: 'Recherche web',
  dvf_price_lookup: 'Prix immobilier (DVF)',
  market_data: 'Données de marché',
  analyze_patrimoine: 'Analyse patrimoniale',
  generate_document_draft: 'Brouillon document',
  get_client_details: 'Fiche client',
  get_client_patrimoine: 'Patrimoine client',
  get_client_contrats: 'Contrats client',
  get_tasks: 'Tâches',
  get_appointments: 'Rendez-vous',
  get_opportunities: 'Opportunités',
}

// Normalize V2 actions to V1 format for display
function normalizeActions(actions: (AgentAction | AgentActionV2)[]): AgentAction[] {
  return actions.map(a => {
    if ('requiresConfirmation' in a) return a as AgentAction
    const v2 = a as AgentActionV2
    return {
      toolName: v2.toolName,
      status: v2.status,
      message: v2.message,
      requiresConfirmation: v2.status === 'pending_confirmation',
      navigationUrl: v2.navigationUrl,
    }
  })
}

export function AgentActionBadges({ actions }: { actions: (AgentAction | AgentActionV2)[] }) {
  if (!actions || actions.length === 0) return null

  const normalized = normalizeActions(actions)
  const navActions = normalized.filter(a => a.navigationUrl && a.status === 'executed')
  const otherActions = normalized.filter(a => !a.navigationUrl || a.status !== 'executed')

  return (
    <div className="space-y-1.5">
      {/* Navigation actions — card style */}
      {navActions.map((action, i) => {
        const Icon = TOOL_ICONS[action.toolName] || Navigation
        const clientData = action.data as { clientName?: string; page?: string } | undefined
        return (
          <div
            key={`nav-${i}`}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100/60 text-indigo-700"
          >
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shrink-0 shadow-sm">
              <Icon className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold truncate">{action.message}</p>
              {clientData?.clientName && (
                <p className="text-[10px] text-indigo-500/70 truncate">{clientData.clientName}</p>
              )}
            </div>
            <ArrowUpRight className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
          </div>
        )
      })}

      {/* Tool call badges — pill style */}
      {otherActions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {otherActions.map((action, i) => {
            const Icon = TOOL_ICONS[action.toolName] || Zap
            const label = TOOL_LABELS[action.toolName] || action.toolName.replace(/_/g, ' ')

            const statusConfig = {
              executed: {
                bg: 'bg-slate-50/80',
                text: 'text-slate-600',
                border: 'border-slate-200/60',
                statusIcon: CheckCircle2,
                statusColor: 'text-emerald-500',
              },
              pending_confirmation: {
                bg: 'bg-amber-50/80',
                text: 'text-amber-700',
                border: 'border-amber-200/60',
                statusIcon: Clock,
                statusColor: 'text-amber-500',
              },
              failed: {
                bg: 'bg-red-50/80',
                text: 'text-red-600',
                border: 'border-red-200/60',
                statusIcon: AlertCircle,
                statusColor: 'text-red-500',
              },
            }[action.status]

            const StatusIcon = statusConfig.statusIcon

            return (
              <span
                key={`action-${i}`}
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold border shadow-sm',
                  statusConfig.bg, statusConfig.text, statusConfig.border
                )}
              >
                <Icon className="h-3 w-3 shrink-0 opacity-60" />
                <span>{label}</span>
                <StatusIcon className={cn('h-3 w-3 shrink-0', statusConfig.statusColor)} />
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}
