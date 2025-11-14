import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth-helpers'
import { SimulationService } from '@/lib/services/simulation-service'
import { AuditService } from '@/lib/services/audit-service'
import { SimulationType, SimulationStatus } from '@prisma/client'
import { isRegularUser } from '@/lib/auth-types'

/**
 * GET /api/simulations
 * Récupérer les simulations avec filtres optionnels
 */
export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request)

    if (!isRegularUser(context.user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId') || undefined
    const type = searchParams.get('type') as SimulationType | undefined
    const status = searchParams.get('status') as SimulationStatus | undefined
    const search = searchParams.get('search') || undefined

    const simulationService = new SimulationService(
      context.user.cabinetId,
      context.user.id,
      false
    )

    const simulations = await simulationService.getSimulations({
      clientId,
      type,
      status,
      search,
    })

    return createSuccessResponse(simulations)
  } catch (error: any) {
    console.error('Error fetching simulations:', error)
    return createErrorResponse(
      error.message || 'Erreur lors de la récupération des simulations',
      500
    )
  }
}

/**
 * POST /api/simulations
 * Créer une nouvelle simulation
 */
export async function POST(request: NextRequest) {
  try {
    const context = await requireAuth(request)

    if (!isRegularUser(context.user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const body = await request.json()

    // Validation des champs requis
    if (!body.clientId || !body.type || !body.name || !body.parameters || !body.results) {
      return createErrorResponse(
        'Champs requis manquants: clientId, type, name, parameters, results',
        400
      )
    }

    const simulationService = new SimulationService(
      context.user.cabinetId,
      context.user.id,
      false
    )

    const simulation = await simulationService.createSimulation({
      clientId: body.clientId,
      type: body.type,
      name: body.name,
      description: body.description,
      parameters: body.parameters,
      results: body.results,
      recommendations: body.recommendations,
      feasibilityScore: body.feasibilityScore,
      sharedWithClient: body.sharedWithClient,
    })

    // Audit log
    const auditService = new AuditService(
      context.user.cabinetId,
      context.user.id,
      false
    )

    await auditService.createAuditLog({
      action: 'CREATE',
      entityType: 'Simulation',
      entityId: simulation.id,
      changes: {
        clientId: body.clientId,
        type: body.type,
        name: body.name,
      },
    })

    return createSuccessResponse(simulation, 201)
  } catch (error: any) {
    console.error('Error creating simulation:', error)
    return createErrorResponse(
      error.message || 'Erreur lors de la création de la simulation',
      500
    )
  }
}
