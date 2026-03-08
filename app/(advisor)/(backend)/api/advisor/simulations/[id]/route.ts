 
import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { SimulationService } from '@/app/_common/lib/services/simulation-service'
import { normalizeSimulationUpdatePayload } from '../utils'
import { logger } from '@/app/_common/lib/logger'
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request); const { user } = context
    const { id: simulationId } = await params
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const service = new SimulationService(
      context.cabinetId,
      user.id,
      user.role,
      context.isSuperAdmin
    )

    const simulation = await service.getSimulationById(simulationId)

    if (!simulation) {
      return createErrorResponse('Simulation not found', 404)
    }

    return createSuccessResponse(simulation)
  } catch (error: any) {
    logger.error('Error in GET /api/simulations/[id]:', { error: error instanceof Error ? error.message : String(error) })
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error) {
      return createErrorResponse(error.message, 400)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request); const { user } = context
    const { id: simulationId } = await params
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    // Parse and validate payload
    const body = await request.json()
    const payload = normalizeSimulationUpdatePayload(body)

    // Instantiate service
    const service = new SimulationService(
      context.cabinetId,
      user.id,
      user.role,
      context.isSuperAdmin
    )

    // Update simulation
    const simulation = await service.updateSimulation(simulationId, payload)

    // Return formatted response
    return createSuccessResponse(simulation)
  } catch (error: any) {
    logger.error('Error in PATCH /api/simulations/[id]:', { error: error instanceof Error ? error.message : String(error) })
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error) {
      return createErrorResponse(error.message, 400)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request); const { user } = context
    const { id: simulationId } = await params
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    // Instantiate service
    const service = new SimulationService(
      context.cabinetId,
      user.id,
      user.role,
      context.isSuperAdmin
    )

    // Delete simulation
    await service.deleteSimulation(simulationId)

    // Return success response
    return createSuccessResponse({ success: true })
  } catch (error: any) {
    logger.error('Error in DELETE /api/simulations/[id]:', { error: error instanceof Error ? error.message : String(error) })
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error) {
      return createErrorResponse(error.message, 400)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
