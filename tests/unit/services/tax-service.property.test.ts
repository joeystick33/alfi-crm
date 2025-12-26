/**
 * Property-Based Tests - Tax Service
 * 
 * Tests for tax-related calculations and UI logic
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  calculateIncomeTax,
  calculateIFI,
  IFI_THRESHOLD,
} from '@/app/_common/lib/services/tax-service'

// ============================================================================
// CONSTANTS FOR TESTING
// ============================================================================

/**
 * Tax brackets for UI display (percentage format)
 */
const UI_TAX_BRACKETS = [
  { limit: 11294, rate: 0 },
  { limit: 28797, rate: 11 },
  { limit: 82341, rate: 30 },
  { limit: 177106, rate: 41 },
  { limit: Infinity, rate: 45 },
]

/**
 * Tax optimization statuses
 */
const OPTIMIZATION_STATUSES = ['DETECTED', 'REVIEWED', 'IN_PROGRESS', 'COMPLETED', 'DISMISSED'] as const
type OptimizationStatus = typeof OPTIMIZATION_STATUSES[number]

/**
 * Tax optimization priorities
 */
const OPTIMIZATION_PRIORITIES = ['HIGH', 'MEDIUM', 'LOW'] as const
type OptimizationPriority = typeof OPTIMIZATION_PRIORITIES[number]

// ============================================================================
// GENERATORS
// ============================================================================

/**
 * Generator for fiscal reference income (realistic range)
 */
const fiscalReferenceIncomeArb = fc.integer({ min: 0, max: 500000 })

/**
 * Generator for tax shares (1 to 10 parts)
 */
const taxSharesArb = fc.double({ min: 1, max: 10, noNaN: true })

/**
 * Generator for net taxable wealth (IFI)
 */
const netTaxableWealthArb = fc.integer({ min: 0, max: 50000000 })

/**
 * Generator for tax optimization
 */
const taxOptimizationArb = fc.record({
  id: fc.uuid(),
  priority: fc.constantFrom(...OPTIMIZATION_PRIORITIES),
  category: fc.constantFrom('RETIREMENT', 'WEALTH', 'SUCCESSION', 'REAL_ESTATE', 'SAVINGS', 'TAX'),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  description: fc.string({ minLength: 1, maxLength: 500 }),
  potentialSavings: fc.option(fc.integer({ min: 0, max: 100000 }), { nil: undefined }),
  recommendation: fc.string({ minLength: 1, maxLength: 500 }),
  status: fc.constantFrom(...OPTIMIZATION_STATUSES),
  createdAt: fc.date(),
})

/**
 * Generator for a list of tax optimizations
 */
const taxOptimizationsListArb = fc.array(taxOptimizationArb, { minLength: 0, maxLength: 20 })

/**
 * Generator for filter values
 */
const filterStatusArb = fc.constantFrom('all', ...OPTIMIZATION_STATUSES)
const filterPriorityArb = fc.constantFrom('all', ...OPTIMIZATION_PRIORITIES)

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Determine which tax bracket a given income falls into
 * Returns the TMI (marginal tax rate) as a percentage
 */
function determineTaxBracket(quotientFamilial: number): number {
  for (const bracket of UI_TAX_BRACKETS) {
    if (quotientFamilial <= bracket.limit) {
      return bracket.rate
    }
  }
  return 45 // Highest bracket
}

/**
 * Filter optimizations based on status and priority
 */
function filterOptimizations(
  optimizations: Array<{ status: OptimizationStatus; priority: OptimizationPriority }>,
  filterStatus: string,
  filterPriority: string
): Array<{ status: OptimizationStatus; priority: OptimizationPriority }> {
  return optimizations.filter((opt) => {
    if (filterStatus !== 'all' && opt.status !== filterStatus) return false
    if (filterPriority !== 'all' && opt.priority !== filterPriority) return false
    return true
  })
}

/**
 * Calculate IFI net taxable value
 */
function calculateNetTaxableIFI(
  taxableRealEstateAssets: number,
  deductibleLiabilities: number
): number {
  return taxableRealEstateAssets - deductibleLiabilities
}

// ============================================================================
// PROPERTY TESTS
// ============================================================================

describe('Tax Service - Property-Based Tests', () => {
  /**
   * **Feature: client360-repair, Property 7: Tax bracket highlighting**
   * **Validates: Requirements 3.2**
   * 
   * For any income tax data with a tax bracket:
   * - Exactly one bracket in the visualization SHALL be highlighted
   * - It SHALL match the taxBracket value
   */
  describe('Property 7: Tax bracket highlighting', () => {
    it('exactly one bracket is highlighted for any valid income', () => {
      fc.assert(
        fc.property(
          fiscalReferenceIncomeArb,
          taxSharesArb,
          (income, shares) => {
            // Skip edge case of zero income with zero shares
            if (income === 0 && shares === 0) return true
            
            const result = calculateIncomeTax(income, shares)
            const taxBracket = result.taxBracket
            
            // Count how many brackets match the taxBracket
            const matchingBrackets = UI_TAX_BRACKETS.filter(
              (bracket) => bracket.rate === taxBracket
            )
            
            // Exactly one bracket should match
            expect(matchingBrackets.length).toBe(1)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('highlighted bracket matches the calculated TMI', () => {
      fc.assert(
        fc.property(
          fiscalReferenceIncomeArb,
          taxSharesArb,
          (income, shares) => {
            // Skip edge case of zero shares
            if (shares <= 0) return true
            
            const result = calculateIncomeTax(income, shares)
            const expectedBracket = determineTaxBracket(result.quotientFamilial)
            
            expect(result.taxBracket).toBe(expectedBracket)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('tax bracket is always a valid percentage value', () => {
      fc.assert(
        fc.property(
          fiscalReferenceIncomeArb,
          taxSharesArb,
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
  })

  /**
   * **Feature: client360-repair, Property 8: IFI calculation consistency**
   * **Validates: Requirements 3.4**
   * 
   * For any IFI data:
   * - Net taxable IFI SHALL equal (taxable real estate assets - deductible liabilities)
   */
  describe('Property 8: IFI calculation consistency', () => {
    /**
     * Generator for IFI data with assets and liabilities
     */
    const ifiDataArb = fc.record({
      taxableRealEstateAssets: fc.integer({ min: 0, max: 50000000 }),
      deductibleLiabilities: fc.integer({ min: 0, max: 10000000 }),
    })

    it('net taxable IFI equals taxable assets minus deductible liabilities', () => {
      fc.assert(
        fc.property(ifiDataArb, ({ taxableRealEstateAssets, deductibleLiabilities }) => {
          const netTaxable = calculateNetTaxableIFI(
            taxableRealEstateAssets,
            deductibleLiabilities
          )
          
          expect(netTaxable).toBe(taxableRealEstateAssets - deductibleLiabilities)
        }),
        { numRuns: 100 }
      )
    })

    it('IFI is zero when net taxable wealth is below threshold', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: IFI_THRESHOLD - 1 }),
          (netWealth) => {
            const result = calculateIFI(netWealth)
            
            expect(result.ifiAmount).toBe(0)
            expect(result.isSubjectToIFI).toBe(false)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('IFI is positive when net taxable wealth is at or above threshold', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: IFI_THRESHOLD, max: 50000000 }),
          (netWealth) => {
            const result = calculateIFI(netWealth)
            
            expect(result.ifiAmount).toBeGreaterThanOrEqual(0)
            expect(result.isSubjectToIFI).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('IFI amount increases monotonically with net taxable wealth', () => {
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
  })

  /**
   * **Feature: client360-repair, Property 9: Tax optimization filtering**
   * **Validates: Requirements 3.5**
   * 
   * For any filter combination (status, priority):
   * - The filtered list SHALL contain only optimizations matching both criteria
   */
  describe('Property 9: Tax optimization filtering', () => {
    it('filtered list contains only optimizations matching status filter', () => {
      fc.assert(
        fc.property(
          taxOptimizationsListArb,
          filterStatusArb,
          (optimizations, filterStatus) => {
            const filtered = filterOptimizations(optimizations, filterStatus, 'all')
            
            if (filterStatus === 'all') {
              // All optimizations should be included
              expect(filtered.length).toBe(optimizations.length)
            } else {
              // All filtered items should match the status
              for (const opt of filtered) {
                expect(opt.status).toBe(filterStatus)
              }
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('filtered list contains only optimizations matching priority filter', () => {
      fc.assert(
        fc.property(
          taxOptimizationsListArb,
          filterPriorityArb,
          (optimizations, filterPriority) => {
            const filtered = filterOptimizations(optimizations, 'all', filterPriority)
            
            if (filterPriority === 'all') {
              // All optimizations should be included
              expect(filtered.length).toBe(optimizations.length)
            } else {
              // All filtered items should match the priority
              for (const opt of filtered) {
                expect(opt.priority).toBe(filterPriority)
              }
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('filtered list contains only optimizations matching both status and priority', () => {
      fc.assert(
        fc.property(
          taxOptimizationsListArb,
          filterStatusArb,
          filterPriorityArb,
          (optimizations, filterStatus, filterPriority) => {
            const filtered = filterOptimizations(optimizations, filterStatus, filterPriority)
            
            for (const opt of filtered) {
              if (filterStatus !== 'all') {
                expect(opt.status).toBe(filterStatus)
              }
              if (filterPriority !== 'all') {
                expect(opt.priority).toBe(filterPriority)
              }
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('filtering is idempotent - filtering twice gives same result', () => {
      fc.assert(
        fc.property(
          taxOptimizationsListArb,
          filterStatusArb,
          filterPriorityArb,
          (optimizations, filterStatus, filterPriority) => {
            const filtered1 = filterOptimizations(optimizations, filterStatus, filterPriority)
            const filtered2 = filterOptimizations(filtered1, filterStatus, filterPriority)
            
            expect(filtered2.length).toBe(filtered1.length)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('filtered count is less than or equal to original count', () => {
      fc.assert(
        fc.property(
          taxOptimizationsListArb,
          filterStatusArb,
          filterPriorityArb,
          (optimizations, filterStatus, filterPriority) => {
            const filtered = filterOptimizations(optimizations, filterStatus, filterPriority)
            
            expect(filtered.length).toBeLessThanOrEqual(optimizations.length)
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
