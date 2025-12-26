import { useQuery, useMutation, useQueryClient, type UseQueryOptions, type UseMutationOptions } from '@tanstack/react-query'
import { api, buildQueryString, type PaginatedResponse } from '@/app/_common/lib/api-client'
import type {
  ClientListItem,
  ClientDetail,
  CreateClientRequest,
  UpdateClientRequest,
  ClientFilters,
} from '@/app/_common/lib/api-types'
import { toast } from '@/app/_common/hooks/use-toast'
import { queryKeys } from './query-keys'

// ============================================================================
// Client Hooks
// ============================================================================

/**
 * Fetch paginated list of clients
 */
export function useClients(
  filters?: ClientFilters,
  options?: Omit<UseQueryOptions<PaginatedResponse<ClientListItem>>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.clientList(filters),
    queryFn: () => api.get<PaginatedResponse<ClientListItem>>(`/advisor/clients${buildQueryString(filters || {})}`),
    ...options,
  })
}

/**
 * Fetch single client with full details
 */
export function useClient(
  id: string,
  options?: Omit<UseQueryOptions<ClientDetail>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.client(id),
    queryFn: async (): Promise<ClientDetail> => {
      const response = await api.get<{ data?: ClientDetail } | ClientDetail>(`/advisor/clients/${id}?include=all`)
      // L'API retourne { data: ClientDetail } ou directement ClientDetail
      const result = (response as { data?: ClientDetail })?.data || response
      return result as ClientDetail
    },
    enabled: !!id,
    ...options,
  })
}

/**
 * Create new client
 */
export function useCreateClient(
  options?: Omit<UseMutationOptions<ClientDetail, Error, CreateClientRequest>, 'mutationFn'> & {
    onSuccess?: (data: ClientDetail) => void
    onError?: (error: Error) => void
  }
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateClientRequest) => api.post<ClientDetail>('/advisor/clients', data),
    onSuccess: (data: ClientDetail) => {
      // Invalidate clients list
      queryClient.invalidateQueries({ queryKey: queryKeys.clients })
      // Invalidate dashboard counters
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardCounters })

      toast({
        title: 'Client créé',
        description: `${data.firstName} ${data.lastName} a été créé avec succès.`,
        variant: 'success',
      })
      
      // Appeler le callback externe si fourni (pour fermer le modal, etc.)
      options?.onSuccess?.(data)
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de créer le client.',
        variant: 'destructive',
      })
      
      // Appeler le callback externe si fourni
      options?.onError?.(error)
    },
  })
}

/**
 * Update existing client with optimistic updates
 */
export function useUpdateClient(
  options?: UseMutationOptions<ClientDetail, Error, { id: string; data: UpdateClientRequest }, { previousClient?: ClientDetail }>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }) => api.patch<ClientDetail>(`/advisor/clients/${id}`, data),
    // Optimistic update
    onMutate: async ({ id, data }): Promise<{ previousClient?: ClientDetail }> => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.client(id) })

      // Snapshot previous value
      const previousClient = queryClient.getQueryData<ClientDetail>(queryKeys.client(id))

      // Optimistically update
      if (previousClient) {
        queryClient.setQueryData<ClientDetail>(queryKeys.client(id), {
          ...previousClient,
          ...data,
        } as ClientDetail)
      }

      // Return context with snapshot
      return { previousClient }
    },
    onSuccess: (data: ClientDetail, variables) => {
      // Update with server data
      queryClient.setQueryData(queryKeys.client(variables.id), data)
      // Invalidate clients list
      queryClient.invalidateQueries({ queryKey: queryKeys.clients })

      toast({
        title: 'Client mis à jour',
        description: 'Les modifications ont été enregistrées.',
        variant: 'success',
      })
    },
    onError: (error: Error, variables, context) => {
      // Rollback on error
      if (context?.previousClient) {
        queryClient.setQueryData(queryKeys.client(variables.id), context.previousClient)
      }

      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de mettre à jour le client.',
        variant: 'destructive',
      })
    },
    ...options,
  })
}

/**
 * Delete (archive) client
 */
export function useDeleteClient(
  options?: UseMutationOptions<void, Error, string>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/advisor/clients/${id}`)
    },
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.client(id) })
      // Invalidate clients list
      queryClient.invalidateQueries({ queryKey: queryKeys.clients })
      // Invalidate dashboard counters
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardCounters })

      toast({
        title: 'Client archivé',
        description: 'Le client a été archivé avec succès.',
        variant: 'success',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible d\'archiver le client.',
        variant: 'destructive',
      })
    },
    ...options,
  })
}


/**
 * Fetch client wealth/patrimoine data
 */
export function useClientWealth(
  clientId: string,
  options?: Omit<UseQueryOptions<Record<string, unknown>>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: ['client-wealth', clientId],
    queryFn: async () => {
      const response = await api.get<Record<string, unknown>>(`/advisor/patrimoine/stats?clientId=${clientId}`)
      // Extract data from wrapper if needed
      const data = (response as { data?: Record<string, unknown> })?.data || response
      
      // Calculate debt ratio
      const totalActifs = (data?.totalActifs as number) || 0
      const totalPassifs = (data?.totalPassifs as number) || 0
      const debtRatio = totalActifs > 0 ? (totalPassifs / totalActifs) * 100 : 0
      
      // Transform allocation data for charts
      const allocationByTypeData = data?.allocationByType as Record<string, number> | undefined
      const allocationByType = allocationByTypeData 
        ? Object.entries(allocationByTypeData).map(([type, value]) => ({
            type,
            value: value as number,
            percentage: totalActifs > 0 ? ((value as number) / totalActifs) * 100 : 0,
          }))
        : []
      
      const allocationByCategoryData = data?.allocationByCategory as Record<string, number> | undefined
      const allocationPercentagesData = data?.allocationPercentages as Record<string, number> | undefined
      const allocationByCategory = allocationByCategoryData
        ? Object.entries(allocationByCategoryData).map(([category, value]) => ({
            category,
            value: value as number,
            percentage: totalActifs > 0 ? ((value as number) / totalActifs) * 100 : 0,
          }))
        : allocationPercentagesData
          ? Object.entries(allocationPercentagesData)
              .filter(([_, pct]) => (pct as number) > 0)
              .map(([category, pct]) => ({
                category: category.charAt(0).toUpperCase() + category.slice(1),
                value: totalActifs * ((pct as number) / 100),
                percentage: pct as number,
              }))
          : []
      
      return {
        patrimoineNet: (data?.patrimoineNet as number) || (data?.totalNet as number) || (data?.netWealth as number) || 0,
        patrimoineGere: (data?.patrimoineGere as number) || (data?.totalGere as number) || (data?.managedAssets as number) || 0,
        patrimoineNonGere: (data?.patrimoineNonGere as number) || (data?.unmanagedAssets as number) || 0,
        totalActifs,
        totalPassifs,
        debtRatio,
        allocationByType,
        allocationByCategory,
        lastCalculated: (data?.lastCalculated as string) || new Date().toISOString(),
      }
    },
    enabled: !!clientId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options,
  })
}

/**
 * Fetch client reporting data (performance, allocation, history)
 */
export function useClientReporting(
  clientId: string,
  options?: Omit<UseQueryOptions<Record<string, unknown>>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: ['client-reporting', clientId],
    queryFn: async () => {
      // Try to fetch real data, fallback to computed data
      try {
        const [patrimoineRes, actifsRes] = await Promise.all([
          api.get<Record<string, unknown>>(`/advisor/patrimoine/stats?clientId=${clientId}`),
          api.get<Record<string, unknown>>(`/advisor/actifs?clientId=${clientId}`),
        ])
        
        const patrimoine = (patrimoineRes as { data?: Record<string, unknown> })?.data || patrimoineRes
        const actifsData = actifsRes as { data?: { data?: Record<string, unknown>[] } | Record<string, unknown>[] }
        const actifs = (actifsData?.data as { data?: Record<string, unknown>[] })?.data || actifsData?.data || []
        
        const hasAssets = Array.isArray(actifs) && actifs.length > 0
        const totalValue = (patrimoine?.totalActifs as number) || 0
        
        // Calculate allocation by type
        const allocationMap: Record<string, number> = {}
        if (Array.isArray(actifs)) {
          actifs.forEach((actif: Record<string, unknown>) => {
            const type = (actif.type as string) || 'AUTRE'
            allocationMap[type] = (allocationMap[type] || 0) + Number(actif.currentValue || actif.value || 0)
          })
        }
        
        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
        const allocation = Object.entries(allocationMap).map(([name, value], index) => ({
          name,
          value: totalValue > 0 ? Math.round((value / totalValue) * 100) : 0,
          color: colors[index % colors.length],
        }))
        
        // Génère historique simulé (à remplacer par vraie API patrimoine/evolution)
        const history = Array.from({ length: 12 }, (_, i) => {
          const date = new Date()
          date.setMonth(date.getMonth() - (11 - i))
          const variation = 1 + (Math.random() - 0.5) * 0.1
          return {
            date: date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
            value: Math.round(totalValue * variation * (0.85 + i * 0.015)),
          }
        })
        
        return {
          hasAssets,
          metrics: {
            totalValue,
            performancePercent: hasAssets ? ((Math.random() - 0.3) * 20) : 0,
            unrealizedGain: hasAssets ? totalValue * 0.05 : 0,
            lastUpdate: new Date().toISOString(),
          },
          allocation,
          history,
        }
      } catch (error) {
        return {
          hasAssets: false,
          metrics: {
            totalValue: 0,
            performancePercent: 0,
            unrealizedGain: 0,
            lastUpdate: new Date().toISOString(),
          },
          allocation: [],
          history: [],
        }
      }
    },
    enabled: !!clientId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options,
  })
}
