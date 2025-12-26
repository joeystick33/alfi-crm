'use client'

import { useState } from 'react'
import { Card } from '@/app/_common/components/ui/Card'
import { Button } from '@/app/_common/components/ui/Button'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Input } from '@/app/_common/components/ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/app/_common/components/ui/Dialog'
import { EmptyState } from '@/app/_common/components/ui/EmptyState'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import { ErrorState, getErrorVariant } from '@/app/_common/components/ui/ErrorState'
import {
  useApporteurs,
  useApporteurStats,
  useCreateApporteur,
  useUpdateApporteur,
  useDeleteApporteur,
} from '@/app/_common/hooks/use-api'
import type { ApporteurListItem, ApporteurType, CreateApporteurRequest } from '@/app/_common/lib/api-types'
import {
  Users,
  Plus,
  Search,
  UserCheck,
  TrendingUp,
  DollarSign,
  Edit,
  Trash2,
  Mail,
  Phone,
  Building,
  Briefcase,
  RefreshCw,
} from 'lucide-react'

const APPORTEUR_TYPE_LABELS: Record<ApporteurType, string> = {
  NOTAIRE: 'Notaire',
  EXPERT_COMPTABLE: 'Expert-comptable',
  BANQUIER: 'Banquier',
  COURTIER: 'Courtier',
  AUTRE: 'Autre',
}

const APPORTEUR_TYPE_COLORS: Record<ApporteurType, string> = {
  NOTAIRE: 'bg-purple-100 text-purple-700 border-purple-200',
  EXPERT_COMPTABLE: 'bg-blue-100 text-blue-700 border-blue-200',
  BANQUIER: 'bg-green-100 text-green-700 border-green-200',
  COURTIER: 'bg-orange-100 text-orange-700 border-orange-200',
  AUTRE: 'bg-slate-100 text-slate-700 border-slate-200',
}

export default function ApporteursPage() {
  const [filters, setFilters] = useState({
    search: '',
    type: 'ALL' as string,
    isActive: 'true',
  })

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingApporteur, setEditingApporteur] = useState<ApporteurListItem | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const [formData, setFormData] = useState<CreateApporteurRequest>({
    type: 'NOTAIRE',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    profession: '',
    commissionRate: undefined,
  })

  const apiFilters: { search?: string; type?: ApporteurType; isActive?: boolean } = {}
  if (filters.search) apiFilters.search = filters.search
  if (filters.type !== 'ALL') apiFilters.type = filters.type as ApporteurType
  if (filters.isActive !== 'ALL') apiFilters.isActive = filters.isActive === 'true'

  const { data, isLoading, isError, error, refetch } = useApporteurs(apiFilters)
  const { data: statsData } = useApporteurStats()
  const createMutation = useCreateApporteur()
  const updateMutation = useUpdateApporteur()
  const deleteMutation = useDeleteApporteur()

  // API returns { data: { data: apporteurs[], ... }, timestamp }

  const apporteursResponse = (data as any)?.data
  const apporteurs = Array.isArray(apporteursResponse?.data)
    ? apporteursResponse.data
    : Array.isArray(apporteursResponse)
      ? apporteursResponse
      : []

  // Extract stats from API response wrapper { data: stats, timestamp }

  const statsResponse = (statsData as any)?.data || statsData
  const stats = statsResponse || {
    total: 0,
    active: 0,
    inactive: 0,
    byType: {},
    totalClientsApportes: 0,
    totalCommissions: 0,
  }

  const handleOpenCreate = () => {
    setEditingApporteur(null)
    setFormData({
      type: 'NOTAIRE',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      company: '',
      profession: '',
      commissionRate: undefined,
    })
    setDialogOpen(true)
  }

  const handleOpenEdit = (apporteur: ApporteurListItem) => {
    setEditingApporteur(apporteur)
    setFormData({
      type: apporteur.type,
      firstName: apporteur.firstName,
      lastName: apporteur.lastName,
      email: apporteur.email,
      phone: apporteur.phone || '',
      company: apporteur.company || '',
      profession: apporteur.profession || '',
      commissionRate: apporteur.commissionRate || undefined,
    })
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingApporteur(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (editingApporteur) {
      await updateMutation.mutateAsync({
        id: editingApporteur.id,
        data: formData,
      })
    } else {
      await createMutation.mutateAsync(formData)
    }

    handleCloseDialog()
    refetch()
  }

  const handleToggleActive = async (apporteur: ApporteurListItem) => {
    await updateMutation.mutateAsync({
      id: apporteur.id,
      data: { isActive: !apporteur.isActive },
    })
    refetch()
  }

  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync(id)
    setDeleteConfirmId(null)
    refetch()
  }

  const handleResetFilters = () => {
    setFilters({ search: '', type: 'ALL', isActive: 'true' })
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="h-7 w-7 text-slate-600" />
            Apporteurs d'affaires
          </h1>
          <p className="text-slate-600 mt-1">Gestion des partenaires et commissions</p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvel apporteur
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total apporteurs</p>
              <p className="text-2xl font-bold mt-1">{stats.total}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-100">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Actifs</p>
              <p className="text-2xl font-bold mt-1 text-green-600">{stats.active}</p>
            </div>
            <div className="p-3 rounded-lg bg-green-100">
              <UserCheck className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Clients apportés</p>
              <p className="text-2xl font-bold mt-1 text-purple-600">{stats.totalClientsApportes}</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-100">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Commissions totales</p>
              <p className="text-2xl font-bold mt-1">{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(stats.totalCommissions || 0)}</p>
            </div>
            <div className="p-3 rounded-lg bg-orange-100">
              <DollarSign className="h-5 w-5 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Rechercher par nom, email, société..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-9"
              />
            </div>
          </div>

          <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tous les types</SelectItem>
              {Object.entries(APPORTEUR_TYPE_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.isActive} onValueChange={(value) => setFilters(prev => ({ ...prev, isActive: value }))}>
            <SelectTrigger className="w-full md:w-[150px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tous</SelectItem>
              <SelectItem value="true">Actifs</SelectItem>
              <SelectItem value="false">Inactifs</SelectItem>
            </SelectContent>
          </Select>

          {(filters.search || filters.type !== 'ALL' || filters.isActive !== 'true') && (
            <Button variant="outline" size="sm" onClick={handleResetFilters}>
              Réinitialiser
            </Button>
          )}
        </div>
      </Card>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState error={error as Error} variant={getErrorVariant(error as Error)} onRetry={() => refetch()} />
      ) : apporteurs.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Aucun apporteur trouvé"
          description={
            filters.search || filters.type !== 'ALL' || filters.isActive !== 'true'
              ? 'Aucun apporteur ne correspond à vos critères de recherche.'
              : 'Commencez par ajouter vos premiers apporteurs d\'affaires.'
          }
          action={
            !filters.search && filters.type === 'ALL'
              ? {
                label: 'Ajouter un apporteur',
                onClick: handleOpenCreate,
                icon: Plus,
              }
              : undefined
          }
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Nom</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Société</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Commission</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Clients</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Statut</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {apporteurs.map((apporteur) => (
                  <tr key={apporteur.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">
                        {apporteur.firstName} {apporteur.lastName}
                      </div>
                      {apporteur.profession && (
                        <div className="text-sm text-slate-500 flex items-center gap-1">
                          <Briefcase className="h-3 w-3" />
                          {apporteur.profession}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={`text-xs border ${APPORTEUR_TYPE_COLORS[apporteur.type]}`}>
                        {APPORTEUR_TYPE_LABELS[apporteur.type]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-slate-700 flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {apporteur.email}
                      </div>
                      {apporteur.phone && (
                        <div className="text-sm text-slate-500 flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {apporteur.phone}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {apporteur.company ? (
                        <div className="text-sm text-slate-700 flex items-center gap-1">
                          <Building className="h-3 w-3" />
                          {apporteur.company}
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {apporteur.commissionRate ? (
                        <span className="text-sm font-semibold text-slate-900">{apporteur.commissionRate}%</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-slate-900">{apporteur._count.clients}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={apporteur.isActive ? 'default' : 'outline'} className="text-xs">
                        {apporteur.isActive ? 'Actif' : 'Inactif'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEdit(apporteur)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleActive(apporteur)}
                        >
                          {apporteur.isActive ? 'Désactiver' : 'Activer'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteConfirmId(apporteur.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingApporteur ? 'Modifier l\'apporteur' : 'Nouvel apporteur d\'affaires'}</DialogTitle>
            <DialogDescription>
              {editingApporteur ? 'Modifiez les informations de l\'apporteur.' : 'Ajoutez un nouveau partenaire apporteur d\'affaires.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Prénom *</label>
                <Input
                  value={formData.firstName}
                  onChange={e => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="Prénom"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Nom *</label>
                <Input
                  value={formData.lastName}
                  onChange={e => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Nom"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Type *</label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as ApporteurType }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(APPORTEUR_TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email *</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@exemple.fr"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Téléphone</label>
                <Input
                  value={formData.phone}
                  onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="06 12 34 56 78"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Société</label>
                <Input
                  value={formData.company}
                  onChange={e => setFormData(prev => ({ ...prev, company: e.target.value }))}
                  placeholder="Nom de la société"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Profession</label>
                <Input
                  value={formData.profession}
                  onChange={e => setFormData(prev => ({ ...prev, profession: e.target.value }))}
                  placeholder="Profession"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Taux de commission (%)</label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.commissionRate || ''}
                onChange={e => setFormData(prev => ({ ...prev, commissionRate: e.target.value ? parseFloat(e.target.value) : undefined }))}
                placeholder="Ex: 10"
              />
            </div>

            <DialogFooter className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Annuler
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                {editingApporteur ? 'Modifier' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cet apporteur ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
