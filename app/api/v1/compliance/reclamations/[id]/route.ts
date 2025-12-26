/**
 * API Routes for Single Reclamation
 * 
 * GET /api/v1/compliance/reclamations/[id] - Get reclamation by ID
 * PATCH /api/v1/compliance/reclamations/[id] - Update reclamation status
 * 
 * @requirements 5.2-5.8
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import { getReclamationById, updateStatus } from '@/lib/compliance/services/reclamation-service'
import { updateReclamationStatusSchema } from '@/lib/compliance/schemas'
import { z } from 'zod'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/v1/compliance/reclamations/[id]
 * Get a single reclamation by ID
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

    const result = await getReclamationById(id)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 404 }
      )
    }

    // Verify reclamation belongs to cabinet
    if (result.data?.cabinetId !== cabinetId) {
      return NextResponse.json(
        { error: 'Réclamation non trouvée' },
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
 * PATCH /api/v1/compliance/reclamations/[id]
 * Update reclamation status
 * 
 * @requirements 5.4 - THE Reclamation_Handler SHALL track status through workflow
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

    // Validate input
    const validatedInput = updateReclamationStatusSchema.parse({
      reclamationId: id,
      newStatus: body.status,
      userId: user.id,
      note: body.note,
    })

    const result = await updateStatus(validatedInput)

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
