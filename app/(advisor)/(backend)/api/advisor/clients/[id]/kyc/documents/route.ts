 
import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { KYCService } from '@/app/_common/lib/services/kyc-service'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { logger } from '@/app/_common/lib/logger'
/**
 * GET /api/clients/[id]/kyc/documents
 * Récupérer les documents KYC d'un client
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request); const { user } = context
    const { id: clientId } = await params
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const service = new KYCService(
      context.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    const documents = await service.getClientKYCDocuments(clientId)

    return createSuccessResponse({ data: documents })
  } catch (error: any) {
    logger.error('Error in GET /api/clients/[id]/kyc/documents:', { error: error instanceof Error ? error.message : String(error) })
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error && error.message.includes('not found')) {
      return createErrorResponse('Client not found', 404)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}

/**
 * POST /api/clients/[id]/kyc/documents
 * Ajouter un document KYC pour un client
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request); const { user } = context
    const { id: clientId } = await params
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const body = await request.json()
    const { type, documentId, expiresAt } = body

    if (!type || !documentId) {
      return createErrorResponse('type and documentId are required', 400)
    }

    const service = new KYCService(
      context.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    const kycDocument = await service.addKYCDocument({
      clientId,
      cabinetId: context.cabinetId,
      type,
      documentId,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    })

    return createSuccessResponse(kycDocument, 201)
  } catch (error: any) {
    logger.error('Error in POST /api/clients/[id]/kyc/documents:', { error: error instanceof Error ? error.message : String(error) })
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error) {
      return createErrorResponse(error.message, 400)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
