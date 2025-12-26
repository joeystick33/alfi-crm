'use client'

/**
 * useClientToolsContext - Hook pour outils patrimoniaux contextualisés
 * 
 * Quand un client est sélectionné, ce hook permet:
 * - De pré-remplir les calculateurs avec ses données réelles
 * - De sauvegarder les simulations dans son historique
 * - De récupérer ses dernières simulations
 */

import { useState, useCallback, useMemo } from 'react'
import { useToast } from '@/app/_common/hooks/use-toast'
import type { ClientDetail } from '@/app/_common/lib/api-types'

// =============================================================================
// Types
// =============================================================================

interface ClientContext {
  clientId: string
  client: ClientDetail | null
  isLoaded: boolean
}

interface TaxCalculatorInput {
  grossIncome: number
  deductions: number
  familyQuotient: number
  year: number
}

interface WealthTaxInput {
  totalWealth: number
  mainResidenceValue?: number
  year: number
}

interface InheritanceInput {
  inheritanceAmount: number
  relationship: string
  previousDonations?: number
}

interface DonationInput {
  donationAmount: number
  relationship: string
  donationType: 'cash' | 'property' | 'securities'
}

interface BudgetInput {
  income: {
    salary: number
    bonuses: number
    rentalIncome: number
    investmentIncome: number
    otherIncome: number
  }
  expenses: {
    housing: number
    utilities: number
    food: number
    transportation: number
    insurance: number
    healthcare: number
    entertainment: number
    savings: number
    otherExpenses: number
  }
  debts: {
    mortgage: number
    consumerLoans: number
    creditCards: number
    otherDebts: number
  }
}

interface RetirementInput {
  currentAge: number
  retirementAge: number
  currentSavings: number
  monthlyContribution: number
  expectedReturn: number
  inflationRate: number
  currentIncome: number
}

interface SimulationResult {
  id: string
  type: string
  clientId: string
  input: Record<string, unknown>
  output: Record<string, unknown>
  createdAt: Date
  savedToHistory: boolean
}

// Internal types for client data access
interface IncomeItem {
  type?: string
  amount?: number
}

interface ExpenseItem {
  category?: string
  amount?: number
}

interface LiabilityItem {
  type?: string
  amount?: number
  remainingAmount?: number
  monthlyPayment?: number
}

interface AssetItem {
  type?: string
  subtype?: string
  category?: string
  value?: number
  currentValue?: number
}

interface ClientExtended extends ClientDetail {
  incomes?: IncomeItem[]
  expenses?: ExpenseItem[]
  liabilities?: LiabilityItem[]
  assets?: AssetItem[]
  childrenCount?: number
}

interface UseClientToolsContextReturn {
  // Context
  clientContext: ClientContext
  setClientContext: (client: ClientDetail | null) => void
  clearContext: () => void
  
  // Pre-filled inputs
  getTaxCalculatorInput: () => TaxCalculatorInput
  getWealthTaxInput: () => WealthTaxInput
  getInheritanceInput: () => Partial<InheritanceInput>
  getDonationInput: () => Partial<DonationInput>
  getBudgetInput: () => Partial<BudgetInput>
  getRetirementInput: () => Partial<RetirementInput>
  
  // Simulation management
  saveSimulation: (type: string, input: Record<string, unknown>, output: Record<string, unknown>) => Promise<string>
  getSimulationHistory: (type?: string) => SimulationResult[]
  
  // Utility
  isClientContext: boolean
  formatForAPI: <T>(input: T) => T
}

// =============================================================================
// Hook Implementation
// =============================================================================

export function useClientToolsContext(): UseClientToolsContextReturn {
  const { toast } = useToast()
  
  const [clientContext, setClientContextState] = useState<ClientContext>({
    clientId: '',
    client: null,
    isLoaded: false,
  })
  
  const [simulationHistory, setSimulationHistory] = useState<SimulationResult[]>([])
  
  // Check if we have a client context
  const isClientContext = useMemo(() => {
    return clientContext.clientId !== '' && clientContext.client !== null
  }, [clientContext])
  
  // Set client context
  const setClientContext = useCallback((client: ClientDetail | null) => {
    if (client) {
      setClientContextState({
        clientId: client.id,
        client,
        isLoaded: true,
      })
      // Load simulation history for this client
      loadSimulationHistory(client.id)
    } else {
      clearContext()
    }
  }, [])
  
  // Clear context
  const clearContext = useCallback(() => {
    setClientContextState({
      clientId: '',
      client: null,
      isLoaded: false,
    })
    setSimulationHistory([])
  }, [])
  
  // Load simulation history from API
  const loadSimulationHistory = async (clientId: string) => {
    try {
      const response = await fetch(`/api/advisor/clients/${clientId}/simulations`, {
        credentials: 'include',
      })
      
      if (response.ok) {
        const data = await response.json()
        // Transformer les données API vers le format SimulationResult
        const simulations = (data.simulations || []).map((s: Record<string, unknown>) => ({
          id: s.id,
          type: s.type,
          clientId: clientId,
          input: s.parameters,
          output: s.results,
          createdAt: new Date(s.createdAt as string),
          savedToHistory: true,
        }))
        setSimulationHistory(simulations)
      } else {
        // Fallback sur localStorage si API échoue
        const stored = localStorage.getItem(`simulations_${clientId}`)
        if (stored) {
          setSimulationHistory(JSON.parse(stored))
        }
      }
    } catch (error) {
      console.error('Error loading simulation history:', error)
      // Fallback sur localStorage
      const stored = localStorage.getItem(`simulations_${clientId}`)
      if (stored) {
        setSimulationHistory(JSON.parse(stored))
      }
    }
  }
  
  // ==========================================================================
  // Pre-filled inputs based on client data
  // ==========================================================================
  
  const getTaxCalculatorInput = useCallback((): TaxCalculatorInput => {
    const client = clientContext.client
    if (!client) {
      return {
        grossIncome: 0,
        deductions: 0,
        familyQuotient: 1,
        year: new Date().getFullYear(),
      }
    }
    
    // Calculate gross income from client data
    const clientExt = client as ClientExtended
    const incomes = clientExt.incomes || []
    const grossIncome = incomes.reduce((sum, inc) => sum + (inc.amount || 0), 0) * 12
    
    // Calculate family quotient based on family situation
    let familyQuotient = 1
    const familyStatus = client.familyStatus
    if (familyStatus === 'MARRIED' || familyStatus === 'PACS') {
      familyQuotient = 2
    }
    // Add children (0.5 per child for first two, 1 for subsequent)
    const childrenCount = clientExt.childrenCount || 0
    if (childrenCount >= 1) familyQuotient += 0.5
    if (childrenCount >= 2) familyQuotient += 0.5
    if (childrenCount >= 3) familyQuotient += childrenCount - 2
    
    return {
      grossIncome,
      deductions: grossIncome * 0.10, // Default 10% deduction
      familyQuotient,
      year: new Date().getFullYear(),
    }
  }, [clientContext.client])
  
  const getWealthTaxInput = useCallback((): WealthTaxInput => {
    const client = clientContext.client
    if (!client) {
      return {
        totalWealth: 0,
        year: new Date().getFullYear(),
      }
    }
    
    // Calculate total real estate wealth
    const clientExt = client as ClientExtended
    const assets = clientExt.assets || []
    const realEstateWealth = assets
      .filter((a) => a.category === 'REAL_ESTATE' || a.type?.includes('IMMOBILIER'))
      .reduce((sum, a) => sum + (a.currentValue || a.value || 0), 0)
    
    // Find main residence value for IFI deduction
    const mainResidence = assets.find((a) => 
      a.type === 'RESIDENCE_PRINCIPALE' || a.subtype === 'RESIDENCE_PRINCIPALE'
    )
    
    return {
      totalWealth: realEstateWealth,
      mainResidenceValue: mainResidence?.currentValue || mainResidence?.value,
      year: new Date().getFullYear(),
    }
  }, [clientContext.client])
  
  const getInheritanceInput = useCallback((): Partial<InheritanceInput> => {
    const client = clientContext.client
    if (!client) return {}
    
    // Calculate total estate value
    const clientExt = client as ClientExtended
    const assets = clientExt.assets || []
    const liabilities = clientExt.liabilities || []
    
    const totalAssets = assets.reduce((sum, a) => sum + (a.currentValue || a.value || 0), 0)
    const totalLiabilities = liabilities.reduce((sum, l) => sum + (l.remainingAmount || l.amount || 0), 0)
    
    return {
      inheritanceAmount: totalAssets - totalLiabilities,
    }
  }, [clientContext.client])
  
  const getDonationInput = useCallback((): Partial<DonationInput> => {
    // Returns empty as donation amount is user-defined
    return {}
  }, [])
  
  const getBudgetInput = useCallback((): Partial<BudgetInput> => {
    const client = clientContext.client
    if (!client) return {}
    
    const clientExt = client as ClientExtended
    const incomes = clientExt.incomes || []
    const expenses = clientExt.expenses || []
    const liabilities = clientExt.liabilities || []
    
    // Map incomes
    const incomeByType = incomes.reduce<Record<string, number>>((acc, inc) => {
      acc[inc.type?.toLowerCase() || 'other'] = (inc.amount || 0)
      return acc
    }, {})
    
    // Map expenses
    const expenseByCategory = expenses.reduce<Record<string, number>>((acc, exp) => {
      acc[exp.category?.toLowerCase() || 'other'] = (exp.amount || 0)
      return acc
    }, {})
    
    // Map debts
    const debtByType = liabilities.reduce<Record<string, number>>((acc, l) => {
      const type = l.type?.toLowerCase() || 'other'
      acc[type] = (acc[type] || 0) + (l.monthlyPayment || 0)
      return acc
    }, {})
    
    return {
      income: {
        salary: incomeByType.salary || incomeByType.salaire || 0,
        bonuses: incomeByType.bonuses || incomeByType.primes || 0,
        rentalIncome: incomeByType.rental || incomeByType.loyers || 0,
        investmentIncome: incomeByType.investment || incomeByType.dividendes || 0,
        otherIncome: incomeByType.other || incomeByType.autres || 0,
      },
      expenses: {
        housing: expenseByCategory.housing || expenseByCategory.logement || 0,
        utilities: expenseByCategory.utilities || expenseByCategory.energie || 0,
        food: expenseByCategory.food || expenseByCategory.alimentation || 0,
        transportation: expenseByCategory.transportation || expenseByCategory.transport || 0,
        insurance: expenseByCategory.insurance || expenseByCategory.assurances || 0,
        healthcare: expenseByCategory.healthcare || expenseByCategory.sante || 0,
        entertainment: expenseByCategory.entertainment || expenseByCategory.loisirs || 0,
        savings: expenseByCategory.savings || expenseByCategory.epargne || 0,
        otherExpenses: expenseByCategory.other || expenseByCategory.autres || 0,
      },
      debts: {
        mortgage: debtByType.mortgage || debtByType.immobilier || 0,
        consumerLoans: debtByType.consumer || debtByType.consommation || 0,
        creditCards: debtByType.credit_card || 0,
        otherDebts: debtByType.other || 0,
      },
    }
  }, [clientContext.client])
  
  const getRetirementInput = useCallback((): Partial<RetirementInput> => {
    const client = clientContext.client
    if (!client) return {}
    
    // Calculate current age
    const birthDate = client.birthDate ? new Date(client.birthDate) : null
    const currentAge = birthDate 
      ? Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : 45
    
    // Get retirement assets
    const clientExt = client as ClientExtended
    const assets = clientExt.assets || []
    const retirementAssets = assets.filter((a) => 
      a.type === 'PER' || a.type === 'ASSURANCE_VIE' || a.subtype?.includes('RETRAITE')
    )
    const currentSavings = retirementAssets.reduce((sum, a) => sum + (a.currentValue || a.value || 0), 0)
    
    // Get current income
    const incomes = clientExt.incomes || []
    const currentIncome = incomes.reduce((sum, inc) => sum + (inc.amount || 0), 0) * 12
    
    return {
      currentAge,
      retirementAge: 64, // Default legal retirement age
      currentSavings,
      currentIncome,
      expectedReturn: 0.04, // 4% default
      inflationRate: 0.02, // 2% default
    }
  }, [clientContext.client])
  
  // ==========================================================================
  // Simulation management
  // ==========================================================================
  
  const saveSimulation = useCallback(async (
    type: string,
    input: Record<string, unknown>,
    output: Record<string, unknown>
  ): Promise<string> => {
    if (!isClientContext) {
      toast({
        title: 'Aucun client sélectionné',
        description: 'La simulation ne sera pas sauvegardée.',
        variant: 'default',
      })
      return ''
    }
    
    const simulation: SimulationResult = {
      id: `sim_${Date.now()}`,
      type,
      clientId: clientContext.clientId,
      input,
      output,
      createdAt: new Date(),
      savedToHistory: true,
    }
    
    try {
      // Save to API
      const response = await fetch(`/api/advisor/clients/${clientContext.clientId}/simulations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          type,
          name: `Simulation ${type} - ${new Date().toLocaleDateString('fr-FR')}`,
          parameters: input,
          results: output,
        }),
      })
      
      if (response.ok) {
        const data = await response.json()
        const savedSimulation = {
          ...simulation,
          id: data.simulation.id,
        }
        const updated = [...simulationHistory, savedSimulation]
        setSimulationHistory(updated)
        
        toast({
          title: 'Simulation sauvegardée',
          description: `Enregistrée dans l'historique de ${clientContext.client?.firstName} ${clientContext.client?.lastName}`,
        })
        
        return savedSimulation.id
      } else {
        // Fallback sur localStorage si API échoue
        const updated = [...simulationHistory, simulation]
        setSimulationHistory(updated)
        localStorage.setItem(`simulations_${clientContext.clientId}`, JSON.stringify(updated))
        
        toast({
          title: 'Simulation sauvegardée localement',
          description: 'La synchronisation avec le serveur a échoué.',
          variant: 'default',
        })
        
        return simulation.id
      }
    } catch (error) {
      console.error('Error saving simulation:', error)
      // Fallback sur localStorage
      const updated = [...simulationHistory, simulation]
      setSimulationHistory(updated)
      localStorage.setItem(`simulations_${clientContext.clientId}`, JSON.stringify(updated))
      
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder la simulation sur le serveur.',
        variant: 'destructive',
      })
      return simulation.id
    }
  }, [isClientContext, clientContext, simulationHistory, toast])
  
  const getSimulationHistory = useCallback((type?: string): SimulationResult[] => {
    if (type) {
      return simulationHistory.filter(s => s.type === type)
    }
    return simulationHistory
  }, [simulationHistory])
  
  // Utility function to format input for API
  const formatForAPI = useCallback(<T,>(input: T): T => {
    // Deep clone and clean undefined values
    return JSON.parse(JSON.stringify(input))
  }, [])
  
  return {
    clientContext,
    setClientContext,
    clearContext,
    getTaxCalculatorInput,
    getWealthTaxInput,
    getInheritanceInput,
    getDonationInput,
    getBudgetInput,
    getRetirementInput,
    saveSimulation,
    getSimulationHistory,
    isClientContext,
    formatForAPI,
  }
}

export default useClientToolsContext
