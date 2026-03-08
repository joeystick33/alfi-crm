import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { KYCService } from '@/app/_common/lib/services/kyc-service'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { logger } from '@/app/_common/lib/logger'
/**
 * PATCH /api/clients/[id]/kyc/documents/[docId]
 * Valider un document KYC
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const context = await requireAuth(request); const { user } = context
    const { docId } = await params
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const body = await request.json()
    const { status, validatedBy, notes } = body

    if (!status) {
      return createErrorResponse('status is required', 400)
    }

    const service = new KYCService(
      context.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    const kycDocument = await service.validateKYCDocument({
      kycDocumentId: docId,
      status,
      validatedById: validatedBy || user.id,
    })

    return createSuccessResponse(kycDocument)
  } catch (error) {
    logger.error('Error in PATCH /api/clients/[id]/kyc/documents/[docId]:', { error: error instanceof Error ? error.message : String(error) })
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error && error.message.includes('not found')) {
      return createErrorResponse('KYC document not found', 404)
    }
    
    if (error instanceof Error) {
      return createErrorResponse(error.message, 400)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
