/**
 * Presets de features par plan d'abonnement
 * 
 * Chaque plan a un ensemble prédéfini de features activées.
 * Le SuperAdmin peut ensuite personnaliser pour chaque cabinet.
 */

import type { CabinetFeatures } from './feature-config'

// =============================================================================
// Types
// =============================================================================

export type SubscriptionPlan = 'TRIAL' | 'STARTER' | 'BUSINESS' | 'PREMIUM'

export interface PlanPreset {
  plan: SubscriptionPlan
  name: string
  description: string
  monthlyPrice: number | null // null = sur devis
  features: CabinetFeatures
  limits: {
    maxUsers: number // -1 = illimité
    maxClients: number
    maxStorage: number // en MB
    maxSimulationsPerMonth: number
    maxExportsPerMonth: number
    maxClientsPortal: number
  }
}

// =============================================================================
// Définition des presets
// =============================================================================

export const PLAN_PRESETS: Record<SubscriptionPlan, PlanPreset> = {
  TRIAL: {
    plan: 'TRIAL',
    name: 'Essai',
    description: 'Version d\'essai gratuite - 14 jours',
    monthlyPrice: 0,
    features: {
      simulators: {
        SIM_RETIREMENT: false,
        SIM_PER: false,
        SIM_PER_TNS: false,
        SIM_ASSURANCE_VIE: false,
        SIM_IMMOBILIER: false,
        SIM_SUCCESSION: false,
        SIM_PREVOYANCE: false,
        SIM_DONATION: false,
        SIM_EPARGNE: false,
        SIM_PTZ: false,
        SIM_CAPACITE_EMPRUNT: false,
        SIM_MENSUALITE: false,
      },
      calculators: {
        CALC_INCOME_TAX: false,
        CALC_WEALTH_TAX: false,
        CALC_CAPITAL_GAINS: false,
        CALC_DONATION: false,
        CALC_INHERITANCE: false,
        CALC_DEBT_CAPACITY: true, // Seul calculateur disponible en trial
        CALC_BUDGET: false,
      },
      modules: {
        MOD_EXPORT_PDF: true,
        MOD_EXPORT_EXCEL: false,
        MOD_API_ACCESS: false,
        MOD_WHITE_LABEL: false,
        MOD_CLIENT_PORTAL: false,
        MOD_NOTIFICATIONS: false,
        MOD_HISTORY: false,
      },
    },
    limits: {
      maxUsers: 2,
      maxClients: 50,
      maxStorage: 1024, // 1 GB
      maxSimulationsPerMonth: 10,
      maxExportsPerMonth: 10,
      maxClientsPortal: 0,
    },
  },

  // =========================================================================
  // STARTER - 59€/mois - CRM uniquement
  // =========================================================================
  STARTER: {
    plan: 'STARTER',
    name: 'Starter',
    description: 'CRM complet pour les conseillers indépendants',
    monthlyPrice: 59,
    features: {
      simulators: {
        // Aucun simulateur - réservé au plan Premium
        SIM_RETIREMENT: false,
        SIM_PER: false,
        SIM_PER_TNS: false,
        SIM_ASSURANCE_VIE: false,
        SIM_IMMOBILIER: false,
        SIM_SUCCESSION: false,
        SIM_PREVOYANCE: false,
        SIM_DONATION: false,
        SIM_EPARGNE: false,
        SIM_PTZ: false,
        SIM_CAPACITE_EMPRUNT: false,
        SIM_MENSUALITE: false,
      },
      calculators: {
        // Aucun calculateur - réservé aux plans Business et Premium
        CALC_INCOME_TAX: false,
        CALC_WEALTH_TAX: false,
        CALC_CAPITAL_GAINS: false,
        CALC_DONATION: false,
        CALC_INHERITANCE: false,
        CALC_DEBT_CAPACITY: false,
        CALC_BUDGET: false,
      },
      modules: {
        MOD_EXPORT_PDF: true,
        MOD_EXPORT_EXCEL: false,
        MOD_API_ACCESS: false,
        MOD_WHITE_LABEL: false,
        MOD_CLIENT_PORTAL: false,
        MOD_NOTIFICATIONS: true,
        MOD_HISTORY: false,
      },
    },
    limits: {
      maxUsers: 3,
      maxClients: 150,
      maxStorage: 5120, // 5 GB
      maxSimulationsPerMonth: 0,
      maxExportsPerMonth: 50,
      maxClientsPortal: 0,
    },
  },

  // =========================================================================
  // BUSINESS - 99€/mois - CRM + Calculateurs
  // =========================================================================
  BUSINESS: {
    plan: 'BUSINESS',
    name: 'Business',
    description: 'CRM + Calculateurs fiscaux pour les cabinets en croissance',
    monthlyPrice: 99,
    features: {
      simulators: {
        // Aucun simulateur - réservé au plan Premium
        SIM_RETIREMENT: false,
        SIM_PER: false,
        SIM_PER_TNS: false,
        SIM_ASSURANCE_VIE: false,
        SIM_IMMOBILIER: false,
        SIM_SUCCESSION: false,
        SIM_PREVOYANCE: false,
        SIM_DONATION: false,
        SIM_EPARGNE: false,
        SIM_PTZ: false,
        SIM_CAPACITE_EMPRUNT: false,
        SIM_MENSUALITE: false,
      },
      calculators: {
        // Tous les calculateurs inclus
        CALC_INCOME_TAX: true,
        CALC_WEALTH_TAX: true,
        CALC_CAPITAL_GAINS: true,
        CALC_DONATION: true,
        CALC_INHERITANCE: true,
        CALC_DEBT_CAPACITY: true,
        CALC_BUDGET: true,
      },
      modules: {
        MOD_EXPORT_PDF: true,
        MOD_EXPORT_EXCEL: true,
        MOD_API_ACCESS: false,
        MOD_WHITE_LABEL: false,
        MOD_CLIENT_PORTAL: true,
        MOD_NOTIFICATIONS: true,
        MOD_HISTORY: true,
      },
    },
    limits: {
      maxUsers: 10,
      maxClients: 500,
      maxStorage: 20480, // 20 GB
      maxSimulationsPerMonth: 0,
      maxExportsPerMonth: 200,
      maxClientsPortal: 50,
    },
  },

  // =========================================================================
  // PREMIUM - 199€/mois - CRM + Calculateurs + Simulateurs (Tout inclus)
  // =========================================================================
  PREMIUM: {
    plan: 'PREMIUM',
    name: 'Premium',
    description: 'Accès complet : CRM + Calculateurs + Simulateurs',
    monthlyPrice: 199,
    features: {
      simulators: {
        // Tous les simulateurs inclus
        SIM_RETIREMENT: true,
        SIM_PER: true,
        SIM_PER_TNS: true,
        SIM_ASSURANCE_VIE: true,
        SIM_IMMOBILIER: true,
        SIM_SUCCESSION: true,
        SIM_PREVOYANCE: true,
        SIM_DONATION: true,
        SIM_EPARGNE: true,
        SIM_PTZ: true,
        SIM_CAPACITE_EMPRUNT: true,
        SIM_MENSUALITE: true,
      },
      calculators: {
        // Tous les calculateurs inclus
        CALC_INCOME_TAX: true,
        CALC_WEALTH_TAX: true,
        CALC_CAPITAL_GAINS: true,
        CALC_DONATION: true,
        CALC_INHERITANCE: true,
        CALC_DEBT_CAPACITY: true,
        CALC_BUDGET: true,
      },
      modules: {
        // Tous les modules inclus
        MOD_EXPORT_PDF: true,
        MOD_EXPORT_EXCEL: true,
        MOD_API_ACCESS: true,
        MOD_WHITE_LABEL: true,
        MOD_CLIENT_PORTAL: true,
        MOD_NOTIFICATIONS: true,
        MOD_HISTORY: true,
      },
    },
    limits: {
      maxUsers: -1, // Illimité
      maxClients: -1, // Illimité
      maxStorage: 102400, // 100 GB
      maxSimulationsPerMonth: -1, // Illimité
      maxExportsPerMonth: -1, // Illimité
      maxClientsPortal: -1, // Illimité
    },
  },
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Récupère le preset pour un plan donné
 */
export function getPlanPreset(plan: SubscriptionPlan): PlanPreset {
  return PLAN_PRESETS[plan]
}

/**
 * Récupère les features par défaut pour un plan
 */
export function getDefaultFeaturesForPlan(plan: SubscriptionPlan): CabinetFeatures {
  return PLAN_PRESETS[plan].features
}

/**
 * Récupère les limites par défaut pour un plan
 */
export function getDefaultLimitsForPlan(plan: SubscriptionPlan): PlanPreset['limits'] {
  return PLAN_PRESETS[plan].limits
}

/**
 * Compte le nombre de features activées dans un preset
 */
export function countEnabledFeatures(features: CabinetFeatures): {
  simulators: number
  calculators: number
  modules: number
  total: number
} {
  const simulators = Object.values(features.simulators).filter(Boolean).length
  const calculators = Object.values(features.calculators).filter(Boolean).length
  const modules = Object.values(features.modules).filter(Boolean).length
  
  return {
    simulators,
    calculators,
    modules,
    total: simulators + calculators + modules,
  }
}

/**
 * Compare les features de deux plans
 */
export function comparePlans(
  planA: SubscriptionPlan,
  planB: SubscriptionPlan
): {
  addedFeatures: string[]
  removedFeatures: string[]
} {
  const featuresA = PLAN_PRESETS[planA].features
  const featuresB = PLAN_PRESETS[planB].features
  
  const addedFeatures: string[] = []
  const removedFeatures: string[] = []
  
  // Compare simulators
  Object.keys(featuresB.simulators).forEach(key => {
    if (featuresB.simulators[key] && !featuresA.simulators[key]) {
      addedFeatures.push(key)
    }
    if (!featuresB.simulators[key] && featuresA.simulators[key]) {
      removedFeatures.push(key)
    }
  })
  
  // Compare calculators
  Object.keys(featuresB.calculators).forEach(key => {
    if (featuresB.calculators[key] && !featuresA.calculators[key]) {
      addedFeatures.push(key)
    }
    if (!featuresB.calculators[key] && featuresA.calculators[key]) {
      removedFeatures.push(key)
    }
  })
  
  // Compare modules
  Object.keys(featuresB.modules).forEach(key => {
    if (featuresB.modules[key] && !featuresA.modules[key]) {
      addedFeatures.push(key)
    }
    if (!featuresB.modules[key] && featuresA.modules[key]) {
      removedFeatures.push(key)
    }
  })
  
  return { addedFeatures, removedFeatures }
}

/**
 * Liste tous les plans disponibles
 */
export function getAllPlans(): PlanPreset[] {
  return Object.values(PLAN_PRESETS)
}

/**
 * Vérifie si un plan est supérieur à un autre
 */
export function isPlanHigherThan(planA: SubscriptionPlan, planB: SubscriptionPlan): boolean {
  const hierarchy: SubscriptionPlan[] = ['TRIAL', 'STARTER', 'BUSINESS', 'PREMIUM']
  return hierarchy.indexOf(planA) > hierarchy.indexOf(planB)
}
