'use client'

/**
 * Hook pour vérifier l'accès aux features premium
 * 
 * Utilisation:
 * const { hasAccess, isLoading } = useFeatureAccess('SIM_RETIREMENT')
 * const { checkFeature, features } = useFeatureAccess()
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import type { CabinetFeatures } from '@/app/_common/lib/features/feature-config'
import { getFeatureByCode, type FeatureDefinition } from '@/app/_common/lib/features/feature-config'

// =============================================================================
// Types
// =============================================================================

export interface FeatureAccessState {
  features: CabinetFeatures | null
  isLoading: boolean
  error: string | null
  plan: string | null
}

export interface FeatureAccessResult {
  hasAccess: boolean
  isLoading: boolean
  error: string | null
  feature: FeatureDefinition | undefined
  reason?: 'not_enabled' | 'plan_insufficient' | 'not_authenticated' | 'loading'
}

export interface UseFeatureAccessReturn {
  // État global
  features: CabinetFeatures | null
  isLoading: boolean
  error: string | null
  plan: string | null
  
  // Méthodes de vérification
  hasAccess: (featureCode: string) => boolean
  checkFeature: (featureCode: string) => FeatureAccessResult
  
  // Vérifications par catégorie
  hasSimulatorAccess: (simCode: string) => boolean
  hasCalculatorAccess: (calcCode: string) => boolean
  hasModuleAccess: (modCode: string) => boolean
  
  // Listes filtrées
  enabledSimulators: string[]
  enabledCalculators: string[]
  enabledModules: string[]
  
  // Rafraîchissement
  refresh: () => Promise<void>
}

// =============================================================================
// Cache global pour éviter les requêtes multiples
// =============================================================================

let featuresCache: CabinetFeatures | null = null
let cacheTimestamp: number = 0
// En mode dev, cache très court pour faciliter les tests
const CACHE_DURATION = process.env.NODE_ENV === 'development' ? 10 * 1000 : 5 * 60 * 1000 // 10s en dev, 5min en prod

// =============================================================================
// Hook principal
// =============================================================================

export function useFeatureAccess(): UseFeatureAccessReturn {
  const [state, setState] = useState<FeatureAccessState>({
    features: featuresCache,
    isLoading: !featuresCache,
    error: null,
    plan: null,
  })
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  
  // Charger les features
  const loadFeatures = useCallback(async (force = false) => {
    // Vérifier le cache
    const now = Date.now()
    if (!force && featuresCache && (now - cacheTimestamp) < CACHE_DURATION) {
      setState(prev => ({
        ...prev,
        features: featuresCache,
        isLoading: false,
      }))
      return
    }
    
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    
    try {
      const response = await fetch('/api/advisor/features', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })
      
      if (response.status === 401) {
        setIsAuthenticated(false)
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Non authentifié',
        }))
        return
      }
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des features')
      }
      
      setIsAuthenticated(true)
      const data = await response.json()
      
      // Mettre à jour le cache
      featuresCache = data.features
      cacheTimestamp = now
      
      setState({
        features: data.features,
        plan: data.plan,
        isLoading: false,
        error: null,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }))
    }
  }, [])
  
  // Charger au montage
  useEffect(() => {
    loadFeatures()
  }, [loadFeatures])
  
  // Vérifier l'accès à une feature
  const hasAccess = useCallback((featureCode: string): boolean => {
    if (!state.features) return false
    
    const feature = getFeatureByCode(featureCode)
    if (!feature) return false
    
    switch (feature.category) {
      case 'simulators':
        return state.features.simulators[featureCode] === true
      case 'calculators':
        return state.features.calculators[featureCode] === true
      case 'modules':
        return state.features.modules[featureCode] === true
      default:
        return false
    }
  }, [state.features])
  
  // Vérifier une feature avec détails
  const checkFeature = useCallback((featureCode: string): FeatureAccessResult => {
    const feature = getFeatureByCode(featureCode)
    
    if (state.isLoading) {
      return {
        hasAccess: false,
        isLoading: true,
        error: null,
        feature,
        reason: 'loading',
      }
    }
    
    if (isAuthenticated === false) {
      return {
        hasAccess: false,
        isLoading: false,
        error: 'Non authentifié',
        feature,
        reason: 'not_authenticated',
      }
    }
    
    if (!state.features) {
      return {
        hasAccess: false,
        isLoading: false,
        error: state.error,
        feature,
        reason: 'not_enabled',
      }
    }
    
    const access = hasAccess(featureCode)
    
    return {
      hasAccess: access,
      isLoading: false,
      error: null,
      feature,
      reason: access ? undefined : 'not_enabled',
    }
  }, [state, isAuthenticated, hasAccess])
  
  // Helpers par catégorie
  const hasSimulatorAccess = useCallback((simCode: string): boolean => {
    const code = simCode.startsWith('SIM_') ? simCode : `SIM_${simCode}`
    return hasAccess(code)
  }, [hasAccess])
  
  const hasCalculatorAccess = useCallback((calcCode: string): boolean => {
    const code = calcCode.startsWith('CALC_') ? calcCode : `CALC_${calcCode}`
    return hasAccess(code)
  }, [hasAccess])
  
  const hasModuleAccess = useCallback((modCode: string): boolean => {
    const code = modCode.startsWith('MOD_') ? modCode : `MOD_${modCode}`
    return hasAccess(code)
  }, [hasAccess])
  
  // Listes des features activées
  const enabledSimulators = useMemo(() => {
    if (!state.features) return []
    return Object.entries(state.features.simulators)
      .filter(([_, enabled]) => enabled)
      .map(([code]) => code)
  }, [state.features])
  
  const enabledCalculators = useMemo(() => {
    if (!state.features) return []
    return Object.entries(state.features.calculators)
      .filter(([_, enabled]) => enabled)
      .map(([code]) => code)
  }, [state.features])
  
  const enabledModules = useMemo(() => {
    if (!state.features) return []
    return Object.entries(state.features.modules)
      .filter(([_, enabled]) => enabled)
      .map(([code]) => code)
  }, [state.features])
  
  // Refresh
  const refresh = useCallback(async () => {
    await loadFeatures(true)
  }, [loadFeatures])
  
  return {
    features: state.features,
    isLoading: state.isLoading,
    error: state.error,
    plan: state.plan,
    hasAccess,
    checkFeature,
    hasSimulatorAccess,
    hasCalculatorAccess,
    hasModuleAccess,
    enabledSimulators,
    enabledCalculators,
    enabledModules,
    refresh,
  }
}

// =============================================================================
// Hook simplifié pour vérifier une seule feature
// =============================================================================

export function useFeature(featureCode: string): FeatureAccessResult {
  const { checkFeature, isLoading } = useFeatureAccess()
  
  return useMemo(() => {
    if (isLoading) {
      return {
        hasAccess: false,
        isLoading: true,
        error: null,
        feature: getFeatureByCode(featureCode),
        reason: 'loading' as const,
      }
    }
    return checkFeature(featureCode)
  }, [checkFeature, featureCode, isLoading])
}

// =============================================================================
// Hook pour le pré-remplissage des simulateurs
// =============================================================================

export function usePrefillableFeatures(): {
  features: FeatureDefinition[]
  isLoading: boolean
} {
  const { enabledSimulators, enabledCalculators, isLoading } = useFeatureAccess()
  
  const features = useMemo(() => {
    const allEnabled = [...enabledSimulators, ...enabledCalculators]
    return allEnabled
      .map(code => getFeatureByCode(code))
      .filter((f): f is FeatureDefinition => f !== undefined && f.prefillSupported === true)
  }, [enabledSimulators, enabledCalculators])
  
  return { features, isLoading }
}

// =============================================================================
// Invalider le cache (à appeler après modification des features)
// =============================================================================

export function invalidateFeaturesCache(): void {
  featuresCache = null
  cacheTimestamp = 0
}
