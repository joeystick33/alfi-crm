'use client'

/**
 * TabObjectives - Onglet Objectifs & Projets enrichi du Client360
 * 9 types, 3 priorités, 6 statuts, KPIs, temps restant, timeline, milestones
 * Thème : Light solid
 * 
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5
 */

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_common/components/ui/Card'
import { Button } from '@/app/_common/components/ui/Button'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Progress } from '@/app/_common/components/ui/Progress'
import { formatCurrency, formatDate, formatPercentage, cn } from '@/app/_common/lib/utils'
import {
  Target,
  TrendingUp,
  Calendar,
  Plus,
  CheckCircle,
  CheckCircle2,
  Clock,
  AlertCircle,
  AlertTriangle,
  Flag,
  Home,
  GraduationCap,
  Users,
  Shield,
  Wallet,
  PiggyBank,
  Heart,
  XCircle,
  PlayCircle,
  PauseCircle,
  Timer,
  History,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { CreateObjectifModal } from './CreateObjectifModal'
import { CreateProjetModal } from './CreateProjetModal'
import type { Objectif, Projet } from '@prisma/client'
import type { TimelineEvent } from '@/app/_common/types/client360'

interface TabObjectivesProps {
  clientId: string
}

// ============================================================================
// Configuration enrichie - 9 types d'objectifs
// ============================================================================

const OBJECTIF_TYPES: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  RETIREMENT: { label: 'Retraite', icon: PiggyBank, color: 'bg-purple-100 text-purple-800' },
  ACHAT_IMMOBILIER: { label: 'Achat immobilier', icon: Home, color: 'bg-blue-100 text-blue-800' },
  ETUDES: { label: 'Éducation enfants', icon: GraduationCap, color: 'bg-cyan-100 text-cyan-800' },
  WEALTH_TRANSMISSION: { label: 'Transmission', icon: Users, color: 'bg-[#7373FF]/15 text-indigo-800' },
  TAX_OPTIMIZATION: { label: 'Optimisation fiscale', icon: Shield, color: 'bg-green-100 text-green-800' },
  REVENUS_COMPLEMENTAIRES: { label: 'Revenus complémentaires', icon: Wallet, color: 'bg-emerald-100 text-emerald-800' },
  PROTECTION_CAPITAL: { label: 'Protection capital', icon: Shield, color: 'bg-amber-100 text-amber-800' },
  TRAVEL: { label: 'Voyage / Loisirs', icon: Heart, color: 'bg-pink-100 text-pink-800' },
  OTHER: { label: 'Autre', icon: Target, color: 'bg-gray-100 text-gray-800' },
}

// 6 statuts enrichis
const OBJECTIF_STATUS: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  NOT_STARTED: { label: 'Non démarré', color: 'bg-gray-100 text-gray-700', icon: Clock },
  EN_COURS: { label: 'En cours', color: 'bg-blue-100 text-blue-800', icon: PlayCircle },
  ON_TRACK: { label: 'En bonne voie', color: 'bg-green-100 text-green-800', icon: TrendingUp },
  AT_RISK: { label: 'À risque', color: 'bg-orange-100 text-orange-800', icon: AlertTriangle },
  TERMINE: { label: 'Atteint', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle2 },
  ABANDONED: { label: 'Abandonné', color: 'bg-red-100 text-red-700', icon: XCircle },
  // Compatibilité anciens statuts
  ACTIVE: { label: 'Actif', color: 'bg-blue-100 text-blue-800', icon: PlayCircle },
  ACHIEVED: { label: 'Atteint', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle2 },
  ANNULE: { label: 'Annulé', color: 'bg-red-100 text-red-700', icon: XCircle },
  ON_HOLD: { label: 'En pause', color: 'bg-amber-100 text-amber-800', icon: PauseCircle },
}

// 3 priorités
const PRIORITY_CONFIG: Record<string, { label: string; color: string; emoji: string }> = {
  HAUTE: { label: 'Haute', color: 'bg-red-100 text-red-800', emoji: '🔴' },
  MOYENNE: { label: 'Moyenne', color: 'bg-orange-100 text-orange-800', emoji: '🟠' },
  BASSE: { label: 'Basse', color: 'bg-green-100 text-green-800', emoji: '🟢' },
}

// Compatibilité avec l'ancien format
const objectifTypeLabels = Object.fromEntries(
  Object.entries(OBJECTIF_TYPES).map(([k, v]) => [k, v.label])
)

const objectifStatusConfig = {
  ACTIVE: { label: 'Actif', variant: 'info' as const, icon: Clock },
  ACHIEVED: { label: 'Atteint', variant: 'success' as const, icon: CheckCircle },
  ANNULE: { label: 'Annulé', variant: 'outline' as const, icon: AlertCircle },
  ON_HOLD: { label: 'En pause', variant: 'warning' as const, icon: Clock },
}

const projetTypeLabels = {
  ACHAT_IMMOBILIER: 'Achat immobilier',
  CREATION_ENTREPRISE: 'Création d\'entreprise',
  PREPARATION_RETRAITE: 'Préparation retraite',
  RESTRUCTURATION_PATRIMOINE: 'Restructuration patrimoniale',
  TAX_OPTIMIZATION: 'Optimisation fiscale',
  PLANIFICATION_SUCCESSION: 'Planification succession',
  OTHER: 'Autre',
}

const projetStatusConfig = {
  PLANNED: { label: 'Planifié', variant: 'outline' as const },
  EN_COURS: { label: 'En cours', variant: 'info' as const },
  TERMINE: { label: 'Terminé', variant: 'success' as const },
  ANNULE: { label: 'Annulé', variant: 'destructive' as const },
  ON_HOLD: { label: 'En pause', variant: 'warning' as const },
}

// ============================================================================
// Fonctions utilitaires
// ============================================================================

/**
 * Calcule le temps restant avant la date cible
 */
function calculateTimeRemaining(targetDate: Date | string | null): {
  value: number;
  unit: string;
  label: string;
  status: 'ok' | 'warning' | 'danger' | 'expired'
} {
  if (!targetDate) return { value: 0, unit: '', label: 'Non défini', status: 'ok' }

  const target = new Date(targetDate)
  const now = new Date()
  const diffMs = target.getTime() - now.getTime()

  if (diffMs <= 0) {
    return { value: 0, unit: '', label: 'Échéance dépassée', status: 'expired' }
  }

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffMonths = Math.floor(diffDays / 30)
  const diffYears = Math.floor(diffDays / 365)

  let value: number, unit: string, label: string

  if (diffYears >= 2) {
    value = diffYears
    unit = 'ans'
    label = `${diffYears} ans`
  } else if (diffMonths >= 2) {
    value = diffMonths
    unit = 'mois'
    label = `${diffMonths} mois`
  } else {
    value = diffDays
    unit = 'jours'
    label = `${diffDays} jours`
  }

  // Déterminer le statut selon l'urgence
  let status: 'ok' | 'warning' | 'danger' | 'expired' = 'ok'
  if (diffDays < 30) status = 'danger'
  else if (diffDays < 90) status = 'warning'

  return { value, unit, label, status }
}

/**
 * Calcule le statut automatique basé sur la progression et le temps restant
 */
function getAutoStatus(progress: number, targetDate: Date | string | null): string {
  const timeRemaining = calculateTimeRemaining(targetDate)

  if (progress >= 100) return 'TERMINE'
  if (timeRemaining.status === 'expired') return 'AT_RISK'
  if (progress === 0) return 'NOT_STARTED'

  // Calcul du rythme nécessaire vs rythme actuel
  const diffDays = timeRemaining.value * (timeRemaining.unit === 'ans' ? 365 : timeRemaining.unit === 'mois' ? 30 : 1)
  const expectedProgress = 100 - (diffDays / 365 * 10) // Approximation linéaire

  if (progress >= expectedProgress * 0.9) return 'ON_TRACK'
  if (progress >= expectedProgress * 0.5) return 'EN_COURS'
  return 'AT_RISK'
}

export function TabObjectives({ clientId }: TabObjectivesProps) {
  const [objectifs, setObjectifs] = useState<Objectif[]>([])
  const [projets, setProjets] = useState<Projet[]>([])
  const [timeline, setTimeline] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [showObjectifModal, setShowObjectifModal] = useState(false)
  const [showProjetModal, setShowProjetModal] = useState(false)
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set())

  const toggleProjectExpanded = (projectId: string) => {
    setExpandedProjects(prev => {
      const next = new Set(prev)
      if (next.has(projectId)) {
        next.delete(projectId)
      } else {
        next.add(projectId)
      }
      return next
    })
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      const [objectifsRes, projetsRes, timelineRes] = await Promise.all([
        fetch(`/api/advisor/clients/${clientId}/objectifs`),
        fetch(`/api/advisor/clients/${clientId}/projets`),
        fetch(`/api/advisor/clients/${clientId}/timeline?limit=20`),
      ])

      if (objectifsRes.ok) {
        const objectifsData = await objectifsRes.json()
        setObjectifs(objectifsData.data || [])
      }

      if (projetsRes.ok) {
        const projetsData = await projetsRes.json()
        setProjets(projetsData.data || [])
      }

      if (timelineRes.ok) {
        const timelineData = await timelineRes.json()
        // Filter timeline events related to objectives and projects
        const relevantEvents = (timelineData.data || []).filter((e: any) =>
          e.relatedEntityType === 'Objectif' ||
          e.relatedEntityType === 'Projet' ||
          e.type === 'GOAL_ACHIEVED'
        )
        setTimeline(relevantEvents)
      }
    } catch (error) {
      console.error('Error fetching objectives and projects:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [clientId])

  // ============================================================================
  // Calculs KPIs
  // ============================================================================

  const stats = useMemo(() => {
    const activeObjectifs = objectifs.filter((o) =>
      !['TERMINE', 'ATTEINT', 'ANNULE', 'ABANDONED'].includes(o.status)
    )
    const completedObjectifs = objectifs.filter((o) =>
      ['TERMINE', 'ATTEINT'].includes(o.status)
    )
    const atRiskObjectifs = objectifs.filter((o) => {
      const time = calculateTimeRemaining(o.targetDate)
      return time.status === 'danger' || time.status === 'expired'
    })

    const totalTarget = objectifs.reduce((s: number, o) => s + (Number(o.targetAmount) || 0), 0)
    const totalCurrent = objectifs.reduce((s: number, o) => s + (Number(o.currentAmount) || 0), 0)
    const globalProgress = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0

    return {
      total: objectifs.length,
      active: activeObjectifs.length,
      completed: completedObjectifs.length,
      atRisk: atRiskObjectifs.length,
      totalTarget,
      totalCurrent,
      globalProgress,
    }
  }, [objectifs])

  const handleObjectifSuccess = () => {
    fetchData()
  }

  const handleProjetSuccess = () => {
    fetchData()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Target className="w-7 h-7 text-blue-600" />
            Objectifs & Projets
          </h2>
          <p className="text-gray-600 mt-1">Suivi des objectifs financiers et projets de vie</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowProjetModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Projet
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowObjectifModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Objectif
          </Button>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border border-gray-200 bg-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-gray-600">Objectifs actifs</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.active}</div>
            <p className="text-xs text-gray-500 mt-1">sur {stats.total} au total</p>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 bg-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span className="text-sm text-gray-600">Atteints</span>
            </div>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <p className="text-xs text-gray-500 mt-1">{stats.total > 0 ? Math.round(stats.completed / stats.total * 100) : 0}% de réussite</p>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 bg-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <span className="text-sm text-gray-600">À risque</span>
            </div>
            <div className="text-2xl font-bold text-orange-600">{stats.atRisk}</div>
            <p className="text-xs text-gray-500 mt-1">échéance proche</p>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 bg-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <span className="text-sm text-gray-600">Progression globale</span>
            </div>
            <div className="text-2xl font-bold text-purple-600">{Math.round(stats.globalProgress)}%</div>
            <Progress value={stats.globalProgress} className="h-2 mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Objectifs Section enrichie */}
      <Card className="border border-gray-200 bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            Objectifs financiers
            <Badge className="bg-blue-100 text-blue-800">{objectifs.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {objectifs.length > 0 ? (
            <div className="space-y-4">
              {objectifs.map((objectif) => {
                const typeConfig = OBJECTIF_TYPES[objectif.type] || OBJECTIF_TYPES.OTHER
                const TypeIcon = typeConfig.icon
                const statusCfg = OBJECTIF_STATUS[objectif.status] || OBJECTIF_STATUS.IN_PROGRESS
                const StatusIcon = statusCfg.icon
                const priorityCfg = PRIORITY_CONFIG[objectif.priority] || PRIORITY_CONFIG.MOYENNE
                const progress = objectif.progress || (objectif.targetAmount && objectif.currentAmount
                  ? (Number(objectif.currentAmount) / Number(objectif.targetAmount)) * 100
                  : 0)
                const timeRemaining = calculateTimeRemaining(objectif.targetDate)

                return (
                  <div key={objectif.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
                    {/* Header objectif */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', typeConfig.color)}>
                          <TypeIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-gray-900">{objectif.name}</h4>
                            {objectif.priority && (
                              <span className="text-sm">{priorityCfg.emoji}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Badge className={cn('text-xs', typeConfig.color)}>{typeConfig.label}</Badge>
                          </div>
                        </div>
                      </div>
                      <Badge className={cn('flex items-center gap-1', statusCfg.color)}>
                        <StatusIcon className="w-3 h-3" />
                        {statusCfg.label}
                      </Badge>
                    </div>

                    {objectif.description && (
                      <p className="text-sm text-gray-600">{objectif.description}</p>
                    )}

                    {/* Montants et dates */}
                    <div className="grid gap-3 md:grid-cols-4">
                      <div>
                        <p className="text-xs text-gray-500">Montant cible</p>
                        <p className="text-sm font-semibold text-gray-900">{formatCurrency(Number(objectif.targetAmount))}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Montant actuel</p>
                        <p className="text-sm font-semibold text-gray-900">{formatCurrency(Number(objectif.currentAmount || 0))}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Échéance</p>
                        <p className="text-sm font-medium text-gray-900">{formatDate(objectif.targetDate)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Temps restant</p>
                        <p className={cn(
                          'text-sm font-medium',
                          timeRemaining.status === 'ok' ? 'text-green-600' :
                            timeRemaining.status === 'warning' ? 'text-orange-600' :
                              'text-red-600'
                        )}>
                          <Timer className="w-3 h-3 inline mr-1" />
                          {timeRemaining.label}
                        </p>
                      </div>
                    </div>

                    {/* Barre de progression */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Progression</span>
                        <span className="font-semibold text-gray-900">{formatPercentage(progress)}</span>
                      </div>
                      <div className="h-3 rounded-full bg-gray-200 overflow-hidden">
                        <div
                          className={cn(
                            'h-full transition-all',
                            progress >= 100 ? 'bg-green-500' :
                              progress >= 75 ? 'bg-blue-500' :
                                progress >= 50 ? 'bg-blue-400' :
                                  progress >= 25 ? 'bg-orange-400' :
                                    'bg-orange-300'
                          )}
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Contribution mensuelle */}
                    {objectif.monthlyContribution && (
                      <div className="flex items-center gap-2 text-sm p-2 bg-blue-50 rounded-lg">
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                        <span className="text-gray-600">
                          Effort mensuel recommandé : <span className="font-semibold text-blue-600">{formatCurrency(Number(objectif.monthlyContribution))}</span>
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aucun objectif défini</p>
              <Button className="mt-4 bg-blue-600 hover:bg-blue-700" onClick={() => setShowObjectifModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Créer le premier objectif
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Projets Section enrichie */}
      <Card className="border border-gray-200 bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-[#7373FF]" />
            Projets de vie
            <Badge className="bg-[#7373FF]/15 text-indigo-800">{projets.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {projets.length > 0 ? (
            <div className="space-y-4">
              {projets.map((projet) => {
                const typeConfig = OBJECTIF_TYPES[projet.type] || OBJECTIF_TYPES.OTHER
                const TypeIcon = typeConfig.icon
                const statusCfg = OBJECTIF_STATUS[projet.status] || OBJECTIF_STATUS.IN_PROGRESS
                const StatusIcon = statusCfg.icon
                const progress = projet.progress || 0
                const timeRemaining = calculateTimeRemaining(projet.targetDate)

                return (
                  <div key={projet.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
                    {/* Header projet */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', typeConfig.color)}>
                          <TypeIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{projet.name}</h4>
                          <Badge className={cn('text-xs', typeConfig.color)}>
                            {projetTypeLabels[projet.type as keyof typeof projetTypeLabels] || projet.type}
                          </Badge>
                        </div>
                      </div>
                      <Badge className={cn('flex items-center gap-1', statusCfg.color)}>
                        <StatusIcon className="w-3 h-3" />
                        {statusCfg.label}
                      </Badge>
                    </div>

                    {projet.description && (
                      <p className="text-sm text-gray-600">{projet.description}</p>
                    )}

                    {/* Budgets et dates */}
                    <div className="grid gap-3 md:grid-cols-4">
                      <div>
                        <p className="text-xs text-gray-500">Budget estimé</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {projet.estimatedBudget ? formatCurrency(Number(projet.estimatedBudget)) : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Budget réel</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {projet.actualBudget ? formatCurrency(Number(projet.actualBudget)) : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Échéance</p>
                        <p className="text-sm font-medium text-gray-900">
                          {projet.targetDate ? formatDate(projet.targetDate) : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Temps restant</p>
                        <p className={cn(
                          'text-sm font-medium',
                          timeRemaining.status === 'ok' ? 'text-green-600' :
                            timeRemaining.status === 'warning' ? 'text-orange-600' :
                              'text-red-600'
                        )}>
                          <Timer className="w-3 h-3 inline mr-1" />
                          {timeRemaining.label}
                        </p>
                      </div>
                    </div>

                    {/* Barre de progression */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Avancement</span>
                        <span className="font-semibold text-gray-900">{formatPercentage(progress)}</span>
                      </div>
                      <div className="h-3 rounded-full bg-gray-200 overflow-hidden">
                        <div
                          className={cn(
                            'h-full transition-all',
                            progress >= 100 ? 'bg-green-500' :
                              progress >= 75 ? 'bg-[#7373FF]/100' :
                                progress >= 50 ? 'bg-indigo-400' :
                                  'bg-indigo-300'
                          )}
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Dates */}
                    {(projet.startDate || projet.endDate) && (
                      <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t border-gray-200">
                        {projet.startDate && <span>Début : {formatDate(projet.startDate)}</span>}
                        {projet.endDate && <span>Fin prévue : {formatDate(projet.endDate)}</span>}
                      </div>
                    )}

                    {/* Milestones & Risks Toggle - Requirements 11.4, 11.5 */}
                    {(((projet as any).milestones && (projet as any).milestones.length > 0) || ((projet as any).risks && (projet as any).risks.length > 0)) && (
                      <div className="pt-2 border-t border-gray-200">
                        <button
                          onClick={() => toggleProjectExpanded(projet.id)}
                          className="flex items-center gap-2 text-sm text-[#7373FF] hover:text-indigo-800"
                        >
                          {expandedProjects.has(projet.id) ? (
                            <>
                              <ChevronUp className="w-4 h-4" />
                              Masquer les détails
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-4 h-4" />
                              Voir jalons et risques
                            </>
                          )}
                        </button>

                        {expandedProjects.has(projet.id) && (
                          <div className="mt-3 space-y-4">
                            {/* Milestones Section - Requirement 11.4 */}
                            {(projet as any).milestones && (projet as any).milestones.length > 0 && (
                              <div>
                                <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                  <Flag className="w-4 h-4 text-[#7373FF]" />
                                  Jalons ({((projet as any).milestones as { isAchieved?: boolean; completed?: boolean }[]).filter((m) => m.isAchieved || m.completed).length}/{(projet as any).milestones.length})
                                </h5>
                                <div className="space-y-2">
                                  {((projet as any).milestones as { id?: string; isAchieved?: boolean; completed?: boolean; title?: string; name?: string; date?: string; targetDate?: string }[]).map((milestone, idx: number) => {
                                    const isAchieved = milestone.isAchieved || milestone.completed
                                    return (
                                      <div
                                        key={milestone.id || idx}
                                        className={cn(
                                          'flex items-center gap-3 p-2 rounded-lg',
                                          isAchieved ? 'bg-green-50' : 'bg-gray-100'
                                        )}
                                      >
                                        {isAchieved ? (
                                          <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                                        ) : (
                                          <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                        )}
                                        <div className="flex-1 min-w-0">
                                          <p className={cn(
                                            'text-sm',
                                            isAchieved ? 'text-green-800' : 'text-gray-700'
                                          )}>
                                            {milestone.title || milestone.name}
                                          </p>
                                          {(milestone.date || milestone.targetDate) && (
                                            <p className="text-xs text-gray-500">
                                              {formatDate(milestone.date || milestone.targetDate)}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Risks Section - Requirement 11.5 */}
                            {(projet as any).risks && (projet as any).risks.length > 0 && (
                              <div>
                                <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                                  Risques identifiés ({(projet as any).risks.length})
                                </h5>
                                <div className="space-y-2">
                                  {((projet as any).risks as { id?: string; severity?: string; description?: string; mitigation?: string }[]).map((risk, idx: number) => {
                                    const severityColors: Record<string, string> = {
                                      HIGH: 'bg-red-50 border-red-200',
                                      MEDIUM: 'bg-orange-50 border-orange-200',
                                      LOW: 'bg-yellow-50 border-yellow-200',
                                    }
                                    const severityLabels: Record<string, string> = {
                                      HIGH: 'Élevé',
                                      MEDIUM: 'Moyen',
                                      LOW: 'Faible',
                                    }
                                    return (
                                      <div
                                        key={risk.id || idx}
                                        className={cn(
                                          'p-2 rounded-lg border',
                                          severityColors[risk.severity] || severityColors.MEDIUM
                                        )}
                                      >
                                        <div className="flex items-start justify-between gap-2">
                                          <p className="text-sm text-gray-700">{risk.description}</p>
                                          <Badge className={cn(
                                            'text-xs flex-shrink-0',
                                            risk.severity === 'HAUTE' ? 'bg-red-100 text-red-800' :
                                              risk.severity === 'BASSE' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-orange-100 text-orange-800'
                                          )}>
                                            {severityLabels[risk.severity] || 'Moyen'}
                                          </Badge>
                                        </div>
                                        {risk.mitigation && (
                                          <p className="text-xs text-gray-500 mt-1">
                                            <span className="font-medium">Mitigation:</span> {risk.mitigation}
                                          </p>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aucun projet en cours</p>
              <Button className="mt-4 bg-indigo-600 hover:bg-indigo-700" onClick={() => setShowProjetModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Créer le premier projet
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Timeline Section - Requirement 11.4 */}
      <Card className="border border-gray-200 bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-gray-600" />
            Historique des événements
            <Badge className="bg-gray-100 text-gray-800">{timeline.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {timeline.length > 0 ? (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

              <div className="space-y-4">
                {timeline.map((event, idx: number) => {
                  const eventTypeConfig: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
                    GOAL_ACHIEVED: { icon: CheckCircle2, color: 'bg-green-100 text-green-600' },
                    OTHER: { icon: Flag, color: 'bg-blue-100 text-blue-600' },
                    CLIENT_CREATED: { icon: Users, color: 'bg-purple-100 text-purple-600' },
                    MEETING_HELD: { icon: Calendar, color: 'bg-[#7373FF]/15 text-[#7373FF]' },
                    DOCUMENT_SIGNED: { icon: CheckCircle, color: 'bg-emerald-100 text-emerald-600' },
                  }
                  const config = eventTypeConfig[event.type] || eventTypeConfig.OTHER
                  const EventIcon = config.icon

                  return (
                    <div key={event.id || idx} className="relative pl-10">
                      {/* Timeline dot */}
                      <div className={cn(
                        'absolute left-2 w-5 h-5 rounded-full flex items-center justify-center',
                        config.color
                      )}>
                        <EventIcon className="w-3 h-3" />
                      </div>

                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{event.title}</p>
                            {event.description && (
                              <p className="text-xs text-gray-600 mt-1">{event.description}</p>
                            )}
                          </div>
                          <span className="text-xs text-gray-500 flex-shrink-0">
                            {formatDate((event as any).eventDate || (event as any).createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aucun événement enregistré</p>
              <p className="text-sm text-gray-500 mt-1">
                Les événements liés aux objectifs et projets apparaîtront ici
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <CreateObjectifModal
        open={showObjectifModal}
        onClose={() => setShowObjectifModal(false)}
        clientId={clientId}
        onSuccess={handleObjectifSuccess}
      />

      <CreateProjetModal
        open={showProjetModal}
        onClose={() => setShowProjetModal(false)}
        clientId={clientId}
        onSuccess={handleProjetSuccess}
      />
    </div>
  )
}
