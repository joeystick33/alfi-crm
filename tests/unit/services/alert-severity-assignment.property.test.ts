/**
 * Property-Based Tests - Alert Severity Assignment
 * 
 * **Feature: compliance-refonte, Property 3: Alert Severity Assignment**
 * **Validates: Requirements 3.1, 3.2, 3.3**
 * 
 * Tests that alert severity is correctly assigned based on document expiration:
 * - 3.1: WHEN a document expires in 30 days, THE Alert_Engine SHALL create an alert with severity "warning"
 * - 3.2: WHEN a document expires in 7 days, THE Alert_Engine SHALL create an alert with severity "high"
 * - 3.3: WHEN a document is expired, THE Alert_Engine SHALL create an alert with severity "critical"
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  getDocumentAlertSeverity,
  DOCUMENT_ALERT_THRESHOLDS,
  type AlertSeverity,
} from '@/lib/compliance/types'

// ============================================================================
// GENERATORS
// ============================================================================

/**
 * Generator for dates in the past (expired documents)
 */
const expiredDateArb = fc.integer({
  min: 1,
  max: 365,
}).map(daysAgo => {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  return date
})

/**
 * Generator for dates expiring within 7 days (HIGH severity)
 */
const highSeverityDateArb = fc.integer({
  min: 1,
  max: DOCUMENT_ALERT_THRESHOLDS.HIGH,
}).map(daysUntil => {
  const date = new Date()
  date.setDate(date.getDate() + daysUntil)
  return date
})

/**
 * Generator for dates expiring between 8 and 30 days (WARNING severity)
 */
const warningSeverityDateArb = fc.integer({
  min: DOCUMENT_ALERT_THRESHOLDS.HIGH + 1,
  max: DOCUMENT_ALERT_THRESHOLDS.WARNING,
}).map(daysUntil => {
  const date = new Date()
  date.setDate(date.getDate() + daysUntil)
  return date
})

/**
 * Generator for dates expiring more than 30 days from now (no alert)
 */
const noAlertDateArb = fc.integer({
  min: DOCUMENT_ALERT_THRESHOLDS.WARNING + 1,
  max: 365,
}).map(daysUntil => {
  const date = new Date()
  date.setDate(date.getDate() + daysUntil)
  return date
})

/**
 * Generator for any valid expiration date
 */
const anyExpirationDateArb = fc.integer({
  min: -365,
  max: 365,
}).map(daysFromNow => {
  const date = new Date()
  date.setDate(date.getDate() + daysFromNow)
  return date
})

// ============================================================================
// PROPERTY TESTS
// ============================================================================

describe('Alert Severity Assignment - Property-Based Tests', () => {
  /**
   * **Feature: compliance-refonte, Property 3: Alert Severity Assignment**
   * **Validates: Requirements 3.1, 3.2, 3.3**
   */
  describe('Property 3: Alert Severity Assignment', () => {
    /**
     * Requirement 3.3: Expired documents get CRITICAL severity
     */
    it('for any expired document (expiration date in the past), severity should be CRITICAL', () => {
      fc.assert(
        fc.property(expiredDateArb, (expiresAt) => {
          const currentDate = new Date()
          const severity = getDocumentAlertSeverity(expiresAt, currentDate)
          
          expect(severity).toBe('CRITICAL')
        }),
        { numRuns: 100 }
      )
    })

    /**
     * Requirement 3.2: Documents expiring within 7 days get HIGH severity
     */
    it('for any document expiring within 7 days, severity should be HIGH', () => {
      fc.assert(
        fc.property(highSeverityDateArb, (expiresAt) => {
          const currentDate = new Date()
          const severity = getDocumentAlertSeverity(expiresAt, currentDate)
          
          expect(severity).toBe('HIGH')
        }),
        { numRuns: 100 }
      )
    })

    /**
     * Requirement 3.1: Documents expiring within 30 days (but more than 7) get WARNING severity
     */
    it('for any document expiring between 8 and 30 days, severity should be WARNING', () => {
      fc.assert(
        fc.property(warningSeverityDateArb, (expiresAt) => {
          const currentDate = new Date()
          const severity = getDocumentAlertSeverity(expiresAt, currentDate)
          
          expect(severity).toBe('WARNING')
        }),
        { numRuns: 100 }
      )
    })

    /**
     * Documents expiring more than 30 days from now should not trigger an alert
     */
    it('for any document expiring more than 30 days from now, severity should be null', () => {
      fc.assert(
        fc.property(noAlertDateArb, (expiresAt) => {
          const currentDate = new Date()
          const severity = getDocumentAlertSeverity(expiresAt, currentDate)
          
          expect(severity).toBeNull()
        }),
        { numRuns: 100 }
      )
    })

    /**
     * Documents without expiration date should not trigger an alert
     */
    it('for documents without expiration date (null), severity should be null', () => {
      const severity = getDocumentAlertSeverity(null)
      expect(severity).toBeNull()
    })

    /**
     * Severity assignment is deterministic
     */
    it('severity assignment is deterministic for the same inputs', () => {
      fc.assert(
        fc.property(anyExpirationDateArb, (expiresAt) => {
          const currentDate = new Date()
          const severity1 = getDocumentAlertSeverity(expiresAt, currentDate)
          const severity2 = getDocumentAlertSeverity(expiresAt, currentDate)
          
          expect(severity1).toBe(severity2)
        }),
        { numRuns: 100 }
      )
    })

    /**
     * Severity increases as expiration approaches
     */
    it('severity increases as expiration date approaches', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          (baseDays) => {
            const currentDate = new Date()
            
            // Create dates at different distances from expiration
            const farDate = new Date(currentDate)
            farDate.setDate(farDate.getDate() + baseDays + 31) // More than 30 days
            
            const mediumDate = new Date(currentDate)
            mediumDate.setDate(mediumDate.getDate() + Math.min(baseDays, 20) + 8) // 8-30 days
            
            const closeDate = new Date(currentDate)
            closeDate.setDate(closeDate.getDate() + Math.min(baseDays % 7, 6) + 1) // 1-7 days
            
            const expiredDate = new Date(currentDate)
            expiredDate.setDate(expiredDate.getDate() - 1) // Expired
            
            const farSeverity = getDocumentAlertSeverity(farDate, currentDate)
            const mediumSeverity = getDocumentAlertSeverity(mediumDate, currentDate)
            const closeSeverity = getDocumentAlertSeverity(closeDate, currentDate)
            const expiredSeverity = getDocumentAlertSeverity(expiredDate, currentDate)
            
            // Far should be null (no alert)
            expect(farSeverity).toBeNull()
            
            // Medium should be WARNING
            expect(mediumSeverity).toBe('WARNING')
            
            // Close should be HIGH
            expect(closeSeverity).toBe('HIGH')
            
            // Expired should be CRITICAL
            expect(expiredSeverity).toBe('CRITICAL')
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Boundary test: exactly 30 days should be WARNING
     */
    it('document expiring in exactly 30 days should have WARNING severity', () => {
      const currentDate = new Date()
      const expiresAt = new Date(currentDate)
      expiresAt.setDate(expiresAt.getDate() + 30)
      
      const severity = getDocumentAlertSeverity(expiresAt, currentDate)
      expect(severity).toBe('WARNING')
    })

    /**
     * Boundary test: exactly 7 days should be HIGH
     */
    it('document expiring in exactly 7 days should have HIGH severity', () => {
      const currentDate = new Date()
      const expiresAt = new Date(currentDate)
      expiresAt.setDate(expiresAt.getDate() + 7)
      
      const severity = getDocumentAlertSeverity(expiresAt, currentDate)
      expect(severity).toBe('HIGH')
    })

    /**
     * Boundary test: exactly today (0 days) should be CRITICAL
     */
    it('document expiring today should have CRITICAL severity', () => {
      const currentDate = new Date()
      const expiresAt = new Date(currentDate)
      
      const severity = getDocumentAlertSeverity(expiresAt, currentDate)
      expect(severity).toBe('CRITICAL')
    })

    /**
     * Boundary test: 31 days should be null (no alert)
     */
    it('document expiring in 31 days should have no alert (null)', () => {
      const currentDate = new Date()
      const expiresAt = new Date(currentDate)
      expiresAt.setDate(expiresAt.getDate() + 31)
      
      const severity = getDocumentAlertSeverity(expiresAt, currentDate)
      expect(severity).toBeNull()
    })

    /**
     * Verify threshold constants match requirements
     */
    it('threshold constants match requirements', () => {
      expect(DOCUMENT_ALERT_THRESHOLDS.WARNING).toBe(30)  // 30 days for warning
      expect(DOCUMENT_ALERT_THRESHOLDS.HIGH).toBe(7)      // 7 days for high
      expect(DOCUMENT_ALERT_THRESHOLDS.CRITICAL).toBe(0)  // 0 days (expired) for critical
    })

    /**
     * Severity is always one of the valid values or null
     */
    it('severity is always a valid AlertSeverity or null', () => {
      fc.assert(
        fc.property(anyExpirationDateArb, (expiresAt) => {
          const currentDate = new Date()
          const severity = getDocumentAlertSeverity(expiresAt, currentDate)
          
          const validSeverities: (AlertSeverity | null)[] = ['LOW', 'WARNING', 'HIGH', 'CRITICAL', null]
          expect(validSeverities).toContain(severity)
        }),
        { numRuns: 100 }
      )
    })
  })
})
