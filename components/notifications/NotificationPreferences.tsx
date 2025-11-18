'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Label } from '@/components/ui/Label'
import { Separator } from '@/components/ui/Separator'
import { Bell, Mail, MessageSquare, Save } from 'lucide-react'
import { requestNotificationPermission } from '@/hooks/use-notifications'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

// Simple Switch component for preferences
function SimpleSwitch({ checked, onCheckedChange, disabled = false }: {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
      )}
    >
      <span
        className={cn(
          'inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform',
          checked ? 'translate-x-5' : 'translate-x-0.5',
          'mt-0.5'
        )}
        aria-hidden="true"
      />
    </button>
  )
}

interface NotificationPreference {
  id: string
  label: string
  description: string
  inApp: boolean
  email: boolean
  push: boolean
}

const defaultPreferences: NotificationPreference[] = [
  {
    id: 'TASK_DUE',
    label: 'Tâches à échéance',
    description: 'Recevoir des rappels pour les tâches qui arrivent à échéance',
    inApp: true,
    email: true,
    push: true,
  },
  {
    id: 'TASK_ASSIGNED',
    label: 'Nouvelles tâches',
    description: 'Être notifié quand une tâche vous est assignée',
    inApp: true,
    email: false,
    push: true,
  },
  {
    id: 'APPOINTMENT_REMINDER',
    label: 'Rappels de rendez-vous',
    description: 'Recevoir des rappels avant vos rendez-vous',
    inApp: true,
    email: true,
    push: true,
  },
  {
    id: 'DOCUMENT_UPLOADED',
    label: 'Nouveaux documents',
    description: 'Être notifié quand un document est uploadé',
    inApp: true,
    email: false,
    push: false,
  },
  {
    id: 'KYC_EXPIRING',
    label: 'KYC à renouveler',
    description: 'Recevoir des alertes pour les KYC qui expirent bientôt',
    inApp: true,
    email: true,
    push: true,
  },
  {
    id: 'CONTRACT_RENEWAL',
    label: 'Renouvellements de contrats',
    description: 'Être notifié des contrats à renouveler',
    inApp: true,
    email: true,
    push: false,
  },
  {
    id: 'OPPORTUNITY_DETECTED',
    label: 'Nouvelles opportunités',
    description: 'Recevoir des alertes pour les opportunités détectées',
    inApp: true,
    email: false,
    push: true,
  },
  {
    id: 'CLIENT_MESSAGE',
    label: 'Messages clients',
    description: 'Être notifié des messages importants de clients',
    inApp: true,
    email: true,
    push: true,
  },
]

/**
 * NotificationPreferences Component
 * Allows users to configure their notification preferences
 */
export function NotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreference[]>(defaultPreferences)
  const [browserNotificationsEnabled, setBrowserNotificationsEnabled] = useState(
    typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'
  )

  const handleToggle = (id: string, channel: 'inApp' | 'email' | 'push') => {
    setPreferences((prev: any) =>
      prev.map((pref: any) =>
        pref.id === id ? { ...pref, [channel]: !pref[channel] } : pref
      )
    )
  }

  const handleEnableBrowserNotifications = async () => {
    const granted = await requestNotificationPermission()
    if (granted) {
      setBrowserNotificationsEnabled(true)
      toast({
        title: 'Notifications activées',
        description: 'Vous recevrez maintenant des notifications du navigateur',
        variant: 'success',
      })
    } else {
      toast({
        title: 'Permission refusée',
        description: 'Vous devez autoriser les notifications dans les paramètres de votre navigateur',
        variant: 'destructive',
      })
    }
  }

  const handleSave = () => {
    // TODO: Save preferences to backend
    console.log('Saving preferences:', preferences)
    toast({
      title: 'Préférences enregistrées',
      description: 'Vos préférences de notification ont été mises à jour',
      variant: 'success',
    })
  }

  return (
    <div className="space-y-6">
      {/* Browser Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications du navigateur
          </CardTitle>
          <CardDescription>
            Recevez des notifications même lorsque l'application n'est pas ouverte
          </CardDescription>
        </CardHeader>
        <CardContent>
          {browserNotificationsEnabled ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-green-600">
                <Bell className="h-4 w-4" />
                Notifications activées
              </div>
              <Button variant="outline" size="sm" disabled>
                Activé
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Activez les notifications du navigateur pour ne rien manquer
              </div>
              <Button onClick={handleEnableBrowserNotifications} size="sm">
                Activer
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Préférences de notification</CardTitle>
          <CardDescription>
            Choisissez comment vous souhaitez être notifié pour chaque type d'événement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Header */}
            <div className="grid grid-cols-[1fr,auto,auto,auto] gap-4 items-center text-sm font-medium">
              <div>Type de notification</div>
              <div className="text-center w-20">
                <Bell className="h-4 w-4 mx-auto mb-1" />
                App
              </div>
              <div className="text-center w-20">
                <Mail className="h-4 w-4 mx-auto mb-1" />
                Email
              </div>
              <div className="text-center w-20">
                <MessageSquare className="h-4 w-4 mx-auto mb-1" />
                Push
              </div>
            </div>

            <Separator />

            {/* Preferences */}
            {preferences.map((pref: any) => (
              <div key={pref.id}>
                <div className="grid grid-cols-[1fr,auto,auto,auto] gap-4 items-center">
                  <div>
                    <Label className="font-medium">{pref.label}</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {pref.description}
                    </p>
                  </div>
                  <div className="flex justify-center w-20">
                    <SimpleSwitch
                      checked={pref.inApp}
                      onCheckedChange={() => handleToggle(pref.id, 'inApp')}
                    />
                  </div>
                  <div className="flex justify-center w-20">
                    <SimpleSwitch
                      checked={pref.email}
                      onCheckedChange={() => handleToggle(pref.id, 'email')}
                    />
                  </div>
                  <div className="flex justify-center w-20">
                    <SimpleSwitch
                      checked={pref.push}
                      onCheckedChange={() => handleToggle(pref.id, 'push')}
                      disabled={!browserNotificationsEnabled}
                    />
                  </div>
                </div>
                <Separator className="mt-4" />
              </div>
            ))}
          </div>

          {/* Save Button */}
          <div className="flex justify-end mt-6">
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Enregistrer les préférences
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
