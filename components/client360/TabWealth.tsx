'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { BentoGrid } from '@/components/ui/BentoGrid'
import { BentoCard } from '@/components/ui/BentoCard'
import { formatCurrency, formatDate, formatPercentage } from '@/lib/utils'
import { useRecalculateWealth } from '@/hooks/use-api'
import {
  calculateLiquidityRatio,
  calculateLeverageEffect,
  sortAssets,
  getDebtRatioStatus,
  getAssetTypeLabel,
  getLiabilityTypeLabel,
  type AssetWithLeverage
} from '@/lib/utils/wealth-calculations'
import {
  TrendingUp,
  TrendingDown,
  Home,
  Briefcase,
  FileText,
  Plus,
  RefreshCw,
  Droplets,
  Wallet,
  ArrowUpDown,
  Link2,
  Edit2,
  Trash2,
  Copy,
  BarChart3,
  ExternalLink,
} from 'lucide-react'
import type { ClientDetail, WealthSummary } from '@/lib/api-types'

interface TabWealthProps {
  clientId: string
  client: ClientDetail
  wealth?: WealthSummary
}

export function TabWealth({ clientId, client, wealth }: TabWealthProps) {
  const [activeTab, setActiveTab] = useState('synthese')
  const [sortBy, setSortBy] = useState<'value' | 'type' | 'date' | 'netValue'>('value')
  const recalculateWealth = useRecalculateWealth()

  const handleRecalculate = () => {
    recalculateWealth.mutate(clientId)
  }

  // Calculate advanced metrics
  const liquidityMetrics = useMemo(() => {
    if (!client.actifs) return { liquidAssets: 0, totalAssets: 0, liquidityRatio: 0, liquidityStatus: 'good' as const }
    return calculateLiquidityRatio(client.actifs.map((a: any) => ({
      id: a.id,
      name: a.name || '',
      type: a.type || '',
      value: Number(a.value) || 0,
      isManaged: a.managedByFirm || false
    })))
  }, [client.actifs])

  const assetsWithLeverage = useMemo(() => {
    if (!client.actifs || !client.passifs) return []
    return calculateLeverageEffect(
      client.actifs.map((a: any) => ({
        id: a.id,
        name: a.name || '',
        type: a.type || '',
        value: Number(a.value) || 0,
        linkedLiabilityId: null // Will be determined by passifs
      })),
      client.passifs.map((p: any) => ({
        id: p.id,
        name: p.name || '',
        type: p.type || '',
        remainingAmount: Number(p.remainingAmount) || 0,
        linkedAssetId: null // Not in Prisma schema yet
      }))
    )
  }, [client.actifs, client.passifs])

  const sortedAssets = useMemo(() => {
    if (!client.actifs) return []
    return sortAssets(
      client.actifs.map((a: any) => ({
        id: a.id,
        name: a.name || '',
        type: a.type || '',
        value: Number(a.value) || 0,
        purchaseValue: Number(a.acquisitionValue) || undefined,
        purchaseDate: a.acquisitionDate?.toISOString() || undefined,
        isManaged: a.managedByFirm || false
      })),
      sortBy,
      client.passifs?.map((p: any) => ({
        id: p.id,
        name: p.name || '',
        type: p.type || '',
        remainingAmount: Number(p.remainingAmount) || 0,
        linkedAssetId: null
      })) || []
    )
  }, [client.actifs, client.passifs, sortBy])

  const managedAssets = useMemo(() => {
    return client.actifs?.filter((a: any) => a.managedByFirm) || []
  }, [client.actifs])

  const totalManagedValue = useMemo(() => {
    return managedAssets.reduce((sum: any, a: any) => sum + Number(a.value || 0), 0)
  }, [managedAssets])

  const totalUnmanagedValue = useMemo(() => {
    return (wealth?.totalActifs || 0) - totalManagedValue
  }, [wealth?.totalActifs, totalManagedValue])

  const debtRatioInfo = useMemo(() => {
    return getDebtRatioStatus(wealth?.debtRatio || 0)
  }, [wealth?.debtRatio])

  // Actifs columns
  const actifsColumns: Column<any>[] = [
    {
      key: 'name',
      label: 'Nom',
      sortable: true,
    },
    {
      key: 'type',
      label: 'Type',
      sortable: true,
      render: (actif: any) => <Badge variant="outline">{actif.type}</Badge>,
    },
    {
      key: 'category',
      label: 'Catégorie',
      sortable: true,
    },
    {
      key: 'value',
      label: 'Valeur',
      sortable: true,
      render: (actif: any) => (
        <span className="font-medium text-success">
          {formatCurrency(actif.value)}
        </span>
      ),
    },
    {
      key: 'acquisitionDate',
      label: 'Date d\'acquisition',
      sortable: true,
      render: (actif: any) =>
        actif.acquisitionDate ? formatDate(actif.acquisitionDate) : '-',
    },
  ]

  // Passifs columns
  const passifsColumns: Column<any>[] = [
    {
      key: 'name',
      label: 'Nom',
      sortable: true,
    },
    {
      key: 'type',
      label: 'Type',
      sortable: true,
      render: (passif: any) => <Badge variant="outline">{passif.type}</Badge>,
    },
    {
      key: 'remainingAmount',
      label: 'Capital restant',
      sortable: true,
      render: (passif: any) => (
        <span className="font-medium text-destructive">
          {formatCurrency(passif.remainingAmount)}
        </span>
      ),
    },
    {
      key: 'interestRate',
      label: 'Taux',
      sortable: true,
      render: (passif: any) => formatPercentage(passif.interestRate),
    },
    {
      key: 'monthlyPayment',
      label: 'Mensualité',
      sortable: true,
      render: (passif: any) => formatCurrency(passif.monthlyPayment),
    },
    {
      key: 'endDate',
      label: 'Échéance',
      sortable: true,
      render: (passif: any) => formatDate(passif.endDate),
    },
  ]

  // Contrats columns
  const contratsColumns: Column<any>[] = [
    {
      key: 'name',
      label: 'Nom',
      sortable: true,
    },
    {
      key: 'type',
      label: 'Type',
      sortable: true,
      render: (contrat: any) => <Badge variant="outline">{contrat.type}</Badge>,
    },
    {
      key: 'provider',
      label: 'Assureur',
      sortable: true,
    },
    {
      key: 'value',
      label: 'Valeur',
      sortable: true,
      render: (contrat: any) =>
        contrat.value ? formatCurrency(contrat.value) : '-',
    },
    {
      key: 'premium',
      label: 'Prime',
      sortable: true,
      render: (contrat: any) =>
        contrat.premium ? formatCurrency(contrat.premium) : '-',
    },
    {
      key: 'status',
      label: 'Statut',
      sortable: true,
      render: (contrat: any) => (
        <Badge
          variant={contrat.status === 'ACTIVE' ? 'success' : 'outline'}
        >
          {contrat.status}
        </Badge>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Patrimoine</h2>
          {wealth && (
            <p className="text-sm text-muted-foreground mt-1">
              Dernière mise à jour: {formatDate(wealth.lastCalculated)}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRecalculate}
            loading={recalculateWealth.isPending}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Recalculer
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter
          </Button>
        </div>
      </div>

      {/* Bento Grid KPIs */}
      <BentoGrid cols={{ mobile: 1, tablet: 2, desktop: 4 }} gap={4}>
        <BentoCard span={{ cols: 1, rows: 1 }} variant="default" className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span className="text-sm text-gray-700">Total Actifs</span>
            </div>
            <div className="text-3xl font-bold text-green-700">
              {wealth ? formatCurrency(wealth.totalActifs) : '-'}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {client.actifs?.length || 0} actif{(client.actifs?.length || 0) > 1 ? 's' : ''}
            </div>
          </div>
        </BentoCard>

        <BentoCard span={{ cols: 1, rows: 1 }} variant="default" className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              <span className="text-sm text-gray-700">Total Passifs</span>
            </div>
            <div className="text-3xl font-bold text-red-700">
              {wealth ? formatCurrency(wealth.totalPassifs) : '-'}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {client.passifs?.length || 0} passif{(client.passifs?.length || 0) > 1 ? 's' : ''}
            </div>
          </div>
        </BentoCard>

        <BentoCard span={{ cols: 1, rows: 1 }} variant="hero" className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <span className="text-sm text-gray-700">Patrimoine Net</span>
            </div>
            <div className="text-3xl font-bold text-blue-700">
              {wealth ? formatCurrency(wealth.patrimoineNet) : '-'}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              Actifs - Passifs
            </div>
          </div>
        </BentoCard>

        <BentoCard span={{ cols: 1, rows: 1 }} variant="default" className={`bg-gradient-to-br ${
          debtRatioInfo.status === 'good' ? 'from-green-50 to-green-100 border-green-200' :
          debtRatioInfo.status === 'medium' ? 'from-orange-50 to-orange-100 border-orange-200' :
          'from-red-50 to-red-100 border-red-200'
        }`}>
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-gray-700">Taux d'endettement</span>
            </div>
            <div className={`text-3xl font-bold ${debtRatioInfo.color}`}>
              {wealth ? formatPercentage(wealth.debtRatio) : '-'}
            </div>
            <Badge variant="outline" className="mt-2 text-xs">
              {debtRatioInfo.label}
            </Badge>
          </div>
        </BentoCard>
      </BentoGrid>

      {/* Advanced Metrics */}
      <BentoGrid cols={{ mobile: 1, tablet: 2, desktop: 3 }} gap={4}>
        <BentoCard span={{ cols: 1, rows: 1 }} variant="default" className="bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Droplets className="h-5 w-5 text-cyan-600" />
              <span className="text-sm text-gray-700">Ratio de liquidité</span>
            </div>
            <div className="text-3xl font-bold text-cyan-700">
              {liquidityMetrics.liquidityRatio}%
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {formatCurrency(liquidityMetrics.liquidAssets)} liquides
            </div>
          </div>
        </BentoCard>

        <BentoCard span={{ cols: 1, rows: 1 }} variant="default" className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="h-5 w-5 text-blue-600" />
              <span className="text-sm text-gray-700">Actifs gérés</span>
            </div>
            <div className="text-3xl font-bold text-blue-700">
              {formatCurrency(totalManagedValue)}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {managedAssets.length} actif{managedAssets.length > 1 ? 's' : ''}
            </div>
          </div>
        </BentoCard>

        <BentoCard span={{ cols: 1, rows: 1 }} variant="default" className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <span className="text-sm text-gray-700">Actifs avec levier</span>
            </div>
            <div className="text-3xl font-bold text-purple-700">
              {assetsWithLeverage.filter((a: any) => a.hasLeverage).length}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              Financés par crédit
            </div>
          </div>
        </BentoCard>
      </BentoGrid>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="synthese">Synthèse</TabsTrigger>
          <TabsTrigger value="actifs">
            Actifs
            {client.actifs && (
              <Badge variant="secondary" className="ml-2">
                {client.actifs.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="passifs">
            Passifs
            {client.passifs && (
              <Badge variant="secondary" className="ml-2">
                {client.passifs.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="contrats">
            Contrats
            {client.contrats && (
              <Badge variant="secondary" className="ml-2">
                {client.contrats.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Synthèse Tab */}
        <TabsContent value="synthese" className="space-y-6">

          {/* Allocation Charts */}
          {wealth && (
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Répartition par type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {wealth.allocationByType.map((item: any) => (
                      <div key={item.type} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{item.type}</span>
                          <span className="text-muted-foreground">
                            {formatPercentage(item.percentage)}
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatCurrency(item.value)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Répartition par catégorie</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {wealth.allocationByCategory.map((item: any) => (
                      <div key={item.category} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{item.category}</span>
                          <span className="text-muted-foreground">
                            {formatPercentage(item.percentage)}
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full bg-success transition-all"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatCurrency(item.value)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Debt Ratio */}
          {wealth && (
            <Card>
              <CardHeader>
                <CardTitle>Taux d'endettement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">
                      {formatPercentage(wealth.debtRatio)}
                    </span>
                    <Badge
                      variant={
                        wealth.debtRatio > 40
                          ? 'destructive'
                          : wealth.debtRatio > 33
                          ? 'warning'
                          : 'success'
                      }
                    >
                      {wealth.debtRatio > 40
                        ? 'Critique'
                        : wealth.debtRatio > 33
                        ? 'Élevé'
                        : 'Sain'}
                    </Badge>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        wealth.debtRatio > 40
                          ? 'bg-destructive'
                          : wealth.debtRatio > 33
                          ? 'bg-warning'
                          : 'bg-success'
                      }`}
                      style={{ width: `${Math.min(wealth.debtRatio, 100)}%` }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Recommandation: maintenir en dessous de 33%
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Actifs Tab */}
        <TabsContent value="actifs" className="space-y-4">
          {client.actifs && client.actifs.length > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Trier par :</span>
                <select
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value as any)}
                  className="text-sm border rounded px-2 py-1"
                >
                  <option value="value">Valeur (décroissant)</option>
                  <option value="type">Type</option>
                  <option value="date">Date d'acquisition</option>
                  <option value="netValue">Valeur nette</option>
                </select>
              </div>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un actif
              </Button>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Liste des actifs</CardTitle>
            </CardHeader>
            <CardContent>
              {!client.actifs || client.actifs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Home className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun actif enregistré</p>
                  <Button size="sm" className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter le premier actif
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedAssets.map((asset: any) => {
                    const assetWithLeverage = assetsWithLeverage.find(a => a.id === asset.id)
                    const linkedLiability = null // TODO: Add linkedAssetId to Prisma schema
                    
                    return (
                      <div key={asset.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-2xl">{getAssetTypeLabel(asset.type).split(' ')[0]}</span>
                              <div>
                                <h4 className="font-semibold">{asset.name}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {getAssetTypeLabel(asset.type)}
                                </p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                              <div>
                                <p className="text-xs text-muted-foreground">Valeur actuelle</p>
                                <p className="font-semibold text-success">{formatCurrency(asset.value)}</p>
                              </div>
                              
                              {assetWithLeverage?.hasLeverage && (
                                <>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Dette associée</p>
                                    <p className="font-semibold text-destructive">
                                      {formatCurrency(assetWithLeverage.leverageAmount)}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Valeur nette</p>
                                    <p className="font-semibold text-primary">
                                      {formatCurrency(assetWithLeverage.netValue)}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Taux de levier</p>
                                    <p className="font-semibold">{assetWithLeverage.leverageRatio}%</p>
                                  </div>
                                </>
                              )}
                              
                              {asset.purchaseDate && (
                                <div>
                                  <p className="text-xs text-muted-foreground">Date d'acquisition</p>
                                  <p className="text-sm">{formatDate(asset.purchaseDate)}</p>
                                </div>
                              )}
                            </div>
                            

                            
                            {asset.isManaged && (
                              <Badge variant="outline" className="mt-2">
                                <Wallet className="h-3 w-3 mr-1" />
                                Géré par nous
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost">
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Trash2 className="h-4 w-4 text-destructive" />
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
        </TabsContent>

        {/* Passifs Tab */}
        <TabsContent value="passifs" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Liste des passifs</CardTitle>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un passif
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {!client.passifs || client.passifs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun passif enregistré</p>
                  <Button size="sm" className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter le premier passif
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {client.passifs.map((liability: any) => {
                    const linkedAsset = null // TODO: Add linkedAssetId to Prisma schema
                    
                    return (
                      <div key={liability.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-2xl">{getLiabilityTypeLabel(liability.type).split(' ')[0]}</span>
                              <div>
                                <h4 className="font-semibold">{liability.name}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {getLiabilityTypeLabel(liability.type)}
                                </p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                              <div>
                                <p className="text-xs text-muted-foreground">Capital restant</p>
                                <p className="font-semibold text-destructive">
                                  {formatCurrency(Number(liability.remainingAmount))}
                                </p>
                              </div>
                              
                              {liability.monthlyPayment && (
                                <div>
                                  <p className="text-xs text-muted-foreground">Mensualité</p>
                                  <p className="font-semibold">{formatCurrency(Number(liability.monthlyPayment))}</p>
                                </div>
                              )}
                              
                              {liability.interestRate && (
                                <div>
                                  <p className="text-xs text-muted-foreground">Taux d'intérêt</p>
                                  <p className="font-semibold">{formatPercentage(Number(liability.interestRate))}</p>
                                </div>
                              )}
                              
                              {liability.startDate && (
                                <div>
                                  <p className="text-xs text-muted-foreground">Date de début</p>
                                  <p className="text-sm">{formatDate(liability.startDate)}</p>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost">
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Trash2 className="h-4 w-4 text-destructive" />
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
        </TabsContent>

        {/* Contrats Tab */}
        <TabsContent value="contrats">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Liste des contrats</CardTitle>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un contrat
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                data={client.contrats || []}
                columns={contratsColumns}
                emptyMessage="Aucun contrat enregistré"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
