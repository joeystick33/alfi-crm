'use client'

/**
 * Mes Actions Commerciales - Vue Conseiller
 * 
 * Actions commerciales personnelles:
 * - Mes actions en cours
 * - Création d'actions
 * - Suivi de progression
 */

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_common/components/ui/Card'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Button } from '@/app/_common/components/ui/Button'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import { Progress } from '@/app/_common/components/ui/Progress'
import { Input } from '@/app/_common/components/ui/Input'
import { Label } from '@/app/_common/components/ui/Label'
import { Textarea } from '@/app/_common/components/ui/Textarea'
import { useMesActions, useCreateMesAction, useUpdateMesAction } from '@/app/_common/hooks/use-api'
import {
  Briefcase,
  Plus,
  Calendar,
  CheckCircle,
  Clock,
  Target,
  Users,
  Edit,
  X,
  Save,
} from 'lucide-react'

interface MonAction {
  id: string
  title: string
  description: string
  type: 'PROSPECTION' | 'RELANCE' | 'SUIVI' | 'AUTRE'
  status: 'A_FAIRE' | 'EN_COURS' | 'DONE'
  priority: 'BASSE' | 'MOYENNE' | 'HAUTE'
  dueDate?: string
  clientId?: string
  clientName?: string
  target?: number
  current?: number
  unit?: string
  createdAt: string
}

const TYPE_CONFIG = {
  PROSPECTION: { label: 'Prospection', color: 'bg-blue-100 text-blue-700' },
  RELANCE: { label: 'Relance', color: 'bg-green-100 text-green-700' },
  SUIVI: { label: 'Suivi client', color: 'bg-purple-100 text-purple-700' },
  AUTRE: { label: 'Autre', color: 'bg-gray-100 text-gray-700' },
}

const STATUS_CONFIG = {
  A_FAIRE: { label: 'À faire', color: 'bg-gray-100 text-gray-700' },
  EN_COURS: { label: 'En cours', color: 'bg-blue-100 text-blue-700' },
  DONE: { label: 'Terminée', color: 'bg-green-100 text-green-700' },
}

const PRIORITY_CONFIG = {
  BASSE: { label: 'Faible', color: 'text-gray-500' },
  MOYENNE: { label: 'Moyenne', color: 'text-blue-500' },
  HAUTE: { label: 'Haute', color: 'text-red-500' },
}


export default function MesActionsPage() {
  const [showNewForm, setShowNewForm] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')

  // New action form state
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newType, setNewType] = useState<'PROSPECTION' | 'RELANCE' | 'SUIVI' | 'AUTRE'>('PROSPECTION')
  const [newPriority, setNewPriority] = useState<'BASSE' | 'MOYENNE' | 'HAUTE'>('MOYENNE')
  const [newDueDate, setNewDueDate] = useState('')

  // Fetch actions from API
  const { data: apiData, isLoading, refetch } = useMesActions({ 
    status: statusFilter !== 'all' ? statusFilter : undefined 
  })
  const createActionMutation = useCreateMesAction()
  const updateActionMutation = useUpdateMesAction()

  // Map API data with fallback
  const actions: MonAction[] = useMemo(() => {
    if (apiData?.actions && apiData.actions.length > 0) {
      return apiData.actions.map((action) => ({
        id: action.id,
        title: action.title,
        description: action.description,
        type: (action.type || 'AUTRE') as MonAction['type'],
        status: (action.status || 'A_FAIRE') as MonAction['status'],
        priority: (action.priority || 'MOYENNE') as MonAction['priority'],
        dueDate: action.dueDate,
        clientId: action.clientId,
        clientName: action.clientName,
        createdAt: action.createdAt,
      }))
    }
    return []
  }, [apiData])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
    })
  }

  const filteredActions = statusFilter === 'all' 
    ? actions 
    : actions.filter(a => a.status === statusFilter)

  const stats = {
    total: actions.length,
    todo: actions.filter(a => a.status === 'A_FAIRE').length,
    inProgress: actions.filter(a => a.status === 'EN_COURS').length,
    done: actions.filter(a => a.status === 'DONE').length,
  }

  const handleStatusChange = async (actionId: string, newStatus: MonAction['status']) => {
    updateActionMutation.mutate({ id: actionId, status: newStatus })
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Briefcase className="h-7 w-7 text-purple-600" />
            Mes Actions Commerciales
          </h1>
          <p className="text-gray-500 mt-1">Gérez vos actions de prospection et relance</p>
        </div>
        
        <Button onClick={() => setShowNewForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle action
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 cursor-pointer hover:bg-gray-50" onClick={() => setStatusFilter('all')}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Briefcase className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-gray-500">Total</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 cursor-pointer hover:bg-gray-50" onClick={() => setStatusFilter('A_FAIRE')}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Clock className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.todo}</p>
              <p className="text-sm text-gray-500">À faire</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 cursor-pointer hover:bg-gray-50" onClick={() => setStatusFilter('EN_COURS')}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Target className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.inProgress}</p>
              <p className="text-sm text-gray-500">En cours</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 cursor-pointer hover:bg-gray-50" onClick={() => setStatusFilter('DONE')}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.done}</p>
              <p className="text-sm text-gray-500">Terminées</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filter indicator */}
      {statusFilter !== 'all' && (
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            Filtre: {STATUS_CONFIG[statusFilter as keyof typeof STATUS_CONFIG]?.label}
          </Badge>
          <Button variant="ghost" size="sm" onClick={() => setStatusFilter('all')}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Actions List */}
      <div className="space-y-4">
        {filteredActions.map(action => {
          const progress = action.target && action.current !== undefined
            ? (action.current / action.target) * 100
            : null

          return (
            <Card key={action.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge className={TYPE_CONFIG[action.type].color}>
                      {TYPE_CONFIG[action.type].label}
                    </Badge>
                    <Badge className={STATUS_CONFIG[action.status].color}>
                      {STATUS_CONFIG[action.status].label}
                    </Badge>
                    <span className={`text-sm font-medium ${PRIORITY_CONFIG[action.priority].color}`}>
                      ● {PRIORITY_CONFIG[action.priority].label}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold mb-1">{action.title}</h3>
                  <p className="text-gray-600 text-sm mb-3">{action.description}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    {action.dueDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Échéance: {formatDate(action.dueDate)}
                      </span>
                    )}
                    {action.clientName && (
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {action.clientName}
                      </span>
                    )}
                  </div>
                  
                  {progress !== null && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>Progression</span>
                        <span className="font-medium">{action.current}/{action.target} {action.unit}</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {action.status !== 'DONE' && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleStatusChange(action.id, action.status === 'A_FAIRE' ? 'EN_COURS' : 'DONE')}
                    >
                      {action.status === 'A_FAIRE' ? 'Démarrer' : 'Terminer'}
                    </Button>
                  )}
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {filteredActions.length === 0 && (
        <Card className="p-12 text-center">
          <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Aucune action commerciale</p>
          <Button className="mt-4" onClick={() => setShowNewForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Créer une action
          </Button>
        </Card>
      )}

      {/* Modal Nouvelle Action */}
      {showNewForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Nouvelle Action</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowNewForm(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={async (e) => {
                e.preventDefault()
                if (!newTitle.trim()) return
                await createActionMutation.mutateAsync({
                  title: newTitle.trim(),
                  description: newDescription.trim(),
                  type: newType,
                  priority: newPriority,
                  dueDate: newDueDate || undefined,
                })
                setNewTitle('')
                setNewDescription('')
                setNewType('PROSPECTION')
                setNewPriority('MOYENNE')
                setNewDueDate('')
                setShowNewForm(false)
                refetch()
              }} className="space-y-4">
                <div>
                  <Label>Titre *</Label>
                  <Input
                    placeholder="Ex: Relancer client Durand"
                    className="mt-1"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    required
                  />
                </div>
              
                <div>
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Décrivez l'action..."
                    rows={3}
                    className="mt-1"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                  />
                </div>
              
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Type</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
                      value={newType}
                      onChange={(e) => setNewType(e.target.value as typeof newType)}
                    >
                      <option value="PROSPECTION">Prospection</option>
                      <option value="RELANCE">Relance</option>
                      <option value="SUIVI">Suivi client</option>
                      <option value="AUTRE">Autre</option>
                    </select>
                  </div>
                  <div>
                    <Label>Priorité</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
                      value={newPriority}
                      onChange={(e) => setNewPriority(e.target.value as typeof newPriority)}
                    >
                      <option value="MOYENNE">Moyenne</option>
                      <option value="BASSE">Faible</option>
                      <option value="HAUTE">Haute</option>
                    </select>
                  </div>
                </div>
              
                <div>
                  <Label>Échéance</Label>
                  <Input
                    type="date"
                    className="mt-1"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                  />
                </div>
              
                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowNewForm(false)} className="flex-1">
                    Annuler
                  </Button>
                  <Button type="submit" className="flex-1" disabled={createActionMutation.isPending || !newTitle.trim()}>
                    {createActionMutation.isPending ? (
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Créer
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
