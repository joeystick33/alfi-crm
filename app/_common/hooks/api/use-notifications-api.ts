 
import { useQuery, useMutation, useQueryClient, type UseQueryOptions, type UseMutationOptions } from '@tanstack/react-query'
import { api, buildQueryString, type PaginatedResponse } from '@/app/_common/lib/api-client'
import type {
  NotificationListItem,
  NotificationFilters,
} from '@/app/_common/lib/api-types'
import { toast } from '@/app/_common/hooks/use-toast'
import { queryKeys } from './query-keys'

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
    queryFn: () => api.get<PaginatedResponse<NotificationListItem>>(`/advisor/notifications${buildQueryString(filters || {})}`),
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
    queryFn: () => api.get<{ count: number }>('/advisor/notifications/unread-count'),
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
    mutationFn: (id: string) => api.patch(`/advisor/notifications/${id}`, { isRead: true }),
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
            data: old.data.map((notif: NotificationListItem) =>
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
    mutationFn: () => api.post('/advisor/notifications/mark-all-read'),
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
