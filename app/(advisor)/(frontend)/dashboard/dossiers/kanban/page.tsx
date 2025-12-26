'use client'
 

import { useState, useMemo } from 'react'
import { Card } from '@/app/_common/components/ui/Card'
import { Button } from '@/app/_common/components/ui/Button'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import { useDossiers, useUpdateDossier } from '@/app/_common/hooks/use-api'
import { 
  Layers, 
  Plus, 
  User, 
  Calendar, 
  TrendingUp, 
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  RefreshCw,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatDate } from '@/app/_common/lib/utils'

type DossierStatus = 'BROUILLON' | 'ACTIF' | 'EN_COURS' | 'EN_ATTENTE' | 'TERMINE' | 'ANNULE'

const STATUS_CONFIG: Record<DossierStatus, {
  label: string
  icon: any
  color: string
  bgColor: string
}> = {
  BROUILLON: { label: 'Brouillon', icon: FileText, color: 'text-slate-700', bgColor: 'bg-slate-100' },
  ACTIF: { label: 'Actif', icon: CheckCircle2, color: 'text-blue-700', bgColor: 'bg-blue-100' },
  EN_COURS: { label: 'En cours', icon: TrendingUp, color: 'text-purple-700', bgColor: 'bg-purple-100' },
  EN_ATTENTE: { label: 'En attente', icon: Clock, color: 'text-orange-700', bgColor: 'bg-orange-100' },
  TERMINE: { label: 'Terminé', icon: CheckCircle2, color: 'text-green-700', bgColor: 'bg-green-100' },
  ANNULE: { label: 'Annulé', icon: AlertCircle, color: 'text-red-700', bgColor: 'bg-red-100' },
}

const PRIORITE_COLORS: Record<string, string> = {
  BASSE: 'border-l-4 border-l-slate-400',
  NORMALE: 'border-l-4 border-l-blue-500',
  HAUTE: 'border-l-4 border-l-orange-500',
  URGENTE: 'border-l-4 border-l-red-500',
}

export default function DossiersKanbanPage() {
  const router = useRouter()
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [prioriteFilter, setPrioriteFilter] = useState('ALL')

  const apiFilters = useMemo(() => {
    const f: any = { isArchive: false }
    if (typeFilter !== 'ALL') f.type = typeFilter
    if (prioriteFilter !== 'ALL') f.priorite = prioriteFilter
    return f
  }, [typeFilter, prioriteFilter])

  const { data, isLoading, error, refetch } = useDossiers(apiFilters)
  const updateMutation = useUpdateDossier()

  const dossiers = data?.data || []

  // Grouper les dossiers par statut
  const dossiersByStatus = useMemo(() => {
    const grouped: Record<DossierStatus, any[]> = {
      BROUILLON: [],
      ACTIF: [],
      EN_COURS: [],
      EN_ATTENTE: [],
      TERMINE: [],
      ANNULE: [],
    }

    dossiers.forEach((dossier: any) => {
      if (grouped[dossier.status as DossierStatus]) {
        grouped[dossier.status as DossierStatus].push(dossier)
      }
    })

    return grouped
  }, [dossiers])

  const handleStatusChange = async (dossierId: string, newStatus: DossierStatus) => {
    await updateMutation.mutateAsync({ id: dossierId, data: { status: newStatus } })
    refetch()
  }

  const handleResetFilters = () => {
    setTypeFilter('ALL')
    setPrioriteFilter('ALL')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Mes dossiers</h1>
          <p className="text-slate-600 mt-1">Vue Kanban - Organisation visuelle par statut</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/dossiers" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
            <Layers className="h-4 w-4 mr-2" />
            Vue liste
          </Link>
          <Button onClick={() => router.push('/dashboard/dossiers/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau dossier
          </Button>
        </div>
      </div>

      {/* Filtres */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 flex items-center gap-4">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous les types</SelectItem>
                <SelectItem value="PATRIMOINE">Patrimoine</SelectItem>
                <SelectItem value="SUCCESSION">Succession</SelectItem>
                <SelectItem value="RETRAITE">Retraite</SelectItem>
                <SelectItem value="INVESTISSEMENT">Investissement</SelectItem>
                <SelectItem value="FISCAL">Fiscal</SelectItem>
                <SelectItem value="IMMOBILIER">Immobilier</SelectItem>
                <SelectItem value="ASSURANCE">Assurance</SelectItem>
              </SelectContent>
            </Select>

            <Select value={prioriteFilter} onValueChange={setPrioriteFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Priorité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Toutes priorités</SelectItem>
                <SelectItem value="BASSE">Basse</SelectItem>
                <SelectItem value="NORMALE">Normale</SelectItem>
                <SelectItem value="HAUTE">Haute</SelectItem>
                <SelectItem value="URGENTE">Urgente</SelectItem>
              </SelectContent>
            </Select>

            {(typeFilter !== 'ALL' || prioriteFilter !== 'ALL') && (
              <Button variant="outline" size="sm" onClick={handleResetFilters}>
                Réinitialiser
              </Button>
            )}
          </div>

          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      {/* Kanban Board */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-20" />
              <Skeleton className="h-32" />
            </div>
          ))}
        </div>
      ) : error ? (
        <Card className="p-6">
          <div className="text-center text-red-600">
            <p>Erreur lors du chargement des dossiers</p>
            <Button variant="outline" onClick={() => refetch()} className="mt-4">Réessayer</Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {(Object.keys(STATUS_CONFIG) as DossierStatus[]).map((status) => {
            const config = STATUS_CONFIG[status]
            const Icon = config.icon
            const statusDossiers = dossiersByStatus[status] || []

            return (
              <div key={status} className="flex flex-col gap-3">
                {/* Column Header */}
                <Card className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded ${config.bgColor}`}>
                        <Icon className={`h-4 w-4 ${config.color}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">{config.label}</h3>
                        <p className="text-xs text-muted-foreground">{statusDossiers.length}</p>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Dossier Cards */}
                <div className="space-y-3 min-h-[200px]">
                  {statusDossiers.length === 0 ? (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      Aucun dossier
                    </div>
                  ) : (
                    statusDossiers.map((dossier: any) => (
                      <Card
                        key={dossier.id}
                        className={`p-3 cursor-pointer hover:shadow-md transition-shadow ${PRIORITE_COLORS[dossier.priorite]}`}
                        onClick={() => router.push(`/dashboard/dossiers/${dossier.id}`)}
                      >
                        <div className="space-y-2">
                          {/* Header */}
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-sm line-clamp-2">{dossier.nom}</p>
                              <p className="text-xs text-muted-foreground mt-1">{dossier.reference}</p>
                            </div>
                          </div>

                          {/* Client */}
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <User className="h-3 w-3" />
                            <span className="truncate">
                              {dossier.client.firstName} {dossier.client.lastName}
                            </span>
                          </div>

                          {/* Type badge */}
                          <Badge variant="outline" className="text-xs">
                            {dossier.type}
                          </Badge>

                          {/* Progression */}
                          {dossier.progressionPct > 0 && (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Progression</span>
                                <span className="font-medium">{dossier.progressionPct}%</span>
                              </div>
                              <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-600 transition-all"
                                  style={{ width: `${dossier.progressionPct}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Date */}
                          {dossier.dateOuverture && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(new Date(dossier.dateOuverture))}</span>
                            </div>
                          )}

                          {/* Actions de changement de statut */}
                          <div className="pt-2 border-t">
                            <Select
                              value={dossier.status}
                              onValueChange={(newStatus) => {
                                if (newStatus !== dossier.status) {
                                  handleStatusChange(dossier.id, newStatus as DossierStatus)
                                }
                              }}
                            >
                              <SelectTrigger className="h-7 text-xs" onClick={(e) => e.stopPropagation()}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {(Object.keys(STATUS_CONFIG) as DossierStatus[]).map((s) => (
                                  <SelectItem key={s} value={s} className="text-xs">
                                    {STATUS_CONFIG[s].label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
