// ============================================================================
// AURA — Post-Meeting Autonomous Pipeline (spec §12.2)
//
// 9-step workflow exécuté après chaque entretien :
//   1. Extract & compact data           (subagent)
//   2. Compare with CRM                 (subagent)
//   3. Prepare CRM update proposal      (orchestrator)
//   4. Orchestrate simulators           (orchestrator)
//   5. Synthesize bilan & plan          (orchestrator)
//   6. Prepare document structure       (subagent)
//   7. Compliance checks                (subagent)
//   8. Propose actions                  (orchestrator)
//   9. Execute after validation          (subagent)
//
// Chaque étape est atomique, loggée, et vérifiable.
// L'orchestrator JAMAIS ne calcule — il délègue aux simulateurs.
// Toute mutation CRM passe par une PROPOSITION + VALIDATION (spec §9).
// ============================================================================

import { callAuraLLM, type AuraLLMResponse } from './aura-models'
import { POST_MEETING_PIPELINE_STEPS, type ConfidenceLevel } from './aura-config'
import { logger } from '@/app/_common/lib/logger'

// ── TYPES ──────────────────────────────────────────────────────────────────

export type PipelineStepId =
  | 'extract'
  | 'compare_crm'
  | 'crm_proposal'
  | 'simulators'
  | 'synthesis'
  | 'document'
  | 'compliance'
  | 'actions'
  | 'execute'

export type PipelineStepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped'

export interface PipelineStepResult {
  stepId: PipelineStepId
  status: PipelineStepStatus
  /** Données de sortie de l'étape */
  output?: unknown
  /** Erreur si échec */
  error?: string
  /** Durée d'exécution (ms) */
  durationMs: number
  /** Tokens consommés */
  tokensUsed: number
}

export interface MeetingCompact {
  /** ID de l'entretien */
  entretienId: string
  /** Titre */
  titre: string
  /** Date */
  dateEntretien: string
  /** Conseiller */
  conseillerId: string
  /** Client (si identifié) */
  clientId?: string
  clientName?: string
  /** Données extraites structurées */
  extractedData: ExtractedMeetingData
  /** Score de complétude (0-100) */
  completenessScore: number
  /** Informations manquantes */
  missingInfo: string[]
}

export interface ExtractedMeetingData {
  situationFamiliale?: {
    etatCivil?: string
    regimeMatrimonial?: string
    nombreEnfants?: number
    confidence: ConfidenceLevel
  }
  patrimoine?: {
    immobilier: Array<{ type: string; valeur: number; confidence: ConfidenceLevel }>
    financier: Array<{ type: string; montant: number; confidence: ConfidenceLevel }>
    dettes: Array<{ type: string; montant: number; confidence: ConfidenceLevel }>
    totalBrut?: number
    totalNet?: number
  }
  revenus?: {
    salaires?: number
    fonciers?: number
    bic_bnc?: number
    pensions?: number
    totalAnnuel?: number
    confidence: ConfidenceLevel
  }
  fiscalite?: {
    tmiEstime?: number
    ifiAssujetti?: boolean
    dispositifs: string[]
    confidence: ConfidenceLevel
  }
  objectifs?: {
    priorites: string[]
    horizon?: string
    preoccupations: string[]
  }
  preconisations?: Array<{
    titre: string
    description: string
    priorite: 'haute' | 'moyenne' | 'basse'
    categorie: string
  }>
}

export interface CRMComparison {
  /** Champs qui diffèrent entre l'entretien et le CRM */
  differences: Array<{
    field: string
    crmValue: unknown
    extractedValue: unknown
    confidence: ConfidenceLevel
    action: 'update' | 'review' | 'ignore'
  }>
  /** Nouveaux champs pas encore dans le CRM */
  newFields: Array<{
    field: string
    value: unknown
    confidence: ConfidenceLevel
  }>
}

export interface PipelineRunResult {
  entretienId: string
  /** Statut global */
  status: 'completed' | 'partial' | 'failed'
  /** Résultats par étape */
  steps: PipelineStepResult[]
  /** Données compactées du meeting (canonical memory) */
  meetingCompact?: MeetingCompact
  /** Comparaison CRM */
  crmComparison?: CRMComparison
  /** Durée totale */
  totalDurationMs: number
  /** Tokens totaux */
  totalTokensUsed: number
}

// ── PIPELINE PRINCIPAL ─────────────────────────────────────────────────────

/**
 * Exécute le pipeline post-meeting complet pour un entretien.
 *
 * Respecte les principes :
 *   - L'orchestrator ne calcule JAMAIS (§7)
 *   - Toute mutation CRM est une PROPOSITION (§9)
 *   - Données séparées en FACTS / ASSUMPTIONS / RECOMMENDATIONS (§4)
 *   - Données manquantes explicitement signalées (§4, §6)
 */
export async function runPostMeetingPipeline(
  entretienId: string,
  cabinetId: string,
  userId: string,
): Promise<PipelineRunResult> {
  const totalStart = Date.now()
  const steps: PipelineStepResult[] = []
  let totalTokensUsed = 0

  let meetingCompact: MeetingCompact | undefined
  let crmComparison: CRMComparison | undefined

  logger.info(`[AURA Pipeline] Starting post-meeting pipeline for entretien ${entretienId}`, {
    module: 'aura-pipeline',
    action: 'pipeline_start',
  })

  // ── Charger l'entretien ──
  let entretien: {
    id: string
    titre: string
    dateEntretien: Date
    conseillerId: string
    clientId: string | null
    transcription: unknown
    traitementResultat: unknown
    status: string
  } | null = null

  try {
    const { getPrismaClient } = await import('../../prisma')
    const prisma = getPrismaClient(cabinetId, false)
    entretien = await prisma.entretien.findUnique({
      where: { id: entretienId },
      select: {
        id: true,
        titre: true,
        dateEntretien: true,
        conseillerId: true,
        clientId: true,
        transcription: true,
        traitementResultat: true,
        status: true,
      },
    })
  } catch (error) {
    logger.error('[AURA Pipeline] Failed to load entretien', { module: 'aura-pipeline' }, error instanceof Error ? error : undefined)
  }

  if (!entretien) {
    return {
      entretienId,
      status: 'failed',
      steps: [{ stepId: 'extract', status: 'failed', error: 'Entretien non trouvé', durationMs: 0, tokensUsed: 0 }],
      totalDurationMs: Date.now() - totalStart,
      totalTokensUsed: 0,
    }
  }

  // Vérifier qu'on a une transcription
  const transcription = entretien.transcription as Array<{ speaker: string; text: string }> | null
  if (!transcription || !Array.isArray(transcription) || transcription.length === 0) {
    return {
      entretienId,
      status: 'failed',
      steps: [{ stepId: 'extract', status: 'failed', error: 'Pas de transcription disponible', durationMs: 0, tokensUsed: 0 }],
      totalDurationMs: Date.now() - totalStart,
      totalTokensUsed: 0,
    }
  }

  // ── STEP 1: Extract & Compact ──
  const step1 = await executeStep('extract', async () => {
    const transcriptText = transcription
      .map(s => `[${s.speaker}] ${s.text}`)
      .join('\n')

    // Si un traitement IA a déjà été fait, l'utiliser comme base
    if (entretien!.traitementResultat) {
      return {
        extractedData: entretien!.traitementResultat as ExtractedMeetingData,
        source: 'existing_traitement',
      }
    }

    // Sinon, extraction via subagent
    const result = await callAuraLLM({
      task: 'data_extraction',
      messages: [
        {
          role: 'system',
          content: `Tu es un extracteur de données patrimoniales. Extrais TOUTES les informations factuelles de cette transcription d'entretien CGP.

RÈGLES STRICTES :
- N'extrais QUE les informations explicitement mentionnées
- Assigne un niveau de confiance : HIGH (dit clairement), MED (implicite), LOW (estimation)
- Si une info n'est pas mentionnée, mets null
- Montants en euros, arrondis

Réponds en JSON valide avec la structure :
{
  "situationFamiliale": { "etatCivil": "...", "regimeMatrimonial": "...", "nombreEnfants": null, "confidence": "HIGH" },
  "patrimoine": { "immobilier": [], "financier": [], "dettes": [], "totalBrut": null, "totalNet": null },
  "revenus": { "salaires": null, "fonciers": null, "totalAnnuel": null, "confidence": "MED" },
  "fiscalite": { "tmiEstime": null, "ifiAssujetti": null, "dispositifs": [], "confidence": "LOW" },
  "objectifs": { "priorites": [], "horizon": null, "preoccupations": [] },
  "preconisations": [],
  "completenessScore": 0,
  "missingInfo": []
}`,
        },
        {
          role: 'user',
          content: `Transcription de l'entretien "${entretien!.titre}" :\n\n${transcriptText.slice(0, 15000)}`,
        },
      ],
      cabinetId,
      userId,
      maxTokens: 1400,
      temperature: 0.1,
    })

    // Parser le JSON de la réponse
    try {
      const jsonMatch = result.content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    } catch {
      // Extraction failed — return raw content
    }

    return { rawExtraction: result.content, tokensUsed: result.outputTokensEstimated }
  })

  steps.push(step1)
  totalTokensUsed += step1.tokensUsed

  if (step1.status === 'completed' && step1.output) {
    const extracted = step1.output as Record<string, unknown>
    meetingCompact = {
      entretienId,
      titre: entretien.titre,
      dateEntretien: entretien.dateEntretien.toISOString(),
      conseillerId: entretien.conseillerId,
      clientId: entretien.clientId || undefined,
      extractedData: (extracted.extractedData || extracted) as ExtractedMeetingData,
      completenessScore: (extracted.completenessScore as number) || 0,
      missingInfo: (extracted.missingInfo as string[]) || [],
    }
  }

  // ── STEP 2: Compare with CRM ──
  const step2 = await executeStep('compare_crm', async () => {
    if (!entretien!.clientId || !meetingCompact) {
      return { skipped: true, reason: 'Pas de client associé ou pas de données extraites' }
    }

    try {
      const { getPrismaClient } = await import('../../prisma')
      const prisma = getPrismaClient(cabinetId, false)
      const client = await prisma.client.findUnique({
        where: { id: entretien!.clientId! },
        select: {
          maritalStatus: true,
          marriageRegime: true,
          numberOfChildren: true,
          annualIncome: true,
          irTaxRate: true,
          ifiSubject: true,
          taxBracket: true,
        },
      })

      if (!client) return { skipped: true, reason: 'Client non trouvé' }

      // Comparaison simple CRM vs extraction
      const differences: CRMComparison['differences'] = []
      const extracted = meetingCompact.extractedData

      if (extracted.situationFamiliale?.nombreEnfants !== undefined && extracted.situationFamiliale.nombreEnfants !== null) {
        if (client.numberOfChildren !== extracted.situationFamiliale.nombreEnfants) {
          differences.push({
            field: 'numberOfChildren',
            crmValue: client.numberOfChildren,
            extractedValue: extracted.situationFamiliale.nombreEnfants,
            confidence: extracted.situationFamiliale.confidence,
            action: extracted.situationFamiliale.confidence === 'HIGH' ? 'update' : 'review',
          })
        }
      }

      return { differences, newFields: [] } as CRMComparison
    } catch {
      return { error: 'Erreur lors de la comparaison CRM' }
    }
  })

  steps.push(step2)
  totalTokensUsed += step2.tokensUsed

  if (step2.status === 'completed' && step2.output && !('skipped' in (step2.output as Record<string, unknown>))) {
    crmComparison = step2.output as CRMComparison
  }

  // ── STEP 3-8: Orchestrator synthesis & proposals ──
  // These steps use the orchestrator for strategic decisions
  const remainingSteps: PipelineStepId[] = ['crm_proposal', 'simulators', 'synthesis', 'document', 'compliance', 'actions']

  for (const stepId of remainingSteps) {
    const stepConfig = POST_MEETING_PIPELINE_STEPS.find(s => s.id === stepId)
    if (!stepConfig) continue

    const stepResult = await executeStep(stepId, async () => {
      if (!meetingCompact) {
        return { status: 'skipped', note: `Pas de données extraites disponibles pour ${stepId}` }
      }

      const extractedJSON = JSON.stringify(meetingCompact.extractedData, null, 2)
      const meetingTitle = meetingCompact.titre

      // ── STEP 3: CRM update proposal ──
      if (stepId === 'crm_proposal' && crmComparison) {
        const result = await callAuraLLM({
          task: 'crm_proposal',
          outputContext: 'crm_proposal',
          messages: [
            {
              role: 'system',
              content: `Tu es un assistant CRM expert. À partir des écarts identifiés entre l'entretien et le CRM, propose des mises à jour PRÉCISES au format JSON.

Retourne un JSON avec la structure :
{
  "updates": [
    { "champ": "nom_du_champ", "ancienneValeur": "...", "nouvelleValeur": "...", "confiance": "HAUTE|MOYENNE|BASSE", "source": "citation entretien" }
  ],
  "alertes": ["alerte si incohérence grave"],
  "donneesManquantes": ["donnée à collecter"]
}

NE propose que des mises à jour avec confiance HAUTE ou MOYENNE. JAMAIS d'écriture automatique.`,
            },
            {
              role: 'user',
              content: `Entretien "${meetingTitle}" — Écarts CRM détectés :\n${JSON.stringify(crmComparison, null, 2)}`,
            },
          ],
          cabinetId,
          userId,
          maxTokens: 1000,
        })
        return { proposal: result.content, tokensUsed: result.outputTokensEstimated }
      }

      // ── STEP 4: Simulators orchestration ──
      if (stepId === 'simulators') {
        const result = await callAuraLLM({
          task: 'simulators',
          outputContext: 'simulators',
          messages: [
            {
              role: 'system',
              content: `Tu es un orchestrateur de simulations patrimoniales. À partir des données extraites, identifie les simulations PERTINENTES à lancer.

Retourne un JSON :
{
  "simulations": [
    { "simulateur": "ir|per|succession|ifi|assurance-vie|immobilier|retraite|prevoyance-tns", "parametres": {...}, "justification": "..." }
  ],
  "nonApplicable": ["simulateur non pertinent et pourquoi"]
}

Ne propose que les simulations dont tu as ASSEZ de données. Indique les paramètres manquants.`,
            },
            {
              role: 'user',
              content: `Données extraites de "${meetingTitle}" :\n${extractedJSON}`,
            },
          ],
          cabinetId,
          userId,
          maxTokens: 1000,
        })
        return { simulationPlan: result.content, tokensUsed: result.outputTokensEstimated }
      }

      // ── STEP 5: Synthesis ──
      if (stepId === 'synthesis') {
        const result = await callAuraLLM({
          task: 'synthesis',
          outputContext: 'synthesis',
          messages: [
            {
              role: 'system',
              content: `Tu es un ingénieur patrimonial senior. Synthétise les données extraites de cet entretien en un bilan actionnable.

Structure ta réponse :
1. FAITS — Ce qui a été dit explicitement (avec niveau de confiance)
2. HYPOTHÈSES — Ce qui est déduit ou estimé
3. RECOMMANDATIONS — Actions concrètes à mener
4. DONNÉES MANQUANTES — Ce qu'il faut collecter au prochain RDV

Sois concis, factuel, et cite les montants.`,
            },
            {
              role: 'user',
              content: `Données extraites de l'entretien "${meetingTitle}" :\n\n${extractedJSON}`,
            },
          ],
          cabinetId,
          userId,
          maxTokens: 1400,
        })
        return { synthesis: result.content, tokensUsed: result.outputTokensEstimated }
      }

      // ── STEP 6: Document structure ──
      if (stepId === 'document') {
        const result = await callAuraLLM({
          task: 'document',
          outputContext: 'document',
          messages: [
            {
              role: 'system',
              content: `Tu es un rédacteur de rapports patrimoniaux (norme MiFID II / DDA). Propose la structure d'un compte-rendu d'entretien.

Retourne un JSON :
{
  "type": "compte_rendu_entretien",
  "sections": [
    { "titre": "...", "contenu": "résumé à inclure", "donneesRequises": ["champ CRM nécessaire"] }
  ],
  "documentsAnnexes": ["document à joindre (ex: simulation IR, bilan patrimonial)"]
}`,
            },
            {
              role: 'user',
              content: `Synthèse de l'entretien "${meetingTitle}" :\n${extractedJSON}`,
            },
          ],
          cabinetId,
          userId,
          maxTokens: 800,
        })
        return { documentStructure: result.content, tokensUsed: result.outputTokensEstimated }
      }

      // ── STEP 7: Compliance checks ──
      if (stepId === 'compliance') {
        const result = await callAuraLLM({
          task: 'compliance',
          outputContext: 'compliance',
          messages: [
            {
              role: 'system',
              content: `Tu es un expert conformité (ACPR, AMF, LCB-FT, DDA, MiFID II). Vérifie les obligations réglementaires suite à cet entretien.

Retourne un JSON :
{
  "checks": [
    { "obligation": "...", "statut": "OK|ALERTE|BLOQUANT", "detail": "...", "reference": "article/règlement" }
  ],
  "kycActions": ["mise à jour KYC nécessaire"],
  "devoirConseil": { "respecte": true/false, "manques": ["..."] }
}

Vérifie : devoir de conseil, adéquation produit/profil, KYC à jour, LCB-FT, consentements.`,
            },
            {
              role: 'user',
              content: `Données entretien "${meetingTitle}" :\n${extractedJSON}`,
            },
          ],
          cabinetId,
          userId,
          maxTokens: 800,
        })
        return { complianceReport: result.content, tokensUsed: result.outputTokensEstimated }
      }

      // ── STEP 8: Propose actions ──
      if (stepId === 'actions') {
        const result = await callAuraLLM({
          task: 'actions',
          outputContext: 'actions',
          messages: [
            {
              role: 'system',
              content: `Tu es un chef de projet CGP. À partir de l'entretien, propose des actions concrètes à exécuter dans le CRM.

Retourne un JSON :
{
  "actions": [
    { "type": "tache|rdv|email|opportunite|document", "titre": "...", "description": "...", "priorite": "P1|P2|P3|P4", "echeance": "J+N", "assignation": "conseiller|assistant" }
  ]
}

Priorise : P1 = urgent réglementaire, P2 = important commercial, P3 = suivi normal, P4 = nice-to-have.
Chaque action doit être EXÉCUTABLE dans le CRM (créer tâche, planifier RDV, envoyer email, etc.).`,
            },
            {
              role: 'user',
              content: `Données entretien "${meetingTitle}" :\n${extractedJSON}`,
            },
          ],
          cabinetId,
          userId,
          maxTokens: 1000,
        })
        return { actionPlan: result.content, tokensUsed: result.outputTokensEstimated }
      }

      return { status: 'skipped', note: `Step ${stepId} non reconnu` }
    })

    steps.push(stepResult)
    totalTokensUsed += stepResult.tokensUsed
  }

  // ── STEP 9: Execute (requires validation — never auto-execute) ──
  steps.push({
    stepId: 'execute',
    status: 'pending',
    output: { note: 'En attente de validation utilisateur pour exécuter les actions proposées' },
    durationMs: 0,
    tokensUsed: 0,
  })

  // ── Persister le meetingCompact ──
  if (meetingCompact) {
    try {
      const { getPrismaClient } = await import('../../prisma')
      const prisma = getPrismaClient(cabinetId, false)
      await prisma.entretien.update({
        where: { id: entretienId },
        data: {
          donneesExtraites: JSON.parse(JSON.stringify(meetingCompact.extractedData)),
        },
      })
    } catch {
      logger.warn('[AURA Pipeline] Failed to persist meeting compact', { module: 'aura-pipeline' })
    }
  }

  const totalDurationMs = Date.now() - totalStart
  const completedSteps = steps.filter(s => s.status === 'completed').length
  const failedSteps = steps.filter(s => s.status === 'failed').length

  logger.info(`[AURA Pipeline] Pipeline terminé: ${completedSteps} ok, ${failedSteps} failed (${totalDurationMs}ms, ${totalTokensUsed} tokens)`, {
    module: 'aura-pipeline',
    duration: totalDurationMs,
  })

  return {
    entretienId,
    status: failedSteps === 0 ? 'completed' : completedSteps > 0 ? 'partial' : 'failed',
    steps,
    meetingCompact,
    crmComparison,
    totalDurationMs,
    totalTokensUsed,
  }
}

// ── HELPER: Execute a pipeline step with error handling ─────────────────────

async function executeStep(
  stepId: PipelineStepId,
  fn: () => Promise<unknown>,
): Promise<PipelineStepResult> {
  const start = Date.now()
  try {
    const output = await fn()
    const tokensUsed = typeof output === 'object' && output && 'tokensUsed' in (output as Record<string, unknown>)
      ? (output as Record<string, unknown>).tokensUsed as number
      : 0

    return {
      stepId,
      status: 'completed',
      output,
      durationMs: Date.now() - start,
      tokensUsed,
    }
  } catch (error) {
    logger.error(`[AURA Pipeline] Step ${stepId} failed`, { module: 'aura-pipeline', action: stepId }, error instanceof Error ? error : undefined)
    return {
      stepId,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      durationMs: Date.now() - start,
      tokensUsed: 0,
    }
  }
}
