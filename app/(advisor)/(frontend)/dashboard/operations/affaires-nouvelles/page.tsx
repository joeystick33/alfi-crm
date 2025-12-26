"use client"

import { useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAffaires } from '@/app/_common/hooks/api/use-operations-api'
import { useProviders } from '@/app/_common/hooks/api/use-providers-api'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_common/components/ui/Card'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Button } from '@/app/_common/components/ui/Button'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import { EmptyState } from '@/app/_common/components/ui/EmptyState'
import { Input } from '@/app/_common/components/ui/Input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/app/_common/components/ui/DropdownMenu'
import { cn } from '@/app/_common/lib/utils'
import {
  TrendingUp,
  Plus,
  Search,
  Filter,
  ChevronDown,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Calendar,
  Building2,
  User,
  Euro,
  ArrowUpDown,
  X,
  FileText,
} from 'lucide-react'
import {
  AFFAIRE_STATUS,
  AFFAIRE_STATUS_LABELS,
  PRODUCT_TYPES,
  PRODUCT_TYPE_LABELS,
  type AffaireStatus,
  type ProductType,
  type AffaireNouvelle,
} from '@/lib/operations/types'

// ============================================================================
// Types
// ============================================================================

type SortField = 'reference' | 'createdAt' | 'estimatedAmount' | 'status'
type SortDirection = 'asc' | 'desc'

interface FilterState {
  status: AffaireStatus[]
  productType: ProductType[]
  providerId: string | null
  search: string
  dateFrom: string
  dateTo: string
}

// ============================================================================
// Status Badge Colors
// ============================================================================

const statusBadgeVariants: Record<AffaireStatus, 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'> = {
  PROSPECT: 'default',
  QUALIFICATION: 'info',
  CONSTITUTION: 'primary',
  SIGNATURE: 'warning',
  ENVOYE: 'warning',
  EN_TRAITEMENT: 'warning',
  VALIDE: 'success',
  REJETE: 'danger',
  ANNULE: 'default',
}

// ============================================================================
// Filter Dropdown Component
// ============================================================================

function FilterDropdown({
  label,
  icon: Icon,
  selectedCount,
  children,
}: {
  label: string
  icon: React.ElementType
  selectedCount: number
  children: React.ReactNode
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Icon className="h-4 w-4" />
          {label}
          {selectedCount > 0 && (
            <Badge variant="primary" size="xs" className="ml-1">
              {selectedCount}
            </Badge>
          )}
          <ChevronDown className="h-3 w-3 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ============================================================================
// Table Header Component
// ============================================================================

function SortableHeader({
  label,
  field,
  currentSort,
  currentDirection,
  onSort,
}: {
  label: string
  field: SortField
  currentSort: SortField
  currentDirection: SortDirection
  onSort: (field: SortField) => void
}) {
  const isActive = currentSort === field
  
  return (
    <button
      onClick={() => onSort(field)}
      className={cn(
        'flex items-center gap-1 text-xs font-medium uppercase tracking-wider',
        isActive ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'
      )}
    >
      {label}
      <ArrowUpDown className={cn('h-3 w-3', isActive && 'text-[#7373FF]')} />
    </button>
  )
}

// ============================================================================
// Table Row Component
// ============================================================================

function AffaireRow({ 
  affaire, 
  providerName,
  onView,
  onEdit,
  onDelete,
}: { 
  affaire: AffaireNouvelle
  providerName: string
  onView: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
      <td className="px-4 py-3">
        <button 
          onClick={onView}
          className="text-sm font-medium text-[#7373FF] hover:underline"
        >
          {affaire.reference}
        </button>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-gray-100 rounded-lg">
            <User className="h-3.5 w-3.5 text-gray-500" />
          </div>
          <span className="text-sm text-gray-900">Client #{affaire.clientId.slice(0, 8)}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm text-gray-700">
          {PRODUCT_TYPE_LABELS[affaire.productType]}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Building2 className="h-3.5 w-3.5 text-gray-400" />
          <span className="text-sm text-gray-700">{providerName}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm font-medium text-gray-900 tabular-nums">
          {affaire.estimatedAmount.toLocaleString('fr-FR', { 
            style: 'currency', 
            currency: 'EUR',
            maximumFractionDigits: 0 
          })}
        </span>
      </td>
      <td className="px-4 py-3">
        <Badge variant={statusBadgeVariants[affaire.status]} size="sm">
          {AFFAIRE_STATUS_LABELS[affaire.status]}
        </Badge>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm text-gray-500">
          {new Date(affaire.createdAt).toLocaleDateString('fr-FR')}
        </span>
      </td>
      <td className="px-4 py-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onView}>
              <Eye className="h-4 w-4 mr-2" />
              Voir détails
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} className="text-rose-600">
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  )
}

// ============================================================================
// Table Skeleton
// ============================================================================

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      ))}
    </div>
  )
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function AffairesNouvellesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Initialize filters from URL params
  const initialStatus = searchParams.get('status')
  const [filters, setFilters] = useState<FilterState>({
    status: initialStatus ? [initialStatus as AffaireStatus] : [],
    productType: [],
    providerId: null,
    search: '',
    dateFrom: '',
    dateTo: '',
  })
  
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  // Fetch data
  const { data: affairesData, isLoading: affairesLoading } = useAffaires({
    status: filters.status.length > 0 ? filters.status : undefined,
    productType: filters.productType.length > 0 ? filters.productType : undefined,
    providerId: filters.providerId || undefined,
  })
  
  const { data: providersData, isLoading: providersLoading } = useProviders()

  const affaires = affairesData?.data || []
  const providers = providersData?.data || []

  // Create provider lookup map
  const providerMap = useMemo(() => {
    const map = new Map<string, string>()
    providers.forEach(p => map.set(p.id, p.name))
    return map
  }, [providers])

  // Filter and sort affaires
  const filteredAffaires = useMemo(() => {
    let result = [...affaires]

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      result = result.filter(a => 
        a.reference.toLowerCase().includes(searchLower) ||
        a.clientId.toLowerCase().includes(searchLower)
      )
    }

    // Date filters
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom)
      result = result.filter(a => new Date(a.createdAt) >= fromDate)
    }
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo)
      result = result.filter(a => new Date(a.createdAt) <= toDate)
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case 'reference':
          comparison = a.reference.localeCompare(b.reference)
          break
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        case 'estimatedAmount':
          comparison = a.estimatedAmount - b.estimatedAmount
          break
        case 'status':
          comparison = AFFAIRE_STATUS.indexOf(a.status) - AFFAIRE_STATUS.indexOf(b.status)
          break
      }
      return sortDirection === 'asc' ? comparison : -comparison
    })

    return result
  }, [affaires, filters, sortField, sortDirection])

  // Handlers
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const handleStatusToggle = (status: AffaireStatus) => {
    setFilters(f => ({
      ...f,
      status: f.status.includes(status)
        ? f.status.filter(s => s !== status)
        : [...f.status, status]
    }))
  }

  const handleProductTypeToggle = (type: ProductType) => {
    setFilters(f => ({
      ...f,
      productType: f.productType.includes(type)
        ? f.productType.filter(t => t !== type)
        : [...f.productType, type]
    }))
  }

  const handleProviderSelect = (providerId: string | null) => {
    setFilters(f => ({ ...f, providerId }))
  }

  const clearFilters = () => {
    setFilters({
      status: [],
      productType: [],
      providerId: null,
      search: '',
      dateFrom: '',
      dateTo: '',
    })
  }

  const hasActiveFilters = filters.status.length > 0 || 
    filters.productType.length > 0 || 
    filters.providerId !== null ||
    filters.search !== '' ||
    filters.dateFrom !== '' ||
    filters.dateTo !== ''

  const isLoading = affairesLoading || providersLoading

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-[#7373FF]/10 rounded-xl">
              <TrendingUp className="h-6 w-6 text-[#7373FF]" />
            </div>
            Affaires Nouvelles
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gérez vos nouvelles souscriptions et suivez leur progression
          </p>
        </div>
        <Button
          onClick={() => router.push('/dashboard/operations/affaires-nouvelles/nouvelle')}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Nouvelle affaire
        </Button>
      </header>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher par référence..."
                value={filters.search}
                onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
                className="pl-9"
              />
            </div>

            {/* Status Filter */}
            <FilterDropdown
              label="Statut"
              icon={Filter}
              selectedCount={filters.status.length}
            >
              <DropdownMenuLabel>Filtrer par statut</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {AFFAIRE_STATUS.map((status) => (
                <DropdownMenuCheckboxItem
                  key={status}
                  checked={filters.status.includes(status)}
                  onCheckedChange={() => handleStatusToggle(status)}
                >
                  {AFFAIRE_STATUS_LABELS[status]}
                </DropdownMenuCheckboxItem>
              ))}
            </FilterDropdown>

            {/* Product Type Filter */}
            <FilterDropdown
              label="Produit"
              icon={FileText}
              selectedCount={filters.productType.length}
            >
              <DropdownMenuLabel>Filtrer par produit</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {PRODUCT_TYPES.map((type) => (
                <DropdownMenuCheckboxItem
                  key={type}
                  checked={filters.productType.includes(type)}
                  onCheckedChange={() => handleProductTypeToggle(type)}
                >
                  {PRODUCT_TYPE_LABELS[type]}
                </DropdownMenuCheckboxItem>
              ))}
            </FilterDropdown>

            {/* Provider Filter */}
            <FilterDropdown
              label="Fournisseur"
              icon={Building2}
              selectedCount={filters.providerId ? 1 : 0}
            >
              <DropdownMenuLabel>Filtrer par fournisseur</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleProviderSelect(null)}>
                Tous les fournisseurs
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {providers.map((provider) => (
                <DropdownMenuCheckboxItem
                  key={provider.id}
                  checked={filters.providerId === provider.id}
                  onCheckedChange={() => handleProviderSelect(
                    filters.providerId === provider.id ? null : provider.id
                  )}
                >
                  {provider.name}
                </DropdownMenuCheckboxItem>
              ))}
            </FilterDropdown>

            {/* Date Range */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters(f => ({ ...f, dateFrom: e.target.value }))}
                className="w-36"
                placeholder="Du"
              />
              <span className="text-gray-400">→</span>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters(f => ({ ...f, dateTo: e.target.value }))}
                className="w-36"
                placeholder="Au"
              />
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="gap-1 text-gray-500"
              >
                <X className="h-4 w-4" />
                Effacer
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <TableSkeleton />
          ) : filteredAffaires.length === 0 ? (
            <EmptyState
              icon={TrendingUp}
              title={hasActiveFilters ? "Aucune affaire trouvée" : "Aucune affaire nouvelle"}
              description={
                hasActiveFilters 
                  ? "Modifiez vos filtres pour voir plus de résultats"
                  : "Créez votre première affaire pour commencer à suivre vos ventes"
              }
              action={
                hasActiveFilters 
                  ? { label: "Effacer les filtres", onClick: clearFilters }
                  : { label: "Nouvelle affaire", onClick: () => router.push('/dashboard/operations/affaires-nouvelles/nouvelle') }
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/50">
                    <th className="px-4 py-3 text-left">
                      <SortableHeader
                        label="Référence"
                        field="reference"
                        currentSort={sortField}
                        currentDirection={sortDirection}
                        onSort={handleSort}
                      />
                    </th>
                    <th className="px-4 py-3 text-left">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Client
                      </span>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Produit
                      </span>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fournisseur
                      </span>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <SortableHeader
                        label="Montant"
                        field="estimatedAmount"
                        currentSort={sortField}
                        currentDirection={sortDirection}
                        onSort={handleSort}
                      />
                    </th>
                    <th className="px-4 py-3 text-left">
                      <SortableHeader
                        label="Statut"
                        field="status"
                        currentSort={sortField}
                        currentDirection={sortDirection}
                        onSort={handleSort}
                      />
                    </th>
                    <th className="px-4 py-3 text-left">
                      <SortableHeader
                        label="Créée le"
                        field="createdAt"
                        currentSort={sortField}
                        currentDirection={sortDirection}
                        onSort={handleSort}
                      />
                    </th>
                    <th className="px-4 py-3 text-left">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAffaires.map((affaire) => (
                    <AffaireRow
                      key={affaire.id}
                      affaire={affaire}
                      providerName={providerMap.get(affaire.providerId) || 'N/A'}
                      onView={() => router.push(`/dashboard/operations/affaires-nouvelles/${affaire.id}`)}
                      onEdit={() => router.push(`/dashboard/operations/affaires-nouvelles/${affaire.id}/edit`)}
                      onDelete={() => {/* TODO: Implement delete confirmation */}}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results count */}
      {!isLoading && filteredAffaires.length > 0 && (
        <p className="text-sm text-gray-500 text-center">
          {filteredAffaires.length} affaire{filteredAffaires.length > 1 ? 's' : ''} trouvée{filteredAffaires.length > 1 ? 's' : ''}
        </p>
      )}
    </div>
  )
}
