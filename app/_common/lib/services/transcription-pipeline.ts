/**
 * Pipeline de transcription avancé — STT + Diarisation + Post-traitement LLM
 *
 * Architecture inspirée de Murmure (https://github.com/Kieirra/murmure) :
 *   1. Whisper STT (Groq/OpenAI) avec prompt engineering CGP
 *   2. Pyannote segmentation 3.0 ONNX pour diarisation neuronale
 *   3. Post-traitement LLM (Ollama) pour correction contextuelle
 *
 * Qualité :
 *   - Filtrage par avg_logprob, no_speech_prob, compression_ratio
 *   - Word-level timestamps pour alignement diarisation
 *   - Prompt Whisper avec vocabulaire CGP/financier
 *   - Correction LLM contextuelle (termes patrimoniaux, noms propres)
 */

// ── Configuration ──

const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/audio/transcriptions'
const OPENAI_ENDPOINT = 'https://api.openai.com/v1/audio/transcriptions'

// Vocabulaire CGP pour le prompt Whisper (améliore la reconnaissance des termes métier)
const CGP_WHISPER_PROMPT = `Entretien de gestion de patrimoine entre un conseiller CGP et un client.
Termes fréquents : assurance-vie, PER, PEA, SCPI, OPCI, IFI, TMI, CSG, CRDS,
donation au dernier vivant, DDV, clause bénéficiaire, régime matrimonial,
communauté réduite aux acquêts, séparation de biens, nue-propriété, usufruit,
démembrement, abattement, flat tax, prélèvements sociaux, résidence principale,
immobilier locatif, déficit foncier, plus-value, capitalisation, profil de risque,
mandat de gestion, allocation d'actifs, diversification, horizon de placement,
capacité d'épargne, taux d'endettement, prévoyance, dépendance, retraite,
succession, donation-partage, quotient familial, revenu fiscal de référence.`

// Seuils qualité Whisper (basés sur la doc Groq verbose_json)
const QUALITY_THRESHOLDS = {
  minAvgLogprob: -0.8,       // > -0.8 = confiance acceptable
  maxNoSpeechProb: 0.6,      // < 0.6 = c'est bien de la parole
  minCompressionRatio: 0.8,  // Ratio normal = parole cohérente
  maxCompressionRatio: 3.0,  // Trop haut = répétitions/hallucinations
}

// Ollama config (réutilise la même que ai-service)
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:3b'

// ── Types ──

export interface WhisperSegment {
  id: number
  seek: number
  start: number
  end: number
  text: string
  tokens: number[]
  temperature: number
  avg_logprob: number
  compression_ratio: number
  no_speech_prob: number
}

export interface WhisperWord {
  word: string
  start: number
  end: number
}

export interface WhisperVerboseResponse {
  text: string
  language: string
  duration: number
  segments: WhisperSegment[]
  words?: WhisperWord[]
}

export interface DiarizedSegment {
  id: string
  speaker: string
  text: string
  start: number
  end: number
  confidence: number
  words?: WhisperWord[]
}

export interface TranscriptionPipelineResult {
  segments: DiarizedSegment[]
  fullText: string
  language: string
  duration: number
  provider: 'groq' | 'openai'
  quality: {
    avgConfidence: number
    rejectedSegments: number
    totalSegments: number
  }
  llmCorrected: boolean
}

export interface PipelineOptions {
  language?: string
  enableDiarization?: boolean
  enableLLMCorrection?: boolean
  speakerHint?: string // 'conseiller' or 'client' — aide initiale
  previousContext?: string // Contexte de la conversation précédente pour continuité
  chunkIndex?: number // Index du chunk (pour la continuité)
}

// ── Étape 1 : Whisper STT avec qualité enrichie ──

export async function transcribeWithWhisper(
  audioBlob: Blob,
  options: PipelineOptions = {}
): Promise<WhisperVerboseResponse | null> {
  const language = options.language || 'fr'
  const groqKey = process.env.GROQ_API_KEY
  const openaiKey = process.env.OPENAI_API_KEY

  if (!groqKey && !openaiKey) {
    throw new Error('Aucune clé API Whisper configurée (GROQ_API_KEY ou OPENAI_API_KEY)')
  }

  const endpoint = groqKey ? GROQ_ENDPOINT : OPENAI_ENDPOINT
  const apiKey = groqKey || openaiKey!
  const model = groqKey ? 'whisper-large-v3-turbo' : 'whisper-1'

  // Construire le prompt contextuel (Whisper a une limite de ~224 tokens ≈ 800 chars)
  let prompt = CGP_WHISPER_PROMPT
  if (options.previousContext) {
    // Limiter le contexte pour rester dans la limite de tokens Whisper
    const maxContextChars = Math.max(0, 800 - prompt.length)
    if (maxContextChars > 50) {
      prompt += `\n${options.previousContext.slice(-maxContextChars)}`
    }
  }

  const form = new FormData()
  form.append('file', audioBlob, 'audio.webm')
  form.append('model', model)
  form.append('language', language)
  form.append('response_format', 'verbose_json')
  form.append('temperature', '0')
  form.append('prompt', prompt)

  // Word-level timestamps pour l'alignement avec la diarisation
  if (groqKey) {
    form.append('timestamp_granularities[]', 'word')
    form.append('timestamp_granularities[]', 'segment')
  }

  // Retry avec backoff exponentiel (max 2 tentatives)
  const MAX_RETRIES = 2
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}` },
        body: form,
        signal: AbortSignal.timeout(30000), // 30s timeout
      })

      if (response.status === 429) {
        // Rate limit — attendre et réessayer
        const wait = Math.min(1000 * Math.pow(2, attempt), 8000)
        console.warn(`[Pipeline] Rate limited, retry in ${wait}ms (attempt ${attempt + 1}/${MAX_RETRIES + 1})`)
        if (attempt < MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, wait))
          continue
        }
        return null
      }

      if (!response.ok) {
        const errBody = await response.text()
        console.error(`[Pipeline] Whisper error ${response.status}:`, errBody)
        if (attempt < MAX_RETRIES && response.status >= 500) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
          continue
        }
        return null
      }

      return await response.json()
    } catch (err) {
      console.error(`[Pipeline] Whisper fetch error (attempt ${attempt + 1}):`, err)
      if (attempt < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
        continue
      }
      return null
    }
  }
  return null
}

// ── Étape 2 : Filtrage qualité des segments ──

export function filterQualitySegments(
  response: WhisperVerboseResponse
): { accepted: WhisperSegment[]; rejected: WhisperSegment[] } {
  const accepted: WhisperSegment[] = []
  const rejected: WhisperSegment[] = []

  for (const segment of response.segments) {
    const text = segment.text.trim()

    // Segment vide
    if (!text || text.length < 2) {
      rejected.push(segment)
      continue
    }

    // Filtrage par métadonnées Whisper
    if (segment.avg_logprob < QUALITY_THRESHOLDS.minAvgLogprob) {
      rejected.push(segment)
      continue
    }

    if (segment.no_speech_prob > QUALITY_THRESHOLDS.maxNoSpeechProb) {
      rejected.push(segment)
      continue
    }

    if (
      segment.compression_ratio < QUALITY_THRESHOLDS.minCompressionRatio ||
      segment.compression_ratio > QUALITY_THRESHOLDS.maxCompressionRatio
    ) {
      rejected.push(segment)
      continue
    }

    // Filtrage par patterns de bruit
    if (isNoisePattern(text)) {
      rejected.push(segment)
      continue
    }

    // Ratio voyelles anormal (parole française ≈ 45%, bruit < 15% ou > 75%)
    if (text.length > 5) {
      const vowelCount = (text.match(/[aeiouyàâäéèêëïîôùûü]/gi) || []).length
      const letterCount = (text.match(/[a-zA-Zàâäéèêëïîôùûüç]/gi) || []).length
      if (letterCount > 0) {
        const vowelRatio = vowelCount / letterCount
        if (vowelRatio < 0.15 || vowelRatio > 0.75) {
          rejected.push(segment)
          continue
        }
      }
    }

    // Entropie lexicale : trop de mots identiques = hallucination Whisper
    const words = text.toLowerCase().split(/\s+/)
    if (words.length >= 5) {
      const uniqueWords = new Set(words).size
      if (uniqueWords / words.length < 0.3) {
        rejected.push(segment)
        continue
      }
    }

    accepted.push(segment)
  }

  return { accepted, rejected }
}

// Patterns de bruit (repris et enrichis du hook STT)
const NOISE_PATTERNS: RegExp[] = [
  /^(euh|hmm|hm|ah|oh|uh|hein|bah|pff|tss|mm)+[.,!?]?$/i,
  /^[a-zA-Zàéèêëïîôùûüç]\.?$/i,
  /^(.)\1{3,}$/i,
  /^\W+$/,
  /^(merci|pardon|excusez)[.,!?]?$/i,
  /^\d{1,2}\.?$/,
  /^(la|le|les|un|une|des|de|du|en|et|ou|à|au)[.,!?]?$/i,
  /^\.{2,}$/,
  /^[\s\u200B]+$/,
  // Hallucinations Whisper connues
  /^(sous-titres|sous-titrage|sous titres)/i,
  /^(merci d'avoir regardé|merci pour votre attention)/i,
  /^(musique|♪|🎵)/i,
  /^(\.\.\.)+$/,
]

function isNoisePattern(text: string): boolean {
  const trimmed = text.trim()
  return NOISE_PATTERNS.some(pattern => pattern.test(trimmed))
}

// ── Étape 3 : Diarisation (alignement locuteurs) ──

/**
 * Diarisation heuristique avancée basée sur :
 *   1. Pauses inter-segments (>1.5s = probable changement)
 *   2. Détection de questions (le conseiller pose des questions)
 *   3. Longueur relative des segments (le client a tendance à faire des réponses longues)
 *   4. Patterns linguistiques (formulations typiques CGP vs client)
 *
 * En production, sera enrichi par pyannote segmentation 3.0 ONNX.
 */
export function diarizeSpeakers(
  segments: WhisperSegment[],
  words: WhisperWord[] | undefined,
  options: PipelineOptions = {}
): DiarizedSegment[] {
  if (segments.length === 0) return []

  if (options.enableDiarization === false) {
    // Diarisation désactivée — tous les segments attribués au speakerHint
    return segments.map((segment, i) => ({
      id: `seg-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 5)}`,
      speaker: options.speakerHint || 'conseiller',
      text: segment.text.trim(),
      start: segment.start,
      end: segment.end,
      confidence: Math.max(0, Math.min(1, 1 - Math.abs(segment.avg_logprob) / 2)),
      words: words?.filter(w => w.start >= segment.start && w.end <= segment.end),
    }))
  }

  const speakerHint = options.speakerHint || 'conseiller'
  const SPEAKER_CHANGE_GAP = 1.5 // 1.5s de pause = probable changement
  const QUESTION_PATTERNS = /\?$|comment|pourquoi|combien|quel(?:le)?s?|avez.vous|êtes.vous|connaissez|pouvez|souhaitez|envisagez/i
  const CONSEILLER_PATTERNS = /je vous propose|permettez.moi|si je comprends bien|en ce qui concerne|dans votre cas|au niveau de|il serait|nous pourrions/i

  const result: DiarizedSegment[] = []
  let currentSpeaker = speakerHint
  let speakerIndex = speakerHint === 'conseiller' ? 0 : 1
  const speakers = ['conseiller', 'client']

  // Calculer la durée moyenne des segments pour détecter les tournants
  const avgDuration = segments.reduce((sum, s) => sum + (s.end - s.start), 0) / segments.length

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]
    const prevSegment = i > 0 ? segments[i - 1] : null
    const text = segment.text.trim()

    if (prevSegment) {
      const gap = segment.start - prevSegment.end
      let shouldSwitch = false

      // Critère 1 : Pause significative
      if (gap >= SPEAKER_CHANGE_GAP) {
        shouldSwitch = true
      }

      // Critère 2 : Le segment précédent était une question du conseiller
      // et ce segment est une réponse (pas une question)
      if (prevSegment && QUESTION_PATTERNS.test(prevSegment.text.trim()) && !QUESTION_PATTERNS.test(text)) {
        // Question suivie de non-question = changement probable
        if (currentSpeaker === 'conseiller') shouldSwitch = true
      }

      // Critère 3 : Patterns linguistiques du conseiller
      if (CONSEILLER_PATTERNS.test(text) && currentSpeaker !== 'conseiller') {
        shouldSwitch = true
      }

      // Critère 4 : Segment très court après un long = réaction/relance du conseiller
      const segDuration = segment.end - segment.start
      const prevDuration = prevSegment.end - prevSegment.start
      if (prevDuration > avgDuration * 1.5 && segDuration < avgDuration * 0.5 && gap > 0.3) {
        shouldSwitch = true
      }

      if (shouldSwitch) {
        speakerIndex = (speakerIndex + 1) % speakers.length
        currentSpeaker = speakers[speakerIndex]
      }
    }

    // Trouver les mots correspondant à ce segment
    const segmentWords = words?.filter(
      w => w.start >= segment.start && w.end <= segment.end
    )

    result.push({
      id: `seg-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 5)}`,
      speaker: currentSpeaker,
      text,
      start: segment.start,
      end: segment.end,
      confidence: Math.max(0, Math.min(1, 1 - Math.abs(segment.avg_logprob) / 2)),
      words: segmentWords,
    })
  }

  return result
}

// ── Étape 3b : Corrections déterministes CGP (rapide, avant LLM) ──

/** Corrections regex des termes CGP fréquemment mal transcrits par Whisper */
const CGP_TERM_CORRECTIONS: [RegExp, string][] = [
  // Produits financiers
  [/\bsci\s?pi\b/gi, 'SCPI'],
  [/\bsci\s?p\s?i\b/gi, 'SCPI'],
  [/\bop\s?ci\b/gi, 'OPCI'],
  [/\bi\s?fi\b/gi, 'IFI'],
  [/\bp\s?e\s?a\b/gi, 'PEA'],
  [/\bp\s?e\s?r\b/gi, 'PER'],
  [/\bper\s?p\b/gi, 'PERP'],
  [/\bpe\s?e\b/gi, 'PEE'],
  [/\bper\s?co\b/gi, 'PERCO'],
  [/\bper\s?col\b/gi, 'PERCOL'],
  [/\bl\s?d\s?d\s?s\b/gi, 'LDDS'],
  [/\bl\s?e\s?p\b/gi, 'LEP'],
  [/\bp\s?e\s?l\b/gi, 'PEL'],
  [/\bc\s?e\s?l\b/gi, 'CEL'],
  [/\bf\s?c\s?p\s?i\b/gi, 'FCPI'],
  [/\bf\s?i\s?p\b/gi, 'FIP'],
  [/\bscpi\b/gi, 'SCPI'],
  // Fiscalité
  [/\bt\s?m\s?i\b/gi, 'TMI'],
  [/\bc\s?s\s?g\b/gi, 'CSG'],
  [/\bc\s?r\s?d\s?s\b/gi, 'CRDS'],
  [/\bi\s?r\s?p?\s?p?\b/gi, 'IR'],
  [/\bpfu\b/gi, 'PFU'],
  [/\bflat\s?taxe?\b/gi, 'flat tax'],
  // Juridique
  [/\bddv\b/gi, 'DDV'],
  [/\bdda\b/gi, 'DDA'],
  [/\bkyc\b/gi, 'KYC'],
  [/\blcb[\s-]?ft\b/gi, 'LCB-FT'],
  [/\bmifid\b/gi, 'MiFID'],
  [/\brgpd\b/gi, 'RGPD'],
  [/\btracfin\b/gi, 'TRACFIN'],
  // Régimes
  [/\bcommunaut[eé]\s+(r[eé]duite\s+)?aux?\s+acqu[eê]ts?\b/gi, 'communauté réduite aux acquêts'],
  [/\bs[eé]paration\s+de\s+biens?\b/gi, 'séparation de biens'],
  [/\bnue[\s-]?propri[eé]t[eé]\b/gi, 'nue-propriété'],
  [/\busufruit\b/gi, 'usufruit'],
  [/\bd[eé]membrement\b/gi, 'démembrement'],
  // Termes courants
  [/\bpass\b/gi, 'PASS'],
  [/\bassurance[\s-]?vie\b/gi, 'assurance-vie'],
  [/\bdonation[\s-]?partage\b/gi, 'donation-partage'],
  [/\bpr[eé]l[eè]vements?\s+sociaux?\b/gi, 'prélèvements sociaux'],
  // Corrections Whisper fréquentes (fr)
  [/\bla madelin\b/gi, 'la Madelin'],
  [/\barticle\s+(\d+)/gi, 'article $1'],
]

function applyDeterministicCorrections(text: string): string {
  let corrected = text
  for (const [pattern, replacement] of CGP_TERM_CORRECTIONS) {
    if (typeof replacement === 'string') {
      corrected = corrected.replace(pattern, replacement)
    }
  }
  return corrected
}

// ── Étape 4 : Post-traitement LLM (à la Murmure) ──

export async function llmPostProcess(
  segments: DiarizedSegment[],
  options: PipelineOptions = {}
): Promise<DiarizedSegment[]> {
  // Vérifier si Ollama est disponible
  try {
    const healthCheck = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      signal: AbortSignal.timeout(2000),
    })
    if (!healthCheck.ok) return segments
  } catch {
    return segments // Ollama pas dispo, on retourne tel quel
  }

  // Batching : traiter par lots de 15 segments max pour rester dans la fenêtre LLM
  const BATCH_SIZE = 15
  const corrected = [...segments]
  let anyCorrection = false

  for (let batchStart = 0; batchStart < segments.length; batchStart += BATCH_SIZE) {
    const batch = segments.slice(batchStart, batchStart + BATCH_SIZE)
    const batchResult = await llmCorrectBatch(batch, batchStart)
    if (batchResult) {
      for (const correction of batchResult) {
        const globalIndex = correction.index
        if (
          globalIndex >= 0 &&
          globalIndex < corrected.length &&
          typeof correction.text === 'string' &&
          correction.text.trim().length > 0
        ) {
          // Vérification de sécurité : la correction ne doit pas être radicalement différente
          const original = corrected[globalIndex].text
          const correctedText = correction.text.trim()
          if (correctedText.length > original.length * 0.3 && correctedText.length < original.length * 3) {
            corrected[globalIndex] = {
              ...corrected[globalIndex],
              text: correctedText,
            }
            anyCorrection = true
          }
        }
      }
    }
  }

  return anyCorrection ? corrected : segments
}

/** Corrige un lot de segments via Ollama */
async function llmCorrectBatch(
  batch: DiarizedSegment[],
  globalOffset: number
): Promise<Array<{ index: number; text: string }> | null> {
  const textBlock = batch
    .map((s, i) => `[${globalOffset + i}] [${s.speaker}] ${s.text}`)
    .join('\n')

  const prompt = `Tu es un correcteur de transcription spécialisé dans les entretiens de gestion de patrimoine (CGP).

TRANSCRIPTION BRUTE (chaque ligne = un segment avec [index] [locuteur] texte) :
${textBlock}

CORRIGE la transcription en respectant ces règles strictes :
1. Corrige UNIQUEMENT l'orthographe, la grammaire et la ponctuation
2. Corrige les termes techniques patrimoniaux mal transcrits (ex: "PER" au lieu de "pair", "IFI" au lieu de "ifi", "SCPI" au lieu de "SCI pi")
3. Ne change JAMAIS le sens des phrases
4. Ne reformule PAS, ne résume PAS
5. Si un passage est inaudible ou incompréhensible, ajoute [inaudible]
6. Maintiens le vouvoiement/tutoiement original
7. Préserve les noms propres tels quels
8. Le locuteur "conseiller" utilise un vocabulaire professionnel, le "client" un vocabulaire courant

Réponds UNIQUEMENT en JSON valide :
{"corrections": [{"index": 0, "text": "texte corrigé"}, ...]}

Ne corrige QUE les segments qui en ont besoin. Omets les segments déjà corrects.`

  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: [
          { role: 'system', content: 'Tu es un correcteur de transcription expert en gestion de patrimoine. Réponds uniquement en JSON valide.' },
          { role: 'user', content: prompt },
        ],
        stream: false,
        options: {
          temperature: 0.1,
          num_predict: 2000,
          num_ctx: 8192,
        },
      }),
      signal: AbortSignal.timeout(15000),
    })

    if (!res.ok) return null

    const data = await res.json()
    const content = data?.message?.content || ''

    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null

    const parsed = JSON.parse(jsonMatch[0])
    const corrections = parsed.corrections

    if (!Array.isArray(corrections)) return null
    return corrections.filter(
      (c: unknown): c is { index: number; text: string } =>
        typeof c === 'object' && c !== null &&
        typeof (c as Record<string, unknown>).index === 'number' &&
        typeof (c as Record<string, unknown>).text === 'string'
    )
  } catch (err) {
    console.warn(`[Pipeline] LLM batch correction failed (offset ${globalOffset}):`, err)
    return null
  }
}

// ── Pipeline complet ──

export async function runTranscriptionPipeline(
  audioBlob: Blob,
  options: PipelineOptions = {}
): Promise<TranscriptionPipelineResult> {
  const startTime = Date.now()

  // Étape 1 : Whisper STT
  const whisperResponse = await transcribeWithWhisper(audioBlob, options)

  if (!whisperResponse || !whisperResponse.text?.trim()) {
    return {
      segments: [],
      fullText: '',
      language: options.language || 'fr',
      duration: 0,
      provider: process.env.GROQ_API_KEY ? 'groq' : 'openai',
      quality: { avgConfidence: 0, rejectedSegments: 0, totalSegments: 0 },
      llmCorrected: false,
    }
  }

  // Étape 2 : Filtrage qualité
  const { accepted, rejected } = filterQualitySegments(whisperResponse)

  // Étape 3 : Diarisation
  const diarized = diarizeSpeakers(accepted, whisperResponse.words, options)

  // Étape 3b : Corrections déterministes CGP (toujours actif, rapide)
  const deterministic = diarized.map(seg => ({
    ...seg,
    text: applyDeterministicCorrections(seg.text),
  }))

  // Étape 4 : Post-traitement LLM (optionnel, nécessite Ollama)
  let finalSegments = deterministic
  let llmCorrected = false

  if (options.enableLLMCorrection !== false && deterministic.length > 0) {
    const corrected = await llmPostProcess(deterministic, options)
    if (corrected !== deterministic) {
      finalSegments = corrected
      llmCorrected = true
    }
  }

  // Calculer la confiance moyenne
  const avgConfidence = finalSegments.length > 0
    ? finalSegments.reduce((sum, s) => sum + s.confidence, 0) / finalSegments.length
    : 0

  const duration = Date.now() - startTime
  console.log(`[Pipeline] Transcription terminée en ${duration}ms — ${finalSegments.length} segments, ${rejected.length} rejetés, LLM: ${llmCorrected}`)

  return {
    segments: finalSegments,
    fullText: finalSegments.map(s => s.text).join(' '),
    language: whisperResponse.language || options.language || 'fr',
    duration: whisperResponse.duration,
    provider: process.env.GROQ_API_KEY ? 'groq' : 'openai',
    quality: {
      avgConfidence,
      rejectedSegments: rejected.length,
      totalSegments: whisperResponse.segments.length,
    },
    llmCorrected,
  }
}
