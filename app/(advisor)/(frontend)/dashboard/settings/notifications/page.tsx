"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  useNotificationPreferences, 
  useUpdateNotificationPreferences 
} from '@/app/_common/hooks/api/use-profile-api'
import { Card, CardContent } from '@/app/_common/components/ui/Card'
import { Button } from '@/app/_common/components/ui/Button'
import { Badge } from '@/app/_common/components/ui/Badge'
import { useToast } from '@/app/_common/hooks/use-toast'
import { 
  Bell, 
  Mail, 
  Calendar,
  CheckSquare,
  Users,
  Megaphone,
  ArrowLeft,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Info,
} from 'lucide-react'
import { cn } from '@/app/_common/lib/utils'

interface NotificationPrefs {
  email: boolean
  tasks: boolean
  appointments: boolean
  clients: boolean
  marketing: boolean
}

interface NotificationItemProps {
  id: keyof NotificationPrefs
  icon: React.ElementType
  label: string
  description: string
  enabled: boolean
  onToggle: () => void
  iconColor: string
  iconBg: string
}

function NotificationItem({ 
  icon: Icon, 
  label, 
  description, 
  enabled, 
  onToggle,
  iconColor,
  iconBg 
}: NotificationItemProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
      <div className="flex items-center gap-4">
        <div className={cn('p-2.5 rounded-xl', iconBg)}>
          <Icon className={cn('h-5 w-5', iconColor)} />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">{label}</p>
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        </div>
      </div>
      <button
        onClick={onToggle}
        className={cn(
          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
          enabled ? 'bg-indigo-600' : 'bg-gray-200'
        )}
      >
        <span
          className={cn(
            'inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm',
            enabled ? 'translate-x-6' : 'translate-x-1'
          )}
        />
      </button>
    </div>
  )
}

export default function NotificationsPage() {
  const { toast } = useToast()
  const { data: notifPrefs, isLoading, error, refetch } = useNotificationPreferences()
  const updateNotifications = useUpdateNotificationPreferences()

  const [notifications, setNotifications] = useState<NotificationPrefs>({
    email: true,
    tasks: true,
    appointments: true,
    clients: false,
    marketing: false,
  })

  useEffect(() => {
    if (notifPrefs) {
      setNotifications(notifPrefs)
    }
  }, [notifPrefs])

  const handleToggle = async (key: keyof NotificationPrefs) => {
    const newValue = !notifications[key]
    setNotifications(prev => ({ ...prev, [key]: newValue }))
    
    try {
      await updateNotifications.mutateAsync({ [key]: newValue })
      toast({ 
        title: 'Préférence mise à jour', 
        description: newValue ? 'Notification activée' : 'Notification désactivée' 
      })
    } catch (error) {
      setNotifications(prev => ({ ...prev, [key]: !newValue }))
      toast({ title: 'Erreur', description: 'Impossible de mettre à jour les préférences', variant: 'destructive' })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <AlertTriangle className="h-12 w-12 text-rose-500 mb-4" />
        <h2 className="text-lg font-semibold text-gray-900">Erreur de chargement</h2>
        <p className="text-sm text-gray-500 mt-1">Impossible de charger les préférences</p>
        <Button onClick={() => refetch()} variant="outline" className="mt-4 gap-2">
          <RefreshCw className="h-4 w-4" />
          Réessayer
        </Button>
      </div>
    )
  }

  const notificationItems = [
    { 
      id: 'email' as const, 
      icon: Mail, 
      label: 'Notifications par email', 
      description: 'Recevoir les alertes importantes par email',
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-50',
    },
    { 
      id: 'tasks' as const, 
      icon: CheckSquare, 
      label: 'Rappels de tâches', 
      description: 'Notifications pour les tâches à venir et en retard',
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-50',
    },
    { 
      id: 'appointments' as const, 
      icon: Calendar, 
      label: 'Rappels de rendez-vous', 
      description: 'Notifications avant vos rendez-vous',
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-50',
    },
    { 
      id: 'clients' as const, 
      icon: Users, 
      label: 'Activité clients', 
      description: 'Alertes sur les événements clients importants',
      iconColor: 'text-violet-600',
      iconBg: 'bg-violet-50',
    },
    { 
      id: 'marketing' as const, 
      icon: Megaphone, 
      label: 'Actualités Aura', 
      description: 'Nouveautés et mises à jour de la plateforme',
      iconColor: 'text-rose-600',
      iconBg: 'bg-rose-50',
    },
  ]

  const activeCount = Object.values(notifications).filter(Boolean).length

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link 
          href="/dashboard/settings"
          className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Notifications</h1>
          <p className="text-sm text-gray-500 mt-0.5">Configurez vos préférences de notification</p>
        </div>
        <Badge variant="primary" size="sm">
          {activeCount}/{notificationItems.length} actives
        </Badge>
      </div>

      {/* Notifications List */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-indigo-50">
              <Bell className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Préférences de notification</h2>
              <p className="text-xs text-gray-500">Choisissez quelles notifications vous souhaitez recevoir</p>
            </div>
          </div>

          <div className="space-y-3">
            {notificationItems.map((item) => (
              <NotificationItem
                key={item.id}
                {...item}
                enabled={notifications[item.id]}
                onToggle={() => handleToggle(item.id)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const allEnabled: NotificationPrefs = { email: true, tasks: true, appointments: true, clients: true, marketing: true }
            setNotifications(allEnabled)
            // Update all in backend
            Object.keys(allEnabled).forEach((key) => {
              updateNotifications.mutate({ [key]: true })
            })
            toast({ title: 'Toutes les notifications activées' })
          }}
          className="text-xs"
        >
          Tout activer
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const allDisabled: NotificationPrefs = { email: false, tasks: false, appointments: false, clients: false, marketing: false }
            setNotifications(allDisabled)
            Object.keys(allDisabled).forEach((key) => {
              updateNotifications.mutate({ [key]: false })
            })
            toast({ title: 'Toutes les notifications désactivées' })
          }}
          className="text-xs"
        >
          Tout désactiver
        </Button>
      </div>

      {/* Info */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
        <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-blue-900">Comment fonctionnent les notifications ?</p>
          <p className="text-xs text-blue-700 mt-1 leading-relaxed">
            Les notifications par email sont envoyées à l'adresse associée à votre compte. 
            Les rappels de tâches et rendez-vous sont envoyés selon les délais configurés dans chaque élément.
          </p>
        </div>
      </div>
    </div>
  )
}
