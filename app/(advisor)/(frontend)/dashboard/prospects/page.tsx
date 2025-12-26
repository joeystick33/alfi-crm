 
'use client'

import { useState, useMemo } from 'react'
import { Card } from '@/app/_common/components/ui/Card'
import { Button } from '@/app/_common/components/ui/Button'
import { Input } from '@/app/_common/components/ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import { EmptyState } from '@/app/_common/components/ui/EmptyState'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import { useClients } from '@/app/_common/hooks/use-api'
import {
  ProspectCard,
  ConvertProspectModal,
  type ProspectData,
} from '@/app/(advisor)/(frontend)/components/prospects'
import {
  Plus,
  Search,
  Users,
  TrendingUp,
  CheckCircle2,
  UserPlus,
  Grid,
  List,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ProspectsPage() {
  const router = useRouter()
  const [filters, setFilters] = useState({
    search: '',
    clientType: 'ALL',
  })
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [convertingProspect, setConvertingProspect] = useState<ProspectData | null>(null)

  // Fetch prospects (clients with status PROSPECT)
  const apiFilters = useMemo(() => {
    const f: any = { status: 'PROSPECT' }
    if (filters.search) f.search = filters.search
    if (filters.clientType !== 'ALL') f.clientType = filters.clientType
    return f
  }, [filters])

  const { data, isLoading, error, refetch } = useClients(apiFilters)

  const prospects: ProspectData[] = (data?.data || []).map((client: any) => ({
    id: client.id,
    firstName: client.firstName,
    lastName: client.lastName,
    email: client.email,
    phone: client.phone,
    mobile: client.mobile,
    clientType: client.clientType,
    companyName: client.companyName,
    status: client.status,
    createdAt: client.createdAt,
    lastContactDate: client.lastContactDate,
    conseiller: client.conseiller,
    _count: client._count,
  }))

  // Calculate stats
  const stats = useMemo(() => {
    const total = prospects.length
    const withOpportunities = prospects.filter((p) => p._count && p._count.opportunites > 0).length
    const withMeetings = prospects.filter((p) => p._count && p._count.rendezvous > 0).length
    const conversionRate = total > 0 ? 0 : 0 // Real conversion rate would need historical data
    
    return {
      total,
      withOpportunities,
      withMeetings,
      conversionRate,
    }
  }, [prospects])

  const handleEdit = (prospect: ProspectData) => {
    router.push(`/dashboard/clients/${prospect.id}`)
  }

  const handleConvert = (prospectId: string) => {
    const prospect = prospects.find((p) => p.id === prospectId)
    if (prospect) {
      setConvertingProspect(prospect)
    }
  }

  const handleResetFilters = () => {
    setFilters({ search: '', clientType: 'ALL' })
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Mes prospects</h1>
          <p className="text-slate-600 mt-1">
            Pipeline prospects et conversions
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/clients/new?type=prospect')}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau prospect
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total prospects</p>
              <p className="text-2xl font-bold mt-1">{stats.total}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-100">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Avec opportunités</p>
              <p className="text-2xl font-bold mt-1">{stats.withOpportunities}</p>
            </div>
            <div className="p-3 rounded-lg bg-orange-100">
              <TrendingUp className="h-5 w-5 text-orange-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Avec RDV planifiés</p>
              <p className="text-2xl font-bold mt-1">{stats.withMeetings}</p>
            </div>
            <div className="p-3 rounded-lg bg-green-100">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Taux conversion</p>
              <p className="text-2xl font-bold mt-1">{stats.conversionRate}%</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-100">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Rechercher par nom, email..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-9"
              />
            </div>
          </div>

          {/* Type filter */}
          <Select
            value={filters.clientType}
            onValueChange={(value) => setFilters(prev => ({ ...prev, clientType: value }))}
          >
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tous les types</SelectItem>
              <SelectItem value="PARTICULIER">Particuliers</SelectItem>
              <SelectItem value="PROFESSIONNEL">Professionnels</SelectItem>
            </SelectContent>
          </Select>

          {/* View toggle */}
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'grid' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {/* Reset */}
          {(filters.search || filters.clientType !== 'ALL') && (
            <Button variant="outline" size="sm" onClick={handleResetFilters}>
              Réinitialiser
            </Button>
          )}
        </div>
      </Card>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : error ? (
        <Card className="p-6">
          <div className="text-center text-red-600">
            <p>Erreur lors du chargement des prospects</p>
            <Button variant="outline" onClick={() => refetch()} className="mt-4">
              Réessayer
            </Button>
          </div>
        </Card>
      ) : prospects.length === 0 ? (
        <EmptyState
          icon={UserPlus}
          title="Aucun prospect trouvé"
          description={
            filters.search || filters.clientType !== 'ALL'
              ? 'Aucun prospect ne correspond à vos critères de recherche.'
              : 'Commencez par ajouter vos premiers prospects pour développer votre portefeuille.'
          }
          action={
            !filters.search && filters.clientType === 'ALL'
              ? {
                  label: 'Créer un prospect',
                  onClick: () => router.push('/dashboard/clients/new?type=prospect'),
                  icon: Plus,
                }
              : undefined
          }
        />
      ) : (
        <div className={`
          ${viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
            : 'space-y-4'
          }
        `}>
          {prospects.map((prospect) => (
            <ProspectCard
              key={prospect.id}
              prospect={prospect}
              onEdit={handleEdit}
              onConvert={handleConvert}
            />
          ))}
        </div>
      )}

      {/* Convert Modal */}
      <ConvertProspectModal
        open={!!convertingProspect}
        onOpenChange={(open) => !open && setConvertingProspect(null)}
        prospect={convertingProspect}
        onSuccess={() => refetch()}
      />
    </div>
  )
}
