'use client'

/**
 * Page SuperAdmin - Quotas Globaux
 * 
 * Gestion des quotas plateforme:
 * - Vue d'ensemble utilisation
 * - Quotas par cabinet
 * - Alertes dépassement
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_common/components/ui/Card'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Button } from '@/app/_common/components/ui/Button'
import { Input } from '@/app/_common/components/ui/Input'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import { Progress } from '@/app/_common/components/ui/Progress'
import {
  BarChart3,
  RefreshCw,
  Search,
  AlertTriangle,
  Users,
  Database,
  HardDrive,
  Zap,
  Building2,
} from 'lucide-react'

interface QuotaStats {
  global: {
    totalUsers: number
    maxUsers: number
    totalClients: number
    maxClients: number
    totalStorage: number
    maxStorage: number
    totalSimulations: number
    maxSimulations: number
  }
  cabinets: {
    id: string
    name: string
    plan: string
    users: { used: number; max: number }
    clients: { used: number; max: number }
    storage: { used: number; max: number }
    simulations: { used: number; max: number }
    alerts: string[]
  }[]
}

const PLAN_COLORS: Record<string, string> = {
  TRIAL: 'bg-gray-100 text-gray-700',
  STARTER: 'bg-blue-100 text-blue-700',
  BUSINESS: 'bg-green-100 text-green-700',
  PREMIUM: 'bg-purple-100 text-purple-700',
  ENTERPRISE: 'bg-orange-100 text-orange-700',
}

export default function QuotasPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<QuotaStats | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/superadmin/quotas', { credentials: 'include' })
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

  const generateDemoStats = (): QuotaStats => ({
    global: {
      totalUsers: 87, maxUsers: 500,
      totalClients: 1456, maxClients: 10000,
      totalStorage: 45.6, maxStorage: 200,
      totalSimulations: 8432, maxSimulations: 50000,
    },
    cabinets: [
      { id: '1', name: 'Cabinet Finance Pro', plan: 'BUSINESS', users: { used: 12, max: 15 }, clients: { used: 890, max: 1000 }, storage: { used: 18, max: 20 }, simulations: { used: 1800, max: 2000 }, alerts: ['Clients proche limite', 'Simulations proche limite'] },
      { id: '2', name: 'Groupe Conseil', plan: 'PREMIUM', users: { used: 25, max: 50 }, clients: { used: 2100, max: 5000 }, storage: { used: 45, max: 100 }, simulations: { used: 5600, max: 10000 }, alerts: [] },
      { id: '3', name: 'SARL Patrimoine', plan: 'STARTER', users: { used: 5, max: 5 }, clients: { used: 198, max: 200 }, storage: { used: 4.8, max: 5 }, simulations: { used: 480, max: 500 }, alerts: ['Limite utilisateurs atteinte', 'Clients proche limite', 'Stockage proche limite'] },
      { id: '4', name: 'Finance Plus', plan: 'TRIAL', users: { used: 2, max: 2 }, clients: { used: 35, max: 50 }, storage: { used: 0.5, max: 1 }, simulations: { used: 45, max: 100 }, alerts: [] },
    ],
  })

  const getPercentage = (used: number, max: number) => max === -1 ? 0 : Math.min((used / max) * 100, 100)
  const getColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500'
    if (percentage >= 75) return 'bg-amber-500'
    return 'bg-green-500'
  }

  const formatStorage = (gb: number) => gb >= 1 ? `${gb.toFixed(1)} GB` : `${(gb * 1024).toFixed(0)} MB`

  const filteredCabinets = stats?.cabinets.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  const alertCount = stats?.cabinets.reduce((s, c) => s + c.alerts.length, 0) || 0

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-4 gap-4">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}</div>
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
          <h1 className="text-3xl font-bold text-gray-900">Quotas Globaux</h1>
          <p className="text-gray-500 mt-1">Surveillance de l'utilisation des ressources</p>
        </div>
        <Button variant="outline" onClick={loadStats}><RefreshCw className="h-4 w-4 mr-2" />Actualiser</Button>
      </div>

      {/* Alertes */}
      {alertCount > 0 && (
        <div className="flex items-center gap-2 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
          <AlertTriangle className="h-5 w-5" />
          <span className="font-medium">{alertCount} alerte(s) de quota sur la plateforme</span>
        </div>
      )}

      {/* Stats globales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg"><Users className="h-5 w-5 text-blue-600" /></div>
              <div>
                <p className="text-sm text-gray-500">Utilisateurs</p>
                <p className="text-2xl font-bold">{stats.global.totalUsers} / {stats.global.maxUsers}</p>
              </div>
            </div>
            <Progress value={getPercentage(stats.global.totalUsers, stats.global.maxUsers)} className="h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg"><Database className="h-5 w-5 text-green-600" /></div>
              <div>
                <p className="text-sm text-gray-500">Clients</p>
                <p className="text-2xl font-bold">{stats.global.totalClients.toLocaleString()} / {stats.global.maxClients.toLocaleString()}</p>
              </div>
            </div>
            <Progress value={getPercentage(stats.global.totalClients, stats.global.maxClients)} className="h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg"><HardDrive className="h-5 w-5 text-purple-600" /></div>
              <div>
                <p className="text-sm text-gray-500">Stockage</p>
                <p className="text-2xl font-bold">{formatStorage(stats.global.totalStorage)} / {formatStorage(stats.global.maxStorage)}</p>
              </div>
            </div>
            <Progress value={getPercentage(stats.global.totalStorage, stats.global.maxStorage)} className="h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-orange-100 rounded-lg"><Zap className="h-5 w-5 text-orange-600" /></div>
              <div>
                <p className="text-sm text-gray-500">Simulations</p>
                <p className="text-2xl font-bold">{stats.global.totalSimulations.toLocaleString()} / {stats.global.maxSimulations.toLocaleString()}</p>
              </div>
            </div>
            <Progress value={getPercentage(stats.global.totalSimulations, stats.global.maxSimulations)} className="h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Rechercher un cabinet..." value={searchQuery} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
      </div>

      {/* Tableau par cabinet */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" />Utilisation par cabinet</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-4 py-3 text-left text-sm font-medium">Cabinet</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Plan</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Utilisateurs</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Clients</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Stockage</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Simulations</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Alertes</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredCabinets.map(cabinet => (
                  <tr key={cabinet.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{cabinet.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3"><Badge className={PLAN_COLORS[cabinet.plan]}>{cabinet.plan}</Badge></td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <div className="text-sm">{cabinet.users.used} / {cabinet.users.max}</div>
                        <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div className={`h-full ${getColor(getPercentage(cabinet.users.used, cabinet.users.max))}`} style={{ width: `${getPercentage(cabinet.users.used, cabinet.users.max)}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <div className="text-sm">{cabinet.clients.used} / {cabinet.clients.max}</div>
                        <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div className={`h-full ${getColor(getPercentage(cabinet.clients.used, cabinet.clients.max))}`} style={{ width: `${getPercentage(cabinet.clients.used, cabinet.clients.max)}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <div className="text-sm">{formatStorage(cabinet.storage.used)} / {formatStorage(cabinet.storage.max)}</div>
                        <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div className={`h-full ${getColor(getPercentage(cabinet.storage.used, cabinet.storage.max))}`} style={{ width: `${getPercentage(cabinet.storage.used, cabinet.storage.max)}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <div className="text-sm">{cabinet.simulations.used} / {cabinet.simulations.max}</div>
                        <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div className={`h-full ${getColor(getPercentage(cabinet.simulations.used, cabinet.simulations.max))}`} style={{ width: `${getPercentage(cabinet.simulations.used, cabinet.simulations.max)}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {cabinet.alerts.length > 0 ? (
                        <Badge className="bg-amber-100 text-amber-700"><AlertTriangle className="h-3 w-3 mr-1" />{cabinet.alerts.length}</Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-700">OK</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
