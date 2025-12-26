 
'use client'

import { useState } from 'react'
import { Button } from '@/app/_common/components/ui/Button'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import { Alert, AlertDescription } from '@/app/_common/components/ui/Alert'
import { NotificationItem } from './NotificationItem'
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '@/app/_common/hooks/use-api'
import { AlertCircle, CheckCheck, Bell } from 'lucide-react'

interface NotificationListProps {
  maxHeight?: number
  onStatsChange?: () => void
}

/**
 * NotificationList Component
 * Displays a list of notifications with filtering and actions
 */
export function NotificationList({
  maxHeight = 800,
  onStatsChange,
}: NotificationListProps) {
  const [filters, setFilters] = useState({ isRead: false, pageSize: 50 })
  const { data, isLoading, error } = useNotifications(filters)
  const markAsRead = useMarkNotificationRead()
  const markAllAsRead = useMarkAllNotificationsRead()

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead.mutateAsync(notificationId)
      if (onStatsChange) {
        onStatsChange()
      }
    } catch (err) {
      console.error('Error marking notification as read:', err)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead.mutateAsync()
      if (onStatsChange) {
        onStatsChange()
      }
    } catch (err) {
      console.error('Error marking all as read:', err)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Erreur lors du chargement des notifications
        </AlertDescription>
      </Alert>
    )
  }

  const notifications = data?.data || []
  const unreadCount = notifications.filter((n: any) => !n.isRead).length

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {unreadCount > 0 && (
            <span className="font-semibold text-primary">
              {unreadCount} non lue{unreadCount > 1 ? 's' : ''} ·{' '}
            </span>
          )}
          {notifications.length} notification{notifications.length > 1 ? 's' : ''}
        </p>

        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={markAllAsRead.isPending}
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            Tout marquer comme lu
          </Button>
        )}
      </div>

      {/* Notifications list */}
      {notifications.length === 0 ? (
        <div className="text-center py-12">
          <Bell className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
          <p className="text-muted-foreground mt-4">Aucune notification</p>
        </div>
      ) : (
        <div
          className="space-y-2 overflow-y-auto"
          style={{ maxHeight: `${maxHeight}px` }}
        >
          {notifications.map((notification: any) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkAsRead={handleMarkAsRead}
            />
          ))}
        </div>
      )}
    </div>
  )
}
