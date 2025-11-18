'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ClientCard } from '@/components/clients/ClientCard'
import { ClientFilters } from '@/components/clients/ClientFilters'
import { CreateClientModal } from '@/components/clients/CreateClientModal'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState, getErrorVariant } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'
import { Plus, Search, Loader2, Users } from 'lucide-react'
import type { ClientListItem, ClientFilters as ClientFiltersType } from '@/lib/api-types'
import { buildQueryString } from '@/lib/api-client'
import { debounce } from '@/lib/performance'

export default function ClientsPage() {
  const router = useRouter()
  const [filters, setFilters] = useState<Partial<ClientFiltersType>>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [createModalOpen, setCreateModalOpen] = useState(false)

  // Build endpoint with filters
  const endpoint = useMemo(() => {
    const params = { ...filters, search: searchTerm }
    return `/clients${buildQueryString(params)}`
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
      debounce((value: string) => {
        setSearchTerm(value)
      }, 300),
    []
  )

  const handleFilterChange = (newFilters: any) => {
    setFilters({ ...filters, ...newFilters })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-muted-foreground mt-1">
            {isLoading ? 'Chargement...' : `${totalCount} client${totalCount > 1 ? 's' : ''}`}
          </p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau client
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom, email..."
              className="pl-9"
              onChange={(e: any) => handleSearch(e.target.value)}
              defaultValue={searchTerm}
            />
          </div>
        </div>
        <ClientFilters filters={filters} onFilterChange={handleFilterChange} />
      </div>

      {/* Client List */}
      {isLoading ? (
        <LoadingState variant="cards" count={6} />
      ) : isError ? (
        <ErrorState
          error={error as Error}
          variant={getErrorVariant(error as Error)}
          onRetry={() => refetch()}
        />
      ) : clients.length > 0 ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {clients.map((client: any) => (
              <ClientCard
                key={client.id}
                client={client}
                onClick={() => router.push(`/dashboard/clients/${client.id}`)}
              />
            ))}
          </div>

          {/* Infinite scroll trigger */}
          <div ref={loadMoreRef} className="flex justify-center py-4">
            {isFetchingNextPage && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Chargement...</span>
              </div>
            )}
            {!hasNextPage && clients.length > 0 && (
              <p className="text-sm text-muted-foreground">
                Tous les clients ont été chargés
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
      <CreateClientModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
      />
    </div>
  )
}
