/**
 * Reference Types - Types de référence pour les entités métier
 * 
 * Ce fichier centralise les types de référence utilisés dans l'application
 * pour assurer la cohérence entre les services et les composants.
 */

// Types d'objectifs patrimoniaux
export type ObjectifType = 
  | 'RETRAITE'
  | 'TRANSMISSION'
  | 'PRECAUTION'
  | 'IMMOBILIER'
  | 'ETUDES'
  | 'VOYAGE'
  | 'AUTRE'

// Types d'opportunités commerciales
export type OpportuniteType =
  | 'ASSURANCE_VIE'
  | 'PER'
  | 'PEA'
  | 'SCPI'
  | 'IMMOBILIER'
  | 'PREVOYANCE'
  | 'CREDIT'
  | 'AUTRE'

// Types de réclamations
export type ReclamationType =
  | 'QUALITE_SERVICE'
  | 'DELAI'
  | 'INFORMATION'
  | 'CONSEIL'
  | 'PRODUIT'
  | 'FACTURATION'
  | 'AUTRE'

// Types de documents KYC
export type KYCDocumentType =
  | 'IDENTITE'
  | 'DOMICILE'
  | 'RIB'
  | 'AVIS_IMPOSITION'
  | 'JUSTIFICATIF_PATRIMOINE'
  | 'ORIGINE_FONDS'
  | 'AUTRE'

// Types de rendez-vous
export type RendezVousType =
  | 'BILAN_PATRIMONIAL'
  | 'SUIVI_PERIODIQUE'
  | 'SIGNATURE'
  | 'CONSEIL'
  | 'PROSPECTION'
  | 'AUTRE'

// Types de simulations
export type SimulationType =
  | 'RETRAITE'
  | 'SUCCESSION'
  | 'INVESTISSEMENT'
  | 'CREDIT'
  | 'FISCALITE'
  | 'AUTRE'

// Catégories d'actifs
export type ActifCategory =
  | 'IMMOBILIER'
  | 'FINANCIER'
  | 'PROFESSIONNEL'
  | 'AUTRES'

// Types de passifs
export type PassifType =
  | 'CREDIT_IMMOBILIER'
  | 'CREDIT_CONSO'
  | 'CREDIT_PROFESSIONNEL'
  | 'AUTRE'

// Types de contrats
export type ContratType =
  | 'ASSURANCE_VIE'
  | 'PER'
  | 'PEA'
  | 'SCPI'
  | 'PREVOYANCE'
  | 'SANTE'
  | 'AUTO'
  | 'HABITATION'
  | 'AUTRE'

// Types d'actifs
export type ActifType =
  | 'IMMOBILIER_RESIDENCE_PRINCIPALE'
  | 'IMMOBILIER_LOCATIF'
  | 'IMMOBILIER_SECONDAIRE'
  | 'COMPTE_COURANT'
  | 'LIVRET_A'
  | 'LDDS'
  | 'PEL'
  | 'ASSURANCE_VIE'
  | 'PER'
  | 'PEA'
  | 'COMPTE_TITRES'
  | 'SCPI'
  | 'PARTS_SOCIALES'
  | 'VEHICULE'
  | 'AUTRE'

// Types de documents
export type DocumentType =
  | 'IDENTITE'
  | 'DOMICILE'
  | 'RIB'
  | 'AVIS_IMPOSITION'
  | 'BULLETIN_SALAIRE'
  | 'CONTRAT'
  | 'ATTESTATION'
  | 'RELEVE'
  | 'BILAN'
  | 'AUTRE'

// Catégories de documents
export type DocumentCategory =
  | 'ADMINISTRATIF'
  | 'FINANCIER'
  | 'FISCAL'
  | 'JURIDIQUE'
  | 'COMMERCIAL'
  | 'AUTRE'

// Priorités (alias pour compatibilité)
export type ObjectifPriority = 'BASSE' | 'MOYENNE' | 'HAUTE' | 'CRITIQUE'
export type OpportunitePriority = 'BASSE' | 'MOYENNE' | 'HAUTE' | 'CRITIQUE'
export type SLASeverity = 'BASSE' | 'MOYENNE' | 'HAUTE' | 'CRITIQUE'

// Export des constantes pour les listes déroulantes
export const OBJECTIF_TYPES: ObjectifType[] = [
  'RETRAITE',
  'TRANSMISSION',
  'PRECAUTION',
  'IMMOBILIER',
  'ETUDES',
  'VOYAGE',
  'AUTRE',
]

export const OPPORTUNITE_TYPES: OpportuniteType[] = [
  'ASSURANCE_VIE',
  'PER',
  'PEA',
  'SCPI',
  'IMMOBILIER',
  'PREVOYANCE',
  'CREDIT',
  'AUTRE',
]

export const RECLAMATION_TYPES: ReclamationType[] = [
  'QUALITE_SERVICE',
  'DELAI',
  'INFORMATION',
  'CONSEIL',
  'PRODUIT',
  'FACTURATION',
  'AUTRE',
]

export const PRIORITIES: ObjectifPriority[] = [
  'BASSE',
  'MOYENNE',
  'HAUTE',
  'CRITIQUE',
]

export const SLA_SEVERITIES: SLASeverity[] = [
  'BASSE',
  'MOYENNE',
  'HAUTE',
  'CRITIQUE',
]
