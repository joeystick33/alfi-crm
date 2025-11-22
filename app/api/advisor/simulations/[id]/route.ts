import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/supabase/auth-helpers'
import { isRegularUser } from '@/lib/auth-types'
import { SimulationService } from '@/lib/services/simulation-service'
import { normalizeSimulationUpdatePayload } from '../utils'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const service = new SimulationService(
      user.cabinetId,
      user.id,
      user.role,
      context.isSuperAdmin
    )

    const simulation = await service.getSimulationById(params.id)

    if (!simulation) {
      return createErrorResponse('Simulation not found', 404)
    }

    return createSuccessResponse(simulation)
  } catch (error: any) {
    console.error('Error in GET /api/simulations/[id]:', error)
    
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
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    // Parse and validate payload
    const body = await request.json()
    const payload = normalizeSimulationUpdatePayload(body)

    // Instantiate service
    const service = new SimulationService(
      user.cabinetId,
      user.id,
      user.role,
      context.isSuperAdmin
    )

    // Update simulation
    const simulation = await service.updateSimulation(params.id, payload)

    // Return formatted response
    return createSuccessResponse(simulation)
  } catch (error: any) {
    console.error('Error in PATCH /api/simulations/[id]:', error)
    
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
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    // Instantiate service
    const service = new SimulationService(
      user.cabinetId,
      user.id,
      user.role,
      context.isSuperAdmin
    )

    // Delete simulation
    await service.deleteSimulation(params.id)

    // Return success response
    return createSuccessResponse({ success: true })
  } catch (error: any) {
    console.error('Error in DELETE /api/simulations/[id]:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error) {
      return createErrorResponse(error.message, 400)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
