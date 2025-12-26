import { useQuery, useMutation, useQueryClient, type UseQueryOptions, type UseMutationOptions } from '@tanstack/react-query'
import { api, buildQueryString, type PaginatedResponse } from '@/app/_common/lib/api-client'
import type {
  EmailTemplateListItem,
  EmailTemplateDetail,
  CreateEmailTemplateRequest,
  UpdateEmailTemplateRequest,
  EmailTemplateFilters,
  EmailTemplateStats,
  DuplicateTemplateRequest,
  PreviewTemplateRequest,
  PreviewTemplateResponse,
} from '@/app/_common/lib/api-types'
import { toast } from '@/app/_common/hooks/use-toast'
import { queryKeys } from './query-keys'

// ============================================================================
// Email Template Hooks
// ============================================================================

/**
 * Fetch paginated list of email templates
 */
export function useEmailTemplates(
  filters?: EmailTemplateFilters,
  options?: Omit<UseQueryOptions<PaginatedResponse<EmailTemplateListItem>>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.emailTemplateList(filters),
    queryFn: () => api.get<PaginatedResponse<EmailTemplateListItem>>(`/advisor/email-templates${buildQueryString(filters || {})}`),
    staleTime: 30 * 1000,
    ...options,
  })
}

/**
 * Fetch single email template with full details
 */
export function useEmailTemplate(
  id: string,
  options?: Omit<UseQueryOptions<EmailTemplateDetail>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.emailTemplate(id),
    queryFn: () => api.get<EmailTemplateDetail>(`/advisor/email-templates/${id}`),
    enabled: !!id,
    ...options,
  })
}

/**
 * Fetch email template categories
 */
export function useEmailTemplateCategories(
  options?: Omit<UseQueryOptions<{ categories: string[] }>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.emailTemplateCategories,
    queryFn: () => api.get<{ categories: string[] }>('/advisor/email-templates/categories'),
    staleTime: 5 * 60 * 1000,
    ...options,
  })
}

/**
 * Fetch email template variables
 */
export function useEmailTemplateVariables(
  options?: Omit<UseQueryOptions<{ variables: string[] }>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.emailTemplateVariables,
    queryFn: () => api.get<{ variables: string[] }>('/advisor/email-templates/variables'),
    staleTime: 5 * 60 * 1000,
    ...options,
  })
}

/**
 * Fetch email template statistics
 */
export function useEmailTemplateStats(
  filters?: Record<string, unknown>,
  options?: Omit<UseQueryOptions<EmailTemplateStats>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.emailTemplateStats(filters),
    queryFn: () => api.get<EmailTemplateStats>(`/advisor/email-templates/stats${buildQueryString(filters || {})}`),
    staleTime: 1 * 60 * 1000,
    ...options,
  })
}

/**
 * Create new email template
 */
export function useCreateEmailTemplate(
  options?: UseMutationOptions<EmailTemplateDetail, Error, CreateEmailTemplateRequest>
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateEmailTemplateRequest) => api.post<EmailTemplateDetail>('/advisor/email-templates', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.emailTemplates })
      queryClient.invalidateQueries({ queryKey: queryKeys.emailTemplateCategories })
      queryClient.invalidateQueries({ queryKey: queryKeys.emailTemplateStats() })
      toast({ title: 'Template créé', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

/**
 * Update email template
 */
export function useUpdateEmailTemplate(options?: UseMutationOptions<EmailTemplateDetail, Error, { id: string; data: UpdateEmailTemplateRequest }>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => api.patch<EmailTemplateDetail>(`/advisor/email-templates/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.emailTemplates })
      queryClient.invalidateQueries({ queryKey: queryKeys.emailTemplate(id) })
      toast({ title: 'Template mis à jour', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

/**
 * Delete email template
 */
export function useDeleteEmailTemplate(options?: UseMutationOptions<void, Error, string>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/advisor/email-templates/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.emailTemplates })
      queryClient.invalidateQueries({ queryKey: queryKeys.emailTemplateStats() })
      toast({ title: 'Template supprimé', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

/**
 * Duplicate email template
 */
export function useDuplicateEmailTemplate(options?: UseMutationOptions<EmailTemplateDetail, Error, { id: string; data?: DuplicateTemplateRequest }>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => api.post<EmailTemplateDetail>(`/advisor/email-templates/${id}/duplicate`, data || {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.emailTemplates })
      queryClient.invalidateQueries({ queryKey: queryKeys.emailTemplateStats() })
      toast({ title: 'Template dupliqué', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

/**
 * Archive email template
 */
export function useArchiveEmailTemplate(options?: UseMutationOptions<EmailTemplateDetail, Error, string>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post<EmailTemplateDetail>(`/advisor/email-templates/${id}/archive`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.emailTemplates })
      queryClient.invalidateQueries({ queryKey: queryKeys.emailTemplate(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.emailTemplateStats() })
      toast({ title: 'Template archivé', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

/**
 * Unarchive email template
 */
export function useUnarchiveEmailTemplate(options?: UseMutationOptions<EmailTemplateDetail, Error, string>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post<EmailTemplateDetail>(`/advisor/email-templates/${id}/unarchive`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.emailTemplates })
      queryClient.invalidateQueries({ queryKey: queryKeys.emailTemplate(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.emailTemplateStats() })
      toast({ title: 'Template restauré', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

/**
 * Preview email template with test data
 */
export function usePreviewEmailTemplate(options?: UseMutationOptions<PreviewTemplateResponse, Error, { id: string; data?: PreviewTemplateRequest }>) {
  return useMutation({
    mutationFn: ({ id, data }) => api.post<PreviewTemplateResponse>(`/advisor/email-templates/${id}/preview`, data || {}),
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}
