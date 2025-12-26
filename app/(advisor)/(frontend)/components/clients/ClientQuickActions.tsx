'use client'

import { useRouter } from 'next/navigation'
import { 
  MoreVertical, 
  Phone, 
  Mail, 
  Pencil, 
  Trash2,
  UserCheck,
  UserX
} from 'lucide-react'
import { Button } from '@/app/_common/components/ui/Button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/app/_common/components/ui/DropdownMenu'
import { toast } from '@/app/_common/hooks/use-toast'
import type { ClientListItem } from '@/app/_common/lib/api-types'

interface ClientQuickActionsProps {
  client: ClientListItem
  onDeactivate?: (id: string) => void
  onArchive?: (id: string) => void
  onReactivate?: (id: string, currentStatus?: ClientListItem['status']) => void
  className?: string
}

export function ClientQuickActions({ 
  client, 
  onDeactivate,
  onArchive,
  onReactivate,
  className 
}: ClientQuickActionsProps) {
  const router = useRouter()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className={className}
          onClick={(e) => {
            e.stopPropagation()
          }}
        >
          <MoreVertical className="h-4 w-4 text-gray-400 hover:text-gray-600" />
          <span className="sr-only">Actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {/* Contact Actions */}
        {(client.phone || client.email) && (
          <>
            <div className="px-2 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Contact
            </div>
            {client.phone && (
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation()
                window.location.href = `tel:${client.phone}`
              }}>
                <Phone className="mr-2 h-4 w-4 text-gray-500" />
                <span>Appeler</span>
              </DropdownMenuItem>
            )}
            {client.email && (
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation()
                window.location.href = `mailto:${client.email}`
              }}>
                <Mail className="mr-2 h-4 w-4 text-gray-500" />
                <span>Envoyer un email</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
          </>
        )}

        {/* Management Actions */}
        <div className="px-2 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Gestion
        </div>
        
        <DropdownMenuItem onClick={(e) => {
          e.stopPropagation()
          router.push(`/dashboard/clients/${client.id}`)
        }}>
          <Pencil className="mr-2 h-4 w-4 text-indigo-500" />
          <span>Voir / Modifier</span>
        </DropdownMenuItem>

        {client.status === 'ACTIF' ? (
          <DropdownMenuItem onClick={(e) => {
            e.stopPropagation()
            if (!onDeactivate) {
              toast({
                title: 'Action indisponible',
                description: 'Désactivation non configurée sur cette page.',
                variant: 'destructive',
              })
              return
            }
            onDeactivate(client.id)
          }}>
            <UserX className="mr-2 h-4 w-4 text-amber-500" />
            <span>Désactiver</span>
          </DropdownMenuItem>
        ) : client.status === 'INACTIF' || client.status === 'ARCHIVE' || client.status === 'PERDU' ? (
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation()
              if (!onReactivate) {
                toast({
                  title: 'Action indisponible',
                  description: 'Réactivation non configurée sur cette page.',
                  variant: 'destructive',
                })
                return
              }
              onReactivate(client.id, client.status)
            }}
          >
            <UserCheck className="mr-2 h-4 w-4 text-emerald-500" />
            <span>{client.status === 'PERDU' ? 'Réactiver comme prospect' : 'Réactiver'}</span>
          </DropdownMenuItem>
        ) : null}

        <DropdownMenuSeparator />
        
        {/* Destructive Actions */}
        {onArchive && client.status !== 'ARCHIVE' && (
          <DropdownMenuItem 
            className="text-rose-600 focus:text-rose-700 focus:bg-rose-50"
            onClick={(e) => {
              e.stopPropagation()
              onArchive(client.id)
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Archiver</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
