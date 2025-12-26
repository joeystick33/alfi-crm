/**
 * Property-Based Tests - Control Overdue Detection
 * 
 * **Feature: compliance-refonte, Property 18: Control Overdue Detection**
 * **Validates: Requirements 4.5**
 * 
 * Tests that control overdue detection works correctly:
 * - 4.5: WHEN a control due date is passed and status is not "Completed", THE Control_Manager SHALL mark it as "Overdue"
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  isControlOverdue,
  CONTROL_STATUS,
  type ControlStatus,
} from '@/lib/compliance/types'

// ============================================================================
// GENERATORS
// ============================================================================

/**
 * Generator for control statuses
 */
const controlStatusArb = fc.constantFrom(...CONTROL_STATUS)

/**
 * Generator for non-completed statuses
 */
const nonCompletedStatusArb = fc.constantFrom('EN_ATTENTE', 'EN_COURS', 'EN_RETARD') as fc.Arbitrary<ControlStatus>

/**
 * Generator for completed status
 */
const completedStatusArb = fc.constant('TERMINE' as ControlStatus)

/**
 * Generator for past due dates (overdue)
 */
const pastDueDateArb = fc.integer({
  min: 1,
  max: 365,
}).map(daysAgo => {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  return date
})

/**
 * Generator for future due dates (not overdue)
 */
const futureDueDateArb = fc.integer({
  min: 1,
  max: 365,
}).map(daysFromNow => {
  const date = new Date()
  date.setDate(date.getDate() + daysFromNow)
  return date
})

/**
 * Generator for any due date
 */
const anyDueDateArb = fc.integer({
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

describe('Control Overdue Detection - Property-Based Tests', () => {
  /**
   * **Feature: compliance-refonte, Property 18: Control Overdue Detection**
   * **Validates: Requirements 4.5**
   */
  describe('Property 18: Control Overdue Detection', () => {
    /**
     * Requirement 4.5: Controls with past due date and non-completed status are overdue
     */
    it('for any control with past due date and non-completed status, isControlOverdue should return true', () => {
      fc.assert(
        fc.property(pastDueDateArb, nonCompletedStatusArb, (dueDate, status) => {
          const currentDate = new Date()
          const isOverdue = isControlOverdue(dueDate, status, currentDate)
          
          expect(isOverdue).toBe(true)
        }),
        { numRuns: 100 }
      )
    })

    /**
     * Requirement 4.5: Completed controls are never overdue
     */
    it('for any completed control (TERMINE), isControlOverdue should return false regardless of due date', () => {
      fc.assert(
        fc.property(anyDueDateArb, (dueDate) => {
          const currentDate = new Date()
          const isOverdue = isControlOverdue(dueDate, 'TERMINE', currentDate)
          
          expect(isOverdue).toBe(false)
        }),
        { numRuns: 100 }
      )
    })

    /**
     * Controls with future due date are not overdue
     */
    it('for any control with future due date, isControlOverdue should return false', () => {
      fc.assert(
        fc.property(futureDueDateArb, controlStatusArb, (dueDate, status) => {
          const currentDate = new Date()
          const isOverdue = isControlOverdue(dueDate, status, currentDate)
          
          expect(isOverdue).toBe(false)
        }),
        { numRuns: 100 }
      )
    })

    /**
     * Overdue detection is deterministic
     */
    it('overdue detection is deterministic for the same inputs', () => {
      fc.assert(
        fc.property(anyDueDateArb, controlStatusArb, (dueDate, status) => {
          const currentDate = new Date()
          const result1 = isControlOverdue(dueDate, status, currentDate)
          const result2 = isControlOverdue(dueDate, status, currentDate)
          
          expect(result1).toBe(result2)
        }),
        { numRuns: 100 }
      )
    })

    /**
     * Boundary test: due date exactly now
     */
    it('control with due date exactly now should not be overdue', () => {
      const currentDate = new Date()
      const dueDate = new Date(currentDate)
      
      const isOverdue = isControlOverdue(dueDate, 'EN_ATTENTE', currentDate)
      
      // Due date equal to current date means not yet overdue
      expect(isOverdue).toBe(false)
    })

    /**
     * Boundary test: due date 1 millisecond in the past
     */
    it('control with due date 1 millisecond in the past should be overdue', () => {
      const currentDate = new Date()
      const dueDate = new Date(currentDate.getTime() - 1)
      
      const isOverdue = isControlOverdue(dueDate, 'EN_ATTENTE', currentDate)
      
      expect(isOverdue).toBe(true)
    })

    /**
     * EN_ATTENTE status with past due date is overdue
     */
    it('EN_ATTENTE control with past due date is overdue', () => {
      fc.assert(
        fc.property(pastDueDateArb, (dueDate) => {
          const currentDate = new Date()
          const isOverdue = isControlOverdue(dueDate, 'EN_ATTENTE', currentDate)
          
          expect(isOverdue).toBe(true)
        }),
        { numRuns: 100 }
      )
    })

    /**
     * EN_COURS status with past due date is overdue
     */
    it('EN_COURS control with past due date is overdue', () => {
      fc.assert(
        fc.property(pastDueDateArb, (dueDate) => {
          const currentDate = new Date()
          const isOverdue = isControlOverdue(dueDate, 'EN_COURS', currentDate)
          
          expect(isOverdue).toBe(true)
        }),
        { numRuns: 100 }
      )
    })

    /**
     * EN_RETARD status with past due date is overdue
     */
    it('EN_RETARD control with past due date is overdue', () => {
      fc.assert(
        fc.property(pastDueDateArb, (dueDate) => {
          const currentDate = new Date()
          const isOverdue = isControlOverdue(dueDate, 'EN_RETARD', currentDate)
          
          expect(isOverdue).toBe(true)
        }),
        { numRuns: 100 }
      )
    })

    /**
     * Overdue status depends only on due date and completion status
     */
    it('overdue status depends only on due date and completion status', () => {
      fc.assert(
        fc.property(
          pastDueDateArb,
          nonCompletedStatusArb,
          nonCompletedStatusArb,
          (dueDate, status1, status2) => {
            const currentDate = new Date()
            const isOverdue1 = isControlOverdue(dueDate, status1, currentDate)
            const isOverdue2 = isControlOverdue(dueDate, status2, currentDate)
            
            // Both non-completed statuses with past due date should be overdue
            expect(isOverdue1).toBe(true)
            expect(isOverdue2).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Overdue detection respects the current date parameter
     */
    it('overdue detection respects the current date parameter', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          nonCompletedStatusArb,
          (daysDiff) => {
            const dueDate = new Date()
            
            // Current date before due date
            const beforeDueDate = new Date(dueDate)
            beforeDueDate.setDate(beforeDueDate.getDate() - daysDiff)
            
            // Current date after due date
            const afterDueDate = new Date(dueDate)
            afterDueDate.setDate(afterDueDate.getDate() + daysDiff)
            
            const isOverdueBefore = isControlOverdue(dueDate, 'EN_ATTENTE', beforeDueDate)
            const isOverdueAfter = isControlOverdue(dueDate, 'EN_ATTENTE', afterDueDate)
            
            expect(isOverdueBefore).toBe(false)
            expect(isOverdueAfter).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Default current date is used when not provided
     */
    it('uses current date when not provided', () => {
      const pastDueDate = new Date()
      pastDueDate.setDate(pastDueDate.getDate() - 10)
      
      const futureDueDate = new Date()
      futureDueDate.setDate(futureDueDate.getDate() + 10)
      
      // Without explicit current date
      const isOverduePast = isControlOverdue(pastDueDate, 'EN_ATTENTE')
      const isOverdueFuture = isControlOverdue(futureDueDate, 'EN_ATTENTE')
      
      expect(isOverduePast).toBe(true)
      expect(isOverdueFuture).toBe(false)
    })
  })
})
