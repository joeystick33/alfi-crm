'use client'

/**
 * ClientHeader - Header client moderne et fonctionnel
 * 
 * Design équilibré:
 * - Infos client claires et accessibles
 * - KPIs essentiels visibles
 * - Actions rapides organisées
 * - Style moderne sans surcharge
 */

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/app/_common/components/ui/Button'
import { Badge } from '@/app/_common/components/ui/Badge'
import { cn, getInitials, formatCurrency } from '@/app/_common/lib/utils'
import type { ClientDetail, WealthSummary } from '@/app/_common/lib/api-types'
import {
  ArrowLeft,
  Edit,
  MoreHorizontal,
  Plus,
  Phone,
  Mail,
  Calendar,
  FileText,
  Download,
  Wallet,
  TrendingUp,
  TrendingDown,
  Calculator,
  User,
  Building2,
  Archive,
  RotateCcw,
  Trash2,
  AlertTriangle,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/app/_common/components/ui/DropdownMenu'

interface ClientHeaderProps {
  client: ClientDetail
  wealth?: WealthSummary
  kpis?: {
    patrimoineNet: number
    patrimoineEvolution?: number
    tmi?: string
  }
  onBack?: () => void
  onEdit?: () => void
  onAction?: (action: string) => void
  onArchive?: () => void
  onReactivate?: () => void
  onForceDelete?: () => void
}

export function ClientHeader({
  client,
  wealth,
  kpis,
  onBack,
  onEdit,
  onAction,
  onArchive,
  onReactivate,
  onForceDelete,
}: ClientHeaderProps) {
  const router = useRouter()
  const initials = getInitials(client.firstName, client.lastName)
  const TypeIcon = client.clientType === 'PROFESSIONNEL' ? Building2 : User

  // Status config
  const statusConfig = useMemo(() => {
    switch (client.status) {
      case 'ACTIF':
        return { label: 'Actif', color: 'bg-emerald-500', textColor: 'text-emerald-700', bgColor: 'bg-emerald-50' }
      case 'PROSPECT':
        return { label: 'Prospect', color: 'bg-blue-500', textColor: 'text-blue-700', bgColor: 'bg-blue-50' }
      case 'INACTIF':
        return { label: 'Inactif', color: 'bg-gray-400', textColor: 'text-gray-600', bgColor: 'bg-gray-100' }
      case 'ARCHIVE':
        return { label: 'Archivé', color: 'bg-slate-500', textColor: 'text-slate-700', bgColor: 'bg-slate-100' }
      case 'PERDU':
        return { label: 'Perdu', color: 'bg-red-400', textColor: 'text-red-700', bgColor: 'bg-red-50' }
      default:
        return { label: client.status, color: 'bg-gray-400', textColor: 'text-gray-600', bgColor: 'bg-gray-100' }
    }
  }, [client.status])

  const isArchived = client.status === 'ARCHIVE'
  const isLost = client.status === 'PERDU'

  // Patrimoine from props or wealth
  const patrimoine = kpis?.patrimoineNet ?? (wealth?.patrimoineNet || 0)
  const evolution = kpis?.patrimoineEvolution

  return (
    <div className="bg-[#171936] rounded-xl border border-white/5 p-4 shadow-lg shadow-black/10">
      <div className="flex items-start justify-between gap-4">
        {/* Left section: Client info */}
        <div className="flex items-start gap-4 min-w-0 flex-1">
          {/* Back button + Avatar */}
          <div className="flex items-center gap-3">
            <button
              onClick={onBack || (() => router.push('/dashboard/clients'))}
              className="p-1.5 -ml-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#ffffff0d] transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div className="relative">
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-[#7373FF] to-[#0c0e26] flex items-center justify-center shadow-lg shadow-[#7373FF]/20 border border-[#ffffff0d]">
                <span className="text-lg font-bold text-white">{initials}</span>
              </div>
              <div className={cn(
                'absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-[#0f0f2d]',
                statusConfig.color
              )} />
            </div>
          </div>

          {/* Client details */}
          <div className="min-w-0 flex-1">
            {/* Name + badges */}
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-xl font-semibold text-white">
                {client.firstName} {client.lastName}
              </h1>
              <Badge className={cn('text-xs border-0', statusConfig.bgColor, statusConfig.textColor)}>
                {statusConfig.label}
              </Badge>
              <Badge variant="outline" className="text-xs gap-1 border-[#ffffff1a] text-slate-300">
                <TypeIcon className="h-3 w-3" />
                {client.clientType === 'PARTICULIER' ? 'Particulier' : 'Professionnel'}
              </Badge>
            </div>

            {/* Contact info */}
            <div className="flex items-center gap-4 text-sm text-slate-400">
              {client.email && (
                <a
                  href={`mailto:${client.email}`}
                  className="flex items-center gap-1.5 hover:text-[#7373FF] transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  <span className="hidden sm:inline">{client.email}</span>
                </a>
              )}
              {client.phone && (
                <a
                  href={`tel:${client.phone}`}
                  className="flex items-center gap-1.5 hover:text-[#7373FF] transition-colors"
                >
                  <Phone className="h-4 w-4" />
                  <span>{client.phone}</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Center: KPIs (visible on large screens) */}
        <div className="hidden lg:flex items-center gap-6 px-6 border-l border-r border-[#ffffff0d]">
          {/* Patrimoine */}
          <div className="text-center">
            <div className="flex items-center gap-1 justify-center">
              <Wallet className="h-4 w-4 text-slate-400" />
              <span className="text-xs text-slate-500 uppercase tracking-wide">Patrimoine</span>
            </div>
            <div className="flex items-center gap-1.5 justify-center mt-0.5">
              <span className="text-lg font-semibold text-white">
                {formatCurrency(patrimoine)}
              </span>
              {evolution !== undefined && evolution !== 0 && (
                <span className={cn(
                  'text-xs font-medium flex items-center',
                  evolution > 0 ? 'text-emerald-400' : 'text-red-400'
                )}>
                  {evolution > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {Math.abs(evolution).toFixed(1)}%
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Quick actions */}
          <div className="hidden md:flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAction?.('rdv')}
              className="h-9 gap-1.5 border-[#ffffff1a] text-slate-300 hover:bg-[#ffffff0d] hover:text-white"
            >
              <Calendar className="h-4 w-4" />
              <span>RDV</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAction?.('note')}
              className="h-9 gap-1.5 border-[#ffffff1a] text-slate-300 hover:bg-[#ffffff0d] hover:text-white"
            >
              <FileText className="h-4 w-4" />
              <span>Note</span>
            </Button>
          </div>

          {/* Add dropdown (mobile) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-1 md:hidden">
                <Plus className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onAction?.('rdv')}>
                <Calendar className="h-4 w-4 mr-2" />
                Rendez-vous
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAction?.('note')}>
                <FileText className="h-4 w-4 mr-2" />
                Note
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onAction?.('document')}>
                Ajouter document
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAction?.('actif')}>
                Ajouter actif
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>


          {/* Edit */}
          <Button
            size="sm"
            onClick={onEdit}
            className="h-9 gap-1.5 bg-[#7373FF] hover:bg-[#5c5ce6] text-white border-0"
          >
            <Edit className="h-4 w-4" />
            <span className="hidden sm:inline">Modifier</span>
          </Button>

          {/* More */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 w-9 p-0 border-[#ffffff1a] text-slate-300 hover:bg-[#ffffff0d] hover:text-white">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => onAction?.('simulation')}>
                <Calculator className="h-4 w-4 mr-2" />
                Simulation
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAction?.('export')}>
                <Download className="h-4 w-4 mr-2" />
                Exporter PDF
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              
              {/* Actions selon le statut */}
              {isArchived ? (
                <>
                  <DropdownMenuItem onClick={onReactivate} className="text-emerald-600">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Réactiver le client
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onForceDelete} className="text-red-600">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer définitivement
                  </DropdownMenuItem>
                  <div className="px-2 py-1.5 text-xs text-amber-600 flex items-start gap-1.5">
                    <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                    <span>Suppression irréversible. Le client compte toujours dans vos quotas.</span>
                  </div>
                </>
              ) : isLost ? (
                <DropdownMenuItem onClick={onReactivate} className="text-emerald-600">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Réactiver comme prospect
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={onArchive} className="text-amber-600">
                  <Archive className="h-4 w-4 mr-2" />
                  Archiver le client
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile KPIs */}
      <div className="lg:hidden mt-4 pt-3 border-t border-[#ffffff0d]">
        <div className="flex items-center justify-around">
          <div className="text-center">
            <span className="text-xs text-slate-500 block">Patrimoine</span>
            <span className="text-base font-semibold text-white">{formatCurrency(patrimoine)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ClientHeader
