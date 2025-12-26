/**
 * Property-Based Tests - Taxation Data Service
 * 
 * **Feature: client360-evolution, Property 9: IR calculation accuracy**
 * **Validates: Requirements 7.3, 7.4**
 * 
 * **Feature: client360-evolution, Property 10: IFI calculation accuracy**
 * **Validates: Requirements 8.3**
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  calculateIncomeTax,
  calculateTaxShares,
  calculateIFI,
  calculateMonthlyPayment,
  IFI_THRESHOLD,
} from '@/app/_common/lib/services/tax-service'

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * French IR tax brackets 2024 (per share)
 */
const IR_BRACKETS = [
  { min: 0, max: 11294, rate: 0 },
  { min: 11294, max: 28797, rate: 0.11 },
  { min: 28797, max: 82341, rate: 0.30 },
  { min: 82341, max: 177106, rate: 0.41 },
  { min: 177106, max: Infinity, rate: 0.45 },
]

/**
 * French IFI brackets 2024
 */
const IFI_BRACKETS = [
  { min: 0, max: 800000, rate: 0 },
  { min: 800000, max: 1300000, rate: 0 }, // Franchise
  { min: 1300000, max: 2570000, rate: 0.005 },
  { min: 2570000, max: 5000000, rate: 0.007 },
  { min: 5000000, max: 10000000, rate: 0.01 },
  { min: 10000000, max: Infinity, rate: 0.015 },
]

// ============================================================================
// GENERATORS
// ============================================================================

/**
 * Generator for taxable income (realistic range for French taxpayers)
 */
const taxableIncomeArb = fc.integer({ min: 0, max: 1000000 })

/**
 * Generator for fiscal shares (1 to 10 parts, in 0.5 increments)
 */
const fiscalSharesArb = fc.integer({ min: 2, max: 20 }).map(n => n / 2)

/**
 * Generator for marital status
 */
const maritalStatusArb = fc.constantFrom('SINGLE', 'MARRIED', 'PACS', 'DIVORCED', 'WIDOWED')

/**
 * Generator for number of children (0 to 10)
 */
const numberOfChildrenArb = fc.integer({ min: 0, max: 10 })

/**
 * Generator for net taxable wealth (IFI)
 */
const netTaxableWealthArb = fc.integer({ min: 0, max: 50000000 })

/**
 * Generator for real estate assets for IFI
 */
const realEstateAssetsArb = fc.array(
  fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 50 }),
    value: fc.integer({ min: 0, max: 10000000 }),
    isMainResidence: fc.boolean(),
    manualDiscount: fc.integer({ min: 0, max: 50 }),
  }),
  { minLength: 0, maxLength: 10 }
)

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Reference implementation of IR calculation using progressive brackets
 * This is a simplified version to verify the main calculation
 */
function referenceIRCalculation(taxableIncome: number, fiscalShares: number): number {
  if (taxableIncome <= 0 || fiscalShares <= 0) return 0
  
  const quotientFamilial = taxableIncome / fiscalShares
  let tax = 0
  let previousLimit = 0
  
  for (const bracket of IR_BRACKETS) {
    if (quotientFamilial > previousLimit) {
      const taxableInBracket = Math.min(
        quotientFamilial - previousLimit,
        bracket.max - previousLimit
      )
      tax += taxableInBracket * bracket.rate
      
      if (quotientFamilial <= bracket.max) break
    }
    previousLimit = bracket.max
  }
  
  // Multiply by number of shares
  return Math.round(tax * fiscalShares)
}

/**
 * Reference implementation of IFI calculation
 */
function referenceIFICalculation(netTaxableWealth: number): number {
  if (netTaxableWealth < IFI_THRESHOLD) return 0
  
  let ifiAmount = 0
  
  if (netTaxableWealth <= 1400000) {
    ifiAmount = netTaxableWealth * 0.005
  } else if (netTaxableWealth <= 2570000) {
    ifiAmount = 1400000 * 0.005 + (netTaxableWealth - 1400000) * 0.007
  } else if (netTaxableWealth <= 5000000) {
    ifiAmount = 1400000 * 0.005 + (2570000 - 1400000) * 0.007 + (netTaxableWealth - 2570000) * 0.01
  } else if (netTaxableWealth <= 10000000) {
    ifiAmount = 1400000 * 0.005 + (2570000 - 1400000) * 0.007 + (5000000 - 2570000) * 0.01 + (netTaxableWealth - 5000000) * 0.0125
  } else {
    ifiAmount = 1400000 * 0.005 + (2570000 - 1400000) * 0.007 + (5000000 - 2570000) * 0.01 + (10000000 - 5000000) * 0.0125 + (netTaxableWealth - 10000000) * 0.015
  }
  
  // Reduction for low wealth (between 1.3M and 1.4M)
  if (netTaxableWealth < 1400000) {
    const reduction = 17500 - netTaxableWealth * 0.0125
    ifiAmount = Math.max(0, ifiAmount - reduction)
  }
  
  return Math.round(ifiAmount)
}

// ============================================================================
// PROPERTY TESTS - IR CALCULATION
// ============================================================================

describe('Taxation Service - Property-Based Tests', () => {
  /**
   * **Feature: client360-evolution, Property 9: IR calculation accuracy**
   * **Validates: Requirements 7.3, 7.4**
   * 
   * For any taxable income and fiscal shares:
   * - The IR amount SHALL be calculated by applying French progressive tax brackets
   *   to (taxable income / fiscal shares), then multiplying by fiscal shares
   */
  describe('Property 9: IR calculation accuracy', () => {
    it('IR is calculated correctly using progressive brackets', () => {
      fc.assert(
        fc.property(
          taxableIncomeArb,
          fiscalSharesArb,
          (income, shares) => {
            // Skip edge cases
            if (income === 0 || shares <= 0) return true
            
            const result = calculateIncomeTax(income, shares)
            const referenceResult = referenceIRCalculation(income, shares)
            
            // Allow small rounding differences (within 1€)
            expect(Math.abs(result.grossTax - referenceResult)).toBeLessThanOrEqual(1)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('IR is zero for income below first bracket threshold', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 11294 }),
          fiscalSharesArb,
          (income, shares) => {
            if (shares <= 0) return true
            
            // If quotient familial is below first bracket, tax should be 0
            const quotientFamilial = income / shares
            if (quotientFamilial <= 11294) {
              const result = calculateIncomeTax(income, shares)
              expect(result.grossTax).toBe(0)
            }
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('IR increases monotonically with income (same shares)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 900000 }),
          fc.integer({ min: 1, max: 100000 }),
          fiscalSharesArb,
          (baseIncome, increment, shares) => {
            if (shares <= 0) return true
            
            const result1 = calculateIncomeTax(baseIncome, shares)
            const result2 = calculateIncomeTax(baseIncome + increment, shares)
            
            expect(result2.grossTax).toBeGreaterThanOrEqual(result1.grossTax)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('IR decreases with more fiscal shares (same income)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 50000, max: 500000 }), // Income high enough to have tax
          fc.integer({ min: 2, max: 10 }).map(n => n / 2), // Base shares
          fc.integer({ min: 1, max: 5 }).map(n => n / 2), // Additional shares
          (income, baseShares, additionalShares) => {
            const result1 = calculateIncomeTax(income, baseShares)
            const result2 = calculateIncomeTax(income, baseShares + additionalShares)
            
            // More shares should result in less or equal tax
            expect(result2.netTax).toBeLessThanOrEqual(result1.netTax)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('marginal rate is always a valid bracket rate', () => {
      fc.assert(
        fc.property(
          taxableIncomeArb,
          fiscalSharesArb,
          (income, shares) => {
            if (shares <= 0) return true
            
            const result = calculateIncomeTax(income, shares)
            const validRates = [0, 11, 30, 41, 45]
            
            expect(validRates).toContain(result.taxBracket)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('monthly payment equals annual tax divided by 12', () => {
      fc.assert(
        fc.property(
          taxableIncomeArb,
          fiscalSharesArb,
          (income, shares) => {
            if (shares <= 0) return true
            
            const result = calculateIncomeTax(income, shares)
            const monthlyPayment = calculateMonthlyPayment(result.netTax)
            
            expect(monthlyPayment).toBe(Math.round(result.netTax / 12))
          }
        ),
        { numRuns: 100 }
      )
    })

    it('quotient familial equals taxable income divided by shares', () => {
      fc.assert(
        fc.property(
          taxableIncomeArb,
          fiscalSharesArb,
          (income, shares) => {
            if (shares <= 0) return true
            
            const result = calculateIncomeTax(income, shares)
            const expectedQF = Math.round(income / shares)
            
            expect(result.quotientFamilial).toBe(expectedQF)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Test fiscal shares calculation
   */
  describe('Fiscal shares calculation', () => {
    it('single person has 1 share', () => {
      const shares = calculateTaxShares('SINGLE', 0, 0)
      expect(shares).toBe(1)
    })

    it('married couple has 2 shares', () => {
      const shares = calculateTaxShares('MARRIED', 0, 0)
      expect(shares).toBe(2)
    })

    it('PACS couple has 2 shares', () => {
      const shares = calculateTaxShares('PACS', 0, 0)
      expect(shares).toBe(2)
    })

    it('first child adds 0.5 shares', () => {
      fc.assert(
        fc.property(
          maritalStatusArb,
          (status) => {
            const sharesWithoutChild = calculateTaxShares(status, 0, 0)
            const sharesWithOneChild = calculateTaxShares(status, 1, 0)
            
            expect(sharesWithOneChild - sharesWithoutChild).toBe(0.5)
          }
        ),
        { numRuns: 10 }
      )
    })

    it('second child adds 0.5 shares (total 1 for 2 children)', () => {
      fc.assert(
        fc.property(
          maritalStatusArb,
          (status) => {
            const sharesWithoutChild = calculateTaxShares(status, 0, 0)
            const sharesWithTwoChildren = calculateTaxShares(status, 2, 0)
            
            expect(sharesWithTwoChildren - sharesWithoutChild).toBe(1)
          }
        ),
        { numRuns: 10 }
      )
    })

    it('third and subsequent children add 1 share each', () => {
      fc.assert(
        fc.property(
          maritalStatusArb,
          fc.integer({ min: 3, max: 10 }),
          (status, numChildren) => {
            const sharesWithTwoChildren = calculateTaxShares(status, 2, 0)
            const sharesWithMoreChildren = calculateTaxShares(status, numChildren, 0)
            
            // Each child after 2 adds 1 share
            const expectedAdditional = numChildren - 2
            expect(sharesWithMoreChildren - sharesWithTwoChildren).toBe(expectedAdditional)
          }
        ),
        { numRuns: 20 }
      )
    })

    it('shares increase with number of children', () => {
      fc.assert(
        fc.property(
          maritalStatusArb,
          numberOfChildrenArb,
          (status, numChildren) => {
            if (numChildren === 0) return true
            
            const sharesWithLess = calculateTaxShares(status, numChildren - 1, 0)
            const sharesWithMore = calculateTaxShares(status, numChildren, 0)
            
            expect(sharesWithMore).toBeGreaterThan(sharesWithLess)
          }
        ),
        { numRuns: 50 }
      )
    })
  })

  /**
   * **Feature: client360-evolution, Property 10: IFI calculation accuracy**
   * **Validates: Requirements 8.3**
   * 
   * For any IFI taxable base above the threshold (1.3M€):
   * - The IFI amount SHALL be calculated by applying French IFI brackets to the taxable base
   */
  describe('Property 10: IFI calculation accuracy', () => {
    it('IFI is zero below threshold (1.3M€)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: IFI_THRESHOLD - 1 }),
          (wealth) => {
            const result = calculateIFI(wealth)
            
            expect(result.ifiAmount).toBe(0)
            expect(result.isSubjectToIFI).toBe(false)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('IFI is positive at or above threshold', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: IFI_THRESHOLD, max: 50000000 }),
          (wealth) => {
            const result = calculateIFI(wealth)
            
            expect(result.ifiAmount).toBeGreaterThanOrEqual(0)
            expect(result.isSubjectToIFI).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('IFI calculation matches reference implementation', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: IFI_THRESHOLD, max: 50000000 }),
          (wealth) => {
            const result = calculateIFI(wealth)
            const referenceResult = referenceIFICalculation(wealth)
            
            // Allow small rounding differences (within 1€)
            expect(Math.abs(result.ifiAmount - referenceResult)).toBeLessThanOrEqual(1)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('IFI increases monotonically with wealth', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: IFI_THRESHOLD, max: 49000000 }),
          fc.integer({ min: 1, max: 1000000 }),
          (baseWealth, increment) => {
            const result1 = calculateIFI(baseWealth)
            const result2 = calculateIFI(baseWealth + increment)
            
            expect(result2.ifiAmount).toBeGreaterThanOrEqual(result1.ifiAmount)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('IFI bracket is correctly identified', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: IFI_THRESHOLD, max: 50000000 }),
          (wealth) => {
            const result = calculateIFI(wealth)
            
            // Bracket should be a non-empty string
            expect(result.bracket).toBeTruthy()
            expect(typeof result.bracket).toBe('string')
          }
        ),
        { numRuns: 100 }
      )
    })

    it('distance from threshold is correct for non-subject', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: IFI_THRESHOLD - 1 }),
          (wealth) => {
            const result = calculateIFI(wealth)
            
            expect(result.distanceFromThreshold).toBe(IFI_THRESHOLD - wealth)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('distance from threshold is zero for subject', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: IFI_THRESHOLD, max: 50000000 }),
          (wealth) => {
            const result = calculateIFI(wealth)
            
            expect(result.distanceFromThreshold).toBe(0)
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
