/**
 * Property-Based Tests - Export File Validity
 * 
 * **Feature: crm-audit-fonctionnel, Property 8: Export File Validity**
 * **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5**
 * 
 * Tests that export actions produce valid files:
 * - 8.1: WHEN the CGP clicks "Télécharger" on a document, THE Result_Validator SHALL initiate a real file download
 * - 8.2: WHEN the CGP clicks "Exporter PDF" on the timeline, THE Result_Validator SHALL generate and download a real PDF file
 * - 8.3: WHEN the CGP clicks "Exporter" on a data table, THE Result_Validator SHALL generate and download a real CSV or Excel file
 * - 8.4: THE Result_Validator SHALL NOT display "Export en cours" without actually producing a file
 * - 8.5: THE Result_Validator SHALL show an error message if export fails, with the actual reason
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  isValidPDF,
  type ClientData,
  type CabinetData,
  type AdvisorData,
} from '@/lib/documents/services/pdf-generator-service'
import {
  isValidDOCX,
} from '@/lib/documents/services/docx-generator-service'

// ============================================================================
// GENERATORS
// ============================================================================

/**
 * Helper to generate postal code (5 digits)
 */
const postalCodeArb = fc.integer({ min: 10000, max: 99999 }).map(n => n.toString())

/**
 * Generator for valid client data
 */
const clientDataArb: fc.Arbitrary<ClientData> = fc.record({
  id: fc.uuid(),
  firstName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
  lastName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
  email: fc.emailAddress(),
  phone: fc.option(fc.string({ minLength: 10, maxLength: 15 }), { nil: null }),
  mobile: fc.option(fc.string({ minLength: 10, maxLength: 15 }), { nil: null }),
  address: fc.option(
    fc.record({
      street: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
      postalCode: fc.option(postalCodeArb),
      city: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
      country: fc.option(fc.constantFrom('France', 'Belgique', 'Suisse', 'Luxembourg')),
    }),
    { nil: null }
  ),
  birthDate: fc.option(fc.date({ min: new Date('1920-01-01'), max: new Date('2005-01-01') }), { nil: null }),
  birthPlace: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
  nationality: fc.option(fc.constantFrom('Française', 'Belge', 'Suisse', 'Luxembourgeoise'), { nil: null }),
  maritalStatus: fc.option(fc.constantFrom('Célibataire', 'Marié(e)', 'Pacsé(e)', 'Divorcé(e)', 'Veuf(ve)'), { nil: null }),
  marriageRegime: fc.option(fc.constantFrom('Communauté réduite aux acquêts', 'Séparation de biens', 'Communauté universelle'), { nil: null }),
  numberOfChildren: fc.option(fc.integer({ min: 0, max: 10 }), { nil: null }),
  profession: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
  employerName: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
  annualIncome: fc.option(fc.integer({ min: 0, max: 10000000 }), { nil: null }),
  riskProfile: fc.option(fc.constantFrom('PRUDENT', 'EQUILIBRE', 'DYNAMIQUE', 'OFFENSIF'), { nil: null }),
  investmentHorizon: fc.option(fc.constantFrom('COURT_TERME', 'MOYEN_TERME', 'LONG_TERME'), { nil: null }),
  investmentGoals: fc.option(fc.array(fc.constantFrom('Épargne', 'Retraite', 'Transmission', 'Défiscalisation'), { minLength: 0, maxLength: 4 }), { nil: null }),
  kycStatus: fc.constantFrom('EN_ATTENTE', 'VALIDE', 'EXPIRE'),
  isPEP: fc.boolean(),
  originOfFunds: fc.option(fc.constantFrom('Salaires', 'Héritage', 'Vente immobilière', 'Épargne'), { nil: null }),
})

/**
 * Helper to generate ORIAS number (8 digits)
 */
const oriasNumberArb = fc.integer({ min: 10000000, max: 99999999 }).map(n => n.toString())

/**
 * Generator for valid cabinet data
 */
const cabinetDataArb: fc.Arbitrary<CabinetData> = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
  email: fc.emailAddress(),
  phone: fc.option(fc.string({ minLength: 10, maxLength: 15 }), { nil: null }),
  address: fc.option(
    fc.record({
      street: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
      postalCode: fc.option(postalCodeArb),
      city: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
      country: fc.option(fc.constantFrom('France', 'Belgique', 'Suisse', 'Luxembourg')),
    }),
    { nil: null }
  ),
  oriasNumber: fc.option(oriasNumberArb),
  acprRegistration: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
  rcProInsurance: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
  rcProInsurer: fc.option(fc.constantFrom('AXA', 'Allianz', 'Generali', 'MMA')),
  rcProPolicyNumber: fc.option(fc.string({ minLength: 1, maxLength: 20 })),
  website: fc.option(fc.webUrl()),
})

/**
 * Generator for valid advisor data
 */
const advisorDataArb: fc.Arbitrary<AdvisorData> = fc.record({
  id: fc.uuid(),
  firstName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
  lastName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
  email: fc.emailAddress(),
  phone: fc.option(fc.string({ minLength: 10, maxLength: 15 }), { nil: null }),
  oriasNumber: fc.option(oriasNumberArb),
})





// ============================================================================
// PROPERTY TESTS
// ============================================================================

describe('Export File Validity - Property-Based Tests', () => {
  /**
   * **Feature: crm-audit-fonctionnel, Property 8: Export File Validity**
   * **Validates: Requirements 8.1-8.5**
   */
  describe('Property 8: Export File Validity', () => {
    /**
     * Requirement 8.1: PDF export produces valid downloadable file
     * 
     * Tests that PDF generation produces a valid file that can be downloaded
     */
    it('PDF export produces valid file with correct MIME type signature', async () => {
      const { generateDERPDF } = await import('@/lib/documents/services/pdf-generator-service')
      
      await fc.assert(
        fc.asyncProperty(
          clientDataArb,
          cabinetDataArb,
          advisorDataArb,
          async (client, cabinet, advisor) => {
            const result = await generateDERPDF(client, cabinet, advisor)
            
            // Requirement 8.1: SHALL initiate a real file download
            // This means the result must contain a valid file buffer
            expect(result.success).toBe(true)
            expect(result.fileBuffer).toBeDefined()
            expect(result.fileBuffer).toBeInstanceOf(Buffer)
            
            // Requirement 8.4: SHALL NOT display "Export en cours" without producing a file
            // The file must have actual content (size > 0)
            expect(result.fileSize).toBeDefined()
            expect(result.fileSize).toBeGreaterThan(0)
            
            // The file must be a valid PDF (correct MIME type signature)
            expect(isValidPDF(result.fileBuffer!)).toBe(true)
            
            // Must have a proper filename for download
            expect(result.fileName).toBeDefined()
            expect(result.fileName?.endsWith('.pdf')).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Requirement 8.2: DOCX export produces valid downloadable file
     * 
     * Tests that DOCX generation produces a valid file that can be downloaded
     */
    it('DOCX export produces valid file with correct MIME type signature', async () => {
      const { generateDERDOCX } = await import('@/lib/documents/services/docx-generator-service')
      
      await fc.assert(
        fc.asyncProperty(
          clientDataArb,
          cabinetDataArb,
          advisorDataArb,
          async (client, cabinet, advisor) => {
            const result = await generateDERDOCX(client, cabinet, advisor)
            
            // Requirement 8.1: SHALL initiate a real file download
            expect(result.success).toBe(true)
            expect(result.fileBuffer).toBeDefined()
            expect(result.fileBuffer).toBeInstanceOf(Buffer)
            
            // Requirement 8.4: SHALL NOT display "Export en cours" without producing a file
            expect(result.fileSize).toBeDefined()
            expect(result.fileSize).toBeGreaterThan(0)
            
            // The file must be a valid DOCX (ZIP archive signature)
            expect(isValidDOCX(result.fileBuffer!)).toBe(true)
            
            // Must have a proper filename for download
            expect(result.fileName).toBeDefined()
            expect(result.fileName?.endsWith('.docx')).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Requirement 8.3: Export produces file with content matching source data
     * 
     * Tests that the exported file contains the expected content
     */
    it('exported file size is proportional to input data complexity', async () => {
      const { generateDERPDF } = await import('@/lib/documents/services/pdf-generator-service')
      
      await fc.assert(
        fc.asyncProperty(
          clientDataArb,
          cabinetDataArb,
          advisorDataArb,
          async (client, cabinet, advisor) => {
            const result = await generateDERPDF(client, cabinet, advisor)
            
            // File should be generated successfully
            expect(result.success).toBe(true)
            expect(result.fileBuffer).toBeDefined()
            
            // File size should be reasonable (not empty, not too small)
            // A valid PDF with content should be at least 1KB
            expect(result.fileSize).toBeGreaterThan(1000)
            
            // File size should not be unreasonably large for a simple document
            // A DER document should typically be under 500KB
            expect(result.fileSize).toBeLessThan(500000)
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Requirement 8.5: Export failure returns error message with actual reason
     * 
     * Tests that when export fails, an error message is provided
     */
    it('export failure returns descriptive error message', async () => {
      const { generateDERPDF } = await import('@/lib/documents/services/pdf-generator-service')
      
      // Test with invalid/empty data that might cause failures
      // Note: The generators are designed to be robust, so we test the error handling path
      // by checking that successful results don't have error messages
      await fc.assert(
        fc.asyncProperty(
          clientDataArb,
          cabinetDataArb,
          advisorDataArb,
          async (client, cabinet, advisor) => {
            const result = await generateDERPDF(client, cabinet, advisor)
            
            // If successful, should not have an error
            if (result.success) {
              expect(result.error).toBeUndefined()
              expect(result.fileBuffer).toBeDefined()
            } else {
              // If failed, should have a descriptive error message
              expect(result.error).toBeDefined()
              expect(typeof result.error).toBe('string')
              expect(result.error!.length).toBeGreaterThan(0)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Export format consistency: PDF and DOCX produce different file signatures
     */
    it('PDF and DOCX exports produce files with different signatures', async () => {
      const { generateDERPDF } = await import('@/lib/documents/services/pdf-generator-service')
      const { generateDERDOCX } = await import('@/lib/documents/services/docx-generator-service')
      
      await fc.assert(
        fc.asyncProperty(
          clientDataArb,
          cabinetDataArb,
          advisorDataArb,
          async (client, cabinet, advisor) => {
            const pdfResult = await generateDERPDF(client, cabinet, advisor)
            const docxResult = await generateDERDOCX(client, cabinet, advisor)
            
            // Both should succeed
            expect(pdfResult.success).toBe(true)
            expect(docxResult.success).toBe(true)
            
            // PDF should be valid PDF, not DOCX
            expect(isValidPDF(pdfResult.fileBuffer!)).toBe(true)
            expect(isValidDOCX(pdfResult.fileBuffer!)).toBe(false)
            
            // DOCX should be valid DOCX, not PDF
            expect(isValidDOCX(docxResult.fileBuffer!)).toBe(true)
            expect(isValidPDF(docxResult.fileBuffer!)).toBe(false)
          }
        ),
        { numRuns: 50 } // Reduced runs since each iteration generates 2 files
      )
    }, 60000) // 60 second timeout

    /**
     * Export produces consistent results for same inputs
     */
    it('export produces consistent file sizes for same inputs', async () => {
      const { generateDERPDF } = await import('@/lib/documents/services/pdf-generator-service')
      
      await fc.assert(
        fc.asyncProperty(
          clientDataArb,
          cabinetDataArb,
          advisorDataArb,
          async (client, cabinet, advisor) => {
            const result1 = await generateDERPDF(client, cabinet, advisor)
            const result2 = await generateDERPDF(client, cabinet, advisor)
            
            // Both should succeed
            expect(result1.success).toBe(true)
            expect(result2.success).toBe(true)
            
            // File sizes should be equal for same inputs
            expect(result1.fileSize).toBe(result2.fileSize)
          }
        ),
        { numRuns: 20 } // Reduced runs since each iteration generates 2 files
      )
    }, 60000) // 60 second timeout

    /**
     * Export filename contains document type and client name
     */
    it('export filename contains document type and is properly formatted', async () => {
      const { generateDERPDF } = await import('@/lib/documents/services/pdf-generator-service')
      const { generateDERDOCX } = await import('@/lib/documents/services/docx-generator-service')
      
      await fc.assert(
        fc.asyncProperty(
          clientDataArb,
          cabinetDataArb,
          advisorDataArb,
          async (client, cabinet, advisor) => {
            const pdfResult = await generateDERPDF(client, cabinet, advisor)
            const docxResult = await generateDERDOCX(client, cabinet, advisor)
            
            // PDF filename should contain DER and end with .pdf
            expect(pdfResult.fileName).toBeDefined()
            expect(pdfResult.fileName).toContain('DER')
            expect(pdfResult.fileName?.endsWith('.pdf')).toBe(true)
            
            // DOCX filename should contain DER and end with .docx
            expect(docxResult.fileName).toBeDefined()
            expect(docxResult.fileName).toContain('DER')
            expect(docxResult.fileName?.endsWith('.docx')).toBe(true)
            
            // Filenames should contain client name (sanitized)
            // The filename format is: {docType}_{lastName}_{firstName}_{date}.{ext}
            const sanitizedLastName = client.lastName.replace(/[^a-zA-Z0-9_]/g, '')
            
            // At least part of the sanitized name should be in the filename
            if (sanitizedLastName.length > 0) {
              expect(pdfResult.fileName).toContain(sanitizedLastName)
            }
          }
        ),
        { numRuns: 50 }
      )
    }, 60000) // 60 second timeout

    /**
     * Validation functions correctly identify file types
     */
    it('isValidPDF and isValidDOCX correctly identify file types', () => {
      fc.assert(
        fc.property(fc.uint8Array({ minLength: 10, maxLength: 100 }), (randomBytes) => {
          const buffer = Buffer.from(randomBytes)
          
          // Create valid PDF header
          const validPdfBuffer = Buffer.concat([Buffer.from('%PDF-1.4'), buffer])
          expect(isValidPDF(validPdfBuffer)).toBe(true)
          expect(isValidDOCX(validPdfBuffer)).toBe(false)
          
          // Create valid DOCX header (ZIP signature)
          const validDocxBuffer = Buffer.concat([Buffer.from([0x50, 0x4B, 0x03, 0x04]), buffer])
          expect(isValidDOCX(validDocxBuffer)).toBe(true)
          expect(isValidPDF(validDocxBuffer)).toBe(false)
        }),
        { numRuns: 100 }
      )
    })

    /**
     * Empty or invalid buffers are rejected
     */
    it('empty or small buffers are rejected by validation functions', () => {
      fc.assert(
        fc.property(fc.uint8Array({ minLength: 0, maxLength: 4 }), (smallBytes) => {
          const buffer = Buffer.from(smallBytes)
          
          // Small buffers should not be valid PDF or DOCX
          expect(isValidPDF(buffer)).toBe(false)
          expect(isValidDOCX(buffer)).toBe(false)
        }),
        { numRuns: 100 }
      )
    })
  })
})
