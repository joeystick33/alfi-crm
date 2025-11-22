/**
 * Plan Definitions - Configuration des plans d'abonnement
 * Définit les quotas, features et tarifs pour chaque plan
 */

export interface PlanQuotas {
  maxAdvisors: number;
  maxClientsPerAdvisor: number;
  maxAssistants: number;
  maxStorageGB: number;
  maxAPICallsPerMonth: number;
}

export interface PlanFeatures {
  advancedSimulations: boolean;
  unlimitedPDFExports: boolean;
  apiAccess: boolean;
  whitelabel: boolean;
  prioritySupport: boolean;
  customIntegrations: boolean;
}

export interface PlanDefinition {
  name: string;
  displayName: string;
  price: number | null;
  currency: string;
  duration?: number;
  quotas: PlanQuotas;
  features: PlanFeatures;
  description: string;
}

export const PLAN_DEFINITIONS: Record<string, PlanDefinition> = {
  TRIAL: {
    name: 'Trial',
    displayName: 'Essai Gratuit',
    price: 0,
    currency: 'EUR',
    duration: 14, // days
    quotas: {
      maxAdvisors: 1,
      maxClientsPerAdvisor: 10,
      maxAssistants: 0,
      maxStorageGB: 1,
      maxAPICallsPerMonth: 0,
    },
    features: {
      advancedSimulations: false,
      unlimitedPDFExports: false,
      apiAccess: false,
      whitelabel: false,
      prioritySupport: false,
      customIntegrations: false,
    },
    description: 'Parfait pour découvrir la plateforme',
  },
  
  STARTER: {
    name: 'Starter',
    displayName: 'Démarrage',
    price: 49,
    currency: 'EUR',
    quotas: {
      maxAdvisors: 5,
      maxClientsPerAdvisor: 50,
      maxAssistants: 1,
      maxStorageGB: 10,
      maxAPICallsPerMonth: 1000,
    },
    features: {
      advancedSimulations: true,
      unlimitedPDFExports: false,
      apiAccess: false,
      whitelabel: false,
      prioritySupport: false,
      customIntegrations: false,
    },
    description: 'Idéal pour les petits cabinets',
  },
  
  PROFESSIONAL: {
    name: 'Professional',
    displayName: 'Professionnel',
    price: 99,
    currency: 'EUR',
    quotas: {
      maxAdvisors: 15,
      maxClientsPerAdvisor: 100,
      maxAssistants: 3,
      maxStorageGB: 50,
      maxAPICallsPerMonth: 10000,
    },
    features: {
      advancedSimulations: true,
      unlimitedPDFExports: true,
      apiAccess: true,
      whitelabel: false,
      prioritySupport: false,
      customIntegrations: false,
    },
    description: 'Pour les cabinets en croissance',
  },
  
  ENTERPRISE: {
    name: 'Enterprise',
    displayName: 'Entreprise',
    price: 199,
    currency: 'EUR',
    quotas: {
      maxAdvisors: -1, // unlimited
      maxClientsPerAdvisor: -1, // unlimited
      maxAssistants: -1, // unlimited
      maxStorageGB: 500,
      maxAPICallsPerMonth: 100000,
    },
    features: {
      advancedSimulations: true,
      unlimitedPDFExports: true,
      apiAccess: true,
      whitelabel: true,
      prioritySupport: true,
      customIntegrations: true,
    },
    description: 'Solution complète pour les grands cabinets',
  },
  
  CUSTOM: {
    name: 'Custom',
    displayName: 'Sur Mesure',
    price: null, // À définir
    currency: 'EUR',
    quotas: {
      maxAdvisors: -1,
      maxClientsPerAdvisor: -1,
      maxAssistants: -1,
      maxStorageGB: -1,
      maxAPICallsPerMonth: -1,
    },
    features: {
      advancedSimulations: true,
      unlimitedPDFExports: true,
      apiAccess: true,
      whitelabel: true,
      prioritySupport: true,
      customIntegrations: true,
    },
    description: 'Plan personnalisé selon vos besoins',
  },
};

/**
 * Statuts d'organisation possibles
 */
export const ORGANIZATION_STATUS = {
  ACTIVE: 'ACTIVE',
  RESTRICTED: 'RESTRICTED',
  SUSPENDED: 'SUSPENDED',
  TERMINATED: 'TERMINATED',
  TRIALING: 'TRIALING',
} as const;

export type OrganizationStatus = typeof ORGANIZATION_STATUS[keyof typeof ORGANIZATION_STATUS];

/**
 * Descriptions des statuts
 */
export const STATUS_DESCRIPTIONS: Record<OrganizationStatus, {
  label: string;
  color: string;
  description: string;
}> = {
  ACTIVE: {
    label: 'Actif',
    color: 'green',
    description: 'Accès complet à toutes les fonctionnalités',
  },
  RESTRICTED: {
    label: 'Restreint',
    color: 'orange',
    description: 'Création de nouveaux éléments bloquée',
  },
  SUSPENDED: {
    label: 'Suspendu',
    color: 'red',
    description: 'Accès bloqué, connexion impossible',
  },
  TERMINATED: {
    label: 'Résilié',
    color: 'gray',
    description: 'Compte fermé, données archivées',
  },
  TRIALING: {
    label: 'Essai',
    color: 'blue',
    description: 'Période d\'essai en cours',
  },
};

/**
 * Obtenir la définition d'un plan
 */
export function getPlanDefinition(planName: string): PlanDefinition {
  return PLAN_DEFINITIONS[planName] || PLAN_DEFINITIONS.TRIAL;
}

/**
 * Obtenir tous les plans disponibles
 */
export function getAllPlans() {
  return Object.keys(PLAN_DEFINITIONS).map(key => ({
    key,
    ...PLAN_DEFINITIONS[key],
  }));
}

/**
 * Vérifier si un quota est illimité
 */
export function isUnlimited(value: number): boolean {
  return value === -1;
}

/**
 * Formater un quota pour l'affichage
 */
export function formatQuota(value: number): string {
  return isUnlimited(value) ? 'Illimité' : value.toString();
}

/**
 * Calculer le MRR (Monthly Recurring Revenue) pour un plan
 */
export function calculateMRR(planName: string, customPrice: number | null = null): number {
  if (planName === 'CUSTOM' && customPrice) {
    return customPrice;
  }
  
  const plan = getPlanDefinition(planName);
  return plan.price || 0;
}

/**
 * Obtenir le plan suivant (upgrade)
 */
export function getNextPlan(currentPlan: string): string | null {
  const planOrder = ['TRIAL', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE'];
  const currentIndex = planOrder.indexOf(currentPlan);
  
  if (currentIndex === -1 || currentIndex === planOrder.length - 1) {
    return null;
  }
  
  return planOrder[currentIndex + 1];
}

/**
 * Comparer deux plans
 */
export function comparePlans(plan1: string, plan2: string): number {
  const planOrder = ['TRIAL', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE', 'CUSTOM'];
  const index1 = planOrder.indexOf(plan1);
  const index2 = planOrder.indexOf(plan2);
  
  return index1 - index2;
}
