/**
 * API Routes for Document Templates
 * 
 * GET /api/v1/documents/templates - List templates with filters
 * POST /api/v1/documents/templates - Create a new template
 * 
 * @requirements 17.1-17.7
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import {
  getTemplates,
  getTemplateByType,
  createTemplate,
} from '@/lib/documents/services/template-service'
import {
  createDocumentTemplateSchema,
  documentTemplateFiltersSchema,
} from '@/lib/documents/schemas'
import { z } from 'zod'

/**
 * GET /api/v1/documents/templates
 * List all templates for the cabinet with optional filters
 * 
 * @requirements 17.1 - THE Association_Templates SHALL provide pre-configured templates for associations
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

    const documentType = searchParams.getAll('documentType')
    if (documentType.length > 0) {
      filters.documentType = documentType
    }

    const associationType = searchParams.getAll('associationType')
    if (associationType.length > 0) {
      filters.associationType = associationType
    }

    const providerId = searchParams.get('providerId')
    if (providerId) {
      filters.providerId = providerId
    }

    const isActive = searchParams.get('isActive')
    if (isActive !== null) {
      filters.isActive = isActive === 'true'
    }

    // Check if looking for a specific template by type
    const getByType = searchParams.get('getByType')
    if (getByType === 'true') {
      const docType = searchParams.get('documentType')
      const assocType = searchParams.get('associationType') || 'GENERIC'
      const provId = searchParams.get('providerId')

      if (!docType) {
        return NextResponse.json(
          { error: 'documentType est requis pour getByType' },
          { status: 400 }
        )
      }

      const result = await getTemplateByType(
        cabinetId,
        docType as any,
        assocType as any,
        provId || undefined
      )

      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 404 }
        )
      }

      return NextResponse.json({ data: result.data })
    }

    // Validate filters
    const validatedFilters = Object.keys(filters).length > 0
      ? documentTemplateFiltersSchema.parse(filters)
      : undefined

    const result = await getTemplates(cabinetId, validatedFilters)

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
 * POST /api/v1/documents/templates
 * Create a new document template
 * 
 * @requirements 17.5 - THE Template_Manager SHALL allow CGPs to customize association templates
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
    const validatedInput = createDocumentTemplateSchema.parse({
      ...body,
      cabinetId,
      createdById: user.id,
    })

    const result = await createTemplate(validatedInput)

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
