'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import type { ClientFilters as ClientFiltersType } from '@/lib/api-types'

interface ClientFiltersProps {
  filters: ClientFiltersType
  onFilterChange: (filters: Partial<ClientFiltersType>) => void
}

export function ClientFilters({ filters, onFilterChange }: ClientFiltersProps) {
  return (
    <div className="flex gap-2">
      {/* Client Type Filter */}
      <Select
        value={filters.clientType || 'all'}
        onValueChange={(value: any) =>
          onFilterChange({
            clientType: value === 'all' ? undefined : (value as any),
          })
        }
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les types</SelectItem>
          <SelectItem value="PARTICULIER">Particulier</SelectItem>
          <SelectItem value="PROFESSIONNEL">Professionnel</SelectItem>
        </SelectContent>
      </Select>

      {/* Status Filter */}
      <Select
        value={filters.status || 'all'}
        onValueChange={(value: any) =>
          onFilterChange({
            status: value === 'all' ? undefined : (value as any),
          })
        }
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Statut" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les statuts</SelectItem>
          <SelectItem value="PROSPECT">Prospect</SelectItem>
          <SelectItem value="ACTIVE">Actif</SelectItem>
          <SelectItem value="INACTIVE">Inactif</SelectItem>
          <SelectItem value="ARCHIVED">Archivé</SelectItem>
        </SelectContent>
      </Select>

      {/* KYC Status Filter */}
      <Select
        value={filters.kycStatus || 'all'}
        onValueChange={(value: any) =>
          onFilterChange({
            kycStatus: value === 'all' ? undefined : (value as any),
          })
        }
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="KYC" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous KYC</SelectItem>
          <SelectItem value="PENDING">En attente</SelectItem>
          <SelectItem value="IN_PROGRESS">En cours</SelectItem>
          <SelectItem value="COMPLETED">Complété</SelectItem>
          <SelectItem value="EXPIRED">Expiré</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
