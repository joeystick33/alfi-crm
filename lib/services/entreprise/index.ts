/**
 * ══════════════════════════════════════════════════════════════════════════════
 * SERVICE ENTREPRISE - INDEX
 * 
 * Service unifié pour les données d'entreprises françaises :
 * - API SIRENE (données de base)
 * - API RNE INPI (comptes annuels, dirigeants)
 * - Enrichissement et analyse
 * - Conventions collectives
 * ══════════════════════════════════════════════════════════════════════════════
 */

// Export du service unifié (API recherche-entreprises + INPI)
export {
  getEntreprise,
  searchEntreprises,
  calculateFinancialRatios,
  entrepriseToClientData,
  pappersToClientData,
  formatSiren as formatSirenUnifie,
  formatSiret as formatSiretUnifie,
  isValidSiren,
  isValidSiret,
  type EntrepriseEnrichie,
  type EntrepriseSearchResult,
  type DirigeantFormate,
  type BeneficiaireEffectif,
  type CompteAnnuelINPI,
  // Aliases compatibilité anciens noms
  type PappersEntreprise,
  type PappersDirigeant,
  type PappersBeneficiaire,
  type PappersFinances,
  type PappersSearchResult,
} from './entreprise-service'

export {
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
  type Entreprise,
  type Etablissement,
  type Dirigeant,
  type DirigeantPP,
  type DirigeantPM,
  type Finances,
  type Complements,
  type RechercheResult,
  type RechercheOptions,
} from './api-sirene'

export {
  EnrichissementService,
  calculerScoreFinancier,
  detecterAlertes,
  analyserSecteur,
  extraireLabels,
  genererProfilEntreprise,
  type ScoreFinancier,
  type AlerteEntreprise,
  type AnalyseSectorielle,
  type ProfilEntreprise,
} from './enrichissement'

export {
  rechercherConventionParNAF,
  calculerObligations,
  genererAnalyseCommerciale,
  genererProfilSocial,
  rechercherConventionAPI,
  getConventionByIDCC,
  type ConventionCollective,
  type ObligationsSociales,
  type ObligationDetail,
  type AnalyseCommerciale,
  type OpportuniteDetectee,
  type AlerteObligatoire,
  type ProfilSocialComplet,
} from './conventions'

import { APISirene } from './api-sirene'
import { EnrichissementService } from './enrichissement'
import Conventions from './conventions'

/**
 * Service unifié pour la gestion des entreprises
 */
const EntrepriseService = {
  // API SIRENE
  ...APISirene,
  
  // Enrichissement
  ...EnrichissementService,
  
  // Conventions & Obligations sociales
  ...Conventions,
}

export default EntrepriseService
