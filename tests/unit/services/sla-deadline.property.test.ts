/**
 * Property-Based Tests - SLA Deadline Calculation
 * 
 * **Feature: compliance-refonte, Property 5: SLA Deadline Calculation**
 * **Validates: Requirements 5.3**
 * 
 * Tests that SLA deadlines are calculated correctly based on severity:
 * - LOW: 60 days
 * - MEDIUM: 30 days
 * - HIGH: 15 days
 * - CRITICAL: 7 days
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  calculateSLADeadline,
  SLA_DEADLINES,
  SLA_SEVERITY,
  type SLASeverity,
} from '@/lib/compliance/types'

// ============================================================================
// GENERATORS
// ============================================================================

/**
 * Generator for SLA severity levels
 */
const slaSeverityArb = fc.constantFrom(...SLA_SEVERITY)

/**
 * Generator for valid received dates (within reasonable range)
 * Uses integer timestamps to avoid NaN date issues
 */
const receivedDateArb = fc.integer({
  min: new Date('2020-01-01').getTime(),
  max: new Date('2030-12-31').getTime(),
}).map(timestamp => new Date(timestamp))

// ============================================================================
// PROPERTY TESTS
// ============================================================================

describe('Compliance SLA Deadline - Property-Based Tests', () => {
  /**
   * **Feature: compliance-refonte, Property 5: SLA Deadline Calculation**
   * **Validates: Requirements 5.3**
   * 
   * For any reclamation with a severity level, the SLA deadline SHALL equal 
   * the creation date plus:
   * - LOW: 60 days
   * - MEDIUM: 30 days
   * - HIGH: 15 days
   * - CRITICAL: 7 days
   */
  describe('Property 5: SLA Deadline Calculation', () => {
    it('for any severity and received date, deadline equals received date plus SLA days', () => {
      fc.assert(
        fc.property(slaSeverityArb, receivedDateArb, (severity, receivedAt) => {
          const deadline = calculateSLADeadline(severity, receivedAt)
          const expectedDays = SLA_DEADLINES[severity]
          
          // Calculate the difference in days
          const diffMs = deadline.getTime() - receivedAt.getTime()
          const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
          
          expect(diffDays).toBe(expectedDays)
        }),
        { numRuns: 100 }
      )
    })

    it('LOW severity deadline is exactly 60 days after received date', () => {
      fc.assert(
        fc.property(receivedDateArb, (receivedAt) => {
          const deadline = calculateSLADeadline('LOW', receivedAt)
          
          const diffMs = deadline.getTime() - receivedAt.getTime()
          const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
          
          expect(diffDays).toBe(60)
        }),
        { numRuns: 100 }
      )
    })

    it('MEDIUM severity deadline is exactly 30 days after received date', () => {
      fc.assert(
        fc.property(receivedDateArb, (receivedAt) => {
          const deadline = calculateSLADeadline('MEDIUM', receivedAt)
          
          const diffMs = deadline.getTime() - receivedAt.getTime()
          const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
          
          expect(diffDays).toBe(30)
        }),
        { numRuns: 100 }
      )
    })

    it('HIGH severity deadline is exactly 15 days after received date', () => {
      fc.assert(
        fc.property(receivedDateArb, (receivedAt) => {
          const deadline = calculateSLADeadline('HIGH', receivedAt)
          
          const diffMs = deadline.getTime() - receivedAt.getTime()
          const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
          
          expect(diffDays).toBe(15)
        }),
        { numRuns: 100 }
      )
    })

    it('CRITICAL severity deadline is exactly 7 days after received date', () => {
      fc.assert(
        fc.property(receivedDateArb, (receivedAt) => {
          const deadline = calculateSLADeadline('CRITICAL', receivedAt)
          
          const diffMs = deadline.getTime() - receivedAt.getTime()
          const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
          
          expect(diffDays).toBe(7)
        }),
        { numRuns: 100 }
      )
    })

    it('deadline is always after received date', () => {
      fc.assert(
        fc.property(slaSeverityArb, receivedDateArb, (severity, receivedAt) => {
          const deadline = calculateSLADeadline(severity, receivedAt)
          
          expect(deadline.getTime()).toBeGreaterThan(receivedAt.getTime())
        }),
        { numRuns: 100 }
      )
    })

    it('SLA calculation is deterministic (same inputs produce same output)', () => {
      fc.assert(
        fc.property(slaSeverityArb, receivedDateArb, (severity, receivedAt) => {
          const result1 = calculateSLADeadline(severity, receivedAt)
          const result2 = calculateSLADeadline(severity, receivedAt)
          
          expect(result1.getTime()).toBe(result2.getTime())
        }),
        { numRuns: 100 }
      )
    })

    it('higher severity means shorter deadline', () => {
      fc.assert(
        fc.property(receivedDateArb, (receivedAt) => {
          const lowDeadline = calculateSLADeadline('LOW', receivedAt)
          const mediumDeadline = calculateSLADeadline('MEDIUM', receivedAt)
          const highDeadline = calculateSLADeadline('HIGH', receivedAt)
          const criticalDeadline = calculateSLADeadline('CRITICAL', receivedAt)
          
          // LOW > MEDIUM > HIGH > CRITICAL (in terms of deadline time)
          expect(lowDeadline.getTime()).toBeGreaterThan(mediumDeadline.getTime())
          expect(mediumDeadline.getTime()).toBeGreaterThan(highDeadline.getTime())
          expect(highDeadline.getTime()).toBeGreaterThan(criticalDeadline.getTime())
        }),
        { numRuns: 100 }
      )
    })

    it('SLA_DEADLINES constant matches expected values from requirements', () => {
      // Verify the SLA deadlines match the requirements
      expect(SLA_DEADLINES.LOW).toBe(60)       // 60 days
      expect(SLA_DEADLINES.MEDIUM).toBe(30)    // 30 days
      expect(SLA_DEADLINES.HIGH).toBe(15)      // 15 days
      expect(SLA_DEADLINES.CRITICAL).toBe(7)   // 7 days
    })
  })
})
