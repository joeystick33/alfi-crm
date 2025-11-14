import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth-helpers'
import { SimulationService } from '@/lib/services/simulation-service'
import { AuditService } from '@/lib/services/audit-service'
import { isRegularUser } from '@/lib/auth-types'

/**
 * GET /api/simulations/[id]
 * Récupérer une simulation par ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await requireAuth(request)

    if (!isRegularUser(context.user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const simulationService = new SimulationService(
      context.user.cabinetId,
      context.user.id,
      false
    )

    const simulation = await simulationService.getSimulationById(params.id)

    if (!simulation) {
      return createErrorResponse('Simulation non trouvée', 404)
    }

    return createSuccessResponse(simulation)
  } catch (error: any) {
    console.error('Error fetching simulation:', error)
    return createErrorResponse(
      error.message || 'Erreur lors de la récupération de la simulation',
      500
    )
  }
}

/**
 * PATCH /api/simulations/[id]
 * Mettre à jour une simulation
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await requireAuth(request)

    if (!isRegularUser(context.user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const body = await request.json()

    const simulationService = new SimulationService(
      context.user.cabinetId,
      context.user.id,
      false
    )

    const simulation = await simulationService.updateSimulation(params.id, body)

    // Audit log
    const auditService = new AuditService(
      context.user.cabinetId,
      context.user.id,
      false
    )

    await auditService.createAuditLog({
      action: 'UPDATE',
      entityType: 'Simulation',
      entityId: params.id,
      changes: body,
    })

    return createSuccessResponse(simulation)
  } catch (error: any) {
    console.error('Error updating simulation:', error)
    return createErrorResponse(
      error.message || 'Erreur lors de la mise à jour de la simulation',
      500
    )
  }
}

/**
 * DELETE /api/simulations/[id]
 * Supprimer une simulation
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await requireAuth(request)

    if (!isRegularUser(context.user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const simulationService = new SimulationService(
      context.user.cabinetId,
      context.user.id,
      false
    )

    await simulationService.deleteSimulation(params.id)

    // Audit log
    const auditService = new AuditService(
      context.user.cabinetId,
      context.user.id,
      false
    )

    await auditService.createAuditLog({
      action: 'DELETE',
      entityType: 'Simulation',
      entityId: params.id,
    })

    return createSuccessResponse({ success: true })
  } catch (error: any) {
    console.error('Error deleting simulation:', error)
    return createErrorResponse(
      error.message || 'Erreur lors de la suppression de la simulation',
      500
    )
  }
}
