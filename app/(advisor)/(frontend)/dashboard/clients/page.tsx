'use client'


import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useInfiniteScroll } from '@/app/_common/hooks/use-infinite-scroll'
import { Button } from '@/app/_common/components/ui/Button'
import { ClientCard, type ClientCardVariant } from '@/app/(advisor)/(frontend)/components/clients/ClientCard'
import { ClientFilters } from '@/app/(advisor)/(frontend)/components/clients/ClientFilters'
import { CreateClientWizard } from '@/app/(advisor)/(frontend)/components/clients/CreateClientWizard'
import { LoadingState } from '@/app/_common/components/ui/LoadingState'
import { ErrorState, getErrorVariant } from '@/app/_common/components/ui/ErrorState'
import { EmptyState } from '@/app/_common/components/ui/EmptyState'
import { Card } from '@/app/_common/components/ui/Card'
import {
  Plus,
  Search,
  Loader2,
  Users,
  LayoutGrid,
  List,
  SlidersHorizontal,
  X
} from 'lucide-react'
import type { ClientListItem, ClientFilters as ClientFiltersType } from '@/app/_common/lib/api-types'
import { buildQueryString } from '@/app/_common/lib/api-client'
import { debounce } from '@/app/_common/lib/performance'
import { cn } from '@/app/_common/lib/utils'

export default function ClientsPage() {
  const router = useRouter()
  const [filters, setFilters] = useState<Partial<ClientFiltersType>>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [viewMode, setViewMode] = useState<ClientCardVariant>('list')
  const [showFilters, setShowFilters] = useState(false)

  // Build endpoint with filters
  const endpoint = useMemo(() => {
    const params = { ...filters, search: searchTerm }
    return `/advisor/clients${buildQueryString(params)}`
  }, [filters, searchTerm])

  const {
    items: clients,
    totalCount,
    isLoading,
    isError,
    error,
    hasNextPage,
    isFetchingNextPage,
    loadMoreRef,
    refetch,
  } = useInfiniteScroll<ClientListItem>({
    queryKey: ['clients', 'infinite', filters, searchTerm],
    endpoint,
    pageSize: 20,
  })

  // Debounced search to avoid too many API calls
  const handleSearch = useMemo(
    () =>
      debounce((value: any) => {
        setSearchTerm(value)
      }, 300),
    []
  )

  const handleFilterChange = (newFilters: any) => {
    setFilters({ ...filters, ...newFilters })
  }

  return (
    <div className="space-y-6">
      {/* Premium Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg shadow-indigo-500/20">
            <Users className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Clients</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Chargement...
                </span>
              ) : (
                <span className="tabular-nums">
                  {totalCount.toLocaleString('fr-FR')} client{totalCount > 1 ? 's' : ''}
                </span>
              )}
            </p>
          </div>
        </div>

        <Button onClick={() => setCreateModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouveau client
        </Button>
      </header>

      {/* Search & Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, email..."
              className={cn(
                'w-full h-10 pl-10 pr-4 text-sm',
                'bg-white border border-gray-200 rounded-xl',
                'placeholder:text-gray-400',
                'focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300',
                'transition-all duration-150'
              )}
              onChange={(e: any) => handleSearch(e.target.value)}
              defaultValue={searchTerm}
            />
          </div>
        </div>

        {/* Filters Toggle */}
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            'gap-2',
            showFilters && 'bg-indigo-50 border-indigo-200 text-indigo-700'
          )}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtres
          {Object.keys(filters).length > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-indigo-100 text-indigo-700 rounded-full">
              {Object.keys(filters).length}
            </span>
          )}
        </Button>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              'p-2 rounded-md transition-all duration-150',
              viewMode === 'grid'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            )}
            title="Vue grille"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              'p-2 rounded-md transition-all duration-150',
              viewMode === 'list'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            )}
            title="Vue liste"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <ClientFilters filters={filters} onFilterChange={handleFilterChange} />
            {Object.keys(filters).length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilters({})}
                className="text-gray-500 hover:text-rose-600 gap-1.5"
              >
                <X className="h-3.5 w-3.5" />
                Effacer
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Client List */}
      {isLoading ? (
        <LoadingState variant={viewMode === 'list' ? 'list' : 'cards'} count={6} />
      ) : isError ? (
        <ErrorState
          error={error as Error}
          variant={getErrorVariant(error as Error)}
          onRetry={() => refetch()}
        />
      ) : clients.length > 0 ? (
        <>
          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {clients.map((client: any) => (
                <ClientCard
                  key={client.id}
                  client={client}
                  variant="grid"
                  onClick={() => router.push(`/dashboard/clients/${client.id}`)}
                />
              ))}
            </div>
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <Card className="overflow-hidden divide-y divide-gray-100">
              {/* List Header - same grid as rows */}
              {/* Colonnes: Avatar | Client | Contact | Patrimoine | Revenus | Dernier contact | Flèche */}
              <div className={cn(
                'hidden md:grid items-center px-5 py-3 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider gap-4',
                'grid-cols-[40px_1fr_180px_110px_20px]',
                'lg:grid-cols-[40px_1fr_200px_110px_100px_20px]',
                'xl:grid-cols-[40px_1fr_200px_110px_100px_100px_20px]'
              )}>
                <div>{/* Avatar */}</div>
                <div>Client</div>
                <div>Contact</div>
                <div className="text-right">Patrimoine</div>
                <div className="hidden lg:block text-right">Revenus</div>
                <div className="hidden xl:block text-right">Dernier contact</div>
                <div>{/* Flèche */}</div>
              </div>
              {/* Client Rows */}
              <div className="divide-y divide-gray-100">
                {clients.map((client: any) => (
                  <ClientCard
                    key={client.id}
                    client={client}
                    variant="list"
                    onClick={() => router.push(`/dashboard/clients/${client.id}`)}
                  />
                ))}
              </div>
            </Card>
          )}

          {/* Infinite Scroll Trigger */}
          <div ref={loadMoreRef} className="flex justify-center py-8">
            {isFetchingNextPage && (
              <div className="flex items-center gap-2.5 text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                <span className="text-sm">Chargement...</span>
              </div>
            )}
            {!hasNextPage && clients.length > 0 && (
              <p className="text-sm text-gray-400">
                Tous les clients ont été chargés • <span className="tabular-nums">{totalCount}</span>
              </p>
            )}
          </div>
        </>
      ) : (
        <EmptyState
          icon={Users}
          title="Aucun client trouvé"
          description={
            searchTerm || Object.keys(filters).length > 0
              ? 'Aucun client ne correspond à vos critères de recherche. Essayez de modifier vos filtres.'
              : 'Commencez par créer votre premier client pour gérer votre portefeuille.'
          }
          action={{
            label: 'Créer un client',
            onClick: () => setCreateModalOpen(true),
            icon: Plus,
          }}
        />
      )}

      {/* Create Client Modal */}
      <CreateClientWizard
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
      />
    </div>
  )
}
