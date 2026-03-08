import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { ObjectivesDataService } from '@/app/_common/lib/services/objectives-data-service'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { logger } from '@/app/_common/lib/logger'
/**
 * GET /api/advisor/clients/[id]/objectives
 * 
 * Retrieves combined objectives data for the Client360 TabObjectifs:
 * - Objectives with progress tracking
 * - Projects with milestones and risks
 * - Timeline events related to objectives and projects
 * - Statistics and KPIs
 * 
 * Requirements: 11.1, 11.2
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    const { id: clientId } = await params

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const objectivesDataService = new ObjectivesDataService(
      context.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    const data = await objectivesDataService.getObjectivesData(clientId)

    return createSuccessResponse(data)
  } catch (error) {
    logger.error('Get objectives data error:', { error: error instanceof Error ? error.message : String(error) })

    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }

    return createErrorResponse('Internal server error', 500)
  }
}
