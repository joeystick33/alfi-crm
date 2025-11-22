import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse, checkPermission } from '@/lib/supabase/auth-helpers'
import { ProjetService } from '@/lib/services/projet-service'
import { isRegularUser } from '@/lib/auth-types'
import { parseProjetFilters, normalizeProjetCreatePayload } from './utils'

/**
 * GET /api/projets
 * Liste des projets avec filtres
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const { searchParams } = new URL(request.url)
    const filters = parseProjetFilters(searchParams)

    const service = new ProjetService(
      user.cabinetId,
      user.id,
      user.role,
      context.isSuperAdmin
    )

    const projets = await service.getProjets(filters)

    return createSuccessResponse(projets)
  } catch (error: any) {
    console.error('Error in GET /api/projets:', error)
    
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
 * POST /api/projets
 * Créer un nouveau projet
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    // Check permission for projet creation
    if (!checkPermission(context, 'canManageProjets')) {
      return createErrorResponse('Permission denied: canManageProjets', 403)
    }

    const body = await request.json()
    const payload = normalizeProjetCreatePayload(body)

    const service = new ProjetService(
      user.cabinetId,
      user.id,
      user.role,
      context.isSuperAdmin
    )

    const projet = await service.createProjet(payload)

    return createSuccessResponse(projet, 201)
  } catch (error: any) {
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
