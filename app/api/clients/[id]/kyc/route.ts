import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth-helpers'
import { KYCService } from '@/lib/services/kyc-service'
import { isRegularUser } from '@/lib/auth-types'

/**
 * GET /api/clients/[id]/kyc
 * Récupérer le statut KYC d'un client
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await requireAuth(request)
    
    if (!isRegularUser(context.user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const service = new KYCService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    const kycStatus = await service.checkKYCCompleteness(params.id)

    return createSuccessResponse(kycStatus)
  } catch (error) {
    console.error('Error in GET /api/clients/[id]/kyc:', error)
    
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
 * POST /api/clients/[id]/kyc
 * Vérifier la complétude KYC d'un client
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

    const service = new KYCService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    const kycStatus = await service.checkKYCCompleteness(params.id)

    return createSuccessResponse(kycStatus)
  } catch (error) {
    console.error('Error in POST /api/clients/[id]/kyc:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error && error.message.includes('not found')) {
      return createErrorResponse('Client not found', 404)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
