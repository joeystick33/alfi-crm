/**
 * API Route for Document Generation
 * 
 * POST /api/v1/documents/generate - Generate a regulatory document
 * 
 * @requirements 14.6-14.10
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import {
  generateDocument,
  previewDocument,
} from '@/lib/documents/services/document-generator-service'
import { generateDocumentSchema } from '@/lib/documents/schemas'
import { z } from 'zod'

/**
 * POST /api/v1/documents/generate
 * Generate a regulatory document
 * 
 * @requirements 14.6 - THE Document_Generator SHALL pre-fill all documents with existing client data
 * @requirements 14.7 - THE Document_Generator SHALL generate documents in PDF format with professional styling
 * @requirements 14.8 - WHEN a document is generated, THE Document_Generator SHALL save it to the client's document folder
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

    // Check if this is a preview request
    if (body.preview === true) {
      const result = await previewDocument(
        cabinetId,
        body.clientId,
        body.templateId,
        body.documentType,
        body.customData
      )

      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        )
      }

      return NextResponse.json({ data: result.data })
    }

    // Validate input for generation
    const validatedInput = generateDocumentSchema.parse({
      ...body,
      cabinetId,
      generatedById: user.id,
    })

    const result = await generateDocument(validatedInput)

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
