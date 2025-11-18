'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, formatDate, formatPercentage } from '@/lib/utils'
import {
  TrendingUp,
  Plus,
  Target,
  Edit,
  Trash2,
  CheckCircle,
} from 'lucide-react'
import { CreateOpportuniteModal } from './CreateOpportuniteModal'
import { UpdateOpportuniteModal } from './UpdateOpportuniteModal'
import { useToast } from '@/hooks/use-toast'

interface TabOpportunitiesProps {
  clientId: string
}

const opportuniteTypeLabels: Record<string, string> = {
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

const opportuniteStatusConfig: Record<string, { label: string; variant: any; color: string }> = {
  DETECTED: { label: 'Détectée', variant: 'outline', color: 'bg-gray-500' },
  QUALIFIED: { label: 'Qualifiée', variant: 'info', color: 'bg-blue-500' },
  CONTACTED: { label: 'Contactée', variant: 'info', color: 'bg-cyan-500' },
  PRESENTED: { label: 'Présentée', variant: 'warning', color: 'bg-yellow-500' },
  ACCEPTED: { label: 'Acceptée', variant: 'success', color: 'bg-green-500' },
  CONVERTED: { label: 'Convertie', variant: 'success', color: 'bg-emerald-500' },
  REJECTED: { label: 'Rejetée', variant: 'destructive', color: 'bg-red-500' },
  LOST: { label: 'Perdue', variant: 'destructive', color: 'bg-gray-400' },
}

const priorityConfig: Record<string, { label: string; variant: any }> = {
  LOW: { label: 'Basse', variant: 'outline' },
  MEDIUM: { label: 'Moyenne', variant: 'secondary' },
  HIGH: { label: 'Haute', variant: 'warning' },
  URGENT: { label: 'Urgente', variant: 'destructive' },
}

export function TabOpportunities({ clientId }: TabOpportunitiesProps) {
  const { toast } = useToast()
  const [opportunites, setOpportunites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [selectedOpportunite, setSelectedOpportunite] = useState<any>(null)

  const fetchOpportunites = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/clients/${clientId}/opportunites`)
      if (!response.ok) throw new Error('Failed to fetch opportunities')
      const data = await response.json()
      setOpportunites(data.data || [])
    } catch (error: any) {
      console.error('Error fetching opportunities:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les opportunités',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOpportunites()
  }, [clientId])

  const handleConvertToProjet = async (opportuniteId: string) => {
    try {
      const response = await fetch(`/api/opportunites/${opportuniteId}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      if (!response.ok) throw new Error('Failed to convert opportunity')

      toast({
        title: 'Opportunité convertie',
        description: 'L\'opportunité a été convertie en projet avec succès',
      })

      fetchOpportunites()
    } catch (error: any) {
      console.error('Error converting opportunity:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de convertir l\'opportunité',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async (opportuniteId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette opportunité ?')) {
      return
    }

    try {
      const response = await fetch(`/api/opportunites/${opportuniteId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete opportunity')

      toast({
        title: 'Opportunité supprimée',
        description: 'L\'opportunité a été supprimée avec succès',
      })

      fetchOpportunites()
    } catch (error: any) {
      console.error('Error deleting opportunity:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer l\'opportunité',
        variant: 'destructive',
      })
    }
  }

  // Calculate total opportunity value
  const totalValue = opportunites.reduce(
    (sum: any, opp: any) => sum + (opp.estimatedValue ? parseFloat(opp.estimatedValue) : 0),
    0
  )

  // Group by status for pipeline view
  const opportunitesByStatus = opportunites.reduce((acc: any, opp: any) => {
    if (!acc[opp.status]) acc[opp.status] = []
    acc[opp.status].push(opp)
    return acc
  }, {})

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Chargement des opportunités...</div>
      </div>
    )
  }

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
              {opportunites.length}
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
              {opportunites.length > 0
                ? formatPercentage(
                    (opportunites.filter((o: any) => o.status === 'CONVERTED').length /
                      opportunites.length) *
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
            <Button size="sm" onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle opportunité
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {opportunites.length > 0 ? (
            <div className="space-y-4">
              {opportunites.map((opportunite: any) => {
                const statusConfig = opportuniteStatusConfig[opportunite.status] || opportuniteStatusConfig.DETECTED
                const priorityConf = priorityConfig[opportunite.priority] || priorityConfig.MEDIUM

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
                            {opportuniteTypeLabels[opportunite.type] || opportunite.type}
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
                            {formatCurrency(parseFloat(opportunite.estimatedValue))}
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
                            {parseFloat(opportunite.confidence).toFixed(0)}%
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
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedOpportunite(opportunite)
                          setShowUpdateModal(true)
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Modifier
                      </Button>
                      {opportunite.status === 'ACCEPTED' && (
                        <Button
                          size="sm"
                          onClick={() => handleConvertToProjet(opportunite.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Convertir en projet
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(opportunite.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer
                      </Button>
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
              <Button className="mt-4" size="sm" onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Créer une opportunité
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pipeline View (Kanban-style summary) */}
      {opportunites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Vue Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              {Object.entries(opportuniteStatusConfig).map(([status, config]) => {
                const count = opportunitesByStatus[status]?.length || 0
                const value = opportunitesByStatus[status]?.reduce(
                  (sum: number, opp: any) => sum + (opp.estimatedValue ? parseFloat(opp.estimatedValue) : 0),
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

      {/* Modals */}
      <CreateOpportuniteModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        clientId={clientId}
        onSuccess={fetchOpportunites}
      />

      <UpdateOpportuniteModal
        isOpen={showUpdateModal}
        onClose={() => {
          setShowUpdateModal(false)
          setSelectedOpportunite(null)
        }}
        opportunite={selectedOpportunite}
        onSuccess={fetchOpportunites}
      />
    </div>
  )
}
