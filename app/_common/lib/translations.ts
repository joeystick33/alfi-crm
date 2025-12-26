/**
 * Traductions françaises pour le CRM Aura
 * Toutes les valeurs enum et labels doivent être traduits ici
 */

// Catégories d'actifs
export const ASSET_CATEGORY_LABELS: Record<string, string> = {
  // Actifs financiers
  'ASSURANCE_VIE': 'Assurance vie',
  'SECURITIES_ACCOUNT': 'Compte-titres',
  'PEA': 'PEA',
  'PEA_PME': 'PEA-PME',
  'SAVINGS_ACCOUNT': 'Livret d\'épargne',
  'CHECKING_ACCOUNT': 'Compte courant',
  'CURRENT_ACCOUNT': 'Compte courant',
  'TERM_DEPOSIT': 'Dépôt à terme',
  'EPARGNE_RETRAITE': 'Épargne retraite',
  'PER': 'PER',
  'PERP': 'PERP',
  'MADELIN': 'Contrat Madelin',
  'CRYPTO': 'Crypto-actifs',
  'CRYPTOCURRENCY': 'Crypto-actifs',
  'CROWDFUNDING': 'Crowdfunding',
  'PRIVATE_EQUITY': 'Private Equity',
  'FCPI': 'FCPI',
  'FIP': 'FIP',
  
  // Actifs immobiliers
  'MAIN_RESIDENCE': 'Résidence principale',
  'PRIMARY_RESIDENCE': 'Résidence principale',
  'SECONDARY_RESIDENCE': 'Résidence secondaire',
  'RENTAL_PROPERTY': 'Bien locatif',
  'RENTAL': 'Bien locatif',
  'COMMERCIAL_PROPERTY': 'Local commercial',
  'COMMERCIAL': 'Local commercial',
  'LAND': 'Terrain',
  'SCPI': 'SCPI',
  'OPCI': 'OPCI',
  'SCI': 'SCI',
  'REAL_ESTATE': 'Immobilier',
  'STONE_PAPER': 'Pierre-papier',
  
  // Actifs professionnels
  'BUSINESS': 'Entreprise',
  'SOCIETE': 'Entreprise',
  'SHARES': 'Parts sociales',
  'BUSINESS_ASSETS': 'Actifs professionnels',
  'PROFESSIONAL': 'Actif professionnel',
  
  // Autres
  'VEHICLE': 'Véhicule',
  'CAR': 'Véhicule',
  'ART': 'Œuvres d\'art',
  'ARTWORK': 'Œuvres d\'art',
  'JEWELRY': 'Bijoux',
  'COLLECTIBLES': 'Objets de collection',
  'PRECIOUS_METALS': 'Métaux précieux',
  'WINE': 'Vins',
  'AUTRE': 'Autre',
}

// Types d'actifs
export const ASSET_TYPE_LABELS: Record<string, string> = {
  'IMMOBILIER': 'Immobilier',
  'REAL_ESTATE': 'Immobilier',
  'FINANCIER': 'Financier',
  'FINANCIAL': 'Financier',
  'PROFESSIONNEL': 'Professionnel',
  'PROFESSIONAL': 'Professionnel',
  'AUTRE': 'Autre',
}

// Types de passifs
export const LIABILITY_TYPE_LABELS: Record<string, string> = {
  'IMMOBILIER': 'Crédit immobilier',
  'MORTGAGE': 'Crédit immobilier',
  'HOME_LOAN': 'Crédit immobilier',
  'CONSOMMATION': 'Crédit consommation',
  'CONSUMER': 'Crédit consommation',
  'CONSUMER_LOAN': 'Crédit consommation',
  'PROFESSIONNEL': 'Emprunt professionnel',
  'PROFESSIONAL': 'Emprunt professionnel',
  'BUSINESS_LOAN': 'Emprunt professionnel',
  'STUDENT': 'Prêt étudiant',
  'STUDENT_LOAN': 'Prêt étudiant',
  'CAR_LOAN': 'Crédit auto',
  'AUTRE': 'Autre dette',
}

// Types de contrats
export const CONTRACT_TYPE_LABELS: Record<string, string> = {
  'ASSURANCE_VIE': 'Assurance vie',
  'MUTUELLE': 'Assurance santé',
  'ASSURANCE_HABITATION': 'Assurance habitation',
  'ASSURANCE_AUTO': 'Assurance auto',
  'RETRAITE': 'Retraite',
  'SAVINGS': 'Épargne',
  'INVESTMENT': 'Investissement',
  'LOAN': 'Emprunt',
  'AUTRE': 'Autre',
}

// Statuts d'opportunités
export const OPPORTUNITY_STATUS_LABELS: Record<string, string> = {
  'DETECTEE': 'Détectée',
  'QUALIFIEE': 'Qualifiée',
  'CONTACTEE': 'Contactée',
  'PRESENTEE': 'Présentée',
  'ACCEPTEE': 'Acceptée',
  'CONVERTIE': 'Convertie',
  'REJETEE': 'Rejetée',
  'PERDUE': 'Perdue',
}

// Types de produits
export const PRODUCT_TYPE_LABELS: Record<string, string> = {
  'ASSURANCE_VIE': 'Assurance vie',
  'PER': 'PER',
  'PEA': 'PEA',
  'SCPI': 'SCPI',
  'REAL_ESTATE': 'Immobilier',
  'SECURITIES': 'Valeurs mobilières',
  'RETRAITE': 'Retraite',
  'OPTIMISATION_FISCALE': 'Optimisation fiscale',
  'WEALTH_MANAGEMENT': 'Gestion de patrimoine',
  'AUTRE': 'Autre',
}

// Statuts de tâches (migration FR 2024-12-10)
export const TASK_STATUS_LABELS: Record<string, string> = {
  'A_FAIRE': 'À faire',
  'EN_ATTENTE': 'En attente',
  'EN_COURS': 'En cours',
  'TERMINE': 'Terminée',
  'ANNULE': 'Annulée',
  'EN_RETARD': 'En retard',
}

// Priorités (migration FR 2024-12-10)
export const PRIORITY_LABELS: Record<string, string> = {
  'BASSE': 'Basse',
  'MOYENNE': 'Moyenne',
  'HAUTE': 'Haute',
  'URGENTE': 'Urgente',
}

// Types de documents
export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  'ID': 'Pièce d\'identité',
  'IDENTITE': 'Pièce d\'identité',
  'CONTRAT': 'Contrat',
  'INVOICE': 'Facture',
  'STATEMENT': 'Relevé',
  'TAX_DOCUMENT': 'Document fiscal',
  'TAX_RETURN': 'Déclaration fiscale',
  'BANK_STATEMENT': 'Relevé bancaire',
  'PROPERTY_DEED': 'Acte de propriété',
  'INSURANCE_POLICY': 'Police d\'assurance',
  'AUTRE': 'Autre',
}

// Régimes matrimoniaux
export const MARITAL_REGIME_LABELS: Record<string, string> = {
  'COMMUNAUTE_REDUITE_AUX_ACQUETS': 'Communauté réduite aux acquêts',
  'COMMUNAUTE_UNIVERSELLE': 'Communauté universelle',
  'SEPARATION_DE_BIENS': 'Séparation de biens',
  'PARTICIPATION_AUX_ACQUETS': 'Participation aux acquêts',
}

// Situations familiales
export const FAMILY_STATUS_LABELS: Record<string, string> = {
  'SINGLE': 'Célibataire',
  'MARRIED': 'Marié(e)',
  'PACS': 'Pacsé(e)',
  'DIVORCED': 'Divorcé(e)',
  'WIDOWED': 'Veuf/Veuve',
  'COHABITING': 'Concubinage',
}

/**
 * Fonction générique pour traduire une valeur
 */
export function translate(value: string | null | undefined, labels: Record<string, string>): string {
  if (!value) return ''
  return labels[value] || value.replace(/_/g, ' ').toLowerCase()
}

/**
 * Traduit une catégorie d'actif
 */
export function translateAssetCategory(category: string | null | undefined): string {
  return translate(category, ASSET_CATEGORY_LABELS)
}

/**
 * Traduit un type d'actif
 */
export function translateAssetType(type: string | null | undefined): string {
  return translate(type, ASSET_TYPE_LABELS)
}

/**
 * Traduit un type de passif
 */
export function translateLiabilityType(type: string | null | undefined): string {
  return translate(type, LIABILITY_TYPE_LABELS)
}

/**
 * Traduit un statut d'opportunité
 */
export function translateOpportunityStatus(status: string | null | undefined): string {
  return translate(status, OPPORTUNITY_STATUS_LABELS)
}

/**
 * Traduit un type de contrat
 */
export function translateContractType(type: string | null | undefined): string {
  return translate(type, CONTRACT_TYPE_LABELS)
}

/**
 * Traduit un type de produit
 */
export function translateProductType(type: string | null | undefined): string {
  return translate(type, PRODUCT_TYPE_LABELS)
}
