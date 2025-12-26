/**
 * Property-Based Tests - Overview Service
 * 
 * Tests for Client 360 Overview tab service functions.
 * **Feature: client360-evolution**
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  calculateAllocation,
  validateAllocationSum,
  validateAllocationValueSum,
  generateAlerts,
  sortAlertsBySeverity,
  validateAlertSeverityOrder,
  type Alert,
  type AlertSeverity
} from '@/app/_common/lib/services/overview-service'

// ============================================================================
// GENERATORS
// ============================================================================

/**
 * Generator for valid asset categories
 */
const assetCategoryArb = fc.constantFrom('IMMOBILIER', 'FINANCIER', 'PROFESSIONNEL', 'AUTRES')

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
 * Generator for assets with category and value
 */
const assetArb = fc.record({
  category: assetCategoryArb,
  value: monetaryValueArb
})

/**
 * Generator for arrays of assets (non-empty for meaningful tests)
 */
const assetsArrayArb = fc.array(assetArb, { minLength: 1, maxLength: 20 })

/**
 * Generator for alert severity
 */
const alertSeverityArb = fc.constantFrom<AlertSeverity>('CRITICAL', 'WARNING', 'INFO')

/**
 * Generator for alerts
 */
const alertArb = fc.record({
  id: fc.uuid(),
  type: alertSeverityArb,
  title: fc.string({ minLength: 1, maxLength: 100 }),
  message: fc.string({ minLength: 1, maxLength: 500 }),
  actionLink: fc.option(fc.webUrl(), { nil: undefined }),
  actionLabel: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined })
}) as fc.Arbitrary<Alert>

/**
 * Generator for arrays of alerts
 */
const alertsArrayArb = fc.array(alertArb, { minLength: 0, maxLength: 10 })

/**
 * Generator for KYC status
 */
const kycStatusArb = fc.constantFrom('EXPIRED', 'PENDING', 'COMPLETED', 'IN_PROGRESS', null, undefined)

/**
 * Generator for mock client with KYC status
 */
const mockClientArb = fc.record({
  id: fc.uuid(),
  kycStatus: kycStatusArb,
  documents: fc.array(
    fc.record({
      id: fc.uuid(),
      expiresAt: fc.option(
        fc.date({ min: new Date('2024-01-01'), max: new Date('2026-12-31') }),
        { nil: null }
      )
    }),
    { minLength: 0, maxLength: 5 }
  ),
  contrats: fc.array(
    fc.record({
      id: fc.uuid(),
      status: fc.constantFrom('ACTIVE', 'CLOSED'),
      nextRenewalDate: fc.option(
        fc.date({ min: new Date('2024-01-01'), max: new Date('2026-12-31') }),
        { nil: null }
      )
    }),
    { minLength: 0, maxLength: 5 }
  )
})

// ============================================================================
// PROPERTY TESTS - Allocation Sum Consistency
// ============================================================================

describe('Overview Service - Property-Based Tests', () => {
  /**
   * **Feature: client360-evolution, Property 1: Allocation sum consistency**
   * **Validates: Requirements 1.1, 3.1, 3.3, 4.1**
   * 
   * For any set of allocation items, the sum of all percentages SHALL equal 100
   * (within floating point tolerance), and the sum of all values SHALL equal
   * the total value.
   */
  describe('Property 1: Allocation sum consistency', () => {
    it('allocation percentages sum to 100 for any non-empty asset set', () => {
      fc.assert(
        fc.property(assetsArrayArb, (assets) => {
          const totalValue = assets.reduce((sum, a) => sum + a.value, 0)
          
          // Skip if total is 0 (edge case handled separately)
          if (totalValue <= 0) return true
          
          const allocation = calculateAllocation(assets, totalValue)
          
          // Validate using the service function
          expect(validateAllocationSum(allocation)).toBe(true)
          
          // Also verify manually
          const percentageSum = allocation.reduce((sum, item) => sum + item.percentage, 0)
          expect(Math.abs(percentageSum - 100)).toBeLessThan(0.01)
        }),
        { numRuns: 100 }
      )
    })

    it('allocation values sum to total value for any non-empty asset set', () => {
      fc.assert(
        fc.property(assetsArrayArb, (assets) => {
          const totalValue = assets.reduce((sum, a) => sum + a.value, 0)
          
          // Skip if total is 0
          if (totalValue <= 0) return true
          
          const allocation = calculateAllocation(assets, totalValue)
          
          // Validate using the service function
          expect(validateAllocationValueSum(allocation, totalValue)).toBe(true)
          
          // Also verify manually
          const valueSum = allocation.reduce((sum, item) => sum + item.value, 0)
          expect(Math.abs(valueSum - totalValue)).toBeLessThan(0.01)
        }),
        { numRuns: 100 }
      )
    })

    it('each allocation item has valid percentage between 0 and 100', () => {
      fc.assert(
        fc.property(assetsArrayArb, (assets) => {
          const totalValue = assets.reduce((sum, a) => sum + a.value, 0)
          
          if (totalValue <= 0) return true
          
          const allocation = calculateAllocation(assets, totalValue)
          
          for (const item of allocation) {
            expect(item.percentage).toBeGreaterThanOrEqual(0)
            expect(item.percentage).toBeLessThanOrEqual(100)
          }
        }),
        { numRuns: 100 }
      )
    })

    it('allocation items are sorted by value descending', () => {
      fc.assert(
        fc.property(assetsArrayArb, (assets) => {
          const totalValue = assets.reduce((sum, a) => sum + a.value, 0)
          
          if (totalValue <= 0) return true
          
          const allocation = calculateAllocation(assets, totalValue)
          
          // Check descending order
          for (let i = 1; i < allocation.length; i++) {
            expect(allocation[i - 1].value).toBeGreaterThanOrEqual(allocation[i].value)
          }
        }),
        { numRuns: 100 }
      )
    })

    it('allocation aggregates assets by category correctly', () => {
      fc.assert(
        fc.property(assetsArrayArb, (assets) => {
          const totalValue = assets.reduce((sum, a) => sum + a.value, 0)
          
          if (totalValue <= 0) return true
          
          const allocation = calculateAllocation(assets, totalValue)
          
          // Calculate expected values per category
          const expectedByCategory = new Map<string, number>()
          for (const asset of assets) {
            const category = asset.category || 'AUTRES'
            expectedByCategory.set(
              category, 
              (expectedByCategory.get(category) || 0) + asset.value
            )
          }
          
          // Verify each allocation item matches expected
          for (const item of allocation) {
            const expected = expectedByCategory.get(item.category) || 0
            expect(Math.abs(item.value - expected)).toBeLessThan(0.01)
          }
        }),
        { numRuns: 100 }
      )
    })

    it('empty asset array returns empty allocation', () => {
      const allocation = calculateAllocation([], 0)
      expect(allocation).toEqual([])
    })

    it('zero total value returns empty allocation', () => {
      const allocation = calculateAllocation([{ category: 'IMMOBILIER', value: 0 }], 0)
      expect(allocation).toEqual([])
    })

    it('each allocation item has a color assigned', () => {
      fc.assert(
        fc.property(assetsArrayArb, (assets) => {
          const totalValue = assets.reduce((sum, a) => sum + a.value, 0)
          
          if (totalValue <= 0) return true
          
          const allocation = calculateAllocation(assets, totalValue)
          
          for (const item of allocation) {
            expect(item.color).toBeDefined()
            expect(typeof item.color).toBe('string')
            expect(item.color.length).toBeGreaterThan(0)
          }
        }),
        { numRuns: 100 }
      )
    })
  })

  /**
   * **Feature: client360-evolution, Property 15: Alert severity ordering**
   * **Validates: Requirements 1.5**
   * 
   * For any list of alerts displayed to the user, CRITICAL alerts SHALL appear
   * before WARNING alerts, and WARNING alerts SHALL appear before INFO alerts.
   */
  describe('Property 15: Alert severity ordering', () => {
    it('sorted alerts maintain CRITICAL > WARNING > INFO order', () => {
      fc.assert(
        fc.property(alertsArrayArb, (alerts) => {
          const sorted = sortAlertsBySeverity(alerts)
          
          // Validate using the service function
          expect(validateAlertSeverityOrder(sorted)).toBe(true)
        }),
        { numRuns: 100 }
      )
    })

    it('all CRITICAL alerts appear before any WARNING alert', () => {
      fc.assert(
        fc.property(alertsArrayArb, (alerts) => {
          const sorted = sortAlertsBySeverity(alerts)
          
          let foundWarning = false
          for (const alert of sorted) {
            if (alert.type === 'WARNING') {
              foundWarning = true
            }
            if (alert.type === 'CRITICAL' && foundWarning) {
              // CRITICAL after WARNING is invalid
              return false
            }
          }
          return true
        }),
        { numRuns: 100 }
      )
    })

    it('all WARNING alerts appear before any INFO alert', () => {
      fc.assert(
        fc.property(alertsArrayArb, (alerts) => {
          const sorted = sortAlertsBySeverity(alerts)
          
          let foundInfo = false
          for (const alert of sorted) {
            if (alert.type === 'INFO') {
              foundInfo = true
            }
            if (alert.type === 'WARNING' && foundInfo) {
              // WARNING after INFO is invalid
              return false
            }
          }
          return true
        }),
        { numRuns: 100 }
      )
    })

    it('sorting preserves all original alerts', () => {
      fc.assert(
        fc.property(alertsArrayArb, (alerts) => {
          const sorted = sortAlertsBySeverity(alerts)
          
          // Same length
          expect(sorted.length).toBe(alerts.length)
          
          // All original IDs present
          const originalIds = new Set(alerts.map(a => a.id))
          const sortedIds = new Set(sorted.map(a => a.id))
          
          expect(sortedIds.size).toBe(originalIds.size)
          for (const id of originalIds) {
            expect(sortedIds.has(id)).toBe(true)
          }
        }),
        { numRuns: 100 }
      )
    })

    it('sorting is idempotent (sorting twice gives same result)', () => {
      fc.assert(
        fc.property(alertsArrayArb, (alerts) => {
          const sorted1 = sortAlertsBySeverity(alerts)
          const sorted2 = sortAlertsBySeverity(sorted1)
          
          expect(sorted1.map(a => a.id)).toEqual(sorted2.map(a => a.id))
        }),
        { numRuns: 100 }
      )
    })

    it('empty array returns empty array', () => {
      const sorted = sortAlertsBySeverity([])
      expect(sorted).toEqual([])
    })

    it('single alert returns array with that alert', () => {
      fc.assert(
        fc.property(alertArb, (alert) => {
          const sorted = sortAlertsBySeverity([alert])
          
          expect(sorted.length).toBe(1)
          expect(sorted[0].id).toBe(alert.id)
        }),
        { numRuns: 100 }
      )
    })

    it('generateAlerts produces properly sorted alerts', () => {
      fc.assert(
        fc.property(mockClientArb, (client) => {
          const alerts = generateAlerts(client)
          
          // Generated alerts should already be sorted
          expect(validateAlertSeverityOrder(alerts)).toBe(true)
        }),
        { numRuns: 100 }
      )
    })

    it('EXPIRED KYC generates CRITICAL alert', () => {
      const client = {
        id: 'test-id',
        kycStatus: 'EXPIRED',
        documents: [],
        contrats: []
      }
      
      const alerts = generateAlerts(client)
      const kycAlert = alerts.find(a => a.id.includes('kyc'))
      
      expect(kycAlert).toBeDefined()
      expect(kycAlert?.type).toBe('CRITICAL')
    })

    it('PENDING KYC generates WARNING alert', () => {
      const client = {
        id: 'test-id',
        kycStatus: 'PENDING',
        documents: [],
        contrats: []
      }
      
      const alerts = generateAlerts(client)
      const kycAlert = alerts.find(a => a.id.includes('kyc'))
      
      expect(kycAlert).toBeDefined()
      expect(kycAlert?.type).toBe('WARNING')
    })
  })
})
