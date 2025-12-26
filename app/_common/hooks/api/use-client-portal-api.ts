import { useQuery, useMutation, useQueryClient, type UseQueryOptions, type UseMutationOptions } from '@tanstack/react-query'
import { api, buildQueryString } from '@/app/_common/lib/api-client'
import { toast } from '@/app/_common/hooks/use-toast'
import type { WealthSummary, Objectif, Projet } from '@/app/_common/lib/api-types'

// ============================================
// CLIENT PORTAL HOOKS
// ============================================

/**
 * Types for Client Portal
 */
export interface ClientPortalDashboard {
  client: { firstName: string; lastName: string }
  wealth: {
    total: number
    actifs: number
    passifs: number
    evolution: Record<string, number>
    byCategory: Array<{ category: string; total: number; percentage: number }>
  }
  stats: {
    documents: { total: number; recent: number }
    nextAppointment: ClientAppointment | null
    objectifs: { total: number; achieved: number; inProgress: number }
  }
  objectifs: Objectif[]
  recentActivity: Array<{
    id: string
    type: string
    date: string
    description: string
    entityType?: string
    entityId?: string
  }>
}

export interface ClientDocument {
  id: string
  name: string
  description?: string
  type: string
  category: string
  mimeType: string
  size: number
  createdAt: string
  sharedAt: string
}

export interface ClientMessage {
  id: string
  subject: string
  content: string
  isFromClient: boolean
  isRead: boolean
  createdAt: string
  readAt?: string
}

export interface ClientAppointment {
  id: string
  title: string
  description?: string
  type: string
  status: string
  startDate: string
  endDate: string
  location?: string
  isVirtual: boolean
  meetingUrl?: string
  advisorName?: string
}

export interface ClientContrat {
  id: string
  reference: string
  type: string
  status: string
  compagnie: string
  produit: string
  montant: number | null
  currentValue: number | null
  dateSignature?: string
  dateEcheance?: string
}

export interface ClientNotification {
  id: string
  type: string
  title: string
  message: string
  priority: string
  link?: string
  isRead: boolean
  createdAt: string
}

export interface PortalPagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface AdvisorSummary {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
}

/**
 * Fetch client dashboard data
 */
export function useClientDashboard(
  clientId: string,
  options?: Omit<UseQueryOptions<ClientPortalDashboard>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: ['client-portal', 'dashboard', clientId] as const,
    queryFn: () => api.get<ClientPortalDashboard>(`/client/dashboard?clientId=${clientId}`),
    enabled: !!clientId,
    staleTime: 1000 * 60 * 2,
    ...options,
  })
}

/**
 * Fetch client patrimoine details
 */
export function useClientPatrimoine(
  clientId: string,
  options?: Omit<UseQueryOptions<WealthSummary>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: ['client-portal', 'patrimoine', clientId] as const,
    queryFn: () => api.get<WealthSummary>(`/client/patrimoine?clientId=${clientId}`),
    enabled: !!clientId,
    staleTime: 1000 * 60 * 2,
    ...options,
  })
}

/**
 * Fetch client objectives
 */
export function useClientObjectifs(
  clientId: string,
  status?: string,
  options?: Omit<UseQueryOptions<{ objectifs: Objectif[]; projets: Projet[]; stats: { total: number; achieved: number; inProgress: number } }>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: ['client-portal', 'objectives', clientId, status] as const,
    queryFn: () => api.get<{ objectifs: Objectif[]; projets: Projet[]; stats: { total: number; achieved: number; inProgress: number } }>(`/client/objectives?clientId=${clientId}${status ? `&status=${status}` : ''}`),
    enabled: !!clientId,
    staleTime: 1000 * 60 * 2,
    ...options,
  })
}

/**
 * Fetch client documents
 */
export function useClientDocuments(
  clientId: string,
  filters?: { category?: string; type?: string; search?: string; page?: number; limit?: number },
  options?: Omit<UseQueryOptions<{ documents: ClientDocument[]; pagination: PortalPagination; filters: Record<string, unknown> }>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: ['client-portal', 'documents', clientId, filters] as const,
    queryFn: () => api.get<{ documents: ClientDocument[]; pagination: PortalPagination; filters: Record<string, unknown> }>(`/client/documents?clientId=${clientId}${buildQueryString(filters || {})}`),
    enabled: !!clientId,
    staleTime: 1000 * 60 * 2,
    ...options,
  })
}

/**
 * Fetch single document details
 */
export function useClientDocument(
  clientId: string,
  documentId: string,
  options?: Omit<UseQueryOptions<ClientDocument>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: ['client-portal', 'document', clientId, documentId] as const,
    queryFn: () => api.get<ClientDocument>(`/client/documents/${documentId}?clientId=${clientId}`),
    enabled: !!clientId && !!documentId,
    staleTime: 1000 * 60 * 5,
    ...options,
  })
}

/**
 * Fetch client messages
 */
export function useClientMessages(
  clientId: string,
  filters?: { page?: number; limit?: number },
  options?: Omit<UseQueryOptions<{ messages: ClientMessage[]; advisor: AdvisorSummary; unreadCount: number; pagination: PortalPagination }>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: ['client-portal', 'messages', clientId, filters] as const,
    queryFn: () => api.get<{ messages: ClientMessage[]; advisor: AdvisorSummary; unreadCount: number; pagination: PortalPagination }>(`/client/messages?clientId=${clientId}${buildQueryString(filters || {})}`),
    enabled: !!clientId,
    staleTime: 1000 * 60 * 1, // 1 minute
    ...options,
  })
}

/**
 * Send message to advisor
 */
export function useSendClientMessage(options?: UseMutationOptions<{ message: ClientMessage; success: boolean }, Error, { clientId: string; subject: string; content: string; priority?: string }>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { clientId: string; subject: string; content: string; priority?: string }) => 
      api.post<{ message: ClientMessage; success: boolean }>('/client/messages', data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client-portal', 'messages', variables.clientId] })
      toast({ title: 'Message envoyé', description: 'Votre message a été envoyé à votre conseiller' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

/**
 * Fetch client profile
 */
export function useClientProfile(
  clientId: string,
  options?: Omit<UseQueryOptions<{ profile: Record<string, unknown>; advisor: AdvisorSummary; cabinet: Record<string, unknown>; familyMembers: Array<Record<string, unknown>>; preferences: Record<string, unknown> }>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: ['client-portal', 'profile', clientId] as const,
    queryFn: () => api.get<{ profile: Record<string, unknown>; advisor: AdvisorSummary; cabinet: Record<string, unknown>; familyMembers: Array<Record<string, unknown>>; preferences: Record<string, unknown> }>(`/client/profile?clientId=${clientId}`),
    enabled: !!clientId,
    staleTime: 1000 * 60 * 5,
    ...options,
  })
}

/**
 * Update client profile
 */
export function useUpdateClientProfile(options?: UseMutationOptions<{ profile: Record<string, unknown>; success: boolean }, Error, { clientId: string; phone?: string; mobile?: string; address?: Record<string, unknown> }>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { clientId: string; phone?: string; mobile?: string; address?: Record<string, unknown> }) => 
      api.patch<{ profile: Record<string, unknown>; success: boolean }>('/client/profile', data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client-portal', 'profile', variables.clientId] })
      toast({ title: 'Profil mis à jour', description: 'Vos informations ont été mises à jour' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

/**
 * Fetch client appointments
 */
export function useClientRendezVous(
  clientId: string,
  filters?: { status?: string; upcoming?: boolean; page?: number; limit?: number },
  options?: Omit<UseQueryOptions<{ appointments: ClientAppointment[]; nextAppointment: ClientAppointment | null; stats: { total: number; upcoming: number; completed: number }; pagination: PortalPagination }>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: ['client-portal', 'rendez-vous', clientId, filters] as const,
    queryFn: () => api.get<{ appointments: ClientAppointment[]; nextAppointment: ClientAppointment | null; stats: { total: number; upcoming: number; completed: number }; pagination: PortalPagination }>(`/client/rendez-vous?clientId=${clientId}${buildQueryString(filters || {})}`),
    enabled: !!clientId,
    staleTime: 1000 * 60 * 2,
    ...options,
  })
}

/**
 * Request appointment with advisor
 */
export function useRequestClientRendezVous(options?: UseMutationOptions<{ appointment: ClientAppointment; message: string; success: boolean }, Error, { clientId: string; type: string; preferredDates: string[]; subject: string; notes?: string; duration?: number }>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { clientId: string; type: string; preferredDates: string[]; subject: string; notes?: string; duration?: number }) => 
      api.post<{ appointment: ClientAppointment; message: string; success: boolean }>('/client/rendez-vous', data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client-portal', 'rendez-vous', variables.clientId] })
      toast({ title: 'Demande envoyée', description: 'Votre demande de rendez-vous a été envoyée' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

/**
 * Fetch client contracts (Portal)
 */
export function useClientPortalContrats(
  clientId: string,
  filters?: { type?: string; status?: string; page?: number; limit?: number },
  options?: Omit<UseQueryOptions<{ contrats: ClientContrat[]; upcomingRenewals: Array<{ id: string; name: string; date: string }>; stats: { total: number; active: number; totalValue: number }; filters: Record<string, unknown>; pagination: PortalPagination }>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: ['client-portal', 'contrats', clientId, filters] as const,
    queryFn: () => api.get<{ contrats: ClientContrat[]; upcomingRenewals: Array<{ id: string; name: string; date: string }>; stats: { total: number; active: number; totalValue: number }; filters: Record<string, unknown>; pagination: PortalPagination }>(`/client/contrats?clientId=${clientId}${buildQueryString(filters || {})}`),
    enabled: !!clientId,
    staleTime: 1000 * 60 * 2,
    ...options,
  })
}

/**
 * Fetch client notifications
 */
export function useClientNotifications(
  clientId: string,
  filters?: { unreadOnly?: boolean; page?: number; limit?: number },
  options?: Omit<UseQueryOptions<{ notifications: ClientNotification[]; unreadCount: number; pagination: PortalPagination }>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: ['client-portal', 'notifications', clientId, filters] as const,
    queryFn: () => api.get<{ notifications: ClientNotification[]; unreadCount: number; pagination: PortalPagination }>(`/client/notifications?clientId=${clientId}${buildQueryString(filters || {})}`),
    enabled: !!clientId,
    staleTime: 1000 * 60 * 1, // 1 minute
    ...options,
  })
}

/**
 * Mark notifications as read
 */
export function useMarkClientNotificationsRead(options?: UseMutationOptions<{ success: boolean; unreadCount: number }, Error, { clientId: string; notificationIds?: string[]; markAllRead?: boolean }>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { clientId: string; notificationIds?: string[]; markAllRead?: boolean }) => 
      api.patch<{ success: boolean; unreadCount: number }>('/client/notifications', data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client-portal', 'notifications', variables.clientId] })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}
