import { useQuery, type UseQueryOptions } from '@tanstack/react-query'
import { api } from '@/app/_common/lib/api-client'

// ============================================================================
// Pilotage Commercial Types
// ============================================================================

export interface PipelineStage {
  id: string
  name: string
  shortName: string
  count: number
  value: number
  conversionRate?: number
  color: string
}

interface TopDeal {
  id: string
  clientName: string
  value: number
  stage: string
  probability: number
  nextAction: string
  dueDate: string
}

interface ObjectiveData {
  current: number
  target: number
  trend: number
}

interface FullObjective {
  id: string
  label: string
  type: 'ca' | 'clients' | 'rdv' | 'opportunities'
  current: number
  target: number
  unit: string
  trend: number
}

interface ActivityMetric {
  current: number
  target: number
}

interface PortfolioData {
  totalClients: number
  prospects: number
  dormants: number
  aum: number
}

interface PerformanceData {
  rank: number
  totalAdvisors: number
  conversionRate: number
}

export interface PilotageData {
  pipeline: PipelineStage[]
  topDeals: TopDeal[]
  objectives: {
    ca: ObjectiveData
  }
  allObjectives: FullObjective[]
  performance: PerformanceData
  activity: {
    rdv: ActivityMetric
    proposals: ActivityMetric
    calls: ActivityMetric
    signatures: ActivityMetric
  }
  portfolio: PortfolioData
  period: string
}

interface PilotageFilters {
  period?: 'week' | 'month' | 'quarter' | 'year'
}

// ============================================================================
// Pilotage Commercial Hook
// ============================================================================

/**
 * Fetch commercial pilotage data
 */
export function usePilotageCommercial(
  filters?: PilotageFilters,
  options?: Omit<UseQueryOptions<PilotageData>, 'queryKey' | 'queryFn'>
) {
  const queryString = filters?.period ? `?period=${filters.period}` : ''
  
  return useQuery({
    queryKey: ['pilotage-commercial', filters?.period] as const,
    queryFn: () => api.get<PilotageData>(`/advisor/pilotage${queryString}`),
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: false,
    ...options,
  })
}

// ============================================================================
// Pilotage Équipe Types (Admin only)
// ============================================================================

export interface AdvisorStats {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  ca: number
  pipelineValue: number
  pipelineWeighted: number
  pipelineCount: number
  clientsCount: number
  newClients: number
  rdvCount: number
  tasksCompleted: number
  tasksPending: number
  conversionRate: number
  wonDeals: number
}

export interface TeamAlert {
  type: string
  severity: 'warning' | 'danger' | 'info'
  message: string
  advisorId?: string
}

export interface TeamPilotageData {
  advisors: AdvisorStats[]
  leaderboard: AdvisorStats[]
  cabinetTotals: {
    totalCA: number
    totalPipeline: number
    totalPipelineWeighted: number
    totalClients: number
    totalNewClients: number
    totalRdv: number
    totalDeals: number
    avgConversionRate: number
  }
  teamPipeline: PipelineStage[]
  alerts: TeamAlert[]
  period: string
  caTarget: number
}

// ============================================================================
// Pilotage Équipe Hook (Admin only)
// ============================================================================

/**
 * Fetch team pilotage data (Admin only)
 */
export function usePilotageTeam(
  filters?: PilotageFilters,
  options?: Omit<UseQueryOptions<TeamPilotageData>, 'queryKey' | 'queryFn'>
) {
  const queryString = filters?.period ? `?period=${filters.period}` : ''
  
  return useQuery({
    queryKey: ['pilotage-team', filters?.period] as const,
    queryFn: () => api.get<TeamPilotageData>(`/advisor/pilotage/team${queryString}`),
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: false,
    ...options,
  })
}
