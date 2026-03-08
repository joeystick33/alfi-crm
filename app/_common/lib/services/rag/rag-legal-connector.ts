/**
 * RAG Legal Connector — Connexions directes aux sources juridiques et fiscales FR
 * 
 * Sources VÉRIFIÉES et fonctionnelles (testées février 2026) :
 *   1. Legifrance PISTE API — Articles de code (quand OAuth2 configuré)
 *   2. Recherche ciblée par domaine — via Tavily/Serper avec site: queries
 *      (legifrance.gouv.fr, bofip.impots.gouv.fr, service-public.fr, etc.)
 *   3. Service-Public.fr — Scraping direct (200 ✅)
 *   4. impots.gouv.fr — Scraping direct (200 ✅)
 *   5. CNIL RSS — Seul flux RSS vérifié fonctionnel (200 ✅)
 * 
 * ⚠️ Sources supprimées (404 en février 2026) :
 *   - JORF RSS, Legifrance RSS, AMF RSS, Sénat RSS, Vie-publique RSS
 *   - BOFIP moteur de recherche interne
 * 
 * Stratégie de fallback : Tavily/Serper avec `include_domains` ou `site:`
 * pour cibler spécifiquement les domaines officiels.
 * 
 * Variables d'environnement :
 *   - LEGIFRANCE_CLIENT_ID + LEGIFRANCE_CLIENT_SECRET (PISTE OAuth2, optionnel)
 *   - TAVILY_API_KEY ou SERPER_API_KEY (au moins un recommandé)
 */

import { logger } from '../../logger'

// ============================================================================
// TYPES
// ============================================================================

export interface LegalDocument {
  id: string
  title: string
  content: string
  /** Type de document juridique */
  type: LegalDocumentType
  /** Source d'origine */
  source: LegalSourceId
  /** URL vers le document original */
  url: string
  /** Date de publication ou dernière modification */
  date?: string
  /** Référence légale (ex: "CGI art. 150-0 B ter") */
  legalReference?: string
  /** Score de pertinence (0-1) */
  relevanceScore: number
  /** Métadonnées additionnelles */
  metadata?: Record<string, string>
}

export type LegalDocumentType =
  | 'code_article'      // Article de code (CGI, Code civil, CMF...)
  | 'jurisprudence'     // Décision de justice
  | 'doctrine'          // BOFIP, instruction fiscale
  | 'jorf'              // Journal Officiel
  | 'fiche_pratique'    // Service-public.fr, impots.gouv
  | 'reglement'         // Règlement AMF, ACPR
  | 'actualite'         // Actualité juridique/fiscale
  | 'rapport'           // Rapport annuel, étude
  | 'rss_entry'         // Entrée RSS

export type LegalSourceId =
  | 'legifrance'
  | 'bofip'
  | 'impots_gouv'
  | 'service_public'
  | 'amf'
  | 'acpr'
  | 'cour_cassation'
  | 'conseil_etat'
  | 'jorf'
  | 'data_gouv'
  | 'senat'
  | 'assemblee_nationale'
  | 'vie_publique'
  | 'cnil'
  | 'urssaf'
  | 'notaires_fr'
  | 'dalloz'
  | 'efl'

export interface LegalSearchOptions {
  /** Types de documents à chercher */
  types?: LegalDocumentType[]
  /** Sources à interroger */
  sources?: LegalSourceId[]
  /** Nombre max de résultats (défaut: 5) */
  maxResults?: number
  /** Date de début (YYYY-MM-DD) */
  dateFrom?: string
  /** Date de fin (YYYY-MM-DD) */
  dateTo?: string
  /** Codes spécifiques à chercher (CGI, CC, CMF...) */
  codeFilter?: string[]
}

export interface LegalSearchResponse {
  documents: LegalDocument[]
  query: string
  sourcesQueried: LegalSourceId[]
  totalDurationMs: number
  errors: { source: LegalSourceId; error: string }[]
}

// ============================================================================
// LEGIFRANCE PISTE API — OAuth2 + Recherche
// ============================================================================

/**
 * API Legifrance via la plateforme PISTE (piste.gouv.fr)
 * 
 * Inscription : https://piste.gouv.fr/
 * Documentation : https://developer.aife.economie.gouv.fr/
 * 
 * Endpoints utilisés :
 *   - /consult/code/article     — Consulter un article de code
 *   - /search                   — Recherche textuelle
 *   - /consult/jorf/textuel     — JORF
 *   - /consult/cass             — Jurisprudence Cour de cassation
 *   - /consult/cetat            — Jurisprudence Conseil d'État
 */

const LEGIFRANCE_CONFIG = {
  tokenUrl: 'https://oauth.piste.gouv.fr/api/oauth/token',
  apiBase: 'https://api.piste.gouv.fr/dila/legifrance/lf-engine-app',
  timeout: 15_000,
  /** Mapping des codes principaux utilisés en gestion de patrimoine */
  codes: {
    CGI: 'LEGITEXT000006069577',        // Code Général des Impôts
    CC: 'LEGITEXT000006070721',          // Code Civil
    CMF: 'LEGITEXT000006072026',         // Code Monétaire et Financier
    CSS: 'LEGITEXT000006073189',         // Code de la Sécurité Sociale
    CCOM: 'LEGITEXT000005634379',        // Code de Commerce
    CCH: 'LEGITEXT000006074096',         // Code de la Construction et de l'Habitation
    CPI: 'LEGITEXT000006069414',         // Code de la Propriété Intellectuelle
    LPF: 'LEGITEXT000006069583',         // Livre des Procédures Fiscales
  } as Record<string, string>,
}

/** Cache du token OAuth2 Legifrance */
let _legifranceToken: { token: string; expiresAt: number } | null = null

/**
 * Obtient un token OAuth2 PISTE pour l'API Legifrance
 */
async function getLegifranceToken(): Promise<string | null> {
  const clientId = process.env.LEGIFRANCE_CLIENT_ID
  const clientSecret = process.env.LEGIFRANCE_CLIENT_SECRET
  if (!clientId || !clientSecret) return null

  // Utiliser le cache si encore valide (marge 60s)
  if (_legifranceToken && _legifranceToken.expiresAt > Date.now() + 60_000) {
    return _legifranceToken.token
  }

  try {
    const res = await fetch(LEGIFRANCE_CONFIG.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'openid',
      }),
      signal: AbortSignal.timeout(10_000),
    })

    if (!res.ok) {
      logger.error(`[Legal] Legifrance OAuth error: ${res.status}`)
      return null
    }

    const data = await res.json()
    _legifranceToken = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
    }
    return _legifranceToken.token
  } catch (e) {
    logger.error('[Legal] Legifrance OAuth failed: ' + (e instanceof Error ? e.message : 'unknown'))
    return null
  }
}

/**
 * Recherche textuelle dans Legifrance
 */
async function searchLegifrance(
  query: string,
  options: LegalSearchOptions = {},
): Promise<LegalDocument[]> {
  const token = await getLegifranceToken()
  if (!token) return []

  const maxResults = options.maxResults || 5

  try {
    // Recherche dans les codes
    const searchPayload = {
      recherche: {
        champs: [
          {
            typeChamp: 'ALL',
            criteres: [
              { typeRecherche: 'EXACTE', valeur: query, operateur: 'ET' },
            ],
          },
        ],
        filtres: [
          { facette: 'NOM_CODE', valeurs: options.codeFilter || [] },
        ],
        pageNumber: 1,
        pageSize: maxResults,
        sort: 'PERTINENCE',
        typePagination: 'ARTICLE',
      },
    }

    const res = await fetch(`${LEGIFRANCE_CONFIG.apiBase}/search`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(searchPayload),
      signal: AbortSignal.timeout(LEGIFRANCE_CONFIG.timeout),
    })

    if (!res.ok) {
      logger.warn(`[Legal] Legifrance search error: ${res.status}`)
      return []
    }

    const data = await res.json()
    const results: LegalDocument[] = []

    for (const item of (data.results || [])) {
      const titles = item.titles || []
      const title = titles.length > 0 ? titles[titles.length - 1]?.title || '' : ''

      results.push({
        id: `legifrance-${item.id || results.length}`,
        title: title || item.title || 'Article Legifrance',
        content: cleanHtml(item.text || item.texte || ''),
        type: 'code_article',
        source: 'legifrance',
        url: `https://www.legifrance.gouv.fr/codes/article_lc/${item.id || ''}`,
        date: item.dateDebut || item.lastModificationDate,
        legalReference: extractLegalRef(title),
        relevanceScore: 0.95,
        metadata: {
          codeId: item.cid || '',
          etat: item.etat || '',
        },
      })
    }

    return results
  } catch (e) {
    logger.warn('[Legal] Legifrance search failed: ' + (e instanceof Error ? e.message : 'unknown'))
    return []
  }
}

/**
 * Consulte un article de code spécifique sur Legifrance
 */
async function fetchLegifranceArticle(
  codeId: string,
  articleNumber: string,
): Promise<LegalDocument | null> {
  const token = await getLegifranceToken()
  if (!token) return null

  const codeTextId = LEGIFRANCE_CONFIG.codes[codeId.toUpperCase()]
  if (!codeTextId) return null

  try {
    const res = await fetch(`${LEGIFRANCE_CONFIG.apiBase}/consult/code/article`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        textId: codeTextId,
        article: articleNumber,
      }),
      signal: AbortSignal.timeout(LEGIFRANCE_CONFIG.timeout),
    })

    if (!res.ok) return null

    const data = await res.json()
    return {
      id: `legifrance-art-${codeId}-${articleNumber}`,
      title: `${codeId} art. ${articleNumber}`,
      content: cleanHtml(data.texte || data.text || ''),
      type: 'code_article',
      source: 'legifrance',
      url: `https://www.legifrance.gouv.fr/codes/article_lc/${data.id || ''}`,
      date: data.dateDebut,
      legalReference: `${codeId} art. ${articleNumber}`,
      relevanceScore: 1.0,
    }
  } catch {
    return null
  }
}

// ============================================================================
// RECHERCHE CIBLÉE PAR DOMAINE — via Tavily / Serper
// ============================================================================

/**
 * Domaines juridiques officiels pour la recherche ciblée.
 * Quand le moteur de recherche propre d'un site ne fonctionne pas (ex: BOFIP),
 * on utilise Tavily/Serper avec `include_domains` pour cibler ces domaines.
 */
const LEGAL_DOMAINS = {
  /** Domaines officiels — priorité maximale */
  official: [
    'legifrance.gouv.fr',
    'bofip.impots.gouv.fr',
    'impots.gouv.fr',
    'service-public.fr',
    'economie.gouv.fr',
  ],
  /** Régulateurs et institutions */
  regulators: [
    'amf-france.org',
    'acpr.banque-france.fr',
    'banque-france.fr',
    'cnil.fr',
  ],
  /** Juridictions */
  courts: [
    'courdecassation.fr',
    'conseil-etat.fr',
    'conseil-constitutionnel.fr',
  ],
  /** Organisations professionnelles */
  professional: [
    'notaires.fr',
    'experts-comptables.fr',
  ],
}

/** Tous les domaines juridiques de confiance pour Tavily include_domains */
const ALL_LEGAL_DOMAINS = [
  ...LEGAL_DOMAINS.official,
  ...LEGAL_DOMAINS.regulators,
  ...LEGAL_DOMAINS.courts,
  ...LEGAL_DOMAINS.professional,
]

/**
 * Recherche ciblée sur les domaines juridiques officiels via Tavily
 */
async function searchLegalDomainsTavily(
  query: string,
  maxResults: number = 5,
  domains?: string[],
): Promise<LegalDocument[]> {
  const apiKey = process.env.TAVILY_API_KEY
  if (!apiKey) return []

  const targetDomains = domains || ALL_LEGAL_DOMAINS

  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        query: `${query} France droit fiscal`,
        search_depth: 'advanced',
        max_results: maxResults + 2, // Marge pour le scoring
        include_domains: targetDomains,
        include_answer: false,
        include_raw_content: false,
      }),
      signal: AbortSignal.timeout(12_000),
    })

    if (!res.ok) {
      logger.warn(`[Legal] Tavily domain search error: ${res.status}`)
      return []
    }

    const data = await res.json()
    return (data.results || []).slice(0, maxResults).map((r: Record<string, unknown>, i: number) => {
      const url = String(r.url || '')
      const domain = extractDomain(url)
      const sourceId = mapDomainToSourceId(domain)
      const docType = mapDomainToDocType(domain)

      return {
        id: `tavily-legal-${i}`,
        title: String(r.title || ''),
        content: String(r.content || '').slice(0, 1500),
        type: docType,
        source: sourceId,
        url,
        date: r.published_date ? String(r.published_date) : undefined,
        legalReference: extractLegalRefFromText(String(r.title || '') + ' ' + String(r.content || '')),
        relevanceScore: Number(r.score || 0.7),
      }
    })
  } catch (e) {
    logger.warn('[Legal] Tavily domain search failed: ' + (e instanceof Error ? e.message : 'unknown'))
    return []
  }
}

/**
 * Recherche ciblée sur les domaines juridiques officiels via Serper (Google)
 */
async function searchLegalDomainsSerper(
  query: string,
  maxResults: number = 5,
  domains?: string[],
): Promise<LegalDocument[]> {
  const apiKey = process.env.SERPER_API_KEY
  if (!apiKey) return []

  // Construire la query avec site: pour cibler les domaines
  const targetDomains = (domains || ALL_LEGAL_DOMAINS).slice(0, 5) // Google limite le nombre de site:
  const siteQuery = targetDomains.map(d => `site:${d}`).join(' OR ')
  const fullQuery = `${query} (${siteQuery})`

  try {
    const res = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey,
      },
      body: JSON.stringify({
        q: fullQuery,
        gl: 'fr',
        hl: 'fr',
        num: maxResults + 2,
      }),
      signal: AbortSignal.timeout(10_000),
    })

    if (!res.ok) {
      logger.warn(`[Legal] Serper domain search error: ${res.status}`)
      return []
    }

    const data = await res.json()
    return (data.organic || []).slice(0, maxResults).map((r: Record<string, unknown>, i: number) => {
      const url = String(r.link || '')
      const domain = extractDomain(url)
      const sourceId = mapDomainToSourceId(domain)
      const docType = mapDomainToDocType(domain)

      return {
        id: `serper-legal-${i}`,
        title: String(r.title || ''),
        content: String(r.snippet || '').slice(0, 800),
        type: docType,
        source: sourceId,
        url,
        date: r.date ? String(r.date) : undefined,
        legalReference: extractLegalRefFromText(String(r.title || '') + ' ' + String(r.snippet || '')),
        relevanceScore: 0.75,
      }
    })
  } catch (e) {
    logger.warn('[Legal] Serper domain search failed: ' + (e instanceof Error ? e.message : 'unknown'))
    return []
  }
}

/**
 * Recherche ciblée — Tavily en premier, Serper en fallback
 */
async function searchLegalDomains(
  query: string,
  maxResults: number = 5,
  domains?: string[],
): Promise<LegalDocument[]> {
  // Essayer Tavily d'abord
  if (process.env.TAVILY_API_KEY) {
    const results = await searchLegalDomainsTavily(query, maxResults, domains)
    if (results.length > 0) return results
  }

  // Fallback Serper
  if (process.env.SERPER_API_KEY) {
    return searchLegalDomainsSerper(query, maxResults, domains)
  }

  return []
}

/** Extrait le domaine d'une URL */
function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '')
  } catch {
    return 'unknown'
  }
}

/** Mappe un domaine vers un LegalSourceId */
function mapDomainToSourceId(domain: string): LegalSourceId {
  const mapping: Record<string, LegalSourceId> = {
    'legifrance.gouv.fr': 'legifrance',
    'bofip.impots.gouv.fr': 'bofip',
    'impots.gouv.fr': 'impots_gouv',
    'service-public.fr': 'service_public',
    'amf-france.org': 'amf',
    'acpr.banque-france.fr': 'acpr',
    'banque-france.fr': 'acpr',
    'courdecassation.fr': 'cour_cassation',
    'conseil-etat.fr': 'conseil_etat',
    'conseil-constitutionnel.fr': 'conseil_etat',
    'cnil.fr': 'cnil',
    'notaires.fr': 'notaires_fr',
    'experts-comptables.fr': 'legifrance',
    'economie.gouv.fr': 'impots_gouv',
    'urssaf.fr': 'urssaf',
    'vie-publique.fr': 'vie_publique',
  }
  return mapping[domain] || 'legifrance'
}

/** Mappe un domaine vers un type de document */
function mapDomainToDocType(domain: string): LegalDocumentType {
  const mapping: Record<string, LegalDocumentType> = {
    'legifrance.gouv.fr': 'code_article',
    'bofip.impots.gouv.fr': 'doctrine',
    'impots.gouv.fr': 'fiche_pratique',
    'service-public.fr': 'fiche_pratique',
    'amf-france.org': 'reglement',
    'acpr.banque-france.fr': 'reglement',
    'courdecassation.fr': 'jurisprudence',
    'conseil-etat.fr': 'jurisprudence',
    'cnil.fr': 'reglement',
    'notaires.fr': 'fiche_pratique',
  }
  return mapping[domain] || 'actualite'
}

/** Extrait une référence légale d'un texte libre */
function extractLegalRefFromText(text: string): string | undefined {
  const patterns = [
    /(?:article|art\.?)\s*(L?\s*[\d]+(?:[- ]\d+)?(?:\s*[a-zA-Z]{1,5})?)\s*(?:du\s*)?(?:CGI|code\s*g[ée]n[ée]ral\s*des\s*imp[ôo]ts)/i,
    /(?:article|art\.?)\s*([\d]+(?:[- ]\d+)?(?:\s*[a-zA-Z]{1,5})?)\s*(?:du\s*)?(?:code\s*civil|C\.\s*civ)/i,
    /(?:article|art\.?)\s*(L?\s*[\d]+(?:-[\d]+)*)\s*(?:du\s*)?(?:CMF|code\s*mon[ée]taire)/i,
    /BOI[-\s][\w-]+/i,
  ]
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) return match[0]
  }
  return undefined
}

// ============================================================================
// SERVICE-PUBLIC.FR — Fiches pratiques
// ============================================================================

const SERVICE_PUBLIC_CONFIG = {
  searchUrl: 'https://www.service-public.fr/particuliers/recherche',
  baseUrl: 'https://www.service-public.fr',
  timeout: 10_000,
}

async function searchServicePublic(query: string, maxResults: number = 3): Promise<LegalDocument[]> {
  try {
    const res = await fetch(`${SERVICE_PUBLIC_CONFIG.searchUrl}?keyword=${encodeURIComponent(query)}`, {
      headers: {
        'Accept': 'text/html',
        'User-Agent': 'Mozilla/5.0 (compatible; CRM-RAG/2.0)',
      },
      signal: AbortSignal.timeout(SERVICE_PUBLIC_CONFIG.timeout),
    })

    if (!res.ok) return []

    const html = await res.text()
    return parseServicePublicResults(html, maxResults)
  } catch (e) {
    logger.warn('[Legal] Service-public.fr search failed: ' + (e instanceof Error ? e.message : 'unknown'))
    return []
  }
}

function parseServicePublicResults(html: string, maxResults: number): LegalDocument[] {
  const results: LegalDocument[] = []

  const pattern = /<a[^>]*href="(\/particuliers\/vosdroits\/[^"]*)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<p[^>]*class="[^"]*resume[^"]*"[^>]*>([\s\S]*?)<\/p>/gi
  let match: RegExpExecArray | null

  while ((match = pattern.exec(html)) !== null && results.length < maxResults) {
    const [, href, rawTitle, rawSnippet] = match
    results.push({
      id: `sp-${results.length}`,
      title: cleanHtml(rawTitle).trim(),
      content: cleanHtml(rawSnippet).trim(),
      type: 'fiche_pratique',
      source: 'service_public',
      url: `${SERVICE_PUBLIC_CONFIG.baseUrl}${href}`,
      relevanceScore: 0.85,
    })
  }

  return results
}

// ============================================================================
// IMPOTS.GOUV.FR — Informations fiscales pratiques
// ============================================================================

const IMPOTS_CONFIG = {
  searchUrl: 'https://www.impots.gouv.fr/recherche',
  baseUrl: 'https://www.impots.gouv.fr',
  timeout: 10_000,
}

async function searchImpots(query: string, maxResults: number = 3): Promise<LegalDocument[]> {
  try {
    const res = await fetch(`${IMPOTS_CONFIG.searchUrl}?search_api_fulltext=${encodeURIComponent(query)}`, {
      headers: {
        'Accept': 'text/html',
        'User-Agent': 'Mozilla/5.0 (compatible; CRM-RAG/2.0)',
      },
      signal: AbortSignal.timeout(IMPOTS_CONFIG.timeout),
    })

    if (!res.ok) return []

    const html = await res.text()
    return parseImpotsResults(html, maxResults)
  } catch (e) {
    logger.warn('[Legal] impots.gouv.fr search failed: ' + (e instanceof Error ? e.message : 'unknown'))
    return []
  }
}

function parseImpotsResults(html: string, maxResults: number): LegalDocument[] {
  const results: LegalDocument[] = []

  const pattern = /<h[23][^>]*>\s*<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>\s*<\/h[23]>[\s\S]*?<(?:p|div)[^>]*class="[^"]*(?:snippet|description|teaser)[^"]*"[^>]*>([\s\S]*?)<\/(?:p|div)>/gi
  let match: RegExpExecArray | null

  while ((match = pattern.exec(html)) !== null && results.length < maxResults) {
    const [, href, rawTitle, rawSnippet] = match
    const url = href.startsWith('http') ? href : `${IMPOTS_CONFIG.baseUrl}${href}`
    results.push({
      id: `impots-${results.length}`,
      title: cleanHtml(rawTitle).trim(),
      content: cleanHtml(rawSnippet).trim(),
      type: 'fiche_pratique',
      source: 'impots_gouv',
      url,
      relevanceScore: 0.9,
    })
  }

  return results
}

// ============================================================================
// FLUX RSS — Seules sources vérifiées fonctionnelles (février 2026)
// ============================================================================

/**
 * Flux RSS testés et fonctionnels.
 * 
 * ⚠️ Les flux suivants ont été supprimés car 404 (février 2026) :
 *   JORF RSS, Legifrance RSS, AMF RSS, Sénat RSS, AN RSS,
 *   Vie-publique RSS, URSSAF RSS, ACPR RSS
 */
export const RSS_FEEDS: {
  id: LegalSourceId
  name: string
  url: string
  type: LegalDocumentType
  quality: number
  category: string
}[] = [
  // ── CNIL — Seul flux RSS vérifié fonctionnel (200 ✅, application/rss+xml) ──
  {
    id: 'cnil',
    name: 'CNIL — Actualités',
    url: 'https://www.cnil.fr/fr/rss.xml',
    type: 'reglement',
    quality: 0.90,
    category: 'data_protection',
  },
]

/**
 * Récupère et parse un flux RSS
 */
async function fetchRSSFeed(
  feedUrl: string,
  maxItems: number = 5,
): Promise<{ title: string; link: string; description: string; pubDate?: string }[]> {
  try {
    const res = await fetch(feedUrl, {
      headers: {
        'Accept': 'application/xml, application/rss+xml, text/xml',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      },
      signal: AbortSignal.timeout(10_000),
    })

    if (!res.ok) return []

    const contentType = res.headers.get('content-type') || ''
    // Vérifier que c'est bien du XML/RSS et non du HTML
    if (!contentType.includes('xml') && !contentType.includes('rss')) return []

    const xml = await res.text()
    return parseRSSXml(xml, maxItems)
  } catch (e) {
    logger.warn(`[Legal] RSS fetch failed (${feedUrl}): ` + (e instanceof Error ? e.message : 'unknown'))
    return []
  }
}

/**
 * Parse XML RSS simplifié (sans lib externe)
 */
function parseRSSXml(
  xml: string,
  maxItems: number,
): { title: string; link: string; description: string; pubDate?: string }[] {
  const items: { title: string; link: string; description: string; pubDate?: string }[] = []

  const itemPattern = /<item>([\s\S]*?)<\/item>/gi
  let match: RegExpExecArray | null

  while ((match = itemPattern.exec(xml)) !== null && items.length < maxItems) {
    const itemXml = match[1]
    const title = extractXmlTag(itemXml, 'title')
    const link = extractXmlTag(itemXml, 'link')
    const description = extractXmlTag(itemXml, 'description')
    const pubDate = extractXmlTag(itemXml, 'pubDate') || extractXmlTag(itemXml, 'dc:date')

    if (title && link) {
      items.push({
        title: cleanHtml(title),
        link,
        description: cleanHtml(description || '').slice(0, 500),
        pubDate,
      })
    }
  }

  return items
}

function extractXmlTag(xml: string, tag: string): string {
  const pattern = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, 'i')
  const match = xml.match(pattern)
  return match ? match[1].trim() : ''
}

/**
 * Recherche dans les flux RSS vérifiés selon la requête
 */
async function searchRSSFeeds(
  query: string,
  maxResults: number = 3,
): Promise<LegalDocument[]> {
  const queryLower = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const allDocuments: LegalDocument[] = []

  const feedResults = await Promise.allSettled(
    RSS_FEEDS.map(feed => fetchRSSFeed(feed.url, 10))
  )

  for (let i = 0; i < feedResults.length; i++) {
    const result = feedResults[i]
    const feed = RSS_FEEDS[i]

    if (result.status !== 'fulfilled') continue

    for (const item of result.value) {
      const titleLower = item.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      const descLower = item.description.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2)

      let matchScore = 0
      for (const word of queryWords) {
        if (titleLower.includes(word)) matchScore += 2
        if (descLower.includes(word)) matchScore += 1
      }

      if (matchScore > 0) {
        allDocuments.push({
          id: `rss-${feed.id}-${allDocuments.length}`,
          title: item.title,
          content: item.description,
          type: feed.type,
          source: feed.id,
          url: item.link,
          date: item.pubDate,
          relevanceScore: Math.min(0.5 + matchScore * 0.1, feed.quality),
        })
      }
    }
  }

  return allDocuments
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, maxResults)
}

// ============================================================================
// RECHERCHE PAR ARTICLE DE LOI SPÉCIFIQUE
// ============================================================================

/**
 * Détecte et extrait les références d'articles de loi dans une requête
 */
export function extractArticleReferences(query: string): { code: string; article: string }[] {
  const refs: { code: string; article: string }[] = []

  const patterns = [
    /(?:(?:CGI|CC|CMF|CSS|C\.\s*civ|C\.\s*com|LPF)\s*)?art(?:icle)?\.?\s*([\d]+(?:[- ]\d+)?(?:\s*[a-zA-Z]{1,5})?)/gi,
    /art(?:icle)?\.?\s*([LRD][\d]+-[\d]+(?:-[\d]+)?)\s*(?:du\s*)?(?:CGI|CC|CMF|CSS|C\.\s*civ)/gi,
    /([\d]+(?:[- ]\d+)?(?:\s*[a-zA-Z]{1,5})?)\s+(?:du\s*)?(?:CGI|CC|CMF|CSS)/gi,
  ]

  for (const pattern of patterns) {
    let match: RegExpExecArray | null
    while ((match = pattern.exec(query)) !== null) {
      const article = match[1]?.trim()
      const codeMatch = query.match(/CGI|CC|Code\s*civil|CMF|CSS|LPF|C\.\s*civ|C\.\s*com/i)
      const code = normalizeCodeName(codeMatch ? codeMatch[0] : 'CGI')

      if (article && !refs.some(r => r.article === article && r.code === code)) {
        refs.push({ code, article })
      }
    }
  }

  return refs
}

function normalizeCodeName(code: string): string {
  const mapping: Record<string, string> = {
    'cgi': 'CGI',
    'cc': 'CC',
    'c. civ': 'CC',
    'code civil': 'CC',
    'cmf': 'CMF',
    'css': 'CSS',
    'lpf': 'LPF',
    'c. com': 'CCOM',
  }
  return mapping[code.toLowerCase().trim()] || code.toUpperCase()
}

/**
 * Récupère les articles spécifiques mentionnés dans la requête
 * via l'API Legifrance
 */
async function fetchSpecificArticles(
  query: string,
): Promise<LegalDocument[]> {
  const refs = extractArticleReferences(query)
  if (refs.length === 0) return []

  const results: LegalDocument[] = []
  for (const ref of refs.slice(0, 3)) {
    const doc = await fetchLegifranceArticle(ref.code, ref.article)
    if (doc) results.push(doc)
  }

  return results
}

// ============================================================================
// API PUBLIQUE — RECHERCHE UNIFIÉE
// ============================================================================

/**
 * Recherche unifiée dans toutes les sources juridiques et fiscales
 * 
 * Flux vérifié (février 2026) :
 *   1. Détecte les articles spécifiques → Legifrance API (si OAuth2 configuré)
 *   2. Recherche ciblée domaines officiels → Tavily/Serper avec include_domains
 *   3. Scraping direct → service-public.fr + impots.gouv.fr (200 ✅)
 *   4. Flux RSS → CNIL uniquement (200 ✅)
 *   5. Scoring et déduplication
 */
export async function searchLegalSources(
  query: string,
  options: LegalSearchOptions = {},
): Promise<LegalSearchResponse> {
  const startTime = Date.now()
  const maxResults = options.maxResults || 5
  const errors: { source: LegalSourceId; error: string }[] = []
  const sourcesQueried: LegalSourceId[] = []
  const allDocuments: LegalDocument[] = []

  // ── 1. Articles spécifiques via Legifrance API ──
  try {
    sourcesQueried.push('legifrance')
    const specificArticles = await fetchSpecificArticles(query)
    allDocuments.push(...specificArticles)

    // Recherche textuelle Legifrance API si pas d'articles spécifiques
    if (specificArticles.length === 0) {
      const legiResults = await searchLegifrance(query, {
        ...options,
        maxResults: Math.min(maxResults, 3),
      })
      allDocuments.push(...legiResults)
    }
  } catch (e) {
    errors.push({ source: 'legifrance', error: e instanceof Error ? e.message : 'unknown' })
  }

  // ── 2. Recherche ciblée domaines officiels (Tavily/Serper) ──
  // C'est la méthode la plus fiable : on utilise un moteur de recherche
  // mais restreint aux domaines juridiques officiels FR
  if (process.env.TAVILY_API_KEY || process.env.SERPER_API_KEY) {
    try {
      const domainResults = await searchLegalDomains(query, Math.min(maxResults, 4))
      allDocuments.push(...domainResults)

      for (const doc of domainResults) {
        if (!sourcesQueried.includes(doc.source)) {
          sourcesQueried.push(doc.source)
        }
      }
    } catch (e) {
      errors.push({ source: 'bofip', error: e instanceof Error ? e.message : 'unknown' })
    }
  }

  // ── 3. Scraping direct service-public.fr (vérifié 200 ✅) ──
  try {
    if (!sourcesQueried.includes('service_public')) sourcesQueried.push('service_public')
    const spResults = await searchServicePublic(query, Math.min(maxResults, 2))
    allDocuments.push(...spResults)
  } catch (e) {
    errors.push({ source: 'service_public', error: e instanceof Error ? e.message : 'unknown' })
  }

  // ── 4. Scraping direct impots.gouv.fr (vérifié 200 ✅) ──
  try {
    if (!sourcesQueried.includes('impots_gouv')) sourcesQueried.push('impots_gouv')
    const impotsResults = await searchImpots(query, Math.min(maxResults, 2))
    allDocuments.push(...impotsResults)
  } catch (e) {
    errors.push({ source: 'impots_gouv', error: e instanceof Error ? e.message : 'unknown' })
  }

  // ── 5. CNIL RSS (vérifié 200 ✅) ──
  try {
    const rssResults = await searchRSSFeeds(query, 2)
    allDocuments.push(...rssResults)
    for (const doc of rssResults) {
      if (!sourcesQueried.includes(doc.source)) {
        sourcesQueried.push(doc.source)
      }
    }
  } catch (e) {
    errors.push({ source: 'cnil', error: e instanceof Error ? e.message : 'unknown' })
  }

  // ── 6. Déduplication et scoring final ──
  const seen = new Set<string>()
  const deduped = allDocuments.filter(doc => {
    const key = doc.url || `${doc.source}-${doc.title}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  const sorted = deduped
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, maxResults)

  return {
    documents: sorted,
    query,
    sourcesQueried,
    totalDurationMs: Date.now() - startTime,
    errors,
  }
}

// ============================================================================
// VÉRIFICATION DE DISPONIBILITÉ
// ============================================================================

/**
 * Vérifie quelles sources juridiques sont disponibles
 */
export function getLegalSourcesStatus(): {
  legifrance: { available: boolean; reason?: string }
  domainSearch: { available: boolean; provider?: string }
  servicePublic: { available: boolean }
  impots: { available: boolean }
  rss: { available: boolean; feedCount: number }
} {
  const hasLegifranceCreds = !!(process.env.LEGIFRANCE_CLIENT_ID && process.env.LEGIFRANCE_CLIENT_SECRET)
  const hasTavily = !!process.env.TAVILY_API_KEY
  const hasSerper = !!process.env.SERPER_API_KEY

  return {
    legifrance: {
      available: hasLegifranceCreds,
      reason: hasLegifranceCreds
        ? undefined
        : 'Ajouter LEGIFRANCE_CLIENT_ID et LEGIFRANCE_CLIENT_SECRET (OAuth2 PISTE sur piste.gouv.fr)',
    },
    domainSearch: {
      available: hasTavily || hasSerper,
      provider: hasTavily ? 'tavily' : hasSerper ? 'serper' : undefined,
    },
    servicePublic: { available: true },
    impots: { available: true },
    rss: { available: true, feedCount: RSS_FEEDS.length },
  }
}

// ============================================================================
// UTILITAIRES INTERNES
// ============================================================================

/** Supprime les tags HTML et décode les entités */
function cleanHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')          // Supprimer tags
    .replace(/&nbsp;/g, ' ')          // Espaces insécables
    .replace(/&amp;/g, '&')           // Ampersand
    .replace(/&lt;/g, '<')            // Less than
    .replace(/&gt;/g, '>')            // Greater than
    .replace(/&quot;/g, '"')          // Guillemets
    .replace(/&#39;/g, "'")           // Apostrophe
    .replace(/&apos;/g, "'")          // Apostrophe
    .replace(/\s+/g, ' ')            // Normaliser espaces
    .trim()
}

/** Extrait une référence légale d'un titre */
function extractLegalRef(title: string): string | undefined {
  const match = title.match(
    /(?:Article\s*)?([LRD]?[\d]+(?:[- ]\d+)?(?:\s*[a-zA-Z]{1,8})?)\s*(?:du\s*)?(?:CGI|Code\s*g[ée]n[ée]ral\s*des\s*imp[ôo]ts|Code\s*civil|CMF|CSS|LPF)/i
  )
  if (match) {
    const codeMatch = title.match(/CGI|Code\s*civil|CMF|CSS|LPF/i)
    const code = codeMatch ? normalizeCodeName(codeMatch[0]) : ''
    return `${code} art. ${match[1]}`.trim()
  }
  return undefined
}
