import { useQuery, useMutation, useQueryClient, type UseQueryOptions, type UseMutationOptions } from '@tanstack/react-query'
import { api, buildQueryString } from '@/app/_common/lib/api-client'
import type {
  DashboardCounters,
  MonActiviteStats,
  MesActionsItem,
  ManagementStatsFilters,
} from '@/app/_common/lib/api-types'
import { toast } from '@/app/_common/hooks/use-toast'
import { queryKeys } from './query-keys'

// ============================================================================
// Dashboard Hooks
// ============================================================================

interface DashboardCountersWithRole extends DashboardCounters {
  userRole: 'ADMIN' | 'ADVISOR' | 'ASSISTANT'
  isAdmin: boolean
  scope: 'personal' | 'cabinet'
}

/**
 * Fetch dashboard counters (scoped by role)
 */
export function useDashboardCounters(
  advisorId?: string,
  options?: Omit<UseQueryOptions<DashboardCountersWithRole>, 'queryKey' | 'queryFn'>
) {
  const queryString = advisorId ? `?advisorId=${advisorId}` : ''
  return useQuery({
    queryKey: [...queryKeys.dashboardCounters, advisorId] as const,
    queryFn: () => api.get<DashboardCountersWithRole>(`/advisor/dashboard/counters${queryString}`),
    // Désactiver le refetch automatique pour éviter les boucles
    refetchInterval: false,
    // Garder les données en cache 5 minutes
    staleTime: 5 * 60 * 1000,
    // Ne pas refetch automatiquement au focus
    refetchOnWindowFocus: false,
    ...options,
  })
}

// Team stats types
interface TeamMemberStats {
  advisor: {
    id: string
    firstName: string
    lastName: string
    role: string
    avatar: string | null
  }
  stats: {
    clients: number
    tasks: number
    overdueTasks: number
    appointmentsToday: number
    opportunities: number
  }
}

interface TeamStats {
  team: TeamMemberStats[]
  totals: {
    clients: number
    tasks: number
    opportunities: number
    advisors: number
  }
}

/**
 * Fetch team stats (admin only)
 */
export function useTeamStats(
  options?: Omit<UseQueryOptions<TeamStats>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: ['team-stats'] as const,
    queryFn: () => api.get<TeamStats>('/advisor/dashboard/team'),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    ...options,
  })
}

// ============================================================================
// Portfolio Hooks (Mon Portefeuille)
// ============================================================================

interface PortfolioStats {
  total: number
  active: number
  prospects: number
  dormants: number
  byActivity: {
    active: number
    recent: number
    dormant: number
    lost: number
  }
  alerts: {
    kycOverdue: number
    kycUpcoming: number
    contractsRenewing: number
  }
}

interface PortfolioClient {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  status: string
  clientType: string
  activityStatus: 'active' | 'recent' | 'dormant' | 'lost'
  lastInteraction: string
  kycOverdue: boolean
  kycUpcoming: boolean
  kycNextReviewDate: string | null
  contractsRenewing: boolean
  contractsToRenew: Array<{ id: string; name: string; nextRenewalDate: string; type: string }>
  opportunitiesCount: number
  opportunitiesValue: number
}

interface NeedsReviewClient {
  id: string
  firstName: string
  lastName: string
  reason: string
  lastInteraction: string
  activityStatus: string
}

interface UpcomingActionClient {
  id: string
  firstName: string
  lastName: string
  actions: string[]
}

interface PortfolioData {
  stats: PortfolioStats
  clients: PortfolioClient[]
  needsReview: NeedsReviewClient[]
  upcomingActions: UpcomingActionClient[]
}

interface PortfolioFilters {
  status?: 'ACTIF' | 'PROSPECT' | 'DORMANT' | 'ALL'
  review?: 'overdue' | 'upcoming' | 'all'
}

/**
 * Fetch portfolio data for the current advisor
 */
export function useMonPortefeuille(
  filters?: PortfolioFilters,
  options?: Omit<UseQueryOptions<PortfolioData>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: ['mon-portefeuille', filters] as const,
    queryFn: () => api.get<PortfolioData>(`/advisor/mon-portefeuille${buildQueryString(filters || {})}`),
    staleTime: 1000 * 60 * 2,
    ...options,
  })
}

// ============================================================================
// Conseiller Personal Hooks (Mon Activité, Mes Actions)
// ============================================================================

/**
 * Fetch personal activity stats
 */
export function useMonActivite(
  filters?: ManagementStatsFilters,
  options?: Omit<UseQueryOptions<MonActiviteStats>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: ['mon-activite', filters] as const,
    queryFn: () => api.get<MonActiviteStats>(`/advisor/mon-activite${buildQueryString(filters || {})}`),
    staleTime: 1000 * 60 * 2,
    ...options,
  })
}

/**
 * Fetch personal actions
 */
export function useMesActions(
  filters?: { status?: string },
  options?: Omit<UseQueryOptions<{ actions: MesActionsItem[] }>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: ['mes-actions', filters] as const,
    queryFn: () => api.get<{ actions: MesActionsItem[] }>(`/advisor/mes-actions${buildQueryString(filters || {})}`),
    staleTime: 1000 * 60 * 2,
    ...options,
  })
}

/**
 * Create personal action
 */
export function useCreateMesAction(options?: UseMutationOptions<MesActionsItem, Error, Partial<MesActionsItem>>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Partial<MesActionsItem>) => api.post<MesActionsItem>('/advisor/mes-actions', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mes-actions'] })
      toast({ title: 'Succès', description: 'Action créée avec succès' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

/**
 * Update personal action status
 */
export function useUpdateMesAction(options?: UseMutationOptions<{ success: boolean }, Error, { id: string; status: string }>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { id: string; status: string }) => api.patch<{ success: boolean }>('/advisor/mes-actions', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mes-actions'] })
      toast({ title: 'Succès', description: 'Action mise à jour' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}
