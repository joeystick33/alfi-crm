 
/**
 * Premium Client Card Component
 * Inspired by N26, Revolut, and Finary
 * 
 * Features:
 * - Multiple display variants (grid, list, compact)
 * - Gradient avatar backgrounds
 * - Smooth hover animations
 * - Wealth trend indicators
 * - VIP badge for high-value clients
 */

import { Card, CardContent } from '@/app/_common/components/ui/Card'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Avatar } from '@/app/_common/components/ui/Avatar'
import { cn, formatCurrency, formatDate } from '@/app/_common/lib/utils'
import { 
  Mail, 
  Phone,
  Calendar,
  ChevronRight,
  Crown,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react'
import type { ClientListItem } from '@/app/_common/lib/api-types'
import { ClientQuickActions } from './ClientQuickActions'

export type ClientCardVariant = 'grid' | 'list' | 'compact'

interface ClientCardProps {
  client: ClientListItem
  onClick?: () => void
  onDeactivate?: (id: string) => void
  onArchive?: (id: string) => void
  onReactivate?: (id: string, currentStatus?: ClientListItem['status']) => void
  variant?: ClientCardVariant
  showWealth?: boolean
  showLastContact?: boolean
  className?: string
}

const clientTypeLabels = {
  PARTICULIER: 'Particulier',
  PROFESSIONNEL: 'Professionnel',
}

const clientStatusConfig: Record<string, { variant: 'info' | 'success' | 'default' | 'secondary' | 'danger', label: string, dot: boolean }> = {
  // Prisma FR values
  PROSPECT: { variant: 'info', label: 'Prospect', dot: true },
  ACTIF: { variant: 'success', label: 'Actif', dot: true },
  INACTIF: { variant: 'default', label: 'Inactif', dot: true },
  ARCHIVE: { variant: 'secondary', label: 'Archivé', dot: false },
  PERDU: { variant: 'danger', label: 'Perdu', dot: false },
  // Legacy EN values for backward compatibility
  ACTIVE: { variant: 'success', label: 'Actif', dot: true },
  INACTIVE: { variant: 'default', label: 'Inactif', dot: true },
  ARCHIVED: { variant: 'secondary', label: 'Archivé', dot: false },
  LOST: { variant: 'danger', label: 'Perdu', dot: false },
}

const defaultStatusConfig = { variant: 'default' as const, label: 'Inconnu', dot: false }

// VIP threshold (500k€)
const VIP_THRESHOLD = 500000

export function ClientCard({ 
  client, 
  onClick,
  onDeactivate,
  onArchive,
  onReactivate,
  variant = 'grid',
  showWealth = true,
  showLastContact = true,
  className 
}: ClientCardProps) {
  const isPro = client.clientType === 'PROFESSIONNEL'
  const fullName = `${client.firstName} ${client.lastName}`
  // Pour les PRO: afficher le nom de la société, sinon le nom complet
  const displayName = isPro && (client as any).companyName 
    ? (client as any).companyName 
    : fullName
  // Sous-titre: pour PRO = nom du représentant, pour particulier = type de client
  const subtitle = isPro 
    ? (client as any).companyName ? fullName : clientTypeLabels[client.clientType]
    : clientTypeLabels[client.clientType]
  const statusConfig = clientStatusConfig[client.status as string] || defaultStatusConfig
  const isVIP = client.status === 'ACTIF' && client.wealth && client.wealth.patrimoineNet > VIP_THRESHOLD
  
  // Calcul de l'évolution du patrimoine
  const wealthEvolution = (client.wealth as any)?.evolution || 0
  const TrendIcon = wealthEvolution > 0 ? ArrowUpRight : wealthEvolution < 0 ? ArrowDownRight : Minus

  // Revenus
  const totalRevenus = (client as any).income?.totalRevenus || 0

  // ============================================================================
  // VARIANTE LISTE - Premium row design avec grid pour alignement parfait
  // Colonnes: Avatar | Client | Contact | Patrimoine | Revenus | Dernier contact | Flèche
  // ============================================================================
  if (variant === 'list') {
    return (
      <div
        className={cn(
          'group grid items-center px-5 py-4',
          // Mobile: Avatar + Client + Flèche
          'grid-cols-[40px_1fr_64px]',
          // Tablet md: + Contact + Patrimoine
          'md:grid-cols-[40px_1fr_180px_110px_64px]',
          // Desktop lg: + Revenus
          'lg:grid-cols-[40px_1fr_200px_110px_100px_64px]',
          // Large xl: + Dernier contact
          'xl:grid-cols-[40px_1fr_200px_110px_100px_100px_64px]',
          'gap-4',
          'bg-white',
          'cursor-pointer transition-all duration-150',
          'hover:bg-gray-50/80',
          className
        )}
        onClick={onClick}
      >
        {/* Col 1: Avatar */}
        <div className="relative">
          <Avatar name={displayName} size="md" />
          {isVIP && (
            <div className="absolute -top-1 -right-1 p-0.5 bg-amber-100 rounded-full">
              <Crown className="h-3 w-3 text-amber-600" />
            </div>
          )}
        </div>

        {/* Col 2: Name & Status */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
              {displayName}
            </h4>
            <Badge variant={statusConfig.variant} size="xs" dot={statusConfig.dot}>
              {statusConfig.label}
            </Badge>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            {subtitle}
          </p>
        </div>

        {/* Col 3: Contact (Email & Phone) - md+ */}
        <div className="hidden md:flex flex-col gap-1">
          {client.email ? (
            <a 
              href={`mailto:${client.email}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-indigo-600 transition-colors"
              title={client.email}
            >
              <Mail className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{client.email}</span>
            </a>
          ) : (
            <span className="text-xs text-gray-300">Pas d'email</span>
          )}
          {client.phone ? (
            <a 
              href={`tel:${client.phone}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-indigo-600 transition-colors"
              title={client.phone}
            >
              <Phone className="h-3.5 w-3.5 shrink-0" />
              <span>{client.phone}</span>
            </a>
          ) : (
            <span className="text-xs text-gray-300">Pas de tél.</span>
          )}
        </div>

        {/* Col 4: Patrimoine - md+ */}
        <div className="hidden md:block text-right">
          {client.wealth && client.wealth.patrimoineNet > 0 ? (
            <p className="text-sm font-semibold text-gray-900 tabular-nums">
              {formatCurrency(client.wealth.patrimoineNet)}
            </p>
          ) : (
            <span className="text-xs text-gray-300">-</span>
          )}
        </div>

        {/* Col 5: Revenus - lg+ */}
        <div className="hidden lg:block text-right">
          {totalRevenus > 0 ? (
            <p className="text-sm text-gray-700 tabular-nums">
              {formatCurrency(totalRevenus)}<span className="text-xs text-gray-400">/an</span>
            </p>
          ) : (
            <span className="text-xs text-gray-300">-</span>
          )}
        </div>

        {/* Col 6: Dernier contact - xl+ */}
        <div className="hidden xl:flex items-center justify-end gap-1.5 text-xs text-gray-500">
          {client.lastContactDate ? (
            <>
              <Calendar className="h-3.5 w-3.5 text-gray-400" />
              <span>{formatDate(client.lastContactDate)}</span>
            </>
          ) : (
            <span className="text-gray-300">-</span>
          )}
        </div>

        {/* Col 7: Arrow - toujours visible */}
        <div className="justify-self-end flex items-center gap-1">
          <ClientQuickActions
            client={client}
            onDeactivate={onDeactivate}
            onArchive={onArchive}
            onReactivate={onReactivate}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          />
          <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>
    )
  }

  // ============================================================================
  // VARIANTE COMPACT - Minimal inline display
  // ============================================================================
  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'group flex items-center gap-3 p-3',
          'bg-white border border-gray-100 rounded-xl',
          'cursor-pointer transition-all duration-150',
          'hover:border-gray-200 hover:shadow-md hover:-translate-y-0.5',
          className
        )}
        onClick={onClick}
      >
        <Avatar name={displayName} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
            {displayName}
          </p>
          <p className="text-xs text-gray-500 truncate">
            {client.email || client.phone}
          </p>
        </div>
        {client.wealth && (
          <span className="text-sm font-semibold text-gray-900 tabular-nums shrink-0">
            {formatCurrency(client.wealth.patrimoineNet)}
          </span>
        )}
      </div>
    )
  }

  // ============================================================================
  // VARIANTE GRID - Premium card design (N26/Revolut inspired)
  // ============================================================================
  return (
    <Card
      interactive
      className={cn('group', className)}
      onClick={onClick}
    >
      <CardContent className="p-5">
        {/* Header: Avatar + Name + Status */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar name={displayName} size="lg" />
              {isVIP && (
                <div className="absolute -top-1 -right-1 p-1 bg-amber-100 rounded-full shadow-sm">
                  <Crown className="h-3.5 w-3.5 text-amber-600" />
                </div>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                {displayName}
              </h3>
              <p className="text-sm text-gray-500">
                {subtitle}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Badge variant={statusConfig.variant} size="sm" dot={statusConfig.dot}>
              {statusConfig.label}
            </Badge>
            <ClientQuickActions
              client={client}
              onDeactivate={onDeactivate}
              onArchive={onArchive}
              onReactivate={onReactivate}
              className="-mr-2 -mt-1"
            />
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-2 mb-4">
          {client.email && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Mail className="h-4 w-4 text-gray-400 shrink-0" />
              <span className="truncate">{client.email}</span>
            </div>
          )}
          {client.phone && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="h-4 w-4 text-gray-400 shrink-0" />
              <span>{client.phone}</span>
            </div>
          )}
        </div>

        {/* Wealth Section */}
        {showWealth && client.wealth && (
          <div className="flex items-end justify-between pt-4 border-t border-gray-100">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                Patrimoine net
              </p>
              <p className="text-xl font-bold text-gray-900 tabular-nums tracking-tight">
                {formatCurrency(client.wealth.patrimoineNet)}
              </p>
            </div>
            {wealthEvolution !== 0 && (
              <div className={cn(
                'flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium',
                wealthEvolution > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
              )}>
                <TrendIcon className="h-3.5 w-3.5" />
                {wealthEvolution > 0 ? '+' : ''}{wealthEvolution.toFixed(1)}%
              </div>
            )}
          </div>
        )}

        {/* Last Contact */}
        {showLastContact && client.lastContactDate && (
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-4 pt-3 border-t border-gray-100">
            <Calendar className="h-3.5 w-3.5" />
            Dernier contact : {formatDate(client.lastContactDate)}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
