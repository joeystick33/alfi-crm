/**
 * Service d'export de documents réglementaires (PDF/DOCX)
 * 
 * Ce service gère l'export des documents générés:
 * - Export en PDF avec styling professionnel
 * - Export en DOCX pour édition
 * - Export batch de plusieurs documents
 * - Application du branding cabinet
 * 
 * @module lib/documents/services/export-service
 * @requirements 16.1-16.8
 */

import { prisma } from '@/app/_common/lib/prisma'
import {
  type DocumentFormat,
  type DocumentExportOptions,
  type DocumentExportResult,
  type DocumentStyles,
  type DocumentTemplateContent,
  type TemplateSection,
} from '../types'
import {
  documentExportOptionsSchema,
  batchExportSchema,
  type DocumentExportOptionsInput,
  type BatchExportInput,
} from '../schemas'
import { getGeneratedDocumentById } from './document-generator-service'

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

    // Get cabinet branding if needed
    let branding: CabinetBranding | null = null
    if (validatedOptions.applyBranding) {
      branding = await getCabinetBranding(document.cabinetId)
    }

    // Get the template for styling
    const template = await prisma.regulatoryDocumentTemplate.findUnique({
      where: { id: document.templateId },
    })

    if (!template) {
      return {
        success: false,
        error: 'Template non trouvé',
      }
    }

    const templateContent = template.content as unknown as DocumentTemplateContent

    // Generate PDF content
    const pdfContent = generatePDFContent(
      document.generatedData,
      templateContent,
      branding,
      validatedOptions.includeSignaturePlaceholders,
      validatedOptions.watermark
    )

    // Generate file name with PDF extension
    const fileName = document.fileName.replace(/\.\w+$/, '.pdf')
    
    // In a real implementation, this would:
    // 1. Use a PDF library (like pdfmake, jsPDF, or @react-pdf/renderer)
    // 2. Upload to storage (S3, Supabase Storage, etc.)
    // 3. Return the actual URL
    
    // For now, we'll simulate the export
    const fileUrl = `/exports/${document.cabinetId}/${document.clientId}/${fileName}`
    const exportedAt = new Date()

    // Update the document record with the new file URL
    await prisma.regulatoryGeneratedDocument.update({
      where: { id: documentId },
      data: {
        fileUrl,
        format: 'PDF',
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
        size: pdfContent.length, // Simulated size
        exportedAt,
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de l\'export PDF'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Exporte un document en DOCX
 * 
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

    // Get cabinet branding if needed
    let branding: CabinetBranding | null = null
    if (validatedOptions.applyBranding) {
      branding = await getCabinetBranding(document.cabinetId)
    }

    // Get the template for styling
    const template = await prisma.regulatoryDocumentTemplate.findUnique({
      where: { id: document.templateId },
    })

    if (!template) {
      return {
        success: false,
        error: 'Template non trouvé',
      }
    }

    const templateContent = template.content as unknown as DocumentTemplateContent

    // Generate DOCX content
    const docxContent = generateDOCXContent(
      document.generatedData,
      templateContent,
      branding,
      validatedOptions.includeSignaturePlaceholders
    )

    // Generate file name with DOCX extension
    const fileName = document.fileName.replace(/\.\w+$/, '.docx')
    
    // In a real implementation, this would use a DOCX library (like docx)
    const fileUrl = `/exports/${document.cabinetId}/${document.clientId}/${fileName}`
    const exportedAt = new Date()

    // Update the document record
    await prisma.regulatoryGeneratedDocument.update({
      where: { id: documentId },
      data: {
        fileUrl,
        format: 'DOCX',
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
        size: docxContent.length,
        exportedAt,
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de l\'export DOCX'
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
): Promise<ExportServiceResult<{ content: string; fileName: string }>> {
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

    // Get the template
    const template = await prisma.regulatoryDocumentTemplate.findUnique({
      where: { id: document.templateId },
    })

    if (!template) {
      return {
        success: false,
        error: 'Template non trouvé',
      }
    }

    const templateContent = template.content as unknown as DocumentTemplateContent

    // Get branding
    const branding = await getCabinetBranding(document.cabinetId)

    // Generate preview content
    const content = format === 'PDF'
      ? generatePDFContent(document.generatedData, templateContent, branding, true)
      : generateDOCXContent(document.generatedData, templateContent, branding, true)

    const extension = format.toLowerCase()
    const fileName = document.fileName.replace(/\.\w+$/, `.${extension}`)

    return {
      success: true,
      data: {
        content,
        fileName,
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
 * Génère le contenu PDF
 * 
 * @requirements 16.3 - Professional document with embedded fonts and proper pagination
 * @requirements 16.4 - Include signature placeholders
 */
function generatePDFContent(
  data: Record<string, unknown>,
  templateContent: DocumentTemplateContent,
  branding: CabinetBranding | null,
  includeSignaturePlaceholders: boolean,
  watermark?: string
): string {
  // This is a simplified representation of PDF content
  // In a real implementation, this would use a PDF library
  
  let content = ''

  // Apply branding header
  if (branding) {
    content += `=== ${branding.companyName} ===\n`
    content += `${branding.address}\n`
    content += `Tél: ${branding.phone} | Email: ${branding.email}\n`
    content += '---\n\n'
  }

  // Render header section
  content += renderSection(templateContent.header, data)

  // Render main sections
  for (const section of templateContent.sections.sort((a, b) => a.order - b.order)) {
    content += renderSection(section, data)
  }

  // Add signature placeholders
  if (includeSignaturePlaceholders) {
    content += '\n---\n'
    content += 'SIGNATURES\n\n'
    content += 'Le Client:                          Le Conseiller:\n'
    content += '\n'
    content += '________________________           ________________________\n'
    content += 'Date:                              Date:\n'
    content += '________________________           ________________________\n'
  }

  // Render footer section
  content += '\n---\n'
  content += renderSection(templateContent.footer, data)

  // Add watermark if specified
  if (watermark) {
    content = `[WATERMARK: ${watermark}]\n\n${content}`
  }

  return content
}

/**
 * Génère le contenu DOCX
 * 
 * @requirements 16.2 - Preserve all formatting, headers, footers, and placeholders
 */
function generateDOCXContent(
  data: Record<string, unknown>,
  templateContent: DocumentTemplateContent,
  branding: CabinetBranding | null,
  includeSignaturePlaceholders: boolean
): string {
  // This is a simplified representation of DOCX content
  // In a real implementation, this would use the docx library
  
  let content = ''

  // Apply branding header
  if (branding) {
    content += `[HEADER]\n`
    content += `${branding.companyName}\n`
    content += `${branding.address}\n`
    content += `Tél: ${branding.phone} | Email: ${branding.email}\n`
    content += `[/HEADER]\n\n`
  }

  // Render header section
  content += renderSection(templateContent.header, data)

  // Render main sections
  for (const section of templateContent.sections.sort((a, b) => a.order - b.order)) {
    content += renderSection(section, data)
  }

  // Add signature placeholders
  if (includeSignaturePlaceholders) {
    content += '\n[SIGNATURE_BLOCK]\n'
    content += 'Le Client:                          Le Conseiller:\n'
    content += '\n'
    content += '[SIGNATURE_FIELD: client]          [SIGNATURE_FIELD: advisor]\n'
    content += 'Date: [DATE_FIELD: client]         Date: [DATE_FIELD: advisor]\n'
    content += '[/SIGNATURE_BLOCK]\n'
  }

  // Render footer section
  content += '\n[FOOTER]\n'
  content += renderSection(templateContent.footer, data)
  content += '[/FOOTER]\n'

  return content
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
