import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { DossierService } from '@/app/_common/lib/services/dossier-service'

/**
 * POST /api/advisor/dossiers/[id]/activate
 * Activer un dossier (BROUILLON → ACTIF)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    const { id } = await params
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    if (!id) {
      return createErrorResponse('Missing dossier ID', 400)
    }

    const service = new DossierService(
      context.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    const dossier = await service.activateDossier(id)

    return createSuccessResponse({
      ...dossier,
      message: 'Dossier activé avec succès',
    })
  } catch (error) {
    console.error('Error in POST /api/advisor/dossiers/[id]/activate:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error) {
      return createErrorResponse(error.message, 400)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
