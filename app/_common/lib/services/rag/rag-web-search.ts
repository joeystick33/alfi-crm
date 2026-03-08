/**
 * RAG Web Search V2 — Recherche web enrichie pour professionnels du patrimoine
 * 
 * Améliorations V2 :
 *   • Reformulation de requête par intention (query engine intégré)
 *   • 40+ domaines de confiance FR (réglementation, fiscal, assurance, immobilier, marchés)
 *   • Scoring de qualité des résultats (fraîcheur, domaine, pertinence)
 *   • Extraction de snippets améliorée
 *   • Détection plus fine du besoin de recherche web
 * 
 * API Key : TAVILY_API_KEY ou SERPER_API_KEY dans les variables d'environnement.
 */

import { type QueryIntent, type QueryAnalysis, analyzeQuery } from './rag-query-engine'
import { logger } from '@/app/_common/lib/logger'
// ============================================================================
// TYPES
// ============================================================================

export interface WebSearchResult {
  title: string
  url: string
  snippet: string
  source: string
  publishedDate?: string
  relevanceScore?: number
  /** Score de qualité du domaine source (0-1) */
  domainQuality?: number
}

export interface WebSearchResponse {
  results: WebSearchResult[]
  query: string
  reformulatedQuery?: string
  provider: 'tavily' | 'serper' | 'none'
  searchDurationMs: number
}

// ============================================================================
// DOMAINES DE CONFIANCE — 40+ sources FR de référence
// ============================================================================

/** Domaines classés par niveau de confiance et type */
const TRUSTED_DOMAINS: Record<string, { quality: number; type: string }> = {
  // ── Sources officielles (qualité max) ──
  'legifrance.gouv.fr': { quality: 1.0, type: 'legal' },
  'bofip.impots.gouv.fr': { quality: 1.0, type: 'fiscal' },
  'impots.gouv.fr': { quality: 1.0, type: 'fiscal' },
  'service-public.fr': { quality: 0.95, type: 'admin' },
  'economie.gouv.fr': { quality: 0.95, type: 'economy' },
  'assemblee-nationale.fr': { quality: 0.95, type: 'legal' },
  'senat.fr': { quality: 0.95, type: 'legal' },
  'conseil-constitutionnel.fr': { quality: 0.95, type: 'legal' },
  'conseil-etat.fr': { quality: 0.95, type: 'legal' },
  'courdecassation.fr': { quality: 0.95, type: 'legal' },
  // ── Régulateurs et institutions ──
  'amf-france.org': { quality: 0.95, type: 'markets' },
  'acpr.banque-france.fr': { quality: 0.95, type: 'insurance' },
  'banque-france.fr': { quality: 0.95, type: 'economy' },
  'urssaf.fr': { quality: 0.90, type: 'social' },
  'info-retraite.fr': { quality: 0.90, type: 'retirement' },
  'agirc-arrco.fr': { quality: 0.90, type: 'retirement' },
  'lassuranceretraite.fr': { quality: 0.90, type: 'retirement' },
  'securite-sociale.fr': { quality: 0.90, type: 'social' },
  'cnil.fr': { quality: 0.90, type: 'data' },
  'orias.fr': { quality: 0.90, type: 'regulation' },
  'tracfin.gouv.fr': { quality: 0.90, type: 'compliance' },
  // ── Organisations professionnelles ──
  'notaires.fr': { quality: 0.85, type: 'notary' },
  'cnb.avocat.fr': { quality: 0.85, type: 'legal' },
  'experts-comptables.fr': { quality: 0.85, type: 'accounting' },
  'anacofi.asso.fr': { quality: 0.85, type: 'cgp' },
  'cncgp.fr': { quality: 0.85, type: 'cgp' },
  'affo.asso.fr': { quality: 0.80, type: 'real-estate' },
  // ── Éditeurs spécialisés patrimoine ──
  'fidroit.fr': { quality: 0.85, type: 'patrimoine' },
  'althemis.fr': { quality: 0.85, type: 'patrimoine' },
  'harvest.fr': { quality: 0.80, type: 'patrimoine' },
  'grouperevue-fiduciaire.fr': { quality: 0.80, type: 'fiscal' },
  'dalloz.fr': { quality: 0.80, type: 'legal' },
  'editions-legislatives.fr': { quality: 0.80, type: 'legal' },
  'editions-francis-lefebvre.fr': { quality: 0.80, type: 'fiscal' },
  // ── Presse financière de qualité ──
  'patrimoine.lesechos.fr': { quality: 0.75, type: 'press' },
  'lesechos.fr': { quality: 0.70, type: 'press' },
  'capital.fr': { quality: 0.65, type: 'press' },
  'lefigaro.fr': { quality: 0.65, type: 'press' },
  'lemonde.fr': { quality: 0.65, type: 'press' },
  'mieux-vivre-votre-argent.fr': { quality: 0.65, type: 'press' },
  'investir.lesechos.fr': { quality: 0.70, type: 'markets' },
  'boursorama.com': { quality: 0.60, type: 'markets' },
  'village-justice.com': { quality: 0.70, type: 'legal' },
  'vie-publique.fr': { quality: 0.80, type: 'admin' },
  // ── Immobilier ──
  'immobilier.lefigaro.fr': { quality: 0.65, type: 'real-estate' },
  'pap.fr': { quality: 0.60, type: 'real-estate' },
  'seloger.com': { quality: 0.55, type: 'real-estate' },
}

const TRUSTED_DOMAIN_LIST = Object.keys(TRUSTED_DOMAINS)

// ============================================================================
// CONFIGURATION
// ============================================================================

const WEB_SEARCH_CONFIG = {
  tavily: {
    apiUrl: 'https://api.tavily.com/search',
    maxResults: 8,
    timeout: 10_000,
    searchDepth: 'advanced' as const,
    includeDomains: TRUSTED_DOMAIN_LIST,
  },
  serper: {
    apiUrl: 'https://google.serper.dev/search',
    maxResults: 8,
    timeout: 8_000,
  },
}

// ============================================================================
// REFORMULATION DE REQUÊTE PAR INTENTION
// ============================================================================

const INTENT_QUERY_SUFFIXES: Record<QueryIntent, string> = {
  income_tax: 'impôt revenu barème fiscal France 2025',
  wealth_tax: 'IFI impôt fortune immobilière France 2025',
  fiscal_optimization: 'optimisation fiscale réduction impôt France',
  capital_gains: 'plus-value cession fiscalité France',
  retirement_planning: 'retraite pension PER épargne France 2025',
  estate_planning: 'succession droits mutation transmission France',
  donation_strategy: 'donation abattement transmission optimisation',
  real_estate_investment: 'investissement immobilier locatif fiscalité France',
  life_insurance: 'assurance vie fiscalité rachat transmission',
  savings_investment: 'épargne placement enveloppe fiscale France',
  corporate_finance: 'entreprise dirigeant holding cession IS France',
  social_protection: 'prévoyance protection sociale TNS France',
  regulatory_compliance: 'réglementation AMF ACPR DDA MIF2 France',
  client_analysis: 'bilan patrimonial audit conseil patrimoine',
  market_analysis: 'marchés financiers allocation investissement',
  debt_financing: 'crédit emprunt immobilier capacité endettement',
  international_tax: 'fiscalité internationale convention expatrié France',
  general_advice: 'patrimoine conseil gestion financière France',
}

/**
 * Reformule la requête utilisateur en ajoutant un contexte pertinent
 * basé sur l'intention détectée par le query engine
 */
function reformulateQuery(query: string, precomputedAnalysis?: QueryAnalysis): { reformulated: string; intent: QueryIntent } {
  const analysis = precomputedAnalysis ?? analyzeQuery(query)
  const suffix = INTENT_QUERY_SUFFIXES[analysis.primaryIntent] || ''

  // Ne pas ajouter de suffixe si la requête est déjà très spécifique (> 60 chars)
  if (query.length > 60 || !suffix) {
    return { reformulated: query, intent: analysis.primaryIntent }
  }

  return {
    reformulated: `${query.trim()} ${suffix}`,
    intent: analysis.primaryIntent,
  }
}

// ============================================================================
// DÉTECTION DE NÉCESSITÉ DE RECHERCHE WEB (V2 enrichie)
// ============================================================================

/**
 * Détermine si la question nécessite une recherche web (V2 — plus précise)
 */
export function needsWebSearch(query: string): boolean {
  const queryLower = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

  const webIndicators = [
    // Actualités et changements récents
    'actualite', 'nouveau', 'nouvelle', 'recent', 'changement', 'reforme',
    'modification', 'mise a jour', 'derniere', 'cette annee',
    'loi de finances', 'plf', 'plfss', 'lfss', 'loi pacte',
    // Années futures/récentes
    '2025', '2026', '2027',
    // Jurisprudence et doctrine
    'jurisprudence', 'arret', 'decision', 'tribunal', 'conseil etat',
    'cour cassation', 'rescrit', 'doctrine', 'bofip', 'instruction fiscale',
    // Taux et indices variables
    'taux directeur', 'bce', 'inflation', 'livret a taux', 'taux immobilier',
    'rendement fonds euros', 'oat', 'euribor', 'taux usure',
    'rendement scpi', 'rendement moyen',
    // Comparatifs et classements
    'meilleur', 'classement', 'palmares', 'top', 'comparatif', 'benchmark',
    'meilleures scpi', 'meilleur per', 'meilleure assurance vie',
    // Prospectif
    'va changer', 'prevu', 'projet de loi', 'futur', 'prevision',
    'reforme retraite', 'reforme succession',
    // Réglementation en mouvement
    'nouveau reglement', 'directive europeenne', 'transposition',
    'sanctions amf', 'sanctions acpr', 'rapport annuel',
    // Marchés
    'cours', 'cotation', 'indice', 'cac 40', 'performance',
  ]

  return webIndicators.some(ind => queryLower.includes(ind))
}

// ============================================================================
// SCORING DE QUALITÉ DES RÉSULTATS
// ============================================================================

/**
 * Calcule un score de qualité pour un résultat web
 */
function scoreWebResult(result: WebSearchResult): number {
  let score = result.relevanceScore || 0.5

  // Bonus domaine de confiance
  const domainInfo = TRUSTED_DOMAINS[result.source]
  if (domainInfo) {
    score += domainInfo.quality * 0.3
    result.domainQuality = domainInfo.quality
  } else {
    // Pénalité pour domaines non reconnus
    score *= 0.6
    result.domainQuality = 0.3
  }

  // Bonus fraîcheur (si date disponible)
  if (result.publishedDate) {
    try {
      const pubDate = new Date(result.publishedDate)
      const ageMonths = (Date.now() - pubDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
      if (ageMonths < 3) score += 0.2      // < 3 mois
      else if (ageMonths < 6) score += 0.1  // < 6 mois
      else if (ageMonths > 24) score -= 0.1 // > 2 ans
    } catch { /* ignore invalid dates */ }
  }

  // Bonus snippet riche (contient des chiffres, articles, montants)
  const snippetLower = result.snippet.toLowerCase()
  if (/art\.\s*\d+|article\s*\d+/i.test(snippetLower)) score += 0.1
  if (/\d+\s*[€%]/.test(snippetLower)) score += 0.05
  if (snippetLower.length > 200) score += 0.05

  return Math.min(score, 1.5) // Plafonner à 1.5
}

// ============================================================================
// RECHERCHE TAVILY
// ============================================================================

async function searchTavily(query: string): Promise<WebSearchResult[]> {
  const apiKey = process.env.TAVILY_API_KEY
  if (!apiKey) return []

  try {
    const res = await fetch(WEB_SEARCH_CONFIG.tavily.apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: WEB_SEARCH_CONFIG.tavily.searchDepth,
        max_results: WEB_SEARCH_CONFIG.tavily.maxResults,
        include_domains: WEB_SEARCH_CONFIG.tavily.includeDomains,
        include_answer: false,
        include_raw_content: false,
      }),
      signal: AbortSignal.timeout(WEB_SEARCH_CONFIG.tavily.timeout),
    })

    if (!res.ok) {
      logger.warn(`[RAG Web] Tavily error: ${res.status}`)
      return []
    }

    const data = await res.json()
    return (data.results || []).map((r: Record<string, unknown>) => ({
      title: String(r.title || ''),
      url: String(r.url || ''),
      snippet: String(r.content || '').slice(0, 600),
      source: extractDomain(String(r.url || '')),
      publishedDate: r.published_date ? String(r.published_date) : undefined,
      relevanceScore: Number(r.score || 0.5),
    }))
  } catch (e) {
    logger.warn('[RAG Web] Tavily search failed: ' + (e instanceof Error ? e.message : 'unknown'))
    return []
  }
}

// ============================================================================
// RECHERCHE SERPER (fallback)
// ============================================================================

async function searchSerper(query: string): Promise<WebSearchResult[]> {
  const apiKey = process.env.SERPER_API_KEY
  if (!apiKey) return []

  try {
    const res = await fetch(WEB_SEARCH_CONFIG.serper.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey,
      },
      body: JSON.stringify({
        q: query,
        gl: 'fr',
        hl: 'fr',
        num: WEB_SEARCH_CONFIG.serper.maxResults,
      }),
      signal: AbortSignal.timeout(WEB_SEARCH_CONFIG.serper.timeout),
    })

    if (!res.ok) {
      logger.warn(`[RAG Web] Serper error: ${res.status}`)
      return []
    }

    const data = await res.json()
    return (data.organic || []).map((r: Record<string, unknown>) => ({
      title: String(r.title || ''),
      url: String(r.link || ''),
      snippet: String(r.snippet || '').slice(0, 600),
      source: extractDomain(String(r.link || '')),
      publishedDate: r.date ? String(r.date) : undefined,
      relevanceScore: 0.5,
    }))
  } catch (e) {
    logger.warn('[RAG Web] Serper search failed: ' + (e instanceof Error ? e.message : 'unknown'))
    return []
  }
}

// ============================================================================
// UTILITAIRES
// ============================================================================

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '')
  } catch {
    return 'unknown'
  }
}

// ============================================================================
// API PUBLIQUE
// ============================================================================

/**
 * Recherche web V2 avec reformulation + scoring + fallback Tavily → Serper
 */
export async function webSearch(query: string, precomputedAnalysis?: QueryAnalysis): Promise<WebSearchResponse> {
  const startTime = Date.now()
  const { reformulated } = reformulateQuery(query, precomputedAnalysis)

  // Essayer Tavily d'abord
  if (process.env.TAVILY_API_KEY) {
    const results = await searchTavily(reformulated)
    if (results.length > 0) {
      // Scorer et trier par qualité
      const scored = results
        .map(r => ({ ...r, relevanceScore: scoreWebResult(r) }))
        .sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0))
        .slice(0, 5) // Garder top 5 après scoring

      return {
        results: scored,
        query,
        reformulatedQuery: reformulated !== query ? reformulated : undefined,
        provider: 'tavily',
        searchDurationMs: Date.now() - startTime,
      }
    }
  }

  // Fallback Serper
  if (process.env.SERPER_API_KEY) {
    const results = await searchSerper(reformulated)
    if (results.length > 0) {
      const scored = results
        .map(r => ({ ...r, relevanceScore: scoreWebResult(r) }))
        .sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0))
        .slice(0, 5)

      return {
        results: scored,
        query,
        reformulatedQuery: reformulated !== query ? reformulated : undefined,
        provider: 'serper',
        searchDurationMs: Date.now() - startTime,
      }
    }
  }

  return {
    results: [],
    query,
    provider: 'none',
    searchDurationMs: Date.now() - startTime,
  }
}

/**
 * Vérifie si au moins un provider de recherche web est configuré
 */
export function isWebSearchAvailable(): boolean {
  return !!(process.env.TAVILY_API_KEY || process.env.SERPER_API_KEY)
}
