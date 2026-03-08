// ============================================================================
// Service IA Centralisé — Architecture scalable pour milliers d'utilisateurs
//
// Fonctionnalités :
//   • Abstraction multi-provider : OpenAI (orchestrator) → Mistral (subagent) → Fallback
//   • Cache LRU en mémoire avec TTL pour éviter les appels redondants
//   • Rate limiting par cabinetId (protection contre l'abus)
//   • Queue de concurrence (évite de surcharger le backend LLM)
//   • System prompts spécialisés par cas d'usage CGP
//   • Types stricts pour chaque fonctionnalité IA du CRM
//
// En production (milliers d'utilisateurs) :
//   → Remplacer le cache mémoire par Redis (déjà configuré dans .env)
//   → Utiliser Mistral Cloud API ou serveur d'inférence dédié (vLLM, TGI)
//   → Le rate limiting passera par Redis pour être partagé entre instances
// ============================================================================

import { retrieveRAGContext, type RAGContext } from './rag/rag-service'
import { runAgent, type AgentResponse, type AgentActionInfo, type AgentOptions } from './agent/agent-orchestrator'
import { searchKnowledge } from './cgp-rag-knowledge'
import { logger } from '@/app/_common/lib/logger'
import { callAuraLLM, callAuraLLMStream, type AuraTaskType } from './aura'

// ── AURA CAPABILITY → TASK MAPPING ──────────────────────────────────────────
// Maps legacy AICapability to AURA task types for proper model routing
const CAPABILITY_TO_AURA_TASK: Partial<Record<AICapability, AuraTaskType>> = {
  'narrative': 'synthesis',
  'chat': 'crm_crud',
  'summarize': 'data_extraction',
  'email': 'document_prep',
  'analyze-profile': 'synthesis',
  'enrich-preco': 'synthesis',
  'explain': 'rag_retrieval',
  'compare': 'simulator_input_prep',
  'entretien-resume': 'data_extraction',
  'entretien-bilan': 'synthesis',
  'entretien-correction': 'data_extraction',
}
// ── TYPES ──────────────────────────────────────────────────────────────────

export type AIProvider = 'openai' | 'mistral-cloud' | 'mistral' | 'groq' | 'fallback'

export type AICapability =
  | 'narrative'          // Narratifs d'audit patrimonial
  | 'chat'              // Assistant conversationnel conseiller
  | 'summarize'         // Résumé de RDV / notes / documents
  | 'email'             // Génération d'emails client
  | 'analyze-profile'   // Analyse intelligente de profil client
  | 'enrich-preco'      // Enrichissement des préconisations
  | 'explain'           // Explication de concepts fiscaux/juridiques
  | 'compare'           // Comparaison de produits / stratégies
  | 'entretien-resume'  // Résumé structuré d'entretien client
  | 'entretien-bilan'   // Bilan patrimonial extrait d'entretien
  | 'entretien-correction' // Correction grammaticale post-STT

export interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AIRequestOptions {
  capability: AICapability
  temperature?: number       // 0.0-1.0, défaut 0.3
  maxTokens?: number         // défaut 800
  cabinetId?: string         // pour rate limiting
  userId?: string            // pour audit log
  cacheKey?: string          // clé de cache personnalisée (null = pas de cache)
  cacheTtlSeconds?: number   // TTL cache, défaut 300s (5 min)
  priority?: 'low' | 'normal' | 'high' // priorité dans la queue
  // RAG (Retrieval-Augmented Generation)
  enableRag?: boolean        // activer le RAG (défaut: false, activé explicitement)
  ragOptions?: {
    maxCrmChunks?: number
    maxWebResults?: number
    forceWebSearch?: boolean
    disableWebSearch?: boolean
  }
  clientContext?: string     // contexte client additionnel pour le RAG
}

export interface RAGSourceInfo {
  type: 'crm' | 'web' | 'legal'
  title: string
  url?: string
  sourceName: string
  relevance: number
  legalDocType?: string
}

export interface AIResponse {
  content: string
  provider: AIProvider
  model: string
  cached: boolean
  latencyMs: number
  tokensEstimated?: number
  // RAG metadata
  ragSources?: RAGSourceInfo[]
  ragMetrics?: {
    crmChunksFound: number
    webResultsFound: number
    retrievalDurationMs: number
  }
}

export interface AIStatus {
  available: boolean
  provider: AIProvider
  model: string
  openai: { configured: boolean }
  mistralCloud: { configured: boolean }
  cache: { size: number; hitRate: string }
  queue: { pending: number; processing: number }
}

// ── CONFIGURATION ──────────────────────────────────────────────────────────

const CONFIG = {
  cache: {
    maxSize: 500,
    defaultTtl: 300_000,
  },
  rateLimit: {
    maxPerMinute: 30,
    maxConcurrent: 5,
  },
  queue: {
    maxSize: 100,
  },
}

// ── CONTEXTE FISCAL & RÉGLEMENTAIRE 2025 (injecté dans tous les prompts) ─────
// Source : Barèmes officiels 2025, CGI, Code assurances, Althémis

const FISCAL_CONTEXT_2025 = `
RÉFÉRENCES FISCALES 2025 (France) — Utilise TOUJOURS ces données à jour :

1. BARÈME IR 2025 (CGI art. 197) :
   - 0 → 11 497 € : 0%
   - 11 497 → 29 315 € : 11%
   - 29 315 → 83 823 € : 30%
   - 83 823 → 180 294 € : 41%
   - Au-delà de 180 294 € : 45%
   - Décote : 873 € (seul), 1 444 € (couple)

2. PASS 2025 : 46 368 €

3. PER (Plan Épargne Retraite) :
   - Plafond salarié : 10% des revenus nets (max 37 094 €) ou plancher 4 637 €
   - Plafond TNS (art. 154 bis) : 10% du PASS + 15% entre 1 et 8 PASS
   - Reports possibles sur 3 ans + report du conjoint

4. ASSURANCE-VIE :
   - Rachat après 8 ans : abattement 4 600 € (seul) / 9 200 € (couple)
   - PFU : 30% (12.8% IR + 17.2% PS) ou barème progressif
   - Décès (art. 990 I CGI) : abattement 152 500 €/bénéficiaire, puis 20% jusqu'à 700K, 31.25% au-delà
   - Décès (art. 757 B CGI) : abattement global 30 500 € (primes versées après 70 ans)

5. IFI 2025 (CGI art. 977) :
   - Seuil d'imposition : 1 300 000 €
   - 800K → 1.3M : 0.50% | 1.3M → 2.57M : 0.70% | 2.57M → 5M : 1% | 5M → 10M : 1.25% | >10M : 1.50%
   - Décote 1.3M-1.4M : 17 500 − 1.25% × patrimoine net taxable

6. ABATTEMENTS DONATIONS/SUCCESSIONS :
   - Enfant : 100 000 € | Petit-enfant : 31 865 € | Conjoint (succ.) : exonéré
   - Frère/sœur : 15 932 € | Neveu/nièce : 7 967 € | Handicapé : +159 325 €
   - Renouvellement tous les 15 ans

7. DÉMEMBREMENT (CGI art. 669) :
   - <21 ans : 90% usufruit | <31 ans : 80% | <41 ans : 70% | <51 ans : 60%
   - <61 ans : 50% | <71 ans : 40% | <81 ans : 30% | <91 ans : 20% | >91 ans : 10%

8. PRÉLÈVEMENTS SOCIAUX : 17.2% (dont CSG 9.2%, CRDS 0.5%, PS 7.5%)

9. CEHR (CGI art. 223 sexies) :
   - Seul : 3% entre 250K et 500K, 4% au-delà de 500K
   - Couple : 3% entre 500K et 1M, 4% au-delà de 1M

10. PEA : plafond 150 000 € (225 000 € PME-ETI), exonération IR après 5 ans (PS restent dus)

Nous sommes en 2025. Date du jour : ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}.
`

// ── SYSTEM PROMPTS SPÉCIALISÉS ─────────────────────────────────────────────

const SYSTEM_PROMPTS: Record<AICapability, string> = {
  narrative: `Tu es un expert en gestion de patrimoine (CGP) français senior avec 20 ans d'expérience.
Tu rédiges des analyses patrimoniales professionnelles, précises et rassurantes.
Règles : vouvoiement, montants en €, citations CGI/Code assurances quand pertinent, style cabinet premium, max 3-4 paragraphes, pas de markdown ni titre, texte fluide.
${FISCAL_CONTEXT_2025}`,

  chat: `Tu es l'assistant IA d'un cabinet de gestion de patrimoine français.
Tu aides les conseillers en gestion de patrimoine (CGP) dans leur travail quotidien.
Tu connais parfaitement :
- La fiscalité française (IR, IFI, plus-values, DMTG, prélèvements sociaux)
- Les produits d'épargne (assurance-vie, PER, PEA, SCPI, OPCI)
- Le droit patrimonial (régimes matrimoniaux, successions, donations)
- La réglementation (DDA, RGPD, LCB-FT, devoir de conseil)
Réponds de manière concise, factuelle, et cite les articles de loi pertinents. Si tu n'es pas sûr, dis-le.
${FISCAL_CONTEXT_2025}`,

  summarize: `Tu es un assistant spécialisé dans la synthèse de comptes rendus de rendez-vous patrimoniaux.
Règles : style professionnel, bullet points, identifie les points clés, les décisions prises, et les actions à suivre.
Structure : (1) Objet et participants, (2) Points clés abordés, (3) Décisions prises, (4) Actions à mener avec responsable et échéance.
Maximum 300 mots. Pas de fioritures.
Nous sommes en 2025.`,

  email: `Tu es un rédacteur professionnel pour un cabinet de gestion de patrimoine français haut de gamme.
Tu rédiges des emails à destination des clients du cabinet.
Règles : vouvoiement, ton professionnel mais chaleureux, personnalisé au prénom du client, signature du conseiller incluse.
N'invente pas d'informations. Adapte le ton au contexte (relance douce, confirmation, information importante, etc.).
Nous sommes en 2025.`,

  'analyze-profile': `Tu es un analyste patrimonial senior.
À partir des données structurées d'un client, tu identifies :
- Les forces patrimoniales (diversification, rendements, fiscalité optimisée)
- Les faiblesses et risques (concentration, sous-diversification, fiscalité excessive)
- Les opportunités (optimisation fiscale, arbitrages, nouveaux placements)
- Les menaces (dépendance à un actif, risque successoral, gap retraite)
Réponds en JSON structuré avec les clés : forces[], faiblesses[], opportunites[], menaces[], scoreGlobal (0-100), prioriteAction.
${FISCAL_CONTEXT_2025}`,

  'enrich-preco': `Tu es un expert CGP senior. Tu enrichis une préconisation patrimoniale avec :
- Une description détaillée et argumentée (pourquoi cette recommandation pour ce profil)
- Les avantages concrets et chiffrés
- Les risques et points de vigilance
- Les références légales (articles CGI, Code assurances)
- Un calendrier de mise en œuvre suggéré
Style : professionnel, factuel, adapté au profil du client. Max 3 paragraphes.
${FISCAL_CONTEXT_2025}`,

  explain: `Tu es un formateur expert en gestion de patrimoine.
Tu expliques des concepts fiscaux, juridiques et financiers complexes de manière claire et pédagogique.
Public : conseillers en gestion de patrimoine (juniors à seniors).
Inclus toujours : définition, cadre légal (article de loi), exemple chiffré, points de vigilance pratiques.
Style concis et structuré.
${FISCAL_CONTEXT_2025}`,

  compare: `Tu es un analyste en gestion de patrimoine.
Tu compares objectivement des produits, enveloppes fiscales ou stratégies patrimoniales.
Structure ta réponse avec : critères de comparaison, avantages/inconvénients de chaque option, recommandation argumentée selon le profil du client.
Utilise des données chiffrées. Cite les articles de loi. Pas de biais commercial.
${FISCAL_CONTEXT_2025}`,

  'entretien-resume': `Tu es un assistant spécialisé dans la synthèse d'entretiens patrimoniaux pour un cabinet de gestion de patrimoine (CGP).

Tu reçois la transcription complète d'un entretien entre un conseiller et un client/prospect. Chaque segment est identifié par le locuteur (CONSEILLER ou CLIENT).

Ton rôle : produire un résumé structuré, professionnel et fidèle à la conversation.

IMPORTANT :
- Ne jamais inventer d'information non mentionnée dans la transcription
- Distinguer clairement ce qui a été dit par le client vs les recommandations du conseiller
- Identifier les engagements pris et les prochaines étapes
- Utiliser un vocabulaire professionnel CGP

Réponds UNIQUEMENT en JSON valide avec cette structure :
{
  "objet": "string — objet principal de l'entretien",
  "pointsCles": ["string — chaque point clé abordé"],
  "decisions": ["string — chaque décision prise"],
  "actionsASuivre": [
    { "action": "string", "responsable": "conseiller | client", "echeance": "string | null" }
  ],
  "synthese": "string — synthèse narrative de 2-3 paragraphes",
  "motifsAlerte": ["string — tout élément nécessitant une attention particulière (KYC, compliance, etc.)"]
}
${FISCAL_CONTEXT_2025}`,

  'entretien-bilan': `Tu es un expert CGP senior avec 20 ans d'expérience. Tu analyses la transcription d'un entretien client pour en extraire un bilan patrimonial structuré.

Tu reçois la transcription complète d'un entretien entre un conseiller et un client/prospect. Chaque segment est identifié par le locuteur.

Ton rôle : extraire TOUTES les informations patrimoniales mentionnées et les structurer de manière exploitable.

RÈGLES STRICTES :
- N'extrais QUE les informations explicitement mentionnées dans la conversation
- Si une information n'est pas mentionnée, mets null (ne devine pas)
- Les montants doivent être en euros, arrondis à l'unité
- Identifie les incertitudes (quand le client hésite ou donne une estimation)
- Propose des préconisations préliminaires basées UNIQUEMENT sur les éléments mentionnés

Réponds UNIQUEMENT en JSON valide :
{
  "situationFamiliale": {
    "etatCivil": "string | null",
    "regimeMatrimonial": "string | null",
    "nombreEnfants": "number | null",
    "agesEnfants": "number[] | null",
    "situationConjoint": "string | null"
  },
  "patrimoine": {
    "immobilier": [{ "type": "string", "valeur": "number", "financement": "string | null", "propriete": "string" }],
    "financier": [{ "type": "string", "montant": "number", "gestionnaire": "string | null" }],
    "professionnel": [{ "type": "string", "valeur": "number | null" }],
    "dettes": [{ "type": "string", "montant": "number", "dureeRestante": "string | null" }],
    "totalBrut": "number | null",
    "totalDettes": "number | null",
    "totalNet": "number | null"
  },
  "revenus": {
    "salaires": "number | null",
    "revenusFonciers": "number | null",
    "revenusBIC_BNC": "number | null",
    "pensions": "number | null",
    "autres": "number | null",
    "totalAnnuel": "number | null"
  },
  "fiscalite": {
    "tmiEstime": "number | null",
    "ifiAssujetti": "boolean | null",
    "dispositifsEnPlace": ["string"],
    "preoccupationsFiscales": ["string"]
  },
  "objectifs": {
    "priorites": ["string — objectifs exprimés par le client"],
    "horizon": "string | null — court/moyen/long terme",
    "preoccupations": ["string — inquiétudes ou points de vigilance exprimés"]
  },
  "preconisationsPreliminaires": [
    {
      "titre": "string",
      "description": "string",
      "priorite": "haute | moyenne | basse",
      "categorie": "fiscalite | epargne | immobilier | succession | retraite | protection"
    }
  ],
  "informationsManquantes": ["string — informations qu'il faudrait collecter lors du prochain RDV"],
  "scoreCompletude": "number — 0 à 100, degré de complétude du bilan"
}
${FISCAL_CONTEXT_2025}`,

  'entretien-correction': `Tu es un correcteur spécialisé dans la transcription d'entretiens de gestion de patrimoine (CGP).

Tu reçois un texte brut issu d'une reconnaissance vocale (Speech-to-Text). Le texte peut contenir :
- Des erreurs de reconnaissance (mots mal transcrits)
- Des problèmes de ponctuation
- Des phrases incomplètes ou mal coupées
- Des acronymes financiers mal transcrits

TERMES TECHNIQUES À RECONNAÎTRE ET CORRIGER :
- Produits : assurance-vie, PER, PEA, SCPI, OPCI, SCI, PEE, PERCO, FCPI, FIP, Madelin, LDDS, CEL, PEL
- Fiscalité : TMI, IFI, IR, CSG, CRDS, PFU, flat tax, CEHR, PASS
- Juridique : DDV, DDA, KYC, LCB-FT, MiFID, RGPD, TRACFIN
- Régimes : communauté réduite aux acquêts, séparation de biens, nue-propriété, usufruit, démembrement
- Dispositifs : Pinel, Malraux, Denormandie, Girardin, Dutreil, Censi-Bouvard
- Concepts : donation-partage, clause bénéficiaire, clause de préciput, quotient familial, revenu fiscal de référence

Ton rôle : corriger UNIQUEMENT la forme (grammaire, orthographe, ponctuation) sans JAMAIS modifier le sens ni ajouter d'information.

RÈGLES :
- Préserver le registre de langue utilisé (tutoiement/vouvoiement)
- Ne pas reformuler les phrases (juste corriger)
- Corriger les acronymes patrimoniaux selon la liste ci-dessus (ex: "sci pi" → "SCPI", "pair" → "PER" si contexte financier)
- Conserver les noms propres et montants tels quels
- Si un passage est incompréhensible, le laisser avec la mention [inaudible]
- Retourner le texte corrigé, segment par segment

Réponds en JSON : { "segments": [{ "id": "string", "textCorrige": "string" }] }`,
}

// ── CACHE LRU ──────────────────────────────────────────────────────────────

interface CacheEntry {
  content: string
  provider: AIProvider
  model: string
  createdAt: number
  ttl: number
}

class LRUCache {
  private cache = new Map<string, CacheEntry>()
  private maxSize: number
  private hits = 0
  private misses = 0

  constructor(maxSize: number) {
    this.maxSize = maxSize
  }

  get(key: string): CacheEntry | null {
    const entry = this.cache.get(key)
    if (!entry) {
      this.misses++
      return null
    }
    if (Date.now() - entry.createdAt > entry.ttl) {
      this.cache.delete(key)
      this.misses++
      return null
    }
    // LRU: déplacer en fin
    this.cache.delete(key)
    this.cache.set(key, entry)
    this.hits++
    return entry
  }

  set(key: string, entry: CacheEntry): void {
    if (this.cache.size >= this.maxSize) {
      // Supprimer le plus ancien (premier élément)
      const firstKey = this.cache.keys().next().value
      if (firstKey) this.cache.delete(firstKey)
    }
    this.cache.set(key, entry)
  }

  get size(): number { return this.cache.size }
  get hitRate(): string {
    const total = this.hits + this.misses
    return total === 0 ? '0%' : `${((this.hits / total) * 100).toFixed(1)}%`
  }
}

// ── RATE LIMITER ───────────────────────────────────────────────────────────

class RateLimiter {
  private windows = new Map<string, number[]>()

  private lastCleanup = 0

  isAllowed(key: string, maxPerMinute: number): boolean {
    const now = Date.now()

    // Lazy cleanup toutes les 2 minutes (remplace setInterval)
    if (now - this.lastCleanup > 120_000) {
      this.lastCleanup = now
      const cutoff = now - 120_000
      for (const [k, ts] of this.windows) {
        const recent = ts.filter(t => t > cutoff)
        if (recent.length === 0) this.windows.delete(k)
        else this.windows.set(k, recent)
      }
    }

    const windowStart = now - 60_000
    const timestamps = this.windows.get(key) || []
    const recent = timestamps.filter(t => t > windowStart)
    if (recent.length >= maxPerMinute) return false
    recent.push(now)
    this.windows.set(key, recent)
    return true
  }
}

// ── QUEUE DE CONCURRENCE ───────────────────────────────────────────────────

class ConcurrencyQueue {
  private running = 0
  private queue: Array<{ resolve: () => void; priority: number }> = []
  private maxConcurrent: number

  constructor(maxConcurrent: number) {
    this.maxConcurrent = maxConcurrent
  }

  async acquire(priority: number = 1): Promise<void> {
    if (this.running < this.maxConcurrent) {
      this.running++
      return
    }
    return new Promise<void>((resolve) => {
      this.queue.push({ resolve, priority })
      this.queue.sort((a, b) => b.priority - a.priority)
    })
  }

  release(): void {
    this.running--
    if (this.queue.length > 0) {
      const next = this.queue.shift()
      if (next) {
        this.running++
        next.resolve()
      }
    }
  }

  get pending(): number { return this.queue.length }
  get processing(): number { return this.running }
}

// ── SERVICE IA CENTRALISÉ ──────────────────────────────────────────────────
// Utilise globalThis pour persister entre invocations serverless (même process)

const globalAI = globalThis as unknown as {
  _aiCache?: LRUCache
  _aiRateLimiter?: RateLimiter
  _aiConcurrencyQueue?: ConcurrencyQueue
  _aiProviderCache?: { provider: AIProvider; model: string; checkedAt: number } | null
}

const cache = globalAI._aiCache ?? (globalAI._aiCache = new LRUCache(CONFIG.cache.maxSize))
const rateLimiter = globalAI._aiRateLimiter ?? (globalAI._aiRateLimiter = new RateLimiter())
const concurrencyQueue = globalAI._aiConcurrencyQueue ?? (globalAI._aiConcurrencyQueue = new ConcurrencyQueue(CONFIG.rateLimit.maxConcurrent))

async function callLLM(messages: AIMessage[], options: AIRequestOptions): Promise<{ content: string; provider: AIProvider; model: string }> {
  // Tout passe par AURA — router intelligent OpenAI/Mistral selon la tâche
  const auraTask = options.capability
    ? (CAPABILITY_TO_AURA_TASK[options.capability] ?? 'crm_crud')
    : 'crm_crud'

  const result = await callAuraLLM({
    task: auraTask,
    messages: messages.map(m => ({ role: m.role, content: m.content })),
    temperature: options.temperature,
    maxTokens: options.maxTokens,
    cabinetId: options.cabinetId,
    userId: options.userId,
  })
  return {
    content: result.content,
    provider: result.provider as AIProvider,
    model: result.model,
  }
}

/**
 * Appel LLM en streaming — tout passe par AURA
 */
async function callLLMStream(
  messages: AIMessage[],
  options: AIRequestOptions
): Promise<{ stream: ReadableStream<Uint8Array>; provider: AIProvider; model: string }> {
  const auraTask = options.capability
    ? (CAPABILITY_TO_AURA_TASK[options.capability] ?? 'crm_crud')
    : 'crm_crud'

  const result = await callAuraLLMStream({
    task: auraTask,
    messages: messages.map(m => ({ role: m.role, content: m.content })),
    temperature: options.temperature,
    maxTokens: options.maxTokens,
    cabinetId: options.cabinetId,
    userId: options.userId,
    stream: true,
  })
  return {
    stream: result.stream,
    provider: result.provider as AIProvider,
    model: result.model,
  }
}

// Détection du provider disponible (OpenAI prioritaire, Mistral fallback)
// TODO [S9-MIGRATION]: Unifier avec V2 ProviderAdapter pour utiliser les connexions BYOK
// quand disponibles. Actuellement ce service legacy utilise OPENAI_API_KEY / MISTRAL_API_KEY
// directement, tandis que V2 résout via les AIConnection en base (BYOK).
// Surfaces legacy utilisant ce service: TabOverview (analyzeProfile), EmailCompose (generateEmail),
// enrich-preco, explain, summarize, generate-narrative.
// Priorité: Migrer ces surfaces vers useAIv2 ou faire un bridge ProviderAdapter ici.
async function detectProvider(): Promise<{ provider: AIProvider; model: string }> {
  const key = process.env.OPENAI_API_KEY ? 'openai' : process.env.MISTRAL_API_KEY ? 'mistral-cloud' : 'fallback'
  const model = key === 'openai' ? (process.env.AURA_ORCHESTRATOR_MODEL || 'gpt-4o-mini') : key === 'mistral-cloud' ? 'mistral-small-latest' : ''
  return { provider: key as AIProvider, model }
}


/**
 * Génère une complétion IA en streaming (SSE) avec rate limiting et queue
 */
export async function aiGenerateStream(
  messages: AIMessage[],
  options: AIRequestOptions
): Promise<{ stream: ReadableStream<Uint8Array>; provider: AIProvider; model: string }> {
  // Rate limiting par cabinet
  if (options.cabinetId) {
    if (!rateLimiter.isAllowed(options.cabinetId, CONFIG.rateLimit.maxPerMinute)) {
      throw new Error('Limite de requêtes IA atteinte (30/min par cabinet).')
    }
  }

  // Queue de concurrence
  const priorityMap = { low: 0, normal: 1, high: 2 }
  await concurrencyQueue.acquire(priorityMap[options.priority || 'normal'])

  try {
    const result = await callLLMStream(messages, options)
    // Release queue when stream finishes (wrap the stream)
    const originalStream = result.stream
    const passThrough = new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        controller.enqueue(chunk)
      },
      flush() {
        concurrencyQueue.release()
      },
    })
    return {
      stream: originalStream.pipeThrough(passThrough),
      provider: result.provider,
      model: result.model,
    }
  } catch (e) {
    concurrencyQueue.release()
    throw e
  }
}

/**
 * Chat en streaming avec system prompt + historique (+ RAG automatique)
 * Retourne aussi les sources RAG pour affichage dans l'UI
 */
export async function aiChatStream(
  history: AIMessage[],
  userMessage: string,
  options: Omit<AIRequestOptions, 'capability'> = {}
): Promise<{ stream: ReadableStream<Uint8Array>; provider: AIProvider; model: string; ragSources?: RAGSourceInfo[] }> {
  const basePrompt = SYSTEM_PROMPTS.chat
  const { enrichedPrompt, ragContext } = await enrichWithRAG(basePrompt, userMessage, options)

  const messages: AIMessage[] = [
    { role: 'system', content: enrichedPrompt },
    ...history,
    { role: 'user', content: userMessage },
  ]
  const result = await aiGenerateStream(messages, { ...options, capability: 'chat' })

  const ragSources = ragContext?.sources?.length
    ? ragContext.sources.map(s => ({
        type: s.type,
        title: s.title,
        url: s.url,
        sourceName: s.sourceName,
        relevance: s.relevance,
        legalDocType: s.legalDocType,
      }))
    : undefined

  return { ...result, ragSources }
}

// ── API PUBLIQUE ───────────────────────────────────────────────────────────

/**
 * Génère une complétion IA avec cache, rate limiting et queue
 */
export async function aiGenerate(
  messages: AIMessage[],
  options: AIRequestOptions
): Promise<AIResponse> {
  const startTime = Date.now()

  // Rate limiting par cabinet
  if (options.cabinetId) {
    if (!rateLimiter.isAllowed(options.cabinetId, CONFIG.rateLimit.maxPerMinute)) {
      throw new Error('Limite de requêtes IA atteinte (30/min par cabinet). Réessayez dans quelques secondes.')
    }
  }

  // Cache check
  if (options.cacheKey) {
    const cached = cache.get(options.cacheKey)
    if (cached) {
      return {
        content: cached.content,
        provider: cached.provider,
        model: cached.model,
        cached: true,
        latencyMs: Date.now() - startTime,
      }
    }
  }

  // Queue de concurrence
  const priorityMap = { low: 0, normal: 1, high: 2 }
  await concurrencyQueue.acquire(priorityMap[options.priority || 'normal'])

  try {
    const result = await callLLM(messages, options)

    // Mise en cache
    if (options.cacheKey && result.content) {
      cache.set(options.cacheKey, {
        content: result.content,
        provider: result.provider,
        model: result.model,
        createdAt: Date.now(),
        ttl: (options.cacheTtlSeconds || 300) * 1000,
      })
    }

    return {
      content: result.content,
      provider: result.provider,
      model: result.model,
      cached: false,
      latencyMs: Date.now() - startTime,
      tokensEstimated: Math.ceil(result.content.length / 4),
    }
  } finally {
    concurrencyQueue.release()
  }
}

/**
 * Enrichit un system prompt avec le contexte RAG si activé
 */
async function enrichWithRAG(
  systemPrompt: string,
  userPrompt: string,
  options: Partial<AIRequestOptions>,
): Promise<{ enrichedPrompt: string; ragContext: RAGContext | null }> {
  if (!options.enableRag) {
    return { enrichedPrompt: systemPrompt, ragContext: null }
  }

  // Toujours enrichir avec les connaissances CGP embarquées (rapide, offline)
  const cgpChunks = searchKnowledge(userPrompt, 3)
  let cgpKnowledgeContext = ''
  if (cgpChunks.length > 0) {
    cgpKnowledgeContext = '\n\n═══ CONNAISSANCES CGP PERTINENTES ═══\n' +
      cgpChunks.map(c => `--- ${c.title} ---\n${c.content.slice(0, 400)}`).join('\n\n') +
      '\n'
    if (cgpChunks.some(c => c.alerts.length > 0)) {
      const alerts = cgpChunks.flatMap(c => c.alerts).slice(0, 3)
      cgpKnowledgeContext += '\nALERTES :\n' + alerts.map(a => `⚠️ ${a}`).join('\n') + '\n'
    }
  }

  try {
    const ragContext = await retrieveRAGContext(userPrompt, {
      maxCrmChunks: options.ragOptions?.maxCrmChunks,
      maxWebResults: options.ragOptions?.maxWebResults,
      forceWebSearch: options.ragOptions?.forceWebSearch,
      disableWebSearch: options.ragOptions?.disableWebSearch,
      clientContext: options.clientContext,
    })

    if (ragContext.sources.length > 0) {
      return {
        enrichedPrompt: `${systemPrompt}${cgpKnowledgeContext}\n${ragContext.contextText}`,
        ragContext,
      }
    }

    // Pas de CRM RAG, mais on a les connaissances CGP
    return {
      enrichedPrompt: `${systemPrompt}${cgpKnowledgeContext}`,
      ragContext,
    }
  } catch (e) {
    logger.warn('[RAG] CRM retrieval failed, using CGP knowledge only', { module: 'ai-service', error: e instanceof Error ? e.message : 'unknown' })
    return {
      enrichedPrompt: `${systemPrompt}${cgpKnowledgeContext}`,
      ragContext: null,
    }
  }
}

/**
 * Génère avec un system prompt pré-configuré pour une capability donnée
 */
export async function aiCapability(
  capability: AICapability,
  userPrompt: string,
  options: Omit<AIRequestOptions, 'capability'> = {}
): Promise<AIResponse> {
  const basePrompt = SYSTEM_PROMPTS[capability]
  const { enrichedPrompt, ragContext } = await enrichWithRAG(basePrompt, userPrompt, options)

  const result = await aiGenerate(
    [
      { role: 'system', content: enrichedPrompt },
      { role: 'user', content: userPrompt },
    ],
    { ...options, capability }
  )

  // Attacher les métadonnées RAG à la réponse
  if (ragContext && ragContext.sources.length > 0) {
    result.ragSources = ragContext.sources.map(s => ({
      type: s.type,
      title: s.title,
      url: s.url,
      sourceName: s.sourceName,
      relevance: s.relevance,
      legalDocType: s.legalDocType,
    }))
    result.ragMetrics = {
      crmChunksFound: ragContext.metrics.crmChunksFound,
      webResultsFound: ragContext.metrics.webResultsFound,
      retrievalDurationMs: ragContext.metrics.retrievalDurationMs,
    }
  }

  return result
}

/**
 * Chat multi-tour avec historique (+ RAG automatique)
 */
export async function aiChat(
  history: AIMessage[],
  userMessage: string,
  options: Omit<AIRequestOptions, 'capability'> = {}
): Promise<AIResponse> {
  const basePrompt = SYSTEM_PROMPTS.chat
  const { enrichedPrompt, ragContext } = await enrichWithRAG(basePrompt, userMessage, options)

  const messages: AIMessage[] = [
    { role: 'system', content: enrichedPrompt },
    ...history,
    { role: 'user', content: userMessage },
  ]
  const result = await aiGenerate(messages, { ...options, capability: 'chat' })

  if (ragContext && ragContext.sources.length > 0) {
    result.ragSources = ragContext.sources.map(s => ({
      type: s.type,
      title: s.title,
      url: s.url,
      sourceName: s.sourceName,
      relevance: s.relevance,
      legalDocType: s.legalDocType,
    }))
    result.ragMetrics = {
      crmChunksFound: ragContext.metrics.crmChunksFound,
      webResultsFound: ragContext.metrics.webResultsFound,
      retrievalDurationMs: ragContext.metrics.retrievalDurationMs,
    }
  }

  return result
}

/**
 * Statut du service IA
 */
export async function aiStatus(): Promise<AIStatus> {
  const { provider, model } = await detectProvider()
  return {
    available: provider !== 'fallback',
    provider,
    model,
    openai: { configured: !!process.env.OPENAI_API_KEY },
    mistralCloud: { configured: !!process.env.MISTRAL_API_KEY },
    cache: { size: cache.size, hitRate: cache.hitRate },
    queue: { pending: concurrencyQueue.pending, processing: concurrencyQueue.processing },
  }
}

// ── FONCTIONS MÉTIER PRÊTES À L'EMPLOI ─────────────────────────────────────

/** Résumé automatique d'un rendez-vous */
export async function aiSummarizeAppointment(
  notes: string,
  clientName: string,
  appointmentType: string,
  cabinetId?: string
): Promise<AIResponse> {
  const prompt = `Résume ce compte rendu de rendez-vous patrimonial :
Client : ${clientName}
Type : ${appointmentType}
Notes brutes :
---
${notes}
---
Produis un résumé structuré avec : objet, points clés, décisions, actions à mener.`

  return aiCapability('summarize', prompt, {
    cabinetId,
    cacheKey: null as unknown as string, // Pas de cache pour les résumés (contenu unique)
    maxTokens: 600,
  })
}

/** Génération d'email client personnalisé */
export async function aiGenerateEmail(
  params: {
    clientName: string
    advisorName: string
    cabinetName: string
    emailType: 'relance' | 'confirmation_rdv' | 'envoi_bilan' | 'information' | 'anniversaire' | 'suivi_preco' | 'custom'
    context: string
    tone?: 'formel' | 'chaleureux' | 'urgent'
  },
  cabinetId?: string
): Promise<AIResponse> {
  const toneMap = {
    formel: 'ton formel et institutionnel',
    chaleureux: 'ton chaleureux et personnalisé',
    urgent: 'ton professionnel avec notion d\'urgence',
  }
  const emailTypeLabels: Record<string, string> = {
    relance: 'relance douce suite à un rendez-vous sans retour',
    confirmation_rdv: 'confirmation de rendez-vous',
    envoi_bilan: 'envoi du bilan patrimonial',
    information: 'information importante à communiquer',
    anniversaire: 'message d\'anniversaire avec touche patrimoniale',
    suivi_preco: 'suivi de la mise en œuvre des préconisations',
    custom: 'email personnalisé',
  }

  const prompt = `Rédige un email professionnel pour un client de cabinet CGP.
Client : ${params.clientName}
Conseiller : ${params.advisorName}
Cabinet : ${params.cabinetName}
Type d'email : ${emailTypeLabels[params.emailType] || params.emailType}
Ton souhaité : ${toneMap[params.tone || 'chaleureux']}
Contexte : ${params.context}

Format : Objet de l'email sur la première ligne (préfixé "Objet : "), puis le corps de l'email. Termine par une signature professionnelle avec le nom du conseiller et du cabinet.`

  return aiCapability('email', prompt, {
    cabinetId,
    maxTokens: 600,
    temperature: 0.5,
  })
}

/** Analyse SWOT intelligente d'un profil client */
export async function aiAnalyzeProfile(
  clientData: {
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
  },
  cabinetId?: string
): Promise<AIResponse> {
  const prompt = `Analyse le profil patrimonial de ce client et produis une analyse SWOT structurée en JSON :

Profil :
- Âge : ${clientData.age} ans
- Situation : ${clientData.situationFamiliale}, ${clientData.nbEnfants} enfant(s)
- Profession : ${clientData.profession}
- Revenu annuel : ${clientData.revenuAnnuel}€
- Patrimoine net : ${clientData.patrimoineNet}€
- Patrimoine immobilier : ${clientData.patrimoineImmobilier}€ (${clientData.patrimoineNet > 0 ? ((clientData.patrimoineImmobilier / clientData.patrimoineNet) * 100).toFixed(0) : 0}%)
- Patrimoine financier : ${clientData.patrimoineFinancier}€
- Taux d'endettement : ${clientData.endettement}%
- Taux d'épargne : ${clientData.tauxEpargne}%
- TMI : ${clientData.tmi}%
- Assujetti IFI : ${clientData.ifiAssujetti ? 'Oui' : 'Non'}

Réponds UNIQUEMENT en JSON valide : { "forces": [...], "faiblesses": [...], "opportunites": [...], "menaces": [...], "scoreGlobal": number, "prioriteAction": "string" }`

  return aiCapability('analyze-profile', prompt, {
    cabinetId,
    cacheKey: `profile-${clientData.age}-${clientData.patrimoineNet}-${clientData.revenuAnnuel}`,
    cacheTtlSeconds: 600,
    maxTokens: 800,
  })
}

/** Enrichissement d'une préconisation avec argumentation détaillée */
export async function aiEnrichPreconisation(
  preco: {
    titre: string
    categorie: string
    produit?: string
    montantEstime?: number
    objectif: string
    clientAge: number
    clientTmi: number
    clientCapaciteEpargne: number
    clientPatrimoineNet: number
  },
  cabinetId?: string
): Promise<AIResponse> {
  const prompt = `Enrichis cette préconisation patrimoniale avec une argumentation détaillée :

Préconisation : ${preco.titre}
Catégorie : ${preco.categorie}
${preco.produit ? `Produit : ${preco.produit}` : ''}
${preco.montantEstime ? `Montant estimé : ${preco.montantEstime}€` : ''}
Objectif : ${preco.objectif}

Profil client :
- Âge : ${preco.clientAge} ans
- TMI : ${preco.clientTmi}%
- Capacité d'épargne : ${preco.clientCapaciteEpargne}€/mois
- Patrimoine net : ${preco.clientPatrimoineNet}€

Rédige 3 paragraphes : (1) pourquoi adapté à ce profil, (2) mécanisme et avantages chiffrés avec articles de loi, (3) mise en œuvre et calendrier.`

  return aiCapability('enrich-preco', prompt, {
    cabinetId,
    maxTokens: 800,
    temperature: 0.3,
  })
}

/** Explication d'un concept fiscal/juridique */
export async function aiExplainConcept(
  concept: string,
  level: 'junior' | 'senior' = 'junior',
  cabinetId?: string
): Promise<AIResponse> {
  const prompt = `Explique le concept suivant à un conseiller en gestion de patrimoine ${level === 'junior' ? 'débutant' : 'expérimenté'} :

"${concept}"

Inclus : définition claire, cadre légal (articles de loi), exemple chiffré concret, points de vigilance pratiques.`

  return aiCapability('explain', prompt, {
    cabinetId,
    cacheKey: `explain-${concept.toLowerCase().replace(/\s+/g, '-').slice(0, 60)}-${level}`,
    cacheTtlSeconds: 3600, // 1h — les explications changent rarement
    maxTokens: 600,
  })
}

/** Comparaison de produits / stratégies */
export async function aiCompare(
  items: string[],
  clientContext: string,
  cabinetId?: string
): Promise<AIResponse> {
  const prompt = `Compare objectivement ces options patrimoniales :

Options : ${items.join(' vs ')}

Contexte client : ${clientContext}

Structure ta réponse : critères de comparaison, avantages/inconvénients de chaque option, recommandation argumentée.`

  return aiCapability('compare', prompt, {
    cabinetId,
    cacheKey: `compare-${items.sort().join('-').slice(0, 80)}`,
    cacheTtlSeconds: 900,
    maxTokens: 800,
  })
}

// ============================================================================
// AGENT IA AUTONOME — Chat avec mémoire, outils et actions
// ============================================================================

export { type AgentResponse, type AgentActionInfo }

export interface AgentChatOptions {
  cabinetId: string
  userId: string
  clientId?: string
  history?: Array<{ role: 'user' | 'assistant'; content: string }>
  autoExecute?: boolean
  confirmActionId?: string
  cancelActionId?: string
  pageContext?: {
    path: string
    pageType?: string
    clientId?: string
    clientName?: string
    visibleData?: string
  }
}

/**
 * Chat via l'agent IA autonome
 * 
 * Contrairement à aiChat() qui fait du simple RAG,
 * aiAgentChat() utilise le système agentique complet :
 *   - Mémoire persistante (instructions, préférences, faits)
 *   - Exécution d'outils CRM (recherche, création tâches/RDV, etc.)
 *   - Résumé de conversations passées
 *   - Classification d'intention (question, action, instruction)
 * 
 * C'est le point d'entrée principal pour le chat IA du CRM.
 */
export async function aiAgentChat(
  userMessage: string,
  options: AgentChatOptions,
): Promise<AgentResponse> {
  // Rate limiting
  if (options.cabinetId) {
    if (!rateLimiter.isAllowed(options.cabinetId, CONFIG.rateLimit.maxPerMinute)) {
      throw new Error('Limite de requêtes IA atteinte (30/min par cabinet).')
    }
  }

  // Fonction de génération LLM pour l'agent
  const generateFn = async (
    systemPrompt: string,
    messages: Array<{ role: string; content: string }>,
  ): Promise<string> => {
    const aiMessages: AIMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    ]

    const result = await aiGenerate(aiMessages, {
      capability: 'chat',
      cabinetId: options.cabinetId,
      userId: options.userId,
      priority: 'high',
      temperature: 0.4,
      maxTokens: 2000,
    })

    return result.content
  }

  // Exécuter l'agent
  const agentOptions: AgentOptions = {
    cabinetId: options.cabinetId,
    userId: options.userId,
    clientId: options.clientId,
    history: options.history,
    autoExecute: options.autoExecute,
    confirmActionId: options.confirmActionId,
    cancelActionId: options.cancelActionId,
    pageContext: options.pageContext,
  }

  return runAgent(userMessage, generateFn, agentOptions)
}

/**
 * Chat agent en streaming
 * 
 * Architecture en 3 phases pour une autonomie complète :
 *   Phase 1 : Agent (mémoire + outils regex + RAG) → capture le system prompt
 *   Phase 2 : Pré-vol LLM non-streaming → détecte et exécute les [ACTION:...] autonomes
 *   Phase 3 : Stream la réponse finale avec tous les résultats d'outils intégrés
 */
export async function aiAgentChatStream(
  userMessage: string,
  options: AgentChatOptions,
): Promise<{
  stream: ReadableStream<Uint8Array>
  provider: AIProvider
  model: string
  agentResponse: Omit<AgentResponse, 'content'>
}> {
  // Rate limiting
  if (options.cabinetId) {
    if (!rateLimiter.isAllowed(options.cabinetId, CONFIG.rateLimit.maxPerMinute)) {
      throw new Error('Limite de requêtes IA atteinte (30/min par cabinet).')
    }
  }

  // Phase 1 : Exécuter l'agent (mémoire + outils regex + RAG) — capture le system prompt
  let capturedSystemPrompt = ''
  let capturedMessages: Array<{ role: string; content: string }> = []

  const captureFn = async (
    systemPrompt: string,
    messages: Array<{ role: string; content: string }>,
  ): Promise<string> => {
    capturedSystemPrompt = systemPrompt
    capturedMessages = messages
    return ''
  }

  const agentOptions: AgentOptions = {
    cabinetId: options.cabinetId,
    userId: options.userId,
    clientId: options.clientId,
    history: options.history,
    autoExecute: options.autoExecute,
    confirmActionId: options.confirmActionId,
    cancelActionId: options.cancelActionId,
    pageContext: options.pageContext,
  }

  const agentResult = await runAgent(userMessage, captureFn, agentOptions)

  // Phase 2 : Pré-vol LLM — vérifier si l'agent veut utiliser des outils autonomement
  // On fait un appel rapide non-streaming pour détecter les [ACTION:...] tags
  let finalSystemPrompt = capturedSystemPrompt
  let finalMessages = capturedMessages
  const additionalActions = [...agentResult.actions]

  // Preflight seulement si :
  // 1. Aucun outil n'a déjà été exécuté par le regex (sinon le contexte est déjà riche)
  // 2. L'intent suggère que des outils pourraient être nécessaires (action ou question complexe)
  // Ceci évite un double appel LLM coûteux pour les conversations simples
  const hasToolResults = agentResult.actions.some(a => a.status === 'executed' && a.data)
  const intentMayNeedTools = agentResult.metrics.totalMs > 0 && 
    !['conversation', 'instruction', 'memory_query', 'confirmation'].includes(
      agentResult.actions.length === 0 ? 'question' : 'action'
    )
  const shouldPreflight = !hasToolResults && (intentMayNeedTools || userMessage.length > 50)

  if (shouldPreflight) {
    try {
      const preflightMessages: AIMessage[] = [
        { role: 'system', content: capturedSystemPrompt },
        ...capturedMessages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      ]

      const preflightResult = await aiGenerate(preflightMessages, {
        capability: 'chat',
        cabinetId: options.cabinetId,
        userId: options.userId,
        priority: 'high',
        temperature: 0.3,
        maxTokens: 800,
      })

      // Parser les appels d'outils autonomes
      const { parseToolCallsFromResponse, cleanResponseFromToolCalls } = await import('./agent/agent-orchestrator')
      const { executeTool } = await import('./agent/agent-tools')
      const toolCalls = parseToolCallsFromResponse(preflightResult.content)

      if (toolCalls.length > 0) {
        const toolContext = {
          cabinetId: options.cabinetId,
          userId: options.userId,
          clientId: options.clientId,
        }
        const toolResultTexts: string[] = []

        for (const call of toolCalls) {
          const { TOOL_DEFINITIONS } = await import('./agent/agent-tools')
          const toolDef = TOOL_DEFINITIONS.find(t => t.name === call.toolName)
          if (toolDef && !toolDef.requiresConfirmation) {
            const result = await executeTool(call.toolName, call.params, toolContext)
            additionalActions.push({
              toolName: call.toolName,
              status: result.success ? 'executed' : 'failed',
              message: result.message,
              data: result.data,
              requiresConfirmation: false,
              navigationUrl: result.navigationUrl,
            })
            if (result.success && result.data) {
              const dataStr = JSON.stringify(result.data, null, 2)
              const truncated = dataStr.length > 2000 ? dataStr.slice(0, 2000) + '...' : dataStr
              toolResultTexts.push(`[${result.toolName}] ${result.message}\n${truncated}`)
            }
          } else if (toolDef?.requiresConfirmation) {
            additionalActions.push({
              toolName: call.toolName,
              status: 'pending_confirmation',
              message: `Action proposée : ${toolDef.description}`,
              data: call.params,
              requiresConfirmation: true,
            })
          }
        }

        // Enrichir le contexte avec les résultats des outils pour le stream final
        if (toolResultTexts.length > 0) {
          const cleanedPreflight = cleanResponseFromToolCalls(preflightResult.content)
          finalMessages = [
            ...capturedMessages,
            { role: 'assistant', content: cleanedPreflight },
            { role: 'user', content: `Voici les résultats des outils que tu as appelés :\n\n${toolResultTexts.join('\n\n')}\n\nIntègre ces données dans ta réponse. Sois précis avec les chiffres et les noms. Propose des analyses et prochaines étapes concrètes.` },
          ]
        }
      }
    } catch (e) {
      logger.warn('[Agent Stream] Preflight tool detection failed, streaming without', { module: 'ai-service', error: e instanceof Error ? e.message : 'unknown' })
    }
  }

  // Phase 3 : Streamer la réponse finale
  const aiMessages: AIMessage[] = [
    { role: 'system', content: finalSystemPrompt },
    ...finalMessages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
  ]

  const streamResult = await aiGenerateStream(aiMessages, {
    capability: 'chat',
    cabinetId: options.cabinetId,
    userId: options.userId,
    priority: 'high',
    temperature: 0.4,
    maxTokens: 2000,
  })

  return {
    stream: streamResult.stream,
    provider: streamResult.provider,
    model: streamResult.model,
    agentResponse: {
      actions: additionalActions,
      ragSources: agentResult.ragSources,
      memoriesUsed: agentResult.memoriesUsed,
      instructionsApplied: agentResult.instructionsApplied,
      metrics: agentResult.metrics,
    },
  }
}
