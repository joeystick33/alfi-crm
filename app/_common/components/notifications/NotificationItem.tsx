'use client'

import { useRouter } from 'next/navigation'
import { Card } from '@/app/_common/components/ui/Card'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Button } from '@/app/_common/components/ui/Button'
import {
  CheckSquare,
  Calendar,
  FileText,
  Shield,
  TrendingUp,
  AlertCircle,
  Mail,
  ExternalLink,
} from 'lucide-react'
import { getRelativeTime } from '@/app/_common/lib/utils'

const notificationIcons = {
  TASK_DUE: CheckSquare,
  TASK_ASSIGNED: CheckSquare,
  APPOINTMENT_REMINDER: Calendar,
  DOCUMENT_UPLOADED: FileText,
  DOCUMENT_EXPIRING: FileText,
  KYC_EXPIRING: Shield,
  KYC_UPDATED: Shield,
  CONTRACT_RENEWAL: FileText,
  OPPORTUNITY_DETECTED: TrendingUp,
  CLIENT_MESSAGE: Mail,
  ALERT: AlertCircle,
  OTHER: AlertCircle,
}

const notificationColors = {
  TASK_DUE: 'bg-orange-100 text-orange-700',
  TASK_ASSIGNED: 'bg-blue-100 text-blue-700',
  APPOINTMENT_REMINDER: 'bg-purple-100 text-purple-700',
  DOCUMENT_UPLOADED: 'bg-green-100 text-green-700',
  DOCUMENT_EXPIRING: 'bg-orange-100 text-orange-700',
  KYC_EXPIRING: 'bg-red-100 text-red-700',
  KYC_UPDATED: 'bg-green-100 text-green-700',
  CONTRACT_RENEWAL: 'bg-yellow-100 text-yellow-700',
  OPPORTUNITY_DETECTED: 'bg-emerald-100 text-emerald-700',
  CLIENT_MESSAGE: 'bg-blue-100 text-blue-700',
  ALERT: 'bg-red-100 text-red-700',
  OTHER: 'bg-slate-100 text-slate-700',
}

interface NotificationData {
  id: string
  type: string
  title: string
  message?: string
  createdAt: string | Date
  isRead: boolean
  link?: string
  actionUrl?: string
  client?: {
    id: string
    firstName: string
    lastName: string
  }
  metadata?: Record<string, unknown>
}

interface NotificationItemProps {
  notification: NotificationData
  onMarkAsRead?: (id: string) => void
  onClick?: () => void
}

export function NotificationItem({
  notification,
  onMarkAsRead,
  onClick,
}: NotificationItemProps) {
  const router = useRouter()
  const Icon = notificationIcons[notification.type as keyof typeof notificationIcons] || AlertCircle
  const colorClass = notificationColors[notification.type as keyof typeof notificationColors] || notificationColors.OTHER

  const handleClick = () => {
    if (!notification.isRead && onMarkAsRead) {
      onMarkAsRead(notification.id)
    }
    if (onClick) {
      onClick()
    }
  }

  const handleAction = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (notification.actionUrl) {
      router.push(notification.actionUrl)
    }
    if (!notification.isRead && onMarkAsRead) {
      onMarkAsRead(notification.id)
    }
    if (onClick) {
      onClick()
    }
  }

  return (
    <Card
      className={`p-4 transition-all hover:shadow-md cursor-pointer ${
        !notification.isRead ? 'border-l-4 border-l-primary bg-primary/5' : ''
      }`}
      onClick={handleClick}
    >
      <div className="flex gap-4">
        {/* Icon */}
        <div className={`rounded-full p-2 h-fit ${colorClass}`}>
          <Icon className="h-5 w-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-semibold text-sm">
              {notification.title}
            </h3>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {getRelativeTime(notification.createdAt)}
            </span>
          </div>

          <p className="text-sm text-muted-foreground mb-2">
            {notification.message}
          </p>

          {notification.client && (
            <p className="text-xs text-muted-foreground mb-2">
              Client: {notification.client.firstName} {notification.client.lastName}
            </p>
          )}

          {/* Action */}
          {notification.actionUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleAction}
              className="mt-2"
            >
              Voir les détails
              <ExternalLink className="h-3 w-3 ml-2" />
            </Button>
          )}

          {!notification.isRead && (
            <Badge variant="default" className="text-xs bg-primary mt-2">
              Non lu
            </Badge>
          )}
        </div>
      </div>
    </Card>
  )
}
