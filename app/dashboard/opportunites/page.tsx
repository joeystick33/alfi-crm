'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Plus, Search, Filter, TrendingUp, AlertCircle, 
  DollarSign, Target, Clock, CheckCircle2, XCircle,
  ArrowRight, Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { Modal, ModalContent, ModalHeader, ModalTitle } from '@/components/ui/Modal'
import { useToast } from '@/hooks/use-toast'

interface Opportunite {
  id: string
  name: string
  description?: string
  type: string
  estimatedValue?: number
  score?: number
  confidence?: number
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  status: string
  actionDeadline?: string
  client: {
    id: string
    firstName: string
    lastName: string
  }
  conseiller: {
    id: string
    firstName: string
    lastName: string
  }
  detectedAt: string
  createdAt: string
}

interface PipelineData {
  [key: string]: Opportunite[]
}

const opportuniteTypes = [
  { value: 'LIFE_INSURANCE', label: 'Assurance vie' },
  { value: 'RETIREMENT_SAVINGS', label: 'Épargne retraite' },
  { value: 'REAL_ESTATE_INVESTMENT', label: 'Investissement immobilier' },
  { value: 'SECURITIES_INVESTMENT', label: 'Investissement titres' },
  { value: 'TAX_OPTIMIZATION', label: 'Optimisation fiscale' },
  { value: 'LOAN_RESTRUCTURING', label: 'Restructuration crédit' },
  { value: 'WEALTH_TRANSMISSION', label: 'Transmission patrimoine' },
  { value: 'INSURANCE_REVIEW', label: 'Révision assurances' },
  { value: 'OTHER', label: 'Autre' },
]

const pipelineStages = [
  { value: 'DETECTED', label: 'Détectée', color: 'bg-gray-100 text-gray-800' },
  { value: 'QUALIFIED', label: 'Qualifiée', color: 'bg-blue-100 text-blue-800' },
  { value: 'CONTACTED', label: 'Contactée', color: 'bg-purple-100 text-purple-800' },
  { value: 'PRESENTED', label: 'Présentée', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'ACCEPTED', label: 'Acceptée', color: 'bg-green-100 text-green-800' },
  { value: 'CONVERTED', label: 'Convertie', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'REJECTED', label: 'Rejetée', color: 'bg-red-100 text-red-800' },
  { value: 'LOST', label: 'Perdue', color: 'bg-orange-100 text-orange-800' },
]

const priorityConfig = {
  LOW: { label: 'Faible', color: 'bg-gray-100 text-gray-800' },
  MEDIUM: { label: 'Moyenne', color: 'bg-blue-100 text-blue-800' },
  HIGH: { label: 'Haute', color: 'bg-orange-100 text-orange-800' },
  URGENT: { label: 'Urgente', color: 'bg-red-100 text-red-800' },
}

export default function OpportunitesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [viewMode, setViewMode] = useState<'pipeline' | 'list'>('pipeline')
  const [pipelineData, setPipelineData] = useState<PipelineData>({})
  const [opportunites, setOpportunites] = useState<Opportunite[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('ALL')
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL')
  
  // Modal
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [convertingId, setConvertingId] = useState<string | null>(null)

  useEffect(() => {
    if (viewMode === 'pipeline') {
      loadPipeline()
    } else {
      loadOpportunites()
    }
  }, [viewMode, typeFilter, priorityFilter])

  const loadPipeline = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (typeFilter !== 'ALL') params.append('type', typeFilter)
      if (priorityFilter !== 'ALL') params.append('priority', priorityFilter)

      const response = await fetch(`/api/opportunites/pipeline?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      setPipelineData(data)
    } catch (error) {
      console.error('Erreur chargement pipeline:', error)
      setError(error instanceof Error ? error.message : 'Erreur inconnue')
      toast({
        title: 'Erreur',
        description: 'Impossible de charger le pipeline',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const loadOpportunites = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (typeFilter !== 'ALL') params.append('type', typeFilter)
      if (priorityFilter !== 'ALL') params.append('priority', priorityFilter)

      const response = await fetch(`/api/opportunites?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      setOpportunites(data)
    } catch (error) {
      console.error('Erreur chargement opportunités:', error)
      setError(error instanceof Error ? error.message : 'Erreur inconnue')
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les opportunités',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleConvertToProjet = async (opportuniteId: string) => {
    setConvertingId(opportuniteId)

    try {
      const response = await fetch(`/api/opportunites/${opportuniteId}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la conversion')
      }

      const data = await response.json()

      toast({
        title: 'Succès',
        description: 'Opportunité convertie en projet',
        variant: 'success'
      })

      // Refresh data
      if (viewMode === 'pipeline') {
        loadPipeline()
      } else {
        loadOpportunites()
      }

      // Navigate to projet
      if (data.projet?.id) {
        router.push(`/dashboard/projets`)
      }
    } catch (error) {
      console.error('Erreur conversion:', error)
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Erreur lors de la conversion',
        variant: 'destructive'
      })
    } finally {
      setConvertingId(null)
    }
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

  const getTypeLabel = (type: string) => {
    return opportuniteTypes.find(t => t.value === type)?.label || type
  }

  const getStageConfig = (status: string) => {
    return pipelineStages.find(s => s.value === status) || pipelineStages[0]
  }

  const getPriorityConfig = (priority: string) => {
    return priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.MEDIUM
  }

  const filteredOpportunites = opportunites.filter(opp => {
    const matchesSearch = 
      opp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opp.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${opp.client.firstName} ${opp.client.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Opportunités</h1>
          <p className="text-sm text-gray-600 mt-1">
            Gérez votre pipeline commercial
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            <Button
              variant={viewMode === 'pipeline' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('pipeline')}
            >
              Pipeline
            </Button>
            <Button
              variant={viewMode === 'list' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              Liste
            </Button>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle opportunité
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total opportunités</p>
              <p className="text-2xl font-bold mt-1">
                {Object.values(pipelineData).flat().length || opportunites.length}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-blue-100">
              <Target className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Valeur estimée</p>
              <p className="text-2xl font-bold mt-1">
                {formatCurrency(
                  (Object.values(pipelineData).flat() || opportunites)
                    .reduce((sum, opp) => sum + (opp.estimatedValue || 0), 0)
                )}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-green-100">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Converties</p>
              <p className="text-2xl font-bold mt-1">
                {pipelineData['CONVERTED']?.length || 
                 opportunites.filter(o => o.status === 'CONVERTED').length}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-emerald-100">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Taux conversion</p>
              <p className="text-2xl font-bold mt-1">
                {(() => {
                  const total = Object.values(pipelineData).flat().length || opportunites.length
                  const converted = pipelineData['CONVERTED']?.length || 
                    opportunites.filter(o => o.status === 'CONVERTED').length
                  return total > 0 ? `${Math.round((converted / total) * 100)}%` : '0%'
                })()}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-purple-100">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher une opportunité..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Tous les types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tous les types</SelectItem>
              {opportuniteTypes.map(type => (
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
              <SelectItem value="LOW">Faible</SelectItem>
              <SelectItem value="MEDIUM">Moyenne</SelectItem>
              <SelectItem value="HIGH">Haute</SelectItem>
              <SelectItem value="URGENT">Urgente</SelectItem>
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
              onClick={() => viewMode === 'pipeline' ? loadPipeline() : loadOpportunites()}
              className="ml-auto"
            >
              Réessayer
            </Button>
          </div>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      )}

      {/* Pipeline View */}
      {!loading && viewMode === 'pipeline' && (
        <div className="overflow-x-auto">
          <div className="flex gap-4 pb-4" style={{ minWidth: 'max-content' }}>
            {pipelineStages.map(stage => {
              const stageOpps = pipelineData[stage.value] || []
              const stageValue = stageOpps.reduce((sum, opp) => sum + (opp.estimatedValue || 0), 0)

              return (
                <div key={stage.value} className="flex-shrink-0 w-80">
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{stage.label}</h3>
                      <Badge className={stage.color}>{stageOpps.length}</Badge>
                    </div>
                    <p className="text-sm text-gray-600">{formatCurrency(stageValue)}</p>
                  </div>

                  <div className="space-y-3">
                    {stageOpps.length === 0 ? (
                      <Card className="p-6 text-center">
                        <p className="text-sm text-gray-500">Aucune opportunité</p>
                      </Card>
                    ) : (
                      stageOpps.map(opp => (
                        <OpportuniteCard
                          key={opp.id}
                          opportunite={opp}
                          onConvert={handleConvertToProjet}
                          converting={convertingId === opp.id}
                          formatCurrency={formatCurrency}
                          formatDate={formatDate}
                          getTypeLabel={getTypeLabel}
                          getPriorityConfig={getPriorityConfig}
                        />
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* List View */}
      {!loading && viewMode === 'list' && (
        <div className="space-y-4">
          {filteredOpportunites.length === 0 ? (
            <Card className="p-12">
              <div className="text-center">
                <Sparkles className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aucune opportunité trouvée
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm || typeFilter !== 'ALL' || priorityFilter !== 'ALL'
                    ? 'Aucune opportunité ne correspond à vos critères'
                    : 'Commencez par créer votre première opportunité'}
                </p>
                {!searchTerm && typeFilter === 'ALL' && priorityFilter === 'ALL' && (
                  <Button onClick={() => setShowCreateModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Créer une opportunité
                  </Button>
                )}
              </div>
            </Card>
          ) : (
            filteredOpportunites.map(opp => (
              <OpportuniteCard
                key={opp.id}
                opportunite={opp}
                onConvert={handleConvertToProjet}
                converting={convertingId === opp.id}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
                getTypeLabel={getTypeLabel}
                getPriorityConfig={getPriorityConfig}
              />
            ))
          )}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateOpportuniteModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            viewMode === 'pipeline' ? loadPipeline() : loadOpportunites()
          }}
        />
      )}
    </div>
  )
}

// Opportunite Card Component
interface OpportuniteCardProps {
  opportunite: Opportunite
  onConvert: (id: string) => void
  converting: boolean
  formatCurrency: (amount?: number) => string
  formatDate: (date?: string) => string
  getTypeLabel: (type: string) => string
  getPriorityConfig: (priority: string) => { label: string; color: string }
}

function OpportuniteCard({
  opportunite,
  onConvert,
  converting,
  formatCurrency,
  formatDate,
  getTypeLabel,
  getPriorityConfig
}: OpportuniteCardProps) {
  const router = useRouter()
  const stageConfig = pipelineStages.find(s => s.value === opportunite.status) || pipelineStages[0]
  const priorityConfig = getPriorityConfig(opportunite.priority)

  return (
    <Card
      className="p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => router.push(`/dashboard/clients/${opportunite.client.id}`)}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 mb-1">{opportunite.name}</h4>
            {opportunite.description && (
              <p className="text-sm text-gray-600 line-clamp-2">{opportunite.description}</p>
            )}
          </div>
          {opportunite.score !== undefined && (
            <div className="ml-3 text-right">
              <div className="text-2xl font-bold text-blue-600">{opportunite.score}</div>
              <div className="text-xs text-gray-500">Score</div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={stageConfig.color}>{stageConfig.label}</Badge>
          <Badge className={priorityConfig.color}>{priorityConfig.label}</Badge>
          <Badge variant="outline">{getTypeLabel(opportunite.type)}</Badge>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div>
            <p className="text-gray-600">
              Client: <span className="font-medium text-gray-900">
                {opportunite.client.firstName} {opportunite.client.lastName}
              </span>
            </p>
            {opportunite.estimatedValue && (
              <p className="text-gray-600 mt-1">
                Valeur: <span className="font-semibold text-green-600">
                  {formatCurrency(opportunite.estimatedValue)}
                </span>
              </p>
            )}
          </div>
          {opportunite.confidence !== undefined && (
            <div className="text-right">
              <div className="text-sm font-semibold text-gray-900">
                {opportunite.confidence}%
              </div>
              <div className="text-xs text-gray-500">Confiance</div>
            </div>
          )}
        </div>

        {opportunite.actionDeadline && (
          <div className="flex items-center gap-2 text-sm text-orange-600">
            <Clock className="h-4 w-4" />
            <span>Échéance: {formatDate(opportunite.actionDeadline)}</span>
          </div>
        )}

        {opportunite.status === 'ACCEPTED' && (
          <Button
            size="sm"
            className="w-full"
            onClick={(e) => {
              e.stopPropagation()
              onConvert(opportunite.id)
            }}
            disabled={converting}
          >
            {converting ? (
              'Conversion...'
            ) : (
              <>
                <ArrowRight className="h-4 w-4 mr-2" />
                Convertir en projet
              </>
            )}
          </Button>
        )}
      </div>
    </Card>
  )
}

// Create Opportunite Modal
interface CreateOpportuniteModalProps {
  onClose: () => void
  onSuccess: () => void
}

function CreateOpportuniteModal({ onClose, onSuccess }: CreateOpportuniteModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<any[]>([])
  const [formData, setFormData] = useState({
    clientId: '',
    name: '',
    description: '',
    type: 'OTHER',
    estimatedValue: '',
    priority: 'MEDIUM',
    actionDeadline: '',
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
        estimatedValue: formData.estimatedValue ? parseFloat(formData.estimatedValue) : undefined,
        actionDeadline: formData.actionDeadline || undefined,
      }

      const response = await fetch('/api/opportunites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la création de l\'opportunité')
      }

      toast({
        title: 'Succès',
        description: 'Opportunité créée avec succès',
        variant: 'success'
      })

      onSuccess()
    } catch (error) {
      console.error('Erreur création opportunité:', error)
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
          <ModalTitle>Créer une opportunité</ModalTitle>
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
              Nom de l'opportunité *
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Souscription assurance vie"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type *
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
                {opportuniteTypes.map(type => (
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
              placeholder="Décrivez l'opportunité..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valeur estimée (€)
              </label>
              <Input
                type="number"
                value={formData.estimatedValue}
                onChange={(e) => setFormData({ ...formData, estimatedValue: e.target.value })}
                placeholder="Ex: 50000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priorité *
              </label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Faible</SelectItem>
                  <SelectItem value="MEDIUM">Moyenne</SelectItem>
                  <SelectItem value="HIGH">Haute</SelectItem>
                  <SelectItem value="URGENT">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Échéance d'action
            </label>
            <Input
              type="date"
              value={formData.actionDeadline}
              onChange={(e) => setFormData({ ...formData, actionDeadline: e.target.value })}
            />
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
              {loading ? 'Création...' : 'Créer l\'opportunité'}
            </Button>
          </div>
        </form>
      </ModalContent>
    </Modal>
  )
}
