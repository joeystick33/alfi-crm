/**
 * API Routes for Compliance Timeline
 * 
 * GET /api/v1/compliance/timeline - List timeline events with filters
 * 
 * @requirements 11.1-11.5
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import {
  getTimelineByCabinet,
  getTimelineByClient,
} from '@/lib/compliance/services/timeline-service'
import { timelineFiltersSchema } from '@/lib/compliance/schemas'
import { z } from 'zod'

/**
 * GET /api/v1/compliance/timeline
 * List timeline events with optional filters
 * 
 * @requirements 11.1 - THE Compliance_Timeline SHALL display all compliance events in chronological order
 * @requirements 11.3 - THE Compliance_Timeline SHALL allow filtering by event type and date range
 * @requirements 11.4 - THE Compliance_Timeline SHALL display event details
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

    const type = searchParams.getAll('type')
    if (type.length > 0) {
      filters.type = type
    }

    const clientId = searchParams.get('clientId')
    if (clientId) {
      filters.clientId = clientId
    }

    const operationId = searchParams.get('operationId')
    if (operationId) {
      filters.operationId = operationId
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
      ? timelineFiltersSchema.parse(filters)
      : undefined

    // If clientId is provided, get timeline for that client
    // Otherwise, get timeline for the entire cabinet
    let result
    if (clientId) {
      result = await getTimelineByClient(cabinetId, clientId, validatedFilters)
    } else {
      result = await getTimelineByCabinet(cabinetId, validatedFilters)
    }

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
