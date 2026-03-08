/**
 * AURA Brain — Service d'acquisition active de connaissances
 * 
 * Le cerveau d'AURA construit et enrichit sa base de connaissances en :
 *   1. Scraping intelligent de sources CGP de confiance
 *   2. Veille réglementaire automatique (Legifrance, BOFIP, AMF)
 *   3. Indexation et scoring des connaissances acquises
 *   4. Mise à jour proactive des données fiscales/juridiques
 *   5. Détection de changements réglementaires
 * 
 * Architecture :
 *   • KnowledgeStore — Stockage en mémoire des connaissances acquises (LRU, TTL)
 *   • DomainCrawler — Scraping ciblé de sources de confiance
 *   • RegWatcher — Veille réglementaire (RSS, API Legifrance)
 *   • BrainOrchestrator — Coordonne l'acquisition et l'enrichissement
 */

import { logger } from '@/app/_common/lib/logger'

// ============================================================================
// TYPES
// ============================================================================

export interface BrainKnowledge {
  id: string
  title: string
  content: string
  summary: string
  source: BrainSource
  domain: KnowledgeDomain
  tags: string[]
  confidence: number
  createdAt: Date
  expiresAt: Date
  legalRefs?: string[]
  url?: string
}

export type KnowledgeDomain =
  | 'fiscalite_ir'
  | 'fiscalite_ifi'
  | 'assurance_vie'
  | 'per_retraite'
  | 'immobilier'
  | 'transmission'
  | 'droit_famille'
  | 'protection_sociale'
  | 'marches_financiers'
  | 'reglementation'
  | 'epargne'
  | 'emprunt'
  | 'general'

export interface BrainSource {
  name: string
  url: string
  type: 'official' | 'professional' | 'press' | 'academic' | 'rss'
  quality: number
  lastCrawled?: Date
}

export interface BrainStats {
  totalKnowledge: number
  byDomain: Record<KnowledgeDomain, number>
  lastUpdate: Date | null
  sourcesActive: number
  cacheHitRate: string
}

export interface BrainQuery {
  query: string
  domains?: KnowledgeDomain[]
  minConfidence?: number
  maxResults?: number
  includeExpired?: boolean
}

export interface BrainSearchResult {
  knowledge: BrainKnowledge[]
  totalFound: number
  searchDurationMs: number
}

// ============================================================================
// SOURCES DE CONNAISSANCES CGP
// ============================================================================

const CGP_SOURCES: BrainSource[] = [
  // ── Sources officielles ──
  { name: 'Legifrance', url: 'https://www.legifrance.gouv.fr', type: 'official', quality: 1.0 },
  { name: 'BOFIP', url: 'https://bofip.impots.gouv.fr', type: 'official', quality: 1.0 },
  { name: 'Service Public', url: 'https://www.service-public.fr', type: 'official', quality: 0.95 },
  { name: 'AMF', url: 'https://www.amf-france.org', type: 'official', quality: 0.95 },
  { name: 'ACPR', url: 'https://acpr.banque-france.fr', type: 'official', quality: 0.95 },
  { name: 'Info Retraite', url: 'https://www.info-retraite.fr', type: 'official', quality: 0.90 },
  // ── Organisations professionnelles ──
  { name: 'CNCGP', url: 'https://www.cncgp.fr', type: 'professional', quality: 0.85 },
  { name: 'ANACOFI', url: 'https://www.anacofi.asso.fr', type: 'professional', quality: 0.85 },
  { name: 'Notaires de France', url: 'https://www.notaires.fr', type: 'professional', quality: 0.85 },
  // ── Éditeurs spécialisés patrimoine ──
  { name: 'Fidroit', url: 'https://www.fidroit.fr', type: 'professional', quality: 0.85 },
  { name: 'Althémis', url: 'https://www.althemis.fr', type: 'professional', quality: 0.85 },
  { name: 'Dalloz', url: 'https://www.dalloz.fr', type: 'academic', quality: 0.80 },
  // ── Presse financière ──
  { name: 'Les Echos Patrimoine', url: 'https://patrimoine.lesechos.fr', type: 'press', quality: 0.75 },
  { name: 'Le Revenu', url: 'https://www.lerevenu.com', type: 'press', quality: 0.70 },
  // ── Flux RSS veille ──
  { name: 'Legifrance RSS', url: 'https://www.legifrance.gouv.fr/flux/rss', type: 'rss', quality: 0.95 },
  { name: 'BOFIP RSS', url: 'https://bofip.impots.gouv.fr/bofip/rss', type: 'rss', quality: 0.95 },
]

// ── Domaines de recherche par thème ──
const DOMAIN_KEYWORDS: Record<KnowledgeDomain, string[]> = {
  fiscalite_ir: ['impôt revenu', 'barème progressif', 'TMI', 'décote', 'abattement salaires', 'PFU', 'prélèvement forfaitaire', 'CGI art 197', 'quotient familial', 'réductions impôt', 'crédits impôt'],
  fiscalite_ifi: ['IFI', 'impôt fortune immobilière', 'patrimoine immobilier', 'CGI art 977', 'plafonnement IFI', 'exonération IFI', 'biens professionnels'],
  assurance_vie: ['assurance vie', 'clause bénéficiaire', 'rachat', 'art 990 I', 'art 757 B', 'fonds euros', 'unités de compte', 'abattement 152500', 'prélèvements sociaux AV'],
  per_retraite: ['PER', 'plan épargne retraite', 'retraite', 'pension', 'trimestres', 'PERP', 'Madelin', 'art 83', 'plafond déductibilité', 'sortie capital rente'],
  immobilier: ['investissement locatif', 'LMNP', 'LMP', 'déficit foncier', 'Pinel', 'SCPI', 'SCI', 'démembrement', 'usufruit', 'nue-propriété', 'HCSF', 'PTZ'],
  transmission: ['succession', 'donation', 'DMTG', 'abattement donation', 'barème succession', 'pacte Dutreil', 'assurance vie successorale', 'testament', 'quotité disponible'],
  droit_famille: ['régime matrimonial', 'communauté', 'séparation de biens', 'PACS', 'prestation compensatoire', 'pension alimentaire', 'indivision', 'partage'],
  protection_sociale: ['TNS', 'prévoyance', 'Madelin', 'incapacité', 'invalidité', 'décès', 'mutuelle', 'garanties', 'indemnités journalières'],
  marches_financiers: ['marchés', 'actions', 'obligations', 'CAC 40', 'allocation actifs', 'diversification', 'rendement', 'volatilité', 'ETF', 'gestion pilotée'],
  reglementation: ['DDA', 'MIF2', 'RGPD', 'LCB-FT', 'KYC', 'devoir de conseil', 'ORIAS', 'AMF', 'ACPR', 'sanctions', 'conformité'],
  epargne: ['livret A', 'LDDS', 'LEP', 'PEA', 'CTO', 'assurance vie euros', 'capitalisation', 'plafond versement'],
  emprunt: ['crédit immobilier', 'taux emprunt', 'capacité emprunt', 'HCSF', 'assurance emprunteur', 'taux usure', 'mensualité', 'durée crédit'],
  general: ['patrimoine', 'gestion', 'conseil', 'stratégie', 'optimisation', 'bilan patrimonial'],
}

// ============================================================================
// KNOWLEDGE STORE — Stockage en mémoire LRU avec TTL
// ============================================================================

class KnowledgeStore {
  private store = new Map<string, BrainKnowledge>()
  private maxSize: number
  private hits = 0
  private misses = 0

  constructor(maxSize = 500) {
    this.maxSize = maxSize
  }

  add(knowledge: BrainKnowledge): void {
    if (this.store.size >= this.maxSize) {
      const firstKey = this.store.keys().next().value
      if (firstKey) this.store.delete(firstKey)
    }
    this.store.set(knowledge.id, knowledge)
  }

  get(id: string): BrainKnowledge | null {
    const k = this.store.get(id)
    if (!k) { this.misses++; return null }
    if (!k.expiresAt || new Date() > k.expiresAt) {
      this.store.delete(id)
      this.misses++
      return null
    }
    this.hits++
    // LRU: re-insert
    this.store.delete(id)
    this.store.set(id, k)
    return k
  }

  search(query: BrainQuery): BrainSearchResult {
    const start = Date.now()
    const queryLower = query.query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    const queryTerms = queryLower.split(/\s+/).filter(t => t.length > 2)
    const minConfidence = query.minConfidence ?? 0.5
    const maxResults = query.maxResults ?? 10
    const now = new Date()

    const scored: Array<{ knowledge: BrainKnowledge; score: number }> = []

    for (const [, k] of this.store) {
      // Filter expired
      if (!query.includeExpired && k.expiresAt && now > k.expiresAt) continue
      // Filter confidence
      if (k.confidence < minConfidence) continue
      // Filter domain
      if (query.domains && query.domains.length > 0 && !query.domains.includes(k.domain)) continue

      // Score: keyword match + confidence + source quality
      const textLower = `${k.title} ${k.summary} ${k.tags.join(' ')}`.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      let matchScore = 0
      for (const term of queryTerms) {
        if (textLower.includes(term)) matchScore += 1
      }
      if (matchScore === 0) continue

      const normalizedMatch = Math.min(matchScore / queryTerms.length, 1)
      const score = normalizedMatch * 0.5 + k.confidence * 0.3 + k.source.quality * 0.2

      scored.push({ knowledge: k, score })
    }

    scored.sort((a, b) => b.score - a.score)
    const results = scored.slice(0, maxResults).map(s => s.knowledge)

    return {
      knowledge: results,
      totalFound: scored.length,
      searchDurationMs: Date.now() - start,
    }
  }

  getStats(): BrainStats {
    const byDomain: Record<string, number> = {}
    let lastUpdate: Date | null = null
    const sources = new Set<string>()

    for (const [, k] of this.store) {
      byDomain[k.domain] = (byDomain[k.domain] || 0) + 1
      sources.add(k.source.name)
      if (!lastUpdate || k.createdAt > lastUpdate) lastUpdate = k.createdAt
    }

    const total = this.hits + this.misses
    return {
      totalKnowledge: this.store.size,
      byDomain: byDomain as Record<KnowledgeDomain, number>,
      lastUpdate,
      sourcesActive: sources.size,
      cacheHitRate: total > 0 ? `${Math.round((this.hits / total) * 100)}%` : 'N/A',
    }
  }

  clear(): void {
    this.store.clear()
    this.hits = 0
    this.misses = 0
  }
}

// ============================================================================
// DOMAIN CRAWLER — Scraping ciblé via Tavily/Serper
// ============================================================================

async function crawlDomainKnowledge(
  domain: KnowledgeDomain,
  options?: { maxResults?: number }
): Promise<BrainKnowledge[]> {
  const keywords = DOMAIN_KEYWORDS[domain]
  if (!keywords || keywords.length === 0) return []

  const maxResults = options?.maxResults ?? 5
  const query = keywords.slice(0, 4).join(' ') + ' France 2025'

  try {
    // Use Tavily for deep search
    const tavilyKey = process.env.TAVILY_API_KEY
    if (!tavilyKey) {
      logger.warn('[AuraBrain] TAVILY_API_KEY not set, skipping domain crawl', { module: 'aura-brain' })
      return []
    }

    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: tavilyKey,
        query,
        search_depth: 'advanced',
        max_results: maxResults,
        include_domains: CGP_SOURCES.filter(s => s.type === 'official' || s.type === 'professional').map(s => new URL(s.url).hostname),
        include_answer: true,
      }),
      signal: AbortSignal.timeout(15_000),
    })

    if (!response.ok) {
      logger.warn(`[AuraBrain] Tavily search failed: ${response.status}`, { module: 'aura-brain' })
      return []
    }

    const data = await response.json()
    const results: BrainKnowledge[] = []
    const now = new Date()
    const ttl = 24 * 60 * 60 * 1000 // 24h default TTL

    // Process Tavily's synthesized answer
    if (data.answer) {
      results.push({
        id: `brain_${domain}_synthesis_${Date.now()}`,
        title: `Synthèse ${domain.replace(/_/g, ' ')} — ${now.toLocaleDateString('fr-FR')}`,
        content: data.answer,
        summary: data.answer.slice(0, 200),
        source: { name: 'Tavily Synthesis', url: 'https://tavily.com', type: 'academic', quality: 0.8 },
        domain,
        tags: keywords.slice(0, 5),
        confidence: 0.8,
        createdAt: now,
        expiresAt: new Date(now.getTime() + ttl),
      })
    }

    // Process individual results
    if (data.results && Array.isArray(data.results)) {
      for (const r of data.results.slice(0, maxResults)) {
        const hostname = new URL(r.url).hostname.replace('www.', '')
        const source = CGP_SOURCES.find(s => r.url.includes(new URL(s.url).hostname)) || {
          name: hostname,
          url: r.url,
          type: 'press' as const,
          quality: 0.6,
        }

        results.push({
          id: `brain_${domain}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          title: r.title || 'Sans titre',
          content: r.content || r.raw_content || r.title || '',
          summary: (r.content || r.title || '').slice(0, 200),
          source,
          domain,
          tags: keywords.slice(0, 3),
          confidence: source.quality * 0.9,
          createdAt: now,
          expiresAt: new Date(now.getTime() + ttl),
          url: r.url,
        })
      }
    }

    return results
  } catch (error) {
    logger.warn(`[AuraBrain] Domain crawl failed for ${domain}: ${error instanceof Error ? error.message : 'unknown'}`)
    return []
  }
}

// ============================================================================
// BRAIN ORCHESTRATOR — Singleton
// ============================================================================

class AuraBrainOrchestrator {
  private store: KnowledgeStore
  private isAcquiring = false
  private lastAcquisition: Date | null = null

  constructor() {
    this.store = new KnowledgeStore(500)
  }

  /**
   * Recherche dans le cerveau AURA
   */
  search(query: string, domains?: KnowledgeDomain[], maxResults = 5): BrainSearchResult {
    return this.store.search({
      query,
      domains,
      maxResults,
      minConfidence: 0.4,
    })
  }

  /**
   * Acquisition de connaissances pour un domaine spécifique
   */
  async acquireKnowledge(domain: KnowledgeDomain, maxResults = 5): Promise<number> {
    try {
      const knowledge = await crawlDomainKnowledge(domain, { maxResults })
      for (const k of knowledge) {
        this.store.add(k)
      }
      logger.info(`[AuraBrain] Acquired ${knowledge.length} knowledge items for ${domain}`, { module: 'aura-brain' })
      return knowledge.length
    } catch (error) {
      logger.warn(`[AuraBrain] Acquisition failed for ${domain}: ${error instanceof Error ? error.message : 'unknown'}`)
      return 0
    }
  }

  /**
   * Acquisition complète — enrichit tous les domaines prioritaires
   * Appelé automatiquement ou via l'API de maintenance
   */
  async acquireAll(
    priorityDomains?: KnowledgeDomain[]
  ): Promise<{ total: number; byDomain: Record<string, number> }> {
    if (this.isAcquiring) {
      return { total: 0, byDomain: {} }
    }

    this.isAcquiring = true
    const results: Record<string, number> = {}
    let total = 0

    const domains = priorityDomains || [
      'fiscalite_ir',
      'assurance_vie',
      'per_retraite',
      'immobilier',
      'transmission',
      'reglementation',
    ]

    try {
      for (const domain of domains) {
        const count = await this.acquireKnowledge(domain, 3)
        results[domain] = count
        total += count
        // Small delay between domains to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500))
      }
      this.lastAcquisition = new Date()
      logger.info(`[AuraBrain] Full acquisition complete: ${total} items across ${domains.length} domains`, { module: 'aura-brain' })
    } finally {
      this.isAcquiring = false
    }

    return { total, byDomain: results }
  }

  /**
   * Enrichit le contexte RAG avec les connaissances du cerveau
   */
  enrichRAGContext(query: string, existingContext?: string): string {
    const result = this.search(query, undefined, 3)
    if (result.knowledge.length === 0) return existingContext || ''

    const brainContext = result.knowledge.map((k, i) => {
      const parts = [
        `[Cerveau AURA ${i + 1}: ${k.title}]`,
        `Source : ${k.source.name} (fiabilité: ${Math.round(k.confidence * 100)}%)`,
      ]
      if (k.legalRefs && k.legalRefs.length > 0) {
        parts.push(`Réf. juridiques : ${k.legalRefs.join(', ')}`)
      }
      if (k.url) {
        parts.push(`URL : ${k.url}`)
      }
      parts.push(k.content.slice(0, 800))
      return parts.join('\n')
    }).join('\n\n──────────────────────────────────────────\n\n')

    const brainSection = `
═══ CERVEAU AURA (connaissances acquises — ${result.knowledge.length} sources) ═══
${brainContext}
═══ FIN CERVEAU AURA ═══`

    return existingContext ? `${existingContext}\n\n${brainSection}` : brainSection
  }

  /**
   * Statistiques du cerveau
   */
  getStats(): BrainStats & { lastAcquisition: Date | null; isAcquiring: boolean } {
    return {
      ...this.store.getStats(),
      lastAcquisition: this.lastAcquisition,
      isAcquiring: this.isAcquiring,
    }
  }

  /**
   * Injecte des connaissances manuellement (depuis les fichiers locaux, CSV, etc.)
   */
  injectKnowledge(knowledge: BrainKnowledge): void {
    this.store.add(knowledge)
  }

  /**
   * Réinitialise le cerveau
   */
  reset(): void {
    this.store.clear()
    this.lastAcquisition = null
    logger.info('[AuraBrain] Brain reset', { module: 'aura-brain' })
  }
}

// ── Singleton export ──
export const auraBrain = new AuraBrainOrchestrator()

// ── Helper: détecte les domaines pertinents pour une requête ──
export function detectRelevantDomains(query: string): KnowledgeDomain[] {
  const queryLower = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const domains: KnowledgeDomain[] = []

  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
    const normalizedKeywords = keywords.map(k => k.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
    if (normalizedKeywords.some(kw => queryLower.includes(kw))) {
      domains.push(domain as KnowledgeDomain)
    }
  }

  return domains.length > 0 ? domains : ['general']
}
