# Notification System

This directory contains all notification-related components for the aura-crm application.

## Components

### NotificationBell
A bell icon button that displays the unread notification count and opens the notification center.

**Usage:**
```tsx
import { NotificationBell } from '@/app/_common/components/notifications'

<NotificationBell />
```

### NotificationCenter
A modal that displays recent notifications with actions to mark as read or navigate to related content.

**Usage:**
```tsx
import { NotificationCenter } from '@/app/(advisor)/(frontend)/components/dashboard/NotificationCenter'

<NotificationCenter open={isOpen} onOpenChange={setIsOpen} />
```

### NotificationItem
A single notification item with icon, title, message, and action button.

**Usage:**
```tsx
import { NotificationItem } from '@/app/_common/components/notifications'

<NotificationItem
  notification={notification}
  onMarkAsRead={handleMarkAsRead}
  onClick={handleClick}
/>
```

### NotificationList
A full list of notifications with filtering and bulk actions.

**Usage:**
```tsx
import { NotificationList } from '@/app/_common/components/notifications'

<NotificationList maxHeight={600} onStatsChange={handleStatsChange} />
```

### NotificationPreferences
A component for managing notification preferences (in-app, email, push).

**Usage:**
```tsx
import { NotificationPreferences } from '@/app/_common/components/notifications'

<NotificationPreferences />
```

## Hooks

### useRealtimeNotifications
Hook for real-time notification updates with polling.

**Usage:**
```tsx
import { useRealtimeNotifications } from '@/app/(advisor)/(frontend)/hooks/use-notifications'

const { unreadCount, notifications, refetch } = useRealtimeNotifications({
  enabled: true,
  onNewNotification: (notification) => {
    console.log('New notification:', notification)
  }
})
```

### useNotificationToasts
Hook that automatically shows toast notifications for new notifications.

**Usage:**
```tsx
import { useNotificationToasts } from '@/app/(advisor)/(frontend)/hooks/use-notifications'

// In your layout or app component
useNotificationToasts()
```

## API Routes

### GET /api/advisor/notifications
Get all notifications for the current user with filtering.

**Query Parameters:**
- `unreadOnly`: boolean - Only return unread notifications
- `type`: NotificationType - Filter by notification type
- `limit`: number - Number of notifications to return (default: 50)
- `offset`: number - Offset for pagination (default: 0)

### GET /api/advisor/notifications/unread-count
Get the count of unread notifications.

### PATCH /api/advisor/notifications/[id]
Mark a notification as read.

### DELETE /api/advisor/notifications/[id]
Delete a notification.

### POST /api/advisor/notifications/mark-all-read
Mark all notifications as read for the current user.

## Notification Types

The system supports the following notification types:

- `TASK_ASSIGNED` - When a task is assigned to the user
- `TASK_DUE` - When a task is due soon
- `APPOINTMENT_REMINDER` - Reminder for upcoming appointments
- `DOCUMENT_UPLOADED` - When a new document is uploaded
- `KYC_EXPIRING` - When a client's KYC is expiring soon
- `CONTRACT_RENEWAL` - When a contract needs renewal
- `OPPORTUNITY_DETECTED` - When a new opportunity is detected
- `CLIENT_MESSAGE` - Important messages from clients
- `SYSTEM` - System notifications
- `OTHER` - Other notification types

## Service

### NotificationService
Backend service for creating and managing notifications.

**Usage:**
```typescript
import { NotificationService } from '@/app/_common/lib/services/notification-service'

const notificationService = new NotificationService(cabinetId, userId, isSuperAdmin)

// Create a notification
await notificationService.createNotification({
  userId: 'user-id',
  type: 'TASK_DUE',
  title: 'Tâche à échéance',
  message: 'La tâche "Appeler client" est due demain',
  actionUrl: '/dashboard/taches/task-id'
})

// Get notifications
const { notifications, total, unreadCount } = await notificationService.getNotifications({
  unreadOnly: true,
  limit: 20
})

// Mark as read
await notificationService.markAsRead('notification-id')

// Mark all as read
await notificationService.markAllAsRead()
```

## Real-time Updates

The notification system uses polling (every 30 seconds) to check for new notifications. This is implemented using React Query's `refetchInterval` option.

For true real-time updates, you could integrate:
- WebSockets
- Server-Sent Events (SSE)
- Supabase Realtime subscriptions

## Browser Notifications

The system supports browser notifications when the user grants permission. Use the `requestNotificationPermission()` function to request permission:

```typescript
import { requestNotificationPermission } from '@/app/(advisor)/(frontend)/hooks/use-notifications'

const granted = await requestNotificationPermission()
if (granted) {
  // Browser notifications are now enabled
}
```

## Integration Example

Here's a complete example of integrating the notification system in your layout:

```tsx
'use client'

import { NotificationBell } from '@/app/_common/components/notifications'
import { useNotificationToasts } from '@/app/(advisor)/(frontend)/hooks/use-notifications'

export function DashboardLayout({ children }) {
  // Enable notification toasts
  useNotificationToasts()

  return (
    <div>
      <header>
        <nav>
          {/* Other nav items */}
          <NotificationBell />
        </nav>
      </header>
      <main>{children}</main>
    </div>
  )
}
```

## Testing

To test the notification system:

1. Create a test notification:
```typescript
const notificationService = new NotificationService(cabinetId, userId)
await notificationService.notifyTaskDue({
  title: 'Test Task',
  dueDate: new Date(),
  taskId: 'test-task-id',
  userId: 'user-id'
})
```

2. Check the notification bell for the unread count
3. Click the bell to open the notification center
4. Click a notification to mark it as read and navigate
5. Use "Mark all as read" to clear all notifications

## Future Enhancements

- Email notifications integration
- SMS notifications
- Notification grouping (e.g., "5 new tasks")
- Notification snoozing
- Custom notification sounds
- Notification history with search
- Notification templates
- Scheduled notifications
- Notification analytics
