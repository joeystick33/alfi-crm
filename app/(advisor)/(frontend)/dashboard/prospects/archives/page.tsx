'use client'

/**
 * Page des prospects archivés
 * Permet de consulter et restaurer les prospects archivés
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
  RefreshCw,
  Target,
} from 'lucide-react'

const SOURCE_CONFIG: Record<string, { label: string; color: string }> = {
  SITE_WEB: { label: 'Site web', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  RECOMMANDATION: { label: 'Recommandation', color: 'bg-green-100 text-green-700 border-green-200' },
  RESEAU: { label: 'Réseau', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  EVENEMENT: { label: 'Événement', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  PARTENAIRE: { label: 'Partenaire', color: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
  AUTRE: { label: 'Autre', color: 'bg-slate-100 text-slate-700 border-slate-200' },
}

export default function ProspectsArchivesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [filters, setFilters] = useState({
    search: '',
    source: 'ALL',
  })
  const [restoreConfirm, setRestoreConfirm] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Charger les prospects archivés (status = ARCHIVE et clientType = PROSPECT)
  const apiFilters = useMemo(() => {
    const f: any = { 
      isArchived: true,
      status: 'ARCHIVE',
    }
    if (filters.search) f.search = filters.search
    return f
  }, [filters])

  const { data, isLoading, error, refetch } = useClients(apiFilters)
  const restoreMutation = useRestoreClient()
  const deleteMutation = useDeleteClient()

  // Extraire les prospects de la réponse API
  const prospects = useMemo(() => {
    const rawData = (data as any)?.data?.data || (data as any)?.data || []
    const allClients = Array.isArray(rawData) ? rawData : []
    // Filtrer pour ne garder que les prospects (status était PROSPECT avant archivage)
    return allClients.filter((c: any) => c.clientType === 'PARTICULIER' || c.clientType === 'PROFESSIONNEL')
  }, [data])

  // Stats
  const stats = useMemo(() => {
    return {
      total: prospects.length,
    }
  }, [prospects])

  const handleRestore = async (prospectId: string) => {
    try {
      await restoreMutation.mutateAsync(prospectId)
      toast({
        title: 'Prospect restauré',
        description: 'Le prospect a été restauré avec succès.',
      })
      refetch()
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de restaurer le prospect.',
        variant: 'destructive',
      })
    }
    setRestoreConfirm(null)
  }

  const handleDelete = async (prospectId: string) => {
    try {
      await deleteMutation.mutateAsync(prospectId)
      toast({
        title: 'Prospect supprimé',
        description: 'Le prospect a été supprimé définitivement.',
      })
      refetch()
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le prospect.',
        variant: 'destructive',
      })
    }
    setDeleteConfirm(null)
  }

  const handleResetFilters = () => {
    setFilters({ search: '', source: 'ALL' })
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/prospects">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <Archive className="h-7 w-7 text-slate-600" />
              Prospects archivés
            </h1>
            <p className="text-slate-600 mt-1">
              Consultez et restaurez vos prospects archivés
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <p className="text-sm text-slate-600">Prospects</p>
              <p className="text-2xl font-bold mt-1">{stats.total}</p>
            </div>
            <div className="p-3 rounded-lg bg-amber-100">
              <Target className="h-5 w-5 text-amber-600" />
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
              placeholder="Rechercher un prospect..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="pl-9"
            />
          </div>
          <Select
            value={filters.source}
            onValueChange={(value) => setFilters({ ...filters, source: value })}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Toutes les sources</SelectItem>
              {Object.entries(SOURCE_CONFIG).map(([key, config]) => (
                <SelectItem key={key} value={key}>{config.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleResetFilters}>
            Réinitialiser
          </Button>
        </div>
      </Card>

      {/* Liste des prospects */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : error ? (
        <Card className="p-8 text-center">
          <p className="text-red-600">Erreur lors du chargement des prospects archivés</p>
          <Button variant="outline" onClick={() => refetch()} className="mt-4">
            Réessayer
          </Button>
        </Card>
      ) : prospects.length === 0 ? (
        <EmptyState
          icon={Archive}
          title="Aucun prospect archivé"
          description="Vous n'avez aucun prospect archivé pour le moment."
          action={{
            label: 'Retour aux prospects',
            onClick: () => router.push('/dashboard/prospects'),
          }}
        />
      ) : (
        <div className="space-y-3">
          {prospects.map((prospect: any) => {
            const fullName = `${prospect.firstName || ''} ${prospect.lastName || ''}`.trim() || prospect.email
            const sourceConfig = SOURCE_CONFIG[prospect.source] || SOURCE_CONFIG.AUTRE

            return (
              <Card key={prospect.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-amber-100">
                      <Target className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900">{fullName}</h3>
                        {prospect.source && (
                          <Badge className={`${sourceConfig.color} text-xs`}>
                            {sourceConfig.label}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                        {prospect.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3.5 w-3.5" />
                            {prospect.email}
                          </span>
                        )}
                        {prospect.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5" />
                            {prospect.phone}
                          </span>
                        )}
                        {prospect.archivedAt && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            Archivé le {formatDate(new Date(prospect.archivedAt))}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/dashboard/clients/${prospect.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Voir
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRestoreConfirm(prospect.id)}
                    >
                      <ArchiveRestore className="h-4 w-4 mr-1" />
                      Restaurer
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => setDeleteConfirm(prospect.id)}
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
        title="Restaurer ce prospect ?"
        description="Le prospect sera de nouveau visible dans votre liste de prospects actifs."
        confirmLabel="Restaurer"
        variant="success"
        onConfirm={() => restoreConfirm && handleRestore(restoreConfirm)}
      />

      <ConfirmDialog
        open={!!deleteConfirm}
        onOpenChange={() => setDeleteConfirm(null)}
        title="Supprimer définitivement ce prospect ?"
        description="Cette action est irréversible. Toutes les données associées à ce prospect seront supprimées."
        confirmLabel="Supprimer"
        variant="danger"
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
      />
    </div>
  )
}
