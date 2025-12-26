 
/**
 * Service de gestion et vérification des features
 * 
 * Ce service est utilisé pour:
 * - Vérifier si un cabinet a accès à une feature
 * - Récupérer les features d'un cabinet
 * - Mettre à jour les features d'un cabinet (SuperAdmin)
 */

import { prisma } from '../prisma'
import type { CabinetFeatures, FeatureCategory } from './feature-config'
import { 
  SIMULATORS, 
  CALCULATORS, 
  MODULES, 
  getFeatureByCode,
  createEmptyFeatures,
} from './feature-config'
import { 
  getDefaultFeaturesForPlan, 
  getDefaultLimitsForPlan,
  type SubscriptionPlan,
} from './plan-presets'

// =============================================================================
// Types
// =============================================================================

export interface FeatureCheckResult {
  hasAccess: boolean
  reason?: 'not_enabled' | 'plan_insufficient' | 'limit_reached' | 'cabinet_not_found'
  requiredPlan?: string
  currentPlan?: string
}

export interface FeatureUsageStats {
  simulationsThisMonth: number
  exportsThisMonth: number
  clientsInPortal: number
}

// =============================================================================
// Service principal
// =============================================================================

export class FeatureService {
  private cabinetId: string
  
  constructor(cabinetId: string) {
    this.cabinetId = cabinetId
  }
  
  /**
   * Vérifie si le cabinet a accès à une feature spécifique
   */
  async checkFeatureAccess(featureCode: string): Promise<FeatureCheckResult> {
    const cabinet = await prisma.cabinet.findUnique({
      where: { id: this.cabinetId },
      select: {
        id: true,
        plan: true,
        features: true,
        status: true,
      },
    })
    
    if (!cabinet) {
      return {
        hasAccess: false,
        reason: 'cabinet_not_found',
      }
    }
    
    // Vérifier si le cabinet est actif
    const activeStatuses = ['ACTIVE', 'ACTIF', 'TRIALING']
    if (!activeStatuses.includes(cabinet.status)) {
      return {
        hasAccess: false,
        reason: 'plan_insufficient',
        currentPlan: cabinet.plan,
      }
    }
    
    // Récupérer les features du cabinet
    const features = this.parseFeatures(cabinet.features)
    
    // Déterminer la catégorie de la feature
    const featureDef = getFeatureByCode(featureCode)
    if (!featureDef) {
      return { hasAccess: false, reason: 'not_enabled' }
    }
    
    // Vérifier dans la catégorie appropriée
    let isEnabled = false
    switch (featureDef.category) {
      case 'simulators':
        isEnabled = features.simulators[featureCode] === true
        break
      case 'calculators':
        isEnabled = features.calculators[featureCode] === true
        break
      case 'modules':
        isEnabled = features.modules[featureCode] === true
        break
    }
    
    if (!isEnabled) {
      return {
        hasAccess: false,
        reason: 'not_enabled',
        requiredPlan: featureDef.requiredPlan,
        currentPlan: cabinet.plan,
      }
    }
    
    return { hasAccess: true }
  }
  
  /**
   * Récupère toutes les features du cabinet
   */
  async getCabinetFeatures(): Promise<CabinetFeatures> {
    const cabinet = await prisma.cabinet.findUnique({
      where: { id: this.cabinetId },
      select: {
        features: true,
        plan: true,
      },
    })
    
    if (!cabinet) {
      return createEmptyFeatures()
    }
    
    // Si pas de features définies, utiliser les defaults du plan
    if (!cabinet.features) {
      return getDefaultFeaturesForPlan(cabinet.plan as SubscriptionPlan)
    }
    
    return this.parseFeatures(cabinet.features)
  }
  
  /**
   * Met à jour les features du cabinet (SuperAdmin uniquement)
   */
  async updateCabinetFeatures(
    features: Partial<CabinetFeatures>,
    updatedBy: string
  ): Promise<CabinetFeatures> {
    const currentFeatures = await this.getCabinetFeatures()
    
    const newFeatures: CabinetFeatures = {
      simulators: { ...currentFeatures.simulators, ...features.simulators },
      calculators: { ...currentFeatures.calculators, ...features.calculators },
      modules: { ...currentFeatures.modules, ...features.modules },
      customLimits: features.customLimits || currentFeatures.customLimits,
    }
    
    await prisma.cabinet.update({
      where: { id: this.cabinetId },
      data: {
        features: newFeatures as any,
        updatedAt: new Date(),
      },
    })
    
    // Log d'audit
    await this.logFeatureChange(currentFeatures, newFeatures, updatedBy)
    
    return newFeatures
  }
  
  /**
   * Applique un preset de plan aux features
   */
  async applyPlanPreset(
    plan: SubscriptionPlan,
    updatedBy: string
  ): Promise<CabinetFeatures> {
    const features = getDefaultFeaturesForPlan(plan)
    const limits = getDefaultLimitsForPlan(plan)
    
    const newFeatures: CabinetFeatures = {
      ...features,
      customLimits: {
        maxSimulationsPerMonth: limits.maxSimulationsPerMonth,
        maxExportsPerMonth: limits.maxExportsPerMonth,
        maxClientsPortal: limits.maxClientsPortal,
      },
    }
    
    return this.updateCabinetFeatures(newFeatures, updatedBy)
  }
  
  /**
   * Récupère les statistiques d'utilisation des features
   */
  async getUsageStats(): Promise<FeatureUsageStats> {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    
    // Compter les simulations ce mois
    const simulationsCount = await prisma.simulation.count({
      where: {
        client: {
          cabinetId: this.cabinetId,
        },
        createdAt: {
          gte: startOfMonth,
        },
      },
    })
    
    // Note: Les exports et clients portail nécessitent des tables spécifiques
    // Pour l'instant, on retourne 0 - à implémenter avec les tables appropriées
    
    return {
      simulationsThisMonth: simulationsCount,
      exportsThisMonth: 0, // TODO: Implémenter avec table Export
      clientsInPortal: 0, // TODO: Implémenter avec table ClientPortalAccess
    }
  }
  
  /**
   * Vérifie si une limite est atteinte
   */
  async checkLimit(limitType: 'simulations' | 'exports' | 'portal'): Promise<{
    isLimitReached: boolean
    current: number
    max: number
  }> {
    const features = await this.getCabinetFeatures()
    const usage = await this.getUsageStats()
    
    let current = 0
    let max = -1
    
    switch (limitType) {
      case 'simulations':
        current = usage.simulationsThisMonth
        max = features.customLimits?.maxSimulationsPerMonth ?? -1
        break
      case 'exports':
        current = usage.exportsThisMonth
        max = features.customLimits?.maxExportsPerMonth ?? -1
        break
      case 'portal':
        current = usage.clientsInPortal
        max = features.customLimits?.maxClientsPortal ?? -1
        break
    }
    
    return {
      isLimitReached: max !== -1 && current >= max,
      current,
      max,
    }
  }
  
  /**
   * Récupère la liste des features activées sous forme de tableau
   */
  async getEnabledFeaturesList(): Promise<string[]> {
    const features = await this.getCabinetFeatures()
    const enabled: string[] = []
    
    Object.entries(features.simulators).forEach(([key, value]) => {
      if (value) enabled.push(key)
    })
    
    Object.entries(features.calculators).forEach(([key, value]) => {
      if (value) enabled.push(key)
    })
    
    Object.entries(features.modules).forEach(([key, value]) => {
      if (value) enabled.push(key)
    })
    
    return enabled
  }
  
  /**
   * Vérifie rapidement l'accès à plusieurs features
   */
  async checkMultipleFeatures(featureCodes: string[]): Promise<Record<string, boolean>> {
    const features = await this.getCabinetFeatures()
    const result: Record<string, boolean> = {}
    
    for (const code of featureCodes) {
      const featureDef = getFeatureByCode(code)
      if (!featureDef) {
        result[code] = false
        continue
      }
      
      switch (featureDef.category) {
        case 'simulators':
          result[code] = features.simulators[code] === true
          break
        case 'calculators':
          result[code] = features.calculators[code] === true
          break
        case 'modules':
          result[code] = features.modules[code] === true
          break
        default:
          result[code] = false
      }
    }
    
    return result
  }
  
  // ===========================================================================
  // Private methods
  // ===========================================================================
  
  /**
   * Parse les features depuis le JSON stocké en base
   */
  private parseFeatures(featuresJson: unknown): CabinetFeatures {
    if (!featuresJson) {
      return createEmptyFeatures()
    }
    
    try {
      const parsed = typeof featuresJson === 'string' 
        ? JSON.parse(featuresJson) 
        : featuresJson
      
      return {
        simulators: parsed.simulators || {},
        calculators: parsed.calculators || {},
        modules: parsed.modules || {},
        customLimits: parsed.customLimits,
      }
    } catch {
      return createEmptyFeatures()
    }
  }
  
  /**
   * Log les changements de features pour l'audit
   */
  private async logFeatureChange(
    oldFeatures: CabinetFeatures,
    newFeatures: CabinetFeatures,
    updatedBy: string
  ): Promise<void> {
    try {
      // Identifier les changements
      const changes: Array<{ feature: string; from: boolean; to: boolean }> = []
      
      // Comparer simulators
      Object.keys(newFeatures.simulators).forEach(key => {
        if (oldFeatures.simulators[key] !== newFeatures.simulators[key]) {
          changes.push({
            feature: key,
            from: oldFeatures.simulators[key] || false,
            to: newFeatures.simulators[key],
          })
        }
      })
      
      // Comparer calculators
      Object.keys(newFeatures.calculators).forEach(key => {
        if (oldFeatures.calculators[key] !== newFeatures.calculators[key]) {
          changes.push({
            feature: key,
            from: oldFeatures.calculators[key] || false,
            to: newFeatures.calculators[key],
          })
        }
      })
      
      // Comparer modules
      Object.keys(newFeatures.modules).forEach(key => {
        if (oldFeatures.modules[key] !== newFeatures.modules[key]) {
          changes.push({
            feature: key,
            from: oldFeatures.modules[key] || false,
            to: newFeatures.modules[key],
          })
        }
      })
      
      if (changes.length > 0) {
        await prisma.auditLog.create({
          data: {
            cabinetId: this.cabinetId,
            action: 'MODIFICATION',
            entityType: 'CabinetFeatures',
            entityId: this.cabinetId,
            changes: {
              updatedBy,
              timestamp: new Date().toISOString(),
              featureChanges: changes,
            },
          },
        })
      }
    } catch (error) {
      // Ne pas faire échouer l'opération si le log échoue
      console.error('Failed to log feature change:', error)
    }
  }
}

// =============================================================================
// Factory function pour créer le service
// =============================================================================

export function createFeatureService(cabinetId: string): FeatureService {
  return new FeatureService(cabinetId)
}

// =============================================================================
// Fonctions utilitaires statiques
// =============================================================================

/**
 * Vérifie si une feature est un simulateur
 */
export function isSimulator(featureCode: string): boolean {
  return featureCode in SIMULATORS
}

/**
 * Vérifie si une feature est un calculateur
 */
export function isCalculator(featureCode: string): boolean {
  return featureCode in CALCULATORS
}

/**
 * Vérifie si une feature est un module
 */
export function isModule(featureCode: string): boolean {
  return featureCode in MODULES
}

/**
 * Récupère la catégorie d'une feature
 */
export function getFeatureCategory(featureCode: string): FeatureCategory | null {
  if (isSimulator(featureCode)) return 'simulators'
  if (isCalculator(featureCode)) return 'calculators'
  if (isModule(featureCode)) return 'modules'
  return null
}
