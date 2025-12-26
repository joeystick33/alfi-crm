/**
 * API Route for Control Completion
 * 
 * POST /api/v1/compliance/controls/[id]/complete - Complete a control
 * 
 * @requirements 4.3, 4.4
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import { completeControl, getControlById } from '@/lib/compliance/services/control-service'
import { completeControlSchema } from '@/lib/compliance/schemas'
import { z } from 'zod'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/v1/compliance/controls/[id]/complete
 * Complete a control with findings and risk score
 * 
 * @requirements 4.3 - WHEN completing a control, THE Control_Manager SHALL require: findings, risk score (0-100), risk level
 * @requirements 4.4 - THE Control_Manager SHALL calculate risk level automatically based on score
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

    // Check control exists and belongs to cabinet
    const existingControl = await getControlById(id)

    if (!existingControl.success || !existingControl.data) {
      return NextResponse.json(
        { error: 'Contrôle non trouvé' },
        { status: 404 }
      )
    }

    if (existingControl.data.cabinetId !== cabinetId) {
      return NextResponse.json(
        { error: 'Contrôle non trouvé' },
        { status: 404 }
      )
    }

    const body = await request.json()

    // Validate input
    const validatedInput = completeControlSchema.parse({
      controlId: id,
      completedById: user.id,
      findings: body.findings,
      recommendations: body.recommendations,
      score: body.score,
    })

    const result = await completeControl(validatedInput)

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
