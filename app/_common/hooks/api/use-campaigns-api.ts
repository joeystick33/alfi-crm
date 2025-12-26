import { useQuery, useMutation, useQueryClient, type UseQueryOptions, type UseMutationOptions } from '@tanstack/react-query'
import { api, buildQueryString, type PaginatedResponse } from '@/app/_common/lib/api-client'
import type {
  CampaignListItem,
  CampaignDetail,
  CreateCampaignRequest,
  UpdateCampaignRequest,
  CampaignFilters,
  CampaignStats,
  ScheduleCampaignRequest,
  ScenarioListItem,
  ScenarioDetail,
  CreateScenarioRequest,
  UpdateScenarioRequest,
  ScenarioFilters,
  ScenarioStats,
  ExecuteScenarioRequest,
} from '@/app/_common/lib/api-types'
import { toast } from '@/app/_common/hooks/use-toast'
import { queryKeys } from './query-keys'

// ============================================================================
// Campaign Hooks
// ============================================================================

/**
 * Fetch paginated list of campaigns
 */
export function useCampaigns(
  filters?: CampaignFilters,
  options?: Omit<UseQueryOptions<PaginatedResponse<CampaignListItem>>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.campaignList(filters),
    queryFn: () => api.get<PaginatedResponse<CampaignListItem>>(`/advisor/campaigns${buildQueryString(filters || {})}`),
    staleTime: 30 * 1000,
    ...options,
  })
}

/**
 * Fetch single campaign with full details
 */
export function useCampaign(
  id: string,
  options?: Omit<UseQueryOptions<CampaignDetail>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.campaign(id),
    queryFn: () => api.get<CampaignDetail>(`/advisor/campaigns/${id}`),
    enabled: !!id,
    ...options,
  })
}

/**
 * Fetch campaign statistics
 */
export function useCampaignStats(
  filters?: Record<string, unknown>,
  options?: Omit<UseQueryOptions<CampaignStats>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.campaignStats(filters),
    queryFn: () => api.get<CampaignStats>(`/advisor/campaigns/stats${buildQueryString(filters || {})}`),
    staleTime: 1 * 60 * 1000,
    ...options,
  })
}

/**
 * Create new campaign
 */
export function useCreateCampaign(options?: UseMutationOptions<CampaignDetail, Error, CreateCampaignRequest>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateCampaignRequest) => api.post<CampaignDetail>('/advisor/campaigns', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns })
      queryClient.invalidateQueries({ queryKey: queryKeys.campaignStats() })
      toast({ title: 'Campagne créée', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

/**
 * Update campaign
 */
export function useUpdateCampaign(options?: UseMutationOptions<CampaignDetail, Error, { id: string; data: UpdateCampaignRequest }>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => api.patch<CampaignDetail>(`/advisor/campaigns/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns })
      queryClient.invalidateQueries({ queryKey: queryKeys.campaign(id) })
      toast({ title: 'Campagne mise à jour', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

/**
 * Delete campaign
 */
export function useDeleteCampaign(options?: UseMutationOptions<void, Error, string>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/advisor/campaigns/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns })
      queryClient.invalidateQueries({ queryKey: queryKeys.campaignStats() })
      toast({ title: 'Campagne supprimée', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

/**
 * Send campaign immediately
 */
export function useSendCampaign(options?: UseMutationOptions<CampaignDetail, Error, string>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post<CampaignDetail>(`/advisor/campaigns/${id}/send`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns })
      queryClient.invalidateQueries({ queryKey: queryKeys.campaign(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.campaignStats() })
      toast({ title: 'Campagne envoyée', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

/**
 * Schedule campaign for future date
 */
export function useScheduleCampaign(options?: UseMutationOptions<CampaignDetail, Error, { id: string; data: ScheduleCampaignRequest }>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => api.post<CampaignDetail>(`/advisor/campaigns/${id}/schedule`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns })
      queryClient.invalidateQueries({ queryKey: queryKeys.campaign(id) })
      toast({ title: 'Campagne planifiée', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

/**
 * Prepare recipients for campaign
 */
export function usePrepareRecipients(options?: UseMutationOptions<CampaignDetail, Error, string>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post<CampaignDetail>(`/advisor/campaigns/${id}/prepare-recipients`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns })
      queryClient.invalidateQueries({ queryKey: queryKeys.campaign(id) })
      toast({ title: 'Destinataires préparés', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

/**
 * Cancel campaign
 */
export function useCancelCampaign(options?: UseMutationOptions<CampaignDetail, Error, string>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post<CampaignDetail>(`/advisor/campaigns/${id}/cancel`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns })
      queryClient.invalidateQueries({ queryKey: queryKeys.campaign(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.campaignStats() })
      toast({ title: 'Campagne annulée', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

/**
 * Pause ongoing campaign
 */
export function usePauseCampaign(options?: UseMutationOptions<CampaignDetail, Error, string>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post<CampaignDetail>(`/advisor/campaigns/${id}/pause`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns })
      queryClient.invalidateQueries({ queryKey: queryKeys.campaign(id) })
      toast({ title: 'Campagne mise en pause', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

/**
 * Resume paused campaign
 */
export function useResumeCampaign(options?: UseMutationOptions<CampaignDetail, Error, string>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post<CampaignDetail>(`/advisor/campaigns/${id}/resume`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns })
      queryClient.invalidateQueries({ queryKey: queryKeys.campaign(id) })
      toast({ title: 'Campagne reprise', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

// ============================================================================
// Scenario Hooks
// ============================================================================

/**
 * Fetch paginated list of scenarios
 */
export function useScenarios(
  filters?: ScenarioFilters,
  options?: Omit<UseQueryOptions<PaginatedResponse<ScenarioListItem>>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.scenarioList(filters),
    queryFn: () => api.get<PaginatedResponse<ScenarioListItem>>(`/advisor/scenarios${buildQueryString(filters || {})}`),
    staleTime: 30 * 1000,
    ...options,
  })
}

/**
 * Fetch single scenario with full details
 */
export function useScenario(
  id: string,
  options?: Omit<UseQueryOptions<ScenarioDetail>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.scenario(id),
    queryFn: () => api.get<ScenarioDetail>(`/advisor/scenarios/${id}`),
    enabled: !!id,
    ...options,
  })
}

/**
 * Fetch scenario statistics
 */
export function useScenarioStats(
  filters?: Record<string, unknown>,
  options?: Omit<UseQueryOptions<ScenarioStats>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.scenarioStats(filters),
    queryFn: () => api.get<ScenarioStats>(`/advisor/scenarios/stats${buildQueryString(filters || {})}`),
    staleTime: 1 * 60 * 1000,
    ...options,
  })
}

/**
 * Create new scenario
 */
export function useCreateScenario(options?: UseMutationOptions<ScenarioDetail, Error, CreateScenarioRequest>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateScenarioRequest) => api.post<ScenarioDetail>('/advisor/scenarios', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.scenarios })
      queryClient.invalidateQueries({ queryKey: queryKeys.scenarioStats() })
      toast({ title: 'Scénario créé', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

/**
 * Update scenario
 */
export function useUpdateScenario(options?: UseMutationOptions<ScenarioDetail, Error, { id: string; data: UpdateScenarioRequest }>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => api.patch<ScenarioDetail>(`/advisor/scenarios/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.scenarios })
      queryClient.invalidateQueries({ queryKey: queryKeys.scenario(id) })
      toast({ title: 'Scénario mis à jour', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

/**
 * Delete scenario
 */
export function useDeleteScenario(options?: UseMutationOptions<void, Error, string>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/advisor/scenarios/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.scenarios })
      queryClient.invalidateQueries({ queryKey: queryKeys.scenarioStats() })
      toast({ title: 'Scénario supprimé', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

/**
 * Activate scenario
 */
export function useActivateScenario(options?: UseMutationOptions<ScenarioDetail, Error, string>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post<ScenarioDetail>(`/advisor/scenarios/${id}/activate`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.scenarios })
      queryClient.invalidateQueries({ queryKey: queryKeys.scenario(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.scenarioStats() })
      toast({ title: 'Scénario activé', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

/**
 * Deactivate scenario
 */
export function useDeactivateScenario(options?: UseMutationOptions<ScenarioDetail, Error, string>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post<ScenarioDetail>(`/advisor/scenarios/${id}/deactivate`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.scenarios })
      queryClient.invalidateQueries({ queryKey: queryKeys.scenario(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.scenarioStats() })
      toast({ title: 'Scénario désactivé', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

/**
 * Archive scenario
 */
export function useArchiveScenario(options?: UseMutationOptions<ScenarioDetail, Error, string>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post<ScenarioDetail>(`/advisor/scenarios/${id}/archive`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.scenarios })
      queryClient.invalidateQueries({ queryKey: queryKeys.scenario(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.scenarioStats() })
      toast({ title: 'Scénario archivé', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

/**
 * Execute scenario for specific clients
 */
export function useExecuteScenario(options?: UseMutationOptions<Record<string, unknown>, Error, { id: string; data: ExecuteScenarioRequest }>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => api.post(`/advisor/scenarios/${id}/execute`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.scenarios })
      queryClient.invalidateQueries({ queryKey: queryKeys.scenario(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.scenarioStats() })
      toast({ title: 'Scénario exécuté', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}
