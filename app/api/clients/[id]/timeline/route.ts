import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth-helpers'
import { ClientService } from '@/lib/services/client-service'
import { isRegularUser } from '@/lib/auth-types'
import { TimelineEventType } from '@prisma/client'

/**
 * GET /api/clients/[id]/timeline
 * Récupère la timeline d'un client
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
    const limit = parseInt(searchParams.get('limit') || '50')

    const clientService = new ClientService(
      context.cabinetId,
      context.user.id,
      context.user.role,
      context.isSuperAdmin
    )

    const events = await clientService.getClientTimeline(params.id, limit)

    return createSuccessResponse(events)
  } catch (error) {
    console.error('Get timeline error:', error)
    
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
  { params }: { params: { id: string } }
) {
  try {
    const context = await requireAuth(request)
    
    if (!isRegularUser(context.user)) {
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

    const clientService = new ClientService(
      context.cabinetId,
      context.user.id,
      context.user.role,
      context.isSuperAdmin
    )

    // Verify client exists
    const client = await clientService.getClientById(params.id)
    if (!client) {
      return createErrorResponse('Client not found', 404)
    }

    // Create timeline event using Prisma directly
    const { getPrismaClient, setRLSContext } = await import('@/lib/prisma')
    const prisma = getPrismaClient(context.cabinetId, context.isSuperAdmin)
    await setRLSContext(context.cabinetId, context.isSuperAdmin)

    const event = await prisma.timelineEvent.create({
      data: {
        clientId: params.id,
        type,
        title,
        description,
        relatedEntityType,
        relatedEntityId,
        createdBy: context.user.id,
      },
    })

    return createSuccessResponse(event)
  } catch (error) {
    console.error('Create timeline event error:', error)
    
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return createErrorResponse('Unauthorized', 401)
      }
      return createErrorResponse(error.message, 400)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
