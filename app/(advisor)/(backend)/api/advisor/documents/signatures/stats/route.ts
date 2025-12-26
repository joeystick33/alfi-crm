import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, createErrorResponse } from '@/app/_common/lib/auth-helpers'
import { SignatureService } from '@/app/_common/lib/services/signature-service'
import { isRegularUser } from '@/app/_common/lib/auth-types'

/**
 * GET /api/advisor/documents/signatures/stats
 * Récupère les statistiques globales des workflows de signature
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

    const stats = await signatureService.getSignatureStats()

    // Retourne directement l'objet de stats (sans wrapper data)
    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error in GET /api/advisor/documents/signatures/stats:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }

    if (error instanceof Error) {
      return createErrorResponse(error.message, 400)
    }

    return createErrorResponse('Internal server error', 500)
  }
}
