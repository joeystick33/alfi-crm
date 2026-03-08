'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_common/components/ui/Card'
import { Button } from '@/app/_common/components/ui/Button'
import { Badge } from '@/app/_common/components/ui/Badge'
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  CalendarClock,
  Home,
  Lightbulb,
  Loader2,
  PiggyBank,
  RefreshCcw,
  Target,
  TrendingUp,
} from 'lucide-react'
import { api } from '@/app/_common/lib/api-client'
import { formatCurrency } from '@/app/_common/lib/utils'
import { Separator } from '@/app/_common/components/ui/Separator'

export default function OpportunitesDetecteesPage() {
  const [opportunities, setOpportunities] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    type: 'ALL',
    status: 'ACTIF',
    limit: 50,
  })

  useEffect(() => {
    const controller = new AbortController()
    loadOpportunities(filters, controller.signal)
    return () => controller.abort()
  }, [filters])

  const loadOpportunities = async (currentFilters = filters, signal?: AbortSignal) => {
    try {
      setLoading(true)
      setError(null)

      const params: Record<string, string> = {}
      if (currentFilters.type && currentFilters.type !== 'ALL') {
        params.type = currentFilters.type
      }
      if (currentFilters.status && currentFilters.status !== 'ALL') {
        params.status = currentFilters.status
      }
      if (currentFilters.limit) {
        params.limit = String(currentFilters.limit)
      }

      const query = new URLSearchParams(params).toString()
      const endpoint = query ? `/advisor/opportunites?${query}` : '/advisor/opportunites'
      const response = await api.get<Record<string, unknown>>(endpoint, { signal }) as any

      setOpportunities(response?.opportunites || response || [])
      setStats(response?.stats || null)
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return
      }
      console.error('Erreur chargement opportunités:', error)
      setError(error instanceof Error ? error.message : 'Erreur lors du chargement des opportunités')
    } finally {
      setLoading(false)
    }
  }

  const resumeStats = useMemo(() => {
    if (!stats) {
      // Calculate stats from opportunities if not provided by API
      const totalOpportunities = opportunities.length
      const totalPotential = opportunities.reduce((sum: number, o) => sum + (Number(o.estimatedValue) || Number(o.potentialGain) || 0), 0)
      const averageScore = opportunities.length > 0
        ? opportunities.reduce((sum: number, o) => sum + (Number(o.score) || 0), 0) / opportunities.length
        : 0
      const highPriority = opportunities.filter((o) => o.priority === 'HAUTE' || o.priority === 'URGENTE').length

      return {
        totalOpportunities,
        totalPotential,
        averageScore: Math.round(averageScore || 0),
        highPriority,
        topTypes: [],
      }
    }

    const {
      totalOpportunities = 0,
      totalPotential = 0,
      averageScore = 0,
      highPriority = 0,
      byType = {},
    } = stats

    const entries = Object.entries(byType)
      .map(([type, value]) => ({ type, value: value as number }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)

    return {
      totalOpportunities,
      totalPotential,
      averageScore: Math.round(averageScore || 0),
      highPriority,
      topTypes: entries,
    }
  }, [stats, opportunities])

  const getTypeMeta = (type: string) => {
    if (!type) {
      return {
        icon: Lightbulb,
        badge: 'bg-slate-100 text-slate-600',
        label: 'Opportunité',
      }
    }

    const map: Record<string, { icon: typeof Lightbulb; badge: string; label: string }> = {
      PER: {
        icon: PiggyBank,
        badge: 'bg-purple-100 text-purple-700 border border-purple-200',
        label: 'PER',
      },
      PREPARATION_RETRAITE: {
        icon: PiggyBank,
        badge: 'bg-purple-100 text-purple-700 border border-purple-200',
        label: 'Retraite',
      },
      ASSURANCE_VIE: {
        icon: Target,
        badge: 'bg-blue-100 text-blue-700 border border-blue-200',
        label: 'Assurance Vie',
      },
      LIFE_INSURANCE_8Y: {
        icon: Target,
        badge: 'bg-blue-100 text-blue-700 border border-blue-200',
        label: 'AV 8 ans',
      },
      ARBITRAGE_UC_EURO: {
        icon: BarChart3,
        badge: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
        label: 'Arbitrage',
      },
      ASSET_ALLOCATION: {
        icon: BarChart3,
        badge: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
        label: 'Allocation',
      },
      IMMOBILIER: {
        icon: Home,
        badge: 'bg-amber-100 text-amber-700 border border-amber-200',
        label: 'Immobilier',
      },
      REAL_ESTATE_INVESTMENT: {
        icon: Home,
        badge: 'bg-amber-100 text-amber-700 border border-amber-200',
        label: 'Immobilier',
      },
      OPTIMISATION_FISCALE: {
        icon: TrendingUp,
        badge: 'bg-indigo-100 text-indigo-700 border border-indigo-200',
        label: 'Fiscalité',
      },
      TAX_OPTIMIZATION: {
        icon: TrendingUp,
        badge: 'bg-indigo-100 text-indigo-700 border border-indigo-200',
        label: 'Fiscalité',
      },
      PLANIFICATION_SUCCESSION: {
        icon: CalendarClock,
        badge: 'bg-cyan-100 text-cyan-700 border border-cyan-200',
        label: 'Succession',
      },
    }

    return (
      map[type] || {
        icon: Lightbulb,
        badge: 'bg-slate-100 text-slate-600 border border-slate-200',
        label: type,
      }
    )
  }

  const getPriorityBadgeClass = (priority: string) => {
    const map: Record<string, string> = {
      urgent: 'bg-red-100 text-red-700 border border-red-200',
      high: 'bg-orange-100 text-orange-700 border border-orange-200',
      medium: 'bg-blue-100 text-blue-700 border border-blue-200',
      low: 'bg-slate-100 text-slate-700 border border-slate-200',
    }
    return map[(priority || '').toLowerCase()] || map.medium
  }

  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
    }))
  }

  const handleRefresh = () => {
    loadOpportunities(filters)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Opportunités Détectées</h1>
          <p className="text-muted-foreground mt-1">Intelligence commerciale et recommandations personnalisées</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground">
            <Lightbulb className="h-3.5 w-3.5 text-primary" />
            IA Opportunités
          </div>
          <Button variant="outline" size="sm" className="gap-2" onClick={handleRefresh} disabled={loading}>
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCcw className="h-3.5 w-3.5" />}
            Rafraîchir
          </Button>
        </div>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Filtrer par :</span>
            <div className="flex items-center gap-2">
              <Button
                variant={filters.status === 'ACTIF' ? 'primary' : 'outline'}
                size="sm"
                className="rounded-full"
                onClick={() => handleFilterChange({ status: 'ACTIF' })}
              >
                Actives
              </Button>
              <Button
                variant={filters.status === 'ALL' ? 'primary' : 'outline'}
                size="sm"
                className="rounded-full"
                onClick={() => handleFilterChange({ status: 'ALL' })}
              >
                Toutes
              </Button>
            </div>
            <Separator orientation="vertical" className="hidden h-6 md:flex" />
            <span className="hidden text-xs text-muted-foreground md:flex">Score IA ≥ 60 priorisé</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Limiter à</span>
            {[20, 50, 100].map((value) => (
              <Button
                key={value}
                variant={filters.limit === value ? 'secondary' : 'ghost'}
                size="sm"
                className="rounded-full"
                onClick={() => handleFilterChange({ limit: value })}
              >
                {value}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Opportunités</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="inline-flex items-center gap-2 text-2xl font-semibold">
              <Lightbulb className="h-5 w-5 text-primary" />
              {resumeStats?.totalOpportunities ?? 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Recommandées via scoring IA</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Potentiel Estimé</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{formatCurrency(resumeStats?.totalPotential || 0)}</div>
            <p className="text-xs text-emerald-600 mt-1">Valeur financière pondérée</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Score moyen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="inline-flex items-center gap-2 text-2xl font-semibold">
              <TrendingUp className="h-5 w-5 text-amber-500" />
              {resumeStats?.averageScore ?? 0}
              <span className="text-sm text-muted-foreground">/100</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Confiance IA multi-critères</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Priorité haute</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="inline-flex items-center gap-2 text-2xl font-semibold text-orange-600">
              <Target className="h-5 w-5" />
              {resumeStats?.highPriority ?? 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">À traiter sous 7 jours</p>
          </CardContent>
        </Card>
      </div>

      {/* Liste opportunités */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-amber-600" />
            Opportunités par Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((index) => (
                <div key={index} className="h-28 rounded-xl border bg-muted/60 animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-destructive/50 bg-destructive/10 px-6 py-12 text-center">
              <AlertCircle className="h-10 w-10 text-destructive" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-destructive">Erreur de chargement</p>
                <p className="text-xs text-destructive/80">{error}</p>
              </div>
              <Button size="sm" variant="outline" onClick={handleRefresh}>
                Réessayer
              </Button>
            </div>
          ) : opportunities.length === 0 ? (
            <div className="text-center py-16">
              <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-foreground font-medium">Aucune opportunité détectée pour le moment</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Continuez à enregistrer vos interactions : le moteur IA s'enrichit en temps réel.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {opportunities.map((opportunity) => {
                const meta = getTypeMeta(opportunity.type)
                const Icon = meta.icon
                const clientName =
                  opportunity.client?.fullName ||
                  `${opportunity.client?.prenom || ''} ${opportunity.client?.nom || ''}`.trim()
                const clientId = opportunity.clientId || opportunity.client?.id

                return (
                  <div
                    key={opportunity.id}
                    className="rounded-2xl border bg-card p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-lg"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="flex flex-1 items-start gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>

                        <div className="flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-semibold">{opportunity.title}</h3>
                            <Badge className={meta.badge}>{meta.label}</Badge>
                            {opportunity.priority && (
                              <Badge className={getPriorityBadgeClass(opportunity.priority)}>
                                {opportunity.priority.toUpperCase()}
                              </Badge>
                            )}
                            {opportunity.status && (
                              <Badge variant="outline" className="text-xs">
                                {opportunity.status === 'DETECTEE' ? 'À analyser' : opportunity.status}
                              </Badge>
                            )}
                          </div>

                          {opportunity.description && <p className="text-sm text-muted-foreground">{opportunity.description}</p>}

                          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 text-xs text-muted-foreground">
                            <div className="space-y-1">
                              <span className="font-medium text-foreground">Client</span>
                              {clientName ? (
                                <Link
                                  href={clientId ? `/dashboard/clients/${clientId}` : '#'}
                                  className="flex items-center gap-1 text-foreground hover:text-primary"
                                >
                                  {clientName}
                                  <ArrowUpRight className="h-3 w-3" />
                                </Link>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </div>
                            <div className="space-y-1">
                              <span className="font-medium text-foreground">Potentiel estimé</span>
                              <span className="text-sm font-semibold text-emerald-600">
                                {formatCurrency(opportunity.estimatedValue || opportunity.potentialGain || 0)}
                              </span>
                            </div>
                            <div className="space-y-1">
                              <span className="font-medium text-foreground">Score IA</span>
                              <span className="inline-flex items-baseline gap-1 text-sm font-semibold text-blue-600">
                                {Math.round(opportunity.score || 0)}
                                <span className="text-[10px] uppercase text-muted-foreground">/100</span>
                              </span>
                            </div>
                            <div className="space-y-1">
                              <span className="font-medium text-foreground">Confiance</span>
                              <span className="text-sm font-medium">
                                {Math.round(opportunity.confidence || opportunity.probability || 0)}%
                              </span>
                            </div>
                            {opportunity.nextActionDate && (
                              <div className="space-y-1">
                                <span className="font-medium text-foreground">Prochaine action</span>
                                <span className="text-sm">
                                  {new Date(opportunity.nextActionDate).toLocaleDateString('fr-FR', {
                                    day: '2-digit',
                                    month: 'short',
                                  })}
                                </span>
                              </div>
                            )}
                            {opportunity.source && (
                              <div className="space-y-1">
                                <span className="font-medium text-foreground">Origine</span>
                                <span className="text-xs uppercase tracking-wide">{opportunity.source.replace('_', ' ')}</span>
                              </div>
                            )}
                          </div>

                          {opportunity.recommendations?.length ? (
                            <div className="flex flex-wrap gap-2 text-[11px]">
                              {opportunity.recommendations.map((item: string, index: number) => (
                                <Badge key={`${opportunity.id}-${item}-${index}`} variant="outline">
                                  {item}
                                </Badge>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <div className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700">
                          <div className="font-semibold text-sm">{Math.round(opportunity.score || 0)} / 100</div>
                          <p className="mt-1 text-[11px] uppercase tracking-wide">Score IA multi-sources</p>
                        </div>
                        <Button size="sm" className="gap-2" asChild>
                          <Link href={`/dashboard/projets/nouveau?source=opportunity&opportunityId=${opportunity.id}`}>
                            <Target className="h-4 w-4" />
                            Créer projet
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
