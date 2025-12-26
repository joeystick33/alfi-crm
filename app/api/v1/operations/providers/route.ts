/**
 * API Routes for Providers (Fournisseurs)
 * 
 * GET /api/v1/operations/providers - List providers with filters
 * POST /api/v1/operations/providers - Create a new provider
 * 
 * @requirements 24.1-24.6
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import {
  getProviders,
  addProvider,
  getProviderStats,
} from '@/lib/operations/services/provider-service'
import { createProviderSchema } from '@/lib/operations/schemas'
import { z } from 'zod'

/**
 * GET /api/v1/operations/providers
 * List all providers for the cabinet with optional filters
 * 
 * @requirements 24.1 - THE Operations_Manager SHALL provide a provider catalog
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

    const conventionStatus = searchParams.getAll('conventionStatus')
    if (conventionStatus.length > 0) {
      filters.conventionStatus = conventionStatus
    }

    const isFavorite = searchParams.get('isFavorite')
    if (isFavorite !== null) {
      filters.isFavorite = isFavorite === 'true'
    }

    const search = searchParams.get('search')
    if (search) {
      filters.search = search
    }

    // Check if stats are requested
    const includeStats = searchParams.get('includeStats') === 'true'

    const result = await getProviders(cabinetId, filters)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    // Include stats if requested
    if (includeStats) {
      const statsResult = await getProviderStats(cabinetId)
      return NextResponse.json({
        data: result.data,
        stats: statsResult.success ? statsResult.data : null,
      })
    }

    return NextResponse.json({ data: result.data })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    const message = error instanceof Error ? error.message : 'Erreur serveur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * POST /api/v1/operations/providers
 * Create a new provider
 * 
 * @requirements 24.2 - THE Operations_Manager SHALL allow adding providers
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
    const validatedInput = createProviderSchema.parse({
      ...body,
      cabinetId,
    })

    const result = await addProvider(validatedInput)

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
