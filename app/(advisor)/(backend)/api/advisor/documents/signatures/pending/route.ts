import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { SignatureService } from '@/app/_common/lib/services/signature-service'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { logger } from '@/app/_common/lib/logger'
/**
 * GET /api/advisor/documents/signatures/pending
 * Récupère la liste des documents avec des signatures en attente
 */
export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request); const { user } = context

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const signatureService = new SignatureService(
      context.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    const pendingSignatures = await signatureService.getPendingSignatures()

    // Utilise le wrapper standardisé { data, timestamp } attendu par le hook
    return createSuccessResponse(pendingSignatures)
  } catch (error) {
    logger.error('Error in GET /api/advisor/documents/signatures/pending:', { error: error instanceof Error ? error.message : String(error) })

    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }

    if (error instanceof Error) {
      return createErrorResponse(error.message, 400)
    }

    return createErrorResponse('Internal server error', 500)
  }
}
