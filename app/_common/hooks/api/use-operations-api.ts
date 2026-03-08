/**
 * React Query hooks for Operations API
 * 
 * Provides hooks for managing Affaires Nouvelles, Affaires en Cours,
 * and Opérations de Gestion.
 * 
 * @module app/_common/hooks/api/use-operations-api
 */

import { 
  useQuery, 
  useMutation, 
  useQueryClient, 
  type UseQueryOptions, 
  type UseMutationOptions 
} from '@tanstack/react-query'
import { api, buildQueryString } from '@/app/_common/lib/api-client'
import { toast } from '@/app/_common/hooks/use-toast'
import type {
  AffaireNouvelle,
  AffaireStatus,
  AffaireSource,
  ProductType,
  AffaireProductDetails,
  OperationGestion,
  OperationGestionType,
  OperationGestionStatus,
  OperationGestionDetails,
  AffaireFilters,
  OperationGestionFilters,
  InactivityCategory,
} from '@/lib/operations/types'

// ============================================================================
// Query Keys
// ============================================================================

export const operationsQueryKeys = {
  // Affaires Nouvelles
  affaires: ['operations', 'affaires'] as const,
  affaireList: (filters?: AffaireFilters) => ['operations', 'affaires', 'list', filters] as const,
  affaire: (id: string) => ['operations', 'affaires', id] as const,
  affaireHistory: (id: string) => ['operations', 'affaires', id, 'history'] as const,
  
  // Affaires en Cours
  affairesEnCours: ['operations', 'affaires', 'en-cours'] as const,
  affairesEnCoursList: (filters?: AffairesEnCoursFilters) => 
    ['operations', 'affaires', 'en-cours', 'list', filters] as const,
  
  // Opérations de Gestion
  operationsGestion: ['operations', 'gestion'] as const,
  operationGestionList: (filters?: OperationGestionFilters) => 
    ['operations', 'gestion', 'list', filters] as const,
  operationGestion: (id: string) => ['operations', 'gestion', id] as const,
  operationGestionHistory: (id: string) => ['operations', 'gestion', id, 'history'] as const,
  
  // Stats
  operationsStats: ['operations', 'stats'] as const,
}

// ============================================================================
// Types for API Responses
// ============================================================================

interface AffairesEnCoursFilters {
  inactivityCategory?: InactivityCategory[]
  productType?: ProductType[]
  providerId?: string
  clientId?: string
}

interface CreateAffaireRequest {
  clientId: string
  productType: ProductType
  providerId: string
  productId?: string
  source: AffaireSource
  estimatedAmount: number
  targetDate?: string
  productDetails?: AffaireProductDetails
}

interface UpdateAffaireRequest {
  productType?: ProductType
  providerId?: string
  productId?: string
  source?: AffaireSource
  estimatedAmount?: number
  actualAmount?: number
  targetDate?: string
  productDetails?: AffaireProductDetails
  entryFees?: number
  managementFees?: number
  expectedCommission?: number
}

interface UpdateAffaireStatusRequest {
  status: AffaireStatus
  note?: string
  rejectionReason?: string
  cancellationReason?: string
}

interface PauseAffaireRequest {
  pauseReason: string
}

interface CreateOperationGestionRequest {
  clientId: string
  contractId: string
  affaireOrigineId: string
  type: OperationGestionType
  amount?: number
  effectiveDate?: string
  operationDetails?: OperationGestionDetails
}

interface UpdateOperationGestionRequest {
  amount?: number
  effectiveDate?: string
  operationDetails?: OperationGestionDetails
}

interface UpdateOperationGestionStatusRequest {
  status: OperationGestionStatus
  note?: string
  rejectionReason?: string
}

interface AffaireEnCours extends AffaireNouvelle {
  daysSinceActivity: number
  inactivityCategory: InactivityCategory
  missingDocumentsCount: number
  blockingIssues: string[]
}

interface AffaireStatusHistoryEntry {
  id: string
  affaireId: string
  fromStatus: AffaireStatus | null
  toStatus: AffaireStatus
  note: string | null
  changedById: string
  changedAt: Date
}

interface OperationGestionStatusHistoryEntry {
  id: string
  operationId: string
  fromStatus: OperationGestionStatus | null
  toStatus: OperationGestionStatus
  note: string | null
  changedById: string
  changedAt: Date
}

interface OperationsStats {
  affairesNouvellesByStatus: Record<AffaireStatus, number>
  affairesEnCoursCount: number
  operationsGestionByStatus: Record<OperationGestionStatus, number>
  totalPipelineValue: number
  pipelineByProductType: Record<ProductType, number>
}

// ============================================================================
// Affaires Nouvelles Hooks
// ============================================================================

/**
 * Fetch list of affaires nouvelles with filters
 */
export function useAffaires(
  filters?: AffaireFilters,
  options?: Omit<UseQueryOptions<{ data: AffaireNouvelle[] }>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: operationsQueryKeys.affaireList(filters),
    queryFn: () => {
      const queryString = buildQueryString(filters || {})
      return api.get<{ data: AffaireNouvelle[] }>(`/v1/operations/affaires${queryString}`)
    },
    ...options,
  })
}

/**
 * Fetch a single affaire by ID
 */
export function useAffaire(
  id: string,
  options?: Omit<UseQueryOptions<AffaireNouvelle>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: operationsQueryKeys.affaire(id),
    queryFn: async (): Promise<AffaireNouvelle> => {
      const response = await api.get<{ data?: AffaireNouvelle } | AffaireNouvelle>(
        `/v1/operations/affaires/${id}`
      )
      return (response as { data?: AffaireNouvelle })?.data || (response as AffaireNouvelle)
    },
    enabled: !!id,
    ...options,
  })
}

/**
 * Fetch affaire status history
 */
export function useAffaireHistory(
  id: string,
  options?: Omit<UseQueryOptions<{ data: AffaireStatusHistoryEntry[] }>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: operationsQueryKeys.affaireHistory(id),
    queryFn: () => api.get<{ data: AffaireStatusHistoryEntry[] }>(`/v1/operations/affaires/${id}/history`),
    enabled: !!id,
    ...options,
  })
}

/**
 * Create an affaire nouvelle
 */
export function useCreateAffaire(
  options?: UseMutationOptions<AffaireNouvelle, Error, CreateAffaireRequest>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateAffaireRequest) =>
      api.post<AffaireNouvelle>('/v1/operations/affaires', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: operationsQueryKeys.affaires })
      queryClient.invalidateQueries({ queryKey: operationsQueryKeys.operationsStats })
      toast({ title: 'Affaire créée', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

/**
 * Update an affaire nouvelle
 */
export function useUpdateAffaire(
  options?: UseMutationOptions<AffaireNouvelle, Error, { id: string; data: UpdateAffaireRequest }>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAffaireRequest }) =>
      api.patch<AffaireNouvelle>(`/v1/operations/affaires/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: operationsQueryKeys.affaire(id) })
      queryClient.invalidateQueries({ queryKey: operationsQueryKeys.affaires })
      queryClient.invalidateQueries({ queryKey: operationsQueryKeys.affairesEnCours })
      queryClient.invalidateQueries({ queryKey: operationsQueryKeys.operationsStats })
      toast({ title: 'Affaire mise à jour', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

/**
 * Update affaire status
 */
export function useUpdateAffaireStatus(
  options?: UseMutationOptions<AffaireNouvelle, Error, { id: string; data: UpdateAffaireStatusRequest }>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAffaireStatusRequest }) =>
      api.patch<AffaireNouvelle>(`/v1/operations/affaires/${id}/status`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: operationsQueryKeys.affaire(id) })
      queryClient.invalidateQueries({ queryKey: operationsQueryKeys.affaireHistory(id) })
      queryClient.invalidateQueries({ queryKey: operationsQueryKeys.affaires })
      queryClient.invalidateQueries({ queryKey: operationsQueryKeys.affairesEnCours })
      queryClient.invalidateQueries({ queryKey: operationsQueryKeys.operationsStats })
      toast({ title: 'Statut mis à jour', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

/**
 * Pause an affaire
 */
export function usePauseAffaire(
  options?: UseMutationOptions<AffaireNouvelle, Error, { id: string; data: PauseAffaireRequest }>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PauseAffaireRequest }) =>
      api.post<AffaireNouvelle>(`/v1/operations/affaires/${id}/pause`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: operationsQueryKeys.affaire(id) })
      queryClient.invalidateQueries({ queryKey: operationsQueryKeys.affaires })
      queryClient.invalidateQueries({ queryKey: operationsQueryKeys.affairesEnCours })
      toast({ title: 'Affaire mise en pause', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

/**
 * Resume an affaire
 */
export function useResumeAffaire(
  options?: UseMutationOptions<AffaireNouvelle, Error, string>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      api.post<AffaireNouvelle>(`/v1/operations/affaires/${id}/resume`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: operationsQueryKeys.affaire(id) })
      queryClient.invalidateQueries({ queryKey: operationsQueryKeys.affaires })
      queryClient.invalidateQueries({ queryKey: operationsQueryKeys.affairesEnCours })
      toast({ title: 'Affaire reprise', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

/**
 * Delete an affaire
 */
export function useDeleteAffaire(
  options?: UseMutationOptions<void, Error, string>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.delete(`/v1/operations/affaires/${id}`).then(() => {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: operationsQueryKeys.affaires })
      queryClient.invalidateQueries({ queryKey: operationsQueryKeys.affairesEnCours })
      queryClient.invalidateQueries({ queryKey: operationsQueryKeys.operationsStats })
      toast({ title: 'Affaire supprimée', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

// ============================================================================
// Affaires en Cours Hooks
// ============================================================================

/**
 * Fetch list of affaires en cours with filters
 */
export function useAffairesEnCours(
  filters?: AffairesEnCoursFilters,
  options?: Omit<UseQueryOptions<{ data: AffaireEnCours[] }>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: operationsQueryKeys.affairesEnCoursList(filters),
    queryFn: () => {
      const queryString = buildQueryString(filters || {})
      return api.get<{ data: AffaireEnCours[] }>(`/v1/operations/affaires/en-cours${queryString}`)
    },
    ...options,
  })
}

/**
 * Send a reminder for an affaire en cours
 */
export function useSendAffaireReminder(
  options?: UseMutationOptions<void, Error, string>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      api.post(`/v1/operations/affaires/${id}/remind`).then(() => {}),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: operationsQueryKeys.affaire(id) })
      queryClient.invalidateQueries({ queryKey: operationsQueryKeys.affairesEnCours })
      toast({ title: 'Relance envoyée', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

// ============================================================================
// Opérations de Gestion Hooks
// ============================================================================

/**
 * Fetch list of opérations de gestion with filters
 */
export function useOperationsGestion(
  filters?: OperationGestionFilters,
  options?: Omit<UseQueryOptions<{ data: OperationGestion[] }>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: operationsQueryKeys.operationGestionList(filters),
    queryFn: () => {
      const queryString = buildQueryString(filters || {})
      return api.get<{ data: OperationGestion[] }>(`/v1/operations/gestion${queryString}`)
    },
    ...options,
  })
}

/**
 * Fetch a single opération de gestion by ID
 */
export function useOperationGestion(
  id: string,
  options?: Omit<UseQueryOptions<OperationGestion>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: operationsQueryKeys.operationGestion(id),
    queryFn: async (): Promise<OperationGestion> => {
      const response = await api.get<{ data?: OperationGestion } | OperationGestion>(
        `/v1/operations/gestion/${id}`
      )
      return (response as { data?: OperationGestion })?.data || (response as OperationGestion)
    },
    enabled: !!id,
    ...options,
  })
}

/**
 * Fetch opération de gestion status history
 */
export function useOperationGestionHistory(
  id: string,
  options?: Omit<UseQueryOptions<{ data: OperationGestionStatusHistoryEntry[] }>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: operationsQueryKeys.operationGestionHistory(id),
    queryFn: () => api.get<{ data: OperationGestionStatusHistoryEntry[] }>(`/v1/operations/gestion/${id}/history`),
    enabled: !!id,
    ...options,
  })
}

/**
 * Create an opération de gestion
 */
export function useCreateOperationGestion(
  options?: UseMutationOptions<OperationGestion, Error, CreateOperationGestionRequest>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateOperationGestionRequest) =>
      api.post<OperationGestion>('/v1/operations/gestion', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: operationsQueryKeys.operationsGestion })
      queryClient.invalidateQueries({ queryKey: operationsQueryKeys.operationsStats })
      toast({ title: 'Opération créée', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

/**
 * Update an opération de gestion
 */
export function useUpdateOperationGestion(
  options?: UseMutationOptions<OperationGestion, Error, { id: string; data: UpdateOperationGestionRequest }>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateOperationGestionRequest }) =>
      api.patch<OperationGestion>(`/v1/operations/gestion/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: operationsQueryKeys.operationGestion(id) })
      queryClient.invalidateQueries({ queryKey: operationsQueryKeys.operationsGestion })
      queryClient.invalidateQueries({ queryKey: operationsQueryKeys.operationsStats })
      toast({ title: 'Opération mise à jour', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

/**
 * Update opération de gestion status
 */
export function useUpdateOperationGestionStatus(
  options?: UseMutationOptions<OperationGestion, Error, { id: string; data: UpdateOperationGestionStatusRequest }>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateOperationGestionStatusRequest }) =>
      api.patch<OperationGestion>(`/v1/operations/gestion/${id}/status`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: operationsQueryKeys.operationGestion(id) })
      queryClient.invalidateQueries({ queryKey: operationsQueryKeys.operationGestionHistory(id) })
      queryClient.invalidateQueries({ queryKey: operationsQueryKeys.operationsGestion })
      queryClient.invalidateQueries({ queryKey: operationsQueryKeys.operationsStats })
      toast({ title: 'Statut mis à jour', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

/**
 * Delete an opération de gestion
 */
export function useDeleteOperationGestion(
  options?: UseMutationOptions<void, Error, string>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.delete(`/v1/operations/gestion/${id}`).then(() => {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: operationsQueryKeys.operationsGestion })
      queryClient.invalidateQueries({ queryKey: operationsQueryKeys.operationsStats })
      toast({ title: 'Opération supprimée', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

// ============================================================================
// Operations Stats Hook
// ============================================================================

/**
 * Fetch operations statistics
 */
export function useOperationsStats(
  options?: Omit<UseQueryOptions<OperationsStats>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: operationsQueryKeys.operationsStats,
    queryFn: async (): Promise<OperationsStats> => {
      const response = await api.get<{ data?: OperationsStats } | OperationsStats>('/v1/operations/stats')
      return (response as { data?: OperationsStats })?.data || (response as OperationsStats)
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    ...options,
  })
}
