 
import { NextRequest, NextResponse } from 'next/server'
import { ScenarioService } from '@/app/_common/lib/services/scenario-service'
import { requireAuth } from '@/app/_common/lib/auth-helpers'

/**
 * GET /api/advisor/scenarios/stats
 * Obtenir les statistiques globales des scénarios
 */
export async function GET(request: NextRequest) {
  try {
    const { user, cabinet } = await requireAuth(request)

    if (!user || !cabinet) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Parser query params
    const { searchParams } = new URL(request.url)
    const filters: any = {}

    if (searchParams.get('trigger')) filters.trigger = searchParams.get('trigger')
    if (searchParams.get('createdBy')) filters.createdBy = searchParams.get('createdBy')

    const service = new ScenarioService(cabinet.id, user.id, user.role === 'SUPER_ADMIN')
    const stats = await service.getScenarioStats(filters)

    return NextResponse.json(stats)
  } catch (error: any) {
    console.error('Erreur GET /api/advisor/scenarios/stats:', error)

    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}
