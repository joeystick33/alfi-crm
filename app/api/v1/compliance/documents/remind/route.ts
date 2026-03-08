/**
 * API Route for Sending Document Reminders
 * 
 * POST /api/v1/compliance/documents/remind - Send reminder for a document
 * 
 * @requirements 5.4
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import { recordReminderSent, getDocumentsByClient } from '@/lib/compliance/services/document-service'
import { z } from 'zod'

const remindSchema = z.object({
  clientId: z.string().min(1, 'Client ID requis'),
  documentId: z.string().optional(),
})

/**
 * POST /api/v1/compliance/documents/remind
 * Send a reminder for pending KYC documents
 * 
 * @requirements 5.4 - WHEN the CGP sends a reminder, THE Result_Validator SHALL:
 *   - Record the reminder action with timestamp
 *   - Update the reminder count for the document/client
 *   - Create a timeline event
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
    const validatedInput = remindSchema.parse(body)

    // If a specific document ID is provided, send reminder for that document
    if (validatedInput.documentId) {
      const result = await recordReminderSent(validatedInput.documentId, user.id)
      
      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        )
      }

      return NextResponse.json({ 
        success: true, 
        data: result.data,
        message: 'Relance envoyée avec succès'
      })
    }

    // Otherwise, send reminders for all pending documents for the client
    const documentsResult = await getDocumentsByClient(
      cabinetId,
      validatedInput.clientId,
      { status: ['EN_ATTENTE'] }
    )

    if (!documentsResult.success || !documentsResult.data) {
      return NextResponse.json(
        { error: documentsResult.error || 'Erreur lors de la récupération des documents' },
        { status: 400 }
      )
    }

    const pendingDocuments = documentsResult.data
    const results = []

    for (const doc of pendingDocuments) {
      const result = await recordReminderSent(doc.id, user.id)
      if (result.success) {
        results.push(result.data)
      }
    }

    return NextResponse.json({ 
      success: true, 
      data: results,
      message: `${results.length} relance(s) envoyée(s) avec succès`
    })
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
