 
"use client"

import { useState } from 'react'
import { Button } from '@/app/_common/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_common/components/ui/Card'
import { Badge } from '@/app/_common/components/ui/Badge'
import { EmptyState } from '@/app/_common/components/ui/EmptyState'
import { ErrorState, getErrorVariant } from '@/app/_common/components/ui/ErrorState'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import { useArbitrages } from '@/app/_common/hooks/use-api'
import type { ArbitrageType, ArbitragePriority, ArbitrageStatus } from '@/app/_common/lib/api-types'
import {
  TrendingUpDown,
  RefreshCw,
  TrendingUp,
  Shield,
  Droplet,
  DollarSign,
  PieChart,
  Lightbulb,
  CheckCircle2,
  XCircle,
} from 'lucide-react'

const ARBITRAGE_TYPE_LABELS: Record<ArbitrageType, { label: string; icon: any; color: string }> = {
  REBALANCING: { label: 'Rééquilibrage', icon: PieChart, color: 'text-primary' },
  OPTIMISATION_FISCALE: { label: 'Optimisation fiscale', icon: DollarSign, color: 'text-success' },
  DIVERSIFICATION: { label: 'Diversification', icon: TrendingUpDown, color: 'text-info' },
  LIQUIDITY: { label: 'Liquidité', icon: Droplet, color: 'text-info' },
  YIELD_ENHANCEMENT: { label: 'Amélioration rendement', icon: TrendingUp, color: 'text-success' },
  RISK_REDUCTION: { label: 'Réduction risque', icon: Shield, color: 'text-warning' },
  COST_OPTIMIZATION: { label: 'Optimisation frais', icon: Lightbulb, color: 'text-warning' },
}

const PRIORITY_LABELS: Record<ArbitragePriority, { label: string; variant: any }> = {
  BASSE: { label: 'Basse', variant: 'outline' },
  MOYENNE: { label: 'Moyenne', variant: 'secondary' },
  HAUTE: { label: 'Haute', variant: 'default' },
  URGENTE: { label: 'Urgente', variant: 'destructive' },
}

export default function PatrimoineArbitragesPage() {
  const [typeFilter, setTypeFilter] = useState<string>('ALL')
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL')
  const [statusFilter, setStatusFilter] = useState<string>('SUGGESTED')

  const filters = {
    types: typeFilter !== 'ALL' ? [typeFilter as ArbitrageType] : undefined,
    priorities: priorityFilter !== 'ALL' ? [priorityFilter as ArbitragePriority] : undefined,
    statuses: statusFilter !== 'ALL' ? [statusFilter as ArbitrageStatus] : undefined,
  }

  const { data, isLoading, isError, error, refetch } = useArbitrages(filters)

  const suggestions = data?.suggestions || []
  const stats = data?.stats

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatPercent = (value: number | undefined) => {
    if (value === undefined) return 'N/A'
    return value >= 0 ? `+${value.toFixed(2)}%` : `${value.toFixed(2)}%`
  }

  const handleResetFilters = () => {
    setTypeFilter('ALL')
    setPriorityFilter('ALL')
    setStatusFilter('SUGGESTED')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <TrendingUpDown className="h-7 w-7 text-muted-foreground" />
            Suggestions d'arbitrages
          </h1>
          <p className="text-muted-foreground mt-1">
            Recommandations d'optimisation patrimoniale basées sur l'analyse du portefeuille.
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Actualiser
        </Button>
      </div>

      {/* Stats globales */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{stats.totalSuggestions}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Suggérées</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">{stats.bySuggested}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Acceptées</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-success">{stats.byAccepted}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Exécutées</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-success">{stats.byExecuted}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Taux exécution</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{stats.avgExecutionRate.toFixed(0)}%</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Impact potentiel */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle>Impact potentiel total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Amélioration rendement</p>
                <p className="text-xl font-semibold text-success">
                  {formatPercent(stats.totalPotentialImpact.returnImprovement)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Économies fiscales</p>
                <p className="text-xl font-semibold text-primary">
                  {formatCurrency(stats.totalPotentialImpact.taxSavings)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Réduction frais</p>
                <p className="text-xl font-semibold text-info">
                  {formatCurrency(stats.totalPotentialImpact.feeReduction)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtres */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="w-56">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tous les types</SelectItem>
                  {Object.entries(ARBITRAGE_TYPE_LABELS).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-48">
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Priorité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Toutes priorités</SelectItem>
                  {Object.entries(PRIORITY_LABELS).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tous statuts</SelectItem>
                  <SelectItem value="SUGGESTED">Suggérées</SelectItem>
                  <SelectItem value="ACCEPTED">Acceptées</SelectItem>
                  <SelectItem value="REJECTED">Rejetées</SelectItem>
                  <SelectItem value="EXECUTED">Exécutées</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={handleResetFilters}>
              Réinitialiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste des suggestions */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <RefreshCw className="h-5 w-5 mb-2 animate-spin" />
          <span>Analyse du portefeuille…</span>
        </div>
      ) : isError ? (
        <ErrorState error={error as Error} variant={getErrorVariant(error as Error)} onRetry={() => refetch()} />
      ) : suggestions.length === 0 ? (
        <Card>
          <CardContent className="pt-10 pb-10">
            <EmptyState
              icon={CheckCircle2}
              title="Aucune suggestion"
              description="Votre portefeuille est bien équilibré ou aucune suggestion ne correspond aux filtres sélectionnés."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {suggestions.map(suggestion => {
            const typeInfo = ARBITRAGE_TYPE_LABELS[suggestion.type]
            const Icon = typeInfo.icon
            const priorityInfo = PRIORITY_LABELS[suggestion.priority]

            return (
              <Card key={suggestion.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 ${typeInfo.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base font-semibold">{suggestion.title}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">{suggestion.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={priorityInfo.variant}>{priorityInfo.label}</Badge>
                      <Badge variant="outline">{typeInfo.label}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Rationale */}
                  <div className="p-3 bg-muted rounded-lg border">
                    <p className="text-sm font-medium text-foreground mb-1">Analyse</p>
                    <p className="text-sm text-muted-foreground">{suggestion.rationale}</p>
                  </div>

                  {/* Métriques */}
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Montant suggéré</p>
                      <p className="text-lg font-semibold text-foreground">
                        {formatCurrency(suggestion.suggestedAmount)}
                      </p>
                    </div>
                    {suggestion.currentAllocation !== undefined && (
                      <div>
                        <p className="text-xs text-muted-foreground">Allocation actuelle</p>
                        <p className="text-lg font-semibold text-foreground">
                          {suggestion.currentAllocation.toFixed(1)}%
                        </p>
                      </div>
                    )}
                    {suggestion.targetAllocation !== undefined && (
                      <div>
                        <p className="text-xs text-muted-foreground">Allocation cible</p>
                        <p className="text-lg font-semibold text-success">
                          {suggestion.targetAllocation.toFixed(1)}%
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Impact attendu */}
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">Impact attendu</p>
                    <div className="flex flex-wrap gap-3">
                      {suggestion.expectedImpact.returnImprovement && (
                        <Badge variant="outline" className="gap-1">
                          <TrendingUp className="h-3 w-3" />
                          Rendement : {formatPercent(suggestion.expectedImpact.returnImprovement)}
                        </Badge>
                      )}
                      {suggestion.expectedImpact.riskReduction && (
                        <Badge variant="outline" className="gap-1">
                          <Shield className="h-3 w-3" />
                          Risque : -{suggestion.expectedImpact.riskReduction.toFixed(1)}%
                        </Badge>
                      )}
                      {suggestion.expectedImpact.taxSavings && (
                        <Badge variant="outline" className="gap-1">
                          <DollarSign className="h-3 w-3" />
                          Fiscalité : {formatCurrency(suggestion.expectedImpact.taxSavings)}
                        </Badge>
                      )}
                      {suggestion.expectedImpact.feeReduction && (
                        <Badge variant="outline" className="gap-1">
                          <Lightbulb className="h-3 w-3" />
                          Frais : {formatCurrency(suggestion.expectedImpact.feeReduction)}
                        </Badge>
                      )}
                      {suggestion.expectedImpact.liquidityImprovement && (
                        <Badge variant="outline" className="gap-1">
                          <Droplet className="h-3 w-3" />
                          Liquidité : +{suggestion.expectedImpact.liquidityImprovement.toFixed(1)}%
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Étapes d'implémentation */}
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">Étapes d'implémentation</p>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                      {suggestion.implementation.steps.map((step, index) => (
                        <li key={index}>{step}</li>
                      ))}
                    </ol>
                    <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                      <span>Délai : {suggestion.implementation.timeframe}</span>
                      <span>Complexité : {suggestion.implementation.complexity}</span>
                    </div>
                  </div>

                  {/* Actions (désactivées pour le moment, en attente du hook de mise à jour) */}
                  {suggestion.status === 'SUGGESTED' && (
                    <div className="flex gap-2 pt-2 border-t">
                      <Button size="sm" className="gap-2" disabled>
                        <CheckCircle2 className="h-4 w-4" />
                        Accepter
                      </Button>
                      <Button size="sm" variant="outline" className="gap-2" disabled>
                        <XCircle className="h-4 w-4" />
                        Rejeter
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Note */}
      {data && (
        <p className="text-xs text-muted-foreground text-center">
          Dernière analyse : {new Date(data.lastAnalyzed).toLocaleString('fr-FR')}
        </p>
      )}
    </div>
  )
}
