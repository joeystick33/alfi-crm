/**
 * ══════════════════════════════════════════════════════════════════════════════
 * COMPOSANT CLIENT LINK RÉUTILISABLE
 * Affiche un lien cliquable vers la fiche Client 360
 * Fetch automatique du nom si non fourni
 * ══════════════════════════════════════════════════════════════════════════════
 */

'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { User, Loader2 } from 'lucide-react'
import { useClient } from '@/app/_common/hooks/api/use-clients-api'
import { cn } from '@/app/_common/lib/utils'

// ══════════════════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════════════════

export interface ClientLinkProps {
  /** ID du client (requis) */
  clientId: string
  /** Nom du client (optionnel - sera fetché si non fourni) */
  clientName?: string
  /** Prénom du client (optionnel) */
  clientFirstName?: string
  /** Afficher l'avatar/icône */
  showAvatar?: boolean
  /** Taille de l'avatar */
  avatarSize?: 'sm' | 'md' | 'lg'
  /** Classes CSS additionnelles */
  className?: string
  /** Classes CSS pour le conteneur */
  containerClassName?: string
  /** Afficher le préfixe "Client #" si pas de nom */
  showIdPrefix?: boolean
  /** Désactiver le lien (afficher comme texte) */
  disabled?: boolean
  /** Callback au clic */
  onClick?: (e: React.MouseEvent) => void
}

// ══════════════════════════════════════════════════════════════════════════════
// CONSTANTES
// ══════════════════════════════════════════════════════════════════════════════

const AVATAR_SIZES = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
} as const

// ══════════════════════════════════════════════════════════════════════════════
// COMPOSANT
// ══════════════════════════════════════════════════════════════════════════════

export function ClientLink({
  clientId,
  clientName,
  clientFirstName,
  showAvatar = true,
  avatarSize = 'sm',
  className = '',
  containerClassName = '',
  showIdPrefix = true,
  disabled = false,
  onClick,
}: ClientLinkProps) {
  // Fetch client data only if name is not provided
  const shouldFetch = !clientName && !clientFirstName
  const { data: clientData, isLoading } = useClient(clientId, {
    enabled: shouldFetch,
  })

  // Compute display name
  const displayName = useMemo(() => {
    // If name is provided directly, use it
    if (clientName) {
      return clientFirstName ? `${clientFirstName} ${clientName}` : clientName
    }
    
    // If we have fetched data, use it
    if (clientData) {
      const firstName = clientData.firstName || ''
      const lastName = clientData.lastName || ''
      if (firstName || lastName) {
        return `${firstName} ${lastName}`.trim()
      }
    }
    
    // Fallback to ID display
    if (showIdPrefix) {
      return `Client #${clientId.slice(0, 8)}`
    }
    return clientId.slice(0, 8)
  }, [clientName, clientFirstName, clientData, clientId, showIdPrefix])

  // Loading state
  if (isLoading && shouldFetch) {
    return (
      <div className={cn('flex items-center gap-2', containerClassName)}>
        {showAvatar && (
          <div className="flex-shrink-0 flex items-center justify-center rounded-full bg-gray-100">
            <Loader2 className={cn(AVATAR_SIZES[avatarSize], 'text-gray-400 animate-spin')} />
          </div>
        )}
        <span className="text-sm text-gray-400">Chargement...</span>
      </div>
    )
  }

  // Disabled state (render as text)
  if (disabled) {
    return (
      <div className={cn('flex items-center gap-2', containerClassName)}>
        {showAvatar && (
          <div className="flex-shrink-0 flex items-center justify-center rounded-full bg-gray-100 p-1">
            <User className={cn(AVATAR_SIZES[avatarSize], 'text-gray-500')} />
          </div>
        )}
        <span className={cn('text-sm text-gray-900', className)}>
          {displayName}
        </span>
      </div>
    )
  }

  // Link state
  return (
    <div className={cn('flex items-center gap-2', containerClassName)}>
      {showAvatar && (
        <div className="flex-shrink-0 flex items-center justify-center rounded-full bg-gray-100 p-1">
          <User className={cn(AVATAR_SIZES[avatarSize], 'text-gray-500')} />
        </div>
      )}
      <Link
        href={`/dashboard/clients/${clientId}`}
        onClick={onClick}
        className={cn(
          'text-sm font-medium text-gray-900 hover:text-blue-600 hover:underline transition-colors',
          className
        )}
      >
        {displayName}
      </Link>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// VARIANTES SIMPLIFIÉES
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Version inline sans avatar (pour les tableaux compacts)
 */
export function ClientLinkInline({
  clientId,
  clientName,
  clientFirstName,
  className = '',
}: Pick<ClientLinkProps, 'clientId' | 'clientName' | 'clientFirstName' | 'className'>) {
  return (
    <ClientLink
      clientId={clientId}
      clientName={clientName}
      clientFirstName={clientFirstName}
      showAvatar={false}
      className={className}
    />
  )
}

/**
 * Version badge avec avatar (pour les cartes)
 */
export function ClientLinkBadge({
  clientId,
  clientName,
  clientFirstName,
  className = '',
}: Pick<ClientLinkProps, 'clientId' | 'clientName' | 'clientFirstName' | 'className'>) {
  return (
    <ClientLink
      clientId={clientId}
      clientName={clientName}
      clientFirstName={clientFirstName}
      showAvatar={true}
      avatarSize="md"
      containerClassName="inline-flex items-center gap-2 px-2 py-1 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
      className={className}
    />
  )
}

export default ClientLink
