/**
 * API Routes for single Affaire Nouvelle
 * 
 * GET /api/v1/operations/affaires/[id] - Get affaire by ID
 * PATCH /api/v1/operations/affaires/[id] - Update affaire
 * 
 * @requirements 18.1-18.6, 19.1-19.7
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import {
  getAffaireById,
  getAffaireStatusHistory,
} from '@/lib/operations/services/affaire-service'

type RouteParams = { params: Promise<{ id: string }> }

/**
 * GET /api/v1/operations/affaires/[id]
 * Get a single affaire by ID with status history
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

    const result = await getAffaireById(id)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 404 }
      )
    }

    // Verify the affaire belongs to the user's cabinet
    if (result.data?.cabinetId !== cabinetId) {
      return NextResponse.json(
        { error: 'Affaire non trouvée' },
        { status: 404 }
      )
    }

    // Get status history
    const historyResult = await getAffaireStatusHistory(id)

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
