import { NextRequest, NextResponse } from 'next/server'
import { aiGenerateEmail } from '@/app/_common/lib/services/ai-service'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import { emailRequestSchema, validateRequest } from '@/app/_common/lib/validations/ai-schemas'
import { logger } from '@/app/_common/lib/logger'
// ============================================================================
// API Route — Génération d'emails client personnalisés par IA
// POST : paramètres email → email rédigé (objet + corps + signature)
// ============================================================================

interface EmailRequest {
  clientName: string
  advisorName: string
  cabinetName: string
  emailType: 'relance' | 'confirmation_rdv' | 'envoi_bilan' | 'information' | 'anniversaire' | 'suivi_preco' | 'custom'
  context: string
  tone?: 'formel' | 'chaleureux' | 'urgent'
}

export async function POST(req: NextRequest) {
  try {
    const context = await requireAuth(req)
    const { cabinetId } = context

    const rawBody = await req.json()
    const validation = validateRequest(emailRequestSchema, rawBody)
    if (!validation.success) return validation.error
    const body = validation.data

    const result = await aiGenerateEmail({
      clientName: body.clientName,
      advisorName: body.advisorName,
      cabinetName: body.cabinetName,
      emailType: body.emailType,
      context: body.context,
      tone: body.tone,
    }, cabinetId || undefined)

    // Séparer objet et corps
    const lines = result.content.split('\n')
    let subject = ''
    let emailBody = result.content
    const firstLine = lines[0]?.trim() || ''
    if (firstLine.toLowerCase().startsWith('objet')) {
      subject = firstLine.replace(/^objet\s*:\s*/i, '').trim()
      emailBody = lines.slice(1).join('\n').trim()
    }

    return NextResponse.json({
      subject,
      body: emailBody,
      fullContent: result.content,
      provider: result.provider,
      latencyMs: result.latencyMs,
    })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    logger.error('[AI Email] Erreur:', { error: error instanceof Error ? error.message : String(error) })
    const message = error instanceof Error ? error.message : 'Erreur interne'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
