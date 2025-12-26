/**
 * API Routes for Affaires Nouvelles (Operations)
 * 
 * GET /api/v1/operations/affaires - List affaires with filters
 * POST /api/v1/operations/affaires - Create a new affaire
 * 
 * @requirements 18.1-18.6, 19.1-19.7
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import {
  createAffaire,
  getAffairesByCabinet,
} from '@/lib/operations/services/affaire-service'
import {
  createAffaireSchema,
  affaireFiltersSchema,
} from '@/lib/operations/schemas'
import { z } from 'zod'

/**
 * GET /api/v1/operations/affaires
 * List all affaires for the cabinet with optional filters
 * 
 * @requirements 18.5 - THE Operations_Manager SHALL display a unified dashboard
 * @requirements 18.7 - THE Affaire_Nouvelle SHALL support document attachment
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

    const productType = searchParams.getAll('productType')
    if (productType.length > 0) {
      filters.productType = productType
    }

    const source = searchParams.getAll('source')
    if (source.length > 0) {
      filters.source = source
    }

    const clientId = searchParams.get('clientId')
    if (clientId) {
      filters.clientId = clientId
    }

    const providerId = searchParams.get('providerId')
    if (providerId) {
      filters.providerId = providerId
    }

    const dateFrom = searchParams.get('dateFrom')
    if (dateFrom) {
      filters.dateFrom = new Date(dateFrom)
    }

    const dateTo = searchParams.get('dateTo')
    if (dateTo) {
      filters.dateTo = new Date(dateTo)
    }

    const enCoursOnly = searchParams.get('enCoursOnly')
    if (enCoursOnly !== null) {
      filters.enCoursOnly = enCoursOnly === 'true'
    }

    // Validate filters
    const validatedFilters = Object.keys(filters).length > 0
      ? affaireFiltersSchema.parse(filters)
      : undefined

    const result = await getAffairesByCabinet(cabinetId, validatedFilters)

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
 * POST /api/v1/operations/affaires
 * Create a new affaire
 * 
 * @requirements 19.2 - WHEN creating an Affaire Nouvelle, THE Affaire_Nouvelle SHALL require client, product type, provider, estimated amount, target date, source
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
    const validatedInput = createAffaireSchema.parse({
      ...body,
      cabinetId, // Ensure cabinetId from auth
      createdById: user.id,
    })

    const result = await createAffaire(validatedInput)

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
