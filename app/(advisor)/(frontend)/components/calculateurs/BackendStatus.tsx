'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_common/components/ui/Card'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Button } from '@/app/_common/components/ui/Button'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import { 
  Server, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Coffee,
  Database
} from 'lucide-react'

interface BackendInfo {
  key: string
  name: string
  type: 'java' | 'nodejs' | 'typescript'
  port: number | null
  url: string
  healthEndpoint: string
  status: 'online' | 'offline' | 'checking'
  responseTime?: number
}

// URLs configurables via variables d'environnement ou défaut développement
const getBackendUrl = (key: string, defaultPort: number): string => {
  const envVars: Record<string, string | undefined> = {
    patrimoine: process.env.NEXT_PUBLIC_PATRIMOINE_URL,
    'assurance-vie': process.env.NEXT_PUBLIC_ASSURANCE_VIE_URL,
    'per-salaries': process.env.NEXT_PUBLIC_PER_SALARIES_URL,
    immobilier: process.env.NEXT_PUBLIC_IMMOBILIER_URL,
    'prevoyance-tns': process.env.NEXT_PUBLIC_PREVOYANCE_TNS_URL,
    'capacite-emprunt': process.env.NEXT_PUBLIC_CAPACITE_EMPRUNT_URL,
    mensualite: process.env.NEXT_PUBLIC_MENSUALITE_URL,
    'enveloppe-fiscale': process.env.NEXT_PUBLIC_ENVELOPPE_FISCALE_URL,
    'per-tns': process.env.NEXT_PUBLIC_PER_TNS_URL,
    ptz: process.env.NEXT_PUBLIC_PTZ_URL,
    epargne: process.env.NEXT_PUBLIC_EPARGNE_URL,
  }
  return envVars[key] || `http://localhost:${defaultPort}`
}

const BACKENDS: Omit<BackendInfo, 'status' | 'responseTime'>[] = [
  // Java Spring Boot
  {
    key: 'patrimoine',
    name: 'Patrimonial Spring',
    type: 'java',
    port: 8081,
    url: getBackendUrl('patrimoine', 8081),
    healthEndpoint: '/actuator/health',
  },
  {
    key: 'assurance-vie',
    name: 'Assurance-Vie',
    type: 'java',
    port: 8080,
    url: getBackendUrl('assurance-vie', 8080),
    healthEndpoint: '/actuator/health',
  },
  {
    key: 'per-salaries',
    name: 'PER Salariés',
    type: 'java',
    port: 8082,
    url: getBackendUrl('per-salaries', 8082),
    healthEndpoint: '/actuator/health',
  },
  {
    key: 'immobilier',
    name: 'Investissement Immobilier',
    type: 'java',
    port: 8083,
    url: getBackendUrl('immobilier', 8083),
    healthEndpoint: '/actuator/health',
  },
  {
    key: 'prevoyance-tns',
    name: 'Prévoyance TNS',
    type: 'java',
    port: 8084,
    url: getBackendUrl('prevoyance-tns', 8084),
    healthEndpoint: '/actuator/health',
  },
  // Node.js
  {
    key: 'capacite-emprunt',
    name: 'Capacité d\'Emprunt',
    type: 'nodejs',
    port: 3001,
    url: getBackendUrl('capacite-emprunt', 3001),
    healthEndpoint: '/health',
  },
  {
    key: 'mensualite',
    name: 'Mensualité Crédit',
    type: 'nodejs',
    port: 3002,
    url: getBackendUrl('mensualite', 3002),
    healthEndpoint: '/health',
  },
  {
    key: 'enveloppe-fiscale',
    name: 'Enveloppe Fiscale TNS',
    type: 'nodejs',
    port: 3003,
    url: getBackendUrl('enveloppe-fiscale', 3003),
    healthEndpoint: '/health',
  },
  {
    key: 'per-tns',
    name: 'PER TNS',
    type: 'nodejs',
    port: 3004,
    url: getBackendUrl('per-tns', 3004),
    healthEndpoint: '/health',
  },
  {
    key: 'ptz',
    name: 'PTZ 2025',
    type: 'nodejs',
    port: 3005,
    url: getBackendUrl('ptz', 3005),
    healthEndpoint: '/health',
  },
  {
    key: 'epargne',
    name: 'Épargne Flexible',
    type: 'nodejs',
    port: 3006,
    url: getBackendUrl('epargne', 3006),
    healthEndpoint: '/health',
  },
  // TypeScript intégré
  {
    key: 'calculators',
    name: 'Calculateurs TypeScript',
    type: 'typescript',
    port: null,
    url: '/api/advisor/calculators',
    healthEndpoint: '/tax/income',
  },
]

export function BackendStatus() {
  const [backends, setBackends] = useState<BackendInfo[]>(
    BACKENDS.map(b => ({ ...b, status: 'checking' as const }))
  )
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const checkBackendHealth = useCallback(async (backend: Omit<BackendInfo, 'status' | 'responseTime'>): Promise<BackendInfo> => {
    const startTime = Date.now()
    try {
      // Pour les backends externes, on utilise un proxy ou on vérifie directement
      const url = backend.type === 'typescript' 
        ? `${backend.url}${backend.healthEndpoint}`
        : `/api/advisor/patrimoine-spring/health` // Utilise notre proxy pour les backends Java

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      // Pour les backends Java/Node, on vérifie via le proxy existant ou directement
      if (backend.type !== 'typescript' && backend.key === 'patrimoine') {
        const response = await fetch('/api/advisor/patrimoine-spring/health', {
          signal: controller.signal,
        })
        clearTimeout(timeoutId)
        const data = await response.json()
        return {
          ...backend,
          status: data.success ? 'online' : 'offline',
          responseTime: Date.now() - startTime,
        }
      }

      // Pour TypeScript, on fait un test simple
      if (backend.type === 'typescript') {
        const response = await fetch('/api/advisor/calculators/tax/income', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ grossIncome: 50000, deductions: 0, familyQuotient: 1 }),
          signal: controller.signal,
        })
        clearTimeout(timeoutId)
        return {
          ...backend,
          status: response.ok ? 'online' : 'offline',
          responseTime: Date.now() - startTime,
        }
      }

      // Pour les autres backends, on les marque comme offline (pas de proxy configuré)
      return {
        ...backend,
        status: 'offline',
        responseTime: 0,
      }
    } catch (error) {
      return {
        ...backend,
        status: 'offline',
        responseTime: Date.now() - startTime,
      }
    }
  }, [])

  const refreshStatus = useCallback(async () => {
    setLoading(true)
    const results = await Promise.all(
      BACKENDS.map(backend => checkBackendHealth(backend))
    )
    setBackends(results)
    setLastUpdate(new Date())
    setLoading(false)
  }, [checkBackendHealth])

  useEffect(() => {
    refreshStatus()
    const interval = setInterval(refreshStatus, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [refreshStatus])

  const summary = {
    total: backends.length,
    online: backends.filter(b => b.status === 'online').length,
    offline: backends.filter(b => b.status === 'offline').length,
    java: backends.filter(b => b.type === 'java').length,
    nodejs: backends.filter(b => b.type === 'nodejs').length,
    typescript: backends.filter(b => b.type === 'typescript').length,
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'java': return <Coffee className="h-4 w-4" />
      case 'nodejs': return <Server className="h-4 w-4" />
      case 'typescript': return <Database className="h-4 w-4" />
      default: return <Server className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'java': return 'bg-orange-100 text-orange-700'
      case 'nodejs': return 'bg-green-100 text-green-700'
      case 'typescript': return 'bg-blue-100 text-blue-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  if (loading && backends.every(b => b.status === 'checking')) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Statut des Backends Simulateurs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Statut des Backends Simulateurs
          </CardTitle>
          <Button variant="outline" size="sm" onClick={refreshStatus} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold">{summary.total}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{summary.online}</div>
            <div className="text-xs text-green-600">En ligne</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{summary.offline}</div>
            <div className="text-xs text-red-600">Hors ligne</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{summary.java}</div>
            <div className="text-xs text-orange-600">Java</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-700">{summary.nodejs}</div>
            <div className="text-xs text-green-700">Node.js</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{summary.typescript}</div>
            <div className="text-xs text-blue-600">TypeScript</div>
          </div>
        </div>

        {/* Backends List */}
        <div className="space-y-2">
          {backends.map((backend) => (
            <div
              key={backend.key}
              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${
                  backend.status === 'online' ? 'bg-green-500' : 
                  backend.status === 'checking' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'
                }`} />
                <div>
                  <div className="font-medium text-sm">{backend.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {backend.port ? `Port ${backend.port}` : 'Intégré'} • {backend.url}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {backend.responseTime !== undefined && backend.status === 'online' && (
                  <span className="text-xs text-muted-foreground">{backend.responseTime}ms</span>
                )}
                <Badge className={getTypeColor(backend.type)}>
                  {getTypeIcon(backend.type)}
                  <span className="ml-1">{backend.type}</span>
                </Badge>
                <Badge variant={backend.status === 'online' ? 'success' : 'destructive'}>
                  {backend.status === 'online' ? (
                    <><CheckCircle className="h-3 w-3 mr-1" />En ligne</>
                  ) : backend.status === 'checking' ? (
                    <><AlertTriangle className="h-3 w-3 mr-1" />Vérification</>
                  ) : (
                    <><XCircle className="h-3 w-3 mr-1" />Hors ligne</>
                  )}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        {/* Last Update */}
        {lastUpdate && (
          <div className="text-xs text-muted-foreground text-right">
            Dernière mise à jour : {lastUpdate.toLocaleString('fr-FR')}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
