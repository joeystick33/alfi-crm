import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/supabase/auth-helpers'
import { isRegularUser } from '@/lib/auth-types'
import { SimulationService } from '@/lib/services/simulation-service'
import { parseSimulationFilters, normalizeSimulationCreatePayload } from './utils'

export async function GET(request: NextRequest) {
  try {
    // Authenticate and extract context
    const user = await requireAuth()
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    // Parse and validate filters
    const { searchParams } = new URL(request.url)
    const filters = parseSimulationFilters(searchParams)

    // Instantiate service
    const service = new SimulationService(
      user.cabinetId,
      user.id,
      user.role,
      context.isSuperAdmin
    )

    // Execute query
    const simulations = await service.getSimulations(filters)

    // Return formatted response
    return createSuccessResponse(simulations)
  } catch (error: any) {
    console.error('Error in GET /api/simulations:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error) {
      return createErrorResponse(error.message, 400)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate
    const user = await requireAuth()
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    // Parse and validate payload
    const body = await request.json()
    const payload = normalizeSimulationCreatePayload(body)

    // Instantiate service
    const service = new SimulationService(
      user.cabinetId,
      user.id,
      user.role,
      context.isSuperAdmin
    )

    // Create simulation
    const simulation = await service.createSimulation(payload)

    // Return formatted response with 201 status
    return createSuccessResponse(simulation, 201)
  } catch (error: any) {
    console.error('Error in POST /api/simulations:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error) {
      return createErrorResponse(error.message, 400)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
