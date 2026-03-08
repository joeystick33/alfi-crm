import { useQuery, useMutation, useQueryClient, type UseQueryOptions, type UseMutationOptions } from '@tanstack/react-query'
import { api, buildQueryString } from '@/app/_common/lib/api-client'
import type {
  WealthSummary,
  PerformanceResponse,
  PerformanceFilters,
  ArbitragesResponse,
  ArbitrageFilters,
  CreateActifRequest,
  CreateContratRequest,
  Actif,
  Contrat,
} from '@/app/_common/lib/api-types'
import { toast } from '@/app/_common/hooks/use-toast'
import { queryKeys } from './query-keys'

// ============================================================================
// Wealth & Assets Hooks
// ============================================================================

/**
 * Recalculate client wealth
 */
export function useRecalculateWealth(
  options?: UseMutationOptions<WealthSummary, Error, string>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (clientId: string) => api.post<WealthSummary>(`/advisor/clients/${clientId}/wealth/recalculate`),
    onSuccess: (data: WealthSummary, clientId: string) => {
      // Update wealth cache
      queryClient.setQueryData(queryKeys.clientWealth(clientId), data)
      // Invalidate client data
      queryClient.invalidateQueries({ queryKey: queryKeys.client(clientId) })

      toast({
        title: 'Patrimoine recalculé',
        description: 'Le patrimoine a été mis à jour.',
        variant: 'success',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de recalculer le patrimoine.',
        variant: 'destructive',
      })
    },
    ...options,
  })
}

// ============================================================================
// Actif Hooks
// ============================================================================

export function useClientActifs(clientId: string) {
  return useQuery({
    queryKey: ['clients', clientId, 'actifs'],
    queryFn: () => api.get<Actif[]>(`/advisor/clients/${clientId}/actifs`),
    enabled: !!clientId,
  })
}

export function useCreateActif(
  options?: UseMutationOptions<Actif, Error, { clientId: string; data: CreateActifRequest }>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ clientId, data }) => api.post<Actif>(`/advisor/clients/${clientId}/actifs`, data),
    onSuccess: (_, { clientId }) => {
      queryClient.invalidateQueries({ queryKey: ['clients', clientId, 'actifs'] })
      queryClient.invalidateQueries({ queryKey: ['clients', clientId, 'wealth'] })
      toast({
        title: 'Actif créé',
        description: 'L\'actif a été ajouté avec succès.',
        variant: 'success',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de créer l\'actif.',
        variant: 'destructive',
      })
    },
    ...options,
  })
}

// ============================================================================
// Contrat Hooks
// ============================================================================

export function useClientContrats(clientId: string) {
  return useQuery({
    queryKey: ['clients', clientId, 'contrats'],
    queryFn: async (): Promise<Contrat[]> => {
      const response = await api.get<
        | Contrat[]
        | { data?: { contrats?: Contrat[] } | Contrat[] }
        | { contrats?: Contrat[] }
      >(`/advisor/clients/${clientId}/contrats`)

      if (Array.isArray(response)) return response

      const topLevel = response as { contrats?: Contrat[] }
      if (Array.isArray(topLevel.contrats)) return topLevel.contrats

      const wrapped = response as { data?: { contrats?: Contrat[] } | Contrat[] }
      if (Array.isArray(wrapped.data)) return wrapped.data
      if (wrapped.data && !Array.isArray(wrapped.data)) {
        const inner = wrapped.data as { contrats?: Contrat[] }
        if (Array.isArray(inner.contrats)) return inner.contrats
      }

      return []
    },
    enabled: !!clientId,
  })
}

export function useCreateContrat(
  options?: UseMutationOptions<Contrat, Error, { clientId: string; data: CreateContratRequest }>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ clientId, data }) => {
      const response = await api.post<
        | Contrat
        | { data?: { contrat?: Contrat } | Contrat }
        | { contrat?: Contrat }
      >(`/advisor/clients/${clientId}/contrats`, data)

      if ((response as { id?: string })?.id) return response as Contrat

      const topLevel = response as { contrat?: Contrat }
      if (topLevel.contrat) return topLevel.contrat

      const wrapped = response as { data?: { contrat?: Contrat } | Contrat }
      if (wrapped.data && (wrapped.data as { id?: string })?.id) return wrapped.data as Contrat
      if (wrapped.data && !(wrapped.data as { id?: string })?.id) {
        const inner = wrapped.data as { contrat?: Contrat }
        if (inner.contrat) return inner.contrat
      }

      throw new Error('Réponse API inattendue lors de la création du contrat')
    },
    onSuccess: (_, { clientId }) => {
      queryClient.invalidateQueries({ queryKey: ['clients', clientId, 'contrats'] })
      queryClient.invalidateQueries({ queryKey: ['clients', clientId, 'wealth'] })
      toast({
        title: 'Contrat créé',
        description: 'Le contrat a été ajouté avec succès.',
        variant: 'success',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de créer le contrat.',
        variant: 'destructive',
      })
    },
    ...options,
  })
}

// ============================================================================
// Performance & Arbitrages Hooks
// ============================================================================

/**
 * Fetch performance patrimoniale consolidée
 */
export function usePerformance(
  filters?: PerformanceFilters,
  options?: Omit<UseQueryOptions<PerformanceResponse>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.performance(filters),
    queryFn: () => api.get<PerformanceResponse>(`/advisor/patrimoine/performance${buildQueryString(filters || {})}`),
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options,
  })
}

/**
 * Fetch arbitrages suggérés
 */
export function useArbitrages(
  filters?: ArbitrageFilters,
  options?: Omit<UseQueryOptions<ArbitragesResponse>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.arbitrages(filters),
    queryFn: () => api.get<ArbitragesResponse>(`/advisor/patrimoine/arbitrages${buildQueryString(filters || {})}`),
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options,
  })
}
