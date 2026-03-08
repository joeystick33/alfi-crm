'use client'

/**
 * TabVueEnsemble - Vue d'ensemble complète du Client 360
 * 
 * Fusion de Overview + Synthèse pour une vision unifiée:
 * - Valeur totale du patrimoine avec graphique de répartition
 * - Évolution du patrimoine dans le temps
 * - Synthèse des actifs, passifs, contrats
 * - Synthèse du budget et de la fiscalité
 * - Résumé des objectifs et projets en cours
 * - Alertes prioritaires (documents expirants, échéances, opportunités)
 * - Actions rapides réelles et fonctionnelles
 * 
 * Design: Thème light solid (pas de glassmorphism)
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/_common/components/ui/Card'
import { Button } from '@/app/_common/components/ui/Button'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Progress } from '@/app/_common/components/ui/Progress'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import { formatCurrency, formatPercentage, formatDate } from '@/app/_common/lib/utils'
import { formatLabel } from '@/app/_common/lib/labels'
import { useToast } from '@/app/_common/hooks/use-toast'
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  Home,
  Briefcase,
  Calculator,
  FileText,
  Target,
  AlertCircle,
  AlertTriangle,
  Info,
  ChevronRight,
  Plus,
  RefreshCw,
  FileDown,
  Edit,
  Calendar,
  CreditCard,
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area,
} from 'recharts'
import type { ClientDetail, WealthSummary } from '@/app/_common/lib/api-types'
import { useBudgetSummary } from '../../../hooks/useBudgetSummary'
import { useFiscaliteSummary } from '../../../hooks/useFiscaliteSummary'
import { usePatrimoineSummary } from '../../../hooks/usePatrimoineSummary'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/app/_common/components/ui/Dialog'
import ActifFormWizard from '../../patrimoine/ActifFormWizard'
import { BilanPatrimonialWizard } from '../modals'

// =============================================================================
// Types
// =============================================================================

interface TabVueEnsembleProps {
  clientId: string
  client: ClientDetail
  wealth?: WealthSummary
  onTabChange?: (tabId: string) => void
}

interface VueEnsembleData {
  patrimoine: {
    patrimoineBrut: number
    patrimoineNet: number
    totalActifs: number
    totalPassifs: number
    patrimoineGere: number
    patrimoineNonGere: number
    tauxGestion: number
    repartition: {
      category: string
      value: number
      percentage: number
      color: string
    }[]
    evolution: {
      date: string
      value: number
      actifs: number
      passifs: number
    }[]
  }
  budget: {
    revenusMensuels: number
    chargesMensuelles: number
    capaciteEpargne: number
    tauxEpargne: number
    tauxEndettement: number
    mensualitesCredits?: number
    endettementStatus?: string
  }
  fiscalite: {
    irEstime: number
    ifiEstime: number
    tmi: string
    partsAffectees: number
  }
  contrats: {
    total: number
    assuranceVie: number
    retraite: number
    prevoyance: number
    valeurTotale: number
  }
  objectifs: {
    id: string
    name: string
    type: string
    progress: number
    targetAmount: number
    currentAmount: number
    targetDate: string | null
    status: 'ON_TRACK' | 'AT_RISK' | 'EN_RETARD' | 'TERMINE'
  }[]
  projets: {
    id: string
    name: string
    type: string
    status: string
    progress: number
  }[]
  alertes: {
    id: string
    type: 'CRITIQUE' | 'WARNING' | 'INFO'
    category: string
    title: string
    message: string
    actionLabel?: string
    actionTab?: string
  }[]
  lastUpdate: string
  dataCompleteness: number
}

// =============================================================================
// Constants
// =============================================================================

const CHART_COLORS = {
  immobilier: '#3B82F6',
  financier: '#10B981',
  epargneSalariale: '#6366F1',
  epargneRetraite: '#F97316',
  professionnel: '#F59E0B',
  mobilier: '#FBBF24',
  autre: '#8B5CF6',
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
}

const CATEGORY_ICONS: Record<string, typeof Home> = {
  IMMOBILIER: Home,
  FINANCIER: PiggyBank,
  EPARGNE_SALARIALE: Briefcase,
  EPARGNE_RETRAITE: TrendingUp,
  PROFESSIONNEL: Briefcase,
  MOBILIER: Wallet,
  AUTRE: Wallet,
}

// Barème IR 2024 - Même que TabFiscaliteComplete
const IR_BRACKETS_2024 = [
  { min: 0, max: 11294, rate: 0 },
  { min: 11294, max: 28797, rate: 11 },
  { min: 28797, max: 82341, rate: 30 },
  { min: 82341, max: 177106, rate: 41 },
  { min: 177106, max: Infinity, rate: 45 },
]

// Calcul du TMI basé sur le revenu imposable et les parts fiscales
function calculateTMI(revenuAnnuel: number, partsFiscales: number): { tmi: number; irEstime: number } {
  if (revenuAnnuel <= 0) return { tmi: 0, irEstime: 0 }

  // Abattement 10% sur salaires (plafonné)
  const revenuNetImposable = revenuAnnuel * 0.9
  const quotientFamilial = revenuNetImposable / partsFiscales

  let impotBrut = 0
  let tmi = 0

  for (const bracket of IR_BRACKETS_2024) {
    if (quotientFamilial > bracket.min) {
      const taxableInBracket = Math.min(quotientFamilial, bracket.max) - bracket.min
      impotBrut += taxableInBracket * (bracket.rate / 100)
      tmi = bracket.rate
    }
  }

  const irEstime = Math.round(impotBrut * partsFiscales)
  return { tmi, irEstime }
}

// =============================================================================
// Component
// =============================================================================

export function TabVueEnsemble({ clientId, client, wealth, onTabChange }: TabVueEnsembleProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [data, setData] = useState<VueEnsembleData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'monthly' | 'yearly'>('monthly')
  const [showActifModal, setShowActifModal] = useState(false)
  const [showBilanWizard, setShowBilanWizard] = useState(false)

  // 🔌 HOOKS PARTAGÉS - Réutilisent la même logique que les autres tabs
  const budgetSummary = useBudgetSummary(
    clientId,
    client.maritalStatus,
    client.numberOfChildren,
    Number(client.annualIncome) || 0,
    client.passifs as Array<Record<string, unknown>>
  )
  const fiscaliteSummary = useFiscaliteSummary(
    clientId,
    client.maritalStatus,
    client.numberOfChildren,
    client.familyMembers as Array<{ relationship?: string; isFiscalDependent?: boolean; gardeAlternee?: boolean }>,
    Number(client.annualIncome) || 0,
    client.profession
  )
  const patrimoineSummary = usePatrimoineSummary(clientId)

  // Déterminer si les données sont en cours de chargement
  const hooksLoading = budgetSummary.isLoading || fiscaliteSummary.isLoading || patrimoineSummary.isLoading

  // Extraire les valeurs des hooks pour forcer le recalcul du useMemo
  // (évite le problème de référence d'objet qui ne change pas)
  const budgetValues = {
    totalRevenus: budgetSummary.totalRevenus,
    totalCharges: budgetSummary.totalCharges,
    totalDettes: budgetSummary.totalDettes,
    solde: budgetSummary.solde,
    tauxEpargne: budgetSummary.tauxEpargne,
    tauxEndettement: budgetSummary.tauxEndettement,
    endettementStatus: budgetSummary.endettementStatus,
    hasData: budgetSummary.hasData,
  }
  const fiscaliteValues = {
    irEstime: fiscaliteSummary.irEstime,
    tmiLabel: fiscaliteSummary.tmiLabel,
    tauxEffectif: fiscaliteSummary.tauxEffectif,
    revenuNetImposable: fiscaliteSummary.revenuNetImposable,
    partsFiscales: fiscaliteSummary.partsFiscales,
    ifiEstime: fiscaliteSummary.ifiEstime,
    ifiAssujetti: fiscaliteSummary.ifiAssujetti,
    hasData: fiscaliteSummary.hasData,
  }
  const patrimoineValues = {
    totalActifs: patrimoineSummary.totalActifs,
    totalPassifs: patrimoineSummary.totalPassifs,
    patrimoineNet: patrimoineSummary.patrimoineNet,
    actifsByCategory: patrimoineSummary.actifsByCategory,
    contrats: patrimoineSummary.contrats,
    evolution: patrimoineSummary.evolution,
    hasData: patrimoineSummary.hasData,
  }

  // Fusionner les données des hooks partagés
  // IMPORTANT: Ce useMemo doit se recalculer quand les hooks changent
  const enrichedData = useMemo(() => {
    if (!data) return null

    // Helper pour éviter NaN - retourne 0 si la valeur est NaN ou undefined
    const safeNumber = (val: number | undefined | null, fallback = 0): number => {
      if (val === undefined || val === null || isNaN(val)) return fallback
      return val
    }

    // Construire la répartition du patrimoine
    // Utiliser les données du hook si disponibles, sinon fallback sur data.patrimoine
    const hookRepartition = Object.entries(patrimoineValues.actifsByCategory)
    const hasHookRepartition = hookRepartition.length > 0 && patrimoineValues.totalActifs > 0

    const repartition = hasHookRepartition && patrimoineValues.hasData
      ? hookRepartition.map(([category, value]) => ({
        category,
        value: safeNumber(value),
        percentage: patrimoineValues.totalActifs > 0 ? (safeNumber(value) / patrimoineValues.totalActifs) * 100 : 0,
        color: CHART_COLORS[category.toLowerCase() as keyof typeof CHART_COLORS] || CHART_COLORS.autre,
      }))
      : data.patrimoine.repartition // Utiliser les données de l'API si le hook est vide

    // Construire l'évolution du patrimoine avec des dates ISO valides
    const evolutionData = patrimoineValues.hasData && patrimoineValues.evolution.length > 0
      ? patrimoineValues.evolution.map((e, i) => ({
        date: e.month, // Maintenant c'est une date ISO
        value: safeNumber(e.value),
        actifs: safeNumber(patrimoineValues.totalActifs) * (0.95 + i * 0.005),
        passifs: safeNumber(patrimoineValues.totalPassifs),
      }))
      : data.patrimoine.evolution // Fallback sur les données de l'API

    // Utiliser les données des hooks partagés qui réutilisent la même logique que les autres tabs
    // IMPORTANT: Utiliser les valeurs extraites (budgetValues, fiscaliteValues, patrimoineValues)
    // pour garantir que useMemo détecte les changements
    return {
      ...data,
      patrimoine: {
        ...data.patrimoine,
        // Données du hook patrimoine (même logique que TabPatrimoineReporting)
        patrimoineBrut: patrimoineValues.hasData ? safeNumber(patrimoineValues.totalActifs, data.patrimoine.patrimoineBrut) : data.patrimoine.patrimoineBrut,
        patrimoineNet: patrimoineValues.hasData ? safeNumber(patrimoineValues.patrimoineNet, data.patrimoine.patrimoineNet) : data.patrimoine.patrimoineNet,
        totalActifs: patrimoineValues.hasData ? safeNumber(patrimoineValues.totalActifs, data.patrimoine.totalActifs) : data.patrimoine.totalActifs,
        totalPassifs: patrimoineValues.hasData ? safeNumber(patrimoineValues.totalPassifs, data.patrimoine.totalPassifs) : data.patrimoine.totalPassifs,
        repartition: patrimoineValues.hasData ? repartition : data.patrimoine.repartition,
        evolution: patrimoineValues.hasData ? evolutionData : data.patrimoine.evolution,
      },
      budget: {
        ...data.budget,
        // Données du hook budget (même logique que TabBudgetComplet) – toujours source de vérité
        revenusMensuels: safeNumber(budgetValues.totalRevenus, data.budget.revenusMensuels),
        chargesMensuelles: safeNumber(budgetValues.totalCharges, data.budget.chargesMensuelles),
        capaciteEpargne: safeNumber(budgetValues.solde, data.budget.capaciteEpargne),
        tauxEpargne: safeNumber(budgetValues.tauxEpargne, data.budget.tauxEpargne),
        tauxEndettement: safeNumber(budgetValues.tauxEndettement, data.budget.tauxEndettement),
        mensualitesCredits: safeNumber(budgetValues.totalDettes, data.budget?.mensualitesCredits ?? 0),
        endettementStatus: budgetValues.endettementStatus || data.budget?.endettementStatus || 'success',
      },
      fiscalite: {
        ...data.fiscalite,
        // Données du hook fiscalité (même logique que TabFiscaliteComplete)
        irEstime: fiscaliteValues.hasData ? safeNumber(fiscaliteValues.irEstime, data.fiscalite.irEstime) : data.fiscalite.irEstime,
        tmi: fiscaliteValues.hasData ? (fiscaliteValues.tmiLabel || data.fiscalite.tmi) : data.fiscalite.tmi,
        tauxEffectif: fiscaliteValues.hasData ? safeNumber(fiscaliteValues.tauxEffectif, 0) : 0,
        revenuImposable: fiscaliteValues.hasData ? safeNumber(fiscaliteValues.revenuNetImposable, 0) : 0,
        partsAffectees: fiscaliteValues.hasData ? safeNumber(fiscaliteValues.partsFiscales, data.fiscalite.partsAffectees) : data.fiscalite.partsAffectees,
        ifiEstime: fiscaliteValues.hasData ? safeNumber(fiscaliteValues.ifiEstime, data.fiscalite.ifiEstime) : data.fiscalite.ifiEstime,
        ifiAssujetti: fiscaliteValues.hasData ? fiscaliteValues.ifiAssujetti : false,
      },
      contrats: patrimoineValues.hasData && patrimoineValues.contrats.total > 0 ? patrimoineValues.contrats : data.contrats,
      // Métadonnées
      calculatorsReady: !hooksLoading && (budgetValues.hasData || fiscaliteValues.hasData || patrimoineValues.hasData),
      calculatorsLastUpdate: new Date(),
    }
    // Dépendances: utiliser les valeurs primitives extraites pour garantir le recalcul
  }, [
    data,
    hooksLoading,
    // Budget values (primitives)
    budgetValues.totalRevenus,
    budgetValues.totalCharges,
    budgetValues.totalDettes,
    budgetValues.solde,
    budgetValues.tauxEpargne,
    budgetValues.tauxEndettement,
    budgetValues.endettementStatus,
    budgetValues.hasData,
    // Fiscalite values (primitives)
    fiscaliteValues.irEstime,
    fiscaliteValues.tmiLabel,
    fiscaliteValues.tauxEffectif,
    fiscaliteValues.revenuNetImposable,
    fiscaliteValues.partsFiscales,
    fiscaliteValues.ifiEstime,
    fiscaliteValues.ifiAssujetti,
    fiscaliteValues.hasData,
    // Patrimoine values (primitives + refs stables)
    patrimoineValues.totalActifs,
    patrimoineValues.totalPassifs,
    patrimoineValues.patrimoineNet,
    patrimoineValues.actifsByCategory,
    patrimoineValues.contrats,
    patrimoineValues.evolution,
    patrimoineValues.hasData,
  ])

  // Fetch overview data
  const fetchData = useCallback(async (forceRefresh = false) => {
    if (forceRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    setError(null)

    try {
      // Fetch from synthesis endpoint which provides comprehensive data
      const response = await fetch(`/api/advisor/clients/${clientId}/overview`, {
        method: 'GET',
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des données')
      }

      const result = await response.json()

      // Transform and merge with wealth data if available
      const transformedData = transformApiData(result.data, wealth, client)
      setData(transformedData)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
      setError(errorMessage)

      // Fallback to wealth prop data if API fails
      if (wealth) {
        const fallbackData = createFallbackData(wealth, client)
        setData(fallbackData)
        setError(null)
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [clientId, wealth, client])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Handle navigation to other tabs
  const navigateToTab = useCallback((tabId: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    if (onTabChange) {
      onTabChange(tabId)
    } else {
      console.warn('TabVueEnsemble: onTabChange non défini, navigation vers', tabId, 'impossible')
    }
  }, [onTabChange])

  // Handle quick actions - navigue vers les onglets appropriés
  const handleQuickAction = useCallback((action: string) => {
    switch (action) {
      case 'edit-client':
        // Navigate to profile tab
        navigateToTab('profil')
        break
      case 'add-asset':
        // Ouvrir le formulaire d'ajout d'actif (ActifFormWizard)
        setShowActifModal(true)
        break
      case 'generate-report':
        toast({
          title: 'Génération du rapport',
          description: 'Le rapport patrimonial est en cours de génération...',
        })
        void (async () => {
          try {
            const res = await fetch(`/api/advisor/clients/${clientId}/reports/synthese`, {
              method: 'GET',
              credentials: 'include',
            })

            if (!res.ok) {
              throw new Error('Erreur génération')
            }

            const blob = await res.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `bilan-patrimonial-${client.lastName}-${new Date().toISOString().split('T')[0]}.pdf`
            document.body.appendChild(a)
            a.click()
            a.remove()
            window.URL.revokeObjectURL(url)

            toast({ title: 'Rapport généré', description: 'Le PDF a été téléchargé', variant: 'default' })
          } catch {
            toast({ title: 'Erreur génération', description: 'Impossible de générer le PDF', variant: 'destructive' })
          }
        })()
        break
      case 'add-objective':
        navigateToTab('objectifs')
        break
      default:
        break
    }
  }, [navigateToTab, toast, clientId, client, enrichedData])

  // Loading state - Attendre que les données de base ET les hooks soient prêts
  // pour éviter l'affichage de valeurs à 0 avant que les hooks ne chargent
  const isInitialLoading = loading || (hooksLoading && !enrichedData?.calculatorsReady)

  if (isInitialLoading && !data) {
    return <VueEnsembleSkeleton />
  }

  // Error state (only if no fallback data)
  if (error && !data) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-8 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-destructive mb-2">Erreur de chargement</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={() => fetchData()} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Réessayer
        </Button>
      </div>
    )
  }

  if (!enrichedData) {
    // Si data existe mais enrichedData est null, afficher le skeleton
    // Cela arrive quand les hooks sont en train de charger
    return <VueEnsembleSkeleton />
  }

  return (
    <div className="space-y-8">
      {/* Premium Header - Finary/Mercury inspired */}
      <header className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#7373FF]/10 rounded-xl">
              <LayoutDashboard className="h-5 w-5 text-[#7373FF]" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
                Vue d'ensemble
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Synthèse complète du patrimoine et des indicateurs clés
                {hooksLoading ? (
                  <span className="ml-2 text-amber-600 inline-flex items-center gap-1">
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    Calcul en cours...
                  </span>
                ) : enrichedData.calculatorsReady && (
                  <span className="ml-2 text-emerald-600">• Calculs à jour</span>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Completeness indicator */}
          {enrichedData.dataCompleteness < 100 && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-100 rounded-lg">
              <div className="w-16 h-1.5 bg-amber-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${enrichedData.dataCompleteness}%` }}
                />
              </div>
              <span className="text-xs font-medium text-amber-700">{enrichedData.dataCompleteness}%</span>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Actualiser</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            type="button"
            onClick={() => setShowBilanWizard(true)}
            className="gap-2 bg-[#7373FF] hover:bg-[#5c5ce6]"
          >
            <FileDown className="h-3.5 w-3.5" />
            Créer Bilan
          </Button>
        </div>
      </header>

      {/* Last update timestamp */}
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        Mis à jour {formatDate(enrichedData.lastUpdate)}
        {enrichedData.calculatorsLastUpdate && (
          <span className="text-emerald-500 ml-1">
            (calculs: {new Date(enrichedData.calculatorsLastUpdate).toLocaleTimeString('fr-FR')})
          </span>
        )}
      </div>

      {/* Alertes prioritaires */}
      {enrichedData.alertes.length > 0 && (
        <AlertesSection
          alertes={enrichedData.alertes}
          onNavigate={navigateToTab}
        />
      )}

      {/* KPIs principaux - ENRICHIS PAR LES CALCULATEURS */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Patrimoine net"
          value={formatCurrency(enrichedData.patrimoine.patrimoineNet)}
          subtitle={`Brut: ${formatCurrency(enrichedData.patrimoine.patrimoineBrut)}`}
          icon={Wallet}
          variant="primary"
          trend={enrichedData.patrimoine.patrimoineNet > 0 ? 'up' : undefined}
          onClick={() => navigateToTab('patrimoine')}
        />
        <KPICard
          title="Capacité d'épargne"
          value={formatCurrency(enrichedData.budget.capaciteEpargne)}
          subtitle={`${formatPercentage(enrichedData.budget.tauxEpargne)} des revenus`}
          icon={PiggyBank}
          variant={enrichedData.budget.capaciteEpargne >= 0 ? 'success' : 'danger'}
          onClick={() => navigateToTab('budget')}
        />
        <KPICard
          title="Impôt estimé (IR)"
          value={formatCurrency(enrichedData.fiscalite.irEstime)}
          subtitle={enrichedData.fiscalite.tauxEffectif
            ? `Taux effectif: ${formatPercentage(enrichedData.fiscalite.tauxEffectif)}`
            : `${enrichedData.fiscalite.partsAffectees} part(s) fiscale(s)`
          }
          icon={Calculator}
          variant="default"
          onClick={() => navigateToTab('fiscalite')}
        />
        <KPICard
          title="Taux d'endettement"
          value={formatPercentage(isNaN(enrichedData.budget.tauxEndettement) ? 0 : enrichedData.budget.tauxEndettement)}
          subtitle={`Crédits: ${formatCurrency(enrichedData.budget.mensualitesCredits || 0)}/mois`}
          icon={CreditCard}
          variant={(enrichedData.budget.tauxEndettement || 0) < 33 ? 'success' : (enrichedData.budget.tauxEndettement || 0) < 35 ? 'warning' : 'danger'}
          onClick={() => navigateToTab('budget')}
        />
      </div>


      {/* Graphiques patrimoine */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Répartition du patrimoine */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Répartition du patrimoine</CardTitle>
                <CardDescription>Par catégorie d'actifs</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={(e: React.MouseEvent) => navigateToTab('patrimoine', e)} type="button">
                Détails <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <PatrimonyPieChart
              data={enrichedData.patrimoine.repartition}
              total={enrichedData.patrimoine.patrimoineBrut}
            />
          </CardContent>
        </Card>

        {/* Évolution du patrimoine */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Évolution du patrimoine</CardTitle>
                <CardDescription>Sur les 12 derniers mois</CardDescription>
              </div>
              <div className="flex rounded-lg border p-1 text-sm">
                <button
                  className={`px-3 py-1 rounded transition-colors ${viewMode === 'monthly' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  onClick={() => setViewMode('monthly')}
                >
                  Mensuel
                </button>
                <button
                  className={`px-3 py-1 rounded transition-colors ${viewMode === 'yearly' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  onClick={() => setViewMode('yearly')}
                >
                  Annuel
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <PatrimonyEvolutionChart data={enrichedData.patrimoine.evolution} />
          </CardContent>
        </Card>
      </div>

      {/* Synthèses rapides */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Synthèse Budget */}
        <SyntheseBudgetCard
          budget={enrichedData.budget}
          onNavigate={() => navigateToTab('budget')}
        />

        {/* Synthèse Fiscalité */}
        <SyntheseFiscaliteCard
          fiscalite={enrichedData.fiscalite}
          onNavigate={() => navigateToTab('fiscalite')}
        />

        {/* Synthèse Contrats */}
        <SyntheseContratsCard
          contrats={enrichedData.contrats}
          onNavigate={() => navigateToTab('contrats')}
        />
      </div>

      {/* Objectifs et Projets */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Objectifs prioritaires */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  Objectifs
                </CardTitle>
                <CardDescription>Suivi des objectifs patrimoniaux</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={(e) => navigateToTab('objectifs', e)} type="button">
                Voir tous <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {enrichedData.objectifs.length > 0 ? (
              <div className="space-y-4">
                {enrichedData.objectifs.slice(0, 3).map((obj) => (
                  <ObjectifProgressItem key={obj.id} objectif={obj} />
                ))}
              </div>
            ) : (
              <EmptyStateCard
                icon={Target}
                title="Aucun objectif défini"
                description="Définissez des objectifs pour suivre l'avancement patrimonial"
                actionLabel="Créer un objectif"
                onAction={() => navigateToTab('objectifs')}
              />
            )}
          </CardContent>
        </Card>

        {/* Projets en cours */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-purple-600" />
                  Projets
                </CardTitle>
                <CardDescription>Projets patrimoniaux actifs</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={(e) => navigateToTab('objectifs', e)} type="button">
                Voir tous <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {enrichedData.projets.length > 0 ? (
              <div className="space-y-3">
                {enrichedData.projets.slice(0, 4).map((projet) => (
                  <ProjetItem key={projet.id} projet={projet} />
                ))}
              </div>
            ) : (
              <EmptyStateCard
                icon={Briefcase}
                title="Aucun projet en cours"
                description="Créez des projets pour structurer les actions patrimoniales"
                actionLabel="Créer un projet"
                onAction={() => navigateToTab('objectifs')}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Actions rapides */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Actions rapides</CardTitle>
          <CardDescription>Accédez rapidement aux fonctionnalités principales</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <QuickActionButton
              icon={Edit}
              label="Modifier le profil"
              description="Informations personnelles"
              onClick={() => handleQuickAction('edit-client')}
            />
            <QuickActionButton
              icon={Plus}
              label="Ajouter un actif"
              description="Patrimoine immobilier ou financier"
              onClick={() => handleQuickAction('add-asset')}
            />
            <QuickActionButton
              icon={Target}
              label="Nouvel objectif"
              description="Définir un objectif patrimonial"
              onClick={() => handleQuickAction('add-objective')}
            />
            <QuickActionButton
              icon={FileDown}
              label="Créer un bilan"
              description="Bilan patrimonial complet"
              onClick={() => setShowBilanWizard(true)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Modale d'ajout d'actif - Utilise ActifFormWizard comme dans patrimoine */}
      <Dialog open={showActifModal} onOpenChange={setShowActifModal}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ajouter un actif</DialogTitle>
            <DialogDescription>
              Sélectionnez le type de patrimoine à ajouter
            </DialogDescription>
          </DialogHeader>
          <ActifFormWizard
            mode="create"
            clientId={clientId}
            onSuccess={() => {
              setShowActifModal(false)
              fetchData(true)
              toast({
                title: 'Actif ajouté',
                description: 'L\'actif a été ajouté avec succès',
              })
            }}
            onCancel={() => setShowActifModal(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Wizard Bilan Patrimonial */}
      <BilanPatrimonialWizard
        open={showBilanWizard}
        onClose={() => setShowBilanWizard(false)}
        clientId={clientId}
      />
    </div>
  )
}

// =============================================================================
// Sub-components
// =============================================================================

interface KPICardProps {
  title: string
  value: string
  subtitle: string
  icon: typeof Wallet
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger'
  trend?: 'up' | 'down'
  onClick?: () => void
}

function KPICard({ title, value, subtitle, icon: Icon, variant = 'default', trend, onClick }: KPICardProps) {
  const variantStyles = {
    default: 'border-gray-100 bg-gradient-to-br from-white to-gray-50/50 hover:border-gray-200',
    primary: 'border-[#7373FF]/20 bg-gradient-to-br from-[#7373FF]/5 to-indigo-50/50 hover:border-[#7373FF]/40',
    success: 'border-emerald-100 bg-gradient-to-br from-emerald-50/50 to-green-50/30 hover:border-emerald-200',
    warning: 'border-amber-100 bg-gradient-to-br from-amber-50/50 to-orange-50/30 hover:border-amber-200',
    danger: 'border-red-100 bg-gradient-to-br from-red-50/50 to-rose-50/30 hover:border-red-200',
  }

  const iconStyles = {
    default: 'text-gray-600 bg-gray-100/80',
    primary: 'text-[#7373FF] bg-[#7373FF]/10',
    success: 'text-emerald-600 bg-emerald-100/80',
    warning: 'text-amber-600 bg-amber-100/80',
    danger: 'text-red-600 bg-red-100/80',
  }

  const valueStyles = {
    default: 'text-gray-900',
    primary: 'text-[#7373FF]',
    success: 'text-emerald-700',
    warning: 'text-amber-700',
    danger: 'text-red-700',
  }

  return (
    <Card
      className={`relative overflow-hidden ${variantStyles[variant]} ${onClick ? 'cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200' : ''}`}
      onClick={onClick}
    >
      {/* Decorative gradient overlay */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white/40 to-transparent rounded-bl-full pointer-events-none" />

      <CardContent className="pt-5 pb-5 relative">
        <div className="flex items-start justify-between mb-3">
          <div className={`p-2.5 rounded-xl ${iconStyles[variant]} shadow-sm`}>
            <Icon className="h-5 w-5" />
          </div>
          {trend && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${trend === 'up'
              ? 'text-emerald-700 bg-emerald-100/80'
              : 'text-red-700 bg-red-100/80'
              }`}>
              {trend === 'up' ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              <span>{trend === 'up' ? '+' : '-'}</span>
            </div>
          )}
        </div>
        <div>
          <p className={`text-2xl font-bold tracking-tight ${valueStyles[variant]}`}>{value}</p>
          <p className="text-sm font-medium text-gray-700 mt-1.5">{title}</p>
          <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
        </div>

        {/* Click indicator */}
        {onClick && (
          <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <ChevronRight className="h-4 w-4 text-gray-400" />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface AlertesSectionProps {
  alertes: VueEnsembleData['alertes']
  onNavigate: (tabId: string) => void
}

function AlertesSection({ alertes, onNavigate }: AlertesSectionProps) {
  const getAlertStyle = (type: 'CRITIQUE' | 'WARNING' | 'INFO') => {
    switch (type) {
      case 'CRITIQUE':
        return 'border-red-200 bg-red-50 text-red-800'
      case 'WARNING':
        return 'border-amber-200 bg-amber-50 text-amber-800'
      case 'INFO':
        return 'border-blue-200 bg-blue-50 text-blue-800'
    }
  }

  const getAlertIcon = (type: 'CRITIQUE' | 'WARNING' | 'INFO') => {
    switch (type) {
      case 'CRITIQUE':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case 'WARNING':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />
      case 'INFO':
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  // Sort alerts by severity
  const sortedAlertes = [...alertes].sort((a, b) => {
    const order = { CRITICAL: 0, WARNING: 1, INFO: 2 }
    return order[a.type] - order[b.type]
  })

  return (
    <div className="space-y-2">
      {sortedAlertes.slice(0, 3).map((alerte) => (
        <div
          key={alerte.id}
          className={`flex items-start gap-3 p-4 rounded-lg border ${getAlertStyle(alerte.type)}`}
        >
          {getAlertIcon(alerte.type)}
          <div className="flex-1">
            <p className="font-medium">{alerte.title}</p>
            <p className="text-sm opacity-80 mt-1">{alerte.message}</p>
          </div>
          {alerte.actionTab && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate(alerte.actionTab!)}
              className="shrink-0"
            >
              {alerte.actionLabel || 'Voir'}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
          <Badge variant="outline" className="shrink-0">
            {alerte.category}
          </Badge>
        </div>
      ))}
    </div>
  )
}

interface PatrimonyPieChartProps {
  data: VueEnsembleData['patrimoine']['repartition']
  total: number
}

function PatrimonyPieChart({ data, total }: PatrimonyPieChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-72 flex flex-col items-center justify-center text-muted-foreground bg-gray-50/50 rounded-xl border-2 border-dashed border-gray-200">
        <Wallet className="h-12 w-12 text-gray-300 mb-3" />
        <p className="text-sm font-medium">Aucune donnée de patrimoine</p>
        <p className="text-xs text-gray-400">Ajoutez des actifs pour voir la répartition</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row items-center gap-6">
      {/* Chart */}
      <div className="relative" style={{ minWidth: 220, minHeight: 220 }}>
        <ResponsiveContainer width={220} height={220} minWidth={220} minHeight={220}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={95}
              dataKey="value"
              nameKey="category"
              paddingAngle={2}
              stroke="none"
            >
              {data.map((entry) => (
                <Cell
                  key={entry.category}
                  fill={entry.color}
                  className="drop-shadow-sm hover:opacity-80 transition-opacity cursor-pointer"
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, _name: string, props: { payload?: { category?: string } }) => [formatCurrency(value), formatLabel(props.payload?.category || '')]}
              contentStyle={{
                backgroundColor: 'white',
                border: 'none',
                borderRadius: '12px',
                boxShadow: '0 10px 40px -10px rgba(0,0,0,0.15)',
                padding: '12px 16px'
              }}
              labelStyle={{ fontWeight: 600, marginBottom: 4 }}
            />
          </PieChart>
        </ResponsiveContainer>
        {/* Center total */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total</p>
          <p className="text-lg font-bold text-gray-900">{formatCurrency(total)}</p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-col gap-2 min-w-[160px]">
        {data.map((item) => (
          <div
            key={item.category}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group"
          >
            <div
              className="w-3 h-3 rounded-full ring-2 ring-white shadow-sm"
              style={{ backgroundColor: item.color }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-700 truncate">{formatLabel(item.category)}</p>
              <p className="text-xs text-gray-500">{formatCurrency(item.value)}</p>
            </div>
            <span className="text-xs font-semibold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-full">
              {formatPercentage(item.percentage)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

interface PatrimonyEvolutionChartProps {
  data: VueEnsembleData['patrimoine']['evolution']
}

function PatrimonyEvolutionChart({ data }: PatrimonyEvolutionChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-72 flex flex-col items-center justify-center text-muted-foreground bg-gray-50/50 rounded-xl border-2 border-dashed border-gray-200">
        <TrendingUp className="h-12 w-12 text-gray-300 mb-3" />
        <p className="text-sm font-medium">Aucune donnée d'évolution</p>
        <p className="text-xs text-gray-400">L'historique sera disponible prochainement</p>
      </div>
    )
  }

  // Calculate trend
  const firstValue = data[0]?.value || 0
  const lastValue = data[data.length - 1]?.value || 0
  const trend = firstValue > 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0
  const isPositive = trend >= 0

  return (
    <div className="space-y-4">
      {/* Trend indicator */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${isPositive
            ? 'text-emerald-700 bg-emerald-100'
            : 'text-red-700 bg-red-100'
            }`}>
            {isPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            {isPositive ? '+' : ''}{trend.toFixed(1)}%
          </div>
          <span className="text-xs text-gray-500">sur 12 mois</span>
        </div>
        <span className="text-sm font-semibold text-gray-900">{formatCurrency(lastValue)}</span>
      </div>

      {/* Chart */}
      <div style={{ width: '100%', height: 224 }}>
        <ResponsiveContainer width="100%" height={224}>
          <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <defs>
              <linearGradient id="patrimoineGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7373FF" stopOpacity={0.3} />
                <stop offset="50%" stopColor="#7373FF" stopOpacity={0.1} />
                <stop offset="100%" stopColor="#7373FF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e5e7eb"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#6b7280' }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString('fr-FR', { month: 'short' })
              }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#6b7280' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              width={45}
            />
            <Tooltip
              formatter={(value: number) => [formatCurrency(value), 'Patrimoine']}
              contentStyle={{
                backgroundColor: 'white',
                border: 'none',
                borderRadius: '12px',
                boxShadow: '0 10px 40px -10px rgba(0,0,0,0.15)',
                padding: '12px 16px'
              }}
              labelFormatter={(label) => {
                const date = new Date(label)
                return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
              }}
              cursor={{ stroke: '#7373FF', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#7373FF"
              strokeWidth={2.5}
              fill="url(#patrimoineGradient)"
              name="Patrimoine"
              dot={false}
              activeDot={{ r: 6, fill: '#7373FF', stroke: 'white', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

interface SyntheseBudgetCardProps {
  budget: VueEnsembleData['budget']
  onNavigate: () => void
}

function SyntheseBudgetCard({ budget, onNavigate }: SyntheseBudgetCardProps) {
  // Protection contre NaN/undefined
  const safeEndettement = isNaN(budget.tauxEndettement) || budget.tauxEndettement === undefined ? 0 : budget.tauxEndettement
  const endettementStatus = safeEndettement > 35 ? 'danger' : safeEndettement > 30 ? 'warning' : 'success'
  const tauxEpargne = budget.revenusMensuels > 0 ? (budget.capaciteEpargne / budget.revenusMensuels) * 100 : 0
  const mensualitesCredits = budget.mensualitesCredits || 0

  return (
    <Card
      className="cursor-pointer border-emerald-100 bg-gradient-to-br from-white to-emerald-50/30 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group"
      onClick={onNavigate}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-100">
              <PiggyBank className="h-4 w-4 text-emerald-600" />
            </div>
            <span className="font-semibold">Budget mensuel</span>
          </CardTitle>
          <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-emerald-50 rounded-xl">
            <p className="text-xs text-emerald-600 font-medium mb-1">Revenus</p>
            <p className="text-lg font-bold text-emerald-700">{formatCurrency(budget.revenusMensuels)}</p>
          </div>
          <div className="p-3 bg-red-50 rounded-xl">
            <p className="text-xs text-red-600 font-medium mb-1">Charges</p>
            <p className="text-lg font-bold text-red-700">{formatCurrency(budget.chargesMensuelles)}</p>
          </div>
        </div>

        {/* Mensualités crédits */}
        {mensualitesCredits > 0 && (
          <div className="p-3 bg-amber-50 rounded-xl">
            <p className="text-xs text-amber-600 font-medium mb-1">Mensualités crédits</p>
            <p className="text-lg font-bold text-amber-700">{formatCurrency(mensualitesCredits)}</p>
          </div>
        )}

        {/* Épargne highlight */}
        <div className="p-3 bg-gradient-to-r from-[#7373FF]/10 to-indigo-50 rounded-xl border border-[#7373FF]/20">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-[#7373FF] font-medium">Capacité d'épargne</p>
              <p className={`text-xl font-bold ${budget.capaciteEpargne >= 0 ? 'text-[#7373FF]' : 'text-red-600'}`}>
                {formatCurrency(budget.capaciteEpargne)}
              </p>
            </div>
            <div className={`px-2.5 py-1 rounded-full text-xs font-semibold ${tauxEpargne >= 20 ? 'bg-emerald-100 text-emerald-700' :
              tauxEpargne >= 10 ? 'bg-amber-100 text-amber-700' :
                'bg-red-100 text-red-700'
              }`}>
              {tauxEpargne.toFixed(0)}%
            </div>
          </div>
        </div>

        {/* Endettement */}
        <div>
          <div className="flex justify-between text-xs mb-2">
            <span className="text-gray-500 font-medium">Taux d'endettement</span>
            <span className={`font-semibold ${endettementStatus === 'danger' ? 'text-red-600' :
              endettementStatus === 'warning' ? 'text-amber-600' :
                'text-emerald-600'
              }`}>
              {formatPercentage(safeEndettement)}
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${endettementStatus === 'danger' ? 'bg-red-500' :
                endettementStatus === 'warning' ? 'bg-amber-500' :
                  'bg-emerald-500'
                }`}
              style={{ width: `${Math.min(Math.max(safeEndettement * 2, 0), 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-gray-400 mt-1">
            <span>0%</span>
            <span className="text-amber-500">33%</span>
            <span>50%</span>
          </div>
          {/* Détail du calcul */}
          {mensualitesCredits > 0 && (
            <p className="text-[10px] text-gray-500 mt-2">
              {formatCurrency(mensualitesCredits)} crédits / {formatCurrency(budget.revenusMensuels)} revenus
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface SyntheseFiscaliteCardProps {
  fiscalite: VueEnsembleData['fiscalite'] & { tauxEffectif?: number; revenuImposable?: number }
  onNavigate: () => void
}

function SyntheseFiscaliteCard({ fiscalite, onNavigate }: SyntheseFiscaliteCardProps) {
  const tauxEffectif = fiscalite.tauxEffectif || 0
  const mensualite = Math.round((fiscalite.irEstime || 0) / 12)

  return (
    <Card
      className="cursor-pointer border-purple-100 bg-gradient-to-br from-white to-purple-50/30 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group"
      onClick={onNavigate}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-100">
              <Calculator className="h-4 w-4 text-purple-600" />
            </div>
            <span className="font-semibold">Fiscalité</span>
          </CardTitle>
          <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* IR Annuel - KPI principal */}
        <div className="p-3 bg-gradient-to-r from-purple-100/50 to-purple-50 rounded-xl">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-purple-600 font-medium">IR annuel estimé</p>
              <p className="text-xl font-bold text-purple-700">{formatCurrency(fiscalite.irEstime)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-purple-500">soit</p>
              <p className="text-sm font-semibold text-purple-600">{formatCurrency(mensualite)}/mois</p>
            </div>
          </div>
        </div>

        {/* Indicateurs clés - comme TabFiscaliteComplete */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <p className="text-lg font-bold text-indigo-600">{fiscalite.tmi || '0%'}</p>
            <p className="text-[10px] text-gray-500">TMI</p>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <p className="text-lg font-bold text-blue-600">{formatPercentage(tauxEffectif)}</p>
            <p className="text-[10px] text-gray-500">Taux effectif</p>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <p className="text-lg font-bold text-purple-600">{fiscalite.partsAffectees || 1}</p>
            <p className="text-[10px] text-gray-500">Parts</p>
          </div>
        </div>

        {/* IFI */}
        <div className="flex justify-between items-center p-2.5 bg-gray-50 rounded-xl">
          <div className="flex items-center gap-2">
            <p className="text-xs text-gray-500 font-medium">IFI</p>
            {fiscalite.ifiEstime > 0 && (
              <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px]">Assujetti</Badge>
            )}
          </div>
          <p className="text-sm font-bold text-gray-900">
            {fiscalite.ifiEstime > 0 ? formatCurrency(fiscalite.ifiEstime) : 'Non assujetti'}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

interface SyntheseContratsCardProps {
  contrats: VueEnsembleData['contrats']
  onNavigate: () => void
}

function SyntheseContratsCard({ contrats, onNavigate }: SyntheseContratsCardProps) {
  const typeData = [
    { label: 'Assurance-vie', count: contrats.assuranceVie, color: 'bg-blue-500' },
    { label: 'Retraite', count: contrats.retraite, color: 'bg-purple-500' },
    { label: 'Prévoyance', count: contrats.prevoyance, color: 'bg-emerald-500' },
  ].filter(t => t.count > 0)

  return (
    <Card
      className="cursor-pointer border-blue-100 bg-gradient-to-br from-white to-blue-50/30 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group"
      onClick={onNavigate}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-100">
              <FileText className="h-4 w-4 text-blue-600" />
            </div>
            <span className="font-semibold">Contrats</span>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className="bg-blue-100 text-blue-700 border-blue-200">{contrats.total}</Badge>
            <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Types de contrats */}
        <div className="space-y-2">
          {typeData.map((type) => (
            <div key={type.label} className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${type.color}`} />
              <span className="text-sm text-gray-600 flex-1">{type.label}</span>
              <span className="text-sm font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-full">
                {type.count}
              </span>
            </div>
          ))}
          {typeData.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-2">Aucun contrat</p>
          )}
        </div>

        {/* Valeur totale */}
        <div className="p-4 bg-gradient-to-r from-blue-100/50 to-blue-50 rounded-xl text-center">
          <p className="text-xs text-blue-600 font-medium mb-1">Valeur totale</p>
          <p className="text-2xl font-bold text-blue-700">{formatCurrency(contrats.valeurTotale)}</p>
        </div>

        {/* Mini chart */}
        {typeData.length > 0 && (
          <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-gray-100">
            {typeData.map((type) => (
              <div
                key={type.label}
                className={`${type.color} transition-all duration-500`}
                style={{ width: `${(type.count / contrats.total) * 100}%` }}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface ObjectifProgressItemProps {
  objectif: VueEnsembleData['objectifs'][0]
}

function ObjectifProgressItem({ objectif }: ObjectifProgressItemProps) {
  const statusConfig = {
    ON_TRACK: { label: 'En bonne voie', className: 'bg-green-100 text-green-700' },
    AT_RISK: { label: 'À surveiller', className: 'bg-amber-100 text-amber-700' },
    OVERDUE: { label: 'En retard', className: 'bg-red-100 text-red-700' },
    TERMINE: { label: 'Atteint', className: 'bg-blue-100 text-blue-700' },
  }

  const config = statusConfig[objectif.status]

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm">{objectif.name}</span>
        <Badge className={config.className}>{config.label}</Badge>
      </div>
      <div className="flex items-center gap-2">
        <Progress value={objectif.progress} className="flex-1 h-2" />
        <span className="text-xs text-muted-foreground w-10 text-right">
          {formatPercentage(objectif.progress)}
        </span>
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{formatCurrency(objectif.currentAmount)} / {formatCurrency(objectif.targetAmount)}</span>
        {objectif.targetDate && (
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(objectif.targetDate)}
          </span>
        )}
      </div>
    </div>
  )
}

interface ProjetItemProps {
  projet: VueEnsembleData['projets'][0]
}

function ProjetItem({ projet }: ProjetItemProps) {
  const statusColors: Record<string, string> = {
    IN_PROGRESS: 'bg-blue-100 text-blue-700',
    PLANNED: 'bg-amber-100 text-amber-700',
    COMPLETED: 'bg-green-100 text-green-700',
    DRAFT: 'bg-gray-100 text-gray-700',
  }

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex-1">
        <p className="font-medium text-sm">{projet.name}</p>
        <p className="text-xs text-muted-foreground">{projet.type}</p>
      </div>
      <div className="flex items-center gap-2">
        <Progress value={projet.progress} className="w-20 h-2" />
        <Badge className={statusColors[projet.status] || 'bg-gray-100 text-gray-700'}>
          {projet.status === 'EN_COURS' ? 'En cours' :
            projet.status === 'PLANIFIE' ? 'Planifié' :
              projet.status === 'TERMINE' ? 'Terminé' : projet.status}
        </Badge>
      </div>
    </div>
  )
}

interface QuickActionButtonProps {
  icon: typeof Edit
  label: string
  description: string
  onClick: () => void
}

function QuickActionButton({ icon: Icon, label, description, onClick }: QuickActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-start gap-3 p-4 rounded-lg border bg-white hover:bg-gray-50 hover:border-primary/50 transition-colors text-left w-full"
    >
      <div className="p-2 rounded-lg bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <p className="font-medium text-sm">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </button>
  )
}

interface EmptyStateCardProps {
  icon: typeof Target
  title: string
  description: string
  actionLabel: string
  onAction: () => void
}

function EmptyStateCard({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateCardProps) {
  return (
    <div className="text-center py-8 border-2 border-dashed rounded-lg">
      <Icon className="h-12 w-12 mx-auto mb-3 opacity-50 text-muted-foreground" />
      <p className="font-medium text-sm text-muted-foreground mb-1">{title}</p>
      <p className="text-xs text-muted-foreground mb-4">{description}</p>
      <Button size="sm" variant="outline" onClick={onAction}>
        <Plus className="h-4 w-4 mr-2" />
        {actionLabel}
      </Button>
    </div>
  )
}

function VueEnsembleSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-36" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-64" />
        ))}
      </div>
    </div>
  )
}

// =============================================================================
// Helpers
// =============================================================================

function transformApiData(
  apiData: Record<string, unknown> | undefined,
  wealth: WealthSummary | undefined,
  client: ClientDetail
): VueEnsembleData {
  // Cast apiData properties with proper types
  const patrimonyData = apiData?.patrimony as { totalGross?: number; totalNet?: number; allocation?: VueEnsembleData['patrimoine']['repartition']; evolution?: VueEnsembleData['patrimoine']['evolution'] } | undefined
  const indicatorsData = apiData?.indicators as { currentTaxation?: number } | undefined
  const budgetData = apiData?.budget as VueEnsembleData['budget'] | undefined
  const fiscaliteData = apiData?.fiscalite as VueEnsembleData['fiscalite'] | undefined

  // Default patrimoine from wealth summary
  const patrimoine = {
    patrimoineBrut: wealth?.totalActifs || patrimonyData?.totalGross || 0,
    patrimoineNet: wealth?.patrimoineNet || patrimonyData?.totalNet || 0,
    totalActifs: wealth?.totalActifs || 0,
    totalPassifs: wealth?.totalPassifs || 0,
    patrimoineGere: wealth?.patrimoineGere || 0,
    patrimoineNonGere: wealth?.patrimoineNonGere || 0,
    tauxGestion: wealth?.totalActifs ? ((wealth.patrimoineGere || 0) / wealth.totalActifs) * 100 : 0,
    repartition: wealth?.allocationByCategory?.map((item) => ({
      category: getCategoryLabel(item.category),
      value: item.value,
      percentage: item.percentage,
      color: getCategoryColor(item.category),
    })) || patrimonyData?.allocation || [],
    evolution: patrimonyData?.evolution || generateEvolutionData(wealth?.patrimoineNet || 0),
  }

  // Budget synthesis
  const annualIncome = Number(client.annualIncome) || 0
  const budget: VueEnsembleData['budget'] = budgetData || {
    revenusMensuels: annualIncome / 12,
    chargesMensuelles: 0,
    capaciteEpargne: annualIncome / 12,
    tauxEpargne: 0,
    tauxEndettement: wealth?.debtRatio || 0,
  }

  // Fiscalité synthesis - Utiliser les données réelles du client
  const clientExt = client as Record<string, unknown>

  // Calcul des parts fiscales basé sur la situation familiale
  const calculatePartsFiscales = (): number => {
    let parts = 1 // Célibataire
    const maritalStatus = client.maritalStatus
    const numberOfChildren = client.numberOfChildren || 0
    const dependents = client.dependents || 0

    // Marié ou Pacsé = 2 parts
    if (maritalStatus === 'MARIE' || maritalStatus === 'PACSE') {
      parts = 2
    }
    // Veuf avec enfants = 2 parts + enfants
    else if (maritalStatus === 'VEUF' && numberOfChildren > 0) {
      parts = 2
    }

    // Enfants: 0.5 par enfant pour les 2 premiers, puis 1 par enfant
    if (numberOfChildren >= 1) parts += 0.5
    if (numberOfChildren >= 2) parts += 0.5
    if (numberOfChildren >= 3) parts += (numberOfChildren - 2)

    // Personnes à charge
    parts += (dependents || 0) * 0.5

    return parts
  }

  const partsCalculees = calculatePartsFiscales()

  const fiscalite: VueEnsembleData['fiscalite'] = fiscaliteData || {
    irEstime: indicatorsData?.currentTaxation || Number(clientExt.irTaxRate || 0) * Number(client.annualIncome || 0) / 100,
    ifiEstime: clientExt.ifiSubject ? Number(clientExt.ifiAmount || 0) : 0,
    tmi: (clientExt.taxBracket as string) || client.taxBracket || 'Non renseigné',
    partsAffectees: partsCalculees,
  }

  // Contrats synthesis - Combiner actifs financiers (AV, PER) et contrats d'assurance
  const actifsArray = client.actifs || []
  const contratsArray = client.contrats || []

  // Types d'actifs financiers (épargne) - support EN et FR comme TabContratsComplet
  const ACTIFS_ASSURANCE_VIE = [
    'LIFE_INSURANCE', 'CAPITALIZATION_CONTRACT', // EN
    'ASSURANCE_VIE', 'CONTRAT_CAPITALISATION',   // FR
  ]
  const ACTIFS_RETRAITE = [
    'PER', 'PERP', 'MADELIN', 'ARTICLE_83', 'PREFON', 'COREM', // Communs
    'PERCO', 'PERECO', // Épargne retraite salariale
  ]

  // Types de contrats d'assurance (prévoyance) - support EN
  const CONTRATS_PREVOYANCE = [
    'DEATH_INSURANCE', 'DISABILITY_INSURANCE', 'HEALTH_INSURANCE',
    'HOME_INSURANCE', 'CAR_INSURANCE', 'PROFESSIONAL_INSURANCE',
  ]

  const assuranceVieActifs = actifsArray.filter((a: { type?: string }) => ACTIFS_ASSURANCE_VIE.includes(a.type || ''))
  const retraiteActifs = actifsArray.filter((a: { type?: string }) => ACTIFS_RETRAITE.includes(a.type || ''))
  const prevoyanceContrats = contratsArray.filter((c: { type?: string }) => CONTRATS_PREVOYANCE.includes(c.type || ''))

  const contrats = {
    total: assuranceVieActifs.length + retraiteActifs.length + prevoyanceContrats.length,
    assuranceVie: assuranceVieActifs.length,
    retraite: retraiteActifs.length,
    prevoyance: prevoyanceContrats.length,
    valeurTotale:
      assuranceVieActifs.reduce((sum: number, a) => sum + (Number(a.value) || 0), 0) +
      retraiteActifs.reduce((sum: number, a) => sum + (Number(a.value) || 0), 0) +
      prevoyanceContrats.reduce((sum: number, c) => sum + (Number(c.value) || 0), 0),
  }

  // Objectifs
  const objectifs = (client.objectifs || []).map((obj) => ({
    id: obj.id,
    name: obj.name,
    type: obj.type,
    progress: obj.currentAmount && obj.targetAmount ? (Number(obj.currentAmount) / Number(obj.targetAmount)) * 100 : 0,
    targetAmount: Number(obj.targetAmount) || 0,
    currentAmount: Number(obj.currentAmount) || 0,
    targetDate: obj.targetDate ? String(obj.targetDate) : null,
    status: getObjectifStatus({ status: obj.status, currentAmount: Number(obj.currentAmount), targetAmount: Number(obj.targetAmount), targetDate: obj.targetDate ? String(obj.targetDate) : undefined }),
  }))

  // Projets
  const projets = (client.projets || []).map((projet) => ({
    id: projet.id,
    name: projet.name,
    type: projet.type,
    status: projet.status,
    progress: projet.progress || 0,
  }))

  // Alertes
  const alertes = generateAlertes(client, wealth)

  return {
    patrimoine,
    budget,
    fiscalite,
    contrats,
    objectifs,
    projets,
    alertes,
    lastUpdate: new Date().toISOString(),
    dataCompleteness: calculateDataCompleteness(client, wealth),
  }
}

function createFallbackData(wealth: WealthSummary, client: ClientDetail): VueEnsembleData {
  return transformApiData({}, wealth, client)
}

function getCategoryLabel(category: string): string {
  return formatLabel(category)
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    IMMOBILIER: CHART_COLORS.immobilier,
    FINANCIER: CHART_COLORS.financier,
    EPARGNE_SALARIALE: CHART_COLORS.epargneSalariale,
    EPARGNE_RETRAITE: CHART_COLORS.epargneRetraite,
    PROFESSIONNEL: CHART_COLORS.professionnel,
    MOBILIER: CHART_COLORS.mobilier,
    AUTRE: CHART_COLORS.autre,
  }
  return colors[category] || '#6B7280'
}

function generateEvolutionData(currentValue: number): VueEnsembleData['patrimoine']['evolution'] {
  const data = []
  const now = new Date()

  for (let i = 11; i >= 0; i--) {
    const date = new Date(now)
    date.setMonth(date.getMonth() - i)

    // Simulate some variation
    const variation = 1 + (Math.random() * 0.1 - 0.05)
    const value = currentValue * variation * (0.9 + (0.1 * ((12 - i) / 12)))

    data.push({
      date: date.toISOString(),
      value: Math.round(value),
      actifs: Math.round(value * 1.2),
      passifs: Math.round(value * 0.2),
    })
  }

  // Last point should be actual current value
  if (data.length > 0) {
    data[data.length - 1].value = currentValue
  }

  return data
}

function getObjectifStatus(obj: { status?: string; currentAmount?: number; targetAmount?: number; targetDate?: string }): 'ON_TRACK' | 'AT_RISK' | 'EN_RETARD' | 'TERMINE' {
  if (obj.status === 'TERMINE') return 'TERMINE'

  const progress = obj.currentAmount && obj.targetAmount
    ? (obj.currentAmount / obj.targetAmount) * 100
    : 0

  if (progress >= 100) return 'TERMINE'

  if (obj.targetDate) {
    const targetDate = new Date(obj.targetDate)
    const now = new Date()
    const daysRemaining = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (daysRemaining < 0) return 'EN_RETARD'
    if (daysRemaining < 90 && progress < 75) return 'AT_RISK'
  }

  return 'ON_TRACK'
}

function generateAlertes(client: ClientDetail, wealth: WealthSummary | undefined): VueEnsembleData['alertes'] {
  const alertes: VueEnsembleData['alertes'] = []

  // KYC alerts
  if (client.kycStatus === 'EXPIRE') {
    alertes.push({
      id: 'kyc-expired',
      type: 'CRITIQUE',
      category: 'Conformité',
      title: 'KYC expiré',
      message: 'Le dossier KYC a expiré et doit être renouvelé immédiatement.',
      actionLabel: 'Renouveler',
      actionTab: 'documents',
    })
  } else if (client.kycStatus === 'EN_ATTENTE') {
    alertes.push({
      id: 'kyc-pending',
      type: 'WARNING',
      category: 'Conformité',
      title: 'KYC incomplet',
      message: 'Le dossier KYC est incomplet. Certains documents sont manquants.',
      actionLabel: 'Compléter',
      actionTab: 'documents',
    })
  }

  // High debt ratio alert
  if (wealth?.debtRatio && wealth.debtRatio > 35) {
    alertes.push({
      id: 'debt-ratio-high',
      type: 'WARNING',
      category: 'Budget',
      title: 'Taux d\'endettement élevé',
      message: `Le taux d'endettement de ${wealth.debtRatio.toFixed(1)}% dépasse le seuil recommandé de 35%.`,
      actionLabel: 'Analyser',
      actionTab: 'budget',
    })
  }

  // Expiring documents
  const expiringDocs = (client.documents || []).filter((doc) => {
    if (!doc.expiresAt) return false
    const daysUntilExpiry = Math.ceil((new Date(doc.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry > 0 && daysUntilExpiry <= 30
  })

  if (expiringDocs.length > 0) {
    alertes.push({
      id: 'docs-expiring',
      type: 'WARNING',
      category: 'Documents',
      title: `${expiringDocs.length} document(s) expirant bientôt`,
      message: 'Certains documents expirent dans les 30 prochains jours.',
      actionLabel: 'Voir',
      actionTab: 'documents',
    })
  }

  // Opportunities pending
  const pendingOpportunities = (client.opportunites || []).filter(
    (opp: { status?: string }) => opp.status === 'EN_ATTENTE' || opp.status === 'IDENTIFIED'
  )

  if (pendingOpportunities.length > 0) {
    alertes.push({
      id: 'opportunities-pending',
      type: 'INFO',
      category: 'Opportunités',
      title: `${pendingOpportunities.length} opportunité(s) à traiter`,
      message: 'Des opportunités patrimoniales ont été identifiées.',
      actionLabel: 'Explorer',
      actionTab: 'opportunites',
    })
  }

  return alertes
}

function calculateDataCompleteness(client: ClientDetail, wealth: WealthSummary | undefined): number {
  let score = 0
  let total = 0

  // Basic info
  total += 5
  if (client.firstName) score++
  if (client.lastName) score++
  if (client.email) score++
  if (client.phone) score++
  if (client.birthDate) score++

  // Patrimoine
  total += 3
  if (wealth?.totalActifs && wealth.totalActifs > 0) score++
  if (client.actifs && client.actifs.length > 0) score++
  if (wealth?.allocationByCategory && wealth.allocationByCategory.length > 0) score++

  // KYC
  total += 1
  if (client.kycStatus === 'TERMINE') score++

  // Contrats
  total += 1
  if (client.contrats && client.contrats.length > 0) score++

  return Math.round((score / total) * 100)
}

export default TabVueEnsemble
