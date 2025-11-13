import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth-helpers'
import { WealthCalculationService } from '@/lib/services/wealth-calculation'
import { isRegularUser } from '@/lib/auth-types'

/**
 * GET /api/clients/[id]/wealth
 * Récupère le patrimoine d'un client
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

    const wealthService = new WealthCalculationService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    const wealth = await wealthService.calculateClientWealth(params.id)

    return createSuccessResponse(wealth)
  } catch (error) {
    console.error('Get client wealth error:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}

/**
 * POST /api/clients/[id]/wealth/recalculate
 * Recalcule le patrimoine d'un client
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

    const wealthService = new WealthCalculationService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    const wealth = await wealthService.calculateClientWealth(params.id)

    return createSuccessResponse({
      wealth,
      message: 'Wealth recalculated successfully',
    })
  } catch (error) {
    console.error('Recalculate wealth error:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
