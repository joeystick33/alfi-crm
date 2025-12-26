/**
 * API Route for updating Affaire status
 * 
 * PATCH /api/v1/operations/affaires/[id]/status - Update affaire status
 * 
 * @requirements 19.1, 19.6
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import {
  getAffaireById,
  updateAffaireStatus,
  pauseAffaire,
  resumeAffaire,
} from '@/lib/operations/services/affaire-service'
import { updateAffaireStatusSchema } from '@/lib/operations/schemas'
import { z } from 'zod'

type RouteParams = { params: Promise<{ id: string }> }

/**
 * PATCH /api/v1/operations/affaires/[id]/status
 * Update the status of an affaire
 * 
 * @requirements 19.1 - THE Affaire_Nouvelle SHALL track new subscriptions through workflow stages
 * @requirements 19.6 - WHEN an Affaire Nouvelle status changes, THE Operations_Manager SHALL record the change
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

    // Verify the affaire exists and belongs to the cabinet
    const existingResult = await getAffaireById(id)
    if (!existingResult.success || !existingResult.data) {
      return NextResponse.json(
        { error: 'Affaire non trouvée' },
        { status: 404 }
      )
    }

    if (existingResult.data.cabinetId !== cabinetId) {
      return NextResponse.json(
        { error: 'Affaire non trouvée' },
        { status: 404 }
      )
    }

    const body = await request.json()

    // Handle special actions: pause and resume
    if (body.action === 'pause') {
      if (!body.pauseReason) {
        return NextResponse.json(
          { error: 'La raison de la pause est obligatoire' },
          { status: 400 }
        )
      }
      const result = await pauseAffaire(id, body.pauseReason, user.id)
      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        )
      }
      return NextResponse.json({ data: result.data })
    }

    if (body.action === 'resume') {
      const result = await resumeAffaire(id, user.id)
      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        )
      }
      return NextResponse.json({ data: result.data })
    }

    // Standard status update
    const validatedInput = updateAffaireStatusSchema.parse({
      affaireId: id,
      newStatus: body.newStatus,
      userId: user.id,
      note: body.note,
      rejectionReason: body.rejectionReason,
      cancellationReason: body.cancellationReason,
    })

    const result = await updateAffaireStatus(validatedInput)

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
