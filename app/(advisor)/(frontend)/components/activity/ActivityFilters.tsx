'use client'

import { useState, useEffect } from 'react'
import { Filter, X, Calendar as CalendarIcon, User, SortAsc, SortDesc } from 'lucide-react'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Button } from '@/app/_common/components/ui/Button'
import { TimelineEventType } from '@prisma/client'

interface ActivityFiltersProps {
  onFiltersChange: (filters: ActivityFilterState) => void
  totalResults?: number
  advisors?: Array<{ id: string; name: string }>
}

export interface ActivityFilterState {
  types: TimelineEventType[]
  startDate: string | null
  endDate: string | null
  createdBy: string | null
  sortBy: 'createdAt' | 'type' | 'impact'
  sortOrder: 'asc' | 'desc'
}

const EVENT_TYPES: Array<{ value: TimelineEventType; label: string; color: string }> = [
  { value: 'CLIENT_CREATED', label: 'Nouveau client', color: 'bg-blue-100 text-blue-800' },
  { value: 'MEETING_HELD', label: 'Rendez-vous', color: 'bg-purple-100 text-purple-800' },
  { value: 'DOCUMENT_SIGNED', label: 'Document signé', color: 'bg-green-100 text-green-800' },
  { value: 'CONTRACT_SIGNED', label: 'Contrat signé', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'ASSET_ADDED', label: 'Actif ajouté', color: 'bg-cyan-100 text-cyan-800' },
  { value: 'GOAL_ACHIEVED', label: 'Objectif atteint', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'KYC_UPDATED', label: 'KYC mis à jour', color: 'bg-orange-100 text-orange-800' },
  { value: 'SIMULATION_SHARED', label: 'Simulation partagée', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'EMAIL_SENT', label: 'Email envoyé', color: 'bg-pink-100 text-pink-800' },
  { value: 'OPPORTUNITY_CONVERTED', label: 'Opportunité gagnée', color: 'bg-green-100 text-green-800' },
  { value: 'OTHER', label: 'Autre', color: 'bg-gray-100 text-gray-800' },
]

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Date de création' },
  { value: 'type', label: 'Type d\'événement' },
  { value: 'impact', label: 'Impact' },
]

export function ActivityFilters({ onFiltersChange, totalResults, advisors = [] }: ActivityFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [filters, setFilters] = useState<ActivityFilterState>({
    types: [],
    startDate: null,
    endDate: null,
    createdBy: null,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })

  // Appliquer les filtres avec debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      onFiltersChange(filters)
    }, 300)

    return () => clearTimeout(timer)
  }, [filters, onFiltersChange])

  const toggleType = (type: TimelineEventType) => {
    setFilters((prev) => ({
      ...prev,
      types: prev.types.includes(type)
        ? prev.types.filter((t) => t !== type)
        : [...prev.types, type],
    }))
  }

  const clearFilters = () => {
    setFilters({
      types: [],
      startDate: null,
      endDate: null,
      createdBy: null,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    })
  }

  const hasActiveFilters =
    filters.types.length > 0 ||
    filters.startDate ||
    filters.endDate ||
    filters.createdBy

  const activeFiltersCount =
    filters.types.length +
    (filters.startDate ? 1 : 0) +
    (filters.endDate ? 1 : 0) +
    (filters.createdBy ? 1 : 0)

  return (
    <div className="space-y-4">
      {/* Barre de contrôle principale */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setIsOpen(!isOpen)}
            variant={hasActiveFilters ? 'primary' : 'outline'}
            size="sm"
            className="relative"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtres
            {activeFiltersCount > 0 && (
              <Badge
                variant="secondary"
                className="ml-2 h-5 w-5 p-0 flex items-center justify-center rounded-full bg-white text-primary-600"
              >
                {activeFiltersCount}
              </Badge>
            )}
          </Button>

          {hasActiveFilters && (
            <Button onClick={clearFilters} variant="ghost" size="sm">
              <X className="h-4 w-4 mr-2" />
              Réinitialiser
            </Button>
          )}

          {totalResults !== undefined && (
            <span className="text-sm text-slate-600">
              {totalResults} résultat{totalResults > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Tri */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-600">Trier par :</label>
          <select
            value={filters.sortBy}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                sortBy: e.target.value as 'createdAt' | 'type' | 'impact',
              }))
            }
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <Button
            onClick={() =>
              setFilters((prev) => ({
                ...prev,
                sortOrder: prev.sortOrder === 'desc' ? 'asc' : 'desc',
              }))
            }
            variant="outline"
            size="sm"
          >
            {filters.sortOrder === 'desc' ? (
              <SortDesc className="h-4 w-4" />
            ) : (
              <SortAsc className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Panneau de filtres */}
      {isOpen && (
        <div className="p-6 border border-slate-200 rounded-lg bg-white shadow-sm space-y-6">
          {/* Types d'événements */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Types d'événements
            </h3>
            <div className="flex flex-wrap gap-2">
              {EVENT_TYPES.map((eventType) => (
                <button
                  key={eventType.value}
                  onClick={() => toggleType(eventType.value)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                    filters.types.includes(eventType.value)
                      ? `${eventType.color} border-current`
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {eventType.label}
                  {filters.types.includes(eventType.value) && (
                    <X className="h-3 w-3 ml-1 inline-block" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Période */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Période
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-600 mb-1 block">Date de début</label>
                <input
                  type="date"
                  value={filters.startDate || ''}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      startDate: e.target.value || null,
                    }))
                  }
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-600 mb-1 block">Date de fin</label>
                <input
                  type="date"
                  value={filters.endDate || ''}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      endDate: e.target.value || null,
                    }))
                  }
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* Raccourcis période */}
            <div className="flex gap-2 mt-3">
              <Button
                onClick={() => {
                  const today = new Date()
                  setFilters((prev) => ({
                    ...prev,
                    startDate: today.toISOString().split('T')[0],
                    endDate: today.toISOString().split('T')[0],
                  }))
                }}
                variant="outline"
                size="sm"
              >
                Aujourd'hui
              </Button>
              <Button
                onClick={() => {
                  const today = new Date()
                  const weekAgo = new Date(today)
                  weekAgo.setDate(today.getDate() - 7)
                  setFilters((prev) => ({
                    ...prev,
                    startDate: weekAgo.toISOString().split('T')[0],
                    endDate: today.toISOString().split('T')[0],
                  }))
                }}
                variant="outline"
                size="sm"
              >
                7 derniers jours
              </Button>
              <Button
                onClick={() => {
                  const today = new Date()
                  const monthAgo = new Date(today)
                  monthAgo.setMonth(today.getMonth() - 1)
                  setFilters((prev) => ({
                    ...prev,
                    startDate: monthAgo.toISOString().split('T')[0],
                    endDate: today.toISOString().split('T')[0],
                  }))
                }}
                variant="outline"
                size="sm"
              >
                30 derniers jours
              </Button>
            </div>
          </div>

          {/* Conseiller */}
          {advisors.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <User className="h-4 w-4" />
                Conseiller
              </h3>
              <select
                value={filters.createdBy || ''}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    createdBy: e.target.value || null,
                  }))
                }
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Tous les conseillers</option>
                {advisors.map((advisor) => (
                  <option key={advisor.id} value={advisor.id}>
                    {advisor.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Badges filtres actifs */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.types.map((type) => {
            const eventType = EVENT_TYPES.find((et) => et.value === type)
            return (
              <Badge
                key={type}
                variant="secondary"
                className={`${eventType?.color} pr-1 flex items-center gap-1`}
              >
                {eventType?.label}
                <button
                  onClick={() => toggleType(type)}
                  className="ml-1 hover:bg-black/10 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )
          })}

          {filters.startDate && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 pr-1 flex items-center gap-1">
              Depuis le {new Date(filters.startDate).toLocaleDateString('fr-FR')}
              <button
                onClick={() => setFilters((prev) => ({ ...prev, startDate: null }))}
                className="ml-1 hover:bg-black/10 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.endDate && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 pr-1 flex items-center gap-1">
              Jusqu'au {new Date(filters.endDate).toLocaleDateString('fr-FR')}
              <button
                onClick={() => setFilters((prev) => ({ ...prev, endDate: null }))}
                className="ml-1 hover:bg-black/10 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.createdBy && (
            <Badge variant="secondary" className="bg-purple-100 text-purple-800 pr-1 flex items-center gap-1">
              {advisors.find((a) => a.id === filters.createdBy)?.name || 'Conseiller'}
              <button
                onClick={() => setFilters((prev) => ({ ...prev, createdBy: null }))}
                className="ml-1 hover:bg-black/10 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
