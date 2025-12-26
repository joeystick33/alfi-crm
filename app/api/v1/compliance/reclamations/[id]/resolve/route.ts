/**
 * API Route for Reclamation Resolution
 * 
 * POST /api/v1/compliance/reclamations/[id]/resolve - Resolve a reclamation
 * 
 * @requirements 5.6
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import { resolveReclamation, getReclamationById } from '@/lib/compliance/services/reclamation-service'
import { resolveReclamationSchema } from '@/lib/compliance/schemas'
import { z } from 'zod'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/v1/compliance/reclamations/[id]/resolve
 * Resolve a reclamation with response text
 * 
 * @requirements 5.6 - WHEN resolving a reclamation, THE Reclamation_Handler SHALL require a response text
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

    // Check reclamation exists and belongs to cabinet
    const existingReclamation = await getReclamationById(id)

    if (!existingReclamation.success || !existingReclamation.data) {
      return NextResponse.json(
        { error: 'Réclamation non trouvée' },
        { status: 404 }
      )
    }

    if (existingReclamation.data.cabinetId !== cabinetId) {
      return NextResponse.json(
        { error: 'Réclamation non trouvée' },
        { status: 404 }
      )
    }

    const body = await request.json()

    // Validate input - response text is required
    const validatedInput = resolveReclamationSchema.parse({
      reclamationId: id,
      responseText: body.responseText,
      internalNotes: body.internalNotes,
    })

    const result = await resolveReclamation(validatedInput)

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
