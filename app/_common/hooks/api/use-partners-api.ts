import { useQuery, useMutation, useQueryClient, type UseQueryOptions, type UseMutationOptions } from '@tanstack/react-query'
import { api, buildQueryString } from '@/app/_common/lib/api-client'
import type {
  ApporteurListItem,
  ApporteurDetail,
  CreateApporteurRequest,
  UpdateApporteurRequest,
  ApporteurFilters,
  ApporteurStats,
} from '@/app/_common/lib/api-types'
import { toast } from '@/app/_common/hooks/use-toast'
import { queryKeys } from './query-keys'

// ============================================================================
// Apporteurs d'affaires Hooks
// ============================================================================

/**
 * Fetch apporteurs d'affaires list
 */
export function useApporteurs(
  filters?: ApporteurFilters,
  options?: Omit<UseQueryOptions<{ data: ApporteurListItem[] }>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.apporteurList(filters),
    queryFn: () => api.get<{ data: ApporteurListItem[] }>(`/advisor/apporteurs${buildQueryString(filters || {})}`),
    ...options,
  })
}

/**
 * Fetch apporteur detail by ID
 */
export function useApporteur(
  id: string,
  options?: Omit<UseQueryOptions<ApporteurDetail>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.apporteur(id),
    queryFn: () => api.get<ApporteurDetail>(`/advisor/apporteurs/${id}`),
    enabled: !!id,
    ...options,
  })
}

/**
 * Fetch apporteurs statistics
 */
export function useApporteurStats(
  options?: Omit<UseQueryOptions<ApporteurStats>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.apporteurStats,
    queryFn: () => api.get<ApporteurStats>('/advisor/apporteurs/stats'),
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options,
  })
}

/**
 * Create new apporteur
 */
export function useCreateApporteur(options?: UseMutationOptions<ApporteurDetail, Error, CreateApporteurRequest>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateApporteurRequest) => api.post<ApporteurDetail>('/advisor/apporteurs', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.apporteurs })
      queryClient.invalidateQueries({ queryKey: queryKeys.apporteurStats })
      toast({ title: 'Succès', description: 'Apporteur créé avec succès' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

/**
 * Update apporteur
 */
export function useUpdateApporteur(options?: UseMutationOptions<ApporteurDetail, Error, { id: string; data: UpdateApporteurRequest }>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }) => api.patch<ApporteurDetail>(`/advisor/apporteurs/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.apporteur(variables.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.apporteurs })
      queryClient.invalidateQueries({ queryKey: queryKeys.apporteurStats })
      toast({ title: 'Succès', description: 'Apporteur mis à jour avec succès' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

/**
 * Delete apporteur
 */
export function useDeleteApporteur(options?: UseMutationOptions<void, Error, string>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/advisor/apporteurs/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.apporteurs })
      queryClient.invalidateQueries({ queryKey: queryKeys.apporteurStats })
      toast({ title: 'Succès', description: 'Apporteur supprimé avec succès' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}
