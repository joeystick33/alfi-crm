
/**
 * API Route: /api/advisor/clients/[id]/documents
 * Documents & Conformité - Client 360 Tab
 * 
 * Returns documents, KYC status, risk profile, and compliance information
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
 */

import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { DocumentService } from '@/app/_common/lib/services/document-service'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import {
  calculateDocumentCompleteness,
  DOCUMENT_CATEGORIES
} from '@/app/_common/lib/utils/document-categories'
import { ClientService } from '@/app/_common/lib/services/client-service'
import type {
  DocumentsData,
  KYCStatusInfo,
  RiskProfileInfo,
  ComplianceInfo,
  Document,
  DocumentCategory,
  DocumentStatus
} from '@/app/_common/types/client360'

/**
 * Calculate KYC status from documents
 */
interface RawDocument {
  id: string
  type: string
  name: string
  uploadedAt?: string | Date
  createdAt?: string | Date
  checksum?: string
  fileSize?: number
  uploadedBy?: { firstName?: string; lastName?: string }
}

interface CompletenessData {
  missing: number
  totalRequired: number
  completed: number
  score: number
}

function calculateKYCStatus(documents: RawDocument[], completeness: CompletenessData): KYCStatusInfo {
  // Find KYC-related documents
  const kycDocTypes = DOCUMENT_CATEGORIES.KYC?.types.map(t => t.id) || []
  const kycDocs = documents.filter(d => kycDocTypes.includes(d.type))

  // Check for expired documents
  const now = new Date()
  const expiringDocuments: Document[] = []

  for (const doc of kycDocs) {
    const docType = DOCUMENT_CATEGORIES.KYC?.types.find(t => t.id === doc.type)
    if (docType?.expiryMonths && doc.uploadedAt) {
      const uploadDate = new Date(doc.uploadedAt)
      const expiryDate = new Date(uploadDate)
      expiryDate.setMonth(expiryDate.getMonth() + docType.expiryMonths)

      const daysUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      if (daysUntilExpiry <= 30) {
        expiringDocuments.push({
          id: doc.id,
          category: 'IDENTITE' as DocumentCategory,
          type: doc.type,
          name: doc.name,
          status: daysUntilExpiry < 0 ? 'EXPIRE' : 'VALID' as DocumentStatus,
          expirationDate: expiryDate.toISOString(),
          uploadDate: doc.uploadedAt instanceof Date ? doc.uploadedAt.toISOString() : doc.uploadedAt,
          metadata: {
            certifiedAt: doc.uploadedAt instanceof Date ? doc.uploadedAt.toISOString() : doc.uploadedAt,
            certifiedBy: doc.uploadedBy?.firstName ? `${doc.uploadedBy.firstName} ${doc.uploadedBy.lastName}` : 'System',
            hash: doc.checksum || '',
            size: doc.fileSize || 0
          }
        })
      }
    }
  }

  // Determine overall status
  let overall: 'VALID' | 'EXPIRE' | 'INCOMPLETE' = 'VALID'

  if (completeness.missing > 0) {
    overall = 'INCOMPLETE'
  } else if (expiringDocuments.some(d => d.status === 'EXPIRE')) {
    overall = 'EXPIRE'
  }

  // Find last update date
  const lastUpdate = kycDocs.length > 0
    ? kycDocs.reduce((latest, doc) => {
      const docDate = new Date(doc.uploadedAt || doc.createdAt)
      return docDate > latest ? docDate : latest
    }, new Date(0)).toISOString()
    : new Date().toISOString()

  return {
    overall,
    lastUpdate,
    expiringDocuments
  }
}

/**
 * Calculate risk profile from documents and client data
 */
function calculateRiskProfile(documents: RawDocument[], client: { riskProfile?: string; profilRisque?: string }): RiskProfileInfo {
  // Find risk profile questionnaire document
  const riskProfileDoc = documents.find(d =>
    d.type === 'PROFIL_RISQUE' || d.type === 'CONNAISSANCE_EXPERIENCE'
  )

  // Get client's risk profile if available
  const clientRiskProfile = client.riskProfile || client.profilRisque

  // Determine status
  let status: 'TERMINE' | 'EN_ATTENTE' | 'EXPIRE' = 'EN_ATTENTE'
  let score = 0
  let category = 'Non évalué'
  let lastAssessment = new Date().toISOString()

  if (riskProfileDoc) {
    const uploadDate = new Date(riskProfileDoc.uploadedAt || riskProfileDoc.createdAt)
    const now = new Date()
    const monthsSinceUpload = (now.getTime() - uploadDate.getTime()) / (1000 * 60 * 60 * 24 * 30)

    if (monthsSinceUpload > 12) {
      status = 'EXPIRE'
    } else {
      status = 'TERMINE'
    }

    lastAssessment = uploadDate.toISOString()
  }

  // Map client risk profile to score and category
  if (clientRiskProfile) {
    switch (clientRiskProfile.toLowerCase()) {
      case 'prudent':
      case 'conservative':
        score = 2
        category = 'Prudent'
        break
      case 'equilibre':
      case 'balanced':
      case 'moderate':
        score = 5
        category = 'Équilibré'
        break
      case 'dynamique':
      case 'dynamic':
      case 'growth':
        score = 7
        category = 'Dynamique'
        break
      case 'offensif':
      case 'aggressive':
        score = 9
        category = 'Offensif'
        break
      default:
        score = 5
        category = clientRiskProfile
    }

    if (status === 'EN_ATTENTE' && clientRiskProfile) {
      status = 'TERMINE'
    }
  }

  return {
    status,
    score,
    category,
    lastAssessment
  }
}

/**
 * Calculate compliance status from documents
 */
function calculateComplianceStatus(documents: RawDocument[]): ComplianceInfo {
  // Find LCB-FT related documents
  const lcbFtDocTypes = ['DECLARATION_BENEFICIAIRE', 'ORIGINE_FONDS', 'JUSTIF_REVENUS']
  const lcbFtDocs = documents.filter(d => lcbFtDocTypes.includes(d.type))

  // Find entry relation documents (compliance declarations)
  const entryRelationTypes = DOCUMENT_CATEGORIES.ENTREE_RELATION?.types.map(t => t.id) || []
  const entryDocs = documents.filter(d => entryRelationTypes.includes(d.type))

  // Build declarations list
  const declarations: { type: string; status: 'SIGNE' | 'EN_ATTENTE'; date: string }[] = []

  // Check for lettre de mission
  const lettreMission = documents.find(d => d.type === 'LETTRE_MISSION')
  declarations.push({
    type: 'Lettre de mission',
    status: lettreMission ? 'SIGNE' : 'EN_ATTENTE',
    date: (lettreMission?.uploadedAt instanceof Date ? lettreMission.uploadedAt.toISOString() : lettreMission?.uploadedAt) || new Date().toISOString()
  })

  // Check for declaration d'adequation
  const declarationAdequation = documents.find(d => d.type === 'DECLARATION_ADEQUATION')
  declarations.push({
    type: 'Déclaration d\'adéquation',
    status: declarationAdequation ? 'SIGNE' : 'EN_ATTENTE',
    date: (declarationAdequation?.uploadedAt instanceof Date ? declarationAdequation.uploadedAt.toISOString() : declarationAdequation?.uploadedAt) || new Date().toISOString()
  })

  // Check for beneficiaire effectif
  const beneficiaireEffectif = documents.find(d => d.type === 'DECLARATION_BENEFICIAIRE')
  declarations.push({
    type: 'Déclaration bénéficiaire effectif',
    status: beneficiaireEffectif ? 'SIGNE' : 'EN_ATTENTE',
    date: (beneficiaireEffectif?.uploadedAt instanceof Date ? beneficiaireEffectif.uploadedAt.toISOString() : beneficiaireEffectif?.uploadedAt) || new Date().toISOString()
  })

  // Determine LCB-FT status
  let lcbFtStatus: 'COMPLIANT' | 'EN_ATTENTE' | 'NON_COMPLIANT' = 'EN_ATTENTE'

  const requiredLcbFtDocs = ['DECLARATION_BENEFICIAIRE', 'JUSTIF_REVENUS']
  const hasAllRequired = requiredLcbFtDocs.every(type =>
    documents.some(d => d.type === type)
  )

  if (hasAllRequired && lettreMission && declarationAdequation) {
    lcbFtStatus = 'COMPLIANT'
  } else if (lcbFtDocs.length === 0 && !lettreMission) {
    lcbFtStatus = 'NON_COMPLIANT'
  }

  return {
    lcbFtStatus,
    declarations
  }
}

/**
 * Transform raw documents to Client360 Document format
 */
function transformDocuments(rawDocuments: RawDocument[]): Document[] {
  return rawDocuments.map(doc => {
    // Determine category based on document type
    let category: DocumentCategory = 'IDENTITE'

    for (const [catKey, catData] of Object.entries(DOCUMENT_CATEGORIES)) {
      if (catData.types.some(t => t.id === doc.type)) {
        switch (catKey) {
          case 'KYC':
          case 'ENTREE_RELATION':
            category = 'IDENTITE'
            break
          case 'PATRIMOINE':
          case 'FISCAL':
            category = 'PATRIMONY'
            break
          case 'RAPPORTS':
            category = 'RISK_PROFILE'
            break
          default:
            category = 'COMPLIANCE'
        }
        break
      }
    }

    // Determine status
    let status: DocumentStatus = 'VALID'
    const docTypeInfo = Object.values(DOCUMENT_CATEGORIES)
      .flatMap(c => c.types)
      .find(t => t.id === doc.type)

    if (docTypeInfo?.expiryMonths && doc.uploadedAt) {
      const uploadDate = new Date(doc.uploadedAt)
      const expiryDate = new Date(uploadDate)
      expiryDate.setMonth(expiryDate.getMonth() + docTypeInfo.expiryMonths)

      if (expiryDate < new Date()) {
        status = 'EXPIRE'
      }
    }

    return {
      id: doc.id,
      category,
      type: doc.type,
      name: doc.name,
      status,
      expirationDate: docTypeInfo?.expiryMonths && doc.uploadedAt
        ? new Date(new Date(doc.uploadedAt).setMonth(
          new Date(doc.uploadedAt).getMonth() + docTypeInfo.expiryMonths
        )).toISOString()
        : undefined,
      uploadDate: doc.uploadedAt instanceof Date ? doc.uploadedAt.toISOString() : (doc.uploadedAt || (doc.createdAt instanceof Date ? doc.createdAt.toISOString() : doc.createdAt)),
      metadata: {
        certifiedAt: doc.uploadedAt instanceof Date ? doc.uploadedAt.toISOString() : (doc.uploadedAt || (doc.createdAt instanceof Date ? doc.createdAt.toISOString() : doc.createdAt)),
        certifiedBy: doc.uploadedBy?.firstName
          ? `${doc.uploadedBy.firstName} ${doc.uploadedBy.lastName}`
          : 'System',
        hash: doc.checksum || '',
        size: doc.fileSize || 0
      }
    }
  })
}

/**
 * GET /api/advisor/clients/[id]/documents
 * Returns documents, KYC status, risk profile, and compliance information
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    const { id: clientId } = await params

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const documentService = new DocumentService(
      context.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    const clientService = new ClientService(
      context.cabinetId,
      user.id,
      user.role,
      context.isSuperAdmin
    )

    // Get client data
    const client = await clientService.getClientById(clientId, false)

    if (!client) {
      return createErrorResponse('Client not found', 404)
    }

    // Get client documents
    const rawDocuments = await documentService.getClientDocuments(clientId)

    // Calculate document completeness
    const clientPatrimoine = (client.wealth as any)?.netWealth || 0
    const completeness = calculateDocumentCompleteness(rawDocuments, clientPatrimoine)

    // Transform documents to Client360 format
    const documents = transformDocuments(rawDocuments)

    // Calculate KYC status
    const kycStatus = calculateKYCStatus(rawDocuments, completeness)

    // Calculate risk profile
    const riskProfile = calculateRiskProfile(rawDocuments, client)

    // Calculate compliance status
    const compliance = calculateComplianceStatus(rawDocuments)

    // Build response following DocumentsData interface
    const response: DocumentsData = {
      documents,
      kycStatus,
      riskProfile,
      compliance
    }

    return createSuccessResponse({
      ...response,
      completeness,
      externalSources: null
    })
  } catch (error: unknown) {
    console.error('Get client documents error:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }

    return createErrorResponse('Internal server error', 500)
  }
}

/**
 * POST /api/advisor/clients/[id]/documents
 * Upload a new document for a client with certified archiving metadata
 * Requirements: 10.4
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    const { id: clientId } = await params

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    // Parse multipart/form-data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const category = formData.get('category') as string

    if (!file || !type) {
      return createErrorResponse('File and type are required', 400)
    }

    // Generate certified archiving metadata
    const fileBuffer = await file.arrayBuffer()
    const hashBuffer = await crypto.subtle.digest('SHA-256', fileBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const checksum = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    // TODO: Upload file to storage (S3, Supabase Storage, etc.)
    // For now, we'll use a placeholder URL
    const fileUrl = `/uploads/${Date.now()}-${file.name}`
    const fileSize = file.size
    const mimeType = file.type

    const documentService = new DocumentService(
      context.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    // Create the document with certified archiving metadata
    const document = await documentService.createAndLinkDocument(
      {
        name: name || file.name,
        description: description || undefined,
        fileUrl,
        fileSize,
        mimeType,
        type: type as unknown as DocumentType,
        category: category as unknown as DocumentCategory,
        checksum,
        metadata: {
          certifiedAt: new Date().toISOString(),
          certifiedBy: `${user.firstName} ${user.lastName}`,
          originalFileName: file.name,
          uploadSource: 'client360'
        }
      },
      {
        documentId: '',
        entityType: 'client',
        entityId: clientId,
      }
    )

    return createSuccessResponse(document, 201)
  } catch (error: unknown) {
    console.error('Upload client document error:', error)

    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return createErrorResponse('Unauthorized', 401)
      }
      return createErrorResponse(error.message, 400)
    }

    return createErrorResponse('Internal server error', 500)
  }
}
