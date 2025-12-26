'use client'

/**
 * Page SuperAdmin - Activité Récente
 * 
 * Journal d'activité en temps réel de la plateforme:
 * - Logs d'audit
 * - Événements système
 * - Actions des utilisateurs
 * - Alertes
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/_common/components/ui/Card'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Button } from '@/app/_common/components/ui/Button'
import { Input } from '@/app/_common/components/ui/Input'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import {
  Activity,
  Search,
  RefreshCw,
  Building2,
  Users,
  Settings,
  Shield,
  CreditCard,
  Database,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Download,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

interface AuditLogEntry {
  id: string
  createdAt: string
  action: string
  entityType: string
  entityId: string
  cabinetName?: string
  actorName?: string
  actorType?: string
  description?: string
  changes?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}

const ACTION_CONFIG: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; label: string }> = {
  CREATE: { icon: CheckCircle, color: 'text-green-600 bg-green-50', label: 'Création' },
  UPDATE: { icon: Settings, color: 'text-blue-600 bg-blue-50', label: 'Modification' },
  DELETE: { icon: XCircle, color: 'text-red-600 bg-red-50', label: 'Suppression' },
  LOGIN: { icon: Shield, color: 'text-purple-600 bg-purple-50', label: 'Connexion' },
  LOGOUT: { icon: Shield, color: 'text-gray-600 bg-gray-50', label: 'Déconnexion' },
  EXPORT: { icon: Download, color: 'text-orange-600 bg-orange-50', label: 'Export' },
  VIEW: { icon: Eye, color: 'text-cyan-600 bg-cyan-50', label: 'Consultation' },
  SUSPEND: { icon: AlertTriangle, color: 'text-amber-600 bg-amber-50', label: 'Suspension' },
  ACTIVATE: { icon: CheckCircle, color: 'text-green-600 bg-green-50', label: 'Activation' },
  PAYMENT: { icon: CreditCard, color: 'text-emerald-600 bg-emerald-50', label: 'Paiement' },
}

const ENTITY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Cabinet: Building2,
  User: Users,
  Client: Database,
  Subscription: CreditCard,
  SuperAdmin: Shield,
  Feature: Settings,
}

export default function ActivityPage() {
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [perPage] = useState(20)
  
  // Filtres
  const [searchQuery, setSearchQuery] = useState('')
  const [actionFilter, setActionFilter] = useState('all')
  const [entityFilter, setEntityFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')

  useEffect(() => {
    loadLogs()
  }, [page, actionFilter, entityFilter, dateFilter])

  const loadLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        perPage: perPage.toString(),
        ...(actionFilter !== 'all' && { action: actionFilter }),
        ...(entityFilter !== 'all' && { entityType: entityFilter }),
        ...(dateFilter !== 'all' && { dateRange: dateFilter }),
        ...(searchQuery && { search: searchQuery }),
      })
      
      const response = await fetch(`/api/superadmin/activity?${params}`, {
        credentials: 'include',
      })
      
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs || [])
        setTotalCount(data.totalCount || 0)
      } else {
        console.error('Erreur API activity:', response.status)
        setLogs([])
        setTotalCount(0)
      }
    } catch (error) {
      console.error('Erreur chargement activité:', error)
      setLogs([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    if (diff < 60000) return 'À l\'instant'
    if (diff < 3600000) return `Il y a ${Math.floor(diff / 60000)} min`
    if (diff < 86400000) return `Il y a ${Math.floor(diff / 3600000)} h`
    
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const totalPages = Math.ceil(totalCount / perPage)

  if (loading && logs.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-20" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Activité Récente</h1>
          <p className="text-gray-500 mt-1">Journal d'audit de la plateforme</p>
        </div>
        <button onClick={loadLogs} disabled={loading} className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-xl border border-gray-200 transition-all">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
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
            
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes actions</SelectItem>
                <SelectItem value="CREATE">Création</SelectItem>
                <SelectItem value="UPDATE">Modification</SelectItem>
                <SelectItem value="DELETE">Suppression</SelectItem>
                <SelectItem value="LOGIN">Connexion</SelectItem>
                <SelectItem value="EXPORT">Export</SelectItem>
              </SelectContent>
            </Select>

            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Entité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes entités</SelectItem>
                <SelectItem value="Cabinet">Cabinet</SelectItem>
                <SelectItem value="User">Utilisateur</SelectItem>
                <SelectItem value="Client">Client</SelectItem>
                <SelectItem value="Feature">Feature</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tout</SelectItem>
                <SelectItem value="today">Aujourd'hui</SelectItem>
                <SelectItem value="week">Cette semaine</SelectItem>
                <SelectItem value="month">Ce mois</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards - Premium Design */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Créations</p>
              <p className="text-2xl font-bold text-gray-900">{logs.filter(l => l.action === 'CREATION').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Settings className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Modifications</p>
              <p className="text-2xl font-bold text-gray-900">{logs.filter(l => l.action === 'MODIFICATION').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Connexions</p>
              <p className="text-2xl font-bold text-gray-900">{logs.filter(l => l.action === 'LOGIN').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center shadow-lg shadow-rose-500/20">
              <XCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Suppressions</p>
              <p className="text-2xl font-bold text-gray-900">{logs.filter(l => l.action === 'SUPPRESSION').length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des logs */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Journal d'activité
          </CardTitle>
          <CardDescription>
            {totalCount} événements au total
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {logs.map((log) => {
              const actionConfig = ACTION_CONFIG[log.action] || ACTION_CONFIG.VIEW
              const ActionIcon = actionConfig.icon
              const EntityIcon = ENTITY_ICONS[log.entityType] || Database
              
              return (
                <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${actionConfig.color}`}>
                      <ActionIcon className="h-4 w-4" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {actionConfig.label}
                        </Badge>
                        <div className="flex items-center gap-1 text-gray-500">
                          <EntityIcon className="h-3 w-3" />
                          <span className="text-xs">{log.entityType}</span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-900">
                        {log.actorName && (
                          <span className={`font-medium ${log.actorType === 'superadmin' ? 'text-purple-600' : ''}`}>{log.actorName}</span>
                        )}
                        {' '}
                        <span className="text-gray-600">
                          {log.action === 'CREATION' && 'a créé'}
                          {log.action === 'MODIFICATION' && 'a modifié'}
                          {log.action === 'SUPPRESSION' && 'a supprimé'}
                          {log.action === 'LOGIN' && 's\'est connecté à'}
                          {log.action === 'LOGOUT' && 's\'est déconnecté de'}
                          {log.action === 'EXPORT' && 'a exporté'}
                          {log.action === 'CONSULTATION' && 'a consulté'}
                        </span>
                        {' '}
                        {log.cabinetName && (
                          <span className="font-medium text-blue-600">{log.cabinetName}</span>
                        )}
                      </p>
                      
                      {log.ipAddress && (
                        <p className="text-xs text-gray-400 mt-1">
                          IP: {log.ipAddress}
                        </p>
                      )}
                    </div>
                    
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTimestamp(log.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          
          {/* Pagination */}
          <div className="p-4 border-t flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Page {page} sur {totalPages} ({totalCount} résultats)
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
