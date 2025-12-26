/**
 * Property-Based Tests - Overview Utilities
 * 
 * Tests for Client 360 Overview tab utility functions.
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  mapKYCStatusToAlert,
  getKYCAlertType,
  limitTimelineEvents,
  isTimelineProperlyLimited,
  mapSimulationStatusToBadge,
  getSimulationBadgeVariant,
  type TimelineEvent,
  type BadgeVariant,
} from '@/app/_common/lib/services/overview-utils'

// ============================================================================
// GENERATORS
// ============================================================================

/**
 * Generator for valid KYC statuses
 */
const kycStatusArb = fc.constantFrom('EXPIRED', 'PENDING', 'COMPLETED', 'IN_PROGRESS')

/**
 * Generator for valid dates (ensuring no NaN dates)
 */
const validDateArb = fc.integer({ 
  min: new Date('2020-01-01').getTime(), 
  max: new Date('2030-12-31').getTime() 
}).map(timestamp => new Date(timestamp))

/**
 * Generator for timeline events with realistic data
 */
const timelineEventArb = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  description: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
  createdAt: validDateArb,
  type: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
}) as fc.Arbitrary<TimelineEvent>

/**
 * Generator for arrays of timeline events
 */
const timelineEventsArrayArb = fc.array(timelineEventArb, { minLength: 0, maxLength: 20 })

/**
 * Generator for valid simulation statuses
 */
const simulationStatusArb = fc.constantFrom('DRAFT', 'COMPLETED', 'SHARED', 'ARCHIVED')

// ============================================================================
// PROPERTY TESTS
// ============================================================================

describe('Overview Utils - Property-Based Tests', () => {
  /**
   * **Feature: client360-repair, Property 10: KYC alert mapping**
   * **Validates: Requirements 4.3, 4.4**
   * 
   * For any KYC status, the alert type SHALL be:
   * - EXPIRED → critical
   * - PENDING → warning
   * - COMPLETED → success
   */
  describe('Property 10: KYC alert mapping', () => {
    it('EXPIRED status maps to critical alert type', () => {
      const alert = mapKYCStatusToAlert('EXPIRED')
      expect(alert).not.toBeNull()
      expect(alert!.type).toBe('critical')
      expect(alert!.badgeVariant).toBe('destructive')
      expect(alert!.badgeText).toBe('Urgent')
    })

    it('PENDING status maps to warning alert type', () => {
      const alert = mapKYCStatusToAlert('PENDING')
      expect(alert).not.toBeNull()
      expect(alert!.type).toBe('warning')
      expect(alert!.badgeVariant).toBe('warning')
      expect(alert!.badgeText).toBe('À faire')
    })

    it('COMPLETED status maps to success alert type', () => {
      const alert = mapKYCStatusToAlert('COMPLETED')
      expect(alert).not.toBeNull()
      expect(alert!.type).toBe('success')
      expect(alert!.badgeVariant).toBe('success')
      expect(alert!.badgeText).toBe('OK')
    })

    it('all valid KYC statuses produce non-null alerts with correct structure', () => {
      fc.assert(
        fc.property(kycStatusArb, (status) => {
          const alert = mapKYCStatusToAlert(status)
          
          // All valid statuses should produce an alert
          expect(alert).not.toBeNull()
          
          // Alert should have all required properties
          expect(alert).toHaveProperty('type')
          expect(alert).toHaveProperty('title')
          expect(alert).toHaveProperty('description')
          expect(alert).toHaveProperty('badgeText')
          expect(alert).toHaveProperty('badgeVariant')
          
          // Type should be one of the valid alert types
          expect(['critical', 'warning', 'success', 'info']).toContain(alert!.type)
        }),
        { numRuns: 100 }
      )
    })

    it('KYC status to alert type mapping is deterministic', () => {
      fc.assert(
        fc.property(kycStatusArb, (status) => {
          const alert1 = mapKYCStatusToAlert(status)
          const alert2 = mapKYCStatusToAlert(status)
          
          // Same input should always produce same output
          expect(alert1).toEqual(alert2)
        }),
        { numRuns: 100 }
      )
    })

    it('null or undefined KYC status returns null alert', () => {
      expect(mapKYCStatusToAlert(null)).toBeNull()
      expect(mapKYCStatusToAlert(undefined)).toBeNull()
    })

    it('getKYCAlertType returns correct type for each status', () => {
      expect(getKYCAlertType('EXPIRED')).toBe('critical')
      expect(getKYCAlertType('PENDING')).toBe('warning')
      expect(getKYCAlertType('COMPLETED')).toBe('success')
      expect(getKYCAlertType('IN_PROGRESS')).toBe('info')
      expect(getKYCAlertType(null)).toBeNull()
    })
  })


  /**
   * **Feature: client360-repair, Property 11: Timeline event limiting**
   * **Validates: Requirements 4.5**
   * 
   * For any list of timeline events:
   * - The displayed list SHALL contain at most 5 events
   * - Events SHALL be sorted by creation date descending
   */
  describe('Property 11: Timeline event limiting', () => {
    it('limited events array has at most 5 elements', () => {
      fc.assert(
        fc.property(timelineEventsArrayArb, (events) => {
          const limited = limitTimelineEvents(events)
          
          expect(limited.length).toBeLessThanOrEqual(5)
        }),
        { numRuns: 100 }
      )
    })

    it('limited events array has correct length based on input', () => {
      fc.assert(
        fc.property(timelineEventsArrayArb, (events) => {
          const limited = limitTimelineEvents(events)
          const expectedLength = Math.min(events.length, 5)
          
          expect(limited.length).toBe(expectedLength)
        }),
        { numRuns: 100 }
      )
    })

    it('limited events are sorted by creation date descending', () => {
      fc.assert(
        fc.property(timelineEventsArrayArb, (events) => {
          const limited = limitTimelineEvents(events)
          
          // Check that each event's date is >= the next event's date
          for (let i = 1; i < limited.length; i++) {
            const prevDate = new Date(limited[i - 1].createdAt).getTime()
            const currDate = new Date(limited[i].createdAt).getTime()
            expect(prevDate).toBeGreaterThanOrEqual(currDate)
          }
        }),
        { numRuns: 100 }
      )
    })

    it('limited events contain the most recent events from the original array', () => {
      fc.assert(
        fc.property(
          fc.array(timelineEventArb, { minLength: 6, maxLength: 20 }),
          (events) => {
            const limited = limitTimelineEvents(events)
            
            // Sort original events by date descending
            const sortedOriginal = [...events].sort((a, b) => {
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            })
            
            // The limited events should be the first 5 from sorted original
            const expectedIds = sortedOriginal.slice(0, 5).map(e => e.id)
            const actualIds = limited.map(e => e.id)
            
            expect(actualIds).toEqual(expectedIds)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('custom limit parameter is respected', () => {
      fc.assert(
        fc.property(
          timelineEventsArrayArb,
          fc.integer({ min: 1, max: 10 }),
          (events, limit) => {
            const limited = limitTimelineEvents(events, limit)
            const expectedLength = Math.min(events.length, limit)
            
            expect(limited.length).toBe(expectedLength)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('empty array returns empty array', () => {
      const limited = limitTimelineEvents([])
      expect(limited).toEqual([])
    })

    it('null or undefined input returns empty array', () => {
      expect(limitTimelineEvents(null)).toEqual([])
      expect(limitTimelineEvents(undefined)).toEqual([])
    })

    it('isTimelineProperlyLimited validates correct limiting', () => {
      fc.assert(
        fc.property(timelineEventsArrayArb, (events) => {
          const limited = limitTimelineEvents(events)
          
          expect(isTimelineProperlyLimited(events, limited, 5)).toBe(true)
        }),
        { numRuns: 100 }
      )
    })
  })

  /**
   * **Feature: client360-repair, Property 12: Simulation status badge mapping**
   * **Validates: Requirements 5.2**
   * 
   * For any simulation status, the badge variant SHALL be:
   * - DRAFT → secondary
   * - COMPLETED → success
   * - SHARED → default
   * - ARCHIVED → warning
   */
  describe('Property 12: Simulation status badge mapping', () => {
    it('DRAFT status maps to secondary badge variant', () => {
      const badge = mapSimulationStatusToBadge('DRAFT')
      expect(badge.variant).toBe('secondary')
      expect(badge.label).toBe('Brouillon')
    })

    it('COMPLETED status maps to success badge variant', () => {
      const badge = mapSimulationStatusToBadge('COMPLETED')
      expect(badge.variant).toBe('success')
      expect(badge.label).toBe('Terminée')
    })

    it('SHARED status maps to default badge variant', () => {
      const badge = mapSimulationStatusToBadge('SHARED')
      expect(badge.variant).toBe('default')
      expect(badge.label).toBe('Partagée')
    })

    it('ARCHIVED status maps to warning badge variant', () => {
      const badge = mapSimulationStatusToBadge('ARCHIVED')
      expect(badge.variant).toBe('warning')
      expect(badge.label).toBe('Archivée')
    })

    it('all valid simulation statuses produce correct badge variants', () => {
      const expectedMappings: Record<string, BadgeVariant> = {
        DRAFT: 'secondary',
        COMPLETED: 'success',
        SHARED: 'default',
        ARCHIVED: 'warning',
      }

      fc.assert(
        fc.property(simulationStatusArb, (status) => {
          const badge = mapSimulationStatusToBadge(status)
          
          expect(badge.variant).toBe(expectedMappings[status])
        }),
        { numRuns: 100 }
      )
    })

    it('simulation status to badge mapping is deterministic', () => {
      fc.assert(
        fc.property(simulationStatusArb, (status) => {
          const badge1 = mapSimulationStatusToBadge(status)
          const badge2 = mapSimulationStatusToBadge(status)
          
          expect(badge1).toEqual(badge2)
        }),
        { numRuns: 100 }
      )
    })

    it('all badges have required properties', () => {
      fc.assert(
        fc.property(simulationStatusArb, (status) => {
          const badge = mapSimulationStatusToBadge(status)
          
          expect(badge).toHaveProperty('variant')
          expect(badge).toHaveProperty('label')
          expect(typeof badge.variant).toBe('string')
          expect(typeof badge.label).toBe('string')
          expect(badge.label.length).toBeGreaterThan(0)
        }),
        { numRuns: 100 }
      )
    })

    it('null or undefined status defaults to DRAFT behavior', () => {
      const nullBadge = mapSimulationStatusToBadge(null)
      const undefinedBadge = mapSimulationStatusToBadge(undefined)
      const draftBadge = mapSimulationStatusToBadge('DRAFT')
      
      expect(nullBadge.variant).toBe(draftBadge.variant)
      expect(undefinedBadge.variant).toBe(draftBadge.variant)
    })

    it('getSimulationBadgeVariant returns correct variant for each status', () => {
      expect(getSimulationBadgeVariant('DRAFT')).toBe('secondary')
      expect(getSimulationBadgeVariant('COMPLETED')).toBe('success')
      expect(getSimulationBadgeVariant('SHARED')).toBe('default')
      expect(getSimulationBadgeVariant('ARCHIVED')).toBe('warning')
    })
  })
})
