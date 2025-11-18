import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth-helpers'
import { KYCService } from '@/lib/services/kyc-service'
import { isRegularUser } from '@/lib/auth-types'

/**
 * PATCH /api/clients/[id]/kyc/documents/[docId]
 * Valider un document KYC
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; docId: string } }
) {
  try {
    const context = await requireAuth(request)
    
    if (!isRegularUser(context.user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const body = await request.json()
    const { status, validatedBy, notes } = body

    if (!status) {
      return createErrorResponse('status is required', 400)
    }

    const service = new KYCService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    const kycDocument = await service.validateKYCDocument({
      kycDocumentId: params.docId,
      status,
      validatedBy: validatedBy || context.user.id,
    })

    return createSuccessResponse(kycDocument)
  } catch (error: any) {
    console.error('Error in PATCH /api/clients/[id]/kyc/documents/[docId]:', error)
    
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
