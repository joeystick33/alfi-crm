import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, formatDate, formatPercentage } from '@/lib/utils'
import {
  Target,
  TrendingUp,
  Calendar,
  Plus,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react'
import type { ClientDetail } from '@/lib/api-types'

interface TabObjectivesProps {
  clientId: string
  client: ClientDetail
}

const objectifTypeLabels = {
  RETIREMENT: 'Retraite',
  REAL_ESTATE_PURCHASE: 'Achat immobilier',
  EDUCATION: 'Éducation',
  WEALTH_TRANSMISSION: 'Transmission',
  TAX_OPTIMIZATION: 'Optimisation fiscale',
  INCOME_GENERATION: 'Génération de revenus',
  CAPITAL_PROTECTION: 'Protection du capital',
  OTHER: 'Autre',
}

const objectifStatusConfig = {
  ACTIVE: { label: 'Actif', variant: 'info' as const, icon: Clock },
  ACHIEVED: { label: 'Atteint', variant: 'success' as const, icon: CheckCircle },
  CANCELLED: { label: 'Annulé', variant: 'outline' as const, icon: AlertCircle },
  ON_HOLD: { label: 'En pause', variant: 'warning' as const, icon: Clock },
}

const projetTypeLabels = {
  REAL_ESTATE_PURCHASE: 'Achat immobilier',
  BUSINESS_CREATION: 'Création d\'entreprise',
  RETIREMENT_PREPARATION: 'Préparation retraite',
  WEALTH_RESTRUCTURING: 'Restructuration patrimoniale',
  TAX_OPTIMIZATION: 'Optimisation fiscale',
  SUCCESSION_PLANNING: 'Planification succession',
  OTHER: 'Autre',
}

const projetStatusConfig = {
  PLANNED: { label: 'Planifié', variant: 'outline' as const },
  IN_PROGRESS: { label: 'En cours', variant: 'info' as const },
  COMPLETED: { label: 'Terminé', variant: 'success' as const },
  CANCELLED: { label: 'Annulé', variant: 'destructive' as const },
  ON_HOLD: { label: 'En pause', variant: 'warning' as const },
}

export function TabObjectives({ clientId, client }: TabObjectivesProps) {
  return (
    <div className="space-y-6">
      {/* Objectifs Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Objectifs financiers
              {client.objectifs && (
                <Badge variant="secondary">{client.objectifs.length}</Badge>
              )}
            </CardTitle>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nouvel objectif
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {client.objectifs && client.objectifs.length > 0 ? (
            <div className="space-y-4">
              {client.objectifs.map((objectif: any) => {
                const statusConfig = objectifStatusConfig[objectif.status as keyof typeof objectifStatusConfig]
                const StatusIcon = statusConfig.icon
                const progress = objectif.progress || 0

                return (
                  <div
                    key={objectif.id}
                    className="rounded-lg border p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{objectif.name}</h4>
                          <Badge variant="outline">
                            {objectifTypeLabels[objectif.type as keyof typeof objectifTypeLabels] || objectif.type}
                          </Badge>
                        </div>
                        {objectif.description && (
                          <p className="text-sm text-muted-foreground">
                            {objectif.description}
                          </p>
                        )}
                      </div>
                      <Badge variant={statusConfig.variant}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig.label}
                      </Badge>
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Montant cible</p>
                        <p className="text-sm font-medium">
                          {formatCurrency(objectif.targetAmount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Montant actuel</p>
                        <p className="text-sm font-medium">
                          {formatCurrency(objectif.currentAmount || 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Date cible</p>
                        <p className="text-sm font-medium">
                          {formatDate(objectif.targetDate)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progression</span>
                        <span className="font-medium">{formatPercentage(progress)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            progress >= 100
                              ? 'bg-success'
                              : progress >= 50
                              ? 'bg-primary'
                              : 'bg-warning'
                          }`}
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                    </div>

                    {objectif.monthlyContribution && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <TrendingUp className="h-4 w-4" />
                        <span>
                          Contribution mensuelle recommandée:{' '}
                          <span className="font-medium text-foreground">
                            {formatCurrency(objectif.monthlyContribution)}
                          </span>
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">
                Aucun objectif défini
              </p>
              <Button className="mt-4" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Créer le premier objectif
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Projets Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Projets
              {client.projets && (
                <Badge variant="secondary">{client.projets.length}</Badge>
              )}
            </CardTitle>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nouveau projet
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {client.projets && client.projets.length > 0 ? (
            <div className="space-y-4">
              {client.projets.map((projet: any) => {
                const statusConfig = projetStatusConfig[projet.status as keyof typeof projetStatusConfig]
                const progress = projet.progress || 0

                return (
                  <div
                    key={projet.id}
                    className="rounded-lg border p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{projet.name}</h4>
                          <Badge variant="outline">
                            {projetTypeLabels[projet.type as keyof typeof projetTypeLabels] || projet.type}
                          </Badge>
                        </div>
                        {projet.description && (
                          <p className="text-sm text-muted-foreground">
                            {projet.description}
                          </p>
                        )}
                      </div>
                      <Badge variant={statusConfig.variant}>
                        {statusConfig.label}
                      </Badge>
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
                      {projet.estimatedBudget && (
                        <div>
                          <p className="text-xs text-muted-foreground">Budget estimé</p>
                          <p className="text-sm font-medium">
                            {formatCurrency(projet.estimatedBudget)}
                          </p>
                        </div>
                      )}
                      {projet.actualBudget && (
                        <div>
                          <p className="text-xs text-muted-foreground">Budget réel</p>
                          <p className="text-sm font-medium">
                            {formatCurrency(projet.actualBudget)}
                          </p>
                        </div>
                      )}
                      {projet.targetDate && (
                        <div>
                          <p className="text-xs text-muted-foreground">Date cible</p>
                          <p className="text-sm font-medium">
                            {formatDate(projet.targetDate)}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Avancement</span>
                        <span className="font-medium">{formatPercentage(progress)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            progress >= 100
                              ? 'bg-success'
                              : progress >= 50
                              ? 'bg-primary'
                              : 'bg-info'
                          }`}
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                    </div>

                    {projet.startDate && (
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Début: {formatDate(projet.startDate)}</span>
                        {projet.endDate && (
                          <span>Fin: {formatDate(projet.endDate)}</span>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">
                Aucun projet en cours
              </p>
              <Button className="mt-4" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Créer le premier projet
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
