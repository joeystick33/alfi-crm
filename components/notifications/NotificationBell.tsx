'use client'

import { useState } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { NotificationCenter } from '@/components/dashboard/NotificationCenter'
import { useUnreadNotificationCount } from '@/hooks/use-api'

/**
 * NotificationBell Component
 * Displays a bell icon with unread count badge and opens notification center
 */
export function NotificationBell() {
  const [showNotifications, setShowNotifications] = useState(false)
  const { data: unreadData } = useUnreadNotificationCount()
  const unreadCount = unreadData?.count || 0

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setShowNotifications(true)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} non lues)` : ''}`}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 min-w-[20px] flex items-center justify-center p-0 text-xs"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      <NotificationCenter
        open={showNotifications}
        onOpenChange={setShowNotifications}
      />
    </>
  )
}
