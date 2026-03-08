import { NextRequest, NextResponse } from 'next/server'
import { aiExplainConcept, aiCompare } from '@/app/_common/lib/services/ai-service'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import { explainOrCompareSchema, validateRequest } from '@/app/_common/lib/validations/ai-schemas'
import { logger } from '@/app/_common/lib/logger'
// ============================================================================
// API Route — Explication de concepts et comparaison de produits/stratégies
// POST { action: 'explain', concept, level } → explication pédagogique
// POST { action: 'compare', items[], clientContext } → comparaison argumentée
// ============================================================================

interface ExplainRequest {
  action: 'explain'
  concept: string
  level?: 'junior' | 'senior'
}

interface CompareRequest {
  action: 'compare'
  items: string[]
  clientContext: string
}

type RequestBody = ExplainRequest | CompareRequest

export async function POST(req: NextRequest) {
  try {
    const context = await requireAuth(req)
    const { cabinetId } = context

    const rawBody = await req.json()
    const validation = validateRequest(explainOrCompareSchema, rawBody)
    if (!validation.success) return validation.error
    const body = validation.data

    if (body.action === 'explain') {
      const result = await aiExplainConcept(body.concept, body.level, cabinetId || undefined)
      return NextResponse.json({
        explanation: result.content,
        provider: result.provider,
        cached: result.cached,
        latencyMs: result.latencyMs,
      })
    }

    if (body.action === 'compare') {
      const result = await aiCompare(body.items, body.clientContext, cabinetId || undefined)
      return NextResponse.json({
        comparison: result.content,
        provider: result.provider,
        cached: result.cached,
        latencyMs: result.latencyMs,
      })
    }

    return NextResponse.json({ error: 'action invalide (explain ou compare)' }, { status: 400 })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    logger.error('[AI Explain/Compare] Erreur:', { error: error instanceof Error ? error.message : String(error) })
    const message = error instanceof Error ? error.message : 'Erreur interne'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
