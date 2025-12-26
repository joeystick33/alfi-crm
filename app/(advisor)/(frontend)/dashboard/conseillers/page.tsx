'use client'

import { useState, useMemo } from 'react'
import { Card } from '@/app/_common/components/ui/Card'
import { Button } from '@/app/_common/components/ui/Button'
import { Input } from '@/app/_common/components/ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import { EmptyState } from '@/app/_common/components/ui/EmptyState'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import { useConseillers, useDeleteConseiller } from '@/app/_common/hooks/use-api'
import {
  ConseillerCard,
  CreateConseillerModal,
  EditConseillerModal,
  type ConseillerData,
} from '@/app/(advisor)/(frontend)/components/conseillers'
import {
  Plus,
  Search,
  Users,
  UserCheck,
  UserCog,
  Grid,
  List,
} from 'lucide-react'
export default function ConseillersPage() {
  const [filters, setFilters] = useState({
    role: 'ALL',
    isActive: 'ALL',
    search: '',
  })
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingConseiller, setEditingConseiller] = useState<ConseillerData | null>(null)

  // Build API filters
  const apiFilters = useMemo(() => {
    const f: { role?: string; isActive?: boolean; search?: string } = {}
    if (filters.role !== 'ALL') f.role = filters.role
    if (filters.isActive !== 'ALL') f.isActive = filters.isActive === 'true'
    if (filters.search) f.search = filters.search
    return f
  }, [filters])

  const { data, isLoading, error, refetch } = useConseillers(apiFilters)
  const deleteMutation = useDeleteConseiller()

  const conseillers = (data?.data || []) as unknown as ConseillerData[]
  const stats = useMemo(() => {
    const total = conseillers.length
    const advisors = conseillers.filter((c: ConseillerData) => c.role === 'ADVISOR').length
    const assistants = conseillers.filter((c: ConseillerData) => c.role === 'ASSISTANT').length
    const active = conseillers.filter((c: ConseillerData) => c.isActive).length
    return { total, advisors, assistants, active }
  }, [conseillers])

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id)
  }

  const handleResetFilters = () => {
    setFilters({ role: 'ALL', isActive: 'ALL', search: '' })
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Gestion des conseillers</h1>
          <p className="text-slate-600 mt-1">
            Créer et gérer les accès des conseillers du cabinet
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau conseiller
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total conseillers</p>
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
              <p className="text-sm text-slate-600">Conseillers</p>
              <p className="text-2xl font-bold mt-1">{stats.advisors}</p>
            </div>
            <div className="p-3 rounded-lg bg-green-100">
              <UserCheck className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Assistants</p>
              <p className="text-2xl font-bold mt-1">{stats.assistants}</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-100">
              <UserCog className="h-5 w-5 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Actifs</p>
              <p className="text-2xl font-bold mt-1">{stats.active}</p>
            </div>
            <div className="p-3 rounded-lg bg-orange-100">
              <UserCheck className="h-5 w-5 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Rechercher par nom, email..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-9"
              />
            </div>
          </div>

          {/* Role filter */}
          <Select
            value={filters.role}
            onValueChange={(value) => setFilters(prev => ({ ...prev, role: value }))}
          >
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Rôle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tous les rôles</SelectItem>
              <SelectItem value="ADVISOR">Conseillers</SelectItem>
              <SelectItem value="ASSISTANT">Assistants</SelectItem>
              <SelectItem value="ADMIN">Admins</SelectItem>
            </SelectContent>
          </Select>

          {/* Active filter */}
          <Select
            value={filters.isActive}
            onValueChange={(value) => setFilters(prev => ({ ...prev, isActive: value }))}
          >
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tous les statuts</SelectItem>
              <SelectItem value="true">Actifs</SelectItem>
              <SelectItem value="false">Inactifs</SelectItem>
            </SelectContent>
          </Select>

          {/* View toggle */}
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'grid' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {/* Reset */}
          {(filters.role !== 'ALL' || filters.isActive !== 'ALL' || filters.search) && (
            <Button variant="outline" size="sm" onClick={handleResetFilters}>
              Réinitialiser
            </Button>
          )}
        </div>
      </Card>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : error ? (
        <Card className="p-6">
          <div className="text-center text-red-600">
            <p>Erreur lors du chargement des conseillers</p>
            <Button variant="outline" onClick={() => refetch()} className="mt-4">
              Réessayer
            </Button>
          </div>
        </Card>
      ) : conseillers.length === 0 ? (
        <EmptyState
          icon={UserCog}
          title="Aucun conseiller trouvé"
          description={
            filters.search || filters.role !== 'ALL' || filters.isActive !== 'ALL'
              ? 'Aucun conseiller ne correspond à vos critères de recherche.'
              : 'Commencez par créer votre premier conseiller pour gérer votre cabinet.'
          }
          action={
            !filters.search && filters.role === 'ALL' && filters.isActive === 'ALL'
              ? {
                label: 'Créer un conseiller',
                onClick: () => setShowCreateModal(true),
                icon: Plus,
              }
              : undefined
          }
        />
      ) : (
        <div className={`
          ${viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
            : 'space-y-4'
          }
        `}>
          {conseillers.map((conseiller: ConseillerData) => (
            <ConseillerCard
              key={conseiller.id}
              conseiller={conseiller}
              onEdit={setEditingConseiller}
              onDelete={handleDelete}
              currentUserId={undefined}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <CreateConseillerModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSuccess={() => refetch()}
      />

      <EditConseillerModal
        open={!!editingConseiller}
        onOpenChange={(open) => !open && setEditingConseiller(null)}
        conseiller={editingConseiller}
        onSuccess={() => refetch()}
      />
    </div>
  )
}
