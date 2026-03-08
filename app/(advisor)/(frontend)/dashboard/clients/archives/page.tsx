'use client'

/**
 * Page des clients archivés
 * Permet de consulter et restaurer les clients archivés
 */

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/app/_common/components/ui/Card'
import { Button } from '@/app/_common/components/ui/Button'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Input } from '@/app/_common/components/ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import { EmptyState } from '@/app/_common/components/ui/EmptyState'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import { ConfirmDialog } from '@/app/_common/components/ui/ConfirmDialog'
import { useClients, useRestoreClient, useDeleteClient } from '@/app/_common/hooks/use-api'
import { useToast } from '@/app/_common/hooks/use-toast'
import { formatDate } from '@/app/_common/lib/utils'
import {
  Archive,
  Search,
  ArchiveRestore,
  Eye,
  Trash2,
  Calendar,
  User,
  Users,
  ArrowLeft,
  Mail,
  Phone,
  Building,
  RefreshCw,
} from 'lucide-react'

const CLIENT_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  PARTICULIER: { label: 'Particulier', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  PROFESSIONNEL: { label: 'Professionnel', color: 'bg-purple-100 text-purple-700 border-purple-200' },
}

export default function ClientsArchivesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [filters, setFilters] = useState({
    search: '',
    clientType: 'ALL',
  })
  const [restoreConfirm, setRestoreConfirm] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Charger les clients archivés
  const apiFilters = useMemo(() => {
    const f: any = { isArchived: true }
    if (filters.search) f.search = filters.search
    if (filters.clientType !== 'ALL') f.clientType = filters.clientType
    return f
  }, [filters])

  const { data, isLoading, error, refetch } = useClients(apiFilters)
  const restoreMutation = useRestoreClient()
  const deleteMutation = useDeleteClient()

  // Extraire les clients de la réponse API
  const clients = useMemo(() => {
    const rawData = (data as any)?.data?.data || (data as any)?.data || []
    return Array.isArray(rawData) ? rawData : []
  }, [data])

  // Stats
  const stats = useMemo(() => {
    return {
      total: clients.length,
      particuliers: clients.filter((c: any) => c.clientType === 'PARTICULIER').length,
      professionnels: clients.filter((c: any) => c.clientType === 'PROFESSIONNEL').length,
    }
  }, [clients])

  const handleRestore = async (clientId: string) => {
    try {
      await restoreMutation.mutateAsync(clientId)
      toast({
        title: 'Client restauré',
        description: 'Le client a été restauré avec succès.',
      })
      refetch()
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de restaurer le client.',
        variant: 'destructive',
      })
    }
    setRestoreConfirm(null)
  }

  const handleDelete = async (clientId: string) => {
    try {
      await deleteMutation.mutateAsync(clientId)
      toast({
        title: 'Client supprimé',
        description: 'Le client a été supprimé définitivement.',
      })
      refetch()
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le client.',
        variant: 'destructive',
      })
    }
    setDeleteConfirm(null)
  }

  const handleResetFilters = () => {
    setFilters({ search: '', clientType: 'ALL' })
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/clients">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <Archive className="h-7 w-7 text-slate-600" />
              Clients archivés
            </h1>
            <p className="text-slate-600 mt-1">
              Consultez et restaurez vos clients archivés
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total archivés</p>
              <p className="text-2xl font-bold mt-1">{stats.total}</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-100">
              <Archive className="h-5 w-5 text-slate-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Particuliers</p>
              <p className="text-2xl font-bold mt-1">{stats.particuliers}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-100">
              <User className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Professionnels</p>
              <p className="text-2xl font-bold mt-1">{stats.professionnels}</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-100">
              <Building className="h-5 w-5 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Rechercher un client..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="pl-9"
            />
          </div>
          <Select
            value={filters.clientType}
            onValueChange={(value) => setFilters({ ...filters, clientType: value })}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Type de client" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tous les types</SelectItem>
              <SelectItem value="PARTICULIER">Particuliers</SelectItem>
              <SelectItem value="PROFESSIONNEL">Professionnels</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleResetFilters}>
            Réinitialiser
          </Button>
        </div>
      </Card>

      {/* Liste des clients */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : error ? (
        <Card className="p-8 text-center">
          <p className="text-red-600">Erreur lors du chargement des clients archivés</p>
          <Button variant="outline" onClick={() => refetch()} className="mt-4">
            Réessayer
          </Button>
        </Card>
      ) : clients.length === 0 ? (
        <EmptyState
          icon={Archive}
          title="Aucun client archivé"
          description="Vous n'avez aucun client archivé pour le moment."
          action={{
            label: 'Retour aux clients',
            onClick: () => router.push('/dashboard/clients'),
          }}
        />
      ) : (
        <div className="space-y-3">
          {clients.map((client: any) => {
            const typeConfig = CLIENT_TYPE_CONFIG[client.clientType] || CLIENT_TYPE_CONFIG.PARTICULIER
            const fullName = `${client.firstName || ''} ${client.lastName || ''}`.trim() || client.email

            return (
              <Card key={client.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-slate-100">
                      <User className="h-5 w-5 text-slate-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900">{fullName}</h3>
                        <Badge className={`${typeConfig.color} text-xs`}>
                          {typeConfig.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                        {client.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3.5 w-3.5" />
                            {client.email}
                          </span>
                        )}
                        {client.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5" />
                            {client.phone}
                          </span>
                        )}
                        {client.archivedAt && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            Archivé le {formatDate(new Date(client.archivedAt))}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/dashboard/clients/${client.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Voir
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRestoreConfirm(client.id)}
                    >
                      <ArchiveRestore className="h-4 w-4 mr-1" />
                      Restaurer
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => setDeleteConfirm(client.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Dialogs de confirmation */}
      <ConfirmDialog
        open={!!restoreConfirm}
        onOpenChange={() => setRestoreConfirm(null)}
        title="Restaurer ce client ?"
        description="Le client sera de nouveau visible dans votre liste de clients actifs."
        confirmLabel="Restaurer"
        variant="success"
        onConfirm={() => restoreConfirm && handleRestore(restoreConfirm)}
      />

      <ConfirmDialog
        open={!!deleteConfirm}
        onOpenChange={() => setDeleteConfirm(null)}
        title="Supprimer définitivement ce client ?"
        description="Cette action est irréversible. Toutes les données associées à ce client seront supprimées."
        confirmLabel="Supprimer"
        variant="danger"
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
      />
    </div>
  )
}
