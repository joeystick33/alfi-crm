
'use client'

import { useState, useMemo } from 'react'
import { Card } from '@/app/_common/components/ui/Card'
import { Button } from '@/app/_common/components/ui/Button'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Input } from '@/app/_common/components/ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import { EmptyState } from '@/app/_common/components/ui/EmptyState'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import { useDossiers, useDossierStats, useUnarchiveDossier } from '@/app/_common/hooks/use-api'
import {
  Archive,
  Search,
  ArchiveRestore,
  Eye,
  Calendar,
  User,
  FolderOpen,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatDate } from '@/app/_common/lib/utils'

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  PATRIMOINE: { label: 'Patrimoine', color: 'text-blue-700' },
  SUCCESSION: { label: 'Succession', color: 'text-purple-700' },
  RETRAITE: { label: 'Retraite', color: 'text-green-700' },
  INVESTISSEMENT: { label: 'Investissement', color: 'text-indigo-700' },
  FISCAL: { label: 'Fiscal', color: 'text-red-700' },
  IMMOBILIER: { label: 'Immobilier', color: 'text-orange-700' },
  ASSURANCE: { label: 'Assurance', color: 'text-teal-700' },
  CONSEIL: { label: 'Conseil', color: 'text-pink-700' },
  AUDIT: { label: 'Audit', color: 'text-yellow-700' },
  FORMATION: { label: 'Formation', color: 'text-cyan-700' },
  AUTRE: { label: 'Autre', color: 'text-slate-700' },
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  TERMINE: { label: 'Terminé', color: 'bg-green-100 text-green-700 border-green-200' },
  ANNULE: { label: 'Annulé', color: 'bg-red-100 text-red-700 border-red-200' },
  ARCHIVE: { label: 'Archivé', color: 'bg-slate-100 text-slate-700 border-slate-200' },
}

export default function DossiersArchivesPage() {
  const router = useRouter()
  const [filters, setFilters] = useState({
    search: '',
    type: 'ALL',
    status: 'ALL',
  })

  const apiFilters = useMemo(() => {
    const f: any = { isArchive: true }
    if (filters.search) f.search = filters.search
    if (filters.type !== 'ALL') f.type = filters.type
    if (filters.status !== 'ALL') f.status = filters.status
    return f
  }, [filters])

  const { data, isLoading, error, refetch } = useDossiers(apiFilters)
  const { data: statsData } = useDossierStats({ isArchive: true })
  const unarchiveMutation = useUnarchiveDossier()

  // Gérer les différentes structures de réponse API
  const dossiers = useMemo(() => {
    if (!data) return []
    const apiData = data as Record<string, unknown>
    const rawData = apiData.data || apiData.dossiers || data
    return Array.isArray(rawData) ? rawData : []
  }, [data])
  const stats: any = statsData || {
    total: 0,
    byStatus: {},
    byType: {},
    financial: { montantEstimeTotal: 0, montantRealiseTotal: 0 },
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount)
  }

  const handleUnarchive = async (dossierId: string) => {
    await unarchiveMutation.mutateAsync(dossierId)
    refetch()
  }

  const handleResetFilters = () => {
    setFilters({ search: '', type: 'ALL', status: 'ALL' })
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Archive className="h-7 w-7 text-slate-600" />
            Dossiers archivés
          </h1>
          <p className="text-slate-600 mt-1">Historique et missions terminées ou annulées</p>
        </div>
        <Link
          href="/dashboard/dossiers"
          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
        >
          <FolderOpen className="h-4 w-4 mr-2" />
          Dossiers actifs
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total archivés</p>
              <p className="text-2xl font-bold mt-1">{stats.total}</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-100">
              <Archive className="h-5 w-5 text-slate-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Terminés</p>
              <p className="text-2xl font-bold mt-1 text-green-600">{stats.byStatus?.termine || 0}</p>
            </div>
            <div className="p-3 rounded-lg bg-green-100">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Montant estimé</p>
              <p className="text-2xl font-bold mt-1">{formatCurrency(stats.financial?.montantEstimeTotal || 0)}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-100">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Montant réalisé</p>
              <p className="text-2xl font-bold mt-1 text-emerald-600">{formatCurrency(stats.financial?.montantRealiseTotal || 0)}</p>
            </div>
            <div className="p-3 rounded-lg bg-emerald-100">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
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
                placeholder="Rechercher par référence, nom, client..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-9"
              />
            </div>
          </div>

          <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tous les types</SelectItem>
              {Object.entries(TYPE_CONFIG).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
            <SelectTrigger className="w-full md:w-[150px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tous statuts</SelectItem>
              <SelectItem value="TERMINE">Terminé</SelectItem>
              <SelectItem value="ANNULE">Annulé</SelectItem>
            </SelectContent>
          </Select>

          {(filters.search || filters.type !== 'ALL' || filters.status !== 'ALL') && (
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
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : error ? (
        <Card className="p-6">
          <div className="text-center text-red-600">
            <p>Erreur lors du chargement des dossiers archivés</p>
            <Button variant="outline" onClick={() => refetch()} className="mt-4">Réessayer</Button>
          </div>
        </Card>
      ) : dossiers.length === 0 ? (
        <EmptyState
          icon={Archive}
          title="Aucun dossier archivé"
          description={
            filters.search || filters.type !== 'ALL' || filters.status !== 'ALL'
              ? 'Aucun dossier archivé ne correspond à vos critères.'
              : 'Les dossiers terminés ou annulés apparaîtront ici une fois archivés.'
          }
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Référence</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Nom</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Client</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Statut</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Date archivage</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Mont. réalisé</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {dossiers.map((dossier: any) => {
                  const statusConfig = STATUS_CONFIG[dossier.status] || STATUS_CONFIG.ARCHIVE
                  const typeConfig = TYPE_CONFIG[dossier.type] || TYPE_CONFIG.AUTRE

                  return (
                    <tr key={dossier.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">{dossier.reference}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{dossier.nom}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <User className="h-3 w-3" />
                          {dossier.client.firstName} {dossier.client.lastName}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={typeConfig.color}>{typeConfig.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={`${statusConfig.color} text-xs border`}>
                          {statusConfig.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {dossier.archivedAt ? (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3 w-3" />
                            {formatDate(new Date(dossier.archivedAt))}
                          </div>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                        {dossier.montantRealise ? formatCurrency(Number(dossier.montantRealise)) : '-'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/dashboard/dossiers/${dossier.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUnarchive(dossier.id)}
                            disabled={unarchiveMutation.isPending}
                          >
                            <ArchiveRestore className="h-4 w-4" />
                          </Button>
                        </div>
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
