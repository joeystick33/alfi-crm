import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth-helpers'
import { TimelineService } from '@/lib/services/timeline-service'
import { isRegularUser } from '@/lib/auth-types'

/**
 * GET /api/clients/[id]/timeline
 * Récupérer la timeline d'un client
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

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || undefined
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50

    const service = new TimelineService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    const timeline = await service.getClientTimeline(params.id, type as any, limit)

    return createSuccessResponse(timeline)
  } catch (error) {
    console.error('Error in GET /api/clients/[id]/timeline:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error && error.message.includes('not found')) {
      return createErrorResponse('Client not found', 404)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
