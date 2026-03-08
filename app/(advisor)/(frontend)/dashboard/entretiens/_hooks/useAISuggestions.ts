'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { api } from '@/app/_common/lib/api-client'
import {
  buildRAGContext,
  analyzeConversation,
  extractEntities,
} from '@/app/_common/lib/services/cgp-rag-knowledge'

// ============================================================================
// Hook IA — Aide à la découverte (suggestions contextuelles en temps réel)
//
// Cerveau de CGP expérimenté qui analyse la transcription et suggère :
//   • Questions de relance pertinentes basées sur l'écoute active
//   • Points de la checklist non encore abordés
//   • Alertes réglementaires (PER, IFI, succession, démembrement...)
//   • Approfondissements métier (régime matrimonial, prévoyance, TMI...)
//
// Intègre un RAG embarqué : fondamentaux de la découverte patrimoniale,
// méthodologie d'entretien CGP, questions clés par thématique.
// ============================================================================

// Le CGP_BRAIN_KNOWLEDGE statique est remplacé par le RAG dynamique (cgp-rag-knowledge.ts)
// Le système analyse la conversation en temps réel et injecte les connaissances pertinentes

export interface AISuggestion {
  id: string
  question: string
  raison: string
  priorite: 'haute' | 'moyenne' | 'basse'
  categorie: 'relance' | 'checklist' | 'alerte' | 'approfondissement'
  dismissed: boolean
}

interface UseAISuggestionsOptions {
  /** Type d'entretien (DECOUVERTE, SUIVI_PERIODIQUE, etc.) */
  entretienType: string
  /** Points de la checklist restants */
  checklistRestants: string[]
  /** Brief client (patrimoine, situation, etc.) */
  clientBrief: Record<string, unknown> | null
  /** Segments de transcription */
  segments: Array<{ speaker: string; text: string; timestamp: number }>
  /** Activer les suggestions */
  enabled: boolean
  /** Délai entre deux appels IA (ms) — défaut 25s */
  debounceMs?: number
  /** Nombre min de nouveaux mots avant de déclencher une analyse */
  minNewWords?: number
}

interface AISuggestionsState {
  suggestions: AISuggestion[]
  isLoading: boolean
  error: string | null
  lastAnalyzedAt: number | null
  /** Score de complétude de la découverte (0-100%) via RAG */
  completenessScore: number
  /** Entités patrimoniales détectées dans la conversation */
  detectedEntities: Record<string, string[]>
  /** Alertes RAG en cours */
  ragAlerts: string[]
}

export function useAISuggestions(options: UseAISuggestionsOptions) {
  const {
    entretienType,
    checklistRestants,
    clientBrief,
    segments,
    enabled,
    debounceMs = 25000,
    minNewWords = 30,
  } = options

  const [state, setState] = useState<AISuggestionsState>({
    suggestions: [],
    isLoading: false,
    error: null,
    lastAnalyzedAt: null,
    completenessScore: 0,
    detectedEntities: {},
    ragAlerts: [],
  })

  const lastWordCountRef = useRef(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const requestIdRef = useRef(0)

  const totalWords = segments.reduce((sum, s) => sum + (s.text?.split(/\s+/).length || 0), 0)

  const fetchSuggestions = useCallback(async () => {
    if (!enabled || segments.length === 0) return

    const currentWordCount = segments.reduce((sum, s) => sum + (s.text?.split(/\s+/).length || 0), 0)
    if (currentWordCount - lastWordCountRef.current < minNewWords && state.suggestions.length > 0) return

    // Cancel previous request
    abortRef.current?.abort()
    abortRef.current = new AbortController()

    const requestId = ++requestIdRef.current
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      // Build context for AI using dynamic RAG
      const recentSegments = segments.slice(-15)
      const transcriptionText = recentSegments
        .map(s => `[${s.speaker === 'conseiller' ? 'Conseiller' : s.speaker === 'client' ? 'Client' : s.speaker}] ${s.text}`)
        .join('\n')

      const briefSummary = clientBrief ? buildBriefSummary(clientBrief) : 'Aucun brief client disponible.'

      // RAG dynamique : analyse la conversation complète et injecte les connaissances pertinentes
      const fullText = segments.map(s => s.text).join(' ')
      const ragContext = buildRAGContext(fullText, entretienType)
      const ragAnalysis = analyzeConversation(fullText, entretienType)
      const entities = extractEntities(fullText)

      const prompt = `Tu es le cerveau silencieux d'un CGP senior (20 ans d'expérience) qui assiste un conseiller pendant un entretien en cours. Tu pratiques l'écoute active et tu anticipes les besoins du conseiller.

TYPE D'ENTRETIEN : ${entretienType}

${ragContext}

ENTITÉS PATRIMONIALES DÉTECTÉES DANS LA CONVERSATION :
- Montants mentionnés : ${entities.montants.length > 0 ? entities.montants.join(', ') : 'Aucun'}
- Produits financiers : ${entities.produits.length > 0 ? entities.produits.join(', ') : 'Aucun'}
- Statuts détectés : ${entities.statuts.length > 0 ? entities.statuts.join(', ') : 'Non identifiés'}
- Objectifs évoqués : ${entities.objectifs.length > 0 ? entities.objectifs.join(', ') : 'Non identifiés'}

POINTS DE LA CHECKLIST NON COCHÉS :
${checklistRestants.length > 0 ? checklistRestants.map(p => `- ${p}`).join('\n') : '(Tous les points ont été abordés)'}

BRIEF CLIENT :
${briefSummary}

DERNIERS ÉCHANGES (les plus récents en dernier) :
${transcriptionText}

---

En te basant sur ce qui vient d'être dit, l'analyse RAG ci-dessus, et les entités détectées, suggère exactement 3 questions pertinentes pour le conseiller.

RÈGLES STRICTES :
1. PRIORITÉ #1 — ÉCOUTE ACTIVE : Si le client vient de parler d'un sujet, pose une question d'approfondissement directe sur CE sujet en utilisant les connaissances détaillées fournies par le RAG
2. PRIORITÉ #2 — SUJETS NON COUVERTS : Propose une question pour aborder le sujet prioritaire parmi ceux marqués "NON ENCORE ABORDÉS" dans l'analyse RAG
3. PRIORITÉ #3 — ALERTES : Signale toute alerte réglementaire ou patrimoniale listée dans l'analyse RAG
4. Formule chaque question EXACTEMENT comme le conseiller la poserait au client (1 phrase, vouvoiement)
5. Utilise les questions spécifiques du RAG — ne les reformule PAS, utilise-les telles quelles quand c'est pertinent
6. N'invente JAMAIS d'informations sur le client — base-toi UNIQUEMENT sur ce qui a été dit
7. La "raison" doit citer la source RAG et expliquer pourquoi cette question est pertinente maintenant

Réponds UNIQUEMENT en JSON valide, sans texte avant/après :
[
  {"question": "...", "raison": "[Source RAG] ...", "priorite": "haute|moyenne|basse", "categorie": "relance|checklist|alerte|approfondissement"}
]`

      const result = await api.post<{ response: string }>('/advisor/ai/chat', {
        message: prompt,
        history: [],
        enableRag: false,
      })

      // Only update if this is still the latest request
      if (requestId !== requestIdRef.current) return

      const responseText = (result as any).response || (result as any).data?.response || ''
      const parsed = parseAISuggestions(responseText)

      lastWordCountRef.current = currentWordCount
      setState(prev => ({
        ...prev,
        suggestions: parsed.map((s, i) => ({
          ...s,
          id: `sug-${Date.now()}-${i}`,
          dismissed: false,
        })),
        isLoading: false,
        lastAnalyzedAt: Date.now(),
        completenessScore: ragAnalysis.completenessScore,
        detectedEntities: entities,
        ragAlerts: ragAnalysis.alerts,
      }))
    } catch (err) {
      if (requestId !== requestIdRef.current) return
      if ((err as Error).name === 'AbortError') return

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Erreur IA',
      }))
    }
  }, [enabled, segments, entretienType, checklistRestants, clientBrief, minNewWords, state.suggestions.length])

  // Debounced auto-fetch when segments change
  useEffect(() => {
    if (!enabled || segments.length === 0) return

    const newWords = totalWords - lastWordCountRef.current
    if (newWords < minNewWords && state.suggestions.length > 0) return

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      fetchSuggestions()
    }, debounceMs)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [totalWords, enabled, debounceMs, minNewWords, state.suggestions.length, fetchSuggestions])

  // Cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      abortRef.current?.abort()
    }
  }, [])

  const dismiss = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      suggestions: prev.suggestions.map(s => s.id === id ? { ...s, dismissed: true } : s),
    }))
  }, [])

  const refresh = useCallback(() => {
    lastWordCountRef.current = 0
    fetchSuggestions()
  }, [fetchSuggestions])

  return {
    suggestions: state.suggestions.filter(s => !s.dismissed),
    allSuggestions: state.suggestions,
    isLoading: state.isLoading,
    error: state.error,
    lastAnalyzedAt: state.lastAnalyzedAt,
    /** Score de complétude de la découverte (0-100%) basé sur le RAG */
    completenessScore: state.completenessScore,
    /** Entités patrimoniales détectées (montants, produits, statuts, objectifs) */
    detectedEntities: state.detectedEntities,
    /** Alertes réglementaires et patrimoniales en cours */
    ragAlerts: state.ragAlerts,
    dismiss,
    refresh,
  }
}

// ── Helpers ──

function buildBriefSummary(brief: Record<string, unknown>): string {
  const parts: string[] = []
  const client = brief.client as Record<string, unknown> | undefined

  if (client) {
    if (client.patrimoineNet != null) parts.push(`Patrimoine net : ${Number(client.patrimoineNet).toLocaleString('fr-FR')} €`)
    if (client.totalRevenus != null) parts.push(`Revenus annuels : ${Number(client.totalRevenus).toLocaleString('fr-FR')} €`)
    if (client.capaciteEpargne != null) parts.push(`Capacité épargne : ${Number(client.capaciteEpargne).toLocaleString('fr-FR')} €/mois`)
    if (client.tauxEndettement != null) parts.push(`Endettement : ${Number(client.tauxEndettement).toFixed(1)}%`)
    if (client.maritalStatus) parts.push(`Situation : ${client.maritalStatus}`)
    if ((client.numberOfChildren as number) > 0) parts.push(`Enfants : ${client.numberOfChildren}`)
    if (client.profession) parts.push(`Profession : ${client.profession}`)
    if (client.riskProfile) parts.push(`Profil risque : ${client.riskProfile}`)
    if (client.age) parts.push(`Âge : ${client.age} ans`)
  }

  const alertes = brief.alertes as string[] | undefined
  if (alertes?.length) parts.push(`Alertes : ${alertes.join(', ')}`)

  const actions = brief.actionsEnAttente as Array<{ action: string }> | undefined
  if (actions?.length) parts.push(`Actions en attente : ${actions.map(a => a.action).join(', ')}`)

  return parts.length > 0 ? parts.join('\n') : 'Pas de données client disponibles.'
}

function parseAISuggestions(text: string): Omit<AISuggestion, 'id' | 'dismissed'>[] {
  try {
    // Extract JSON array from response (might have surrounding text)
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return fallbackSuggestions()

    const parsed = JSON.parse(jsonMatch[0])
    if (!Array.isArray(parsed)) return fallbackSuggestions()

    return parsed
      .filter((item: Record<string, unknown>) => item.question && typeof item.question === 'string')
      .slice(0, 4)
      .map((item: Record<string, unknown>) => ({
        question: String(item.question),
        raison: String(item.raison || ''),
        priorite: (['haute', 'moyenne', 'basse'].includes(String(item.priorite)) ? String(item.priorite) : 'moyenne') as AISuggestion['priorite'],
        categorie: (['relance', 'checklist', 'alerte', 'approfondissement'].includes(String(item.categorie)) ? String(item.categorie) : 'relance') as AISuggestion['categorie'],
      }))
  } catch {
    return fallbackSuggestions()
  }
}

function fallbackSuggestions(): Omit<AISuggestion, 'id' | 'dismissed'>[] {
  return [
    { question: 'Pouvez-vous me préciser votre situation actuelle ?', raison: 'Question ouverte de relance', priorite: 'moyenne', categorie: 'relance' },
  ]
}
