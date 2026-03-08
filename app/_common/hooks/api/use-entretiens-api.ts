import { useQuery, useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query'
import { api, buildQueryString } from '@/app/_common/lib/api-client'
import { toast } from '@/app/_common/hooks/use-toast'

// ============================================================================
// Entretiens hooks — CRUD + Brief + Actions + Search + Timeline
// ============================================================================

// ── CRUD ──

export function useEntretiens(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['entretiens', filters],
    queryFn: () => api.get<{ data: Record<string, unknown>[]; total: number }>(`/advisor/entretiens${buildQueryString(filters || {})}`),
    staleTime: 2 * 60 * 1000,
  })
}

export function useEntretien(id: string) {
  return useQuery({
    queryKey: ['entretiens', id],
    queryFn: () => api.get<Record<string, unknown>>(`/advisor/entretiens/${id}`),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  })
}

export function useCreateEntretien(options?: UseMutationOptions<Record<string, unknown>, Error, Record<string, unknown>>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post<Record<string, unknown>>('/advisor/entretiens', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entretiens'] })
      queryClient.invalidateQueries({ queryKey: ['entretien-stats'] })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

export function useUpdateEntretien(options?: UseMutationOptions<Record<string, unknown>, Error, { id: string; data: Record<string, unknown> }>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => api.patch<Record<string, unknown>>(`/advisor/entretiens/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['entretiens'] })
      queryClient.invalidateQueries({ queryKey: ['entretiens', id] })
      queryClient.invalidateQueries({ queryKey: ['entretien-stats'] })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

export function useDeleteEntretien(options?: UseMutationOptions<Record<string, unknown>, Error, string>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete<Record<string, unknown>>(`/advisor/entretiens/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entretiens'] })
      queryClient.invalidateQueries({ queryKey: ['entretien-stats'] })
      toast({ title: 'Entretien supprimé' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

export function useTraiterEntretien(options?: UseMutationOptions<Record<string, unknown>, Error, { id: string; data: Record<string, unknown> }>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => api.post<Record<string, unknown>>(`/advisor/entretiens/${id}/traiter`, data, { retry: false }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['entretiens'] })
      queryClient.invalidateQueries({ queryKey: ['entretiens', id] })
      queryClient.invalidateQueries({ queryKey: ['entretien-stats'] })
      queryClient.invalidateQueries({ queryKey: ['entretien-actions'] })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur traitement IA', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

// ── Stats ──

export function useEntretienStats(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['entretien-stats', filters],
    queryFn: () => api.get<Record<string, unknown>>(`/advisor/entretiens/stats${buildQueryString(filters || {})}`),
    staleTime: 1 * 60 * 1000,
  })
}

// ── Brief client (préparation entretien) ──

export function useClientBrief(clientId: string | null | undefined) {
  return useQuery({
    queryKey: ['entretien-brief', clientId],
    queryFn: () => api.get<Record<string, unknown>>(`/advisor/entretiens/brief/${clientId}`),
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000,
  })
}

// ── Actions en attente (suivi transversal) ──

export function useEntretienActions(filters?: { clientId?: string }) {
  return useQuery({
    queryKey: ['entretien-actions', filters],
    queryFn: () => api.get<{ actions: Record<string, unknown>[]; total: number }>(`/advisor/entretiens/actions${buildQueryString(filters || {})}`),
    staleTime: 2 * 60 * 1000,
  })
}

// ── Recherche cross-entretiens ──

export function useSearchEntretiens(query: string, options?: { clientId?: string }) {
  const params: Record<string, unknown> = { q: query }
  if (options?.clientId) params.clientId = options.clientId
  return useQuery({
    queryKey: ['entretien-search', query, options],
    queryFn: () => api.get<{ results: Record<string, unknown>[]; total: number; query: string }>(`/advisor/entretiens/search${buildQueryString(params)}`),
    enabled: query.length >= 2,
    staleTime: 30 * 1000,
  })
}

// ── Timeline client ──

export function useClientTimeline(clientId: string | null | undefined) {
  return useQuery({
    queryKey: ['entretien-timeline', clientId],
    queryFn: () => api.get<{ data: Record<string, unknown>[] }>(`/advisor/entretiens/timeline/${clientId}`),
    enabled: !!clientId,
    staleTime: 2 * 60 * 1000,
  })
}
