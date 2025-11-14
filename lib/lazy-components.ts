/**
 * Lazy loading utilities for heavy components
 * Improves initial page load performance by code-splitting
 */

import { lazy, ComponentType } from 'react'

/**
 * Lazy load a component with a custom loading fallback
 */
export function lazyLoad<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
) {
  return lazy(importFunc)
}

// ============================================================================
// Lazy-loaded Calculator Components
// ============================================================================

export const IncomeTaxCalculator = lazy(
  () => import('@/components/calculators/IncomeTaxCalculator')
)

export const CapitalGainsTaxCalculator = lazy(
  () => import('@/components/calculators/CapitalGainsTaxCalculator')
)

export const WealthTaxCalculator = lazy(
  () => import('@/components/calculators/WealthTaxCalculator')
)

export const DonationTaxCalculator = lazy(
  () => import('@/components/calculators/DonationTaxCalculator')
)

export const InheritanceTaxCalculator = lazy(
  () => import('@/components/calculators/InheritanceTaxCalculator')
)

export const BudgetAnalyzer = lazy(
  () => import('@/components/calculators/BudgetAnalyzer')
)

export const DebtCapacityCalculator = lazy(
  () => import('@/components/calculators/DebtCapacityCalculator')
)

export const ObjectiveCalculator = lazy(
  () => import('@/components/calculators/ObjectiveCalculator')
)

export const MultiObjectivePlanner = lazy(
  () => import('@/components/calculators/MultiObjectivePlanner')
)

export const EducationFundingCalculator = lazy(
  () => import('@/components/calculators/EducationFundingCalculator')
)

export const HomePurchaseCalculator = lazy(
  () => import('@/components/calculators/HomePurchaseCalculator')
)

// ============================================================================
// Lazy-loaded Simulator Components
// ============================================================================

export const RetirementSimulator = lazy(
  () => import('@/components/simulators/RetirementSimulator')
)

export const PensionEstimator = lazy(
  () => import('@/components/simulators/PensionEstimator')
)

export const RetirementComparison = lazy(
  () => import('@/components/simulators/RetirementComparison')
)

export const SuccessionSimulator = lazy(
  () => import('@/components/simulators/SuccessionSimulator')
)

export const SuccessionComparison = lazy(
  () => import('@/components/simulators/SuccessionComparison')
)

export const DonationOptimizer = lazy(
  () => import('@/components/simulators/DonationOptimizer')
)

export const TaxProjector = lazy(
  () => import('@/components/simulators/TaxProjector')
)

export const TaxStrategyComparison = lazy(
  () => import('@/components/simulators/TaxStrategyComparison')
)

export const InvestmentVehicleComparison = lazy(
  () => import('@/components/simulators/InvestmentVehicleComparison')
)

// ============================================================================
// Lazy-loaded Chart Components
// ============================================================================

export const ModernPieChart = lazy(
  () => import('@/components/charts/ModernPieChart')
)

export const ModernBarChart = lazy(
  () => import('@/components/charts/ModernBarChart')
)

export const ModernLineChart = lazy(
  () => import('@/components/charts/ModernLineChart')
)
