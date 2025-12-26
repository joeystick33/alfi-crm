/**
 * Types pour le wizard de création client
 * Conforme aux standards banques/courtiers (Boursorama, Fortuneo, Linxea, Qonto)
 */

// ══════════════════════════════════════════════════════════════════════════════
// TYPES COMMUNS
// ══════════════════════════════════════════════════════════════════════════════

export type ClientType = 'PARTICULIER' | 'PROFESSIONNEL'

export interface AddressData {
  street: string
  complement?: string
  postalCode: string
  city: string
  country: string
  codeInsee?: string
}

// ══════════════════════════════════════════════════════════════════════════════
// FORMULAIRE PARTICULIER - 7 ÉTAPES
// ══════════════════════════════════════════════════════════════════════════════

export interface ParticulierStep1Identity {
  civilite: 'M' | 'MME' | ''
  firstName: string
  lastName: string
  nomUsage?: string
  birthDate: string
  birthPlace: string
  nationality: string
}

export interface ParticulierStep2Contact {
  email: string
  phone: string
  mobile?: string
  address: AddressData
}

export interface ParticulierStep3Family {
  maritalStatus: 'SINGLE' | 'MARRIED' | 'PACS' | 'COHABITATION' | 'DIVORCED' | 'WIDOWED' | ''
  matrimonialRegime?: 'COMMUNAUTE_LEGALE' | 'COMMUNAUTE_UNIVERSELLE' | 'SEPARATION' | 'PARTICIPATION' | ''
  marriageDate?: string
  numberOfChildren: number
  dependents: number
  hasConjoint: boolean
  conjoint?: {
    civilite: 'M' | 'MME' | ''
    firstName: string
    lastName: string
    birthDate: string
    profession?: string
    annualIncome?: number
  }
}

export interface ParticulierStep4Professional {
  professionCategory: 
    | 'CADRE_SUP' | 'CADRE' | 'PROFESS_LIB' | 'CHEF_ENTR' 
    | 'EMPLOYE' | 'OUVRIER' | 'AGRICULTEUR' | 'ARTISAN' 
    | 'COMMERCANT' | 'RETRAITE' | 'ETUDIANT' | 'SANS_EMPLOI' | 'AUTRE' | ''
  profession: string
  employmentType: 'CDI' | 'CDD' | 'INDEPENDANT' | 'INTERIM' | 'FONCTIONNAIRE' | 'FREELANCE' | 'RETRAITE' | 'SANS_EMPLOI' | ''
  employerName?: string
  employmentSince?: string
}

export interface ParticulierStep5Financial {
  annualIncome: number
  annualIncomeConjoint?: number
  otherIncome?: number
  otherIncomeDetails?: string
  taxBracket: '0' | '11' | '30' | '41' | '45' | ''
  taxResidenceCountry: string
  ifiSubject: boolean
}

export interface ParticulierStep6Investor {
  riskProfile: 'PRUDENT' | 'EQUILIBRE' | 'DYNAMIQUE' | 'OFFENSIF' | ''
  investmentHorizon: 'COURT' | 'MOYEN' | 'LONG' | ''
  investmentGoals: string[]
  investmentKnowledge: 'DEBUTANT' | 'INTERMEDIAIRE' | 'EXPERT' | ''
  investmentExperience: 'AUCUNE' | 'LIMITEE' | 'REGULIERE' | 'INTENSIVE' | ''
}

export interface ParticulierFormData {
  step1: ParticulierStep1Identity
  step2: ParticulierStep2Contact
  step3: ParticulierStep3Family
  step4: ParticulierStep4Professional
  step5: ParticulierStep5Financial
  step6: ParticulierStep6Investor
}

// ══════════════════════════════════════════════════════════════════════════════
// FORMULAIRE PROFESSIONNEL - 5 ÉTAPES
// ══════════════════════════════════════════════════════════════════════════════

export interface ProfessionnelStep1Entreprise {
  companyName: string
  siren: string
  siret: string
  legalForm: string
  legalFormCode?: string
}

export interface ProfessionnelStep2Activite {
  activitySector: string
  codeNAF?: string
  companyCreationDate: string
  numberOfEmployees: number
  annualRevenue: number
  conventionCollective?: string
  idcc?: string
}

export interface ProfessionnelStep3Representant {
  civilite: 'M' | 'MME' | ''
  firstName: string
  lastName: string
  role: string // Gérant, Président, DG, etc.
  birthDate: string
  birthPlace?: string
  nationality: string
  email: string
  phone: string
  mobile?: string
}

export interface ProfessionnelStep4Coordonnees {
  siegeAddress: AddressData
  email: string
  phone: string
  website?: string
}

export interface ProfessionnelFormData {
  step1: ProfessionnelStep1Entreprise
  step2: ProfessionnelStep2Activite
  step3: ProfessionnelStep3Representant
  step4: ProfessionnelStep4Coordonnees
}

// ══════════════════════════════════════════════════════════════════════════════
// CONSTANTES
// ══════════════════════════════════════════════════════════════════════════════

export const CIVILITES = [
  { value: 'M', label: 'M.' },
  { value: 'MME', label: 'Mme' },
]

export const MARITAL_STATUS = [
  { value: 'SINGLE', label: 'Célibataire' },
  { value: 'MARRIED', label: 'Marié(e)' },
  { value: 'PACS', label: 'Pacsé(e)' },
  { value: 'COHABITATION', label: 'Concubinage' },
  { value: 'DIVORCED', label: 'Divorcé(e)' },
  { value: 'WIDOWED', label: 'Veuf(ve)' },
]

export const MATRIMONIAL_REGIMES = [
  { value: 'COMMUNAUTE_LEGALE', label: 'Communauté réduite aux acquêts' },
  { value: 'COMMUNAUTE_UNIVERSELLE', label: 'Communauté universelle' },
  { value: 'SEPARATION', label: 'Séparation de biens' },
  { value: 'PARTICIPATION', label: 'Participation aux acquêts' },
]

export const PROFESSION_CATEGORIES = [
  { value: 'CADRE_SUP', label: 'Cadre supérieur / Dirigeant' },
  { value: 'CADRE', label: 'Cadre' },
  { value: 'PROFESS_LIB', label: 'Profession libérale' },
  { value: 'CHEF_ENTR', label: 'Chef d\'entreprise' },
  { value: 'EMPLOYE', label: 'Employé' },
  { value: 'OUVRIER', label: 'Ouvrier' },
  { value: 'AGRICULTEUR', label: 'Agriculteur' },
  { value: 'ARTISAN', label: 'Artisan' },
  { value: 'COMMERCANT', label: 'Commerçant' },
  { value: 'RETRAITE', label: 'Retraité' },
  { value: 'ETUDIANT', label: 'Étudiant' },
  { value: 'SANS_EMPLOI', label: 'Sans emploi' },
  { value: 'AUTRE', label: 'Autre' },
]

export const EMPLOYMENT_TYPES = [
  { value: 'CDI', label: 'CDI' },
  { value: 'CDD', label: 'CDD' },
  { value: 'FONCTIONNAIRE', label: 'Fonctionnaire' },
  { value: 'INDEPENDANT', label: 'Travailleur indépendant' },
  { value: 'FREELANCE', label: 'Freelance / Auto-entrepreneur' },
  { value: 'INTERIM', label: 'Intérimaire' },
  { value: 'RETRAITE', label: 'Retraité' },
  { value: 'SANS_EMPLOI', label: 'Sans emploi' },
]

export const TAX_BRACKETS = [
  { value: '0', label: '0% (jusqu\'à 11 497€)' },
  { value: '11', label: '11% (11 498€ à 29 315€)' },
  { value: '30', label: '30% (29 316€ à 83 823€)' },
  { value: '41', label: '41% (83 824€ à 180 294€)' },
  { value: '45', label: '45% (plus de 180 294€)' },
]

export const RISK_PROFILES = [
  { value: 'PRUDENT', label: 'Prudent', description: 'Préserver le capital, rendement modéré' },
  { value: 'EQUILIBRE', label: 'Équilibré', description: 'Compromis entre sécurité et performance' },
  { value: 'DYNAMIQUE', label: 'Dynamique', description: 'Recherche de performance, accepte la volatilité' },
  { value: 'OFFENSIF', label: 'Offensif', description: 'Performance maximale, forte tolérance au risque' },
]

export const INVESTMENT_HORIZONS = [
  { value: 'COURT', label: 'Court terme', description: 'Moins de 3 ans' },
  { value: 'MOYEN', label: 'Moyen terme', description: '3 à 8 ans' },
  { value: 'LONG', label: 'Long terme', description: 'Plus de 8 ans' },
]

export const INVESTMENT_GOALS = [
  { value: 'EPARGNE_PRECAUTION', label: 'Épargne de précaution' },
  { value: 'PROJET_IMMOBILIER', label: 'Projet immobilier' },
  { value: 'RETRAITE', label: 'Préparation retraite' },
  { value: 'TRANSMISSION', label: 'Transmission / Succession' },
  { value: 'DEFISCALISATION', label: 'Optimisation fiscale' },
  { value: 'REVENUS_COMPLEMENTAIRES', label: 'Revenus complémentaires' },
  { value: 'ETUDES_ENFANTS', label: 'Études des enfants' },
  { value: 'VALORISATION', label: 'Valorisation du capital' },
]

export const INVESTMENT_KNOWLEDGE = [
  { value: 'DEBUTANT', label: 'Débutant', description: 'Peu ou pas de connaissances' },
  { value: 'INTERMEDIAIRE', label: 'Intermédiaire', description: 'Connaissances de base' },
  { value: 'EXPERT', label: 'Expert', description: 'Connaissances approfondies' },
]

export const INVESTMENT_EXPERIENCE = [
  { value: 'AUCUNE', label: 'Aucune', description: 'Jamais investi' },
  { value: 'LIMITEE', label: 'Limitée', description: 'Quelques opérations' },
  { value: 'REGULIERE', label: 'Régulière', description: 'Investissements réguliers' },
  { value: 'INTENSIVE', label: 'Intensive', description: 'Investisseur actif' },
]

export const LEGAL_FORMS = [
  { value: 'SARL', label: 'SARL - Société à responsabilité limitée' },
  { value: 'SAS', label: 'SAS - Société par actions simplifiée' },
  { value: 'SASU', label: 'SASU - Société par actions simplifiée unipersonnelle' },
  { value: 'EURL', label: 'EURL - Entreprise unipersonnelle à responsabilité limitée' },
  { value: 'SA', label: 'SA - Société anonyme' },
  { value: 'SNC', label: 'SNC - Société en nom collectif' },
  { value: 'SCI', label: 'SCI - Société civile immobilière' },
  { value: 'SCM', label: 'SCM - Société civile de moyens' },
  { value: 'SELARL', label: 'SELARL - Société d\'exercice libéral' },
  { value: 'EI', label: 'EI - Entreprise individuelle' },
  { value: 'MICRO', label: 'Micro-entreprise / Auto-entrepreneur' },
  { value: 'ASSOCIATION', label: 'Association loi 1901' },
]

export const NATIONALITIES = [
  { value: 'FR', label: 'Française' },
  { value: 'BE', label: 'Belge' },
  { value: 'CH', label: 'Suisse' },
  { value: 'LU', label: 'Luxembourgeoise' },
  { value: 'DE', label: 'Allemande' },
  { value: 'IT', label: 'Italienne' },
  { value: 'ES', label: 'Espagnole' },
  { value: 'PT', label: 'Portugaise' },
  { value: 'GB', label: 'Britannique' },
  { value: 'US', label: 'Américaine' },
  { value: 'AUTRE', label: 'Autre' },
]

export const COUNTRIES = [
  { value: 'FR', label: 'France' },
  { value: 'BE', label: 'Belgique' },
  { value: 'CH', label: 'Suisse' },
  { value: 'LU', label: 'Luxembourg' },
  { value: 'MC', label: 'Monaco' },
  { value: 'AUTRE', label: 'Autre' },
]
