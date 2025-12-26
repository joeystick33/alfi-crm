"use client"

import { useState } from 'react'
import { Button } from '@/app/_common/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_common/components/ui/Card'
import { Badge } from '@/app/_common/components/ui/Badge'
import { EmptyState } from '@/app/_common/components/ui/EmptyState'
import { ErrorState, getErrorVariant } from '@/app/_common/components/ui/ErrorState'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import { usePerformance } from '@/app/_common/hooks/use-api'
import type { PerformancePeriod } from '@/app/_common/lib/api-types'
import { TrendingUp, Activity, RefreshCw, BarChart3 } from 'lucide-react'

export default function PatrimoinePerformancePage() {
  const [selectedPeriod, setSelectedPeriod] = useState<PerformancePeriod>('YTD')
  const { data: performance, isLoading, isError, error, refetch } = usePerformance()

  const formatPercent = (value: number | null | undefined) => {
    if (value === null || value === undefined) return 'N/A'
    const formatted = value.toFixed(2)
    return value >= 0 ? `+${formatted}%` : `${formatted}%`
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(value)
  }

  const getPerformanceColor = (value: number | null | undefined) => {
    if (value === null || value === undefined) return 'text-foreground'
    return value >= 0 ? 'text-success' : 'text-destructive'
  }

  const currentMetrics = performance?.metrics?.[selectedPeriod]
  const stats = performance?.stats
  const byAssetClass = performance?.byAssetClass || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Activity className="h-7 w-7 text-muted-foreground" />
            Performance Patrimoniale
          </h1>
          <p className="text-muted-foreground mt-1">
            Analyse consolidée de la performance et des métriques de risque.
          </p>
        </div>
        <div className="flex gap-3">
          <Select value={selectedPeriod} onValueChange={v => setSelectedPeriod(v as PerformancePeriod)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="YTD">YTD</SelectItem>
              <SelectItem value="1M">1 Mois</SelectItem>
              <SelectItem value="3M">3 Mois</SelectItem>
              <SelectItem value="6M">6 Mois</SelectItem>
              <SelectItem value="1Y">1 An</SelectItem>
              <SelectItem value="3Y">3 Ans</SelectItem>
              <SelectItem value="5Y">5 Ans</SelectItem>
              <SelectItem value="INCEPTION">Depuis origine</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Actualiser
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <RefreshCw className="h-5 w-5 mb-2 animate-spin" />
          <span>Calcul de la performance…</span>
        </div>
      ) : isError ? (
        <ErrorState error={error as Error} variant={getErrorVariant(error as Error)} onRetry={() => refetch()} />
      ) : !currentMetrics ? (
        <Card>
          <CardContent className="pt-10 pb-10">
            <EmptyState
              icon={TrendingUp}
              title="Données insuffisantes"
              description="La période sélectionnée ne contient pas assez de données historiques."
            />
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Métriques principales */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Rendement</CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold ${getPerformanceColor(currentMetrics.absoluteReturn)}`}>
                  {formatPercent(currentMetrics.absoluteReturn)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Période {selectedPeriod}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Rendement annualisé</CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold ${getPerformanceColor(currentMetrics.annualizedReturn)}`}>
                  {formatPercent(currentMetrics.annualizedReturn)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Par an</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Volatilité</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground">
                  {formatPercent(currentMetrics.volatility)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Écart-type annualisé</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Ratio de Sharpe</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground">
                  {currentMetrics.sharpeRatio !== null ? currentMetrics.sharpeRatio.toFixed(2) : 'N/A'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Rendement / Risque</p>
              </CardContent>
            </Card>
          </div>

          {/* Métriques secondaires */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Valeur du portefeuille</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(currentMetrics.portfolioValue)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Valeur initiale : {formatCurrency(currentMetrics.initialValue)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Gains / Pertes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-3">
                  <div>
                    <p className="text-sm text-emerald-600 font-medium">Gains</p>
                    <p className="text-lg font-semibold text-emerald-600">
                      {formatCurrency(currentMetrics.gains)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-rose-600 font-medium">Pertes</p>
                    <p className="text-lg font-semibold text-rose-600">
                      {formatCurrency(currentMetrics.losses)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Max Drawdown</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-rose-600">
                  {formatPercent(currentMetrics.maxDrawdown)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Perte maximale</p>
              </CardContent>
            </Card>
          </div>

          {/* Performance par classe d'actifs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Performance par classe d'actifs
              </CardTitle>
            </CardHeader>
            <CardContent>
              {byAssetClass.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Aucune donnée disponible</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="py-2 text-left font-medium text-muted-foreground">Classe d'actifs</th>
                        <th className="py-2 text-right font-medium text-muted-foreground">Poids</th>
                        <th className="py-2 text-right font-medium text-muted-foreground">Rendement</th>
                        <th className="py-2 text-right font-medium text-muted-foreground">Contribution</th>
                        <th className="py-2 text-right font-medium text-muted-foreground">Volatilité</th>
                      </tr>
                    </thead>
                    <tbody>
                      {byAssetClass.map(asset => (
                        <tr key={asset.assetClass} className="border-b last:border-0 hover:bg-slate-50">
                          <td className="py-2">
                            <span className="font-medium">{asset.assetClass}</span>
                          </td>
                          <td className="py-2 text-right">
                            <Badge variant="outline">{asset.weight.toFixed(1)}%</Badge>
                          </td>
                          <td className={`py-2 text-right font-semibold ${getPerformanceColor(asset.return)}`}>
                            {formatPercent(asset.return)}
                          </td>
                          <td className={`py-2 text-right ${getPerformanceColor(asset.contribution)}`}>
                            {formatPercent(asset.contribution)}
                          </td>
                          <td className="py-2 text-right text-muted-foreground">
                            {formatPercent(asset.volatility)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Statistiques historiques */}
          {stats && (
            <Card>
              <CardHeader>
                <CardTitle>Statistiques historiques</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Meilleur mois</p>
                    <p className="text-lg font-semibold text-emerald-600">
                      {formatPercent(stats.bestMonth.return)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(stats.bestMonth.date).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pire mois</p>
                    <p className="text-lg font-semibold text-rose-600">
                      {formatPercent(stats.worstMonth.return)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(stats.worstMonth.date).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Taux de réussite</p>
                    <p className="text-lg font-semibold text-foreground">{stats.winRate.toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground">
                      {stats.positiveMonths} mois positifs / {stats.negativeMonths} négatifs
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ratio Gain/Perte</p>
                    <p className="text-lg font-semibold text-foreground">{stats.gainLossRatio.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">
                      Gain moyen : {formatPercent(stats.avgGain)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Note sur la dernière mise à jour */}
          <p className="text-xs text-muted-foreground text-center">
            Dernière mise à jour : {new Date(performance.lastUpdated).toLocaleString('fr-FR')}
          </p>
        </>
      )}
    </div>
  )
}
