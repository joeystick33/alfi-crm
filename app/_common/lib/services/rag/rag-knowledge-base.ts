/**
 * RAG Knowledge Base V2 — Index multi-domaine avec BM25 intégré
 * 
 * Architecture professionnelle pour CGP, analystes financiers, gérants de fonds,
 * courtiers assurance/immobilier et fiscalistes.
 * 
 * Nouveautés V2 :
 *   • KnowledgeChunkV2 : types enrichis (profil pro, difficulté, cross-refs, articles de loi)
 *   • 80+ chunks (core patrimoniaux + pro/corporate/marchés/réglementation/scénarios)
 *   • BM25+ scoring probabiliste via rag-query-engine.ts
 *   • Index multi-domaine avec cross-références
 *   • Adaptation scoring par profil professionnel
 *   • Rétrocompatibilité totale avec l'API V1 (KnowledgeChunk, retrieveKnowledge, etc.)
 */

import {
  type QueryAnalysis,
  type ProfessionalProfile,
  type ChunkDifficulty,
  type BM25Index,
  buildBM25Index,
  scoreBM25,
  tokenize,
  analyzeQuery,
  computeMultiScore,
} from './rag-query-engine'
import { ALL_CORE_CHUNKS } from './rag-chunks-core'
import { ALL_PRO_CHUNKS } from './rag-chunks-pro'

// ============================================================================
// TYPES V2 (enrichis) + rétrocompat V1
// ============================================================================

export interface KnowledgeChunkV2 {
  id: string
  source: string
  category: string
  subcategory?: string
  title: string
  content: string
  keywords: string[]
  /** Références légales (articles CGI, code civil, CMF, etc.) */
  legalReferences: string[]
  /** IDs d'autres chunks liés (cross-references) */
  relatedChunkIds: string[]
  /** Profils professionnels pour lesquels ce chunk est le plus pertinent */
  professionalRelevance: ProfessionalProfile[]
  /** Niveau de difficulté du contenu */
  difficulty: ChunkDifficulty
  /** Score de pertinence (rempli dynamiquement lors de la recherche) */
  relevanceScore?: number
  /** Lien vers le simulateur/outil dans le CRM */
  crmLink?: string
  /** Date de dernière mise à jour du chunk */
  lastUpdated: string
}

/** Rétrocompatibilité V1 — alias */
export type KnowledgeChunk = KnowledgeChunkV2

export type KnowledgeSource =
  | 'parameters'
  | 'tax-calculator'
  | 'budget-calculator'
  | 'objective-calculator'
  | 'audit-engine'
  | 'simulator-per'
  | 'simulator-av'
  | 'simulator-immobilier'
  | 'simulator-succession'
  | 'simulator-donation'
  | 'simulator-retraite'
  | 'simulator-epargne'
  | 'simulator-emprunt'
  | 'simulator-enveloppe'
  | 'simulator-prevoyance'
  | 'knowledge-pro'

export type KnowledgeCategory =
  | 'fiscalite-ir'
  | 'fiscalite-ifi'
  | 'fiscalite-pv'
  | 'fiscalite-ps'
  | 'fiscalite-revenus-capitaux'
  | 'epargne-retraite'
  | 'assurance-vie'
  | 'succession-donation'
  | 'immobilier'
  | 'budget-endettement'
  | 'retraite'
  | 'protection-prevoyance'
  | 'enveloppes-fiscales'
  | 'entreprise-dirigeant'
  | 'marches-financiers'
  | 'reglementation'
  | 'scenarios-clients'
  | 'general'

// ============================================================================
// CORPUS COMPLET — 80+ chunks
// ============================================================================

const ALL_CHUNKS: KnowledgeChunkV2[] = [
  ...ALL_CORE_CHUNKS,
  ...ALL_PRO_CHUNKS,
]

// ============================================================================
// INDEX BM25 PRÉ-CONSTRUIT (initialisé au premier appel)
// ============================================================================

let _bm25Index: BM25Index | null = null
let _chunkMap: Map<string, KnowledgeChunkV2> | null = null

function getBM25Index(): BM25Index {
  if (!_bm25Index) {
    _bm25Index = buildBM25Index(
      ALL_CHUNKS.map(c => ({
        id: c.id,
        text: `${c.title} ${c.keywords.join(' ')} ${c.content}`,
      }))
    )
  }
  return _bm25Index
}

function getChunkMap(): Map<string, KnowledgeChunkV2> {
  if (!_chunkMap) {
    _chunkMap = new Map(ALL_CHUNKS.map(c => [c.id, c]))
  }
  return _chunkMap
}

// ============================================================================
// MOTEUR DE RETRIEVAL V2 — BM25 + Multi-critères
// ============================================================================

export interface RetrievalOptions {
  maxResults?: number
  minScore?: number
  professionalProfile?: ProfessionalProfile
  categories?: string[]
  difficulty?: ChunkDifficulty[]
  includeRelated?: boolean
  /** Passer une analyse déjà calculée pour éviter un appel redondant à analyzeQuery() */
  precomputedAnalysis?: QueryAnalysis
}

export interface RetrievalResult {
  chunks: KnowledgeChunkV2[]
  totalChunks: number
  queryTokens: string[]
  queryAnalysis?: QueryAnalysis
}

/**
 * Recherche V2 — BM25 + scoring multi-critères + expansion synonymes
 * Rétrocompatible avec l'API V1 (mêmes paramètres par défaut)
 */
export function retrieveKnowledge(
  query: string,
  maxResults: number = 5,
  minScore: number = 0.8,
  options?: RetrievalOptions,
): RetrievalResult {
  const analysis = options?.precomputedAnalysis ?? analyzeQuery(query)
  const expandedTokens = analysis.expandedTokens
  const index = getBM25Index()
  const chunkMap = getChunkMap()

  if (expandedTokens.length === 0) {
    return { chunks: [], totalChunks: 0, queryTokens: [], queryAnalysis: analysis }
  }

  const maxRes = options?.maxResults ?? maxResults
  const profile = options?.professionalProfile ?? 'cgp'

  // Phase 1 : scoring BM25 + multi-critères sur tous les chunks
  let candidates = ALL_CHUNKS
    .filter(chunk => {
      if (options?.categories?.length && !options.categories.includes(chunk.category)) return false
      if (options?.difficulty?.length && !options.difficulty.includes(chunk.difficulty)) return false
      return true
    })
    .map(chunk => {
      const bm25Score = scoreBM25(expandedTokens, chunk.id, index)

      // Comptage des matchs keywords directs
      const chunkKeywordTokens = chunk.keywords.flatMap(k => tokenize(k))
      let keywordMatchCount = 0
      for (const qt of expandedTokens) {
        if (chunkKeywordTokens.some(k => k === qt || k.includes(qt) || qt.includes(k))) {
          keywordMatchCount++
        }
      }

      const multiScore = computeMultiScore({
        bm25Score,
        keywordMatchCount,
        queryIntents: analysis.intents,
        chunkCategories: [chunk.category, chunk.subcategory].filter(Boolean) as string[],
        chunkRelatedIds: chunk.relatedChunkIds,
        professionalProfile: profile,
        chunkProfessionalRelevance: chunk.professionalRelevance,
        chunkDifficulty: chunk.difficulty,
      })

      return {
        ...chunk,
        relevanceScore: multiScore.totalScore,
      }
    })
    .filter(chunk => (chunk.relevanceScore ?? 0) >= (options?.minScore ?? minScore))
    .sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0))
    .slice(0, maxRes)

  // Phase 2 : enrichissement cross-refs (ajouter des chunks liés qui ne sont pas déjà dans les résultats)
  if (options?.includeRelated !== false && candidates.length > 0) {
    const selectedIds = new Set(candidates.map(c => c.id))
    const relatedIds = new Set<string>()

    for (const chunk of candidates.slice(0, 3)) { // Cross-refs des top 3
      for (const relId of chunk.relatedChunkIds) {
        if (!selectedIds.has(relId)) relatedIds.add(relId)
      }
    }

    const relatedChunks: KnowledgeChunkV2[] = []
    for (const relId of relatedIds) {
      const related = chunkMap.get(relId)
      if (related && relatedChunks.length < 2) { // Max 2 cross-refs
        relatedChunks.push({ ...related, relevanceScore: 0.5 }) // Score réduit
      }
    }

    candidates = [...candidates, ...relatedChunks].slice(0, maxRes + 2) as typeof candidates
  }

  return {
    chunks: candidates,
    totalChunks: candidates.length,
    queryTokens: analysis.tokens,
    queryAnalysis: analysis,
  }
}

/**
 * Recherche par catégorie spécifique
 */
export function retrieveByCategory(category: KnowledgeCategory): KnowledgeChunkV2[] {
  return ALL_CHUNKS.filter(c => c.category === category)
}

/**
 * Recherche par article de loi
 */
export function retrieveByLegalReference(article: string): KnowledgeChunkV2[] {
  const normalizedArticle = article.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  return ALL_CHUNKS.filter(c =>
    c.legalReferences.some(ref =>
      ref.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(normalizedArticle)
    )
  )
}

/**
 * Recherche chunks adaptés à un profil professionnel
 */
export function retrieveForProfessional(profile: ProfessionalProfile, maxResults = 10): KnowledgeChunkV2[] {
  return ALL_CHUNKS
    .filter(c => c.professionalRelevance.includes(profile) || c.professionalRelevance.includes('cgp'))
    .slice(0, maxResults)
}

/**
 * Retourne tous les chunks (pour debug/admin)
 */
export function getAllChunks(): KnowledgeChunkV2[] {
  return [...ALL_CHUNKS]
}

/**
 * Nombre total de chunks indexés
 */
export function getKnowledgeStats(): {
  totalChunks: number
  categories: string[]
  sources: string[]
  difficulties: Record<string, number>
  profiles: Record<string, number>
} {
  const categories = [...new Set(ALL_CHUNKS.map(c => c.category))]
  const sources = [...new Set(ALL_CHUNKS.map(c => c.source))]

  const difficulties: Record<string, number> = { basic: 0, intermediate: 0, expert: 0 }
  const profiles: Record<string, number> = {}

  for (const chunk of ALL_CHUNKS) {
    difficulties[chunk.difficulty] = (difficulties[chunk.difficulty] || 0) + 1
    for (const p of chunk.professionalRelevance) {
      profiles[p] = (profiles[p] || 0) + 1
    }
  }

  return { totalChunks: ALL_CHUNKS.length, categories, sources, difficulties, profiles }
}
