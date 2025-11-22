'use client'

import { useRouter } from 'next/navigation'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
} from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '@/hooks/use-api'
import { getRelativeTime } from '@/lib/utils'
import {
  CheckSquare,
  Calendar,
  FileText,
  Shield,
  TrendingUp,
  AlertCircle,
  Mail,
  Check,
} from 'lucide-react'

interface NotificationCenterProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const notificationIcons = {
  TASK_DUE: CheckSquare,
  TASK_ASSIGNED: CheckSquare,
  APPOINTMENT_REMINDER: Calendar,
  DOCUMENT_UPLOADED: FileText,
  DOCUMENT_EXPIRING: FileText,
  KYC_EXPIRING: Shield,
  KYC_UPDATED: Shield,
  CONTRACT_RENEWING: FileText,
  OPPORTUNITY_DETECTED: TrendingUp,
  ALERT: AlertCircle,
  EMAIL_RECEIVED: Mail,
  OTHER: AlertCircle,
}

const notificationVariants = {
  LOW: 'outline' as const,
  MEDIUM: 'info' as const,
  HIGH: 'warning' as const,
  URGENT: 'destructive' as const,
}

export function NotificationCenter({ open, onOpenChange }: NotificationCenterProps) {
  const router = useRouter()
  const { data, isLoading } = useNotifications({ isRead: false, pageSize: 20 })
  const markAsRead = useMarkNotificationRead()
  const markAllAsRead = useMarkAllNotificationsRead()

  const handleNotificationClick = (notification: any) => {
    // Mark as read
    markAsRead.mutate(notification.id)

    // Navigate based on notification type
    if (notification.clientId) {
      router.push(`/dashboard/clients/${notification.clientId}`)
    } else if (notification.type === 'TASK_DUE' || notification.type === 'TASK_ASSIGNED') {
      router.push('/dashboard/taches')
    } else if (notification.type === 'APPOINTMENT_REMINDER') {
      router.push('/dashboard/agenda')
    } else if (notification.type.includes('DOCUMENT')) {
      router.push('/dashboard/documents')
    } else if (notification.type.includes('KYC')) {
      router.push('/dashboard/kyc')
    } else if (notification.type.includes('OPPORTUNITY')) {
      router.push('/dashboard/opportunites')
    }

    onOpenChange(false)
  }

  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate()
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-2xl max-h-[80vh] flex flex-col p-0">
        <ModalHeader className="border-b p-4">
          <div className="flex items-center justify-between">
            <ModalTitle>Notifications</ModalTitle>
            {data && data.data && data.data.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                disabled={markAllAsRead.isPending}
              >
                <Check className="h-4 w-4 mr-2" />
                Tout marquer comme lu
              </Button>
            )}
          </div>
        </ModalHeader>

        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : data?.data && data.data.length > 0 ? (
            <div className="space-y-2">
              {data.data.map((notification: any) => {
                const Icon = notificationIcons[notification.type as keyof typeof notificationIcons] || AlertCircle
                const variant = notificationVariants[notification.priority as keyof typeof notificationVariants] || 'outline'

                return (
                  <button
                    key={notification.id}
                    className="flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-accent"
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-sm">{notification.title}</p>
                        <Badge variant={variant} className="shrink-0">
                          {notification.priority}
                        </Badge>
                      </div>
                      {notification.message && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {notification.message}
                        </p>
                      )}
                      {notification.client && (
                        <p className="text-xs text-muted-foreground">
                          Client: {notification.client.firstName} {notification.client.lastName}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {getRelativeTime(notification.createdAt)}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                <Check className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-medium">Aucune notification</p>
              <p className="text-sm text-muted-foreground mt-1">
                Vous êtes à jour !
              </p>
            </div>
          )}
        </div>

        {data?.pagination?.totalPages && data.pagination.totalPages > 1 && (
          <div className="border-t p-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                router.push('/dashboard/notifications')
                onOpenChange(false)
              }}
            >
              Voir toutes les notifications
            </Button>
          </div>
        )}
      </ModalContent>
    </Modal>
  )
}
