'use client'

/**
 * Page SuperAdmin - Configuration Système
 * 
 * Paramètres globaux de la plateforme:
 * - Configuration générale
 * - Paramètres email
 * - Limites système
 * - Maintenance
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/_common/components/ui/Card'
import { Button } from '@/app/_common/components/ui/Button'
import { Input } from '@/app/_common/components/ui/Input'
import { Label } from '@/app/_common/components/ui/Label'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import Switch from '@/app/_common/components/ui/Switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/_common/components/ui/Tabs'
import { useToast } from '@/app/_common/hooks/use-toast'
import {
  Settings,
  Save,
  RefreshCw,
  Mail,
  Server,
  Shield,
  Bell,
  AlertTriangle,
} from 'lucide-react'

interface SystemConfig {
  general: {
    platformName: string
    supportEmail: string
    defaultLanguage: string
    timezone: string
    maintenanceMode: boolean
    registrationEnabled: boolean
  }
  email: {
    provider: string
    fromName: string
    fromEmail: string
    smtpHost: string
    smtpPort: number
    smtpSecure: boolean
  }
  security: {
    sessionDuration: number
    maxLoginAttempts: number
    passwordMinLength: number
    require2FA: boolean
    ipWhitelist: string[]
  }
  limits: {
    maxTrialDays: number
    defaultStorageGB: number
    maxFileSize: number
    apiRateLimit: number
  }
  notifications: {
    emailOnNewCabinet: boolean
    emailOnPaymentFailed: boolean
    emailOnTrialExpiring: boolean
    slackWebhook: string
  }
}

const DEFAULT_CONFIG: SystemConfig = {
  general: {
    platformName: 'Aura',
    supportEmail: 'support@aura.fr',
    defaultLanguage: 'fr',
    timezone: 'Europe/Paris',
    maintenanceMode: false,
    registrationEnabled: true,
  },
  email: {
    provider: 'smtp',
    fromName: 'Aura',
    fromEmail: 'noreply@aura.fr',
    smtpHost: 'smtp.aura.fr',
    smtpPort: 587,
    smtpSecure: true,
  },
  security: {
    sessionDuration: 24,
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    require2FA: false,
    ipWhitelist: [],
  },
  limits: {
    maxTrialDays: 30,
    defaultStorageGB: 5,
    maxFileSize: 50,
    apiRateLimit: 1000,
  },
  notifications: {
    emailOnNewCabinet: true,
    emailOnPaymentFailed: true,
    emailOnTrialExpiring: true,
    slackWebhook: '',
  },
}

export default function ConfigPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState<SystemConfig>(DEFAULT_CONFIG)
  const [hasChanges, setHasChanges] = useState(false)
  const [activeTab, setActiveTab] = useState('general')

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/superadmin/config', { credentials: 'include' })
      if (response.ok) {
        const data = await response.json()
        setConfig(data.config)
      }
    } catch {
      // Utiliser les valeurs par défaut
    } finally {
      setLoading(false)
    }
  }

  const saveConfig = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/superadmin/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(config),
      })
      if (response.ok) {
        toast({ title: 'Succès', description: 'Configuration sauvegardée' })
        setHasChanges(false)
      } else {
        throw new Error('Erreur sauvegarde')
      }
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de sauvegarder', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const updateConfig = <K extends keyof SystemConfig, T extends keyof SystemConfig[K]>(
    section: K,
    key: T,
    value: SystemConfig[K][T]
  ) => {
    setConfig(prev => ({
      ...prev,
      [section]: { ...prev[section], [key]: value },
    }))
    setHasChanges(true)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configuration Système</h1>
          <p className="text-gray-500 mt-1">Paramètres globaux de la plateforme</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadConfig}><RefreshCw className="h-4 w-4" /></Button>
          <Button onClick={saveConfig} disabled={!hasChanges || saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </div>
      </div>

      {hasChanges && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
          <AlertTriangle className="h-5 w-5" />
          <span className="text-sm font-medium">Modifications non sauvegardées</span>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="general"><Settings className="h-4 w-4 mr-2" />Général</TabsTrigger>
          <TabsTrigger value="email"><Mail className="h-4 w-4 mr-2" />Email</TabsTrigger>
          <TabsTrigger value="security"><Shield className="h-4 w-4 mr-2" />Sécurité</TabsTrigger>
          <TabsTrigger value="limits"><Server className="h-4 w-4 mr-2" />Limites</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="h-4 w-4 mr-2" />Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres Généraux</CardTitle>
              <CardDescription>Configuration de base de la plateforme</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Nom de la plateforme</Label>
                  <Input
                    value={config.general.platformName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateConfig('general', 'platformName', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email support</Label>
                  <Input
                    type="email"
                    value={config.general.supportEmail}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateConfig('general', 'supportEmail', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Langue par défaut</Label>
                  <Input value={config.general.defaultLanguage} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateConfig('general', 'defaultLanguage', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Fuseau horaire</Label>
                  <Input value={config.general.timezone} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateConfig('general', 'timezone', e.target.value)} />
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Mode maintenance</p>
                  <p className="text-sm text-gray-500">Bloquer l'accès aux utilisateurs</p>
                </div>
                <Switch
                  checked={config.general.maintenanceMode}
                  onCheckedChange={(checked: boolean) => updateConfig('general', 'maintenanceMode', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Inscriptions ouvertes</p>
                  <p className="text-sm text-gray-500">Autoriser les nouvelles inscriptions</p>
                </div>
                <Switch
                  checked={config.general.registrationEnabled}
                  onCheckedChange={(checked: boolean) => updateConfig('general', 'registrationEnabled', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuration Email</CardTitle>
              <CardDescription>Paramètres d'envoi des emails</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Nom expéditeur</Label>
                  <Input value={config.email.fromName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateConfig('email', 'fromName', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Email expéditeur</Label>
                  <Input type="email" value={config.email.fromEmail} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateConfig('email', 'fromEmail', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Serveur SMTP</Label>
                  <Input value={config.email.smtpHost} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateConfig('email', 'smtpHost', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Port SMTP</Label>
                  <Input type="number" value={config.email.smtpPort} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateConfig('email', 'smtpPort', parseInt(e.target.value))} />
                </div>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Connexion sécurisée (TLS)</p>
                  <p className="text-sm text-gray-500">Utiliser une connexion chiffrée</p>
                </div>
                <Switch checked={config.email.smtpSecure} onCheckedChange={(checked: boolean) => updateConfig('email', 'smtpSecure', checked)} />
              </div>
              <Button variant="outline"><Mail className="h-4 w-4 mr-2" />Envoyer un email de test</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres de Sécurité</CardTitle>
              <CardDescription>Configuration de la sécurité système</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Durée session (heures)</Label>
                  <Input type="number" value={config.security.sessionDuration} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateConfig('security', 'sessionDuration', parseInt(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label>Tentatives connexion max</Label>
                  <Input type="number" value={config.security.maxLoginAttempts} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateConfig('security', 'maxLoginAttempts', parseInt(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label>Longueur min. mot de passe</Label>
                  <Input type="number" value={config.security.passwordMinLength} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateConfig('security', 'passwordMinLength', parseInt(e.target.value))} />
                </div>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">2FA obligatoire</p>
                  <p className="text-sm text-gray-500">Exiger l'authentification à deux facteurs</p>
                </div>
                <Switch checked={config.security.require2FA} onCheckedChange={(checked: boolean) => updateConfig('security', 'require2FA', checked)} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="limits" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Limites Système</CardTitle>
              <CardDescription>Quotas et limites par défaut</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Durée essai (jours)</Label>
                  <Input type="number" value={config.limits.maxTrialDays} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateConfig('limits', 'maxTrialDays', parseInt(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label>Stockage par défaut (GB)</Label>
                  <Input type="number" value={config.limits.defaultStorageGB} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateConfig('limits', 'defaultStorageGB', parseInt(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label>Taille fichier max (MB)</Label>
                  <Input type="number" value={config.limits.maxFileSize} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateConfig('limits', 'maxFileSize', parseInt(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label>Rate limit API (req/h)</Label>
                  <Input type="number" value={config.limits.apiRateLimit} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateConfig('limits', 'apiRateLimit', parseInt(e.target.value))} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Alertes et notifications système</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Nouveau cabinet</p>
                  <p className="text-sm text-gray-500">Email lors d'une nouvelle inscription</p>
                </div>
                <Switch checked={config.notifications.emailOnNewCabinet} onCheckedChange={(checked: boolean) => updateConfig('notifications', 'emailOnNewCabinet', checked)} />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Paiement échoué</p>
                  <p className="text-sm text-gray-500">Alerte lors d'un échec de paiement</p>
                </div>
                <Switch checked={config.notifications.emailOnPaymentFailed} onCheckedChange={(checked: boolean) => updateConfig('notifications', 'emailOnPaymentFailed', checked)} />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Fin d'essai proche</p>
                  <p className="text-sm text-gray-500">Rappel avant expiration période d'essai</p>
                </div>
                <Switch checked={config.notifications.emailOnTrialExpiring} onCheckedChange={(checked: boolean) => updateConfig('notifications', 'emailOnTrialExpiring', checked)} />
              </div>
              <div className="space-y-2">
                <Label>Webhook Slack</Label>
                <Input placeholder="https://hooks.slack.com/..." value={config.notifications.slackWebhook} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateConfig('notifications', 'slackWebhook', e.target.value)} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
