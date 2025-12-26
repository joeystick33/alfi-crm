/**
 * React Query hooks for Compliance API
 * 
 * Provides hooks for managing KYC documents, alerts, controls, reclamations,
 * and compliance timeline.
 * 
 * @module app/_common/hooks/api/use-compliance-api
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
  KYCDocument,
  KYCDocumentType,
  KYCDocumentStatus,
  ComplianceAlert,
  AlertSeverity,
  AlertType,
  ComplianceControl,
  ControlType,
  ControlStatus,
  ControlPriority,
  RiskLevel,
  Reclamation,
  ReclamationType,
  ReclamationStatus,
  SLASeverity,
  TimelineEvent,
  TimelineEventType,
  ComplianceKPIs,
  DocumentFilters,
  ControlFilters,
  ReclamationFilters as ComplianceReclamationFilters,
  AlertFilters,
} from '@/lib/compliance/types'

// ============================================================================
// Query Keys
// ============================================================================

export const complianceQueryKeys = {
  // KYC Documents
  documents: ['compliance', 'documents'] as const,
  documentList: (filters?: DocumentFilters) => ['compliance', 'documents', 'list', filters] as const,
  document: (id: string) => ['compliance', 'documents', id] as const,
  
  // Alerts
  alerts: ['compliance', 'alerts'] as const,
  alertList: (filters?: AlertFilters) => ['compliance', 'alerts', 'list', filters] as const,
  alert: (id: string) => ['compliance', 'alerts', id] as const,
  
  // Controls
  controls: ['compliance', 'controls'] as const,
  controlList: (filters?: ControlFilters) => ['compliance', 'controls', 'list', filters] as const,
  control: (id: string) => ['compliance', 'controls', id] as const,
  
  // Reclamations
  reclamations: ['compliance', 'reclamations'] as const,
  reclamationList: (filters?: ComplianceReclamationFilters) => ['compliance', 'reclamations', 'list', filters] as const,
  reclamation: (id: string) => ['compliance', 'reclamations', id] as const,
  
  // Timeline
  timeline: ['compliance', 'timeline'] as const,
  timelineByClient: (clientId: string, filters?: TimelineFilters) => 
    ['compliance', 'timeline', clientId, filters] as const,
  
  // KPIs
  kpis: ['compliance', 'kpis'] as const,
}

// ============================================================================
// Types for API Responses
// ============================================================================

interface TimelineFilters {
  type?: TimelineEventType[]
  dateFrom?: Date
  dateTo?: Date
}

interface CreateDocumentRequest {
  clientId: string
  type: KYCDocumentType
  fileName?: string
  fileUrl?: string
  notes?: string
}

interface ValidateDocumentRequest {
  notes?: string
}

interface RejectDocumentRequest {
  rejectionReason: string
}

interface CreateAlertRequest {
  clientId?: string
  operationId?: string
  type: AlertType
  severity: AlertSeverity
  title: string
  description: string
  actionRequired: string
  actionUrl?: string
}

interface CreateControlRequest {
  clientId: string
  type: ControlType
  priority: ControlPriority
  description?: string
  dueDate: string
  isACPRMandatory?: boolean
}

interface UpdateControlRequest {
  status?: ControlStatus
  priority?: ControlPriority
  description?: string
  dueDate?: string
}

interface CompleteControlRequest {
  findings: string
  recommendations?: string
  score: number
}

interface CreateReclamationRequest {
  clientId: string
  subject: string
  description: string
  type: ReclamationType
  severity: SLASeverity
  assignedToId?: string
  internalNotes?: string
}

interface UpdateReclamationRequest {
  status?: ReclamationStatus
  assignedToId?: string
  internalNotes?: string
}

interface ResolveReclamationRequest {
  responseText: string
  internalNotes?: string
}

// ============================================================================
// KYC Documents Hooks
// ============================================================================

/**
 * Fetch list of compliance KYC documents with filters
 */
export function useComplianceDocuments(
  filters?: DocumentFilters,
  options?: Omit<UseQueryOptions<{ data: KYCDocument[] }>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: complianceQueryKeys.documentList(filters),
    queryFn: () => {
      const queryString = buildQueryString(filters || {})
      return api.get<{ data: KYCDocument[] }>(`/v1/compliance/documents${queryString}`)
    },
    ...options,
  })
}

/**
 * Fetch a single compliance document by ID
 */
export function useComplianceDocument(
  id: string,
  options?: Omit<UseQueryOptions<KYCDocument>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: complianceQueryKeys.document(id),
    queryFn: () => api.get<KYCDocument>(`/v1/compliance/documents/${id}`),
    enabled: !!id,
    ...options,
  })
}

/**
 * Create a compliance document
 */
export function useCreateComplianceDocument(
  options?: UseMutationOptions<KYCDocument, Error, CreateDocumentRequest>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateDocumentRequest) =>
      api.post<KYCDocument>('/v1/compliance/documents', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: complianceQueryKeys.documents })
      queryClient.invalidateQueries({ queryKey: complianceQueryKeys.kpis })
      queryClient.invalidateQueries({ queryKey: complianceQueryKeys.alerts })
      toast({ title: 'Document créé', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

/**
 * Validate a compliance document
 */
export function useValidateComplianceDocument(
  options?: UseMutationOptions<KYCDocument, Error, { id: string; data: ValidateDocumentRequest }>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ValidateDocumentRequest }) =>
      api.post<KYCDocument>(`/v1/compliance/documents/${id}/validate`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: complianceQueryKeys.document(id) })
      queryClient.invalidateQueries({ queryKey: complianceQueryKeys.documents })
      queryClient.invalidateQueries({ queryKey: complianceQueryKeys.kpis })
      queryClient.invalidateQueries({ queryKey: complianceQueryKeys.alerts })
      queryClient.invalidateQueries({ queryKey: complianceQueryKeys.timeline })
      toast({ title: 'Document validé', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

/**
 * Reject a compliance document
 */
export function useRejectComplianceDocument(
  options?: UseMutationOptions<KYCDocument, Error, { id: string; data: RejectDocumentRequest }>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RejectDocumentRequest }) =>
      api.post<KYCDocument>(`/v1/compliance/documents/${id}/reject`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: complianceQueryKeys.document(id) })
      queryClient.invalidateQueries({ queryKey: complianceQueryKeys.documents })
      queryClient.invalidateQueries({ queryKey: complianceQueryKeys.kpis })
      queryClient.invalidateQueries({ queryKey: complianceQueryKeys.alerts })
      queryClient.invalidateQueries({ queryKey: complianceQueryKeys.timeline })
      toast({ title: 'Document rejeté', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

/**
 * Delete a compliance document
 */
export function useDeleteComplianceDocument(
  options?: UseMutationOptions<void, Error, string>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.delete(`/v1/compliance/documents/${id}`).then(() => {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: complianceQueryKeys.documents })
      queryClient.invalidateQueries({ queryKey: complianceQueryKeys.kpis })
      queryClient.invalidateQueries({ queryKey: complianceQueryKeys.alerts })
      toast({ title: 'Document supprimé', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

// ============================================================================
// Alerts Hooks
// ============================================================================

/**
 * Fetch list of compliance alerts with filters
 */
export function useComplianceAlerts(
  filters?: AlertFilters,
  options?: Omit<UseQueryOptions<{ data: ComplianceAlert[] }>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: complianceQueryKeys.alertList(filters),
    queryFn: () => {
      const queryString = buildQueryString(filters || {})
      return api.get<{ data: ComplianceAlert[] }>(`/v1/compliance/alerts${queryString}`)
    },
    ...options,
  })
}

/**
 * Create a compliance alert
 */
export function useCreateComplianceAlert(
  options?: UseMutationOptions<ComplianceAlert, Error, CreateAlertRequest>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateAlertRequest) =>
      api.post<ComplianceAlert>('/v1/compliance/alerts', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: complianceQueryKeys.alerts })
      queryClient.invalidateQueries({ queryKey: complianceQueryKeys.kpis })
      toast({ title: 'Alerte créée', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

/**
 * Acknowledge a compliance alert
 */
export function useAcknowledgeComplianceAlert(
  options?: UseMutationOptions<ComplianceAlert, Error, string>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      api.post<ComplianceAlert>(`/v1/compliance/alerts/${id}/acknowledge`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: complianceQueryKeys.alerts })
      queryClient.invalidateQueries({ queryKey: complianceQueryKeys.kpis })
      toast({ title: 'Alerte acquittée', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

/**
 * Resolve a compliance alert
 */
export function useResolveComplianceAlert(
  options?: UseMutationOptions<ComplianceAlert, Error, string>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      api.post<ComplianceAlert>(`/v1/compliance/alerts/${id}/resolve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: complianceQueryKeys.alerts })
      queryClient.invalidateQueries({ queryKey: complianceQueryKeys.kpis })
      toast({ title: 'Alerte résolue', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

// ============================================================================
// Controls Hooks
// ============================================================================

/**
 * Fetch list of compliance controls with filters
 */
export function useComplianceControls(
  filters?: ControlFilters,
  options?: Omit<UseQueryOptions<{ data: ComplianceControl[] }>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: complianceQueryKeys.controlList(filters),
    queryFn: () => {
      const queryString = buildQueryString(filters || {})
      return api.get<{ data: ComplianceControl[] }>(`/v1/compliance/controls${queryString}`)
    },
    ...options,
  })
}

/**
 * Fetch a single compliance control by ID
 */
export function useComplianceControl(
  id: string,
  options?: Omit<UseQueryOptions<ComplianceControl>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: complianceQueryKeys.control(id),
    queryFn: () => api.get<ComplianceControl>(`/v1/compliance/controls/${id}`),
    enabled: !!id,
    ...options,
  })
}

/**
 * Create a compliance control
 */
export function useCreateComplianceControl(
  options?: UseMutationOptions<ComplianceControl, Error, CreateControlRequest>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateControlRequest) =>
      api.post<ComplianceControl>('/v1/compliance/controls', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: complianceQueryKeys.controls })
      queryClient.invalidateQueries({ queryKey: complianceQueryKeys.kpis })
      queryClient.invalidateQueries({ queryKey: complianceQueryKeys.timeline })
      toast({ title: 'Contrôle créé', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

/**
 * Update a compliance control
 */
export function useUpdateComplianceControl(
  options?: UseMutationOptions<ComplianceControl, Error, { id: string; data: UpdateControlRequest }>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateControlRequest }) =>
      api.patch<ComplianceControl>(`/v1/compliance/controls/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: complianceQueryKeys.control(id) })
      queryClient.invalidateQueries({ queryKey: complianceQueryKeys.controls })
      queryClient.invalidateQueries({ queryKey: complianceQueryKeys.kpis })
      toast({ title: 'Contrôle mis à jour', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

/**
 * Complete a compliance control
 */
export function useCompleteComplianceControl(
  options?: UseMutationOptions<ComplianceControl, Error, { id: string; data: CompleteControlRequest }>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CompleteControlRequest }) =>
      api.post<ComplianceControl>(`/v1/compliance/controls/${id}/complete`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: complianceQueryKeys.control(id) })
      queryClient.invalidateQueries({ queryKey: complianceQueryKeys.controls })
      queryClient.invalidateQueries({ queryKey: complianceQueryKeys.kpis })
      queryClient.invalidateQueries({ queryKey: complianceQueryKeys.alerts })
      queryClient.invalidateQueries({ queryKey: complianceQueryKeys.timeline })
      toast({ title: 'Contrôle complété', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

/**
 * Delete a compliance control
 */
export function useDeleteComplianceControl(
  options?: UseMutationOptions<void, Error, string>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.delete(`/v1/compliance/controls/${id}`).then(() => {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: complianceQueryKeys.controls })
      queryClient.invalidateQueries({ queryKey: complianceQueryKeys.kpis })
      toast({ title: 'Contrôle supprimé', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

// ============================================================================
// Reclamations Hooks
// ============================================================================

/**
 * Fetch list of compliance reclamations with filters
 */
export function useComplianceReclamations(
  filters?: ComplianceReclamationFilters,
  options?: Omit<UseQueryOptions<{ data: Reclamation[] }>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: complianceQueryKeys.reclamationList(filters),
    queryFn: () => {
      const queryString = buildQueryString(filters || {})
      return api.get<{ data: Reclamation[] }>(`/v1/compliance/reclamations${queryString}`)
    },
    ...options,
  })
}

/**
 * Fetch a single compliance reclamation by ID
 */
export function useComplianceReclamation(
  id: string,
  options?: Omit<UseQueryOptions<Reclamation>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: complianceQueryKeys.reclamation(id),
    queryFn: () => api.get<Reclamation>(`/v1/compliance/reclamations/${id}`),
    enabled: !!id,
    ...options,
  })
}

/**
 * Create a compliance reclamation
 */
export function useCreateComplianceReclamation(
  options?: UseMutationOptions<Reclamation, Error, CreateReclamationRequest>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateReclamationRequest) =>
      api.post<Reclamation>('/v1/compliance/reclamations', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: complianceQueryKeys.reclamations })
      queryClient.invalidateQueries({ queryKey: complianceQueryKeys.kpis })
      queryClient.invalidateQueries({ queryKey: complianceQueryKeys.timeline })
      toast({ title: 'Réclamation créée', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

/**
 * Update a compliance reclamation
 */
export function useUpdateComplianceReclamation(
  options?: UseMutationOptions<Reclamation, Error, { id: string; data: UpdateReclamationRequest }>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateReclamationRequest }) =>
      api.patch<Reclamation>(`/v1/compliance/reclamations/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: complianceQueryKeys.reclamation(id) })
      queryClient.invalidateQueries({ queryKey: complianceQueryKeys.reclamations })
      queryClient.invalidateQueries({ queryKey: complianceQueryKeys.kpis })
      toast({ title: 'Réclamation mise à jour', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

/**
 * Resolve a compliance reclamation
 */
export function useResolveComplianceReclamation(
  options?: UseMutationOptions<Reclamation, Error, { id: string; data: ResolveReclamationRequest }>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ResolveReclamationRequest }) =>
      api.post<Reclamation>(`/v1/compliance/reclamations/${id}/resolve`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: complianceQueryKeys.reclamation(id) })
      queryClient.invalidateQueries({ queryKey: complianceQueryKeys.reclamations })
      queryClient.invalidateQueries({ queryKey: complianceQueryKeys.kpis })
      queryClient.invalidateQueries({ queryKey: complianceQueryKeys.alerts })
      queryClient.invalidateQueries({ queryKey: complianceQueryKeys.timeline })
      toast({ title: 'Réclamation résolue', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

/**
 * Delete a compliance reclamation
 */
export function useDeleteComplianceReclamation(
  options?: UseMutationOptions<void, Error, string>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.delete(`/v1/compliance/reclamations/${id}`).then(() => {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: complianceQueryKeys.reclamations })
      queryClient.invalidateQueries({ queryKey: complianceQueryKeys.kpis })
      toast({ title: 'Réclamation supprimée', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

// ============================================================================
// Timeline Hooks
// ============================================================================

/**
 * Fetch compliance timeline for a client
 */
export function useComplianceTimeline(
  clientId: string,
  filters?: TimelineFilters,
  options?: Omit<UseQueryOptions<{ data: TimelineEvent[] }>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: complianceQueryKeys.timelineByClient(clientId, filters),
    queryFn: () => {
      const queryString = buildQueryString({ clientId, ...filters })
      return api.get<{ data: TimelineEvent[] }>(`/v1/compliance/timeline${queryString}`)
    },
    enabled: !!clientId,
    ...options,
  })
}

/**
 * Export compliance timeline as PDF
 */
export function useExportComplianceTimeline(
  options?: UseMutationOptions<Blob, Error, { clientId: string; filters?: TimelineFilters }>
) {
  return useMutation({
    mutationFn: async ({ clientId, filters }) => {
      const queryString = buildQueryString({ clientId, ...filters })
      const response = await fetch(`/api/v1/compliance/timeline/export${queryString}`, {
        method: 'GET',
        credentials: 'include',
      })
      if (!response.ok) {
        throw new Error('Erreur lors de l\'export')
      }
      return response.blob()
    },
    onSuccess: () => {
      toast({ title: 'Export généré', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

// ============================================================================
// KPIs Hook
// ============================================================================

/**
 * Fetch compliance KPIs
 */
export function useComplianceKPIs(
  options?: Omit<UseQueryOptions<ComplianceKPIs>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: complianceQueryKeys.kpis,
    queryFn: () => api.get<ComplianceKPIs>('/v1/compliance/kpis'),
    staleTime: 1000 * 60 * 2, // 2 minutes
    ...options,
  })
}

// ============================================================================
// Send Reminder Hook
// ============================================================================

/**
 * Send a reminder for a client's KYC documents
 */
export function useSendComplianceReminder(
  options?: UseMutationOptions<void, Error, string>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (clientId: string) =>
      api.post('/v1/compliance/documents/remind', { clientId }).then(() => {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: complianceQueryKeys.documents })
      queryClient.invalidateQueries({ queryKey: complianceQueryKeys.timeline })
      toast({ title: 'Relance envoyée', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}
