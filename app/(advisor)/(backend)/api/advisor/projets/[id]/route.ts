 
import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse, checkPermission } from '@/app/_common/lib/auth-helpers'
import { ProjetService } from '@/app/_common/lib/services/projet-service'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { normalizeProjetUpdatePayload } from '../utils'

/**
 * GET /api/projets/[id]
 * Récupère un projet par ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request); const { user } = context
    const { id: projetId } = await params
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const { searchParams } = new URL(request.url)
    const includeRelations = searchParams.get('include') === 'true'

    const projetService = new ProjetService(
      context.cabinetId,
      user.id,
      user.role,
      context.isSuperAdmin
    )

    const projet = await projetService.getProjetById(projetId, includeRelations)

    if (!projet) {
      return createErrorResponse('Projet not found', 404)
    }

    return createSuccessResponse(projet)
  } catch (error: any) {
    console.error('Error in GET /api/projets/[id]:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}

/**
 * PATCH /api/projets/[id]
 * Met à jour un projet
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request); const { user } = context
    const { id: projetId } = await params
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const body = await request.json()
    const payload = normalizeProjetUpdatePayload(body)

    const projetService = new ProjetService(
      context.cabinetId,
      user.id,
      user.role,
      context.isSuperAdmin
    )

    const projet = await projetService.updateProjet(projetId, payload)

    return createSuccessResponse(projet)
  } catch (error: any) {
    console.error('Error in PATCH /api/projets/[id]:', error)
    
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return createErrorResponse('Unauthorized', 401)
      }
      return createErrorResponse(error.message, 400)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}

/**
 * DELETE /api/projets/[id]
 * Supprime un projet
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request); const { user } = context
    const { id: projetId } = await params
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    // Check permission for projet deletion
    if (!checkPermission(context, 'canDeleteProjets')) {
      return createErrorResponse('Permission denied: canDeleteProjets', 403)
    }

    const projetService = new ProjetService(
      context.cabinetId,
      user.id,
      user.role,
      context.isSuperAdmin
    )

    await projetService.deleteProjet(projetId)

    return createSuccessResponse({ success: true })
  } catch (error: any) {
    console.error('Error in DELETE /api/projets/[id]:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error) {
      return createErrorResponse(error.message, 400)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
