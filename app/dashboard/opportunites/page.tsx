'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatCurrency, formatDate, formatPercentage } from '@/lib/utils'
import {
  Plus,
  Search,
  TrendingUp,
  Target,
  DollarSign,
  Percent,
} from 'lucide-react'

export default function OpportunitesPage() {
  const router = useRouter()
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    search: '',
  })
  const [view, setView] = useState<'list' | 'pipeline'>('list')

  // TODO: Replace with real API call
  const isLoading = false
  const opportunites: any[] = []

  const statusConfig = {
    DETECTED: { label: 'Détectée', variant: 'outline' as const },
    QUALIFIED: { label: 'Qualifiée', variant: 'info' as const },
    CONTACTED: { label: 'Contactée', variant: 'info' as const },
    PRESENTED: { label: 'Présentée', variant: 'warning' as const },
    ACCEPTED: { label: 'Acceptée', variant: 'success' as const },
    CONVERTED: { label: 'Convertie', variant: 'success' as const },
    REJECTED: { label: 'Rejetée', variant: 'destructive' as const },
    LOST: { label: 'Perdue', variant: 'destructive' as const },
  }

  const priorityConfig = {
    LOW: { label: 'Basse', variant: 'outline' as const },
    MEDIUM: { label: 'Moyenne', variant: 'secondary' as const },
    HIGH: { label: 'Haute', variant: 'warning' as const },
    URGENT: { label: 'Urgente', variant: 'destructive' as const },
  }

  const filteredOpportunites = opportunites.filter((opp) => {
    const matchesStatus = filters.status === 'all' || opp.status === filters.status
    const matchesPriority = filters.priority === 'all' || opp.priority === filters.priority
    const matchesSearch =
      !filters.search ||
      opp.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      opp.description?.toLowerCase().includes(filters.search.toLowerCase())
    return matchesStatus && matchesPriority && matchesSearch
  })

  // Calculate stats
  const stats = {
    total: opportunites.length,
    qualified: opportunites.filter((o) => o.status === 'QUALIFIED').length,
    totalValue: opportunites.reduce((sum, o) => sum + (o.estimatedValue || 0), 0),
    conversionRate:
      opportunites.length > 0
        ? (opportunites.filter((o) => o.status === 'CONVERTED').length / opportunites.length) * 100
        : 0,
  }

  // Group by status for pipeline view
  const opportunitesByStatus = opportunites.reduce((acc: any, opp: any) => {
    if (!acc[opp.status]) acc[opp.status] = []
    acc[opp.status].push(opp)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Opportunités</h1>
          <p className="text-muted-foreground mt-1">
            Gérez votre pipeline commercial et suivez vos opportunités
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle opportunité
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4" />
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Qualifiées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-info">{stats.qualified}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Valeur totale
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {formatCurrency(stats.totalValue)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Percent className="h-4 w-4" />
              Taux conversion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(stats.conversionRate)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and View Toggle */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex gap-4 flex-1">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher une opportunité..."
                    className="pl-9"
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  />
                </div>
              </div>

              <Select
                value={filters.status}
                onValueChange={(value) => setFilters({ ...filters, status: value })}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="DETECTED">Détectée</SelectItem>
                  <SelectItem value="QUALIFIED">Qualifiée</SelectItem>
                  <SelectItem value="CONTACTED">Contactée</SelectItem>
                  <SelectItem value="PRESENTED">Présentée</SelectItem>
                  <SelectItem value="ACCEPTED">Acceptée</SelectItem>
                  <SelectItem value="CONVERTED">Convertie</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.priority}
                onValueChange={(value) => setFilters({ ...filters, priority: value })}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Priorité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes priorités</SelectItem>
                  <SelectItem value="LOW">Basse</SelectItem>
                  <SelectItem value="MEDIUM">Moyenne</SelectItem>
                  <SelectItem value="HIGH">Haute</SelectItem>
                  <SelectItem value="URGENT">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                variant={view === 'list' ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setView('list')}
              >
                Liste
              </Button>
              <Button
                variant={view === 'pipeline' ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setView('pipeline')}
              >
                Pipeline
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {view === 'list' ? (
        /* List View */
        <div className="space-y-4">
          {isLoading ? (
            [...Array(5)].map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))
          ) : filteredOpportunites.length > 0 ? (
            filteredOpportunites.map((opp) => {
              const statusConf = statusConfig[opp.status as keyof typeof statusConfig]
              const priorityConf = priorityConfig[opp.priority as keyof typeof priorityConfig]

              return (
                <Card
                  key={opp.id}
                  className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
                  onClick={() => router.push(`/dashboard/clients/${opp.clientId}?tab=opportunities`)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold">{opp.name}</h3>
                        {opp.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {opp.description}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        <Badge variant={statusConf.variant}>{statusConf.label}</Badge>
                        <Badge variant={priorityConf.variant}>{priorityConf.label}</Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      {opp.estimatedValue && (
                        <span>Valeur: {formatCurrency(opp.estimatedValue)}</span>
                      )}
                      {opp.score !== null && <span>Score: {opp.score}/100</span>}
                      {opp.confidence !== null && (
                        <span>Confiance: {formatPercentage(opp.confidence)}</span>
                      )}
                      {opp.client && (
                        <span>
                          Client: {opp.client.firstName} {opp.client.lastName}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">
                  Aucune opportunité trouvée
                </p>
                <Button className="mt-4" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Créer la première opportunité
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        /* Pipeline View */
        <div className="grid gap-4 md:grid-cols-4">
          {Object.entries(statusConfig).map(([status, config]) => {
            const opps = opportunitesByStatus[status] || []
            const totalValue = opps.reduce((sum: number, o: any) => sum + (o.estimatedValue || 0), 0)

            return (
              <Card key={status}>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center justify-between">
                    <Badge variant={config.variant}>{config.label}</Badge>
                    <span className="text-muted-foreground">{opps.length}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {totalValue > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(totalValue)}
                      </p>
                    )}
                    {opps.slice(0, 3).map((opp: any) => (
                      <div
                        key={opp.id}
                        className="rounded border p-2 text-xs cursor-pointer hover:bg-accent"
                        onClick={() =>
                          router.push(`/dashboard/clients/${opp.clientId}?tab=opportunities`)
                        }
                      >
                        <p className="font-medium line-clamp-1">{opp.name}</p>
                        {opp.estimatedValue && (
                          <p className="text-muted-foreground">
                            {formatCurrency(opp.estimatedValue)}
                          </p>
                        )}
                      </div>
                    ))}
                    {opps.length > 3 && (
                      <p className="text-xs text-muted-foreground text-center">
                        +{opps.length - 3} autres
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
