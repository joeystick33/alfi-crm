
'use client'

import { useState, useMemo } from 'react'
import { Card } from '@/app/_common/components/ui/Card'
import { Button } from '@/app/_common/components/ui/Button'
import { Input } from '@/app/_common/components/ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import { Badge } from '@/app/_common/components/ui/Badge'
import { EmptyState } from '@/app/_common/components/ui/EmptyState'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import { useDossiers, useDossierStats } from '@/app/_common/hooks/use-api'
import { FolderOpen, Plus, Search, TrendingUp, Clock, CheckCircle2, Archive } from 'lucide-react'
import { useRouter } from 'next/navigation'

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' }> = {
  BROUILLON: { label: 'Brouillon', variant: 'secondary' },
  ACTIF: { label: 'Actif', variant: 'info' },
  EN_COURS: { label: 'En cours', variant: 'default' },
  EN_ATTENTE: { label: 'En attente', variant: 'warning' },
  TERMINE: { label: 'Terminé', variant: 'success' },
  ANNULE: { label: 'Annulé', variant: 'destructive' },
  ARCHIVE: { label: 'Archivé', variant: 'secondary' },
}

const TYPE_CONFIG: Record<string, { label: string }> = {
  PATRIMOINE: { label: 'Patrimoine' },
  SUCCESSION: { label: 'Succession' },
  RETRAITE: { label: 'Retraite' },
  INVESTISSEMENT: { label: 'Investissement' },
  FISCAL: { label: 'Fiscal' },
  IMMOBILIER: { label: 'Immobilier' },
  ASSURANCE: { label: 'Assurance' },
  CONSEIL: { label: 'Conseil' },
  AUDIT: { label: 'Audit' },
  FORMATION: { label: 'Formation' },
  AUTRE: { label: 'Autre' },
}

const PRIORITE_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' }> = {
  BASSE: { label: 'Basse', variant: 'secondary' },
  NORMALE: { label: 'Normale', variant: 'default' },
  HAUTE: { label: 'Haute', variant: 'warning' },
  URGENTE: { label: 'Urgente', variant: 'destructive' },
}

export default function DossiersPage() {
  const router = useRouter()
  const [filters, setFilters] = useState({
    status: 'ALL',
    type: 'ALL',
    priorite: 'ALL',
    search: '',
    isArchive: false,
  })

  const apiFilters = useMemo(() => {
    const f: any = {}
    if (filters.status !== 'ALL') f.status = filters.status
    if (filters.type !== 'ALL') f.type = filters.type
    if (filters.priorite !== 'ALL') f.priorite = filters.priorite
    if (filters.search) f.search = filters.search
    if (filters.isArchive) f.isArchive = filters.isArchive
    return f
  }, [filters])

  const { data, isLoading, error, refetch } = useDossiers(apiFilters)
  const { data: statsData } = useDossierStats({ isArchive: filters.isArchive })

  // API returns { data: dossiers[], total, limit, offset }
  const dossiers = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : [])
  const stats: any = statsData?.data || statsData || {
    total: 0,
    byStatus: { brouillon: 0, actif: 0, enCours: 0, enAttente: 0, termine: 0, annule: 0, archive: 0 },
    progression: { moyenne: 0 },
    financial: { montantEstimeTotal: 0, montantRealiseTotal: 0, budgetAlloueTotal: 0 },
  }

  const _formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)
  }

  const handleResetFilters = () => {
    setFilters({ status: 'ALL', type: 'ALL', priorite: 'ALL', search: '', isArchive: false })
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Mes dossiers</h1>
          <p className="text-slate-600 mt-1">Gestion des dossiers clients et missions</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setFilters(prev => ({ ...prev, isArchive: !prev.isArchive }))}
          >
            <Archive className="h-4 w-4 mr-2" />
            {filters.isArchive ? 'Dossiers actifs' : 'Archives'}
          </Button>
          <Button onClick={() => router.push('/dashboard/dossiers/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau dossier
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total dossiers</p>
              <p className="text-2xl font-bold mt-1">{stats.total}</p>
            </div>
            <div className="p-3 rounded-lg bg-primary/10">
              <FolderOpen className="h-5 w-5 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">En cours</p>
              <p className="text-2xl font-bold mt-1">{stats.byStatus.enCours}</p>
            </div>
            <div className="p-3 rounded-lg bg-info/10">
              <TrendingUp className="h-5 w-5 text-info" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">En attente</p>
              <p className="text-2xl font-bold mt-1">{stats.byStatus.enAttente}</p>
            </div>
            <div className="p-3 rounded-lg bg-warning/10">
              <Clock className="h-5 w-5 text-warning" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Progression moyenne</p>
              <p className="text-2xl font-bold mt-1">{stats.progression.moyenne}%</p>
            </div>
            <div className="p-3 rounded-lg bg-success/10">
              <CheckCircle2 className="h-5 w-5 text-success" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Rechercher par référence, nom..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-9"
              />
            </div>
          </div>

          <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
            <SelectTrigger className="w-full md:w-[150px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tous statuts</SelectItem>
              <SelectItem value="BROUILLON">Brouillon</SelectItem>
              <SelectItem value="ACTIF">Actif</SelectItem>
              <SelectItem value="EN_COURS">En cours</SelectItem>
              <SelectItem value="EN_ATTENTE">En attente</SelectItem>
              <SelectItem value="TERMINE">Terminé</SelectItem>
              <SelectItem value="ANNULE">Annulé</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
            <SelectTrigger className="w-full md:w-[150px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tous types</SelectItem>
              {Object.entries(TYPE_CONFIG).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.priorite} onValueChange={(value) => setFilters(prev => ({ ...prev, priorite: value }))}>
            <SelectTrigger className="w-full md:w-[150px]">
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

          {(filters.search || filters.status !== 'ALL' || filters.type !== 'ALL' || filters.priorite !== 'ALL') && (
            <Button variant="outline" size="sm" onClick={handleResetFilters}>
              Réinitialiser
            </Button>
          )}
        </div>
      </Card>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : error ? (
        <Card className="p-6">
          <div className="text-center text-destructive">
            <p>Erreur lors du chargement des dossiers</p>
            <Button variant="outline" onClick={() => refetch()} className="mt-4">Réessayer</Button>
          </div>
        </Card>
      ) : dossiers.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="Aucun dossier"
          description={
            filters.search || filters.status !== 'ALL' || filters.type !== 'ALL' || filters.priorite !== 'ALL'
              ? 'Aucun dossier ne correspond à vos critères.'
              : 'Créez votre premier dossier client.'
          }
          action={
            !filters.search && filters.status === 'ALL'
              ? { label: 'Créer un dossier', onClick: () => router.push('/dashboard/dossiers/new'), icon: Plus }
              : undefined
          }
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Référence</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Nom</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Client</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Priorité</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Progression</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Statut</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {dossiers.map((dossier: any) => {
                  const statusConfig = STATUS_CONFIG[dossier.status]
                  const typeConfig = TYPE_CONFIG[dossier.type]
                  const prioriteConfig = PRIORITE_CONFIG[dossier.priorite]
                  return (
                    <tr key={dossier.id} className="hover:bg-muted">
                      <td className="px-4 py-3 text-sm font-medium text-foreground">{dossier.reference}</td>
                      <td className="px-4 py-3 text-sm text-foreground">{dossier.nom}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {dossier.client.firstName} {dossier.client.lastName}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="text-muted-foreground">{typeConfig.label}</span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Badge variant={prioriteConfig.variant} className="text-xs">{prioriteConfig.label}</Badge>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary"
                              style={{ width: `${dossier.progressionPct}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium">{dossier.progressionPct}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={statusConfig.variant} className="text-xs">
                          {statusConfig.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/dossiers/${dossier.id}`)}>
                          Voir
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
