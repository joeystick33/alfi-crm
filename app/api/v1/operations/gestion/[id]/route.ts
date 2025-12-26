/**
 * API Routes for single Opération de Gestion
 * 
 * GET /api/v1/operations/gestion/[id] - Get operation by ID
 * PATCH /api/v1/operations/gestion/[id] - Update operation status
 * 
 * @requirements 21.1-21.7
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import {
  getOperationById,
  getOperationStatusHistory,
  updateOperationStatus,
  updateOperationDetails,
} from '@/lib/operations/services/operation-gestion-service'
import { updateOperationGestionStatusSchema } from '@/lib/operations/schemas'
import { z } from 'zod'

type RouteParams = { params: Promise<{ id: string }> }

/**
 * GET /api/v1/operations/gestion/[id]
 * Get a single operation by ID with status history
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

    const result = await getOperationById(id)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 404 }
      )
    }

    // Verify the operation belongs to the user's cabinet
    if (result.data?.cabinetId !== cabinetId) {
      return NextResponse.json(
        { error: 'Opération non trouvée' },
        { status: 404 }
      )
    }

    // Get status history
    const historyResult = await getOperationStatusHistory(id)

    return NextResponse.json({
      data: {
        ...result.data,
        statusHistory: historyResult.success ? historyResult.data : [],
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    const message = error instanceof Error ? error.message : 'Erreur serveur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * PATCH /api/v1/operations/gestion/[id]
 * Update operation status or details
 * 
 * @requirements 21.3 - THE Operations_Manager SHALL track Opérations de Gestion through workflow
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

    // Verify the operation exists and belongs to the cabinet
    const existingResult = await getOperationById(id)
    if (!existingResult.success || !existingResult.data) {
      return NextResponse.json(
        { error: 'Opération non trouvée' },
        { status: 404 }
      )
    }

    if (existingResult.data.cabinetId !== cabinetId) {
      return NextResponse.json(
        { error: 'Opération non trouvée' },
        { status: 404 }
      )
    }

    const body = await request.json()

    // If updating status
    if (body.newStatus) {
      const validatedInput = updateOperationGestionStatusSchema.parse({
        operationId: id,
        newStatus: body.newStatus,
        userId: user.id,
        note: body.note,
        rejectionReason: body.rejectionReason,
      })

      const result = await updateOperationStatus(validatedInput)

      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        )
      }

      return NextResponse.json({ data: result.data })
    }

    // If updating details
    if (body.operationDetails) {
      const result = await updateOperationDetails(id, body.operationDetails, user.id)

      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        )
      }

      return NextResponse.json({ data: result.data })
    }

    return NextResponse.json(
      { error: 'Aucune mise à jour spécifiée' },
      { status: 400 }
    )
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
