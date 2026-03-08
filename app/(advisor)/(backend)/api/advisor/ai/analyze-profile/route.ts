import { NextRequest, NextResponse } from 'next/server'
import { aiAnalyzeProfile } from '@/app/_common/lib/services/ai-service'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import { analyzeProfileRequestSchema, validateRequest } from '@/app/_common/lib/validations/ai-schemas'
import { logger } from '@/app/_common/lib/logger'
// ============================================================================
// API Route — Analyse SWOT intelligente d'un profil client
// POST : données client → forces, faiblesses, opportunités, menaces
// ============================================================================

interface AnalyzeRequest {
  age: number
  situationFamiliale: string
  nbEnfants: number
  profession: string
  revenuAnnuel: number
  patrimoineNet: number
  patrimoineImmobilier: number
  patrimoineFinancier: number
  endettement: number
  tauxEpargne: number
  tmi: number
  ifiAssujetti: boolean
}

export async function POST(req: NextRequest) {
  try {
    const context = await requireAuth(req)
    const { cabinetId } = context

    const rawBody = await req.json()
    const validation = validateRequest(analyzeProfileRequestSchema, rawBody)
    if (!validation.success) return validation.error
    const body = validation.data

    const result = await aiAnalyzeProfile(body, cabinetId || undefined)

    // Tenter de parser le JSON de l'IA
    let analysis = null
    try {
      const jsonMatch = result.content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0])
      }
    } catch {
      // Si le parsing échoue, retourner le texte brut
    }

    return NextResponse.json({
      analysis,
      rawContent: result.content,
      provider: result.provider,
      cached: result.cached,
      latencyMs: result.latencyMs,
    })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    logger.error('[AI Analyze Profile] Erreur:', { error: error instanceof Error ? error.message : String(error) })
    const message = error instanceof Error ? error.message : 'Erreur interne'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
