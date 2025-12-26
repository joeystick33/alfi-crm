 
'use client'

/**
 * Suivi Portefeuilles - Dashboard de Pilotage
 * 
 * Vue consolidée du patrimoine global de tous les clients
 * Permet au conseiller de piloter son activité patrimoniale
 */

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/app/_common/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_common/components/ui/Card'
import { Button } from '@/app/_common/components/ui/Button'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import { Avatar } from '@/app/_common/components/ui/Avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/_common/components/ui/Select'
import {
  Wallet,
  TrendingUp,
  Users,
  CreditCard,
  AlertTriangle,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Download,
  ChevronRight,
  Target,
  Clock,
  Sparkles,
  PieChart,
  Activity,
  Layers,
} from 'lucide-react'
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'

// =============================================================================
// Types
// =============================================================================

interface PortfolioStats {
  totalAUM: number
  totalClients: number
  avgWealthPerClient: number
  netWorth: number
  totalActifs: number
  totalPassifs: number
  growthYTD: number
  growthMTD: number
}

interface AssetAllocation {
  category: string
  value: number
  percentage: number
  color: string
  count: number
}

interface TopClient {
  id: string
  name: string
  patrimoine: number
  growth: number
  lastContact: string
  riskProfile: string
  avatar?: string
}

interface Alert {
  id: string
  type: 'contract_expiry' | 'no_contact' | 'opportunity' | 'risk'
  title: string
  description: string
  clientId: string
  clientName: string
  priority: 'high' | 'medium' | 'low'
  date?: string
}

// =============================================================================
// API Hooks
// =============================================================================

function usePortfolioStats(period: string) {
  return useQuery({
    queryKey: ['portfolio-stats', period],
    queryFn: async () => {
      const res = await fetch(`/api/advisor/portfolio/stats?period=${period}`)
      if (!res.ok) {
        // Return fallback data if API fails
        return {
          totalAUM: 0,
          totalClients: 0,
          avgWealthPerClient: 0,
          netWorth: 0,
          totalActifs: 0,
          totalPassifs: 0,
          growthYTD: 0,
          growthMTD: 0,
        }
      }
      return res.json() as Promise<PortfolioStats>
    },
    staleTime: 2 * 60 * 1000,
    retry: 1,
  })
}

function useAssetAllocation() {
  return useQuery({
    queryKey: ['portfolio-allocation'],
    queryFn: async () => {
      const res = await fetch('/api/advisor/portfolio/allocation')
      if (!res.ok) return [] // Return empty array if API fails
      return res.json() as Promise<AssetAllocation[]>
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
    initialData: [
    ]
  })
}

function useTopClients(limit: number = 10) {
  return useQuery({
    queryKey: ['top-clients', limit],
    queryFn: async () => {
      const res = await fetch(`/api/advisor/portfolio/top-clients?limit=${limit}`)
      if (!res.ok) return [] // Return empty array if API fails
      return res.json() as Promise<TopClient[]>
    },
    staleTime: 2 * 60 * 1000,
    retry: 1,
  })
}

function usePortfolioAlerts() {
  return useQuery({
    queryKey: ['portfolio-alerts'],
    queryFn: async () => {
      const res = await fetch('/api/advisor/portfolio/alerts')
      if (!res.ok) return [] // Return empty array if API fails
      return res.json() as Promise<Alert[]>
    },
    staleTime: 1 * 60 * 1000,
    retry: 1,
  })
}

function useEvolutionData(period: string) {
  return useQuery({
    queryKey: ['portfolio-evolution', period],
    queryFn: async () => {
      const res = await fetch(`/api/advisor/portfolio/evolution?period=${period}`)
      if (!res.ok) return [] // Return empty array if API fails
      return res.json()
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })
}

// =============================================================================
// Helpers
// =============================================================================

function formatCurrency(value: number, compact = false): string {
  // Format manuel pour éviter les différences d'hydration serveur/client
  if (compact && Math.abs(value) >= 1000000) {
    const millions = value / 1000000
    return `${millions.toFixed(1).replace('.', ',')} M €`
  }
  if (compact && Math.abs(value) >= 1000) {
    const thousands = value / 1000
    return `${Math.round(thousands)} k€`
  }
  // Format standard sans Intl pour consistance
  const formatted = Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return `${formatted} €`
}

function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
}

function getAlertIcon(type: string) {
  switch (type) {
    case 'contract_expiry': return Calendar
    case 'no_contact': return Clock
    case 'opportunity': return Sparkles
    case 'risk': return AlertTriangle
    default: return AlertTriangle
  }
}

function getAlertColor(priority: string) {
  switch (priority) {
    case 'high': return 'text-red-600 bg-red-50 border-red-200'
    case 'medium': return 'text-amber-600 bg-amber-50 border-amber-200'
    case 'low': return 'text-blue-600 bg-blue-50 border-blue-200'
    default: return 'text-gray-600 bg-gray-50 border-gray-200'
  }
}

// =============================================================================
// Components
// =============================================================================

function KPICard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  trendLabel,
  color = 'blue'
}: {
  title: string
  value: string | number
  subtitle?: string
  icon: any
  trend?: number
  trendLabel?: string
  color?: 'blue' | 'green' | 'purple' | 'amber' | 'red'
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-emerald-50 text-emerald-600',
    purple: 'bg-purple-50 text-purple-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
  }

  return (
    <Card className="border-gray-200 hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1 tabular-nums">{value}</p>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
            )}
            {trend !== undefined && (
              <div className={cn(
                'flex items-center gap-1 mt-2 text-sm font-medium',
                trend >= 0 ? 'text-emerald-600' : 'text-red-600'
              )}>
                {trend >= 0 ? (
                  <ArrowUpRight className="h-4 w-4" />
                ) : (
                  <ArrowDownRight className="h-4 w-4" />
                )}
                <span>{formatPercent(trend)}</span>
                {trendLabel && (
                  <span className="text-gray-500 font-normal">{trendLabel}</span>
                )}
              </div>
            )}
          </div>
          <div className={cn('p-3 rounded-xl', colorClasses[color])}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function AllocationChart({ data }: { data: AssetAllocation[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <Card className="border-gray-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <PieChart className="h-5 w-5 text-[#7373FF]" />
          Répartition par classe d'actif
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row items-center gap-6">
          <div style={{ width: 192, height: 192 }}>
            <ResponsiveContainer width={192} height={192}>
              <RechartsPieChart>
                <Pie
                  data={data as any[]}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {data.map((entry) => (
                    <Cell key={entry.category} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-3">
            {data.map((item) => (
              <div key={item.category} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.category}</p>
                    <p className="text-xs text-gray-500">{item.count} actifs</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900 tabular-nums">
                    {formatCurrency(item.value, true)}
                  </p>
                  <p className="text-xs text-gray-500">{item.percentage.toFixed(1)}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function EvolutionChart({ data }: { data: any[] }) {
  return (
    <Card className="border-gray-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Activity className="h-5 w-5 text-[#7373FF]" />
          Évolution du patrimoine (12 mois)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ width: '100%', height: 256 }}>
          <ResponsiveContainer width="100%" height={256}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorPatrimoine" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7373FF" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#7373FF" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#6b7280' }}
                tickFormatter={(value) => formatCurrency(value, true)}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
              />
              <Area
                type="monotone"
                dataKey="patrimoine"
                stroke="#7373FF"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorPatrimoine)"
                name="Patrimoine net"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

function TopClientsTable({ clients, onViewClient }: { clients: TopClient[], onViewClient: (id: string) => void }) {
  return (
    <Card className="border-gray-200">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-[#7373FF]" />
            Top clients par patrimoine
          </CardTitle>
          <Button variant="ghost" size="sm" className="text-[#7373FF]">
            Voir tous
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-gray-100">
          {clients.map((client, index) => (
            <div
              key={client.id}
              className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => onViewClient(client.id)}
            >
              <span className="text-sm font-medium text-gray-400 w-5 tabular-nums">
                {index + 1}
              </span>
              <Avatar
                name={client.name}
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{client.name}</p>
                <p className="text-xs text-gray-500">{client.riskProfile}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900 tabular-nums">
                  {formatCurrency(client.patrimoine, true)}
                </p>
                <p className={cn(
                  'text-xs font-medium',
                  client.growth >= 0 ? 'text-emerald-600' : 'text-red-600'
                )}>
                  {formatPercent(client.growth)}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function AlertsPanel({ alerts, onViewClient }: { alerts: Alert[], onViewClient: (id: string) => void }) {
  const sortedAlerts = useMemo(() => {
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    return [...alerts].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
  }, [alerts])

  return (
    <Card className="border-gray-200">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Alertes & opportunités
            <Badge variant="secondary" className="ml-2">{alerts.length}</Badge>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
          {sortedAlerts.map((alert) => {
            const Icon = getAlertIcon(alert.type)
            const colorClass = getAlertColor(alert.priority)
            
            return (
              <div
                key={alert.id}
                className="px-5 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => onViewClient(alert.clientId)}
              >
                <div className="flex items-start gap-3">
                  <div className={cn('p-2 rounded-lg border', colorClass)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900">{alert.title}</p>
                      <Badge 
                        variant={alert.priority === 'high' ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {alert.priority === 'high' ? 'Urgent' : alert.priority === 'medium' ? 'À traiter' : 'Info'}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{alert.description}</p>
                    <p className="text-xs text-[#7373FF] font-medium mt-1">{alert.clientName}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 mt-1" />
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// =============================================================================
// Main Component
// =============================================================================

export default function SuiviPortefeuillePage() {
  const router = useRouter()
  const [period, setPeriod] = useState('ytd')
  
  const { data: stats, isLoading: loadingStats, refetch: refetchStats } = usePortfolioStats(period)
  const { data: allocation, isLoading: loadingAllocation } = useAssetAllocation()
  const { data: topClients, isLoading: loadingClients } = useTopClients(8)
  const { data: alerts, isLoading: loadingAlerts } = usePortfolioAlerts()
  const { data: evolution, isLoading: loadingEvolution } = useEvolutionData(period)

  const handleViewClient = (clientId: string) => {
    router.push(`/dashboard/clients/${clientId}`)
  }

  const handleExport = () => {
    // TODO: Implement export
    alert('Export en cours de développement')
  }

  // Ne pas bloquer tout l'affichage - montrer ce qui est disponible

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-[#7373FF] to-[#5c5ce6] rounded-xl shadow-lg shadow-[#7373FF]/20">
              <Layers className="h-6 w-6 text-white" />
            </div>
            Suivi Portefeuilles
          </h1>
          <p className="text-gray-500 mt-1">
            Vue consolidée du patrimoine de vos {stats?.totalClients} clients
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mtd">Ce mois</SelectItem>
              <SelectItem value="qtd">Ce trimestre</SelectItem>
              <SelectItem value="ytd">Cette année</SelectItem>
              <SelectItem value="1y">12 mois</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => refetchStats()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {loadingStats ? (
          <>
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="border-gray-200">
                <CardContent className="p-5">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-32 mb-1" />
                  <Skeleton className="h-3 w-20" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          <>
            <KPICard
              title="Encours total (AUM)"
              value={formatCurrency(stats?.totalAUM || 0, true)}
              subtitle={`${stats?.totalClients || 0} clients suivis`}
              icon={Wallet}
              trend={stats?.growthYTD}
              trendLabel="YTD"
              color="blue"
            />
            <KPICard
              title="Patrimoine net"
              value={formatCurrency(stats?.netWorth || 0, true)}
              subtitle="Actifs - Passifs"
              icon={TrendingUp}
              trend={stats?.growthMTD}
              trendLabel="ce mois"
              color="green"
            />
            <KPICard
              title="Ticket moyen"
              value={formatCurrency(stats?.avgWealthPerClient || 0, true)}
              subtitle="Par client"
              icon={Target}
              color="purple"
            />
            <KPICard
              title="Passifs totaux"
              value={formatCurrency(stats?.totalPassifs || 0, true)}
              subtitle="Crédits & dettes"
              icon={CreditCard}
              color="amber"
            />
          </>
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {loadingAllocation ? (
            <Card className="border-gray-200">
              <CardContent className="py-8">
                <Skeleton className="h-48 w-full" />
              </CardContent>
            </Card>
          ) : allocation && allocation.length > 0 ? (
            <AllocationChart data={allocation} />
          ) : (
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-base">Répartition par classe d'actif</CardTitle>
              </CardHeader>
              <CardContent className="py-8 text-center text-gray-500">
                Aucun actif enregistré
              </CardContent>
            </Card>
          )}
          
          {loadingEvolution ? (
            <Card className="border-gray-200">
              <CardContent className="py-8">
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          ) : evolution && evolution.length > 0 ? (
            <EvolutionChart data={evolution} />
          ) : (
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-base">Évolution du patrimoine</CardTitle>
              </CardHeader>
              <CardContent className="py-8 text-center text-gray-500">
                Données d'évolution non disponibles
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {loadingClients ? (
            <Card className="border-gray-200">
              <CardContent className="py-8">
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          ) : topClients && topClients.length > 0 ? (
            <TopClientsTable 
              clients={topClients} 
              onViewClient={handleViewClient}
            />
          ) : (
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-base">Top clients</CardTitle>
              </CardHeader>
              <CardContent className="py-8 text-center text-gray-500">
                Aucun client avec patrimoine
              </CardContent>
            </Card>
          )}
          
          {loadingAlerts ? (
            <Card className="border-gray-200">
              <CardContent className="py-8">
                <Skeleton className="h-48 w-full" />
              </CardContent>
            </Card>
          ) : alerts && alerts.length > 0 ? (
            <AlertsPanel 
              alerts={alerts} 
              onViewClient={handleViewClient}
            />
          ) : (
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-base">Alertes & opportunités</CardTitle>
              </CardHeader>
              <CardContent className="py-8 text-center text-gray-500">
                <div className="flex flex-col items-center gap-2">
                  <Sparkles className="h-8 w-8 text-gray-300" />
                  <p>Aucune alerte pour le moment</p>
                  <p className="text-xs">Tout va bien ! 🎉</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
