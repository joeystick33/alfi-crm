/**
 * API Routes for Single Compliance Document
 * 
 * GET /api/v1/compliance/documents/[id] - Get document by ID
 * PATCH /api/v1/compliance/documents/[id] - Update document
 * DELETE /api/v1/compliance/documents/[id] - Delete document
 * 
 * @requirements 2.2-2.8
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import { getDocumentById } from '@/lib/compliance/services/document-service'
import { prisma } from '@/app/_common/lib/prisma'
import { z } from 'zod'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/v1/compliance/documents/[id]
 * Get a single document by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { user, cabinetId } = await requireAuth(request)
    const { id } = await params

    if (!cabinetId) {
      return NextResponse.json(
        { error: 'Cabinet non trouvé' },
        { status: 400 }
      )
    }

    const result = await getDocumentById(id)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 404 }
      )
    }

    // Verify document belongs to cabinet
    if (result.data?.cabinetId !== cabinetId) {
      return NextResponse.json(
        { error: 'Document non trouvé' },
        { status: 404 }
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
 * PATCH /api/v1/compliance/documents/[id]
 * Update a document (notes, file info)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

    // Only allow updating certain fields
    const updateSchema = z.object({
      fileName: z.string().min(1).max(255).optional(),
      fileUrl: z.string().url().optional(),
      notes: z.string().max(1000).optional(),
    })

    const validatedData = updateSchema.parse(body)

    const document = await prisma.kYCDocument.update({
      where: { id },
      data: validatedData,
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({ data: document })
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

/**
 * DELETE /api/v1/compliance/documents/[id]
 * Delete a document
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    await prisma.kYCDocument.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    const message = error instanceof Error ? error.message : 'Erreur serveur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
