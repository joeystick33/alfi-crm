import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth-helpers'
import { ProjetService } from '@/lib/services/projet-service'
import { isRegularUser } from '@/lib/auth-types'

/**
 * GET /api/projets
 * Liste des projets avec filtres
 */
export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    
    if (!isRegularUser(context.user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const { searchParams } = new URL(request.url)
    
    const filters = {
      type: searchParams.get('type') || undefined,
      status: searchParams.get('status') || undefined,
      clientId: searchParams.get('clientId') || undefined,
    }

    const service = new ProjetService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    const projets = await service.listProjets(filters)

    return createSuccessResponse(projets)
  } catch (error) {
    console.error('Error in GET /api/projets:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}

/**
 * POST /api/projets
 * Créer un nouveau projet
 */
export async function POST(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    
    if (!isRegularUser(context.user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const body = await request.json()

    const service = new ProjetService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    const projet = await service.createProjet(body)

    return createSuccessResponse(projet, 201)
  } catch (error) {
    console.error('Error in POST /api/projets:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error) {
      return createErrorResponse(error.message, 400)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
