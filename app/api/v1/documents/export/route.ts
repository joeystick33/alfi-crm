/**
 * API Route for Document Export
 * 
 * POST /api/v1/documents/export - Export documents to PDF/DOCX
 * 
 * @requirements 16.1-16.8
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import {
  exportToPDF,
  exportToDOCX,
  batchExport,
  previewExport,
} from '@/lib/documents/services/export-service'
import { getGeneratedDocumentById } from '@/lib/documents/services/document-generator-service'
import { documentExportOptionsSchema, batchExportSchema } from '@/lib/documents/schemas'
import { z } from 'zod'

/**
 * POST /api/v1/documents/export
 * Export a document or batch of documents
 * 
 * @requirements 16.2 - WHEN exporting to DOCX, THE Document_Export SHALL preserve all formatting
 * @requirements 16.3 - WHEN exporting to PDF, THE Document_Export SHALL generate a professional document
 * @requirements 16.6 - THE Document_Export SHALL support batch export of multiple documents
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
      if (!body.documentId || !body.format) {
        return NextResponse.json(
          { error: 'documentId et format sont requis pour la prévisualisation' },
          { status: 400 }
        )
      }

      // Verify document belongs to cabinet
      const docResult = await getGeneratedDocumentById(body.documentId)
      if (!docResult.success || !docResult.data) {
        return NextResponse.json(
          { error: 'Document non trouvé' },
          { status: 404 }
        )
      }

      if (docResult.data.cabinetId !== cabinetId) {
        return NextResponse.json(
          { error: 'Document non trouvé' },
          { status: 404 }
        )
      }

      const result = await previewExport(body.documentId, body.format)

      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        )
      }

      return NextResponse.json({ data: result.data })
    }

    // Check if this is a batch export
    if (body.documentIds && Array.isArray(body.documentIds)) {
      const validatedInput = batchExportSchema.parse(body)

      // Verify all documents belong to the cabinet
      for (const docId of validatedInput.documentIds) {
        const docResult = await getGeneratedDocumentById(docId)
        if (!docResult.success || !docResult.data) {
          return NextResponse.json(
            { error: `Document ${docId} non trouvé` },
            { status: 404 }
          )
        }
        if (docResult.data.cabinetId !== cabinetId) {
          return NextResponse.json(
            { error: `Document ${docId} non trouvé` },
            { status: 404 }
          )
        }
      }

      const result = await batchExport(validatedInput)

      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        )
      }

      return NextResponse.json({ data: result.data })
    }

    // Single document export
    if (!body.documentId) {
      return NextResponse.json(
        { error: 'documentId est requis' },
        { status: 400 }
      )
    }

    // Verify document belongs to cabinet
    const docResult = await getGeneratedDocumentById(body.documentId)
    if (!docResult.success || !docResult.data) {
      return NextResponse.json(
        { error: 'Document non trouvé' },
        { status: 404 }
      )
    }

    if (docResult.data.cabinetId !== cabinetId) {
      return NextResponse.json(
        { error: 'Document non trouvé' },
        { status: 404 }
      )
    }

    const options = body.options
      ? documentExportOptionsSchema.parse(body.options)
      : undefined

    const format = body.format || options?.format || 'PDF'

    let result
    if (format === 'DOCX') {
      result = await exportToDOCX(body.documentId, options)
    } else {
      result = await exportToPDF(body.documentId, options)
    }

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
