/**
 * API Routes for Compliance Documents (KYC)
 * 
 * GET /api/v1/compliance/documents - List documents with filters and pagination
 * POST /api/v1/compliance/documents - Create a new document
 * 
 * @requirements 2.2-2.8
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import {
  createDocument,
  getDocumentsByCabinet,
} from '@/lib/compliance/services/document-service'
import {
  createKYCDocumentSchema,
  documentFiltersSchema,
  paginationSchema,
} from '@/lib/compliance/schemas'
import { z } from 'zod'

/**
 * GET /api/v1/compliance/documents
 * List all KYC documents for the cabinet with optional filters and pagination
 * 
 * @requirements 2.7 - WHEN filtering documents, THE Document_Manager SHALL support filters
 * @requirements 2.8 - THE Document_Manager SHALL display documents in a sortable table with pagination
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

    const expirationDateFrom = searchParams.get('expirationDateFrom')
    if (expirationDateFrom) {
      filters.expirationDateFrom = new Date(expirationDateFrom)
    }

    const expirationDateTo = searchParams.get('expirationDateTo')
    if (expirationDateTo) {
      filters.expirationDateTo = new Date(expirationDateTo)
    }

    // Parse pagination params
    const pagination = {
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
      sortBy: searchParams.get('sortBy') || undefined,
      sortOrder: searchParams.get('sortOrder') || 'desc',
    }

    // Validate filters and pagination
    const validatedFilters = Object.keys(filters).length > 0
      ? documentFiltersSchema.parse(filters)
      : undefined
    const validatedPagination = paginationSchema.parse(pagination)

    const result = await getDocumentsByCabinet(cabinetId, validatedFilters, validatedPagination)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json(result.data)
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
 * POST /api/v1/compliance/documents
 * Create a new KYC document
 * 
 * @requirements 2.2 - WHEN a document is uploaded, THE Document_Manager SHALL set its status to "En attente de validation"
 * @requirements 2.6 - THE Document_Manager SHALL calculate document expiration dates
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
    const validatedInput = createKYCDocumentSchema.parse({
      ...body,
      cabinetId, // Ensure cabinetId from auth
    })

    const result = await createDocument(validatedInput)

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
