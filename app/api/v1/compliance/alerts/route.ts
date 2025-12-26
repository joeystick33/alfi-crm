/**
 * API Routes for Compliance Alerts
 * 
 * GET /api/v1/compliance/alerts - List alerts with filters
 * POST /api/v1/compliance/alerts - Create a new alert
 * 
 * @requirements 3.4-3.6
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import {
  createAlert,
  getAlertsByCabinet,
} from '@/lib/compliance/services/alert-service'
import {
  createAlertSchema,
  alertFiltersSchema,
} from '@/lib/compliance/schemas'
import { z } from 'zod'

/**
 * GET /api/v1/compliance/alerts
 * List all alerts for the cabinet with optional filters
 * 
 * @requirements 3.5 - THE Alert_Engine SHALL display alerts in a filterable list
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

    const severity = searchParams.getAll('severity')
    if (severity.length > 0) {
      filters.severity = severity
    }

    const type = searchParams.getAll('type')
    if (type.length > 0) {
      filters.type = type
    }

    const clientId = searchParams.get('clientId')
    if (clientId) {
      filters.clientId = clientId
    }

    const acknowledged = searchParams.get('acknowledged')
    if (acknowledged !== null) {
      filters.acknowledged = acknowledged === 'true'
    }

    const resolved = searchParams.get('resolved')
    if (resolved !== null) {
      filters.resolved = resolved === 'true'
    }

    // Validate filters
    const validatedFilters = Object.keys(filters).length > 0
      ? alertFiltersSchema.parse(filters)
      : undefined

    const result = await getAlertsByCabinet(cabinetId, validatedFilters)

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
 * POST /api/v1/compliance/alerts
 * Create a new alert
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
    const validatedInput = createAlertSchema.parse({
      ...body,
      cabinetId, // Ensure cabinetId from auth
    })

    const result = await createAlert(validatedInput)

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
