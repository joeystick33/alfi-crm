/**
 * Service Pappers - DEPRECATED
 * 
 * Ce module est conservé pour la compatibilité.
 * Utiliser plutôt @/lib/services/entreprise
 * 
 * Le service utilise maintenant :
 * - API recherche-entreprises.api.gouv.fr (gratuite, sans clé)
 * - API RNE INPI (comptes annuels détaillés)
 */

// Réexporter depuis le nouveau service entreprise
export {
  getEntreprise,
  searchEntreprises,
  calculateFinancialRatios,
  entrepriseToClientData,
  pappersToClientData,
  isValidSiren,
  isValidSiret,
  type EntrepriseEnrichie,
  type EntrepriseSearchResult,
  type DirigeantFormate,
  type BeneficiaireEffectif,
  type CompteAnnuelINPI,
  // Aliases compatibilité
  type PappersEntreprise,
  type PappersDirigeant,
  type PappersBeneficiaire,
  type PappersFinances,
  type PappersSearchResult,
} from '../entreprise/entreprise-service'

// Réexporter formatSiren/formatSiret depuis api-sirene
export { formatSiren, formatSiret } from '../entreprise/api-sirene'
