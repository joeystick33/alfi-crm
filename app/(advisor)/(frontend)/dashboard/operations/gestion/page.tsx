"use client"

import { useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  useOperationsGestion,
  useDeleteOperationGestion,
} from '@/app/_common/hooks/api/use-operations-api'
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
  Settings,
  Plus,
  Search,
  Filter,
  ChevronDown,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  User,
  FileText,
  Euro,
  Calendar,
  ArrowUpDown,
  X,
  RefreshCw,
} from 'lucide-react'
import {
  OPERATION_GESTION_TYPES,
  OPERATION_GESTION_TYPE_LABELS,
  OPERATION_GESTION_STATUS,
  OPERATION_GESTION_STATUS_LABELS,
  type OperationGestionType,
  type OperationGestionStatus,
  type OperationGestion,
} from '@/lib/operations/types'

// ============================================================================
// Types
// ============================================================================

type SortField = 'reference' | 'createdAt' | 'amount' | 'status'
type SortDirection = 'asc' | 'desc'

interface FilterState {
  type: OperationGestionType[]
  status: OperationGestionStatus[]
  clientId: string
  contractId: string
  search: string
}

// ============================================================================
// Status Badge Variants
// ============================================================================

const statusBadgeVariants: Record<OperationGestionStatus, 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'> = {
  BROUILLON: 'default',
  EN_ATTENTE_SIGNATURE: 'warning',
  ENVOYE: 'info',
  EN_TRAITEMENT: 'primary',
  EXECUTE: 'success',
  REJETE: 'danger',
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

function OperationRow({ 
  operation, 
  onView,
  onEdit,
  onDelete,
}: { 
  operation: OperationGestion
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
          {operation.reference}
        </button>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-gray-100 rounded-lg">
            <User className="h-3.5 w-3.5 text-gray-500" />
          </div>
          <span className="text-sm text-gray-900">Client #{operation.clientId.slice(0, 8)}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm text-gray-700">
          {OPERATION_GESTION_TYPE_LABELS[operation.type]}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm text-gray-500">
          {operation.contractId.slice(0, 12)}...
        </span>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm font-medium text-gray-900 tabular-nums">
          {operation.amount 
            ? operation.amount.toLocaleString('fr-FR', { 
                style: 'currency', 
                currency: 'EUR',
                maximumFractionDigits: 0 
              })
            : '—'
          }
        </span>
      </td>
      <td className="px-4 py-3">
        <Badge variant={statusBadgeVariants[operation.status]} size="sm">
          {OPERATION_GESTION_STATUS_LABELS[operation.status]}
        </Badge>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm text-gray-500">
          {new Date(operation.createdAt).toLocaleDateString('fr-FR')}
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
            {operation.status === 'BROUILLON' && (
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </DropdownMenuItem>
            )}
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
// Summary Stats
// ============================================================================

function SummaryStats({
  operations,
  loading,
}: {
  operations: OperationGestion[]
  loading: boolean
}) {
  const stats = useMemo(() => {
    const byStatus = operations.reduce((acc, op) => {
      acc[op.status] = (acc[op.status] || 0) + 1
      return acc
    }, {} as Record<OperationGestionStatus, number>)

    const totalAmount = operations
      .filter(op => op.amount)
      .reduce((sum, op) => sum + (op.amount || 0), 0)

    return { byStatus, totalAmount, total: operations.length }
  }, [operations])

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Total</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider">En attente</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">
            {(stats.byStatus.BROUILLON || 0) + (stats.byStatus.EN_ATTENTE_SIGNATURE || 0)}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider">En traitement</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {(stats.byStatus.ENVOYE || 0) + (stats.byStatus.EN_TRAITEMENT || 0)}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Montant total</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {stats.totalAmount.toLocaleString('fr-FR', { 
              style: 'currency', 
              currency: 'EUR',
              maximumFractionDigits: 0,
              notation: 'compact',
            })}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function OperationsGestionPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // Initialize filters
  const [filters, setFilters] = useState<FilterState>({
    type: [],
    status: [],
    clientId: '',
    contractId: '',
    search: '',
  })
  
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  // Fetch data
  const { 
    data: operationsData, 
    isLoading,
    refetch,
  } = useOperationsGestion({
    type: filters.type.length > 0 ? filters.type : undefined,
    status: filters.status.length > 0 ? filters.status : undefined,
    clientId: filters.clientId || undefined,
    contractId: filters.contractId || undefined,
  })

  const deleteOperation = useDeleteOperationGestion()

  const operations = operationsData?.data || []

  // Filter and sort operations
  const filteredOperations = useMemo(() => {
    let result = [...operations]

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      result = result.filter(op => 
        op.reference.toLowerCase().includes(searchLower) ||
        op.clientId.toLowerCase().includes(searchLower)
      )
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
        case 'amount':
          comparison = (a.amount || 0) - (b.amount || 0)
          break
        case 'status':
          comparison = OPERATION_GESTION_STATUS.indexOf(a.status) - OPERATION_GESTION_STATUS.indexOf(b.status)
          break
      }
      return sortDirection === 'asc' ? comparison : -comparison
    })

    return result
  }, [operations, filters.search, sortField, sortDirection])

  // Handlers
  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refetch()
    setIsRefreshing(false)
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const handleTypeToggle = (type: OperationGestionType) => {
    setFilters(f => ({
      ...f,
      type: f.type.includes(type)
        ? f.type.filter(t => t !== type)
        : [...f.type, type]
    }))
  }

  const handleStatusToggle = (status: OperationGestionStatus) => {
    setFilters(f => ({
      ...f,
      status: f.status.includes(status)
        ? f.status.filter(s => s !== status)
        : [...f.status, status]
    }))
  }

  const clearFilters = () => {
    setFilters({
      type: [],
      status: [],
      clientId: '',
      contractId: '',
      search: '',
    })
  }

  const hasActiveFilters = filters.type.length > 0 || 
    filters.status.length > 0 || 
    filters.search !== ''

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-violet-100 rounded-xl">
              <Settings className="h-6 w-6 text-violet-600" />
            </div>
            Opérations de Gestion
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Arbitrages, rachats, versements et autres opérations post-vente
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
            Actualiser
          </Button>
          <Button
            onClick={() => router.push('/dashboard/operations/gestion/nouvelle')}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Nouvelle opération
          </Button>
        </div>
      </header>

      {/* Summary Stats */}
      <SummaryStats operations={operations} loading={isLoading} />

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

            {/* Type Filter */}
            <FilterDropdown
              label="Type"
              icon={FileText}
              selectedCount={filters.type.length}
            >
              <DropdownMenuLabel>Filtrer par type</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {OPERATION_GESTION_TYPES.map((type) => (
                <DropdownMenuCheckboxItem
                  key={type}
                  checked={filters.type.includes(type)}
                  onCheckedChange={() => handleTypeToggle(type)}
                >
                  {OPERATION_GESTION_TYPE_LABELS[type]}
                </DropdownMenuCheckboxItem>
              ))}
            </FilterDropdown>

            {/* Status Filter */}
            <FilterDropdown
              label="Statut"
              icon={Filter}
              selectedCount={filters.status.length}
            >
              <DropdownMenuLabel>Filtrer par statut</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {OPERATION_GESTION_STATUS.map((status) => (
                <DropdownMenuCheckboxItem
                  key={status}
                  checked={filters.status.includes(status)}
                  onCheckedChange={() => handleStatusToggle(status)}
                >
                  {OPERATION_GESTION_STATUS_LABELS[status]}
                </DropdownMenuCheckboxItem>
              ))}
            </FilterDropdown>

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
          ) : filteredOperations.length === 0 ? (
            <EmptyState
              icon={Settings}
              title={hasActiveFilters ? "Aucune opération trouvée" : "Aucune opération de gestion"}
              description={
                hasActiveFilters 
                  ? "Modifiez vos filtres pour voir plus de résultats"
                  : "Créez votre première opération de gestion"
              }
              action={
                hasActiveFilters 
                  ? { label: "Effacer les filtres", onClick: clearFilters }
                  : { label: "Nouvelle opération", onClick: () => router.push('/dashboard/operations/gestion/nouvelle') }
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
                        Type
                      </span>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contrat
                      </span>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <SortableHeader
                        label="Montant"
                        field="amount"
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
                  {filteredOperations.map((operation) => (
                    <OperationRow
                      key={operation.id}
                      operation={operation}
                      onView={() => router.push(`/dashboard/operations/gestion/${operation.id}`)}
                      onEdit={() => router.push(`/dashboard/operations/gestion/${operation.id}/edit`)}
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
      {!isLoading && filteredOperations.length > 0 && (
        <p className="text-sm text-gray-500 text-center">
          {filteredOperations.length} opération{filteredOperations.length > 1 ? 's' : ''} trouvée{filteredOperations.length > 1 ? 's' : ''}
        </p>
      )}
    </div>
  )
}
