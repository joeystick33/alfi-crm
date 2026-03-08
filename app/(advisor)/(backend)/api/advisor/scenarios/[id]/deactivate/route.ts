 
import { NextRequest, NextResponse } from 'next/server'
import { ScenarioService } from '@/app/_common/lib/services/scenario-service'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import { logger } from '@/app/_common/lib/logger'
/**
 * POST /api/advisor/scenarios/[id]/deactivate
 * Désactiver un scénario (ACTIF → INACTIF)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let scenarioId = ''
  try {
    const { user, cabinet } = await requireAuth(request)
    const { id } = await params
    scenarioId = id

    if (!user || !cabinet) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const service = new ScenarioService(cabinet.id, user.id, user.role === 'SUPER_ADMIN')
    const scenario = await service.deactivateScenario(scenarioId)

    return NextResponse.json(scenario)
  } catch (error: any) {
    logger.error(`Erreur POST /api/advisor/scenarios/${scenarioId}/deactivate:`, { error: error instanceof Error ? error.message : String(error) })

    if (error.message === 'Scénario non trouvé') {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 400 }
    )
  }
}
