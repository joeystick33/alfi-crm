 
'use client'

/**
 * TabObjectifsProjets - Objectifs & Projets
 * Objectifs personnels, projets structurés, simulations
 */

import { useState, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_common/components/ui/Card'
import { Button } from '@/app/_common/components/ui/Button'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/_common/components/ui/Tabs'
import { Input } from '@/app/_common/components/ui/Input'
import { Label } from '@/app/_common/components/ui/Label'
import { Progress } from '@/app/_common/components/ui/Progress'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/app/_common/components/ui/Dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import Textarea from '@/app/_common/components/ui/Textarea'
import { formatCurrency, formatPercentage, formatDate } from '@/app/_common/lib/utils'
import { useToast } from '@/app/_common/hooks/use-toast'
import { Target, Briefcase, Plus, Edit, Trash2, Calendar, TrendingUp, CheckCircle, Clock, AlertTriangle, Home, GraduationCap, Plane, Gift, Heart, PiggyBank, Calculator } from 'lucide-react'
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import type { ClientDetail } from '@/app/_common/lib/api-types'

type ProjetStatus = 'PLANIFIE' | 'EN_COURS' | 'TERMINE' | 'ANNULE' | 'EN_PAUSE'
type ProjetType =
  | 'ACHAT_IMMOBILIER'
  | 'CREATION_ENTREPRISE'
  | 'PREPARATION_RETRAITE'
  | 'RESTRUCTURATION_PATRIMOINE'
  | 'OPTIMISATION_FISCALE'
  | 'PLANIFICATION_SUCCESSION'
  | 'AUTRE'

interface TabObjectifsProjetsProps {
  clientId: string
  client: ClientDetail
}

interface Objectif {
  id: string
  name: string
  type: string
  description: string
  targetAmount: number
  currentAmount: number
  targetDate: string | null
  status: 'ON_TRACK' | 'AT_RISK' | 'EN_RETARD' | 'TERMINE' | 'BROUILLON'
  priority: 'HAUTE' | 'MOYENNE' | 'BASSE'
  linkedAssets: string[]
  monthlyContribution: number
}

interface Projet {
  id: string
  name: string
  type: string
  description: string
  status: ProjetStatus
  estimatedBudget: number
  startDate: string | null
  endDate: string | null
  progress: number
  steps: { name: string; completed: boolean }[]
}

const OBJECTIF_TYPES = [
  { value: 'RETRAITE', label: 'Retraite', icon: PiggyBank },
  { value: 'IMMOBILIER', label: 'Achat immobilier', icon: Home },
  { value: 'ETUDES', label: 'Études des enfants', icon: GraduationCap },
  { value: 'TRANSMISSION', label: 'Transmission', icon: Gift },
  { value: 'VOYAGE', label: 'Voyage/Loisirs', icon: Plane },
  { value: 'PROTECTION', label: 'Protection familiale', icon: Heart },
  { value: 'AUTRE', label: 'Autre', icon: Target },
]

const PROJET_TYPES: Array<{ value: ProjetType; label: string }> = [
  { value: 'ACHAT_IMMOBILIER', label: 'Achat immobilier' },
  { value: 'CREATION_ENTREPRISE', label: 'Création entreprise' },
  { value: 'PREPARATION_RETRAITE', label: 'Préparation retraite' },
  { value: 'RESTRUCTURATION_PATRIMOINE', label: 'Restructuration patrimoine' },
  { value: 'OPTIMISATION_FISCALE', label: 'Optimisation fiscale' },
  { value: 'PLANIFICATION_SUCCESSION', label: 'Planification succession' },
  { value: 'AUTRE', label: 'Autre' },
]

const PROJET_STATUSES: Array<{ value: ProjetStatus; label: string }> = [
  { value: 'PLANIFIE', label: 'Planifié' },
  { value: 'EN_COURS', label: 'En cours' },
  { value: 'TERMINE', label: 'Terminé' },
  { value: 'ANNULE', label: 'Annulé' },
  { value: 'EN_PAUSE', label: 'En pause' },
]

export function TabObjectifsProjets({ clientId, client }: TabObjectifsProjetsProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('objectifs')
  const [loading, setLoading] = useState(false)
  
  // Modal states - Objectifs
  const [showAddObjectifModal, setShowAddObjectifModal] = useState(false)
  const [showEditObjectifModal, setShowEditObjectifModal] = useState(false)
  const [selectedObjectif, setSelectedObjectif] = useState<Objectif | null>(null)
  
  // Modal states - Projets
  const [showAddProjetModal, setShowAddProjetModal] = useState(false)
  const [showEditProjetModal, setShowEditProjetModal] = useState(false)
  const [selectedProjet, setSelectedProjet] = useState<Projet | null>(null)
  
  // Modal states - Simulation
  const [showSimulationModal, setShowSimulationModal] = useState(false)

  // Extract from client
  const objectifs: Objectif[] = useMemo(() => {
    return (client.objectifs || []).map((o: any) => ({
      id: o.id,
      name: o.name || '',
      type: o.type || 'AUTRE',
      description: o.description || '',
      targetAmount: Number(o.targetAmount) || 0,
      currentAmount: Number(o.currentAmount) || 0,
      targetDate: o.targetDate,
      status: getObjectifStatus(o),
      priority: o.priority || 'MOYENNE',
      linkedAssets: o.linkedAssets || [],
      monthlyContribution: Number(o.monthlyContribution) || 0,
    }))
  }, [client.objectifs])

  const projets: Projet[] = useMemo(() => {
    return (client.projets || []).map((p: any) => ({
      id: p.id,
      name: p.name || '',
      type: p.type || 'AUTRE',
      description: p.description || '',
      status: (p.status as ProjetStatus) || 'PLANIFIE',
      estimatedBudget: Number(p.estimatedBudget ?? 0),
      startDate: p.startDate,
      endDate: p.endDate,
      progress: p.progress || 0,
      steps: p.steps || [],
    }))
  }, [client.projets])

  // Stats
  const objectifsStats = useMemo(() => ({
    total: objectifs.length,
    onTrack: objectifs.filter(o => o.status === 'ON_TRACK').length,
    atRisk: objectifs.filter(o => o.status === 'AT_RISK').length,
    completed: objectifs.filter(o => o.status === 'TERMINE').length,
  }), [objectifs])

  const projetsStats = useMemo(() => ({
    total: projets.length,
    inProgress: projets.filter(p => p.status === 'EN_COURS').length,
    planned: projets.filter(p => p.status === 'PLANIFIE').length,
    completed: projets.filter(p => p.status === 'TERMINE').length,
  }), [projets])

  const handleAddObjectif = async (data: Partial<Objectif>) => {
    try {
      const res = await fetch(`/api/advisor/clients/${clientId}/objectifs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error((errorData as any)?.error || (errorData as any)?.message || 'Erreur lors de la création')
      }
      await queryClient.invalidateQueries({ queryKey: ['clients', clientId, 'objectifs'] })
      await queryClient.invalidateQueries({ queryKey: ['clients', clientId] })
      router.refresh()
      toast({ title: 'Objectif créé' })
      setShowAddObjectifModal(false)
    } catch (error: any) {
      toast({ title: 'Erreur', description: error?.message || undefined, variant: 'destructive' })
    }
  }

  const handleAddProjet = async (data: Partial<Projet>) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/advisor/clients/${clientId}/projets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error((errorData as any)?.error || (errorData as any)?.message || 'Erreur lors de la création')
      }
      await queryClient.invalidateQueries({ queryKey: ['clients', clientId, 'projets'] })
      await queryClient.invalidateQueries({ queryKey: ['clients', clientId] })
      router.refresh()
      toast({ title: 'Projet créé avec succès' })
      setShowAddProjetModal(false)
    } catch {
      toast({ title: 'Erreur lors de la création', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  // Edit Objectif
  const openEditObjectifModal = (objectif: Objectif) => {
    setSelectedObjectif(objectif)
    setShowEditObjectifModal(true)
  }

  const handleEditObjectif = async (data: Partial<Objectif>) => {
    if (!selectedObjectif?.id) return
    setLoading(true)
    try {
      const res = await fetch(`/api/advisor/clients/${clientId}/objectifs/${selectedObjectif.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error((errorData as any)?.error || (errorData as any)?.message || 'Erreur lors de la modification')
      }
      await queryClient.invalidateQueries({ queryKey: ['clients', clientId, 'objectifs'] })
      await queryClient.invalidateQueries({ queryKey: ['clients', clientId] })
      router.refresh()
      toast({ title: 'Objectif mis à jour' })
      setShowEditObjectifModal(false)
      setSelectedObjectif(null)
    } catch (error: any) {
      toast({ title: 'Erreur lors de la modification', description: error?.message || undefined, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteObjectif = async (objectif: Objectif) => {
    if (!confirm(`Supprimer l'objectif "${objectif.name}" ?`)) return
    setLoading(true)
    try {
      const res = await fetch(`/api/advisor/clients/${clientId}/objectifs/${objectif.id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error((errorData as any)?.error || (errorData as any)?.message || 'Erreur lors de la suppression')
      }
      await queryClient.invalidateQueries({ queryKey: ['clients', clientId, 'objectifs'] })
      await queryClient.invalidateQueries({ queryKey: ['clients', clientId] })
      router.refresh()
      toast({ title: 'Objectif supprimé' })
    } catch (error: any) {
      toast({ title: 'Erreur lors de la suppression', description: error?.message || undefined, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  // Edit Projet
  const openEditProjetModal = (projet: Projet) => {
    setSelectedProjet(projet)
    setShowEditProjetModal(true)
  }

  const handleEditProjet = async (data: Partial<Projet>) => {
    if (!selectedProjet?.id) return
    setLoading(true)
    try {
      const res = await fetch(`/api/advisor/clients/${clientId}/projets/${selectedProjet.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error((errorData as any)?.error || (errorData as any)?.message || 'Erreur lors de la modification')
      }

      await queryClient.invalidateQueries({ queryKey: ['clients', clientId, 'projets'] })
      await queryClient.invalidateQueries({ queryKey: ['clients', clientId] })
      router.refresh()
      toast({ title: 'Projet mis à jour' })
      setShowEditProjetModal(false)
      setSelectedProjet(null)
    } catch (error: any) {
      toast({ title: 'Erreur lors de la modification', description: error?.message || undefined, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteProjet = async (projet: Projet) => {
    if (!confirm(`Supprimer le projet "${projet.name}" ?`)) return
    setLoading(true)
    try {
      const res = await fetch(`/api/advisor/clients/${clientId}/projets/${projet.id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error((errorData as any)?.error || (errorData as any)?.message || 'Erreur lors de la suppression')
      }

      await queryClient.invalidateQueries({ queryKey: ['clients', clientId, 'projets'] })
      await queryClient.invalidateQueries({ queryKey: ['clients', clientId] })
      router.refresh()
      toast({ title: 'Projet supprimé' })
    } catch (error: any) {
      toast({ title: 'Erreur lors de la suppression', description: error?.message || undefined, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const getStatusConfig = (status: Objectif['status']) => {
    switch (status) {
      case 'ON_TRACK': return { label: 'En bonne voie', className: 'bg-green-100 text-green-700', icon: CheckCircle }
      case 'AT_RISK': return { label: 'À surveiller', className: 'bg-amber-100 text-amber-700', icon: AlertTriangle }
      case 'EN_RETARD': return { label: 'En retard', className: 'bg-red-100 text-red-700', icon: AlertTriangle }
      case 'TERMINE': return { label: 'Atteint', className: 'bg-blue-100 text-blue-700', icon: CheckCircle }
      default: return { label: 'Brouillon', className: 'bg-gray-100 text-gray-700', icon: Clock }
    }
  }

  const getProjetStatusConfig = (status: Projet['status']) => {
    switch (status) {
      case 'EN_COURS': return { label: 'En cours', className: 'bg-blue-100 text-blue-700' }
      case 'PLANIFIE': return { label: 'Planifié', className: 'bg-amber-100 text-amber-700' }
      case 'TERMINE': return { label: 'Terminé', className: 'bg-green-100 text-green-700' }
      case 'ANNULE': return { label: 'Annulé', className: 'bg-red-100 text-red-700' }
      default: return { label: 'Brouillon', className: 'bg-gray-100 text-gray-700' }
    }
  }

  const getProjetTypeLabel = (type: string) => {
    return PROJET_TYPES.find((t) => t.value === type)?.label || type
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-primary-50 rounded-lg">
              <Target className="h-6 w-6 text-primary-600" />
            </div>
            Objectifs & Projets
          </h2>
          <p className="text-sm text-gray-500 mt-1 ml-14">Suivi des objectifs patrimoniaux et projets</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowSimulationModal(true)}><Calculator className="h-4 w-4 mr-2" />Simuler</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Target className="h-8 w-8 text-blue-600" />
              <div><p className="text-2xl font-bold text-blue-900">{objectifsStats.total}</p><p className="text-sm text-blue-600">Objectifs</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div><p className="text-2xl font-bold text-green-900">{objectifsStats.onTrack}</p><p className="text-sm text-green-600">En bonne voie</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Briefcase className="h-8 w-8 text-purple-600" />
              <div><p className="text-2xl font-bold text-purple-900">{projetsStats.inProgress}</p><p className="text-sm text-purple-600">Projets en cours</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-amber-600" />
              <div><p className="text-2xl font-bold text-amber-900">{objectifsStats.atRisk}</p><p className="text-sm text-amber-600">À surveiller</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white border">
          <TabsTrigger value="objectifs"><Target className="h-4 w-4 mr-2" />Objectifs ({objectifs.length})</TabsTrigger>
          <TabsTrigger value="projets"><Briefcase className="h-4 w-4 mr-2" />Projets ({projets.length})</TabsTrigger>
          <TabsTrigger value="timeline"><Calendar className="h-4 w-4 mr-2" />Timeline</TabsTrigger>
        </TabsList>

        {/* Objectifs Tab */}
        <TabsContent value="objectifs" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowAddObjectifModal(true)}><Plus className="h-4 w-4 mr-2" />Nouvel objectif</Button>
          </div>
          
          {objectifs.length > 0 ? (
            <div className="space-y-4">
              {objectifs.map((obj) => {
                const progress = obj.targetAmount > 0 ? (obj.currentAmount / obj.targetAmount) * 100 : 0
                const statusConfig = getStatusConfig(obj.status)
                const TypeIcon = OBJECTIF_TYPES.find(t => t.value === obj.type)?.icon || Target
                
                return (
                  <Card key={obj.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-4">
                          <div className="p-3 rounded-lg bg-primary/10"><TypeIcon className="h-6 w-6 text-primary" /></div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg">{obj.name}</h3>
                              <Badge className={statusConfig.className}>{statusConfig.label}</Badge>
                              <Badge variant="outline">{obj.priority === 'HAUTE' ? '🔴 Haute' : obj.priority === 'MOYENNE' ? '🟡 Moyenne' : '🟢 Basse'}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{OBJECTIF_TYPES.find(t => t.value === obj.type)?.label}</p>
                            {obj.description && <p className="text-sm text-muted-foreground mt-1">{obj.description}</p>}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary">{formatCurrency(obj.currentAmount)}</p>
                          <p className="text-sm text-muted-foreground">/ {formatCurrency(obj.targetAmount)}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progression</span>
                          <span className="font-medium">{formatPercentage(progress)}</span>
                        </div>
                        <Progress value={Math.min(progress, 100)} className="h-2" />
                      </div>
                      
                      <div className="flex items-center justify-between mt-4 pt-4 border-t">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {obj.targetDate && <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{formatDate(obj.targetDate)}</span>}
                          {obj.monthlyContribution > 0 && <span className="flex items-center gap-1"><TrendingUp className="h-4 w-4" />{formatCurrency(obj.monthlyContribution)}/mois</span>}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => openEditObjectifModal(obj)} disabled={loading}>
                            <Edit className="h-4 w-4 mr-1" />Modifier
                          </Button>
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDeleteObjectif(obj)} disabled={loading}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground mb-4">Aucun objectif défini</p>
                <Button onClick={() => setShowAddObjectifModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />Créer un objectif
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Projets Tab */}
        <TabsContent value="projets" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowAddProjetModal(true)}><Plus className="h-4 w-4 mr-2" />Nouveau projet</Button>
          </div>
          
          {projets.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {projets.map((projet) => {
                const statusConfig = getProjetStatusConfig(projet.status)
                return (
                  <Card key={projet.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{projet.name}</h3>
                            <Badge className={statusConfig.className}>{statusConfig.label}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{getProjetTypeLabel(projet.type)}</p>
                        </div>
                        {projet.estimatedBudget > 0 && <p className="font-bold text-primary">{formatCurrency(projet.estimatedBudget)}</p>}
                      </div>
                      
                      {projet.description && <p className="text-sm text-muted-foreground mb-3">{projet.description}</p>}
                      
                      <div className="space-y-2 mb-3">
                        <div className="flex justify-between text-sm"><span>Avancement</span><span>{projet.progress}%</span></div>
                        <Progress value={projet.progress} className="h-2" />
                      </div>
                      
                      {projet.steps.length > 0 && (
                        <div className="space-y-1">
                          {projet.steps.slice(0, 3).map((step, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm">
                              {step.completed ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Clock className="h-4 w-4 text-gray-400" />}
                              <span className={step.completed ? 'line-through text-muted-foreground' : ''}>{step.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex justify-end gap-2 mt-4">
                        <Button size="sm" variant="outline" onClick={() => openEditProjetModal(projet)} disabled={loading}>
                          <Edit className="h-4 w-4 mr-1" />Modifier
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDeleteProjet(projet)} disabled={loading}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground mb-4">Aucun projet</p>
                <Button onClick={() => setShowAddProjetModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />Créer un projet
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Timeline des objectifs</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...objectifs].sort((a, b) => {
                  if (!a.targetDate) return 1
                  if (!b.targetDate) return -1
                  return new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime()
                }).map((obj, i) => (
                  <div key={obj.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${obj.status === 'TERMINE' ? 'bg-green-500' : 'bg-primary'}`} />
                      {i < objectifs.length - 1 && <div className="w-0.5 h-full bg-gray-200 my-1" />}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{obj.name}</h4>
                        <Badge className={getStatusConfig(obj.status).className}>{getStatusConfig(obj.status).label}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{obj.targetDate ? formatDate(obj.targetDate) : 'Sans échéance'}</p>
                      <Progress value={obj.targetAmount > 0 ? (obj.currentAmount / obj.targetAmount) * 100 : 0} className="h-1 mt-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Objectif Modal */}
      <Dialog open={showAddObjectifModal} onOpenChange={setShowAddObjectifModal}>
        <DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>Nouvel objectif</DialogTitle></DialogHeader>
          <AddObjectifForm onAdd={handleAddObjectif} onClose={() => setShowAddObjectifModal(false)} />
        </DialogContent>
      </Dialog>

      {/* Add Projet Modal */}
      <Dialog open={showAddProjetModal} onOpenChange={setShowAddProjetModal}>
        <DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>Nouveau projet</DialogTitle></DialogHeader>
          <AddProjetForm onAdd={handleAddProjet} onClose={() => setShowAddProjetModal(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit Objectif Modal */}
      <Dialog open={showEditObjectifModal} onOpenChange={(o) => { setShowEditObjectifModal(o); if (!o) setSelectedObjectif(null) }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Modifier l'objectif</DialogTitle></DialogHeader>
          {selectedObjectif && (
            <EditObjectifForm 
              objectif={selectedObjectif} 
              onSave={handleEditObjectif} 
              onClose={() => { setShowEditObjectifModal(false); setSelectedObjectif(null) }}
              loading={loading}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Projet Modal */}
      <Dialog open={showEditProjetModal} onOpenChange={(o) => { setShowEditProjetModal(o); if (!o) setSelectedProjet(null) }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Modifier le projet</DialogTitle></DialogHeader>
          {selectedProjet && (
            <EditProjetForm 
              projet={selectedProjet} 
              onSave={handleEditProjet} 
              onClose={() => { setShowEditProjetModal(false); setSelectedProjet(null) }}
              loading={loading}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Simulation Modal */}
      <Dialog open={showSimulationModal} onOpenChange={setShowSimulationModal}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>Simulation d'épargne</DialogTitle></DialogHeader>
          <SimulationPanel />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function AddObjectifForm({ onAdd, onClose }: { onAdd: (d: Partial<Objectif>) => void; onClose: () => void }) {
  const [data, setData] = useState({
    name: '',
    type: 'AUTRE',
    targetAmount: '',
    targetDate: '',
    priority: 'MOYENNE' as Objectif['priority'],
  })
  return (
    <div className="space-y-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Nom</Label><Input value={data.name} onChange={(e) => setData({...data, name: e.target.value})} /></div>
        <div className="space-y-2"><Label>Type</Label><Select value={data.type} onValueChange={(v) => setData({...data, type: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{OBJECTIF_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Montant cible (€)</Label><Input type="number" value={data.targetAmount} onChange={(e) => setData({...data, targetAmount: e.target.value})} /></div>
        <div className="space-y-2"><Label>Date cible</Label><Input type="date" value={data.targetDate} onChange={(e) => setData({...data, targetDate: e.target.value})} /></div>
      </div>
      <div className="space-y-2"><Label>Priorité</Label><Select value={data.priority} onValueChange={(v: Objectif['priority']) => setData({...data, priority: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="HAUTE">Haute</SelectItem><SelectItem value="MOYENNE">Moyenne</SelectItem><SelectItem value="BASSE">Basse</SelectItem></SelectContent></Select></div>
      <DialogFooter><Button variant="outline" onClick={onClose}>Annuler</Button><Button onClick={() => onAdd({...data, targetAmount: Number(data.targetAmount), currentAmount: 0})} disabled={!data.name}>Créer</Button></DialogFooter>
    </div>
  )
}

function AddProjetForm({ onAdd, onClose }: { onAdd: (d: Partial<Projet>) => void; onClose: () => void }) {
  const [data, setData] = useState({
    name: '',
    type: 'AUTRE' as ProjetType,
    description: '',
    estimatedBudget: '',
  })
  return (
    <div className="space-y-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Nom</Label><Input value={data.name} onChange={(e) => setData({...data, name: e.target.value})} /></div>
        <div className="space-y-2"><Label>Type</Label><Select value={data.type} onValueChange={(v) => setData({...data, type: v as ProjetType})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PROJET_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select></div>
      </div>
      <div className="space-y-2"><Label>Description</Label><Textarea value={data.description} onChange={(e) => setData({...data, description: e.target.value})} /></div>
      <div className="space-y-2"><Label>Budget estimé (€)</Label><Input type="number" value={data.estimatedBudget} onChange={(e) => setData({...data, estimatedBudget: e.target.value})} /></div>
      <DialogFooter><Button variant="outline" onClick={onClose}>Annuler</Button><Button onClick={() => onAdd({
        name: data.name,
        type: data.type,
        description: data.description,
        estimatedBudget: Number(data.estimatedBudget) || 0,
        status: 'PLANIFIE',
        progress: 0,
      })} disabled={!data.name}>Créer</Button></DialogFooter>
    </div>
  )
}

function EditObjectifForm({ objectif, onSave, onClose, loading }: { 
  objectif: Objectif
  onSave: (d: Partial<Objectif>) => void
  onClose: () => void
  loading: boolean
}) {
  const [data, setData] = useState({
    name: objectif.name,
    type: objectif.type,
    description: objectif.description,
    targetAmount: String(objectif.targetAmount),
    currentAmount: String(objectif.currentAmount),
    targetDate: objectif.targetDate?.split('T')[0] || '',
    priority: objectif.priority,
    monthlyContribution: String(objectif.monthlyContribution || 0),
  })
  
  return (
    <div className="space-y-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Nom *</Label>
          <Input value={data.name} onChange={(e) => setData({...data, name: e.target.value})} />
        </div>
        <div className="space-y-2">
          <Label>Type</Label>
          <Select value={data.type} onValueChange={(v) => setData({...data, type: v})}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {OBJECTIF_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea value={data.description} onChange={(e) => setData({...data, description: e.target.value})} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Montant cible (€)</Label>
          <Input type="number" value={data.targetAmount} onChange={(e) => setData({...data, targetAmount: e.target.value})} />
        </div>
        <div className="space-y-2">
          <Label>Montant actuel (€)</Label>
          <Input type="number" value={data.currentAmount} onChange={(e) => setData({...data, currentAmount: e.target.value})} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Date cible</Label>
          <Input type="date" value={data.targetDate} onChange={(e) => setData({...data, targetDate: e.target.value})} />
        </div>
        <div className="space-y-2">
          <Label>Contribution mensuelle (€)</Label>
          <Input type="number" value={data.monthlyContribution} onChange={(e) => setData({...data, monthlyContribution: e.target.value})} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Priorité</Label>
        <Select value={data.priority} onValueChange={(v: Objectif['priority']) => setData({...data, priority: v})}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="HAUTE">Haute</SelectItem>
            <SelectItem value="MOYENNE">Moyenne</SelectItem>
            <SelectItem value="BASSE">Basse</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Annuler</Button>
        <Button 
          onClick={() => onSave({
            ...data,
            targetAmount: Number(data.targetAmount),
            currentAmount: Number(data.currentAmount),
            monthlyContribution: Number(data.monthlyContribution),
          })} 
          disabled={!data.name || loading}
        >
          {loading ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </DialogFooter>
    </div>
  )
}

function EditProjetForm({ projet, onSave, onClose, loading }: { 
  projet: Projet
  onSave: (d: Partial<Projet>) => void
  onClose: () => void
  loading: boolean
}) {
  const [data, setData] = useState({
    name: projet.name,
    type: (projet.type as ProjetType) || 'AUTRE',
    description: projet.description,
    status: projet.status,
    estimatedBudget: String(projet.estimatedBudget),
    startDate: projet.startDate?.split('T')[0] || '',
    endDate: projet.endDate?.split('T')[0] || '',
    progress: projet.progress,
  })
  
  return (
    <div className="space-y-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Nom *</Label>
          <Input value={data.name} onChange={(e) => setData({...data, name: e.target.value})} />
        </div>
        <div className="space-y-2">
          <Label>Type</Label>
          <Select value={data.type} onValueChange={(v) => setData({...data, type: v as ProjetType})}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {PROJET_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea value={data.description} onChange={(e) => setData({...data, description: e.target.value})} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Statut</Label>
          <Select value={data.status} onValueChange={(v: ProjetStatus) => setData({...data, status: v})}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {PROJET_STATUSES.map(s => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Budget estimé (€)</Label>
          <Input type="number" value={data.estimatedBudget} onChange={(e) => setData({...data, estimatedBudget: e.target.value})} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Date de début</Label>
          <Input type="date" value={data.startDate} onChange={(e) => setData({...data, startDate: e.target.value})} />
        </div>
        <div className="space-y-2">
          <Label>Date de fin</Label>
          <Input type="date" value={data.endDate} onChange={(e) => setData({...data, endDate: e.target.value})} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Avancement (%)</Label>
        <Input type="number" min="0" max="100" value={data.progress} onChange={(e) => setData({...data, progress: Number(e.target.value)})} />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Annuler</Button>
        <Button 
          onClick={() => onSave({
            ...data,
            estimatedBudget: Number(data.estimatedBudget),
          })} 
          disabled={!data.name || loading}
        >
          {loading ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </DialogFooter>
    </div>
  )
}

function SimulationPanel() {
  const [params, setParams] = useState({ initial: 10000, monthly: 500, years: 10, rate: 3 })
  const projection = useMemo(() => {
    const months = params.years * 12
    let total = params.initial
    const data = [{ month: 0, value: total }]
    for (let i = 1; i <= months; i++) {
      total = total * (1 + params.rate / 100 / 12) + params.monthly
      if (i % 12 === 0) data.push({ month: i, value: Math.round(total) })
    }
    return { data, final: Math.round(total), invested: params.initial + params.monthly * months, gains: Math.round(total - params.initial - params.monthly * months) }
  }, [params])
  
  return (
    <div className="space-y-6 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Capital initial (€)</Label><Input type="number" value={params.initial} onChange={(e) => setParams({...params, initial: Number(e.target.value)})} /></div>
        <div className="space-y-2"><Label>Versement mensuel (€)</Label><Input type="number" value={params.monthly} onChange={(e) => setParams({...params, monthly: Number(e.target.value)})} /></div>
        <div className="space-y-2"><Label>Durée (années)</Label><Input type="number" value={params.years} onChange={(e) => setParams({...params, years: Number(e.target.value)})} /></div>
        <div className="space-y-2"><Label>Taux annuel (%)</Label><Input type="number" step="0.5" value={params.rate} onChange={(e) => setParams({...params, rate: Number(e.target.value)})} /></div>
      </div>
      <div className="h-64 min-w-[300px]">
        <ResponsiveContainer width={360} height={256}>
          <AreaChart data={projection.data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" tickFormatter={(v) => `${v/12}A`} />
            <YAxis tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
            <Tooltip formatter={(v: number) => formatCurrency(v)} />
            <Area type="monotone" dataKey="value" stroke="#3B82F6" fill="#3B82F620" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-2xl font-bold text-primary">{formatCurrency(projection.final)}</p>
          <p className="text-sm text-muted-foreground">Capital final</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-2xl font-bold">{formatCurrency(projection.invested)}</p>
          <p className="text-sm text-muted-foreground">Total investi</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-2xl font-bold text-green-600">{formatCurrency(projection.gains)}</p>
          <p className="text-sm text-muted-foreground">Plus-values</p>
        </div>
      </div>
    </div>
  )
}

function getObjectifStatus(obj: any): Objectif['status'] {
  if (obj.status === 'TERMINE') return 'TERMINE'
  const progress = obj.currentAmount && obj.targetAmount ? (obj.currentAmount / obj.targetAmount) * 100 : 0
  if (progress >= 100) return 'TERMINE'
  if (obj.targetDate) {
    const remaining = Math.ceil((new Date(obj.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    if (remaining < 0) return 'EN_RETARD'
    if (remaining < 90 && progress < 75) return 'AT_RISK'
  }
  return 'ON_TRACK'
}

export default TabObjectifsProjets
