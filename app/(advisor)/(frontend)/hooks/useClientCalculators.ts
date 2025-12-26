'use client'

/**
 * Hook centralisé pour tous les calculateurs backend
 * Récupère les données client et appelle automatiquement les APIs de calcul
 */

import { useState, useEffect, useCallback, useMemo } from 'react'

// ============================================================================
// Types des résultats de calcul
// ============================================================================

export interface DebtCapacityResult {
  currentDebtRatio: number
  maxDebtRatio: number
  availableDebtCapacity: number
  maxMonthlyPayment: number
  maxLoanAmount: number
  recommendation: string
  status: 'safe' | 'warning' | 'critical'
}

export interface BudgetAnalysisResult {
  totalIncome: number
  totalExpenses: number
  totalDebts: number
  netIncome: number
  savingsRate: number
  debtToIncomeRatio: number
  expenseBreakdown: Record<string, number>
  incomeBreakdown: Record<string, number>
  recommendations: string[]
  healthScore: number
  status: 'excellent' | 'good' | 'fair' | 'poor'
}

export interface IncomeTaxResult {
  grossIncome: number
  taxableIncome: number
  totalTax: number
  effectiveRate: number
  marginalRate: number
  tmi: string
  brackets: { rate: number; amount: number; tax: number }[]
  netIncome: number
}

export interface WealthTaxResult {
  totalWealth: number
  taxableWealth: number
  taxAmount: number
  isSubject: boolean
  threshold: number
  effectiveRate: number
}

export interface TaxOptimizationResult {
  currentTax: number
  potentialSavings: number
  recommendations: {
    type: string
    name: string
    maxAmount: number
    taxSaving: number
    description: string
  }[]
  totalPotentialSavings: number
}

export interface EmergencyFundResult {
  monthlyExpenses: number
  recommendedMonths: number
  targetAmount: number
  currentSavings?: number
  gap?: number
  status: 'adequate' | 'low' | 'critical'
}

export interface HomePurchaseResult {
  targetPrice: number
  futurePrice: number
  downPayment: number
  closingCosts: number
  totalRequired: number
  currentSavings: number
  amountToSave: number
  monthlySavings: number
  feasibility: 'achievable' | 'challenging' | 'difficult'
  yearlyProjection: { year: number; savings: number; target: number }[]
}

export interface RetirementSimulationResult {
  currentAge: number
  retirementAge: number
  yearsUntilRetirement: number
  savingsAtRetirement: number
  totalContributions: number
  investmentGains: number
  desiredAnnualIncome: number
  sustainableAnnualIncome: number
  incomeShortfall: number
  isRetirementFeasible: boolean
  replacementRate: number
  projection: { age: number; savingsBalance: number; annualWithdrawal: number }[]
  recommendations: string[]
}

export interface ClientCalculatorsData {
  // Résultats des calculateurs
  debtCapacity: DebtCapacityResult | null
  budgetAnalysis: BudgetAnalysisResult | null
  incomeTax: IncomeTaxResult | null
  wealthTax: WealthTaxResult | null
  taxOptimization: TaxOptimizationResult | null
  emergencyFund: EmergencyFundResult | null
  homePurchase: HomePurchaseResult | null
  retirementSimulation: RetirementSimulationResult | null
  
  // État
  isLoading: boolean
  errors: Record<string, string | null>
  lastUpdate: Date | null
}

// ============================================================================
// Hook Principal
// ============================================================================

// ============================================================================
// Internal Types for Client Data
// ============================================================================

interface RevenueItem {
  montant?: number
  amount?: number
  montantAnnuel?: number
  frequency?: string
  frequence?: string
  category: string
}

interface ChargeItem {
  montant?: number
  amount?: number
  frequency?: string
  frequence?: string
  category: string
}

interface CreditItem {
  mensualiteTotale?: number
  capitalRestantDu?: number
}

interface ActifItem {
  category: string
  value?: number
}

interface ClientInfo {
  maritalStatus?: string
  numberOfChildren?: number
  birthDate?: string | Date | null
  annualIncome?: number
  profession?: string
}

interface ClientDataState {
  revenus: RevenueItem[]
  charges: ChargeItem[]
  credits: CreditItem[]
  actifs: ActifItem[]
  client: ClientInfo
}

export function useClientCalculators(clientId: string) {
  const [data, setData] = useState<ClientCalculatorsData>({
    debtCapacity: null,
    budgetAnalysis: null,
    incomeTax: null,
    wealthTax: null,
    taxOptimization: null,
    emergencyFund: null,
    homePurchase: null,
    retirementSimulation: null,
    isLoading: true,
    errors: {},
    lastUpdate: null,
  })

  // Données client pour les calculs
  const [clientData, setClientData] = useState<ClientDataState | null>(null)

  // 1. Récupérer les données client
  const fetchClientData = useCallback(async () => {
    try {
      const [revenusRes, chargesRes, creditsRes, actifsRes, clientRes] = await Promise.all([
        fetch(`/api/advisor/clients/${clientId}/revenues`).then(r => r.json()).catch(() => ({ data: [] })),
        fetch(`/api/advisor/clients/${clientId}/expenses`).then(r => r.json()).catch(() => ({ data: [] })),
        fetch(`/api/advisor/clients/${clientId}/credits`).then(r => r.json()).catch(() => ({ data: [] })),
        fetch(`/api/advisor/clients/${clientId}/actifs`).then(r => r.json()).catch(() => ({ data: { actifs: [] } })),
        fetch(`/api/advisor/clients/${clientId}`).then(r => r.json()).catch(() => ({ data: null })),
      ])

      setClientData({
        revenus: revenusRes?.data || [],
        charges: chargesRes?.data || [],
        credits: creditsRes?.data || [],
        actifs: actifsRes?.data?.actifs || [],
        client: clientRes?.data || {},
      })
    } catch (error) {
      console.error('Erreur récupération données client:', error)
    }
  }, [clientId])

  // 2. Calculer les totaux à partir des données client
  // ⚠️ SUPPORTE DEUX FORMATS: Catégories simplifiées (UI) ET Prisma (DB)
  const computedTotals = useMemo(() => {
    if (!clientData) return null

    // === MAPPING CATÉGORIES ===
    // Valeurs uniformes FR (migration 2024-12-10)
    // Les valeurs sont maintenant identiques Frontend = Prisma = Supabase
    
    // Catégories Revenus
    const REVENUS_SALAIRES = [
      // Nouvelles valeurs uniformes FR
      'SALAIRE', 'PRIME', 'BONUS', 'AVANTAGE_NATURE',
      'INDEMNITE_LICENCIEMENT', 'INDEMNITE_RUPTURE_CONVENTIONNELLE',
      // TNS/Professionnel
      'BIC', 'BNC', 'BA', 'HONORAIRES', 'DROITS_AUTEUR',
      'REMUNERATION_GERANT',
      // Compatibilité anciennes valeurs (données non migrées)
      'SALAIRE_NET', 'SALAIRE_BRUT', 'PRIME_BONUS', 'TREIZIEME_MOIS',
      'PARTICIPATION_INTERESSEMENT', 'REVENUS_TNS', 'GERANT_SARL', 'DIRIGEANT_SAS',
      'PROFESSIONNEL'
    ]
    const REVENUS_LOCATIFS = [
      // Nouvelles valeurs uniformes FR
      'REVENUS_FONCIERS', 'LMNP', 'LMP', 'LOCATION_SAISONNIERE', 'SCPI',
      // Compatibilité anciennes valeurs
      'LOYERS_BRUTS', 'LOYERS_NETS', 'REVENUS_SCPI', 'LOCATIF'
    ]
    const REVENUS_INVESTISSEMENT = [
      // Nouvelles valeurs uniformes FR
      'DIVIDENDES', 'INTERETS', 'PLUS_VALUES_MOBILIERES', 'ASSURANCE_VIE_RACHAT', 'CRYPTO',
      // Compatibilité anciennes valeurs
      'PLUS_VALUES', 'RENTES_VIAGERES'
    ]
    const _REVENUS_SOCIAUX = [
      // Nouvelles valeurs uniformes FR
      'PENSION_RETRAITE', 'RETRAITE_COMPLEMENTAIRE', 'PER_RENTE', 'PENSION_REVERSION',
      'PENSION_ALIMENTAIRE_RECUE', 'PENSION_INVALIDITE', 'ALLOCATION_CHOMAGE',
      'RSA', 'ALLOCATIONS_FAMILIALES', 'APL', 'RENTE_VIAGERE',
      // Compatibilité anciennes valeurs
      'ALLOCATIONS_CHOMAGE', 'PENSION', 'ALLOCATIONS'
    ]

    // Catégories Charges
    const CHARGES_LOGEMENT = [
      // Nouvelles valeurs uniformes FR
      'LOYER', 'CHARGES_COPROPRIETE', 'TAXE_FONCIERE', 'TAXE_HABITATION',
      'ELECTRICITE_GAZ', 'EAU', 'INTERNET_TELEPHONE', 'TRAVAUX_ENTRETIEN', 'FRAIS_GESTION_LOCATIVE',
      // Crédits immobiliers
      'CREDIT_IMMOBILIER_RP', 'CREDIT_IMMOBILIER_LOCATIF',
      // Compatibilité anciennes valeurs
      'LOYER_HABITATION', 'ASSURANCE_HABITATION', 'ELECTRICITE', 'GAZ', 'CHAUFFAGE',
      'INTERNET_FIXE', 'ENTRETIEN_LOGEMENT', 'LOGEMENT'
    ]
    const CHARGES_TRANSPORT = [
      // Nouvelles valeurs uniformes FR
      'CREDIT_AUTO', 'CARBURANT', 'ENTRETIEN_VEHICULE', 'PARKING', 'TRANSPORT_COMMUN', 'PEAGES',
      // Compatibilité anciennes valeurs
      'ASSURANCE_AUTO', 'PARKING_PEAGE', 'TRANSPORT'
    ]
    const CHARGES_ALIMENTATION = [
      // Nouvelles valeurs uniformes FR
      'ALIMENTATION',
      // Compatibilité anciennes valeurs
      'COURSES_ALIMENTAIRES', 'RESTAURANTS', 'CANTINES'
    ]

    // === REVENUS ===
    // Convertir en mensuel selon la fréquence
    let revenusMensuels = clientData.revenus.reduce((sum, r) => {
      const montant = Number(r.montant || r.amount || 0)
      const freq = r.frequency || r.frequence || 'MENSUEL'
      if (['ANNUEL', 'ANNUAL'].includes(freq)) return sum + montant / 12
      if (['TRIMESTRIEL', 'QUARTERLY'].includes(freq)) return sum + montant / 3
      if (['SEMESTRIEL'].includes(freq)) return sum + montant / 6
      return sum + montant
    }, 0)
    
    // Fallback: utiliser client.annualIncome si pas de revenus en table
    const clientAnnualIncome = Number(clientData.client?.annualIncome) || 0
    if (revenusMensuels === 0 && clientAnnualIncome > 0) {
      revenusMensuels = clientAnnualIncome / 12
    }

    const getRevenueMensuel = (r: RevenueItem) => {
      const annuel = Number(r.montantAnnuel || 0)
      if (annuel > 0) return annuel / 12
      const montant = Number(r.montant || r.amount || 0)
      const freq = r.frequency || r.frequence || 'MENSUEL'
      if (['ANNUEL', 'ANNUAL'].includes(freq)) return montant / 12
      if (['TRIMESTRIEL', 'QUARTERLY'].includes(freq)) return montant / 3
      return montant
    }

    const salaires = clientData.revenus
      .filter((r) => REVENUS_SALAIRES.includes(r.category))
      .reduce((sum, r) => sum + getRevenueMensuel(r), 0)

    const revenusLocatifs = clientData.revenus
      .filter((r) => REVENUS_LOCATIFS.includes(r.category))
      .reduce((sum, r) => sum + getRevenueMensuel(r), 0)

    const revenusInvestissement = clientData.revenus
      .filter((r) => REVENUS_INVESTISSEMENT.includes(r.category))
      .reduce((sum, r) => sum + getRevenueMensuel(r), 0)

    // === CHARGES ===
    const getChargeMensuelle = (c: ChargeItem) => {
      const montant = Number(c.montant || c.amount || 0)
      const freq = c.frequency || c.frequence || 'MENSUEL'
      if (['ANNUEL', 'ANNUAL'].includes(freq)) return montant / 12
      if (['TRIMESTRIEL', 'QUARTERLY'].includes(freq)) return montant / 3
      if (['SEMESTRIEL'].includes(freq)) return montant / 6
      return montant
    }

    const chargesMensuelles = clientData.charges.reduce((sum, c) => 
      sum + getChargeMensuelle(c), 0)

    const chargesLogement = clientData.charges
      .filter((c) => CHARGES_LOGEMENT.includes(c.category))
      .reduce((sum, c) => sum + getChargeMensuelle(c), 0)

    const chargesTransport = clientData.charges
      .filter((c) => CHARGES_TRANSPORT.includes(c.category))
      .reduce((sum, c) => sum + getChargeMensuelle(c), 0)

    const chargesAlimentation = clientData.charges
      .filter((c) => CHARGES_ALIMENTATION.includes(c.category))
      .reduce((sum, c) => sum + getChargeMensuelle(c), 0)

    // === CRÉDITS ===
    // Champs Prisma: mensualiteTotale, capitalRestantDu
    const mensualitesCredits = clientData.credits.reduce((sum, c) => 
      sum + Number(c.mensualiteTotale || 0), 0)

    const capitalRestantDu = clientData.credits.reduce((sum, c) => 
      sum + Number(c.capitalRestantDu || 0), 0)

    // === PATRIMOINE (ACTIFS) ===
    // Champ Prisma: category (IMMOBILIER, FINANCIER, PROFESSIONNEL, AUTRE)
    // ⚠️ Utiliser 'category' et non 'type' pour filtrer
    const patrimoineImmobilier = clientData.actifs
      .filter((a) => a.category === 'IMMOBILIER')
      .reduce((sum, a) => sum + Number(a.value || 0), 0)

    const patrimoineFinancier = clientData.actifs
      .filter((a) => a.category === 'FINANCIER')
      .reduce((sum, a) => sum + Number(a.value || 0), 0)

    const patrimoineTotal = clientData.actifs.reduce((sum, a) => 
      sum + Number(a.value || 0), 0)

    // === SITUATION FAMILIALE ===
    const familyQuotient = calculateFamilyQuotient(clientData.client)

    return {
      revenusMensuels,
      revenusAnnuels: revenusMensuels * 12,
      salaires,
      revenusLocatifs,
      revenusInvestissement,
      autresRevenus: Math.max(0, revenusMensuels - salaires - revenusLocatifs - revenusInvestissement),
      chargesMensuelles,
      chargesLogement,
      chargesTransport,
      chargesAlimentation,
      autresCharges: Math.max(0, chargesMensuelles - chargesLogement - chargesTransport - chargesAlimentation),
      mensualitesCredits,
      capitalRestantDu,
      patrimoineImmobilier,
      patrimoineFinancier,
      patrimoineTotal,
      familyQuotient,
      age: calculateAge(clientData.client?.birthDate), // Champ Prisma: birthDate
    }
  }, [clientData])

  // 3. Appeler les calculateurs backend
  const runCalculators = useCallback(async () => {
    if (!computedTotals || !clientData) return

    setData(prev => ({ ...prev, isLoading: true }))
    const errors: Record<string, string | null> = {}

    try {
      // === 1. CAPACITÉ D'ENDETTEMENT ===
      if (computedTotals.revenusMensuels > 0) {
        try {
          const debtCapacityRes = await fetch('/api/advisor/calculators/budget/debt-capacity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              monthlyIncome: computedTotals.revenusMensuels,
              currentDebts: computedTotals.mensualitesCredits,
              interestRate: 0.035, // 3.5% exprimé en décimal comme attendu par le backend
              loanTerm: 20, // 20 ans par défaut
            }),
          })
          const debtCapacity = await debtCapacityRes.json()
          setData(prev => ({ ...prev, debtCapacity: debtCapacity.data }))
        } catch (e: unknown) {
          errors.debtCapacity = e instanceof Error ? e.message : 'Erreur inconnue'
        }
      } else {
        errors.debtCapacity = 'Revenus mensuels non renseignés - capacité non calculée'
      }

      // === 2. ANALYSE BUDGET ===
      try {
        const budgetRes = await fetch('/api/advisor/calculators/budget/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            income: {
              salary: computedTotals.salaires,
              bonuses: 0,
              rentalIncome: computedTotals.revenusLocatifs,
              investmentIncome: computedTotals.revenusInvestissement,
              otherIncome: computedTotals.autresRevenus,
            },
            expenses: {
              housing: computedTotals.chargesLogement,
              utilities: 0,
              food: computedTotals.chargesAlimentation,
              transportation: computedTotals.chargesTransport,
              insurance: 0,
              healthcare: 0,
              education: 0,
              entertainment: 0,
              savings: 0,
              otherExpenses: computedTotals.autresCharges,
            },
            debts: {
              mortgage: computedTotals.mensualitesCredits * 0.7, // Estimation
              consumerLoans: computedTotals.mensualitesCredits * 0.2,
              creditCards: 0,
              studentLoans: 0,
              otherDebts: computedTotals.mensualitesCredits * 0.1,
            },
          }),
        })
        const budgetAnalysis = await budgetRes.json()
        setData(prev => ({ ...prev, budgetAnalysis: budgetAnalysis.data }))
      } catch (e: unknown) {
        errors.budgetAnalysis = e instanceof Error ? e.message : 'Erreur inconnue'
      }

      // === 3. CALCUL IR ===
      try {
        const taxRes = await fetch('/api/advisor/calculators/tax/income', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            grossIncome: computedTotals.revenusAnnuels,
            deductions: computedTotals.revenusAnnuels * 0.1, // Abattement 10%
            familyQuotient: computedTotals.familyQuotient,
            year: 2024,
          }),
        })
        const incomeTax = await taxRes.json()
        setData(prev => ({ ...prev, incomeTax: incomeTax.data }))
      } catch (e: unknown) {
        errors.incomeTax = e instanceof Error ? e.message : 'Erreur inconnue'
      }

      // === 4. CALCUL IFI ===
      try {
        const wealthRes = await fetch('/api/advisor/calculators/tax/wealth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            totalWealth: computedTotals.patrimoineImmobilier,
            year: 2024,
          }),
        })
        const wealthTax = await wealthRes.json()
        setData(prev => ({ ...prev, wealthTax: wealthTax.data }))
      } catch (e: unknown) {
        errors.wealthTax = e instanceof Error ? e.message : 'Erreur inconnue'
      }

      // === 5. OPTIMISATION FISCALE ===
      try {
        const optimizeRes = await fetch('/api/advisor/calculators/tax/optimize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            income: computedTotals.revenusAnnuels,
            currentDeductions: computedTotals.revenusAnnuels * 0.1,
          }),
        })
        const taxOptimization = await optimizeRes.json()
        setData(prev => ({ ...prev, taxOptimization: taxOptimization.data }))
      } catch (e: unknown) {
        errors.taxOptimization = e instanceof Error ? e.message : 'Erreur inconnue'
      }

      // === 6. ÉPARGNE DE PRÉCAUTION ===
      try {
        const emergencyRes = await fetch('/api/advisor/calculators/budget/emergency-fund', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            monthlyExpenses: computedTotals.chargesMensuelles + computedTotals.mensualitesCredits,
            riskProfile: 'medium',
          }),
        })
        const emergencyFund = await emergencyRes.json()
        setData(prev => ({ ...prev, emergencyFund: emergencyFund.data }))
      } catch (e: unknown) {
        errors.emergencyFund = e instanceof Error ? e.message : 'Erreur inconnue'
      }

      // === 7. SIMULATION RETRAITE ===
      if (computedTotals.age && computedTotals.age > 0) {
        try {
          const retirementRes = await fetch('/api/advisor/simulators/retirement/simulate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              currentAge: computedTotals.age,
              retirementAge: 65,
              lifeExpectancy: 85,
              currentSavings: computedTotals.patrimoineFinancier,
              monthlyContribution: Math.max(0, computedTotals.revenusMensuels - computedTotals.chargesMensuelles - computedTotals.mensualitesCredits) * 0.2,
              expectedReturn: 0.04,
              inflationRate: 0.02,
              currentIncome: computedTotals.revenusMensuels,
              desiredReplacementRate: 0.7,
            }),
          })
          const retirement = await retirementRes.json()
          setData(prev => ({ ...prev, retirementSimulation: retirement.data }))
        } catch (e: unknown) {
          errors.retirementSimulation = e instanceof Error ? e.message : 'Erreur inconnue'
        }
      }

      setData(prev => ({ 
        ...prev, 
        errors, 
        isLoading: false, 
        lastUpdate: new Date() 
      }))
    } catch (error) {
      console.error('Erreur calculateurs:', error)
      setData(prev => ({ ...prev, isLoading: false }))
    }
  }, [computedTotals, clientData])

  // Calculer l'achat immobilier avec des paramètres personnalisés
  const calculateHomePurchase = useCallback(async (params: {
    targetPrice: number
    downPaymentPercent?: number
    currentSavings?: number
    timeHorizon: number
  }) => {
    try {
      const res = await fetch('/api/advisor/calculators/objectives/home-purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetPrice: params.targetPrice,
          downPaymentPercent: params.downPaymentPercent || 20,
          currentSavings: params.currentSavings || computedTotals?.patrimoineFinancier || 0,
          timeHorizon: params.timeHorizon,
          priceAppreciation: 2,
          closingCostsPercent: 8,
          clientId,
        }),
      })
      const result = await res.json()
      setData(prev => ({ ...prev, homePurchase: result.data }))
      return result.data
    } catch (error: unknown) {
      console.error('Erreur calcul achat immobilier:', error)
      return null
    }
  }, [clientId, computedTotals])

  // Effet: Charger les données au montage
  useEffect(() => {
    fetchClientData()
  }, [fetchClientData])

  // Effet: Lancer les calculs quand les données sont prêtes
  useEffect(() => {
    if (clientData && computedTotals) {
      runCalculators()
    }
  }, [clientData, computedTotals, runCalculators])

  return {
    ...data,
    clientData: computedTotals,
    refresh: async () => {
      await fetchClientData()
    },
    calculateHomePurchase,
  }
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Calcule le nombre de parts fiscales (quotient familial)
 * Champs Prisma utilisés:
 * - maritalStatus: MaritalStatus enum (SINGLE, MARRIED, PACS, DIVORCED, WIDOWED, SEPARATED)
 * - numberOfChildren: Int (nombre d'enfants)
 */
function calculateFamilyQuotient(client: ClientInfo | null): number {
  if (!client) return 1

  let parts = 1 // Célibataire de base

  // Situation matrimoniale - Champ Prisma: maritalStatus
  const maritalStatus = client.maritalStatus
  if (['MARRIED', 'PACS'].includes(maritalStatus)) {
    parts = 2
  } else if (maritalStatus === 'WIDOWED') {
    // Veuf avec enfants = 2.5 parts minimum
    parts = client.numberOfChildren > 0 ? 2 : 1
  }

  // Enfants - Champ Prisma: numberOfChildren
  const children = client.numberOfChildren || 0
  if (children >= 1) parts += 0.5
  if (children >= 2) parts += 0.5
  if (children >= 3) parts += children - 2 // 1 part par enfant à partir du 3ème

  return parts
}

/**
 * Calcule l'âge à partir de la date de naissance
 * Champ Prisma: birthDate (DateTime)
 */
function calculateAge(birthDate: string | Date | null | undefined): number {
  if (!birthDate) return 0
  const birth = new Date(birthDate)
  if (isNaN(birth.getTime())) return 0
  
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

export default useClientCalculators
