'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_common/components/ui/Card'
import { Button } from '@/app/_common/components/ui/Button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/_common/components/ui/Tabs'
import { NotificationList, NotificationPreferences } from '@/app/_common/components/notifications'
import { Bell, Settings } from 'lucide-react'

/**
 * Notifications Page
 * Full page view for managing notifications
 */
export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState('unread')
  const [showPreferences, setShowPreferences] = useState(false)

  if (showPreferences) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Settings className="h-8 w-8" />
              Préférences de notification
            </h1>
            <p className="text-muted-foreground mt-1">
              Configurez vos préférences de notification
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowPreferences(false)}>
            <Bell className="h-4 w-4 mr-2" />
            Retour aux notifications
          </Button>
        </div>

        <NotificationPreferences />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bell className="h-8 w-8" />
            Notifications
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos notifications et alertes
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowPreferences(true)}>
          <Settings className="h-4 w-4 mr-2" />
          Préférences
        </Button>
      </div>

      {/* Notifications Tabs */}
      <Card>
        <CardHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="unread">Non lues</TabsTrigger>
              <TabsTrigger value="all">Toutes</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab}>
            <TabsContent value="unread" className="mt-0">
              <NotificationList maxHeight={600} />
            </TabsContent>
            <TabsContent value="all" className="mt-0">
              <NotificationList maxHeight={600} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Notification Types Info */}
      <Card>
        <CardHeader>
          <CardTitle>Types de notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Tâches</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Tâches à échéance</li>
                <li>• Nouvelles tâches assignées</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Rendez-vous</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Rappels de rendez-vous</li>
                <li>• Confirmations de rendez-vous</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Documents</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Nouveaux documents uploadés</li>
                <li>• Documents expirant bientôt</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">KYC & Conformité</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• KYC à renouveler</li>
                <li>• Mises à jour KYC</li>
                <li>• Renouvellements de contrats</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Opportunités</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Nouvelles opportunités détectées</li>
                <li>• Opportunités à suivre</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Messages</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Nouveaux emails importants</li>
                <li>• Messages clients</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
