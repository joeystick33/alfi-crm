import { useQuery, useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query'
import { api, buildQueryString } from '@/app/_common/lib/api-client'
import { toast } from '@/app/_common/hooks/use-toast'

// ============================================================================
// Dossiers hooks
// ============================================================================

export function useDossiers(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['dossiers', filters],
    queryFn: () => api.get<{ data: Record<string, unknown>[]; total: number; limit: number; offset: number }>(`/advisor/dossiers${buildQueryString(filters || {})}`),
    staleTime: 2 * 60 * 1000,
  })
}

export function useDossier(id: string) {
  return useQuery({
    queryKey: ['dossiers', id],
    queryFn: () => api.get<Record<string, unknown>>(`/advisor/dossiers/${id}`),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  })
}

export function useCreateDossier(options?: UseMutationOptions<Record<string, unknown>, Error, Record<string, unknown>>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post('/advisor/dossiers', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dossiers'] })
      queryClient.invalidateQueries({ queryKey: ['dossier-stats'] })
      toast({ title: 'Dossier créé', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

export function useUpdateDossier(options?: UseMutationOptions<Record<string, unknown>, Error, { id: string; data: Record<string, unknown> }>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => api.patch(`/advisor/dossiers/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['dossiers'] })
      queryClient.invalidateQueries({ queryKey: ['dossiers', id] })
      queryClient.invalidateQueries({ queryKey: ['dossier-stats'] })
      toast({ title: 'Dossier mis à jour', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

export function useDeleteDossier(options?: UseMutationOptions<Record<string, unknown>, Error, string>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/advisor/dossiers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dossiers'] })
      queryClient.invalidateQueries({ queryKey: ['dossier-stats'] })
      toast({ title: 'Dossier supprimé', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

export function useActivateDossier(options?: UseMutationOptions<Record<string, unknown>, Error, string>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post(`/advisor/dossiers/${id}/activate`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['dossiers'] })
      queryClient.invalidateQueries({ queryKey: ['dossiers', id] })
      toast({ title: 'Dossier activé', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

export function useStartDossier(options?: UseMutationOptions<Record<string, unknown>, Error, string>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post(`/advisor/dossiers/${id}/start`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['dossiers'] })
      queryClient.invalidateQueries({ queryKey: ['dossiers', id] })
      toast({ title: 'Dossier démarré', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

export function usePauseDossier(options?: UseMutationOptions<Record<string, unknown>, Error, string>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post(`/advisor/dossiers/${id}/pause`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['dossiers'] })
      queryClient.invalidateQueries({ queryKey: ['dossiers', id] })
      toast({ title: 'Dossier mis en attente', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

export function useCompleteDossier(options?: UseMutationOptions<Record<string, unknown>, Error, string>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post(`/advisor/dossiers/${id}/complete`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['dossiers'] })
      queryClient.invalidateQueries({ queryKey: ['dossiers', id] })
      toast({ title: 'Dossier terminé', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

export function useCancelDossier(options?: UseMutationOptions<Record<string, unknown>, Error, string>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post(`/advisor/dossiers/${id}/cancel`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['dossiers'] })
      queryClient.invalidateQueries({ queryKey: ['dossiers', id] })
      toast({ title: 'Dossier annulé', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

export function useArchiveDossier(options?: UseMutationOptions<Record<string, unknown>, Error, string>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post(`/advisor/dossiers/${id}/archive`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['dossiers'] })
      queryClient.invalidateQueries({ queryKey: ['dossiers', id] })
      toast({ title: 'Dossier archivé', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

export function useUnarchiveDossier(options?: UseMutationOptions<Record<string, unknown>, Error, string>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post(`/advisor/dossiers/${id}/unarchive`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['dossiers'] })
      queryClient.invalidateQueries({ queryKey: ['dossiers', id] })
      toast({ title: 'Dossier désarchivé', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

export function useDossierStats(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['dossier-stats', filters],
    queryFn: () => api.get<Record<string, unknown>>(`/advisor/dossiers/stats${buildQueryString(filters || {})}`),
    staleTime: 1 * 60 * 1000,
  })
}
