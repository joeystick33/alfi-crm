import { NextRequest, NextResponse } from 'next/server'
import { aiEnrichPreconisation } from '@/app/_common/lib/services/ai-service'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import { enrichPrecoRequestSchema, validateRequest } from '@/app/_common/lib/validations/ai-schemas'
import { logger } from '@/app/_common/lib/logger'
// ============================================================================
// API Route — Enrichissement IA d'une préconisation patrimoniale
// POST : préconisation + contexte client → description enrichie argumentée
// ============================================================================

interface EnrichRequest {
  titre: string
  categorie: string
  produit?: string
  montantEstime?: number
  objectif: string
  clientAge: number
  clientTmi: number
  clientCapaciteEpargne: number
  clientPatrimoineNet: number
}

export async function POST(req: NextRequest) {
  try {
    const context = await requireAuth(req)
    const { cabinetId } = context

    const rawBody = await req.json()
    const validation = validateRequest(enrichPrecoRequestSchema, rawBody)
    if (!validation.success) return validation.error
    const body = validation.data

    const result = await aiEnrichPreconisation(body, cabinetId || undefined)

    return NextResponse.json({
      enrichedDescription: result.content,
      provider: result.provider,
      latencyMs: result.latencyMs,
    })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    logger.error('[AI Enrich Preco] Erreur:', { error: error instanceof Error ? error.message : String(error) })
    const message = error instanceof Error ? error.message : 'Erreur interne'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
