/**
 * API Route for Document Rejection
 * 
 * POST /api/v1/compliance/documents/[id]/reject - Reject a document
 * 
 * @requirements 2.4
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import { rejectDocument } from '@/lib/compliance/services/document-service'
import { rejectKYCDocumentSchema } from '@/lib/compliance/schemas'
import { prisma } from '@/app/_common/lib/prisma'
import { z } from 'zod'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/v1/compliance/documents/[id]/reject
 * Reject a KYC document
 * 
 * @requirements 2.4 - WHEN a CGP rejects a document, THE Document_Manager SHALL require a rejection reason and update status to "Rejeté"
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

    // Validate input - rejection reason is required
    const validatedInput = rejectKYCDocumentSchema.parse({
      documentId: id,
      validatedById: user.id,
      rejectionReason: body.rejectionReason,
    })

    const result = await rejectDocument(validatedInput)

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
