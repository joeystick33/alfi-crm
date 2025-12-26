 
'use client'

/**
 * ClientBannerV2 - Bannière client enrichie
 * 
 * Design compact avec KPIs réels (via useClientKPIs):
 * - Avatar + Nom + Status
 * - 4 KPIs principaux (Patrimoine Net, TMI, Épargne, Score)
 * - Alertes inline si urgentes
 * - Actions rapides (RDV, Note, Simuler)
 * - Bouton Éditer
 */

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/app/_common/components/ui/Button'
import { Badge } from '@/app/_common/components/ui/Badge'
import { cn, getInitials } from '@/app/_common/lib/utils'
import { helpers } from '@/app/_common/styles/design-system-v2'
import type { ClientDetail, WealthSummary } from '@/app/_common/lib/api-types'
import {
  ArrowLeft,
  Edit,
  MoreHorizontal,
  User,
  Building2,
  Mail,
  Phone,
  Calendar,
  FileText,
  Calculator,
  AlertTriangle,
  Bell,
  ChevronDown,
  Download,
  Printer,
  Share2,
  Plus,
  Sparkles,
  Target,
  Wallet,
  PiggyBank,
  Percent,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/app/_common/components/ui/DropdownMenu'
// Tooltip simplifié avec title HTML natif

// =============================================================================
// Types
// =============================================================================

interface ClientBannerV2Props {
  client: ClientDetail
  wealth?: WealthSummary
  kpis?: {
    patrimoineNet: number
    patrimoineEvolution?: number
    tmi: string
    tauxEpargne: number
    scoreClient: string
    alertsCount: number
  }
  onBack?: () => void
  onRefresh?: () => void
  onEdit?: () => void
  onQuickAction?: (action: string) => void
}

// =============================================================================
// Composants internes
// =============================================================================

function KPIChip({ 
  icon: Icon, 
  label, 
  value, 
  subValue,
  trend,
  variant = 'default' 
}: {
  icon: any
  label: string
  value: string
  subValue?: string
  trend?: number
  variant?: 'default' | 'success' | 'warning' | 'error'
}) {
  const variantStyles = {
    default: 'bg-gray-50 border-gray-200 text-gray-900',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    warning: 'bg-amber-50 border-amber-200 text-amber-900',
    error: 'bg-red-50 border-red-200 text-red-900',
  }

  return (
    <div 
      title={`${label}: ${value}${subValue ? ` - ${subValue}` : ''}`}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg border cursor-default',
        'transition-all duration-200 hover:shadow-sm',
        variantStyles[variant]
      )}
    >
      <Icon className="h-4 w-4 opacity-60" />
      <div className="flex flex-col">
        <span className="text-xs text-gray-500 leading-none">{label}</span>
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold leading-tight">{value}</span>
          {trend !== undefined && (
            <span className={cn(
              'text-xs font-medium',
              trend > 0 ? 'text-emerald-600' : trend < 0 ? 'text-red-600' : 'text-gray-400'
            )}>
              {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'}
              {Math.abs(trend).toFixed(1)}%
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function QuickActionButton({
  icon: Icon,
  label,
  onClick,
  variant = 'default'
}: {
  icon: any
  label: string
  onClick: () => void
  variant?: 'default' | 'primary' | 'success'
}) {
  const variantStyles = {
    default: 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200',
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600',
  }

  return (
    <button
      title={label}
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium',
        'transition-all duration-200',
        variantStyles[variant]
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="hidden lg:inline">{label}</span>
    </button>
  )
}

// =============================================================================
// Composant Principal
// =============================================================================

export function ClientBannerV2({ 
  client, 
  wealth,
  kpis,
  onBack, 
  onRefresh: _onRefresh,
  onEdit,
  onQuickAction 
}: ClientBannerV2Props) {
  const _router = useRouter()
  const initials = getInitials(client.firstName, client.lastName)
  const TypeIcon = client.clientType === 'PROFESSIONNEL' ? Building2 : User

  // Status badge config
  const statusConfig = useMemo(() => {
    switch (client.status) {
      case 'ACTIF':
        return { variant: 'success' as const, label: 'Actif', color: 'bg-emerald-500' }
      case 'PROSPECT':
        return { variant: 'info' as const, label: 'Prospect', color: 'bg-blue-500' }
      case 'INACTIF':
        return { variant: 'default' as const, label: 'Inactif', color: 'bg-gray-400' }
      default:
        return { variant: 'default' as const, label: client.status, color: 'bg-gray-400' }
    }
  }, [client.status])

  // Score color
  const getScoreVariant = (score: string) => {
    if (score === 'A+' || score === 'A') return 'success'
    if (score === 'B+' || score === 'B') return 'default'
    if (score === 'C+' || score === 'C') return 'warning'
    return 'error'
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200/60 shadow-sm overflow-hidden">
      {/* Barre principale */}
      <div className="flex items-center justify-between gap-4 px-4 py-3">
        {/* Gauche: Navigation + Avatar + Infos */}
        <div className="flex items-center gap-4 min-w-0">
          {/* Bouton retour */}
          {onBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="shrink-0 text-gray-500 hover:text-gray-700 -ml-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}

          {/* Avatar avec status */}
          <div className="relative shrink-0">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-[#7373FF]/20">
              <span className="text-base font-bold text-white">{initials}</span>
            </div>
            <div className={cn(
              'absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white',
              statusConfig.color
            )} />
          </div>

          {/* Infos client */}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-semibold text-gray-900 truncate">
                {client.firstName} {client.lastName}
              </h1>
              <Badge variant={statusConfig.variant} size="xs">
                {statusConfig.label}
              </Badge>
              <Badge variant="default" size="xs" className="gap-1">
                <TypeIcon className="h-3 w-3" />
                {client.clientType === 'PARTICULIER' ? 'Particulier' : 'Pro'}
              </Badge>
            </div>
            
            {/* Contact compact */}
            <div className="flex items-center gap-3 text-sm text-gray-500 mt-0.5">
              {client.email && (
                <a 
                  href={`mailto:${client.email}`}
                  className="flex items-center gap-1 hover:text-[#7373FF] transition-colors truncate max-w-[180px]"
                >
                  <Mail className="h-3 w-3 shrink-0" />
                  <span className="truncate">{client.email}</span>
                </a>
              )}
              {client.phone && (
                <a 
                  href={`tel:${client.phone}`}
                  className="flex items-center gap-1 hover:text-[#7373FF] transition-colors"
                >
                  <Phone className="h-3 w-3" />
                  {client.phone}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Centre: KPIs inline - basés sur vraies données (visible sur écrans larges) */}
        <div className="hidden xl:flex items-center gap-2">
          {kpis ? (
            <>
              <KPIChip
                icon={Wallet}
                label="Patrimoine Net"
                value={helpers.formatMoney(kpis.patrimoineNet, true)}
                trend={kpis.patrimoineEvolution}
              />
              <KPIChip
                icon={PiggyBank}
                label="Épargne"
                value={`${(kpis.tauxEpargne * 100).toFixed(0)}%`}
                variant={kpis.tauxEpargne >= 0.15 ? 'success' : kpis.tauxEpargne >= 0.10 ? 'default' : 'warning'}
              />
              <KPIChip
                icon={Target}
                label="Score"
                value={kpis.scoreClient}
                variant={getScoreVariant(kpis.scoreClient)}
              />
              {kpis.alertsCount > 0 && (
                <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-200">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-medium text-amber-700">{kpis.alertsCount}</span>
                </div>
              )}
            </>
          ) : wealth && (
            <>
              <KPIChip
                icon={Wallet}
                label="Patrimoine Net"
                value={helpers.formatMoney(wealth.patrimoineNet || 0, true)}
              />
              <KPIChip
                icon={PiggyBank}
                label="Actifs"
                value={helpers.formatMoney(wealth.totalActifs || 0, true)}
                variant="success"
              />
            </>
          )}
        </div>

        {/* Droite: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Actions rapides */}
          <div className="hidden md:flex items-center gap-1.5">
            <QuickActionButton
              icon={Plus}
              label="RDV"
              onClick={() => onQuickAction?.('rdv')}
            />
            <QuickActionButton
              icon={FileText}
              label="Note"
              onClick={() => onQuickAction?.('note')}
            />
            <QuickActionButton
              icon={Calculator}
              label="Simuler"
              onClick={() => onQuickAction?.('simulation')}
              variant="primary"
            />
          </div>

          <div className="w-px h-6 bg-gray-200 mx-1 hidden md:block" />

          {/* Éditer */}
          <Button 
            size="sm"
            onClick={onEdit}
            className="gap-1.5 bg-indigo-600 hover:bg-indigo-700"
          >
            <Edit className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Éditer</span>
          </Button>

          {/* Export */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Download className="h-3.5 w-3.5" />
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onQuickAction?.('export-pdf')}>
                <FileText className="h-4 w-4 mr-2" />
                Rapport PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onQuickAction?.('export-excel')}>
                <Download className="h-4 w-4 mr-2" />
                Export Excel
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onQuickAction?.('print')}>
                <Printer className="h-4 w-4 mr-2" />
                Imprimer
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onQuickAction?.('share')}>
                <Share2 className="h-4 w-4 mr-2" />
                Partager
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Plus d'options */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onQuickAction?.('ia-suggestions')}>
                <Sparkles className="h-4 w-4 mr-2 text-[#7373FF]" />
                Suggestions IA
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onQuickAction?.('historique')}>
                <Calendar className="h-4 w-4 mr-2" />
                Voir historique
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onQuickAction?.('notifications')}>
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Barre KPIs mobile (visible sur petits écrans) */}
      {kpis && (
        <div className="xl:hidden border-t border-gray-100 px-4 py-2 bg-gray-50/50">
          <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
            <div className="flex items-center gap-1.5 shrink-0">
              <Wallet className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-sm font-semibold text-gray-900">
                {helpers.formatMoney(kpis.patrimoineNet, true)}
              </span>
            </div>
            <span className="text-gray-300">•</span>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-xs text-gray-500">Épargne</span>
              <span className="text-sm font-semibold text-gray-900">
                {(kpis.tauxEpargne * 100).toFixed(0)}%
              </span>
            </div>
            <span className="text-gray-300">•</span>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-xs text-gray-500">Score</span>
              <span className={cn(
                'text-sm font-semibold',
                getScoreVariant(kpis.scoreClient) === 'success' ? 'text-emerald-600' :
                getScoreVariant(kpis.scoreClient) === 'warning' ? 'text-amber-600' :
                getScoreVariant(kpis.scoreClient) === 'error' ? 'text-red-600' : 'text-gray-900'
              )}>
                {kpis.scoreClient}
              </span>
            </div>
            {kpis.alertsCount > 0 && (
              <>
                <span className="text-gray-300">•</span>
                <div className="flex items-center gap-1 shrink-0">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                  <span className="text-sm font-medium text-amber-600">{kpis.alertsCount} alertes</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ClientBannerV2
