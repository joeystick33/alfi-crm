'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/_common/components/ui/Select'
import type { ClientFilters as ClientFiltersType } from '@/app/_common/lib/api-types'

interface ClientFiltersProps {
  filters: Partial<ClientFiltersType>
  onFilterChange: (filters: Partial<ClientFiltersType>) => void
}

export function ClientFilters({ filters, onFilterChange }: ClientFiltersProps) {
  return (
    <div className="flex gap-2">
      {/* Client Type Filter */}
      <Select
        value={filters.clientType || 'all'}
        onValueChange={(value) =>
          onFilterChange({
            clientType: value === 'all' ? undefined : (value as 'PARTICULIER' | 'PROFESSIONNEL'),
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
        onValueChange={(value) =>
          onFilterChange({
            status: value === 'all' ? undefined : (value as 'PROSPECT' | 'ACTIF' | 'INACTIF' | 'ARCHIVE' | 'PERDU'),
          })
        }
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Statut" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les statuts</SelectItem>
          <SelectItem value="PROSPECT">Prospect</SelectItem>
          <SelectItem value="ACTIF">Actif</SelectItem>
          <SelectItem value="INACTIF">Inactif</SelectItem>
          <SelectItem value="ARCHIVE">Archivé</SelectItem>
          <SelectItem value="PERDU">Perdu</SelectItem>
        </SelectContent>
      </Select>

      {/* KYC Status Filter */}
      <Select
        value={filters.kycStatus || 'all'}
        onValueChange={(value) =>
          onFilterChange({
            kycStatus: value === 'all' ? undefined : (value as 'EN_ATTENTE' | 'EN_COURS' | 'COMPLET' | 'EXPIRE' | 'REJETE'),
          })
        }
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="KYC" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous KYC</SelectItem>
          <SelectItem value="EN_ATTENTE">En attente</SelectItem>
          <SelectItem value="EN_COURS">En cours</SelectItem>
          <SelectItem value="COMPLET">Complet</SelectItem>
          <SelectItem value="EXPIRE">Expiré</SelectItem>
          <SelectItem value="REJETE">Rejeté</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
