import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { EntretienService } from '@/app/_common/lib/services/entretien-service'
import { logger } from '@/app/_common/lib/logger'
export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    if (!isRegularUser(user)) return createErrorResponse('Invalid user type', 400)

    const service = new EntretienService(context.cabinetId, user.id, context.isSuperAdmin)
    const stats = await service.getStats({ conseillerId: user.id })
    return createSuccessResponse(stats)
  } catch (error) {
    logger.error('Error in GET /api/advisor/entretiens/stats:', { error: error instanceof Error ? error.message : String(error) })
    if (error instanceof Error && error.message === 'Unauthorized') return createErrorResponse('Unauthorized', 401)
    return createErrorResponse('Internal server error', 500)
  }
}
