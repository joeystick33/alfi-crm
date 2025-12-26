/**
 * Property-Based Tests - Document Expiration Calculation
 * 
 * **Feature: compliance-refonte, Property 1: Document Expiration Calculation**
 * **Validates: Requirements 2.6**
 * 
 * Tests that document expiration dates are calculated correctly based on document type:
 * - PIECE_IDENTITE: 10 years (3650 days)
 * - JUSTIFICATIF_DOMICILE: 3 months (90 days)
 * - RIB: No expiration (null)
 * - AVIS_IMPOSITION: 1 year (365 days)
 * - JUSTIFICATIF_PATRIMOINE: 1 year (365 days)
 * - ORIGINE_FONDS: No expiration (null)
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  calculateDocumentExpiration,
  DOCUMENT_EXPIRATION_RULES,
  KYC_DOCUMENT_TYPES,
  type KYCDocumentType,
} from '@/lib/compliance/types'

// ============================================================================
// GENERATORS
// ============================================================================

/**
 * Generator for KYC document types
 */
const kycDocumentTypeArb = fc.constantFrom(...KYC_DOCUMENT_TYPES)

/**
 * Generator for document types that expire
 */
const expiringDocumentTypeArb = fc.constantFrom(
  'PIECE_IDENTITE',
  'JUSTIFICATIF_DOMICILE',
  'AVIS_IMPOSITION',
  'JUSTIFICATIF_PATRIMOINE'
) as fc.Arbitrary<KYCDocumentType>

/**
 * Generator for document types that don't expire
 */
const nonExpiringDocumentTypeArb = fc.constantFrom(
  'RIB',
  'ORIGINE_FONDS'
) as fc.Arbitrary<KYCDocumentType>

/**
 * Generator for valid upload dates (within reasonable range)
 * Uses integer timestamps to avoid NaN date issues
 */
const uploadDateArb = fc.integer({
  min: new Date('2020-01-01').getTime(),
  max: new Date('2030-12-31').getTime(),
}).map(timestamp => new Date(timestamp))

// ============================================================================
// PROPERTY TESTS
// ============================================================================

describe('Compliance Document Expiration - Property-Based Tests', () => {
  /**
   * **Feature: compliance-refonte, Property 1: Document Expiration Calculation**
   * **Validates: Requirements 2.6**
   * 
   * For any KYC document type and upload date:
   * - Documents with expiration rules SHALL have expiration date = upload date + expiration days
   * - Documents without expiration (RIB, ORIGINE_FONDS) SHALL return null
   */
  describe('Property 1: Document Expiration Calculation', () => {
    it('for any expiring document type, expiration date equals upload date plus expiration days', () => {
      fc.assert(
        fc.property(expiringDocumentTypeArb, uploadDateArb, (documentType, uploadDate) => {
          const expirationDate = calculateDocumentExpiration(documentType, uploadDate)
          const expectedDays = DOCUMENT_EXPIRATION_RULES[documentType]
          
          // Expiration date should not be null for expiring documents
          expect(expirationDate).not.toBeNull()
          
          if (expirationDate) {
            // Calculate the difference in days
            const diffMs = expirationDate.getTime() - uploadDate.getTime()
            const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
            
            expect(diffDays).toBe(expectedDays)
          }
        }),
        { numRuns: 100 }
      )
    })

    it('for any non-expiring document type (RIB, ORIGINE_FONDS), expiration date is null', () => {
      fc.assert(
        fc.property(nonExpiringDocumentTypeArb, uploadDateArb, (documentType, uploadDate) => {
          const expirationDate = calculateDocumentExpiration(documentType, uploadDate)
          
          // Non-expiring documents should return null
          expect(expirationDate).toBeNull()
        }),
        { numRuns: 100 }
      )
    })

    it('expiration date is always after upload date for expiring documents', () => {
      fc.assert(
        fc.property(expiringDocumentTypeArb, uploadDateArb, (documentType, uploadDate) => {
          const expirationDate = calculateDocumentExpiration(documentType, uploadDate)
          
          if (expirationDate) {
            expect(expirationDate.getTime()).toBeGreaterThan(uploadDate.getTime())
          }
        }),
        { numRuns: 100 }
      )
    })

    it('PIECE_IDENTITE expires in exactly 3650 days (10 years)', () => {
      fc.assert(
        fc.property(uploadDateArb, (uploadDate) => {
          const expirationDate = calculateDocumentExpiration('PIECE_IDENTITE', uploadDate)
          
          expect(expirationDate).not.toBeNull()
          if (expirationDate) {
            const diffMs = expirationDate.getTime() - uploadDate.getTime()
            const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
            expect(diffDays).toBe(3650)
          }
        }),
        { numRuns: 100 }
      )
    })

    it('JUSTIFICATIF_DOMICILE expires in exactly 90 days (3 months)', () => {
      fc.assert(
        fc.property(uploadDateArb, (uploadDate) => {
          const expirationDate = calculateDocumentExpiration('JUSTIFICATIF_DOMICILE', uploadDate)
          
          expect(expirationDate).not.toBeNull()
          if (expirationDate) {
            const diffMs = expirationDate.getTime() - uploadDate.getTime()
            const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
            expect(diffDays).toBe(90)
          }
        }),
        { numRuns: 100 }
      )
    })

    it('AVIS_IMPOSITION expires in exactly 365 days (1 year)', () => {
      fc.assert(
        fc.property(uploadDateArb, (uploadDate) => {
          const expirationDate = calculateDocumentExpiration('AVIS_IMPOSITION', uploadDate)
          
          expect(expirationDate).not.toBeNull()
          if (expirationDate) {
            const diffMs = expirationDate.getTime() - uploadDate.getTime()
            const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
            expect(diffDays).toBe(365)
          }
        }),
        { numRuns: 100 }
      )
    })

    it('JUSTIFICATIF_PATRIMOINE expires in exactly 365 days (1 year)', () => {
      fc.assert(
        fc.property(uploadDateArb, (uploadDate) => {
          const expirationDate = calculateDocumentExpiration('JUSTIFICATIF_PATRIMOINE', uploadDate)
          
          expect(expirationDate).not.toBeNull()
          if (expirationDate) {
            const diffMs = expirationDate.getTime() - uploadDate.getTime()
            const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
            expect(diffDays).toBe(365)
          }
        }),
        { numRuns: 100 }
      )
    })

    it('expiration calculation is deterministic (same inputs produce same output)', () => {
      fc.assert(
        fc.property(kycDocumentTypeArb, uploadDateArb, (documentType, uploadDate) => {
          const result1 = calculateDocumentExpiration(documentType, uploadDate)
          const result2 = calculateDocumentExpiration(documentType, uploadDate)
          
          if (result1 === null) {
            expect(result2).toBeNull()
          } else {
            expect(result2).not.toBeNull()
            expect(result1.getTime()).toBe(result2!.getTime())
          }
        }),
        { numRuns: 100 }
      )
    })

    it('expiration rules constant matches expected values from requirements', () => {
      // Verify the expiration rules match the requirements
      expect(DOCUMENT_EXPIRATION_RULES.PIECE_IDENTITE).toBe(3650)        // 10 years
      expect(DOCUMENT_EXPIRATION_RULES.JUSTIFICATIF_DOMICILE).toBe(90)   // 3 months
      expect(DOCUMENT_EXPIRATION_RULES.RIB).toBe(0)                       // No expiration
      expect(DOCUMENT_EXPIRATION_RULES.AVIS_IMPOSITION).toBe(365)        // 1 year
      expect(DOCUMENT_EXPIRATION_RULES.JUSTIFICATIF_PATRIMOINE).toBe(365) // 1 year
      expect(DOCUMENT_EXPIRATION_RULES.ORIGINE_FONDS).toBe(0)            // No expiration
    })
  })
})
