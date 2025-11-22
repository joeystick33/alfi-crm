import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/supabase/auth-helpers'
import { WealthCalculationService } from '@/lib/services/wealth-calculation'
import { isRegularUser } from '@/lib/auth-types'

/**
 * GET /api/clients/[id]/wealth
 * Récupère le patrimoine d'un client
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const { id } = await params

    const wealthService = new WealthCalculationService(
      user.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    const wealth = await wealthService.calculateClientWealth(id)

    return createSuccessResponse(wealth)
  } catch (error: any) {
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const { id } = await params

    const wealthService = new WealthCalculationService(
      user.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    const wealth = await wealthService.calculateClientWealth(id)

    return createSuccessResponse({
      wealth,
      message: 'Wealth recalculated successfully',
    })
  } catch (error: any) {
    console.error('Recalculate wealth error:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
