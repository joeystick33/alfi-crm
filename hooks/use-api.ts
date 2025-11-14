/**
 * React Query hooks for API calls
 * Provides type-safe hooks for common API operations
 */

import { useQuery, useMutation, useQueryClient, type UseQueryOptions, type UseMutationOptions } from '@tanstack/react-query'
import { api, buildQueryString, type PaginatedResponse } from '@/lib/api-client'
import type {
  ClientListItem,
  ClientDetail,
  CreateClientRequest,
  UpdateClientRequest,
  ClientFilters,
  WealthSummary,
  NotificationListItem,
  NotificationFilters,
  DashboardCounters,
  TacheFilters,
  RendezVousFilters,
} from '@/lib/api-types'
import { toast } from '@/hooks/use-toast'

// ============================================================================
// Query Keys
// ============================================================================

export const queryKeys = {
  // Clients
  clients: ['clients'] as const,
  clientList: (filters?: ClientFilters) => ['clients', 'list', filters] as const,
  client: (id: string) => ['clients', id] as const,
  clientWealth: (id: string) => ['clients', id, 'wealth'] as const,
  
  // Dashboard
  dashboardCounters: ['dashboard', 'counters'] as const,
  
  // Notifications
  notifications: ['notifications'] as const,
  notificationList: (filters?: NotificationFilters) => ['notifications', 'list', filters] as const,
  unreadCount: ['notifications', 'unread-count'] as const,
  
  // Tasks
  tasks: ['tasks'] as const,
  taskList: (filters?: TacheFilters) => ['tasks', 'list', filters] as const,
  
  // Appointments
  appointments: ['appointments'] as const,
  appointmentList: (filters?: RendezVousFilters) => ['appointments', 'list', filters] as const,
}

// ============================================================================
// Client Hooks
// ============================================================================

/**
 * Fetch paginated list of clients
 */
export function useClients(
  filters?: ClientFilters,
  options?: Omit<UseQueryOptions<PaginatedResponse<ClientListItem>>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.clientList(filters),
    queryFn: () => api.get<PaginatedResponse<ClientListItem>>(`/clients${buildQueryString(filters || {})}`),
    ...options,
  })
}

/**
 * Fetch single client with full details
 */
export function useClient(
  id: string,
  options?: Omit<UseQueryOptions<ClientDetail>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.client(id),
    queryFn: () => api.get<ClientDetail>(`/clients/${id}?include=all`),
    enabled: !!id,
    ...options,
  })
}

/**
 * Fetch client wealth summary
 */
export function useClientWealth(
  id: string,
  options?: Omit<UseQueryOptions<WealthSummary>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.clientWealth(id),
    queryFn: () => api.get<WealthSummary>(`/clients/${id}/wealth`),
    enabled: !!id,
    ...options,
  })
}

/**
 * Create new client
 */
export function useCreateClient(
  options?: UseMutationOptions<ClientDetail, Error, CreateClientRequest>
) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: CreateClientRequest) => api.post<ClientDetail>('/clients', data),
    onSuccess: (data) => {
      // Invalidate clients list
      queryClient.invalidateQueries({ queryKey: queryKeys.clients })
      // Invalidate dashboard counters
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardCounters })
      
      toast({
        title: 'Client créé',
        description: `${data.firstName} ${data.lastName} a été créé avec succès.`,
        variant: 'success',
      })
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de créer le client.',
        variant: 'destructive',
      })
    },
    ...options,
  })
}

/**
 * Update existing client
 */
export function useUpdateClient(
  options?: UseMutationOptions<ClientDetail, Error, { id: string; data: UpdateClientRequest }>
) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }) => api.patch<ClientDetail>(`/clients/${id}`, data),
    onSuccess: (data, variables) => {
      // Invalidate specific client
      queryClient.invalidateQueries({ queryKey: queryKeys.client(variables.id) })
      // Invalidate clients list
      queryClient.invalidateQueries({ queryKey: queryKeys.clients })
      
      toast({
        title: 'Client mis à jour',
        description: 'Les modifications ont été enregistrées.',
        variant: 'success',
      })
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de mettre à jour le client.',
        variant: 'destructive',
      })
    },
    ...options,
  })
}

/**
 * Delete (archive) client
 */
export function useDeleteClient(
  options?: UseMutationOptions<void, Error, string>
) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => api.delete(`/clients/${id}`),
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.client(id) })
      // Invalidate clients list
      queryClient.invalidateQueries({ queryKey: queryKeys.clients })
      // Invalidate dashboard counters
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardCounters })
      
      toast({
        title: 'Client archivé',
        description: 'Le client a été archivé avec succès.',
        variant: 'success',
      })
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible d\'archiver le client.',
        variant: 'destructive',
      })
    },
    ...options,
  })
}

// ============================================================================
// Dashboard Hooks
// ============================================================================

/**
 * Fetch dashboard counters
 */
export function useDashboardCounters(
  options?: Omit<UseQueryOptions<DashboardCounters>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.dashboardCounters,
    queryFn: () => api.get<DashboardCounters>('/dashboard/counters'),
    // Refetch every 30 seconds
    refetchInterval: 30000,
    ...options,
  })
}

// ============================================================================
// Notification Hooks
// ============================================================================

/**
 * Fetch paginated list of notifications
 */
export function useNotifications(
  filters?: NotificationFilters,
  options?: Omit<UseQueryOptions<PaginatedResponse<NotificationListItem>>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.notificationList(filters),
    queryFn: () => api.get<PaginatedResponse<NotificationListItem>>(`/notifications${buildQueryString(filters || {})}`),
    ...options,
  })
}

/**
 * Fetch unread notification count
 */
export function useUnreadNotificationCount(
  options?: Omit<UseQueryOptions<{ count: number }>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.unreadCount,
    queryFn: () => api.get<{ count: number }>('/notifications/unread-count'),
    // Refetch every 30 seconds
    refetchInterval: 30000,
    ...options,
  })
}

/**
 * Mark notification as read
 */
export function useMarkNotificationRead(
  options?: UseMutationOptions<void, Error, string>
) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}`, { isRead: true }),
    onSuccess: () => {
      // Invalidate notifications list
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications })
      // Invalidate unread count
      queryClient.invalidateQueries({ queryKey: queryKeys.unreadCount })
    },
    ...options,
  })
}

/**
 * Mark all notifications as read
 */
export function useMarkAllNotificationsRead(
  options?: UseMutationOptions<void, Error, void>
) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: () => api.post('/notifications/mark-all-read'),
    onSuccess: () => {
      // Invalidate notifications list
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications })
      // Invalidate unread count
      queryClient.invalidateQueries({ queryKey: queryKeys.unreadCount })
      
      toast({
        title: 'Notifications marquées comme lues',
        variant: 'success',
      })
    },
    ...options,
  })
}

// ============================================================================
// Wealth Hooks
// ============================================================================

/**
 * Recalculate client wealth
 */
export function useRecalculateWealth(
  options?: UseMutationOptions<WealthSummary, Error, string>
) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (clientId: string) => api.post<WealthSummary>(`/clients/${clientId}/wealth/recalculate`),
    onSuccess: (data, clientId) => {
      // Update wealth cache
      queryClient.setQueryData(queryKeys.clientWealth(clientId), data)
      // Invalidate client data
      queryClient.invalidateQueries({ queryKey: queryKeys.client(clientId) })
      
      toast({
        title: 'Patrimoine recalculé',
        description: 'Le patrimoine a été mis à jour.',
        variant: 'success',
      })
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de recalculer le patrimoine.',
        variant: 'destructive',
      })
    },
    ...options,
  })
}
