import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth-helpers'
import { RendezVousService } from '@/lib/services/rendez-vous-service'
import { isRegularUser } from '@/lib/auth-types'

/**
 * GET /api/rendez-vous
 * Liste des rendez-vous avec filtres
 */
export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    
    if (!isRegularUser(context.user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const { searchParams } = new URL(request.url)
    
    const filters = {
      status: searchParams.get('status') || undefined,
      type: searchParams.get('type') || undefined,
      conseillerId: searchParams.get('conseillerId') || undefined,
      clientId: searchParams.get('clientId') || undefined,
      startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
      endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
    }

    const service = new RendezVousService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    const rendezvous = await service.getRendezVous(filters)

    return createSuccessResponse(rendezvous)
  } catch (error) {
    console.error('Error in GET /api/rendez-vous:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}

/**
 * POST /api/rendez-vous
 * Créer un nouveau rendez-vous
 */
export async function POST(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    
    if (!isRegularUser(context.user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const body = await request.json()

    const service = new RendezVousService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    const rendezvous = await service.createRendezVous(body)

    return createSuccessResponse(rendezvous, 201)
  } catch (error) {
    console.error('Error in POST /api/rendez-vous:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error) {
      return createErrorResponse(error.message, 400)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
