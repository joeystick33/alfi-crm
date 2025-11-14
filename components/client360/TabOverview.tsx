import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, formatPercentage } from '@/lib/utils'
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle } from 'lucide-react'
import type { ClientDetail, WealthSummary } from '@/lib/api-types'

interface TabOverviewProps {
  clientId: string
  client: ClientDetail
  wealth?: WealthSummary
}

export function TabOverview({ clientId, client, wealth }: TabOverviewProps) {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Actifs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {wealth ? formatCurrency(wealth.totalActifs) : '-'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
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
            <div className="text-2xl font-bold text-success">
              {wealth ? formatCurrency(wealth.patrimoineNet) : '-'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taux d'endettement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {wealth ? formatPercentage(wealth.debtRatio) : '-'}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Allocation by Type */}
        {wealth && wealth.allocationByType.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Répartition par type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {wealth.allocationByType.map((item) => (
                  <div key={item.type} className="space-y-1">
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
        )}

        {/* Allocation by Category */}
        {wealth && wealth.allocationByCategory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Répartition par catégorie</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {wealth.allocationByCategory.map((item) => (
                  <div key={item.category} className="space-y-1">
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
        )}
      </div>

      {/* Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>Alertes prioritaires</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {client.kycStatus === 'EXPIRED' && (
              <div className="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-3">
                <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-sm">KYC expiré</p>
                  <p className="text-sm text-muted-foreground">
                    Le KYC de ce client a expiré et doit être renouvelé
                  </p>
                </div>
                <Badge variant="destructive">Urgent</Badge>
              </div>
            )}

            {client.kycStatus === 'PENDING' && (
              <div className="flex items-start gap-3 rounded-lg border border-warning/50 bg-warning/10 p-3">
                <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-sm">KYC incomplet</p>
                  <p className="text-sm text-muted-foreground">
                    Le KYC de ce client n'est pas encore complété
                  </p>
                </div>
                <Badge variant="warning">À faire</Badge>
              </div>
            )}

            {client.kycStatus === 'COMPLETED' && (
              <div className="flex items-start gap-3 rounded-lg border border-success/50 bg-success/10 p-3">
                <CheckCircle className="h-5 w-5 text-success shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-sm">KYC à jour</p>
                  <p className="text-sm text-muted-foreground">
                    Le KYC de ce client est complet et à jour
                  </p>
                </div>
                <Badge variant="success">OK</Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Activité récente</CardTitle>
        </CardHeader>
        <CardContent>
          {client.timelineEvents && client.timelineEvents.length > 0 ? (
            <div className="space-y-4">
              {client.timelineEvents.slice(0, 5).map((event: any) => (
                <div key={event.id} className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">{event.title}</p>
                    {event.description && (
                      <p className="text-sm text-muted-foreground">{event.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {new Date(event.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucune activité récente
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
