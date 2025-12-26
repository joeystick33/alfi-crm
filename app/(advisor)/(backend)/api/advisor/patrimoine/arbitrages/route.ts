 
import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { ArbitrageService } from '@/app/_common/lib/services/arbitrage-service'
import type { ArbitrageFilters, ArbitrageType, ArbitragePriority, ArbitrageStatus } from '@/app/_common/lib/api-types'

/**
 * GET /api/advisor/patrimoine/arbitrages
 * Récupère les suggestions d'arbitrages patrimoines
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
    
    const filters: ArbitrageFilters = {}

    if (searchParams.get('clientId')) {
      filters.clientId = searchParams.get('clientId')!
    }

    if (searchParams.get('types')) {
      filters.types = searchParams.get('types')!.split(',') as ArbitrageType[]
    }

    if (searchParams.get('priorities')) {
      filters.priorities = searchParams.get('priorities')!.split(',') as ArbitragePriority[]
    }

    if (searchParams.get('statuses')) {
      filters.statuses = searchParams.get('statuses')!.split(',') as ArbitrageStatus[]
    }

    if (searchParams.get('minAmount')) {
      filters.minAmount = parseFloat(searchParams.get('minAmount')!)
    }

    // Créer le service et générer les suggestions
    const arbitrageService = new ArbitrageService(
      context.cabinetId,
      user.id,
      user.role,
      context.isSuperAdmin
    )

    const arbitrages = await arbitrageService.generateSuggestions(filters)

    return createSuccessResponse(arbitrages)
  } catch (error: any) {
    console.error('Erreur GET /api/advisor/patrimoine/arbitrages:', error)
    return createErrorResponse(
      error.message || 'Erreur lors de la génération des arbitrages',
      error.status || 500
    )
  }
}
