'use client'

/**
 * useBudgetSummary - Hook partagé pour les données budget
 * 
 * Réutilise la même logique que TabBudgetComplet pour garantir
 * la cohérence des données affichées dans tous les onglets.
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
// Types et fonctions locaux (originaux quarantinés avec calculateurs)
type ResultatEndettement = {
  tauxEndettement: number
  resteAVivre: number
  capaciteEmprunt: number
  tauxActuel: number
  tauxAvecLoyer: number
  statut: 'ok' | 'attention' | 'critique'
}

const calculerEndettement = (params: {
  revenusMensuels: number; mensualitesCreditsEnCours: number; loyerActuel?: number
  situationFamiliale?: string; nbEnfants?: number
}): ResultatEndettement => {
  const { revenusMensuels, mensualitesCreditsEnCours, loyerActuel = 0 } = params
  const tauxEndettement = revenusMensuels > 0 ? Math.round((mensualitesCreditsEnCours / revenusMensuels) * 100 * 100) / 100 : 0
  const tauxAvecLoyer = revenusMensuels > 0 ? Math.round(((mensualitesCreditsEnCours + loyerActuel) / revenusMensuels) * 100 * 100) / 100 : 0
  const resteAVivre = revenusMensuels - mensualitesCreditsEnCours - loyerActuel
  const capaciteEmprunt = Math.max(0, (revenusMensuels * 0.35) - mensualitesCreditsEnCours)
  const statut: 'ok' | 'attention' | 'critique' = tauxEndettement > 35 ? 'critique' : tauxEndettement > 30 ? 'attention' : 'ok'
  return { tauxEndettement, resteAVivre, capaciteEmprunt, tauxActuel: tauxEndettement, tauxAvecLoyer, statut }
}
import { mapExpenseCategoryToDisplayGroup } from '@/app/_common/lib/labels'

// Types alignés sur Prisma
type FrequencePrisma = 'MENSUEL' | 'TRIMESTRIEL' | 'SEMESTRIEL' | 'ANNUEL' | 'PONCTUEL'

// Types alignés pour supporter les deux formats EN et FR de l'API
interface RevenueItem {
  id: string
  name?: string
  libelle?: string
  category?: string
  categorie?: string
  amount?: number
  montant?: number
  montantNet?: number
  frequency?: FrequencePrisma
  frequence?: FrequencePrisma
  isRecurring?: boolean
  estRecurrent?: boolean
}

interface ExpenseItem {
  id: string
  name?: string
  libelle?: string
  category?: string
  categorie?: string
  amount?: number
  montant?: number
  frequency?: FrequencePrisma
  frequence?: FrequencePrisma
  isFixed?: boolean
  estFixe?: boolean
  isEssential?: boolean
  estEssentiel?: boolean
}

interface DebtItem {
  id: string
  name?: string
  libelle?: string
  type: string
  monthlyPayment?: number
  mensualite?: number
  mensualiteTotale?: number
  mensualiteHorsAssurance?: number
  remainingAmount?: number
  capitalRestant?: number
  capitalRestantDu?: number
}

interface PassifItem {
  id: string
  name?: string
  type: string
  monthlyPayment?: number
  mensualite?: number
  value?: number
  remainingCapital?: number
}

export interface BudgetSummary {
  // Totaux mensuels
  totalRevenus: number
  totalCharges: number
  totalDettes: number
  solde: number
  
  // Taux
  tauxEpargne: number
  tauxEndettement: number
  
  // Endettement détaillé (normes HCSF 2025)
  endettement: ResultatEndettement
  endettementStatus: 'success' | 'warning' | 'danger'
  
  // Capacité
  capaciteEpargne: number
  
  // Disponibilité des données
  hasData: boolean

  // Chargement
  isLoading: boolean
  error: string | null
  
  // Refresh
  refresh: () => Promise<void>
}

// Convertir un montant selon sa fréquence en mensuel
function toMonthly(amount: number, frequency: FrequencePrisma): number {
  const factors: Record<FrequencePrisma, number> = {
    MENSUEL: 1,
    TRIMESTRIEL: 1 / 3,
    SEMESTRIEL: 1 / 6,
    ANNUEL: 1 / 12,
    PONCTUEL: 0,
  }
  return amount * (factors[frequency] || 1)
}

export function useBudgetSummary(
  clientId: string,
  maritalStatus?: string,
  numberOfChildren?: number,
  annualIncome?: number,
  clientPassifs?: Array<Record<string, unknown>>
): BudgetSummary {
  const [revenues, setRevenues] = useState<RevenueItem[]>([])
  const [expenses, setExpenses] = useState<ExpenseItem[]>([])
  const [debts, setDebts] = useState<DebtItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch des données - Même logique que TabBudgetComplet
  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const fetchOptions: RequestInit = { credentials: 'include' }
      const [revRes, expRes, debtRes] = await Promise.all([
        fetch(`/api/advisor/clients/${clientId}/revenues`, fetchOptions),
        fetch(`/api/advisor/clients/${clientId}/expenses`, fetchOptions),
        fetch(`/api/advisor/clients/${clientId}/credits`, fetchOptions),
      ])

      if (revRes.ok) {
        const revData = await revRes.json()
        // API returns { data: [...] } or { data: { revenues: [...] } }
        const revenues = revData.data?.revenues || revData.data || []
        setRevenues(Array.isArray(revenues) ? revenues : [])
      }
      if (expRes.ok) {
        const expData = await expRes.json()
        // API returns { data: [...] } or { data: { expenses: [...] } }
        const expenses = expData.data?.expenses || expData.data || []
        setExpenses(Array.isArray(expenses) ? expenses : [])
      }
      if (debtRes.ok) {
        const debtData = await debtRes.json()
        // API returns { data: { credits: [...] } } or { data: [...] }
        const debts = debtData.data?.credits || debtData.data || []
        setDebts(Array.isArray(debts) ? debts : [])
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement')
    } finally {
      setIsLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Calculs - Même logique que TabBudgetComplet
  // S'assurer que les données sont des tableaux

  const totalRevenus = useMemo(() => {
    const arr = Array.isArray(revenues) ? revenues : []
    let total = arr.reduce((s, r) => {
      const amount = Number(r.amount ?? r.montant ?? r.montantNet ?? 0)
      const freq = (r.frequency ?? r.frequence ?? 'MENSUEL') as FrequencePrisma
      return s + toMonthly(amount, freq)
    }, 0)
    
    // Fallback sur client.annualIncome si aucun revenu trouvé - même logique que TabBudgetComplet
    if (total === 0 && annualIncome && annualIncome > 0) {
      total = annualIncome / 12 // Convertir en mensuel
    }
    
    return total
  }, [revenues, annualIncome])

  const totalCharges = useMemo(() => {
    const arr = Array.isArray(expenses) ? expenses : []
    return arr.reduce((s, e) => {
      const amount = Number(e.amount ?? e.montant ?? 0)
      const freq = (e.frequency ?? e.frequence ?? 'MENSUEL') as FrequencePrisma
      return s + toMonthly(amount, freq)
    }, 0)
  }, [expenses])

  const totalDettes = useMemo(() => {
    // Ne compter que les crédits issus de l'API (même logique que TabBudgetComplet).
    // Évite d'interpréter les passifs (ex: loyer) comme des mensualités de crédit.
    const creditsArr = Array.isArray(debts) ? debts : []
    return creditsArr.reduce((s, d) => {
      const mensualite = Number(
        d.mensualiteTotale ??
          d.mensualiteHorsAssurance ??
          d.monthlyPayment ??
          d.mensualite ??
          0,
      )
      return s + (Number.isFinite(mensualite) ? mensualite : 0)
    }, 0)
  }, [debts])

  // Loyer actuel (charges de catégorie LOGEMENT)
  const loyerActuel = useMemo(() => {
    const arr = Array.isArray(expenses) ? expenses : []
    return arr
      .filter(e => mapExpenseCategoryToDisplayGroup(e.category ?? e.categorie ?? '') === 'LOGEMENT')
      .reduce((s, e) => {
        const amount = Number(e.amount ?? e.montant ?? 0)
        const freq = (e.frequency ?? e.frequence ?? 'MENSUEL') as FrequencePrisma
        return s + toMonthly(amount, freq)
      }, 0)
  }, [expenses])

  const solde = totalRevenus - totalCharges - totalDettes
  const tauxEpargne = totalRevenus > 0 ? (solde / totalRevenus) * 100 : 0
  const hasData = (Array.isArray(revenues) && revenues.length > 0) 
    || (Array.isArray(expenses) && expenses.length > 0) 
    || (Array.isArray(debts) && debts.length > 0)
    || (clientPassifs && clientPassifs.length > 0)
    || (annualIncome && annualIncome > 0)

  // Situation familiale
  const situationFamiliale = useMemo((): 'seul' | 'couple' => {
    const status = maritalStatus?.toUpperCase() || ''
    return ['MARRIED', 'MARIE', 'PACS', 'COHABITATION', 'CONCUBINAGE'].includes(status) ? 'couple' : 'seul'
  }, [maritalStatus])

  // Calcul d'endettement via la fonction centralisée (normes HCSF 2025)
  const endettement: ResultatEndettement = useMemo(() => 
    calculerEndettement({
      revenusMensuels: totalRevenus,
      mensualitesCreditsEnCours: totalDettes,
      loyerActuel: loyerActuel,
      situationFamiliale,
      nbEnfants: numberOfChildren || 0
    }),
    [totalRevenus, totalDettes, loyerActuel, situationFamiliale, numberOfChildren]
  )

  const endettementStatus = endettement.statut === 'critique' ? 'danger' : 
                           endettement.statut === 'attention' ? 'warning' : 'success'

  return {
    totalRevenus,
    totalCharges,
    totalDettes,
    solde,
    tauxEpargne,
    tauxEndettement: endettement.tauxAvecLoyer, // Utiliser tauxAvecLoyer comme TabBudgetComplet (inclut le loyer)
    endettement,
    endettementStatus,
    capaciteEpargne: solde,
    hasData,
    isLoading,
    error,
    refresh: fetchData,
  }
}
