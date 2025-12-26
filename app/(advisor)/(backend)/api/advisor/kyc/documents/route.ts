 
import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { KYCService } from '@/app/_common/lib/services/kyc-service'
import { z } from 'zod'

// Schéma de validation pour créer un document KYC
const createKYCDocumentSchema = z.object({
  clientId: z.string().cuid(),
  type: z.enum([
    'IDENTITE',
    'JUSTIFICATIF_DOMICILE',
    'AVIS_IMPOSITION',
    'RIB_BANCAIRE',
    'JUSTIFICATIF_PATRIMOINE',
    'ORIGINE_FONDS',
    'AUTRE',
  ]),
  documentId: z.string().cuid().optional(),
  fileName: z.string().optional(),
  fileUrl: z.string().url().optional(),
  expiresAt: z.string().datetime().optional(),
  notes: z.string().optional(),
})

// Schéma de validation pour les filtres
const kycDocumentFiltersSchema = z.object({
  clientId: z.string().cuid().optional(),
  status: z.enum(['EN_ATTENTE', 'VALIDE', 'REJETE', 'EXPIRE']).optional(),
  type: z.enum([
    'IDENTITE',
    'JUSTIFICATIF_DOMICILE',
    'AVIS_IMPOSITION',
    'RIB_BANCAIRE',
    'JUSTIFICATIF_PATRIMOINE',
    'ORIGINE_FONDS',
    'AUTRE',
  ]).optional(),
  expiresAfter: z.string().datetime().optional(),
  expiresBefore: z.string().datetime().optional(),
})

/**
 * GET /api/advisor/kyc/documents
 * Liste les documents KYC avec filtres
 */
export async function GET(req: NextRequest) {
  try {
    const context = await requireAuth(req)
    const { user } = context

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const { searchParams } = new URL(req.url)
    const filters: any = {}

    if (searchParams.get('clientId')) filters.clientId = searchParams.get('clientId')
    if (searchParams.get('status')) filters.status = searchParams.get('status')
    if (searchParams.get('type')) filters.type = searchParams.get('type')
    if (searchParams.get('expiresAfter')) filters.expiresAfter = new Date(searchParams.get('expiresAfter')!)
    if (searchParams.get('expiresBefore')) filters.expiresBefore = new Date(searchParams.get('expiresBefore')!)

    // Valider les filtres
    const validatedFilters = kycDocumentFiltersSchema.parse(filters)

    const service = new KYCService(
      context.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    // Si clientId fourni, utiliser getClientKYCDocuments
    if (validatedFilters.clientId) {
      const documents = await service.getClientKYCDocuments(validatedFilters.clientId)
      return createSuccessResponse(documents)
    }

    // Sinon, retourner erreur demandant le clientId
    return createErrorResponse('clientId parameter is required', 400)
  } catch (error: any) {
    console.error('Error fetching KYC documents:', error)
    
    if (error instanceof z.ZodError) {
      return createErrorResponse(`Validation error: ${JSON.stringify(error.issues)}`, 400)
    }

    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }

    return createErrorResponse('Internal server error', 500)
  }
}

/**
 * POST /api/advisor/kyc/documents
 * Crée un nouveau document KYC
 */
export async function POST(req: NextRequest) {
  try {
    const context = await requireAuth(req)
    const { user } = context

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const body = await req.json()
    const validatedData = createKYCDocumentSchema.parse(body)

    const service = new KYCService(
      context.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    const document = await service.addKYCDocument({
      cabinetId: context.cabinetId,
      clientId: validatedData.clientId,
      type: validatedData.type,
      documentId: validatedData.documentId,
      fileName: validatedData.fileName,
      fileUrl: validatedData.fileUrl,
      expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : undefined,
      notes: validatedData.notes,
    })

    return createSuccessResponse(document, 201)
  } catch (error: any) {
    console.error('Error creating KYC document:', error)
    
    if (error instanceof z.ZodError) {
      return createErrorResponse(`Validation error: ${JSON.stringify(error.issues)}`, 400)
    }

    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }

    return createErrorResponse('Internal server error', 500)
  }
}
