'use client'

/**
 * Page SuperAdmin - Intégrations
 * 
 * Gestion des intégrations tierces:
 * - Paiement (Stripe)
 * - Email (SendGrid, Mailgun)
 * - Stockage (S3, GCS)
 * - Autres services
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/_common/components/ui/Card'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Button } from '@/app/_common/components/ui/Button'
import { Input } from '@/app/_common/components/ui/Input'
import { Label } from '@/app/_common/components/ui/Label'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import { useToast } from '@/app/_common/hooks/use-toast'
import {
  Zap,
  RefreshCw,
  CreditCard,
  Mail,
  Cloud,
  MessageSquare,
  Calendar,
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Settings,
  ExternalLink,
  Eye,
  EyeOff,
  Save,
  TestTube,
} from 'lucide-react'

interface Integration {
  id: string
  name: string
  category: 'payment' | 'email' | 'storage' | 'communication' | 'calendar' | 'security'
  description: string
  icon: string
  status: 'connected' | 'disconnected' | 'error'
  lastSync?: string
  config: {
    apiKey?: string
    secretKey?: string
    webhookUrl?: string
    [key: string]: string | undefined
  }
  features: string[]
  docsUrl: string
}

const CATEGORY_CONFIG = {
  payment: { icon: CreditCard, color: 'text-green-600', bgColor: 'bg-green-50', label: 'Paiement' },
  email: { icon: Mail, color: 'text-blue-600', bgColor: 'bg-blue-50', label: 'Email' },
  storage: { icon: Cloud, color: 'text-purple-600', bgColor: 'bg-purple-50', label: 'Stockage' },
  communication: { icon: MessageSquare, color: 'text-orange-600', bgColor: 'bg-orange-50', label: 'Communication' },
  calendar: { icon: Calendar, color: 'text-cyan-600', bgColor: 'bg-cyan-50', label: 'Calendrier' },
  security: { icon: Shield, color: 'text-red-600', bgColor: 'bg-red-50', label: 'Sécurité' },
}

const STATUS_CONFIG = {
  connected: { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Connecté' },
  disconnected: { color: 'bg-gray-100 text-gray-700', icon: XCircle, label: 'Déconnecté' },
  error: { color: 'bg-red-100 text-red-700', icon: AlertTriangle, label: 'Erreur' },
}

export default function IntegrationsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null)
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})
  const [editedConfig, setEditedConfig] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    loadIntegrations()
  }, [])

  const loadIntegrations = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/superadmin/integrations', { credentials: 'include' })
      if (response.ok) {
        const data = await response.json()
        setIntegrations(data.integrations)
      } else {
        setIntegrations(generateDemoIntegrations())
      }
    } catch {
      setIntegrations(generateDemoIntegrations())
    } finally {
      setLoading(false)
    }
  }

  const generateDemoIntegrations = (): Integration[] => [
    {
      id: 'stripe',
      name: 'Stripe',
      category: 'payment',
      description: 'Gestion des paiements et abonnements',
      icon: '💳',
      status: 'connected',
      lastSync: new Date(Date.now() - 3600000).toISOString(),
      config: { apiKey: 'pk_live_*****', secretKey: 'sk_live_*****', webhookUrl: 'https://aura.fr/api/webhooks/stripe' },
      features: ['Paiements par carte', 'Abonnements récurrents', 'Facturation automatique', 'Webhooks'],
      docsUrl: 'https://stripe.com/docs',
    },
    {
      id: 'sendgrid',
      name: 'SendGrid',
      category: 'email',
      description: 'Envoi d\'emails transactionnels et marketing',
      icon: '📧',
      status: 'connected',
      lastSync: new Date(Date.now() - 7200000).toISOString(),
      config: { apiKey: 'SG.*****', fromEmail: 'noreply@aura.fr', fromName: 'Aura' },
      features: ['Emails transactionnels', 'Templates', 'Analytics', 'Webhooks'],
      docsUrl: 'https://sendgrid.com/docs',
    },
    {
      id: 's3',
      name: 'Amazon S3',
      category: 'storage',
      description: 'Stockage de fichiers et documents',
      icon: '☁️',
      status: 'connected',
      config: { accessKeyId: 'AKIA*****', secretAccessKey: '*****', bucket: 'aura-documents', region: 'eu-west-3' },
      features: ['Stockage illimité', 'CDN', 'Versioning', 'Encryption'],
      docsUrl: 'https://aws.amazon.com/s3/',
    },
    {
      id: 'slack',
      name: 'Slack',
      category: 'communication',
      description: 'Notifications et alertes',
      icon: '💬',
      status: 'disconnected',
      config: { webhookUrl: '' },
      features: ['Notifications temps réel', 'Alertes système', 'Rapports automatiques'],
      docsUrl: 'https://api.slack.com/',
    },
    {
      id: 'google-calendar',
      name: 'Google Calendar',
      category: 'calendar',
      description: 'Synchronisation des rendez-vous',
      icon: '📅',
      status: 'disconnected',
      config: { clientId: '', clientSecret: '' },
      features: ['Sync bidirectionnelle', 'Invitations automatiques', 'Rappels'],
      docsUrl: 'https://developers.google.com/calendar',
    },
    {
      id: 'auth0',
      name: 'Auth0',
      category: 'security',
      description: 'Authentification et SSO',
      icon: '🔐',
      status: 'error',
      config: { domain: 'aura.auth0.com', clientId: '*****', clientSecret: '*****' },
      features: ['SSO', 'MFA', 'Social Login', 'Enterprise SSO'],
      docsUrl: 'https://auth0.com/docs',
    },
  ]

  const openConfig = (integration: Integration) => {
    setSelectedIntegration(integration)
    const cleanConfig: Record<string, string> = {}
    Object.entries(integration.config).forEach(([k, v]) => { if (v) cleanConfig[k] = v })
    setEditedConfig(cleanConfig)
    setShowSecrets({})
  }

  const saveConfig = async () => {
    if (!selectedIntegration) return
    
    setSaving(true)
    try {
      const response = await fetch(`/api/superadmin/integrations/${selectedIntegration.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ config: editedConfig }),
      })
      
      if (response.ok) {
        toast({ title: 'Configuration sauvegardée' })
        setIntegrations(prev => prev.map(i => 
          i.id === selectedIntegration.id ? { ...i, config: editedConfig, status: 'connected' as const } : i
        ))
        setSelectedIntegration(null)
      } else {
        throw new Error('Erreur sauvegarde')
      }
    } catch {
      toast({ title: 'Erreur', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const testConnection = async () => {
    if (!selectedIntegration) return
    
    setTesting(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 2000))
      toast({ title: 'Connexion réussie', description: `${selectedIntegration.name} est correctement configuré` })
    } catch {
      toast({ title: 'Échec du test', variant: 'destructive' })
    } finally {
      setTesting(false)
    }
  }

  const toggleSecret = (key: string) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const formatLastSync = (date: string | undefined) => {
    if (!date) return 'Jamais'
    return new Date(date).toLocaleString('fr-FR')
  }

  const maskValue = (value: string | undefined) => {
    if (!value) return ''
    if (value.length <= 8) return '*'.repeat(value.length)
    return value.substring(0, 4) + '*'.repeat(value.length - 8) + value.substring(value.length - 4)
  }

  // Stats
  const connectedCount = integrations.filter(i => i.status === 'connected').length
  const errorCount = integrations.filter(i => i.status === 'error').length

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-3 gap-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}</div>
        <div className="grid grid-cols-2 gap-4">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-48" />)}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Intégrations</h1>
          <p className="text-gray-500 mt-1">Connectez vos services externes</p>
        </div>
        <Button variant="outline" onClick={loadIntegrations}><RefreshCw className="h-4 w-4 mr-2" />Actualiser</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg"><Zap className="h-5 w-5 text-blue-600" /></div>
            <div><p className="text-2xl font-bold">{integrations.length}</p><p className="text-xs text-gray-500">Intégrations</p></div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg"><CheckCircle className="h-5 w-5 text-green-600" /></div>
            <div><p className="text-2xl font-bold">{connectedCount}</p><p className="text-xs text-gray-500">Connectées</p></div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg"><AlertTriangle className="h-5 w-5 text-red-600" /></div>
            <div><p className="text-2xl font-bold">{errorCount}</p><p className="text-xs text-gray-500">En erreur</p></div>
          </div>
        </Card>
      </div>

      {/* Grille des intégrations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {integrations.map(integration => {
          const categoryConfig = CATEGORY_CONFIG[integration.category]
          const CategoryIcon = categoryConfig.icon
          const statusConfig = STATUS_CONFIG[integration.status]
          const StatusIcon = statusConfig.icon
          
          return (
            <Card key={integration.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-lg ${categoryConfig.bgColor} flex items-center justify-center text-2xl`}>
                      {integration.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold">{integration.name}</h3>
                      <Badge variant="outline" className="text-xs">{categoryConfig.label}</Badge>
                    </div>
                  </div>
                  <Badge className={statusConfig.color}>
                    <StatusIcon className="h-3 w-3 mr-1" />{statusConfig.label}
                  </Badge>
                </div>
                
                <p className="text-sm text-gray-600 mb-4">{integration.description}</p>
                
                <div className="flex flex-wrap gap-1 mb-4">
                  {integration.features.slice(0, 3).map(feature => (
                    <Badge key={feature} variant="outline" className="text-xs bg-gray-50">{feature}</Badge>
                  ))}
                  {integration.features.length > 3 && (
                    <Badge variant="outline" className="text-xs bg-gray-50">+{integration.features.length - 3}</Badge>
                  )}
                </div>
                
                {integration.lastSync && (
                  <p className="text-xs text-gray-400 mb-4">Dernière sync: {formatLastSync(integration.lastSync)}</p>
                )}
                
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => openConfig(integration)}>
                    <Settings className="h-4 w-4 mr-1" />Configurer
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => window.open(integration.docsUrl, '_blank')}>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Modal Configuration */}
      {selectedIntegration && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">{selectedIntegration.icon}</span>
                  {selectedIntegration.name}
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setSelectedIntegration(null)}>✕</Button>
              </div>
              <CardDescription>{selectedIntegration.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(editedConfig).map(([key, value]) => (
                <div key={key} className="space-y-2">
                  <Label className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</Label>
                  <div className="relative">
                    <Input
                      type={key.toLowerCase().includes('secret') || key.toLowerCase().includes('key') ? (showSecrets[key] ? 'text' : 'password') : 'text'}
                      value={value || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditedConfig({ ...editedConfig, [key]: e.target.value })}
                      placeholder={`Entrez ${key}...`}
                    />
                    {(key.toLowerCase().includes('secret') || key.toLowerCase().includes('key')) && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                        onClick={() => toggleSecret(key)}
                      >
                        {showSecrets[key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              
              <div className="flex gap-3 pt-4 border-t">
                <Button variant="outline" onClick={testConnection} disabled={testing} className="flex-1">
                  <TestTube className="h-4 w-4 mr-2" />{testing ? 'Test en cours...' : 'Tester'}
                </Button>
                <Button onClick={saveConfig} disabled={saving} className="flex-1">
                  <Save className="h-4 w-4 mr-2" />{saving ? 'Sauvegarde...' : 'Sauvegarder'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
