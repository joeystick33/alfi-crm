/**
 * API Route for Alert Acknowledgement
 * 
 * POST /api/v1/compliance/alerts/[id]/acknowledge - Acknowledge an alert
 * 
 * @requirements 3.6
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import { acknowledgeAlert, getAlertById } from '@/lib/compliance/services/alert-service'
import { acknowledgeAlertSchema } from '@/lib/compliance/schemas'
import { z } from 'zod'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/v1/compliance/alerts/[id]/acknowledge
 * Acknowledge an alert
 * 
 * @requirements 3.6 - WHEN an alert is acknowledged, THE Alert_Engine SHALL mark it as "acknowledged" but keep it visible until resolved
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

    // Check alert exists and belongs to cabinet
    const existingAlert = await getAlertById(id)

    if (!existingAlert.success || !existingAlert.data) {
      return NextResponse.json(
        { error: 'Alerte non trouvée' },
        { status: 404 }
      )
    }

    if (existingAlert.data.cabinetId !== cabinetId) {
      return NextResponse.json(
        { error: 'Alerte non trouvée' },
        { status: 404 }
      )
    }

    // Validate input
    const validatedInput = acknowledgeAlertSchema.parse({
      alertId: id,
      acknowledgedById: user.id,
    })

    const result = await acknowledgeAlert(validatedInput)

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
