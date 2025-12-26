'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/app/_common/components/ui/Button'
import { Badge } from '@/app/_common/components/ui/Badge'
import { getInitials, cn } from '@/app/_common/lib/utils'
import type { ClientDetail, WealthSummary } from '@/app/_common/lib/api-types'
import { ClientEditModal } from './ClientEditModal'
import { QuickAddMenu } from './QuickAddMenu'
import { useToast } from '@/app/_common/hooks/use-toast'
import {
  ArrowLeft,
  Edit,
  MoreHorizontal,
  User,
  Building2,
  Mail,
  Phone,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronDown,
  Download,
  Printer,
  Share2,
  Trash2,
  Archive,
  Copy
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/app/_common/components/ui/DropdownMenu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/_common/components/ui/Dialog'

interface ClientBannerProps {
  client: ClientDetail
  wealth?: WealthSummary
  onBack?: () => void
  onRefresh?: () => void
}

export function ClientBanner({ client, wealth: _wealth, onBack, onRefresh }: ClientBannerProps) {
  const _router = useRouter()
  const [showEditModal, setShowEditModal] = useState(false)
  const { toast } = useToast()

  const TypeIcon = client.clientType === 'PROFESSIONNEL' ? Building2 : User
  const initials = getInitials(client.firstName, client.lastName)

  const getStatusBadge = () => {
    switch (client.status) {
      case 'ACTIF':
        return { variant: 'success' as const, label: 'Actif', icon: CheckCircle }
      case 'PROSPECT':
        return { variant: 'info' as const, label: 'Prospect', icon: Clock }
      case 'INACTIF':
        return { variant: 'default' as const, label: 'Inactif', icon: AlertCircle }
      default:
        return { variant: 'default' as const, label: client.status, icon: User }
    }
  }

  const statusBadge = getStatusBadge()
  const StatusIcon = statusBadge.icon

  const handleEditSuccess = () => {
    setShowEditModal(false)
    onRefresh?.()
  }

  const handleExportReport = useCallback(async () => {
    try {
      const res = await fetch(`/api/advisor/clients/${client.id}/reporting`, { credentials: 'include' })
      if (!res.ok) throw new Error('export_failed')
      const reportData = await res.json()
      const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `rapport-${client.lastName}-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      window.URL.revokeObjectURL(url)
      toast({ title: 'Rapport exporté', description: 'Le fichier a été téléchargé' })
    } catch {
      toast({ title: 'Export impossible', description: 'Échec du téléchargement du rapport', variant: 'destructive' })
    }
  }, [client.id, client.lastName, toast])

  const handleCopyLink = useCallback(() => {
    try {
      const link = window.location.href
      navigator.clipboard.writeText(link)
      toast({ title: 'Lien copié', description: 'Le lien de la fiche client est dans le presse-papiers' })
    } catch {
      toast({ title: 'Copie impossible', description: 'Le lien n’a pas pu être copié', variant: 'destructive' })
    }
  }, [toast])

  const handlePrint = useCallback(() => {
    window.print()
  }, [])

  const handleShare = useCallback(async () => {
    const shareData = {
      title: `${client.firstName} ${client.lastName} - Fiche Client`,
      text: `Fiche client de ${client.firstName} ${client.lastName}`,
      url: window.location.href,
    }
    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText(window.location.href)
        toast({ title: 'Lien copié', description: 'Le lien a été copié dans le presse-papiers' })
      }
    } catch {
      toast({ title: 'Partage impossible', description: 'Le partage a échoué', variant: 'destructive' })
    }
  }, [client.firstName, client.lastName, toast])

  const handleDuplicate = useCallback(async () => {
    try {
      const res = await fetch(`/api/advisor/clients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          firstName: `${client.firstName} (copie)`,
          lastName: client.lastName,
          email: '',
          phone: client.phone || '',
          clientType: client.clientType,
          status: 'PROSPECT',
          address: client.address || '',
          city: client.city || '',
          postalCode: client.postalCode || '',
          country: client.country || 'France',
          birthDate: client.birthDate || null,
          profession: client.profession || '',
          familySituation: client.familySituation || 'SINGLE',
          taxResidency: client.taxResidency || 'FRANCE',
        }),
      })
      if (!res.ok) throw new Error('duplicate_failed')
      const newClient = await res.json()
      toast({ title: 'Client dupliqué', description: `${newClient.firstName} ${newClient.lastName} créé avec succès` })
      onRefresh?.()
    } catch {
      toast({ title: 'Duplication impossible', description: 'La duplication du client a échoué', variant: 'destructive' })
    }
  }, [client, toast, onRefresh])

  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleArchive = useCallback(async () => {
    try {
      const newStatus = client.status === 'INACTIF' ? 'ACTIF' : 'INACTIF'
      const res = await fetch(`/api/advisor/clients/${client.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error('archive_failed')
      toast({ 
        title: newStatus === 'INACTIF' ? 'Client archivé' : 'Client réactivé', 
        description: `${client.firstName} ${client.lastName} est maintenant ${newStatus === 'INACTIF' ? 'inactif' : 'actif'}` 
      })
      setShowArchiveConfirm(false)
      onRefresh?.()
    } catch {
      toast({ title: 'Archivage impossible', description: 'L\'archivage du client a échoué', variant: 'destructive' })
    }
  }, [client.id, client.firstName, client.lastName, client.status, toast, onRefresh])

  const handleDelete = useCallback(async () => {
    try {
      const res = await fetch(`/api/advisor/clients/${client.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) throw new Error('delete_failed')
      toast({ title: 'Client supprimé', description: `${client.firstName} ${client.lastName} a été supprimé` })
      setShowDeleteConfirm(false)
      window.location.href = '/dashboard/clients'
    } catch {
      toast({ title: 'Suppression impossible', description: 'La suppression du client a échoué', variant: 'destructive' })
    }
  }, [client.id, client.firstName, client.lastName, toast])

  return (
    <>
      {/* Compact Banner */}
      <div className="flex items-center justify-between gap-4 px-4 py-3 bg-white rounded-xl border border-gray-200/60 shadow-sm">
        {/* Left: Back + Avatar + Info */}
        <div className="flex items-center gap-4 min-w-0">
          {/* Back Button */}
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

          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-[#7373FF]/20">
              <span className="text-base font-bold text-white">{initials}</span>
            </div>
            {/* Status dot */}
            <div className={cn(
              'absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white',
              client.status === 'ACTIF' ? 'bg-emerald-500' : 'bg-gray-400'
            )} />
          </div>

          {/* Client Info */}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-semibold text-gray-900 truncate">
                {client.firstName} {client.lastName}
              </h1>
              <Badge variant={statusBadge.variant} size="xs">
                {statusBadge.label}
              </Badge>
              <Badge variant="default" size="xs" className="gap-1">
                <TypeIcon className="h-3 w-3" />
                {client.clientType === 'PARTICULIER' ? 'Particulier' : 'Pro'}
              </Badge>
            </div>
            
            {/* Contact - Compact */}
            <div className="flex items-center gap-3 text-sm text-gray-500 mt-0.5">
              {client.email && (
                <a 
                  href={`mailto:${client.email}`}
                  className="flex items-center gap-1 hover:text-[#7373FF] transition-colors truncate max-w-[200px]"
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

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Quick Add Menu */}
          <QuickAddMenu 
            clientId={client.id} 
            client={client} 
            onSuccess={onRefresh}
            variant="default"
            className="bg-emerald-600 hover:bg-emerald-700"
          />

          <Button 
            size="sm"
            onClick={() => setShowEditModal(true)}
            className="gap-1.5 bg-indigo-600 hover:bg-indigo-700"
          >
            <Edit className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Éditer</span>
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Download className="h-3.5 w-3.5" />
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleExportReport}>
                <Download className="h-4 w-4 mr-2" />
                Exporter le rapport (JSON)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Imprimer
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleCopyLink}>
                <Share2 className="h-4 w-4 mr-2" />
                Copier le lien
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Partager
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDuplicate}>
                <Copy className="h-4 w-4 mr-2" />
                Dupliquer
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowArchiveConfirm(true)}>
                <Archive className="h-4 w-4 mr-2" />
                {client.status === 'INACTIF' ? 'Réactiver' : 'Archiver'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-rose-600 focus:text-rose-600"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Edit Modal */}
      <ClientEditModal
        client={client}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={handleEditSuccess}
      />

      {/* Archive Confirmation Modal */}
      <Dialog open={showArchiveConfirm} onOpenChange={setShowArchiveConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {client.status === 'INACTIF' ? 'Réactiver' : 'Archiver'} le client
            </DialogTitle>
            <DialogDescription>
              {client.status === 'INACTIF' 
                ? `Êtes-vous sûr de vouloir réactiver ${client.firstName} ${client.lastName} ?`
                : `Êtes-vous sûr de vouloir archiver ${client.firstName} ${client.lastName} ? Le client passera en statut inactif.`
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowArchiveConfirm(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleArchive}
              className={client.status === 'INACTIF' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'}
            >
              {client.status === 'INACTIF' ? 'Réactiver' : 'Archiver'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-rose-600">Supprimer le client</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer définitivement {client.firstName} {client.lastName} ? 
              Cette action est irréversible et supprimera toutes les données associées.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Annuler
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDelete}
            >
              Supprimer définitivement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
