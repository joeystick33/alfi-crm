import { useQuery, useMutation, useQueryClient, type UseQueryOptions, type UseMutationOptions } from '@tanstack/react-query'
import { api, buildQueryString } from '@/app/_common/lib/api-client'
import type {
  KYCDocumentListItem,
  KYCDocumentDetail,
  CreateKYCDocumentRequest,
  ValidateKYCDocumentRequest,
  KYCDocumentFilters,
  KYCCheckListItem,
  KYCCheckDetail,
  CreateKYCCheckRequest,
  UpdateKYCCheckRequest,
  CompleteKYCCheckRequest,
  KYCCheckFilters,
  KYCStats,
  KYCCheckStats,
} from '@/app/_common/lib/api-types'
import { toast } from '@/app/_common/hooks/use-toast'
import { queryKeys } from './query-keys'

// ============================================================================
// KYC Documents Hooks
// ============================================================================

/**
 * Fetch list of KYC documents with filters
 */
export function useKYCDocuments(
  filters?: KYCDocumentFilters,
  options?: Omit<UseQueryOptions<{ data: KYCDocumentListItem[] }>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.kycDocumentList(filters),
    queryFn: () => {
      const queryString = buildQueryString(filters || {})
      return api.get<{ data: KYCDocumentListItem[] }>(`/kyc/documents${queryString}`)
    },
    ...options,
  })
}

/**
 * Create a KYC document
 */
export function useCreateKYCDocument(
  options?: UseMutationOptions<KYCDocumentDetail, Error, CreateKYCDocumentRequest>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateKYCDocumentRequest) =>
      api.post<KYCDocumentDetail>('/kyc/documents', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.kycDocuments })
      queryClient.invalidateQueries({ queryKey: queryKeys.kycStats })
      toast({ title: 'Document KYC ajouté', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

/**
 * Validate or reject a KYC document
 */
export function useValidateKYCDocument(
  options?: UseMutationOptions<KYCDocumentDetail, Error, { id: string; data: ValidateKYCDocumentRequest }>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ValidateKYCDocumentRequest }) =>
      api.post<KYCDocumentDetail>(`/kyc/documents/${id}/validate`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.kycDocument(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.kycDocuments })
      queryClient.invalidateQueries({ queryKey: queryKeys.kycStats })
      toast({ title: 'Document KYC validé', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

/**
 * Delete a KYC document
 */
export function useDeleteKYCDocument(
  options?: UseMutationOptions<void, Error, string>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.delete(`/kyc/documents/${id}`).then(() => { }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.kycDocuments })
      queryClient.invalidateQueries({ queryKey: queryKeys.kycStats })
      toast({ title: 'Document KYC supprimé', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

// ============================================================================
// KYC Checks Hooks
// ============================================================================

/**
 * Fetch list of KYC checks with filters
 */
export function useKYCChecks(
  filters?: KYCCheckFilters,
  options?: Omit<UseQueryOptions<{ data: KYCCheckListItem[] }>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.kycCheckList(filters),
    queryFn: () => {
      const queryString = buildQueryString(filters || {})
      return api.get<{ data: KYCCheckListItem[] }>(`/kyc/checks${queryString}`)
    },
    ...options,
  })
}

/**
 * Fetch a single KYC check by ID
 */
export function useKYCCheck(
  id: string,
  options?: Omit<UseQueryOptions<KYCCheckDetail>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.kycCheck(id),
    queryFn: () => api.get<KYCCheckDetail>(`/kyc/checks/${id}`),
    enabled: !!id,
    ...options,
  })
}

/**
 * Create a KYC check
 */
export function useCreateKYCCheck(
  options?: UseMutationOptions<KYCCheckDetail, Error, CreateKYCCheckRequest>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateKYCCheckRequest) =>
      api.post<KYCCheckDetail>('/kyc/checks', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.kycChecks })
      queryClient.invalidateQueries({ queryKey: queryKeys.kycStats })
      toast({ title: 'Contrôle KYC créé', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

/**
 * Update a KYC check
 */
export function useUpdateKYCCheck(
  options?: UseMutationOptions<KYCCheckDetail, Error, { id: string; data: UpdateKYCCheckRequest }>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateKYCCheckRequest }) =>
      api.patch<KYCCheckDetail>(`/kyc/checks/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.kycCheck(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.kycChecks })
      queryClient.invalidateQueries({ queryKey: queryKeys.kycStats })
      toast({ title: 'Contrôle KYC mis à jour', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

/**
 * Complete a KYC check
 */
export function useCompleteKYCCheck(
  options?: UseMutationOptions<KYCCheckDetail, Error, { id: string; data: CompleteKYCCheckRequest }>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CompleteKYCCheckRequest }) =>
      api.post<KYCCheckDetail>(`/kyc/checks/${id}/complete`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.kycCheck(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.kycChecks })
      queryClient.invalidateQueries({ queryKey: queryKeys.kycStats })
      toast({ title: 'Contrôle KYC complété', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

/**
 * Delete a KYC check
 */
export function useDeleteKYCCheck(
  options?: UseMutationOptions<void, Error, string>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.delete(`/kyc/checks/${id}`).then(() => { }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.kycChecks })
      queryClient.invalidateQueries({ queryKey: queryKeys.kycStats })
      toast({ title: 'Contrôle KYC supprimé', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

/**
 * Fetch KYC stats (documents + checks)
 */
export function useKYCStats(
  options?: Omit<UseQueryOptions<{ documents: KYCStats; checks: KYCCheckStats }>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.kycStats,
    queryFn: () => api.get<{ documents: KYCStats; checks: KYCCheckStats }>('/kyc/stats'),
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options,
  })
}

export function useRemindKYC() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (clientId: string) => api.post('/kyc/documents/remind', { clientId }).then(() => { }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.kycDocumentList() })
    },
  })
}
