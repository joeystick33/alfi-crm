
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Plus, CheckSquare, Clock, AlertTriangle, Search, LayoutGrid, List } from 'lucide-react'
import { Card, CardContent } from '@/app/_common/components/ui/Card'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Button } from '@/app/_common/components/ui/Button'
import { Input } from '@/app/_common/components/ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import { useToast } from '@/app/_common/hooks/use-toast'
import { KanbanBoard, type KanbanColumnData } from '@/app/(advisor)/(frontend)/components/kanban'
import { TacheKanbanCard, type TacheKanbanData, CreateTacheModal } from '@/app/(advisor)/(frontend)/components/taches'
import { UpdateTacheModal } from '@/app/(advisor)/(frontend)/components/taches/UpdateTacheModal'
import { apiCall } from '@/app/_common/lib/api-client'

type ViewMode = 'kanban' | 'list'

interface TaskApiResponse {
  id: string;
  title: string;
  description?: string;
  type: string;
  priority: string;
  status: string;
  dueDate?: string;
  completedAt?: string;
  assignedTo?: { id: string; firstName: string; lastName: string };
  client?: { id: string; firstName: string; lastName: string };
  projet?: { id: string; name: string };
  createdAt: string;
}

export default function TachesPage() {
  const { toast } = useToast()

  // State
  const [viewMode, setViewMode] = useState<ViewMode>('kanban')
  const [taches, setTaches] = useState<TacheKanbanData[]>([])
  const [loading, setLoading] = useState(true)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editingTache, setEditingTache] = useState<TacheKanbanData | null>(null)
  const [detailTache, setDetailTache] = useState<TacheKanbanData | null>(null)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [assignedToFilter, setAssignedToFilter] = useState<string>('all')

  // Load tâches
  const loadTaches = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()

      if (priorityFilter !== 'all') params.append('priority', priorityFilter)
      if (typeFilter !== 'all') params.append('type', typeFilter)
      if (assignedToFilter !== 'all') params.append('assignedToId', assignedToFilter)
      if (searchTerm) params.append('search', searchTerm)

      const response = await apiCall(`/api/advisor/taches?${params.toString()}`) as unknown;
      const data = (Array.isArray(response) ? response : (response as { data: TaskApiResponse[] }).data || []) as TaskApiResponse[];

      // Transform data to match TacheKanbanData interface
      const formattedTaches: TacheKanbanData[] = data.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        type: t.type as any,
        priority: t.priority as any,
        status: t.status as any,
        dueDate: t.dueDate,
        completedAt: t.completedAt,
        assignedTo: t.assignedTo || { id: '', firstName: '', lastName: '' },
        client: t.client,
        projet: t.projet,
        createdAt: t.createdAt,
      }))

      setTaches(formattedTaches)
    } catch (error) {
      console.error('Erreur chargement tâches:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les tâches',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [priorityFilter, typeFilter, assignedToFilter, searchTerm, toast])

  useEffect(() => {
    loadTaches()
  }, [loadTaches])

  // Statistiques
  const stats = useMemo(() => {
    const total = taches.length
    const todo = taches.filter(t => t.status === 'A_FAIRE').length
    const inProgress = taches.filter(t => t.status === 'EN_COURS').length
    const completed = taches.filter(t => t.status === 'TERMINE').length
    const overdue = taches.filter(
      t => t.dueDate &&
        new Date(t.dueDate) < new Date() &&
        t.status !== 'TERMINE' &&
        t.status !== 'ANNULE'
    ).length

    return { total, todo, inProgress, completed, overdue }
  }, [taches])

  // Filtrer tâches pour recherche locale
  const filteredTaches = useMemo(() => {
    if (!searchTerm) return taches

    const term = searchTerm.toLowerCase()
    return taches.filter(t =>
      t.title.toLowerCase().includes(term) ||
      t.description?.toLowerCase().includes(term) ||
      t.client?.firstName.toLowerCase().includes(term) ||
      t.client?.lastName.toLowerCase().includes(term)
    )
  }, [taches, searchTerm])

  // Organiser en colonnes Kanban
  const kanbanColumns: KanbanColumnData<TacheKanbanData>[] = useMemo(() => [
    {
      id: 'A_FAIRE',
      title: 'À faire',
      color: 'bg-slate-50',
      headerColor: 'bg-slate-600 text-white',
      items: filteredTaches.filter(t => t.status === 'A_FAIRE'),
      count: filteredTaches.filter(t => t.status === 'A_FAIRE').length,
    },
    {
      id: 'EN_COURS',
      title: 'En cours',
      color: 'bg-blue-50',
      headerColor: 'bg-blue-600 text-white',
      items: filteredTaches.filter(t => t.status === 'EN_COURS'),
      count: filteredTaches.filter(t => t.status === 'EN_COURS').length,
    },
    {
      id: 'TERMINE',
      title: 'Terminé',
      color: 'bg-green-50',
      headerColor: 'bg-green-600 text-white',
      items: filteredTaches.filter(t => t.status === 'TERMINE'),
      count: filteredTaches.filter(t => t.status === 'TERMINE').length,
    },
  ], [filteredTaches])

  // Handlers
  const handleCardMove = async (cardId: string, fromColumnId: string, toColumnId: string) => {
    if (fromColumnId === toColumnId) return

    try {
      // Update optimistically
      setTaches(prev =>
        prev.map(t => t.id === cardId ? { ...t, status: toColumnId as any } : t)
      )

      // API call
      await apiCall(`/api/advisor/taches/${cardId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: toColumnId }),
      })

      toast({
        title: 'Tâche mise à jour',
        description: `Statut changé vers "${toColumnId === 'A_FAIRE' ? 'À faire' :
          toColumnId === 'EN_COURS' ? 'En cours' :
            'Terminé'
          }"`,
        variant: 'success',
      })
    } catch (error) {
      console.error('Erreur changement statut:', error)

      // Rollback
      await loadTaches()

      toast({
        title: 'Erreur',
        description: 'Impossible de modifier le statut',
        variant: 'destructive',
      })
    }
  }

  const handleCompleteTache = async (tacheId: string) => {
    try {
      await apiCall(`/api/advisor/taches/${tacheId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'TERMINE', completedAt: new Date().toISOString() }),
      })

      setTaches(prev =>
        prev.map(t => t.id === tacheId ? { ...t, status: 'TERMINE' as const, completedAt: new Date().toISOString() } : t)
      )

      toast({
        title: 'Tâche terminée',
        description: 'La tâche a été marquée comme terminée',
        variant: 'success',
      })
    } catch (error) {
      console.error('Erreur complétion tâche:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de compléter la tâche',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteTache = async (tacheId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) return

    try {
      await apiCall(`/api/advisor/taches/${tacheId}`, {
        method: 'DELETE',
      })

      setTaches(prev => prev.filter(t => t.id !== tacheId))

      toast({
        title: 'Tâche supprimée',
        description: 'La tâche a été supprimée avec succès',
        variant: 'success',
      })
    } catch (error) {
      console.error('Erreur suppression tâche:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer la tâche',
        variant: 'destructive',
      })
    }
  }

  const handleEditTache = (tache: TacheKanbanData) => {
    setEditingTache(tache)
  }

  const handleCardClick = (tache: TacheKanbanData) => {
    // Ouvrir la modale d'édition au clic sur la carte
    setEditingTache(tache)
  }

  const renderTacheCard = (tache: TacheKanbanData, isDragging: boolean) => (
    <TacheKanbanCard
      tache={tache}
      isDragging={isDragging}
      onEdit={handleEditTache}
      onComplete={handleCompleteTache}
      onDelete={handleDeleteTache}
    />
  )

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tâches</h1>
          <p className="text-sm text-slate-500 mt-1">
            Gérez vos tâches avec le tableau Kanban
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View mode toggle */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
            <Button
              size="sm"
              variant={viewMode === 'kanban' ? 'primary' : 'ghost'}
              onClick={() => setViewMode('kanban')}
              className="h-8"
            >
              <LayoutGrid className="h-4 w-4 mr-1.5" />
              Kanban
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'list' ? 'primary' : 'ghost'}
              onClick={() => setViewMode('list')}
              className="h-8"
            >
              <List className="h-4 w-4 mr-1.5" />
              Liste
            </Button>
          </div>

          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle tâche
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total</p>
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                <CheckSquare className="h-5 w-5 text-slate-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">À faire</p>
                <p className="text-2xl font-bold text-slate-600">{stats.todo}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-slate-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">En cours</p>
                <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <CheckSquare className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Terminées</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <CheckSquare className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">En retard</p>
                <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Rechercher une tâche..."
              value={searchTerm}
              onChange={(e: any) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Priorité" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes priorités</SelectItem>
              <SelectItem value="URGENT">Urgente</SelectItem>
              <SelectItem value="HIGH">Haute</SelectItem>
              <SelectItem value="MEDIUM">Moyenne</SelectItem>
              <SelectItem value="LOW">Basse</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous types</SelectItem>
              <SelectItem value="CALL">Appel</SelectItem>
              <SelectItem value="EMAIL">Email</SelectItem>
              <SelectItem value="MEETING">Réunion</SelectItem>
              <SelectItem value="DOCUMENT">Document</SelectItem>
              <SelectItem value="FOLLOW_UP">Suivi</SelectItem>
              <SelectItem value="OTHER">Autre</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm('')
              setPriorityFilter('all')
              setTypeFilter('all')
              setAssignedToFilter('all')
            }}
          >
            Réinitialiser filtres
          </Button>
        </div>
      </Card>

      {/* Kanban Board */}
      {viewMode === 'kanban' && (
        <KanbanBoard
          columns={kanbanColumns}
          onCardMove={handleCardMove}
          onCardClick={handleCardClick}
          renderCard={renderTacheCard}
          getCardId={(tache) => tache.id}
          isLoading={loading}
          emptyMessage="Aucune tâche"
          emptyDescription="Créez votre première tâche pour commencer."
        />
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Tâche</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Statut</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Priorité</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Client</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Assigné à</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Échéance</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredTaches.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                      Aucune tâche trouvée
                    </td>
                  </tr>
                ) : (
                  filteredTaches.map((tache) => {
                    const statusConfig = {
                      A_FAIRE: { label: 'À faire', variant: 'secondary' as const },
                      EN_COURS: { label: 'En cours', variant: 'info' as const },
                      TERMINE: { label: 'Terminé', variant: 'success' as const },
                      ANNULE: { label: 'Annulé', variant: 'destructive' as const },
                    }
                    const prioConfig = {
                      BASSE: { label: 'Basse', variant: 'secondary' as const },
                      MOYENNE: { label: 'Moyenne', variant: 'default' as const },
                      HAUTE: { label: 'Haute', variant: 'warning' as const },
                      URGENTE: { label: 'Urgente', variant: 'destructive' as const },
                    }
                    const typeLabels: Record<string, string> = {
                      APPEL: 'Appel',
                      EMAIL: 'Email',
                      REUNION: 'Réunion',
                      REVUE_DOCUMENTS: 'Documents',
                      MISE_A_JOUR_KYC: 'KYC',
                      RENOUVELLEMENT_CONTRAT: 'Renouvellement',
                      SUIVI: 'Suivi',
                      ADMINISTRATIF: 'Administratif',
                      AUTRE: 'Autre',
                    }
                    const status = statusConfig[tache.status] || statusConfig.A_FAIRE
                    const prio = prioConfig[tache.priority] || prioConfig.MOYENNE
                    const isOverdue = tache.dueDate && new Date(tache.dueDate) < new Date() && tache.status !== 'TERMINE'

                    return (
                      <tr
                        key={tache.id}
                        className="hover:bg-muted/30 cursor-pointer transition-colors"
                        onClick={() => handleCardClick(tache)}
                      >
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-foreground">{tache.title}</p>
                            {tache.description && (
                              <p className="text-sm text-muted-foreground line-clamp-1">{tache.description}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline">{typeLabels[tache.type] || tache.type}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={prio.variant}>{prio.label}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          {tache.client ? (
                            <span className="text-sm">{tache.client.firstName} {tache.client.lastName}</span>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm">{tache.assignedTo.firstName} {tache.assignedTo.lastName}</span>
                        </td>
                        <td className="px-4 py-3">
                          {tache.dueDate ? (
                            <span className={`text-sm ${isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                              {isOverdue && <AlertTriangle className="inline h-3 w-3 mr-1" />}
                              {new Date(tache.dueDate).toLocaleDateString('fr-FR')}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditTache(tache)}
                            >
                              Modifier
                            </Button>
                            {tache.status !== 'TERMINE' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCompleteTache(tache.id)}
                              >
                                <CheckSquare className="h-4 w-4 mr-1" />
                                Terminer
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              {filteredTaches.length} tâche{filteredTaches.length > 1 ? 's' : ''}
            </p>
          </div>
        </Card>
      )}

      {/* Create Modal */}
      <CreateTacheModal
        open={createModalOpen}
        onOpenChange={(open) => {
          setCreateModalOpen(open)
          if (!open) {
            // Reload taches when modal closes (task was created)
            loadTaches()
          }
        }}
      />

      {/* Edit Modal */}
      {editingTache && (
        <UpdateTacheModal
          open={!!editingTache}
          onOpenChange={(open) => {
            if (!open) setEditingTache(null)
          }}
          tache={editingTache}
          onSuccess={() => {
            setEditingTache(null)
            loadTaches()
          }}
        />
      )}
    </div>
  )
}
