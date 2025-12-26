 
import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { PatrimoineService } from '@/app/_common/lib/services/patrimoine-service'

/**
 * GET /api/patrimoine/stats
 * Récupère les statistiques du patrimoine (global ou par client)
 * Query params:
 * - clientId: (optionnel) ID du client pour stats individuelles
 */
export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    const { user } = context

    if (!isRegularUser(user)) {
      return createErrorResponse('Accès non autorisé', 403)
    }

    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')

    const service = new PatrimoineService(
      context.cabinetId,
      user.id,
      (user as any).role ?? 'UNKNOWN',
      context.isSuperAdmin
    )

    // Si clientId fourni, retourner les stats du client
    if (clientId) {
      const wealth = await service.calculateClientWealth(clientId)
      return createSuccessResponse({
        patrimoineNet: wealth.netWealth,
        patrimoineGere: wealth.managedAssets,
        patrimoineNonGere: wealth.unmanagedAssets,
        totalActifs: wealth.totalActifs,
        totalPassifs: wealth.totalPassifs,
        totalNet: wealth.netWealth,
        totalGere: wealth.managedAssets,
        allocationByCategory: wealth.actifsByCategory,
        allocationByType: wealth.actifsByType,
        passifsByType: wealth.passifsByType,
        allocationPercentages: wealth.allocationPercentages,
        lastCalculated: wealth.lastCalculated,
      })
    }

    // Sinon, retourner les stats globales du cabinet
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
