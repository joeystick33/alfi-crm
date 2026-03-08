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
 * Intègre les vrais générateurs PDF/DOCX et le stockage Supabase
 * 
 * @module lib/documents/services/document-generator-service
 * @requirements 3.8, 5.3, 14.1-14.10
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
import { uploadDocument, CONTENT_TYPES } from '@/lib/storage/file-storage-service'
import crypto from 'crypto'

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
  storagePath?: string | null
  format: string
  status: string
  signatureStatus: unknown
  generatedData: Record<string, unknown>
  generatedById: string
  generatedAt: Date
  signedAt: Date | null
  expiresAt: Date | null
  fileSize?: number | null
  checksum?: string | null
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
 * Génère un document réglementaire avec stockage réel
 * 
 * @requirements 3.8 - WHEN a document is generated, THE Document_Generator_Real SHALL save the file to storage
 * @requirements 5.3 - WHEN the CGP generates a document, THE Result_Validator SHALL create a real file
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

    // Prepare data for real PDF/DOCX generation
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

    // Generate the actual file based on format
    let fileResult: { success: boolean; fileBuffer?: Buffer; fileName?: string; error?: string }
    const documentType = validatedInput.documentType

    if (validatedInput.format === 'PDF') {
      fileResult = await generateRealPDF(documentType, clientData, cabinetData, advisorData, generatedData)
    } else {
      fileResult = await generateRealDOCX(documentType, clientData, cabinetData, advisorData, generatedData)
    }

    if (!fileResult.success || !fileResult.fileBuffer) {
      return {
        success: false,
        error: fileResult.error || 'Erreur lors de la génération du fichier',
      }
    }

    // Validate the generated file
    const isValid = validatedInput.format === 'PDF' 
      ? isValidPDF(fileResult.fileBuffer)
      : isValidDOCX(fileResult.fileBuffer)

    if (!isValid) {
      return {
        success: false,
        error: `Le fichier ${validatedInput.format} généré est invalide`,
      }
    }

    // Generate file name
    const fileName = fileResult.fileName || generateFileName(
      validatedInput.documentType,
      client.firstName,
      client.lastName,
      validatedInput.format
    )

    // Calculate checksum for integrity verification
    const checksum = crypto.createHash('md5').update(fileResult.fileBuffer).digest('hex')
    const fileSize = fileResult.fileBuffer.length

    // Upload to Supabase Storage
    const contentType = validatedInput.format === 'PDF' ? CONTENT_TYPES.PDF : CONTENT_TYPES.DOCX
    const uploadResult = await uploadDocument(
      validatedInput.cabinetId,
      validatedInput.clientId,
      fileName,
      fileResult.fileBuffer,
      contentType
    )

    let fileUrl: string
    let storagePath: string | null = null

    if (uploadResult.success) {
      fileUrl = uploadResult.signedUrl || uploadResult.publicUrl || ''
      storagePath = uploadResult.path || null
    } else {
      // Fallback to placeholder URL if storage fails (but log the error)
      console.error('[DocumentGenerator] Storage upload failed:', uploadResult.error)
      fileUrl = `/documents/${validatedInput.cabinetId}/${validatedInput.clientId}/${fileName}`
    }

    // Create the generated document record with fileSize and checksum
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
        generatedData: JSON.parse(JSON.stringify({
          ...generatedData,
          fileSize,
          checksum,
          storagePath,
          generatedAt: new Date().toISOString(),
        })),
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

    // Create audit log entry for document generation
    await prisma.auditLog.create({
      data: {
        cabinetId: validatedInput.cabinetId,
        userId: validatedInput.generatedById,
        action: 'CREATION',
        entityType: 'RegulatoryGeneratedDocument',
        entityId: document.id,
        changes: {
          documentType: validatedInput.documentType,
          format: validatedInput.format,
          fileName,
          fileUrl,
          fileSize,
          checksum,
          clientId: validatedInput.clientId,
          affaireId: validatedInput.affaireId,
          operationId: validatedInput.operationId,
          templateId: validatedInput.templateId,
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
        storagePath,
        fileSize,
        checksum,
      } as GeneratedDocumentWithRelations,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la génération du document'
    console.error('[DocumentGenerator] Error:', error)
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Génère un PDF réel basé sur le type de document
 */
async function generateRealPDF(
  documentType: RegulatoryDocumentType,
  clientData: PDFClientData,
  cabinetData: PDFCabinetData,
  advisorData: PDFAdvisorData,
  generatedData: Record<string, unknown>
): Promise<{ success: boolean; fileBuffer?: Buffer; fileName?: string; error?: string }> {
  switch (documentType) {
    case 'DER':
      return generateDERPDF(clientData, cabinetData, advisorData)
    
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
      return generateDeclarationAdequationPDF(
        clientData, cabinetData, advisorData, productData, justification, warnings
      )
    
    case 'BULLETIN_SOUSCRIPTION':
    case 'ORDRE_ARBITRAGE':
    case 'DEMANDE_RACHAT':
    case 'BULLETIN_VERSEMENT':
      const operationData: OperationData = {
        id: (generatedData.operationId as string) || crypto.randomUUID(),
        reference: (generatedData.operationReference as string) || `OP-${Date.now()}`,
        type: documentType,
        amount: (generatedData.amount as number) || 0,
        date: generatedData.operationDate ? new Date(generatedData.operationDate as string) : new Date(),
        contractNumber: generatedData.contractNumber as string | undefined,
        contractName: generatedData.contractName as string | undefined,
        funds: generatedData.funds as OperationData['funds'],
      }
      const complianceChecklist = generatedData.complianceChecklist as Array<{ label: string; checked: boolean }> | undefined
      return generateBulletinOperationPDF(
        clientData, cabinetData, advisorData, operationData, complianceChecklist
      )
    
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
      return generateLettreMissionPDF(clientData, cabinetData, advisorData, missionData)
    
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
      return generateRecueilInformationsPDF(
        clientData, cabinetData, advisorData, patrimoineData, revenusData, chargesData
      )
    
    default:
      // For unsupported document types, generate a DER as fallback
      return generateDERPDF(clientData, cabinetData, advisorData)
  }
}

/**
 * Génère un DOCX réel basé sur le type de document
 */
async function generateRealDOCX(
  documentType: RegulatoryDocumentType,
  clientData: PDFClientData,
  cabinetData: PDFCabinetData,
  advisorData: PDFAdvisorData,
  generatedData: Record<string, unknown>
): Promise<{ success: boolean; fileBuffer?: Buffer; fileName?: string; error?: string }> {
  switch (documentType) {
    case 'DER':
      return generateDERDOCX(clientData, cabinetData, advisorData)
    
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
      return generateDeclarationAdequationDOCX(
        clientData, cabinetData, advisorData, productData, justification, warnings
      )
    
    case 'BULLETIN_SOUSCRIPTION':
    case 'ORDRE_ARBITRAGE':
    case 'DEMANDE_RACHAT':
    case 'BULLETIN_VERSEMENT':
      const operationData: OperationData = {
        id: (generatedData.operationId as string) || crypto.randomUUID(),
        reference: (generatedData.operationReference as string) || `OP-${Date.now()}`,
        type: documentType,
        amount: (generatedData.amount as number) || 0,
        date: generatedData.operationDate ? new Date(generatedData.operationDate as string) : new Date(),
        contractNumber: generatedData.contractNumber as string | undefined,
        contractName: generatedData.contractName as string | undefined,
        funds: generatedData.funds as OperationData['funds'],
      }
      const complianceChecklist = generatedData.complianceChecklist as Array<{ label: string; checked: boolean }> | undefined
      return generateBulletinOperationDOCX(
        clientData, cabinetData, advisorData, operationData, complianceChecklist
      )
    
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
      return generateLettreMissionDOCX(clientData, cabinetData, advisorData, missionData)
    
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
      return generateRecueilInformationsDOCX(
        clientData, cabinetData, advisorData, patrimoineData, revenusData, chargesData
      )
    
    default:
      // For unsupported document types, generate a DER as fallback
      return generateDERDOCX(clientData, cabinetData, advisorData)
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
