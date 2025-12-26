/**
 * ══════════════════════════════════════════════════════════════════════════════
 * SERVICE ENTREPRISE UNIFIÉ
 * 
 * Combine :
 * - API recherche-entreprises.api.gouv.fr (gratuite, sans clé)
 * - API RNE INPI pour les comptes annuels détaillés (bilans)
 * 
 * Configuration requise (.env) - uniquement pour INPI :
 * - INPI_USERNAME
 * - INPI_PASSWORD
 * ══════════════════════════════════════════════════════════════════════════════
 */

import {
  rechercherParSiren,
  rechercherParSiret,
  rechercherParNom,
  rechercherEntreprise,
  getLibelleNatureJuridique,
  getLibelleTrancheEffectifs,
  getLibelleSectionActivite,
  formatSiren,
  formatSiret,
  validerSiren,
  validerSiret,
  detecterTypeRecherche,
  TRANCHES_EFFECTIFS,
  type Entreprise,
  type Dirigeant,
  type DirigeantPP,
  type Etablissement,
  type Finances,
} from './api-sirene'

// ══════════════════════════════════════════════════════════════════════════════
// TYPES ENRICHIS
// ══════════════════════════════════════════════════════════════════════════════

export interface CompteAnnuelINPI {
  annee: number
  date_cloture?: string
  duree_exercice?: number
  chiffre_affaires?: number
  resultat_net?: number
  effectif_moyen?: number
  total_bilan?: number
  fonds_propres?: number
  dettes?: number
  tresorerie?: number
  capitaux_propres?: number
}

export interface BeneficiaireEffectif {
  nom: string
  prenom?: string
  nationalite?: string
  pourcentage_parts?: number
  pourcentage_votes?: number
  date_naissance?: string
}

export interface EntrepriseEnrichie {
  // Données de base (API recherche-entreprises)
  siren: string
  siret_siege: string
  denomination: string
  nom_commercial?: string
  forme_juridique: string
  forme_juridique_code?: string
  date_creation?: string
  date_creation_formate?: string
  entreprise_cessee: boolean
  date_cessation?: string
  
  // Effectifs
  tranche_effectif?: string
  tranche_effectif_code?: string
  effectif_estime?: number
  annee_effectif?: string
  categorie_entreprise?: string
  
  // Activité
  code_naf?: string
  libelle_naf?: string
  section_activite?: string
  libelle_section_activite?: string
  
  // Siège social
  siege: {
    siret: string
    adresse_complete: string
    adresse_ligne_1?: string
    adresse_ligne_2?: string
    code_postal?: string
    ville?: string
    departement?: string
    region?: string
    latitude?: string
    longitude?: string
  }
  
  // Établissements
  nombre_etablissements: number
  nombre_etablissements_ouverts: number
  
  // Dirigeants (API recherche-entreprises)
  dirigeants: DirigeantFormate[]
  
  // Bénéficiaires effectifs (API INPI)
  beneficiaires_effectifs?: BeneficiaireEffectif[]
  
  // Finances (API recherche-entreprises + enrichi INPI)
  finances_api?: Finances
  comptes_annuels?: CompteAnnuelINPI[]
  derniers_chiffres?: {
    chiffre_affaires?: number
    resultat_net?: number
    effectif?: number
    annee?: number
  }
  
  // Ratios calculés
  ratios?: {
    marge_nette?: number
    croissance_ca?: number
    taux_endettement?: number
  }
  
  // Compléments
  complements: {
    est_ess?: boolean
    est_association?: boolean
    est_entrepreneur_individuel?: boolean
    est_service_public?: boolean
    est_qualiopi?: boolean
    est_rge?: boolean
    est_bio?: boolean
    convention_collective?: string[]
  }
  
  // Liens externes
  liens: {
    pappers: string
    infogreffe: string
    bodacc: string
    societe_com: string
  }
  
  // Métadonnées
  source: 'api-gouv' | 'api-gouv+inpi' | 'fallback'
  date_maj: string
}

export interface DirigeantFormate {
  nom: string
  prenom?: string
  qualite: string
  type: 'personne_physique' | 'personne_morale'
  date_naissance?: string
  nationalite?: string
  siren_pm?: string
  denomination_pm?: string
}

export interface EntrepriseSearchResult {
  siren: string
  siret?: string
  denomination: string
  forme_juridique?: string
  code_naf?: string
  libelle_naf?: string
  ville?: string
  code_postal?: string
  entreprise_cessee: boolean
  categorie_entreprise?: string
}

// ══════════════════════════════════════════════════════════════════════════════
// API INPI RNE (comptes annuels) - DÉSACTIVÉE
// L'API INPI a évolué et nécessite maintenant un token web ou accès SFTP
// Les données financières de base sont disponibles via l'API recherche-entreprises
// ══════════════════════════════════════════════════════════════════════════════

// Note: L'API INPI https://data.inpi.fr/api/login n'existe plus (404)
// Pour des comptes annuels détaillés, utiliser:
// - L'interface web data.inpi.fr
// - L'accès SFTP (bulk download)
// - L'API Pappers (payante mais complète)

/**
 * Placeholder - API INPI désactivée
 * Retourne toujours null car l'ancien endpoint n'existe plus
 */
async function getInpiToken(): Promise<string | null> {
  // API INPI modifiée - l'endpoint /api/login n'existe plus
  // Les données financières de base sont disponibles via l'API gouv
  return null
}

/**
 * Récupère les comptes annuels - DÉSACTIVÉ (API INPI modifiée)
 * Retourne un tableau vide - les données financières de base viennent de l'API gouv
 */
async function fetchInpiComptesAnnuels(_siren: string): Promise<CompteAnnuelINPI[]> {
  // API INPI modifiée - retourne toujours vide
  // Les données financières basiques sont dans entreprise.finances_api
  return []
}

/**
 * Récupère les bénéficiaires effectifs - DÉSACTIVÉ (API INPI modifiée)
 */
async function fetchInpiBeneficiaires(_siren: string): Promise<BeneficiaireEffectif[]> {
  // API INPI modifiée - retourne toujours vide
  return []
}

// ══════════════════════════════════════════════════════════════════════════════
// FONCTIONS PRINCIPALES
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Récupère les informations complètes d'une entreprise
 * Combine API recherche-entreprises + INPI
 */
export async function getEntreprise(sirenOrSiret: string): Promise<EntrepriseEnrichie> {
  const cleanId = sirenOrSiret.replace(/\s/g, '')
  const type = detecterTypeRecherche(cleanId)
  
  // Récupérer les données de base via API recherche-entreprises
  let entreprise: Entreprise | null = null
  
  if (type === 'siret') {
    entreprise = await rechercherParSiret(cleanId)
  } else {
    const siren = cleanId.slice(0, 9)
    entreprise = await rechercherParSiren(siren)
  }
  
  if (!entreprise) {
    throw new Error(`Entreprise non trouvée: ${sirenOrSiret}`)
  }
  
  const siren = entreprise.siren
  
  // Enrichir avec INPI (comptes annuels + bénéficiaires) en parallèle
  const [comptesAnnuels, beneficiaires] = await Promise.all([
    fetchInpiComptesAnnuels(siren),
    fetchInpiBeneficiaires(siren),
  ])
  
  // Transformer les dirigeants
  const dirigeants = formatDirigeants(entreprise.dirigeants || [])
  
  // Estimer l'effectif
  const trancheInfo = TRANCHES_EFFECTIFS[entreprise.tranche_effectif_salarie || '']
  const effectifEstime = trancheInfo 
    ? Math.round((trancheInfo.min + trancheInfo.max) / 2)
    : undefined
  
  // Calculer les ratios à partir des comptes annuels INPI
  const ratios = calculateRatios(comptesAnnuels)
  
  // Derniers chiffres (priorité INPI, sinon API gouv)
  const derniers_chiffres = getDerniersChiffres(comptesAnnuels, entreprise.finances)
  
  // Construire l'objet enrichi
  const result: EntrepriseEnrichie = {
    siren,
    siret_siege: entreprise.siege.siret,
    denomination: entreprise.nom_complet,
    nom_commercial: entreprise.sigle || undefined,
    forme_juridique: getLibelleNatureJuridique(entreprise.nature_juridique || ''),
    forme_juridique_code: entreprise.nature_juridique,
    date_creation: entreprise.date_creation,
    date_creation_formate: entreprise.date_creation 
      ? formatDateFr(entreprise.date_creation) 
      : undefined,
    entreprise_cessee: entreprise.etat_administratif === 'C',
    date_cessation: entreprise.date_fermeture,
    
    tranche_effectif: getLibelleTrancheEffectifs(entreprise.tranche_effectif_salarie || ''),
    tranche_effectif_code: entreprise.tranche_effectif_salarie,
    effectif_estime: effectifEstime,
    annee_effectif: entreprise.annee_tranche_effectif_salarie,
    categorie_entreprise: entreprise.categorie_entreprise,
    
    code_naf: entreprise.activite_principale,
    libelle_naf: entreprise.activite_principale 
      ? getLibelleActivite(entreprise.activite_principale) 
      : undefined,
    section_activite: entreprise.section_activite_principale,
    libelle_section_activite: entreprise.section_activite_principale 
      ? getLibelleSectionActivite(entreprise.section_activite_principale) 
      : undefined,
    
    siege: {
      siret: entreprise.siege.siret,
      adresse_complete: entreprise.siege.adresse,
      adresse_ligne_1: buildAdresseLigne1(entreprise.siege),
      adresse_ligne_2: entreprise.siege.complement_adresse,
      code_postal: entreprise.siege.code_postal,
      ville: entreprise.siege.libelle_commune,
      departement: entreprise.siege.departement,
      region: entreprise.siege.region,
      latitude: entreprise.siege.latitude,
      longitude: entreprise.siege.longitude,
    },
    
    nombre_etablissements: entreprise.nombre_etablissements,
    nombre_etablissements_ouverts: entreprise.nombre_etablissements_ouverts,
    
    dirigeants,
    beneficiaires_effectifs: beneficiaires.length > 0 ? beneficiaires : undefined,
    
    finances_api: entreprise.finances,
    comptes_annuels: comptesAnnuels.length > 0 ? comptesAnnuels : undefined,
    derniers_chiffres,
    ratios,
    
    complements: {
      est_ess: entreprise.complements?.est_ess,
      est_association: entreprise.complements?.est_association,
      est_entrepreneur_individuel: entreprise.complements?.est_entrepreneur_individuel,
      est_service_public: entreprise.complements?.est_service_public,
      est_qualiopi: entreprise.complements?.est_qualiopi,
      est_rge: entreprise.complements?.est_rge,
      est_bio: entreprise.complements?.est_bio,
      convention_collective: entreprise.complements?.liste_idcc,
    },
    
    liens: {
      pappers: `https://www.pappers.fr/entreprise/${siren}`,
      infogreffe: `https://www.infogreffe.fr/entreprise-societe/${siren}`,
      bodacc: `https://www.bodacc.fr/pages/annonces-commerciales/?q.registre=RCS&q.siren=${siren}`,
      societe_com: `https://www.societe.com/cgi-bin/search?champs=${siren}`,
    },
    
    source: comptesAnnuels.length > 0 ? 'api-gouv+inpi' : 'api-gouv',
    date_maj: new Date().toISOString(),
  }
  
  return result
}

/**
 * Recherche d'entreprises
 */
export async function searchEntreprises(query: string): Promise<EntrepriseSearchResult[]> {
  if (query.length < 2) return []
  
  const type = detecterTypeRecherche(query)
  
  // Recherche par SIREN/SIRET direct
  if (type === 'siren' || type === 'siret') {
    const result = await rechercherEntreprise(query, { per_page: 1 })
    return result.results.map(mapToSearchResult)
  }
  
  // Recherche textuelle
  const entreprises = await rechercherParNom(query, { 
    per_page: 15,
    etat_administratif: 'A', // Actives par défaut
  })
  
  return entreprises.map(mapToSearchResult)
}

// ══════════════════════════════════════════════════════════════════════════════
// FONCTIONS UTILITAIRES
// ══════════════════════════════════════════════════════════════════════════════

function mapToSearchResult(e: Entreprise): EntrepriseSearchResult {
  return {
    siren: e.siren,
    siret: e.siege?.siret,
    denomination: e.nom_complet,
    forme_juridique: e.nature_juridique 
      ? getLibelleNatureJuridique(e.nature_juridique) 
      : undefined,
    code_naf: e.activite_principale,
    libelle_naf: e.activite_principale 
      ? getLibelleActivite(e.activite_principale) 
      : undefined,
    ville: e.siege?.libelle_commune,
    code_postal: e.siege?.code_postal,
    entreprise_cessee: e.etat_administratif === 'C',
    categorie_entreprise: e.categorie_entreprise,
  }
}

function formatDirigeants(dirigeants: Dirigeant[]): DirigeantFormate[] {
  return dirigeants.map(d => {
    if (d.type_dirigeant === 'personne physique') {
      const pp = d as DirigeantPP
      return {
        nom: pp.nom,
        prenom: pp.prenoms,
        qualite: pp.qualite,
        type: 'personne_physique' as const,
        date_naissance: pp.date_de_naissance || pp.annee_de_naissance,
        nationalite: pp.nationalite,
      }
    } else {
      return {
        nom: d.denomination,
        qualite: d.qualite,
        type: 'personne_morale' as const,
        siren_pm: d.siren,
        denomination_pm: d.denomination,
      }
    }
  })
}

function buildAdresseLigne1(siege: Etablissement): string {
  return [
    siege.numero_voie,
    siege.type_voie,
    siege.libelle_voie,
  ].filter(Boolean).join(' ')
}

function formatDateFr(dateIso: string): string {
  if (!dateIso) return ''
  const [year, month, day] = dateIso.split('-')
  if (!year || !month || !day) return dateIso
  return `${day}/${month}/${year}`
}

function calculateRatios(comptes: CompteAnnuelINPI[]): EntrepriseEnrichie['ratios'] {
  if (comptes.length === 0) return undefined
  
  const latest = comptes[0]
  const previous = comptes[1]
  
  const ratios: EntrepriseEnrichie['ratios'] = {}
  
  // Marge nette
  if (latest.chiffre_affaires && latest.resultat_net) {
    ratios.marge_nette = Math.round((latest.resultat_net / latest.chiffre_affaires) * 10000) / 100
  }
  
  // Croissance CA
  if (previous?.chiffre_affaires && latest.chiffre_affaires) {
    ratios.croissance_ca = Math.round(
      ((latest.chiffre_affaires - previous.chiffre_affaires) / previous.chiffre_affaires) * 10000
    ) / 100
  }
  
  // Taux d'endettement
  if (latest.fonds_propres && latest.dettes && latest.fonds_propres > 0) {
    ratios.taux_endettement = Math.round((latest.dettes / latest.fonds_propres) * 10000) / 100
  }
  
  return Object.keys(ratios).length > 0 ? ratios : undefined
}

function getDerniersChiffres(
  comptesInpi: CompteAnnuelINPI[], 
  financesApi?: Finances
): EntrepriseEnrichie['derniers_chiffres'] {
  // Priorité aux comptes INPI (plus détaillés)
  if (comptesInpi.length > 0) {
    const latest = comptesInpi[0]
    return {
      chiffre_affaires: latest.chiffre_affaires,
      resultat_net: latest.resultat_net,
      effectif: latest.effectif_moyen,
      annee: latest.annee,
    }
  }
  
  // Fallback sur API gouv
  if (financesApi) {
    const annees = Object.keys(financesApi).sort().reverse()
    if (annees.length > 0) {
      const latestYear = annees[0]
      const data = financesApi[latestYear]
      return {
        chiffre_affaires: data.ca,
        resultat_net: data.resultat_net,
        annee: parseInt(latestYear, 10),
      }
    }
  }
  
  return undefined
}

// Codes NAF courants
const LIBELLES_NAF: Record<string, string> = {
  '62.01Z': 'Programmation informatique',
  '62.02A': 'Conseil en systèmes et logiciels informatiques',
  '62.02B': 'Tierce maintenance informatique',
  '62.03Z': 'Gestion d\'installations informatiques',
  '62.09Z': 'Autres activités informatiques',
  '63.11Z': 'Traitement de données, hébergement',
  '63.12Z': 'Portails Internet',
  '64.19Z': 'Autres intermédiations monétaires',
  '64.20Z': 'Activités des sociétés holding',
  '66.22Z': 'Courtage d\'assurances',
  '66.30Z': 'Gestion de fonds',
  '68.10Z': 'Marchands de biens immobiliers',
  '68.20A': 'Location de logements',
  '68.20B': 'Location de biens immobiliers',
  '68.31Z': 'Agences immobilières',
  '68.32A': 'Administration d\'immeubles',
  '68.32B': 'Gestion de patrimoine mobilier',
  '69.10Z': 'Activités juridiques',
  '69.20Z': 'Activités comptables',
  '70.10Z': 'Activités des sièges sociaux',
  '70.21Z': 'Conseil en relations publiques',
  '70.22Z': 'Conseil de gestion',
  '73.11Z': 'Activités des agences de publicité',
  '74.10Z': 'Activités spécialisées de design',
  '74.90B': 'Activités techniques diverses',
  '82.11Z': 'Services administratifs de bureau',
  '82.99Z': 'Autres activités de soutien aux entreprises',
  '85.59A': 'Formation continue d\'adultes',
  '86.21Z': 'Activité des médecins généralistes',
  '86.22C': 'Activités des médecins spécialistes',
  '86.23Z': 'Pratique dentaire',
  '94.99Z': 'Autres organisations associatives',
}

function getLibelleActivite(codeNaf: string): string {
  return LIBELLES_NAF[codeNaf] || ''
}

// ══════════════════════════════════════════════════════════════════════════════
// FONCTION DE CONVERSION POUR LE CRM
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Convertit les données entreprise en format client CRM
 */
export function entrepriseToClientData(entreprise: EntrepriseEnrichie) {
  const dirigeantPrincipal = entreprise.dirigeants?.[0]
  
  return {
    companyName: entreprise.denomination,
    siren: entreprise.siren,
    siret: entreprise.siret_siege,
    legalForm: entreprise.forme_juridique,
    activitySector: entreprise.libelle_naf || entreprise.code_naf,
    codeNAF: entreprise.code_naf,
    companyCreationDate: entreprise.date_creation,
    numberOfEmployees: entreprise.effectif_estime,
    annualRevenue: entreprise.derniers_chiffres?.chiffre_affaires,
    
    address: {
      street: entreprise.siege.adresse_ligne_1,
      complement: entreprise.siege.adresse_ligne_2,
      postalCode: entreprise.siege.code_postal,
      city: entreprise.siege.ville,
      country: 'France',
    },
    
    firstName: dirigeantPrincipal?.prenom || '',
    lastName: dirigeantPrincipal?.nom || '',
    
    entrepriseData: {
      liens: entreprise.liens,
      entreprise_cessee: entreprise.entreprise_cessee,
      dirigeants: entreprise.dirigeants,
      beneficiaires: entreprise.beneficiaires_effectifs,
      derniers_chiffres: entreprise.derniers_chiffres,
      ratios: entreprise.ratios,
      comptes_annuels: entreprise.comptes_annuels?.slice(0, 5),
      complements: entreprise.complements,
      source: entreprise.source,
      date_maj: entreprise.date_maj,
    }
  }
}

/**
 * Calcule les ratios financiers (exporté pour compatibilité)
 */
export function calculateFinancialRatios(comptes: CompteAnnuelINPI[]) {
  return calculateRatios(comptes)
}

// ══════════════════════════════════════════════════════════════════════════════
// RÉEXPORTS POUR COMPATIBILITÉ
// ══════════════════════════════════════════════════════════════════════════════

export {
  formatSiren,
  formatSiret,
  validerSiren as isValidSiren,
  validerSiret as isValidSiret,
}

// Aliases pour compatibilité avec l'ancien nom "Pappers"
export type PappersEntreprise = EntrepriseEnrichie
export type PappersDirigeant = DirigeantFormate
export type PappersBeneficiaire = BeneficiaireEffectif
export type PappersFinances = CompteAnnuelINPI
export type PappersSearchResult = EntrepriseSearchResult

export const pappersToClientData = entrepriseToClientData
