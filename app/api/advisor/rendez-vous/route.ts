import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/supabase/auth-helpers'
import { RendezVousService } from '@/lib/services/rendez-vous-service'
import { isRegularUser } from '@/lib/auth-types'
import { parseRendezVousFilters } from './utils'

/**
 * GET /api/rendez-vous
 * Liste des rendez-vous avec filtres
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const { searchParams } = new URL(request.url)
    const filters = parseRendezVousFilters(searchParams)

    const service = new RendezVousService(
      user.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    const rendezvous = await service.getRendezVous(filters)

    return createSuccessResponse(rendezvous)
  } catch (error: any) {
    console.error('Error in GET /api/rendez-vous:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error) {
      return createErrorResponse(error.message, 400)
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
    const user = await requireAuth()
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const body = await request.json()
    const { normalizeRendezVousCreatePayload } = await import('./utils')
    const payload = normalizeRendezVousCreatePayload(body)

    const service = new RendezVousService(
      user.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    const rendezvous = await service.createRendezVous(payload)

    return createSuccessResponse(rendezvous, 201)
  } catch (error: any) {
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
