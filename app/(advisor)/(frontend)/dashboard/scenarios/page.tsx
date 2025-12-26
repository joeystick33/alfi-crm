 
'use client'

import { useState, useMemo } from 'react'
import { Card } from '@/app/_common/components/ui/Card'
import { Button } from '@/app/_common/components/ui/Button'
import { Input } from '@/app/_common/components/ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import { Badge } from '@/app/_common/components/ui/Badge'
import { EmptyState } from '@/app/_common/components/ui/EmptyState'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import { 
  useScenarios, 
  useScenarioStats, 
  useDeleteScenario,
  useActivateScenario,
  useDeactivateScenario,
  useArchiveScenario
} from '@/app/_common/hooks/use-api'
import { 
  Sparkles, 
  Plus, 
  Search, 
  Zap, 
  Clock, 
  PlayCircle,
  Eye,
  Edit,
  Trash2,
  StopCircle,
  Archive,
  MoreVertical
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { formatDate } from '@/app/_common/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/app/_common/components/ui/DropdownMenu'

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  BROUILLON: { label: 'Brouillon', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  ACTIF: { label: 'Actif', color: 'bg-green-100 text-green-700 border-green-200' },
  INACTIF: { label: 'Inactif', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  ARCHIVE: { label: 'Archivé', color: 'bg-slate-100 text-slate-500 border-slate-200' },
}

const TRIGGER_CONFIG: Record<string, { label: string; icon: typeof Sparkles }> = {
  CLIENT_CREE: { label: 'Client créé', icon: Sparkles },
  CLIENT_ANNIVERSAIRE: { label: 'Anniversaire client', icon: Clock },
  CLIENT_INACTIF: { label: 'Client inactif', icon: Clock },
  CONTRAT_SIGNE: { label: 'Contrat signé', icon: Zap },
  CONTRAT_BIENTOT_ECHEANCE: { label: 'Contrat bientôt à échéance', icon: Clock },
  DOSSIER_CREE: { label: 'Dossier créé', icon: Sparkles },
  DOSSIER_TERMINE: { label: 'Dossier terminé', icon: Zap },
  RENDEZ_VOUS_TERMINE: { label: 'Rendez-vous terminé', icon: Zap },
  MANUEL: { label: 'Manuel', icon: PlayCircle },
}

export default function ScenariosPage() {
  const router = useRouter()
  const [filters, setFilters] = useState({
    status: 'ALL',
    trigger: 'ALL',
    search: '',
  })

  const apiFilters = useMemo(() => {
    const f: any = {}
    if (filters.status !== 'ALL') f.status = filters.status
    if (filters.trigger !== 'ALL') f.trigger = filters.trigger
    if (filters.search) f.search = filters.search
    return f
  }, [filters])

  const { data, isLoading, error, refetch } = useScenarios(apiFilters)
  const { data: statsData } = useScenarioStats()
  const deleteMutation = useDeleteScenario()
  const activateMutation = useActivateScenario()
  const deactivateMutation = useDeactivateScenario()
  const archiveMutation = useArchiveScenario()

  const scenarios = data?.data || []
  const stats = statsData || {
    total: 0,
    byStatus: {} as Record<string, number>,
    totalExecutions: 0,
  }

  const handleResetFilters = () => {
    setFilters({ status: 'ALL', trigger: 'ALL', search: '' })
  }

  const handleActivateScenario = async (id: string) => {
    await activateMutation.mutateAsync(id)
  }

  const handleDeactivateScenario = async (id: string) => {
    await deactivateMutation.mutateAsync(id)
  }

  const handleArchiveScenario = async (id: string) => {
    if (confirm('Voulez-vous vraiment archiver ce scénario ?')) {
      await archiveMutation.mutateAsync(id)
    }
  }

  const handleDeleteScenario = async (id: string) => {
    if (confirm('Voulez-vous vraiment supprimer ce scénario ? Cette action est irréversible.')) {
      await deleteMutation.mutateAsync(id)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Scénarios automatiques</h1>
          <p className="text-slate-600 mt-1">Workflows et automatisation marketing</p>
        </div>
        <Button onClick={() => router.push('/dashboard/scenarios/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau scénario
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total scénarios</p>
              <p className="text-2xl font-bold mt-1">{stats.total}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-100">
              <Sparkles className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Scénarios actifs</p>
              <p className="text-2xl font-bold mt-1">{stats.byStatus.ACTIF || 0}</p>
            </div>
            <div className="p-3 rounded-lg bg-green-100">
              <PlayCircle className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Exécutions totales</p>
              <p className="text-2xl font-bold mt-1">{stats.totalExecutions.toLocaleString('fr-FR')}</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-100">
              <Zap className="h-5 w-5 text-purple-600" />
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
                placeholder="Rechercher par nom..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-9"
              />
            </div>
          </div>

          <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tous statuts</SelectItem>
              <SelectItem value="BROUILLON">Brouillon</SelectItem>
              <SelectItem value="ACTIF">Actif</SelectItem>
              <SelectItem value="INACTIF">Inactif</SelectItem>
              <SelectItem value="ARCHIVE">Archivé</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.trigger} onValueChange={(value) => setFilters(prev => ({ ...prev, trigger: value }))}>
            <SelectTrigger className="w-full md:w-[220px]">
              <SelectValue placeholder="Déclencheur" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tous déclencheurs</SelectItem>
              {Object.entries(TRIGGER_CONFIG).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(filters.search || filters.status !== 'ALL' || filters.trigger !== 'ALL') && (
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
          <div className="text-center text-red-600">
            <p>Erreur lors du chargement des scénarios</p>
            <Button variant="outline" onClick={() => refetch()} className="mt-4">Réessayer</Button>
          </div>
        </Card>
      ) : scenarios.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="Aucun scénario"
          description={
            filters.search || filters.status !== 'ALL' || filters.trigger !== 'ALL'
              ? 'Aucun scénario ne correspond à vos critères.'
              : 'Automatisez vos actions récurrentes avec des scénarios.'
          }
          action={
            !filters.search && filters.status === 'ALL'
              ? { label: 'Créer un scénario', onClick: () => router.push('/dashboard/scenarios/new'), icon: Plus }
              : undefined
          }
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Nom</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Déclencheur</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Délai</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Template</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Exécutions</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Dernière exécution</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Statut</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {scenarios.map((scenario: any) => {
                  const statusConfig = STATUS_CONFIG[scenario.status]
                  const triggerConfig = TRIGGER_CONFIG[scenario.trigger]
                  const TriggerIcon = triggerConfig.icon
                  return (
                    <tr key={scenario.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-slate-900">{scenario.name}</p>
                          {scenario.description && (
                            <p className="text-xs text-slate-500 mt-0.5">{scenario.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <TriggerIcon className="h-4 w-4 text-slate-400" />
                          {triggerConfig.label}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {scenario.delayHours > 0 
                          ? `${scenario.delayHours}h` 
                          : 'Immédiat'}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {scenario.emailTemplate?.name || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-900 font-medium">
                        {scenario.executionCount.toLocaleString('fr-FR')}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {scenario.lastExecutedAt ? formatDate(scenario.lastExecutedAt) : 'Jamais'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={`${statusConfig.color} text-xs border`}>
                          {statusConfig.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/dashboard/scenarios/${scenario.id}`)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Voir détails
                            </DropdownMenuItem>
                            
                            {(scenario.status === 'BROUILLON' || scenario.status === 'INACTIF') && (
                              <>
                                <DropdownMenuItem onClick={() => router.push(`/dashboard/scenarios/${scenario.id}/edit`)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Modifier
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleActivateScenario(scenario.id)}>
                                  <PlayCircle className="h-4 w-4 mr-2" />
                                  Activer
                                </DropdownMenuItem>
                              </>
                            )}

                            {scenario.status === 'ACTIF' && (
                              <DropdownMenuItem onClick={() => handleDeactivateScenario(scenario.id)}>
                                <StopCircle className="h-4 w-4 mr-2" />
                                Désactiver
                              </DropdownMenuItem>
                            )}

                            {scenario.status !== 'ARCHIVE' && (
                              <DropdownMenuItem onClick={() => handleArchiveScenario(scenario.id)}>
                                <Archive className="h-4 w-4 mr-2" />
                                Archiver
                              </DropdownMenuItem>
                            )}

                            {(scenario.status === 'BROUILLON' || scenario.status === 'ARCHIVE') && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteScenario(scenario.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Supprimer
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
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
