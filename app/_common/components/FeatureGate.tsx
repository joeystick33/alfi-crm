'use client'

/**
 * FeatureGate - Composant de restriction d'accès aux features premium
 * 
 * Utilisation:
 * <FeatureGate feature="SIM_RETIREMENT">
 *   <RetirementSimulator />
 * </FeatureGate>
 * 
 * Avec teaser:
 * <FeatureGate feature="SIM_RETIREMENT" showTeaser>
 *   <RetirementSimulator />
 * </FeatureGate>
 */

import { ReactNode } from 'react'
import { useFeature } from '@/app/_common/hooks/use-feature-access'
import { LockedFeatureCard } from './LockedFeatureCard'
import { Loader2 } from 'lucide-react'

// =============================================================================
// Types
// =============================================================================

export interface FeatureGateProps {
  /** Code de la feature à vérifier (ex: SIM_RETIREMENT, CALC_INCOME_TAX) */
  feature: string
  
  /** Contenu à afficher si l'accès est autorisé */
  children: ReactNode
  
  /** Contenu alternatif si l'accès est refusé (optionnel) */
  fallback?: ReactNode
  
  /** Afficher une carte teaser pour inciter à l'upgrade */
  showTeaser?: boolean
  
  /** Masquer complètement si non autorisé (par défaut: false) */
  hideIfNoAccess?: boolean
  
  /** Afficher un loader pendant la vérification */
  showLoader?: boolean
  
  /** Classe CSS personnalisée pour le loader */
  loaderClassName?: string
  
  /** Callback appelé quand l'accès est refusé */
  onAccessDenied?: () => void
}

// =============================================================================
// Composant
// =============================================================================

export function FeatureGate({
  feature,
  children,
  fallback,
  showTeaser = false,
  hideIfNoAccess = false,
  showLoader = true,
  loaderClassName = '',
  onAccessDenied,
}: FeatureGateProps) {
  const { hasAccess, isLoading, feature: featureDef } = useFeature(feature)
  
  // État de chargement
  if (isLoading) {
    if (!showLoader) return null
    
    return (
      <div className={`flex items-center justify-center p-8 ${loaderClassName}`}>
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">
          Vérification des accès...
        </span>
      </div>
    )
  }
  
  // Accès autorisé
  if (hasAccess) {
    return <>{children}</>
  }
  
  // Accès refusé - appeler callback si fourni
  if (onAccessDenied) {
    onAccessDenied()
  }
  
  // Masquer complètement
  if (hideIfNoAccess && !showTeaser) {
    return null
  }
  
  // Afficher le teaser
  if (showTeaser && featureDef) {
    return (
      <LockedFeatureCard
        featureCode={feature}
        featureName={featureDef.name}
        featureDescription={featureDef.description}
        requiredPlan={featureDef.requiredPlan}
        icon={featureDef.icon}
      />
    )
  }
  
  // Afficher le fallback
  if (fallback) {
    return <>{fallback}</>
  }
  
  // Par défaut, afficher une carte simplifiée
  return (
    <LockedFeatureCard
      featureCode={feature}
      featureName={featureDef?.name || feature}
      featureDescription={featureDef?.description}
      requiredPlan={featureDef?.requiredPlan || 'PREMIUM'}
      minimal
    />
  )
}

// =============================================================================
// Variantes
// =============================================================================

/**
 * FeatureGate pour les simulateurs
 */
export function SimulatorGate({
  simulator,
  children,
  ...props
}: Omit<FeatureGateProps, 'feature'> & { simulator: string }) {
  const code = simulator.startsWith('SIM_') ? simulator : `SIM_${simulator}`
  return (
    <FeatureGate feature={code} {...props}>
      {children}
    </FeatureGate>
  )
}

/**
 * FeatureGate pour les calculateurs
 */
export function CalculatorGate({
  calculator,
  children,
  ...props
}: Omit<FeatureGateProps, 'feature'> & { calculator: string }) {
  const code = calculator.startsWith('CALC_') ? calculator : `CALC_${calculator}`
  return (
    <FeatureGate feature={code} {...props}>
      {children}
    </FeatureGate>
  )
}

/**
 * FeatureGate pour les modules
 */
export function ModuleGate({
  module,
  children,
  ...props
}: Omit<FeatureGateProps, 'feature'> & { module: string }) {
  const code = module.startsWith('MOD_') ? module : `MOD_${module}`
  return (
    <FeatureGate feature={code} {...props}>
      {children}
    </FeatureGate>
  )
}

// =============================================================================
// HOC pour wrapper des composants entiers
// =============================================================================

/**
 * Higher-Order Component pour protéger un composant avec une feature gate
 * 
 * Usage:
 * const ProtectedSimulator = withFeatureGate(RetirementSimulator, 'SIM_RETIREMENT')
 */
export function withFeatureGate<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  featureCode: string,
  gateProps?: Omit<FeatureGateProps, 'feature' | 'children'>
) {
  return function FeatureGatedComponent(props: P) {
    return (
      <FeatureGate feature={featureCode} {...gateProps}>
        <WrappedComponent {...props} />
      </FeatureGate>
    )
  }
}

// =============================================================================
// Exports
// =============================================================================

export default FeatureGate
