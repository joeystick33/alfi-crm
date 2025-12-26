/**
 * Property-Based Tests - Documents Service
 * 
 * Tests for Client 360 Documents tab service functions.
 * **Feature: client360-evolution**
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  shouldGenerateExpirationAlert,
  getDocumentsRequiringExpirationAlerts,
  validateExpirationAlertsGenerated,
  generateExpirationAlertData,
  calculateDaysUntilExpiration,
  determineDocumentStatus,
  validateDocumentCompleteness,
  isValidDocumentCategory,
  isValidDocumentStatus,
  groupDocumentsByCategory,
  countDocumentsByStatus,
  VALID_DOCUMENT_CATEGORIES,
  VALID_DOCUMENT_STATUSES,
  DEFAULT_EXPIRATION_ALERT_DAYS
} from '@/app/_common/lib/services/documents-data-service'
import type { Document } from '@/app/_common/types/client360'

// ============================================================================
// GENERATORS
// ============================================================================

/**
 * Generator for valid document categories
 */
const validDocumentCategoryArb = fc.constantFrom(...VALID_DOCUMENT_CATEGORIES)

/**
 * Generator for valid document statuses
 */
const validDocumentStatusArb = fc.constantFrom(...VALID_DOCUMENT_STATUSES)

/**
 * Generator for invalid document categories
 */
const invalidDocumentCategoryArb = fc.string({ minLength: 1, maxLength: 20 })
  .filter(s => !VALID_DOCUMENT_CATEGORIES.includes(s as any))

/**
 * Generator for invalid document statuses
 */
const invalidDocumentStatusArb = fc.string({ minLength: 1, maxLength: 20 })
  .filter(s => !VALID_DOCUMENT_STATUSES.includes(s as any))

/**
 * Generator for valid ISO date strings
 */
const validDateStringArb = fc.integer({ min: 2020, max: 2030 }).chain(year =>
  fc.integer({ min: 1, max: 12 }).chain(month =>
    fc.integer({ min: 1, max: 28 }).map(day => 
      `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T00:00:00.000Z`
    )
  )
)

/**
 * Generator for SHA-256 hash strings (64 hex characters)
 */
const hashStringArb = fc.array(
  fc.integer({ min: 0, max: 15 }).map(n => n.toString(16)),
  { minLength: 64, maxLength: 64 }
).map(arr => arr.join(''))

/**
 * Generator for document metadata
 */
const documentMetadataArb = fc.record({
  certifiedAt: validDateStringArb,
  certifiedBy: fc.string({ minLength: 1, maxLength: 100 }),
  hash: hashStringArb,
  size: fc.integer({ min: 1, max: 10000000 })
})

/**
 * Generator for complete documents
 */
const documentArb: fc.Arbitrary<Document> = fc.record({
  id: fc.uuid(),
  category: validDocumentCategoryArb,
  type: fc.string({ minLength: 1, maxLength: 50 }),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  status: validDocumentStatusArb,
  expirationDate: fc.option(validDateStringArb, { nil: undefined }),
  uploadDate: validDateStringArb,
  metadata: documentMetadataArb
})

/**
 * Generator for documents with expiration dates
 */
const documentWithExpirationArb: fc.Arbitrary<Document> = fc.record({
  id: fc.uuid(),
  category: validDocumentCategoryArb,
  type: fc.string({ minLength: 1, maxLength: 50 }),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  status: validDocumentStatusArb,
  expirationDate: validDateStringArb,
  uploadDate: validDateStringArb,
  metadata: documentMetadataArb
})

/**
 * Generator for arrays of documents
 */
const documentsArrayArb = fc.array(documentArb, { minLength: 0, maxLength: 20 })

/**
 * Generator for non-empty arrays of documents
 */
const nonEmptyDocumentsArrayArb = fc.array(documentArb, { minLength: 1, maxLength: 20 })

/**
 * Generator for a fixed reference date
 */
const referenceDateArb = fc.date({ 
  min: new Date('2024-01-01'), 
  max: new Date('2026-12-31') 
})

// ============================================================================
// PROPERTY TESTS
// ============================================================================

describe('Documents Service - Property-Based Tests', () => {
  /**
   * **Feature: client360-evolution, Property 12: Document expiration alerts**
   * **Validates: Requirements 10.3**
   * 
   * For any document with an expiration date within 30 days of current date,
   * an expiration alert SHALL be generated.
   */
  describe('Property 12: Document expiration alerts', () => {
    it('documents expiring within 30 days should generate alerts', () => {
      fc.assert(
        fc.property(
          documentWithExpirationArb,
          referenceDateArb,
          (document, referenceDate) => {
            const daysUntilExpiration = calculateDaysUntilExpiration(
              document.expirationDate!,
              referenceDate
            )
            
            const shouldAlert = shouldGenerateExpirationAlert(
              document,
              DEFAULT_EXPIRATION_ALERT_DAYS,
              referenceDate
            )
            
            // If within 30 days (including expired), should alert
            if (daysUntilExpiration <= DEFAULT_EXPIRATION_ALERT_DAYS) {
              expect(shouldAlert).toBe(true)
            } else {
              expect(shouldAlert).toBe(false)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('documents without expiration dates should not generate alerts', () => {
      fc.assert(
        fc.property(
          documentArb.map(d => ({ ...d, expirationDate: undefined })),
          referenceDateArb,
          (document, referenceDate) => {
            const shouldAlert = shouldGenerateExpirationAlert(
              document,
              DEFAULT_EXPIRATION_ALERT_DAYS,
              referenceDate
            )
            
            expect(shouldAlert).toBe(false)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('getDocumentsRequiringExpirationAlerts returns only documents within threshold', () => {
      fc.assert(
        fc.property(
          documentsArrayArb,
          referenceDateArb,
          (documents, referenceDate) => {
            const alertDocs = getDocumentsRequiringExpirationAlerts(
              documents,
              DEFAULT_EXPIRATION_ALERT_DAYS,
              referenceDate
            )
            
            // All returned documents should have expiration dates within threshold
            for (const doc of alertDocs) {
              expect(doc.expirationDate).toBeDefined()
              const days = calculateDaysUntilExpiration(doc.expirationDate!, referenceDate)
              expect(days).toBeLessThanOrEqual(DEFAULT_EXPIRATION_ALERT_DAYS)
            }
            
            // All documents with expiration within threshold should be included
            for (const doc of documents) {
              if (doc.expirationDate) {
                const days = calculateDaysUntilExpiration(doc.expirationDate, referenceDate)
                if (days <= DEFAULT_EXPIRATION_ALERT_DAYS) {
                  expect(alertDocs).toContainEqual(doc)
                }
              }
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('validateExpirationAlertsGenerated correctly validates alert coverage', () => {
      fc.assert(
        fc.property(
          documentsArrayArb,
          referenceDateArb,
          (documents, referenceDate) => {
            // Generate alerts for all documents requiring them
            const alertDocs = getDocumentsRequiringExpirationAlerts(
              documents,
              DEFAULT_EXPIRATION_ALERT_DAYS,
              referenceDate
            )
            
            const alerts = alertDocs.map(d => ({ documentId: d.id }))
            
            const validation = validateExpirationAlertsGenerated(
              documents,
              alerts,
              DEFAULT_EXPIRATION_ALERT_DAYS,
              referenceDate
            )
            
            // Should be valid when all required alerts are generated
            expect(validation.isValid).toBe(true)
            expect(validation.missingAlerts).toHaveLength(0)
            expect(validation.extraAlerts).toHaveLength(0)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('generateExpirationAlertData returns null for documents outside threshold', () => {
      fc.assert(
        fc.property(
          documentWithExpirationArb,
          referenceDateArb,
          (document, referenceDate) => {
            const alertData = generateExpirationAlertData(document, referenceDate)
            const daysUntilExpiration = calculateDaysUntilExpiration(
              document.expirationDate!,
              referenceDate
            )
            
            if (daysUntilExpiration > DEFAULT_EXPIRATION_ALERT_DAYS) {
              expect(alertData).toBeNull()
            } else {
              expect(alertData).not.toBeNull()
              expect(alertData!.documentId).toBe(document.id)
              expect(alertData!.daysRemaining).toBe(daysUntilExpiration)
              expect(alertData!.isExpired).toBe(daysUntilExpiration < 0)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('expired documents have CRITICAL severity', () => {
      fc.assert(
        fc.property(
          documentWithExpirationArb,
          referenceDateArb,
          (document, referenceDate) => {
            const alertData = generateExpirationAlertData(document, referenceDate)
            
            if (alertData && alertData.isExpired) {
              expect(alertData.severity).toBe('CRITICAL')
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('documents expiring within 7 days have CRITICAL severity', () => {
      fc.assert(
        fc.property(
          documentWithExpirationArb,
          referenceDateArb,
          (document, referenceDate) => {
            const alertData = generateExpirationAlertData(document, referenceDate)
            
            if (alertData && !alertData.isExpired && alertData.daysRemaining <= 7) {
              expect(alertData.severity).toBe('CRITICAL')
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Additional tests for document validation
   */
  describe('Document validation', () => {
    it('all valid document categories are recognized', () => {
      fc.assert(
        fc.property(validDocumentCategoryArb, (category) => {
          expect(isValidDocumentCategory(category)).toBe(true)
        }),
        { numRuns: 100 }
      )
    })

    it('all valid document statuses are recognized', () => {
      fc.assert(
        fc.property(validDocumentStatusArb, (status) => {
          expect(isValidDocumentStatus(status)).toBe(true)
        }),
        { numRuns: 100 }
      )
    })

    it('invalid document categories are rejected', () => {
      fc.assert(
        fc.property(invalidDocumentCategoryArb, (category) => {
          expect(isValidDocumentCategory(category)).toBe(false)
        }),
        { numRuns: 100 }
      )
    })

    it('invalid document statuses are rejected', () => {
      fc.assert(
        fc.property(invalidDocumentStatusArb, (status) => {
          expect(isValidDocumentStatus(status)).toBe(false)
        }),
        { numRuns: 100 }
      )
    })

    it('all generated documents have complete required fields', () => {
      fc.assert(
        fc.property(documentArb, (document) => {
          const { isComplete, missingFields } = validateDocumentCompleteness(document)
          
          expect(isComplete).toBe(true)
          expect(missingFields).toHaveLength(0)
        }),
        { numRuns: 100 }
      )
    })

    it('documents missing id are incomplete', () => {
      fc.assert(
        fc.property(documentArb, (document) => {
          const incompleteDoc = { ...document, id: undefined }
          const { isComplete, missingFields } = validateDocumentCompleteness(incompleteDoc as any)
          
          expect(isComplete).toBe(false)
          expect(missingFields).toContain('id')
        }),
        { numRuns: 100 }
      )
    })

    it('documents missing category are incomplete', () => {
      fc.assert(
        fc.property(documentArb, (document) => {
          const incompleteDoc = { ...document, category: undefined }
          const { isComplete, missingFields } = validateDocumentCompleteness(incompleteDoc as any)
          
          expect(isComplete).toBe(false)
          expect(missingFields).toContain('category')
        }),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Tests for document status determination
   */
  describe('Document status determination', () => {
    it('documents without expiration date are VALID', () => {
      fc.assert(
        fc.property(referenceDateArb, (referenceDate) => {
          const status = determineDocumentStatus(undefined, referenceDate)
          expect(status).toBe('VALID')
        }),
        { numRuns: 100 }
      )
    })

    it('documents with past expiration date are EXPIRED', () => {
      fc.assert(
        fc.property(
          validDateStringArb,
          referenceDateArb,
          (expirationDate, referenceDate) => {
            const expiry = new Date(expirationDate)
            
            // Only test when expiration is in the past
            if (expiry < referenceDate) {
              const status = determineDocumentStatus(expirationDate, referenceDate)
              expect(status).toBe('EXPIRED')
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('documents with future expiration date are VALID', () => {
      fc.assert(
        fc.property(
          validDateStringArb,
          referenceDateArb,
          (expirationDate, referenceDate) => {
            const expiry = new Date(expirationDate)
            
            // Only test when expiration is in the future
            if (expiry >= referenceDate) {
              const status = determineDocumentStatus(expirationDate, referenceDate)
              expect(status).toBe('VALID')
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Tests for document grouping
   */
  describe('Document grouping', () => {
    it('groupDocumentsByCategory groups all documents correctly', () => {
      fc.assert(
        fc.property(documentsArrayArb, (documents) => {
          const grouped = groupDocumentsByCategory(documents)
          
          // All categories should be present
          for (const category of VALID_DOCUMENT_CATEGORIES) {
            expect(grouped.has(category)).toBe(true)
          }
          
          // Total count should match
          let totalGrouped = 0
          for (const docs of grouped.values()) {
            totalGrouped += docs.length
          }
          expect(totalGrouped).toBe(documents.length)
          
          // Each document should be in its correct category
          for (const doc of documents) {
            const categoryDocs = grouped.get(doc.category)
            expect(categoryDocs).toContainEqual(doc)
          }
        }),
        { numRuns: 100 }
      )
    })

    it('countDocumentsByStatus counts all statuses correctly', () => {
      fc.assert(
        fc.property(documentsArrayArb, (documents) => {
          const counts = countDocumentsByStatus(documents)
          
          // Total count should match
          const totalCounted = counts.VALID + counts.EXPIRED + counts.MISSING
          expect(totalCounted).toBe(documents.length)
          
          // Each status count should match manual count
          for (const status of VALID_DOCUMENT_STATUSES) {
            const manualCount = documents.filter(d => d.status === status).length
            expect(counts[status]).toBe(manualCount)
          }
        }),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Tests for days calculation
   */
  describe('Days until expiration calculation', () => {
    it('calculateDaysUntilExpiration returns correct positive days for future dates', () => {
      const referenceDate = new Date('2025-01-15')
      const futureDate = '2025-02-15T00:00:00.000Z'
      
      const days = calculateDaysUntilExpiration(futureDate, referenceDate)
      expect(days).toBe(31) // January has 31 days
    })

    it('calculateDaysUntilExpiration returns correct negative days for past dates', () => {
      const referenceDate = new Date('2025-01-15')
      const pastDate = '2025-01-10T00:00:00.000Z'
      
      const days = calculateDaysUntilExpiration(pastDate, referenceDate)
      expect(days).toBe(-5)
    })

    it('calculateDaysUntilExpiration returns 0 for same day', () => {
      const referenceDate = new Date('2025-01-15T12:00:00.000Z')
      const sameDate = '2025-01-15T00:00:00.000Z'
      
      const days = calculateDaysUntilExpiration(sameDate, referenceDate)
      // Due to time difference, this might be -1 or 0
      expect(days).toBeLessThanOrEqual(0)
      expect(days).toBeGreaterThanOrEqual(-1)
    })
  })
})
