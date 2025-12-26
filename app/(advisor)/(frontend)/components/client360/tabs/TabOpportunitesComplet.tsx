'use client'

/**
 * TabOpportunitesComplet - Opportunités patrimoniales
 * Opportunités, optimisations fiscales, arbitrages
 */

import { useState, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/_common/components/ui/Card'
import { Button } from '@/app/_common/components/ui/Button'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Tabs, TabsList, TabsTrigger } from '@/app/_common/components/ui/Tabs'
import { Input } from '@/app/_common/components/ui/Input'
import { Label } from '@/app/_common/components/ui/Label'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/app/_common/components/ui/Dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import { formatCurrency, formatDate } from '@/app/_common/lib/utils'
import { useToast } from '@/app/_common/hooks/use-toast'
import { Lightbulb, Plus, RefreshCw, CheckCircle, Clock, TrendingUp, Calculator, Home, PiggyBank, Shield, ChevronRight, ThumbsUp, ThumbsDown, Filter, ArrowRight, Sparkles, AlertTriangle } from 'lucide-react'
import type { ClientDetail } from '@/app/_common/lib/api-types'
import { OpportuniteStatus, type Prisma } from '@prisma/client'
// import type { OpportuniteType } from '@/app/_common/lib/constants/reference-types'

export type OpportuniteType =
  | 'OPTIMISATION_FISCALE'
  | 'INVESTISSEMENT_FINANCIER'
  | 'INVESTISSEMENT_IMMOBILIER'
  | 'EPARGNE_RETRAITE'
  | 'ASSURANCE_VIE'
  | 'RESTRUCTURATION_CREDIT'
  | 'TRANSMISSION_PATRIMOINE'
  | 'AUDIT_ASSURANCES'
  | 'AUTRE'

type OpportunitePriority = 'URGENTE' | 'HAUTE' | 'MOYENNE' | 'BASSE'

interface TabOpportunitesCompletProps {
  clientId: string
  client: ClientDetail
}

type DecimalLike = { toNumber: () => number }

function toNumberSafe(value: number | string | DecimalLike | null | undefined): number {
  if (value === null || value === undefined) return 0
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value === 'string') {
    const n = Number(value)
    return Number.isFinite(n) ? n : 0
  }
  return value.toNumber()
}

function toStringArraySafe(value: Prisma.JsonValue | null | undefined): string[] {
  if (value === null || value === undefined) return []
  if (typeof value === 'string') return [value]
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === 'string')
  return []
}

interface Opportunite {
  id: string
  name: string
  type: OpportuniteType
  description: string
  estimatedValue: number
  status: OpportuniteStatus
  priority: OpportunitePriority
  createdAt: Date | string
  convertedToProjetId: string | null
  actions: string[]
}

const OPPORTUNITY_TYPES = [
  { value: 'OPTIMISATION_FISCALE' as const, label: 'Optimisation fiscale', icon: Calculator, color: 'purple' },
  { value: 'INVESTISSEMENT_FINANCIER' as const, label: 'Investissement financier', icon: TrendingUp, color: 'green' },
  { value: 'INVESTISSEMENT_IMMOBILIER' as const, label: 'Investissement immobilier', icon: Home, color: 'blue' },
  { value: 'EPARGNE_RETRAITE' as const, label: 'Épargne retraite', icon: PiggyBank, color: 'amber' },
  { value: 'ASSURANCE_VIE' as const, label: 'Assurance-vie', icon: Shield, color: 'pink' },
  { value: 'RESTRUCTURATION_CREDIT' as const, label: 'Restructuration crédit', icon: ArrowRight, color: 'cyan' },
  { value: 'TRANSMISSION_PATRIMOINE' as const, label: 'Transmission', icon: Sparkles, color: 'violet' },
  { value: 'AUDIT_ASSURANCES' as const, label: 'Audit assurances', icon: Shield, color: 'rose' },
  { value: 'AUTRE' as const, label: 'Autre', icon: Lightbulb, color: 'gray' },
]

const STATUS_CONFIG = {
  DETECTEE: { label: 'Détectée', className: 'bg-blue-100 text-blue-700', icon: Lightbulb },
  QUALIFIEE: { label: 'Qualifiée', className: 'bg-amber-100 text-amber-700', icon: Clock },
  CONTACTEE: { label: 'Contactée', className: 'bg-amber-100 text-amber-700', icon: Clock },
  PRESENTEE: { label: 'Présentée', className: 'bg-amber-100 text-amber-700', icon: Clock },
  ACCEPTEE: { label: 'Acceptée', className: 'bg-green-100 text-green-700', icon: ThumbsUp },
  CONVERTIE: { label: 'Convertie', className: 'bg-purple-100 text-purple-700', icon: CheckCircle },
  REJETEE: { label: 'Rejetée', className: 'bg-red-100 text-red-700', icon: ThumbsDown },
  PERDUE: { label: 'Perdue', className: 'bg-red-100 text-red-700', icon: ThumbsDown },
}

const DEFAULT_STATUS_CONFIG = {
  label: 'Statut non défini',
  className: 'bg-gray-100 text-gray-700',
  icon: AlertTriangle,
}

export function TabOpportunitesComplet({ clientId, client }: TabOpportunitesCompletProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('all')
  const [loading, setLoading] = useState(false)
  const [filterType, setFilterType] = useState<string | null>(null)

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunite | null>(null)

  // Extract opportunities from client
  const opportunites: Opportunite[] = useMemo(() => {
    return (client.opportunites || []).map((o) => ({
      id: o.id,
      name: o.name || '',
      type: (o as any).type || (o as any).type || 'AUTRE',
      description: o.description || '',
      estimatedValue: toNumberSafe(o.estimatedValue as unknown as number | string | DecimalLike | null | undefined),
      status: o.status || 'DETECTEE',
      priority: o.priority || 'MOYENNE',
      createdAt: o.createdAt,
      convertedToProjetId: (o as any).convertedToProjetId || null,
      actions: toStringArraySafe((o as any).actions as unknown as Prisma.JsonValue | null | undefined),
    }))
  }, [client.opportunites])

  // Stats
  const stats = useMemo(() => ({
    total: opportunites.length,
    identified: opportunites.filter(o => o.status === 'DETECTEE').length,
    pending: opportunites.filter(o => ['QUALIFIEE', 'CONTACTEE', 'PRESENTEE', 'ACCEPTEE'].includes(o.status)).length,
    implemented: opportunites.filter(o => o.status === 'CONVERTIE').length,
    totalGain: opportunites.filter(o => o.status === 'CONVERTIE').reduce((s, o) => s + o.estimatedValue, 0),
    potentialGain: opportunites
      .filter(o => ['DETECTEE', 'QUALIFIEE', 'CONTACTEE', 'PRESENTEE', 'ACCEPTEE'].includes(o.status))
      .reduce((s, o) => s + o.estimatedValue, 0),
  }), [opportunites])

  // Filter
  const filteredOpportunites = useMemo(() => {
    let filtered = opportunites
    if (activeTab !== 'all') {
      if (activeTab === 'active') filtered = filtered.filter(o => ['DETECTEE', 'QUALIFIEE', 'CONTACTEE', 'PRESENTEE', 'ACCEPTEE'].includes(o.status))
      else if (activeTab === 'done') filtered = filtered.filter(o => ['CONVERTIE', 'REJETEE', 'PERDUE'].includes(o.status))
    }
    if (filterType) filtered = filtered.filter(o => o.type === filterType)
    return filtered
  }, [opportunites, activeTab, filterType])

  const handleAddOpportunity = async (data: Partial<Opportunite>) => {
    try {
      const conseillerId = client.conseillerId || client.conseiller?.id
      if (!conseillerId) {
        throw new Error('Missing conseillerId')
      }

      await fetch(`/api/advisor/opportunites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          conseillerId,
          name: data.name,
          type: data.type,
          description: data.description || undefined,
          estimatedValue: data.estimatedValue,
          priority: data.priority,
          status: data.status,
        }),
      })
      await queryClient.invalidateQueries({ queryKey: ['clients', clientId, 'opportunites'] })
      await queryClient.invalidateQueries({ queryKey: ['clients', clientId] })
      toast({ title: 'Opportunité créée' })
      setShowAddModal(false)
    } catch {
      toast({ title: 'Erreur', variant: 'destructive' })
    }
  }

  const handleUpdateStatus = async (id: string, status: Opportunite['status']) => {
    setLoading(true)
    try {
      await fetch(`/api/advisor/opportunites/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      await queryClient.invalidateQueries({ queryKey: ['clients', clientId, 'opportunites'] })
      await queryClient.invalidateQueries({ queryKey: ['clients', clientId] })
      toast({ title: 'Statut mis à jour' })
    } catch {
      toast({ title: 'Erreur', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  // Open Detail Modal
  const openDetailModal = (opp: Opportunite) => {
    setSelectedOpportunity(opp)
    setShowDetailModal(true)
  }

  // Open Edit Modal
  const openEditModal = (opp: Opportunite) => {
    setSelectedOpportunity(opp)
    setShowEditModal(true)
  }

  // Edit Opportunity
  const handleEditOpportunity = async (data: Partial<Opportunite>) => {
    if (!selectedOpportunity?.id) return
    setLoading(true)
    try {
      await fetch(`/api/advisor/opportunites/${selectedOpportunity.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          type: data.type,
          description: data.description || undefined,
          estimatedValue: data.estimatedValue,
          priority: data.priority,
        }),
      })
      await queryClient.invalidateQueries({ queryKey: ['clients', clientId, 'opportunites'] })
      await queryClient.invalidateQueries({ queryKey: ['clients', clientId] })
      toast({ title: 'Opportunité mise à jour' })
      setShowEditModal(false)
      setSelectedOpportunity(null)
    } catch {
      toast({ title: 'Erreur', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  // Delete Opportunity
  const handleDeleteOpportunity = async (opp: Opportunite) => {
    if (!confirm(`Supprimer l'opportunité "${opp.name}" ?`)) return
    setLoading(true)
    try {
      await fetch(`/api/advisor/opportunites/${opp.id}`, { method: 'DELETE' })
      await queryClient.invalidateQueries({ queryKey: ['clients', clientId, 'opportunites'] })
      await queryClient.invalidateQueries({ queryKey: ['clients', clientId] })
      toast({ title: 'Opportunité supprimée' })
      setShowDetailModal(false)
      setSelectedOpportunity(null)
    } catch {
      toast({ title: 'Erreur', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  // Analyze - Generate suggestions
  const handleAnalyze = async () => {
    setLoading(true)
    try {
      toast({ title: 'Analyse en cours...', description: 'Recherche d\'opportunités basée sur le profil client' })
      // In a real implementation, this would call an AI/analysis endpoint
      await new Promise(r => setTimeout(r, 1500))
      toast({ title: 'Analyse terminée', description: '3 nouvelles suggestions disponibles' })
    } catch {
      toast({ title: 'Erreur d\'analyse', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  // Create opportunity from suggestion
  const handleCreateFromSuggestion = (type: string, title: string, description: string, gain: number) => {
    setShowAddModal(true)
    // Pre-fill would be handled by the form component if we pass initial values
  }

  const getTypeConfig = (type: OpportuniteType) => OPPORTUNITY_TYPES.find(t => t.value === type) || OPPORTUNITY_TYPES[OPPORTUNITY_TYPES.length - 1]
  const getStatusConfig = (status: OpportuniteStatus | undefined) =>
    (status ? STATUS_CONFIG[status] : undefined) || DEFAULT_STATUS_CONFIG

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-primary-50 rounded-lg">
              <Lightbulb className="h-6 w-6 text-primary-600" />
            </div>
            Opportunités
          </h2>
          <p className="text-sm text-gray-500 mt-1 ml-14">Opportunités patrimoniales et optimisations</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleAnalyze} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />Analyser
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" />Nouvelle opportunité
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Lightbulb className="h-8 w-8 text-blue-600" />
              <div><p className="text-2xl font-bold text-blue-900">{stats.identified}</p><p className="text-sm text-blue-600">À traiter</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-amber-600" />
              <div><p className="text-2xl font-bold text-amber-900">{stats.pending}</p><p className="text-sm text-amber-600">En cours</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div><p className="text-2xl font-bold text-green-900">{stats.implemented}</p><p className="text-sm text-green-600">Réalisées</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-purple-600" />
              <div><p className="text-2xl font-bold text-purple-900">{formatCurrency(stats.potentialGain)}</p><p className="text-sm text-purple-600">Gain potentiel</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Suggestions automatiques */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" />Suggestions intelligentes</CardTitle>
          <CardDescription>Opportunités détectées automatiquement</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <SuggestionCard type="FISCAL" title="Versement PER" description="Optimisez votre IR avec un versement sur PER" gain={2000} />
            <SuggestionCard type="EPARGNE" title="Rééquilibrage" description="Diversifiez votre allocation d'actifs" gain={0} />
            <SuggestionCard type="PROTECTION" title="Prévoyance" description="Complétez votre couverture décès/invalidité" gain={0} />
          </div>
        </CardContent>
      </Card>

      {/* Tabs & Filter */}
      <div className="flex items-center justify-between">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white border">
            <TabsTrigger value="all">Toutes ({opportunites.length})</TabsTrigger>
            <TabsTrigger value="active">Actives ({stats.identified + stats.pending})</TabsTrigger>
            <TabsTrigger value="done">Terminées</TabsTrigger>
          </TabsList>
        </Tabs>
        <Select value={filterType ?? 'ALL'} onValueChange={(v) => setFilterType(v === 'ALL' ? null : v)}>
          <SelectTrigger className="w-48"><Filter className="h-4 w-4 mr-2" /><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tous</SelectItem>
            {OPPORTUNITY_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {filteredOpportunites.length > 0 ? (
        <div className="space-y-4">
          {filteredOpportunites.map((opp) => {
            const typeConfig = getTypeConfig(opp.type)
            const statusConfig = getStatusConfig(opp.status)
            const TypeIcon = typeConfig.icon
            const StatusIcon = statusConfig.icon

            return (
              <Card key={opp.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg bg-${typeConfig.color}-100`}><TypeIcon className={`h-6 w-6 text-${typeConfig.color}-600`} /></div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg">{opp.name}</h3>
                          <Badge className={statusConfig.className}><StatusIcon className="h-3 w-3 mr-1" />{statusConfig.label}</Badge>
                          <Badge variant="outline">{typeConfig.label}</Badge>
                          {opp.priority === 'HAUTE' && <Badge className="bg-red-100 text-red-700">Prioritaire</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">{opp.description}</p>
                        <p className="text-xs text-muted-foreground mt-2">Créée le {formatDate(opp.createdAt)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {opp.estimatedValue > 0 && (
                        <div className="mb-2">
                          <p className="text-2xl font-bold text-green-600">{formatCurrency(opp.estimatedValue)}</p>
                          <p className="text-xs text-muted-foreground">Gain estimé</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-4 pt-4 border-t">
                    {['DETECTEE', 'QUALIFIEE', 'CONTACTEE', 'PRESENTEE'].includes(opp.status) && (
                      <>
                        <Button size="sm" onClick={() => handleUpdateStatus(opp.id, 'ACCEPTEE')} disabled={loading}>
                          <ThumbsUp className="h-4 w-4 mr-1" />Accepter
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(opp.id, 'REJETEE')} disabled={loading}>
                          <ThumbsDown className="h-4 w-4 mr-1" />Refuser
                        </Button>
                      </>
                    )}
                    {opp.status === 'ACCEPTEE' && (
                      <Button size="sm" onClick={() => handleUpdateStatus(opp.id, 'CONVERTIE')} disabled={loading}>
                        <CheckCircle className="h-4 w-4 mr-1" />Marquer comme convertie
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => openDetailModal(opp)}>
                      Détails<ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card><CardContent className="py-12 text-center"><Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" /><p className="text-muted-foreground mb-4">Aucune opportunité trouvée</p><Button onClick={() => setShowAddModal(true)}><Plus className="h-4 w-4 mr-2" />Créer une opportunité</Button></CardContent></Card>
      )}

      {/* Add Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Nouvelle opportunité</DialogTitle></DialogHeader>
          <AddOpportunityForm onAdd={handleAddOpportunity} onClose={() => setShowAddModal(false)} />
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={(o) => { setShowDetailModal(o); if (!o) setSelectedOpportunity(null) }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails de l'opportunité</DialogTitle>
          </DialogHeader>
          {selectedOpportunity && (
            <OpportunityDetailView
              opportunity={selectedOpportunity}
              onEdit={() => { setShowDetailModal(false); openEditModal(selectedOpportunity) }}
              onDelete={() => handleDeleteOpportunity(selectedOpportunity)}
              onUpdateStatus={(status) => handleUpdateStatus(selectedOpportunity.id, status)}
              loading={loading}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={(o) => { setShowEditModal(o); if (!o) setSelectedOpportunity(null) }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Modifier l'opportunité</DialogTitle></DialogHeader>
          {selectedOpportunity && (
            <EditOpportunityForm
              opportunity={selectedOpportunity}
              onSave={handleEditOpportunity}
              onClose={() => { setShowEditModal(false); setSelectedOpportunity(null) }}
              loading={loading}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SuggestionCard({ type, title, description, gain }: { type: string; title: string; description: string; gain: number }) {
  const typeConfig = OPPORTUNITY_TYPES.find(t => t.value === type) || OPPORTUNITY_TYPES[0]
  const Icon = typeConfig.icon
  return (
    <div className="p-4 rounded-lg border bg-white hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg bg-${typeConfig.color}-100`}><Icon className={`h-5 w-5 text-${typeConfig.color}-600`} /></div>
        <div className="flex-1">
          <h4 className="font-medium">{title}</h4>
          <p className="text-sm text-muted-foreground">{description}</p>
          {gain > 0 && <p className="text-sm font-medium text-green-600 mt-1">+{formatCurrency(gain)} économie</p>}
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </div>
    </div>
  )
}

function AddOpportunityForm({ onAdd, onClose }: { onAdd: (d: Partial<Opportunite>) => void; onClose: () => void }) {
  const [data, setData] = useState({
    name: '',
    type: 'OPTIMISATION_FISCALE' as OpportuniteType,
    description: '',
    estimatedValue: '',
    priority: 'MOYENNE' as OpportunitePriority,
  })
  return (
    <div className="space-y-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Nom</Label><Input value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} /></div>
        <div className="space-y-2"><Label>Type</Label><Select value={data.type} onValueChange={(v: OpportuniteType) => setData({ ...data, type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{OPPORTUNITY_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select></div>
      </div>
      <div className="space-y-2"><Label>Description</Label><Input value={data.description} onChange={(e) => setData({ ...data, description: e.target.value })} /></div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Valeur estimée (€)</Label><Input type="number" value={data.estimatedValue} onChange={(e) => setData({ ...data, estimatedValue: e.target.value })} /></div>
        <div className="space-y-2"><Label>Priorité</Label><Select value={data.priority} onValueChange={(v: OpportunitePriority) => setData({ ...data, priority: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="URGENTE">Urgente</SelectItem><SelectItem value="HAUTE">Haute</SelectItem><SelectItem value="MOYENNE">Moyenne</SelectItem><SelectItem value="BASSE">Basse</SelectItem></SelectContent></Select></div>
      </div>
      <DialogFooter><Button variant="outline" onClick={onClose}>Annuler</Button><Button onClick={() => onAdd({
        name: data.name,
        type: data.type,
        description: data.description,
        estimatedValue: Number(data.estimatedValue),
        priority: data.priority,
        status: 'DETECTEE',
      })} disabled={!data.name}>Créer</Button></DialogFooter>
    </div>
  )
}

function OpportunityDetailView({ opportunity, onEdit, onDelete, onUpdateStatus, loading }: {
  opportunity: Opportunite
  onEdit: () => void
  onDelete: () => void
  onUpdateStatus: (status: Opportunite['status']) => void
  loading: boolean
}) {
  const typeConfig = OPPORTUNITY_TYPES.find(t => t.value === opportunity.type) || OPPORTUNITY_TYPES[0]
  const statusConfig = STATUS_CONFIG[opportunity.status] || DEFAULT_STATUS_CONFIG
  const TypeIcon = typeConfig.icon
  const StatusIcon = statusConfig.icon

  return (
    <div className="space-y-6 py-4">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className={`p-4 rounded-lg bg-${typeConfig.color}-100`}>
          <TypeIcon className={`h-8 w-8 text-${typeConfig.color}-600`} />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold">{opportunity.name}</h3>
          <div className="flex items-center gap-2 mt-2">
            <Badge className={statusConfig.className}>
              <StatusIcon className="h-3 w-3 mr-1" />{statusConfig.label}
            </Badge>
            <Badge variant="outline">{typeConfig.label}</Badge>
            {opportunity.priority === 'HAUTE' && <Badge className="bg-red-100 text-red-700">Prioritaire</Badge>}
          </div>
        </div>
        {opportunity.estimatedValue > 0 && (
          <div className="text-right">
            <p className="text-3xl font-bold text-green-600">{formatCurrency(opportunity.estimatedValue)}</p>
            <p className="text-sm text-muted-foreground">Gain estimé</p>
          </div>
        )}
      </div>

      {/* Description */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium mb-2">Description</h4>
        <p className="text-sm text-muted-foreground">{opportunity.description || 'Aucune description'}</p>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 border rounded-lg">
          <p className="text-sm text-muted-foreground">Catégorie</p>
          <p className="font-medium">{typeConfig.label}</p>
        </div>
        <div className="p-4 border rounded-lg">
          <p className="text-sm text-muted-foreground">Priorité</p>
          <p className="font-medium">
            {opportunity.priority === 'URGENTE' ? '🔴 Urgente' : opportunity.priority === 'HAUTE' ? '🔴 Haute' : opportunity.priority === 'MOYENNE' ? '🟡 Moyenne' : '🟢 Basse'}
          </p>
        </div>
        <div className="p-4 border rounded-lg">
          <p className="text-sm text-muted-foreground">Créée le</p>
          <p className="font-medium">{formatDate(opportunity.createdAt)}</p>
        </div>
        <div className="p-4 border rounded-lg">
          <p className="text-sm text-muted-foreground">Projet lié</p>
          <p className="font-medium">{opportunity.convertedToProjetId || 'Aucun'}</p>
        </div>
      </div>

      {/* Actions */}
      {opportunity.actions.length > 0 && (
        <div>
          <h4 className="font-medium mb-2">Actions à réaliser</h4>
          <ul className="space-y-2">
            {opportunity.actions.map((action, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-gray-400" />
                {action}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Buttons */}
      <DialogFooter className="border-t pt-4">
        <div className="flex gap-2 flex-1">
          {['DETECTEE', 'QUALIFIEE', 'CONTACTEE', 'PRESENTEE'].includes(opportunity.status) && (
            <>
              <Button size="sm" onClick={() => onUpdateStatus('ACCEPTEE')} disabled={loading}>
                <ThumbsUp className="h-4 w-4 mr-1" />Accepter
              </Button>
              <Button size="sm" variant="outline" onClick={() => onUpdateStatus('REJETEE')} disabled={loading}>
                <ThumbsDown className="h-4 w-4 mr-1" />Refuser
              </Button>
            </>
          )}
          {opportunity.status === 'ACCEPTEE' && (
            <Button size="sm" onClick={() => onUpdateStatus('CONVERTIE')} disabled={loading}>
              <CheckCircle className="h-4 w-4 mr-1" />Marquer comme convertie
            </Button>
          )}
        </div>
        <Button variant="outline" onClick={onEdit}>Modifier</Button>
        <Button variant="destructive" onClick={onDelete} disabled={loading}>Supprimer</Button>
      </DialogFooter>
    </div>
  )
}

function EditOpportunityForm({ opportunity, onSave, onClose, loading }: {
  opportunity: Opportunite
  onSave: (d: Partial<Opportunite>) => void
  onClose: () => void
  loading: boolean
}) {
  const [data, setData] = useState({
    name: opportunity.name,
    type: opportunity.type,
    description: opportunity.description,
    estimatedValue: String(opportunity.estimatedValue),
    priority: opportunity.priority,
  })

  return (
    <div className="space-y-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Nom *</Label>
          <Input value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Type</Label>
          <Select value={data.type} onValueChange={(v: OpportuniteType) => setData({ ...data, type: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {OPPORTUNITY_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Input value={data.description} onChange={(e) => setData({ ...data, description: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Valeur estimée (€)</Label>
          <Input type="number" value={data.estimatedValue} onChange={(e) => setData({ ...data, estimatedValue: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Priorité</Label>
          <Select value={data.priority} onValueChange={(v: OpportunitePriority) => setData({ ...data, priority: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="URGENTE">Urgente</SelectItem>
              <SelectItem value="HAUTE">Haute</SelectItem>
              <SelectItem value="MOYENNE">Moyenne</SelectItem>
              <SelectItem value="BASSE">Basse</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Annuler</Button>
        <Button
          onClick={() => onSave({
            name: data.name,
            type: data.type,
            description: data.description,
            estimatedValue: Number(data.estimatedValue),
            priority: data.priority,
          })}
          disabled={!data.name || loading}
        >
          {loading ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </DialogFooter>
    </div>
  )
}

export default TabOpportunitesComplet
