'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Target, TrendingUp, CheckCircle2, Pause, XCircle, AlertCircle, Calendar, DollarSign } from 'lucide-react'
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

interface Objectif {
  id: string
  name: string
  description?: string
  type: string
  targetAmount: number
  currentAmount: number
  targetDate: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  monthlyContribution?: number
  progress: number
  status: 'ACTIVE' | 'ACHIEVED' | 'ON_HOLD' | 'CANCELLED'
  client: {
    id: string
    firstName: string
    lastName: string
  }
  achievedAt?: string
  createdAt: string
  updatedAt: string
}

const objectifTypes = [
  { value: 'RETIREMENT', label: 'Retraite' },
  { value: 'REAL_ESTATE', label: 'Immobilier' },
  { value: 'EDUCATION', label: 'Éducation' },
  { value: 'INVESTMENT', label: 'Investissement' },
  { value: 'SAVINGS', label: 'Épargne' },
  { value: 'DEBT_REDUCTION', label: 'Réduction de dettes' },
  { value: 'OTHER', label: 'Autre' },
]

const objectifStatuses = [
  { value: 'ACTIVE', label: 'Actif', color: 'bg-blue-100 text-blue-800', icon: TrendingUp },
  { value: 'ACHIEVED', label: 'Atteint', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  { value: 'ON_HOLD', label: 'En pause', color: 'bg-yellow-100 text-yellow-800', icon: Pause },
  { value: 'CANCELLED', label: 'Annulé', color: 'bg-red-100 text-red-800', icon: XCircle },
]

const objectifPriorities = [
  { value: 'LOW', label: 'Basse', color: 'bg-gray-100 text-gray-800' },
  { value: 'MEDIUM', label: 'Moyenne', color: 'bg-blue-100 text-blue-800' },
  { value: 'HIGH', label: 'Haute', color: 'bg-orange-100 text-orange-800' },
  { value: 'URGENT', label: 'Urgente', color: 'bg-red-100 text-red-800' },
]

export default function ObjectifsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [objectifs, setObjectifs] = useState<Objectif[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [typeFilter, setTypeFilter] = useState<string>('ALL')
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL')
  
  // Modal
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    loadObjectifs()
  }, [statusFilter, typeFilter, priorityFilter])

  const loadObjectifs = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'ALL') params.append('status', statusFilter)
      if (typeFilter !== 'ALL') params.append('type', typeFilter)
      if (priorityFilter !== 'ALL') params.append('priority', priorityFilter)

      const response = await fetch(`/api/objectifs?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      // L'API peut retourner { data: [...] } ou directement [...]
      const data = Array.isArray(result) ? result : (result.data || [])
      setObjectifs(data)
    } catch (error) {
      console.error('Erreur chargement objectifs:', error)
      setError(error instanceof Error ? error.message : 'Erreur inconnue')
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les objectifs',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredObjectifs = Array.isArray(objectifs) ? objectifs.filter(objectif => {
    const matchesSearch = 
      objectif.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      objectif.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${objectif.client.firstName} ${objectif.client.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  }) : []

  const getStatusConfig = (status: string) => {
    return objectifStatuses.find(s => s.value === status) || objectifStatuses[0]
  }

  const getPriorityConfig = (priority: string) => {
    return objectifPriorities.find(p => p.value === priority) || objectifPriorities[0]
  }

  const getTypeLabel = (type: string) => {
    return objectifTypes.find(t => t.value === type)?.label || type
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (date: string) => {
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

  const calculateMonthsRemaining = (targetDate: string) => {
    const today = new Date()
    const target = new Date(targetDate)
    const diffTime = target.getTime() - today.getTime()
    const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30))
    return Math.max(0, diffMonths)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Objectifs</h1>
          <p className="text-sm text-gray-600 mt-1">
            Suivez les objectifs financiers de vos clients
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvel objectif
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {objectifStatuses.map(status => {
          const count = objectifs.filter(o => o.status === status.value).length
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher un objectif..."
              value={searchTerm}
              onChange={(e: any) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tous les statuts</SelectItem>
              {objectifStatuses.map(status => (
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
              {objectifTypes.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Toutes les priorités" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Toutes les priorités</SelectItem>
              {objectifPriorities.map(priority => (
                <SelectItem key={priority.value} value={priority.value}>
                  {priority.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Loading State */}
      {loading && <LoadingState variant="list" count={3} />}

      {/* Error State */}
      {error && !loading && (
        <ErrorState
          error={error}
          variant={getErrorVariant(error)}
          onRetry={() => {
            setError(null)
            loadObjectifs()
          }}
        />
      )}

      {/* Empty State */}
      {!loading && !error && filteredObjectifs.length === 0 && (
        <EmptyState
          icon={Target}
          title="Aucun objectif trouvé"
          description={
            searchTerm || statusFilter !== 'ALL' || typeFilter !== 'ALL' || priorityFilter !== 'ALL'
              ? 'Aucun objectif ne correspond à vos critères de recherche. Essayez de modifier vos filtres.'
              : 'Commencez par créer votre premier objectif pour suivre les projets financiers de vos clients.'
          }
          action={
            !searchTerm && statusFilter === 'ALL' && typeFilter === 'ALL' && priorityFilter === 'ALL'
              ? {
                  label: 'Créer un objectif',
                  onClick: () => setShowCreateModal(true),
                  icon: Plus,
                }
              : undefined
          }
        />
      )}

      {/* Objectifs List */}
      {!loading && filteredObjectifs.length > 0 && (
        <div className="space-y-4">
          {filteredObjectifs.map(objectif => {
            const statusConfig = getStatusConfig(objectif.status)
            const priorityConfig = getPriorityConfig(objectif.priority)
            const StatusIcon = statusConfig.icon
            const monthsRemaining = calculateMonthsRemaining(objectif.targetDate)
            const remaining = objectif.targetAmount - objectif.currentAmount
            
            return (
              <Card
                key={objectif.id}
                className="p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(`/dashboard/clients/${objectif.client.id}?tab=objectifs`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {objectif.name}
                      </h3>
                      <Badge className={statusConfig.color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig.label}
                      </Badge>
                      <Badge className={priorityConfig.color}>
                        {priorityConfig.label}
                      </Badge>
                      <Badge variant="outline">
                        {getTypeLabel(objectif.type)}
                      </Badge>
                    </div>
                    
                    {objectif.description && (
                      <p className="text-sm text-gray-600 mb-3">
                        {objectif.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>
                        Client: <span className="font-medium text-gray-900">
                          {objectif.client.firstName} {objectif.client.lastName}
                        </span>
                      </span>
                      {objectif.monthlyContribution && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          {formatCurrency(objectif.monthlyContribution)}/mois
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="mb-2">
                      <p className="text-xs text-gray-500">Objectif</p>
                      <p className="text-lg font-bold text-gray-900">
                        {formatCurrency(objectif.targetAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Actuel</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {formatCurrency(objectif.currentAmount)}
                      </p>
                    </div>
                    {remaining > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500">Restant</p>
                        <p className="text-sm font-semibold text-orange-600">
                          {formatCurrency(remaining)}
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
                      {objectif.progress}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${getProgressColor(objectif.progress)}`}
                      style={{ width: `${objectif.progress}%` }}
                    />
                  </div>
                </div>

                {/* Footer Info */}
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Échéance: {formatDate(objectif.targetDate)}</span>
                    {monthsRemaining > 0 && objectif.status === 'ACTIVE' && (
                      <span className="text-orange-600">
                        ({monthsRemaining} mois restants)
                      </span>
                    )}
                  </div>
                  {objectif.achievedAt && (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Atteint le {formatDate(objectif.achievedAt)}</span>
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
        <CreateObjectifModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            loadObjectifs()
          }}
        />
      )}
    </div>
  )
}

interface CreateObjectifModalProps {
  onClose: () => void
  onSuccess: () => void
}

function CreateObjectifModal({ onClose, onSuccess }: CreateObjectifModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<any[]>([])
  const [formData, setFormData] = useState({
    clientId: '',
    name: '',
    description: '',
    type: 'SAVINGS',
    targetAmount: '',
    currentAmount: '',
    targetDate: '',
    priority: 'MEDIUM',
    monthlyContribution: ''
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
        targetAmount: parseFloat(formData.targetAmount),
        currentAmount: formData.currentAmount ? parseFloat(formData.currentAmount) : 0,
        monthlyContribution: formData.monthlyContribution ? parseFloat(formData.monthlyContribution) : undefined,
        targetDate: new Date(formData.targetDate),
      }

      const response = await fetch('/api/objectifs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la création de l\'objectif')
      }

      toast({
        title: 'Succès',
        description: 'Objectif créé avec succès',
        variant: 'success'
      })

      onSuccess()
    } catch (error) {
      console.error('Erreur création objectif:', error)
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
    <Modal open={true} onOpenChange={(open: any) => !open && onClose()}>
      <ModalContent className="max-w-2xl">
        <ModalHeader>
          <ModalTitle>Créer un objectif</ModalTitle>
        </ModalHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client *
            </label>
            <Select
              value={formData.clientId}
              onValueChange={(value: any) => setFormData({ ...formData, clientId: value })}
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
              Nom de l'objectif *
            </label>
            <Input
              value={formData.name}
              onChange={(e: any) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Épargne retraite"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type d'objectif *
              </label>
              <Select
                value={formData.type}
                onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {objectifTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priorité *
              </label>
              <Select
                value={formData.priority}
                onValueChange={(value: any) => setFormData({ ...formData, priority: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {objectifPriorities.map(priority => (
                    <SelectItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e: any) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Décrivez l'objectif..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Montant cible (€) *
              </label>
              <Input
                type="number"
                value={formData.targetAmount}
                onChange={(e: any) => setFormData({ ...formData, targetAmount: e.target.value })}
                placeholder="Ex: 100000"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Montant actuel (€)
              </label>
              <Input
                type="number"
                value={formData.currentAmount}
                onChange={(e: any) => setFormData({ ...formData, currentAmount: e.target.value })}
                placeholder="Ex: 25000"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date cible *
              </label>
              <Input
                type="date"
                value={formData.targetDate}
                onChange={(e: any) => setFormData({ ...formData, targetDate: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Versement mensuel (€)
              </label>
              <Input
                type="number"
                value={formData.monthlyContribution}
                onChange={(e: any) => setFormData({ ...formData, monthlyContribution: e.target.value })}
                placeholder="Ex: 500"
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
              {loading ? 'Création...' : 'Créer l\'objectif'}
            </Button>
          </div>
        </form>
      </ModalContent>
    </Modal>
  )
}
