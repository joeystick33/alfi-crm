/**
 * Service de génération de documents réglementaires
 * 
 * Ce service gère la génération automatique de documents:
 * - DER (Document d'Entrée en Relation)
 * - Lettre de Mission
 * - Recueil d'Informations Client
 * - Rapport de Mission / Fiche Conseil
 * - Convention d'Honoraires
 * - Attestation de Conseil
 * - Et autres documents réglementaires
 * 
 * @module lib/documents/services/document-generator-service
 * @requirements 14.1-14.10
 */

import { prisma } from '@/app/_common/lib/prisma'
import {
  type RegulatoryDocumentType,
  type DocumentFormat,
  type DocumentTemplateContent,
  type TemplateSection,
  REGULATORY_DOCUMENT_TYPE_LABELS,
} from '../types'
import {
  generateDocumentSchema,
  type GenerateDocumentInput,
} from '../schemas'
import { getTemplateByType, getTemplateById } from './template-service'
import { addDocumentGeneratedEvent } from '../../compliance/services/timeline-service'

// ============================================================================
// Types
// ============================================================================

export interface DocumentGeneratorResult<T> {
  success: boolean
  data?: T
  error?: string
}

export interface GeneratedDocumentWithRelations {
  id: string
  cabinetId: string
  clientId: string
  affaireId: string | null
  operationId: string | null
  templateId: string
  documentType: string
  fileName: string
  fileUrl: string
  format: string
  status: string
  signatureStatus: unknown
  generatedData: Record<string, unknown>
  generatedById: string
  generatedAt: Date
  signedAt: Date | null
  expiresAt: Date | null
  client: {
    id: string
    firstName: string
    lastName: string
    email: string | null
  }
  template: {
    id: string
    name: string
    documentType: string
    associationType: string
  }
  generatedBy: {
    id: string
    firstName: string
    lastName: string
  }
}

export interface DocumentPreview {
  content: string
  fileName: string
  documentType: RegulatoryDocumentType
  data: Record<string, unknown>
}

export interface ClientData {
  id: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  mobile: string | null
  address: unknown
  birthDate: Date | null
  birthPlace: string | null
  nationality: string | null
  maritalStatus: string | null
  marriageRegime: string | null
  numberOfChildren: number | null
  profession: string | null
  employerName: string | null
  annualIncome: number | null
  riskProfile: string | null
  investmentHorizon: string | null
  investmentGoals: unknown
  kycStatus: string
  isPEP: boolean
  originOfFunds: string | null
}

export interface CabinetData {
  id: string
  name: string
  email: string
  phone: string | null
  address: unknown
}

export interface AdvisorData {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
}

// ============================================================================
// Document Generator Service
// ============================================================================

/**
 * Génère un document réglementaire
 * 
 * @requirements 14.6 - THE Document_Generator SHALL pre-fill all documents with existing client data from the database
 * @requirements 14.7 - THE Document_Generator SHALL generate documents in PDF format with professional styling
 * @requirements 14.8 - WHEN a document is generated, THE Document_Generator SHALL save it to the client's document folder
 */
export async function generateDocument(
  input: GenerateDocumentInput
): Promise<DocumentGeneratorResult<GeneratedDocumentWithRelations>> {
  try {
    // Validate input
    const validatedInput = generateDocumentSchema.parse(input)

    // Get the template
    const templateResult = await getTemplateById(validatedInput.templateId)
    if (!templateResult.success || !templateResult.data) {
      return {
        success: false,
        error: templateResult.error || 'Template non trouvé',
      }
    }
    const template = templateResult.data

    // Get client data for pre-filling
    const client = await prisma.client.findUnique({
      where: { id: validatedInput.clientId },
      include: {
        cabinet: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
          },
        },
        conseiller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    })

    if (!client) {
      return {
        success: false,
        error: 'Client non trouvé',
      }
    }

    // Build the data object for document generation
    const generatedData = buildDocumentData(
      client as unknown as ClientData & { cabinet: CabinetData; conseiller: AdvisorData },
      template.content,
      validatedInput.customData
    )

    // Generate file name
    const fileName = generateFileName(
      validatedInput.documentType,
      client.firstName,
      client.lastName,
      validatedInput.format
    )

    // For now, we'll store a placeholder URL - actual file generation would be done by export service
    const fileUrl = `/documents/${validatedInput.cabinetId}/${validatedInput.clientId}/${fileName}`

    // Create the generated document record
    const document = await prisma.regulatoryGeneratedDocument.create({
      data: {
        cabinetId: validatedInput.cabinetId,
        clientId: validatedInput.clientId,
        affaireId: validatedInput.affaireId ?? null,
        operationId: validatedInput.operationId ?? null,
        templateId: validatedInput.templateId,
        documentType: validatedInput.documentType,
        fileName,
        fileUrl,
        format: validatedInput.format,
        status: 'DRAFT',
        generatedData: JSON.parse(JSON.stringify(generatedData)),
        generatedById: validatedInput.generatedById,
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        template: {
          select: {
            id: true,
            name: true,
            documentType: true,
            associationType: true,
          },
        },
        generatedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    // Add timeline event for document generation
    // This traces the document generation in the compliance timeline
    await addDocumentGeneratedEvent(
      validatedInput.cabinetId,
      validatedInput.clientId,
      validatedInput.generatedById,
      REGULATORY_DOCUMENT_TYPE_LABELS[validatedInput.documentType] || validatedInput.documentType,
      document.id,
      validatedInput.affaireId ?? undefined,
      validatedInput.operationId ?? undefined
    )

    return {
      success: true,
      data: {
        ...document,
        generatedData: document.generatedData as Record<string, unknown>,
      } as GeneratedDocumentWithRelations,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la génération du document'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Prévisualise un document avant génération
 * 
 * @requirements 14.6 - THE Document_Generator SHALL pre-fill all documents with existing client data
 */
export async function previewDocument(
  cabinetId: string,
  clientId: string,
  templateId: string,
  documentType: RegulatoryDocumentType,
  customData?: Record<string, unknown>
): Promise<DocumentGeneratorResult<DocumentPreview>> {
  try {
    // Get the template
    const templateResult = await getTemplateById(templateId)
    if (!templateResult.success || !templateResult.data) {
      return {
        success: false,
        error: templateResult.error || 'Template non trouvé',
      }
    }
    const template = templateResult.data

    // Get client data
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        cabinet: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
          },
        },
        conseiller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    })

    if (!client) {
      return {
        success: false,
        error: 'Client non trouvé',
      }
    }

    // Build the data object
    const data = buildDocumentData(
      client as unknown as ClientData & { cabinet: CabinetData; conseiller: AdvisorData },
      template.content,
      customData
    )

    // Generate preview content by replacing placeholders
    const content = renderTemplateContent(template.content, data)

    // Generate file name
    const fileName = generateFileName(
      documentType,
      client.firstName,
      client.lastName,
      'PDF'
    )

    return {
      success: true,
      data: {
        content,
        fileName,
        documentType,
        data,
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la prévisualisation du document'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Récupère un document généré par son ID
 */
export async function getGeneratedDocumentById(
  documentId: string
): Promise<DocumentGeneratorResult<GeneratedDocumentWithRelations>> {
  try {
    const document = await prisma.regulatoryGeneratedDocument.findUnique({
      where: { id: documentId },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        template: {
          select: {
            id: true,
            name: true,
            documentType: true,
            associationType: true,
          },
        },
        generatedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    if (!document) {
      return {
        success: false,
        error: 'Document non trouvé',
      }
    }

    return {
      success: true,
      data: {
        ...document,
        generatedData: document.generatedData as Record<string, unknown>,
      } as GeneratedDocumentWithRelations,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la récupération du document'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Récupère les documents générés pour un client
 */
export async function getGeneratedDocumentsByClient(
  cabinetId: string,
  clientId: string,
  filters?: {
    documentType?: RegulatoryDocumentType[]
    status?: string[]
    affaireId?: string
    operationId?: string
  }
): Promise<DocumentGeneratorResult<GeneratedDocumentWithRelations[]>> {
  try {
    const where: Record<string, unknown> = {
      cabinetId,
      clientId,
    }

    if (filters?.documentType && filters.documentType.length > 0) {
      where.documentType = { in: filters.documentType }
    }

    if (filters?.status && filters.status.length > 0) {
      where.status = { in: filters.status }
    }

    if (filters?.affaireId) {
      where.affaireId = filters.affaireId
    }

    if (filters?.operationId) {
      where.operationId = filters.operationId
    }

    const documents = await prisma.regulatoryGeneratedDocument.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        template: {
          select: {
            id: true,
            name: true,
            documentType: true,
            associationType: true,
          },
        },
        generatedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        generatedAt: 'desc',
      },
    })

    return {
      success: true,
      data: documents.map(doc => ({
        ...doc,
        generatedData: doc.generatedData as Record<string, unknown>,
      })) as GeneratedDocumentWithRelations[],
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la récupération des documents'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Met à jour le statut d'un document généré
 */
export async function updateDocumentStatus(
  documentId: string,
  status: 'DRAFT' | 'FINAL' | 'SIGNED',
  signedAt?: Date
): Promise<DocumentGeneratorResult<GeneratedDocumentWithRelations>> {
  try {
    const document = await prisma.regulatoryGeneratedDocument.update({
      where: { id: documentId },
      data: {
        status,
        ...(signedAt && { signedAt }),
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        template: {
          select: {
            id: true,
            name: true,
            documentType: true,
            associationType: true,
          },
        },
        generatedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    return {
      success: true,
      data: {
        ...document,
        generatedData: document.generatedData as Record<string, unknown>,
      } as GeneratedDocumentWithRelations,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la mise à jour du statut'
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
 * Construit les données pour la génération du document
 * 
 * @requirements 14.2 - WHEN generating a DER, THE Document_Generator SHALL include cabinet info, services, fees, regulatory disclosures
 * @requirements 14.3 - WHEN generating a Recueil d'Informations, THE Document_Generator SHALL include client identity, situation, patrimony
 * @requirements 14.4 - WHEN generating a Lettre de Mission, THE Document_Generator SHALL include scope, duration, fees, termination
 * @requirements 14.5 - WHEN generating a Rapport de Mission, THE Document_Generator SHALL include summary, analysis, recommendations
 */
function buildDocumentData(
  client: ClientData & { cabinet: CabinetData; conseiller: AdvisorData },
  templateContent: DocumentTemplateContent,
  customData?: Record<string, unknown>
): Record<string, unknown> {
  const now = new Date()
  
  // Format address if it exists
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

  // Base data from client
  const data: Record<string, unknown> = {
    // Document metadata
    generationDate: now.toLocaleDateString('fr-FR'),
    generationDateTime: now.toLocaleString('fr-FR'),
    year: now.getFullYear(),

    // Client information
    clientId: client.id,
    clientFirstName: client.firstName,
    clientLastName: client.lastName,
    clientFullName: `${client.firstName} ${client.lastName}`,
    clientEmail: client.email || '',
    clientPhone: client.phone || client.mobile || '',
    clientAddress: formatAddress(client.address),
    clientBirthDate: client.birthDate?.toLocaleDateString('fr-FR') || '',
    clientBirthPlace: client.birthPlace || '',
    clientNationality: client.nationality || '',
    clientMaritalStatus: client.maritalStatus || '',
    clientMarriageRegime: client.marriageRegime || '',
    clientNumberOfChildren: client.numberOfChildren || 0,
    clientProfession: client.profession || '',
    clientEmployer: client.employerName || '',
    clientAnnualIncome: client.annualIncome?.toLocaleString('fr-FR') || '',
    clientRiskProfile: client.riskProfile || '',
    clientInvestmentHorizon: client.investmentHorizon || '',
    clientKycStatus: client.kycStatus,
    clientIsPEP: client.isPEP ? 'Oui' : 'Non',
    clientOriginOfFunds: client.originOfFunds || '',

    // Cabinet information
    cabinetId: client.cabinet.id,
    cabinetName: client.cabinet.name,
    cabinetEmail: client.cabinet.email,
    cabinetPhone: client.cabinet.phone || '',
    cabinetAddress: formatAddress(client.cabinet.address),

    // Advisor information
    advisorId: client.conseiller.id,
    advisorFirstName: client.conseiller.firstName,
    advisorLastName: client.conseiller.lastName,
    advisorFullName: `${client.conseiller.firstName} ${client.conseiller.lastName}`,
    advisorEmail: client.conseiller.email,
    advisorPhone: client.conseiller.phone || '',

    // Regulatory placeholders (to be filled by cabinet settings)
    oriasNumber: '{{oriasNumber}}',
    acprRegistration: '{{acprRegistration}}',
    professionalLiabilityInsurance: '{{professionalLiabilityInsurance}}',
    complaintHandlingProcedure: '{{complaintHandlingProcedure}}',
    amfWarnings: '{{amfWarnings}}',
    acprWarnings: '{{acprWarnings}}',
  }

  // Merge with custom data if provided
  if (customData) {
    Object.assign(data, customData)
  }

  return data
}

/**
 * Génère le nom de fichier pour un document
 */
function generateFileName(
  documentType: RegulatoryDocumentType,
  firstName: string,
  lastName: string,
  format: DocumentFormat
): string {
  const date = new Date().toISOString().split('T')[0]
  const sanitizedName = `${lastName}_${firstName}`.replace(/[^a-zA-Z0-9_]/g, '')
  const extension = format.toLowerCase()
  return `${documentType}_${sanitizedName}_${date}.${extension}`
}

/**
 * Remplace les placeholders dans le contenu du template
 */
function renderTemplateContent(
  templateContent: DocumentTemplateContent,
  data: Record<string, unknown>
): string {
  const renderSection = (section: TemplateSection): string => {
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

  // Build the full document content
  let fullContent = ''

  // Header
  fullContent += renderSection(templateContent.header)

  // Sections
  for (const section of templateContent.sections.sort((a, b) => a.order - b.order)) {
    fullContent += renderSection(section)
  }

  // Footer
  fullContent += renderSection(templateContent.footer)

  return fullContent
}

/**
 * Obtient le label français d'un type de document
 */
export function getDocumentTypeLabel(documentType: RegulatoryDocumentType): string {
  return REGULATORY_DOCUMENT_TYPE_LABELS[documentType]
}

/**
 * Vérifie si un document est expiré
 */
export function isDocumentExpired(expiresAt: Date | null): boolean {
  if (!expiresAt) return false
  return new Date() > expiresAt
}
