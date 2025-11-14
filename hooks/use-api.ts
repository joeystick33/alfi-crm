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
 * Update existing client with optimistic updates
 */
export function useUpdateClient(
  options?: UseMutationOptions<ClientDetail, Error, { id: string; data: UpdateClientRequest }, { previousClient?: ClientDetail }>
) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }) => api.patch<ClientDetail>(`/clients/${id}`, data),
    // Optimistic update
    onMutate: async ({ id, data }): Promise<{ previousClient?: ClientDetail }> => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.client(id) })
      
      // Snapshot previous value
      const previousClient = queryClient.getQueryData<ClientDetail>(queryKeys.client(id))
      
      // Optimistically update
      if (previousClient) {
        queryClient.setQueryData<ClientDetail>(queryKeys.client(id), {
          ...previousClient,
          ...data,
        } as ClientDetail)
      }
      
      // Return context with snapshot
      return { previousClient }
    },
    onSuccess: (data, variables) => {
      // Update with server data
      queryClient.setQueryData(queryKeys.client(variables.id), data)
      // Invalidate clients list
      queryClient.invalidateQueries({ queryKey: queryKeys.clients })
      
      toast({
        title: 'Client mis à jour',
        description: 'Les modifications ont été enregistrées.',
        variant: 'success',
      })
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousClient) {
        queryClient.setQueryData(queryKeys.client(variables.id), context.previousClient)
      }
      
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
 * Mark notification as read with optimistic update
 */
export function useMarkNotificationRead(
  options?: UseMutationOptions<void, Error, string, { previousNotifications: any[]; previousCount?: { count: number } }>
) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}`, { isRead: true }),
    // Optimistic update
    onMutate: async (id): Promise<{ previousNotifications: any[]; previousCount?: { count: number } }> => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications })
      await queryClient.cancelQueries({ queryKey: queryKeys.unreadCount })
      
      // Snapshot previous values
      const previousNotifications = queryClient.getQueriesData({ queryKey: queryKeys.notifications })
      const previousCount = queryClient.getQueryData<{ count: number }>(queryKeys.unreadCount)
      
      // Optimistically update notification lists
      queryClient.setQueriesData<PaginatedResponse<NotificationListItem>>(
        { queryKey: queryKeys.notifications },
        (old) => {
          if (!old) return old
          return {
            ...old,
            data: old.data.map((notif) =>
              notif.id === id ? { ...notif, isRead: true } : notif
            ),
          }
        }
      )
      
      // Optimistically update unread count
      if (previousCount && previousCount.count > 0) {
        queryClient.setQueryData<{ count: number }>(queryKeys.unreadCount, {
          count: previousCount.count - 1,
        })
      }
      
      return { previousNotifications, previousCount }
    },
    onError: (error, id, context) => {
      // Rollback on error
      if (context?.previousNotifications) {
        context.previousNotifications.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
      if (context?.previousCount) {
        queryClient.setQueryData(queryKeys.unreadCount, context.previousCount)
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications })
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
// Task Hooks
// ============================================================================

/**
 * Update task with optimistic update
 */
export function useUpdateTask(
  options?: UseMutationOptions<any, Error, { id: string; data: any }, { previousTasks: any[] }>
) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }) => api.patch(`/taches/${id}`, data),
    // Optimistic update
    onMutate: async ({ id, data }): Promise<{ previousTasks: any[] }> => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks })
      
      // Snapshot previous values
      const previousTasks = queryClient.getQueriesData({ queryKey: queryKeys.tasks })
      
      // Optimistically update task in all queries
      queryClient.setQueriesData<any>(
        { queryKey: queryKeys.tasks },
        (old: any) => {
          if (!old) return old
          if (Array.isArray(old)) {
            return old.map((task: any) =>
              task.id === id ? { ...task, ...data } : task
            )
          }
          if (old.data && Array.isArray(old.data)) {
            return {
              ...old,
              data: old.data.map((task: any) =>
                task.id === id ? { ...task, ...data } : task
              ),
            }
          }
          return old
        }
      )
      
      return { previousTasks }
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousTasks) {
        context.previousTasks.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
      
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de mettre à jour la tâche.',
        variant: 'destructive',
      })
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks })
    },
    ...options,
  })
}

/**
 * Create task with optimistic update
 */
export function useCreateTask(
  options?: UseMutationOptions<any, Error, any>
) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: any) => api.post('/taches', data),
    onSuccess: () => {
      // Invalidate tasks list
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks })
      // Invalidate dashboard counters
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardCounters })
      
      toast({
        title: 'Tâche créée',
        description: 'La tâche a été créée avec succès.',
        variant: 'success',
      })
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de créer la tâche.',
        variant: 'destructive',
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
