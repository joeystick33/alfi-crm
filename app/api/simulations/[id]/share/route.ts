import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth-helpers'
import { SimulationService } from '@/lib/services/simulation-service'
import { AuditService } from '@/lib/services/audit-service'
import { isRegularUser } from '@/lib/auth-types'

/**
 * POST /api/simulations/[id]/share
 * Partager une simulation avec le client
 */
export async function POST(
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

    const simulation = await simulationService.shareWithClient(params.id)

    // Audit log
    const auditService = new AuditService(
      context.user.cabinetId,
      context.user.id,
      false
    )

    await auditService.createAuditLog({
      action: 'SHARE',
      entityType: 'Simulation',
      entityId: params.id,
      changes: { sharedWithClient: true },
    })

    return createSuccessResponse(simulation)
  } catch (error: any) {
    console.error('Error sharing simulation:', error)
    return createErrorResponse(
      error.message || 'Erreur lors du partage de la simulation',
      500
    )
  }
}
