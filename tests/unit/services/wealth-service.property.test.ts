/**
 * Property-Based Tests - Wealth Service
 * 
 * Tests for wealth calculations including net worth, asset sorting, and liquidity ratio.
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  calculateLiquidityRatio,
  sortAssets,
  type Asset,
  type Liability,
} from '@/app/_common/lib/utils/wealth-calculations'
import {
  calculateWealthMetrics,
} from '@/app/_common/lib/services/wealth-service'

// ============================================================================
// GENERATORS
// ============================================================================

/**
 * Generator for asset types
 */
const assetTypeArb = fc.constantFrom(
  'REAL_ESTATE',
  'LIFE_INSURANCE',
  'SECURITIES',
  'BANK_ACCOUNT',
  'SAVINGS_ACCOUNT',
  'PEA',
  'PER',
  'SCPI',
  'BUSINESS',
  'CRYPTO',
  'PRECIOUS_METALS',
  'OTHER'
)

/**
 * Generator for liability types
 */
const liabilityTypeArb = fc.constantFrom(
  'MORTGAGE',
  'CONSUMER_CREDIT',
  'BUSINESS_LOAN',
  'STUDENT_LOAN',
  'OTHER'
)

/**
 * Generator for valid ISO date strings (between 1990 and 2030)
 */
const isoDateStringArb = fc.integer({ min: 631152000000, max: 1924905600000 }) // 1990-01-01 to 2030-12-31 in ms
  .map(ms => new Date(ms).toISOString())

/**
 * Generator for a single asset
 */
const assetArb: fc.Arbitrary<Asset> = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  type: assetTypeArb,
  value: fc.integer({ min: 0, max: 10_000_000 }),
  purchaseValue: fc.option(fc.integer({ min: 0, max: 10_000_000 }), { nil: undefined }),
  purchaseDate: fc.option(isoDateStringArb, { nil: undefined }),
  isManaged: fc.option(fc.boolean(), { nil: undefined }),
  linkedLiabilityId: fc.option(fc.uuid(), { nil: null }),
})

/**
 * Generator for a single liability
 */
const liabilityArb: fc.Arbitrary<Liability> = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  type: liabilityTypeArb,
  remainingAmount: fc.integer({ min: 0, max: 5_000_000 }),
  linkedAssetId: fc.option(fc.uuid(), { nil: null }),
})

/**
 * Generator for a list of assets
 */
const assetsListArb = fc.array(assetArb, { minLength: 0, maxLength: 20 })

/**
 * Generator for a list of liabilities
 */
const liabilitiesListArb = fc.array(liabilityArb, { minLength: 0, maxLength: 10 })

// ============================================================================
// PROPERTY TESTS
// ============================================================================

describe('Wealth Service - Property-Based Tests', () => {
  /**
   * **Feature: client360-repair, Property 4: Wealth net worth calculation**
   * **Validates: Requirements 2.1, 4.1**
   * 
   * For any client with assets and liabilities:
   * - Net worth SHALL equal (total assets - total liabilities)
   * - Debt ratio SHALL equal (total liabilities / total assets * 100)
   */
  describe('Property 4: Wealth net worth calculation', () => {
    it('net worth equals total assets minus total liabilities', () => {
      fc.assert(
        fc.property(assetsListArb, liabilitiesListArb, (assets, liabilities) => {
          // Transform to the format expected by calculateWealthMetrics
          const assetsForMetrics = assets.map(a => ({
            id: a.id,
            type: a.type,
            value: a.value,
            managedByFirm: a.isManaged,
            linkedPassifId: a.linkedLiabilityId,
          }))
          
          const liabilitiesForMetrics = liabilities.map(l => ({
            id: l.id,
            type: l.type,
            remainingAmount: l.remainingAmount,
            linkedActifId: l.linkedAssetId,
          }))
          
          const metrics = calculateWealthMetrics(assetsForMetrics, liabilitiesForMetrics)
          
          const expectedTotalAssets = assets.reduce((sum, a) => sum + a.value, 0)
          const expectedTotalLiabilities = liabilities.reduce((sum, l) => sum + l.remainingAmount, 0)
          const expectedNetWorth = expectedTotalAssets - expectedTotalLiabilities
          
          expect(metrics.patrimoineNet).toBe(expectedNetWorth)
        }),
        { numRuns: 100 }
      )
    })

    it('debt ratio equals (total liabilities / total assets) * 100', () => {
      fc.assert(
        fc.property(
          // Ensure at least one asset with value > 0 to avoid division by zero
          fc.array(assetArb.filter(a => a.value > 0), { minLength: 1, maxLength: 20 }),
          liabilitiesListArb,
          (assets, liabilities) => {
            const assetsForMetrics = assets.map(a => ({
              id: a.id,
              type: a.type,
              value: a.value,
              managedByFirm: a.isManaged,
              linkedPassifId: a.linkedLiabilityId,
            }))
            
            const liabilitiesForMetrics = liabilities.map(l => ({
              id: l.id,
              type: l.type,
              remainingAmount: l.remainingAmount,
              linkedActifId: l.linkedAssetId,
            }))
            
            const metrics = calculateWealthMetrics(assetsForMetrics, liabilitiesForMetrics)
            
            const totalAssets = assets.reduce((sum, a) => sum + a.value, 0)
            const totalLiabilities = liabilities.reduce((sum, l) => sum + l.remainingAmount, 0)
            const expectedDebtRatio = totalAssets > 0 
              ? Math.round((totalLiabilities / totalAssets) * 100 * 10) / 10
              : 0
            
            expect(metrics.ratioEndettement).toBe(expectedDebtRatio)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('total assets equals sum of all asset values', () => {
      fc.assert(
        fc.property(assetsListArb, liabilitiesListArb, (assets, liabilities) => {
          const assetsForMetrics = assets.map(a => ({
            id: a.id,
            type: a.type,
            value: a.value,
            managedByFirm: a.isManaged,
            linkedPassifId: a.linkedLiabilityId,
          }))
          
          const liabilitiesForMetrics = liabilities.map(l => ({
            id: l.id,
            type: l.type,
            remainingAmount: l.remainingAmount,
            linkedActifId: l.linkedAssetId,
          }))
          
          const metrics = calculateWealthMetrics(assetsForMetrics, liabilitiesForMetrics)
          
          const expectedTotalAssets = assets.reduce((sum, a) => sum + a.value, 0)
          
          expect(metrics.actifsBruts).toBe(expectedTotalAssets)
        }),
        { numRuns: 100 }
      )
    })
  })

  /**
   * **Feature: client360-repair, Property 5: Asset sorting consistency**
   * **Validates: Requirements 2.3**
   * 
   * For any list of assets sorted by value:
   * - Each asset's value SHALL be greater than or equal to the next asset's value
   */
  describe('Property 5: Asset sorting consistency', () => {
    it('assets sorted by value are in descending order', () => {
      fc.assert(
        fc.property(assetsListArb, (assets) => {
          const sorted = sortAssets(assets, 'value', [])
          
          // Check that each element is >= the next element (descending order)
          for (let i = 0; i < sorted.length - 1; i++) {
            expect(sorted[i].value).toBeGreaterThanOrEqual(sorted[i + 1].value)
          }
        }),
        { numRuns: 100 }
      )
    })

    it('sorting preserves all assets (no elements lost or added)', () => {
      fc.assert(
        fc.property(assetsListArb, (assets) => {
          const sorted = sortAssets(assets, 'value', [])
          
          // Same length
          expect(sorted.length).toBe(assets.length)
          
          // All original IDs are present
          const originalIds = new Set(assets.map(a => a.id))
          const sortedIds = new Set(sorted.map(a => a.id))
          expect(sortedIds).toEqual(originalIds)
        }),
        { numRuns: 100 }
      )
    })

    it('sorting by type groups assets alphabetically by type', () => {
      fc.assert(
        fc.property(assetsListArb, (assets) => {
          const sorted = sortAssets(assets, 'type', [])
          
          // Check that types are in alphabetical order
          for (let i = 0; i < sorted.length - 1; i++) {
            expect(sorted[i].type.localeCompare(sorted[i + 1].type)).toBeLessThanOrEqual(0)
          }
        }),
        { numRuns: 100 }
      )
    })

    it('sorting by date puts most recent first (descending)', () => {
      // Generator for assets with guaranteed valid dates
      const assetWithDateArb = fc.record({
        id: fc.uuid(),
        name: fc.string({ minLength: 1, maxLength: 50 }),
        type: assetTypeArb,
        value: fc.integer({ min: 0, max: 10_000_000 }),
        purchaseValue: fc.option(fc.integer({ min: 0, max: 10_000_000 }), { nil: undefined }),
        purchaseDate: isoDateStringArb, // Always has a date
        isManaged: fc.option(fc.boolean(), { nil: undefined }),
        linkedLiabilityId: fc.option(fc.uuid(), { nil: null }),
      })
      
      fc.assert(
        fc.property(
          fc.array(assetWithDateArb, { minLength: 2, maxLength: 10 }),
          (assets) => {
            const sorted = sortAssets(assets, 'date', [])
            
            // Check that dates are in descending order (most recent first)
            for (let i = 0; i < sorted.length - 1; i++) {
              const currentDate = sorted[i].purchaseDate ? new Date(sorted[i].purchaseDate!).getTime() : 0
              const nextDate = sorted[i + 1].purchaseDate ? new Date(sorted[i + 1].purchaseDate!).getTime() : 0
              
              // Assets without dates go to the end
              if (sorted[i].purchaseDate && sorted[i + 1].purchaseDate) {
                expect(currentDate).toBeGreaterThanOrEqual(nextDate)
              }
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * **Feature: client360-repair, Property 6: Liquidity ratio calculation**
   * **Validates: Requirements 2.2**
   * 
   * For any set of assets:
   * - Liquidity ratio SHALL equal (liquid assets / total assets * 100)
   * - Liquid assets are those with type in ['BANK_ACCOUNT', 'SAVINGS_ACCOUNT', 'SECURITIES', 'PEA', 'LIFE_INSURANCE']
   */
  describe('Property 6: Liquidity ratio calculation', () => {
    const LIQUID_TYPES = ['BANK_ACCOUNT', 'SAVINGS_ACCOUNT', 'SECURITIES', 'PEA', 'LIFE_INSURANCE']

    it('liquidity ratio equals (liquid assets / total assets) * 100', () => {
      fc.assert(
        fc.property(
          // Ensure at least one asset with value > 0
          fc.array(assetArb.filter(a => a.value > 0), { minLength: 1, maxLength: 20 }),
          (assets) => {
            const metrics = calculateLiquidityRatio(assets)
            
            const liquidAssets = assets
              .filter(a => LIQUID_TYPES.includes(a.type))
              .reduce((sum, a) => sum + a.value, 0)
            
            const totalAssets = assets.reduce((sum, a) => sum + a.value, 0)
            
            const expectedRatio = totalAssets > 0 
              ? Math.round((liquidAssets / totalAssets) * 100)
              : 0
            
            expect(metrics.liquidityRatio).toBe(expectedRatio)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('liquid assets sum equals sum of assets with liquid types', () => {
      fc.assert(
        fc.property(assetsListArb, (assets) => {
          const metrics = calculateLiquidityRatio(assets)
          
          const expectedLiquidAssets = assets
            .filter(a => LIQUID_TYPES.includes(a.type))
            .reduce((sum, a) => sum + a.value, 0)
          
          expect(metrics.liquidAssets).toBe(expectedLiquidAssets)
        }),
        { numRuns: 100 }
      )
    })

    it('total assets in metrics equals sum of all asset values', () => {
      fc.assert(
        fc.property(assetsListArb, (assets) => {
          const metrics = calculateLiquidityRatio(assets)
          
          const expectedTotal = assets.reduce((sum, a) => sum + a.value, 0)
          
          expect(metrics.totalAssets).toBe(expectedTotal)
        }),
        { numRuns: 100 }
      )
    })

    it('liquidity ratio is 0 when total assets is 0', () => {
      const emptyAssets: Asset[] = []
      const metrics = calculateLiquidityRatio(emptyAssets)
      
      expect(metrics.liquidityRatio).toBe(0)
      expect(metrics.liquidAssets).toBe(0)
      expect(metrics.totalAssets).toBe(0)
    })

    it('liquidity status is correctly determined based on ratio', () => {
      fc.assert(
        fc.property(assetsListArb, (assets) => {
          const metrics = calculateLiquidityRatio(assets)
          
          if (metrics.liquidityRatio < 20) {
            expect(metrics.liquidityStatus).toBe('low')
          } else if (metrics.liquidityRatio < 40) {
            expect(metrics.liquidityStatus).toBe('medium')
          } else {
            expect(metrics.liquidityStatus).toBe('good')
          }
        }),
        { numRuns: 100 }
      )
    })
  })
})
