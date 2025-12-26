/**
 * Page d'administration des logs d'audit
 * 
 * Cette page permet aux administrateurs de consulter l'historique complet
 * de toutes les actions sensibles effectuées dans le système.
 * 
 * Fonctionnalités:
 * - Affichage des logs avec pagination
 * - Filtres par action, type d'entité, utilisateur et dates
 * - Statistiques globales (total, par action, par entité)
 * - Expansion des lignes pour voir les détails des changements (JSON)
 * - Export CSV des logs
 * - Vérification des permissions (canViewAuditLogs)
 * 
 * TODO: Intégrer avec le système d'authentification réel (NextAuth ou autre)
 * Pour l'instant, utilise un mockUser avec rôle ADMIN
 */

'use client'

import { useState, useEffect } from 'react'
import { hasPermission } from '@/app/_common/lib/permissions'
import { DataTable, Column } from '@/app/_common/components/ui/DataTable'
import { Button } from '@/app/_common/components/ui/Button'
import { Input } from '@/app/_common/components/ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Card } from '@/app/_common/components/ui/Card'
import { Download, ChevronDown, ChevronRight, AlertCircle } from 'lucide-react'

// Helper function to format dates
const formatDate = (date: Date | string, formatType: 'date' | 'time' | 'datetime' | 'csv' = 'date') => {
  const d = typeof date === 'string' ? new Date(date) : date
  
  if (formatType === 'date') {
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }
  if (formatType === 'time') {
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }
  if (formatType === 'datetime') {
    return d.toLocaleString('fr-FR')
  }
  if (formatType === 'csv') {
    return d.toLocaleString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }
  return d.toLocaleDateString('fr-FR')
}

interface AuditLog {
  id: string
  action: string
  entityType: string
  entityId: string
  changes: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
  createdAt: string
  user?: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
}

interface AuditStats {
  total: number
  byAction: {
    creates: number
    updates: number
    deletes: number
    views: number
    exports: number
    shares: number
    signs: number
    approves: number
    rejects: number
  }
  byEntityType: Array<{
    entityType: string
    count: number
  }>
  topUsers: Array<{
    userId: string
    count: number
  }>
}

const ACTION_LABELS: Record<string, string> = {
  CREATE: 'Création',
  UPDATE: 'Modification',
  DELETE: 'Suppression',
  VIEW: 'Consultation',
  EXPORT: 'Export',
  SHARE: 'Partage',
  SIGN: 'Signature',
  APPROVE: 'Approbation',
  REJECT: 'Rejet',
}

const ACTION_COLORS: Record<string, 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'info'> = {
  CREATE: 'success',
  UPDATE: 'info',
  DELETE: 'destructive',
  VIEW: 'secondary',
  EXPORT: 'warning',
  SHARE: 'info',
  SIGN: 'success',
  APPROVE: 'success',
  REJECT: 'destructive',
}

export default function AuditLogsPage() {
  // TODO: Replace with real authentication when implemented
  // For now, we'll use a mock user with ADMIN role
  const mockUser = {
    role: 'ADMIN',
    isSuperAdmin: false,
    superAdminRole: undefined,
  }
  
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [stats, setStats] = useState<AuditStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  
  // Filters
  const [userFilter, setUserFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [entityTypeFilter, setEntityTypeFilter] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  
  // Pagination
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 50

  // Check permission
  const canView = hasPermission(
    mockUser.role,
    'canViewAuditLogs',
    mockUser.isSuperAdmin,
    mockUser.superAdminRole
  )

  useEffect(() => {
    // Simulate auth check
    setAuthChecked(true)
  }, [])

  useEffect(() => {
    if (authChecked && canView) {
      fetchLogs()
      fetchStats()
    }
  }, [authChecked, canView, page, userFilter, actionFilter, entityTypeFilter, startDate, endDate])

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        limit: pageSize.toString(),
        offset: ((page - 1) * pageSize).toString(),
      })
      
      if (userFilter) params.append('userId', userFilter)
      if (actionFilter) params.append('action', actionFilter)
      if (entityTypeFilter) params.append('entityType', entityTypeFilter)
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)

      const response = await fetch(`/api/audit/logs?${params}`)
      if (!response.ok) throw new Error('Failed to fetch logs')
      
      const data = await response.json()
      setLogs(data.logs || [])
      setTotal(data.total || 0)
    } catch (error) {
      console.error('Error fetching audit logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const params = new URLSearchParams()
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)

      const response = await fetch(`/api/audit/stats?${params}`)
      if (!response.ok) throw new Error('Failed to fetch stats')
      
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error fetching audit stats:', error)
    }
  }

  const handleExport = async () => {
    try {
      const params = new URLSearchParams()
      if (userFilter) params.append('userId', userFilter)
      if (actionFilter) params.append('action', actionFilter)
      if (entityTypeFilter) params.append('entityType', entityTypeFilter)
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)

      const response = await fetch(`/api/audit/logs?${params}&limit=10000`)
      if (!response.ok) throw new Error('Failed to export logs')
      
      const data = await response.json()
      const logs = data.logs || []
      
      // Convert to CSV
      const headers = ['Date', 'Utilisateur', 'Action', 'Type', 'ID Entité', 'Adresse IP']
      const rows = logs.map((log: AuditLog) => [
        formatDate(log.createdAt, 'csv'),
        log.user ? `${log.user.firstName} ${log.user.lastName}` : 'N/A',
        ACTION_LABELS[log.action] || log.action,
        log.entityType,
        log.entityId,
        log.ipAddress || 'N/A',
      ])
      
      const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      const today = new Date().toISOString().split('T')[0]
      link.download = `audit-logs-${today}.csv`
      link.click()
    } catch (error) {
      console.error('Error exporting logs:', error)
    }
  }

  const resetFilters = () => {
    setUserFilter('')
    setActionFilter('')
    setEntityTypeFilter('')
    setStartDate('')
    setEndDate('')
    setPage(1)
  }

  if (!authChecked) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!canView) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Accès refusé</h2>
          <p className="text-muted-foreground">
            Vous n'avez pas la permission de consulter les logs d'audit.
          </p>
        </div>
      </div>
    )
  }

  const columns: Column<AuditLog>[] = [
    {
      key: 'createdAt',
      label: 'Date',
      sortable: true,
      render: (log: AuditLog) => (
        <div className="text-sm">
          {formatDate(log.createdAt, 'date')}
          <div className="text-xs text-muted-foreground">
            {formatDate(log.createdAt, 'time')}
          </div>
        </div>
      ),
    },
    {
      key: 'user',
      label: 'Utilisateur',
      render: (log: AuditLog) => (
        <div className="text-sm">
          {log.user ? (
            <>
              <div className="font-medium">
                {log.user.firstName} {log.user.lastName}
              </div>
              <div className="text-xs text-muted-foreground">{log.user.email}</div>
            </>
          ) : (
            <span className="text-muted-foreground">N/A</span>
          )}
        </div>
      ),
    },
    {
      key: 'action',
      label: 'Action',
      sortable: true,
      render: (log: AuditLog) => (
        <Badge variant={ACTION_COLORS[log.action] || 'default'}>
          {ACTION_LABELS[log.action] || log.action}
        </Badge>
      ),
    },
    {
      key: 'entityType',
      label: 'Type',
      sortable: true,
      render: (log: AuditLog) => <span className="text-sm font-mono">{log.entityType}</span>,
    },
    {
      key: 'entityId',
      label: 'Détails',
      render: (log: AuditLog) => (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground truncate max-w-[150px]">
            {log.entityId}
          </span>
          {log.changes && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation()
                setExpandedRow(expandedRow === log.id ? null : log.id)
              }}
            >
              {expandedRow === log.id ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Logs d'audit</h1>
          <p className="text-muted-foreground mt-1">
            Historique de toutes les actions sensibles effectuées dans le système
          </p>
        </div>
        <Button onClick={handleExport} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exporter les logs
        </Button>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Total d'actions</div>
            <div className="text-2xl font-bold mt-1">{stats.total.toLocaleString()}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Créations</div>
            <div className="text-2xl font-bold mt-1 text-success">
              {stats.byAction.creates.toLocaleString()}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Modifications</div>
            <div className="text-2xl font-bold mt-1 text-info">
              {stats.byAction.updates.toLocaleString()}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Suppressions</div>
            <div className="text-2xl font-bold mt-1 text-destructive">
              {stats.byAction.deletes.toLocaleString()}
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger label="Action">
              <SelectValue placeholder="Toutes les actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Toutes les actions</SelectItem>
              {Object.entries(ACTION_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            type="text"
            label="Type d'entité"
            placeholder="Ex: Client, Document..."
            value={entityTypeFilter}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEntityTypeFilter(e.target.value)}
          />

          <Input
            type="date"
            label="Date de début"
            value={startDate}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)}
          />

          <Input
            type="date"
            label="Date de fin"
            value={endDate}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndDate(e.target.value)}
          />

          <div className="flex items-end">
            <Button variant="outline" onClick={resetFilters} className="w-full">
              Réinitialiser
            </Button>
          </div>
        </div>
      </Card>

      {/* Logs Table */}
      <Card className="p-4">
        <DataTable
          data={logs}
          columns={columns}
          loading={loading}
          emptyMessage="Aucun log d'audit trouvé"
          pagination={{
            page,
            pageSize,
            total,
            onPageChange: setPage,
          }}
        />

        {/* Expanded Row Details */}
        {expandedRow && logs.find(log => log.id === expandedRow)?.changes && (
          <div className="mt-4 p-4 bg-muted rounded-md">
            <h3 className="font-semibold mb-2">Détails des changements</h3>
            <pre className="text-xs overflow-auto max-h-96 bg-background p-3 rounded">
              {JSON.stringify(
                logs.find(log => log.id === expandedRow)?.changes,
                null,
                2
              )}
            </pre>
          </div>
        )}
      </Card>

      {/* Top Entity Types */}
      {stats && stats.byEntityType.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Types d'entités les plus modifiés</h3>
          <div className="space-y-2">
            {stats.byEntityType.slice(0, 5).map((item: { entityType: string; count: number }) => (
              <div key={item.entityType} className="flex items-center justify-between">
                <span className="text-sm font-mono">{item.entityType}</span>
                <Badge variant="secondary">{item.count.toLocaleString()}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
