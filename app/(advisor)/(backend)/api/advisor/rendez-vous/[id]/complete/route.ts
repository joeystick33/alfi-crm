import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { RendezVousService } from '@/app/_common/lib/services/rendez-vous-service'
import { isRegularUser } from '@/app/_common/lib/auth-types'

/**
 * POST /api/rendez-vous/[id]/complete
 * Marquer un rendez-vous comme terminé
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request); const { user } = context
    const { id: rdvId } = await params
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const body = await request.json()
    const { notes } = body

    const service = new RendezVousService(
      context.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    const rendezvous = await service.completeRendezVous(rdvId, notes)

    return createSuccessResponse(rendezvous)
  } catch (error) {
    console.error('Error in POST /api/rendez-vous/[id]/complete:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error && error.message.includes('not found')) {
      return createErrorResponse('Rendez-vous not found', 404)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
