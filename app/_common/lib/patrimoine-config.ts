/**
 * Configuration centralisée du patrimoine
 * Types d'actifs, passifs, dispositifs fiscaux, clauses bénéficiaires, etc.
 * Conforme aux standards G-CGP et réglementations françaises 2025
 */

// =============================================================================
// TYPES D'ACTIFS - Correspond exactement à ActifType de Prisma
// =============================================================================

// Migration 2024-12-10: Valeurs FR uniformes (alignées avec Prisma)
export type ActifTypeValue =
  // Immobilier (valeurs FR)
  | 'RESIDENCE_PRINCIPALE' | 'IMMOBILIER_LOCATIF' | 'RESIDENCE_SECONDAIRE' | 'IMMOBILIER_COMMERCIAL'
  | 'SCPI' | 'SCI' | 'OPCI' | 'CROWDFUNDING_IMMO' | 'VIAGER' | 'NUE_PROPRIETE' | 'USUFRUIT'
  // Épargne salariale
  | 'PEE' | 'PEG' | 'PERCO' | 'PERECO' | 'CET' | 'PARTICIPATION' | 'INTERESSEMENT'
  | 'STOCK_OPTIONS' | 'ACTIONS_GRATUITES' | 'BSPCE'
  // Épargne retraite
  | 'PER' | 'PERP' | 'MADELIN' | 'ARTICLE_83' | 'PREFON' | 'COREM'
  // Placements financiers (valeurs FR)
  | 'ASSURANCE_VIE' | 'CONTRAT_CAPITALISATION' | 'COMPTE_TITRES' | 'PEA' | 'PEA_PME'
  // Épargne bancaire (valeurs FR)
  | 'COMPTE_BANCAIRE' | 'LIVRETS' | 'PEL' | 'CEL' | 'COMPTE_A_TERME'
  // Actifs professionnels (valeurs FR)
  | 'PARTS_SOCIALES' | 'IMMOBILIER_PRO' | 'MATERIEL_PRO' | 'FONDS_COMMERCE' | 'BREVETS_PI'
  // Mobilier & divers (valeurs FR)
  | 'METAUX_PRECIEUX' | 'BIJOUX' | 'OEUVRES_ART' | 'VINS' | 'MONTRES'
  | 'VEHICULES' | 'MOBILIER' | 'CRYPTO' | 'NFT'
  | 'AUTRE'

export type ActifCategoryValue = 
  | 'IMMOBILIER' | 'FINANCIER' | 'EPARGNE_SALARIALE' | 'EPARGNE_RETRAITE' 
  | 'PROFESSIONNEL' | 'MOBILIER' | 'AUTRE'

export interface ActifTypeConfig {
  value: ActifTypeValue
  label: string
  category: ActifCategoryValue
  description: string
  icon: string // Lucide icon name
  color: string // Hex color
  fields: string[] // Champs spécifiques requis
  taxable?: boolean // Imposable à l'IFI
  liquidable?: boolean // Facilement liquidable
}

export const ACTIF_TYPES: ActifTypeConfig[] = [
  // ==================== IMMOBILIER ====================
  {
    value: 'RESIDENCE_PRINCIPALE',
    label: 'Résidence principale',
    category: 'IMMOBILIER',
    description: 'Habitation principale du foyer',
    icon: 'Home',
    color: '#3B82F6',
    fields: ['propertyAddress', 'propertySurface', 'propertyRooms', 'propertyType', 'propertyCondition'],
    taxable: true,
    liquidable: false
  },
  {
    value: 'IMMOBILIER_LOCATIF',
    label: 'Immobilier locatif',
    category: 'IMMOBILIER',
    description: 'Bien mis en location',
    icon: 'Building2',
    color: '#10B981',
    fields: ['propertyAddress', 'propertySurface', 'rentalScheme', 'rentalMonthlyRent', 'rentalOccupancyRate', 'rentalTenantName'],
    taxable: true,
    liquidable: false
  },
  {
    value: 'RESIDENCE_SECONDAIRE',
    label: 'Résidence secondaire',
    category: 'IMMOBILIER',
    description: 'Maison de vacances, pied-à-terre',
    icon: 'TreePalm',
    color: '#F59E0B',
    fields: ['propertyAddress', 'propertySurface', 'propertyRooms', 'propertyType'],
    taxable: true,
    liquidable: false
  },
  {
    value: 'IMMOBILIER_COMMERCIAL',
    label: 'Immobilier commercial',
    category: 'IMMOBILIER',
    description: 'Local commercial, bureaux',
    icon: 'Store',
    color: '#6366F1',
    fields: ['propertyAddress', 'propertySurface', 'rentalMonthlyRent', 'rentalTenantName'],
    taxable: true,
    liquidable: false
  },
  {
    value: 'SCPI',
    label: 'SCPI',
    category: 'IMMOBILIER',
    description: 'Société Civile de Placement Immobilier',
    icon: 'Building',
    color: '#8B5CF6',
    fields: ['insurerName', 'contractNumber', 'fundsAllocation'],
    taxable: true,
    liquidable: true
  },
  {
    value: 'SCI',
    label: 'SCI',
    category: 'IMMOBILIER',
    description: 'Société Civile Immobilière',
    icon: 'Users',
    color: '#EC4899',
    fields: ['companyName', 'companySiren', 'companySharesCount'],
    taxable: true,
    liquidable: false
  },
  {
    value: 'OPCI',
    label: 'OPCI',
    category: 'IMMOBILIER',
    description: 'Organisme de Placement Collectif Immobilier',
    icon: 'Layers',
    color: '#14B8A6',
    fields: ['insurerName', 'contractNumber'],
    taxable: true,
    liquidable: true
  },
  {
    value: 'CROWDFUNDING_IMMO',
    label: 'Crowdfunding immobilier',
    category: 'IMMOBILIER',
    description: 'Financement participatif immobilier',
    icon: 'Users',
    color: '#F97316',
    fields: ['insurerName', 'contractNumber', 'availabilityDate'],
    taxable: false,
    liquidable: false
  },
  {
    value: 'VIAGER',
    label: 'Viager',
    category: 'IMMOBILIER',
    description: 'Acquisition en viager',
    icon: 'Clock',
    color: '#84CC16',
    fields: ['propertyAddress', 'dismembermentType'],
    taxable: true,
    liquidable: false
  },
  {
    value: 'NUE_PROPRIETE',
    label: 'Nue-propriété',
    category: 'IMMOBILIER',
    description: 'Propriété sans usufruit',
    icon: 'Key',
    color: '#06B6D4',
    fields: ['propertyAddress', 'dismembermentEndDate', 'usufructuaryName'],
    taxable: false,
    liquidable: false
  },
  {
    value: 'USUFRUIT',
    label: 'Usufruit',
    category: 'IMMOBILIER',
    description: 'Droit d\'usage sans propriété',
    icon: 'KeyRound',
    color: '#0EA5E9',
    fields: ['propertyAddress', 'dismembermentEndDate', 'bareOwnerName'],
    taxable: true,
    liquidable: false
  },

  // ==================== ÉPARGNE SALARIALE ====================
  {
    value: 'PEE',
    label: 'PEE',
    category: 'EPARGNE_SALARIALE',
    description: 'Plan d\'Épargne Entreprise',
    icon: 'Briefcase',
    color: '#3B82F6',
    fields: ['employerName', 'availabilityDate', 'fundsAllocation'],
    taxable: false,
    liquidable: false
  },
  {
    value: 'PEG',
    label: 'PEG',
    category: 'EPARGNE_SALARIALE',
    description: 'Plan d\'Épargne Groupe',
    icon: 'Building2',
    color: '#6366F1',
    fields: ['employerName', 'availabilityDate', 'fundsAllocation'],
    taxable: false,
    liquidable: false
  },
  {
    value: 'PERCO',
    label: 'PERCO',
    category: 'EPARGNE_SALARIALE',
    description: 'Plan d\'Épargne Retraite Collectif (ancien)',
    icon: 'Wallet',
    color: '#8B5CF6',
    fields: ['employerName', 'availabilityDate', 'fundsAllocation'],
    taxable: false,
    liquidable: false
  },
  {
    value: 'PERECO',
    label: 'PER Collectif',
    category: 'EPARGNE_SALARIALE',
    description: 'PER Entreprise Collectif (nouveau)',
    icon: 'PiggyBank',
    color: '#EC4899',
    fields: ['employerName', 'availabilityDate', 'fundsAllocation'],
    taxable: false,
    liquidable: false
  },
  {
    value: 'CET',
    label: 'CET',
    category: 'EPARGNE_SALARIALE',
    description: 'Compte Épargne Temps',
    icon: 'Clock',
    color: '#F59E0B',
    fields: ['employerName'],
    taxable: false,
    liquidable: false
  },
  {
    value: 'PARTICIPATION',
    label: 'Participation',
    category: 'EPARGNE_SALARIALE',
    description: 'Prime de participation',
    icon: 'Users',
    color: '#10B981',
    fields: ['employerName', 'availabilityDate'],
    taxable: false,
    liquidable: false
  },
  {
    value: 'INTERESSEMENT',
    label: 'Intéressement',
    category: 'EPARGNE_SALARIALE',
    description: 'Prime d\'intéressement',
    icon: 'TrendingUp',
    color: '#14B8A6',
    fields: ['employerName', 'availabilityDate'],
    taxable: false,
    liquidable: false
  },
  {
    value: 'STOCK_OPTIONS',
    label: 'Stock-options',
    category: 'EPARGNE_SALARIALE',
    description: 'Options sur actions',
    icon: 'Zap',
    color: '#F97316',
    fields: ['employerName', 'vestingSchedule', 'unvestedAmount'],
    taxable: false,
    liquidable: false
  },
  {
    value: 'ACTIONS_GRATUITES',
    label: 'Actions gratuites',
    category: 'EPARGNE_SALARIALE',
    description: 'Attribution gratuite d\'actions',
    icon: 'Gift',
    color: '#EF4444',
    fields: ['employerName', 'vestingSchedule', 'availabilityDate'],
    taxable: false,
    liquidable: false
  },
  {
    value: 'BSPCE',
    label: 'BSPCE',
    category: 'EPARGNE_SALARIALE',
    description: 'Bons de Souscription de Parts de Créateur d\'Entreprise',
    icon: 'Rocket',
    color: '#6366F1',
    fields: ['employerName', 'vestingSchedule'],
    taxable: false,
    liquidable: false
  },

  // ==================== ÉPARGNE RETRAITE ====================
  {
    value: 'PER',
    label: 'PER Individuel',
    category: 'EPARGNE_RETRAITE',
    description: 'Plan d\'Épargne Retraite individuel',
    icon: 'PiggyBank',
    color: '#3B82F6',
    fields: ['insurerName', 'contractNumber', 'contractOpenDate', 'totalPremiums', 'fundsAllocation'],
    taxable: false,
    liquidable: false
  },
  {
    value: 'PERP',
    label: 'PERP',
    category: 'EPARGNE_RETRAITE',
    description: 'Plan d\'Épargne Retraite Populaire (fermé)',
    icon: 'Landmark',
    color: '#6366F1',
    fields: ['insurerName', 'contractNumber', 'contractOpenDate', 'totalPremiums'],
    taxable: false,
    liquidable: false
  },
  {
    value: 'MADELIN',
    label: 'Contrat Madelin',
    category: 'EPARGNE_RETRAITE',
    description: 'Épargne retraite TNS (fermé)',
    icon: 'Briefcase',
    color: '#8B5CF6',
    fields: ['insurerName', 'contractNumber', 'contractOpenDate', 'totalPremiums'],
    taxable: false,
    liquidable: false
  },
  {
    value: 'ARTICLE_83',
    label: 'Article 83',
    category: 'EPARGNE_RETRAITE',
    description: 'Retraite supplémentaire entreprise (ancien)',
    icon: 'Building',
    color: '#EC4899',
    fields: ['employerName', 'insurerName', 'contractNumber'],
    taxable: false,
    liquidable: false
  },
  {
    value: 'PREFON',
    label: 'PREFON',
    category: 'EPARGNE_RETRAITE',
    description: 'Retraite complémentaire fonctionnaires',
    icon: 'Shield',
    color: '#10B981',
    fields: ['contractNumber', 'totalPremiums'],
    taxable: false,
    liquidable: false
  },
  {
    value: 'COREM',
    label: 'COREM',
    category: 'EPARGNE_RETRAITE',
    description: 'Complément Retraite Mutualiste',
    icon: 'Heart',
    color: '#14B8A6',
    fields: ['contractNumber', 'totalPremiums'],
    taxable: false,
    liquidable: false
  },

  // ==================== PLACEMENTS FINANCIERS ====================
  {
    value: 'ASSURANCE_VIE',
    label: 'Assurance-vie',
    category: 'FINANCIER',
    description: 'Contrat d\'assurance-vie',
    icon: 'Shield',
    color: '#3B82F6',
    fields: ['insurerName', 'contractNumber', 'contractOpenDate', 'beneficiaryClause', 'beneficiaryClauseType', 'beneficiaries', 'totalPremiums', 'premiumsBefore70', 'premiumsAfter70', 'fundsAllocation', 'managementMode'],
    taxable: false,
    liquidable: true
  },
  {
    value: 'CONTRAT_CAPITALISATION',
    label: 'Contrat de capitalisation',
    category: 'FINANCIER',
    description: 'Contrat de capitalisation',
    icon: 'TrendingUp',
    color: '#6366F1',
    fields: ['insurerName', 'contractNumber', 'contractOpenDate', 'totalPremiums', 'fundsAllocation'],
    taxable: true,
    liquidable: true
  },
  {
    value: 'COMPTE_TITRES',
    label: 'Compte-titres ordinaire',
    category: 'FINANCIER',
    description: 'CTO - Compte-titres',
    icon: 'LineChart',
    color: '#8B5CF6',
    fields: ['brokerName', 'accountNumber', 'portfolioLines', 'dividendsReceived'],
    taxable: false,
    liquidable: true
  },
  {
    value: 'PEA',
    label: 'PEA',
    category: 'FINANCIER',
    description: 'Plan d\'Épargne en Actions',
    icon: 'BarChart3',
    color: '#10B981',
    fields: ['brokerName', 'accountNumber', 'contractOpenDate', 'portfolioLines'],
    taxable: false,
    liquidable: true
  },
  {
    value: 'PEA_PME',
    label: 'PEA-PME',
    category: 'FINANCIER',
    description: 'PEA dédié aux PME/ETI',
    icon: 'BarChart2',
    color: '#14B8A6',
    fields: ['brokerName', 'accountNumber', 'contractOpenDate', 'portfolioLines'],
    taxable: false,
    liquidable: true
  },

  // ==================== ÉPARGNE BANCAIRE ====================
  {
    value: 'COMPTE_BANCAIRE',
    label: 'Compte courant',
    category: 'FINANCIER',
    description: 'Compte bancaire de dépôt',
    icon: 'CreditCard',
    color: '#6B7280',
    fields: ['brokerName', 'accountNumber'],
    taxable: false,
    liquidable: true
  },
  {
    value: 'LIVRETS',
    label: 'Livret d\'épargne',
    category: 'FINANCIER',
    description: 'Livret A, LDDS, LEP, Livret Jeune',
    icon: 'Wallet',
    color: '#10B981',
    fields: ['brokerName', 'accountNumber', 'contractOpenDate'],
    taxable: false,
    liquidable: true
  },
  {
    value: 'PEL',
    label: 'PEL',
    category: 'FINANCIER',
    description: 'Plan Épargne Logement',
    icon: 'Home',
    color: '#F59E0B',
    fields: ['brokerName', 'accountNumber', 'contractOpenDate'],
    taxable: false,
    liquidable: true
  },
  {
    value: 'CEL',
    label: 'CEL',
    category: 'FINANCIER',
    description: 'Compte Épargne Logement',
    icon: 'Key',
    color: '#F97316',
    fields: ['brokerName', 'accountNumber', 'contractOpenDate'],
    taxable: false,
    liquidable: true
  },
  {
    value: 'COMPTE_A_TERME',
    label: 'Compte à terme',
    category: 'FINANCIER',
    description: 'Dépôt à terme',
    icon: 'Lock',
    color: '#6366F1',
    fields: ['brokerName', 'accountNumber', 'availabilityDate'],
    taxable: false,
    liquidable: false
  },

  // ==================== ACTIFS PROFESSIONNELS ====================
  {
    value: 'PARTS_SOCIALES',
    label: 'Parts sociales / Actions',
    category: 'PROFESSIONNEL',
    description: 'Participation au capital d\'entreprise',
    icon: 'Building2',
    color: '#3B82F6',
    fields: ['companyName', 'companySiren', 'companyLegalForm', 'companySharesCount', 'companyTotalShares'],
    taxable: false,
    liquidable: false
  },
  {
    value: 'IMMOBILIER_PRO',
    label: 'Immobilier professionnel',
    category: 'PROFESSIONNEL',
    description: 'Locaux professionnels détenus',
    icon: 'Store',
    color: '#6366F1',
    fields: ['propertyAddress', 'propertySurface', 'companyName'],
    taxable: false,
    liquidable: false
  },
  {
    value: 'MATERIEL_PRO',
    label: 'Matériel professionnel',
    category: 'PROFESSIONNEL',
    description: 'Équipements, machines, véhicules pro',
    icon: 'Wrench',
    color: '#8B5CF6',
    fields: ['companyName', 'objectBrand', 'objectModel'],
    taxable: false,
    liquidable: false
  },
  {
    value: 'FONDS_COMMERCE',
    label: 'Fonds de commerce',
    category: 'PROFESSIONNEL',
    description: 'Fonds de commerce, clientèle',
    icon: 'ShoppingBag',
    color: '#EC4899',
    fields: ['companyName', 'propertyAddress'],
    taxable: false,
    liquidable: false
  },
  {
    value: 'BREVETS_PI',
    label: 'Brevets et PI',
    category: 'PROFESSIONNEL',
    description: 'Brevets, marques, propriété intellectuelle',
    icon: 'Lightbulb',
    color: '#F59E0B',
    fields: ['companyName'],
    taxable: false,
    liquidable: false
  },

  // ==================== MOBILIER & DIVERS ====================
  {
    value: 'METAUX_PRECIEUX',
    label: 'Or et métaux précieux',
    category: 'MOBILIER',
    description: 'Or, argent, platine (lingots, pièces)',
    icon: 'Gem',
    color: '#EAB308',
    fields: ['objectBrand', 'objectSerial', 'objectCertificate', 'lastAppraisalDate', 'lastAppraisalValue'],
    taxable: true,
    liquidable: true
  },
  {
    value: 'BIJOUX',
    label: 'Bijoux',
    category: 'MOBILIER',
    description: 'Bijoux, joaillerie',
    icon: 'Diamond',
    color: '#EC4899',
    fields: ['objectBrand', 'objectModel', 'objectSerial', 'objectCertificate', 'objectInsured', 'objectInsuranceValue', 'lastAppraisalDate', 'lastAppraisalValue'],
    taxable: true,
    liquidable: true
  },
  {
    value: 'OEUVRES_ART',
    label: 'Œuvres d\'art / Tableaux',
    category: 'MOBILIER',
    description: 'Peintures, sculptures, photographies',
    icon: 'Image',
    color: '#8B5CF6',
    fields: ['objectBrand', 'objectModel', 'objectCertificate', 'objectInsured', 'objectInsuranceValue', 'lastAppraisalDate', 'lastAppraisalValue'],
    taxable: true,
    liquidable: true
  },
  {
    value: 'VINS',
    label: 'Vins et spiritueux',
    category: 'MOBILIER',
    description: 'Cave à vins, grands crus',
    icon: 'Wine',
    color: '#DC2626',
    fields: ['objectInsured', 'objectInsuranceValue', 'lastAppraisalDate', 'lastAppraisalValue'],
    taxable: true,
    liquidable: true
  },
  {
    value: 'MONTRES',
    label: 'Montres de collection',
    category: 'MOBILIER',
    description: 'Montres de luxe et collection',
    icon: 'Watch',
    color: '#1E293B',
    fields: ['objectBrand', 'objectModel', 'objectSerial', 'objectCertificate', 'objectInsured', 'objectInsuranceValue', 'lastAppraisalDate', 'lastAppraisalValue'],
    taxable: true,
    liquidable: true
  },
  {
    value: 'VEHICULES',
    label: 'Véhicules',
    category: 'MOBILIER',
    description: 'Voiture, moto, bateau, avion',
    icon: 'Car',
    color: '#3B82F6',
    fields: ['vehicleBrand', 'vehicleModel', 'vehicleYear', 'vehicleRegistration', 'vehicleMileage', 'objectInsured', 'objectInsuranceValue'],
    taxable: false,
    liquidable: true
  },
  {
    value: 'MOBILIER',
    label: 'Mobilier de valeur',
    category: 'MOBILIER',
    description: 'Meubles anciens, design',
    icon: 'Armchair',
    color: '#78350F',
    fields: ['objectBrand', 'objectInsured', 'objectInsuranceValue', 'lastAppraisalDate', 'lastAppraisalValue'],
    taxable: true,
    liquidable: true
  },
  {
    value: 'CRYPTO',
    label: 'Cryptomonnaies',
    category: 'MOBILIER',
    description: 'Bitcoin, Ethereum, altcoins',
    icon: 'Bitcoin',
    color: '#F97316',
    fields: ['walletAddress', 'exchangePlatform', 'tokenSymbol', 'tokenQuantity'],
    taxable: false,
    liquidable: true
  },
  {
    value: 'NFT',
    label: 'NFT / Actifs numériques',
    category: 'MOBILIER',
    description: 'Tokens non fongibles',
    icon: 'Sparkles',
    color: '#6366F1',
    fields: ['walletAddress', 'exchangePlatform'],
    taxable: false,
    liquidable: true
  },
  {
    value: 'AUTRE',
    label: 'Autre actif',
    category: 'AUTRE',
    description: 'Autre type d\'actif',
    icon: 'Package',
    color: '#6B7280',
    fields: [],
    taxable: false,
    liquidable: false
  },
]

// =============================================================================
// CATÉGORIES D'ACTIFS
// =============================================================================

export interface CategoryConfig {
  value: ActifCategoryValue
  label: string
  description: string
  icon: string
  color: string
  bgColor: string
}

export const ACTIF_CATEGORIES: CategoryConfig[] = [
  {
    value: 'IMMOBILIER',
    label: 'Immobilier',
    description: 'Biens immobiliers, SCPI, SCI',
    icon: 'Home',
    color: '#3B82F6',
    bgColor: 'bg-blue-50'
  },
  {
    value: 'FINANCIER',
    label: 'Placements financiers',
    description: 'Assurance-vie, PEA, comptes bancaires',
    icon: 'TrendingUp',
    color: '#10B981',
    bgColor: 'bg-emerald-50'
  },
  {
    value: 'EPARGNE_SALARIALE',
    label: 'Épargne salariale',
    description: 'PEE, PERCO, participation, intéressement',
    icon: 'Briefcase',
    color: '#8B5CF6',
    bgColor: 'bg-purple-50'
  },
  {
    value: 'EPARGNE_RETRAITE',
    label: 'Épargne retraite',
    description: 'PER, PERP, Madelin, Article 83',
    icon: 'PiggyBank',
    color: '#EC4899',
    bgColor: 'bg-pink-50'
  },
  {
    value: 'PROFESSIONNEL',
    label: 'Actifs professionnels',
    description: 'Parts sociales, fonds de commerce',
    icon: 'Building2',
    color: '#F59E0B',
    bgColor: 'bg-amber-50'
  },
  {
    value: 'MOBILIER',
    label: 'Mobilier & objets de valeur',
    description: 'Or, bijoux, montres, œuvres d\'art, véhicules',
    icon: 'Gem',
    color: '#EF4444',
    bgColor: 'bg-red-50'
  },
  {
    value: 'AUTRE',
    label: 'Autres actifs',
    description: 'Actifs divers',
    icon: 'Package',
    color: '#6B7280',
    bgColor: 'bg-gray-50'
  },
]

// =============================================================================
// DISPOSITIFS FISCAUX IMMOBILIER LOCATIF
// =============================================================================

export interface RentalSchemeConfig {
  value: string
  label: string
  description: string
  duration?: string // Durée d'engagement
  taxBenefit: string // Avantage fiscal principal
  conditions: string[]
  maxRent?: boolean // Plafond de loyer
  maxIncome?: boolean // Plafond de ressources locataire
}

export const RENTAL_SCHEMES: RentalSchemeConfig[] = [
  {
    value: 'NUE',
    label: 'Location nue (régime réel)',
    description: 'Location nue classique avec déduction des charges réelles',
    taxBenefit: 'Déduction des charges réelles (intérêts, travaux, etc.)',
    conditions: ['Revenus fonciers > 15 000 €/an ou option'],
  },
  {
    value: 'MICRO_FONCIER',
    label: 'Location nue (micro-foncier)',
    description: 'Abattement forfaitaire de 30%',
    taxBenefit: 'Abattement 30% sur les loyers',
    conditions: ['Revenus fonciers < 15 000 €/an'],
  },
  {
    value: 'LMNP',
    label: 'LMNP - Loueur Meublé Non Pro',
    description: 'Location meublée avec amortissement',
    taxBenefit: 'Amortissement du bien, charges déductibles, BIC',
    conditions: ['Recettes < 23 000 €/an ou < 50% revenus foyer'],
  },
  {
    value: 'LMP',
    label: 'LMP - Loueur Meublé Pro',
    description: 'Location meublée professionnelle',
    taxBenefit: 'Déficit imputable sur revenu global, exonération PV',
    conditions: ['Recettes > 23 000 €/an ET > 50% revenus foyer'],
  },
  {
    value: 'DEFICIT_FONCIER',
    label: 'Déficit foncier',
    description: 'Travaux déductibles des revenus fonciers puis globaux',
    taxBenefit: 'Imputation déficit sur revenu global (max 10 700 €/an)',
    conditions: ['Travaux déductibles', 'Location nue 3 ans min'],
  },
  {
    value: 'PINEL',
    label: 'Pinel / Pinel+',
    description: 'Réduction d\'impôt pour investissement locatif neuf',
    duration: '6, 9 ou 12 ans',
    taxBenefit: 'Réduction IR jusqu\'à 21% du prix (Pinel+)',
    conditions: ['Zones A bis, A, B1', 'Plafonds loyers et ressources'],
    maxRent: true,
    maxIncome: true,
  },
  {
    value: 'DENORMANDIE',
    label: 'Denormandie',
    description: 'Pinel dans l\'ancien avec travaux',
    duration: '6, 9 ou 12 ans',
    taxBenefit: 'Réduction IR jusqu\'à 21%',
    conditions: ['Travaux 25% min du coût total', 'Centres-villes éligibles'],
    maxRent: true,
    maxIncome: true,
  },
  {
    value: 'MALRAUX',
    label: 'Malraux',
    description: 'Réduction d\'impôt pour restauration immeubles anciens',
    duration: 'Travaux sur 4 ans max',
    taxBenefit: 'Réduction 22% ou 30% des travaux',
    conditions: ['Secteurs sauvegardés ou ZPPAUP', 'Location 9 ans'],
    maxRent: false,
    maxIncome: false,
  },
  {
    value: 'MONUMENT_HISTORIQUE',
    label: 'Monument Historique',
    description: 'Déduction travaux et intérêts du revenu global',
    taxBenefit: 'Charges déductibles sans plafond du revenu global',
    conditions: ['Immeuble classé ou inscrit', 'Conservation 15 ans'],
  },
  {
    value: 'COSSE',
    label: 'Cosse / Loc\'Avantages',
    description: 'Déduction fiscale pour loyer conventionné',
    duration: '6 ou 9 ans',
    taxBenefit: 'Déduction 15% à 65% des revenus locatifs',
    conditions: ['Convention ANAH', 'Plafonds loyers et ressources'],
    maxRent: true,
    maxIncome: true,
  },
]

// =============================================================================
// CLAUSES BÉNÉFICIAIRES ASSURANCE-VIE
// =============================================================================

export interface BeneficiaryClauseTemplate {
  value: string
  label: string
  description: string
  template: string
  isDismembered: boolean
}

export const BENEFICIARY_CLAUSE_TEMPLATES: BeneficiaryClauseTemplate[] = [
  {
    value: 'STANDARD',
    label: 'Clause standard',
    description: 'Conjoint, à défaut enfants, à défaut héritiers',
    template: 'Mon conjoint, à défaut mes enfants nés ou à naître, vivants ou représentés, par parts égales entre eux, à défaut mes héritiers.',
    isDismembered: false,
  },
  {
    value: 'CONJOINT_SEUL',
    label: 'Conjoint seul',
    description: 'Uniquement le conjoint',
    template: 'Mon conjoint, Madame/Monsieur [NOM PRÉNOM], né(e) le [DATE] à [LIEU].',
    isDismembered: false,
  },
  {
    value: 'ENFANTS',
    label: 'Enfants uniquement',
    description: 'Enfants par parts égales',
    template: 'Mes enfants, nés ou à naître, vivants ou représentés, par parts égales entre eux.',
    isDismembered: false,
  },
  {
    value: 'DEMEMBREE_USUFRUIT_CONJOINT',
    label: 'Clause démembrée (usufruit conjoint)',
    description: 'Usufruit au conjoint, nue-propriété aux enfants',
    template: 'L\'usufruit au profit de mon conjoint, et la nue-propriété au profit de mes enfants, nés ou à naître, vivants ou représentés, par parts égales entre eux.',
    isDismembered: true,
  },
  {
    value: 'DEMEMBREE_QUASI_USUFRUIT',
    label: 'Clause démembrée avec quasi-usufruit',
    description: 'Quasi-usufruit au conjoint avec créance de restitution',
    template: 'L\'usufruit, avec faculté de quasi-usufruit sur les sommes d\'argent, au profit de mon conjoint, et la nue-propriété au profit de mes enfants, nés ou à naître, vivants ou représentés, par parts égales entre eux. Le conjoint survivant devra restituer l\'équivalent des sommes perçues au décès.',
    isDismembered: true,
  },
  {
    value: 'PERSONNALISEE',
    label: 'Clause personnalisée',
    description: 'Rédaction libre',
    template: '',
    isDismembered: false,
  },
]

// =============================================================================
// TYPES DE PASSIFS
// =============================================================================

// Migration 2024-12-10: Valeurs FR uniformes (alignées avec Prisma)
export type PassifTypeValue =
  | 'CREDIT_IMMOBILIER' | 'PTZ' | 'PRET_ACTION_LOGEMENT'
  | 'CREDIT_CONSOMMATION' | 'CREDIT_AUTO' | 'PRET_ETUDIANT'
  | 'PRET_PROFESSIONNEL' | 'CREDIT_REVOLVING' | 'PRET_RELAIS'
  | 'PRET_IN_FINE' | 'PRET_FAMILIAL' | 'DECOUVERT' | 'LEASING'
  | 'AUTRE'

export interface PassifTypeConfig {
  value: PassifTypeValue
  label: string
  description: string
  icon: string
  color: string
  bgColor: string
  requiresLinkedAsset: boolean // Doit être lié à un actif
  assetCategories?: ActifCategoryValue[] // Catégories d'actifs liables
}

export const PASSIF_TYPES: PassifTypeConfig[] = [
  {
    value: 'CREDIT_IMMOBILIER',
    label: 'Crédit immobilier',
    description: 'Prêt immobilier classique',
    icon: 'Home',
    color: '#3B82F6',
    bgColor: 'bg-blue-50',
    requiresLinkedAsset: true,
    assetCategories: ['IMMOBILIER'],
  },
  {
    value: 'PTZ',
    label: 'PTZ',
    description: 'Prêt à Taux Zéro',
    icon: 'BadgePercent',
    color: '#10B981',
    bgColor: 'bg-emerald-50',
    requiresLinkedAsset: true,
    assetCategories: ['IMMOBILIER'],
  },
  {
    value: 'PRET_ACTION_LOGEMENT',
    label: 'Prêt Action Logement',
    description: 'Prêt employeur à 1%',
    icon: 'Building2',
    color: '#6366F1',
    bgColor: 'bg-indigo-50',
    requiresLinkedAsset: true,
    assetCategories: ['IMMOBILIER'],
  },
  {
    value: 'CREDIT_CONSOMMATION',
    label: 'Crédit consommation',
    description: 'Prêt personnel, travaux, équipement',
    icon: 'CreditCard',
    color: '#F59E0B',
    bgColor: 'bg-amber-50',
    requiresLinkedAsset: false,
  },
  {
    value: 'CREDIT_AUTO',
    label: 'Crédit auto',
    description: 'Financement véhicule',
    icon: 'Car',
    color: '#8B5CF6',
    bgColor: 'bg-purple-50',
    requiresLinkedAsset: true,
    assetCategories: ['MOBILIER'],
  },
  {
    value: 'PRET_ETUDIANT',
    label: 'Prêt étudiant',
    description: 'Financement études',
    icon: 'GraduationCap',
    color: '#EC4899',
    bgColor: 'bg-pink-50',
    requiresLinkedAsset: false,
  },
  {
    value: 'PRET_PROFESSIONNEL',
    label: 'Prêt professionnel',
    description: 'Investissement entreprise, BFR',
    icon: 'Briefcase',
    color: '#14B8A6',
    bgColor: 'bg-teal-50',
    requiresLinkedAsset: false,
    assetCategories: ['PROFESSIONNEL'],
  },
  {
    value: 'CREDIT_REVOLVING',
    label: 'Crédit revolving',
    description: 'Réserve d\'argent renouvelable',
    icon: 'RotateCw',
    color: '#EF4444',
    bgColor: 'bg-red-50',
    requiresLinkedAsset: false,
  },
  {
    value: 'PRET_RELAIS',
    label: 'Prêt relais',
    description: 'En attente de vente',
    icon: 'ArrowLeftRight',
    color: '#06B6D4',
    bgColor: 'bg-cyan-50',
    requiresLinkedAsset: true,
    assetCategories: ['IMMOBILIER'],
  },
  {
    value: 'PRET_IN_FINE',
    label: 'Prêt in fine',
    description: 'Remboursement capital à échéance',
    icon: 'Calendar',
    color: '#84CC16',
    bgColor: 'bg-lime-50',
    requiresLinkedAsset: false,
  },
  {
    value: 'PRET_FAMILIAL',
    label: 'Prêt familial',
    description: 'Prêt entre particuliers',
    icon: 'Users',
    color: '#F97316',
    bgColor: 'bg-orange-50',
    requiresLinkedAsset: false,
  },
  {
    value: 'DECOUVERT',
    label: 'Découvert bancaire',
    description: 'Autorisation de découvert',
    icon: 'AlertTriangle',
    color: '#DC2626',
    bgColor: 'bg-red-50',
    requiresLinkedAsset: false,
  },
  {
    value: 'LEASING',
    label: 'Leasing / LOA',
    description: 'Location avec option d\'achat',
    icon: 'Key',
    color: '#0EA5E9',
    bgColor: 'bg-sky-50',
    requiresLinkedAsset: true,
    assetCategories: ['MOBILIER', 'PROFESSIONNEL'],
  },
  {
    value: 'AUTRE',
    label: 'Autre dette',
    description: 'Dette diverse',
    icon: 'Wallet',
    color: '#6B7280',
    bgColor: 'bg-gray-50',
    requiresLinkedAsset: false,
  },
]

// =============================================================================
// GARANTIES DU PRÊT
// =============================================================================

export interface GuaranteeTypeConfig {
  value: string
  label: string
  description: string
  costRange: string // Fourchette de coût
  restitution: boolean // Restitution partielle possible
}

export const GUARANTEE_TYPES: GuaranteeTypeConfig[] = [
  {
    value: 'HYPOTHEQUE',
    label: 'Hypothèque conventionnelle',
    description: 'Garantie réelle sur le bien',
    costRange: '1% à 2% du montant emprunté',
    restitution: false,
  },
  {
    value: 'PPD',
    label: 'Privilège de Prêteur de Deniers',
    description: 'Garantie pour l\'ancien (moins cher)',
    costRange: '0.5% à 1% du montant emprunté',
    restitution: false,
  },
  {
    value: 'CAUTION_CREDIT_LOGEMENT',
    label: 'Crédit Logement',
    description: 'Caution mutuelle la plus répandue',
    costRange: '~1.2% (restitution 70%)',
    restitution: true,
  },
  {
    value: 'CAUTION_SACCEF',
    label: 'SACCEF',
    description: 'Caisse d\'Épargne / Banque Populaire',
    costRange: '~1.25%',
    restitution: false,
  },
  {
    value: 'CAUTION_CAMCA',
    label: 'CAMCA',
    description: 'Crédit Agricole / LCL',
    costRange: '~1.4% (restitution 75%)',
    restitution: true,
  },
  {
    value: 'CAUTION_CASDEN',
    label: 'CASDEN',
    description: 'Fonctionnaires éducation nationale',
    costRange: '~0.9% (restitution 80%)',
    restitution: true,
  },
  {
    value: 'CAUTION_MGEN',
    label: 'MGEN',
    description: 'Adhérents MGEN',
    costRange: '~1% (restitution 75%)',
    restitution: true,
  },
  {
    value: 'NANTISSEMENT',
    label: 'Nantissement',
    description: 'Garantie sur contrat AV, PEA, SCPI',
    costRange: '~0.1%',
    restitution: false,
  },
  {
    value: 'AUCUNE',
    label: 'Sans garantie',
    description: 'Prêt non garanti',
    costRange: '0',
    restitution: false,
  },
]

// =============================================================================
// GARANTIES ASSURANCE EMPRUNTEUR
// =============================================================================

export interface InsuranceGuaranteeConfig {
  value: string
  label: string
  shortLabel: string
  description: string
  mandatory: boolean // Obligatoire pour prêt immo
  costImpact: 'low' | 'medium' | 'high'
}

export const INSURANCE_GUARANTEES: InsuranceGuaranteeConfig[] = [
  {
    value: 'DC',
    label: 'Décès',
    shortLabel: 'DC',
    description: 'Remboursement du capital en cas de décès',
    mandatory: true,
    costImpact: 'medium',
  },
  {
    value: 'PTIA',
    label: 'Perte Totale et Irréversible d\'Autonomie',
    shortLabel: 'PTIA',
    description: 'Invalidité totale nécessitant assistance',
    mandatory: true,
    costImpact: 'low',
  },
  {
    value: 'ITT',
    label: 'Incapacité Temporaire Totale de Travail',
    shortLabel: 'ITT',
    description: 'Arrêt de travail temporaire',
    mandatory: false,
    costImpact: 'medium',
  },
  {
    value: 'IPT',
    label: 'Invalidité Permanente Totale',
    shortLabel: 'IPT',
    description: 'Invalidité > 66%',
    mandatory: false,
    costImpact: 'medium',
  },
  {
    value: 'IPP',
    label: 'Invalidité Permanente Partielle',
    shortLabel: 'IPP',
    description: 'Invalidité entre 33% et 66%',
    mandatory: false,
    costImpact: 'high',
  },
  {
    value: 'PE',
    label: 'Perte d\'Emploi',
    shortLabel: 'PE',
    description: 'Chômage involontaire',
    mandatory: false,
    costImpact: 'high',
  },
  {
    value: 'MNO',
    label: 'Maladies Non Objectivables',
    shortLabel: 'MNO',
    description: 'Dos, psy (souvent exclus)',
    mandatory: false,
    costImpact: 'high',
  },
]

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Récupère la configuration d'un type d'actif
 */
export function getActifTypeConfig(type: ActifTypeValue): ActifTypeConfig | undefined {
  return ACTIF_TYPES.find(t => t.value === type)
}

/**
 * Récupère les types d'actifs par catégorie
 */
export function getActifTypesByCategory(category: ActifCategoryValue): ActifTypeConfig[] {
  return ACTIF_TYPES.filter(t => t.category === category)
}

/**
 * Récupère la configuration d'un type de passif
 */
export function getPassifTypeConfig(type: PassifTypeValue): PassifTypeConfig | undefined {
  return PASSIF_TYPES.find(t => t.value === type)
}

/**
 * Récupère la configuration d'un dispositif locatif
 */
export function getRentalSchemeConfig(scheme: string): RentalSchemeConfig | undefined {
  return RENTAL_SCHEMES.find(s => s.value === scheme)
}

/**
 * Récupère une clause bénéficiaire type
 */
export function getBeneficiaryClauseTemplate(type: string): BeneficiaryClauseTemplate | undefined {
  return BENEFICIARY_CLAUSE_TEMPLATES.find(c => c.value === type)
}

/**
 * Calcule la valeur IFI d'un actif immobilier
 */
export function calculateIFIValue(
  value: number,
  isMainResidence: boolean,
  manualDiscount?: number,
  linkedDebt?: number
): number {
  let ifiValue = value
  
  // Abattement 30% résidence principale
  if (isMainResidence) {
    ifiValue = ifiValue * 0.7
  }
  
  // Décote manuelle
  if (manualDiscount && manualDiscount > 0) {
    ifiValue = ifiValue * (1 - manualDiscount / 100)
  }
  
  // Déduction des dettes (crédit immobilier)
  if (linkedDebt && linkedDebt > 0) {
    ifiValue = Math.max(0, ifiValue - linkedDebt)
  }
  
  return ifiValue
}

/**
 * Calcule l'antériorité fiscale d'un contrat d'assurance-vie
 */
export function calculateContractAnteriority(openDate: Date): {
  years: number
  months: number
  has4Years: boolean
  has8Years: boolean
} {
  const now = new Date()
  const diff = now.getTime() - openDate.getTime()
  const years = Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000))
  const months = Math.floor((diff % (365.25 * 24 * 60 * 60 * 1000)) / (30.44 * 24 * 60 * 60 * 1000))
  
  return {
    years,
    months,
    has4Years: years >= 4,
    has8Years: years >= 8,
  }
}

export default {
  ACTIF_TYPES,
  ACTIF_CATEGORIES,
  PASSIF_TYPES,
  RENTAL_SCHEMES,
  BENEFICIARY_CLAUSE_TEMPLATES,
  GUARANTEE_TYPES,
  INSURANCE_GUARANTEES,
}
