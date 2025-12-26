 
import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { PerformanceService } from '@/app/_common/lib/services/performance-service'
import type { PerformanceFilters } from '@/app/_common/lib/api-types'

/**
 * GET /api/advisor/patrimoine/performance
 * Récupère les métriques de performance patrimoniale consolidée
 */
export async function GET(request: NextRequest) {
  try {
    // Authentification
    const context = await requireAuth(request)
    const { user } = context

    // Vérifier que l'utilisateur est valide
    if (!isRegularUser(user)) {
      return createErrorResponse('Type d\'utilisateur invalide', 400)
    }

    // Parser les query params pour les filtres
    const { searchParams } = new URL(request.url)
    
    const filters: PerformanceFilters = {}

    if (searchParams.get('clientId')) {
      filters.clientId = searchParams.get('clientId')!
    }

    if (searchParams.get('startDate')) {
      filters.startDate = searchParams.get('startDate')!
    }

    if (searchParams.get('endDate')) {
      filters.endDate = searchParams.get('endDate')!
    }

    if (searchParams.get('assetClasses')) {
      filters.assetClasses = searchParams.get('assetClasses')!.split(',')
    }

    if (searchParams.get('includeUnmanaged')) {
      filters.includeUnmanaged = searchParams.get('includeUnmanaged') === 'true'
    }

    // Créer le service et calculer la performance
    const performanceService = new PerformanceService(
      context.cabinetId,
      user.id,
      user.role,
      context.isSuperAdmin
    )

    const performance = await performanceService.calculatePerformance(filters)

    return createSuccessResponse(performance)
  } catch (error: any) {
    console.error('Erreur GET /api/advisor/patrimoine/performance:', error)
    return createErrorResponse(
      error.message || 'Erreur lors du calcul de la performance',
      error.status || 500
    )
  }
}
