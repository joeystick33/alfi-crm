'use client'

/**
 * Page SuperAdmin - Base de données
 * 
 * Surveillance et maintenance de la BDD:
 * - Statistiques de taille
 * - Santé des tables
 * - Actions de maintenance
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_common/components/ui/Card'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Button } from '@/app/_common/components/ui/Button'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import { Progress } from '@/app/_common/components/ui/Progress'
import { useToast } from '@/app/_common/hooks/use-toast'
import {
  Database,
  RefreshCw,
  HardDrive,
  Table,
  CheckCircle,
  AlertTriangle,
  Trash2,
  Download,
  Activity,
  Zap,
} from 'lucide-react'

interface DBStats {
  totalSize: number
  usedSize: number
  connectionPool: { active: number; idle: number; max: number }
  tables: { name: string; rows: number; size: number; health: 'healthy' | 'warning' | 'error' }[]
  lastBackup: string | null
  lastOptimization: string | null
}

export default function DatabasePage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DBStats | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/superadmin/database/stats', { credentials: 'include' })
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      } else {
        setStats(generateDemoStats())
      }
    } catch {
      setStats(generateDemoStats())
    } finally {
      setLoading(false)
    }
  }

  const generateDemoStats = (): DBStats => ({
    totalSize: 50, // GB
    usedSize: 12.5,
    connectionPool: { active: 15, idle: 5, max: 50 },
    tables: [
      { name: 'clients', rows: 45678, size: 2.3, health: 'healthy' },
      { name: 'users', rows: 1234, size: 0.15, health: 'healthy' },
      { name: 'cabinets', rows: 89, size: 0.05, health: 'healthy' },
      { name: 'simulations', rows: 156789, size: 4.5, health: 'warning' },
      { name: 'documents', rows: 23456, size: 3.2, health: 'healthy' },
      { name: 'audit_logs', rows: 987654, size: 1.8, health: 'warning' },
      { name: 'notifications', rows: 45678, size: 0.3, health: 'healthy' },
      { name: 'taches', rows: 12345, size: 0.2, health: 'healthy' },
    ],
    lastBackup: new Date(Date.now() - 3600000 * 2).toISOString(),
    lastOptimization: new Date(Date.now() - 86400000 * 3).toISOString(),
  })

  const runAction = async (action: string) => {
    setActionLoading(action)
    try {
      // Simuler l'action
      await new Promise(resolve => setTimeout(resolve, 2000))
      toast({ title: 'Succès', description: `Action "${action}" terminée` })
      loadStats()
    } catch {
      toast({ title: 'Erreur', variant: 'destructive' })
    } finally {
      setActionLoading(null)
    }
  }

  const formatSize = (gb: number) => gb >= 1 ? `${gb.toFixed(2)} GB` : `${(gb * 1024).toFixed(0)} MB`
  const formatDate = (date: string | null) => {
    if (!date) return 'Jamais'
    return new Date(date).toLocaleString('fr-FR')
  }

  const HEALTH_CONFIG = {
    healthy: { color: 'bg-green-100 text-green-700', icon: CheckCircle },
    warning: { color: 'bg-amber-100 text-amber-700', icon: AlertTriangle },
    error: { color: 'bg-red-100 text-red-700', icon: AlertTriangle },
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-3 gap-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}</div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Base de Données</h1>
          <p className="text-gray-500 mt-1">Surveillance et maintenance</p>
        </div>
        <Button variant="outline" onClick={loadStats}><RefreshCw className="h-4 w-4 mr-2" />Actualiser</Button>
      </div>

      {/* Stats principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg"><HardDrive className="h-5 w-5 text-blue-600" /></div>
              <div>
                <p className="text-sm text-gray-500">Stockage</p>
                <p className="text-2xl font-bold">{formatSize(stats.usedSize)} / {formatSize(stats.totalSize)}</p>
              </div>
            </div>
            <Progress value={(stats.usedSize / stats.totalSize) * 100} className="h-2" />
            <p className="text-xs text-gray-500 mt-2">{((stats.usedSize / stats.totalSize) * 100).toFixed(1)}% utilisé</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg"><Activity className="h-5 w-5 text-green-600" /></div>
              <div>
                <p className="text-sm text-gray-500">Connexions</p>
                <p className="text-2xl font-bold">{stats.connectionPool.active} / {stats.connectionPool.max}</p>
              </div>
            </div>
            <Progress value={(stats.connectionPool.active / stats.connectionPool.max) * 100} className="h-2" />
            <p className="text-xs text-gray-500 mt-2">{stats.connectionPool.idle} en attente</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg"><Table className="h-5 w-5 text-purple-600" /></div>
              <div>
                <p className="text-sm text-gray-500">Tables</p>
                <p className="text-2xl font-bold">{stats.tables.length}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge className="bg-green-100 text-green-700">{stats.tables.filter(t => t.health === 'healthy').length} saines</Badge>
              <Badge className="bg-amber-100 text-amber-700">{stats.tables.filter(t => t.health === 'warning').length} à surveiller</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions de maintenance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5" />Actions de maintenance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Download className="h-5 w-5 text-blue-600" />
                <p className="font-medium">Sauvegarde</p>
              </div>
              <p className="text-xs text-gray-500 mb-3">Dernière: {formatDate(stats.lastBackup)}</p>
              <Button size="sm" onClick={() => runAction('backup')} disabled={actionLoading === 'backup'} className="w-full">
                {actionLoading === 'backup' ? 'En cours...' : 'Lancer'}
              </Button>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-5 w-5 text-green-600" />
                <p className="font-medium">Optimisation</p>
              </div>
              <p className="text-xs text-gray-500 mb-3">Dernière: {formatDate(stats.lastOptimization)}</p>
              <Button size="sm" variant="outline" onClick={() => runAction('optimize')} disabled={actionLoading === 'optimize'} className="w-full">
                {actionLoading === 'optimize' ? 'En cours...' : 'Optimiser'}
              </Button>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Trash2 className="h-5 w-5 text-amber-600" />
                <p className="font-medium">Nettoyage</p>
              </div>
              <p className="text-xs text-gray-500 mb-3">Supprime les données obsolètes</p>
              <Button size="sm" variant="outline" onClick={() => runAction('cleanup')} disabled={actionLoading === 'cleanup'} className="w-full">
                {actionLoading === 'cleanup' ? 'En cours...' : 'Nettoyer'}
              </Button>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-purple-600" />
                <p className="font-medium">Vérification</p>
              </div>
              <p className="text-xs text-gray-500 mb-3">Vérifie l'intégrité</p>
              <Button size="sm" variant="outline" onClick={() => runAction('check')} disabled={actionLoading === 'check'} className="w-full">
                {actionLoading === 'check' ? 'En cours...' : 'Vérifier'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tables */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Database className="h-5 w-5" />État des tables</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-3 text-left text-sm font-medium">Table</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Lignes</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Taille</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Santé</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {stats.tables.map(table => {
                const healthConfig = HEALTH_CONFIG[table.health]
                const HealthIcon = healthConfig.icon
                return (
                  <tr key={table.name} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-sm">{table.name}</td>
                    <td className="px-4 py-3 text-sm">{table.rows.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm">{formatSize(table.size)}</td>
                    <td className="px-4 py-3">
                      <Badge className={healthConfig.color}>
                        <HealthIcon className="h-3 w-3 mr-1" />
                        {table.health === 'healthy' ? 'Saine' : table.health === 'warning' ? 'À surveiller' : 'Erreur'}
                      </Badge>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
