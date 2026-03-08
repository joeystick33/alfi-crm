 
import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { ClientService } from '@/app/_common/lib/services/client-service'
import { TimelineService } from '@/app/_common/lib/services/timeline-service'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { TimelineEventType } from '@prisma/client'
import { logger } from '@/app/_common/lib/logger'
/**
 * GET /api/clients/[id]/timeline
 * Récupère la timeline d'un client
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request); const { user } = context
    const { id: clientId } = await params

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')

    const clientService = new ClientService(
      context.cabinetId,
      user.id,
      user.role,
      context.isSuperAdmin
    )

    const events = await clientService.getClientTimeline(clientId, limit)

    return createSuccessResponse(events)
  } catch (error: any) {
    logger.error('Get timeline error:', { error: error instanceof Error ? error.message : String(error) })

    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }

    return createErrorResponse('Internal server error', 500)
  }
}

/**
 * POST /api/clients/[id]/timeline
 * Crée un nouvel événement dans la timeline
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request); const { user } = context
    const { id: clientId } = await params

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const body = await request.json()
    const { type, title, description, relatedEntityType, relatedEntityId } = body

    if (!type || !title) {
      return createErrorResponse('Type and title are required', 400)
    }

    // Validate type
    const validTypes: TimelineEventType[] = [
      'CLIENT_CREATED',
      'MEETING_HELD',
      'DOCUMENT_SIGNED',
      'ASSET_ADDED',
      'GOAL_ACHIEVED',
      'CONTRACT_SIGNED',
      'KYC_UPDATED',
      'SIMULATION_SHARED',
      'EMAIL_SENT',
      'OPPORTUNITY_CONVERTED',
      'OTHER',
    ]

    if (!validTypes.includes(type)) {
      return createErrorResponse('Invalid event type', 400)
    }

    const timelineService = new TimelineService(
      context.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    // Verify client exists (Service usually handles this, but good to check if service doesn't)
    // TimelineService.createEvent checks for client existence.

    const event = await timelineService.createEvent({
      clientId,
      type,
      title,
      description,
      relatedEntityType,
      relatedEntityId,
    })

    return createSuccessResponse(event)
  } catch (error: any) {
    logger.error('Create timeline event error:', { error: error instanceof Error ? error.message : String(error) })

    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return createErrorResponse('Unauthorized', 401)
      }
      return createErrorResponse(error.message, 400)
    }

    return createErrorResponse('Internal server error', 500)
  }
}
