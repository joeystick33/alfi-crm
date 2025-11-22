import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/supabase/auth-helpers'
import { RendezVousService } from '@/lib/services/rendez-vous-service'
import { isRegularUser } from '@/lib/auth-types'

/**
 * POST /api/rendez-vous/[id]/complete
 * Marquer un rendez-vous comme terminé
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const body = await request.json()
    const { notes } = body

    const service = new RendezVousService(
      user.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    const rendezvous = await service.completeRendezVous(params.id, notes)

    return createSuccessResponse(rendezvous)
  } catch (error: any) {
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
