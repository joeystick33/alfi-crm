/**
 * Taxation Data Service
 * Service for transforming raw taxation data into Client360 FiscaliteData format
 * Implements IR and IFI calculations according to French tax law 2024
 */

import type {
  FiscaliteData,
  IRData,
  IFIData,
  RevenueSource,
  DeductibleCharge,
  TaxBracket,
  IFIAsset,
  TaxOptimization,
  TaxSimulation,
} from '@/app/_common/types/client360'
import {
  calculateIncomeTax,
  calculateTaxShares,
  calculateIFI,
  calculateMonthlyPayment,
} from './tax-service'

// ============================================================================
// Types
// ============================================================================

export interface RawClientData {
  id: string
  firstName: string
  lastName: string
  maritalStatus?: string
  numberOfChildren?: number
  annualIncome?: number | null
  taxBracket?: string | null
  ifiSubject?: boolean
  ifiAmount?: number | null
}

export interface RawBudgetData {
  professionalIncome?: {
    netSalary?: number
    selfEmployedIncome?: number
    bonuses?: number
    other?: number
  } | null
  assetIncome?: {
    rentalIncome?: number
    dividends?: number
    interest?: number
    capitalGains?: number
  } | null
  spouseIncome?: {
    netSalary?: number
    other?: number
  } | null
  retirementPensions?: {
    total?: number
  } | null
  allowances?: {
    total?: number
  } | null
}

export interface RawTaxationData {
  anneeFiscale?: number
  incomeTax?: {
    fiscalReferenceIncome?: number
    taxShares?: number
    quotientFamilial?: number
    taxBracket?: number
    annualAmount?: number
    monthlyPayment?: number
    taxCredits?: number
    taxReductions?: number
  } | null
  ifi?: {
    taxableRealEstateAssets?: number
    deductibleLiabilities?: number
    netTaxableIFI?: number
    ifiAmount?: number
    bracket?: string
    threshold?: number
  } | null
  socialContributions?: {
    taxableAssetIncome?: number
    rate?: number
    amount?: number
  } | null
}

export interface RawAsset {
  id: string
  name: string
  category: string
  value: number | string
  fiscalPropertyType?: string | null
  fiscalRpAbatement?: boolean
  fiscalManualDiscount?: number | null
  fiscalIfiValue?: number | null
}

export interface RawOptimization {
  id: string
  category: string
  title: string
  description: string
  potentialSavings?: number | null
  status: string
}

// ============================================================================
// IR Calculation Functions
// ============================================================================

/**
 * Calculate revenue sources from budget data
 */
export function calculateRevenueSources(budget: RawBudgetData | null): RevenueSource[] {
  const sources: RevenueSource[] = []

  if (!budget) return sources

  // Professional income
  if (budget.professionalIncome) {
    const prof = budget.professionalIncome
    if (prof.netSalary && prof.netSalary > 0) {
      sources.push({
        id: 'salary',
        type: 'SALAIRE',
        label: 'Salaire net imposable',
        amount: prof.netSalary,
      })
    }
    if (prof.selfEmployedIncome && prof.selfEmployedIncome > 0) {
      sources.push({
        id: 'self-employed',
        type: 'BNC_BIC',
        label: 'Revenus indépendants (BNC/BIC)',
        amount: prof.selfEmployedIncome,
      })
    }
    if (prof.bonuses && prof.bonuses > 0) {
      sources.push({
        id: 'bonuses',
        type: 'PRIMES',
        label: 'Primes et bonus',
        amount: prof.bonuses,
      })
    }
    if (prof.other && prof.other > 0) {
      sources.push({
        id: 'prof-other',
        type: 'AUTRES_PRO',
        label: 'Autres revenus professionnels',
        amount: prof.other,
      })
    }
  }

  // Asset income
  if (budget.assetIncome) {
    const asset = budget.assetIncome
    if (asset.rentalIncome && asset.rentalIncome > 0) {
      sources.push({
        id: 'rental',
        type: 'FONCIER',
        label: 'Revenus fonciers',
        amount: asset.rentalIncome,
      })
    }
    if (asset.dividends && asset.dividends > 0) {
      sources.push({
        id: 'dividends',
        type: 'DIVIDENDES',
        label: 'Dividendes',
        amount: asset.dividends,
      })
    }
    if (asset.interest && asset.interest > 0) {
      sources.push({
        id: 'interest',
        type: 'INTERETS',
        label: 'Intérêts',
        amount: asset.interest,
      })
    }
    if (asset.capitalGains && asset.capitalGains > 0) {
      sources.push({
        id: 'capital-gains',
        type: 'PLUS_VALUES',
        label: 'Plus-values',
        amount: asset.capitalGains,
      })
    }
  }

  // Spouse income
  if (budget.spouseIncome) {
    const spouse = budget.spouseIncome
    if (spouse.netSalary && spouse.netSalary > 0) {
      sources.push({
        id: 'spouse-salary',
        type: 'SALAIRE_CONJOINT',
        label: 'Salaire conjoint',
        amount: spouse.netSalary,
      })
    }
    if (spouse.other && spouse.other > 0) {
      sources.push({
        id: 'spouse-other',
        type: 'AUTRES_CONJOINT',
        label: 'Autres revenus conjoint',
        amount: spouse.other,
      })
    }
  }

  // Retirement pensions
  if (budget.retirementPensions?.total && budget.retirementPensions.total > 0) {
    sources.push({
      id: 'pensions',
      type: 'PENSIONS',
      label: 'Pensions de retraite',
      amount: budget.retirementPensions.total,
    })
  }

  // Allowances
  if (budget.allowances?.total && budget.allowances.total > 0) {
    sources.push({
      id: 'allowances',
      type: 'ALLOCATIONS',
      label: 'Allocations',
      amount: budget.allowances.total,
    })
  }

  return sources
}

/**
 * Calculate deductible charges (simplified - can be extended)
 */
export function calculateDeductibleCharges(): DeductibleCharge[] {
  // Standard deductions - in a real implementation, these would come from client data
  return [
    {
      id: 'csg-deductible',
      type: 'CSG_DEDUCTIBLE',
      label: 'CSG déductible (6.8%)',
      amount: 0, // Would be calculated from actual income
    },
    {
      id: 'pension-alimentaire',
      type: 'PENSION_ALIMENTAIRE',
      label: 'Pension alimentaire versée',
      amount: 0,
    },
    {
      id: 'per-versements',
      type: 'PER',
      label: 'Versements PER',
      amount: 0,
    },
  ]
}

/**
 * Build tax brackets with current bracket indicator
 */
export function buildTaxBrackets(currentBracketRate: number): TaxBracket[] {
  const brackets: TaxBracket[] = [
    { min: 0, max: 11294, rate: 0, isCurrentBracket: currentBracketRate === 0 },
    { min: 11294, max: 28797, rate: 11, isCurrentBracket: currentBracketRate === 11 },
    { min: 28797, max: 82341, rate: 30, isCurrentBracket: currentBracketRate === 30 },
    { min: 82341, max: 177106, rate: 41, isCurrentBracket: currentBracketRate === 41 },
    { min: 177106, max: Infinity, rate: 45, isCurrentBracket: currentBracketRate === 45 },
  ]
  return brackets
}

/**
 * Calculate IR data from client and budget information
 */
export function calculateIRData(
  client: RawClientData,
  budget: RawBudgetData | null,
  taxation: RawTaxationData | null
): IRData {
  // Calculate revenue sources
  const revenueSources = calculateRevenueSources(budget)
  const totalIncome = revenueSources.reduce((sum, s) => sum + s.amount, 0)

  // Use stored taxation data if available, otherwise calculate
  let fiscalShares: number
  let taxableIncome: number
  let taxResult: ReturnType<typeof calculateIncomeTax>

  if (taxation?.incomeTax?.fiscalReferenceIncome && taxation.incomeTax.taxShares) {
    // Use stored data
    fiscalShares = taxation.incomeTax.taxShares
    taxableIncome = taxation.incomeTax.fiscalReferenceIncome
    taxResult = calculateIncomeTax(taxableIncome, fiscalShares)
  } else {
    // Calculate from client data
    fiscalShares = calculateTaxShares(
      client.maritalStatus || 'SINGLE',
      client.numberOfChildren || 0,
      0
    )
    taxableIncome = totalIncome > 0 ? totalIncome : (Number(client.annualIncome) || 0)
    taxResult = calculateIncomeTax(taxableIncome, fiscalShares)
  }

  const deductibleCharges = calculateDeductibleCharges()
  const brackets = buildTaxBrackets(taxResult.taxBracket)

  return {
    taxableIncome,
    revenueSources,
    deductibleCharges,
    fiscalShares,
    marginalRate: taxResult.taxBracket,
    brackets,
    annualTax: taxResult.netTax,
    monthlyPayment: calculateMonthlyPayment(taxResult.netTax),
  }
}

// ============================================================================
// IFI Calculation Functions
// ============================================================================

/**
 * Categorize assets for IFI calculation
 */
export function categorizeAssetsForIFI(assets: RawAsset[]): {
  taxableAssets: IFIAsset[]
  nonTaxableAssets: IFIAsset[]
  totalTaxable: number
} {
  const taxableAssets: IFIAsset[] = []
  const nonTaxableAssets: IFIAsset[] = []
  let totalTaxable = 0

  for (const asset of assets) {
    const value = typeof asset.value === 'string' ? parseFloat(asset.value) : asset.value
    const isRealEstate = asset.category === 'IMMOBILIER'

    if (isRealEstate) {
      // Calculate IFI value with abatements
      let ifiValue = value
      let reason = ''

      // Apply 30% abatement for main residence
      if (asset.fiscalPropertyType === 'RP' || asset.fiscalRpAbatement) {
        ifiValue = value * 0.7
        reason = 'Abattement 30% résidence principale'
      }

      // Apply manual discount if any
      if (asset.fiscalManualDiscount && asset.fiscalManualDiscount > 0) {
        ifiValue = ifiValue * (1 - asset.fiscalManualDiscount / 100)
        reason = reason ? `${reason}, décote ${asset.fiscalManualDiscount}%` : `Décote ${asset.fiscalManualDiscount}%`
      }

      // Use pre-calculated IFI value if available
      if (asset.fiscalIfiValue) {
        ifiValue = typeof asset.fiscalIfiValue === 'string' 
          ? parseFloat(asset.fiscalIfiValue) 
          : asset.fiscalIfiValue
      }

      taxableAssets.push({
        id: asset.id,
        name: asset.name,
        value: ifiValue,
        isTaxable: true,
        reason: reason || 'Bien immobilier taxable',
      })
      totalTaxable += ifiValue
    } else {
      // Non-real estate assets are not subject to IFI
      nonTaxableAssets.push({
        id: asset.id,
        name: asset.name,
        value,
        isTaxable: false,
        reason: 'Actif non immobilier (hors IFI)',
      })
    }
  }

  return { taxableAssets, nonTaxableAssets, totalTaxable }
}

/**
 * Calculate IFI data from assets and taxation information
 */
export function calculateIFIData(
  assets: RawAsset[],
  taxation: RawTaxationData | null,
  optimizations: RawOptimization[]
): IFIData {
  const { taxableAssets, nonTaxableAssets, totalTaxable } = categorizeAssetsForIFI(assets)

  // Get deductible liabilities from taxation data
  const deductibleLiabilities = taxation?.ifi?.deductibleLiabilities || 0

  // Calculate net taxable base
  const taxableBase = Math.max(0, totalTaxable - deductibleLiabilities)

  // Calculate IFI amount
  const ifiResult = calculateIFI(taxableBase)

  // Transform optimizations
  const taxOptimizations: TaxOptimization[] = optimizations
    .filter(opt => opt.category === 'WEALTH' || opt.category === 'TAX')
    .map(opt => ({
      id: opt.id,
      type: opt.category,
      description: opt.description,
      potentialSavings: opt.potentialSavings || 0,
      complexity: 'MOYENNE' as const,
    }))

  return {
    taxableBase,
    taxableAssets,
    nonTaxableAssets,
    deductibleLiabilities,
    amount: ifiResult.ifiAmount,
    bracket: ifiResult.bracket,
    optimizations: taxOptimizations,
  }
}

// ============================================================================
// Main Service Function
// ============================================================================

/**
 * Build complete FiscaliteData from raw data sources
 */
export function buildFiscaliteData(
  client: RawClientData,
  budget: RawBudgetData | null,
  taxation: RawTaxationData | null,
  assets: RawAsset[],
  optimizations: RawOptimization[],
  simulations: TaxSimulation[] = []
): FiscaliteData {
  const ir = calculateIRData(client, budget, taxation)
  const ifi = calculateIFIData(assets, taxation, optimizations)

  return {
    ir,
    ifi,
    simulations,
  }
}

// ============================================================================
// Simulation Functions
// ============================================================================

/**
 * Simulate IR with modified parameters
 */
export function simulateIR(
  currentIR: IRData,
  modifications: {
    additionalIncome?: number
    additionalDeductions?: number
    additionalChildren?: number
  }
): { simulatedTax: number; delta: number } {
  const newTaxableIncome = currentIR.taxableIncome + (modifications.additionalIncome || 0) - (modifications.additionalDeductions || 0)
  const newShares = currentIR.fiscalShares + (modifications.additionalChildren || 0) * 0.5

  const result = calculateIncomeTax(newTaxableIncome, newShares)

  return {
    simulatedTax: result.netTax,
    delta: result.netTax - currentIR.annualTax,
  }
}

/**
 * Simulate IFI with modified parameters
 */
export function simulateIFI(
  currentIFI: IFIData,
  modifications: {
    additionalRealEstate?: number
    additionalDeductions?: number
  }
): { simulatedAmount: number; delta: number } {
  const newTaxableBase = currentIFI.taxableBase + 
    (modifications.additionalRealEstate || 0) - 
    (modifications.additionalDeductions || 0)

  const result = calculateIFI(newTaxableBase)

  return {
    simulatedAmount: result.ifiAmount,
    delta: result.ifiAmount - currentIFI.amount,
  }
}
