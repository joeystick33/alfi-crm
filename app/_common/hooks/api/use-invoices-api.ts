import { useQuery, useMutation, useQueryClient, type UseQueryOptions, type UseMutationOptions } from '@tanstack/react-query'
import { api, buildQueryString } from '@/app/_common/lib/api-client'
import type { MaFactureItem, ManagementStatsFilters } from '@/app/_common/lib/api-types'
import { toast } from '@/app/_common/hooks/use-toast'

// ============================================================================
// Invoices Hooks
// ============================================================================

export function useInvoices(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['invoices', filters],
    queryFn: () => api.get<{ data: Record<string, unknown>[]; total: number; limit: number; offset: number }>(`/advisor/invoices${buildQueryString(filters || {})}`),
    staleTime: 2 * 60 * 1000,
  })
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: ['invoices', id],
    queryFn: () => api.get<Record<string, unknown>>(`/advisor/invoices/${id}`),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  })
}

export function useCreateInvoice(options?: UseMutationOptions<Record<string, unknown>, Error, Record<string, unknown>>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post<Record<string, unknown>>('/advisor/invoices', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['invoice-stats'] })
      toast({ title: 'Facture créée', description: 'La facture a été créée avec succès.', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message || 'Impossible de créer la facture.', variant: 'destructive' })
    },
    ...options,
  })
}

export function useUpdateInvoice(options?: UseMutationOptions<Record<string, unknown>, Error, { id: string; data: Record<string, unknown> }>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => api.patch<Record<string, unknown>>(`/advisor/invoices/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['invoices', id] })
      queryClient.invalidateQueries({ queryKey: ['invoice-stats'] })
      toast({ title: 'Facture mise à jour', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

export function useDeleteInvoice(options?: UseMutationOptions<Record<string, unknown>, Error, string>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete<Record<string, unknown>>(`/advisor/invoices/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['invoice-stats'] })
      toast({ title: 'Facture supprimée', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

export function useAddInvoiceItem(options?: UseMutationOptions<Record<string, unknown>, Error, { invoiceId: string; data: Record<string, unknown> }>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ invoiceId, data }) => api.post<Record<string, unknown>>(`/advisor/invoices/${invoiceId}/items`, data),
    onSuccess: (_, { invoiceId }) => {
      queryClient.invalidateQueries({ queryKey: ['invoices', invoiceId] })
      toast({ title: 'Ligne ajoutée', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

export function useRemoveInvoiceItem(options?: UseMutationOptions<Record<string, unknown>, Error, { invoiceId: string; itemId: string }>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ invoiceId, itemId }) => api.delete<Record<string, unknown>>(`/advisor/invoices/${invoiceId}/items?itemId=${itemId}`),
    onSuccess: (_, { invoiceId }) => {
      queryClient.invalidateQueries({ queryKey: ['invoices', invoiceId] })
      toast({ title: 'Ligne supprimée', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

export function useAddPayment(options?: UseMutationOptions<Record<string, unknown>, Error, { invoiceId: string; data: Record<string, unknown> }>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ invoiceId, data }) => api.post<Record<string, unknown>>(`/advisor/invoices/${invoiceId}/payments`, data),
    onSuccess: (_, { invoiceId }) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['invoices', invoiceId] })
      queryClient.invalidateQueries({ queryKey: ['invoice-stats'] })
      toast({ title: 'Paiement enregistré', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

export function useSendInvoice(options?: UseMutationOptions<Record<string, unknown>, Error, string>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post<Record<string, unknown>>(`/advisor/invoices/${id}/send`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['invoices', id] })
      queryClient.invalidateQueries({ queryKey: ['invoice-stats'] })
      toast({ title: 'Facture envoyée', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

export function useMarkInvoiceAsPaid(options?: UseMutationOptions<Record<string, unknown>, Error, { id: string; paidDate?: string }>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, paidDate }) => api.post<Record<string, unknown>>(`/advisor/invoices/${id}/mark-paid`, paidDate ? { paidDate } : {}),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['invoices', id] })
      queryClient.invalidateQueries({ queryKey: ['invoice-stats'] })
      toast({ title: 'Facture marquée payée', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

export function useCancelInvoice(options?: UseMutationOptions<Record<string, unknown>, Error, string>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post<Record<string, unknown>>(`/advisor/invoices/${id}/cancel`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['invoices', id] })
      queryClient.invalidateQueries({ queryKey: ['invoice-stats'] })
      toast({ title: 'Facture annulée', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

export function useInvoiceStats(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['invoice-stats', filters],
    queryFn: () => api.get<Record<string, unknown>>(`/advisor/invoices/stats${buildQueryString(filters || {})}`),
    staleTime: 1 * 60 * 1000,
  })
}

// ============================================================================
// Ma Facturation (Conseiller)
// ============================================================================

/**
 * Fetch personal invoices
 */
export function useMaFacturation(
  filters?: ManagementStatsFilters & { status?: string },
  options?: Omit<UseQueryOptions<{ period: string; stats: Record<string, unknown>; factures: MaFactureItem[] }>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: ['ma-facturation', filters] as const,
    queryFn: () => api.get<{ period: string; stats: Record<string, unknown>; factures: MaFactureItem[] }>(`/advisor/ma-facturation${buildQueryString(filters || {})}`),
    staleTime: 1000 * 60 * 2,
    ...options,
  })
}

/**
 * Create personal invoice
 */
export function useCreateMaFacture(options?: UseMutationOptions<MaFactureItem, Error, { type: string; clientId?: string; montant: number; description?: string }>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { type: string; clientId?: string; montant: number; description?: string }) => 
      api.post<MaFactureItem>('/advisor/ma-facturation', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ma-facturation'] })
      toast({ title: 'Succès', description: 'Facture créée avec succès' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}
