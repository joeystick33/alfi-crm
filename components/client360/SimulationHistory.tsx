'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { apiCall } from '@/lib/api-client'
import { formatDate } from '@/lib/utils'
import {
  Calculator,
  TrendingUp,
  Home,
  PiggyBank,
  FileText,
  Share2,
  Eye,
  Archive,
} from 'lucide-react'
import type { Simulation } from '@prisma/client'

interface SimulationWithDetails extends Simulation {
  createdBy: {
    id: string
    firstName: string
    lastName: string
  }
}

interface SimulationHistoryProps {
  clientId: string
}

const simulationTypeLabels: Record<string, string> = {
  RETIREMENT: 'Retraite',
  REAL_ESTATE_LOAN: 'Prêt immobilier',
  LIFE_INSURANCE: 'Assurance vie',
  WEALTH_TRANSMISSION: 'Transmission',
  TAX_OPTIMIZATION: 'Optimisation fiscale',
  INVESTMENT_PROJECTION: 'Projection investissement',
  BUDGET_ANALYSIS: 'Analyse budget',
  OTHER: 'Autre',
}

const simulationTypeIcons: Record<string, any> = {
  RETIREMENT: TrendingUp,
  REAL_ESTATE_LOAN: Home,
  LIFE_INSURANCE: PiggyBank,
  WEALTH_TRANSMISSION: FileText,
  TAX_OPTIMIZATION: Calculator,
  INVESTMENT_PROJECTION: TrendingUp,
  BUDGET_ANALYSIS: Calculator,
  OTHER: FileText,
}

const statusLabels: Record<string, string> = {
  DRAFT: 'Brouillon',
  COMPLETED: 'Terminée',
  SHARED: 'Partagée',
  ARCHIVED: 'Archivée',
}

const statusColors: Record<string, 'default' | 'success' | 'warning' | 'secondary'> = {
  DRAFT: 'secondary',
  COMPLETED: 'success',
  SHARED: 'default',
  ARCHIVED: 'warning',
}

export function SimulationHistory({ clientId }: SimulationHistoryProps) {
  const [simulations, setSimulations] = useState<SimulationWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadSimulations()
  }, [clientId])

  const loadSimulations = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await apiCall<SimulationWithDetails[]>(
        `/api/simulations?clientId=${clientId}`
      )
      setSimulations(data)
    } catch (err: any) {
      console.error('Error loading simulations:', err)
      // Ne pas afficher d'erreur si l'API n'existe pas encore
      setError(null)
      setSimulations([])
    } finally {
      setLoading(false)
    }
  }

  const handleShare = async (simulationId: string) => {
    try {
      await apiCall(`/api/simulations/${simulationId}/share`, {
        method: 'POST',
      })
      // Recharger les simulations
      await loadSimulations()
    } catch (err: any) {
      console.error('Error sharing simulation:', err)
      alert('Erreur lors du partage de la simulation')
    }
  }

  const handleArchive = async (simulationId: string) => {
    try {
      await apiCall(`/api/simulations/${simulationId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'ARCHIVED' }),
      })
      // Recharger les simulations
      await loadSimulations()
    } catch (err: any) {
      console.error('Error archiving simulation:', err)
      alert('Erreur lors de l\'archivage de la simulation')
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historique des simulations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i: any) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historique des simulations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">{error}</div>
        </CardContent>
      </Card>
    )
  }

  if (simulations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historique des simulations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Aucune simulation enregistrée pour ce client
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historique des simulations ({simulations.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {simulations.map((simulation: any) => {
            const Icon = simulationTypeIcons[simulation.type] || FileText

            return (
              <div
                key={simulation.id}
                className="flex items-start gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm">{simulation.name}</h4>
                      {simulation.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {simulation.description}
                        </p>
                      )}
                    </div>
                    <Badge variant={statusColors[simulation.status]}>
                      {statusLabels[simulation.status]}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span>{simulationTypeLabels[simulation.type]}</span>
                    <span>•</span>
                    <span>
                      Créée le {formatDate(new Date(simulation.createdAt))}
                    </span>
                    <span>•</span>
                    <span>
                      Par {simulation.createdBy.firstName}{' '}
                      {simulation.createdBy.lastName}
                    </span>
                    {simulation.sharedWithClient && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Share2 className="w-3 h-3" />
                          Partagée
                        </span>
                      </>
                    )}
                  </div>

                  {simulation.feasibilityScore !== null && (
                    <div className="mt-2">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground">
                          Score de faisabilité:
                        </span>
                        <span className="font-semibold">
                          {simulation.feasibilityScore}/100
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-3">
                    <Button size="sm" variant="outline">
                      <Eye className="w-4 h-4 mr-1" />
                      Voir
                    </Button>

                    {!simulation.sharedWithClient &&
                      simulation.status !== 'ARCHIVED' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleShare(simulation.id)}
                        >
                          <Share2 className="w-4 h-4 mr-1" />
                          Partager
                        </Button>
                      )}

                    {simulation.status !== 'ARCHIVED' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleArchive(simulation.id)}
                      >
                        <Archive className="w-4 h-4 mr-1" />
                        Archiver
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
