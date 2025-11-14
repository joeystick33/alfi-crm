import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatDate, formatPercentage } from '@/lib/utils'
import {
  Shield,
  CheckCircle,
  AlertCircle,
  Clock,
  FileText,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react'
import type { ClientDetail } from '@/lib/api-types'

interface TabKYCProps {
  clientId: string
  client: ClientDetail
}

const kycStatusConfig = {
  PENDING: {
    label: 'En attente',
    variant: 'outline' as const,
    icon: Clock,
    color: 'text-muted-foreground',
  },
  IN_PROGRESS: {
    label: 'En cours',
    variant: 'info' as const,
    icon: Clock,
    color: 'text-info',
  },
  COMPLETED: {
    label: 'Complété',
    variant: 'success' as const,
    icon: CheckCircle,
    color: 'text-success',
  },
  EXPIRED: {
    label: 'Expiré',
    variant: 'destructive' as const,
    icon: AlertCircle,
    color: 'text-destructive',
  },
  REJECTED: {
    label: 'Rejeté',
    variant: 'destructive' as const,
    icon: AlertTriangle,
    color: 'text-destructive',
  },
}

const riskProfileConfig = {
  CONSERVATIVE: { label: 'Conservateur', color: 'bg-blue-500' },
  BALANCED: { label: 'Équilibré', color: 'bg-green-500' },
  DYNAMIC: { label: 'Dynamique', color: 'bg-orange-500' },
  AGGRESSIVE: { label: 'Agressif', color: 'bg-red-500' },
}

export function TabKYC({ clientId, client }: TabKYCProps) {
  const kycConfig = kycStatusConfig[client.kycStatus]
  const StatusIcon = kycConfig.icon

  // Calculate KYC completion score
  const calculateKYCScore = () => {
    let score = 0
    const checks = [
      client.email,
      client.phone,
      client.birthDate,
      client.profession,
      client.annualIncome,
      client.riskProfile,
      client.investmentHorizon,
    ]
    
    checks.forEach(check => {
      if (check) score += 100 / checks.length
    })
    
    return Math.round(score)
  }

  const kycScore = calculateKYCScore()

  return (
    <div className="space-y-6">
      {/* KYC Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Statut KYC
            </span>
            <Badge variant={kycConfig.variant}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {kycConfig.label}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* KYC Score */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Score de complétude</span>
                <span className="text-2xl font-bold">{kycScore}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    kycScore >= 80
                      ? 'bg-success'
                      : kycScore >= 50
                      ? 'bg-warning'
                      : 'bg-destructive'
                  }`}
                  style={{ width: `${kycScore}%` }}
                />
              </div>
            </div>

            {/* KYC Dates */}
            <div className="grid gap-4 md:grid-cols-2">
              {client.kycCompletedAt && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Date de complétion
                  </p>
                  <p className="text-sm">{formatDate(client.kycCompletedAt)}</p>
                </div>
              )}
              {client.kycNextReviewDate && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Prochaine révision
                  </p>
                  <p className="text-sm">{formatDate(client.kycNextReviewDate)}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Mettre à jour le KYC
              </Button>
              {client.kycStatus === 'EXPIRED' && (
                <Button size="sm" variant="destructive">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Renouveler
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MIF II - Profil Investisseur */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Profil investisseur (MIF II)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Risk Profile */}
            {client.riskProfile && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Profil de risque
                </p>
                <div className="flex items-center gap-3">
                  <div
                    className={`h-3 w-3 rounded-full ${
                      riskProfileConfig[client.riskProfile]?.color || 'bg-gray-500'
                    }`}
                  />
                  <Badge variant="outline">
                    {riskProfileConfig[client.riskProfile]?.label || client.riskProfile}
                  </Badge>
                </div>
              </div>
            )}

            {/* Investment Horizon */}
            {client.investmentHorizon && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Horizon d'investissement
                </p>
                <Badge variant="outline">{client.investmentHorizon}</Badge>
              </div>
            )}

            {/* Investment Goals */}
            {client.investmentGoals && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Objectifs d'investissement
                </p>
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(client.investmentGoals) ? (
                    client.investmentGoals.map((goal: string, index: number) => (
                      <Badge key={index} variant="secondary">
                        {goal}
                      </Badge>
                    ))
                  ) : (
                    <Badge variant="secondary">Non renseigné</Badge>
                  )}
                </div>
              </div>
            )}

            {/* MIF II Score */}
            <div className="rounded-lg border p-4 bg-muted/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Score MIF II global</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Basé sur le questionnaire de connaissance
                  </p>
                </div>
                <div className="text-2xl font-bold">
                  {client.riskProfile ? '85/100' : 'N/A'}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* LCB-FT - Lutte contre le blanchiment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            LCB-FT (Lutte contre le blanchiment)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* PEP Status */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Personne Politiquement Exposée (PPE)</p>
                <p className="text-xs text-muted-foreground">
                  Statut de personne politiquement exposée
                </p>
              </div>
              <Badge variant="outline">Non</Badge>
            </div>

            {/* Origin of Funds */}
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Origine des fonds
              </p>
              <div className="rounded-lg border p-3">
                <p className="text-sm">
                  {client.profession ? `Revenus professionnels (${client.profession})` : 'Non renseigné'}
                </p>
              </div>
            </div>

            {/* Beneficial Owner */}
            {client.clientType === 'PROFESSIONNEL' && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Bénéficiaire effectif
                </p>
                <div className="rounded-lg border p-3">
                  <p className="text-sm">
                    {client.firstName} {client.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Détient plus de 25% du capital
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* KYC Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documents justificatifs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {client.kycDocuments && client.kycDocuments.length > 0 ? (
              client.kycDocuments.map((doc: any) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{doc.type}</p>
                      {doc.expiresAt && (
                        <p className="text-xs text-muted-foreground">
                          Expire le {formatDate(doc.expiresAt)}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge
                    variant={
                      doc.status === 'VALIDATED'
                        ? 'success'
                        : doc.status === 'REJECTED'
                        ? 'destructive'
                        : 'outline'
                    }
                  >
                    {doc.status}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-sm text-muted-foreground">
                Aucun document KYC enregistré
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Compliance Alerts */}
      {client.kycStatus === 'EXPIRED' && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Alerte de conformité
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Le KYC de ce client a expiré. Une mise à jour est requise pour rester conforme
              aux obligations réglementaires.
            </p>
            <Button className="mt-4" variant="destructive">
              Mettre à jour maintenant
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
