import { useQuery, useMutation, useQueryClient, type UseQueryOptions, type UseMutationOptions } from '@tanstack/react-query'
import { api, buildQueryString } from '@/app/_common/lib/api-client'
import type {
  ReclamationListItem,
  ReclamationDetail,
  CreateReclamationRequest,
  UpdateReclamationRequest,
  ResolveReclamationRequest,
  EscalateReclamationRequest,
  ReclamationFilters,
  ReclamationStats,
} from '@/app/_common/lib/api-types'
import { toast } from '@/app/_common/hooks/use-toast'
import { queryKeys } from './query-keys'

// ============================================================================
// Reclamations Hooks
// ============================================================================

/**
 * Fetch list of reclamations with filters
 */
export function useReclamations(
  filters?: ReclamationFilters,
  options?: Omit<UseQueryOptions<{ data: ReclamationListItem[] }>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.reclamationList(filters),
    queryFn: () => {
      const queryString = buildQueryString(filters || {})
      return api.get<{ data: ReclamationListItem[] }>(`/reclamations${queryString}`)
    },
    ...options,
  })
}

/**
 * Fetch a single reclamation by ID
 */
export function useReclamation(
  id: string,
  options?: Omit<UseQueryOptions<ReclamationDetail>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.reclamation(id),
    queryFn: () => api.get<ReclamationDetail>(`/reclamations/${id}`),
    enabled: !!id,
    ...options,
  })
}

/**
 * Create a reclamation
 */
export function useCreateReclamation(
  options?: UseMutationOptions<ReclamationDetail, Error, CreateReclamationRequest>
) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: CreateReclamationRequest) =>
      api.post<ReclamationDetail>('/reclamations', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reclamations })
      queryClient.invalidateQueries({ queryKey: queryKeys.reclamationStats() })
      toast({ title: 'Réclamation créée', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

/**
 * Update a reclamation
 */
export function useUpdateReclamation(
  options?: UseMutationOptions<ReclamationDetail, Error, { id: string; data: UpdateReclamationRequest }>
) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateReclamationRequest }) =>
      api.patch<ReclamationDetail>(`/reclamations/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reclamation(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.reclamations })
      queryClient.invalidateQueries({ queryKey: queryKeys.reclamationStats() })
      toast({ title: 'Réclamation mise à jour', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

/**
 * Resolve a reclamation
 */
export function useResolveReclamation(
  options?: UseMutationOptions<ReclamationDetail, Error, { id: string; data: ResolveReclamationRequest }>
) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ResolveReclamationRequest }) =>
      api.post<ReclamationDetail>(`/reclamations/${id}/resolve`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reclamation(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.reclamations })
      queryClient.invalidateQueries({ queryKey: queryKeys.reclamationStats() })
      toast({ title: 'Réclamation résolue', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

/**
 * Escalate a reclamation to mediator
 */
export function useEscalateReclamation(
  options?: UseMutationOptions<ReclamationDetail, Error, { id: string; data: EscalateReclamationRequest }>
) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: EscalateReclamationRequest }) =>
      api.post<ReclamationDetail>(`/reclamations/${id}/escalate`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reclamation(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.reclamations })
      queryClient.invalidateQueries({ queryKey: queryKeys.reclamationStats() })
      toast({ title: 'Réclamation escaladée au médiateur', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

/**
 * Delete a reclamation
 */
export function useDeleteReclamation(
  options?: UseMutationOptions<void, Error, string>
) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => api.delete(`/reclamations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reclamations })
      queryClient.invalidateQueries({ queryKey: queryKeys.reclamationStats() })
      toast({ title: 'Réclamation supprimée', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

/**
 * Fetch reclamation statistics
 */
export function useReclamationStats(
  options?: Omit<UseQueryOptions<ReclamationStats>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.reclamationStats(),
    queryFn: () => api.get<ReclamationStats>('/reclamations/stats'),
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options,
  })
}
