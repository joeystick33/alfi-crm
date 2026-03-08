 
'use client'

import { useState, useMemo } from 'react'
import { Card } from '@/app/_common/components/ui/Card'
import { Button } from '@/app/_common/components/ui/Button'
import { Input } from '@/app/_common/components/ui/Input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/app/_common/components/ui/Select'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import { EmptyState } from '@/app/_common/components/ui/EmptyState'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/app/_common/components/ui/DropdownMenu'
import { 
  AlertTriangle, Plus, Search, MoreVertical, CheckCircle2,
  Clock, TrendingUp, AlertCircle, Eye, Trash2
} from 'lucide-react'
import { 
  useReclamations, 
  useReclamationStats,
  useResolveReclamation,
  useEscalateReclamation,
  useDeleteReclamation
} from '@/app/_common/hooks/use-api'
import type { ReclamationFilters, ReclamationStatus, ReclamationType, SLASeverity } from '@/app/_common/lib/api-types'
import Link from 'next/link'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const STATUS_LABELS: Record<ReclamationStatus, string> = {
  RECUE: 'Reçue',
  EN_COURS: 'En cours',
  EN_ATTENTE_INFO: 'En attente info',
  RESOLUE: 'Résolue',
  CLOTUREE: 'Clôturée',
  ESCALADEE: 'Escaladée'
}

const STATUS_COLORS: Record<ReclamationStatus, 'default' | 'secondary' | 'success' | 'destructive' | 'warning'> = {
  RECUE: 'secondary',
  EN_COURS: 'default',
  EN_ATTENTE_INFO: 'warning',
  RESOLUE: 'success',
  CLOTUREE: 'default',
  ESCALADEE: 'warning'
}

const TYPE_LABELS: Record<ReclamationType, string> = {
  QUALITE_SERVICE: 'Qualité service',
  TARIFICATION: 'Frais',
  QUALITE_CONSEIL: 'Qualité conseil',
  COMMUNICATION: 'Communication',
  DOCUMENT: 'Document',
  AUTRE: 'Autre'
}

const SEVERITY_COLORS: Record<SLASeverity, string> = {
  BASSE: 'text-green-600',
  MOYENNE: 'text-blue-600',
  HAUTE: 'text-orange-600',
  CRITIQUE: 'text-red-600'
}

export default function ReclamationsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ReclamationStatus | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<ReclamationType | 'all'>('all')
  const [showOnlyBreach, setShowOnlyBreach] = useState(false)

  const filters = useMemo<ReclamationFilters>(() => {
    const f: ReclamationFilters = {}
    if (search) f.search = search
    if (statusFilter !== 'all') f.status = statusFilter
    if (typeFilter !== 'all') f.type = typeFilter
    if (showOnlyBreach) f.slaBreach = true
    return f
  }, [search, statusFilter, typeFilter, showOnlyBreach])

  const { data: reclamationsData, isLoading, error } = useReclamations(filters)
  const { data: stats } = useReclamationStats()
  const resolveReclamation = useResolveReclamation()
  const escalateReclamation = useEscalateReclamation()
  const deleteReclamation = useDeleteReclamation()

  const reclamations = reclamationsData?.data || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Réclamations</h1>
          <p className="text-muted-foreground">Gestion SLA et traçabilité complète</p>
        </div>
        <Link href="/dashboard/reclamations/nouvelle">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle réclamation
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Total</p>
          </div>
          <p className="text-2xl font-bold">{stats?.total || 0}</p>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-orange-600" />
            <p className="text-sm text-muted-foreground">En cours</p>
          </div>
          <p className="text-2xl font-bold text-orange-600">
            {(stats?.byStatus?.['EN_COURS'] || 0) + (stats?.byStatus?.['RECUE'] || 0)}
          </p>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <p className="text-sm text-muted-foreground">Résolues</p>
          </div>
          <p className="text-2xl font-bold text-green-600">{stats?.byStatus?.['RESOLUE'] || 0}</p>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <p className="text-sm text-muted-foreground">SLA dépassés</p>
          </div>
          <p className="text-2xl font-bold text-red-600">{stats?.slaBreaches || 0}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {stats?.slaBreachRate?.toFixed(1) || 0}% du total
          </p>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            <p className="text-sm text-muted-foreground">Délai moyen</p>
          </div>
          <p className="text-2xl font-bold text-blue-600">{stats?.avgResolutionDays || 0}j</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par référence, sujet..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ReclamationStatus | 'all')}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as ReclamationType | 'all')}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tous les types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              {Object.entries(TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant={showOnlyBreach ? 'default' : 'outline'}
            onClick={() => setShowOnlyBreach(!showOnlyBreach)}
          >
            <AlertCircle className="h-4 w-4 mr-2" />
            SLA dépassés
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Card>
        {isLoading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : reclamations.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={AlertTriangle}
              title="Aucune réclamation"
              description="Aucune réclamation ne correspond à vos critères"
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-medium">Référence</th>
                  <th className="text-left p-4 font-medium">Client</th>
                  <th className="text-left p-4 font-medium">Sujet</th>
                  <th className="text-left p-4 font-medium">Type</th>
                  <th className="text-left p-4 font-medium">Statut</th>
                  <th className="text-left p-4 font-medium">SLA</th>
                  <th className="text-left p-4 font-medium">Date limite</th>
                  <th className="text-right p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reclamations.map((reclamation) => (
                  <tr key={reclamation.id} className="border-b hover:bg-muted/50">
                    <td className="p-4">
                      <Link 
                        href={`/dashboard/reclamations/${reclamation.id}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {reclamation.reference}
                      </Link>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium">
                          {reclamation.client.firstName} {reclamation.client.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">{reclamation.client.email}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="font-medium truncate max-w-xs">{reclamation.subject}</p>
                    </td>
                    <td className="p-4">
                      <Badge variant="secondary">{TYPE_LABELS[reclamation.type]}</Badge>
                    </td>
                    <td className="p-4">
                      <Badge variant={STATUS_COLORS[reclamation.status]}>
                        {STATUS_LABELS[reclamation.status]}
                      </Badge>
                    </td>
                    <td className="p-4">
                      {reclamation.slaBreach ? (
                        <Badge variant="destructive">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Dépassé
                        </Badge>
                      ) : (
                        <Badge variant="secondary">OK</Badge>
                      )}
                    </td>
                    <td className="p-4">
                      <p className="text-sm">
                        {format(new Date(reclamation.deadline), 'dd MMM yyyy', { locale: fr })}
                      </p>
                    </td>
                    <td className="p-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <Link href={`/dashboard/reclamations/${reclamation.id}`}>
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              Voir détails
                            </DropdownMenuItem>
                          </Link>
                          {reclamation.status === 'EN_COURS' && (
                            <DropdownMenuItem
                              onClick={() => {
                                if (confirm('Résoudre cette réclamation ?')) {
                                  resolveReclamation.mutate({
                                    id: reclamation.id,
                                    data: { responseText: 'Résolu' }
                                  })
                                }
                              }}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Résoudre
                            </DropdownMenuItem>
                          )}
                          {reclamation.status !== 'ESCALADEE' && reclamation.status !== 'RESOLUE' && (
                            <DropdownMenuItem
                              onClick={() => {
                                if (confirm('Escalader cette réclamation au médiateur ?')) {
                                  escalateReclamation.mutate({
                                    id: reclamation.id,
                                    data: { reason: 'Escalade manuelle' }
                                  })
                                }
                              }}
                            >
                              <AlertTriangle className="h-4 w-4 mr-2" />
                              Escalader
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => {
                              if (confirm('Supprimer cette réclamation ?')) {
                                deleteReclamation.mutate(reclamation.id)
                              }
                            }}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
