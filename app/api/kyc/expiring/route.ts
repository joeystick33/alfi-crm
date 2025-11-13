import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth-helpers'
import { KYCService } from '@/lib/services/kyc-service'
import { isRegularUser } from '@/lib/auth-types'

/**
 * GET /api/kyc/expiring
 * Récupérer les documents KYC expirant bientôt
 */
export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    
    if (!isRegularUser(context.user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const { searchParams } = new URL(request.url)
    const daysAhead = searchParams.get('daysAhead') 
      ? parseInt(searchParams.get('daysAhead')!) 
      : 30 // Par défaut 30 jours

    const service = new KYCService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    const expiringDocuments = await service.getExpiringDocuments(daysAhead)

    return createSuccessResponse(expiringDocuments)
  } catch (error) {
    console.error('Error in GET /api/kyc/expiring:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
