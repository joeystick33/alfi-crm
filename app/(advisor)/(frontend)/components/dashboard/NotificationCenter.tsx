 
'use client'

import { useRouter } from 'next/navigation'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
} from '@/app/_common/components/ui/Modal'
import { Button } from '@/app/_common/components/ui/Button'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '@/app/_common/hooks/use-api'
import { getRelativeTime } from '@/app/_common/lib/utils'
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
    } else if (notification.type === 'TACHE_ECHEANCE' || notification.type === 'TACHE_ASSIGNEE') {
      router.push('/dashboard/taches')
    } else if (notification.type === 'RAPPEL_RDV') {
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
      <ModalContent className="max-w-2xl max-h-[80vh] flex flex-col p-0 gap-0">
        <ModalHeader className="border-b border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <ModalTitle>Notifications</ModalTitle>
            {data && data.data && data.data.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                disabled={markAllAsRead.isPending}
                className="gap-2 text-gray-600"
              >
                <Check className="h-4 w-4" />
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
                    className="flex w-full items-start gap-3 rounded-xl border border-gray-200 p-3 text-left transition-colors hover:bg-gray-50"
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#7373FF]/15">
                      <Icon className="h-5 w-5 text-[#7373FF]" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-sm text-gray-900">{notification.title}</p>
                        <Badge variant={variant} size="xs" className="shrink-0">
                          {notification.priority}
                        </Badge>
                      </div>
                      {notification.message && (
                        <p className="text-sm text-gray-500 line-clamp-2">
                          {notification.message}
                        </p>
                      )}
                      {notification.client && (
                        <p className="text-xs text-gray-500">
                          Client: {notification.client.firstName} {notification.client.lastName}
                        </p>
                      )}
                      <p className="text-xs text-gray-400">
                        {getRelativeTime(notification.createdAt)}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mb-4">
                <Check className="h-8 w-8 text-emerald-600" />
              </div>
              <p className="text-lg font-medium text-gray-900">Aucune notification</p>
              <p className="text-sm text-gray-500 mt-1">
                Vous êtes à jour !
              </p>
            </div>
          )}
        </div>

        {data?.pagination?.totalPages && data.pagination.totalPages > 1 && (
          <div className="border-t border-gray-100 p-4">
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
