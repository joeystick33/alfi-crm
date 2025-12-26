/**
 * Plan Definitions - Configuration des plans d'abonnement
 * Définit les quotas, features et tarifs pour chaque plan
 */

export interface PlanQuotas {
  maxAdmins: number;
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
      maxAdmins: 1,
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
    displayName: 'Starter',
    price: 59,
    currency: 'EUR',
    quotas: {
      maxAdmins: 2,
      maxAdvisors: 3,
      maxClientsPerAdvisor: 50,
      maxAssistants: 1,
      maxStorageGB: 5,
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
    description: 'CRM complet pour démarrer',
  },
  
  BUSINESS: {
    name: 'Business',
    displayName: 'Business',
    price: 99,
    currency: 'EUR',
    quotas: {
      maxAdmins: 2,
      maxAdvisors: 10,
      maxClientsPerAdvisor: 200,
      maxAssistants: 3,
      maxStorageGB: 20,
      maxAPICallsPerMonth: 5000,
    },
    features: {
      advancedSimulations: false,
      unlimitedPDFExports: true,
      apiAccess: false,
      whitelabel: false,
      prioritySupport: false,
      customIntegrations: false,
    },
    description: 'CRM + Calculateurs fiscaux',
  },
  
  PREMIUM: {
    name: 'Premium',
    displayName: 'Premium',
    price: 199,
    currency: 'EUR',
    quotas: {
      maxAdmins: 5,
      maxAdvisors: -1, // unlimited
      maxClientsPerAdvisor: -1, // unlimited
      maxAssistants: -1, // unlimited
      maxStorageGB: 100,
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
    description: 'CRM + Calculateurs + Simulateurs - Accès complet',
  },
};

/**
 * Statuts d'organisation possibles
 */
export const ORGANIZATION_STATUS = {
  ACTIVE: 'ACTIF',
  RESTRICTED: 'RESTRICTED',
  SUSPENDED: 'SUSPENDU',
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
  ACTIF: {
    label: 'Actif',
    color: 'green',
    description: 'Accès complet à toutes les fonctionnalités',
  },
  RESTRICTED: {
    label: 'Restreint',
    color: 'orange',
    description: 'Création de nouveaux éléments bloquée',
  },
  SUSPENDU: {
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
export function calculateMRR(planName: string): number {
  const plan = getPlanDefinition(planName);
  return plan.price || 0;
}

/**
 * Obtenir le plan suivant (upgrade)
 */
export function getNextPlan(currentPlan: string): string | null {
  const planOrder = ['TRIAL', 'STARTER', 'BUSINESS', 'PREMIUM'];
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
  const planOrder = ['TRIAL', 'STARTER', 'BUSINESS', 'PREMIUM'];
  const index1 = planOrder.indexOf(plan1);
  const index2 = planOrder.indexOf(plan2);
  
  return index1 - index2;
}

/**
 * Obtenir le label d'affichage d'un plan (avec prix)
 */
export function getPlanLabel(planCode: string | null | undefined): string {
  if (!planCode) return 'Standard';
  
  const normalized = planCode.toUpperCase();
  // Anciens plans migrés vers PREMIUM
  const effectiveCode = ['ENTERPRISE', 'CUSTOM'].includes(normalized) ? 'PREMIUM' : normalized;
  
  const plan = PLAN_DEFINITIONS[effectiveCode];
  if (!plan) return planCode;
  
  if (plan.price === 0 || plan.price === null) {
    return plan.displayName;
  }
  return `${plan.displayName} (${plan.price}€/mois)`;
}
