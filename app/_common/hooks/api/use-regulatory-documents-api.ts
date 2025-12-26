/**
 * React Query hooks for Regulatory Documents API
 * 
 * Provides hooks for managing regulatory document templates (DER, Lettre de Mission, etc.)
 * and generated documents for compliance purposes.
 * 
 * @module app/_common/hooks/api/use-regulatory-documents-api
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
  DocumentTemplate,
  GeneratedDocument,
  RegulatoryDocumentType,
  AssociationType,
  DocumentFormat,
  DocumentStatus,
  DocumentTemplateContent,
  DocumentExportOptions,
  DocumentExportResult,
  DocumentTemplateFilters,
  GeneratedDocumentFilters,
  MiFIDQuestionnaireResult,
  MiFIDAnswer,
} from '@/lib/documents/types'

// ============================================================================
// Query Keys
// ============================================================================

export const regulatoryDocumentsQueryKeys = {
  // Templates
  templates: ['regulatory-documents', 'templates'] as const,
  templateList: (filters?: DocumentTemplateFilters) => 
    ['regulatory-documents', 'templates', 'list', filters] as const,
  template: (id: string) => ['regulatory-documents', 'templates', id] as const,
  
  // Generated Documents
  generatedDocuments: ['regulatory-documents', 'generated'] as const,
  generatedDocumentList: (filters?: GeneratedDocumentFilters) => 
    ['regulatory-documents', 'generated', 'list', filters] as const,
  generatedDocument: (id: string) => ['regulatory-documents', 'generated', id] as const,
  
  // Client Documents
  clientDocuments: (clientId: string) => 
    ['regulatory-documents', 'client', clientId] as const,
  
  // MiFID
  mifidResult: (clientId: string) => ['regulatory-documents', 'mifid', clientId] as const,
}

// ============================================================================
// Types for API Requests
// ============================================================================

interface CreateTemplateRequest {
  documentType: RegulatoryDocumentType
  associationType?: AssociationType
  providerId?: string
  name: string
  version: string
  content: DocumentTemplateContent
  mandatorySections: string[]
  customizableSections: string[]
}

interface UpdateTemplateRequest {
  name?: string
  version?: string
  content?: DocumentTemplateContent
  mandatorySections?: string[]
  customizableSections?: string[]
  isActive?: boolean
}

interface GenerateDocumentRequest {
  clientId: string
  affaireId?: string
  operationId?: string
  templateId: string
  documentType: RegulatoryDocumentType
  format: DocumentFormat
  customData?: Record<string, unknown>
}

interface PreviewDocumentRequest {
  templateId: string
  clientId: string
  customData?: Record<string, unknown>
}

interface ExportDocumentRequest {
  documentId: string
  options: DocumentExportOptions
}

interface BatchExportRequest {
  documentIds: string[]
  options: DocumentExportOptions
}

interface SendForSignatureRequest {
  documentId: string
  signers: Array<{
    email: string
    name: string
    role: 'CLIENT' | 'ADVISOR' | 'WITNESS'
    order: number
  }>
}

interface SaveMiFIDAnswersRequest {
  clientId: string
  answers: MiFIDAnswer[]
}

// ============================================================================
// Templates Hooks
// ============================================================================

/**
 * Fetch list of regulatory document templates with filters
 */
export function useRegulatoryTemplates(
  filters?: DocumentTemplateFilters,
  options?: Omit<UseQueryOptions<{ data: DocumentTemplate[] }>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: regulatoryDocumentsQueryKeys.templateList(filters),
    queryFn: () => {
      const queryString = buildQueryString(filters || {})
      return api.get<{ data: DocumentTemplate[] }>(`/v1/documents/templates${queryString}`)
    },
    ...options,
  })
}

/**
 * Fetch a single regulatory document template by ID
 */
export function useRegulatoryTemplate(
  id: string,
  options?: Omit<UseQueryOptions<DocumentTemplate>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: regulatoryDocumentsQueryKeys.template(id),
    queryFn: () => api.get<DocumentTemplate>(`/v1/documents/templates/${id}`),
    enabled: !!id,
    ...options,
  })
}

/**
 * Create a regulatory document template
 */
export function useCreateRegulatoryTemplate(
  options?: UseMutationOptions<DocumentTemplate, Error, CreateTemplateRequest>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateTemplateRequest) =>
      api.post<DocumentTemplate>('/v1/documents/templates', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: regulatoryDocumentsQueryKeys.templates })
      toast({ title: 'Template créé', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

/**
 * Update a regulatory document template
 */
export function useUpdateRegulatoryTemplate(
  options?: UseMutationOptions<DocumentTemplate, Error, { id: string; data: UpdateTemplateRequest }>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTemplateRequest }) =>
      api.patch<DocumentTemplate>(`/v1/documents/templates/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: regulatoryDocumentsQueryKeys.template(id) })
      queryClient.invalidateQueries({ queryKey: regulatoryDocumentsQueryKeys.templates })
      toast({ title: 'Template mis à jour', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

/**
 * Delete a regulatory document template
 */
export function useDeleteRegulatoryTemplate(
  options?: UseMutationOptions<void, Error, string>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.delete(`/v1/documents/templates/${id}`).then(() => {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: regulatoryDocumentsQueryKeys.templates })
      toast({ title: 'Template supprimé', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

// ============================================================================
// Generated Documents Hooks
// ============================================================================

/**
 * Fetch list of generated regulatory documents with filters
 */
export function useGeneratedDocuments(
  filters?: GeneratedDocumentFilters,
  options?: Omit<UseQueryOptions<{ data: GeneratedDocument[] }>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: regulatoryDocumentsQueryKeys.generatedDocumentList(filters),
    queryFn: () => {
      const queryString = buildQueryString(filters || {})
      return api.get<{ data: GeneratedDocument[] }>(`/v1/documents/generated${queryString}`)
    },
    ...options,
  })
}

/**
 * Fetch a single generated document by ID
 */
export function useGeneratedDocument(
  id: string,
  options?: Omit<UseQueryOptions<GeneratedDocument>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: regulatoryDocumentsQueryKeys.generatedDocument(id),
    queryFn: () => api.get<GeneratedDocument>(`/v1/documents/generated/${id}`),
    enabled: !!id,
    ...options,
  })
}

/**
 * Fetch generated documents for a specific client
 */
export function useClientRegulatoryDocuments(
  clientId: string,
  options?: Omit<UseQueryOptions<{ data: GeneratedDocument[] }>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: regulatoryDocumentsQueryKeys.clientDocuments(clientId),
    queryFn: () => api.get<{ data: GeneratedDocument[] }>(`/v1/documents/generated?clientId=${clientId}`),
    enabled: !!clientId,
    ...options,
  })
}

/**
 * Fetch generated documents for a specific affaire
 */
export function useAffaireDocuments(
  affaireId: string,
  options?: Omit<UseQueryOptions<{ data: GeneratedDocument[] }>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: ['regulatory-documents', 'affaire', affaireId] as const,
    queryFn: () => api.get<{ data: GeneratedDocument[] }>(`/v1/documents/generated?affaireId=${affaireId}`),
    enabled: !!affaireId,
    ...options,
  })
}

/**
 * Fetch generated documents for a specific operation
 */
export function useOperationDocuments(
  operationId: string,
  options?: Omit<UseQueryOptions<{ data: GeneratedDocument[] }>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: ['regulatory-documents', 'operation', operationId] as const,
    queryFn: () => api.get<{ data: GeneratedDocument[] }>(`/v1/documents/generated?operationId=${operationId}`),
    enabled: !!operationId,
    ...options,
  })
}

/**
 * Generate a regulatory document
 */
export function useGenerateDocument(
  options?: UseMutationOptions<GeneratedDocument, Error, GenerateDocumentRequest>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: GenerateDocumentRequest) =>
      api.post<GeneratedDocument>('/v1/documents/generate', data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: regulatoryDocumentsQueryKeys.generatedDocuments })
      if (result.clientId) {
        queryClient.invalidateQueries({ 
          queryKey: regulatoryDocumentsQueryKeys.clientDocuments(result.clientId) 
        })
      }
      toast({ title: 'Document généré', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

/**
 * Preview a document before generation
 */
export function usePreviewDocument(
  options?: UseMutationOptions<{ previewUrl: string }, Error, PreviewDocumentRequest>
) {
  return useMutation({
    mutationFn: (data: PreviewDocumentRequest) =>
      api.post<{ previewUrl: string }>('/v1/documents/preview', data),
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

/**
 * Export a document to PDF or DOCX
 */
export function useExportDocument(
  options?: UseMutationOptions<DocumentExportResult, Error, ExportDocumentRequest>
) {
  return useMutation({
    mutationFn: (data: ExportDocumentRequest) =>
      api.post<DocumentExportResult>('/v1/documents/export', data),
    onSuccess: (result) => {
      if (result.success) {
        toast({ title: 'Document exporté', variant: 'success' })
      }
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

/**
 * Batch export multiple documents
 */
export function useBatchExportDocuments(
  options?: UseMutationOptions<{ results: DocumentExportResult[] }, Error, BatchExportRequest>
) {
  return useMutation({
    mutationFn: (data: BatchExportRequest) =>
      api.post<{ results: DocumentExportResult[] }>('/v1/documents/export/batch', data),
    onSuccess: (result) => {
      const successCount = result.results.filter(r => r.success).length
      toast({ 
        title: `${successCount}/${result.results.length} documents exportés`, 
        variant: 'success' 
      })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

/**
 * Send a document for electronic signature
 */
export function useSendForSignature(
  options?: UseMutationOptions<GeneratedDocument, Error, SendForSignatureRequest>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: SendForSignatureRequest) =>
      api.post<GeneratedDocument>(`/v1/documents/generated/${data.documentId}/sign`, data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ 
        queryKey: regulatoryDocumentsQueryKeys.generatedDocument(result.id) 
      })
      queryClient.invalidateQueries({ queryKey: regulatoryDocumentsQueryKeys.generatedDocuments })
      toast({ title: 'Document envoyé pour signature', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

/**
 * Delete a generated document
 */
export function useDeleteGeneratedDocument(
  options?: UseMutationOptions<void, Error, string>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.delete(`/v1/documents/generated/${id}`).then(() => {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: regulatoryDocumentsQueryKeys.generatedDocuments })
      toast({ title: 'Document supprimé', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

// ============================================================================
// MiFID Questionnaire Hooks
// ============================================================================

/**
 * Fetch MiFID questionnaire result for a client
 */
export function useMiFIDResult(
  clientId: string,
  options?: Omit<UseQueryOptions<MiFIDQuestionnaireResult | null>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: regulatoryDocumentsQueryKeys.mifidResult(clientId),
    queryFn: () => api.get<MiFIDQuestionnaireResult | null>(`/v1/documents/mifid/${clientId}`),
    enabled: !!clientId,
    ...options,
  })
}

/**
 * Save MiFID questionnaire answers and calculate profile
 */
export function useSaveMiFIDAnswers(
  options?: UseMutationOptions<MiFIDQuestionnaireResult, Error, SaveMiFIDAnswersRequest>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: SaveMiFIDAnswersRequest) =>
      api.post<MiFIDQuestionnaireResult>('/v1/documents/mifid', data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ 
        queryKey: regulatoryDocumentsQueryKeys.mifidResult(result.clientId) 
      })
      toast({ title: 'Questionnaire MiFID enregistré', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

// ============================================================================
// Document Requirements Hook
// ============================================================================

interface DocumentRequirementsResponse {
  required: Array<{
    documentType: RegulatoryDocumentType
    status: 'GENERATED' | 'PENDING' | 'MISSING' | 'EXPIRED'
    isBlocking: boolean
    generatedAt: Date | null
    signedAt: Date | null
    documentId: string | null
  }>
  missingBlockingCount: number
  missingNonBlockingCount: number
}

/**
 * Fetch document requirements for an operation
 */
export function useDocumentRequirements(
  params: { operationType: string; clientId: string; affaireId?: string; operationId?: string },
  options?: Omit<UseQueryOptions<DocumentRequirementsResponse>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: ['regulatory-documents', 'requirements', params] as const,
    queryFn: () => {
      const queryString = buildQueryString(params)
      return api.get<DocumentRequirementsResponse>(`/v1/documents/requirements${queryString}`)
    },
    enabled: !!params.operationType && !!params.clientId,
    ...options,
  })
}
