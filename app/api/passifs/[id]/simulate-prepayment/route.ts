import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth-helpers'
import { PassifService } from '@/lib/services/passif-service'
import { isRegularUser } from '@/lib/auth-types'

/**
 * POST /api/passifs/[id]/simulate-prepayment
 * Simuler un remboursement anticipé
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
    const { prepaymentAmount, prepaymentDate } = body

    if (!prepaymentAmount || prepaymentAmount <= 0) {
      return createErrorResponse('Invalid prepayment amount', 400)
    }

    const service = new PassifService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    const simulation = await service.simulatePrepayment(
      params.id,
      prepaymentAmount,
      prepaymentDate ? new Date(prepaymentDate) : new Date()
    )

    return createSuccessResponse(simulation)
  } catch (error) {
    console.error('Error in POST /api/passifs/[id]/simulate-prepayment:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error && error.message.includes('not found')) {
      return createErrorResponse('Passif not found', 404)
    }
    
    if (error instanceof Error) {
      return createErrorResponse(error.message, 400)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
