/**
 * Labels centralisés pour le CRM
 * Transforme les valeurs d'enum en labels lisibles en français
 */

// ============================================================================
// Catégories d'actifs
// ============================================================================
export const ASSET_CATEGORY_LABELS: Record<string, string> = {
  IMMOBILIER: 'Immobilier',
  FINANCIER: 'Financier',
  EPARGNE_SALARIALE: 'Épargne salariale',
  EPARGNE_RETRAITE: 'Épargne retraite',
  PROFESSIONNEL: 'Professionnel',
  MOBILIER: 'Mobilier',
  AUTRES: 'Autres',
  AUTRE: 'Autre',
}

// ============================================================================
// Types d'actifs immobiliers
// ============================================================================
export const REAL_ESTATE_TYPE_LABELS: Record<string, string> = {
  RESIDENCE_PRINCIPALE: 'Résidence principale',
  RESIDENCE_SECONDAIRE: 'Résidence secondaire',
  IMMOBILIER_LOCATIF: 'Immobilier locatif',
  INVESTISSEMENT_LOCATIF: 'Investissement locatif',
  REAL_ESTATE_MAIN: 'Résidence principale',
  REAL_ESTATE_SECONDARY: 'Résidence secondaire',
  REAL_ESTATE_RENTAL: 'Immobilier locatif',
  PROFESSIONAL_REAL_ESTATE: 'Immobilier professionnel',
  TERRAIN: 'Terrain',
  PARKING: 'Parking / Box',
  LOCAL_COMMERCIAL: 'Local commercial',
  IMMEUBLE: 'Immeuble',
  SCPI: 'SCPI',
  OPCI: 'OPCI',
  SCI: 'SCI',
  NUE_PROPRIETE: 'Nue-propriété',
  USUFRUIT: 'Usufruit',
  VIAGER: 'Viager',
}

// ============================================================================
// Types d'actifs financiers
// ============================================================================
export const FINANCIAL_TYPE_LABELS: Record<string, string> = {
  ASSURANCE_VIE: 'Assurance vie',
  LIFE_INSURANCE: 'Assurance vie',
  PEA: 'PEA',
  PEA_PME: 'PEA-PME',
  COMPTE_TITRES: 'Compte-titres',
  SECURITIES_ACCOUNT: 'Compte-titres',
  CTO: 'Compte-titres ordinaire',
  LIVRET_A: 'Livret A',
  LDDS: 'LDDS',
  LEP: 'LEP',
  PEL: 'PEL',
  CEL: 'CEL',
  COMPTE_COURANT: 'Compte courant',
  BANK_ACCOUNT: 'Compte bancaire',
  SAVINGS_ACCOUNT: 'Livret d\'épargne',
  COMPTE_EPARGNE: 'Compte épargne',
  CRYPTO: 'Crypto-actifs',
  CROWDFUNDING: 'Crowdfunding',
  FCPI: 'FCPI',
  FIP: 'FIP',
  FCPR: 'FCPR',
  OBLIGATIONS: 'Obligations',
  ACTIONS: 'Actions',
  SICAV: 'SICAV',
  FCP: 'FCP',
  ETF: 'ETF',
  OR: 'Or',
  METAUX_PRECIEUX: 'Métaux précieux',
  PRECIOUS_METALS: 'Métaux précieux',
}

// ============================================================================
// Types d'épargne salariale
// ============================================================================
export const EPARGNE_SALARIALE_TYPE_LABELS: Record<string, string> = {
  PEE: 'PEE',
  PEG: 'PEG',
  PEI: 'PEI',
  PERCO: 'PERCO',
  PERECO: 'PER Collectif',
  CET: 'Compte Épargne Temps',
  PARTICIPATION: 'Participation',
  INTERESSEMENT: 'Intéressement',
  STOCK_OPTIONS: 'Stock-options',
  ACTIONS_GRATUITES: 'Actions gratuites',
  BSPCE: 'BSPCE',
  RSU: 'RSU',
}

// ============================================================================
// Types d'épargne retraite
// ============================================================================
export const EPARGNE_RETRAITE_TYPE_LABELS: Record<string, string> = {
  PER: 'PER',
  PER_INDIVIDUEL: 'PER Individuel',
  PER_COLLECTIF: 'PER Collectif',
  PER_OBLIGATOIRE: 'PER Obligatoire',
  PERP: 'PERP',
  MADELIN: 'Contrat Madelin',
  PREFON: 'Préfon',
  COREM: 'Corem',
  ARTICLE_83: 'Article 83',
  ARTICLE_39: 'Article 39',
  PERCO_RETRAITE: 'PERCO',
}

// ============================================================================
// Types de passifs / crédits
// ============================================================================
export const LIABILITY_TYPE_LABELS: Record<string, string> = {
  MORTGAGE: 'Crédit immobilier',
  CREDIT_IMMO: 'Crédit immobilier',
  CREDIT_IMMOBILIER: 'Crédit immobilier',
  PRET_IMMOBILIER: 'Prêt immobilier',
  PRET_IMMOBILIER_RP: 'Prêt immobilier RP',
  PRET_IMMOBILIER_LOCATIF: 'Prêt immobilier locatif',
  PRET_IMMOBILIER_SECONDAIRE: 'Prêt immobilier RS',
  CONSUMER_LOAN: 'Crédit consommation',
  CREDIT_CONSO: 'Crédit consommation',
  CREDIT_CONSOMMATION: 'Crédit consommation',
  PRET_PERSONNEL: 'Prêt personnel',
  PROFESSIONAL_LOAN: 'Prêt professionnel',
  DETTE_PRO: 'Dette professionnelle',
  PRET_PROFESSIONNEL: 'Prêt professionnel',
  REVOLVING_CREDIT: 'Crédit revolving',
  CREDIT_RENOUVELABLE: 'Crédit renouvelable',
  BRIDGE_LOAN: 'Prêt relais',
  PRET_RELAIS: 'Prêt relais',
  CREDIT_AUTO: 'Crédit auto',
  CREDIT_MOTO: 'Crédit moto',
  PRET_TRAVAUX: 'Prêt travaux',
  PRET_ETUDIANT: 'Prêt étudiant',
  PRET_FAMILIAL: 'Prêt familial',
  DECOUVERT: 'Découvert bancaire',
  DECOUVERT_AUTORISE: 'Découvert autorisé',
  CREDIT_BAIL: 'Crédit-bail',
  LEASING: 'Leasing',
  LOA: 'LOA',
  LLD: 'LLD',
  AUTRE: 'Autre dette',
}

// ============================================================================
// Types de revenus
// ============================================================================
export const REVENUE_TYPE_LABELS: Record<string, string> = {
  SALAIRE: 'Salaire',
  SALAIRE_NET: 'Salaire net',
  SALAIRE_BRUT: 'Salaire brut',
  PRIME: 'Prime',
  TREIZIEME_MOIS: '13ème mois',
  INTERESSEMENT: 'Intéressement',
  PARTICIPATION: 'Participation',
  BIC: 'BIC',
  BNC: 'BNC',
  BA: 'Bénéfices agricoles',
  GERANT_MAJORITAIRE: 'Rémunération gérant',
  LOYER: 'Loyer',
  LOYER_NU: 'Loyer nu',
  LOYER_MEUBLE: 'Loyer meublé',
  LOYER_MEUBLE_TOURISME: 'Location tourisme',
  REVENUS_FONCIERS: 'Revenus fonciers',
  SCI_REVENUS: 'Revenus SCI',
  SCPI_REVENUS: 'Revenus SCPI',
  OPCI_REVENUS: 'Revenus OPCI',
  DIVIDENDES: 'Dividendes',
  INTERETS: 'Intérêts',
  PLUS_VALUES: 'Plus-values',
  PLUS_VALUES_MOBILIERES: 'Plus-values mobilières',
  ASSURANCE_VIE_RACHAT: 'Rachat assurance vie',
  CRYPTO: 'Gains crypto',
  PENSION_RETRAITE: 'Pension de retraite',
  RETRAITE_COMPLEMENTAIRE: 'Retraite complémentaire',
  PER_RENTE: 'Rente PER',
  PENSION_REVERSION: 'Pension de réversion',
  PENSION_ALIMENTAIRE_RECUE: 'Pension alimentaire reçue',
  PENSION_INVALIDITE: 'Pension d\'invalidité',
  ALLOCATION_CHOMAGE: 'Allocation chômage',
  RSA: 'RSA',
  ALLOCATIONS_FAMILIALES: 'Allocations familiales',
  APL: 'APL',
  RENTE_VIAGERE: 'Rente viagère',
  REVENU_EXCEPTIONNEL: 'Revenu exceptionnel',
  AUTRE: 'Autre revenu',
}

// ============================================================================
// Types de charges
// ============================================================================
export const EXPENSE_TYPE_LABELS: Record<string, string> = {
  LOYER: 'Loyer',
  CHARGES_COPROPRIETE: 'Charges copropriété',
  TAXE_FONCIERE: 'Taxe foncière',
  TAXE_HABITATION: 'Taxe d\'habitation',
  ASSURANCE_HABITATION: 'Assurance habitation',
  ELECTRICITE_GAZ: 'Électricité / Gaz',
  EAU: 'Eau',
  INTERNET_TELEPHONE: 'Internet / Téléphone',
  TRAVAUX_ENTRETIEN: 'Travaux / Entretien',
  FRAIS_GESTION_LOCATIVE: 'Frais de gestion',
  CREDIT_AUTO: 'Crédit auto',
  ASSURANCE_AUTO: 'Assurance auto',
  CARBURANT: 'Carburant',
  ENTRETIEN_VEHICULE: 'Entretien véhicule',
  PARKING: 'Parking',
  TRANSPORT_COMMUN: 'Transports en commun',
  PEAGES: 'Péages',
  MUTUELLE: 'Mutuelle',
  FRAIS_MEDICAUX: 'Frais médicaux',
  OPTIQUE_DENTAIRE: 'Optique / Dentaire',
  ASSURANCE_VIE_PRIMES: 'Primes assurance vie',
  PREVOYANCE: 'Prévoyance',
  ASSURANCE_EMPRUNTEUR: 'Assurance emprunteur',
  PROTECTION_JURIDIQUE: 'Protection juridique',
  GAV: 'GAV',
  GARDE_ENFANTS: 'Garde d\'enfants',
  SCOLARITE: 'Scolarité',
  ACTIVITES_ENFANTS: 'Activités enfants',
  PENSION_ALIMENTAIRE_VERSEE: 'Pension alimentaire',
  ETUDES_SUPERIEURES: 'Études supérieures',
  VERSEMENT_PER: 'Versement PER',
  VERSEMENT_PERP: 'Versement PERP',
  VERSEMENT_EPARGNE: 'Épargne programmée',
  INVESTISSEMENT_FIP_FCPI: 'FIP / FCPI',
  INVESTISSEMENT_SOFICA: 'SOFICA',
  CREDIT_IMMOBILIER_RP: 'Crédit immobilier RP',
  CREDIT_IMMOBILIER_LOCATIF: 'Crédit immobilier locatif',
  CREDIT_CONSOMMATION: 'Crédit consommation',
  CREDIT_REVOLVING: 'Crédit revolving',
  COTISATIONS_SOCIALES: 'Cotisations sociales',
  CFE: 'CFE',
  FRAIS_COMPTABILITE: 'Comptabilité',
  COTISATION_SYNDICALE: 'Cotisation syndicale',
  FORMATION_PROFESSIONNELLE: 'Formation',
  IMPOT_REVENU: 'Impôt sur le revenu',
  IFI: 'IFI',
  PRELEVEMENTS_SOCIAUX: 'Prélèvements sociaux',
  DONS: 'Dons',
  EMPLOI_DOMICILE: 'Emploi à domicile',
  ABONNEMENTS_LOISIRS: 'Abonnements / Loisirs',
  ALIMENTATION: 'Alimentation',
  AUTRE_CHARGE: 'Autre charge',
}

// ============================================================================
// Statuts
// ============================================================================
export const STATUS_LABELS: Record<string, string> = {
  ACTIF: 'Actif',
  ACTIVE: 'Actif',
  INACTIF: 'Inactif',
  INACTIVE: 'Inactif',
  EN_COURS: 'En cours',
  IN_PROGRESS: 'En cours',
  PENDING: 'En attente',
  EN_ATTENTE: 'En attente',
  TERMINE: 'Terminé',
  COMPLETED: 'Terminé',
  ANNULE: 'Annulé',
  CANCELLED: 'Annulé',
  BROUILLON: 'Brouillon',
  DRAFT: 'Brouillon',
  VALIDE: 'Validé',
  VALIDATED: 'Validé',
  REJETE: 'Rejeté',
  REJECTED: 'Rejeté',
  EXPIRE: 'Expiré',
  EXPIRED: 'Expiré',
  REMBOURSE: 'Remboursé',
  EN_RETARD: 'En retard',
  OVERDUE: 'En retard',
  RESTRUCTURE: 'Restructuré',
  SUSPENDU: 'Suspendu',
}

// ============================================================================
// Fréquences
// ============================================================================
export const FREQUENCY_LABELS: Record<string, string> = {
  MENSUEL: 'Mensuel',
  MONTHLY: 'Mensuel',
  BIMESTRIEL: 'Bimestriel',
  TRIMESTRIEL: 'Trimestriel',
  QUARTERLY: 'Trimestriel',
  SEMESTRIEL: 'Semestriel',
  SEMI_ANNUAL: 'Semestriel',
  ANNUEL: 'Annuel',
  ANNUAL: 'Annuel',
  YEARLY: 'Annuel',
  PONCTUEL: 'Ponctuel',
  ONE_TIME: 'Ponctuel',
  HEBDOMADAIRE: 'Hebdomadaire',
  WEEKLY: 'Hebdomadaire',
  QUOTIDIEN: 'Quotidien',
  DAILY: 'Quotidien',
}

// ============================================================================
// Relations familiales
// ============================================================================
export const FAMILY_RELATION_LABELS: Record<string, string> = {
  CONJOINT: 'Conjoint(e)',
  SPOUSE: 'Conjoint(e)',
  ENFANT: 'Enfant',
  CHILD: 'Enfant',
  PARENT: 'Parent',
  FRATRIE: 'Frère / Sœur',
  SIBLING: 'Frère / Sœur',
  PETIT_ENFANT: 'Petit-enfant',
  GRANDCHILD: 'Petit-enfant',
  ASCENDANT: 'Ascendant',
  AUTRE: 'Autre',
  OTHER: 'Autre',
}

// ============================================================================
// Régimes matrimoniaux
// ============================================================================
export const MATRIMONIAL_REGIME_LABELS: Record<string, string> = {
  COMMUNAUTE_REDUITE_AUX_ACQUETS: 'Communauté réduite aux acquêts',
  COMMUNAUTE_UNIVERSELLE: 'Communauté universelle',
  SEPARATION_DE_BIENS: 'Séparation de biens',
  PARTICIPATION_AUX_ACQUETS: 'Participation aux acquêts',
  PACS: 'PACS',
  CELIBATAIRE: 'Célibataire',
  DIVORCE: 'Divorcé(e)',
  VEUF: 'Veuf / Veuve',
}

// ============================================================================
// Situations familiales
// ============================================================================
export const FAMILY_STATUS_LABELS: Record<string, string> = {
  CELIBATAIRE: 'Célibataire',
  SINGLE: 'Célibataire',
  MARIE: 'Marié(e)',
  MARRIED: 'Marié(e)',
  PACSE: 'Pacsé(e)',
  CONCUBINAGE: 'Concubinage',
  UNION_LIBRE: 'Union libre',
  DIVORCE: 'Divorcé(e)',
  DIVORCED: 'Divorcé(e)',
  SEPARE: 'Séparé(e)',
  SEPARATED: 'Séparé(e)',
  VEUF: 'Veuf / Veuve',
  WIDOWED: 'Veuf / Veuve',
}

// ============================================================================
// Types de versements
// ============================================================================
export const VERSEMENT_TYPE_LABELS: Record<string, string> = {
  INITIAL: 'Initial',
  PLANIFIE: 'Programmé',
  EXCEPTIONNEL: 'Exceptionnel',
  ARBITRAGE: 'Arbitrage',
  RACHAT_PARTIEL: 'Rachat partiel',
  RACHAT_TOTAL: 'Rachat total',
}

// ============================================================================
// Types de contrats
// ============================================================================
export const CONTRACT_TYPE_LABELS: Record<string, string> = {
  ASSURANCE_VIE: 'Assurance vie',
  PER: 'PER',
  PER_INDIVIDUEL: 'PER Individuel',
  PER_COLLECTIF: 'PER Collectif',
  MADELIN: 'Contrat Madelin',
  PERP: 'PERP',
  PREVOYANCE: 'Prévoyance',
  SANTE: 'Santé',
  BANCAIRE: 'Compte bancaire',
  PEA: 'PEA',
  COMPTE_TITRES: 'Compte-titres',
}

// ============================================================================
// Types de projets
// ============================================================================
export const PROJECT_TYPE_LABELS: Record<string, string> = {
  RETRAITE: 'Retraite',
  IMMOBILIER: 'Immobilier',
  TRANSMISSION: 'Transmission',
  PROTECTION: 'Protection',
  EPARGNE: 'Épargne',
  DEFISCALISATION: 'Défiscalisation',
  INVESTISSEMENT: 'Investissement',
  EDUCATION: 'Éducation',
  AUTRE: 'Autre',
}

// ============================================================================
// Types d'alertes
// ============================================================================
export const ALERT_CATEGORY_LABELS: Record<string, string> = {
  KYC: 'KYC',
  CONFORMITE: 'Conformité',
  PATRIMOINE: 'Patrimoine',
  BUDGET: 'Budget',
  CONTRATS: 'Contrats',
  DOCUMENTS: 'Documents',
  FISCALITE: 'Fiscalité',
  RETRAITE: 'Retraite',
}

// ============================================================================
// Dictionnaire global (fusion de tous les labels)
// ============================================================================
export const ALL_LABELS: Record<string, string> = {
  ...ASSET_CATEGORY_LABELS,
  ...REAL_ESTATE_TYPE_LABELS,
  ...FINANCIAL_TYPE_LABELS,
  ...EPARGNE_SALARIALE_TYPE_LABELS,
  ...EPARGNE_RETRAITE_TYPE_LABELS,
  ...LIABILITY_TYPE_LABELS,
  ...REVENUE_TYPE_LABELS,
  ...VERSEMENT_TYPE_LABELS,
  ...CONTRACT_TYPE_LABELS,
  ...PROJECT_TYPE_LABELS,
  ...ALERT_CATEGORY_LABELS,
  ...EXPENSE_TYPE_LABELS,
  ...STATUS_LABELS,
  ...FREQUENCY_LABELS,
  ...FAMILY_RELATION_LABELS,
  ...MATRIMONIAL_REGIME_LABELS,
  ...FAMILY_STATUS_LABELS,
}

// ============================================================================
// Fonction utilitaire principale
// ============================================================================

/**
 * Formate un label d'enum en texte lisible
 * Ex: "IMMOBILIER_LOCATIF" → "Immobilier locatif"
 * Ex: "RESIDENCE_PRINCIPALE" → "Résidence principale"
 * 
 * @param value - La valeur à formater (ex: "IMMOBILIER_LOCATIF")
 * @param customLabels - Labels personnalisés optionnels
 * @returns Le label formaté en français
 */
export function formatLabel(value: string | null | undefined, customLabels?: Record<string, string>): string {
  if (!value) return ''
  
  // Chercher dans les labels personnalisés d'abord
  if (customLabels && customLabels[value]) {
    return customLabels[value]
  }
  
  // Chercher dans le dictionnaire global
  if (ALL_LABELS[value]) {
    return ALL_LABELS[value]
  }
  
  // Fallback: transformer SNAKE_CASE en "Title case"
  return value
    .split('_')
    .map((word, index) => {
      const lower = word.toLowerCase()
      // Première lettre en majuscule seulement pour le premier mot
      if (index === 0) {
        return lower.charAt(0).toUpperCase() + lower.slice(1)
      }
      return lower
    })
    .join(' ')
}

/**
 * Formate un type d'actif en label lisible
 */
export function formatAssetType(type: string | null | undefined): string {
  return formatLabel(type, {
    ...REAL_ESTATE_TYPE_LABELS,
    ...FINANCIAL_TYPE_LABELS,
    ...EPARGNE_SALARIALE_TYPE_LABELS,
    ...EPARGNE_RETRAITE_TYPE_LABELS,
  })
}

/**
 * Formate une catégorie d'actif en label lisible
 */
export function formatAssetCategory(category: string | null | undefined): string {
  return formatLabel(category, ASSET_CATEGORY_LABELS)
}

/**
 * Formate un type de passif/crédit en label lisible
 */
export function formatLiabilityType(type: string | null | undefined): string {
  return formatLabel(type, LIABILITY_TYPE_LABELS)
}

/**
 * Formate un type de revenu en label lisible
 */
export function formatRevenueType(type: string | null | undefined): string {
  return formatLabel(type, REVENUE_TYPE_LABELS)
}

/**
 * Formate un type de charge en label lisible
 */
export function formatExpenseType(type: string | null | undefined): string {
  return formatLabel(type, EXPENSE_TYPE_LABELS)
}

/**
 * Formate un statut en label lisible
 */
export function formatStatus(status: string | null | undefined): string {
  return formatLabel(status, STATUS_LABELS)
}

/**
 * Formate une fréquence en label lisible
 */
export function formatFrequency(frequency: string | null | undefined): string {
  return formatLabel(frequency, FREQUENCY_LABELS)
}

/**
 * Formate une relation familiale en label lisible
 */
export function formatFamilyRelation(relation: string | null | undefined): string {
  return formatLabel(relation, FAMILY_RELATION_LABELS)
}

/**
 * Formate un régime matrimonial en label lisible
 */
export function formatMatrimonialRegime(regime: string | null | undefined): string {
  return formatLabel(regime, MATRIMONIAL_REGIME_LABELS)
}

/**
 * Formate une situation familiale en label lisible
 */
export function formatFamilyStatus(status: string | null | undefined): string {
  return formatLabel(status, FAMILY_STATUS_LABELS)
}

// ============================================================================
// FONCTIONS DE MAPPING CENTRALISÉES POUR L'AFFICHAGE
// Ces fonctions permettent de mapper les catégories détaillées (Prisma)
// vers les catégories d'affichage simplifiées et vice versa
// ============================================================================

/**
 * Catégories d'affichage pour les charges (formulaire simplifié)
 */
export const EXPENSE_DISPLAY_CATEGORIES = [
  { value: 'LOGEMENT', label: 'Logement' },
  { value: 'ALIMENTATION', label: 'Alimentation' },
  { value: 'TRANSPORT', label: 'Transport' },
  { value: 'SANTE', label: 'Santé' },
  { value: 'ASSURANCES', label: 'Assurances' },
  { value: 'LOISIRS', label: 'Loisirs & Vacances' },
  { value: 'ETUDES', label: 'Éducation' },
  { value: 'IMPOTS', label: 'Impôts & Taxes' },
  { value: 'EPARGNE', label: 'Épargne programmée' },
  { value: 'AUTRES', label: 'Autres dépenses' },
]

/**
 * Catégories d'affichage pour les revenus (formulaire simplifié)
 */
export const REVENUE_DISPLAY_CATEGORIES = [
  { value: 'SALAIRE', label: 'Salaire' },
  { value: 'LOCATIF', label: 'Revenus locatifs' },
  { value: 'DIVIDENDES', label: 'Dividendes' },
  { value: 'INTERETS', label: 'Intérêts' },
  { value: 'PENSION', label: 'Pensions & Retraites' },
  { value: 'ALLOCATIONS', label: 'Allocations' },
  { value: 'PROFESSIONNEL', label: 'Revenus professionnels' },
  { value: 'AUTRES', label: 'Autres revenus' },
]

/**
 * Mappe une catégorie de charge (générique ou Prisma) vers son groupe d'affichage
 * Ex: 'LOYER' → 'LOGEMENT', 'LOGEMENT' → 'LOGEMENT'
 */
export function mapExpenseCategoryToDisplayGroup(category: string | null | undefined): string {
  if (!category) return 'AUTRES'
  
  const mapping: Record<string, string> = {
    // Catégories génériques (formulaire simplifié) - identité
    'LOGEMENT': 'LOGEMENT',
    'TRANSPORT': 'TRANSPORT',
    'SANTE': 'SANTE',
    'ASSURANCES': 'ASSURANCES',
    'LOISIRS': 'LOISIRS',
    'ETUDES': 'ETUDES',
    'IMPOTS': 'IMPOTS',
    'EPARGNE': 'EPARGNE',
    'ALIMENTATION': 'ALIMENTATION',
    'AUTRES': 'AUTRES',
    // Logement (sous-catégories Prisma)
    'LOYER': 'LOGEMENT',
    'CHARGES_COPROPRIETE': 'LOGEMENT',
    'TAXE_FONCIERE': 'LOGEMENT',
    'TAXE_HABITATION': 'LOGEMENT',
    'ELECTRICITE_GAZ': 'LOGEMENT',
    'EAU': 'LOGEMENT',
    'INTERNET_TELEPHONE': 'LOGEMENT',
    'TRAVAUX_ENTRETIEN': 'LOGEMENT',
    'FRAIS_GESTION_LOCATIVE': 'LOGEMENT',
    'CREDIT_IMMOBILIER_RP': 'LOGEMENT',
    'CREDIT_IMMOBILIER_LOCATIF': 'LOGEMENT',
    // Transport (sous-catégories Prisma)
    'CREDIT_AUTO': 'TRANSPORT',
    'CARBURANT': 'TRANSPORT',
    'ENTRETIEN_VEHICULE': 'TRANSPORT',
    'PARKING': 'TRANSPORT',
    'TRANSPORT_COMMUN': 'TRANSPORT',
    'PEAGES': 'TRANSPORT',
    // Santé (sous-catégories Prisma)
    'MUTUELLE': 'SANTE',
    'FRAIS_MEDICAUX': 'SANTE',
    'OPTIQUE_DENTAIRE': 'SANTE',
    // Assurances (sous-catégories Prisma)
    'ASSURANCE_HABITATION': 'ASSURANCES',
    'ASSURANCE_AUTO': 'ASSURANCES',
    'PREVOYANCE': 'ASSURANCES',
    'ASSURANCE_EMPRUNTEUR': 'ASSURANCES',
    'PROTECTION_JURIDIQUE': 'ASSURANCES',
    'GAV': 'ASSURANCES',
    // Famille / Études (sous-catégories Prisma)
    'GARDE_ENFANTS': 'ETUDES',
    'SCOLARITE': 'ETUDES',
    'ACTIVITES_ENFANTS': 'ETUDES',
    'ETUDES_SUPERIEURES': 'ETUDES',
    // Épargne (sous-catégories Prisma)
    'ASSURANCE_VIE_PRIMES': 'EPARGNE',
    'VERSEMENT_PER': 'EPARGNE',
    'VERSEMENT_PERP': 'EPARGNE',
    'VERSEMENT_EPARGNE': 'EPARGNE',
    'INVESTISSEMENT_FIP_FCPI': 'EPARGNE',
    'INVESTISSEMENT_SOFICA': 'EPARGNE',
    // Impôts (sous-catégories Prisma)
    'IMPOT_REVENU': 'IMPOTS',
    'IFI': 'IMPOTS',
    'PRELEVEMENTS_SOCIAUX': 'IMPOTS',
    'CFE': 'IMPOTS',
    // Loisirs (sous-catégories Prisma)
    'ABONNEMENTS_LOISIRS': 'LOISIRS',
    // Autres (sous-catégories Prisma)
    'PENSION_ALIMENTAIRE_VERSEE': 'AUTRES',
    'CREDIT_CONSOMMATION': 'AUTRES',
    'CREDIT_REVOLVING': 'AUTRES',
    'COTISATIONS_SOCIALES': 'AUTRES',
    'FRAIS_COMPTABILITE': 'AUTRES',
    'COTISATION_SYNDICALE': 'AUTRES',
    'FORMATION_PROFESSIONNELLE': 'AUTRES',
    'DONS': 'AUTRES',
    'EMPLOI_DOMICILE': 'AUTRES',
    'AUTRE_CHARGE': 'AUTRES',
  }
  
  return mapping[category] || 'AUTRES'
}

/**
 * Mappe une catégorie de revenu (générique ou Prisma) vers son groupe d'affichage
 * Ex: 'REVENUS_FONCIERS' → 'LOCATIF', 'SALAIRE' → 'SALAIRE'
 */
export function mapRevenueCategoryToDisplayGroup(category: string | null | undefined): string {
  if (!category) return 'AUTRES'
  
  const mapping: Record<string, string> = {
    // Catégories génériques (formulaire simplifié) - identité
    'SALAIRE': 'SALAIRE',
    'LOCATIF': 'LOCATIF',
    'DIVIDENDES': 'DIVIDENDES',
    'INTERETS': 'INTERETS',
    'PENSION': 'PENSION',
    'ALLOCATIONS': 'ALLOCATIONS',
    'PROFESSIONNEL': 'PROFESSIONNEL',
    'AUTRES': 'AUTRES',
    // Salaires (sous-catégories Prisma)
    'PRIME': 'SALAIRE',
    'BONUS': 'SALAIRE',
    'AVANTAGE_NATURE': 'SALAIRE',
    'INDEMNITE_LICENCIEMENT': 'SALAIRE',
    'INDEMNITE_RUPTURE_CONVENTIONNELLE': 'SALAIRE',
    // Professionnel (sous-catégories Prisma)
    'BIC': 'PROFESSIONNEL',
    'BNC': 'PROFESSIONNEL',
    'BA': 'PROFESSIONNEL',
    'HONORAIRES': 'PROFESSIONNEL',
    'DROITS_AUTEUR': 'PROFESSIONNEL',
    'REMUNERATION_GERANT': 'PROFESSIONNEL',
    // Locatif (sous-catégories Prisma)
    'REVENUS_FONCIERS': 'LOCATIF',
    'LMNP': 'LOCATIF',
    'LMP': 'LOCATIF',
    'LOCATION_SAISONNIERE': 'LOCATIF',
    'SCPI': 'LOCATIF',
    // Pension / Retraite (sous-catégories Prisma)
    'PENSION_RETRAITE': 'PENSION',
    'RETRAITE_COMPLEMENTAIRE': 'PENSION',
    'PER_RENTE': 'PENSION',
    'PENSION_REVERSION': 'PENSION',
    'RENTE_VIAGERE': 'PENSION',
    // Allocations (sous-catégories Prisma)
    'PENSION_ALIMENTAIRE_RECUE': 'ALLOCATIONS',
    'PENSION_INVALIDITE': 'ALLOCATIONS',
    'ALLOCATION_CHOMAGE': 'ALLOCATIONS',
    'RSA': 'ALLOCATIONS',
    'ALLOCATIONS_FAMILIALES': 'ALLOCATIONS',
    'APL': 'ALLOCATIONS',
    // Autres (sous-catégories Prisma)
    'JETONS_PRESENCE': 'AUTRES',
    'PLUS_VALUES_MOBILIERES': 'AUTRES',
    'ASSURANCE_VIE_RACHAT': 'AUTRES',
    'CRYPTO': 'AUTRES',
    'REVENU_EXCEPTIONNEL': 'AUTRES',
    'AUTRE': 'AUTRES',
  }
  
  return mapping[category] || 'AUTRES'
}

/**
 * Obtient la configuration d'affichage pour une catégorie de charge
 */
export function getExpenseCategoryConfig(category: string | null | undefined): { value: string; label: string } {
  const group = mapExpenseCategoryToDisplayGroup(category)
  return EXPENSE_DISPLAY_CATEGORIES.find(c => c.value === group) || { value: 'AUTRES', label: 'Autres dépenses' }
}

/**
 * Obtient la configuration d'affichage pour une catégorie de revenu
 */
export function getRevenueCategoryConfig(category: string | null | undefined): { value: string; label: string } {
  const group = mapRevenueCategoryToDisplayGroup(category)
  return REVENUE_DISPLAY_CATEGORIES.find(c => c.value === group) || { value: 'AUTRES', label: 'Autres revenus' }
}
