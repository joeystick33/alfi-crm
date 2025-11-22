import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/supabase/auth-helpers'
import { isRegularUser } from '@/lib/auth-types'
import { PatrimoineService } from '@/lib/services/patrimoine-service'

/**
 * GET /api/patrimoine/stats
 * Récupère les statistiques globales du patrimoine
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()

    if (!isRegularUser(user)) {
      return createErrorResponse('Accès non autorisé', 403)
    }

    const service = new PatrimoineService(
      user.cabinetId,
      user.id,
      (user as any).role ?? 'UNKNOWN',
      context.isSuperAdmin
    )

    const stats = await service.getCabinetStats()

    return createSuccessResponse(stats)
  } catch (error: any) {
    console.error('Erreur récupération stats patrimoine:', error)
    return createErrorResponse(
      error.message || 'Erreur lors de la récupération des statistiques',
      500
    )
  }
}
