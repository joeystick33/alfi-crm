'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useClients } from '@/hooks/use-api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ClientCard } from '@/components/clients/ClientCard'
import { ClientFilters } from '@/components/clients/ClientFilters'
import { CreateClientModal } from '@/components/clients/CreateClientModal'
import { Skeleton } from '@/components/ui/Skeleton'
import { Plus, Search } from 'lucide-react'
import type { ClientFilters as ClientFiltersType } from '@/lib/api-types'

export default function ClientsPage() {
  const router = useRouter()
  const [filters, setFilters] = useState<ClientFiltersType>({
    page: 1,
    pageSize: 20,
  })
  const [createModalOpen, setCreateModalOpen] = useState(false)

  const { data, isLoading } = useClients(filters)

  const handleSearch = (search: string) => {
    setFilters({ ...filters, search, page: 1 })
  }

  const handleFilterChange = (newFilters: Partial<ClientFiltersType>) => {
    setFilters({ ...filters, ...newFilters, page: 1 })
  }

  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-muted-foreground mt-1">
            {data ? `${data.pagination.total} clients` : 'Chargement...'}
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
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
        </div>
        <ClientFilters filters={filters} onFilterChange={handleFilterChange} />
      </div>

      {/* Client List */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-lg border p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : data && data.data.length > 0 ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.data.map((client) => (
              <ClientCard
                key={client.id}
                client={client}
                onClick={() => router.push(`/dashboard/clients/${client.id}`)}
              />
            ))}
          </div>

          {/* Pagination */}
          {data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {data.pagination.page} sur {data.pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(data.pagination.page - 1)}
                  disabled={data.pagination.page === 1}
                >
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(data.pagination.page + 1)}
                  disabled={data.pagination.page === data.pagination.totalPages}
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg">
          <p className="text-lg font-medium">Aucun client trouvé</p>
          <p className="text-sm text-muted-foreground mt-1">
            Commencez par créer votre premier client
          </p>
          <Button className="mt-4" onClick={() => setCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Créer un client
          </Button>
        </div>
      )}

      {/* Create Client Modal */}
      <CreateClientModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
      />
    </div>
  )
}
