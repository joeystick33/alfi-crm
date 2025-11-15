import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNotifications, useUnreadNotificationCount, queryKeys } from './use-api'

/**
 * Real-time notification hook
 * Polls for new notifications and updates the UI
 */
export function useRealtimeNotifications(options?: {
  enabled?: boolean
  onNewNotification?: (notification: any) => void
}) {
  const queryClient = useQueryClient()
  const { enabled = true, onNewNotification } = options || {}

  // Poll for unread count every 30 seconds
  const { data: unreadData } = useUnreadNotificationCount({
    enabled,
    refetchInterval: 30000, // 30 seconds
  })

  // Poll for notifications every 30 seconds
  const { data: notificationsData } = useNotifications(
    { isRead: false, pageSize: 10 },
    {
      enabled,
      refetchInterval: 30000, // 30 seconds
    }
  )

  // Detect new notifications
  useEffect(() => {
    if (!notificationsData?.data || !onNewNotification) return

    const notifications = notificationsData.data
    const latestNotification = notifications[0]

    // Check if this is a new notification (created in the last minute)
    if (latestNotification) {
      const createdAt = new Date(latestNotification.createdAt)
      const now = new Date()
      const diffMs = now.getTime() - createdAt.getTime()
      const diffSeconds = diffMs / 1000

      if (diffSeconds < 60) {
        onNewNotification(latestNotification)
      }
    }
  }, [notificationsData, onNewNotification])

  return {
    unreadCount: unreadData?.count || 0,
    notifications: notificationsData?.data || [],
    refetch: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications })
      queryClient.invalidateQueries({ queryKey: queryKeys.unreadCount })
    },
  }
}

/**
 * Hook to show notification toast when new notifications arrive
 */
export function useNotificationToasts() {
  useRealtimeNotifications({
    onNewNotification: (notification) => {
      // You can integrate with your toast system here
      console.log('New notification:', notification)
      
      // Example: Show browser notification if permission granted
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico',
          tag: notification.id,
        })
      }
    },
  })
}

/**
 * Request browser notification permission
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('Browser does not support notifications')
    return false
  }

  if (Notification.permission === 'granted') {
    return true
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  return false
}
