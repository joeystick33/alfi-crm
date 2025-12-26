'use client'

/**
 * ProjetsSection - Section Projets & Objectifs du Client360 V2
 * 
 * UTILISE LES VRAIES APIS
 */

import { useMemo, type ComponentType } from 'react'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/app/_common/lib/utils'
import { helpers } from '@/app/_common/styles/design-system-v2'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_common/components/ui/Card'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Button } from '@/app/_common/components/ui/Button'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import { Progress } from '@/app/_common/components/ui/Progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/_common/components/ui/Tabs'
import { api } from '@/app/_common/lib/api-client'
import { useClientCalculators } from '@/app/(advisor)/(frontend)/hooks/useClientCalculators'
import type { ClientDetail, WealthSummary, Objectif, RendezVous } from '@/app/_common/lib/api-types'
import {
  Target,
  TrendingUp,
  Clock,
  Calendar,
  Home,
  GraduationCap,
  Plane,
  PiggyBank,
  Plus,
  ChevronRight,
  CheckCircle2,
  Play,
  Briefcase,
} from 'lucide-react'

interface ProjetsSectionProps {
  clientId: string
  client: ClientDetail
  wealth?: WealthSummary
  activeItem?: string
  onNavigate: (sectionId: string, itemId?: string) => void
}

 interface ClientSimulation {
   id: string
   type?: string
   name?: string
   createdAt?: string | Date
   date?: string | Date
 }

// =============================================================================
// Hooks pour les appels API
// =============================================================================

function useClientObjectifs(clientId: string) {
  return useQuery({
    queryKey: ['clients', clientId, 'objectifs'],
    queryFn: async () => {
      const response = await api.get<{ data: Objectif[] } | Objectif[]>(`/advisor/clients/${clientId}/objectifs`)
      return Array.isArray(response) ? response : response?.data || []
    },
    enabled: !!clientId,
    staleTime: 1000 * 60 * 2,
  })
}

function useClientSimulations(clientId: string) {
  return useQuery({
    queryKey: ['clients', clientId, 'simulations'],
    queryFn: async () => {
      const response = await api.get<{ data: ClientSimulation[] } | ClientSimulation[]>(
        `/advisor/clients/${clientId}/simulations`
      )
      return Array.isArray(response) ? response : response?.data || []
    },
    enabled: !!clientId,
    staleTime: 1000 * 60 * 2,
  })
}

function useClientRendezVous(clientId: string) {
  return useQuery({
    queryKey: ['clients', clientId, 'rendez-vous'],
    queryFn: async () => {
      const response = await api.get<{ data: RendezVous[] } | RendezVous[]>(`/advisor/clients/${clientId}/rendez-vous`)
      return Array.isArray(response) ? response : response?.data || []
    },
    enabled: !!clientId,
    staleTime: 1000 * 60 * 2,
  })
}

// =============================================================================
// Helpers
// =============================================================================

 function isRecord(value: unknown): value is Record<string, unknown> {
   return typeof value === 'object' && value !== null
 }

 function hasToNumber(value: unknown): value is { toNumber: () => number } {
   return (
     isRecord(value) &&
     'toNumber' in value &&
     typeof (value as Record<string, unknown>).toNumber === 'function'
   )
 }

 function toNumber(value: unknown): number {
   if (typeof value === 'number') return value
   if (typeof value === 'string') {
     const n = Number(value)
     return Number.isNaN(n) ? 0 : n
   }
   if (hasToNumber(value)) return value.toNumber()
   return 0
 }

 function toDate(value: unknown): Date | null {
   if (value instanceof Date) return value
   if (typeof value === 'string' || typeof value === 'number') {
     const d = new Date(value)
     return Number.isNaN(d.getTime()) ? null : d
   }
   return null
 }

 function getRendezVousDate(rdv: RendezVous): Date | null {
   const record = rdv as unknown as Record<string, unknown>
   return toDate(record.scheduledAt ?? record.startDate ?? rdv.createdAt)
 }

 function getObjectifTargetDate(objectif: Objectif): Date | null {
   const record = objectif as unknown as Record<string, unknown>
   return toDate(record.targetDate)
 }

function ObjectifIcon({ type, className }: { type: string; className?: string }) {
  const typeUpper = type?.toUpperCase() || ''
  if (typeUpper.includes('IMMOBILIER') || typeUpper.includes('HOME') || typeUpper.includes('RESIDENCE')) return <Home className={className} />
  if (typeUpper.includes('ETUDES') || typeUpper.includes('ETUDES')) return <GraduationCap className={className} />
  if (typeUpper.includes('TRAVEL') || typeUpper.includes('VOYAGE')) return <Plane className={className} />
  if (typeUpper.includes('RETRAITE') || typeUpper.includes('RETRAITE')) return <Clock className={className} />
  if (typeUpper.includes('EPARGNE') || typeUpper.includes('SAVINGS')) return <PiggyBank className={className} />
  if (typeUpper.includes('PROFESSIONNEL') || typeUpper.includes('BUSINESS')) return <Briefcase className={className} />
  if (typeUpper.includes('INVESTISSEMENT')) return <TrendingUp className={className} />
  return <Target className={className} />
}

function getObjectifValue(objectif: Objectif, field: 'target' | 'current'): number {
  const record = objectif as unknown as Record<string, unknown>
  const val = field === 'target'
    ? record.targetAmount ?? record.montantCible ?? 0
    : record.currentAmount ?? record.montantActuel ?? 0
  return toNumber(val)
}

// =============================================================================
// Composants internes
// =============================================================================

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  )
}

function EmptyState({ message, icon: Icon }: { message: string; icon: ComponentType<{ className?: string }> }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="p-4 bg-gray-100 rounded-full mb-4">
        <Icon className="h-8 w-8 text-gray-400" />
      </div>
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  )
}

function ObjectifCard({ objectif }: { objectif: Objectif }) {
  const target = getObjectifValue(objectif, 'target')
  const current = getObjectifValue(objectif, 'current')
  const progress = target > 0 ? (current / target) * 100 : 0
  const isCompleted = objectif.status === 'ATTEINT' || (objectif.status as string) === 'TERMINE'
  const iconClassName = cn('h-5 w-5', isCompleted ? 'text-emerald-600' : 'text-indigo-600')
  const targetDate = getObjectifTargetDate(objectif)
  const deadline = targetDate ? targetDate.getFullYear().toString() : '-'
  
  return (
    <div className={cn(
      'p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md',
      isCompleted ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-gray-200'
    )}>
      <div className="flex items-start gap-3 mb-3">
        <div className={cn(
          'p-2 rounded-lg',
          isCompleted ? 'bg-emerald-100' : 'bg-indigo-100'
        )}>
          <ObjectifIcon type={objectif.type} className={iconClassName} />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-gray-900">{objectif.name || objectif.type}</h4>
          <p className="text-xs text-gray-500">Échéance: {deadline}</p>
        </div>
        {isCompleted && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">{helpers.formatMoney(current, true)}</span>
          <span className="font-medium text-gray-900">{helpers.formatMoney(target, true)}</span>
        </div>
        <Progress value={progress} className="h-2" />
        <p className="text-xs text-gray-500 text-right">{progress.toFixed(0)}% atteint</p>
      </div>
    </div>
  )
}

interface TimelineItemData {
  id: string
  date: string | Date
  type: string
  label: string
  status?: string
}

function TimelineIcon({ type, status, className }: { type: string; status?: string; className?: string }) {
  const key = type || status || ''
  if (key === 'simulation') return <TrendingUp className={className} />
  if (key === 'document') return <Target className={className} />
  if (key === 'TERMINE') return <CheckCircle2 className={className} />
  return <Calendar className={className} />
}

function TimelineItem({ item }: { item: TimelineItemData }) {
  const isUpcoming = item.status === 'upcoming' || item.status === 'PLANIFIE'
  const itemDate = typeof item.date === 'string' ? new Date(item.date) : item.date
  
  return (
    <div className="flex items-center gap-3 py-3">
      <div className={cn(
        'p-2 rounded-lg',
        isUpcoming ? 'bg-indigo-100' : 'bg-gray-100'
      )}>
        <TimelineIcon type={item.type} status={item.status} className={cn('h-4 w-4', isUpcoming ? 'text-indigo-600' : 'text-gray-500')} />
      </div>
      <div className="flex-1">
        <p className={cn('text-sm font-medium', isUpcoming ? 'text-gray-900' : 'text-gray-600')}>
          {item.label}
        </p>
        <p className="text-xs text-gray-500">
          {itemDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>
      {isUpcoming && (
        <Badge variant="info" size="xs">À venir</Badge>
      )}
    </div>
  )
}

export default function ProjetsSection({
  clientId,
  activeItem = 'objectifs',
  onNavigate,
}: ProjetsSectionProps) {
  // Appels API réels
  const { data: objectifs = [], isLoading: isLoadingObjectifs } = useClientObjectifs(clientId)
  const { data: simulations = [], isLoading: isLoadingSimulations } = useClientSimulations(clientId)
  const { data: rendezVous = [] } = useClientRendezVous(clientId)
  
  // Calculateurs pour retraite
  const calculators = useClientCalculators(clientId)
  const retirementData = calculators.retirementSimulation
  
  // Stats calculées depuis les vraies données
  const stats = useMemo(() => {
    const now = new Date()
    const completedCount = objectifs.filter(
      (o: Objectif) => o.status === 'ATTEINT' || String(o.status) === 'TERMINE'
    ).length
    
    const upcomingRdv = rendezVous.find((rdv: RendezVous) => {
      if (rdv.status !== 'PLANIFIE') return false
      const rdvDate = getRendezVousDate(rdv)
      return rdvDate !== null && rdvDate.getTime() > now.getTime()
    })
    
    return {
      objectifsTotal: objectifs.length,
      objectifsCompletes: completedCount,
      simulationsCount: simulations.length,
      prochainRdv: upcomingRdv,
    }
  }, [objectifs, simulations, rendezVous])
  
  // Créer timeline depuis les différentes sources
  const timeline: TimelineItemData[] = useMemo(() => {
    const now = new Date()
    const items: TimelineItemData[] = []
    
    // Ajouter les rendez-vous
    rendezVous.forEach((rdv: RendezVous) => {
      const rdvDate = getRendezVousDate(rdv)
      const isUpcoming = rdv.status === 'PLANIFIE' && rdvDate !== null && rdvDate.getTime() > now.getTime()
      items.push({
        id: rdv.id,
        date: rdvDate ?? rdv.createdAt,
        type: 'rdv',
        label: rdv.title || (rdv as any).type || 'Rendez-vous' || 'Rendez-vous',
        status: isUpcoming ? 'upcoming' : 'completed',
      })
    })
    
    // Ajouter les simulations
    simulations.forEach((sim: ClientSimulation) => {
      items.push({
        id: sim.id,
        date: sim.createdAt || sim.date || new Date().toISOString(),
        type: 'simulation',
        label: sim.name || (sim as any).type || 'Simulation',
        status: 'completed',
      })
    })
    
    // Trier par date décroissante
    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10)
  }, [rendezVous, simulations])

  if (isLoadingObjectifs && isLoadingSimulations) {
    return <LoadingSkeleton />
  }

  return (
    <div className="space-y-4">
      {/* Stats rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-indigo-50 border-indigo-100">
          <CardContent className="py-3 text-center">
            <p className="text-2xl font-bold text-indigo-600">{stats.objectifsTotal}</p>
            <p className="text-xs text-gray-600">Objectifs</p>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50 border-emerald-100">
          <CardContent className="py-3 text-center">
            <p className="text-2xl font-bold text-emerald-600">{stats.objectifsCompletes}</p>
            <p className="text-xs text-gray-600">Complétés</p>
          </CardContent>
        </Card>
        <Card className="bg-violet-50 border-violet-100">
          <CardContent className="py-3 text-center">
            <p className="text-2xl font-bold text-violet-600">{stats.simulationsCount}</p>
            <p className="text-xs text-gray-600">Simulations</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 border-amber-100">
          <CardContent className="py-3 text-center">
            <p className="text-sm font-semibold text-amber-700">
              {stats.prochainRdv
                ? (getRendezVousDate(stats.prochainRdv)?.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) ?? '-')
                : '-'}
            </p>
            <p className="text-xs text-gray-600">Prochain RDV</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeItem} onValueChange={(v) => onNavigate('projets', v)}>
        <TabsList>
          <TabsTrigger value="objectifs">
            Objectifs
            <Badge variant="default" size="xs" className="ml-2">{objectifs.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="simulations">Simulations</TabsTrigger>
          <TabsTrigger value="retraite">Retraite</TabsTrigger>
          <TabsTrigger value="timeline">Historique</TabsTrigger>
        </TabsList>
        
        <TabsContent value="objectifs" className="mt-4">
          {objectifs.length === 0 ? (
            <EmptyState message="Aucun objectif défini" icon={Target} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {objectifs.map((objectif: Objectif) => (
                <ObjectifCard key={objectif.id} objectif={objectif} />
              ))}
            </div>
          )}
          <Button variant="outline" className="w-full mt-4 gap-2">
            <Plus className="h-4 w-4" />
            Ajouter un objectif
          </Button>
        </TabsContent>
        
        <TabsContent value="simulations" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Simulations réalisées</CardTitle>
            </CardHeader>
            <CardContent>
              {simulations.length === 0 ? (
                <EmptyState message="Aucune simulation enregistrée" icon={TrendingUp} />
              ) : (
                <div className="space-y-3">
                  {simulations.map((sim: ClientSimulation) => (
                    <div key={sim.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                      <TrendingUp className="h-5 w-5 text-emerald-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{sim.name || (sim as any).type || 'Simulation'}</p>
                        <p className="text-xs text-gray-500">
                          {sim.createdAt ? new Date(sim.createdAt).toLocaleDateString('fr-FR') : '-'}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </div>
                  ))}
                </div>
              )}
              <Button className="w-full mt-4 gap-2 bg-indigo-600 hover:bg-indigo-700">
                <Play className="h-4 w-4" />
                Nouvelle simulation
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="retraite" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-5 w-5 text-indigo-600" />
                Projection Retraite
              </CardTitle>
            </CardHeader>
            <CardContent>
              {calculators.isLoading ? (
                <Skeleton className="h-48 w-full" />
              ) : retirementData ? (
                <div className="text-center py-8">
                  <p className="text-4xl font-bold text-indigo-600 mb-2">{retirementData.retirementAge} ans</p>
                  <p className="text-gray-600 mb-4">Âge de départ estimé</p>
                  <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-lg font-semibold text-gray-900">
                        {helpers.formatMoney(retirementData.sustainableAnnualIncome / 12, true)}
                      </p>
                      <p className="text-xs text-gray-500">Pension estimée/mois</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-lg font-semibold text-gray-900">
                        {(retirementData.replacementRate * 100).toFixed(0)}%
                      </p>
                      <p className="text-xs text-gray-500">Taux remplacement</p>
                    </div>
                  </div>
                  <Button variant="outline" className="mt-6 gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Voir la simulation détaillée
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">Données insuffisantes pour la projection</p>
                  <Button variant="outline" className="gap-2">
                    <Play className="h-4 w-4" />
                    Lancer une simulation retraite
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="timeline" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Historique des événements</CardTitle>
            </CardHeader>
            <CardContent>
              {timeline.length === 0 ? (
                <EmptyState message="Aucun événement récent" icon={Calendar} />
              ) : (
                <div className="divide-y">
                  {timeline.map((item) => (
                    <TimelineItem key={item.id} item={item} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
