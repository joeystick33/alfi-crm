import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { DossierService } from '@/app/_common/lib/services/dossier-service'

/**
 * POST /api/advisor/dossiers/[id]/start
 * Démarrer un dossier (ACTIF → EN_COURS)
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

    const service = new DossierService(context.cabinetId, user.id, context.isSuperAdmin)
    const dossier = await service.startDossier(id)

    return createSuccessResponse({ ...dossier, message: 'Dossier démarré' })
  } catch (error) {
    console.error('Error in POST /api/advisor/dossiers/[id]/start:', error)
    if (error instanceof Error) {
      return createErrorResponse(error.message, error.message === 'Unauthorized' ? 401 : 400)
    }
    return createErrorResponse('Internal server error', 500)
  }
}
