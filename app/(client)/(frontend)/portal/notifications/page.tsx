'use client'

/**
 * Client Portal - Notifications
 * 
 * Centre de notifications du client:
 * - Liste des notifications
 * - Marquage lu/non lu
 * - Filtrage par type
 * 
 * UX Pédagogique:
 * - Icônes claires pour chaque type
 * - Explications des actions à entreprendre
 * - Liens directs vers les sections concernées
 */

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useAuth } from '@/app/_common/hooks/use-auth'
import { useClientNotifications, useMarkClientNotificationsRead } from '@/app/_common/hooks/use-api'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_common/components/ui/Card'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Button } from '@/app/_common/components/ui/Button'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import {
  Bell,
  FileText,
  Calendar,
  MessageSquare,
  Info,
  ChevronRight,
  Check,
} from 'lucide-react'

// Demo data
const DEMO_NOTIFICATIONS = [
  {
    id: '1',
    type: 'DOCUMENT',
    title: 'Nouveau document disponible',
    message: 'Votre relevé trimestriel Q3 2024 est maintenant accessible dans vos documents.',
    priority: 'NORMAL',
    link: '/portal/documents',
    isRead: false,
    createdAt: '2024-11-25T10:30:00',
  },
  {
    id: '2',
    type: 'RENDEZ_VOUS',
    title: 'Rappel de rendez-vous',
    message: 'Votre rendez-vous "Bilan patrimonial annuel" est prévu dans 7 jours.',
    priority: 'HAUTE',
    link: '/portal/rendez-vous',
    isRead: false,
    createdAt: '2024-11-24T09:00:00',
  },
  {
    id: '3',
    type: 'MESSAGE',
    title: 'Nouveau message de votre conseiller',
    message: 'Marie Martin vous a envoyé un message concernant votre assurance vie.',
    priority: 'NORMAL',
    link: '/portal/messages',
    isRead: true,
    createdAt: '2024-11-23T14:15:00',
  },
  {
    id: '4',
    type: 'SYSTEME',
    title: 'Mise à jour de votre espace client',
    message: 'De nouvelles fonctionnalités sont disponibles dans votre espace personnel.',
    priority: 'BASSE',
    link: null,
    isRead: true,
    createdAt: '2024-11-20T08:00:00',
  },
]

const NOTIFICATION_TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; bgColor: string; label: string }> = {
  DOCUMENT: { icon: FileText, color: 'text-purple-600', bgColor: 'bg-purple-100', label: 'Document' },
  RENDEZ_VOUS: { icon: Calendar, color: 'text-blue-600', bgColor: 'bg-blue-100', label: 'Rendez-vous' },
  MESSAGE: { icon: MessageSquare, color: 'text-green-600', bgColor: 'bg-green-100', label: 'Message' },
  REMINDER: { icon: Bell, color: 'text-amber-600', bgColor: 'bg-amber-100', label: 'Rappel' },
  SYSTEM: { icon: Info, color: 'text-gray-600', bgColor: 'bg-gray-100', label: 'Système' },
}

const PRIORITY_CONFIG: Record<string, { color: string; label: string }> = {
  HAUTE: { color: 'bg-red-100 text-red-700', label: 'Important' },
  NORMAL: { color: 'bg-gray-100 text-gray-700', label: 'Normal' },
  BASSE: { color: 'bg-blue-100 text-blue-700', label: 'Info' },
}

export default function NotificationsPage() {
  const { user } = useAuth()
  const [filter, setFilter] = useState<string>('all')

  const { data: apiData, isLoading, refetch } = useClientNotifications(user?.id || '')
  const markReadMutation = useMarkClientNotificationsRead()

  const notifications = useMemo(() => {
    if (apiData?.notifications) return apiData.notifications
    return DEMO_NOTIFICATIONS
  }, [apiData])

  const unreadCount = apiData?.unreadCount || notifications.filter((n: { isRead?: boolean }) => !n.isRead).length

  const filteredNotifications = useMemo(() => {
    if (filter === 'all') return notifications
    if (filter === 'unread') return notifications.filter((n: { isRead?: boolean }) => !n.isRead)
    return notifications.filter((n: { type?: string }) => n.type === filter)
  }, [notifications, filter])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `Il y a ${diffMins} min`
    if (diffHours < 24) return `Il y a ${diffHours}h`
    if (diffDays < 7) return `Il y a ${diffDays} jour(s)`
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  }

  const markAsRead = async (notificationId: string) => {
    await markReadMutation.mutateAsync({
      clientId: user?.id || '',
      notificationIds: [notificationId],
    })
    refetch()
  }

  const markAllAsRead = async () => {
    await markReadMutation.mutateAsync({
      clientId: user?.id || '',
      markAllRead: true,
    })
    refetch()
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive">{unreadCount} non lue(s)</Badge>
            )}
          </h1>
          <p className="text-gray-500 mt-1">
            Restez informé de l'activité de votre espace
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllAsRead}>
            <Check className="h-4 w-4 mr-2" />
            Tout marquer comme lu
          </Button>
        )}
      </div>

      {/* Info Box - Pédagogique */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-blue-900">À quoi servent les notifications ?</p>
            <p className="text-blue-700 mt-1">
              Les notifications vous informent des événements importants : 
              <strong> nouveaux documents</strong>, <strong>rappels de rendez-vous</strong>, 
              <strong> messages de votre conseiller</strong>... 
              Cliquez sur une notification pour accéder directement à la section concernée.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          Toutes ({notifications.length})
        </Button>
        <Button
          variant={filter === 'unread' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('unread')}
        >
          Non lues ({unreadCount})
        </Button>
        {Object.entries(NOTIFICATION_TYPE_CONFIG).map(([type, config]) => {
          const count = notifications.filter((n: { type?: string }) => n.type === type).length
          if (count === 0) return null
          return (
            <Button
              key={type}
              variant={filter === type ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(type)}
            >
              {config.label} ({count})
            </Button>
          )
        })}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-900 font-medium">Aucune notification</p>
              <p className="text-gray-500 text-sm mt-1">
                {filter === 'unread' 
                  ? 'Vous avez lu toutes vos notifications'
                  : 'Vous n\'avez pas encore de notification'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredNotifications.map((notif: { id: string; type: string; title: string; message: string; priority?: string; link?: string | null; isRead?: boolean; createdAt: string }) => {
            const typeConfig = NOTIFICATION_TYPE_CONFIG[notif.type] || NOTIFICATION_TYPE_CONFIG.SYSTEM
            const priorityConfig = PRIORITY_CONFIG[notif.priority] || PRIORITY_CONFIG.NORMAL
            const Icon = typeConfig.icon

            return (
              <Card 
                key={notif.id}
                className={`transition-all ${
                  !notif.isRead 
                    ? 'bg-blue-50/50 border-blue-200 hover:bg-blue-50' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`h-10 w-10 ${typeConfig.bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`h-5 w-5 ${typeConfig.color}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={`font-medium ${!notif.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                          {notif.title}
                        </h3>
                        {!notif.isRead && (
                          <span className="h-2 w-2 bg-blue-600 rounded-full" />
                        )}
                        {notif.priority === 'HAUTE' && (
                          <Badge className={priorityConfig.color}>
                            {priorityConfig.label}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                      <p className="text-xs text-gray-400 mt-2">{formatDate(notif.createdAt)}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!notif.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(notif.id)}
                          title="Marquer comme lu"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      {notif.link && (
                        <Link href={notif.link}>
                          <Button variant="outline" size="sm">
                            Voir <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Legend - Pédagogique */}
      <Card className="bg-gray-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-700">
            Légende des notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
            {Object.entries(NOTIFICATION_TYPE_CONFIG).map(([type, config]) => {
              const Icon = config.icon
              return (
                <div key={type} className="flex items-center gap-2">
                  <div className={`h-6 w-6 ${config.bgColor} rounded flex items-center justify-center`}>
                    <Icon className={`h-3 w-3 ${config.color}`} />
                  </div>
                  <span className="text-gray-600">{config.label}</span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
