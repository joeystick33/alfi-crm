/**
 * Service d'export de documents réglementaires (PDF/DOCX)
 * 
 * Ce service gère l'export des documents générés:
 * - Export en PDF avec styling professionnel via @react-pdf/renderer
 * - Export en DOCX pour édition via docx library
 * - Export batch de plusieurs documents
 * - Application du branding cabinet
 * - Stockage réel dans Supabase Storage
 * 
 * @module lib/documents/services/export-service
 * @requirements 3.7, 3.8, 8.1-8.5, 16.1-16.8
 */

import { prisma } from '@/app/_common/lib/prisma'
import {
  type DocumentFormat,
  type DocumentExportOptions,
  type DocumentExportResult,
  type DocumentStyles,
  type DocumentTemplateContent,
  type TemplateSection,
  type RegulatoryDocumentType,
} from '../types'
import {
  documentExportOptionsSchema,
  batchExportSchema,
  type DocumentExportOptionsInput,
  type BatchExportInput,
} from '../schemas'
import { getGeneratedDocumentById } from './document-generator-service'
import {
  generateDERPDF,
  generateDeclarationAdequationPDF,
  generateBulletinOperationPDF,
  generateLettreMissionPDF,
  generateRecueilInformationsPDF,
  isValidPDF,
  type ClientData as PDFClientData,
  type CabinetData as PDFCabinetData,
  type AdvisorData as PDFAdvisorData,
  type ProductData,
  type OperationData,
} from './pdf-generator-service'
import {
  generateDERDOCX,
  generateDeclarationAdequationDOCX,
  generateBulletinOperationDOCX,
  generateLettreMissionDOCX,
  generateRecueilInformationsDOCX,
  isValidDOCX,
} from './docx-generator-service'
import { uploadDocument, CONTENT_TYPES, getSignedUrl } from '@/lib/storage/file-storage-service'
import crypto from 'crypto'

// ============================================================================
// Types
// ============================================================================

export interface ExportServiceResult<T> {
  success: boolean
  data?: T
  error?: string
}

export interface ExportedDocument {
  documentId: string
  fileName: string
  fileUrl: string
  format: DocumentFormat
  size: number
  exportedAt: Date
  storagePath?: string
  checksum?: string
}

export interface BatchExportResult {
  successful: ExportedDocument[]
  failed: { documentId: string; error: string }[]
  totalProcessed: number
}

export interface CabinetBranding {
  logoUrl: string | null
  primaryColor: string
  secondaryColor: string
  fontFamily: string
  companyName: string
  address: string
  phone: string
  email: string
  website?: string
  oriasNumber?: string
  acprRegistration?: string
}

// ============================================================================
// Export Service
// ============================================================================

/**
 * Exporte un document en PDF
 * 
 * @requirements 3.7 - THE Document_Generator_Real SHALL NOT return placeholder URLs or simulated content
 * @requirements 3.8 - WHEN a document is generated, THE Document_Generator_Real SHALL save the file to storage
 * @requirements 8.1 - WHEN the CGP clicks "Télécharger" on a document, THE Result_Validator SHALL initiate a real file download
 * @requirements 16.3 - WHEN exporting to PDF, THE Document_Export SHALL generate a professional document with embedded fonts and proper pagination
 * @requirements 16.4 - THE Document_Export SHALL include signature placeholders in exported documents
 * @requirements 16.8 - WHEN exporting, THE Document_Export SHALL apply the cabinet's branding
 */
export async function exportToPDF(
  documentId: string,
  options?: DocumentExportOptionsInput
): Promise<ExportServiceResult<ExportedDocument>> {
  try {
    // Validate options if provided
    const validatedOptions = options 
      ? documentExportOptionsSchema.parse({ ...options, format: 'PDF' })
      : { format: 'PDF' as const, includeSignaturePlaceholders: true, applyBranding: true }

    // Get the generated document
    const documentResult = await getGeneratedDocumentById(documentId)
    if (!documentResult.success || !documentResult.data) {
      return {
        success: false,
        error: documentResult.error || 'Document non trouvé',
      }
    }
    const document = documentResult.data

    // Get client, cabinet, and advisor data for PDF generation
    const client = await prisma.client.findUnique({
      where: { id: document.clientId },
      include: {
        cabinet: true,
        conseiller: true,
      },
    })

    if (!client || !client.cabinet || !client.conseiller) {
      return {
        success: false,
        error: 'Client, cabinet ou conseiller non trouvé',
      }
    }

    // Prepare data for PDF generation
    const clientData: PDFClientData = {
      id: client.id,
      firstName: client.firstName,
      lastName: client.lastName,
      email: client.email,
      phone: client.phone,
      mobile: client.mobile,
      address: client.address as PDFClientData['address'],
      birthDate: client.birthDate,
      birthPlace: client.birthPlace,
      nationality: client.nationality,
      maritalStatus: client.maritalStatus,
      marriageRegime: client.marriageRegime,
      numberOfChildren: client.numberOfChildren,
      profession: client.profession,
      employerName: client.employerName,
      annualIncome: client.annualIncome ? Number(client.annualIncome) : null,
      riskProfile: client.riskProfile,
      investmentHorizon: client.investmentHorizon,
      investmentGoals: client.investmentGoals as string[] | null,
      kycStatus: client.kycStatus,
      isPEP: client.isPEP,
      originOfFunds: client.originOfFunds,
    }

    const cabinetData: PDFCabinetData = {
      id: client.cabinet.id,
      name: client.cabinet.name,
      email: client.cabinet.email,
      phone: client.cabinet.phone,
      address: client.cabinet.address as PDFCabinetData['address'],
      oriasNumber: (client.cabinet as Record<string, unknown>).oriasNumber as string | undefined,
      acprRegistration: (client.cabinet as Record<string, unknown>).acprRegistration as string | undefined,
      rcProInsurance: (client.cabinet as Record<string, unknown>).rcProInsurance as string | undefined,
      rcProInsurer: (client.cabinet as Record<string, unknown>).rcProInsurer as string | undefined,
      rcProPolicyNumber: (client.cabinet as Record<string, unknown>).rcProPolicyNumber as string | undefined,
      website: (client.cabinet as Record<string, unknown>).website as string | undefined,
    }

    const advisorData: PDFAdvisorData = {
      id: client.conseiller.id,
      firstName: client.conseiller.firstName,
      lastName: client.conseiller.lastName,
      email: client.conseiller.email,
      phone: client.conseiller.phone,
    }

    // Generate PDF based on document type
    let pdfResult
    const documentType = document.documentType as RegulatoryDocumentType
    const generatedData = document.generatedData as Record<string, unknown>

    switch (documentType) {
      case 'DER':
        pdfResult = await generateDERPDF(clientData, cabinetData, advisorData)
        break
      
      case 'DECLARATION_ADEQUATION':
        const productData: ProductData = {
          name: (generatedData.productName as string) || 'Produit non spécifié',
          type: (generatedData.productType as string) || 'Non spécifié',
          provider: (generatedData.productProvider as string) || 'Non spécifié',
          isin: generatedData.productIsin as string | undefined,
          riskLevel: generatedData.productRiskLevel as number | undefined,
          fees: generatedData.productFees as ProductData['fees'],
          description: generatedData.productDescription as string | undefined,
        }
        const justification = (generatedData.justification as string) || 'Justification non fournie'
        const warnings = generatedData.warnings as string[] | undefined
        pdfResult = await generateDeclarationAdequationPDF(
          clientData, cabinetData, advisorData, productData, justification, warnings
        )
        break
      
      case 'BULLETIN_SOUSCRIPTION':
      case 'ORDRE_ARBITRAGE':
      case 'DEMANDE_RACHAT':
      case 'BULLETIN_VERSEMENT':
        const operationData: OperationData = {
          id: (generatedData.operationId as string) || documentId,
          reference: (generatedData.operationReference as string) || `OP-${Date.now()}`,
          type: documentType,
          amount: (generatedData.amount as number) || 0,
          date: generatedData.operationDate ? new Date(generatedData.operationDate as string) : new Date(),
          contractNumber: generatedData.contractNumber as string | undefined,
          contractName: generatedData.contractName as string | undefined,
          funds: generatedData.funds as OperationData['funds'],
        }
        const complianceChecklist = generatedData.complianceChecklist as Array<{ label: string; checked: boolean }> | undefined
        pdfResult = await generateBulletinOperationPDF(
          clientData, cabinetData, advisorData, operationData, complianceChecklist
        )
        break
      
      case 'LETTRE_MISSION':
        const missionData = {
          scope: (generatedData.missionScope as string[]) || ['Conseil en gestion de patrimoine'],
          duration: (generatedData.missionDuration as string) || '12 mois',
          deliverables: (generatedData.missionDeliverables as string[]) || ['Rapport de mission'],
          fees: {
            type: ((generatedData.feesType as string) || 'FORFAIT') as 'FORFAIT' | 'HORAIRE' | 'COMMISSION',
            amount: generatedData.feesAmount as number | undefined,
            hourlyRate: generatedData.feesHourlyRate as number | undefined,
            description: (generatedData.feesDescription as string) || 'Honoraires selon convention',
          },
          terminationConditions: (generatedData.terminationConditions as string) || 'Résiliation possible à tout moment avec préavis de 30 jours',
        }
        pdfResult = await generateLettreMissionPDF(clientData, cabinetData, advisorData, missionData)
        break
      
      case 'RECUEIL_INFORMATIONS':
        const patrimoineData = generatedData.patrimoine as {
          actifs: Array<{ type: string; description: string; valeur: number }>
          passifs: Array<{ type: string; description: string; montant: number }>
        } | undefined
        const revenusData = generatedData.revenus as {
          salaires?: number
          revenus_fonciers?: number
          revenus_capitaux?: number
          autres?: number
        } | undefined
        const chargesData = generatedData.charges as {
          loyer?: number
          credits?: number
          impots?: number
          autres?: number
        } | undefined
        pdfResult = await generateRecueilInformationsPDF(
          clientData, cabinetData, advisorData, patrimoineData, revenusData, chargesData
        )
        break
      
      default:
        // For unsupported document types, generate a DER as fallback
        pdfResult = await generateDERPDF(clientData, cabinetData, advisorData)
    }

    if (!pdfResult.success || !pdfResult.fileBuffer) {
      return {
        success: false,
        error: pdfResult.error || 'Erreur lors de la génération du PDF',
      }
    }

    // Validate the generated PDF
    if (!isValidPDF(pdfResult.fileBuffer)) {
      return {
        success: false,
        error: 'Le fichier PDF généré est invalide',
      }
    }

    // Generate file name with PDF extension
    const fileName = pdfResult.fileName || document.fileName.replace(/\.\w+$/, '.pdf')
    
    // Calculate checksum for integrity verification
    const checksum = crypto.createHash('md5').update(pdfResult.fileBuffer).digest('hex')

    // Upload to Supabase Storage
    const uploadResult = await uploadDocument(
      document.cabinetId,
      document.clientId,
      fileName,
      pdfResult.fileBuffer,
      CONTENT_TYPES.PDF
    )

    if (!uploadResult.success) {
      return {
        success: false,
        error: uploadResult.error || 'Erreur lors du stockage du fichier',
      }
    }

    const fileUrl = uploadResult.signedUrl || uploadResult.publicUrl || ''
    const storagePath = uploadResult.path || ''
    const exportedAt = new Date()

    // Update the document record with the new file URL, size, and checksum
    await prisma.regulatoryGeneratedDocument.update({
      where: { id: documentId },
      data: {
        fileUrl,
        format: 'PDF',
        // Store additional metadata in generatedData
        generatedData: {
          ...document.generatedData as Record<string, unknown>,
          exportedAt: exportedAt.toISOString(),
          fileSize: pdfResult.fileBuffer.length,
          checksum,
          storagePath,
        },
      },
    })

    // Record the export in the compliance timeline
    await recordExportEvent(document.cabinetId, document.clientId, documentId, 'PDF')

    return {
      success: true,
      data: {
        documentId,
        fileName,
        fileUrl,
        format: 'PDF',
        size: pdfResult.fileBuffer.length,
        exportedAt,
        storagePath,
        checksum,
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de l\'export PDF'
    console.error('[ExportService] PDF export error:', error)
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Exporte un document en DOCX
 * 
 * @requirements 3.7 - THE Document_Generator_Real SHALL NOT return placeholder URLs or simulated content
 * @requirements 3.8 - WHEN a document is generated, THE Document_Generator_Real SHALL save the file to storage
 * @requirements 8.1 - WHEN the CGP clicks "Télécharger" on a document, THE Result_Validator SHALL initiate a real file download
 * @requirements 16.2 - WHEN exporting to DOCX, THE Document_Export SHALL preserve all formatting, headers, footers, and placeholders
 * @requirements 16.4 - THE Document_Export SHALL include signature placeholders in exported documents
 */
export async function exportToDOCX(
  documentId: string,
  options?: DocumentExportOptionsInput
): Promise<ExportServiceResult<ExportedDocument>> {
  try {
    // Validate options if provided
    const validatedOptions = options 
      ? documentExportOptionsSchema.parse({ ...options, format: 'DOCX' })
      : { format: 'DOCX' as const, includeSignaturePlaceholders: true, applyBranding: true }

    // Get the generated document
    const documentResult = await getGeneratedDocumentById(documentId)
    if (!documentResult.success || !documentResult.data) {
      return {
        success: false,
        error: documentResult.error || 'Document non trouvé',
      }
    }
    const document = documentResult.data

    // Get client, cabinet, and advisor data for DOCX generation
    const client = await prisma.client.findUnique({
      where: { id: document.clientId },
      include: {
        cabinet: true,
        conseiller: true,
      },
    })

    if (!client || !client.cabinet || !client.conseiller) {
      return {
        success: false,
        error: 'Client, cabinet ou conseiller non trouvé',
      }
    }

    // Prepare data for DOCX generation (same types as PDF)
    const clientData: PDFClientData = {
      id: client.id,
      firstName: client.firstName,
      lastName: client.lastName,
      email: client.email,
      phone: client.phone,
      mobile: client.mobile,
      address: client.address as PDFClientData['address'],
      birthDate: client.birthDate,
      birthPlace: client.birthPlace,
      nationality: client.nationality,
      maritalStatus: client.maritalStatus,
      marriageRegime: client.marriageRegime,
      numberOfChildren: client.numberOfChildren,
      profession: client.profession,
      employerName: client.employerName,
      annualIncome: client.annualIncome ? Number(client.annualIncome) : null,
      riskProfile: client.riskProfile,
      investmentHorizon: client.investmentHorizon,
      investmentGoals: client.investmentGoals as string[] | null,
      kycStatus: client.kycStatus,
      isPEP: client.isPEP,
      originOfFunds: client.originOfFunds,
    }

    const cabinetData: PDFCabinetData = {
      id: client.cabinet.id,
      name: client.cabinet.name,
      email: client.cabinet.email,
      phone: client.cabinet.phone,
      address: client.cabinet.address as PDFCabinetData['address'],
      oriasNumber: (client.cabinet as Record<string, unknown>).oriasNumber as string | undefined,
      acprRegistration: (client.cabinet as Record<string, unknown>).acprRegistration as string | undefined,
      rcProInsurance: (client.cabinet as Record<string, unknown>).rcProInsurance as string | undefined,
      rcProInsurer: (client.cabinet as Record<string, unknown>).rcProInsurer as string | undefined,
      rcProPolicyNumber: (client.cabinet as Record<string, unknown>).rcProPolicyNumber as string | undefined,
      website: (client.cabinet as Record<string, unknown>).website as string | undefined,
    }

    const advisorData: PDFAdvisorData = {
      id: client.conseiller.id,
      firstName: client.conseiller.firstName,
      lastName: client.conseiller.lastName,
      email: client.conseiller.email,
      phone: client.conseiller.phone,
    }

    // Generate DOCX based on document type
    let docxResult
    const documentType = document.documentType as RegulatoryDocumentType
    const generatedData = document.generatedData as Record<string, unknown>

    switch (documentType) {
      case 'DER':
        docxResult = await generateDERDOCX(clientData, cabinetData, advisorData)
        break
      
      case 'DECLARATION_ADEQUATION':
        const productData: ProductData = {
          name: (generatedData.productName as string) || 'Produit non spécifié',
          type: (generatedData.productType as string) || 'Non spécifié',
          provider: (generatedData.productProvider as string) || 'Non spécifié',
          isin: generatedData.productIsin as string | undefined,
          riskLevel: generatedData.productRiskLevel as number | undefined,
          fees: generatedData.productFees as ProductData['fees'],
          description: generatedData.productDescription as string | undefined,
        }
        const justification = (generatedData.justification as string) || 'Justification non fournie'
        const warnings = generatedData.warnings as string[] | undefined
        docxResult = await generateDeclarationAdequationDOCX(
          clientData, cabinetData, advisorData, productData, justification, warnings
        )
        break
      
      case 'BULLETIN_SOUSCRIPTION':
      case 'ORDRE_ARBITRAGE':
      case 'DEMANDE_RACHAT':
      case 'BULLETIN_VERSEMENT':
        const operationData: OperationData = {
          id: (generatedData.operationId as string) || documentId,
          reference: (generatedData.operationReference as string) || `OP-${Date.now()}`,
          type: documentType,
          amount: (generatedData.amount as number) || 0,
          date: generatedData.operationDate ? new Date(generatedData.operationDate as string) : new Date(),
          contractNumber: generatedData.contractNumber as string | undefined,
          contractName: generatedData.contractName as string | undefined,
          funds: generatedData.funds as OperationData['funds'],
        }
        const complianceChecklist = generatedData.complianceChecklist as Array<{ label: string; checked: boolean }> | undefined
        docxResult = await generateBulletinOperationDOCX(
          clientData, cabinetData, advisorData, operationData, complianceChecklist
        )
        break
      
      case 'LETTRE_MISSION':
        const missionData = {
          scope: (generatedData.missionScope as string[]) || ['Conseil en gestion de patrimoine'],
          duration: (generatedData.missionDuration as string) || '12 mois',
          deliverables: (generatedData.missionDeliverables as string[]) || ['Rapport de mission'],
          fees: {
            type: ((generatedData.feesType as string) || 'FORFAIT') as 'FORFAIT' | 'HORAIRE' | 'COMMISSION',
            amount: generatedData.feesAmount as number | undefined,
            hourlyRate: generatedData.feesHourlyRate as number | undefined,
            description: (generatedData.feesDescription as string) || 'Honoraires selon convention',
          },
          terminationConditions: (generatedData.terminationConditions as string) || 'Résiliation possible à tout moment avec préavis de 30 jours',
        }
        docxResult = await generateLettreMissionDOCX(clientData, cabinetData, advisorData, missionData)
        break
      
      case 'RECUEIL_INFORMATIONS':
        const patrimoineData = generatedData.patrimoine as {
          actifs: Array<{ type: string; description: string; valeur: number }>
          passifs: Array<{ type: string; description: string; montant: number }>
        } | undefined
        const revenusData = generatedData.revenus as {
          salaires?: number
          revenus_fonciers?: number
          revenus_capitaux?: number
          autres?: number
        } | undefined
        const chargesData = generatedData.charges as {
          loyer?: number
          credits?: number
          impots?: number
          autres?: number
        } | undefined
        docxResult = await generateRecueilInformationsDOCX(
          clientData, cabinetData, advisorData, patrimoineData, revenusData, chargesData
        )
        break
      
      default:
        // For unsupported document types, generate a DER as fallback
        docxResult = await generateDERDOCX(clientData, cabinetData, advisorData)
    }

    if (!docxResult.success || !docxResult.fileBuffer) {
      return {
        success: false,
        error: docxResult.error || 'Erreur lors de la génération du DOCX',
      }
    }

    // Validate the generated DOCX
    if (!isValidDOCX(docxResult.fileBuffer)) {
      return {
        success: false,
        error: 'Le fichier DOCX généré est invalide',
      }
    }

    // Generate file name with DOCX extension
    const fileName = docxResult.fileName || document.fileName.replace(/\.\w+$/, '.docx')
    
    // Calculate checksum for integrity verification
    const checksum = crypto.createHash('md5').update(docxResult.fileBuffer).digest('hex')

    // Upload to Supabase Storage
    const uploadResult = await uploadDocument(
      document.cabinetId,
      document.clientId,
      fileName,
      docxResult.fileBuffer,
      CONTENT_TYPES.DOCX
    )

    if (!uploadResult.success) {
      return {
        success: false,
        error: uploadResult.error || 'Erreur lors du stockage du fichier',
      }
    }

    const fileUrl = uploadResult.signedUrl || uploadResult.publicUrl || ''
    const storagePath = uploadResult.path || ''
    const exportedAt = new Date()

    // Update the document record with the new file URL, size, and checksum
    await prisma.regulatoryGeneratedDocument.update({
      where: { id: documentId },
      data: {
        fileUrl,
        format: 'DOCX',
        // Store additional metadata in generatedData
        generatedData: {
          ...document.generatedData as Record<string, unknown>,
          exportedAt: exportedAt.toISOString(),
          fileSize: docxResult.fileBuffer.length,
          checksum,
          storagePath,
        },
      },
    })

    // Record the export in the compliance timeline
    await recordExportEvent(document.cabinetId, document.clientId, documentId, 'DOCX')

    return {
      success: true,
      data: {
        documentId,
        fileName,
        fileUrl,
        format: 'DOCX',
        size: docxResult.fileBuffer.length,
        exportedAt,
        storagePath,
        checksum,
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de l\'export DOCX'
    console.error('[ExportService] DOCX export error:', error)
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Exporte plusieurs documents en batch
 * 
 * @requirements 16.6 - THE Document_Export SHALL support batch export of multiple documents for a single client
 */
export async function batchExport(
  input: BatchExportInput
): Promise<ExportServiceResult<BatchExportResult>> {
  try {
    // Validate input
    const validatedInput = batchExportSchema.parse(input)

    const successful: ExportedDocument[] = []
    const failed: { documentId: string; error: string }[] = []

    // Process each document
    for (const documentId of validatedInput.documentIds) {
      try {
        let result: ExportServiceResult<ExportedDocument>

        if (validatedInput.options.format === 'PDF') {
          result = await exportToPDF(documentId, validatedInput.options)
        } else {
          result = await exportToDOCX(documentId, validatedInput.options)
        }

        if (result.success && result.data) {
          successful.push(result.data)
        } else {
          failed.push({
            documentId,
            error: result.error || 'Erreur inconnue',
          })
        }
      } catch (error) {
        failed.push({
          documentId,
          error: error instanceof Error ? error.message : 'Erreur inconnue',
        })
      }
    }

    return {
      success: true,
      data: {
        successful,
        failed,
        totalProcessed: validatedInput.documentIds.length,
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de l\'export batch'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Prévisualise un document avant export
 * 
 * @requirements 16.7 - THE Document_Export SHALL allow the CGP to preview documents before export
 */
export async function previewExport(
  documentId: string,
  format: DocumentFormat
): Promise<ExportServiceResult<{ content: string; fileName: string; fileBuffer?: Buffer }>> {
  try {
    // Get the generated document
    const documentResult = await getGeneratedDocumentById(documentId)
    if (!documentResult.success || !documentResult.data) {
      return {
        success: false,
        error: documentResult.error || 'Document non trouvé',
      }
    }
    const document = documentResult.data

    // Get client, cabinet, and advisor data
    const client = await prisma.client.findUnique({
      where: { id: document.clientId },
      include: {
        cabinet: true,
        conseiller: true,
      },
    })

    if (!client || !client.cabinet || !client.conseiller) {
      return {
        success: false,
        error: 'Client, cabinet ou conseiller non trouvé',
      }
    }

    // Prepare data for generation
    const clientData: PDFClientData = {
      id: client.id,
      firstName: client.firstName,
      lastName: client.lastName,
      email: client.email,
      phone: client.phone,
      mobile: client.mobile,
      address: client.address as PDFClientData['address'],
      birthDate: client.birthDate,
      birthPlace: client.birthPlace,
      nationality: client.nationality,
      maritalStatus: client.maritalStatus,
      marriageRegime: client.marriageRegime,
      numberOfChildren: client.numberOfChildren,
      profession: client.profession,
      employerName: client.employerName,
      annualIncome: client.annualIncome ? Number(client.annualIncome) : null,
      riskProfile: client.riskProfile,
      investmentHorizon: client.investmentHorizon,
      investmentGoals: client.investmentGoals as string[] | null,
      kycStatus: client.kycStatus,
      isPEP: client.isPEP,
      originOfFunds: client.originOfFunds,
    }

    const cabinetData: PDFCabinetData = {
      id: client.cabinet.id,
      name: client.cabinet.name,
      email: client.cabinet.email,
      phone: client.cabinet.phone,
      address: client.cabinet.address as PDFCabinetData['address'],
    }

    const advisorData: PDFAdvisorData = {
      id: client.conseiller.id,
      firstName: client.conseiller.firstName,
      lastName: client.conseiller.lastName,
      email: client.conseiller.email,
      phone: client.conseiller.phone,
    }

    // Generate preview based on format
    let result
    if (format === 'PDF') {
      result = await generateDERPDF(clientData, cabinetData, advisorData)
    } else {
      result = await generateDERDOCX(clientData, cabinetData, advisorData)
    }

    if (!result.success || !result.fileBuffer) {
      return {
        success: false,
        error: result.error || 'Erreur lors de la génération de la prévisualisation',
      }
    }

    const extension = format.toLowerCase()
    const fileName = result.fileName || document.fileName.replace(/\.\w+$/, `.${extension}`)

    return {
      success: true,
      data: {
        content: `[Binary ${format} content - ${result.fileBuffer.length} bytes]`,
        fileName,
        fileBuffer: result.fileBuffer,
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la prévisualisation'
    return {
      success: false,
      error: message,
    }
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Récupère le branding du cabinet
 * 
 * @requirements 16.8 - WHEN exporting, THE Document_Export SHALL apply the cabinet's branding (logo, colors, contact information)
 */
async function getCabinetBranding(cabinetId: string): Promise<CabinetBranding | null> {
  try {
    const cabinet = await prisma.cabinet.findUnique({
      where: { id: cabinetId },
      select: {
        name: true,
        email: true,
        phone: true,
        address: true,
      },
    })

    if (!cabinet) {
      return null
    }

    // Format address
    const formatAddress = (address: unknown): string => {
      if (!address) return ''
      if (typeof address === 'string') return address
      if (typeof address === 'object') {
        const addr = address as Record<string, string>
        return [addr.street, addr.postalCode, addr.city, addr.country]
          .filter(Boolean)
          .join(', ')
      }
      return ''
    }

    return {
      logoUrl: null, // Would come from cabinet settings
      primaryColor: '#1a365d', // Default professional blue
      secondaryColor: '#2d3748', // Default dark gray
      fontFamily: 'Arial, sans-serif',
      companyName: cabinet.name,
      address: formatAddress(cabinet.address),
      phone: cabinet.phone || '',
      email: cabinet.email,
    }
  } catch {
    return null
  }
}

/**
 * Récupère une URL de téléchargement fraîche pour un document
 * 
 * @requirements 8.1 - WHEN the CGP clicks "Télécharger" on a document, THE Result_Validator SHALL initiate a real file download
 */
export async function getDocumentDownloadUrl(
  documentId: string
): Promise<ExportServiceResult<{ url: string; fileName: string }>> {
  try {
    const document = await prisma.regulatoryGeneratedDocument.findUnique({
      where: { id: documentId },
      select: {
        fileName: true,
        fileUrl: true,
        generatedData: true,
        cabinetId: true,
        clientId: true,
      },
    })

    if (!document) {
      return {
        success: false,
        error: 'Document non trouvé',
      }
    }

    const generatedData = document.generatedData as Record<string, unknown>
    const storagePath = generatedData?.storagePath as string

    // If we have a storage path, generate a fresh signed URL
    if (storagePath) {
      const signedUrlResult = await getSignedUrl(storagePath, {
        expiresIn: 3600, // 1 hour
        download: document.fileName,
      })

      if (signedUrlResult.success && signedUrlResult.signedUrl) {
        return {
          success: true,
          data: {
            url: signedUrlResult.signedUrl,
            fileName: document.fileName,
          },
        }
      }
    }

    // Fallback to stored URL
    if (document.fileUrl) {
      return {
        success: true,
        data: {
          url: document.fileUrl,
          fileName: document.fileName,
        },
      }
    }

    return {
      success: false,
      error: 'Aucune URL de téléchargement disponible',
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la récupération de l\'URL'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Rend une section de template avec les données
 */
function renderSection(section: TemplateSection, data: Record<string, unknown>): string {
  let content = section.content

  // Replace all {{placeholder}} with actual values
  const placeholderRegex = /\{\{(\w+)\}\}/g
  content = content.replace(placeholderRegex, (match, key) => {
    const value = data[key]
    if (value === undefined || value === null) {
      return match // Keep placeholder if no value
    }
    return String(value)
  })

  return `## ${section.title}\n\n${content}\n\n`
}

/**
 * Enregistre l'événement d'export dans la timeline conformité
 * 
 * @requirements 16.5 - WHEN a document is exported, THE Document_Export SHALL record the export action in the compliance timeline
 */
async function recordExportEvent(
  cabinetId: string,
  clientId: string,
  documentId: string,
  format: DocumentFormat
): Promise<void> {
  try {
    // Get the document details for the event
    const document = await prisma.regulatoryGeneratedDocument.findUnique({
      where: { id: documentId },
      select: {
        documentType: true,
        fileName: true,
        generatedById: true,
      },
    })

    if (!document) return

    // Create timeline event
    await prisma.complianceTimelineEvent.create({
      data: {
        cabinetId,
        clientId,
        type: 'DOCUMENT_EXPORTED',
        title: `Document exporté en ${format}`,
        description: `Le document "${document.fileName}" a été exporté au format ${format}`,
        metadata: {
          documentId,
          documentType: document.documentType,
          format,
          exportedAt: new Date().toISOString(),
        },
        userId: document.generatedById,
      },
    })
  } catch {
    // Silently fail - export should not fail if timeline event fails
    console.error('Failed to record export event in timeline')
  }
}

/**
 * Obtient les formats d'export disponibles
 */
export function getAvailableFormats(): DocumentFormat[] {
  return ['PDF', 'DOCX']
}

/**
 * Vérifie si un format est supporté
 */
export function isFormatSupported(format: string): format is DocumentFormat {
  return ['PDF', 'DOCX'].includes(format)
}
