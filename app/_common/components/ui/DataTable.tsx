 
'use client'

import * as React from 'react'
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  Search,
  Download,
} from 'lucide-react'
import { cn } from '@/app/_common/lib/utils'
import { Button } from './Button'

export interface Column<T> {
  key: string
  label: string
  sortable?: boolean
  render?: (value: any, item: T) => React.ReactNode
  className?: string
}

export interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  loading?: boolean
  emptyMessage?: string
  onRowClick?: (item: T) => void
  pagination?: {
    page: number
    pageSize: number
    total: number
    onPageChange: (page: number) => void
  }
  searchable?: boolean
  filterable?: boolean // alias for searchable
  exportable?: boolean
  onExport?: () => void
  mobileBreakpoint?: 'sm' | 'md' | 'lg'
  className?: string
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  loading,
  emptyMessage = 'Aucune donnée disponible',
  onRowClick,
  pagination,
  searchable = false,
  filterable = false,
  exportable = false,
  onExport,
  mobileBreakpoint = 'md',
  className,
}: DataTableProps<T>) {
  // Client-side state
  const [sortConfig, setSortConfig] = React.useState<{ key: string | null; direction: 'asc' | 'desc' }>({ key: null, direction: 'asc' })
  const [filterText, setFilterText] = React.useState('')
  const [currentPage, setCurrentPage] = React.useState(1)
  const itemsPerPage = 20

  const isSearchable = searchable || filterable

  // Sorting
  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  // Derived Data (Client-side logic)
  const processedData = React.useMemo(() => {
    let result = [...data]

    // 1. Filtering (Client-side only if no pagination prop is passed, usually)
    // Note: If pagination prop is passed, we assume server-side filtering/sorting usually, 
    // but for this hybrid component, we'll apply client-side logic only if NO server pagination is active?
    // Actually, if 'pagination' prop is present, we usually expect data to be just the current page.
    // So client-side sort/filter might strictly filter the CURRENT page data, which is weird.
    // But adhering to "Consolidation", let's support client-side mode fully if pagination is NOT provided.
    
    if (!pagination) {
        if (filterText && isSearchable) {
            const searchLower = filterText.toLowerCase()
            result = result.filter(row =>
                columns.some(col => {
                    const value = row[col.key]
                    return value?.toString().toLowerCase().includes(searchLower)
                })
            )
        }

        if (sortConfig.key) {
            result.sort((a, b) => {
                const aVal = a[sortConfig.key!]
                const bVal = b[sortConfig.key!]
                
                if (aVal === bVal) return 0
                
                const comparison = aVal < bVal ? -1 : 1
                return sortConfig.direction === 'asc' ? comparison : -comparison
            })
        }
    }

    return result
  }, [data, sortConfig, filterText, columns, pagination, isSearchable])

  // Pagination Logic
  const displayData = React.useMemo(() => {
      if (pagination) return data // Server-side: data is already paginated
      
      const start = (currentPage - 1) * itemsPerPage
      return processedData.slice(start, start + itemsPerPage)
  }, [processedData, currentPage, pagination, data])

  const totalPages = pagination 
    ? Math.ceil(pagination.total / pagination.pageSize)
    : Math.ceil(processedData.length / itemsPerPage)

  const currentPageNumber = pagination ? pagination.page : currentPage
  const totalResults = pagination ? pagination.total : processedData.length

  const handlePageChange = (page: number) => {
      if (pagination) {
          pagination.onPageChange(page)
      } else {
          setCurrentPage(page)
      }
  }

  if (loading) {
    return (
      <div className={cn('w-full', className)}>
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-gray-100 rounded" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-50 rounded" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('w-full space-y-4', className)}>
      {/* Toolbar */}
      {(isSearchable || exportable) && (
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          {isSearchable && (
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={filterText}
                onChange={(e) => {
                  setFilterText(e.target.value)
                  if (!pagination) setCurrentPage(1)
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          )}
          
          {exportable && (
            <Button
              variant="outline"
              onClick={onExport}
              leftIcon={<Download className="h-4 w-4" />}
            >
              Exporter
            </Button>
          )}
        </div>
      )}

      {/* Desktop Table */}
      <div className={`hidden ${mobileBreakpoint}:block rounded-md border`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50/50">
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={cn(
                      'h-12 px-4 text-left align-middle font-medium text-muted-foreground',
                      column.sortable && 'cursor-pointer select-none hover:text-foreground',
                      column.className
                    )}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className="flex items-center gap-2">
                      {column.label}
                      {column.sortable && (
                        <span className="ml-auto">
                          {sortConfig.key === column.key ? (
                            sortConfig.direction === 'asc' ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )
                          ) : (
                            <ChevronsUpDown className="h-4 w-4 opacity-50" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-500">
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                displayData.map((item, index) => (
                  <tr
                    key={item.id || index}
                    className={cn(
                      'border-b transition-colors hover:bg-muted/50',
                      onRowClick && 'cursor-pointer'
                    )}
                    onClick={() => onRowClick?.(item)}
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={cn(
                          'p-4 align-middle',
                          column.className
                        )}
                      >
                        {column.render
                          ? column.render(item[column.key], item)
                          : item[column.key]}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className={`${mobileBreakpoint}:hidden space-y-3`}>
        {displayData.length === 0 ? (
          <div className="text-center py-12 text-gray-500 border rounded-lg bg-gray-50">
            {emptyMessage}
          </div>
        ) : (
          displayData.map((item, index) => (
            <div
              key={item.id || index}
              onClick={() => onRowClick?.(item)}
              className={cn(
                'bg-white rounded-lg border p-4 space-y-3',
                onRowClick && 'cursor-pointer hover:shadow-md transition-shadow'
              )}
            >
              {columns.map((col) => (
                <div key={col.key} className="flex justify-between items-start gap-3">
                  <span className="text-xs font-semibold text-gray-500 uppercase">
                    {col.label}
                  </span>
                  <span className="text-sm text-gray-900 text-right flex-1">
                    {col.render ? col.render(item[col.key], item) : item[col.key]}
                  </span>
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            Page {currentPageNumber} sur {totalPages} ({totalResults} résultats)
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPageNumber - 1)}
              disabled={currentPageNumber === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Précédent
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPageNumber + 1)}
              disabled={currentPageNumber === totalPages}
            >
              Suivant
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
