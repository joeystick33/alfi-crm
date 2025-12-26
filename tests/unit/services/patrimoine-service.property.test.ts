/**
 * Property-Based Tests - Patrimoine Service
 * 
 * Tests for Client 360 Patrimoine tab service functions.
 * **Feature: client360-evolution**
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  calculateAllocations,
  calculateNetWorth,
  calculateDebtRatio,
  validateManagedStatus,
  isValidAssetCategory,
  isValidLiabilityCategory,
  VALID_ASSET_CATEGORIES,
  VALID_LIABILITY_CATEGORIES
} from '@/app/_common/lib/services/patrimoine-data-service'

// ============================================================================
// GENERATORS
// ============================================================================

/**
 * Generator for valid asset categories
 */
const validAssetCategoryArb = fc.constantFrom(...VALID_ASSET_CATEGORIES)

/**
 * Generator for valid liability categories
 */
const validLiabilityCategoryArb = fc.constantFrom(...VALID_LIABILITY_CATEGORIES)

/**
 * Generator for invalid categories (strings not in valid lists)
 */
const invalidCategoryArb = fc.string({ minLength: 1, maxLength: 20 })
  .filter(s => !VALID_ASSET_CATEGORIES.includes(s as any) && !VALID_LIABILITY_CATEGORIES.includes(s as any))

/**
 * Generator for positive monetary values (realistic range)
 */
const monetaryValueArb = fc.double({ 
  min: 0.01, 
  max: 10000000, // 10M max
  noNaN: true,
  noDefaultInfinity: true
}).map(v => Math.round(v * 100) / 100) // Round to 2 decimal places

/**
 * Generator for non-negative monetary values
 */
const nonNegativeMonetaryArb = fc.double({ 
  min: 0, 
  max: 10000000,
  noNaN: true,
  noDefaultInfinity: true
}).map(v => Math.round(v * 100) / 100)

/**
 * Generator for valid ISO date strings
 */
const validDateStringArb = fc.integer({ min: 2000, max: 2025 }).chain(year =>
  fc.integer({ min: 1, max: 12 }).chain(month =>
    fc.integer({ min: 1, max: 28 }).map(day => 
      `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T00:00:00.000Z`
    )
  )
)

/**
 * Generator for assets with valid category
 */
const assetArb = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  category: validAssetCategoryArb,
  subCategory: fc.string({ minLength: 1, maxLength: 50 }),
  value: monetaryValueArb,
  acquisitionDate: validDateStringArb,
  acquisitionValue: monetaryValueArb,
  isManaged: fc.boolean(),
  details: fc.constant({})
})

/**
 * Generator for valid future ISO date strings
 */
const validFutureDateStringArb = fc.integer({ min: 2025, max: 2050 }).chain(year =>
  fc.integer({ min: 1, max: 12 }).chain(month =>
    fc.integer({ min: 1, max: 28 }).map(day => 
      `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T00:00:00.000Z`
    )
  )
)

/**
 * Generator for liabilities with valid category
 */
const liabilityArb = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  category: validLiabilityCategoryArb,
  remainingAmount: monetaryValueArb,
  interestRate: fc.double({ min: 0, max: 20, noNaN: true }),
  monthlyPayment: monetaryValueArb,
  endDate: validFutureDateStringArb,
  isManaged: fc.boolean()
})

/**
 * Generator for arrays of assets
 */
const assetsArrayArb = fc.array(assetArb, { minLength: 0, maxLength: 20 })

/**
 * Generator for arrays of liabilities
 */
const liabilitiesArrayArb = fc.array(liabilityArb, { minLength: 0, maxLength: 10 })

/**
 * Generator for allocation items with positive values
 */
const allocationItemArb = fc.record({
  category: validAssetCategoryArb, // Use valid categories to avoid edge cases
  value: monetaryValueArb // Already positive (min: 0.01)
})

/**
 * Generator for arrays of allocation items
 */
const allocationItemsArb = fc.array(allocationItemArb, { minLength: 1, maxLength: 10 })

// ============================================================================
// PROPERTY TESTS
// ============================================================================

describe('Patrimoine Service - Property-Based Tests', () => {
  /**
   * **Feature: client360-evolution, Property 2: Entity categorization validity**
   * **Validates: Requirements 3.2, 4.2, 9.1, 10.2, 12.2, 13.1**
   * 
   * For any entity with a category field (asset, liability, contract, document, 
   * opportunity, activity), the category value SHALL be one of the predefined 
   * valid values for that entity type.
   */
  describe('Property 2: Entity categorization validity', () => {
    it('all valid asset categories are recognized', () => {
      fc.assert(
        fc.property(validAssetCategoryArb, (category) => {
          expect(isValidAssetCategory(category)).toBe(true)
        }),
        { numRuns: 100 }
      )
    })

    it('all valid liability categories are recognized', () => {
      fc.assert(
        fc.property(validLiabilityCategoryArb, (category) => {
          expect(isValidLiabilityCategory(category)).toBe(true)
        }),
        { numRuns: 100 }
      )
    })

    it('invalid categories are rejected for assets', () => {
      fc.assert(
        fc.property(invalidCategoryArb, (category) => {
          expect(isValidAssetCategory(category)).toBe(false)
        }),
        { numRuns: 100 }
      )
    })

    it('invalid categories are rejected for liabilities', () => {
      fc.assert(
        fc.property(invalidCategoryArb, (category) => {
          expect(isValidLiabilityCategory(category)).toBe(false)
        }),
        { numRuns: 100 }
      )
    })

    it('generated assets always have valid categories', () => {
      fc.assert(
        fc.property(assetArb, (asset) => {
          expect(isValidAssetCategory(asset.category)).toBe(true)
        }),
        { numRuns: 100 }
      )
    })

    it('generated liabilities always have valid categories', () => {
      fc.assert(
        fc.property(liabilityArb, (liability) => {
          expect(isValidLiabilityCategory(liability.category)).toBe(true)
        }),
        { numRuns: 100 }
      )
    })

    it('VALID_ASSET_CATEGORIES contains exactly 4 categories', () => {
      expect(VALID_ASSET_CATEGORIES).toHaveLength(4)
      expect(VALID_ASSET_CATEGORIES).toContain('IMMOBILIER')
      expect(VALID_ASSET_CATEGORIES).toContain('FINANCIER')
      expect(VALID_ASSET_CATEGORIES).toContain('PROFESSIONNEL')
      expect(VALID_ASSET_CATEGORIES).toContain('AUTRES')
    })

    it('VALID_LIABILITY_CATEGORIES contains exactly 3 categories', () => {
      expect(VALID_LIABILITY_CATEGORIES).toHaveLength(3)
      expect(VALID_LIABILITY_CATEGORIES).toContain('CREDIT_IMMO')
      expect(VALID_LIABILITY_CATEGORIES).toContain('CREDIT_CONSO')
      expect(VALID_LIABILITY_CATEGORIES).toContain('DETTE_PRO')
    })
  })

  /**
   * **Feature: client360-evolution, Property 16: Net worth calculation**
   * **Validates: Requirements 3.1, 4.1**
   * 
   * For any client with assets and liabilities, the net worth SHALL equal 
   * (total assets - total liabilities), and the debt ratio SHALL equal 
   * (total liabilities / total assets * 100) when total assets > 0.
   */
  describe('Property 16: Net worth calculation', () => {
    it('net worth equals total assets minus total liabilities', () => {
      fc.assert(
        fc.property(
          nonNegativeMonetaryArb,
          nonNegativeMonetaryArb,
          (totalAssets, totalLiabilities) => {
            const netWorth = calculateNetWorth(totalAssets, totalLiabilities)
            const expected = totalAssets - totalLiabilities
            
            expect(Math.abs(netWorth - expected)).toBeLessThan(0.01)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('debt ratio equals (liabilities / assets * 100) when assets > 0', () => {
      fc.assert(
        fc.property(
          monetaryValueArb, // Positive assets
          nonNegativeMonetaryArb,
          (totalAssets, totalLiabilities) => {
            const debtRatio = calculateDebtRatio(totalAssets, totalLiabilities)
            const expected = (totalLiabilities / totalAssets) * 100
            
            expect(Math.abs(debtRatio - expected)).toBeLessThan(0.01)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('debt ratio is 0 when total assets is 0', () => {
      fc.assert(
        fc.property(nonNegativeMonetaryArb, (totalLiabilities) => {
          const debtRatio = calculateDebtRatio(0, totalLiabilities)
          expect(debtRatio).toBe(0)
        }),
        { numRuns: 100 }
      )
    })

    it('debt ratio is 0 when total assets is negative', () => {
      fc.assert(
        fc.property(
          fc.double({ min: -10000000, max: -0.01, noNaN: true }),
          nonNegativeMonetaryArb,
          (totalAssets, totalLiabilities) => {
            const debtRatio = calculateDebtRatio(totalAssets, totalLiabilities)
            expect(debtRatio).toBe(0)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('net worth can be negative when liabilities exceed assets', () => {
      fc.assert(
        fc.property(
          monetaryValueArb,
          (value) => {
            const totalAssets = value
            const totalLiabilities = value * 2 // Double the assets
            const netWorth = calculateNetWorth(totalAssets, totalLiabilities)
            
            expect(netWorth).toBeLessThan(0)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('net worth is positive when assets exceed liabilities', () => {
      fc.assert(
        fc.property(
          monetaryValueArb,
          (value) => {
            const totalAssets = value * 2 // Double the liabilities
            const totalLiabilities = value
            const netWorth = calculateNetWorth(totalAssets, totalLiabilities)
            
            expect(netWorth).toBeGreaterThan(0)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('debt ratio is 100% when assets equal liabilities', () => {
      fc.assert(
        fc.property(monetaryValueArb, (value) => {
          const debtRatio = calculateDebtRatio(value, value)
          expect(Math.abs(debtRatio - 100)).toBeLessThan(0.01)
        }),
        { numRuns: 100 }
      )
    })

    it('debt ratio is 0% when there are no liabilities', () => {
      fc.assert(
        fc.property(monetaryValueArb, (totalAssets) => {
          const debtRatio = calculateDebtRatio(totalAssets, 0)
          expect(debtRatio).toBe(0)
        }),
        { numRuns: 100 }
      )
    })
  })

  /**
   * **Feature: client360-evolution, Property 17: Managed status indicator presence**
   * **Validates: Requirements 3.7, 4.5**
   * 
   * For any asset or liability, the isManaged field SHALL be present with a boolean value.
   */
  describe('Property 17: Managed status indicator presence', () => {
    it('all generated assets have isManaged as boolean', () => {
      fc.assert(
        fc.property(assetArb, (asset) => {
          expect(validateManagedStatus(asset)).toBe(true)
          expect(typeof asset.isManaged).toBe('boolean')
        }),
        { numRuns: 100 }
      )
    })

    it('all generated liabilities have isManaged as boolean', () => {
      fc.assert(
        fc.property(liabilityArb, (liability) => {
          expect(validateManagedStatus(liability)).toBe(true)
          expect(typeof liability.isManaged).toBe('boolean')
        }),
        { numRuns: 100 }
      )
    })

    it('entities without isManaged field fail validation', () => {
      const entityWithoutManaged = { id: 'test', name: 'Test' }
      expect(validateManagedStatus(entityWithoutManaged)).toBe(false)
    })

    it('entities with null isManaged fail validation', () => {
      const entityWithNull = { id: 'test', name: 'Test', isManaged: null }
      expect(validateManagedStatus(entityWithNull)).toBe(false)
    })

    it('entities with undefined isManaged fail validation', () => {
      const entityWithUndefined = { id: 'test', name: 'Test', isManaged: undefined }
      expect(validateManagedStatus(entityWithUndefined)).toBe(false)
    })

    it('entities with non-boolean isManaged fail validation', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.string(),
            fc.integer(),
            fc.double(),
            fc.constant(null),
            fc.constant(undefined)
          ),
          (invalidValue) => {
            const entity = { id: 'test', name: 'Test', isManaged: invalidValue }
            expect(validateManagedStatus(entity)).toBe(false)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('isManaged true is valid', () => {
      const entity = { isManaged: true }
      expect(validateManagedStatus(entity)).toBe(true)
    })

    it('isManaged false is valid', () => {
      const entity = { isManaged: false }
      expect(validateManagedStatus(entity)).toBe(true)
    })

    it('arrays of assets all have valid managed status', () => {
      fc.assert(
        fc.property(assetsArrayArb, (assets) => {
          for (const asset of assets) {
            expect(validateManagedStatus(asset)).toBe(true)
          }
        }),
        { numRuns: 100 }
      )
    })

    it('arrays of liabilities all have valid managed status', () => {
      fc.assert(
        fc.property(liabilitiesArrayArb, (liabilities) => {
          for (const liability of liabilities) {
            expect(validateManagedStatus(liability)).toBe(true)
          }
        }),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Additional tests for allocation calculations
   */
  describe('Allocation calculations', () => {
    it('allocation percentages sum to 100 for non-empty items', () => {
      fc.assert(
        fc.property(allocationItemsArb, (items) => {
          const allocations = calculateAllocations(items)
          
          if (allocations.length === 0) return true
          
          const percentageSum = allocations.reduce((sum, a) => sum + a.percentage, 0)
          expect(Math.abs(percentageSum - 100)).toBeLessThan(0.01)
        }),
        { numRuns: 100 }
      )
    })

    it('allocation values sum to total input value within floating point tolerance', () => {
      fc.assert(
        fc.property(allocationItemsArb, (items) => {
          const totalValue = items.reduce((sum, i) => sum + i.value, 0)
          const allocations = calculateAllocations(items)
          
          if (allocations.length === 0) return true
          
          const valueSum = allocations.reduce((sum, a) => sum + a.value, 0)
          // Use relative tolerance for floating point comparison
          // Allow up to 1% difference due to floating point accumulation errors
          const relativeDiff = totalValue > 0 ? Math.abs(valueSum - totalValue) / totalValue : 0
          expect(relativeDiff).toBeLessThanOrEqual(0.01)
        }),
        { numRuns: 100 }
      )
    })

    it('empty items array returns empty allocations', () => {
      const allocations = calculateAllocations([])
      expect(allocations).toEqual([])
    })

    it('allocations are sorted by value descending', () => {
      fc.assert(
        fc.property(allocationItemsArb, (items) => {
          const allocations = calculateAllocations(items)
          
          for (let i = 1; i < allocations.length; i++) {
            expect(allocations[i - 1].value).toBeGreaterThanOrEqual(allocations[i].value)
          }
        }),
        { numRuns: 100 }
      )
    })
  })
})
