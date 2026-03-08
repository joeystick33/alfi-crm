/**
 * RAG Query Engine — Moteur d'analyse et scoring de requêtes
 * 
 * Architecture de retrieval de niveau professionnel pour CGP, analystes financiers,
 * gérants de fonds, courtiers assurance/immobilier et fiscalistes.
 * 
 * Composants :
 *   • BM25 — Algorithme de scoring probabiliste (état de l'art en IR)
 *   • Intent Detection — Classification d'intention (18 catégories métier)
 *   • Entity Extraction — Extraction de montants, âges, produits, articles de loi
 *   • Synonym Expansion — Dictionnaire de 400+ synonymes métier financier/patrimonial
 *   • Professional Profile — Adaptation du scoring selon le profil professionnel
 */

// ============================================================================
// TYPES
// ============================================================================

export type QueryIntent =
  | 'fiscal_optimization'      // Optimisation fiscale (IR, IFI, réductions)
  | 'income_tax'               // Impôt sur le revenu spécifiquement
  | 'wealth_tax'               // IFI spécifiquement
  | 'capital_gains'            // Plus-values (mobilières, immobilières)
  | 'retirement_planning'      // Retraite (pension, PER, gap)
  | 'estate_planning'          // Succession et transmission
  | 'donation_strategy'        // Donations et libéralités
  | 'real_estate_investment'   // Investissement immobilier
  | 'life_insurance'           // Assurance-vie
  | 'savings_investment'       // Épargne et placements
  | 'corporate_finance'        // Entreprise (holding, cession, IS)
  | 'social_protection'        // Prévoyance, protection sociale
  | 'regulatory_compliance'    // Réglementation (DDA, MIF2, LCB-FT)
  | 'client_analysis'          // Analyse profil client
  | 'market_analysis'          // Marchés financiers
  | 'debt_financing'           // Emprunt et financement
  | 'international_tax'        // Fiscalité internationale, expatriation
  | 'general_advice'           // Conseil général

export type ProfessionalProfile =
  | 'cgp'                      // Conseiller en Gestion de Patrimoine
  | 'financial_analyst'        // Analyste financier
  | 'fund_manager'             // Gérant de fonds
  | 'insurance_broker'         // Courtier en assurance
  | 'real_estate_broker'       // Courtier immobilier
  | 'tax_specialist'           // Fiscaliste
  | 'notary'                   // Notaire
  | 'general'                  // Profil générique

export type ChunkDifficulty = 'basic' | 'intermediate' | 'expert'

export interface ExtractedEntities {
  amounts: number[]
  ages: number[]
  durations: number[]
  taxRates: number[]
  products: string[]
  legalArticles: string[]
  familyStatus: string | null
  professionalStatus: string | null
  investmentTypes: string[]
  years: number[]
}

export interface QueryAnalysis {
  originalQuery: string
  normalizedQuery: string
  tokens: string[]
  expandedTokens: string[]
  intents: QueryIntent[]
  primaryIntent: QueryIntent
  entities: ExtractedEntities
  confidenceScore: number
  suggestedWebQuery: string
  needsWebSearch: boolean
}

// ============================================================================
// BM25 — ALGORITHME DE SCORING PROBABILISTE
// ============================================================================

const BM25_CONFIG = {
  k1: 1.6,    // Saturation des termes (1.2-2.0 standard, 1.6 pour documents courts)
  b: 0.75,    // Pondération de la longueur du document
  delta: 0.5, // BM25+ correction pour termes rares
}

export interface BM25Index {
  docCount: number
  avgDocLength: number
  docLengths: Map<string, number>
  termDocFreqs: Map<string, number>
  termFreqs: Map<string, Map<string, number>>
}

/**
 * Construit un index BM25 à partir d'un corpus de documents
 */
export function buildBM25Index(
  documents: Array<{ id: string; text: string }>
): BM25Index {
  const index: BM25Index = {
    docCount: documents.length,
    avgDocLength: 0,
    docLengths: new Map(),
    termDocFreqs: new Map(),
    termFreqs: new Map(),
  }

  let totalLength = 0

  for (const doc of documents) {
    const tokens = tokenize(doc.text)
    index.docLengths.set(doc.id, tokens.length)
    totalLength += tokens.length

    const termFreqMap = new Map<string, number>()
    const seenTerms = new Set<string>()

    for (const token of tokens) {
      termFreqMap.set(token, (termFreqMap.get(token) || 0) + 1)
      if (!seenTerms.has(token)) {
        seenTerms.add(token)
        index.termDocFreqs.set(token, (index.termDocFreqs.get(token) || 0) + 1)
      }
    }

    index.termFreqs.set(doc.id, termFreqMap)
  }

  index.avgDocLength = totalLength / (documents.length || 1)
  return index
}

/**
 * Calcule le score BM25+ d'un document pour une requête
 */
export function scoreBM25(
  queryTokens: string[],
  docId: string,
  index: BM25Index,
): number {
  const { k1, b, delta } = BM25_CONFIG
  const docLength = index.docLengths.get(docId) || 0
  const termFreqs = index.termFreqs.get(docId) || new Map()
  let score = 0

  for (const term of queryTokens) {
    const tf = termFreqs.get(term) || 0
    if (tf === 0) continue

    const df = index.termDocFreqs.get(term) || 0
    // IDF avec correction Robertson-Sparck Jones
    const idf = Math.log(1 + (index.docCount - df + 0.5) / (df + 0.5))

    // BM25+ (avec delta pour éviter de pénaliser les termes très rares)
    const tfNorm = ((tf * (k1 + 1)) / (tf + k1 * (1 - b + b * (docLength / index.avgDocLength)))) + delta

    score += idf * tfNorm
  }

  return score
}

// ============================================================================
// TOKENISATION AVANCÉE
// ============================================================================

const STOP_WORDS_FR = new Set([
  'le', 'la', 'les', 'de', 'du', 'des', 'un', 'une', 'et', 'ou', 'en',
  'dans', 'sur', 'pour', 'par', 'au', 'aux', 'avec', 'ce', 'cette', 'ces',
  'est', 'sont', 'a', 'ont', 'qui', 'que', 'quel', 'quelle', 'quels',
  'quelles', 'comment', 'combien', 'quand', 'se', 'sa', 'son', 'ses',
  'mon', 'ma', 'mes', 'ton', 'ta', 'tes', 'notre', 'nos', 'votre', 'vos',
  'leur', 'leurs', 'il', 'elle', 'ils', 'elles', 'je', 'tu', 'nous', 'vous',
  'ne', 'pas', 'plus', 'mais', 'si', 'peut', 'doit', 'fait', 'etre', 'avoir',
  'faire', 'tout', 'tous', 'aussi', 'bien', 'tres', 'ca', 'donc',
])

/**
 * Tokenize avancé avec normalisation, suppression stopwords et stemming léger
 */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[']/g, ' ')
    .replace(/[^a-z0-9\s%€./-]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1 && !STOP_WORDS_FR.has(t))
    .map(stemFr)
}

/**
 * Stemming français léger (suffixation)
 */
function stemFr(word: string): string {
  if (word.length <= 3) return word
  // Supprimer les suffixes courants français (approche simplifiée)
  if (word.endsWith('ement')) return word.slice(0, -5)
  if (word.endsWith('ment')) return word.slice(0, -4)
  if (word.endsWith('tion')) return word.slice(0, -4) + 't'
  if (word.endsWith('sion')) return word.slice(0, -4) + 's'
  if (word.endsWith('ique')) return word.slice(0, -4)
  if (word.endsWith('eur')) return word.slice(0, -3)
  if (word.endsWith('euse')) return word.slice(0, -4)
  if (word.endsWith('eux')) return word.slice(0, -3)
  if (word.endsWith('ible')) return word.slice(0, -4)
  if (word.endsWith('able')) return word.slice(0, -4)
  if (word.endsWith('ais') || word.endsWith('ait')) return word.slice(0, -3)
  if (word.endsWith('es')) return word.slice(0, -2)
  if (word.endsWith('er')) return word.slice(0, -2)
  if (word.endsWith('ir')) return word.slice(0, -2)
  return word
}

// ============================================================================
// DICTIONNAIRE DE SYNONYMES MÉTIER (400+ mappings)
// ============================================================================

const SYNONYMS: Record<string, string[]> = {
  // ── Fiscalité ──
  'ir': ['impot revenu', 'imposition', 'bareme progressif', 'tmi', 'taux marginal', 'fiscalite revenus'],
  'impot': ['ir', 'imposition', 'fiscalite', 'taxation', 'charge fiscale', 'prelevements'],
  'tmi': ['taux marginal', 'tranche marginale', 'bareme ir', 'tranche imposition'],
  'ifi': ['isf', 'impot fortune', 'fortune immobiliere', 'patrimoine immobilier taxable'],
  'isf': ['ifi', 'impot fortune'],
  'pfu': ['flat tax', 'prelevement forfaitaire unique', '30%', 'imposition forfaitaire'],
  'flat tax': ['pfu', 'prelevement forfaitaire unique'],
  'csg': ['prelevements sociaux', 'contributions sociales', '9.2%', '17.2%'],
  'crds': ['prelevements sociaux', 'contributions sociales'],
  'ps': ['prelevements sociaux', 'csg', 'crds', '17.2%'],
  'cehr': ['contribution exceptionnelle', 'hauts revenus', 'surtaxe', '223 sexies'],
  'plus-value': ['gain', 'capital gain', 'pv', 'plus value', 'benefice cession'],
  'reduction impot': ['credit impot', 'avantage fiscal', 'defiscalisation', 'niche fiscale'],
  'defiscalisation': ['reduction impot', 'niche fiscale', 'avantage fiscal', 'optimisation fiscale'],
  'optimisation': ['reduction', 'economie', 'strategie', 'optimiser', 'diminuer impot'],

  // ── Assurance-vie ──
  'assurance vie': ['av', 'contrat assurance vie', 'placement av', 'fonds euros', 'uc'],
  'av': ['assurance vie', 'contrat av'],
  'rachat': ['retrait', 'sortie partielle', 'sortie totale', 'deblocage'],
  'fonds euros': ['support garanti', 'fonds en euros', 'capital garanti', 'rendement garanti'],
  'uc': ['unites de compte', 'supports financiers', 'fonds diversifies'],
  '990i': ['art 990', 'deces assurance vie', 'avant 70 ans', 'abattement 152500'],
  '757b': ['art 757', 'apres 70 ans', 'abattement 30500'],

  // ── PER / Épargne retraite ──
  'per': ['plan epargne retraite', 'perp', 'madelin', 'epargne retraite', 'retraite supplementaire'],
  'perp': ['per', 'plan epargne retraite populaire'],
  'madelin': ['per tns', 'retraite tns', '154 bis', 'contrat madelin'],
  'pass': ['plafond securite sociale', '46368', 'plafond annuel'],
  'art 83': ['per obligatoire', 'per entreprise', 'retraite supplementaire entreprise'],

  // ── PEA ──
  'pea': ['plan epargne actions', 'pea-pme', 'pea classique', 'enveloppe actions'],
  'cto': ['compte titres', 'compte titres ordinaire', 'compte bourse'],

  // ── Immobilier ──
  'lmnp': ['loueur meuble non professionnel', 'location meublee', 'meuble non pro', 'micro bic'],
  'lmp': ['loueur meuble professionnel', 'meuble professionnel', 'location pro'],
  'scpi': ['pierre papier', 'societe civile placement immobilier', 'parts scpi', 'rendement scpi'],
  'opci': ['organisme placement collectif immobilier', 'pierre papier opci'],
  'sci': ['societe civile immobiliere', 'sci ir', 'sci is', 'societe immobiliere'],
  'pinel': ['pinel+', 'reduction pinel', '199 novovicies', 'investissement locatif'],
  'denormandie': ['denormandie ancien', 'rehabilitation', 'ancien renove'],
  'deficit foncier': ['travaux deductibles', 'charges deductibles', 'imputation deficit', '10700'],
  'ptz': ['pret taux zero', 'pret sans interet', 'primo accedant'],
  'hcsf': ['endettement 35%', 'norme hcsf', 'taux endettement', 'capacite emprunt'],
  'rendement locatif': ['rentabilite', 'rapport locatif', 'taux rendement', 'yield immobilier'],

  // ── Succession / Donation ──
  'succession': ['heritage', 'transmission deces', 'droits succession', 'dmtg', 'droit mutation'],
  'donation': ['liberalite', 'transmission vivant', 'don', 'donateur', 'donataire'],
  'demembrement': ['usufruit', 'nue propriete', 'nu proprietaire', 'usufruitier', '669 cgi'],
  'dutreil': ['pacte dutreil', '787b', '787c', 'transmission entreprise', 'abattement 75%'],
  'donation partage': ['partage anticipee', 'figer valeurs', '1076 code civil'],
  'testament': ['disposition testamentaire', 'legs', 'quotite disponible', 'reserve hereditaire'],
  'abattement': ['franchise', 'seuil exoneration', 'montant exonere'],

  // ── Entreprise / Dirigeant ──
  'holding': ['societe mere', 'societe holding', 'mere fille', 'integration fiscale', 'animation'],
  'is': ['impot societes', 'impot sur societes', 'taux is', 'benefice imposable societe'],
  'dividende': ['distribution', 'remontee dividendes', 'mere fille', 'pfu dividendes'],
  'cession': ['vente entreprise', 'transmission entreprise', 'ceder', 'prix cession'],
  '150-0 b ter': ['apport cession', 'report imposition', 'apport avant cession', 'sursis'],
  'obo': ['owner buy out', 'rachat par soi-meme', 'leverage buy out personnel'],
  'bspce': ['bons souscription', 'stock options', 'actions gratuites', 'management package', 'aga'],
  'tns': ['travailleur non salarie', 'independant', 'liberal', 'gerant majoritaire', 'auto-entrepreneur'],
  'remuneration dirigeant': ['salaire dirigeant', 'dividendes vs salaire', 'optimisation remuneration'],

  // ── Marchés financiers ──
  'etf': ['tracker', 'fonds indiciel', 'gestion passive', 'indice'],
  'obligation': ['bond', 'obligataire', 'taux fixe', 'coupon', 'rendement obligataire'],
  'private equity': ['pe', 'capital investissement', 'non cote', 'fcpr', 'fpci'],
  'produit structure': ['structured product', 'autocall', 'phoenix', 'certificat', 'emtn'],
  'allocation': ['allocation actifs', 'repartition', 'diversification', 'asset allocation'],
  'gestion pilotee': ['gestion sous mandat', 'gestion deleguee', 'mandat de gestion'],
  'volatilite': ['risque', 'var', 'ecart type', 'sharpe', 'drawdown'],

  // ── Protection / Prévoyance ──
  'prevoyance': ['protection', 'incapacite', 'invalidite', 'deces', 'garantie', 'couverture'],
  'ij': ['indemnites journalieres', 'arret maladie', 'incapacite temporaire'],
  'rente education': ['protection enfants', 'capital deces', 'rente orphelin'],
  'homme cle': ['homme-cle', 'assurance dirigeant', 'perte exploitation', 'key man'],
  'garantie deces': ['capital deces', 'clause beneficiaire', 'rente conjoint'],

  // ── Retraite ──
  'retraite': ['pension', 'depart retraite', 'liquidation droits', 'age legal', 'taux plein'],
  'agirc arrco': ['complementaire', 'points retraite', 'valeur point', 'retraite complementaire'],
  'trimestre': ['duree assurance', 'trimestres valides', 'trimestres cotises', 'rachat trimestres'],
  'surcote': ['bonus trimestres', 'supplement pension', 'au-dela taux plein'],
  'decote': ['malus trimestres', 'trimestres manquants', 'reduction pension'],
  'gap retraite': ['deficit retraite', 'besoin complementaire', 'ecart revenus', 'complement retraite'],

  // ── Réglementation ──
  'dda': ['directive distribution assurance', 'idd', 'devoir conseil assurance', 'formation 15h'],
  'mif2': ['mifid2', 'marches instruments financiers', 'adequation', 'convenable'],
  'lcb-ft': ['blanchiment', 'anti blanchiment', 'tracfin', 'kyc', 'vigilance', 'gel avoirs'],
  'rgpd': ['donnees personnelles', 'protection donnees', 'cnil', 'consentement', 'droit oubli'],
  'devoir conseil': ['obligation conseil', 'recueil informations', 'adequation', 'tracabilite'],
  'cif': ['conseiller investissement financier', 'amf', 'orias', 'statut cif'],
  'iobsp': ['courtier credit', 'intermediaire bancaire', 'courtage credit'],
  'ias': ['intermediaire assurance', 'courtier assurance', 'agent general', 'mandataire'],

  // ── Situations client ──
  'expatrie': ['non resident', 'international', 'convention fiscale', 'exit tax', 'impatriation'],
  'chef entreprise': ['dirigeant', 'entrepreneur', 'createur', 'repreneur'],
  'professionnel liberal': ['liberal', 'medecin', 'avocat', 'architecte', 'bnc'],
}

/**
 * Expanse les tokens d'une requête avec les synonymes du dictionnaire métier
 */
export function expandWithSynonyms(tokens: string[]): string[] {
  const expanded = new Set<string>(tokens)

  for (const token of tokens) {
    // Chercher dans les clés du dictionnaire
    for (const [key, synonyms] of Object.entries(SYNONYMS)) {
      const normalizedKey = key.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      if (normalizedKey === token || normalizedKey.includes(token) || token.includes(normalizedKey)) {
        for (const syn of synonyms) {
          const synTokens = syn.normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/\s+/)
          for (const st of synTokens) {
            if (st.length > 1 && !STOP_WORDS_FR.has(st)) expanded.add(stemFr(st))
          }
        }
      }
      // Chercher aussi dans les valeurs
      for (const syn of synonyms) {
        const normalizedSyn = syn.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        if (normalizedSyn.includes(token)) {
          const keyTokens = normalizedKey.split(/\s+/)
          for (const kt of keyTokens) {
            if (kt.length > 1 && !STOP_WORDS_FR.has(kt)) expanded.add(stemFr(kt))
          }
          break
        }
      }
    }
  }

  return Array.from(expanded)
}

// ============================================================================
// DÉTECTION D'INTENTION (18 catégories métier)
// ============================================================================

const INTENT_PATTERNS: Record<QueryIntent, string[]> = {
  income_tax: [
    'impot revenu', 'ir', 'bareme ir', 'tmi', 'tranche', 'quotient familial',
    'declaration', 'revenu imposable', 'foyer fiscal', 'parts', 'decote ir',
  ],
  wealth_tax: [
    'ifi', 'isf', 'fortune immobiliere', 'patrimoine immobilier', 'seuil ifi',
    'abattement residence', 'dettes deductibles ifi',
  ],
  fiscal_optimization: [
    'optimisation fiscale', 'reduire impot', 'economie impot', 'defiscalisation',
    'niche fiscale', 'reduction impot', 'credit impot', 'strategie fiscale',
    'optimiser', 'baisser impot', 'payer moins',
  ],
  capital_gains: [
    'plus-value', 'plus value', 'pv immobiliere', 'pv mobiliere', 'cession',
    'abattement duree', '22 ans', '30 ans', 'surtaxe pv', 'capital gain',
  ],
  retirement_planning: [
    'retraite', 'pension', 'per', 'perp', 'madelin', 'trimestre', 'taux plein',
    'age legal', 'agirc', 'arrco', 'gap retraite', 'depart retraite', 'surcote', 'decote',
  ],
  estate_planning: [
    'succession', 'heritage', 'transmission deces', 'droits succession', 'dmtg',
    'heritier', 'conjoint survivant', 'reserve hereditaire', 'quotite disponible',
  ],
  donation_strategy: [
    'donation', 'donner', 'liberalite', 'donation partage', 'nue propriete',
    'demembrement', 'dutreil', 'abattement donation', '100000', 'don familial',
    '790g', 'usufruit',
  ],
  real_estate_investment: [
    'immobilier', 'lmnp', 'lmp', 'scpi', 'pinel', 'deficit foncier', 'sci',
    'location', 'locatif', 'rendement locatif', 'bien immobilier', 'investir immobilier',
    'ptz', 'emprunt immobilier', 'opci', 'denormandie',
  ],
  life_insurance: [
    'assurance vie', 'av', 'rachat', 'fonds euros', 'uc', '990i', '757b',
    'beneficiaire', 'clause beneficiaire', 'arbitrage', 'contrat vie',
    '152500', '30500', '8 ans',
  ],
  savings_investment: [
    'epargne', 'placement', 'pea', 'cto', 'livret', 'enveloppe', 'investir',
    'rendement', 'comparaison', 'meilleur placement', 'diversifier',
    'epargne salariale', 'pee', 'perco', 'interessement', 'participation',
  ],
  corporate_finance: [
    'holding', 'is', 'impot societes', 'dividende', 'cession entreprise',
    '150-0 b ter', 'apport cession', 'obo', 'bspce', 'actions gratuites',
    'management package', 'integration fiscale', 'mere fille', 'dirigeant',
    'remuneration', 'tns salarie', 'statut dirigeant',
  ],
  social_protection: [
    'prevoyance', 'incapacite', 'invalidite', 'ij', 'indemnites journalieres',
    'protection', 'homme cle', 'garantie deces', 'rente education',
    'mutuelle', 'protection sociale', 'couverture tns',
  ],
  regulatory_compliance: [
    'dda', 'mif2', 'mifid', 'lcb-ft', 'blanchiment', 'tracfin', 'rgpd',
    'cnil', 'devoir conseil', 'adequation', 'cif', 'iobsp', 'ias',
    'orias', 'amf', 'acpr', 'reglementation', 'conformite', 'formation',
  ],
  client_analysis: [
    'profil client', 'analyse profil', 'bilan patrimonial', 'audit',
    'situation client', 'recueil', 'diagnostic', 'score', 'preconisation',
  ],
  market_analysis: [
    'marche', 'actions', 'obligations', 'etf', 'private equity', 'pe',
    'produit structure', 'allocation actifs', 'diversification', 'volatilite',
    'rendement', 'risque', 'sharpe', 'benchmark', 'indice', 'bourse',
  ],
  debt_financing: [
    'emprunt', 'credit', 'pret', 'capacite emprunt', 'endettement', 'hcsf',
    'mensualite', 'taux credit', 'amortissement', 'assurance emprunteur',
    'refinancement', 'rachat credit', 'effet levier', 'ptz',
  ],
  international_tax: [
    'expatrie', 'non resident', 'convention fiscale', 'double imposition',
    'exit tax', 'impatriation', 'international', 'etranger', 'offshore',
    'trust', 'residence fiscale', 'source france',
  ],
  general_advice: [
    'conseil', 'recommandation', 'avis', 'que faire', 'comment', 'meilleur',
    'strategie', 'patrimoine', 'global',
  ],
}

/**
 * Détecte les intentions d'une requête (peut en retourner plusieurs)
 */
export function detectIntents(query: string): { intents: QueryIntent[]; primary: QueryIntent; confidence: number } {
  const normalizedQuery = query
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  const scores: Record<string, number> = {}

  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
    let score = 0
    for (const pattern of patterns) {
      const normalizedPattern = pattern.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      if (normalizedQuery.includes(normalizedPattern)) {
        // Bonus pour les patterns multi-mots (plus spécifiques)
        score += normalizedPattern.split(' ').length >= 2 ? 3 : 1.5
      }
    }
    if (score > 0) scores[intent] = score
  }

  const sorted = Object.entries(scores)
    .sort(([, a], [, b]) => b - a)

  if (sorted.length === 0) {
    return { intents: ['general_advice'], primary: 'general_advice', confidence: 0.3 }
  }

  const maxScore = sorted[0][1]
  const intents = sorted
    .filter(([, score]) => score >= maxScore * 0.5)
    .map(([intent]) => intent as QueryIntent)

  return {
    intents,
    primary: sorted[0][0] as QueryIntent,
    confidence: Math.min(maxScore / 10, 1),
  }
}

// ============================================================================
// EXTRACTION D'ENTITÉS
// ============================================================================

/**
 * Extrait les entités structurées d'une requête
 */
export function extractEntities(query: string): ExtractedEntities {
  const entities: ExtractedEntities = {
    amounts: [],
    ages: [],
    durations: [],
    taxRates: [],
    products: [],
    legalArticles: [],
    familyStatus: null,
    professionalStatus: null,
    investmentTypes: [],
    years: [],
  }

  // ── Montants (€, euros, k€, M€) ──
  const amountPatterns = [
    /(\d[\d\s]*(?:\.\d+)?)\s*(?:€|euros?|eur)/gi,
    /(\d[\d\s]*)\s*k€/gi,
    /(\d[\d\s]*(?:\.\d+)?)\s*(?:millions?|m€)/gi,
  ]
  for (const pattern of amountPatterns) {
    let match
    while ((match = pattern.exec(query)) !== null) {
      let val = parseFloat(match[1].replace(/\s/g, ''))
      if (match[0].toLowerCase().includes('k')) val *= 1000
      if (match[0].toLowerCase().includes('m') || match[0].toLowerCase().includes('million')) val *= 1_000_000
      entities.amounts.push(val)
    }
  }

  // ── Âges ──
  const agePattern = /(\d{2})\s*ans/gi
  let ageMatch
  while ((ageMatch = agePattern.exec(query)) !== null) {
    const age = parseInt(ageMatch[1])
    if (age >= 18 && age <= 100) entities.ages.push(age)
  }

  // ── Durées ──
  const durationPattern = /(\d{1,2})\s*ans/gi
  let durMatch
  while ((durMatch = durationPattern.exec(query)) !== null) {
    const dur = parseInt(durMatch[1])
    if (dur >= 1 && dur <= 50) entities.durations.push(dur)
  }

  // ── Taux ──
  const ratePattern = /(\d{1,2}(?:[.,]\d{1,2})?)\s*%/g
  let rateMatch
  while ((rateMatch = ratePattern.exec(query)) !== null) {
    entities.taxRates.push(parseFloat(rateMatch[1].replace(',', '.')))
  }

  // ── Articles de loi ──
  const articlePatterns = [
    /art(?:icle)?\.?\s*(\d{1,4}(?:\s*[-–]\d+)?(?:\s*(?:bis|ter|quater|quinquies|sexies|septies|octies|nonies|decies|undecies|duodecies|terdecies|quaterdecies|quindecies|sexdecies|septdecies|octodecies|novodecies|vicies|quatervicies))?)\s*(?:du\s*)?(?:cgi|cgct|css|code civil|cc)/gi,
    /(\d{3,4}\s*(?:i|ii|iii)?\s*(?:bis|ter)?)\s*cgi/gi,
    /(\d{3}[-–]\d+\s*[a-z]?)\s*cgi/gi,
  ]
  for (const pattern of articlePatterns) {
    let match
    while ((match = pattern.exec(query)) !== null) {
      entities.legalArticles.push(match[1].trim())
    }
  }

  // ── Années ──
  const yearPattern = /\b(20[2-3]\d)\b/g
  let yearMatch
  while ((yearMatch = yearPattern.exec(query)) !== null) {
    entities.years.push(parseInt(yearMatch[1]))
  }

  // ── Statut familial ──
  const queryLower = query.toLowerCase()
  if (/c[ée]libataire/.test(queryLower)) entities.familyStatus = 'celibataire'
  else if (/mari[ée]|pacs[ée]|couple/.test(queryLower)) entities.familyStatus = 'couple'
  else if (/divorc[ée]|s[ée]par[ée]/.test(queryLower)) entities.familyStatus = 'divorce'
  else if (/veuf|veuve/.test(queryLower)) entities.familyStatus = 'veuf'
  if (/parent isol[ée]/.test(queryLower)) entities.familyStatus = 'parent_isole'

  // ── Statut professionnel ──
  if (/tns|ind[ée]pendant|lib[ée]ral|auto[- ]?entrepreneur|micro[- ]?entreprise/.test(queryLower)) {
    entities.professionalStatus = 'tns'
  } else if (/salari[ée]|cadre|employ[ée]/.test(queryLower)) {
    entities.professionalStatus = 'salarie'
  } else if (/dirigeant|g[ée]rant|pr[ée]sident|dg/.test(queryLower)) {
    entities.professionalStatus = 'dirigeant'
  } else if (/retrait[ée]|pension|senior/.test(queryLower)) {
    entities.professionalStatus = 'retraite'
  } else if (/fonctionnaire|public/.test(queryLower)) {
    entities.professionalStatus = 'fonctionnaire'
  }

  // ── Types d'investissement mentionnés ──
  const investmentKeywords = [
    'lmnp', 'lmp', 'scpi', 'opci', 'sci', 'pinel', 'pea', 'cto',
    'assurance vie', 'per', 'fonds euros', 'etf', 'actions', 'obligations',
    'private equity', 'produit structure', 'crowdfunding', 'fcpi', 'fip',
    'girardin', 'sofica', 'foret', 'viager',
  ]
  for (const kw of investmentKeywords) {
    if (queryLower.includes(kw)) entities.investmentTypes.push(kw)
  }

  // ── Produits mentionnés ──
  const productKeywords = [
    'per individuel', 'per collectif', 'per obligatoire', 'perin', 'percol', 'pero',
    'pee', 'perco', 'contrat madelin', 'art 83',
    'pea', 'pea-pme', 'compte titres',
    'livret a', 'ldds', 'lep', 'cel', 'pel',
    'contrat de capitalisation', 'bon de capitalisation',
  ]
  for (const p of productKeywords) {
    if (queryLower.includes(p)) entities.products.push(p)
  }

  return entities
}

// ============================================================================
// ANALYSE COMPLÈTE D'UNE REQUÊTE
// ============================================================================

/**
 * Analyse complète d'une requête utilisateur
 * Retourne tokens, intentions, entités, expansion synonymes, suggestion web
 */
export function analyzeQuery(query: string): QueryAnalysis {
  const normalizedQuery = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const tokens = tokenize(query)
  const expandedTokens = expandWithSynonyms(tokens)
  const { intents, primary, confidence } = detectIntents(query)
  const entities = extractEntities(query)

  // Déterminer si une recherche web est nécessaire
  const webIndicators = [
    'actualite', 'nouveau', 'recent', 'reforme', 'changement',
    '2026', 'loi de finances', 'plf', 'plfss', 'lfss',
    'jurisprudence', 'arret', 'decision', 'tribunal',
    'taux directeur', 'bce', 'inflation', 'livret a taux',
    'rendement fonds euros', 'oat', 'meilleur', 'classement',
    'projet de loi', 'futur', 'prevision', 'va changer',
  ]
  const needsWeb = webIndicators.some(ind =>
    normalizedQuery.includes(ind.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
  )

  // Construire une requête web optimisée
  const webQueryParts = [query.trim()]
  if (primary !== 'general_advice') {
    webQueryParts.push('France 2025 2026')
    if (['income_tax', 'wealth_tax', 'fiscal_optimization', 'capital_gains'].includes(primary)) {
      webQueryParts.push('fiscalité CGI')
    }
    if (['estate_planning', 'donation_strategy'].includes(primary)) {
      webQueryParts.push('droits mutation')
    }
    if (primary === 'regulatory_compliance') {
      webQueryParts.push('réglementation AMF ACPR')
    }
  }

  return {
    originalQuery: query,
    normalizedQuery,
    tokens,
    expandedTokens,
    intents,
    primaryIntent: primary,
    entities,
    confidenceScore: confidence,
    suggestedWebQuery: webQueryParts.join(' '),
    needsWebSearch: needsWeb,
  }
}

// ============================================================================
// SCORING MULTI-CRITÈRES
// ============================================================================

export interface MultiScoreResult {
  bm25Score: number
  keywordScore: number
  intentBoost: number
  profileBoost: number
  crossRefBoost: number
  totalScore: number
}

/**
 * Score multi-critères combinant BM25, keywords, intention et profil pro
 */
export function computeMultiScore(params: {
  bm25Score: number
  keywordMatchCount: number
  queryIntents: QueryIntent[]
  chunkCategories: string[]
  chunkRelatedIds?: string[]
  matchedRelatedIds?: string[]
  professionalProfile?: ProfessionalProfile
  chunkProfessionalRelevance?: ProfessionalProfile[]
  chunkDifficulty?: ChunkDifficulty
}): MultiScoreResult {
  const {
    bm25Score,
    keywordMatchCount,
    queryIntents,
    chunkCategories,
    chunkRelatedIds = [],
    matchedRelatedIds = [],
    professionalProfile = 'cgp',
    chunkProfessionalRelevance = [],
    chunkDifficulty = 'intermediate',
  } = params

  // 1. Score BM25 normalisé (0-10)
  const normalizedBM25 = Math.min(bm25Score * 2, 10)

  // 2. Score keywords (bonus pour les matchs multiples)
  const keywordScore = Math.min(keywordMatchCount * 0.8, 5)

  // 3. Boost d'intention : si la catégorie du chunk correspond à l'intent détecté
  const intentCategoryMap: Record<string, string[]> = {
    income_tax: ['fiscalite-ir', 'fiscalite-ps'],
    wealth_tax: ['fiscalite-ifi'],
    fiscal_optimization: ['fiscalite-ir', 'fiscalite-ifi', 'fiscalite-ps', 'fiscalite-pv', 'fiscalite-revenus-capitaux', 'enveloppes-fiscales', 'defiscalisation'],
    capital_gains: ['fiscalite-pv', 'fiscalite-revenus-capitaux'],
    retirement_planning: ['retraite', 'epargne-retraite'],
    estate_planning: ['succession-donation', 'demembrement', 'transmission'],
    donation_strategy: ['succession-donation', 'demembrement', 'transmission'],
    real_estate_investment: ['immobilier', 'immobilier-locatif', 'immobilier-financement'],
    life_insurance: ['assurance-vie'],
    savings_investment: ['enveloppes-fiscales', 'epargne', 'marches-financiers'],
    corporate_finance: ['entreprise-dirigeant', 'corporate'],
    social_protection: ['protection-prevoyance'],
    regulatory_compliance: ['reglementation', 'conformite'],
    client_analysis: ['general', 'audit'],
    market_analysis: ['marches-financiers', 'allocation'],
    debt_financing: ['budget-endettement', 'immobilier-financement'],
    international_tax: ['fiscalite-internationale'],
    general_advice: [],
  }

  let intentBoost = 0
  for (const intent of queryIntents) {
    const matchingCategories = intentCategoryMap[intent] || []
    for (const cat of chunkCategories) {
      if (matchingCategories.includes(cat)) {
        intentBoost += 2.5
        break
      }
    }
  }
  intentBoost = Math.min(intentBoost, 5)

  // 4. Boost de profil professionnel
  let profileBoost = 0
  if (chunkProfessionalRelevance.length > 0) {
    if (chunkProfessionalRelevance.includes(professionalProfile)) {
      profileBoost = 2
    } else if (chunkProfessionalRelevance.includes('general') || chunkProfessionalRelevance.includes('cgp')) {
      profileBoost = 1
    }
  } else {
    profileBoost = 1 // Pas de restriction = pertinent pour tous
  }

  // Bonus difficulté selon le profil
  if (professionalProfile === 'tax_specialist' && chunkDifficulty === 'expert') profileBoost += 0.5
  if (professionalProfile === 'general' && chunkDifficulty === 'basic') profileBoost += 0.5

  // 5. Boost de cross-références
  const crossRefBoost = Math.min(matchedRelatedIds.filter(id => chunkRelatedIds.includes(id)).length * 1.5, 3)

  // Score total pondéré
  const totalScore = normalizedBM25 * 0.35 + keywordScore * 0.25 + intentBoost * 0.2 + profileBoost * 0.1 + crossRefBoost * 0.1

  return {
    bm25Score: normalizedBM25,
    keywordScore,
    intentBoost,
    profileBoost,
    crossRefBoost,
    totalScore,
  }
}
