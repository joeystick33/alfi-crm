/**
 * ══════════════════════════════════════════════════════════════════════════════
 * API RECHERCHE D'ENTREPRISES (SIRENE)
 * Source : recherche-entreprises.api.gouv.fr
 * Données officielles INSEE + INPI + DGFiP
 * API 100% gratuite et ouverte
 * ══════════════════════════════════════════════════════════════════════════════
 */

const API_BASE_URL = 'https://recherche-entreprises.api.gouv.fr'

// ══════════════════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════════════════

export interface DirigeantPP {
  type_dirigeant: 'personne physique'
  nom: string
  prenoms: string
  annee_de_naissance?: string
  date_de_naissance?: string
  qualite: string
  nationalite?: string
}

export interface DirigeantPM {
  type_dirigeant: 'personne morale'
  siren: string
  denomination: string
  qualite: string
}

export type Dirigeant = DirigeantPP | DirigeantPM

export interface Finances {
  [annee: string]: {
    ca?: number
    resultat_net?: number
  }
}

export interface Etablissement {
  siret: string
  est_siege: boolean
  activite_principale?: string
  adresse: string
  numero_voie?: string
  type_voie?: string
  libelle_voie?: string
  complement_adresse?: string
  code_postal?: string
  commune?: string
  libelle_commune?: string
  departement?: string
  region?: string
  latitude?: string
  longitude?: string
  date_creation?: string
  date_fermeture?: string
  etat_administratif: string
  tranche_effectif_salarie?: string
  caractere_employeur?: string
  liste_enseignes?: string[]
  liste_idcc?: string[]
  liste_finess?: string[]
  liste_rge?: string[]
  liste_uai?: string[]
}

export interface Complements {
  convention_collective_renseignee?: boolean
  liste_idcc?: string[]
  egapro_renseignee?: boolean
  est_association?: boolean
  identifiant_association?: string
  est_entrepreneur_individuel?: boolean
  est_ess?: boolean
  est_service_public?: boolean
  est_societe_mission?: boolean
  est_rge?: boolean
  est_bio?: boolean
  est_qualiopi?: boolean
  est_organisme_formation?: boolean
  est_entrepreneur_spectacle?: boolean
  est_patrimoine_vivant?: boolean
  est_finess?: boolean
  est_uai?: boolean
  bilan_ges_renseigne?: boolean
  est_achats_responsables?: boolean
  est_siae?: boolean
  type_siae?: string
}

export interface Entreprise {
  siren: string
  nom_complet: string
  nom_raison_sociale?: string
  sigle?: string
  nombre_etablissements: number
  nombre_etablissements_ouverts: number
  siege: Etablissement
  date_creation?: string
  date_fermeture?: string
  etat_administratif: string
  nature_juridique?: string
  activite_principale?: string
  section_activite_principale?: string
  tranche_effectif_salarie?: string
  annee_tranche_effectif_salarie?: string
  categorie_entreprise?: string
  annee_categorie_entreprise?: string
  caractere_employeur?: string
  statut_diffusion?: string
  dirigeants?: Dirigeant[]
  finances?: Finances
  complements?: Complements
  matching_etablissements?: Etablissement[]
}

export interface RechercheResult {
  results: Entreprise[]
  total_results: number
  page: number
  per_page: number
  total_pages: number
}

export interface RechercheOptions {
  page?: number
  per_page?: number
  etat_administratif?: 'A' | 'C'  // A=Actif, C=Cessé
  nature_juridique?: string
  activite_principale?: string
  section_activite_principale?: string
  departement?: string
  region?: string
  code_postal?: string
  categorie_entreprise?: 'PME' | 'ETI' | 'GE'
  est_entrepreneur_individuel?: boolean
  est_association?: boolean
  est_ess?: boolean
}

// ══════════════════════════════════════════════════════════════════════════════
// FONCTIONS DE RECHERCHE
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Recherche d'entreprises par texte (nom, SIREN, SIRET, dirigeant)
 */
export async function rechercherEntreprise(
  query: string,
  options: RechercheOptions = {}
): Promise<RechercheResult> {
  const params = new URLSearchParams()
  params.set('q', query)
  params.set('page', String(options.page || 1))
  params.set('per_page', String(Math.min(options.per_page || 10, 25)))
  
  // Filtres optionnels
  if (options.etat_administratif) params.set('etat_administratif', options.etat_administratif)
  if (options.nature_juridique) params.set('nature_juridique', options.nature_juridique)
  if (options.activite_principale) params.set('activite_principale', options.activite_principale)
  if (options.section_activite_principale) params.set('section_activite_principale', options.section_activite_principale)
  if (options.departement) params.set('departement', options.departement)
  if (options.region) params.set('region', options.region)
  if (options.code_postal) params.set('code_postal', options.code_postal)
  if (options.categorie_entreprise) params.set('categorie_entreprise', options.categorie_entreprise)
  if (options.est_entrepreneur_individuel !== undefined) {
    params.set('est_entrepreneur_individuel', String(options.est_entrepreneur_individuel))
  }
  if (options.est_association !== undefined) {
    params.set('est_association', String(options.est_association))
  }
  if (options.est_ess !== undefined) {
    params.set('est_ess', String(options.est_ess))
  }
  
  const response = await fetch(`${API_BASE_URL}/search?${params.toString()}`)
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.erreur || `Erreur API SIRENE: ${response.status}`)
  }
  
  return response.json()
}

/**
 * Recherche par SIREN uniquement (9 chiffres)
 */
export async function rechercherParSiren(siren: string): Promise<Entreprise | null> {
  // Nettoyer le SIREN (espaces, tirets)
  const sirenClean = siren.replace(/[\s-]/g, '')
  
  if (!/^\d{9}$/.test(sirenClean)) {
    throw new Error('Le SIREN doit contenir exactement 9 chiffres')
  }
  
  const result = await rechercherEntreprise(sirenClean, { per_page: 1 })
  return result.results[0] || null
}

/**
 * Recherche par SIRET uniquement (14 chiffres)
 */
export async function rechercherParSiret(siret: string): Promise<Entreprise | null> {
  // Nettoyer le SIRET (espaces, tirets)
  const siretClean = siret.replace(/[\s-]/g, '')
  
  if (!/^\d{14}$/.test(siretClean)) {
    throw new Error('Le SIRET doit contenir exactement 14 chiffres')
  }
  
  const result = await rechercherEntreprise(siretClean, { per_page: 1 })
  return result.results[0] || null
}

/**
 * Recherche par nom d'entreprise (autocomplétion)
 */
export async function rechercherParNom(
  nom: string,
  options: RechercheOptions = {}
): Promise<Entreprise[]> {
  if (nom.length < 2) return []
  
  const result = await rechercherEntreprise(nom, {
    ...options,
    etat_administratif: options.etat_administratif || 'A', // Par défaut, seulement les actives
    per_page: options.per_page || 10,
  })
  
  return result.results
}

/**
 * Recherche géographique autour d'un point
 */
export async function rechercherProximite(
  latitude: number,
  longitude: number,
  options: {
    radius?: number  // km, max 50
    activite_principale?: string
    section_activite_principale?: string
    page?: number
    per_page?: number
  } = {}
): Promise<RechercheResult> {
  const params = new URLSearchParams()
  params.set('lat', String(latitude))
  params.set('long', String(longitude))
  params.set('radius', String(Math.min(options.radius || 5, 50)))
  params.set('page', String(options.page || 1))
  params.set('per_page', String(Math.min(options.per_page || 10, 25)))
  
  if (options.activite_principale) params.set('activite_principale', options.activite_principale)
  if (options.section_activite_principale) params.set('section_activite_principale', options.section_activite_principale)
  
  const response = await fetch(`${API_BASE_URL}/near_point?${params.toString()}`)
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.erreur || `Erreur API SIRENE: ${response.status}`)
  }
  
  return response.json()
}

// ══════════════════════════════════════════════════════════════════════════════
// UTILITAIRES
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Mapping des codes nature juridique vers libellés
 */
export const NATURES_JURIDIQUES: Record<string, string> = {
  '1000': 'Entrepreneur individuel',
  '5498': 'EURL',
  '5499': 'Société à responsabilité limitée (sans autre indication)',
  '5510': 'Société anonyme',
  '5515': 'SA à conseil d\'administration',
  '5520': 'SA à directoire',
  '5530': 'SA nationale',
  '5532': 'SA d\'économie mixte',
  '5560': 'SA coopérative',
  '5599': 'SA (sans autre indication)',
  '5610': 'SCA',
  '5710': 'SAS',
  '5720': 'SASU',
  '5800': 'Société européenne',
  '6100': 'Caisse d\'épargne',
  '6210': 'SICAV',
  '6220': 'FCP',
  '6310': 'GIE',
  '6411': 'Société civile immobilière',
  '6521': 'SCPI',
  '6532': 'SCI de location',
  '6533': 'SCI d\'attribution',
  '6534': 'SCI d\'accession',
  '6540': 'Société civile professionnelle',
  '6599': 'Société civile (sans autre indication)',
  '7112': 'Ministère',
  '7120': 'Service central d\'un ministère',
  '7150': 'Service déconcentré',
  '7160': 'Collectivité territoriale',
  '7210': 'Commune',
  '7220': 'Département',
  '7225': 'DOM',
  '7229': 'Collectivité d\'outre-mer',
  '7230': 'Région',
  '7312': 'Communauté de communes',
  '7313': 'Communauté d\'agglomération',
  '7314': 'Métropole',
  '7321': 'EPA national',
  '7322': 'EPA local',
  '7331': 'EPIC national',
  '7332': 'EPIC local',
  '7340': 'Groupement d\'intérêt public',
  '7341': 'GIP national',
  '7342': 'GIP local',
  '7343': 'Groupement de coopération sanitaire',
  '7344': 'Établissement public de santé',
  '7345': 'Centre hospitalier régional',
  '7346': 'Centre hospitalier',
  '7347': 'Centre hospitalier spécialisé',
  '7348': 'EHPAD public',
  '8110': 'Régime général de sécurité sociale',
  '8210': 'Institution de prévoyance',
  '8250': 'Assurance maladie',
  '8290': 'Organisme mutualiste',
  '8410': 'Syndicat de salariés',
  '8420': 'Syndicat patronal',
  '8430': 'Ordre professionnel',
  '8450': 'Syndicat de copropriétaires',
  '8470': 'Parti politique',
  '9110': 'Syndicat de communes',
  '9150': 'Association syndicale autorisée',
  '9210': 'Association non déclarée',
  '9220': 'Association déclarée',
  '9221': 'Association déclarée d\'insertion',
  '9222': 'Association intermédiaire',
  '9223': 'Groupement d\'employeurs',
  '9224': 'Association d\'avocats',
  '9230': 'Association déclarée reconnue d\'utilité publique',
  '9240': 'Congrégation',
  '9260': 'Association de droit local',
  '9300': 'Fondation',
  '9900': 'Autre personne morale de droit privé',
}

/**
 * Mapping des tranches d'effectifs
 */
export const TRANCHES_EFFECTIFS: Record<string, { label: string; min: number; max: number }> = {
  'NN': { label: 'Non employeur', min: 0, max: 0 },
  '00': { label: '0 salarié', min: 0, max: 0 },
  '01': { label: '1-2 salariés', min: 1, max: 2 },
  '02': { label: '3-5 salariés', min: 3, max: 5 },
  '03': { label: '6-9 salariés', min: 6, max: 9 },
  '11': { label: '10-19 salariés', min: 10, max: 19 },
  '12': { label: '20-49 salariés', min: 20, max: 49 },
  '21': { label: '50-99 salariés', min: 50, max: 99 },
  '22': { label: '100-199 salariés', min: 100, max: 199 },
  '31': { label: '200-249 salariés', min: 200, max: 249 },
  '32': { label: '250-499 salariés', min: 250, max: 499 },
  '41': { label: '500-999 salariés', min: 500, max: 999 },
  '42': { label: '1000-1999 salariés', min: 1000, max: 1999 },
  '51': { label: '2000-4999 salariés', min: 2000, max: 4999 },
  '52': { label: '5000-9999 salariés', min: 5000, max: 9999 },
  '53': { label: '10000+ salariés', min: 10000, max: Infinity },
}

/**
 * Mapping des sections d'activité
 */
export const SECTIONS_ACTIVITE: Record<string, string> = {
  'A': 'Agriculture, sylviculture et pêche',
  'B': 'Industries extractives',
  'C': 'Industrie manufacturière',
  'D': 'Production et distribution d\'électricité, gaz, vapeur',
  'E': 'Production et distribution d\'eau, assainissement',
  'F': 'Construction',
  'G': 'Commerce, réparation automobiles',
  'H': 'Transports et entreposage',
  'I': 'Hébergement et restauration',
  'J': 'Information et communication',
  'K': 'Activités financières et d\'assurance',
  'L': 'Activités immobilières',
  'M': 'Activités spécialisées, scientifiques et techniques',
  'N': 'Activités de services administratifs',
  'O': 'Administration publique',
  'P': 'Enseignement',
  'Q': 'Santé humaine et action sociale',
  'R': 'Arts, spectacles et activités récréatives',
  'S': 'Autres activités de services',
  'T': 'Activités des ménages',
  'U': 'Activités extra-territoriales',
}

/**
 * Obtenir le libellé de la forme juridique
 */
export function getLibelleNatureJuridique(code: string): string {
  return NATURES_JURIDIQUES[code] || `Code ${code}`
}

/**
 * Obtenir le libellé de la tranche d'effectifs
 */
export function getLibelleTrancheEffectifs(code: string): string {
  return TRANCHES_EFFECTIFS[code]?.label || 'Non renseigné'
}

/**
 * Obtenir le libellé de la section d'activité
 */
export function getLibelleSectionActivite(code: string): string {
  return SECTIONS_ACTIVITE[code] || code
}

/**
 * Formater un SIREN (XXX XXX XXX)
 */
export function formatSiren(siren: string): string {
  const clean = siren.replace(/\D/g, '')
  return clean.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3')
}

/**
 * Formater un SIRET (XXX XXX XXX XXXXX)
 */
export function formatSiret(siret: string): string {
  const clean = siret.replace(/\D/g, '')
  return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{5})/, '$1 $2 $3 $4')
}

/**
 * Valider un numéro SIREN (algorithme Luhn)
 */
export function validerSiren(siren: string): boolean {
  const clean = siren.replace(/\D/g, '')
  if (clean.length !== 9) return false
  
  let sum = 0
  for (let i = 0; i < 9; i++) {
    let digit = parseInt(clean[i], 10)
    if (i % 2 === 1) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
  }
  return sum % 10 === 0
}

/**
 * Valider un numéro SIRET
 */
export function validerSiret(siret: string): boolean {
  const clean = siret.replace(/\D/g, '')
  if (clean.length !== 14) return false
  
  // Le SIREN (9 premiers chiffres) doit être valide
  // Et le SIRET complet doit passer l'algorithme Luhn
  let sum = 0
  for (let i = 0; i < 14; i++) {
    let digit = parseInt(clean[i], 10)
    if (i % 2 === 0) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
  }
  return sum % 10 === 0
}

/**
 * Détecter si une chaîne est un SIREN, SIRET ou texte libre
 */
export function detecterTypeRecherche(query: string): 'siren' | 'siret' | 'texte' {
  const clean = query.replace(/[\s-]/g, '')
  if (/^\d{14}$/.test(clean)) return 'siret'
  if (/^\d{9}$/.test(clean)) return 'siren'
  return 'texte'
}

// ══════════════════════════════════════════════════════════════════════════════
// EXPORT DU SERVICE
// ══════════════════════════════════════════════════════════════════════════════

export const APISirene = {
  // Recherche
  rechercher: rechercherEntreprise,
  rechercherParSiren,
  rechercherParSiret,
  rechercherParNom,
  rechercherProximite,
  
  // Utilitaires
  getLibelleNatureJuridique,
  getLibelleTrancheEffectifs,
  getLibelleSectionActivite,
  formatSiren,
  formatSiret,
  validerSiren,
  validerSiret,
  detecterTypeRecherche,
  
  // Références
  NATURES_JURIDIQUES,
  TRANCHES_EFFECTIFS,
  SECTIONS_ACTIVITE,
}

export default APISirene
