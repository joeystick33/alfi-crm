/**
 * React Query hooks for Compliance and Operations Pilotage API
 * 
 * Provides hooks for fetching KPIs, pipeline statistics, and operation metrics
 * for compliance and commercial pilotage dashboards.
 * 
 * @module app/_common/hooks/api/use-compliance-pilotage-api
 */

import { 
  useQuery, 
  type UseQueryOptions 
} from '@tanstack/react-query'
import { api, buildQueryString } from '@/app/_common/lib/api-client'
import type {
  ComplianceKPIs,
} from '@/lib/compliance/types'
import type {
  AffaireStatus,
  ProductType,
  OperationGestionType,
  OperationGestionStatus,
  PipelineKPIs,
  OperationKPIs,
  ProviderStats,
} from '@/lib/operations/types'

// ============================================================================
// Query Keys
// ============================================================================

export const pilotageQueryKeys = {
  // Compliance KPIs
  complianceKPIs: ['pilotage', 'compliance', 'kpis'] as const,
  complianceKPIsByPeriod: (period: string) => ['pilotage', 'compliance', 'kpis', period] as const,
  
  // Pipeline Stats
  pipelineStats: ['pilotage', 'pipeline'] as const,
  pipelineStatsByPeriod: (period: string) => ['pilotage', 'pipeline', period] as const,
  
  // Operation Stats
  operationStats: ['pilotage', 'operations'] as const,
  operationStatsByPeriod: (period: string) => ['pilotage', 'operations', period] as const,
  
  // Provider Stats
  providerPerformance: ['pilotage', 'providers'] as const,
  providerPerformanceByPeriod: (period: string) => ['pilotage', 'providers', period] as const,
  
  // Combined Dashboard
  complianceDashboard: ['pilotage', 'compliance', 'dashboard'] as const,
  operationsDashboard: ['pilotage', 'operations', 'dashboard'] as const,
}

// ============================================================================
// Types for API Responses
// ============================================================================

type PeriodFilter = 'week' | 'month' | 'quarter' | 'year'

interface PilotageFilters {
  period?: PeriodFilter
  dateFrom?: string
  dateTo?: string
}

interface ComplianceDashboardData {
  kpis: ComplianceKPIs
  documentsByStatus: Record<string, number>
  documentsByType: Record<string, number>
  alertsBySeverity: Record<string, number>
  controlsByStatus: Record<string, number>
  reclamationsBySLA: {
    onTrack: number
    atRisk: number
    breached: number
  }
  expiringDocuments: Array<{
    id: string
    clientId: string
    clientName: string
    type: string
    expiresAt: string
    daysUntilExpiration: number
  }>
  recentAlerts: Array<{
    id: string
    type: string
    severity: string
    title: string
    createdAt: string
  }>
}

interface PipelineStageData {
  status: AffaireStatus
  count: number
  value: number
  weightedValue: number
  conversionRate: number
}

interface PipelineStatsData extends PipelineKPIs {
  stages: PipelineStageData[]
  byProductType: Array<{
    productType: ProductType
    count: number
    value: number
  }>
  byProvider: Array<{
    providerId: string
    providerName: string
    count: number
    value: number
  }>
  trends: {
    newAffaires: number
    newAffairesTrend: number
    closedAffaires: number
    closedAffairesTrend: number
    averageValue: number
    averageValueTrend: number
  }
}

interface OperationStatsData extends OperationKPIs {
  byType: Array<{
    type: OperationGestionType
    count: number
    totalAmount: number
    averageProcessingDays: number
  }>
  byStatus: Array<{
    status: OperationGestionStatus
    count: number
  }>
  trends: {
    totalOperations: number
    totalOperationsTrend: number
    totalAmount: number
    totalAmountTrend: number
    averageProcessingTime: number
    averageProcessingTimeTrend: number
  }
}

interface ProviderPerformanceData {
  providers: ProviderStats[]
  topProviders: Array<{
    providerId: string
    providerName: string
    totalVolume: number
    activeContracts: number
    averageProcessingTime: number
    rejectionRate: number
  }>
  byProductType: Record<ProductType, Array<{
    providerId: string
    providerName: string
    volume: number
    count: number
  }>>
}

interface OperationsDashboardData {
  pipeline: PipelineStatsData
  operations: OperationStatsData
  providers: ProviderPerformanceData
  affairesEnCours: {
    total: number
    byInactivityCategory: {
      green: number
      orange: number
      red: number
    }
    withMissingDocuments: number
  }
  recentActivity: Array<{
    id: string
    type: 'affaire' | 'operation'
    reference: string
    clientName: string
    action: string
    timestamp: string
  }>
}

// ============================================================================
// Compliance KPIs Hooks
// ============================================================================

/**
 * Fetch compliance KPIs for pilotage dashboard
 */
export function usePilotageComplianceKPIs(
  filters?: PilotageFilters,
  options?: Omit<UseQueryOptions<ComplianceKPIs>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: filters?.period 
      ? pilotageQueryKeys.complianceKPIsByPeriod(filters.period)
      : pilotageQueryKeys.complianceKPIs,
    queryFn: () => {
      const queryString = buildQueryString(filters || {})
      return api.get<ComplianceKPIs>(`/v1/compliance/kpis${queryString}`)
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    ...options,
  })
}

/**
 * Fetch full compliance dashboard data
 */
export function useComplianceDashboard(
  filters?: PilotageFilters,
  options?: Omit<UseQueryOptions<ComplianceDashboardData>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: pilotageQueryKeys.complianceDashboard,
    queryFn: () => {
      const queryString = buildQueryString(filters || {})
      return api.get<ComplianceDashboardData>(`/v1/compliance/dashboard${queryString}`)
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    ...options,
  })
}

// ============================================================================
// Pipeline Stats Hooks
// ============================================================================

/**
 * Fetch pipeline statistics
 */
export function usePipelineStats(
  filters?: PilotageFilters,
  options?: Omit<UseQueryOptions<PipelineStatsData>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: filters?.period 
      ? pilotageQueryKeys.pipelineStatsByPeriod(filters.period)
      : pilotageQueryKeys.pipelineStats,
    queryFn: () => {
      const queryString = buildQueryString(filters || {})
      return api.get<PipelineStatsData>(`/v1/operations/pipeline/stats${queryString}`)
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    ...options,
  })
}

// ============================================================================
// Operation Stats Hooks
// ============================================================================

/**
 * Fetch operation statistics
 */
export function useOperationStats(
  filters?: PilotageFilters,
  options?: Omit<UseQueryOptions<OperationStatsData>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: filters?.period 
      ? pilotageQueryKeys.operationStatsByPeriod(filters.period)
      : pilotageQueryKeys.operationStats,
    queryFn: () => {
      const queryString = buildQueryString(filters || {})
      return api.get<OperationStatsData>(`/v1/operations/gestion/stats${queryString}`)
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    ...options,
  })
}

// ============================================================================
// Provider Performance Hooks
// ============================================================================

/**
 * Fetch provider performance statistics
 */
export function useProviderPerformance(
  filters?: PilotageFilters,
  options?: Omit<UseQueryOptions<ProviderPerformanceData>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: filters?.period 
      ? pilotageQueryKeys.providerPerformanceByPeriod(filters.period)
      : pilotageQueryKeys.providerPerformance,
    queryFn: () => {
      const queryString = buildQueryString(filters || {})
      return api.get<ProviderPerformanceData>(`/v1/operations/providers/performance${queryString}`)
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options,
  })
}

// ============================================================================
// Operations Dashboard Hook
// ============================================================================

/**
 * Fetch full operations dashboard data
 */
export function useOperationsDashboard(
  filters?: PilotageFilters,
  options?: Omit<UseQueryOptions<OperationsDashboardData>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: pilotageQueryKeys.operationsDashboard,
    queryFn: () => {
      const queryString = buildQueryString(filters || {})
      return api.get<OperationsDashboardData>(`/v1/operations/dashboard${queryString}`)
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    ...options,
  })
}

// ============================================================================
// Combined Stats Hook (for overview pages)
// ============================================================================

interface CombinedPilotageData {
  compliance: ComplianceKPIs
  pipeline: {
    totalValue: number
    totalCount: number
    conversionRate: number
  }
  operations: {
    totalCount: number
    pendingCount: number
    averageProcessingTime: number
  }
  alerts: {
    critical: number
    high: number
    total: number
  }
}

/**
 * Fetch combined pilotage data for overview
 */
export function useCombinedPilotage(
  filters?: PilotageFilters,
  options?: Omit<UseQueryOptions<CombinedPilotageData>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: ['pilotage', 'combined', filters?.period] as const,
    queryFn: () => {
      const queryString = buildQueryString(filters || {})
      return api.get<CombinedPilotageData>(`/v1/pilotage/overview${queryString}`)
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    ...options,
  })
}

// ============================================================================
// Export Types for consumers
// ============================================================================

export type {
  PilotageFilters,
  PeriodFilter,
  ComplianceDashboardData,
  PipelineStageData,
  PipelineStatsData,
  OperationStatsData,
  ProviderPerformanceData,
  OperationsDashboardData,
  CombinedPilotageData,
}
