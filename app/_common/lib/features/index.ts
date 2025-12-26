/**
 * Features Module - Exports centralisés
 * 
 * Ce module gère toutes les fonctionnalités premium du CRM Aura
 */

// Configuration des features
export {
  SIMULATORS,
  CALCULATORS,
  MODULES,
  BASE_FEATURES,
  getAllFeatures,
  getFeatureByCode,
  getAllFeaturesFlat,
  getPrefillableFeatures,
  isFeatureAvailableForPlan,
  createEmptyFeatures,
  type FeatureCategory,
  type FeatureDefinition,
  type CabinetFeatures,
} from './feature-config'

// Presets par plan
export {
  PLAN_PRESETS,
  getPlanPreset,
  getDefaultFeaturesForPlan,
  getDefaultLimitsForPlan,
  countEnabledFeatures,
  comparePlans,
  getAllPlans,
  isPlanHigherThan,
  type SubscriptionPlan,
  type PlanPreset,
} from './plan-presets'

// Service de gestion des features
export {
  FeatureService,
  createFeatureService,
  isSimulator,
  isCalculator,
  isModule,
  getFeatureCategory,
  type FeatureCheckResult,
  type FeatureUsageStats,
} from './feature-service'
