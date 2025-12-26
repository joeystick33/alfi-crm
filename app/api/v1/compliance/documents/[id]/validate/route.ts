/**
 * API Route for Document Validation
 * 
 * POST /api/v1/compliance/documents/[id]/validate - Validate a document
 * 
 * @requirements 2.3
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import { validateDocument } from '@/lib/compliance/services/document-service'
import { validateKYCDocumentSchema } from '@/lib/compliance/schemas'
import { prisma } from '@/app/_common/lib/prisma'
import { z } from 'zod'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/v1/compliance/documents/[id]/validate
 * Validate a KYC document
 * 
 * @requirements 2.3 - WHEN a CGP validates a document, THE Document_Manager SHALL update status to "Validé" and record validation date and validator
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { user, cabinetId } = await requireAuth(request)
    const { id } = await params

    if (!cabinetId) {
      return NextResponse.json(
        { error: 'Cabinet non trouvé' },
        { status: 400 }
      )
    }

    // Check document exists and belongs to cabinet
    const existingDoc = await prisma.kYCDocument.findUnique({
      where: { id },
    })

    if (!existingDoc || existingDoc.cabinetId !== cabinetId) {
      return NextResponse.json(
        { error: 'Document non trouvé' },
        { status: 404 }
      )
    }

    const body = await request.json()

    // Validate input
    const validatedInput = validateKYCDocumentSchema.parse({
      documentId: id,
      validatedById: user.id,
      notes: body.notes,
    })

    const result = await validateDocument(validatedInput)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({ data: result.data })
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
