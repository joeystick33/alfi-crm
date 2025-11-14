'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { formatCurrency, formatDate, formatPercentage } from '@/lib/utils'
import { useRecalculateWealth } from '@/hooks/use-api'
import {
  TrendingUp,
  TrendingDown,
  Home,
  Briefcase,
  FileText,
  Plus,
  RefreshCw,
} from 'lucide-react'
import type { ClientDetail, WealthSummary } from '@/lib/api-types'

interface TabWealthProps {
  clientId: string
  client: ClientDetail
  wealth?: WealthSummary
}

export function TabWealth({ clientId, client, wealth }: TabWealthProps) {
  const [activeTab, setActiveTab] = useState('synthese')
  const recalculateWealth = useRecalculateWealth()

  const handleRecalculate = () => {
    recalculateWealth.mutate(clientId)
  }

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
      render: (actif) => <Badge variant="outline">{actif.type}</Badge>,
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
      render: (actif) => (
        <span className="font-medium text-success">
          {formatCurrency(actif.value)}
        </span>
      ),
    },
    {
      key: 'acquisitionDate',
      label: 'Date d\'acquisition',
      sortable: true,
      render: (actif) =>
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
      render: (passif) => <Badge variant="outline">{passif.type}</Badge>,
    },
    {
      key: 'remainingAmount',
      label: 'Capital restant',
      sortable: true,
      render: (passif) => (
        <span className="font-medium text-destructive">
          {formatCurrency(passif.remainingAmount)}
        </span>
      ),
    },
    {
      key: 'interestRate',
      label: 'Taux',
      sortable: true,
      render: (passif) => formatPercentage(passif.interestRate),
    },
    {
      key: 'monthlyPayment',
      label: 'Mensualité',
      sortable: true,
      render: (passif) => formatCurrency(passif.monthlyPayment),
    },
    {
      key: 'endDate',
      label: 'Échéance',
      sortable: true,
      render: (passif) => formatDate(passif.endDate),
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
      render: (contrat) => <Badge variant="outline">{contrat.type}</Badge>,
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
      render: (contrat) =>
        contrat.value ? formatCurrency(contrat.value) : '-',
    },
    {
      key: 'premium',
      label: 'Prime',
      sortable: true,
      render: (contrat) =>
        contrat.premium ? formatCurrency(contrat.premium) : '-',
    },
    {
      key: 'status',
      label: 'Statut',
      sortable: true,
      render: (contrat) => (
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
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-success" />
                  Total Actifs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">
                  {wealth ? formatCurrency(wealth.totalActifs) : '-'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-destructive" />
                  Total Passifs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  {wealth ? formatCurrency(wealth.totalPassifs) : '-'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Patrimoine Net
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {wealth ? formatCurrency(wealth.patrimoineNet) : '-'}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Allocation Charts */}
          {wealth && (
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Répartition par type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {wealth.allocationByType.map((item) => (
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
                    {wealth.allocationByCategory.map((item) => (
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
        <TabsContent value="actifs">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Liste des actifs</CardTitle>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un actif
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                data={client.actifs || []}
                columns={actifsColumns}
                emptyMessage="Aucun actif enregistré"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Passifs Tab */}
        <TabsContent value="passifs">
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
              <DataTable
                data={client.passifs || []}
                columns={passifsColumns}
                emptyMessage="Aucun passif enregistré"
              />
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
