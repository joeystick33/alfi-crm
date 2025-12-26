 
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ScenarioService } from '@/app/_common/lib/services/scenario-service'
import { requireAuth } from '@/app/_common/lib/auth-helpers'

// Schéma validation mise à jour
const UpdateScenarioSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  trigger: z.enum([
    'NOUVEAU_CLIENT',
    'ANNIVERSAIRE',
    'DATE_ECHEANCE',
    'ACTION_CLIENT',
    'INACTIVITE',
    'MANUEL',
    'WEBHOOK',
  ]).optional(),
  triggerData: z.any().optional(),
  emailTemplateId: z.string().optional(),
  delayHours: z.number().int().min(0).max(8760).optional(),
  conditions: z.any().optional(),
  fromName: z.string().max(100).optional(),
  fromEmail: z.string().email().optional(),
  replyTo: z.string().email().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
})

/**
 * GET /api/advisor/scenarios/[id]
 * Obtenir un scénario par ID
 */
export async function GET(
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
    const scenario = await service.getScenarioById(scenarioId)

    return NextResponse.json(scenario)
  } catch (error: any) {
    console.error(`Erreur GET /api/advisor/scenarios/${scenarioId}:`, error)

    if (error.message === 'Scénario non trouvé') {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/advisor/scenarios/[id]
 * Mettre à jour un scénario
 */
export async function PATCH(
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
    const validated = UpdateScenarioSchema.parse(body)

    const service = new ScenarioService(cabinet.id, user.id, user.role === 'SUPER_ADMIN')
    const scenario = await service.updateScenario(scenarioId, validated)

    return NextResponse.json(scenario)
  } catch (error: any) {
    console.error(`Erreur PATCH /api/advisor/scenarios/${scenarioId}:`, error)

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

/**
 * DELETE /api/advisor/scenarios/[id]
 * Supprimer un scénario
 */
export async function DELETE(
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
    await service.deleteScenario(scenarioId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error(`Erreur DELETE /api/advisor/scenarios/${scenarioId}:`, error)

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
