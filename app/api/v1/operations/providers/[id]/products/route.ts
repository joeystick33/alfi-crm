/**
 * API Routes for Provider Products
 * 
 * GET /api/v1/operations/providers/[id]/products - List products for a provider
 * 
 * @requirements 24.4-24.5
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import {
  getProviderById,
  getProductsByProvider,
  addProduct,
} from '@/lib/operations/services/provider-service'
import { createProductSchema } from '@/lib/operations/schemas'
import { z } from 'zod'

type RouteParams = { params: Promise<{ id: string }> }

/**
 * GET /api/v1/operations/providers/[id]/products
 * List all products for a provider
 * 
 * @requirements 24.4 - THE Operations_Manager SHALL display products by provider
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { user, cabinetId } = await requireAuth(request)
    const { id: providerId } = await params

    if (!cabinetId) {
      return NextResponse.json(
        { error: 'Cabinet non trouvé' },
        { status: 400 }
      )
    }

    // Verify the provider exists and belongs to the cabinet
    const providerResult = await getProviderById(providerId, false)
    if (!providerResult.success || !providerResult.data) {
      return NextResponse.json(
        { error: 'Fournisseur non trouvé' },
        { status: 404 }
      )
    }

    if (providerResult.data.cabinetId !== cabinetId) {
      return NextResponse.json(
        { error: 'Fournisseur non trouvé' },
        { status: 404 }
      )
    }

    // Parse query params for filters
    const { searchParams } = new URL(request.url)
    const filters: Record<string, unknown> = {}

    const type = searchParams.getAll('type')
    if (type.length > 0) {
      filters.type = type
    }

    const isActive = searchParams.get('isActive')
    if (isActive !== null) {
      filters.isActive = isActive === 'true'
    }

    const search = searchParams.get('search')
    if (search) {
      filters.search = search
    }

    const minInvestment = searchParams.get('minInvestment')
    if (minInvestment) {
      filters.minInvestment = parseFloat(minInvestment)
    }

    const maxInvestment = searchParams.get('maxInvestment')
    if (maxInvestment) {
      filters.maxInvestment = parseFloat(maxInvestment)
    }

    const result = await getProductsByProvider(providerId, filters)

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
    const message = error instanceof Error ? error.message : 'Erreur serveur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * POST /api/v1/operations/providers/[id]/products
 * Add a new product to a provider
 * 
 * @requirements 24.5 - THE Operations_Manager SHALL allow adding products
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { user, cabinetId } = await requireAuth(request)
    const { id: providerId } = await params

    if (!cabinetId) {
      return NextResponse.json(
        { error: 'Cabinet non trouvé' },
        { status: 400 }
      )
    }

    // Verify the provider exists and belongs to the cabinet
    const providerResult = await getProviderById(providerId, false)
    if (!providerResult.success || !providerResult.data) {
      return NextResponse.json(
        { error: 'Fournisseur non trouvé' },
        { status: 404 }
      )
    }

    if (providerResult.data.cabinetId !== cabinetId) {
      return NextResponse.json(
        { error: 'Fournisseur non trouvé' },
        { status: 404 }
      )
    }

    const body = await request.json()

    // Validate input
    const validatedInput = createProductSchema.parse({
      ...body,
      providerId,
    })

    const result = await addProduct(validatedInput)

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
