'use client'

/**
 * Page SuperAdmin - Logs Système
 * 
 * Journal des événements système:
 * - Logs applicatifs
 * - Erreurs
 * - Accès API
 * - Événements de sécurité
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_common/components/ui/Card'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Button } from '@/app/_common/components/ui/Button'
import { Input } from '@/app/_common/components/ui/Input'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import {
  FileText,
  RefreshCw,
  Search,
  Download,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Server,
  Shield,
  Database,
  Globe,
} from 'lucide-react'

interface LogEntry {
  id: string
  timestamp: string
  level: 'INFO' | 'WARN' | 'ERREUR' | 'DEBUG'
  category: 'SYSTEME' | 'SECURITY' | 'API' | 'DATABASE' | 'AUTH'
  message: string
  details?: Record<string, unknown>
  source?: string
  userId?: string
  cabinetId?: string
  requestId?: string
  duration?: number
}

const LEVEL_CONFIG: Record<string, { color: string; icon: typeof Info; bgColor: string }> = {
  INFO: { color: 'text-blue-600', icon: Info, bgColor: 'bg-blue-50' },
  WARN: { color: 'text-amber-600', icon: AlertTriangle, bgColor: 'bg-amber-50' },
  ERROR: { color: 'text-red-600', icon: XCircle, bgColor: 'bg-red-50' },
  DEBUG: { color: 'text-gray-600', icon: CheckCircle, bgColor: 'bg-gray-50' },
}

const CATEGORY_CONFIG: Record<string, { icon: typeof Server; color: string }> = {
  SYSTEM: { icon: Server, color: 'text-gray-600' },
  SECURITY: { icon: Shield, color: 'text-purple-600' },
  API: { icon: Globe, color: 'text-blue-600' },
  DATABASE: { icon: Database, color: 'text-green-600' },
  AUTH: { icon: Shield, color: 'text-orange-600' },
}

export default function LogsPage() {
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [perPage] = useState(50)
  const [searchQuery, setSearchQuery] = useState('')
  const [levelFilter, setLevelFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [expandedLog, setExpandedLog] = useState<string | null>(null)

  useEffect(() => {
    loadLogs()
  }, [page, levelFilter, categoryFilter])

  const loadLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        perPage: perPage.toString(),
        ...(levelFilter !== 'all' && { level: levelFilter }),
        ...(categoryFilter !== 'all' && { category: categoryFilter }),
        ...(searchQuery && { search: searchQuery }),
      })
      
      const response = await fetch(`/api/superadmin/logs?${params}`, { credentials: 'include' })
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs)
        setTotalCount(data.totalCount)
      } else {
        setLogs(generateDemoLogs())
        setTotalCount(500)
      }
    } catch {
      setLogs(generateDemoLogs())
      setTotalCount(500)
    } finally {
      setLoading(false)
    }
  }

  const generateDemoLogs = (): LogEntry[] => {
    const levels: LogEntry['level'][] = ['INFO', 'INFO', 'INFO', 'WARN', 'ERREUR', 'DEBUG']
    const categories: LogEntry['category'][] = ['SYSTEME', 'API', 'AUTH', 'DATABASE', 'SECURITY']
    const messages = [
      'Cabinet créé avec succès',
      'Utilisateur connecté',
      'Simulation retraite effectuée',
      'Export PDF généré',
      'Tentative de connexion échouée',
      'Quota dépassé',
      'Sauvegarde automatique',
      'Migration base de données',
      'Webhook envoyé',
      'Session expirée',
    ]
    
    return Array.from({ length: 50 }, (_, i) => ({
      id: `log-${i}`,
      timestamp: new Date(Date.now() - i * 60000 * Math.random() * 10).toISOString(),
      level: levels[Math.floor(Math.random() * levels.length)],
      category: categories[Math.floor(Math.random() * categories.length)],
      message: messages[Math.floor(Math.random() * messages.length)],
      source: ['api/organizations', 'api/auth', 'api/simulations', 'system/cron'][Math.floor(Math.random() * 4)],
      requestId: `req_${Math.random().toString(36).substr(2, 9)}`,
      duration: Math.floor(Math.random() * 500),
      details: i % 3 === 0 ? { userId: 'user-123', action: 'create' } : undefined,
    }))
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    })
  }

  const exportLogs = () => {
    const csv = logs.map(l => `${l.timestamp},${l.level},${l.category},"${l.message}",${l.source || ''}`).join('\n')
    const blob = new Blob([`Timestamp,Level,Category,Message,Source\n${csv}`], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `logs-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  // Stats
  const errorCount = logs.filter(l => l.level === 'ERREUR').length
  const warnCount = logs.filter(l => l.level === 'WARN').length
  const avgDuration = logs.filter(l => l.duration).reduce((s, l) => s + (l.duration || 0), 0) / logs.filter(l => l.duration).length

  const totalPages = Math.ceil(totalCount / perPage)

  if (loading && logs.length === 0) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-4 gap-4">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20" />)}</div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Logs Système</h1>
          <p className="text-gray-500 mt-1">Journal des événements de la plateforme</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportLogs}><Download className="h-4 w-4 mr-2" />Exporter</Button>
          <Button variant="outline" onClick={loadLogs}><RefreshCw className="h-4 w-4" /></Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg"><FileText className="h-5 w-5 text-blue-600" /></div>
            <div><p className="text-2xl font-bold">{totalCount}</p><p className="text-xs text-gray-500">Total logs</p></div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg"><XCircle className="h-5 w-5 text-red-600" /></div>
            <div><p className="text-2xl font-bold">{errorCount}</p><p className="text-xs text-gray-500">Erreurs</p></div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg"><AlertTriangle className="h-5 w-5 text-amber-600" /></div>
            <div><p className="text-2xl font-bold">{warnCount}</p><p className="text-xs text-gray-500">Warnings</p></div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg"><Clock className="h-5 w-5 text-green-600" /></div>
            <div><p className="text-2xl font-bold">{avgDuration ? Math.round(avgDuration) : 0}ms</p><p className="text-xs text-gray-500">Temps moyen</p></div>
          </div>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && loadLogs()}
                />
              </div>
            </div>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-32"><SelectValue placeholder="Niveau" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="ERROR">Erreurs</SelectItem>
                <SelectItem value="WARN">Warnings</SelectItem>
                <SelectItem value="INFO">Info</SelectItem>
                <SelectItem value="DEBUG">Debug</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Catégorie" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="SYSTEM">Système</SelectItem>
                <SelectItem value="API">API</SelectItem>
                <SelectItem value="AUTH">Auth</SelectItem>
                <SelectItem value="DATABASE">Database</SelectItem>
                <SelectItem value="SECURITY">Sécurité</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Événements ({logs.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y font-mono text-sm">
            {logs.map(log => {
              const levelConfig = LEVEL_CONFIG[log.level]
              const LevelIcon = levelConfig.icon
              const categoryConfig = CATEGORY_CONFIG[log.category]
              const CategoryIcon = categoryConfig.icon
              
              return (
                <div
                  key={log.id}
                  className={`p-3 hover:bg-gray-50 cursor-pointer ${levelConfig.bgColor}`}
                  onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 ${levelConfig.color}`}><LevelIcon className="h-4 w-4" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-gray-400 text-xs">{formatTimestamp(log.timestamp)}</span>
                        <Badge variant="outline" className={`text-xs ${levelConfig.color}`}>{log.level}</Badge>
                        <Badge variant="outline" className="text-xs flex items-center gap-1">
                          <CategoryIcon className="h-3 w-3" />{log.category}
                        </Badge>
                        {log.duration && <span className="text-gray-400 text-xs">{log.duration}ms</span>}
                      </div>
                      <p className="text-gray-900 mt-1 break-all">{log.message}</p>
                      {log.source && <p className="text-gray-400 text-xs mt-1">{log.source}</p>}
                      
                      {expandedLog === log.id && log.details && (
                        <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          
          {/* Pagination */}
          <div className="p-4 border-t flex items-center justify-between">
            <p className="text-sm text-gray-500">Page {page} sur {totalPages}</p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
