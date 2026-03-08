import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { PatrimoineDataService } from '@/app/_common/lib/services/patrimoine-data-service'
import { logger } from '@/app/_common/lib/logger'
/**
 * GET /api/advisor/clients/[id]/patrimoine
 * Returns complete patrimoine data for Client 360 TabPatrimoine
 * 
 * Requirements: 3.1, 4.1
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { user, cabinetId, isSuperAdmin } = context

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const { id } = await params
    
    const service = new PatrimoineDataService(cabinetId, user.id, isSuperAdmin)
    const patrimoineData = await service.getPatrimoineData(id)

    return createSuccessResponse(patrimoineData)
  } catch (error) {
    logger.error('Get client patrimoine error:', { error: error instanceof Error ? error.message : String(error) })

    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }

    if (error instanceof Error && error.message === 'Client not found') {
      return createErrorResponse('Client not found', 404)
    }

    return createErrorResponse('Internal server error', 500)
  }
}
