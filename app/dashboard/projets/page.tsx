'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Filter, Search, Calendar, TrendingUp, AlertCircle, CheckCircle2, Clock, XCircle, Pause, FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState, getErrorVariant } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'
import { Modal, ModalContent, ModalHeader, ModalTitle } from '@/components/ui/Modal'
import { useToast } from '@/hooks/use-toast'

interface Projet {
  id: string
  name: string
  description?: string
  type: string
  estimatedBudget?: number
  actualBudget?: number
  startDate?: string
  targetDate?: string
  endDate?: string
  progress: number
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'ON_HOLD'
  client: {
    id: string
    firstName: string
    lastName: string
  }
  _count?: {
    taches: number
  }
  createdAt: string
  updatedAt: string
}

const projetTypes = [
  { value: 'REAL_ESTATE_PURCHASE', label: 'Achat immobilier' },
  { value: 'BUSINESS_CREATION', label: 'Création entreprise' },
  { value: 'RETIREMENT_PREPARATION', label: 'Préparation retraite' },
  { value: 'WEALTH_RESTRUCTURING', label: 'Restructuration patrimoine' },
  { value: 'TAX_OPTIMIZATION', label: 'Optimisation fiscale' },
  { value: 'SUCCESSION_PLANNING', label: 'Planification succession' },
  { value: 'OTHER', label: 'Autre' },
]

const projetStatuses = [
  { value: 'PLANNED', label: 'Planifié', color: 'bg-gray-100 text-gray-800', icon: Calendar },
  { value: 'IN_PROGRESS', label: 'En cours', color: 'bg-blue-100 text-blue-800', icon: TrendingUp },
  { value: 'COMPLETED', label: 'Terminé', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  { value: 'CANCELLED', label: 'Annulé', color: 'bg-red-100 text-red-800', icon: XCircle },
  { value: 'ON_HOLD', label: 'En pause', color: 'bg-yellow-100 text-yellow-800', icon: Pause },
]

export default function ProjetsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [projets, setProjets] = useState<Projet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [typeFilter, setTypeFilter] = useState<string>('ALL')
  
  // Modal
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    loadProjets()
  }, [statusFilter, typeFilter])

  const loadProjets = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'ALL') params.append('status', statusFilter)
      if (typeFilter !== 'ALL') params.append('type', typeFilter)

      const response = await fetch(`/api/projets?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      setProjets(data)
    } catch (error) {
      console.error('Erreur chargement projets:', error)
      setError(error instanceof Error ? error.message : 'Erreur inconnue')
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les projets',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredProjets = projets.filter(projet => {
    const matchesSearch = 
      projet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      projet.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${projet.client.firstName} ${projet.client.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

  const getStatusConfig = (status: string) => {
    return projetStatuses.find(s => s.value === status) || projetStatuses[0]
  }

  const getTypeLabel = (type: string) => {
    return projetTypes.find(t => t.value === type)?.label || type
  }

  const formatCurrency = (amount?: number) => {
    if (!amount) return '-'
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (date?: string) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const getProgressColor = (progress: number) => {
    if (progress >= 75) return 'bg-green-500'
    if (progress >= 50) return 'bg-blue-500'
    if (progress >= 25) return 'bg-yellow-500'
    return 'bg-gray-300'
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projets</h1>
          <p className="text-sm text-gray-600 mt-1">
            Gérez les projets de vos clients
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau projet
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {projetStatuses.map(status => {
          const count = projets.filter(p => p.status === status.value).length
          const StatusIcon = status.icon
          
          return (
            <Card key={status.value} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{status.label}</p>
                  <p className="text-2xl font-bold mt-1">{count}</p>
                </div>
                <div className={`p-3 rounded-lg ${status.color}`}>
                  <StatusIcon className="h-5 w-5" />
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher un projet..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tous les statuts</SelectItem>
              {projetStatuses.map(status => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Tous les types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tous les types</SelectItem>
              {projetTypes.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="p-6 border-red-200 bg-red-50">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div>
              <p className="font-medium text-red-900">Erreur de chargement</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadProjets}
              className="ml-auto"
            >
              Réessayer
            </Button>
          </div>
        </Card>
      )}

      {/* Loading State */}
      {loading && <LoadingState variant="list" count={3} />}

      {/* Error State */}
      {error && (
        <ErrorState
          error={error}
          variant={getErrorVariant(error)}
          onRetry={() => {
            setError(null)
            fetchProjets()
          }}
        />
      )}

      {/* Empty State */}
      {!loading && !error && filteredProjets.length === 0 && (
        <EmptyState
          icon={FolderOpen}
          title="Aucun projet trouvé"
          description={
            searchTerm || statusFilter !== 'ALL' || typeFilter !== 'ALL'
              ? 'Aucun projet ne correspond à vos critères de recherche. Essayez de modifier vos filtres.'
              : 'Commencez par créer votre premier projet pour suivre les objectifs de vos clients.'
          }
          action={
            !searchTerm && statusFilter === 'ALL' && typeFilter === 'ALL'
              ? {
                  label: 'Créer un projet',
                  onClick: () => setShowCreateModal(true),
                  icon: Plus,
                }
              : undefined
          }
        />
      )}

      {/* Projets List */}
      {!loading && filteredProjets.length > 0 && (
        <div className="space-y-4">
          {filteredProjets.map(projet => {
            const statusConfig = getStatusConfig(projet.status)
            const StatusIcon = statusConfig.icon
            
            return (
              <Card
                key={projet.id}
                className="p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(`/dashboard/clients/${projet.client.id}?tab=objectifs`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {projet.name}
                      </h3>
                      <Badge className={statusConfig.color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig.label}
                      </Badge>
                      <Badge variant="outline">
                        {getTypeLabel(projet.type)}
                      </Badge>
                    </div>
                    
                    {projet.description && (
                      <p className="text-sm text-gray-600 mb-3">
                        {projet.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>
                        Client: <span className="font-medium text-gray-900">
                          {projet.client.firstName} {projet.client.lastName}
                        </span>
                      </span>
                      {projet._count && (
                        <span>
                          {projet._count.taches} tâche{projet._count.taches > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    {projet.estimatedBudget && (
                      <div className="mb-2">
                        <p className="text-xs text-gray-500">Budget estimé</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {formatCurrency(projet.estimatedBudget)}
                        </p>
                      </div>
                    )}
                    {projet.actualBudget && (
                      <div>
                        <p className="text-xs text-gray-500">Budget réel</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {formatCurrency(projet.actualBudget)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Progression
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {projet.progress}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${getProgressColor(projet.progress)}`}
                      style={{ width: `${projet.progress}%` }}
                    />
                  </div>
                </div>

                {/* Dates */}
                <div className="flex items-center gap-6 text-sm text-gray-600">
                  {projet.startDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Début: {formatDate(projet.startDate)}</span>
                    </div>
                  )}
                  {projet.targetDate && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>Échéance: {formatDate(projet.targetDate)}</span>
                    </div>
                  )}
                  {projet.endDate && (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Terminé: {formatDate(projet.endDate)}</span>
                    </div>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateProjetModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            loadProjets()
          }}
        />
      )}
    </div>
  )
}

interface CreateProjetModalProps {
  onClose: () => void
  onSuccess: () => void
}

function CreateProjetModal({ onClose, onSuccess }: CreateProjetModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<any[]>([])
  const [formData, setFormData] = useState({
    clientId: '',
    name: '',
    description: '',
    type: 'OTHER',
    estimatedBudget: '',
    startDate: '',
    targetDate: '',
    status: 'PLANNED'
  })

  useEffect(() => {
    loadClients()
  }, [])

  const loadClients = async () => {
    try {
      const response = await fetch('/api/clients')
      if (response.ok) {
        const data = await response.json()
        setClients(data)
      }
    } catch (error) {
      console.error('Erreur chargement clients:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        ...formData,
        estimatedBudget: formData.estimatedBudget ? parseFloat(formData.estimatedBudget) : undefined,
        startDate: formData.startDate || undefined,
        targetDate: formData.targetDate || undefined,
      }

      const response = await fetch('/api/projets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la création du projet')
      }

      toast({
        title: 'Succès',
        description: 'Projet créé avec succès',
        variant: 'success'
      })

      onSuccess()
    } catch (error) {
      console.error('Erreur création projet:', error)
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Erreur lors de la création',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={true} onOpenChange={(open) => !open && onClose()}>
      <ModalContent className="max-w-2xl">
        <ModalHeader>
          <ModalTitle>Créer un projet</ModalTitle>
        </ModalHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client *
            </label>
            <Select
              value={formData.clientId}
              onValueChange={(value) => setFormData({ ...formData, clientId: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map(client => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.firstName} {client.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom du projet *
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Achat résidence principale"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type de projet *
            </label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value })}
              required
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {projetTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Décrivez le projet..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Budget estimé (€)
          </label>
          <Input
            type="number"
            value={formData.estimatedBudget}
            onChange={(e) => setFormData({ ...formData, estimatedBudget: e.target.value })}
            placeholder="Ex: 300000"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date de début
            </label>
            <Input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date cible
            </label>
            <Input
              type="date"
              value={formData.targetDate}
              onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
            />
          </div>
        </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Création...' : 'Créer le projet'}
            </Button>
          </div>
        </form>
      </ModalContent>
    </Modal>
  )
}
