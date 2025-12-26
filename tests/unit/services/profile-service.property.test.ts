/**
 * Property-Based Tests - Profile Service
 * 
 * Tests for Client 360 Profile tab service functions.
 * **Feature: client360-evolution**
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  calculateFiscalShares,
  validateFiscalShares,
  calculateIFITaxableBase,
  validateIFITaxableBase,
  calculateIFIAmount,
  isMinorChild,
  mapRelationshipToRole
} from '@/app/_common/lib/services/profile-service'

// ============================================================================
// GENERATORS
// ============================================================================

/**
 * Generator for number of dependent children (realistic range)
 */
const dependentChildrenArb = fc.integer({ min: 0, max: 10 })

/**
 * Generator for boolean values
 */
const booleanArb = fc.boolean()

/**
 * Generator for positive monetary values (realistic range for real estate)
 */
const realEstateValueArb = fc.double({ 
  min: 0, 
  max: 50000000, // 50M max
  noNaN: true,
  noDefaultInfinity: true
}).map(v => Math.round(v * 100) / 100)

/**
 * Generator for abatement percentage (0-100)
 */
const abatementArb = fc.integer({ min: 0, max: 100 })

/**
 * Generator for real estate asset with IFI properties
 */
const realEstateAssetArb = fc.record({
  value: realEstateValueArb,
  isTaxable: booleanArb,
  abatement: fc.option(abatementArb, { nil: undefined })
})

/**
 * Generator for arrays of real estate assets
 */
const realEstateAssetsArb = fc.array(realEstateAssetArb, { minLength: 0, maxLength: 10 })

/**
 * Generator for deductible liabilities (realistic range)
 */
const deductibleLiabilitiesArb = fc.double({
  min: 0,
  max: 20000000, // 20M max
  noNaN: true,
  noDefaultInfinity: true
}).map(v => Math.round(v * 100) / 100)

/**
 * Generator for birth dates (for minor/major determination)
 */
const birthDateArb = fc.date({
  min: new Date('1920-01-01'),
  max: new Date('2024-12-31')
})

/**
 * Generator for family relationship types
 */
const relationshipArb = fc.constantFrom(
  'SPOUSE', 'CHILD', 'PARENT', 'SIBLING', 'GRANDCHILD', 'ASCENDANT', 'OTHER'
)

// ============================================================================
// PROPERTY TESTS - Fiscal Shares Calculation
// ============================================================================

describe('Profile Service - Property-Based Tests', () => {
  /**
   * **Feature: client360-evolution, Property 5: Fiscal shares calculation**
   * **Validates: Requirements 2.5**
   * 
   * For any family structure with spouse and children, the fiscal shares SHALL be
   * calculated according to French tax rules: 1 share per adult, 0.5 share per
   * dependent child (first two), 1 share per additional dependent child.
   */
  describe('Property 5: Fiscal shares calculation', () => {
    it('single person without children has 1 share', () => {
      const shares = calculateFiscalShares(false, 0, false)
      expect(shares).toBe(1)
    })

    it('couple without children has 2 shares', () => {
      const shares = calculateFiscalShares(true, 0, false)
      expect(shares).toBe(2)
    })

    it('fiscal shares increase with dependent children', () => {
      fc.assert(
        fc.property(
          booleanArb,
          dependentChildrenArb,
          booleanArb,
          (hasSpouse, children, isSingleParent) => {
            if (children === 0) return true // Skip edge case
            
            const sharesWithChildren = calculateFiscalShares(hasSpouse, children, isSingleParent)
            const sharesWithoutChildren = calculateFiscalShares(hasSpouse, 0, false)
            
            // More children should mean more shares
            expect(sharesWithChildren).toBeGreaterThan(sharesWithoutChildren)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('first two children add 0.5 share each', () => {
      fc.assert(
        fc.property(booleanArb, (hasSpouse) => {
          const baseShares = calculateFiscalShares(hasSpouse, 0, false)
          const oneChild = calculateFiscalShares(hasSpouse, 1, false)
          const twoChildren = calculateFiscalShares(hasSpouse, 2, false)
          
          expect(oneChild - baseShares).toBeCloseTo(0.5, 5)
          expect(twoChildren - baseShares).toBeCloseTo(1.0, 5)
        }),
        { numRuns: 100 }
      )
    })

    it('third and subsequent children add 1 share each', () => {
      fc.assert(
        fc.property(
          booleanArb,
          fc.integer({ min: 3, max: 10 }),
          (hasSpouse, children) => {
            const twoChildren = calculateFiscalShares(hasSpouse, 2, false)
            const moreChildren = calculateFiscalShares(hasSpouse, children, false)
            
            // Each child beyond 2 adds 1 share
            const expectedAdditional = children - 2
            expect(moreChildren - twoChildren).toBeCloseTo(expectedAdditional, 5)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('single parent with children gets 0.5 bonus share', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }),
          (children) => {
            const withBonus = calculateFiscalShares(false, children, true)
            const withoutBonus = calculateFiscalShares(false, children, false)
            
            expect(withBonus - withoutBonus).toBeCloseTo(0.5, 5)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('single parent bonus does not apply to couples', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }),
          (children) => {
            // For couples, isSingleParent flag should not add bonus
            const withFlag = calculateFiscalShares(true, children, true)
            const withoutFlag = calculateFiscalShares(true, children, false)
            
            expect(withFlag).toBe(withoutFlag)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('fiscal shares are always positive', () => {
      fc.assert(
        fc.property(
          booleanArb,
          dependentChildrenArb,
          booleanArb,
          (hasSpouse, children, isSingleParent) => {
            const shares = calculateFiscalShares(hasSpouse, children, isSingleParent)
            expect(shares).toBeGreaterThan(0)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('fiscal shares are at least 1 (minimum for single person)', () => {
      fc.assert(
        fc.property(
          booleanArb,
          dependentChildrenArb,
          booleanArb,
          (hasSpouse, children, isSingleParent) => {
            const shares = calculateFiscalShares(hasSpouse, children, isSingleParent)
            expect(shares).toBeGreaterThanOrEqual(1)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('validateFiscalShares returns true for correctly calculated shares', () => {
      fc.assert(
        fc.property(
          booleanArb,
          dependentChildrenArb,
          booleanArb,
          (hasSpouse, children, isSingleParent) => {
            const shares = calculateFiscalShares(hasSpouse, children, isSingleParent)
            expect(validateFiscalShares(shares, hasSpouse, children, isSingleParent)).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('validateFiscalShares returns false for incorrect shares', () => {
      fc.assert(
        fc.property(
          booleanArb,
          dependentChildrenArb,
          booleanArb,
          fc.double({ min: 0.1, max: 5, noNaN: true }),
          (hasSpouse, children, isSingleParent, offset) => {
            const correctShares = calculateFiscalShares(hasSpouse, children, isSingleParent)
            const incorrectShares = correctShares + offset
            
            expect(validateFiscalShares(incorrectShares, hasSpouse, children, isSingleParent)).toBe(false)
          }
        ),
        { numRuns: 100 }
      )
    })

    // Specific examples from French tax rules
    it('matches French tax rule examples', () => {
      // Single: 1 part
      expect(calculateFiscalShares(false, 0, false)).toBe(1)
      
      // Couple: 2 parts
      expect(calculateFiscalShares(true, 0, false)).toBe(2)
      
      // Couple + 1 child: 2.5 parts
      expect(calculateFiscalShares(true, 1, false)).toBe(2.5)
      
      // Couple + 2 children: 3 parts
      expect(calculateFiscalShares(true, 2, false)).toBe(3)
      
      // Couple + 3 children: 4 parts
      expect(calculateFiscalShares(true, 3, false)).toBe(4)
      
      // Single parent + 1 child: 2 parts (1 + 0.5 + 0.5 bonus)
      expect(calculateFiscalShares(false, 1, true)).toBe(2)
      
      // Single parent + 2 children: 2.5 parts (1 + 1 + 0.5 bonus)
      expect(calculateFiscalShares(false, 2, true)).toBe(2.5)
    })
  })


  /**
   * **Feature: client360-evolution, Property 6: IFI taxable base calculation**
   * **Validates: Requirements 2.6, 8.1, 8.2**
   * 
   * For any set of real estate assets, the IFI taxable base SHALL equal the sum
   * of values of assets marked as IFI-taxable, minus deductible liabilities
   * related to those assets.
   */
  describe('Property 6: IFI taxable base calculation', () => {
    it('IFI taxable base equals sum of taxable assets minus liabilities', () => {
      fc.assert(
        fc.property(
          realEstateAssetsArb,
          deductibleLiabilitiesArb,
          (assets, liabilities) => {
            const taxableBase = calculateIFITaxableBase(assets, liabilities)
            
            // Calculate expected manually
            const totalTaxable = assets
              .filter(a => a.isTaxable)
              .reduce((sum, a) => {
                const abatement = a.abatement || 0
                return sum + a.value * (1 - abatement / 100)
              }, 0)
            
            const expected = Math.max(0, totalTaxable - liabilities)
            
            expect(Math.abs(taxableBase - expected)).toBeLessThan(0.01)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('IFI taxable base is never negative', () => {
      fc.assert(
        fc.property(
          realEstateAssetsArb,
          deductibleLiabilitiesArb,
          (assets, liabilities) => {
            const taxableBase = calculateIFITaxableBase(assets, liabilities)
            expect(taxableBase).toBeGreaterThanOrEqual(0)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('non-taxable assets do not contribute to IFI base', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              value: realEstateValueArb,
              isTaxable: fc.constant(false),
              abatement: fc.option(abatementArb, { nil: undefined })
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (nonTaxableAssets) => {
            const taxableBase = calculateIFITaxableBase(nonTaxableAssets, 0)
            expect(taxableBase).toBe(0)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('abatement reduces taxable value proportionally', () => {
      fc.assert(
        fc.property(
          realEstateValueArb,
          abatementArb,
          (value, abatement) => {
            // Skip edge cases
            if (value <= 0) return true
            
            const assetWithAbatement = [{ value, isTaxable: true, abatement }]
            const assetWithoutAbatement = [{ value, isTaxable: true, abatement: 0 }]
            
            const baseWithAbatement = calculateIFITaxableBase(assetWithAbatement, 0)
            const baseWithoutAbatement = calculateIFITaxableBase(assetWithoutAbatement, 0)
            
            const expectedReduction = value * (abatement / 100)
            const actualReduction = baseWithoutAbatement - baseWithAbatement
            
            expect(Math.abs(actualReduction - expectedReduction)).toBeLessThan(0.01)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('30% abatement for main residence is correctly applied', () => {
      // Main residence gets 30% abatement
      const mainResidence = [{ value: 1000000, isTaxable: true, abatement: 30 }]
      const taxableBase = calculateIFITaxableBase(mainResidence, 0)
      
      // 1M with 30% abatement = 700k
      expect(taxableBase).toBeCloseTo(700000, 0)
    })

    it('liabilities reduce taxable base', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              value: realEstateValueArb,
              isTaxable: fc.constant(true),
              abatement: fc.constant(undefined)
            }),
            { minLength: 1, maxLength: 5 }
          ),
          deductibleLiabilitiesArb,
          (assets, liabilities) => {
            const baseWithLiabilities = calculateIFITaxableBase(assets, liabilities)
            const baseWithoutLiabilities = calculateIFITaxableBase(assets, 0)
            
            // With liabilities should be less or equal
            expect(baseWithLiabilities).toBeLessThanOrEqual(baseWithoutLiabilities)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('validateIFITaxableBase returns true for correctly calculated base', () => {
      fc.assert(
        fc.property(
          realEstateAssetsArb,
          deductibleLiabilitiesArb,
          (assets, liabilities) => {
            const taxableBase = calculateIFITaxableBase(assets, liabilities)
            expect(validateIFITaxableBase(taxableBase, assets, liabilities)).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('validateIFITaxableBase returns false for incorrect base', () => {
      fc.assert(
        fc.property(
          realEstateAssetsArb,
          deductibleLiabilitiesArb,
          fc.double({ min: 1000, max: 1000000, noNaN: true }),
          (assets, liabilities, offset) => {
            const correctBase = calculateIFITaxableBase(assets, liabilities)
            const incorrectBase = correctBase + offset
            
            expect(validateIFITaxableBase(incorrectBase, assets, liabilities)).toBe(false)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('empty assets array returns 0 taxable base', () => {
      const taxableBase = calculateIFITaxableBase([], 0)
      expect(taxableBase).toBe(0)
    })

    it('empty assets with liabilities returns 0 (not negative)', () => {
      const taxableBase = calculateIFITaxableBase([], 500000)
      expect(taxableBase).toBe(0)
    })
  })

  /**
   * Additional tests for IFI amount calculation
   */
  describe('IFI Amount Calculation', () => {
    it('IFI is 0 below threshold (1.3M)', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0, max: 1299999, noNaN: true }),
          (taxableBase) => {
            const ifiAmount = calculateIFIAmount(taxableBase)
            expect(ifiAmount).toBe(0)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('IFI is positive above threshold (1.3M)', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 1300001, max: 50000000, noNaN: true }),
          (taxableBase) => {
            const ifiAmount = calculateIFIAmount(taxableBase)
            expect(ifiAmount).toBeGreaterThan(0)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('IFI increases with taxable base', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 1300001, max: 25000000, noNaN: true }),
          fc.double({ min: 1, max: 10000000, noNaN: true }),
          (base1, increment) => {
            const base2 = base1 + increment
            const ifi1 = calculateIFIAmount(base1)
            const ifi2 = calculateIFIAmount(base2)
            
            expect(ifi2).toBeGreaterThanOrEqual(ifi1)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('IFI at exactly 1.3M threshold', () => {
      // At exactly 1.3M, IFI should be calculated
      const ifiAmount = calculateIFIAmount(1300000)
      // 800k at 0% + 500k at 0.5% = 2500
      expect(ifiAmount).toBe(2500)
    })

    it('IFI calculation matches known examples', () => {
      // 2M patrimoine: 800k@0% + 500k@0.5% + 700k@0.7% = 0 + 2500 + 4900 = 7400
      expect(calculateIFIAmount(2000000)).toBe(7400)
      
      // 3M patrimoine: 800k@0% + 500k@0.5% + 1270k@0.7% + 430k@1% = 0 + 2500 + 8890 + 4300 = 15690
      expect(calculateIFIAmount(3000000)).toBe(15690)
    })
  })

  /**
   * Tests for helper functions
   */
  describe('Helper Functions', () => {
    it('isMinorChild returns true for children under 18', () => {
      const today = new Date()
      const tenYearsAgo = new Date(today.getFullYear() - 10, today.getMonth(), today.getDate())
      
      expect(isMinorChild(tenYearsAgo)).toBe(true)
    })

    it('isMinorChild returns false for adults 18+', () => {
      const today = new Date()
      const twentyYearsAgo = new Date(today.getFullYear() - 20, today.getMonth(), today.getDate())
      
      expect(isMinorChild(twentyYearsAgo)).toBe(false)
    })

    it('isMinorChild returns false for null/undefined', () => {
      expect(isMinorChild(null)).toBe(false)
    })

    it('mapRelationshipToRole maps SPOUSE correctly', () => {
      expect(mapRelationshipToRole('SPOUSE')).toBe('SPOUSE')
    })

    it('mapRelationshipToRole maps CHILD to CHILD_MAJOR by default', () => {
      expect(mapRelationshipToRole('CHILD')).toBe('CHILD_MAJOR')
    })

    it('mapRelationshipToRole maps unknown relationships to DEPENDENT', () => {
      expect(mapRelationshipToRole('UNKNOWN')).toBe('DEPENDENT')
    })
  })
})
