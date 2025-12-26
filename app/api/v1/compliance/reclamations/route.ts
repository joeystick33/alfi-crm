/**
 * API Routes for Compliance Reclamations
 * 
 * GET /api/v1/compliance/reclamations - List reclamations with filters
 * POST /api/v1/compliance/reclamations - Create a new reclamation
 * 
 * @requirements 5.2-5.8
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import {
  createReclamation,
  getReclamationsByCabinet,
} from '@/lib/compliance/services/reclamation-service'
import {
  createReclamationSchema,
  reclamationFiltersSchema,
} from '@/lib/compliance/schemas'
import { z } from 'zod'

/**
 * GET /api/v1/compliance/reclamations
 * List all reclamations for the cabinet with optional filters
 * 
 * @requirements 5.7 - THE Reclamation_Handler SHALL display reclamations in a filterable table
 * @requirements 5.8 - WHEN filtering reclamations, THE Reclamation_Handler SHALL support filters
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

    const clientId = searchParams.get('clientId')
    if (clientId) {
      filters.clientId = clientId
    }

    const slaBreachOnly = searchParams.get('slaBreachOnly')
    if (slaBreachOnly !== null) {
      filters.slaBreachOnly = slaBreachOnly === 'true'
    }

    const dateFrom = searchParams.get('dateFrom')
    if (dateFrom) {
      filters.dateFrom = new Date(dateFrom)
    }

    const dateTo = searchParams.get('dateTo')
    if (dateTo) {
      filters.dateTo = new Date(dateTo)
    }

    // Validate filters
    const validatedFilters = Object.keys(filters).length > 0
      ? reclamationFiltersSchema.parse(filters)
      : undefined

    const result = await getReclamationsByCabinet(cabinetId, validatedFilters)

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
 * POST /api/v1/compliance/reclamations
 * Create a new reclamation
 * 
 * @requirements 5.2 - WHEN creating a reclamation, THE Reclamation_Handler SHALL generate a unique reference number
 * @requirements 5.3 - WHEN creating a reclamation, THE Reclamation_Handler SHALL calculate SLA deadline based on severity
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
    const validatedInput = createReclamationSchema.parse({
      ...body,
      cabinetId, // Ensure cabinetId from auth
    })

    const result = await createReclamation(validatedInput)

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
