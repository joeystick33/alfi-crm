 
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ScenarioService } from '@/app/_common/lib/services/scenario-service'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import { logger } from '@/app/_common/lib/logger'
// Schéma validation exécution
const ExecuteScenarioSchema = z.object({
  clientIds: z.array(z.string()).min(1, 'Au moins un client est requis'),
})

/**
 * POST /api/advisor/scenarios/[id]/execute
 * Exécuter manuellement un scénario pour plusieurs clients
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

    const body = await request.json()
    const { clientIds } = ExecuteScenarioSchema.parse(body)

    const service = new ScenarioService(cabinet.id, user.id, user.role === 'SUPER_ADMIN')
    const result = await service.executeScenarioForClients(scenarioId, clientIds)

    return NextResponse.json(result)
  } catch (error: any) {
    logger.error(`Erreur POST /api/advisor/scenarios/${scenarioId}/execute:`, { error: error instanceof Error ? error.message : String(error) })

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      )
    }

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
