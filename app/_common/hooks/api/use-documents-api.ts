import { useQuery, useMutation, useQueryClient, type UseQueryOptions, type UseMutationOptions } from '@tanstack/react-query'
import { api, buildQueryString } from '@/app/_common/lib/api-client'
import type {
  DocumentListItem,
  DocumentDetail,
  UploadDocumentRequest,
  UpdateDocumentRequest,
  DocumentFilters,
  DocumentStats,
  DocumentVersionItem,
  DocumentTemplateListItem,
  DocumentTemplateDetail,
  CreateDocumentTemplateRequest,
  UpdateDocumentTemplateRequest,
  GenerateDocumentFromTemplateRequest,
  DocumentTemplateStats,
  SignatureWorkflowStep,
  InitiateSignatureRequest,
  UpdateSignatureStepRequest,
  SignatureStats,
  PendingSignatureItem,
} from '@/app/_common/lib/api-types'
import { toast } from '@/app/_common/hooks/use-toast'
import { queryKeys } from './query-keys'

// ============================================================================
// GED – Documents
// ============================================================================

export function useDocuments(
  filters?: DocumentFilters,
  options?: Omit<UseQueryOptions<{ data: DocumentListItem[] }>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.documentList(filters),
    queryFn: () => api.get<{ data: DocumentListItem[] }>(`/advisor/documents${buildQueryString(filters || {})}`),
    ...options,
  })
}

export function useDocument(
  id: string,
  options?: Omit<UseQueryOptions<DocumentDetail>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.document(id),
    queryFn: () => api.get<DocumentDetail>(`/advisor/documents/${id}`),
    enabled: !!id,
    ...options,
  })
}

export function useDocumentStats(
  options?: Omit<UseQueryOptions<DocumentStats>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.documentStats,
    queryFn: () => api.get<DocumentStats>('/advisor/documents/stats'),
    ...options,
  })
}

export function useDocumentVersions(
  id: string,
  options?: Omit<UseQueryOptions<{ data: DocumentVersionItem[] }>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.documentVersions(id),
    queryFn: () => api.get<{ data: DocumentVersionItem[] }>(`/advisor/documents/${id}/versions`),
    enabled: !!id,
    ...options,
  })
}

export function useUploadDocument(
  options?: UseMutationOptions<DocumentDetail, Error, UploadDocumentRequest>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UploadDocumentRequest) => api.post<DocumentDetail>('/advisor/documents', data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.documents })
      queryClient.invalidateQueries({ queryKey: queryKeys.documentStats })
      toast({ title: 'Document importé', description: data.name, variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur import', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

export function useUpdateDocument(
  options?: UseMutationOptions<DocumentDetail, Error, { id: string; data: UpdateDocumentRequest }>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDocumentRequest }) =>
      api.patch<DocumentDetail>(`/advisor/documents/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.document(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.documents })
      toast({ title: 'Document mis à jour', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

export function useDeleteDocument(
  options?: UseMutationOptions<void, Error, string>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/advisor/documents/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.documents })
      queryClient.invalidateQueries({ queryKey: queryKeys.documentStats })
      toast({ title: 'Document supprimé', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

// ============================================================================
// GED – Templates
// ============================================================================

export function useDocumentTemplates(
  filters?: Record<string, unknown>,
  options?: Omit<UseQueryOptions<{ data: DocumentTemplateListItem[] }>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.documentTemplateList(filters),
    queryFn: () => api.get<{ data: DocumentTemplateListItem[] }>(`/advisor/documents/templates${buildQueryString(filters || {})}`),
    ...options,
  })
}

export function useDocumentTemplate(
  id: string,
  options?: Omit<UseQueryOptions<DocumentTemplateDetail>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.documentTemplate(id),
    queryFn: () => api.get<DocumentTemplateDetail>(`/advisor/documents/templates/${id}`),
    enabled: !!id,
    ...options,
  })
}

export function useDocumentTemplateStats(
  options?: Omit<UseQueryOptions<DocumentTemplateStats>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.documentTemplateStats,
    queryFn: () => api.get<DocumentTemplateStats>('/advisor/documents/templates/stats'),
    ...options,
  })
}

export function useCreateDocumentTemplate(
  options?: UseMutationOptions<DocumentTemplateDetail, Error, CreateDocumentTemplateRequest>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateDocumentTemplateRequest) =>
      api.post<DocumentTemplateDetail>('/advisor/documents/templates', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.documentTemplates })
      toast({ title: 'Template créé', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

export function useUpdateDocumentTemplate(
  options?: UseMutationOptions<DocumentTemplateDetail, Error, { id: string; data: UpdateDocumentTemplateRequest }>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDocumentTemplateRequest }) =>
      api.patch<DocumentTemplateDetail>(`/advisor/documents/templates/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.documentTemplate(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.documentTemplates })
      toast({ title: 'Template mis à jour', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

export function useDeleteDocumentTemplate(
  options?: UseMutationOptions<void, Error, string>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/advisor/documents/templates/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.documentTemplates })
      toast({ title: 'Template supprimé', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

export function useGenerateDocumentFromTemplate(
  options?: UseMutationOptions<DocumentDetail, Error, { id: string; data: GenerateDocumentFromTemplateRequest }>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: GenerateDocumentFromTemplateRequest }) =>
      api.post<DocumentDetail>(`/advisor/documents/templates/${id}/generate`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.documents })
      toast({ title: 'Document généré', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

// ============================================================================
// GED – Signatures électroniques
// ============================================================================

export function useSignatureSteps(
  documentId: string,
  options?: Omit<UseQueryOptions<{ data: SignatureWorkflowStep[] }>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.signatureSteps(documentId),
    queryFn: () => api.get<{ data: SignatureWorkflowStep[] }>(`/advisor/documents/signatures${buildQueryString({ documentId })}`),
    enabled: !!documentId,
    ...options,
  })
}

export function useInitiateSignature(
  options?: UseMutationOptions<{ data: SignatureWorkflowStep[] }, Error, InitiateSignatureRequest>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: InitiateSignatureRequest) =>
      api.post<{ data: SignatureWorkflowStep[] }>('/advisor/documents/signatures', data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.signatureSteps(variables.documentId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.documents })
      toast({ title: 'Signature initiée', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

export function useUpdateSignatureStep(
  options?: UseMutationOptions<SignatureWorkflowStep, Error, { stepId: string; data: UpdateSignatureStepRequest }>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ stepId, data }: { stepId: string; data: UpdateSignatureStepRequest }) =>
      api.patch<SignatureWorkflowStep>(`/advisor/documents/signatures/${stepId}`, data),
    onSuccess: (step) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.signatureSteps(step.documentId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.documents })
      toast({ title: 'Étape mise à jour', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

export function useSignatureStats(
  options?: Omit<UseQueryOptions<SignatureStats>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.signatureStats,
    queryFn: () => api.get<SignatureStats>('/advisor/documents/signatures/stats'),
    ...options,
  })
}

export function usePendingSignatures(
  options?: Omit<UseQueryOptions<{ data: PendingSignatureItem[] }>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.pendingSignatures,
    queryFn: () => api.get<{ data: PendingSignatureItem[] }>('/advisor/documents/signatures/pending'),
    ...options,
  })
}
