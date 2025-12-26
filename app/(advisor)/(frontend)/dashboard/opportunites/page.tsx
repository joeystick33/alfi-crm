'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus, Search, TrendingUp, AlertCircle,
  DollarSign, Target, Clock, CheckCircle2,
  ArrowRight, Lightbulb
} from 'lucide-react'
import { Button } from '@/app/_common/components/ui/Button'
import { Input } from '@/app/_common/components/ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import { Card } from '@/app/_common/components/ui/Card'
import { Badge } from '@/app/_common/components/ui/Badge'
import { EmptyState } from '@/app/_common/components/ui/EmptyState'
import { Modal, ModalContent, ModalHeader, ModalTitle } from '@/app/_common/components/ui/Modal'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import { useToast } from '@/app/_common/hooks/use-toast'
import { KanbanBoard, type KanbanColumnData } from '@/app/(advisor)/(frontend)/components/kanban'
import { OpportuniteKanbanCard, type OpportuniteKanbanData } from '@/app/(advisor)/(frontend)/components/opportunites'
import { UpdateOpportuniteModal } from '@/app/(advisor)/(frontend)/components/client360/UpdateOpportuniteModal'

interface Opportunite {
  id: string
  name: string
  description?: string
  type: string
  estimatedValue?: number
  score?: number
  confidence?: number
  priority: 'BASSE' | 'MOYENNE' | 'HAUTE' | 'URGENTE'
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
  { value: 'ASSURANCE_VIE', label: 'Assurance vie' },
  { value: 'EPARGNE_RETRAITE', label: 'Épargne retraite' },
  { value: 'INVESTISSEMENT_IMMOBILIER', label: 'Investissement immobilier' },
  { value: 'INVESTISSEMENT_FINANCIER', label: 'Investissement titres' },
  { value: 'OPTIMISATION_FISCALE', label: 'Optimisation fiscale' },
  { value: 'RESTRUCTURATION_CREDIT', label: 'Restructuration crédit' },
  { value: 'TRANSMISSION', label: 'Transmission patrimoine' },
  { value: 'AUDIT_ASSURANCES', label: 'Révision assurances' },
  { value: 'AUTRE', label: 'Autre' },
]

const pipelineStages = [
  { value: 'DETECTEE', label: 'Détectée', variant: 'secondary' as const },
  { value: 'CONTACTEE', label: 'Contactée', variant: 'info' as const },
  { value: 'QUALIFIEE', label: 'Qualifiée', variant: 'default' as const },
  { value: 'PROPOSAL_SENT', label: 'Proposition envoyée', variant: 'info' as const },
  { value: 'NEGOTIATION', label: 'Négociation', variant: 'warning' as const },
  { value: 'WON', label: 'Gagnée', variant: 'success' as const },
  { value: 'PERDUE', label: 'Perdue', variant: 'destructive' as const },
]

const priorityConfig = {
  BASSE: { label: 'Faible', variant: 'secondary' as const },
  MOYENNE: { label: 'Moyenne', variant: 'default' as const },
  HAUTE: { label: 'Haute', variant: 'warning' as const },
  URGENTE: { label: 'Urgente', variant: 'destructive' as const },
}

export default function OpportunitesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [viewMode, setViewMode] = useState<'pipeline' | 'list'>('pipeline')
  const [opportunites, setOpportunites] = useState<OpportuniteKanbanData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('ALL')
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL')

  // Modal
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [convertingId, setConvertingId] = useState<string | null>(null)
  const [editingOpportunite, setEditingOpportunite] = useState<OpportuniteKanbanData | null>(null)

  // Load opportunites
  const loadOpportunites = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (typeFilter !== 'ALL') params.append('type', typeFilter)
      if (priorityFilter !== 'ALL') params.append('priority', priorityFilter)
      if (searchTerm) params.append('search', searchTerm)

      const response = await fetch(`/api/advisor/opportunites?${params.toString()}`)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      const opps = Array.isArray(data) ? data : data.data || []
      
      // Transform to OpportuniteKanbanData
      const formattedOpps: OpportuniteKanbanData[] = opps.map((o: Record<string, unknown>) => ({
        id: o.id,
        name: o.name,
        description: o.description,
        type: o.type,
        priority: o.priority,
        status: o.status,
        estimatedValue: o.estimatedValue,
        confidence: o.confidence,
        probability: o.probability,
        score: o.score,
        expectedCloseDate: o.expectedCloseDate,
        client: o.client,
        conseiller: o.conseiller,
        detectedAt: o.detectedAt,
        convertedToProjetId: o.convertedToProjetId,
      }))
      
      setOpportunites(formattedOpps)
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
  }, [typeFilter, priorityFilter, searchTerm, toast])

  useEffect(() => {
    loadOpportunites()
  }, [loadOpportunites])

  // Handlers
  const handleCardMove = async (cardId: string, fromColumnId: string, toColumnId: string) => {
    if (fromColumnId === toColumnId) return

    try {
      // Optimistic update
      setOpportunites(prev =>
        prev.map(o => o.id === cardId ? { ...o, status: toColumnId as OpportuniteKanbanData['status'] } : o)
      )

      // API call
      const response = await fetch(`/api/advisor/opportunites/${cardId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: toColumnId }),
      })

      if (!response.ok) {
        throw new Error('Erreur lors du changement de statut')
      }

      toast({
        title: 'Opportunité mise à jour',
        description: `Statut changé vers "${getStageConfig(toColumnId).label}"`,
        variant: 'success',
      })
    } catch (error) {
      console.error('Erreur changement statut:', error)
      
      // Rollback
      await loadOpportunites()
      
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier le statut',
        variant: 'destructive',
      })
    }
  }

  const handleConvertToProjet = async (opportuniteId: string) => {
    setConvertingId(opportuniteId)

    try {
      const response = await fetch(`/api/advisor/opportunites/${opportuniteId}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectData: {} })
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
      await loadOpportunites()

      // Navigate to projet
      if (data.projet?.id) {
        router.push(`/dashboard/projets/${data.projet.id}`)
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

  const handleEditOpportunite = (opportunite: OpportuniteKanbanData) => {
    setEditingOpportunite(opportunite)
  }

  const handleDeleteOpportunite = async (opportuniteId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette opportunité ?')) return

    try {
      const response = await fetch(`/api/advisor/opportunites/${opportuniteId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression')
      }

      setOpportunites(prev => prev.filter(o => o.id !== opportuniteId))

      toast({
        title: 'Opportunité supprimée',
        description: 'L\'opportunité a été supprimée avec succès',
        variant: 'success',
      })
    } catch (error) {
      console.error('Erreur suppression:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer l\'opportunité',
        variant: 'destructive',
      })
    }
  }

  const handleCardClick = (opportunite: OpportuniteKanbanData) => {
    // TODO: Ouvrir drawer détail
    router.push(`/dashboard/clients/${opportunite.client.id}`)
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
    return priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.MOYENNE
  }

  // Statistiques
  const stats = useMemo(() => {
    const total = opportunites.length
    const totalValue = opportunites.reduce((sum, o) => sum + (o.estimatedValue || 0), 0)
    const won = opportunites.filter(o => o.status === 'WON').length
    const lost = opportunites.filter(o => o.status === 'PERDUE').length
    const conversionRate = (won + lost) > 0 ? Math.round((won / (won + lost)) * 100) : 0

    return { total, totalValue, won, conversionRate }
  }, [opportunites])

  // Filtrer opportunités pour recherche locale
  const filteredOpportunites = useMemo(() => {
    if (!searchTerm) return opportunites

    const term = searchTerm.toLowerCase()
    return opportunites.filter(opp =>
      opp.name.toLowerCase().includes(term) ||
      opp.description?.toLowerCase().includes(term) ||
      `${opp.client.firstName} ${opp.client.lastName}`.toLowerCase().includes(term)
    )
  }, [opportunites, searchTerm])

  // Organiser en colonnes Kanban
  const kanbanColumns: KanbanColumnData<OpportuniteKanbanData>[] = useMemo(() => [
    {
      id: 'DETECTEE',
      title: 'Détectée',
      color: 'bg-muted',
      headerColor: 'bg-muted text-foreground',
      items: filteredOpportunites.filter(o => o.status === 'DETECTEE'),
      count: filteredOpportunites.filter(o => o.status === 'DETECTEE').length,
      metadata: {
        'Valeur': formatCurrency(
          filteredOpportunites
            .filter(o => o.status === 'DETECTEE')
            .reduce((sum, o) => sum + (o.estimatedValue || 0), 0)
        ),
      },
    },
    {
      id: 'CONTACTEE',
      title: 'Contactée',
      color: 'bg-info/5',
      headerColor: 'bg-info text-info-foreground',
      items: filteredOpportunites.filter(o => o.status === 'CONTACTEE'),
      count: filteredOpportunites.filter(o => o.status === 'CONTACTEE').length,
      metadata: {
        'Valeur': formatCurrency(
          filteredOpportunites
            .filter(o => o.status === 'CONTACTEE')
            .reduce((sum, o) => sum + (o.estimatedValue || 0), 0)
        ),
      },
    },
    {
      id: 'QUALIFIEE',
      title: 'Qualifiée',
      color: 'bg-primary/5',
      headerColor: 'bg-primary text-primary-foreground',
      items: filteredOpportunites.filter(o => o.status === 'QUALIFIEE'),
      count: filteredOpportunites.filter(o => o.status === 'QUALIFIEE').length,
      metadata: {
        'Valeur': formatCurrency(
          filteredOpportunites
            .filter(o => o.status === 'QUALIFIEE')
            .reduce((sum, o) => sum + (o.estimatedValue || 0), 0)
        ),
      },
    },
    {
      id: 'PROPOSAL_SENT',
      title: 'Proposition',
      color: 'bg-info/5',
      headerColor: 'bg-info text-info-foreground',
      items: filteredOpportunites.filter(o => o.status === 'PROPOSAL_SENT'),
      count: filteredOpportunites.filter(o => o.status === 'PROPOSAL_SENT').length,
      metadata: {
        'Valeur': formatCurrency(
          filteredOpportunites
            .filter(o => o.status === 'PROPOSAL_SENT')
            .reduce((sum, o) => sum + (o.estimatedValue || 0), 0)
        ),
      },
    },
    {
      id: 'NEGOTIATION',
      title: 'Négociation',
      color: 'bg-warning/5',
      headerColor: 'bg-warning text-warning-foreground',
      items: filteredOpportunites.filter(o => o.status === 'NEGOTIATION'),
      count: filteredOpportunites.filter(o => o.status === 'NEGOTIATION').length,
      metadata: {
        'Valeur': formatCurrency(
          filteredOpportunites
            .filter(o => o.status === 'NEGOTIATION')
            .reduce((sum, o) => sum + (o.estimatedValue || 0), 0)
        ),
      },
    },
    {
      id: 'WON',
      title: 'Gagnée',
      color: 'bg-success/5',
      headerColor: 'bg-success text-success-foreground',
      items: filteredOpportunites.filter(o => o.status === 'WON'),
      count: filteredOpportunites.filter(o => o.status === 'WON').length,
      metadata: {
        'Valeur': formatCurrency(
          filteredOpportunites
            .filter(o => o.status === 'WON')
            .reduce((sum, o) => sum + (o.estimatedValue || 0), 0)
        ),
      },
    },
    {
      id: 'PERDUE',
      title: 'Perdue',
      color: 'bg-destructive/5',
      headerColor: 'bg-destructive text-destructive-foreground',
      items: filteredOpportunites.filter(o => o.status === 'PERDUE'),
      count: filteredOpportunites.filter(o => o.status === 'PERDUE').length,
      metadata: {
        'Valeur': formatCurrency(
          filteredOpportunites
            .filter(o => o.status === 'PERDUE')
            .reduce((sum, o) => sum + (o.estimatedValue || 0), 0)
        ),
      },
    },
  ], [filteredOpportunites])

  const renderOpportuniteCard = (opp: OpportuniteKanbanData, isDragging: boolean) => (
    <OpportuniteKanbanCard
      opportunite={opp}
      isDragging={isDragging}
      onEdit={handleEditOpportunite}
      onConvert={handleConvertToProjet}
      onDelete={handleDeleteOpportunite}
    />
  )

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Opportunités</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gérez votre pipeline commercial
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
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
              <p className="text-sm text-muted-foreground">Total opportunités</p>
              <p className="text-2xl font-bold mt-1">
                {stats.total}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-primary/10">
              <Target className="h-5 w-5 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Valeur estimée</p>
              <p className="text-2xl font-bold mt-1">
                {formatCurrency(stats.totalValue)}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-success/10">
              <DollarSign className="h-5 w-5 text-success" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Gagnées</p>
              <p className="text-2xl font-bold mt-1">
                {stats.won}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-success/10">
              <CheckCircle2 className="h-5 w-5 text-success" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Taux conversion</p>
              <p className="text-2xl font-bold mt-1">
                {stats.conversionRate}%
              </p>
            </div>
            <div className="p-3 rounded-lg bg-primary/10">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une opportunité..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
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
        <Card className="p-6 border-destructive bg-destructive/10">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <div>
              <p className="font-medium text-destructive">Erreur de chargement</p>
              <p className="text-sm text-destructive">{error}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadOpportunites()}
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

      {/* Kanban Board */}
      {!loading && viewMode === 'pipeline' && (
        <KanbanBoard
          columns={kanbanColumns}
          onCardMove={handleCardMove}
          onCardClick={handleCardClick}
          renderCard={renderOpportuniteCard}
          getCardId={(opp) => opp.id}
          isLoading={loading}
          emptyMessage="Aucune opportunité"
          emptyDescription="Créez votre première opportunité pour développer votre portefeuille."
        />
      )}

      {/* List View */}
      {!loading && !error && viewMode === 'list' && filteredOpportunites.length === 0 && (
        <EmptyState
          icon={Lightbulb}
          title="Aucune opportunité trouvée"
          description={
            searchTerm || typeFilter !== 'ALL' || priorityFilter !== 'ALL'
              ? 'Aucune opportunité ne correspond à vos critères de recherche. Essayez de modifier vos filtres.'
              : 'Commencez par créer votre première opportunité pour développer votre portefeuille.'
          }
          action={
            !searchTerm && typeFilter === 'ALL' && priorityFilter === 'ALL'
              ? {
                label: 'Créer une opportunité',
                onClick: () => setShowCreateModal(true),
                icon: Plus,
              }
              : undefined
          }
        />
      )}

      {!loading && !error && viewMode === 'list' && filteredOpportunites.length > 0 && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Opportunité</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Client</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Statut</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Priorité</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Valeur estimée</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Score</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Échéance</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredOpportunites.map((opp) => {
                  const stageConfig = pipelineStages.find(s => s.value === opp.status) || pipelineStages[0]
                  const prioConfig = priorityConfig[opp.priority as keyof typeof priorityConfig] || priorityConfig.MOYENNE
                  const typeLabel = opportuniteTypes.find(t => t.value === opp.type)?.label || opp.type
                  const clientName = `${opp.client.firstName} ${opp.client.lastName}`
                  return (
                    <tr 
                      key={opp.id} 
                      className="hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() => router.push(`/dashboard/clients/${opp.client.id}`)}
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-foreground">{opp.name}</p>
                          {opp.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1">{opp.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm">{clientName}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline">{typeLabel}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={stageConfig.variant}>{stageConfig.label}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={prioConfig.variant}>{prioConfig.label}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-medium">
                          {opp.estimatedValue ? formatCurrency(opp.estimatedValue) : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {opp.score !== undefined ? (
                          <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold">
                            {opp.score}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-muted-foreground">
                          {opp.expectedCloseDate ? formatDate(opp.expectedCloseDate.toString()) : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditOpportunite(opp)}
                          >
                            Modifier
                          </Button>
                          {opp.status !== 'WON' && opp.status !== 'PERDUE' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setConvertingId(opp.id)
                                // Conversion logic handled elsewhere
                              }}
                              disabled={convertingId === opp.id}
                            >
                              {convertingId === opp.id ? 'Conversion...' : 'Convertir'}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              {filteredOpportunites.length} opportunité{filteredOpportunites.length > 1 ? 's' : ''}
            </p>
          </div>
        </Card>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateOpportuniteModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            loadOpportunites()
          }}
        />
      )}

      {/* Edit Modal */}
      {editingOpportunite && (
        <UpdateOpportuniteModal
          isOpen={!!editingOpportunite}
          onClose={() => setEditingOpportunite(null)}
          opportunite={editingOpportunite}
          onSuccess={() => {
            setEditingOpportunite(null)
            loadOpportunites()
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
  getPriorityConfig: (priority: string) => { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' }
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
            <h4 className="font-semibold text-foreground mb-1">{opportunite.name}</h4>
            {opportunite.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">{opportunite.description}</p>
            )}
          </div>
          {opportunite.score !== undefined && (
            <div className="ml-3 text-right">
              <div className="text-2xl font-bold text-primary">{opportunite.score}</div>
              <div className="text-xs text-muted-foreground">Score</div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={stageConfig.variant}>{stageConfig.label}</Badge>
          <Badge variant={priorityConfig.variant}>{priorityConfig.label}</Badge>
          <Badge variant="outline">{getTypeLabel(opportunite.type)}</Badge>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div>
            <p className="text-muted-foreground">
              Client: <span className="font-medium text-foreground">
                {opportunite.client.firstName} {opportunite.client.lastName}
              </span>
            </p>
            {opportunite.estimatedValue && (
              <p className="text-muted-foreground mt-1">
                Valeur: <span className="font-semibold text-success">
                  {formatCurrency(opportunite.estimatedValue)}
                </span>
              </p>
            )}
          </div>
          {opportunite.confidence !== undefined && (
            <div className="text-right">
              <div className="text-sm font-semibold text-foreground">
                {opportunite.confidence}%
              </div>
              <div className="text-xs text-muted-foreground">Confiance</div>
            </div>
          )}
        </div>

        {opportunite.actionDeadline && (
          <div className="flex items-center gap-2 text-sm text-warning">
            <Clock className="h-4 w-4" />
            <span>Échéance: {formatDate(opportunite.actionDeadline)}</span>
          </div>
        )}

        {(opportunite.status === 'NEGOTIATION' || opportunite.status === 'PROPOSAL_SENT') && (
          <Button
            size="sm"
            className="w-full"
            onClick={(e: React.MouseEvent) => {
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
  const [clients, setClients] = useState<Array<{ id: string; firstName: string; lastName: string }>>([])
  const [formData, setFormData] = useState({
    clientId: '',
    name: '',
    description: '',
    type: 'AUTRE',
    estimatedValue: '',
    priority: 'MOYENNE',
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
      // Get current user session to set conseillerId
      const sessionResponse = await fetch('/api/auth/session')
      const session = await sessionResponse.json()

      const payload = {
        clientId: formData.clientId,
        conseillerId: session?.user?.id || '',
        name: formData.name,
        description: formData.description || undefined,
        type: formData.type,
        estimatedValue: formData.estimatedValue ? parseFloat(formData.estimatedValue) : undefined,
        priority: formData.priority,
        actionDeadline: formData.actionDeadline || undefined,
      }

      const response = await fetch('/api/advisor/opportunites', {
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
    <Modal open={true} onOpenChange={(open: boolean) => !open && onClose()}>
      <ModalContent className="max-w-2xl">
        <ModalHeader>
          <ModalTitle>Créer une opportunité</ModalTitle>
        </ModalHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Client *
            </label>
            <Select
              value={formData.clientId}
              onValueChange={(value: string) => setFormData({ ...formData, clientId: value })}
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
            <label className="block text-sm font-medium text-foreground mb-1">
              Nom de l'opportunité *
            </label>
            <Input
              value={formData.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Souscription assurance vie"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Type *
            </label>
            <Select
              value={formData.type}
              onValueChange={(value: string) => setFormData({ ...formData, type: value })}
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
            <label className="block text-sm font-medium text-foreground mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Décrivez l'opportunité..."
              rows={3}
              className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Valeur estimée (€)
              </label>
              <Input
                type="number"
                value={formData.estimatedValue}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, estimatedValue: e.target.value })}
                placeholder="Ex: 50000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Priorité *
              </label>
              <Select
                value={formData.priority}
                onValueChange={(value: string) => setFormData({ ...formData, priority: value })}
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
            <label className="block text-sm font-medium text-foreground mb-1">
              Échéance d'action
            </label>
            <Input
              type="date"
              value={formData.actionDeadline}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, actionDeadline: e.target.value })}
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
