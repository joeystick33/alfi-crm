/**
 * Labels d'affichage pour les enums Prisma
 * MIGRATION 2024-12-10: Plus de mapping EN↔FR, valeurs uniformes partout
 *
 * Ce fichier fournit uniquement les labels d'affichage pour le frontend
 */

// ============================================
// PASSIF TYPE - Labels
// ============================================
export const PASSIF_TYPE_LABELS: Record<string, string> = {
  CREDIT_IMMOBILIER: 'Crédit immobilier',
  PTZ: 'Prêt à taux zéro',
  PRET_ACTION_LOGEMENT: 'Prêt Action Logement',
  CREDIT_CONSOMMATION: 'Crédit consommation',
  CREDIT_AUTO: 'Crédit auto',
  PRET_ETUDIANT: 'Prêt étudiant',
  PRET_PROFESSIONNEL: 'Prêt professionnel',
  CREDIT_REVOLVING: 'Crédit revolving',
  PRET_RELAIS: 'Prêt relais',
  PRET_IN_FINE: 'Prêt in fine',
  PRET_FAMILIAL: 'Prêt familial',
  DECOUVERT: 'Découvert bancaire',
  LEASING: 'Leasing / LOA',
  AUTRE: 'Autre',
}

export const PASSIF_TYPE_OPTIONS = Object.entries(PASSIF_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}))

// ============================================
// ACTIF TYPE - Labels
// ============================================
export const ACTIF_TYPE_LABELS: Record<string, string> = {
  // Immobilier
  RESIDENCE_PRINCIPALE: 'Résidence principale',
  IMMOBILIER_LOCATIF: 'Immobilier locatif',
  RESIDENCE_SECONDAIRE: 'Résidence secondaire',
  IMMOBILIER_COMMERCIAL: 'Immobilier commercial',
  SCPI: 'SCPI',
  SCI: 'SCI',
  OPCI: 'OPCI',
  CROWDFUNDING_IMMO: 'Crowdfunding immobilier',
  VIAGER: 'Viager',
  NUE_PROPRIETE: 'Nue-propriété',
  USUFRUIT: 'Usufruit',
  // Épargne salariale
  PEE: 'PEE',
  PEG: 'PEG',
  PERCO: 'PERCO',
  PERECO: 'PER Collectif',
  CET: 'Compte Épargne Temps',
  PARTICIPATION: 'Participation',
  INTERESSEMENT: 'Intéressement',
  STOCK_OPTIONS: 'Stock-options',
  ACTIONS_GRATUITES: 'Actions gratuites',
  BSPCE: 'BSPCE',
  // Épargne retraite
  PER: 'PER',
  PERP: 'PERP',
  MADELIN: 'Madelin',
  ARTICLE_83: 'Article 83',
  PREFON: 'PREFON',
  COREM: 'COREM',
  // Financier
  ASSURANCE_VIE: 'Assurance-vie',
  CONTRAT_CAPITALISATION: 'Contrat de capitalisation',
  COMPTE_TITRES: 'Compte-titres',
  PEA: 'PEA',
  PEA_PME: 'PEA-PME',
  // Bancaire
  COMPTE_BANCAIRE: 'Compte bancaire',
  LIVRETS: 'Livrets',
  PEL: 'PEL',
  CEL: 'CEL',
  COMPTE_A_TERME: 'Compte à terme',
  // Professionnel
  PARTS_SOCIALES: 'Parts sociales',
  IMMOBILIER_PRO: 'Immobilier professionnel',
  MATERIEL_PRO: 'Matériel professionnel',
  FONDS_COMMERCE: 'Fonds de commerce',
  BREVETS_PI: 'Brevets et PI',
  // Mobilier
  METAUX_PRECIEUX: 'Métaux précieux',
  BIJOUX: 'Bijoux',
  OEUVRES_ART: "Œuvres d'art",
  VINS: 'Vins',
  MONTRES: 'Montres',
  VEHICULES: 'Véhicules',
  MOBILIER: 'Mobilier',
  CRYPTO: 'Cryptomonnaies',
  NFT: 'NFT',
  AUTRE: 'Autre',
}

export const ACTIF_TYPE_OPTIONS = Object.entries(ACTIF_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}))

// ============================================
// CONTRAT TYPE - Labels
// ============================================
export const CONTRAT_TYPE_LABELS: Record<string, string> = {
  ASSURANCE_VIE: 'Assurance-vie',
  MUTUELLE: 'Mutuelle santé',
  ASSURANCE_HABITATION: 'Assurance habitation',
  ASSURANCE_AUTO: 'Assurance auto',
  ASSURANCE_PRO: 'Assurance professionnelle',
  ASSURANCE_DECES: 'Assurance décès',
  PREVOYANCE: 'Prévoyance',
  EPARGNE_RETRAITE: 'Épargne retraite',
  AUTRE: 'Autre',
}

export const CONTRAT_TYPE_OPTIONS = Object.entries(CONTRAT_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}))

// ============================================
// CONTRAT STATUS - Labels
// ============================================
export const CONTRAT_STATUS_LABELS: Record<string, string> = {
  ACTIF: 'Actif',
  SUSPENDU: 'Suspendu',
  RESILIE: 'Résilié',
  EXPIRE: 'Expiré',
}

// ============================================
// MARITAL STATUS - Labels
// ============================================
export const MARITAL_STATUS_LABELS: Record<string, string> = {
  CELIBATAIRE: 'Célibataire',
  MARIE: 'Marié(e)',
  DIVORCE: 'Divorcé(e)',
  VEUF: 'Veuf/Veuve',
  PACSE: 'Pacsé(e)',
  CONCUBINAGE: 'Concubinage',
}

export const MARITAL_STATUS_OPTIONS = Object.entries(MARITAL_STATUS_LABELS).map(
  ([value, label]) => ({ value, label })
)

// ============================================
// KYC STATUS - Labels
// ============================================
export const KYC_STATUS_LABELS: Record<string, string> = {
  EN_ATTENTE: 'En attente',
  EN_COURS: 'En cours',
  COMPLET: 'Complet',
  EXPIRE: 'Expiré',
  REJETE: 'Rejeté',
}

// ============================================
// CLIENT STATUS - Labels
// ============================================
export const CLIENT_STATUS_LABELS: Record<string, string> = {
  PROSPECT: 'Prospect',
  ACTIF: 'Client actif',
  INACTIF: 'Client inactif',
  ARCHIVE: 'Archivé',
  PERDU: 'Perdu',
}

// ============================================
// INVESTMENT HORIZON - Labels
// ============================================
export const INVESTMENT_HORIZON_LABELS: Record<string, string> = {
  COURT: 'Court terme (<3 ans)',
  MOYEN: 'Moyen terme (3-8 ans)',
  LONG: 'Long terme (>8 ans)',
}

// ============================================
// DOCUMENT TYPE - Labels
// ============================================
export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  CARTE_IDENTITE: "Carte d'identité",
  PASSEPORT: 'Passeport',
  JUSTIFICATIF_DOMICILE: 'Justificatif de domicile',
  AVIS_IMPOSITION: "Avis d'imposition",
  RELEVE_BANCAIRE: 'Relevé bancaire',
  TITRE_PROPRIETE: 'Titre de propriété',
  CONTRAT_PRET: 'Contrat de prêt',
  CONTRAT_ASSURANCE: "Contrat d'assurance",
  RELEVE_PLACEMENT: 'Relevé de placement',
  CONVENTION_ENTREE: "Convention d'entrée",
  LETTRE_MISSION: 'Lettre de mission',
  DECLARATION_ADEQUATION: "Déclaration d'adéquation",
  PROFIL_INVESTISSEUR: 'Profil investisseur',
  RAPPORT_ANNUEL: 'Rapport annuel',
  PIECE_JOINTE_EMAIL: 'Pièce jointe email',
  COMPTE_RENDU_RDV: 'Compte-rendu RDV',
  PROPOSITION: 'Proposition',
  CONTRAT: 'Contrat',
  FACTURE: 'Facture',
  AUTRE: 'Autre',
}

export const DOCUMENT_TYPE_OPTIONS = Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}))

// ============================================
// OBJECTIF TYPE - Labels
// ============================================
export const OBJECTIF_TYPE_LABELS: Record<string, string> = {
  RETRAITE: 'Préparation retraite',
  ACHAT_IMMOBILIER: 'Achat immobilier',
  ETUDES: 'Financement études',
  TRANSMISSION: 'Transmission patrimoine',
  OPTIMISATION_FISCALE: 'Optimisation fiscale',
  REVENUS_COMPLEMENTAIRES: 'Revenus complémentaires',
  PROTECTION_CAPITAL: 'Protection du capital',
  AUTRE: 'Autre',
}

// ============================================
// OBJECTIF STATUS - Labels
// ============================================
export const OBJECTIF_STATUS_LABELS: Record<string, string> = {
  ACTIF: 'Actif',
  ATTEINT: 'Atteint',
  ANNULE: 'Annulé',
  EN_PAUSE: 'En pause',
}

// ============================================
// OBJECTIF PRIORITY - Labels
// ============================================
export const PRIORITY_LABELS: Record<string, string> = {
  BASSE: 'Basse',
  MOYENNE: 'Moyenne',
  HAUTE: 'Haute',
  URGENTE: 'Urgente',
}

// ============================================
// PROJET TYPE - Labels
// ============================================
export const PROJET_TYPE_LABELS: Record<string, string> = {
  ACHAT_IMMOBILIER: 'Achat immobilier',
  CREATION_ENTREPRISE: 'Création entreprise',
  PREPARATION_RETRAITE: 'Préparation retraite',
  RESTRUCTURATION_PATRIMOINE: 'Restructuration patrimoine',
  OPTIMISATION_FISCALE: 'Optimisation fiscale',
  PLANIFICATION_SUCCESSION: 'Planification succession',
  AUTRE: 'Autre',
}

// ============================================
// PROJET STATUS - Labels
// ============================================
export const PROJET_STATUS_LABELS: Record<string, string> = {
  PLANIFIE: 'Planifié',
  EN_COURS: 'En cours',
  TERMINE: 'Terminé',
  ANNULE: 'Annulé',
  EN_PAUSE: 'En pause',
}

// ============================================
// TACHE TYPE - Labels
// ============================================
export const TACHE_TYPE_LABELS: Record<string, string> = {
  APPEL: 'Appel téléphonique',
  EMAIL: 'Email',
  REUNION: 'Réunion',
  REVUE_DOCUMENTS: 'Revue documents',
  MISE_A_JOUR_KYC: 'Mise à jour KYC',
  RENOUVELLEMENT_CONTRAT: 'Renouvellement contrat',
  SUIVI: 'Suivi',
  ADMINISTRATIF: 'Administratif',
  AUTRE: 'Autre',
}

// ============================================
// TACHE STATUS - Labels
// ============================================
export const TACHE_STATUS_LABELS: Record<string, string> = {
  A_FAIRE: 'À faire',
  EN_COURS: 'En cours',
  TERMINE: 'Terminé',
  ANNULE: 'Annulé',
}

// ============================================
// RENDEZ-VOUS TYPE - Labels
// ============================================
export const RENDEZ_VOUS_TYPE_LABELS: Record<string, string> = {
  PREMIER_RDV: 'Premier rendez-vous',
  SUIVI: 'Suivi',
  BILAN_ANNUEL: 'Bilan annuel',
  SIGNATURE: 'Signature',
  APPEL_TEL: 'Appel téléphonique',
  VISIO: 'Visioconférence',
  AUTRE: 'Autre',
}

// ============================================
// RENDEZ-VOUS STATUS - Labels
// ============================================
export const RENDEZ_VOUS_STATUS_LABELS: Record<string, string> = {
  PLANIFIE: 'Planifié',
  CONFIRME: 'Confirmé',
  TERMINE: 'Terminé',
  ANNULE: 'Annulé',
  ABSENT: 'Absent',
}

// ============================================
// HELPER: Get label for any enum value
// ============================================
export function getEnumLabel(enumType: string, value: string): string {
  const labelMaps: Record<string, Record<string, string>> = {
    PassifType: PASSIF_TYPE_LABELS,
    ActifType: ACTIF_TYPE_LABELS,
    ContratType: CONTRAT_TYPE_LABELS,
    ContratStatus: CONTRAT_STATUS_LABELS,
    MaritalStatus: MARITAL_STATUS_LABELS,
    KYCStatus: KYC_STATUS_LABELS,
    ClientStatus: CLIENT_STATUS_LABELS,
    InvestmentHorizon: INVESTMENT_HORIZON_LABELS,
    DocumentType: DOCUMENT_TYPE_LABELS,
    ObjectifType: OBJECTIF_TYPE_LABELS,
    ObjectifStatus: OBJECTIF_STATUS_LABELS,
    ObjectifPriority: PRIORITY_LABELS,
    TachePriority: PRIORITY_LABELS,
    ProjetType: PROJET_TYPE_LABELS,
    ProjetStatus: PROJET_STATUS_LABELS,
    TacheType: TACHE_TYPE_LABELS,
    TacheStatus: TACHE_STATUS_LABELS,
    RendezVousType: RENDEZ_VOUS_TYPE_LABELS,
    RendezVousStatus: RENDEZ_VOUS_STATUS_LABELS,
  }

  const labels = labelMaps[enumType]
  if (!labels) return value
  return labels[value] || value
}

// ============================================
// RÉTROCOMPATIBILITÉ: Mappings anciens → nouveaux
// À utiliser uniquement pendant la période de transition
// ============================================
export const LEGACY_TO_NEW_VALUES: Record<string, string> = {
  // MaritalStatus
  SINGLE: 'CELIBATAIRE',
  MARRIED: 'MARIE',
  DIVORCED: 'DIVORCE',
  WIDOWED: 'VEUF',
  PACS: 'PACSE',
  COHABITATION: 'CONCUBINAGE',
  // InvestmentHorizon
  COURT: 'COURT',
  MOYENNE: 'MOYEN',
  // KYCStatus
  EN_ATTENTE: 'EN_ATTENTE',
  EN_COURS: 'EN_COURS',
  TERMINE: 'COMPLET',
  EXPIRE: 'EXPIRE',
  REJETEE: 'REJETE',
  // ClientStatus
  ACTIF: 'ACTIF',
  INACTIF: 'INACTIF',
  ARCHIVE: 'ARCHIVE',
  PERDUE: 'PERDU',
  // ActifType
  REAL_ESTATE_MAIN: 'RESIDENCE_PRINCIPALE',
  REAL_ESTATE_RENTAL: 'IMMOBILIER_LOCATIF',
  REAL_ESTATE_SECONDARY: 'RESIDENCE_SECONDAIRE',
  ASSURANCE_VIE: 'ASSURANCE_VIE',
  SECURITIES_ACCOUNT: 'COMPTE_TITRES',
  BANK_ACCOUNT: 'COMPTE_BANCAIRE',
  SAVINGS_ACCOUNT: 'LIVRETS',
  TERM_DEPOSIT: 'COMPTE_A_TERME',
  COMPANY_SHARES: 'PARTS_SOCIALES',
  PROFESSIONAL_REAL_ESTATE: 'IMMOBILIER_PRO',
  PROFESSIONAL_EQUIPMENT: 'MATERIEL_PRO',
  GOODWILL: 'FONDS_COMMERCE',
  PATENTS_IP: 'BREVETS_PI',
  PRECIOUS_METALS: 'METAUX_PRECIEUX',
  JEWELRY: 'BIJOUX',
  ART_COLLECTION: 'OEUVRES_ART',
  WINE_COLLECTION: 'VINS',
  WATCHES: 'MONTRES',
  VEHICLES: 'VEHICULES',
  FURNITURE: 'MOBILIER',
  AUTRE: 'AUTRE',
  // PassifType
  MORTGAGE: 'CREDIT_IMMOBILIER',
  MORTGAGE_PTZ: 'PTZ',
  MORTGAGE_ACTION_LOG: 'PRET_ACTION_LOGEMENT',
  CONSUMER_LOAN: 'CREDIT_CONSOMMATION',
  CAR_LOAN: 'CREDIT_AUTO',
  STUDENT_LOAN: 'PRET_ETUDIANT',
  PROFESSIONAL_LOAN: 'PRET_PROFESSIONNEL',
  REVOLVING_CREDIT: 'CREDIT_REVOLVING',
  BRIDGE_LOAN: 'PRET_RELAIS',
  IN_FINE_LOAN: 'PRET_IN_FINE',
  FAMILY_LOAN: 'PRET_FAMILIAL',
  OVERDRAFT: 'DECOUVERT',
  // ContratType
  MUTUELLE: 'MUTUELLE',
  ASSURANCE_HABITATION: 'ASSURANCE_HABITATION',
  ASSURANCE_AUTO: 'ASSURANCE_AUTO',
  ASSURANCE_PRO: 'ASSURANCE_PRO',
  ASSURANCE_DECES: 'ASSURANCE_DECES',
  PREVOYANCE: 'PREVOYANCE',
  EPARGNE_RETRAITE: 'EPARGNE_RETRAITE',
  // ContratStatus
  SUSPENDU: 'SUSPENDU',
  TERMINATED: 'RESILIE',
  RESILIE: 'RESILIE',
  // ObjectifType
  RETRAITE: 'RETRAITE',
  ACHAT_IMMOBILIER: 'ACHAT_IMMOBILIER',
  ETUDES: 'ETUDES',
  TRANSMISSION: 'TRANSMISSION',
  OPTIMISATION_FISCALE: 'OPTIMISATION_FISCALE',
  REVENUS_COMPLEMENTAIRES: 'REVENUS_COMPLEMENTAIRES',
  PROTECTION_CAPITAL: 'PROTECTION_CAPITAL',
  // ObjectifStatus, ProjetStatus
  ATTEINT: 'ATTEINT',
  ANNULE: 'ANNULE',
  EN_PAUSE: 'EN_PAUSE',
  PLANIFIE: 'PLANIFIE',
  // Priority
  BASSE: 'BASSE',
  HAUTE: 'HAUTE',
  URGENTE: 'URGENTE',
  CRITIQUE: 'URGENTE',
  // TacheType
  CALL: 'APPEL',
  MEETING: 'REUNION',
  DOCUMENT_REVIEW: 'REVUE_DOCUMENTS',
  KYC_UPDATE: 'MISE_A_JOUR_KYC',
  RENOUVELLEMENT_CONTRAT: 'RENOUVELLEMENT_CONTRAT',
  SUIVI: 'SUIVI',
  ADMINISTRATIVE: 'ADMINISTRATIF',
  // TacheStatus
  A_FAIRE: 'A_FAIRE',
  // RendezVousType
  FIRST_MEETING: 'PREMIER_RDV',
  ANNUAL_REVIEW: 'BILAN_ANNUEL',
  SIGNING: 'SIGNATURE',
  PHONE_CALL: 'APPEL_TEL',
  VIDEO_CALL: 'VISIO',
  // RendezVousStatus - valeurs déjà définies plus haut
  CONFIRME: 'CONFIRME',
  ABSENT: 'ABSENT',
  // ProjetType
  CREATION_ENTREPRISE: 'CREATION_ENTREPRISE',
  PREPARATION_RETRAITE: 'PREPARATION_RETRAITE',
  RESTRUCTURATION_PATRIMOINE: 'RESTRUCTURATION_PATRIMOINE',
  PLANIFICATION_SUCCESSION: 'PLANIFICATION_SUCCESSION',
  // DocumentType
  ID_CARD: 'CARTE_IDENTITE',
  PASSPORT: 'PASSEPORT',
  JUSTIFICATIF_DOMICILE: 'JUSTIFICATIF_DOMICILE',
  AVIS_IMPOSITION: 'AVIS_IMPOSITION',
  BANK_STATEMENT: 'RELEVE_BANCAIRE',
  PROPERTY_DEED: 'TITRE_PROPRIETE',
  LOAN_AGREEMENT: 'CONTRAT_PRET',
  INSURANCE_POLICY: 'CONTRAT_ASSURANCE',
  INVESTMENT_STATEMENT: 'RELEVE_PLACEMENT',
  CONVENTION_ENTREE: 'CONVENTION_ENTREE',
  LETTRE_MISSION: 'LETTRE_MISSION',
  DECLARATION_ADEQUATION: 'DECLARATION_ADEQUATION',
  PROFIL_INVESTISSEUR: 'PROFIL_INVESTISSEUR',
  RAPPORT_ANNUEL: 'RAPPORT_ANNUEL',
  EMAIL_ATTACHMENT: 'PIECE_JOINTE_EMAIL',
  COMPTE_RENDU_RDV: 'COMPTE_RENDU_RDV',
  PROPOSITION: 'PROPOSITION',
  CONTRAT: 'CONTRAT',
  INVOICE: 'FACTURE',
}

/**
 * Convertit une ancienne valeur EN vers la nouvelle valeur FR
 * Retourne la valeur d'origine si pas de mapping trouvé
 */
export function normalizeEnumValue(value: string): string {
  return LEGACY_TO_NEW_VALUES[value] || value
}

// ============================================
// FONCTIONS DE MAPPING RÉTROCOMPATIBLES
// Convertissent les anciennes valeurs EN/FR mixtes vers les nouvelles valeurs FR
// ============================================

/**
 * Mappe un type de passif vers la valeur Prisma FR
 */
export function mapPassifType(value?: string): string {
  if (!value) return 'AUTRE'
  const normalized = value.toUpperCase().trim()

  const mapping: Record<string, string> = {
    // Anciennes valeurs EN
    MORTGAGE: 'CREDIT_IMMOBILIER',
    CONSUMER_LOAN: 'CREDIT_CONSOMMATION',
    PROFESSIONAL_LOAN: 'PRET_PROFESSIONNEL',
    REVOLVING_CREDIT: 'CREDIT_REVOLVING',
    BRIDGE_LOAN: 'PRET_RELAIS',
    CAR_LOAN: 'CREDIT_AUTO',
    AUTRE: 'AUTRE',
    // Valeurs FR simplifiées
    IMMOBILIER: 'CREDIT_IMMOBILIER',
    CONSOMMATION: 'CREDIT_CONSOMMATION',
    CONSO: 'CREDIT_CONSOMMATION',
    AUTO: 'CREDIT_AUTO',
    PROFESSIONNEL: 'PRET_PROFESSIONNEL',
    REVOLVING: 'CREDIT_REVOLVING',
    RELAIS: 'PRET_RELAIS',
  }

  // Si c'est déjà une valeur Prisma FR valide, la retourner
  const validTypes = Object.keys(PASSIF_TYPE_LABELS)
  if (validTypes.includes(normalized)) return normalized

  return mapping[normalized] || 'AUTRE'
}

/**
 * Mappe un type d'actif vers la valeur Prisma FR
 */
export function mapActifType(value?: string): string {
  if (!value) return 'AUTRE'
  const normalized = value.toUpperCase().trim()

  const mapping: Record<string, string> = {
    // Anciennes valeurs EN
    REAL_ESTATE_MAIN: 'RESIDENCE_PRINCIPALE',
    REAL_ESTATE_RENTAL: 'IMMOBILIER_LOCATIF',
    REAL_ESTATE_SECONDARY: 'RESIDENCE_SECONDAIRE',
    ASSURANCE_VIE: 'ASSURANCE_VIE',
    SECURITIES_ACCOUNT: 'COMPTE_TITRES',
    BANK_ACCOUNT: 'COMPTE_BANCAIRE',
    SAVINGS_ACCOUNT: 'LIVRETS',
    COMPANY_SHARES: 'PARTS_SOCIALES',
    AUTRE: 'AUTRE',
    // Valeurs FR simplifiées
    IMMOBILIER: 'RESIDENCE_PRINCIPALE',
    FINANCIER: 'ASSURANCE_VIE',
    MOBILIER: 'AUTRE',
    PROFESSIONNEL: 'PARTS_SOCIALES',
  }

  // Si c'est déjà une valeur Prisma FR valide, la retourner
  const validTypes = Object.keys(ACTIF_TYPE_LABELS)
  if (validTypes.includes(normalized)) return normalized

  return mapping[normalized] || 'AUTRE'
}

/**
 * Mappe un type de contrat vers la valeur Prisma FR
 */
export function mapContratType(value?: string): string {
  if (!value) return 'AUTRE'
  const normalized = value.toUpperCase().trim()

  const mapping: Record<string, string> = {
    ASSURANCE_VIE: 'ASSURANCE_VIE',
    MUTUELLE: 'MUTUELLE',
    ASSURANCE_HABITATION: 'ASSURANCE_HABITATION',
    ASSURANCE_AUTO: 'ASSURANCE_AUTO',
    ASSURANCE_PRO: 'ASSURANCE_PRO',
    ASSURANCE_DECES: 'ASSURANCE_DECES',
    PREVOYANCE: 'PREVOYANCE',
    EPARGNE_RETRAITE: 'EPARGNE_RETRAITE',
    AUTRE: 'AUTRE',
  }

  const validTypes = Object.keys(CONTRAT_TYPE_LABELS)
  if (validTypes.includes(normalized)) return normalized

  return mapping[normalized] || 'AUTRE'
}

/**
 * Mappe un type de document vers la valeur Prisma FR
 */
export function mapDocumentType(value?: string): string {
  if (!value) return 'AUTRE'
  const normalized = value.toUpperCase().trim()

  const mapping: Record<string, string> = {
    ID_CARD: 'CARTE_IDENTITE',
    PASSPORT: 'PASSEPORT',
    JUSTIFICATIF_DOMICILE: 'JUSTIFICATIF_DOMICILE',
    AVIS_IMPOSITION: 'AVIS_IMPOSITION',
    BANK_STATEMENT: 'RELEVE_BANCAIRE',
    AUTRE: 'AUTRE',
  }

  const validTypes = Object.keys(DOCUMENT_TYPE_LABELS)
  if (validTypes.includes(normalized)) return normalized

  return mapping[normalized] || 'AUTRE'
}

/**
 * Mappe un statut de tâche vers la valeur Prisma FR
 */
export function mapTacheStatus(value?: string): string {
  if (!value) return 'A_FAIRE'
  const normalized = value.toUpperCase().trim()

  const mapping: Record<string, string> = {
    A_FAIRE: 'A_FAIRE',
    EN_COURS: 'EN_COURS',
    TERMINE: 'TERMINE',
    ANNULE: 'ANNULE',
    DONE: 'TERMINE',
  }

  const validStatuses = Object.keys(TACHE_STATUS_LABELS)
  if (validStatuses.includes(normalized)) return normalized

  return mapping[normalized] || 'A_FAIRE'
}

/**
 * Mappe un type de tâche vers la valeur Prisma FR
 */
export function mapTacheType(value?: string): string {
  if (!value) return 'AUTRE'
  const normalized = value.toUpperCase().trim()

  const mapping: Record<string, string> = {
    CALL: 'APPEL',
    MEETING: 'REUNION',
    DOCUMENT_REVIEW: 'REVUE_DOCUMENTS',
    KYC_UPDATE: 'MISE_A_JOUR_KYC',
    RENOUVELLEMENT_CONTRAT: 'RENOUVELLEMENT_CONTRAT',
    SUIVI: 'SUIVI',
    ADMINISTRATIVE: 'ADMINISTRATIF',
    AUTRE: 'AUTRE',
  }

  const validTypes = Object.keys(TACHE_TYPE_LABELS)
  if (validTypes.includes(normalized)) return normalized

  return mapping[normalized] || 'AUTRE'
}

/**
 * Mappe une priorité vers la valeur Prisma FR
 */
export function mapPriority(value?: string): string {
  if (!value) return 'MOYENNE'
  const normalized = value.toUpperCase().trim()

  const mapping: Record<string, string> = {
    BASSE: 'BASSE',
    MOYENNE: 'MOYENNE',
    HAUTE: 'HAUTE',
    URGENTE: 'URGENTE',
    CRITIQUE: 'URGENTE',
  }

  const validPriorities = Object.keys(PRIORITY_LABELS)
  if (validPriorities.includes(normalized)) return normalized

  return mapping[normalized] || 'MOYENNE'
}

/**
 * Mappe un statut de RDV vers la valeur Prisma FR
 */
export function mapRendezVousStatus(value?: string): string {
  if (!value) return 'PLANIFIE'
  const normalized = value.toUpperCase().trim()

  const mapping: Record<string, string> = {
    PLANIFIE: 'PLANIFIE',
    CONFIRME: 'CONFIRME',
    TERMINE: 'TERMINE',
    ANNULE: 'ANNULE',
    ABSENT: 'ABSENT',
  }

  const validStatuses = Object.keys(RENDEZ_VOUS_STATUS_LABELS)
  if (validStatuses.includes(normalized)) return normalized

  return mapping[normalized] || 'PLANIFIE'
}

/**
 * Mappe un type de RDV vers la valeur Prisma FR
 */
export function mapRendezVousType(value?: string): string {
  if (!value) return 'AUTRE'
  const normalized = value.toUpperCase().trim()

  const mapping: Record<string, string> = {
    FIRST_MEETING: 'PREMIER_RDV',
    SUIVI: 'SUIVI',
    ANNUAL_REVIEW: 'BILAN_ANNUEL',
    SIGNING: 'SIGNATURE',
    PHONE_CALL: 'APPEL_TEL',
    VIDEO_CALL: 'VISIO',
    AUTRE: 'AUTRE',
  }

  const validTypes = Object.keys(RENDEZ_VOUS_TYPE_LABELS)
  if (validTypes.includes(normalized)) return normalized

  return mapping[normalized] || 'AUTRE'
}

/**
 * Mappe un statut client vers la valeur Prisma FR
 */
export function mapClientStatus(value?: string): string {
  if (!value) return 'PROSPECT'
  const normalized = value.toUpperCase().trim()

  const mapping: Record<string, string> = {
    ACTIF: 'ACTIF',
    INACTIF: 'INACTIF',
    ARCHIVE: 'ARCHIVE',
    PERDUE: 'PERDU',
  }

  const validStatuses = Object.keys(CLIENT_STATUS_LABELS)
  if (validStatuses.includes(normalized)) return normalized

  return mapping[normalized] || 'PROSPECT'
}

/**
 * Mappe un statut KYC vers la valeur Prisma FR
 */
export function mapKYCStatus(value?: string): string {
  if (!value) return 'EN_ATTENTE'
  const normalized = value.toUpperCase().trim()

  const mapping: Record<string, string> = {
    EN_ATTENTE: 'EN_ATTENTE',
    EN_COURS: 'EN_COURS',
    TERMINE: 'COMPLET',
    EXPIRE: 'EXPIRE',
    REJETEE: 'REJETE',
  }

  const validStatuses = Object.keys(KYC_STATUS_LABELS)
  if (validStatuses.includes(normalized)) return normalized

  return mapping[normalized] || 'EN_ATTENTE'
}

// ============================================
// CREDIT TYPE - Labels et Mapping
// ============================================
export const CREDIT_TYPE_LABELS: Record<string, string> = {
  // Immobilier
  PRET_IMMOBILIER_RP: 'Prêt immobilier RP',
  PRET_IMMOBILIER_LOCATIF: 'Prêt immobilier locatif',
  PRET_IMMOBILIER_SECONDAIRE: 'Prêt immobilier RS',
  PRET_TRAVAUX: 'Prêt travaux',
  PRET_RELAIS: 'Prêt relais',
  // Consommation
  CREDIT_AUTO: 'Crédit auto',
  CREDIT_MOTO: 'Crédit moto',
  PRET_PERSONNEL: 'Prêt personnel',
  CREDIT_RENOUVELABLE: 'Crédit renouvelable',
  CREDIT_AFFECTE: 'Crédit affecté',
  // Professionnel
  PRET_PROFESSIONNEL: 'Prêt professionnel',
  CREDIT_BAIL: 'Crédit-bail',
  LEASING: 'Leasing',
  // Études
  PRET_ETUDIANT: 'Prêt étudiant',
  // Autres
  PRET_FAMILIAL: 'Prêt familial',
  DECOUVERT_AUTORISE: 'Découvert autorisé',
  AUTRES_CREDITS: 'Autre crédit',
}

export const CREDIT_TYPE_OPTIONS = Object.entries(CREDIT_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}))

/**
 * Mappe un type de crédit Frontend vers la valeur Prisma
 * Supporte les types simplifiés du formulaire ET les types Prisma détaillés
 */
export function mapCreditType(value?: string): string {
  if (!value) return 'AUTRES_CREDITS'
  const normalized = value.toUpperCase().trim()

  const mapping: Record<string, string> = {
    // Types simplifiés du formulaire Budget
    IMMOBILIER: 'PRET_IMMOBILIER_RP',
    CONSOMMATION: 'PRET_PERSONNEL',
    AUTO: 'CREDIT_AUTO',
    ETUDES: 'PRET_ETUDIANT',
    PROFESSIONNEL: 'PRET_PROFESSIONNEL',
    AUTRE: 'AUTRES_CREDITS',
    // Types du formulaire CreditForm
    CREDIT_IMMOBILIER_RP: 'PRET_IMMOBILIER_RP',
    CREDIT_IMMOBILIER_RS: 'PRET_IMMOBILIER_SECONDAIRE',
    CREDIT_IMMOBILIER_LOCATIF: 'PRET_IMMOBILIER_LOCATIF',
    CREDIT_TRAVAUX: 'PRET_TRAVAUX',
    PRET_IN_FINE: 'PRET_IMMOBILIER_RP', // Pas d'équivalent exact
    PTZ: 'PRET_IMMOBILIER_RP', // Pas d'équivalent exact
    PRET_EMPLOYEUR: 'PRET_IMMOBILIER_RP',
    PEL_CEL: 'PRET_IMMOBILIER_RP',
    LOA: 'LEASING',
    LLD: 'LEASING',
    CREDIT_RENOUVELABLE: 'CREDIT_RENOUVELABLE',
    PRET_CREATION: 'PRET_PROFESSIONNEL',
    PRET_BPI: 'PRET_PROFESSIONNEL',
    PRET_ETUDIANT_GARANTI: 'PRET_ETUDIANT',
    COMPTE_COURANT_ASSOCIE: 'AUTRES_CREDITS',
    AUTRE_CREDIT: 'AUTRES_CREDITS',
  }

  // Si c'est déjà une valeur Prisma valide, la retourner
  const validTypes = Object.keys(CREDIT_TYPE_LABELS)
  if (validTypes.includes(normalized)) return normalized

  return mapping[normalized] || 'AUTRES_CREDITS'
}

// ============================================
// EXPENSE CATEGORY - Labels et Mapping
// ============================================
export const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  // Logement
  LOYER: 'Loyer',
  CHARGES_COPROPRIETE: 'Charges copropriété',
  TAXE_FONCIERE: 'Taxe foncière',
  TAXE_HABITATION: 'Taxe habitation',
  ASSURANCE_HABITATION: 'Assurance habitation',
  ELECTRICITE_GAZ: 'Électricité / Gaz',
  EAU: 'Eau',
  INTERNET_TELEPHONE: 'Internet / Téléphone',
  TRAVAUX_ENTRETIEN: 'Travaux entretien',
  FRAIS_GESTION_LOCATIVE: 'Frais gestion locative',
  // Transport
  CREDIT_AUTO: 'Crédit auto',
  ASSURANCE_AUTO: 'Assurance auto',
  CARBURANT: 'Carburant',
  ENTRETIEN_VEHICULE: 'Entretien véhicule',
  PARKING: 'Parking',
  TRANSPORT_COMMUN: 'Transports en commun',
  PEAGES: 'Péages',
  // Santé
  MUTUELLE: 'Mutuelle',
  FRAIS_MEDICAUX: 'Frais médicaux',
  OPTIQUE_DENTAIRE: 'Optique / Dentaire',
  // Assurances
  ASSURANCE_VIE_PRIMES: 'Primes assurance-vie',
  PREVOYANCE: 'Prévoyance',
  ASSURANCE_EMPRUNTEUR: 'Assurance emprunteur',
  PROTECTION_JURIDIQUE: 'Protection juridique',
  GAV: 'GAV',
  // Enfants / Famille
  GARDE_ENFANTS: 'Garde enfants',
  SCOLARITE: 'Scolarité',
  ACTIVITES_ENFANTS: 'Activités enfants',
  PENSION_ALIMENTAIRE_VERSEE: 'Pension alimentaire',
  ETUDES_SUPERIEURES: 'Études supérieures',
  // Épargne
  VERSEMENT_PER: 'Versement PER',
  VERSEMENT_PERP: 'Versement PERP',
  VERSEMENT_EPARGNE: 'Épargne programmée',
  INVESTISSEMENT_FIP_FCPI: 'FIP / FCPI',
  INVESTISSEMENT_SOFICA: 'SOFICA',
  // Crédits
  CREDIT_IMMOBILIER_RP: 'Crédit immobilier RP',
  CREDIT_IMMOBILIER_LOCATIF: 'Crédit immobilier locatif',
  CREDIT_CONSOMMATION: 'Crédit consommation',
  CREDIT_REVOLVING: 'Crédit renouvelable',
  // Professionnel
  COTISATIONS_SOCIALES: 'Cotisations sociales',
  CFE: 'CFE',
  FRAIS_COMPTABILITE: 'Comptabilité',
  COTISATION_SYNDICALE: 'Cotisations syndicales',
  FORMATION_PROFESSIONNELLE: 'Formation',
  // Impôts
  IMPOT_REVENU: 'Impôt sur le revenu',
  IFI: 'IFI',
  PRELEVEMENTS_SOCIAUX: 'Prélèvements sociaux',
  // Divers
  DONS: 'Dons',
  EMPLOI_DOMICILE: 'Emploi à domicile',
  ABONNEMENTS_LOISIRS: 'Abonnements / Loisirs',
  ALIMENTATION: 'Alimentation',
  AUTRE_CHARGE: 'Autre charge',
}

/**
 * Mappe une catégorie de charge Frontend vers la valeur Prisma
 * Supporte les catégories génériques et les catégories détaillées
 */
export function mapExpenseCategory(value?: string): string {
  if (!value) return 'AUTRE_CHARGE'
  const normalized = value.toUpperCase().trim()

  const mapping: Record<string, string> = {
    // Catégories génériques
    LOGEMENT: 'LOYER',
    TRANSPORT: 'CARBURANT',
    SANTE: 'MUTUELLE',
    ASSURANCE: 'PREVOYANCE',
    FAMILLE: 'GARDE_ENFANTS',
    EPARGNE: 'VERSEMENT_EPARGNE',
    CREDIT: 'CREDIT_CONSOMMATION',
    PROFESSIONNEL: 'COTISATIONS_SOCIALES',
    IMPOTS: 'IMPOT_REVENU',
    DIVERS: 'AUTRE_CHARGE',
    AUTRE: 'AUTRE_CHARGE',
  }

  // Si c'est déjà une valeur Prisma valide, la retourner
  const validCategories = Object.keys(EXPENSE_CATEGORY_LABELS)
  if (validCategories.includes(normalized)) return normalized

  return mapping[normalized] || 'AUTRE_CHARGE'
}

// ============================================
// REVENUE CATEGORY - Labels et Mapping
// ============================================
export const REVENUE_CATEGORY_LABELS: Record<string, string> = {
  // Salaires
  SALAIRE: 'Salaire',
  PRIME: 'Prime',
  BONUS: 'Bonus',
  AVANTAGE_NATURE: 'Avantage en nature',
  INDEMNITE_LICENCIEMENT: 'Indemnité licenciement',
  INDEMNITE_RUPTURE_CONVENTIONNELLE: 'Rupture conventionnelle',
  // TNS
  BIC: 'BIC',
  BNC: 'BNC',
  BA: 'Bénéfices agricoles',
  HONORAIRES: 'Honoraires',
  DROITS_AUTEUR: "Droits d'auteur",
  // Dirigeant
  REMUNERATION_GERANT: 'Rémunération gérant',
  DIVIDENDES: 'Dividendes',
  JETONS_PRESENCE: 'Jetons de présence',
  // Immobilier
  REVENUS_FONCIERS: 'Revenus fonciers',
  LMNP: 'LMNP',
  LMP: 'LMP',
  LOCATION_SAISONNIERE: 'Location saisonnière',
  SCPI: 'Revenus SCPI',
  // Capitaux
  INTERETS: 'Intérêts',
  PLUS_VALUES_MOBILIERES: 'Plus-values mobilières',
  ASSURANCE_VIE_RACHAT: 'Rachat assurance-vie',
  CRYPTO: 'Crypto-actifs',
  // Retraite
  PENSION_RETRAITE: 'Pension retraite',
  RETRAITE_COMPLEMENTAIRE: 'Retraite complémentaire',
  PER_RENTE: 'Rente PER',
  PENSION_REVERSION: 'Pension réversion',
  // Social
  PENSION_ALIMENTAIRE_RECUE: 'Pension alimentaire reçue',
  PENSION_INVALIDITE: 'Pension invalidité',
  ALLOCATION_CHOMAGE: 'Allocations chômage',
  RSA: 'RSA',
  ALLOCATIONS_FAMILIALES: 'Allocations familiales',
  APL: 'APL',
  // Autres
  RENTE_VIAGERE: 'Rente viagère',
  REVENU_EXCEPTIONNEL: 'Revenu exceptionnel',
  AUTRE: 'Autre revenu',
}

/**
 * Mappe une catégorie de revenu Frontend vers la valeur Prisma
 */
export function mapRevenueCategory(value?: string): string {
  if (!value) return 'AUTRE'
  const normalized = value.toUpperCase().trim()

  const mapping: Record<string, string> = {
    // Catégories génériques
    SALAIRES: 'SALAIRE',
    TNS: 'BNC',
    DIRIGEANT: 'REMUNERATION_GERANT',
    IMMOBILIER: 'REVENUS_FONCIERS',
    CAPITAUX: 'INTERETS',
    RETRAITE: 'PENSION_RETRAITE',
    SOCIAL: 'ALLOCATIONS_FAMILIALES',
    AUTRES: 'AUTRE',
  }

  // Si c'est déjà une valeur Prisma valide, la retourner
  const validCategories = Object.keys(REVENUE_CATEGORY_LABELS)
  if (validCategories.includes(normalized)) return normalized

  return mapping[normalized] || 'AUTRE'
}
