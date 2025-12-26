'use client'

/**
 * useClientKPIs - Hook centralisé pour tous les KPIs du Client360
 * 
 * Agrège les données de:
 * - Patrimoine (actifs, passifs, évolution)
 * - Budget (revenus, charges, épargne)
 * - Fiscalité (IR, IFI, TMI)
 * - Performance (score client, alertes, opportunités)
 * - Suggestions IA basées sur les vraies données
 */

import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useClientCalculators, type TaxOptimizationResult } from './useClientCalculators'
// Fonction locale simplifiée (originale quarantinée avec calculateurs)
const calculerEndettement = (params: {
  revenusMensuels: number; mensualitesCreditsEnCours: number; loyerActuel?: number
  situationFamiliale?: string; nbEnfants?: number
}): { tauxActuel: number; tauxAvecLoyer: number } => {
  const { revenusMensuels, mensualitesCreditsEnCours, loyerActuel = 0 } = params
  const tauxActuel = revenusMensuels > 0 ? Math.round((mensualitesCreditsEnCours / revenusMensuels) * 100 * 100) / 100 : 0
  const tauxAvecLoyer = revenusMensuels > 0 ? Math.round(((mensualitesCreditsEnCours + loyerActuel) / revenusMensuels) * 100 * 100) / 100 : 0
  return { tauxActuel, tauxAvecLoyer }
}
import { mapExpenseCategoryToDisplayGroup } from '@/app/_common/lib/labels'

// ============================================================================
// Types
// ============================================================================

export interface PatrimoineSummary {
  brut: number
  net: number
  evolution: number // % évolution sur 12 mois
  repartition: {
    immobilier: number
    financier: number
    professionnel: number
    autres: number
  }
}

export interface BudgetSummary {
  revenus: number
  charges: number
  epargne: number
  tauxEpargne: number // ratio épargne/revenus
  tauxEndettement: number // ratio dettes/revenus
}

export interface FiscaliteSummary {
  ir: number
  ifi: number
  tmi: string
  tauxEffectif: number
}

export interface PerformanceSummary {
  score: 'A' | 'B' | 'C' | 'D' | 'E'
  scoreValue: number // 0-100
  alertsCount: number
  opportunitiesCount: number
  documentsExpiring: number
}

export interface ClientSuggestion {
  id: string
  type: 'optimization' | 'reallocation' | 'alert' | 'opportunity'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  savings?: number
  impact?: string
  action?: {
    label: string
    tabId: string
  }
}

export interface ClientKPIsData {
  patrimoine: PatrimoineSummary
  budget: BudgetSummary
  fiscalite: FiscaliteSummary
  performance: PerformanceSummary
  suggestions: ClientSuggestion[]
  isLoading: boolean
  error: Error | null
}

// ============================================================================
// Fetch Functions
// ============================================================================

async function fetchPatrimoineEvolution(clientId: string): Promise<{ evolution: number; history: Record<string, unknown>[] }> {
  try {
    const res = await fetch(`/api/advisor/clients/${clientId}/patrimoine/evolution`)
    if (!res.ok) return { evolution: 0, history: [] }
    const data = await res.json()
    return data.data || { evolution: 0, history: [] }
  } catch {
    return { evolution: 0, history: [] }
  }
}

async function fetchClientAlerts(clientId: string): Promise<Record<string, unknown>[]> {
  try {
    // Endpoint spécifique au client
    const res = await fetch(`/api/advisor/clients/${clientId}/alerts`)
    if (!res.ok) return []
    const data = await res.json()
    const alerts = data.data?.alerts || data.alerts || []
    return Array.isArray(alerts) ? alerts : []
  } catch {
    return []
  }
}

async function fetchClientDocuments(clientId: string): Promise<Record<string, unknown>[]> {
  try {
    const res = await fetch(`/api/advisor/clients/${clientId}/documents`)
    if (!res.ok) return []
    const data = await res.json()
    const documents = data?.data?.documents ?? data?.documents ?? data ?? []
    return Array.isArray(documents) ? documents : []
  } catch {
    return []
  }
}

async function fetchClientOpportunities(clientId: string): Promise<Record<string, unknown>[]> {
  try {
    const res = await fetch(`/api/advisor/clients/${clientId}/opportunities`)
    if (!res.ok) return []
    const data = await res.json()
    const opportunities = data?.data?.opportunities ?? data?.opportunities ?? []
    return Array.isArray(opportunities) ? opportunities : []
  } catch {
    return []
  }
}

async function fetchClientActifs(clientId: string): Promise<Record<string, unknown>[]> {
  try {
    const res = await fetch(`/api/advisor/clients/${clientId}/actifs`)
    if (!res.ok) return []
    const data = await res.json()
    return data.data?.actifs || data.data || []
  } catch {
    return []
  }
}

async function fetchClientPassifs(clientId: string): Promise<Record<string, unknown>[]> {
  try {
    // Endpoint spécifique au client
    const res = await fetch(`/api/advisor/clients/${clientId}/passifs`)
    if (!res.ok) return []
    const data = await res.json()
    const passifs = data.data?.passifs || data.passifs || []
    return Array.isArray(passifs) ? passifs : []
  } catch {
    return []
  }
}

async function fetchClientRevenus(clientId: string): Promise<Record<string, unknown>[]> {
  try {
    const res = await fetch(`/api/advisor/clients/${clientId}/revenues`)
    if (!res.ok) return []
    const data = await res.json()
    return data.data || []
  } catch {
    return []
  }
}

async function fetchClientCharges(clientId: string): Promise<Record<string, unknown>[]> {
  try {
    const res = await fetch(`/api/advisor/clients/${clientId}/expenses`)
    if (!res.ok) return []
    const data = await res.json()
    return data.data || []
  } catch {
    return []
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function toStringSafe(value: unknown, fallback: string = ''): string {
  if (value === null || value === undefined) return fallback
  if (typeof value === 'string') return value
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : fallback
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  return fallback
}

function toDateSafe(value: unknown): Date | null {
  if (value === null || value === undefined) return null
  const d = value instanceof Date ? value : new Date(toStringSafe(value))
  return Number.isNaN(d.getTime()) ? null : d
}

function calculateMonthlyTotal(items: Record<string, unknown>[], field: string = 'montant'): number {
  return items.reduce((sum, item) => {
    const montant = Number((item as any)?.[field] ?? (item as any)?.amount ?? (item as any)?.montant ?? (item as any)?.montantNet ?? (item as any)?.montantBrut ?? 0)
    const freq = item.frequence || item.frequency || 'MENSUEL'
    if (freq === 'ANNUEL') return sum + montant / 12
    if (freq === 'TRIMESTRIEL') return sum + montant / 3
    if (freq === 'SEMESTRIEL') return sum + montant / 6
    return sum + montant
  }, 0)
}

function categorizeActifs(actifs: Record<string, unknown>[]): PatrimoineSummary['repartition'] {
  const categories = {
    immobilier: 0,
    financier: 0,
    professionnel: 0,
    autres: 0,
  }

  actifs.forEach(actif => {
    const value = Number(actif.value || actif.valeur || 0)
    const type = toStringSafe(actif.type).toUpperCase() || toStringSafe(actif.category).toUpperCase() || ''
    
    if (type.includes('IMMOBILIER') || type.includes('REAL_ESTATE')) {
      categories.immobilier += value
    } else if (type.includes('FINANCIER') || type.includes('FINANCIAL') || type.includes('EPARGNE') || type.includes('COMPTE')) {
      categories.financier += value
    } else if (type.includes('PROFESSIONNEL') || type.includes('BUSINESS') || type.includes('ENTREPRISE')) {
      categories.professionnel += value
    } else {
      categories.autres += value
    }
  })

  return categories
}

function calculateClientScore(
  patrimoine: PatrimoineSummary,
  budget: BudgetSummary,
  fiscalite: FiscaliteSummary,
  alertsCount: number,
  documentsExpiring: number
): { score: PerformanceSummary['score']; scoreValue: number } {
  let scoreValue = 100

  // Pénalités pour le budget
  if (budget.tauxEpargne < 5) scoreValue -= 20
  else if (budget.tauxEpargne < 10) scoreValue -= 10
  else if (budget.tauxEpargne < 15) scoreValue -= 5

  if (budget.tauxEndettement > 40) scoreValue -= 25
  else if (budget.tauxEndettement > 33) scoreValue -= 15
  else if (budget.tauxEndettement > 25) scoreValue -= 5

  // Pénalités pour les alertes
  scoreValue -= alertsCount * 5

  // Pénalités pour les documents expirés
  scoreValue -= documentsExpiring * 3

  // Bonus pour diversification
  const total = patrimoine.repartition.immobilier + patrimoine.repartition.financier + 
                patrimoine.repartition.professionnel + patrimoine.repartition.autres
  if (total > 0) {
    const immobilierRatio = patrimoine.repartition.immobilier / total
    const financierRatio = patrimoine.repartition.financier / total
    
    // Surexposition immobilière
    if (immobilierRatio > 0.70) scoreValue -= 10
    else if (immobilierRatio > 0.60) scoreValue -= 5
    
    // Manque de diversification financière
    if (financierRatio < 0.15) scoreValue -= 10
    else if (financierRatio < 0.25) scoreValue -= 5
  }

  // Limiter entre 0 et 100
  scoreValue = Math.max(0, Math.min(100, scoreValue))

  // Convertir en lettre
  let score: PerformanceSummary['score'] = 'A'
  if (scoreValue < 40) score = 'E'
  else if (scoreValue < 55) score = 'D'
  else if (scoreValue < 70) score = 'C'
  else if (scoreValue < 85) score = 'B'

  return { score, scoreValue }
}

function generateSuggestions(
  patrimoine: PatrimoineSummary,
  budget: BudgetSummary,
  fiscalite: FiscaliteSummary,
  taxOptimization: TaxOptimizationResult | null
): ClientSuggestion[] {
  const suggestions: ClientSuggestion[] = []

  // 1. Suggestion PER si TMI élevé
  const tmiValue = parseInt(fiscalite.tmi) || 0
  if (tmiValue >= 30 && budget.epargne > 200) {
    const perMax = Math.min(budget.epargne * 0.5, 5000)
    const saving = Math.round(perMax * (tmiValue / 100))
    suggestions.push({
      id: 'per-optimization',
      type: 'optimization',
      priority: 'high',
      title: 'Optimisation PER recommandée',
      description: `Versement de ${perMax.toLocaleString('fr-FR')}€ sur PER possible avant fin d'année.`,
      savings: saving,
      action: { label: 'Simuler', tabId: 'fiscalite' }
    })
  }

  // 2. Surexposition immobilière
  const total = patrimoine.repartition.immobilier + patrimoine.repartition.financier + 
                patrimoine.repartition.professionnel + patrimoine.repartition.autres
  if (total > 0) {
    const immobilierRatio = patrimoine.repartition.immobilier / total
    if (immobilierRatio > 0.55) {
      suggestions.push({
        id: 'diversification',
        type: 'reallocation',
        priority: 'medium',
        title: 'Surexposition immobilière',
        description: `Patrimoine immobilier à ${(immobilierRatio * 100).toFixed(0)}%. Diversification conseillée.`,
        impact: 'Réduction du risque',
        action: { label: 'Voir répartition', tabId: 'patrimoine' }
      })
    }
  }

  // 3. Taux d'épargne faible
  if (budget.tauxEpargne < 10 && budget.revenus > 0) {
    suggestions.push({
      id: 'epargne-insuffisante',
      type: 'alert',
      priority: 'high',
      title: 'Épargne insuffisante',
      description: `Taux d'épargne de ${(budget.tauxEpargne).toFixed(0)}%. Objectif recommandé: 15%.`,
      impact: 'Améliorer la capacité d\'épargne',
      action: { label: 'Analyser budget', tabId: 'budget' }
    })
  }

  // 4. Endettement élevé
  if (budget.tauxEndettement > 33) {
    suggestions.push({
      id: 'endettement-eleve',
      type: 'alert',
      priority: budget.tauxEndettement > 40 ? 'high' : 'medium',
      title: 'Taux d\'endettement élevé',
      description: `Endettement à ${(budget.tauxEndettement).toFixed(0)}%. Seuil recommandé: 33%.`,
      impact: 'Risque de surendettement',
      action: { label: 'Voir crédits', tabId: 'patrimoine' }
    })
  }

  // 5. Optimisations fiscales disponibles
  if (taxOptimization?.recommendations?.length > 0) {
    const bestReco = taxOptimization.recommendations[0]
    suggestions.push({
      id: 'tax-optimization',
      type: 'opportunity',
      priority: 'medium',
      title: bestReco.name || 'Optimisation fiscale disponible',
      description: bestReco.description || 'Économie d\'impôt possible.',
      savings: bestReco.taxSaving || 0,
      action: { label: 'Découvrir', tabId: 'fiscalite' }
    })
  }

  // 6. IFI si patrimoine > 1.3M
  if (patrimoine.net > 1300000 && fiscalite.ifi === 0) {
    suggestions.push({
      id: 'ifi-check',
      type: 'alert',
      priority: 'medium',
      title: 'Vérification IFI nécessaire',
      description: `Patrimoine net de ${(patrimoine.net / 1000000).toFixed(2)}M€. Seuil IFI: 1.3M€.`,
      action: { label: 'Calculer IFI', tabId: 'fiscalite' }
    })
  }

  return suggestions.slice(0, 5) // Limiter à 5 suggestions
}

// ============================================================================
// Main Hook
// ============================================================================

export function useClientKPIs(clientId: string): ClientKPIsData {
  // Récupérer les données des calculateurs
  const calculators = useClientCalculators(clientId)

  // Récupérer les actifs
  const { data: actifs = [], isLoading: loadingActifs } = useQuery({
    queryKey: ['client-actifs', clientId],
    queryFn: () => fetchClientActifs(clientId),
    staleTime: 2 * 60 * 1000,
    enabled: !!clientId,
  })

  // Récupérer les passifs
  const { data: passifs = [], isLoading: loadingPassifs } = useQuery({
    queryKey: ['client-passifs', clientId],
    queryFn: () => fetchClientPassifs(clientId),
    staleTime: 2 * 60 * 1000,
    enabled: !!clientId,
  })

  // Récupérer les revenus
  const { data: revenus = [], isLoading: loadingRevenus } = useQuery({
    queryKey: ['client-revenus', clientId],
    queryFn: () => fetchClientRevenus(clientId),
    staleTime: 2 * 60 * 1000,
    enabled: !!clientId,
  })

  // Récupérer les charges
  const { data: charges = [], isLoading: loadingCharges } = useQuery({
    queryKey: ['client-charges', clientId],
    queryFn: () => fetchClientCharges(clientId),
    staleTime: 2 * 60 * 1000,
    enabled: !!clientId,
  })

  // Récupérer l'évolution du patrimoine
  const { data: evolutionData, isLoading: loadingEvolution } = useQuery({
    queryKey: ['client-patrimoine-evolution', clientId],
    queryFn: () => fetchPatrimoineEvolution(clientId),
    staleTime: 5 * 60 * 1000,
    enabled: !!clientId,
  })

  // Récupérer les alertes
  const { data: alerts = [] } = useQuery({
    queryKey: ['client-alerts', clientId],
    queryFn: () => fetchClientAlerts(clientId),
    staleTime: 2 * 60 * 1000,
    enabled: !!clientId,
  })

  // Récupérer les documents
  const { data: documents = [] } = useQuery({
    queryKey: ['client-documents', clientId],
    queryFn: () => fetchClientDocuments(clientId),
    staleTime: 2 * 60 * 1000,
    enabled: !!clientId,
  })

  // Récupérer les opportunités
  const { data: opportunities = [] } = useQuery({
    queryKey: ['client-opportunities', clientId],
    queryFn: () => fetchClientOpportunities(clientId),
    staleTime: 2 * 60 * 1000,
    enabled: !!clientId,
  })

  // Calculer les KPIs
  const kpis = useMemo(() => {
    // Patrimoine
    const totalActifs = actifs.reduce((sum: number, a: Record<string, unknown>) => sum + Number(a.value || a.valeur || 0), 0)
    const totalPassifs = passifs.reduce((sum: number, p: Record<string, unknown>) => sum + Number(p.remainingAmount || p.capitalRestantDu || 0), 0)
    const patrimoineNet = totalActifs - totalPassifs
    const repartition = categorizeActifs(actifs)

    const patrimoine: PatrimoineSummary = {
      brut: totalActifs,
      net: patrimoineNet,
      evolution: evolutionData?.evolution || 0,
      repartition,
    }

    // Budget
    const revenusMensuels = calculateMonthlyTotal(revenus)
    const chargesMensuelles = calculateMonthlyTotal(charges)

    const safeCharges = Array.isArray(charges) ? charges : []
    const loyerActuel = calculateMonthlyTotal(
      safeCharges.filter((e: Record<string, unknown>) => {
        const cat = String((e as any).category ?? (e as any).categorie ?? '')
        return mapExpenseCategoryToDisplayGroup(cat) === 'LOGEMENT'
      })
    )

    const mensualitesCredits = passifs.reduce((sum: number, p: Record<string, unknown>) => 
      sum + Number(p.monthlyPayment || p.mensualite || 0), 0)
    const totalCharges = chargesMensuelles + mensualitesCredits
    const epargne = revenusMensuels - totalCharges

    const tauxEpargne = revenusMensuels > 0 ? (epargne / revenusMensuels) * 100 : 0

    const endettement = calculerEndettement({
      revenusMensuels,
      mensualitesCreditsEnCours: mensualitesCredits,
      loyerActuel,
      situationFamiliale: 'seul',
      nbEnfants: 0,
    })
    const tauxEndettement = endettement.tauxAvecLoyer

    const budget: BudgetSummary = {
      revenus: revenusMensuels,
      charges: totalCharges,
      epargne: Math.max(0, epargne),
      tauxEpargne: Math.max(0, tauxEpargne),
      tauxEndettement,
    }

    // Fiscalité - Calculer la TMI localement pour cohérence avec TabFiscaliteComplete
    const revenusAnnuels = revenusMensuels * 12
    const wealthTax = calculators.wealthTax
    
    // Calcul TMI selon barème 2024 (même logique que TabFiscaliteComplete)
    // Revenu net imposable = revenus - abattement 10%
    const revenuNetImposable = Math.max(0, revenusAnnuels * 0.9)
    // TMI basée sur le quotient familial (1 part par défaut, 2 si marié)
    const quotientFamilial = revenuNetImposable // Simplifié: 1 part
    
    let tmiValue = 0
    let irCalcule = 0
    // Barème IR 2024
    const tranches = [
      { min: 0, max: 11294, rate: 0 },
      { min: 11294, max: 28797, rate: 11 },
      { min: 28797, max: 82341, rate: 30 },
      { min: 82341, max: 177106, rate: 41 },
      { min: 177106, max: Infinity, rate: 45 },
    ]
    
    for (const tranche of tranches) {
      if (quotientFamilial > tranche.min) {
        const taxableInBracket = Math.min(quotientFamilial, tranche.max) - tranche.min
        irCalcule += taxableInBracket * (tranche.rate / 100)
        if (quotientFamilial > tranche.min) {
          tmiValue = tranche.rate
        }
      }
    }
    
    const tauxEffectifCalcule = revenusAnnuels > 0 ? (irCalcule / revenusAnnuels) * 100 : 0

    const fiscalite: FiscaliteSummary = {
      ir: irCalcule,
      ifi: wealthTax?.taxAmount || 0,
      tmi: `${tmiValue}%`,
      tauxEffectif: tauxEffectifCalcule,
    }

    // Documents expirants (dans les 30 jours)
    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const safeDocuments = Array.isArray(documents) ? documents : []
    const documentsExpiring = safeDocuments.filter((doc: Record<string, unknown>) => {
      const expDate = toDateSafe(doc.expirationDate ?? doc.expiresAt ?? doc.expiration)
      if (!expDate) return false
      return expDate <= thirtyDaysFromNow && expDate >= now
    }).length

    // Performance
    const { score, scoreValue } = calculateClientScore(
      patrimoine,
      budget,
      fiscalite,
      alerts.length,
      documentsExpiring
    )

    const performance: PerformanceSummary = {
      score,
      scoreValue,
      alertsCount: alerts.length,
      opportunitiesCount: opportunities.length,
      documentsExpiring,
    }

    // Suggestions IA
    const suggestions = generateSuggestions(
      patrimoine,
      budget,
      fiscalite,
      calculators.taxOptimization
    )

    return {
      patrimoine,
      budget,
      fiscalite,
      performance,
      suggestions,
    }
  }, [actifs, passifs, revenus, charges, evolutionData, alerts, documents, opportunities, calculators])

  const isLoading = loadingActifs || loadingPassifs || loadingRevenus || loadingCharges || 
                    loadingEvolution || calculators.isLoading

  return {
    ...kpis,
    isLoading,
    error: null,
  }
}

export default useClientKPIs
