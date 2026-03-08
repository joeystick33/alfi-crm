import { NextRequest, NextResponse } from 'next/server'
import { aiSummarizeAppointment } from '@/app/_common/lib/services/ai-service'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import { summarizeRequestSchema, validateRequest } from '@/app/_common/lib/validations/ai-schemas'
import { logger } from '@/app/_common/lib/logger'
// ============================================================================
// API Route — Résumé automatique de rendez-vous / notes
// POST : notes brutes → résumé structuré
// ============================================================================

interface SummarizeRequest {
  notes: string
  clientName: string
  appointmentType?: string
}

export async function POST(req: NextRequest) {
  try {
    const context = await requireAuth(req)
    const { cabinetId } = context

    const rawBody = await req.json()
    const validation = validateRequest(summarizeRequestSchema, rawBody)
    if (!validation.success) return validation.error
    const body = validation.data

    const result = await aiSummarizeAppointment(
      body.notes,
      body.clientName,
      body.appointmentType,
      cabinetId || undefined
    )

    return NextResponse.json({
      summary: result.content,
      provider: result.provider,
      latencyMs: result.latencyMs,
    })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    logger.error('[AI Summarize] Erreur:', { error: error instanceof Error ? error.message : String(error) })
    const message = error instanceof Error ? error.message : 'Erreur interne'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
