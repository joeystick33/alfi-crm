import { useQuery, useMutation, useQueryClient, type UseQueryOptions, type UseMutationOptions } from '@tanstack/react-query'
import { api, buildQueryString } from '@/app/_common/lib/api-client'
import type {
  ManagementStatsFilters,
  ManagementStats,
  ConseillerDetailStats,
  ObjectifItem,
  ActionItem,
  ReunionItem,
} from '@/app/_common/lib/api-types'
import { toast } from '@/app/_common/hooks/use-toast'

// ============================================================================
// Collaborators Hooks
// ============================================================================

export function useCollaborators() {
  return useQuery({
    queryKey: ['collaborators'],
    queryFn: () => api.get<{ collaborators: Record<string, unknown>[] }>('/advisor/collaborators'),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

// ============================================================================
// Conseillers Hooks
// ============================================================================

export function useConseillers(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['conseillers', filters],
    queryFn: () => api.get<{ data: Record<string, unknown>[]; pagination: Record<string, unknown> }>(`/advisor/conseillers${buildQueryString(filters || {})}`),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useConseiller(id: string) {
  return useQuery({
    queryKey: ['conseillers', id],
    queryFn: () => api.get<Record<string, unknown>>(`/advisor/conseillers/${id}`),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateConseiller(
  options?: UseMutationOptions<Record<string, unknown>, Error, Record<string, unknown>>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post('/advisor/conseillers', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conseillers'] })
      toast({
        title: 'Conseiller créé',
        description: 'Le conseiller a été créé avec succès.',
        variant: 'success',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de créer le conseiller.',
        variant: 'destructive',
      })
    },
    ...options,
  })
}

export function useUpdateConseiller(
  options?: UseMutationOptions<Record<string, unknown>, Error, { id: string; data: Record<string, unknown> }>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }) => api.patch(`/advisor/conseillers/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['conseillers'] })
      queryClient.invalidateQueries({ queryKey: ['conseillers', id] })
      toast({
        title: 'Conseiller mis à jour',
        description: 'Les modifications ont été enregistrées.',
        variant: 'success',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de modifier le conseiller.',
        variant: 'destructive',
      })
    },
    ...options,
  })
}

export function useDeleteConseiller(
  options?: UseMutationOptions<Record<string, unknown>, Error, string>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.delete(`/advisor/conseillers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conseillers'] })
      toast({
        title: 'Conseiller supprimé',
        description: 'Le conseiller a été désactivé avec succès.',
        variant: 'success',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de supprimer le conseiller.',
        variant: 'destructive',
      })
    },
    ...options,
  })
}

export function useConseillerStats(id: string) {
  return useQuery({
    queryKey: ['conseillers', id, 'stats'],
    queryFn: () => api.get<Record<string, unknown>>(`/advisor/conseillers/${id}/stats`),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

// ============================================================================
// Assignments Hooks
// ============================================================================

export function useAssignments(advisorId: string) {
  return useQuery({
    queryKey: ['conseillers', advisorId, 'assignments'],
    queryFn: () => api.get<{ data: Record<string, unknown>[]; total: number }>(`/advisor/conseillers/${advisorId}/assignments`),
    enabled: !!advisorId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateAssignment(
  options?: UseMutationOptions<Record<string, unknown>, Error, { advisorId: string; data: Record<string, unknown> }>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ advisorId, data }) => api.post(`/advisor/conseillers/${advisorId}/assignments`, data),
    onSuccess: (_, { advisorId }) => {
      queryClient.invalidateQueries({ queryKey: ['conseillers', advisorId, 'assignments'] })
      toast({
        title: 'Assistant assigné',
        description: 'L\'assistant a été assigné avec succès.',
        variant: 'success',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible d\'assigner l\'assistant.',
        variant: 'destructive',
      })
    },
    ...options,
  })
}

export function useDeleteAssignment(
  options?: UseMutationOptions<Record<string, unknown>, Error, { advisorId: string; assistantId: string }>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ advisorId, assistantId }) => 
      api.delete(`/advisor/conseillers/${advisorId}/assignments?assistantId=${assistantId}`),
    onSuccess: (_, { advisorId }) => {
      queryClient.invalidateQueries({ queryKey: ['conseillers', advisorId, 'assignments'] })
      toast({
        title: 'Assignment supprimée',
        description: 'L\'assistant a été retiré avec succès.',
        variant: 'success',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de retirer l\'assistant.',
        variant: 'destructive',
      })
    },
    ...options,
  })
}

// ============================================================================
// Management Hooks (Admin Cabinet)
// ============================================================================

/**
 * Fetch management dashboard stats
 */
export function useManagementStats(
  filters?: ManagementStatsFilters,
  options?: Omit<UseQueryOptions<ManagementStats>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: ['management', 'stats', filters] as const,
    queryFn: () => api.get<ManagementStats>(`/advisor/management/stats${buildQueryString(filters || {})}`),
    staleTime: 1000 * 60 * 2, // 2 minutes
    ...options,
  })
}

/**
 * Fetch conseiller detail stats for management (Admin view)
 */
export function useConseillerManagementStats(
  conseillerId: string,
  filters?: ManagementStatsFilters,
  options?: Omit<UseQueryOptions<ConseillerDetailStats>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: ['management', 'conseillers', conseillerId, filters] as const,
    queryFn: () => api.get<ConseillerDetailStats>(`/advisor/management/conseillers/${conseillerId}${buildQueryString(filters || {})}`),
    enabled: !!conseillerId,
    staleTime: 1000 * 60 * 2,
    ...options,
  })
}

/**
 * Fetch management objectifs
 */
export function useManagementObjectifs(
  filters?: ManagementStatsFilters,
  options?: Omit<UseQueryOptions<{ period: string; periodLabel: string; objectifs: ObjectifItem[] }>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: ['management', 'objectifs', filters] as const,
    queryFn: () => api.get<{ period: string; periodLabel: string; objectifs: ObjectifItem[] }>(`/advisor/management/objectifs${buildQueryString(filters || {})}`),
    staleTime: 1000 * 60 * 2,
    ...options,
  })
}

/**
 * Create management objectif
 */
export function useCreateObjectif(options?: UseMutationOptions<ObjectifItem, Error, Partial<ObjectifItem>>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Partial<ObjectifItem>) => api.post<ObjectifItem>('/advisor/management/objectifs', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['management', 'objectifs'] })
      toast({ title: 'Succès', description: 'Objectif créé avec succès' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

/**
 * Fetch management facturation
 */
export function useManagementFacturation(
  filters?: ManagementStatsFilters & { status?: string; conseillerId?: string },
  options?: Omit<UseQueryOptions<Record<string, unknown>>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: ['management', 'facturation', filters] as const,
    queryFn: () => api.get<Record<string, unknown>>(`/advisor/management/facturation${buildQueryString(filters || {})}`),
    staleTime: 1000 * 60 * 2,
    ...options,
  })
}

/**
 * Fetch management actions
 */
export function useManagementActions(
  filters?: { status?: string; type?: string },
  options?: Omit<UseQueryOptions<{ actions: ActionItem[] }>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: ['management', 'actions', filters] as const,
    queryFn: () => api.get<{ actions: ActionItem[] }>(`/advisor/management/actions${buildQueryString(filters || {})}`),
    staleTime: 1000 * 60 * 2,
    ...options,
  })
}

/**
 * Create management action
 */
export function useCreateManagementAction(options?: UseMutationOptions<ActionItem, Error, Partial<ActionItem>>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Partial<ActionItem>) => api.post<ActionItem>('/advisor/management/actions', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['management', 'actions'] })
      toast({ title: 'Succès', description: 'Action créée avec succès' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

/**
 * Fetch management reunions
 */
export function useManagementReunions(
  filters?: { type?: string; upcoming?: boolean },
  options?: Omit<UseQueryOptions<{ reunions: ReunionItem[] }>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: ['management', 'reunions', filters] as const,
    queryFn: () => api.get<{ reunions: ReunionItem[] }>(`/advisor/management/reunions${buildQueryString(filters || {})}`),
    staleTime: 1000 * 60 * 2,
    ...options,
  })
}

/**
 * Create management reunion
 */
export function useCreateManagementReunion(options?: UseMutationOptions<ReunionItem, Error, Partial<ReunionItem> & { participantIds?: string[] }>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Partial<ReunionItem> & { participantIds?: string[] }) => api.post<ReunionItem>('/advisor/management/reunions', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['management', 'reunions'] })
      toast({ title: 'Succès', description: 'Réunion planifiée avec succès' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

/**
 * Generate management report
 */
export function useManagementReporting(
  params: { type: 'cabinet' | 'conseiller' | 'facturation' | 'objectifs'; period?: string; conseillerId?: string; format?: 'json' | 'pdf' },
  options?: Omit<UseQueryOptions<Record<string, unknown>>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: ['management', 'reporting', params] as const,
    queryFn: () => api.get<Record<string, unknown>>(`/advisor/management/reporting${buildQueryString(params)}`),
    enabled: false, // Manual trigger only
    ...options,
  })
}
