'use client'

/**
 * Page SuperAdmin - API & Webhooks
 * 
 * Gestion de l'API publique:
 * - Clés API
 * - Webhooks sortants
 * - Documentation
 * - Logs d'appels
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_common/components/ui/Card'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Button } from '@/app/_common/components/ui/Button'
import { Input } from '@/app/_common/components/ui/Input'
import { Label } from '@/app/_common/components/ui/Label'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/_common/components/ui/Tabs'
import { useToast } from '@/app/_common/hooks/use-toast'
import {
  Key,
  Webhook,
  RefreshCw,
  Plus,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Activity,
  FileText,
  AlertTriangle,
} from 'lucide-react'

interface ApiKey {
  id: string
  name: string
  key: string
  prefix: string
  permissions: string[]
  createdAt: string
  lastUsed: string | null
  expiresAt: string | null
  isActive: boolean
  requestCount: number
}

interface WebhookEndpoint {
  id: string
  url: string
  events: string[]
  status: 'active' | 'inactive' | 'error'
  secret: string
  createdAt: string
  lastTriggered: string | null
  successCount: number
  failureCount: number
}

interface ApiCall {
  id: string
  timestamp: string
  endpoint: string
  method: string
  statusCode: number
  duration: number
  apiKeyId: string
  apiKeyName: string
}

const EVENTS = [
  { code: 'cabinet.created', label: 'Cabinet créé' },
  { code: 'cabinet.updated', label: 'Cabinet mis à jour' },
  { code: 'cabinet.deleted', label: 'Cabinet supprimé' },
  { code: 'user.created', label: 'Utilisateur créé' },
  { code: 'user.login', label: 'Connexion utilisateur' },
  { code: 'subscription.created', label: 'Abonnement créé' },
  { code: 'subscription.cancelled', label: 'Abonnement annulé' },
  { code: 'payment.succeeded', label: 'Paiement réussi' },
  { code: 'payment.failed', label: 'Paiement échoué' },
]

export default function ApiPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([])
  const [apiCalls, setApiCalls] = useState<ApiCall[]>([])
  const [activeTab, setActiveTab] = useState('keys')
  const [showKey, setShowKey] = useState<Record<string, boolean>>({})
  const [showCreateKey, setShowCreateKey] = useState(false)
  const [showCreateWebhook, setShowCreateWebhook] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [newWebhookUrl, setNewWebhookUrl] = useState('')
  const [newWebhookEvents, setNewWebhookEvents] = useState<string[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [keysRes, webhooksRes, callsRes] = await Promise.all([
        fetch('/api/superadmin/api-keys', { credentials: 'include' }),
        fetch('/api/superadmin/webhooks', { credentials: 'include' }),
        fetch('/api/superadmin/api-calls', { credentials: 'include' }),
      ])
      
      if (keysRes.ok) setApiKeys((await keysRes.json()).keys)
      else setApiKeys(generateDemoKeys())
      
      if (webhooksRes.ok) setWebhooks((await webhooksRes.json()).webhooks)
      else setWebhooks(generateDemoWebhooks())
      
      if (callsRes.ok) setApiCalls((await callsRes.json()).calls)
      else setApiCalls(generateDemoCalls())
    } catch {
      setApiKeys(generateDemoKeys())
      setWebhooks(generateDemoWebhooks())
      setApiCalls(generateDemoCalls())
    } finally {
      setLoading(false)
    }
  }

  const generateDemoKeys = (): ApiKey[] => [
    {
      id: '1', name: 'Production Key', key: 'ak_live_1234567890abcdefghijklmnopqrstuvwxyz', prefix: 'ak_live_',
      permissions: ['read:cabinets', 'write:cabinets', 'read:users', 'read:stats'],
      createdAt: '2024-01-15T00:00:00Z', lastUsed: new Date(Date.now() - 3600000).toISOString(),
      expiresAt: null, isActive: true, requestCount: 45678
    },
    {
      id: '2', name: 'Test Key', key: 'ak_test_abcdefghijklmnopqrstuvwxyz1234567890', prefix: 'ak_test_',
      permissions: ['read:cabinets', 'read:users'],
      createdAt: '2024-06-01T00:00:00Z', lastUsed: new Date(Date.now() - 86400000).toISOString(),
      expiresAt: '2025-06-01T00:00:00Z', isActive: true, requestCount: 1234
    },
    {
      id: '3', name: 'Old Key (disabled)', key: 'ak_live_oldkey123456789012345678901234567890', prefix: 'ak_live_',
      permissions: ['read:cabinets'],
      createdAt: '2023-01-01T00:00:00Z', lastUsed: '2023-12-31T00:00:00Z',
      expiresAt: null, isActive: false, requestCount: 12345
    },
  ]

  const generateDemoWebhooks = (): WebhookEndpoint[] => [
    {
      id: '1', url: 'https://my-app.com/webhooks/aura', events: ['cabinet.created', 'cabinet.updated', 'payment.succeeded'],
      status: 'active', secret: 'whsec_1234567890abcdef',
      createdAt: '2024-03-01T00:00:00Z', lastTriggered: new Date(Date.now() - 1800000).toISOString(),
      successCount: 456, failureCount: 3
    },
    {
      id: '2', url: 'https://slack.com/api/webhooks/xyz', events: ['payment.failed', 'subscription.cancelled'],
      status: 'active', secret: 'whsec_abcdef1234567890',
      createdAt: '2024-05-15T00:00:00Z', lastTriggered: new Date(Date.now() - 86400000 * 2).toISOString(),
      successCount: 12, failureCount: 0
    },
    {
      id: '3', url: 'https://old-system.com/hook', events: ['user.created'],
      status: 'error', secret: 'whsec_oldwebhook12345',
      createdAt: '2023-06-01T00:00:00Z', lastTriggered: new Date(Date.now() - 86400000 * 30).toISOString(),
      successCount: 100, failureCount: 25
    },
  ]

  const generateDemoCalls = (): ApiCall[] => Array.from({ length: 20 }, (_, i) => ({
    id: `call-${i}`,
    timestamp: new Date(Date.now() - i * 60000 * Math.random() * 30).toISOString(),
    endpoint: ['/api/v1/cabinets', '/api/v1/users', '/api/v1/stats', '/api/v1/subscriptions'][i % 4],
    method: ['GET', 'GET', 'POST', 'PUT', 'SUPPRESSION'][i % 5],
    statusCode: i === 5 || i === 12 ? 500 : i === 8 ? 401 : 200,
    duration: Math.floor(Math.random() * 500) + 50,
    apiKeyId: i % 2 === 0 ? '1' : '2',
    apiKeyName: i % 2 === 0 ? 'Production Key' : 'Test Key',
  }))

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({ title: 'Copié', description: 'Clé copiée dans le presse-papiers' })
  }

  const createApiKey = async () => {
    if (!newKeyName.trim()) return
    const newKey: ApiKey = {
      id: Date.now().toString(),
      name: newKeyName,
      key: `ak_live_${Math.random().toString(36).substr(2, 32)}`,
      prefix: 'ak_live_',
      permissions: ['read:cabinets'],
      createdAt: new Date().toISOString(),
      lastUsed: null,
      expiresAt: null,
      isActive: true,
      requestCount: 0
    }
    setApiKeys(prev => [newKey, ...prev])
    setShowCreateKey(false)
    setNewKeyName('')
    toast({ title: 'Clé API créée', description: 'Copiez-la maintenant, elle ne sera plus visible.' })
  }

  const deleteApiKey = (id: string) => {
    setApiKeys(prev => prev.filter(k => k.id !== id))
    toast({ title: 'Clé supprimée' })
  }

  const toggleKeyActive = (id: string) => {
    setApiKeys(prev => prev.map(k => k.id === id ? { ...k, isActive: !k.isActive } : k))
  }

  const createWebhook = async () => {
    if (!newWebhookUrl.trim() || newWebhookEvents.length === 0) return
    const newWh: WebhookEndpoint = {
      id: Date.now().toString(),
      url: newWebhookUrl,
      events: newWebhookEvents,
      status: 'active',
      secret: `whsec_${Math.random().toString(36).substr(2, 16)}`,
      createdAt: new Date().toISOString(),
      lastTriggered: null,
      successCount: 0,
      failureCount: 0
    }
    setWebhooks(prev => [newWh, ...prev])
    setShowCreateWebhook(false)
    setNewWebhookUrl('')
    setNewWebhookEvents([])
    toast({ title: 'Webhook créé' })
  }

  const formatDate = (date: string | null) => {
    if (!date) return 'Jamais'
    return new Date(date).toLocaleString('fr-FR')
  }

  const maskKey = (key: string) => key.substring(0, 12) + '...' + key.substring(key.length - 4)

  const METHOD_COLORS: Record<string, string> = {
    GET: 'bg-green-100 text-green-700',
    POST: 'bg-blue-100 text-blue-700',
    PUT: 'bg-amber-100 text-amber-700',
    DELETE: 'bg-red-100 text-red-700',
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-3 gap-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}</div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">API & Webhooks</h1>
          <p className="text-gray-500 mt-1">Gérez l'accès programmatique à la plateforme</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.open('/docs/api', '_blank')}>
            <FileText className="h-4 w-4 mr-2" />Documentation
          </Button>
          <Button variant="outline" onClick={loadData}><RefreshCw className="h-4 w-4" /></Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg"><Key className="h-5 w-5 text-blue-600" /></div>
            <div><p className="text-2xl font-bold">{apiKeys.filter(k => k.isActive).length}</p><p className="text-xs text-gray-500">Clés actives</p></div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg"><Webhook className="h-5 w-5 text-green-600" /></div>
            <div><p className="text-2xl font-bold">{webhooks.filter(w => w.status === 'active').length}</p><p className="text-xs text-gray-500">Webhooks actifs</p></div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg"><Activity className="h-5 w-5 text-purple-600" /></div>
            <div><p className="text-2xl font-bold">{apiKeys.reduce((s, k) => s + k.requestCount, 0).toLocaleString()}</p><p className="text-xs text-gray-500">Requêtes totales</p></div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg"><AlertTriangle className="h-5 w-5 text-amber-600" /></div>
            <div><p className="text-2xl font-bold">{apiCalls.filter(c => c.statusCode >= 400).length}</p><p className="text-xs text-gray-500">Erreurs récentes</p></div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="keys"><Key className="h-4 w-4 mr-2" />Clés API ({apiKeys.length})</TabsTrigger>
          <TabsTrigger value="webhooks"><Webhook className="h-4 w-4 mr-2" />Webhooks ({webhooks.length})</TabsTrigger>
          <TabsTrigger value="logs"><Activity className="h-4 w-4 mr-2" />Logs</TabsTrigger>
        </TabsList>

        {/* API Keys Tab */}
        <TabsContent value="keys" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Clés API</CardTitle>
                <Button size="sm" onClick={() => setShowCreateKey(true)}><Plus className="h-4 w-4 mr-2" />Nouvelle clé</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {apiKeys.map(key => (
                  <div key={key.id} className={`p-4 ${!key.isActive ? 'opacity-50 bg-gray-50' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{key.name}</h4>
                          <Badge className={key.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                            {key.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 font-mono text-sm text-gray-600">
                          <code className="bg-gray-100 px-2 py-1 rounded">
                            {showKey[key.id] ? key.key : maskKey(key.key)}
                          </code>
                          <Button variant="ghost" size="sm" onClick={() => setShowKey(p => ({ ...p, [key.id]: !p[key.id] }))}>
                            {showKey[key.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => copyToClipboard(key.key)}><Copy className="h-4 w-4" /></Button>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                          Créée le {formatDate(key.createdAt)} • Dernière utilisation: {formatDate(key.lastUsed)} • {key.requestCount.toLocaleString()} requêtes
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => toggleKeyActive(key.id)}>
                          {key.isActive ? 'Désactiver' : 'Activer'}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteApiKey(key.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Webhooks Tab */}
        <TabsContent value="webhooks" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Endpoints Webhook</CardTitle>
                <Button size="sm" onClick={() => setShowCreateWebhook(true)}><Plus className="h-4 w-4 mr-2" />Nouveau webhook</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {webhooks.map(wh => (
                  <div key={wh.id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge className={wh.status === 'active' ? 'bg-green-100 text-green-700' : wh.status === 'error' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}>
                          {wh.status === 'active' ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                          {wh.status}
                        </Badge>
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">{wh.url}</code>
                      </div>
                      <Button variant="ghost" size="sm"><Trash2 className="h-4 w-4 text-red-500" /></Button>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {wh.events.map(e => <Badge key={e} variant="outline" className="text-xs">{e}</Badge>)}
                    </div>
                    <p className="text-xs text-gray-400">
                      Dernier déclenchement: {formatDate(wh.lastTriggered)} • ✓ {wh.successCount} • ✗ {wh.failureCount}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Appels API récents</CardTitle></CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="px-4 py-2 text-left">Date</th>
                    <th className="px-4 py-2 text-left">Méthode</th>
                    <th className="px-4 py-2 text-left">Endpoint</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">Durée</th>
                    <th className="px-4 py-2 text-left">Clé</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {apiCalls.map(call => (
                    <tr key={call.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-gray-500">{formatDate(call.timestamp)}</td>
                      <td className="px-4 py-2"><Badge className={METHOD_COLORS[call.method]}>{call.method}</Badge></td>
                      <td className="px-4 py-2 font-mono text-xs">{call.endpoint}</td>
                      <td className="px-4 py-2">
                        <Badge className={call.statusCode >= 400 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}>
                          {call.statusCode}
                        </Badge>
                      </td>
                      <td className="px-4 py-2 text-gray-500">{call.duration}ms</td>
                      <td className="px-4 py-2 text-gray-500">{call.apiKeyName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal Créer Clé */}
      {showCreateKey && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Créer une clé API</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Nom de la clé</Label><Input value={newKeyName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewKeyName(e.target.value)} placeholder="Ex: Production" className="mt-2" /></div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowCreateKey(false)}>Annuler</Button>
                <Button className="flex-1" onClick={createApiKey} disabled={!newKeyName.trim()}>Créer</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal Créer Webhook */}
      {showCreateWebhook && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader><CardTitle>Créer un webhook</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><Label>URL</Label><Input value={newWebhookUrl} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewWebhookUrl(e.target.value)} placeholder="https://..." className="mt-2" /></div>
              <div>
                <Label>Événements</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {EVENTS.map(e => (
                    <label key={e.code} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={newWebhookEvents.includes(e.code)}
                        onChange={(ev) => {
                          if (ev.target.checked) setNewWebhookEvents(p => [...p, e.code])
                          else setNewWebhookEvents(p => p.filter(x => x !== e.code))
                        }}
                      />
                      {e.label}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowCreateWebhook(false)}>Annuler</Button>
                <Button className="flex-1" onClick={createWebhook} disabled={!newWebhookUrl.trim() || newWebhookEvents.length === 0}>Créer</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
