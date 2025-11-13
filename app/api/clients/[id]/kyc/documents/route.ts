import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth-helpers'
import { KYCService } from '@/lib/services/kyc-service'
import { isRegularUser } from '@/lib/auth-types'

/**
 * POST /api/clients/[id]/kyc/documents
 * Ajouter un document KYC pour un client
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await requireAuth(request)
    
    if (!isRegularUser(context.user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const body = await request.json()
    const { type, documentId, expiresAt } = body

    if (!type || !documentId) {
      return createErrorResponse('type and documentId are required', 400)
    }

    const service = new KYCService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    const kycDocument = await service.addKYCDocument({
      clientId: params.id,
      type,
      documentId,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    })

    return createSuccessResponse(kycDocument, 201)
  } catch (error) {
    console.error('Error in POST /api/clients/[id]/kyc/documents:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error) {
      return createErrorResponse(error.message, 400)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
