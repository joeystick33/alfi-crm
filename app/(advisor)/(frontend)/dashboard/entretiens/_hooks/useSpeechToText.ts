'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

// ============================================================================
// Hook Speech-to-Text — Web Speech API + Whisper backend
//
// Deux moteurs disponibles :
//   • 'browser' : Web Speech API (Chrome/Edge) — gratuit, latence faible
//   • 'whisper' : Whisper via backend (Groq/OpenAI) — qualité supérieure
//
// Améliorations qualité :
//   • Filtrage confiance (seuil 0.35) — rejette les résultats bruités
//   • Détection artéfacts bruit — filtre les faux positifs
//   • Longueur minimale segment — rejette les fragments < 2 mots
//   • Post-traitement étendu : 80+ corrections patrimoine/français
//   • Reconnexion auto pour entretiens longs (~1h+)
//   • Gestion accents : maxAlternatives=5, sélection best confidence
//   • Mode Whisper : capture audio → MediaRecorder → backend → Whisper
// ============================================================================

// Web Speech API types (not in default TS lib)
interface SpeechRecognitionEvent extends Event {
  resultIndex: number
  results: SpeechRecognitionResultList
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message: string
}
interface SpeechRecognitionInstance extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  start(): void
  stop(): void
  abort(): void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  onsoundstart: (() => void) | null
  onsoundend: (() => void) | null
}

export type AudioMode = 'presentiel' | 'visio' | 'telephone'
export type STTEngine = 'browser' | 'whisper'

/** Segment diarisé retourné par le pipeline backend */
export interface PipelineDiarizedSegment {
  id: string
  speaker: string
  text: string
  start: number
  end: number
  confidence: number
}

interface SpeechToTextOptions {
  language?: string
  continuous?: boolean
  interimResults?: boolean
  onResult?: (transcript: string, isFinal: boolean, confidence?: number) => void
  onError?: (error: string) => void
  onSilenceDetected?: () => void
  /** Callback pour les segments diarisés (mode Whisper pipeline) */
  onDiarizedSegments?: (segments: PipelineDiarizedSegment[]) => void
  /** Durée de silence (ms) avant notification — défaut 2500ms */
  silenceThresholdMs?: number
  /** Mode audio — affecte la source et les paramètres */
  audioMode?: AudioMode
  /** Moteur de transcription (défaut: 'browser') */
  engine?: STTEngine
  /** MediaStream pour le mode Whisper (fourni par le visualizer) */
  mediaStream?: MediaStream | null
  /** Hint locuteur initial pour la diarisation pipeline */
  speakerHint?: string
}

interface SpeechToTextState {
  isListening: boolean
  isSupported: boolean
  error: string | null
  transcript: string
  interimTranscript: string
  /** Confiance du dernier résultat final (0-1) */
  lastConfidence: number
  /** Silence détecté depuis X ms */
  silenceDurationMs: number
  /** Nombre de reconnexions automatiques */
  reconnectCount: number
  /** Nombre de segments rejetés (bruit) */
  rejectedCount: number
  /** Qualité pipeline (mode Whisper) */
  pipelineQuality: { avgConfidence: number; rejectedSegments: number; totalSegments: number; llmCorrected: boolean } | null
}

// ── Seuils de qualité ──
const MIN_CONFIDENCE = 0.35
const MIN_WORDS = 2
const MAX_REPEATED_CHARS = 4 // "aaaa" = bruit

// ── Patterns de bruit à rejeter ──
const NOISE_PATTERNS: RegExp[] = [
  /^(euh|hmm|hm|ah|oh|uh|hein|bah|pff|tss)+\.?$/i,
  /^[a-zA-Zàéèêë]\.?$/i, // Lettre seule
  /^(.)\1{3,}$/i, // Caractère répété 4+ fois
  /^\W+$/, // Que de la ponctuation
  /^(oui|non|ok|d'accord|voilà)\.?$/i, // Mots trop courts isolés (souvent du bruit)
  /^(merci|pardon|excusez)\.?$/i,
  /^\d{1,2}\.?$/, // Chiffres seuls (bruit)
  /^(la|le|les|un|une|des|de|du|en|et|ou|à|au)\.?$/i, // Articles/prép. isolés
]

// ── Dictionnaire de corrections étendu ──
const CORRECTIONS: [RegExp, string][] = [
  // ─── Acronymes patrimoniaux ───
  [/\bper\b/gi, 'PER'],
  [/\bpea\b/gi, 'PEA'],
  [/\bifi\b/gi, 'IFI'],
  [/\bscpi\b/gi, 'SCPI'],
  [/\bopci\b/gi, 'OPCI'],
  [/\btmi\b/gi, 'TMI'],
  [/\bcsg\b/gi, 'CSG'],
  [/\bcrds\b/gi, 'CRDS'],
  [/\bcgi\b/gi, 'CGI'],
  [/\bdmtg\b/gi, 'DMTG'],
  [/\bpfu\b/gi, 'PFU'],
  [/\birpp?\b/gi, 'IR'],
  [/\blmnp\b/gi, 'LMNP'],
  [/\blmp\b/gi, 'LMP'],
  [/\bsci\b/gi, 'SCI'],
  [/\bsarl\b/gi, 'SARL'],
  [/\bsas\b/gi, 'SAS'],
  [/\bsasu\b/gi, 'SASU'],
  [/\beurl\b/gi, 'EURL'],
  [/\bei\b/gi, 'EI'],
  [/\brgpd\b/gi, 'RGPD'],
  [/\bkyc\b/gi, 'KYC'],
  [/\bdda\b/gi, 'DDA'],
  [/\blcb[- ]?ft\b/gi, 'LCB-FT'],
  [/\bmifid\b/gi, 'MiFID'],
  [/\bperp\b/gi, 'PERP'],
  [/\bperco\b/gi, 'PERCO'],
  [/\bpereco\b/gi, 'PERECO'],
  [/\bpee\b/gi, 'PEE'],
  [/\bfcp\b/gi, 'FCP'],
  [/\bfcpi\b/gi, 'FCPI'],
  [/\bfip\b/gi, 'FIP'],
  [/\bsofica\b/gi, 'SOFICA'],
  [/\bcehr\b/gi, 'CEHR'],
  [/\bpass\b/gi, 'PASS'],
  [/\btns\b/gi, 'TNS'],
  [/\bbnc\b/gi, 'BNC'],
  [/\bbic\b/gi, 'BIC'],
  [/\buc\b/gi, 'UC'],
  [/\beuro(?:s)?\b/gi, '€'],
  [/\bhcsf\b/gi, 'HCSF'],
  [/\bgfa\b/gi, 'GFA'],
  [/\bpacs?\b/gi, 'PACS'],
  [/\bldds\b/gi, 'LDDS'],
  [/\bcel\b/gi, 'CEL'],
  [/\bpel\b/gi, 'PEL'],
  [/\bpep\b/gi, 'PEP'],
  [/\bcto\b/gi, 'CTO'],

  // ─── Termes patrimoniaux composés ───
  [/\bass(?:urance)?[- ]?vie\b/gi, 'assurance-vie'],
  [/\bnue[- ]?propriété\b/gi, 'nue-propriété'],
  [/\bnu[- ]?propriétaire\b/gi, 'nu-propriétaire'],
  [/\bpleine? propriété\b/gi, 'pleine propriété'],
  [/\busufruit\b/gi, 'usufruit'],
  [/\busufruitier\b/gi, 'usufruitier'],
  [/\bdémembrement\b/gi, 'démembrement'],
  [/\bpacte dutreil\b/gi, 'Pacte Dutreil'],
  [/\bdutreil\b/gi, 'Dutreil'],
  [/\bmadelin\b/gi, 'Madelin'],
  [/\bpinel\b/gi, 'Pinel'],
  [/\bmalraux\b/gi, 'Malraux'],
  [/\bdenormandie\b/gi, 'Denormandie'],
  [/\bgirardin\b/gi, 'Girardin'],
  [/\bscellier\b/gi, 'Scellier'],
  [/\brobien\b/gi, 'Robien'],
  [/\bcensi[- ]?bouvard\b/gi, 'Censi-Bouvard'],
  [/\bdonation[- ]?partage\b/gi, 'donation-partage'],
  [/\bdonation au dernier vivant\b/gi, 'donation au dernier vivant'],
  [/\brégime matrimonial\b/gi, 'régime matrimonial'],
  [/\bséparation de bien(?:s)?\b/gi, 'séparation de biens'],
  [/\bcommunauté (?:réduite )?aux acquêts\b/gi, 'communauté réduite aux acquêts'],
  [/\bcommunauté universelle\b/gi, 'communauté universelle'],
  [/\bclause bénéficiaire\b/gi, 'clause bénéficiaire'],
  [/\bclause de préciput\b/gi, 'clause de préciput'],
  [/\bquotient familial\b/gi, 'quotient familial'],
  [/\brevenu fiscal de référence\b/gi, 'revenu fiscal de référence'],
  [/\bprofil de risque\b/gi, 'profil de risque'],
  [/\bcapacité d'emprunt\b/gi, "capacité d'emprunt"],
  [/\bcapacité d'épargne\b/gi, "capacité d'épargne"],
  [/\brésidence principale\b/gi, 'résidence principale'],
  [/\brésidence secondaire\b/gi, 'résidence secondaire'],
  [/\bimmobilier locatif\b/gi, 'immobilier locatif'],
  [/\bdéficit foncier\b/gi, 'déficit foncier'],
  [/\bprélèvements sociaux\b/gi, 'prélèvements sociaux'],
  [/\bflat tax\b/gi, 'flat tax'],
  [/\babattement\b/gi, 'abattement'],
  [/\bplafond de niche(?:s)?\b/gi, 'plafond de niches'],
  [/\bimpôt sur le revenu\b/gi, 'impôt sur le revenu'],
  [/\bimpôt sur la fortune\b/gi, 'impôt sur la fortune'],
  [/\bdroit(?:s)? de succession\b/gi, 'droits de succession'],
  [/\bdroit(?:s)? de donation\b/gi, 'droits de donation'],
  [/\bépargne salariale\b/gi, 'épargne salariale'],
  [/\bretraite complémentaire\b/gi, 'retraite complémentaire'],

  // ─── Erreurs STT françaises courantes ───
  [/\bsait pas\b/gi, "c'est pas"],
  [/\bquand même\b/gi, 'quand même'],
  [/\ben fait\b/gi, 'en fait'],
  [/\bc'est[- ]à[- ]dire\b/gi, "c'est-à-dire"],
  [/\bpar rapport\b/gi, 'par rapport'],
  [/\bau niveau de?\b/gi, 'au niveau de'],
  [/\bdu coup\b/gi, 'du coup'],

  // ─── Nombres et montants (normalisation) ───
  [/\b(\d+)\s*(?:milles?|mils?)\b/gi, '$1 000'],
  [/\b(\d+)\s*millions?\b/gi, '$1 000 000'],
  [/\b(\d+)\s*milliards?\b/gi, '$1 000 000 000'],
  [/\bcent\s*mille\b/gi, '100 000'],
  [/\bdeux\s*cent\s*mille\b/gi, '200 000'],
  [/\btrois\s*cent\s*mille\b/gi, '300 000'],
  [/\bquatre\s*cent\s*mille\b/gi, '400 000'],
  [/\bcinq\s*cent\s*mille\b/gi, '500 000'],
  [/\bun\s*million\b/gi, '1 000 000'],
  [/\bdeux\s*millions?\b/gi, '2 000 000'],
]

/**
 * Détecte si un résultat de transcription est probablement du bruit.
 * Utilise une analyse multi-critères pour une détection robuste en environnement bruyant :
 *   1. Confiance STT
 *   2. Longueur et contenu du texte
 *   3. Patterns de bruit connus
 *   4. Ratio voyelles/consonnes (parole vs bruit)
 *   5. Répétitions anormales
 *   6. Entropie lexicale (diversité des mots)
 */
function isLikelyNoise(text: string, confidence: number): boolean {
  const trimmed = text.trim()

  // Confiance trop basse
  if (confidence > 0 && confidence < MIN_CONFIDENCE) return true

  // Texte vide ou trop court
  if (!trimmed) return true
  const wordCount = trimmed.split(/\s+/).filter(w => w.length > 0).length
  if (wordCount < MIN_WORDS) {
    // Exception : certains mots courts sont valides en contexte CGP
    const validShort = /^\d[\d\s,.]*[€%]?$|^(oui|non|d'accord)$/i
    if (!validShort.test(trimmed)) return true
  }

  // Pattern de bruit connu
  if (NOISE_PATTERNS.some(p => p.test(trimmed))) return true

  // Caractères répétés excessivement
  if (/(.)\1{3,}/i.test(trimmed)) return true

  // Trop de mots identiques consécutifs (bégaiement/bruit)
  const words = trimmed.toLowerCase().split(/\s+/)
  let consecutiveCount = 1
  for (let i = 1; i < words.length; i++) {
    if (words[i] === words[i - 1]) {
      consecutiveCount++
      if (consecutiveCount >= 3) return true
    } else {
      consecutiveCount = 1
    }
  }

  // Ratio voyelles anormal (parole française = ~45% voyelles, bruit < 20% ou > 70%)
  if (trimmed.length > 5) {
    const vowelCount = (trimmed.match(/[aeiouyàâäéèêëïîôùûü]/gi) || []).length
    const letterCount = (trimmed.match(/[a-zA-Zàâäéèêëïîôùûüç]/gi) || []).length
    if (letterCount > 0) {
      const vowelRatio = vowelCount / letterCount
      if (vowelRatio < 0.15 || vowelRatio > 0.75) return true
    }
  }

  // Entropie lexicale : si le texte a plus de 5 mots mais très peu de mots uniques, c'est suspect
  if (words.length >= 5) {
    const uniqueWords = new Set(words).size
    const diversity = uniqueWords / words.length
    if (diversity < 0.3) return true // Moins de 30% de mots uniques = bruit/hallucination
  }

  // Confiance marginale + texte court = probablement du bruit
  if (confidence > 0 && confidence < 0.55 && wordCount <= 3) return true

  return false
}

/**
 * Post-traitement avancé du texte transcrit :
 * - Filtrage filler words optionnel
 * - Corrections patrimoine/finance (80+ règles)
 * - Normalisation nombres/montants
 * - Capitalisation intelligente
 * - Ponctuation
 */
function postProcessTranscript(text: string): string {
  let cleaned = text.trim()
  if (!cleaned) return cleaned

  // Capitaliser la première lettre
  cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1)

  // Supprimer les filler words en début de phrase
  cleaned = cleaned.replace(/^(Euh,?\s*|Hmm,?\s*|Alors,?\s*euh,?\s*)/i, '')
  // Re-capitaliser si on a supprimé le début
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
  }

  // Appliquer les corrections (80+ règles patrimoine/finance/français)
  for (const [pattern, replacement] of CORRECTIONS) {
    cleaned = cleaned.replace(pattern, replacement)
  }

  // Nettoyer espaces multiples
  cleaned = cleaned.replace(/\s{2,}/g, ' ')

  // Supprimer les espaces avant la ponctuation
  cleaned = cleaned.replace(/\s+([.!?,;:])/g, '$1')

  // Ajouter espace après ponctuation si manquant
  cleaned = cleaned.replace(/([.!?,;:])([A-ZÀ-Ü])/g, '$1 $2')

  // Ajouter un point final si pas de ponctuation
  if (cleaned.length > 2 && !/[.!?;:]$/.test(cleaned)) {
    cleaned += '.'
  }

  return cleaned
}

export function useSpeechToText(options: SpeechToTextOptions = {}) {
  const {
    language = 'fr-FR',
    continuous = true,
    interimResults = true,
    onResult,
    onError,
    onSilenceDetected,
    onDiarizedSegments,
    silenceThresholdMs = 2500,
    audioMode = 'presentiel',
    engine = 'browser' as STTEngine,
    mediaStream = null,
    speakerHint = 'conseiller',
  } = options

  const [state, setState] = useState<SpeechToTextState>({
    isListening: false,
    isSupported: false,
    error: null,
    transcript: '',
    interimTranscript: '',
    lastConfidence: 0,
    silenceDurationMs: 0,
    reconnectCount: 0,
    rejectedCount: 0,
    pipelineQuality: null,
  })

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const shouldRestartRef = useRef(false)
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Silence detection refs
  const lastSoundTimeRef = useRef<number>(Date.now())
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const silenceNotifiedRef = useRef(false)

  // Whisper engine refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const whisperIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const whisperProcessingRef = useRef(false)
  const whisperChunkIndexRef = useRef(0)
  const previousContextRef = useRef('')
  const onResultRef = useRef(onResult)
  const onDiarizedSegmentsRef = useRef(onDiarizedSegments)
  useEffect(() => { onResultRef.current = onResult }, [onResult])
  useEffect(() => { onDiarizedSegmentsRef.current = onDiarizedSegments }, [onDiarizedSegments])

  // Check browser support
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    setState(prev => ({ ...prev, isSupported: !!SpeechRecognition }))
  }, [])

  // Silence detection loop
  useEffect(() => {
    if (!state.isListening || !onSilenceDetected) return

    silenceTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - lastSoundTimeRef.current
      setState(prev => ({ ...prev, silenceDurationMs: elapsed }))

      if (elapsed >= silenceThresholdMs && !silenceNotifiedRef.current) {
        silenceNotifiedRef.current = true
        onSilenceDetected()
      }
    }, 500)

    return () => {
      if (silenceTimerRef.current) clearInterval(silenceTimerRef.current)
    }
  }, [state.isListening, onSilenceDetected, silenceThresholdMs])

  const createRecognition = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) return null

    const recognition = new SpeechRecognition()
    recognition.lang = language
    recognition.continuous = continuous
    recognition.interimResults = interimResults
    // 5 alternatives pour mieux gérer accents + bruit — on prend le meilleur score
    recognition.maxAlternatives = 5

    recognition.onresult = (event: any) => {
      let finalTranscript = ''
      let interimText = ''
      let bestConfidence = 0

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          // Parmi les 5 alternatives, prendre celle avec la meilleure confiance
          let bestAlt = result[0]
          for (let a = 1; a < result.length; a++) {
            if (result[a].confidence > bestAlt.confidence) {
              bestAlt = result[a]
            }
          }
          finalTranscript += bestAlt.transcript
          bestConfidence = Math.max(bestConfidence, bestAlt.confidence || 0)
        } else {
          interimText += result[0].transcript
        }
      }

      // Reset silence detection on any speech
      lastSoundTimeRef.current = Date.now()
      silenceNotifiedRef.current = false

      if (finalTranscript) {
        // ── FILTRAGE QUALITÉ : rejeter le bruit ──
        if (isLikelyNoise(finalTranscript, bestConfidence)) {
          setState(prev => ({ ...prev, rejectedCount: prev.rejectedCount + 1, interimTranscript: '' }))
          return
        }

        const processed = postProcessTranscript(finalTranscript)

        // Double vérification post-traitement (le nettoyage peut réduire le texte)
        if (!processed || processed.length < 2) {
          setState(prev => ({ ...prev, rejectedCount: prev.rejectedCount + 1, interimTranscript: '' }))
          return
        }

        setState(prev => ({
          ...prev,
          transcript: processed,
          interimTranscript: '',
          lastConfidence: bestConfidence,
          silenceDurationMs: 0,
        }))
        onResult?.(processed, true, bestConfidence)
      } else if (interimText) {
        setState(prev => ({ ...prev, interimTranscript: interimText, silenceDurationMs: 0 }))
        onResult?.(interimText, false)
      }
    }

    // Sound start/end for silence detection
    recognition.onsoundstart = () => {
      lastSoundTimeRef.current = Date.now()
      silenceNotifiedRef.current = false
    }
    recognition.onsoundend = () => {
      // Will be caught by silence timer
    }

    recognition.onerror = (event: any) => {
      // 'no-speech' and 'aborted' are non-critical — auto-restart
      if (event.error === 'no-speech' || event.error === 'aborted') {
        if (shouldRestartRef.current) {
          restartTimeoutRef.current = setTimeout(() => {
            try { recognition.start() } catch { /* ignore */ }
          }, 300)
          setState(prev => ({ ...prev, reconnectCount: prev.reconnectCount + 1 }))
        }
        return
      }

      const errorMsg = event.error === 'not-allowed'
        ? 'Accès au microphone refusé. Veuillez autoriser l\'accès dans les paramètres du navigateur.'
        : event.error === 'network'
          ? 'Erreur réseau. La reconnaissance vocale nécessite une connexion internet (Chrome).'
          : event.error === 'audio-capture'
            ? audioMode === 'visio'
              ? 'Impossible de capturer l\'audio. Assurez-vous de partager l\'audio de l\'onglet lors du partage d\'écran.'
              : 'Impossible d\'accéder au microphone. Vérifiez vos paramètres audio.'
            : `Erreur de reconnaissance vocale : ${event.error}`

      setState(prev => ({ ...prev, error: errorMsg, isListening: false }))
      onError?.(errorMsg)
    }

    recognition.onend = () => {
      // Auto-restart if we should still be listening (Web Speech API stops after ~60s of silence)
      if (shouldRestartRef.current) {
        restartTimeoutRef.current = setTimeout(() => {
          try {
            recognition.start()
          } catch {
            // If restart fails, create a new instance
            recognitionRef.current = createRecognition()
            try { recognitionRef.current?.start() } catch { /* give up */ }
          }
          setState(prev => ({ ...prev, reconnectCount: prev.reconnectCount + 1 }))
        }, 200)
      } else {
        setState(prev => ({ ...prev, isListening: false }))
      }
    }

    return recognition
  }, [language, continuous, interimResults, onResult, onError, audioMode])

  // ── Whisper Pipeline : envoyer un chunk audio au backend avancé ──
  const processWhisperChunk = useCallback(async () => {
    if (whisperProcessingRef.current || audioChunksRef.current.length === 0) return
    whisperProcessingRef.current = true

    const chunks = audioChunksRef.current.splice(0)
    const blob = new Blob(chunks, { type: 'audio/webm;codecs=opus' })

    // Ignorer les chunks trop petits (< 1s ≈ < 12KB)
    if (blob.size < 12000) {
      whisperProcessingRef.current = false
      return
    }

    setState(prev => ({ ...prev, interimTranscript: '🎙️ Transcription pipeline...' }))

    try {
      const form = new FormData()
      form.append('audio', blob, 'chunk.webm')
      form.append('language', language.split('-')[0] || 'fr')
      form.append('speakerHint', speakerHint)
      form.append('chunkIndex', String(whisperChunkIndexRef.current))
      // Envoyer le contexte des derniers segments pour la continuité Whisper
      if (previousContextRef.current) {
        form.append('previousContext', previousContextRef.current)
      }

      const response = await fetch('/api/advisor/transcribe', {
        method: 'POST',
        body: form,
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Erreur réseau' }))
        console.warn('[Pipeline] Erreur:', err.error)
        whisperProcessingRef.current = false
        setState(prev => ({ ...prev, interimTranscript: '' }))
        return
      }

      const result = await response.json()

      // Le pipeline retourne des segments diarisés
      if (result.segments && result.segments.length > 0) {
        // Mettre à jour le contexte pour le prochain chunk
        previousContextRef.current = result.segments
          .map((s: { text: string }) => s.text)
          .join(' ')
          .slice(-300)

        const fullText = result.fullText?.trim() || ''

        // Mettre à jour l'état interne (qualité, transcript)
        setState(prev => ({
          ...prev,
          transcript: fullText,
          interimTranscript: '',
          lastConfidence: result.quality?.avgConfidence || 0.9,
          pipelineQuality: result.quality ? {
            avgConfidence: result.quality.avgConfidence,
            rejectedSegments: result.quality.rejectedSegments,
            totalSegments: result.quality.totalSegments,
            llmCorrected: result.llmCorrected || false,
          } : null,
        }))

        // Priorité aux segments diarisés — évite les doublons
        if (onDiarizedSegmentsRef.current) {
          onDiarizedSegmentsRef.current(result.segments)
        } else if (fullText) {
          // Fallback : pas de handler diarisé, utiliser onResult
          onResultRef.current?.(fullText, true, result.quality?.avgConfidence || 0.9)
        }
      } else if (result.text) {
        // Fallback : ancien format simple (texte brut)
        const text = result.text.trim()
        if (text && !isLikelyNoise(text, 0.9)) {
          const processed = postProcessTranscript(text)
          if (processed && processed.length >= 2) {
            previousContextRef.current = processed.slice(-300)
            setState(prev => ({
              ...prev,
              transcript: processed,
              interimTranscript: '',
              lastConfidence: 0.95,
            }))
            onResultRef.current?.(processed, true, 0.95)
          }
        } else {
          setState(prev => ({ ...prev, rejectedCount: prev.rejectedCount + 1, interimTranscript: '' }))
        }
      } else {
        setState(prev => ({ ...prev, interimTranscript: '' }))
      }

      whisperChunkIndexRef.current++
    } catch (err) {
      console.error('[Pipeline] Erreur:', err)
      setState(prev => ({ ...prev, interimTranscript: '' }))
    }

    whisperProcessingRef.current = false
  }, [language, speakerHint])

  // ── Whisper : démarrer le MediaRecorder ──
  const startWhisper = useCallback(() => {
    if (!mediaStream) {
      const msg = 'Aucun flux audio disponible pour le mode Whisper. Démarrez d\'abord l\'enregistrement audio.'
      setState(prev => ({ ...prev, error: msg }))
      onError?.(msg)
      return
    }

    try {
      // Créer un AudioContext pour filtrer le bruit avant enregistrement
      const audioCtx = new AudioContext()
      const source = audioCtx.createMediaStreamSource(mediaStream)

      // High-pass filter : coupe les basses fréquences < 85Hz (rumble, HVAC, circulation)
      const highPass = audioCtx.createBiquadFilter()
      highPass.type = 'highpass'
      highPass.frequency.value = 85
      highPass.Q.value = 0.7

      // Low-pass filter : coupe au-dessus de 8kHz (sifflements, bruits aigus)
      const lowPass = audioCtx.createBiquadFilter()
      lowPass.type = 'lowpass'
      lowPass.frequency.value = 8000
      lowPass.Q.value = 0.7

      // Compressor : normalise les niveaux (voix forte/faible)
      const compressor = audioCtx.createDynamicsCompressor()
      compressor.threshold.value = -30
      compressor.knee.value = 10
      compressor.ratio.value = 4
      compressor.attack.value = 0.003
      compressor.release.value = 0.25

      // Gain : boost léger de la voix
      const gain = audioCtx.createGain()
      gain.gain.value = 1.3

      // Chaîne : source → highPass → lowPass → compressor → gain → destination
      source.connect(highPass)
      highPass.connect(lowPass)
      lowPass.connect(compressor)
      compressor.connect(gain)

      const destination = audioCtx.createMediaStreamDestination()
      gain.connect(destination)

      // Enregistrer le stream traité
      const recorder = new MediaRecorder(destination.stream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 64000, // Qualité suffisante pour la parole
      })

      audioChunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data)
        }
      }

      recorder.start(500) // Collecter des données toutes les 500ms
      mediaRecorderRef.current = recorder

      // Reset chunk tracking
      whisperChunkIndexRef.current = 0
      previousContextRef.current = ''

      // Envoyer au backend toutes les 10 secondes (Whisper est meilleur avec plus de contexte)
      whisperIntervalRef.current = setInterval(() => {
        if (audioChunksRef.current.length > 0) {
          processWhisperChunk()
        }
      }, 10000)

      shouldRestartRef.current = true
      lastSoundTimeRef.current = Date.now()
      setState(prev => ({
        ...prev,
        error: null,
        isListening: true,
        interimTranscript: '',
        reconnectCount: 0,
        silenceDurationMs: 0,
        rejectedCount: 0,
        pipelineQuality: null,
      }))
    } catch (err: any) {
      const msg = `Erreur démarrage Whisper : ${err.message || 'Erreur inconnue'}`
      setState(prev => ({ ...prev, error: msg }))
      onError?.(msg)
    }
  }, [mediaStream, processWhisperChunk, onError])

  // ── Whisper : arrêter le MediaRecorder ──
  const stopWhisper = useCallback(() => {
    if (whisperIntervalRef.current) {
      clearInterval(whisperIntervalRef.current)
      whisperIntervalRef.current = null
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop() } catch { /* ignore */ }
    }
    mediaRecorderRef.current = null
    // Traiter le dernier chunk restant
    if (audioChunksRef.current.length > 0) {
      processWhisperChunk()
    }
  }, [processWhisperChunk])

  // ── START (branché sur le moteur) ──
  const start = useCallback(() => {
    if (engine === 'whisper') {
      startWhisper()
      return
    }

    // Mode browser (Web Speech API)
    if (!state.isSupported) {
      const msg = 'La reconnaissance vocale n\'est pas supportée par votre navigateur. Utilisez Chrome ou Edge.'
      setState(prev => ({ ...prev, error: msg }))
      onError?.(msg)
      return
    }

    shouldRestartRef.current = true
    lastSoundTimeRef.current = Date.now()
    silenceNotifiedRef.current = false
    setState(prev => ({ ...prev, error: null, isListening: true, interimTranscript: '', reconnectCount: 0, silenceDurationMs: 0, rejectedCount: 0 }))

    if (!recognitionRef.current) {
      recognitionRef.current = createRecognition()
    }

    try {
      recognitionRef.current?.start()
    } catch {
      recognitionRef.current = createRecognition()
      try { recognitionRef.current?.start() } catch { /* ignore */ }
    }
  }, [engine, state.isSupported, createRecognition, onError, startWhisper])

  // ── STOP ──
  const stop = useCallback(() => {
    shouldRestartRef.current = false
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current)
      restartTimeoutRef.current = null
    }
    if (silenceTimerRef.current) {
      clearInterval(silenceTimerRef.current)
      silenceTimerRef.current = null
    }

    if (engine === 'whisper') {
      stopWhisper()
    } else {
      try { recognitionRef.current?.stop() } catch { /* ignore */ }
    }

    setState(prev => ({ ...prev, isListening: false, interimTranscript: '', silenceDurationMs: 0 }))
  }, [engine, stopWhisper])

  // ── PAUSE ──
  const pause = useCallback(() => {
    shouldRestartRef.current = false
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current)
      restartTimeoutRef.current = null
    }

    if (engine === 'whisper') {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        try { mediaRecorderRef.current.pause() } catch { /* ignore */ }
      }
      if (whisperIntervalRef.current) {
        clearInterval(whisperIntervalRef.current)
        whisperIntervalRef.current = null
      }
    } else {
      try { recognitionRef.current?.stop() } catch { /* ignore */ }
    }

    setState(prev => ({ ...prev, isListening: false }))
  }, [engine])

  // ── RESUME ──
  const resume = useCallback(() => {
    if (engine === 'whisper' && mediaRecorderRef.current?.state === 'paused') {
      try { mediaRecorderRef.current.resume() } catch { /* ignore */ }
      whisperIntervalRef.current = setInterval(() => {
        if (audioChunksRef.current.length > 0) processWhisperChunk()
      }, 10000)
      setState(prev => ({ ...prev, isListening: true }))
      return
    }
    start()
  }, [engine, start, processWhisperChunk])

  /** Change la langue à la volée (utile pour clients multilingues) */
  const setLanguage = useCallback((newLang: string) => {
    if (recognitionRef.current) {
      const wasListening = state.isListening
      if (wasListening) {
        shouldRestartRef.current = false
        try { recognitionRef.current.stop() } catch { /* ignore */ }
      }
      recognitionRef.current = null
      if (wasListening) {
        setTimeout(() => start(), 300)
      }
    }
  }, [state.isListening, start])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      shouldRestartRef.current = false
      if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current)
      if (silenceTimerRef.current) clearInterval(silenceTimerRef.current)
      if (whisperIntervalRef.current) clearInterval(whisperIntervalRef.current)
      try { recognitionRef.current?.stop() } catch { /* ignore */ }
      try {
        if (mediaRecorderRef.current?.state !== 'inactive') {
          mediaRecorderRef.current?.stop()
        }
      } catch { /* ignore */ }
    }
  }, [])

  return {
    ...state,
    start,
    stop,
    pause,
    resume,
    setLanguage,
    /** Nombre de segments rejetés par le filtrage qualité */
    rejectedCount: state.rejectedCount,
  }
}
