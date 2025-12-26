/**
 * API Routes for Compliance Controls (ACPR)
 * 
 * GET /api/v1/compliance/controls - List controls with filters
 * POST /api/v1/compliance/controls - Create a new control
 * 
 * @requirements 4.2-4.7
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import {
  createControl,
  getControlsByCabinet,
} from '@/lib/compliance/services/control-service'
import {
  createControlSchema,
  controlFiltersSchema,
} from '@/lib/compliance/schemas'
import { z } from 'zod'

/**
 * GET /api/v1/compliance/controls
 * List all controls for the cabinet with optional filters
 * 
 * @requirements 4.6 - THE Control_Manager SHALL display controls in a filterable table
 * @requirements 4.7 - WHEN filtering controls, THE Control_Manager SHALL support filters
 */
export async function GET(request: NextRequest) {
  try {
    const { user, cabinetId } = await requireAuth(request)

    if (!cabinetId) {
      return NextResponse.json(
        { error: 'Cabinet non trouvé' },
        { status: 400 }
      )
    }

    // Parse query params for filters
    const { searchParams } = new URL(request.url)
    const filters: Record<string, unknown> = {}

    const status = searchParams.getAll('status')
    if (status.length > 0) {
      filters.status = status
    }

    const type = searchParams.getAll('type')
    if (type.length > 0) {
      filters.type = type
    }

    const priority = searchParams.getAll('priority')
    if (priority.length > 0) {
      filters.priority = priority
    }

    const clientId = searchParams.get('clientId')
    if (clientId) {
      filters.clientId = clientId
    }

    const isACPRMandatory = searchParams.get('isACPRMandatory')
    if (isACPRMandatory !== null) {
      filters.isACPRMandatory = isACPRMandatory === 'true'
    }

    const overdueOnly = searchParams.get('overdueOnly')
    if (overdueOnly !== null) {
      filters.overdueOnly = overdueOnly === 'true'
    }

    // Validate filters
    const validatedFilters = Object.keys(filters).length > 0
      ? controlFiltersSchema.parse(filters)
      : undefined

    const result = await getControlsByCabinet(cabinetId, validatedFilters)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: result.data })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Paramètres invalides', details: error.issues },
        { status: 400 }
      )
    }
    const message = error instanceof Error ? error.message : 'Erreur serveur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * POST /api/v1/compliance/controls
 * Create a new control
 * 
 * @requirements 4.2 - WHEN creating a control, THE Control_Manager SHALL require: client, type, due date, priority, description
 */
export async function POST(request: NextRequest) {
  try {
    const { user, cabinetId } = await requireAuth(request)

    if (!cabinetId) {
      return NextResponse.json(
        { error: 'Cabinet non trouvé' },
        { status: 400 }
      )
    }

    const body = await request.json()

    // Validate input
    const validatedInput = createControlSchema.parse({
      ...body,
      cabinetId, // Ensure cabinetId from auth
    })

    const result = await createControl(validatedInput)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({ data: result.data }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      )
    }
    const message = error instanceof Error ? error.message : 'Erreur serveur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
