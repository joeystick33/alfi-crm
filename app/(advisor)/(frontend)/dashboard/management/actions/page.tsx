'use client'

/**
 * Actions Commerciales Cabinet - Vue Admin
 * 
 * Plan d'actions commerciales:
 * - Actions globales cabinet
 * - Actions par conseiller
 * - Suivi de progression
 */

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Card } from '@/app/_common/components/ui/Card'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Button } from '@/app/_common/components/ui/Button'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import { Progress } from '@/app/_common/components/ui/Progress'
import { Input } from '@/app/_common/components/ui/Input'
import { useManagementActions, useCreateManagementAction } from '@/app/_common/hooks/use-api'
import {
  ArrowLeft,
  Briefcase,
  Plus,
  Calendar,
  CheckCircle,
  Clock,
  Users,
  Search,
  Edit,
  Eye,
  X,
} from 'lucide-react'

interface ActionCommerciale {
  id: string
  title: string
  description: string
  type: 'PROSPECTION' | 'RELANCE' | 'CAMPAGNE' | 'EVENEMENT' | 'FORMATION' | 'AUTRE'
  status: 'PLANIFIE' | 'EN_COURS' | 'TERMINE' | 'ANNULE'
  priority: 'BASSE' | 'MOYENNE' | 'HAUTE' | 'URGENTE'
  assignedTo?: { id: string; firstName: string; lastName: string }[]
  startDate: string
  endDate?: string
  target?: number
  current?: number
  unit?: string
  createdAt: string
}

const TYPE_CONFIG = {
  PROSPECTION: { label: 'Prospection', color: 'bg-blue-100 text-blue-700' },
  RELANCE: { label: 'Relance', color: 'bg-green-100 text-green-700' },
  CAMPAGNE: { label: 'Campagne', color: 'bg-purple-100 text-purple-700' },
  EVENEMENT: { label: 'Événement', color: 'bg-orange-100 text-orange-700' },
  FORMATION: { label: 'Formation', color: 'bg-cyan-100 text-cyan-700' },
  AUTRE: { label: 'Autre', color: 'bg-gray-100 text-gray-700' },
}

const STATUS_CONFIG = {
  PLANNED: { label: 'Planifiée', color: 'bg-gray-100 text-gray-700', icon: Calendar },
  EN_COURS: { label: 'En cours', color: 'bg-blue-100 text-blue-700', icon: Clock },
  TERMINE: { label: 'Terminée', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  ANNULE: { label: 'Annulée', color: 'bg-red-100 text-red-700', icon: X },
}

const PRIORITY_CONFIG = {
  BASSE: { label: 'Faible', color: 'text-gray-500' },
  MOYENNE: { label: 'Moyenne', color: 'text-blue-500' },
  HAUTE: { label: 'Haute', color: 'text-orange-500' },
  URGENTE: { label: 'Urgente', color: 'text-red-500' },
}

const DEMO_ACTIONS: ActionCommerciale[] = [
  {
    id: '1',
    title: 'Campagne Fin d\'Année PER',
    description: 'Relancer tous les clients pour optimisation fiscale via PER avant le 31/12',
    type: 'CAMPAGNE',
    status: 'EN_COURS',
    priority: 'HAUTE',
    assignedTo: [
      { id: '1', firstName: 'Marie', lastName: 'Dupont' },
      { id: '2', firstName: 'Pierre', lastName: 'Martin' },
    ],
    startDate: '2024-11-01',
    endDate: '2024-12-31',
    target: 50,
    current: 32,
    unit: 'clients contactés',
    createdAt: '2024-10-28',
  },
  {
    id: '2',
    title: 'Prospection LinkedIn',
    description: 'Développer le réseau LinkedIn et contacter des prospects qualifiés',
    type: 'PROSPECTION',
    status: 'EN_COURS',
    priority: 'MOYENNE',
    assignedTo: [{ id: '3', firstName: 'Lucas', lastName: 'Bernard' }],
    startDate: '2024-11-15',
    target: 20,
    current: 8,
    unit: 'contacts',
    createdAt: '2024-11-10',
  },
  {
    id: '3',
    title: 'Relance Clients Inactifs',
    description: 'Contacter les clients sans activité depuis plus de 6 mois',
    type: 'RELANCE',
    status: 'PLANIFIE',
    priority: 'MOYENNE',
    assignedTo: [{ id: '1', firstName: 'Marie', lastName: 'Dupont' }],
    startDate: '2024-12-01',
    endDate: '2024-12-15',
    target: 25,
    current: 0,
    unit: 'clients',
    createdAt: '2024-11-20',
  },
  {
    id: '4',
    title: 'Webinaire Transmission Patrimoine',
    description: 'Organisation d\'un webinaire sur les stratégies de transmission',
    type: 'EVENEMENT',
    status: 'PLANIFIE',
    priority: 'HAUTE',
    assignedTo: [
      { id: '1', firstName: 'Marie', lastName: 'Dupont' },
      { id: '2', firstName: 'Pierre', lastName: 'Martin' },
      { id: '3', firstName: 'Lucas', lastName: 'Bernard' },
    ],
    startDate: '2024-12-10',
    target: 30,
    current: 12,
    unit: 'inscrits',
    createdAt: '2024-11-15',
  },
  {
    id: '5',
    title: 'Formation SCPI',
    description: 'Formation équipe sur les nouveaux produits SCPI',
    type: 'FORMATION',
    status: 'TERMINE',
    priority: 'BASSE',
    assignedTo: [
      { id: '1', firstName: 'Marie', lastName: 'Dupont' },
      { id: '2', firstName: 'Pierre', lastName: 'Martin' },
    ],
    startDate: '2024-11-05',
    endDate: '2024-11-05',
    createdAt: '2024-11-01',
  },
]

export default function ActionsCommercialesPage() {
  const [showNewForm, setShowNewForm] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch actions from API
  const { data: apiData, isLoading } = useManagementActions({
    status: statusFilter !== 'all' ? statusFilter : undefined,
    type: typeFilter !== 'all' ? typeFilter : undefined,
  })
  const createActionMutation = useCreateManagementAction()

  // Map API data to component format with fallback
  const actions: ActionCommerciale[] = useMemo(() => {
    if (apiData?.actions && apiData.actions.length > 0) {
      return apiData.actions.map((action) => ({
        id: action.id,
        title: action.title,
        description: action.description,
        type: action.type as ActionCommerciale['type'],
        status: action.status as ActionCommerciale['status'],
        priority: (action.priority || 'MOYENNE') as ActionCommerciale['priority'],
        assignedTo: action.assignedTo?.map((a: any) => ({
          id: a.id,
          firstName: a.firstName || '',
          lastName: a.lastName || ''
        })),
        startDate: action.startDate || action.createdAt,
        endDate: action.endDate,
        createdAt: action.createdAt,
      }))
    }
    return DEMO_ACTIONS
  }, [apiData])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
    })
  }

  const filteredActions = actions.filter(a => {
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter
    const matchesType = typeFilter === 'all' || a.type === typeFilter
    const matchesSearch = searchQuery === '' ||
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesType && matchesSearch
  })

  const stats = {
    total: actions.length,
    inProgress: actions.filter(a => a.status === 'EN_COURS').length,
    planned: actions.filter(a => a.status === 'PLANIFIE').length,
    completed: actions.filter(a => a.status === 'TERMINE').length,
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/management">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Briefcase className="h-7 w-7 text-purple-600" />
              Actions Commerciales
            </h1>
            <p className="text-gray-500 mt-1">Plan d'actions et campagnes commerciales</p>
          </div>
        </div>

        <Button onClick={() => setShowNewForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle action
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
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
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.inProgress}</p>
              <p className="text-sm text-gray-500">En cours</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Calendar className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.planned}</p>
              <p className="text-sm text-gray-500">Planifiées</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.completed}</p>
              <p className="text-sm text-gray-500">Terminées</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="all">Tous les statuts</option>
            <option value="PLANNED">Planifiées</option>
            <option value="IN_PROGRESS">En cours</option>
            <option value="COMPLETED">Terminées</option>
            <option value="CANCELLED">Annulées</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="all">Tous les types</option>
            <option value="PROSPECTION">Prospection</option>
            <option value="RELANCE">Relance</option>
            <option value="CAMPAGNE">Campagne</option>
            <option value="EVENEMENT">Événement</option>
            <option value="FORMATION">Formation</option>
          </select>
        </div>
      </Card>

      {/* Actions List */}
      <div className="space-y-4">
        {filteredActions.map(action => {
          const StatusIcon = STATUS_CONFIG[action.status].icon
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
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {STATUS_CONFIG[action.status].label}
                    </Badge>
                    <span className={`text-sm font-medium ${PRIORITY_CONFIG[action.priority].color}`}>
                      ● {PRIORITY_CONFIG[action.priority].label}
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold mb-1">{action.title}</h3>
                  <p className="text-gray-600 text-sm mb-3">{action.description}</p>

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(action.startDate)}
                      {action.endDate && ` - ${formatDate(action.endDate)}`}
                    </span>
                    {action.assignedTo && action.assignedTo.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {action.assignedTo.map(a => `${a.firstName} ${a.lastName[0]}.`).join(', ')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {progress !== null && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span>Progression</span>
                    <span className="font-medium">
                      {action.current} / {action.target} {action.unit}
                    </span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {filteredActions.length === 0 && (
        <Card className="p-12 text-center">
          <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Aucune action commerciale trouvée</p>
        </Card>
      )}
    </div>
  )
}
