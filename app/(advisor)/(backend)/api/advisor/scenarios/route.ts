 
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ScenarioService } from '@/app/_common/lib/services/scenario-service'
import { requireAuth } from '@/app/_common/lib/auth-helpers'

// Schéma validation création scénario
const CreateScenarioSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(200, 'Le nom est trop long'),
  description: z.string().max(2000, 'La description est trop longue').optional(),
  trigger: z.enum([
    'NOUVEAU_CLIENT',
    'ANNIVERSAIRE',
    'DATE_ECHEANCE',
    'ACTION_CLIENT',
    'INACTIVITE',
    'MANUEL',
    'WEBHOOK',
  ], { message: 'Le déclencheur est requis' }),
  triggerData: z.any().optional(),
  emailTemplateId: z.string().optional(),
  delayHours: z.number().int().min(0, 'Le délai doit être positif').max(8760, 'Le délai maximum est 365 jours').optional(),
  conditions: z.any().optional(),
  fromName: z.string().max(100, 'Le nom expéditeur est trop long').optional(),
  fromEmail: z.string().email('Email invalide').optional(),
  replyTo: z.string().email('Email de réponse invalide').optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
})

// Schéma validation filtres
const ScenarioFiltersSchema = z.object({
  status: z.enum(['ACTIF', 'INACTIF', 'ARCHIVE']).optional(),
  trigger: z.enum([
    'NOUVEAU_CLIENT',
    'ANNIVERSAIRE',
    'DATE_ECHEANCE',
    'ACTION_CLIENT',
    'INACTIVITE',
    'MANUEL',
    'WEBHOOK',
  ]).optional(),
  createdBy: z.string().optional(),
  search: z.string().optional(),
  tags: z.array(z.string()).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  sortBy: z.enum(['createdAt', 'name', 'executionCount', 'lastExecutedAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
})

/**
 * GET /api/advisor/scenarios
 * Liste des scénarios avec filtres
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

    if (searchParams.get('status')) filters.status = searchParams.get('status')
    if (searchParams.get('trigger')) filters.trigger = searchParams.get('trigger')
    if (searchParams.get('createdBy')) filters.createdBy = searchParams.get('createdBy')
    if (searchParams.get('search')) filters.search = searchParams.get('search')
    if (searchParams.get('tags')) {
      filters.tags = searchParams.get('tags')!.split(',')
    }
    if (searchParams.get('limit')) filters.limit = searchParams.get('limit')
    if (searchParams.get('offset')) filters.offset = searchParams.get('offset')
    if (searchParams.get('sortBy')) filters.sortBy = searchParams.get('sortBy')
    if (searchParams.get('sortOrder')) filters.sortOrder = searchParams.get('sortOrder')

    // Validation
    const validatedFilters = ScenarioFiltersSchema.parse(filters)

    const service = new ScenarioService(cabinet.id, user.id, user.role === 'SUPER_ADMIN')
    const result = await service.listScenarios(validatedFilters)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Erreur GET /api/advisor/scenarios:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/advisor/scenarios
 * Créer un nouveau scénario
 */
export async function POST(request: NextRequest) {
  try {
    const { user, cabinet } = await requireAuth(request)

    if (!user || !cabinet) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validated = CreateScenarioSchema.parse(body)

    const service = new ScenarioService(cabinet.id, user.id, user.role === 'SUPER_ADMIN')
    const scenario = await service.createScenario(validated)

    return NextResponse.json(scenario, { status: 201 })
  } catch (error: any) {
    console.error('Erreur POST /api/advisor/scenarios:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}
