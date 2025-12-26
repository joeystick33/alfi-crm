/**
 * Configuration centrale des features du CRM Aura
 * 
 * Ce fichier définit toutes les fonctionnalités activables/désactivables
 * par cabinet via le SuperAdmin.
 * 
 * Structure:
 * - SIMULATORS: Simulateurs financiers (premium)
 * - CALCULATORS: Calculateurs fiscaux (premium)
 * - MODULES: Modules additionnels (export, API, etc.)
 * - BASE_FEATURES: Fonctionnalités toujours incluses
 */

// =============================================================================
// Types
// =============================================================================

export type FeatureCategory = 'simulators' | 'calculators' | 'modules'

export interface FeatureDefinition {
  code: string
  name: string
  description: string
  category: FeatureCategory
  icon: string // Nom de l'icône Lucide
  defaultEnabled: boolean
  requiredPlan: 'TRIAL' | 'STARTER' | 'BUSINESS' | 'PREMIUM' | 'ALL'
  route?: string // Route vers la fonctionnalité
  prefillSupported?: boolean // Supporte le pré-remplissage depuis Client360
}

export interface CabinetFeatures {
  simulators: Record<string, boolean>
  calculators: Record<string, boolean>
  modules: Record<string, boolean>
  customLimits?: {
    maxSimulationsPerMonth?: number
    maxExportsPerMonth?: number
    maxClientsPortal?: number
  }
}

// =============================================================================
// Définition des Simulateurs
// =============================================================================

export const SIMULATORS: Record<string, FeatureDefinition> = {
  SIM_RETIREMENT: {
    code: 'SIM_RETIREMENT',
    name: 'Simulateur Retraite',
    description: 'Projection pension, capital nécessaire, stratégie épargne retraite',
    category: 'simulators',
    icon: 'Briefcase',
    defaultEnabled: false,
    requiredPlan: 'PREMIUM',
    route: '/dashboard/simulateurs/retirement',
    prefillSupported: true,
  },
  SIM_PER: {
    code: 'SIM_PER',
    name: 'Simulateur PER Salariés',
    description: 'Économie IR, projection capital, optimisation versements',
    category: 'simulators',
    icon: 'PiggyBank',
    defaultEnabled: false,
    requiredPlan: 'PREMIUM',
    route: '/dashboard/simulateurs/per-salaries',
    prefillSupported: true,
  },
  SIM_PER_TNS: {
    code: 'SIM_PER_TNS',
    name: 'Simulateur PER TNS (Madelin)',
    description: 'Plafonds Madelin, déduction fiscale, capital retraite',
    category: 'simulators',
    icon: 'PiggyBank',
    defaultEnabled: false,
    requiredPlan: 'PREMIUM',
    route: '/dashboard/simulateurs/per-tns',
    prefillSupported: true,
  },
  SIM_ASSURANCE_VIE: {
    code: 'SIM_ASSURANCE_VIE',
    name: 'Simulateur Assurance-Vie',
    description: 'Projection capital, fiscalité, rachat, succession',
    category: 'simulators',
    icon: 'Shield',
    defaultEnabled: false,
    requiredPlan: 'PREMIUM',
    route: '/dashboard/simulateurs/assurance-vie',
    prefillSupported: true,
  },
  SIM_IMMOBILIER: {
    code: 'SIM_IMMOBILIER',
    name: 'Simulateur Immobilier',
    description: 'Rentabilité, cash-flow, fiscalité LMNP/Pinel',
    category: 'simulators',
    icon: 'Home',
    defaultEnabled: false,
    requiredPlan: 'PREMIUM',
    route: '/dashboard/simulateurs/immobilier',
    prefillSupported: true,
  },
  SIM_SUCCESSION: {
    code: 'SIM_SUCCESSION',
    name: 'Simulateur Succession',
    description: 'Droits de succession, optimisation, stratégies transmission',
    category: 'simulators',
    icon: 'Users',
    defaultEnabled: false,
    requiredPlan: 'PREMIUM',
    route: '/dashboard/simulateurs/succession',
    prefillSupported: true,
  },
  SIM_PREVOYANCE: {
    code: 'SIM_PREVOYANCE',
    name: 'Simulateur Prévoyance TNS',
    description: 'Couverture décès, invalidité, gaps de couverture',
    category: 'simulators',
    icon: 'HeartPulse',
    defaultEnabled: false,
    requiredPlan: 'PREMIUM',
    route: '/dashboard/simulateurs/prevoyance-tns',
    prefillSupported: true,
  },
  SIM_DONATION: {
    code: 'SIM_DONATION',
    name: 'Simulateur Donation',
    description: 'Abattements, droits, stratégie de donation',
    category: 'simulators',
    icon: 'Gift',
    defaultEnabled: false,
    requiredPlan: 'PREMIUM',
    route: '/dashboard/simulateurs/donation-optimizer',
    prefillSupported: true,
  },
  SIM_EPARGNE: {
    code: 'SIM_EPARGNE',
    name: 'Simulateur Épargne',
    description: 'Projection long terme, intérêts composés, objectifs',
    category: 'simulators',
    icon: 'TrendingUp',
    defaultEnabled: false,
    requiredPlan: 'PREMIUM',
    route: '/dashboard/simulateurs/epargne',
    prefillSupported: true,
  },
  SIM_PTZ: {
    code: 'SIM_PTZ',
    name: 'Simulateur PTZ 2025',
    description: 'Éligibilité PTZ, simulation montant, zones',
    category: 'simulators',
    icon: 'Key',
    defaultEnabled: false,
    requiredPlan: 'PREMIUM',
    route: '/dashboard/simulateurs/ptz',
    prefillSupported: true,
  },
  SIM_CAPACITE_EMPRUNT: {
    code: 'SIM_CAPACITE_EMPRUNT',
    name: 'Simulateur Capacité d\'Emprunt',
    description: 'Calcul capacité, mensualités, durée optimale',
    category: 'simulators',
    icon: 'Calculator',
    defaultEnabled: false,
    requiredPlan: 'PREMIUM',
    route: '/dashboard/simulateurs/capacite-emprunt',
    prefillSupported: true,
  },
  SIM_MENSUALITE: {
    code: 'SIM_MENSUALITE',
    name: 'Simulateur Mensualité',
    description: 'Tableau d\'amortissement, coût total crédit',
    category: 'simulators',
    icon: 'Calendar',
    defaultEnabled: false,
    requiredPlan: 'PREMIUM',
    route: '/dashboard/simulateurs/mensualite',
    prefillSupported: false,
  },
}

// =============================================================================
// Définition des Calculateurs
// =============================================================================

export const CALCULATORS: Record<string, FeatureDefinition> = {
  CALC_INCOME_TAX: {
    code: 'CALC_INCOME_TAX',
    name: 'Calculateur IR',
    description: 'Impôt sur le revenu, TMI, quotient familial, optimisations',
    category: 'calculators',
    icon: 'Receipt',
    defaultEnabled: false,
    requiredPlan: 'BUSINESS',
    route: '/dashboard/calculateurs/impot-revenu',
    prefillSupported: true,
  },
  CALC_WEALTH_TAX: {
    code: 'CALC_WEALTH_TAX',
    name: 'Calculateur IFI',
    description: 'Impôt sur la Fortune Immobilière, assiette, abattements',
    category: 'calculators',
    icon: 'Building2',
    defaultEnabled: false,
    requiredPlan: 'BUSINESS',
    route: '/dashboard/calculateurs/ifi',
    prefillSupported: true,
  },
  CALC_CAPITAL_GAINS: {
    code: 'CALC_CAPITAL_GAINS',
    name: 'Calculateur Plus-Values',
    description: 'Plus-values mobilières/immobilières, abattements durée',
    category: 'calculators',
    icon: 'TrendingUp',
    defaultEnabled: false,
    requiredPlan: 'BUSINESS',
    route: '/dashboard/calculateurs/plus-values',
    prefillSupported: false,
  },
  CALC_DONATION: {
    code: 'CALC_DONATION',
    name: 'Calculateur Donation',
    description: 'Droits de donation, barèmes, abattements par lien',
    category: 'calculators',
    icon: 'Gift',
    defaultEnabled: false,
    requiredPlan: 'PREMIUM',
    route: '/dashboard/calculateurs/donation',
    prefillSupported: true,
  },
  CALC_INHERITANCE: {
    code: 'CALC_INHERITANCE',
    name: 'Calculateur Succession',
    description: 'Droits de succession par héritier, répartition',
    category: 'calculators',
    icon: 'Users',
    defaultEnabled: false,
    requiredPlan: 'PREMIUM',
    route: '/dashboard/calculateurs/succession',
    prefillSupported: true,
  },
  CALC_DEBT_CAPACITY: {
    code: 'CALC_DEBT_CAPACITY',
    name: 'Calculateur Capacité d\'Endettement',
    description: 'Ratio 35%, montant empruntable, reste à vivre',
    category: 'calculators',
    icon: 'Calculator',
    defaultEnabled: false,
    requiredPlan: 'BUSINESS',
    route: '/dashboard/calculateurs/capacite-emprunt',
    prefillSupported: true,
  },
  CALC_BUDGET: {
    code: 'CALC_BUDGET',
    name: 'Analyseur Budget',
    description: 'Analyse revenus/charges, recommandations, alertes',
    category: 'calculators',
    icon: 'Wallet',
    defaultEnabled: false,
    requiredPlan: 'BUSINESS',
    route: '/dashboard/calculateurs/budget',
    prefillSupported: true,
  },
}

// =============================================================================
// Définition des Modules
// =============================================================================

export const MODULES: Record<string, FeatureDefinition> = {
  MOD_EXPORT_PDF: {
    code: 'MOD_EXPORT_PDF',
    name: 'Export PDF',
    description: 'Export des rapports et synthèses en PDF',
    category: 'modules',
    icon: 'FileText',
    defaultEnabled: true, // Toujours inclus
    requiredPlan: 'ALL',
  },
  MOD_EXPORT_EXCEL: {
    code: 'MOD_EXPORT_EXCEL',
    name: 'Export Excel',
    description: 'Export des données en format Excel',
    category: 'modules',
    icon: 'Table',
    defaultEnabled: false,
    requiredPlan: 'BUSINESS',
  },
  MOD_API_ACCESS: {
    code: 'MOD_API_ACCESS',
    name: 'Accès API',
    description: 'Accès à l\'API REST pour intégrations externes',
    category: 'modules',
    icon: 'Code',
    defaultEnabled: false,
    requiredPlan: 'PREMIUM',
  },
  MOD_WHITE_LABEL: {
    code: 'MOD_WHITE_LABEL',
    name: 'Marque Blanche',
    description: 'Personnalisation logo, couleurs, domaine',
    category: 'modules',
    icon: 'Paintbrush',
    defaultEnabled: false,
    requiredPlan: 'PREMIUM',
  },
  MOD_CLIENT_PORTAL: {
    code: 'MOD_CLIENT_PORTAL',
    name: 'Portail Client',
    description: 'Accès client à sa synthèse patrimoniale',
    category: 'modules',
    icon: 'Users',
    defaultEnabled: false,
    requiredPlan: 'BUSINESS',
  },
  MOD_NOTIFICATIONS: {
    code: 'MOD_NOTIFICATIONS',
    name: 'Notifications Proactives',
    description: 'Alertes automatiques par email et in-app',
    category: 'modules',
    icon: 'Bell',
    defaultEnabled: false,
    requiredPlan: 'BUSINESS',
  },
  MOD_HISTORY: {
    code: 'MOD_HISTORY',
    name: 'Historique Synthèse',
    description: 'Snapshots et comparaison dans le temps',
    category: 'modules',
    icon: 'History',
    defaultEnabled: false,
    requiredPlan: 'BUSINESS',
  },
}

// =============================================================================
// Fonctionnalités de base (toujours incluses)
// =============================================================================

export const BASE_FEATURES = [
  'Synthèse Client 360',
  'Gestion Patrimoine (Actifs/Passifs)',
  'Gestion Budget',
  'Gestion Objectifs',
  'Gestion Projets',
  'Fiche Client',
  'Alertes de base',
  'Export PDF',
] as const

// =============================================================================
// Helpers
// =============================================================================

/**
 * Récupère toutes les features par catégorie
 */
export function getAllFeatures(): Record<FeatureCategory, Record<string, FeatureDefinition>> {
  return {
    simulators: SIMULATORS,
    calculators: CALCULATORS,
    modules: MODULES,
  }
}

/**
 * Récupère une feature par son code
 */
export function getFeatureByCode(code: string): FeatureDefinition | undefined {
  return SIMULATORS[code] || CALCULATORS[code] || MODULES[code]
}

/**
 * Récupère toutes les features sous forme de liste plate
 */
export function getAllFeaturesFlat(): FeatureDefinition[] {
  return [
    ...Object.values(SIMULATORS),
    ...Object.values(CALCULATORS),
    ...Object.values(MODULES),
  ]
}

/**
 * Récupère les features supportant le pré-remplissage
 */
export function getPrefillableFeatures(): FeatureDefinition[] {
  return getAllFeaturesFlat().filter(f => f.prefillSupported)
}

/**
 * Vérifie si une feature est disponible pour un plan donné
 */
export function isFeatureAvailableForPlan(
  feature: FeatureDefinition,
  plan: string
): boolean {
  if (feature.requiredPlan === 'ALL') return true
  
  const planHierarchy = ['TRIAL', 'STARTER', 'BUSINESS', 'PREMIUM']
  const featurePlanIndex = planHierarchy.indexOf(feature.requiredPlan)
  const currentPlanIndex = planHierarchy.indexOf(plan)
  
  return currentPlanIndex >= featurePlanIndex
}

/**
 * Crée un objet CabinetFeatures vide
 */
export function createEmptyFeatures(): CabinetFeatures {
  const simulators: Record<string, boolean> = {}
  const calculators: Record<string, boolean> = {}
  const modules: Record<string, boolean> = {}
  
  Object.keys(SIMULATORS).forEach(key => {
    simulators[key] = SIMULATORS[key].defaultEnabled
  })
  
  Object.keys(CALCULATORS).forEach(key => {
    calculators[key] = CALCULATORS[key].defaultEnabled
  })
  
  Object.keys(MODULES).forEach(key => {
    modules[key] = MODULES[key].defaultEnabled
  })
  
  return { simulators, calculators, modules }
}
