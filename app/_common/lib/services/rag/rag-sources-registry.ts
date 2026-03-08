/**
 * RAG Sources Registry — Registre complet des sources juridiques, fiscales et patrimoniales FR
 * 
 * 60+ sources classées par catégorie, avec :
 *   - URL de base et endpoint de recherche
 *   - Score de fiabilité (0-1)
 *   - Type de contenu
 *   - Fréquence de mise à jour
 *   - Disponibilité API / RSS / scraping
 * 
 * Utilisé par le legal connector et le web search pour prioriser les sources.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface SourceDefinition {
  id: string
  name: string
  url: string
  /** URL de recherche (si différente de l'URL de base) */
  searchUrl?: string
  /** Score de fiabilité/autorité (0-1) */
  quality: number
  /** Type de source */
  type: SourceType
  /** Catégorie thématique */
  category: SourceCategory
  /** Sous-catégories */
  tags: string[]
  /** Fréquence de mise à jour typique */
  updateFrequency: UpdateFrequency
  /** Méthode d'accès disponible */
  accessMethods: AccessMethod[]
  /** URL du flux RSS si disponible */
  rssUrl?: string
  /** URL de l'API si disponible */
  apiUrl?: string
  /** Variables d'env requises pour l'API */
  requiredEnvVars?: string[]
  /** Description courte */
  description: string
}

export type SourceType =
  | 'official'       // Source officielle étatique
  | 'regulator'      // Autorité de régulation
  | 'institution'    // Institution publique
  | 'professional'   // Organisation professionnelle
  | 'publisher'      // Éditeur juridique/fiscal spécialisé
  | 'press'          // Presse spécialisée
  | 'data'           // Données ouvertes

export type SourceCategory =
  | 'legislation'    // Textes de loi, codes
  | 'fiscal'         // Fiscalité, impôts
  | 'social'         // Protection sociale, retraite
  | 'markets'        // Marchés financiers, régulation
  | 'insurance'      // Assurance, prévoyance
  | 'real_estate'    // Immobilier
  | 'notarial'       // Notariat, transmission
  | 'compliance'     // Conformité, RGPD, LCB-FT
  | 'economy'        // Économie, conjoncture
  | 'patrimoine'     // Gestion de patrimoine (éditeurs)
  | 'jurisprudence'  // Décisions de justice
  | 'general'        // Informations générales

export type UpdateFrequency =
  | 'realtime'       // Mises à jour en continu
  | 'daily'          // Quotidien
  | 'weekly'         // Hebdomadaire
  | 'monthly'        // Mensuel
  | 'quarterly'      // Trimestriel
  | 'annual'         // Annuel

export type AccessMethod =
  | 'api'            // API REST
  | 'rss'            // Flux RSS/Atom
  | 'scraping'       // Scraping HTML
  | 'download'       // Téléchargement fichier
  | 'websearch'      // Via moteur de recherche

// ============================================================================
// REGISTRE DES SOURCES
// ============================================================================

export const SOURCES_REGISTRY: SourceDefinition[] = [
  // ══════════════════════════════════════════════════════════════════════════
  // SOURCES OFFICIELLES ÉTATIQUES
  // ══════════════════════════════════════════════════════════════════════════

  {
    id: 'legifrance',
    name: 'Legifrance',
    url: 'https://www.legifrance.gouv.fr',
    searchUrl: 'https://www.legifrance.gouv.fr/search',
    quality: 1.0,
    type: 'official',
    category: 'legislation',
    tags: ['codes', 'lois', 'decrets', 'jurisprudence', 'jorf', 'cgi', 'code-civil'],
    updateFrequency: 'daily',
    accessMethods: ['api', 'rss', 'scraping'],
    apiUrl: 'https://api.piste.gouv.fr/dila/legifrance/lf-engine-app',
    rssUrl: 'https://www.legifrance.gouv.fr/rss/lastUpdate.do',
    requiredEnvVars: ['LEGIFRANCE_CLIENT_ID', 'LEGIFRANCE_CLIENT_SECRET'],
    description: 'Portail officiel du droit français : codes, lois, décrets, jurisprudence, JORF',
  },
  {
    id: 'bofip',
    name: 'BOFIP — Bulletin Officiel des Finances Publiques',
    url: 'https://bofip.impots.gouv.fr',
    searchUrl: 'https://bofip.impots.gouv.fr/bofip/resultats',
    quality: 1.0,
    type: 'official',
    category: 'fiscal',
    tags: ['doctrine-fiscale', 'instructions', 'rescrits', 'ir', 'is', 'tva', 'ifi', 'dmtg'],
    updateFrequency: 'weekly',
    accessMethods: ['scraping', 'websearch'],
    description: 'Doctrine fiscale officielle : instructions, rescrits, commentaires des textes fiscaux',
  },
  {
    id: 'impots-gouv',
    name: 'impots.gouv.fr',
    url: 'https://www.impots.gouv.fr',
    searchUrl: 'https://www.impots.gouv.fr/recherche',
    quality: 1.0,
    type: 'official',
    category: 'fiscal',
    tags: ['particuliers', 'professionnels', 'bareme', 'declaration', 'simulateurs'],
    updateFrequency: 'weekly',
    accessMethods: ['scraping', 'websearch'],
    description: 'Site officiel des impôts : fiches pratiques, simulateurs, barèmes',
  },
  {
    id: 'service-public',
    name: 'Service-public.fr',
    url: 'https://www.service-public.fr',
    searchUrl: 'https://www.service-public.fr/particuliers/recherche',
    quality: 0.95,
    type: 'official',
    category: 'general',
    tags: ['droits', 'demarches', 'fiches-pratiques', 'particuliers', 'professionnels'],
    updateFrequency: 'weekly',
    accessMethods: ['scraping', 'websearch'],
    description: 'Fiches pratiques sur les droits et démarches des particuliers et professionnels',
  },
  {
    id: 'economie-gouv',
    name: 'economie.gouv.fr',
    url: 'https://www.economie.gouv.fr',
    quality: 0.95,
    type: 'official',
    category: 'economy',
    tags: ['economie', 'budget', 'plf', 'reformes', 'conjoncture'],
    updateFrequency: 'daily',
    accessMethods: ['rss', 'websearch'],
    rssUrl: 'https://www.economie.gouv.fr/rss',
    description: 'Ministère de l\'Économie : actualités, PLF, réformes économiques',
  },
  {
    id: 'jorf',
    name: 'Journal Officiel de la République Française',
    url: 'https://journal-officiel.gouv.fr',
    quality: 1.0,
    type: 'official',
    category: 'legislation',
    tags: ['lois', 'decrets', 'ordonnances', 'arretes', 'avis'],
    updateFrequency: 'daily',
    accessMethods: ['rss', 'websearch'],
    rssUrl: 'https://journal-officiel.gouv.fr/rss/lois-et-decrets.xml',
    description: 'Publication officielle des lois, décrets et arrêtés',
  },
  {
    id: 'data-gouv',
    name: 'data.gouv.fr',
    url: 'https://www.data.gouv.fr',
    searchUrl: 'https://www.data.gouv.fr/api/1/datasets/',
    quality: 0.90,
    type: 'data',
    category: 'general',
    tags: ['open-data', 'statistiques', 'baremes', 'donnees-publiques'],
    updateFrequency: 'monthly',
    accessMethods: ['api', 'download'],
    apiUrl: 'https://www.data.gouv.fr/api/1/',
    description: 'Plateforme open data du gouvernement français',
  },
  {
    id: 'vie-publique',
    name: 'vie-publique.fr',
    url: 'https://www.vie-publique.fr',
    quality: 0.85,
    type: 'official',
    category: 'general',
    tags: ['eclairages', 'dossiers', 'reformes', 'institutions'],
    updateFrequency: 'daily',
    accessMethods: ['rss', 'websearch'],
    rssUrl: 'https://www.vie-publique.fr/rss/actualites.xml',
    description: 'Éclairages sur les politiques publiques, réformes et institutions',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // PARLEMENTAIRES
  // ══════════════════════════════════════════════════════════════════════════

  {
    id: 'senat',
    name: 'Sénat',
    url: 'https://www.senat.fr',
    quality: 0.95,
    type: 'institution',
    category: 'legislation',
    tags: ['projets-loi', 'rapports', 'commissions', 'finances'],
    updateFrequency: 'daily',
    accessMethods: ['rss', 'websearch'],
    rssUrl: 'https://www.senat.fr/rss/projetsdeloi.xml',
    description: 'Sénat : projets de loi, rapports de commission, débats parlementaires',
  },
  {
    id: 'assemblee-nationale',
    name: 'Assemblée Nationale',
    url: 'https://www.assemblee-nationale.fr',
    quality: 0.95,
    type: 'institution',
    category: 'legislation',
    tags: ['projets-loi', 'amendements', 'debats', 'rapports'],
    updateFrequency: 'daily',
    accessMethods: ['rss', 'websearch'],
    rssUrl: 'https://www.assemblee-nationale.fr/rss/actualites.xml',
    description: 'Assemblée Nationale : travaux législatifs, amendements, rapports',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // RÉGULATEURS ET AUTORITÉS
  // ══════════════════════════════════════════════════════════════════════════

  {
    id: 'amf',
    name: 'Autorité des Marchés Financiers',
    url: 'https://www.amf-france.org',
    quality: 0.95,
    type: 'regulator',
    category: 'markets',
    tags: ['reglementation', 'sanctions', 'agrement', 'mif2', 'prospectus', 'opcvm', 'scpi'],
    updateFrequency: 'daily',
    accessMethods: ['rss', 'websearch'],
    rssUrl: 'https://www.amf-france.org/fr/rss/actualites',
    description: 'Régulateur des marchés financiers : agréments, sanctions, règlementation MIF2/DDA',
  },
  {
    id: 'acpr',
    name: 'ACPR — Autorité de Contrôle Prudentiel et de Résolution',
    url: 'https://acpr.banque-france.fr',
    quality: 0.95,
    type: 'regulator',
    category: 'insurance',
    tags: ['assurance', 'banque', 'controle', 'sanctions', 'dda', 'solvabilite'],
    updateFrequency: 'weekly',
    accessMethods: ['rss', 'websearch'],
    rssUrl: 'https://acpr.banque-france.fr/rss',
    description: 'Contrôle prudentiel banques et assurances : agréments, sanctions, rapports',
  },
  {
    id: 'banque-france',
    name: 'Banque de France',
    url: 'https://www.banque-france.fr',
    quality: 0.95,
    type: 'regulator',
    category: 'economy',
    tags: ['taux', 'inflation', 'statistiques', 'conjoncture', 'taux-usure', 'euribor'],
    updateFrequency: 'weekly',
    accessMethods: ['rss', 'websearch', 'api'],
    apiUrl: 'https://webstat.banque-france.fr/api/v1/',
    rssUrl: 'https://www.banque-france.fr/rss',
    description: 'Statistiques monétaires, taux d\'usure, conjoncture économique',
  },
  {
    id: 'cnil',
    name: 'CNIL',
    url: 'https://www.cnil.fr',
    quality: 0.90,
    type: 'regulator',
    category: 'compliance',
    tags: ['rgpd', 'donnees-personnelles', 'sanctions', 'recommandations'],
    updateFrequency: 'weekly',
    accessMethods: ['rss', 'websearch'],
    rssUrl: 'https://www.cnil.fr/fr/rss.xml',
    description: 'Protection des données personnelles : RGPD, sanctions, recommandations',
  },
  {
    id: 'tracfin',
    name: 'TRACFIN',
    url: 'https://www.economie.gouv.fr/tracfin',
    quality: 0.90,
    type: 'regulator',
    category: 'compliance',
    tags: ['lcb-ft', 'blanchiment', 'declaration-soupcon', 'gel-avoirs'],
    updateFrequency: 'quarterly',
    accessMethods: ['websearch'],
    description: 'Lutte contre le blanchiment : rapports, lignes directrices, typologies',
  },
  {
    id: 'orias',
    name: 'ORIAS',
    url: 'https://www.orias.fr',
    quality: 0.85,
    type: 'regulator',
    category: 'compliance',
    tags: ['iobsp', 'ias', 'cif', 'registre', 'intermediaires'],
    updateFrequency: 'monthly',
    accessMethods: ['websearch', 'api'],
    apiUrl: 'https://www.orias.fr/search',
    description: 'Registre des intermédiaires en assurance, banque et finance',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // PROTECTION SOCIALE & RETRAITE
  // ══════════════════════════════════════════════════════════════════════════

  {
    id: 'urssaf',
    name: 'URSSAF',
    url: 'https://www.urssaf.fr',
    quality: 0.90,
    type: 'official',
    category: 'social',
    tags: ['cotisations', 'tns', 'employeur', 'plafond-ss', 'pass'],
    updateFrequency: 'monthly',
    accessMethods: ['websearch'],
    description: 'Cotisations sociales, plafonds, barèmes TNS et employeurs',
  },
  {
    id: 'securite-sociale',
    name: 'securite-sociale.fr',
    url: 'https://www.securite-sociale.fr',
    quality: 0.90,
    type: 'official',
    category: 'social',
    tags: ['plfss', 'prestations', 'budget-social', 'couverture'],
    updateFrequency: 'monthly',
    accessMethods: ['websearch'],
    description: 'Budget de la Sécurité sociale, PLFSS, prestations',
  },
  {
    id: 'info-retraite',
    name: 'info-retraite.fr',
    url: 'https://www.info-retraite.fr',
    quality: 0.90,
    type: 'official',
    category: 'social',
    tags: ['retraite', 'trimestres', 'simulation', 'droits-retraite'],
    updateFrequency: 'monthly',
    accessMethods: ['websearch'],
    description: 'Information officielle retraite : simulateur, droits, conditions',
  },
  {
    id: 'agirc-arrco',
    name: 'Agirc-Arrco',
    url: 'https://www.agirc-arrco.fr',
    quality: 0.90,
    type: 'institution',
    category: 'social',
    tags: ['complementaire', 'points', 'retraite', 'valeur-point'],
    updateFrequency: 'quarterly',
    accessMethods: ['websearch'],
    description: 'Retraite complémentaire : valeur du point, conditions, simulateur',
  },
  {
    id: 'lassuranceretraite',
    name: 'L\'Assurance Retraite',
    url: 'https://www.lassuranceretraite.fr',
    quality: 0.90,
    type: 'official',
    category: 'social',
    tags: ['regime-general', 'pension', 'trimestres', 'age-legal'],
    updateFrequency: 'monthly',
    accessMethods: ['websearch'],
    description: 'Régime général de retraite : droits, pension, simulation',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // JURIDICTIONS
  // ══════════════════════════════════════════════════════════════════════════

  {
    id: 'cour-cassation',
    name: 'Cour de cassation',
    url: 'https://www.courdecassation.fr',
    quality: 0.95,
    type: 'institution',
    category: 'jurisprudence',
    tags: ['arrets', 'jurisprudence', 'pourvoi', 'chambre-civile', 'chambre-commerciale'],
    updateFrequency: 'weekly',
    accessMethods: ['rss', 'websearch'],
    rssUrl: 'https://www.courdecassation.fr/rss/arrets',
    description: 'Jurisprudence de la Cour de cassation : arrêts, avis, rapports',
  },
  {
    id: 'conseil-etat',
    name: 'Conseil d\'État',
    url: 'https://www.conseil-etat.fr',
    quality: 0.95,
    type: 'institution',
    category: 'jurisprudence',
    tags: ['decisions', 'avis', 'fiscal', 'contentieux-administratif'],
    updateFrequency: 'weekly',
    accessMethods: ['rss', 'websearch'],
    rssUrl: 'https://www.conseil-etat.fr/rss',
    description: 'Jurisprudence administrative et fiscale, avis sur les projets de loi',
  },
  {
    id: 'conseil-constitutionnel',
    name: 'Conseil constitutionnel',
    url: 'https://www.conseil-constitutionnel.fr',
    quality: 0.95,
    type: 'institution',
    category: 'jurisprudence',
    tags: ['qpc', 'constitutionnalite', 'decisions', 'loi-finances'],
    updateFrequency: 'monthly',
    accessMethods: ['websearch'],
    description: 'Décisions QPC, contrôle de constitutionnalité des lois de finances',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // ORGANISATIONS PROFESSIONNELLES
  // ══════════════════════════════════════════════════════════════════════════

  {
    id: 'notaires-fr',
    name: 'Notaires de France',
    url: 'https://www.notaires.fr',
    quality: 0.85,
    type: 'professional',
    category: 'notarial',
    tags: ['succession', 'donation', 'immobilier', 'mariage', 'frais-notaire', 'bareme'],
    updateFrequency: 'monthly',
    accessMethods: ['websearch'],
    description: 'Informations notariales : successions, donations, immobilier, simulateurs',
  },
  {
    id: 'cnb',
    name: 'Conseil National des Barreaux',
    url: 'https://www.cnb.avocat.fr',
    quality: 0.85,
    type: 'professional',
    category: 'legislation',
    tags: ['avocats', 'deontologie', 'honoraires'],
    updateFrequency: 'monthly',
    accessMethods: ['websearch'],
    description: 'Institution représentative de la profession d\'avocat',
  },
  {
    id: 'experts-comptables',
    name: 'Ordre des Experts-Comptables',
    url: 'https://www.experts-comptables.fr',
    quality: 0.85,
    type: 'professional',
    category: 'fiscal',
    tags: ['comptabilite', 'fiscalite-entreprise', 'normes', 'conseil'],
    updateFrequency: 'monthly',
    accessMethods: ['websearch'],
    description: 'Normes comptables, fiscalité d\'entreprise, outils et guides',
  },
  {
    id: 'anacofi',
    name: 'ANACOFI',
    url: 'https://www.anacofi.asso.fr',
    quality: 0.85,
    type: 'professional',
    category: 'patrimoine',
    tags: ['cif', 'cgp', 'reglementation', 'formation'],
    updateFrequency: 'monthly',
    accessMethods: ['websearch'],
    description: 'Association nationale des conseils financiers',
  },
  {
    id: 'cncgp',
    name: 'CNCGP — Chambre Nationale des CGP',
    url: 'https://www.cncgp.fr',
    quality: 0.85,
    type: 'professional',
    category: 'patrimoine',
    tags: ['cgp', 'reglementation', 'formation', 'deontologie'],
    updateFrequency: 'monthly',
    accessMethods: ['websearch'],
    description: 'Chambre syndicale des Conseils en Gestion de Patrimoine',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // ÉDITEURS JURIDIQUES ET FISCAUX SPÉCIALISÉS
  // ══════════════════════════════════════════════════════════════════════════

  {
    id: 'fidroit',
    name: 'Fidroit',
    url: 'https://www.fidroit.fr',
    quality: 0.85,
    type: 'publisher',
    category: 'patrimoine',
    tags: ['ingenierie-patrimoniale', 'fiscal', 'civil', 'social', 'outils-cgp'],
    updateFrequency: 'weekly',
    accessMethods: ['websearch'],
    description: 'Ingénierie patrimoniale : analyses juridiques et fiscales pour CGP',
  },
  {
    id: 'althemis',
    name: 'Althémis',
    url: 'https://www.althemis.fr',
    quality: 0.85,
    type: 'publisher',
    category: 'patrimoine',
    tags: ['chiffres-cles', 'baremes', 'patrimoine', 'fiscal'],
    updateFrequency: 'annual',
    accessMethods: ['websearch'],
    description: 'Chiffres-clés du patrimoine, barèmes fiscaux annuels',
  },
  {
    id: 'harvest',
    name: 'Harvest (BIG Expert)',
    url: 'https://www.harvest.fr',
    quality: 0.80,
    type: 'publisher',
    category: 'patrimoine',
    tags: ['logiciels-cgp', 'o2s', 'big-expert', 'simulations'],
    updateFrequency: 'monthly',
    accessMethods: ['websearch'],
    description: 'Éditeur d\'outils patrimoniaux (O2S, BIG Expert)',
  },
  {
    id: 'dalloz',
    name: 'Dalloz',
    url: 'https://www.dalloz.fr',
    quality: 0.80,
    type: 'publisher',
    category: 'legislation',
    tags: ['codes', 'revues', 'jurisprudence', 'doctrine'],
    updateFrequency: 'weekly',
    accessMethods: ['websearch'],
    description: 'Éditeur juridique de référence : codes, revues, actualités',
  },
  {
    id: 'efl',
    name: 'Éditions Francis Lefebvre',
    url: 'https://www.efl.fr',
    quality: 0.80,
    type: 'publisher',
    category: 'fiscal',
    tags: ['memento-fiscal', 'documentation', 'jurisprudence-commentee'],
    updateFrequency: 'weekly',
    accessMethods: ['websearch'],
    description: 'Mémento fiscal, social et comptable de référence',
  },
  {
    id: 'editions-legislatives',
    name: 'Éditions Législatives',
    url: 'https://www.editions-legislatives.fr',
    quality: 0.80,
    type: 'publisher',
    category: 'legislation',
    tags: ['social', 'immobilier', 'patrimoine', 'encyclopedies'],
    updateFrequency: 'weekly',
    accessMethods: ['websearch'],
    description: 'Encyclopédies et documentation juridique spécialisée',
  },
  {
    id: 'revue-fiduciaire',
    name: 'Groupe Revue Fiduciaire',
    url: 'https://www.grouperf.com',
    quality: 0.80,
    type: 'publisher',
    category: 'fiscal',
    tags: ['fiscal', 'social', 'patrimoine', 'actualite-fiscale'],
    updateFrequency: 'weekly',
    accessMethods: ['websearch'],
    description: 'Revue fiduciaire : actualité fiscale, sociale et patrimoniale',
  },
  {
    id: 'village-justice',
    name: 'Village de la Justice',
    url: 'https://www.village-justice.com',
    quality: 0.70,
    type: 'publisher',
    category: 'legislation',
    tags: ['articles', 'jurisprudence', 'pratique-pro', 'formations'],
    updateFrequency: 'daily',
    accessMethods: ['rss', 'websearch'],
    description: 'Communauté juridique : articles pratiques, jurisprudence commentée',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // PRESSE FINANCIÈRE ET PATRIMONIALE
  // ══════════════════════════════════════════════════════════════════════════

  {
    id: 'patrimoine-lesechos',
    name: 'Patrimoine — Les Echos',
    url: 'https://patrimoine.lesechos.fr',
    quality: 0.75,
    type: 'press',
    category: 'patrimoine',
    tags: ['patrimoine', 'placement', 'fiscalite', 'immobilier', 'succession'],
    updateFrequency: 'daily',
    accessMethods: ['rss', 'websearch'],
    description: 'Rubrique patrimoine des Echos : placements, fiscalité, transmission',
  },
  {
    id: 'investir-lesechos',
    name: 'Investir — Les Echos',
    url: 'https://investir.lesechos.fr',
    quality: 0.70,
    type: 'press',
    category: 'markets',
    tags: ['bourse', 'actions', 'fonds', 'etf', 'scpi', 'assurance-vie'],
    updateFrequency: 'daily',
    accessMethods: ['websearch'],
    description: 'Investissement et marchés financiers : analyses, recommandations',
  },
  {
    id: 'capital',
    name: 'Capital',
    url: 'https://www.capital.fr',
    quality: 0.65,
    type: 'press',
    category: 'patrimoine',
    tags: ['patrimoine', 'impots', 'immobilier', 'placements', 'retraite'],
    updateFrequency: 'daily',
    accessMethods: ['rss', 'websearch'],
    description: 'Magazine patrimoine grand public : impôts, immobilier, placements',
  },
  {
    id: 'mieux-vivre',
    name: 'Mieux Vivre Votre Argent',
    url: 'https://www.mieux-vivre-votre-argent.fr',
    quality: 0.65,
    type: 'press',
    category: 'patrimoine',
    tags: ['epargne', 'assurance-vie', 'immobilier', 'retraite'],
    updateFrequency: 'daily',
    accessMethods: ['websearch'],
    description: 'Épargne, assurance-vie, immobilier pour les particuliers',
  },
  {
    id: 'boursorama',
    name: 'Boursorama',
    url: 'https://www.boursorama.com',
    quality: 0.60,
    type: 'press',
    category: 'markets',
    tags: ['bourse', 'cours', 'indices', 'actualites-marches'],
    updateFrequency: 'realtime',
    accessMethods: ['websearch'],
    description: 'Cotations temps réel, actualités marchés financiers',
  },
  {
    id: 'lesechos',
    name: 'Les Echos',
    url: 'https://www.lesechos.fr',
    quality: 0.70,
    type: 'press',
    category: 'economy',
    tags: ['economie', 'politique', 'entreprises', 'finance'],
    updateFrequency: 'realtime',
    accessMethods: ['websearch'],
    description: 'Quotidien économique de référence',
  },
  {
    id: 'lefigaro-economie',
    name: 'Le Figaro Économie',
    url: 'https://www.lefigaro.fr/economie',
    quality: 0.65,
    type: 'press',
    category: 'economy',
    tags: ['economie', 'patrimoine', 'immobilier', 'impots'],
    updateFrequency: 'daily',
    accessMethods: ['websearch'],
    description: 'Actualité économique, patrimoniale et immobilière',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // IMMOBILIER
  // ══════════════════════════════════════════════════════════════════════════

  {
    id: 'immobilier-notaires',
    name: 'Immobilier Notaires',
    url: 'https://www.immobilier.notaires.fr',
    quality: 0.80,
    type: 'professional',
    category: 'real_estate',
    tags: ['prix-immobilier', 'indices', 'statistiques', 'notaires'],
    updateFrequency: 'quarterly',
    accessMethods: ['websearch'],
    description: 'Base de prix immobiliers des notaires, indices, statistiques',
  },
  {
    id: 'insee',
    name: 'INSEE',
    url: 'https://www.insee.fr',
    quality: 0.90,
    type: 'official',
    category: 'economy',
    tags: ['statistiques', 'inflation', 'irl', 'icc', 'indices', 'demographie'],
    updateFrequency: 'monthly',
    accessMethods: ['api', 'websearch'],
    apiUrl: 'https://api.insee.fr/series/BDM/V1/',
    description: 'Statistiques officielles : indices (IRL, ICC), inflation, démographie',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // SITES SPÉCIALISÉS PATRIMOINE / OUTILS
  // ══════════════════════════════════════════════════════════════════════════

  {
    id: 'finary',
    name: 'Finary — Blog',
    url: 'https://finary.com/fr/blog',
    quality: 0.60,
    type: 'press',
    category: 'patrimoine',
    tags: ['patrimoine', 'investissement', 'crypto', 'etf', 'immobilier'],
    updateFrequency: 'weekly',
    accessMethods: ['websearch'],
    description: 'Blog fintech patrimoine : guides investissement, comparatifs',
  },
  {
    id: 'avenue-des-investisseurs',
    name: 'Avenue des Investisseurs',
    url: 'https://avenuedesinvestisseurs.fr',
    quality: 0.65,
    type: 'press',
    category: 'patrimoine',
    tags: ['guides', 'assurance-vie', 'per', 'scpi', 'comparatifs'],
    updateFrequency: 'weekly',
    accessMethods: ['websearch'],
    description: 'Guides détaillés sur l\'investissement et la gestion de patrimoine',
  },
]

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

/**
 * Retourne les sources par catégorie
 */
export function getSourcesByCategory(category: SourceCategory): SourceDefinition[] {
  return SOURCES_REGISTRY.filter(s => s.category === category)
}

/**
 * Retourne les sources par type
 */
export function getSourcesByType(type: SourceType): SourceDefinition[] {
  return SOURCES_REGISTRY.filter(s => s.type === type)
}

/**
 * Retourne les sources qui ont un flux RSS
 */
export function getSourcesWithRSS(): SourceDefinition[] {
  return SOURCES_REGISTRY.filter(s => s.rssUrl)
}

/**
 * Retourne les sources qui ont une API
 */
export function getSourcesWithAPI(): SourceDefinition[] {
  return SOURCES_REGISTRY.filter(s => s.apiUrl)
}

/**
 * Retourne les sources les plus pertinentes pour un sujet donné
 */
export function findRelevantSources(query: string, maxResults: number = 10): SourceDefinition[] {
  const queryLower = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

  return SOURCES_REGISTRY
    .map(source => {
      let score = 0
      // Score par tags
      for (const tag of source.tags) {
        const tagNorm = tag.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        if (queryLower.includes(tagNorm)) score += 2
      }
      // Score par nom
      const nameNorm = source.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      if (queryLower.includes(nameNorm)) score += 3
      // Bonus qualité
      score += source.quality * 0.5

      return { source, score }
    })
    .filter(s => s.score > 0.5)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map(s => s.source)
}

/**
 * Statistiques du registre
 */
export function getRegistryStats(): {
  totalSources: number
  byType: Record<string, number>
  byCategory: Record<string, number>
  withApi: number
  withRss: number
} {
  const byType: Record<string, number> = {}
  const byCategory: Record<string, number> = {}
  let withApi = 0
  let withRss = 0

  for (const source of SOURCES_REGISTRY) {
    byType[source.type] = (byType[source.type] || 0) + 1
    byCategory[source.category] = (byCategory[source.category] || 0) + 1
    if (source.apiUrl) withApi++
    if (source.rssUrl) withRss++
  }

  return {
    totalSources: SOURCES_REGISTRY.length,
    byType,
    byCategory,
    withApi,
    withRss,
  }
}
