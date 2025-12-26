/**
 * ══════════════════════════════════════════════════════════════════════════════
 * SERVICES UNIFIÉS - INDEX PRINCIPAL
 * Point d'entrée unique pour tous les services externes du CRM
 * 
 * APIs utilisées :
 * - SIRENE (recherche-entreprises.api.gouv.fr) - 100% gratuit
 * - BAN (api-adresse.data.gouv.fr) - 100% gratuit
 * - Géo (geo.api.gouv.fr) - 100% gratuit
 * - Conventions collectives - Données locales
 * ══════════════════════════════════════════════════════════════════════════════
 */

// ══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ══════════════════════════════════════════════════════════════════════════════

export { API_CONFIG, ENV_KEYS, isApiEnabled } from './api-config'

// ══════════════════════════════════════════════════════════════════════════════
// SERVICE ENTREPRISE (API SIRENE + Enrichissement + Conventions)
// ══════════════════════════════════════════════════════════════════════════════

export {
  // API SIRENE
  APISirene,
  rechercherEntreprise,
  rechercherParSiren,
  rechercherParSiret,
  rechercherParNom,
  rechercherProximite,
  validerSiren,
  validerSiret,
  formatSiren,
  formatSiret,
  detecterTypeRecherche,
  getLibelleNatureJuridique,
  getLibelleTrancheEffectifs,
  getLibelleSectionActivite,
  NATURES_JURIDIQUES,
  TRANCHES_EFFECTIFS,
  SECTIONS_ACTIVITE,
  
  // Enrichissement
  EnrichissementService,
  calculerScoreFinancier,
  detecterAlertes,
  analyserSecteur,
  extraireLabels,
  genererProfilEntreprise,
  
  // Conventions
  rechercherConventionParNAF,
  calculerObligations,
  genererAnalyseCommerciale,
  genererProfilSocial,
  rechercherConventionAPI,
  getConventionByIDCC,
  
  // Types
  type Entreprise,
  type Etablissement,
  type Dirigeant,
  type DirigeantPP,
  type DirigeantPM,
  type Finances,
  type Complements,
  type RechercheResult,
  type RechercheOptions,
  type ScoreFinancier,
  type AlerteEntreprise,
  type AnalyseSectorielle,
  type ProfilEntreprise,
  type ConventionCollective,
  type ObligationsSociales,
  type ObligationDetail,
  type AnalyseCommerciale,
  type OpportuniteDetectee,
  type AlerteObligatoire,
  type ProfilSocialComplet,
} from './entreprise'

export { default as EntrepriseService } from './entreprise'

// ══════════════════════════════════════════════════════════════════════════════
// SERVICE ADRESSE (API BAN + Zones PTZ + Enrichissement)
// ══════════════════════════════════════════════════════════════════════════════

export {
  // API BAN
  APIAdresseBAN,
  
  // Enrichissement
  enrichirAdresse,
  rechercherAdresseEnrichie,
  validerAdresseProjet,
  getResumeAidesAdresse,
  
  // Types
  type AdresseResult,
  type AdresseSearchParams,
  type AdresseEnrichie,
  type AdresseProjet,
} from './adresse'

export { default as AdresseService } from './adresse'

// ══════════════════════════════════════════════════════════════════════════════
// SERVICE AIDES LOCALES (ANIL + DGFiP + Cache)
// ══════════════════════════════════════════════════════════════════════════════

export {
  // Services
  ANILService,
  DGFiPService,
  CacheFichier,
  
  // Simulation
  simulerAides,
  
  // Types
  type AideLocale,
  type AideLocaleRecherche,
  type CommuneInfo,
  type PlafondsFiscaux,
  type SimulationAidesResult,
} from './aides-locales'

export { default as AidesLocalesService } from './aides-locales'

// ══════════════════════════════════════════════════════════════════════════════
// SERVICE KYC (Orchestration complète)
// ══════════════════════════════════════════════════════════════════════════════

export {
  enrichirEntrepriseBySiren,
  rechercherEtEnrichir,
  type KYCEntreprise,
  type KYCOptions,
} from './kyc'

export { default as KYCService } from './kyc'

// ══════════════════════════════════════════════════════════════════════════════
// SERVICE UNIFIÉ
// ══════════════════════════════════════════════════════════════════════════════

import EntrepriseService from './entreprise'
import AdresseService from './adresse'
import AidesLocalesService from './aides-locales'
import KYCService from './kyc'
import { API_CONFIG, isApiEnabled } from './api-config'

/**
 * Point d'accès unifié à tous les services externes
 */
const Services = {
  /** Configuration des APIs */
  config: API_CONFIG,
  
  /** Vérifier si une API est activée */
  isApiEnabled,
  
  /** Service Entreprise (SIRENE + Enrichissement + Conventions) */
  Entreprise: EntrepriseService,
  
  /** Service Adresse (BAN + PTZ + Aides) */
  Adresse: AdresseService,
  
  /** Service Aides Locales (ANIL + DGFiP) */
  AidesLocales: AidesLocalesService,
  
  /** Service KYC (Orchestration complète) */
  KYC: KYCService,
}

export default Services
