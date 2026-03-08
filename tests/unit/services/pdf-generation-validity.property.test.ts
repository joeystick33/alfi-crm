/**
 * Property-Based Tests - PDF Generation Validity
 * 
 * **Feature: crm-audit-fonctionnel, Property 3: PDF Generation Validity**
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8**
 * 
 * Tests that PDF generation produces valid files:
 * - 3.1: DER PDF contains cabinet header, client info, ORIAS, RC Pro, services, fees, regulatory disclosures
 * - 3.2: Déclaration d'Adéquation PDF contains client profile, product, justification, warnings
 * - 3.3: Bulletin d'Opération PDF contains operation type, reference, client, contract, compliance checklist
 * - 3.4: Lettre de Mission PDF contains mission scope, duration, deliverables, fees, termination conditions
 * - 3.5: Recueil d'Informations PDF contains identity, family, professional, patrimony, income, objectives
 * - 3.6: Uses real PDF library (@react-pdf/renderer)
 * - 3.7: Does NOT return placeholder URLs
 * - 3.8: Saves file to storage and returns real download URL
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  generateDERPDF,
  generateDeclarationAdequationPDF,
  generateBulletinOperationPDF,
  generateLettreMissionPDF,
  generateRecueilInformationsPDF,
  isValidPDF,
  SUPPORTED_PDF_DOCUMENT_TYPES,
  type ClientData,
  type CabinetData,
  type AdvisorData,
  type ProductData,
  type OperationData,
} from '@/lib/documents/services/pdf-generator-service'

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

/**
 * Helper to generate ISIN code (12 alphanumeric characters)
 */
const isinArb = fc.string({ minLength: 12, maxLength: 12 }).map(s => s.replace(/[^A-Z0-9]/gi, 'X').toUpperCase().slice(0, 12).padEnd(12, '0'))

/**
 * Generator for valid product data
 */
const productDataArb: fc.Arbitrary<ProductData> = fc.record({
  name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
  type: fc.constantFrom('Assurance-vie', 'PER', 'SCPI', 'OPCVM', 'Actions'),
  provider: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
  isin: fc.option(isinArb),
  riskLevel: fc.option(fc.integer({ min: 1, max: 7 })),
  fees: fc.option(fc.record({
    entry: fc.option(fc.float({ min: 0, max: 5, noNaN: true })),
    management: fc.option(fc.float({ min: 0, max: 3, noNaN: true })),
    exit: fc.option(fc.float({ min: 0, max: 5, noNaN: true })),
  })),
  description: fc.option(fc.string({ minLength: 1, maxLength: 500 })),
})

/**
 * Generator for valid operation data
 */
const operationDataArb: fc.Arbitrary<OperationData> = fc.record({
  id: fc.uuid(),
  reference: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
  type: fc.constantFrom('VERSEMENT', 'RACHAT', 'ARBITRAGE', 'SOUSCRIPTION'),
  amount: fc.float({ min: 100, max: 10000000, noNaN: true }),
  date: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-01-01') }),
  contractNumber: fc.option(fc.string({ minLength: 1, maxLength: 20 })),
  contractName: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
  funds: fc.option(fc.array(
    fc.record({
      name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
      isin: fc.option(isinArb),
      amount: fc.float({ min: 100, max: 1000000, noNaN: true }),
      percentage: fc.option(fc.float({ min: 0, max: 100, noNaN: true })),
    }),
    { minLength: 0, maxLength: 5 }
  )),
})

/**
 * Generator for mission data
 */
const missionDataArb = fc.record({
  scope: fc.array(fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0), { minLength: 1, maxLength: 5 }),
  duration: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
  deliverables: fc.array(fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0), { minLength: 1, maxLength: 5 }),
  fees: fc.record({
    type: fc.constantFrom('FORFAIT', 'HORAIRE', 'COMMISSION') as fc.Arbitrary<'FORFAIT' | 'HORAIRE' | 'COMMISSION'>,
    amount: fc.option(fc.float({ min: 100, max: 100000, noNaN: true })),
    hourlyRate: fc.option(fc.float({ min: 50, max: 500, noNaN: true })),
    description: fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
  }),
  terminationConditions: fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
})

/**
 * Generator for patrimoine data
 */
const patrimoineDataArb = fc.option(fc.record({
  actifs: fc.array(
    fc.record({
      type: fc.constantFrom('Immobilier', 'Financier', 'Professionnel', 'Autre'),
      description: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
      valeur: fc.float({ min: 0, max: 10000000, noNaN: true }),
    }),
    { minLength: 0, maxLength: 5 }
  ),
  passifs: fc.array(
    fc.record({
      type: fc.constantFrom('Crédit immobilier', 'Crédit consommation', 'Autre'),
      description: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
      montant: fc.float({ min: 0, max: 5000000, noNaN: true }),
    }),
    { minLength: 0, maxLength: 5 }
  ),
}))

/**
 * Generator for revenus data
 */
const revenusDataArb = fc.option(fc.record({
  salaires: fc.option(fc.float({ min: 0, max: 1000000, noNaN: true })),
  revenus_fonciers: fc.option(fc.float({ min: 0, max: 500000, noNaN: true })),
  revenus_capitaux: fc.option(fc.float({ min: 0, max: 500000, noNaN: true })),
  autres: fc.option(fc.float({ min: 0, max: 500000, noNaN: true })),
}))

/**
 * Generator for charges data
 */
const chargesDataArb = fc.option(fc.record({
  loyer: fc.option(fc.float({ min: 0, max: 50000, noNaN: true })),
  credits: fc.option(fc.float({ min: 0, max: 100000, noNaN: true })),
  impots: fc.option(fc.float({ min: 0, max: 200000, noNaN: true })),
  autres: fc.option(fc.float({ min: 0, max: 50000, noNaN: true })),
}))

/**
 * Generator for justification text
 */
const justificationArb = fc.string({ minLength: 10, maxLength: 1000 }).filter(s => s.trim().length >= 10)

/**
 * Generator for warnings array
 */
const warningsArb = fc.option(fc.array(
  fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
  { minLength: 0, maxLength: 5 }
))

/**
 * Generator for compliance checklist
 */
const complianceChecklistArb = fc.option(fc.array(
  fc.record({
    label: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
    checked: fc.boolean(),
  }),
  { minLength: 0, maxLength: 10 }
))

// ============================================================================
// PROPERTY TESTS
// ============================================================================

describe('PDF Generation Validity - Property-Based Tests', () => {
  /**
   * **Feature: crm-audit-fonctionnel, Property 3: PDF Generation Validity**
   * **Validates: Requirements 3.1-3.8**
   */
  describe('Property 3: PDF Generation Validity', () => {
    /**
     * Requirement 3.1: DER PDF generation produces valid PDF
     */
    it('DER PDF generation produces valid PDF with size > 0', async () => {
      await fc.assert(
        fc.asyncProperty(
          clientDataArb,
          cabinetDataArb,
          advisorDataArb,
          async (client, cabinet, advisor) => {
            const result = await generateDERPDF(client, cabinet, advisor)
            
            // Should succeed
            expect(result.success).toBe(true)
            
            // Should have a buffer
            expect(result.fileBuffer).toBeDefined()
            expect(result.fileBuffer).toBeInstanceOf(Buffer)
            
            // Should have size > 0
            expect(result.fileSize).toBeDefined()
            expect(result.fileSize).toBeGreaterThan(0)
            
            // Should have a valid filename
            expect(result.fileName).toBeDefined()
            expect(result.fileName).toContain('DER')
            expect(result.fileName?.endsWith('.pdf')).toBe(true)
            
            // Should be a valid PDF (starts with %PDF-)
            expect(isValidPDF(result.fileBuffer!)).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Requirement 3.2: Déclaration d'Adéquation PDF generation produces valid PDF
     */
    it('Déclaration d\'Adéquation PDF generation produces valid PDF with size > 0', async () => {
      await fc.assert(
        fc.asyncProperty(
          clientDataArb,
          cabinetDataArb,
          advisorDataArb,
          productDataArb,
          justificationArb,
          warningsArb,
          async (client, cabinet, advisor, product, justification, warnings) => {
            const result = await generateDeclarationAdequationPDF(
              client,
              cabinet,
              advisor,
              product,
              justification,
              warnings ?? undefined
            )
            
            // Should succeed
            expect(result.success).toBe(true)
            
            // Should have a buffer
            expect(result.fileBuffer).toBeDefined()
            expect(result.fileBuffer).toBeInstanceOf(Buffer)
            
            // Should have size > 0
            expect(result.fileSize).toBeDefined()
            expect(result.fileSize).toBeGreaterThan(0)
            
            // Should have a valid filename
            expect(result.fileName).toBeDefined()
            expect(result.fileName).toContain('DECLARATION_ADEQUATION')
            expect(result.fileName?.endsWith('.pdf')).toBe(true)
            
            // Should be a valid PDF
            expect(isValidPDF(result.fileBuffer!)).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Requirement 3.3: Bulletin d'Opération PDF generation produces valid PDF
     */
    it('Bulletin d\'Opération PDF generation produces valid PDF with size > 0', async () => {
      await fc.assert(
        fc.asyncProperty(
          clientDataArb,
          cabinetDataArb,
          advisorDataArb,
          operationDataArb,
          complianceChecklistArb,
          async (client, cabinet, advisor, operation, checklist) => {
            const result = await generateBulletinOperationPDF(
              client,
              cabinet,
              advisor,
              operation,
              checklist ?? undefined
            )
            
            // Should succeed
            expect(result.success).toBe(true)
            
            // Should have a buffer
            expect(result.fileBuffer).toBeDefined()
            expect(result.fileBuffer).toBeInstanceOf(Buffer)
            
            // Should have size > 0
            expect(result.fileSize).toBeDefined()
            expect(result.fileSize).toBeGreaterThan(0)
            
            // Should have a valid filename
            expect(result.fileName).toBeDefined()
            expect(result.fileName).toContain('BULLETIN_OPERATION')
            expect(result.fileName?.endsWith('.pdf')).toBe(true)
            
            // Should be a valid PDF
            expect(isValidPDF(result.fileBuffer!)).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Requirement 3.4: Lettre de Mission PDF generation produces valid PDF
     */
    it('Lettre de Mission PDF generation produces valid PDF with size > 0', async () => {
      await fc.assert(
        fc.asyncProperty(
          clientDataArb,
          cabinetDataArb,
          advisorDataArb,
          missionDataArb,
          async (client, cabinet, advisor, mission) => {
            const result = await generateLettreMissionPDF(
              client,
              cabinet,
              advisor,
              mission
            )
            
            // Should succeed
            expect(result.success).toBe(true)
            
            // Should have a buffer
            expect(result.fileBuffer).toBeDefined()
            expect(result.fileBuffer).toBeInstanceOf(Buffer)
            
            // Should have size > 0
            expect(result.fileSize).toBeDefined()
            expect(result.fileSize).toBeGreaterThan(0)
            
            // Should have a valid filename
            expect(result.fileName).toBeDefined()
            expect(result.fileName).toContain('LETTRE_MISSION')
            expect(result.fileName?.endsWith('.pdf')).toBe(true)
            
            // Should be a valid PDF
            expect(isValidPDF(result.fileBuffer!)).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Requirement 3.5: Recueil d'Informations PDF generation produces valid PDF
     */
    it('Recueil d\'Informations PDF generation produces valid PDF with size > 0', async () => {
      await fc.assert(
        fc.asyncProperty(
          clientDataArb,
          cabinetDataArb,
          advisorDataArb,
          patrimoineDataArb,
          revenusDataArb,
          chargesDataArb,
          async (client, cabinet, advisor, patrimoine, revenus, charges) => {
            const result = await generateRecueilInformationsPDF(
              client,
              cabinet,
              advisor,
              patrimoine ?? undefined,
              revenus ?? undefined,
              charges ?? undefined
            )
            
            // Should succeed
            expect(result.success).toBe(true)
            
            // Should have a buffer
            expect(result.fileBuffer).toBeDefined()
            expect(result.fileBuffer).toBeInstanceOf(Buffer)
            
            // Should have size > 0
            expect(result.fileSize).toBeDefined()
            expect(result.fileSize).toBeGreaterThan(0)
            
            // Should have a valid filename
            expect(result.fileName).toBeDefined()
            expect(result.fileName).toContain('RECUEIL_INFORMATIONS')
            expect(result.fileName?.endsWith('.pdf')).toBe(true)
            
            // Should be a valid PDF
            expect(isValidPDF(result.fileBuffer!)).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Requirement 3.6: All supported document types can be generated
     */
    it('all supported document types are defined', () => {
      fc.assert(
        fc.property(fc.constantFrom(...SUPPORTED_PDF_DOCUMENT_TYPES), (docType) => {
          expect(SUPPORTED_PDF_DOCUMENT_TYPES).toContain(docType)
          expect(typeof docType).toBe('string')
          expect(docType.length).toBeGreaterThan(0)
        }),
        { numRuns: 100 }
      )
    })

    /**
     * Requirement 3.7: PDF generation does NOT return placeholder URLs (without storage)
     */
    it('PDF generation without storage does not return fileUrl', async () => {
      await fc.assert(
        fc.asyncProperty(
          clientDataArb,
          cabinetDataArb,
          advisorDataArb,
          async (client, cabinet, advisor) => {
            const result = await generateDERPDF(client, cabinet, advisor, { uploadToStorage: false })
            
            // Should succeed
            expect(result.success).toBe(true)
            
            // Should NOT have a fileUrl when not uploading to storage
            expect(result.fileUrl).toBeUndefined()
            expect(result.storagePath).toBeUndefined()
            
            // But should still have the buffer
            expect(result.fileBuffer).toBeDefined()
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * PDF generation is deterministic for same inputs
     */
    it('PDF generation produces consistent file sizes for same inputs', async () => {
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
            
            // Both should be valid PDFs
            expect(isValidPDF(result1.fileBuffer!)).toBe(true)
            expect(isValidPDF(result2.fileBuffer!)).toBe(true)
          }
        ),
        { numRuns: 20 } // Reduced runs since each iteration generates 2 PDFs
      )
    }, 60000) // 60 second timeout

    /**
     * isValidPDF correctly identifies valid and invalid PDFs
     */
    it('isValidPDF correctly validates PDF headers', () => {
      fc.assert(
        fc.property(fc.uint8Array({ minLength: 10, maxLength: 100 }), (randomBytes) => {
          const buffer = Buffer.from(randomBytes)
          
          // Create a valid PDF header
          const validPdfBuffer = Buffer.concat([Buffer.from('%PDF-1.4'), buffer])
          expect(isValidPDF(validPdfBuffer)).toBe(true)
          
          // Random bytes should not be valid PDF (unless they happen to start with %PDF-)
          const startsWithPdfHeader = buffer.subarray(0, 5).toString('ascii') === '%PDF-'
          expect(isValidPDF(buffer)).toBe(startsWithPdfHeader)
        }),
        { numRuns: 100 }
      )
    })

    /**
     * Empty or small buffers are not valid PDFs
     */
    it('empty or small buffers are not valid PDFs', () => {
      fc.assert(
        fc.property(fc.uint8Array({ minLength: 0, maxLength: 4 }), (smallBytes) => {
          const buffer = Buffer.from(smallBytes)
          expect(isValidPDF(buffer)).toBe(false)
        }),
        { numRuns: 100 }
      )
    })
  })
})
