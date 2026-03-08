/**
 * RAG Service V3 — Orchestrateur Retrieval-Augmented Generation
 * 
 * Architecture multi-niveau pour professionnels du patrimoine :
 *   1. Analyse de requête (intention, entités, profil pro)
 *   2. Retrieval CRM multi-critères (BM25 + intent + cross-refs)
 *   3. Recherche sources juridiques (Legifrance, BOFIP, RSS)
 *   4. Recherche web enrichie (reformulation, scoring qualité)
 *   5. Formatage enrichi (articles de loi, liens CRM, citations)
 *   6. Injection contextuelle dans le system prompt
 * 
 * Rétrocompatibilité complète avec V1 (mêmes types et signatures).
 */

import {
  retrieveKnowledge,
  retrieveByLegalReference,
  getKnowledgeStats,
  type KnowledgeChunkV2,
  type RetrievalResult,
} from './rag-knowledge-base'

import {
  webSearch,
  needsWebSearch,
  isWebSearchAvailable,
  type WebSearchResult,
  type WebSearchResponse,
} from './rag-web-search'

import {
  type ProfessionalProfile,
  type QueryAnalysis,
  analyzeQuery,
} from './rag-query-engine'

import { logger } from '@/app/_common/lib/logger'

import {
  searchLegalSources,
  getLegalSourcesStatus,
  type LegalDocument,
  type LegalSearchResponse,
  type LegalSourceId,
} from './rag-legal-connector'

// ============================================================================
// CACHE DE RECHERCHE (LRU, TTL 5 min)
// ============================================================================

interface SearchCacheEntry<T> {
  data: T
  createdAt: number
}

class SearchCache<T> {
  private cache = new Map<string, SearchCacheEntry<T>>()
  private maxSize: number
  private ttlMs: number

  constructor(maxSize = 50, ttlMs = 5 * 60 * 1000) {
    this.maxSize = maxSize
    this.ttlMs = ttlMs
  }

  get(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null
    if (Date.now() - entry.createdAt > this.ttlMs) {
      this.cache.delete(key)
      return null
    }
    // LRU: re-insert at end
    this.cache.delete(key)
    this.cache.set(key, entry)
    return entry.data
  }

  set(key: string, data: T): void {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      if (firstKey) this.cache.delete(firstKey)
    }
    this.cache.set(key, { data, createdAt: Date.now() })
  }
}

const legalSearchCache = new SearchCache<LegalSearchResponse>(30)
const webSearchCache = new SearchCache<WebSearchResponse>(30)

// ============================================================================
// TYPES
// ============================================================================

export interface RAGSource {
  type: 'crm' | 'web' | 'legal'
  title: string
  /** Lien vers le simulateur CRM, l'URL web ou le document juridique */
  url?: string
  /** Nom de la source (ex: "parameters", "legifrance.gouv.fr", "bofip") */
  sourceName: string
  /** Score de pertinence (0-10) */
  relevance: number
  /** Références légales associées */
  legalRefs?: string[]
  /** Type de document juridique (si type='legal') */
  legalDocType?: string
}

export interface RAGContext {
  /** Texte formaté à injecter dans le system prompt */
  contextText: string
  /** Sources utilisées (pour affichage dans l'UI) */
  sources: RAGSource[]
  /** Métriques de la recherche */
  metrics: {
    crmChunksFound: number
    legalDocsFound: number
    webResultsFound: number
    totalSources: number
    retrievalDurationMs: number
    legalSearchPerformed: boolean
    webSearchPerformed: boolean
    queryIntent?: string
    queryConfidence?: number
    legalSourcesQueried?: string[]
  }
}

export interface RAGOptions {
  /** Nombre max de chunks CRM à récupérer (défaut: 5) */
  maxCrmChunks?: number
  /** Nombre max de résultats web (défaut: 3) */
  maxWebResults?: number
  /** Nombre max de documents juridiques (défaut: 3) */
  maxLegalDocs?: number
  /** Score minimum pour inclure un chunk CRM (défaut: 0.8) */
  minCrmScore?: number
  /** Forcer la recherche web même si non détectée comme nécessaire */
  forceWebSearch?: boolean
  /** Désactiver la recherche web */
  disableWebSearch?: boolean
  /** Activer la recherche dans les sources juridiques (défaut: true) */
  enableLegalSearch?: boolean
  /** Sources juridiques spécifiques à interroger */
  legalSources?: LegalSourceId[]
  /** Contexte client additionnel à injecter */
  clientContext?: string
  /** Profil professionnel de l'utilisateur (adapte le scoring) */
  professionalProfile?: ProfessionalProfile
}

// ============================================================================
// FORMATAGE DU CONTEXTE V2
// ============================================================================

/**
 * Formate les chunks CRM avec références légales et liens simulateurs
 */
function formatCrmContext(chunks: KnowledgeChunkV2[]): string {
  if (chunks.length === 0) return ''

  const sections = chunks.map((chunk, i) => {
    const parts: string[] = []

    // En-tête avec titre
    parts.push(`[Référence ${i + 1}: ${chunk.title}]`)

    // Références légales
    if (chunk.legalReferences.length > 0) {
      parts.push(`Réf. juridiques : ${chunk.legalReferences.join(', ')}`)
    }

    // Lien simulateur
    if (chunk.crmLink) {
      parts.push(`Simulateur : ${chunk.crmLink}`)
    }

    // Contenu
    parts.push(chunk.content)

    return parts.join('\n')
  })

  return `
═══ DONNÉES PATRIMONIALES VÉRIFIÉES ═══
${sections.join('\n\n---\n\n')}
═══ FIN DONNÉES ═══`
}

/**
 * Formate les documents juridiques (Legifrance, BOFIP, etc.)
 */
function formatLegalContext(documents: LegalDocument[]): string {
  if (documents.length === 0) return ''

  const typeLabels: Record<string, string> = {
    code_article: 'Article de code',
    jurisprudence: 'Jurisprudence',
    doctrine: 'Doctrine fiscale (BOFIP)',
    jorf: 'Journal Officiel',
    fiche_pratique: 'Fiche pratique',
    reglement: 'Règlement',
    actualite: 'Actualité juridique',
    rapport: 'Rapport',
    rss_entry: 'Actualité',
  }

  const sections = documents.map((doc, i) => {
    const parts: string[] = []
    const typeLabel = typeLabels[doc.type] || doc.type
    const sourceLabel = doc.source.replace(/_/g, '.')
    const date = doc.date ? ` (${doc.date})` : ''

    parts.push(`[${typeLabel}${date} — ${sourceLabel}]`)
    if (doc.legalReference) {
      parts.push(`Référence : ${doc.legalReference}`)
    }
    if (doc.title) {
      parts.push(doc.title)
    }
    if (doc.content) {
      parts.push(doc.content.slice(0, 1500))
    }
    parts.push(`URL : ${doc.url}`)

    return parts.join('\n')
  })

  return `
═══ TEXTES OFFICIELS ═══
${sections.join('\n\n---\n\n')}
═══ FIN TEXTES ═══`
}

/**
 * Formate les résultats web avec scoring de qualité
 */
function formatWebContext(results: WebSearchResult[]): string {
  if (results.length === 0) return ''

  const sections = results.map((r, i) => {
    const date = r.publishedDate ? ` (${r.publishedDate})` : ''
    const quality = r.domainQuality ? ` [fiabilité: ${Math.round(r.domainQuality * 100)}%]` : ''
    return `[${r.source}${date}${quality}]
${r.title}
${r.snippet}
URL: ${r.url}`
  })

  return `
═══ INFORMATIONS COMPLÉMENTAIRES ═══
${sections.join('\n\n')}
═══ FIN ═══`
}

/**
 * Construit l'instruction RAG adaptée au profil professionnel
 */
function buildRAGInstruction(
  hasCrm: boolean,
  hasLegal: boolean,
  hasWeb: boolean,
  analysis: QueryAnalysis,
  profile: ProfessionalProfile,
): string {
  const parts: string[] = []

  if (!hasCrm && !hasLegal && !hasWeb) return ''

  parts.push('\n══ INFORMATIONS DE RÉFÉRENCE ══')
  parts.push('Les données ci-dessous sont vérifiées. Utilise-les pour enrichir ta réponse SANS mentionner leur provenance technique.')

  // Instruction adaptée au profil
  const profileInstructions: Record<string, string> = {
    cgp: 'Tu t\'adresses à un CGP (Conseiller en Gestion de Patrimoine). Utilise un vocabulaire technique précis, cite les articles de loi, et propose des stratégies patrimoniales concrètes.',
    tax_specialist: 'Tu t\'adresses à un fiscaliste. Sois exhaustif sur les références légales (articles CGI, jurisprudence), les conditions d\'application et les exceptions.',
    financial_analyst: 'Tu t\'adresses à un analyste financier. Mets l\'accent sur les données chiffrées, les ratios, les comparaisons d\'enveloppes et les projections de rendement.',
    fund_manager: 'Tu t\'adresses à un gérant de fonds. Focus sur l\'allocation, les classes d\'actifs, les indicateurs de performance et la réglementation MIF2.',
    insurance_broker: 'Tu t\'adresses à un courtier en assurance. Détaille les mécanismes AV/prévoyance, la clause bénéficiaire, la fiscalité rachat/décès et la conformité DDA.',
    real_estate_broker: 'Tu t\'adresses à un courtier immobilier. Focus sur le financement, la fiscalité locative (LMNP/SCI/déficit foncier), les dispositifs et les normes HCSF.',
    notary: 'Tu t\'adresses à un notaire. Sois précis sur le droit civil (successions, donations, régimes matrimoniaux), les droits de mutation et le démembrement.',
    general: 'Adapte ton niveau de langage au contexte professionnel patrimonial.',
  }
  parts.push(profileInstructions[profile] || profileInstructions.general)

  if (hasCrm) {
    parts.push('• Des paramètres fiscaux 2025 et données patrimoniales vérifiées sont disponibles ci-dessous. Utilise-les en priorité.')
  }

  if (hasLegal) {
    parts.push('• Des textes de loi et doctrine officielle (Legifrance, BOFIP) sont disponibles. Cite l\'article exact si pertinent.')
  }

  if (hasWeb) {
    parts.push('• Des résultats de recherche internet complètent les informations. Mentionne la source si tu les cites.')
  }

  parts.push('• Priorité : textes de loi officiels > données patrimoniales > recherche web > connaissances générales.')
  parts.push('• Cite les articles de loi pertinents quand applicable (ex: CGI art. 150-0 B ter).')
  parts.push('• Si tu manques d\'information, dis-le clairement.')
  parts.push('• IMPORTANT : ne mentionne JAMAIS les termes "RAG", "chunks", "CRM source", "knowledge base", ni les noms de fichiers internes dans ta réponse.')

  // Contexte d'intention détectée
  if (analysis.confidenceScore > 0.5) {
    const intentLabels: Record<string, string> = {
      income_tax: 'fiscalité IR',
      wealth_tax: 'IFI',
      fiscal_optimization: 'optimisation fiscale',
      capital_gains: 'plus-values',
      retirement_planning: 'retraite',
      estate_planning: 'succession',
      donation_strategy: 'donation/transmission',
      real_estate_investment: 'investissement immobilier',
      life_insurance: 'assurance-vie',
      savings_investment: 'épargne/placement',
      corporate_finance: 'entreprise/dirigeant',
      social_protection: 'prévoyance/protection',
      regulatory_compliance: 'réglementation',
      client_analysis: 'analyse client',
      market_analysis: 'marchés financiers',
      debt_financing: 'financement/emprunt',
      international_tax: 'fiscalité internationale',
      general_advice: 'conseil général',
    }
    const label = intentLabels[analysis.primaryIntent] || analysis.primaryIntent
    // Intention is for internal routing only, not shown to user
    // parts.push(`Intention : ${label}`)
  }

  return parts.join('\n')
}

// ============================================================================
// ORCHESTRATEUR PRINCIPAL V2
// ============================================================================

/**
 * Enrichit une query avec le contexte RAG (CRM + Legal + Web)
 * 
 * Flux multi-niveau :
 *   1. Analyse intention + entités
 *   2. Retrieval BM25 + multi-critères + cross-refs (CRM)
 *   3. Enrichissement par articles de loi détectés (CRM)
 *   4. Recherche sources juridiques (Legifrance, BOFIP, RSS)
 *   5. Recherche web si nécessaire
 *   6. Formatage adapté au profil pro
 */
export async function retrieveRAGContext(
  query: string,
  options: RAGOptions = {},
): Promise<RAGContext> {
  const startTime = Date.now()
  const {
    maxCrmChunks = 5,
    maxWebResults = 3,
    maxLegalDocs = 3,
    minCrmScore = 0.8,
    forceWebSearch = false,
    disableWebSearch = false,
    enableLegalSearch = true,
    legalSources,
    clientContext,
    professionalProfile = 'cgp',
  } = options

  // ── 1. Analyse de la requête ──
  const analysis = analyzeQuery(query)

  // ── 2. Retrieval CRM multi-critères ──
  const crmResult: RetrievalResult = retrieveKnowledge(query, maxCrmChunks, minCrmScore, {
    professionalProfile,
    includeRelated: true,
    precomputedAnalysis: analysis, // Évite un 2e appel à analyzeQuery()
  })

  // ── 3. Enrichissement par articles de loi extraits (CRM interne) ──
  let additionalLegalChunks: KnowledgeChunkV2[] = []
  if (analysis.entities.legalArticles.length > 0) {
    const existingIds = new Set(crmResult.chunks.map(c => c.id))
    for (const article of analysis.entities.legalArticles.slice(0, 2)) {
      const legalChunks = retrieveByLegalReference(article)
      for (const lc of legalChunks) {
        if (!existingIds.has(lc.id)) {
          additionalLegalChunks.push({ ...lc, relevanceScore: 0.6 })
          existingIds.add(lc.id)
        }
      }
    }
    additionalLegalChunks = additionalLegalChunks.slice(0, 2)
  }

  const allCrmChunks = [...crmResult.chunks, ...additionalLegalChunks]

  // ── 4+5. Recherche juridique + web EN PARALLÈLE ──
  // Déclenchement intelligent : éviter les requêtes réseau inutiles
  const HIGH_LEGAL_INTENTS = [
    'fiscal_optimization', 'estate_planning', 'donation_strategy',
    'regulatory_compliance', 'international_tax',
  ]
  const MEDIUM_LEGAL_INTENTS = [
    'income_tax', 'wealth_tax', 'capital_gains',
    'corporate_finance', 'social_protection',
  ]
  const shouldSearchLegal = enableLegalSearch && (
    // Toujours : articles de loi explicites ("art. 150-0 B ter")
    analysis.entities.legalArticles.length > 0 ||
    // Toujours : intents fortement juridiques
    HIGH_LEGAL_INTENTS.includes(analysis.primaryIntent) ||
    // Seulement si CRM insuffisant : intents modérément juridiques
    (MEDIUM_LEGAL_INTENTS.includes(analysis.primaryIntent) && allCrmChunks.length < 3) ||
    // Fallback : très peu de données CRM
    allCrmChunks.length < 1
  )

  // Décision web search avant le parallèle (ne dépend plus de legalResult)
  const shouldSearchWeb = !disableWebSearch && (
    forceWebSearch ||
    needsWebSearch(query) ||
    analysis.needsWebSearch ||
    allCrmChunks.length < 2
  )

  // Lancer les deux recherches en parallèle (avec cache LRU 5min)
  const emptyLegal: LegalSearchResponse = { documents: [], query, sourcesQueried: [], totalDurationMs: 0, errors: [] }
  const emptyWeb: WebSearchResponse = { results: [], query, provider: 'none', searchDurationMs: 0 }

  const legalCacheKey = `legal:${query.slice(0, 100).toLowerCase()}`
  const webCacheKey = `web:${query.slice(0, 100).toLowerCase()}`

  const cachedLegal = shouldSearchLegal ? legalSearchCache.get(legalCacheKey) : null
  const cachedWeb = shouldSearchWeb ? webSearchCache.get(webCacheKey) : null

  const [legalSettled, webSettled] = await Promise.allSettled([
    shouldSearchLegal
      ? (cachedLegal
          ? Promise.resolve(cachedLegal)
          : searchLegalSources(query, { maxResults: maxLegalDocs, sources: legalSources }))
      : Promise.resolve(emptyLegal),
    (shouldSearchWeb && isWebSearchAvailable())
      ? (cachedWeb
          ? Promise.resolve(cachedWeb)
          : webSearch(query, analysis))
      : Promise.resolve(emptyWeb),
  ])

  let legalResult = emptyLegal
  if (legalSettled.status === 'fulfilled') {
    legalResult = legalSettled.value
    if (!cachedLegal && legalResult.documents.length > 0) {
      legalSearchCache.set(legalCacheKey, legalResult)
    }
  } else {
    logger.warn('[RAG] Legal search failed:', legalSettled.reason)
  }

  let webResult = emptyWeb
  if (webSettled.status === 'fulfilled') {
    webResult = webSettled.value
    webResult.results = webResult.results.slice(0, maxWebResults)
    if (!cachedWeb && webResult.results.length > 0) {
      webSearchCache.set(webCacheKey, webResult)
    }
  } else {
    logger.warn('[RAG] Web search failed:', webSettled.reason)
  }

  // ── 6. Déduplication cross-type ──
  // Si un doc legal couvre le même sujet qu'un chunk CRM, on garde le CRM
  // (plus fiable car vérifié) et on note la référence légale
  const legalUrls = new Set(legalResult.documents.map(d => d.url))
  const dedupedWebResults = webResult.results.filter(r => !legalUrls.has(r.url))

  // ── 7. Construire les sources (triées par priorité : legal > CRM > web) ──
  const sources: RAGSource[] = []

  for (const doc of legalResult.documents) {
    sources.push({
      type: 'legal',
      title: doc.title,
      url: doc.url,
      sourceName: doc.source.replace(/_/g, '.'),
      relevance: doc.relevanceScore * 10,
      legalRefs: doc.legalReference ? [doc.legalReference] : undefined,
      legalDocType: doc.type,
    })
  }

  for (const chunk of allCrmChunks) {
    sources.push({
      type: 'crm',
      title: chunk.title,
      url: chunk.crmLink,
      sourceName: chunk.source,
      relevance: chunk.relevanceScore ?? 0,
      legalRefs: chunk.legalReferences.length > 0 ? chunk.legalReferences : undefined,
    })
  }

  for (const result of dedupedWebResults) {
    sources.push({
      type: 'web',
      title: result.title,
      url: result.url,
      sourceName: result.source,
      relevance: result.relevanceScore ?? 0.5,
    })
  }

  // ── 8. Assembler le contexte textuel avec budget de tokens ──
  // Budget : ~5000 chars (~1250 tokens) pour le contexte RAG injecté
  // Le reste du budget 8K tokens = system prompt (~1800) + history + réponse (~2000)
  const CONTEXT_BUDGET = 5000
  const hasCrm = allCrmChunks.length > 0
  const hasLegal = legalResult.documents.length > 0
  const hasWeb = dedupedWebResults.length > 0

  const contextParts: string[] = []
  let currentLength = 0

  // Instruction RAG adaptée au profil (priorité max, ~500 chars)
  const ragInstruction = buildRAGInstruction(hasCrm, hasLegal, hasWeb, analysis, professionalProfile)
  contextParts.push(ragInstruction)
  currentLength += ragInstruction.length

  // Contexte CRM enrichi (priorité haute — données vérifiées)
  if (hasCrm && currentLength < CONTEXT_BUDGET) {
    const crmText = formatCrmContext(allCrmChunks)
    const maxCrmChars = Math.min(crmText.length, CONTEXT_BUDGET - currentLength)
    contextParts.push(crmText.slice(0, maxCrmChars))
    currentLength += maxCrmChars
  }

  // Contexte juridique officiel (priorité haute — sources officielles)
  if (hasLegal && currentLength < CONTEXT_BUDGET) {
    const legalText = formatLegalContext(legalResult.documents)
    const maxLegalChars = Math.min(legalText.length, CONTEXT_BUDGET - currentLength)
    contextParts.push(legalText.slice(0, maxLegalChars))
    currentLength += maxLegalChars
  }

  // Contexte web (priorité basse — remplis le budget restant)
  if (hasWeb && currentLength < CONTEXT_BUDGET) {
    const webText = formatWebContext(dedupedWebResults)
    const maxWebChars = Math.min(webText.length, CONTEXT_BUDGET - currentLength)
    contextParts.push(webText.slice(0, maxWebChars))
    currentLength += maxWebChars
  }

  // Contexte client additionnel (toujours inclus)
  if (clientContext) {
    contextParts.push(`\n═══ CONTEXTE CLIENT ═══\n${clientContext}\n═══ FIN CONTEXTE CLIENT ═══`)
  }

  return {
    contextText: contextParts.join('\n'),
    sources,
    metrics: {
      crmChunksFound: allCrmChunks.length,
      legalDocsFound: legalResult.documents.length,
      webResultsFound: dedupedWebResults.length,
      totalSources: sources.length,
      retrievalDurationMs: Date.now() - startTime,
      legalSearchPerformed: shouldSearchLegal,
      webSearchPerformed: shouldSearchWeb,
      queryIntent: analysis.primaryIntent,
      queryConfidence: analysis.confidenceScore,
      legalSourcesQueried: legalResult.sourcesQueried,
    },
  }
}

// ============================================================================
// UTILITAIRES
// ============================================================================

/**
 * Retourne les statistiques du système RAG V2
 */
export function getRAGStats(): {
  knowledgeBase: {
    totalChunks: number
    categories: string[]
    sources: string[]
    difficulties: Record<string, number>
    profiles: Record<string, number>
  }
  legalSources: ReturnType<typeof getLegalSourcesStatus>
  webSearch: { available: boolean; providers: string[] }
} {
  const kbStats = getKnowledgeStats()
  const providers: string[] = []
  if (process.env.TAVILY_API_KEY) providers.push('tavily')
  if (process.env.SERPER_API_KEY) providers.push('serper')

  return {
    knowledgeBase: kbStats,
    legalSources: getLegalSourcesStatus(),
    webSearch: {
      available: isWebSearchAvailable(),
      providers,
    },
  }
}

/**
 * Export des types et fonctions utilitaires pour les autres modules
 */
export type { KnowledgeChunkV2 as KnowledgeChunk, WebSearchResult, LegalDocument }
export { needsWebSearch, isWebSearchAvailable, retrieveKnowledge, searchLegalSources }
