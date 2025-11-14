import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, formatDate, formatPercentage } from '@/lib/utils'
import {
  TrendingUp,
  Plus,
  Target,
  DollarSign,
  Calendar,
  AlertCircle,
} from 'lucide-react'
import type { ClientDetail } from '@/lib/api-types'

interface TabOpportunitiesProps {
  clientId: string
  client: ClientDetail
}

const opportuniteTypeLabels = {
  LIFE_INSURANCE: 'Assurance vie',
  RETIREMENT_SAVINGS: 'Épargne retraite',
  REAL_ESTATE_INVESTMENT: 'Investissement immobilier',
  SECURITIES_INVESTMENT: 'Investissement titres',
  TAX_OPTIMIZATION: 'Optimisation fiscale',
  LOAN_RESTRUCTURING: 'Restructuration crédit',
  WEALTH_TRANSMISSION: 'Transmission patrimoine',
  INSURANCE_REVIEW: 'Révision assurances',
  OTHER: 'Autre',
}

const opportuniteStatusConfig = {
  DETECTED: { label: 'Détectée', variant: 'outline' as const, color: 'bg-gray-500' },
  QUALIFIED: { label: 'Qualifiée', variant: 'info' as const, color: 'bg-blue-500' },
  CONTACTED: { label: 'Contactée', variant: 'info' as const, color: 'bg-cyan-500' },
  PRESENTED: { label: 'Présentée', variant: 'warning' as const, color: 'bg-yellow-500' },
  ACCEPTED: { label: 'Acceptée', variant: 'success' as const, color: 'bg-green-500' },
  CONVERTED: { label: 'Convertie', variant: 'success' as const, color: 'bg-emerald-500' },
  REJECTED: { label: 'Rejetée', variant: 'destructive' as const, color: 'bg-red-500' },
  LOST: { label: 'Perdue', variant: 'destructive' as const, color: 'bg-gray-400' },
}

const priorityConfig = {
  LOW: { label: 'Basse', variant: 'outline' as const },
  MEDIUM: { label: 'Moyenne', variant: 'secondary' as const },
  HIGH: { label: 'Haute', variant: 'warning' as const },
  URGENT: { label: 'Urgente', variant: 'destructive' as const },
}

export function TabOpportunities({ clientId, client }: TabOpportunitiesProps) {
  // Calculate total opportunity value
  const totalValue = client.opportunites?.reduce(
    (sum: number, opp: any) => sum + (opp.estimatedValue || 0),
    0
  ) || 0

  // Group by status for pipeline view
  const opportunitesByStatus = client.opportunites?.reduce((acc: any, opp: any) => {
    if (!acc[opp.status]) acc[opp.status] = []
    acc[opp.status].push(opp)
    return acc
  }, {}) || {}

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total opportunités
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {client.opportunites?.length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Valeur totale estimée
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {formatCurrency(totalValue)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taux de conversion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {client.opportunites && client.opportunites.length > 0
                ? formatPercentage(
                    (client.opportunites.filter((o: any) => o.status === 'CONVERTED').length /
                      client.opportunites.length) *
                      100
                  )
                : '0%'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Opportunities List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Opportunités commerciales
            </CardTitle>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle opportunité
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {client.opportunites && client.opportunites.length > 0 ? (
            <div className="space-y-4">
              {client.opportunites.map((opportunite: any) => {
                const statusConfig = opportuniteStatusConfig[opportunite.status as keyof typeof opportuniteStatusConfig]
                const priorityConf = priorityConfig[opportunite.priority as keyof typeof priorityConfig]

                return (
                  <div
                    key={opportunite.id}
                    className="rounded-lg border p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{opportunite.name}</h4>
                          <Badge variant="outline">
                            {opportuniteTypeLabels[opportunite.type as keyof typeof opportuniteTypeLabels] || opportunite.type}
                          </Badge>
                        </div>
                        {opportunite.description && (
                          <p className="text-sm text-muted-foreground">
                            {opportunite.description}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        <Badge variant={statusConfig.variant}>
                          {statusConfig.label}
                        </Badge>
                        <Badge variant={priorityConf.variant}>
                          {priorityConf.label}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-4">
                      {opportunite.estimatedValue && (
                        <div>
                          <p className="text-xs text-muted-foreground">Valeur estimée</p>
                          <p className="text-sm font-medium">
                            {formatCurrency(opportunite.estimatedValue)}
                          </p>
                        </div>
                      )}
                      {opportunite.score !== null && opportunite.score !== undefined && (
                        <div>
                          <p className="text-xs text-muted-foreground">Score</p>
                          <p className="text-sm font-medium">{opportunite.score}/100</p>
                        </div>
                      )}
                      {opportunite.confidence !== null && opportunite.confidence !== undefined && (
                        <div>
                          <p className="text-xs text-muted-foreground">Confiance</p>
                          <p className="text-sm font-medium">
                            {formatPercentage(opportunite.confidence)}
                          </p>
                        </div>
                      )}
                      {opportunite.actionDeadline && (
                        <div>
                          <p className="text-xs text-muted-foreground">Échéance</p>
                          <p className="text-sm font-medium">
                            {formatDate(opportunite.actionDeadline)}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Timeline */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {opportunite.detectedAt && (
                        <span>Détectée: {formatDate(opportunite.detectedAt)}</span>
                      )}
                      {opportunite.qualifiedAt && (
                        <span>Qualifiée: {formatDate(opportunite.qualifiedAt)}</span>
                      )}
                      {opportunite.convertedAt && (
                        <span>Convertie: {formatDate(opportunite.convertedAt)}</span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2 border-t">
                      <Button size="sm" variant="outline">
                        Mettre à jour
                      </Button>
                      {opportunite.status === 'ACCEPTED' && (
                        <Button size="sm">
                          <Target className="h-4 w-4 mr-2" />
                          Convertir en projet
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">
                Aucune opportunité détectée
              </p>
              <Button className="mt-4" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Créer une opportunité
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pipeline View (Kanban-style summary) */}
      {client.opportunites && client.opportunites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Vue Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              {Object.entries(opportuniteStatusConfig).map(([status, config]) => {
                const count = opportunitesByStatus[status]?.length || 0
                const value = opportunitesByStatus[status]?.reduce(
                  (sum: number, opp: any) => sum + (opp.estimatedValue || 0),
                  0
                ) || 0

                return (
                  <div key={status} className="rounded-lg border p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant={config.variant}>{config.label}</Badge>
                      <span className="text-sm font-medium">{count}</span>
                    </div>
                    {value > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(value)}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
