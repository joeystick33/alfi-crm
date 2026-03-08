import { NextRequest, NextResponse } from 'next/server'
import { aiChat, aiStatus, type AIMessage } from '@/app/_common/lib/services/ai-service'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import { chatRequestSchema, validateRequest } from '@/app/_common/lib/validations/ai-schemas'
import { logger } from '@/app/_common/lib/logger'
// ============================================================================
// API Route — Assistant IA conversationnel pour les conseillers CGP
// POST : envoyer un message + historique → réponse IA
// GET  : statut du service IA
// ============================================================================

interface ChatRequest {
  message: string
  history?: Array<{ role: 'user' | 'assistant'; content: string }>
  enableRag?: boolean
  clientContext?: string
}

export async function POST(req: NextRequest) {
  try {
    const context = await requireAuth(req)
    const { user, cabinetId } = context

    const rawBody = await req.json()
    const validation = validateRequest(chatRequestSchema, rawBody)
    if (!validation.success) return validation.error
    const body = validation.data

    const history: AIMessage[] = (body.history || []).map(m => ({
      role: m.role,
      content: m.content,
    }))

    const result = await aiChat(history, body.message, {
      cabinetId,
      userId: user.id,
      priority: 'high',
      enableRag: body.enableRag ?? true,
      clientContext: body.clientContext,
    })

    return NextResponse.json({
      response: result.content,
      provider: result.provider,
      model: result.model,
      cached: result.cached,
      latencyMs: result.latencyMs,
      ragSources: result.ragSources,
      ragMetrics: result.ragMetrics,
    })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    logger.error('[AI Chat] Erreur:', { error: error instanceof Error ? error.message : String(error) })
    const message = error instanceof Error ? error.message : 'Erreur interne'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET() {
  try {
    const status = await aiStatus()
    return NextResponse.json(status)
  } catch (error: unknown) {
    logger.error('[AI Status] Erreur:', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ available: false, error: 'Erreur de vérification' }, { status: 500 })
  }
}
