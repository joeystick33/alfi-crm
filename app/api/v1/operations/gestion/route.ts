/**
 * API Routes for Opérations de Gestion
 * 
 * GET /api/v1/operations/gestion - List operations with filters
 * POST /api/v1/operations/gestion - Create a new operation
 * 
 * @requirements 21.1-21.7
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import {
  createOperation,
  getOperationsByCabinet,
} from '@/lib/operations/services/operation-gestion-service'
import {
  createOperationGestionSchema,
  operationGestionFiltersSchema,
} from '@/lib/operations/schemas'
import { z } from 'zod'

/**
 * GET /api/v1/operations/gestion
 * List all operations de gestion for the cabinet with optional filters
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

    const contractId = searchParams.get('contractId')
    if (contractId) {
      filters.contractId = contractId
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
      ? operationGestionFiltersSchema.parse(filters)
      : undefined

    const result = await getOperationsByCabinet(cabinetId, validatedFilters)

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
 * POST /api/v1/operations/gestion
 * Create a new operation de gestion
 * 
 * @requirements 21.2 - WHEN creating an Opération de Gestion, THE Operations_Manager SHALL require client, contract, type, amount, effective date
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
    const validatedInput = createOperationGestionSchema.parse({
      ...body,
      cabinetId,
      createdById: user.id,
    })

    const result = await createOperation(validatedInput)

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
