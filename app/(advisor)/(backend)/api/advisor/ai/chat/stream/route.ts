import { NextRequest } from 'next/server'
import { AgentRuntime } from '@/app/_common/lib/services/aura-v2/agent-runtime'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import { chatStreamRequestSchema, validateRequest } from '@/app/_common/lib/validations/ai-schemas'
import { logger } from '@/app/_common/lib/logger'

// ============================================================================
// API Route — AURA V2 Agent en streaming SSE (compatibilité V1 useAI hook)
//
// Ce endpoint conserve le format SSE attendu par le hook useAI V1
// (TabOverview, BilanPatrimonialWizard, EventDetailModal, EmailCompose)
// mais utilise V2 AgentRuntime en interne.
//
// Format SSE :
//   1. data: { ragSources?, agentActions?, memoriesUsed?, metrics? }  (meta)
//   2. data: { token: "..." }  (contenu progressif)
//   3. data: { done: true }    (fin)
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    const authContext = await requireAuth(req)
    const { user, cabinetId } = authContext

    const rawBody = await req.json()
    const validation = validateRequest(chatStreamRequestSchema, rawBody)
    if (!validation.success) return validation.error
    const body = validation.data

    if (!cabinetId || !user.id) {
      return new Response(JSON.stringify({ error: 'Cabinet ou utilisateur manquant' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // ── Exécuter via AURA V2 AgentRuntime (synchrone) ──
    // Mapper pageContext V1 (path) → V2 (page)
    const v1PageCtx = body.pageContext as { path?: string; page?: string; pageType?: string; clientId?: string; clientName?: string; visibleData?: string } | undefined
    const pageContext = v1PageCtx ? {
      page: v1PageCtx.path || v1PageCtx.page || '',
      section: v1PageCtx.pageType,
      entityId: v1PageCtx.clientId,
    } : undefined

    const runtime = new AgentRuntime(cabinetId, user.id)
    const result = await runtime.executeRun({
      userMessage: body.message.trim(),
      sessionId: 'compat-v1', // Session virtuelle pour compatibilité V1
      clientId: body.clientId || undefined,
      pageContext,
    })

    // ── Convertir le résultat synchrone V2 en stream SSE V1 ──
    const encoder = new TextEncoder()
    const responseText = result.response || ''
    const CHUNK_SIZE = 12 // Caractères par token SSE (typewriter effect)

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        // 1. Métadonnées agent (premier event SSE)
        const agentActions = (result.toolCalls || []).map(tc => ({
          toolName: tc.toolName,
          status: tc.success ? 'executed' : 'failed',
          message: tc.message || '',
          data: tc.data,
          requiresConfirmation: false,
          navigationUrl: tc.navigationUrl,
        }))

        const meta = {
          ragSources: result.metadata?.sources || [],
          agentActions,
          memoriesUsed: 0,
          instructionsApplied: 0,
          metrics: {
            totalMs: result.metadata?.durationMs || 0,
            toolCallCount: (result.toolCalls || []).length,
          },
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(meta)}\n\n`))

        // 2. Tokens progressifs (simuler le streaming pour le typewriter)
        for (let i = 0; i < responseText.length; i += CHUNK_SIZE) {
          const chunk = responseText.slice(i, i + CHUNK_SIZE)
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token: chunk })}\n\n`))
          // Micro-pause pour effet typewriter naturel
          await new Promise(r => setTimeout(r, 10))
        }

        // 3. Signal de fin
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`))
        controller.close()
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-AI-Mode': 'aura-v2',
      },
    })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return new Response(JSON.stringify({ error: 'Non authentifié' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    logger.error('[AI Chat Stream V2] Erreur:', { error: error instanceof Error ? error.message : String(error) })
    const message = error instanceof Error ? error.message : 'Erreur interne'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
