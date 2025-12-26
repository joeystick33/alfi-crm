import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, createErrorResponse } from '@/app/_common/lib/auth-helpers'
import { DocumentService } from '@/app/_common/lib/services/document-service'
import { isRegularUser } from '@/app/_common/lib/auth-types'

/**
 * GET /api/advisor/documents/stats
 * Récupère les statistiques globales des documents (GED)
 */
export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request); const { user } = context

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const documentService = new DocumentService(
      context.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    const stats = await documentService.getDocumentStats()

    // Retourne directement l'objet de stats (sans wrapper data)
    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error in GET /api/advisor/documents/stats:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }

    if (error instanceof Error) {
      return createErrorResponse(error.message, 400)
    }

    return createErrorResponse('Internal server error', 500)
  }
}
