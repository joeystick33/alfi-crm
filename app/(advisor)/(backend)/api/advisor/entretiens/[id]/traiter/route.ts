import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { EntretienService } from '@/app/_common/lib/services/entretien-service'
import { aiCapability } from '@/app/_common/lib/services/ai-service'
import { z } from 'zod'
import { logger } from '@/app/_common/lib/logger'
const traiterSchema = z.object({
  type: z.enum(['RESUME', 'BILAN_PATRIMONIAL']),
  transcription: z.array(z.object({
    id: z.string(),
    speaker: z.string().min(1),
    text: z.string(),
    timestamp: z.number(),
    confidence: z.number().optional(),
    edited: z.boolean().optional(),
  })),
})

function formatTranscriptionForAI(segments: Array<{ speaker: string; text: string; timestamp: number }>) {
  return segments
    .map(s => {
      const mins = Math.floor(s.timestamp / 60000)
      const secs = Math.floor((s.timestamp % 60000) / 1000)
      const time = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
      const speaker = s.speaker.toUpperCase()
      return `[${time}] ${speaker} : ${s.text}`
    })
    .join('\n')
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    if (!isRegularUser(user)) return createErrorResponse('Invalid user type', 400)

    const { id } = await params
    const body = await request.json()

    let validated
    try {
      validated = traiterSchema.parse(body)
    } catch (error) {
      if (error instanceof z.ZodError) {
        const messages = error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
        return createErrorResponse(`Validation échouée: ${messages}`, 400)
      }
      throw error
    }

    const service = new EntretienService(context.cabinetId, user.id, context.isSuperAdmin)
    const entretien = await service.getEntretien(id)

    // Injecter le contexte client existant pour améliorer la qualité de l'analyse
    const clientContext = await service.buildClientContextForAI(entretien.clientId)

    const formattedTranscription = formatTranscriptionForAI(validated.transcription)
    const capability = validated.type === 'RESUME' ? 'entretien-resume' as const : 'entretien-bilan' as const

    const contextBlock = clientContext ? `\n${clientContext}\n\n` : ''
    const prompt = `${contextBlock}Voici la transcription complète de l'entretien (${validated.transcription.length} segments) :\n\n${formattedTranscription}\n\nAnalyse cette transcription et produis le résultat demandé.`

    const result = await aiCapability(capability, prompt, {
      cabinetId: context.cabinetId,
      userId: user.id,
      maxTokens: 4000,
      temperature: 0.2,
      priority: 'high',
      enableRag: true,
    })

    // Parse le JSON de la réponse IA
    let parsedResult = null
    try {
      const jsonMatch = result.content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsedResult = JSON.parse(jsonMatch[0])
      }
    } catch {
      // Si le parsing échoue, retourner le texte brut comme synthèse
      parsedResult = validated.type === 'RESUME'
        ? { synthese: result.content, objet: 'Entretien', pointsCles: [], decisions: [], actionsASuivre: [], motifsAlerte: [] }
        : { patrimoine: {}, revenus: {}, fiscalite: {}, objectifs: {}, preconisationsPreliminaires: [], informationsManquantes: [], scoreCompletude: 0 }
    }

    // Sauvegarder le traitement
    await service.updateEntretien(id, {
      traitementType: validated.type,
      traitementResultat: parsedResult,
      traitementDate: new Date(),
      traitementPrompt: prompt.slice(0, 2000), // Tronquer pour ne pas surcharger la DB
      donneesExtraites: validated.type === 'BILAN_PATRIMONIAL' ? parsedResult : undefined,
      status: 'TRAITE',
      transcription: validated.transcription,
      transcriptionBrute: validated.transcription.map(s => `[${s.speaker}] ${s.text}`).join('\n'),
    })

    return createSuccessResponse({
      type: validated.type,
      resultat: parsedResult,
      rawContent: result.content,
      provider: result.provider,
      latencyMs: result.latencyMs,
    })
  } catch (error) {
    logger.error('Error in POST /api/advisor/entretiens/[id]/traiter:', { error: error instanceof Error ? error.message : String(error) })
    if (error instanceof Error && error.message === 'Unauthorized') return createErrorResponse('Unauthorized', 401)
    if (error instanceof Error && error.message === 'Entretien non trouvé') return createErrorResponse('Entretien non trouvé', 404)
    const message = error instanceof Error ? error.message : 'Erreur interne'
    return createErrorResponse(message, 500)
  }
}
