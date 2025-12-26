import { useCallback, useMemo, useState } from 'react'

export type AgendaViewMode = 'day' | 'week' | 'month'

export interface AgendaFiltersState {
  status: string
  type: string
  search: string
  collaborators: string[]
  viewMode: AgendaViewMode
}

export interface AgendaFiltersActions {
  setStatus: (status: string) => void
  setType: (type: string) => void
  setSearch: (value: string) => void
  toggleCollaborator: (id: string) => void
  selectAllCollaborators: (ids: string[]) => void
  clearCollaborators: () => void
  setViewMode: (mode: AgendaViewMode) => void
  reset: () => void
}

const DEFAULT_FILTERS: AgendaFiltersState = {
  status: 'all',
  type: 'all',
  search: '',
  collaborators: [],
  viewMode: 'week',
}

export function useAgendaFilters(initial: Partial<AgendaFiltersState> = {}) {
  const [filters, setFilters] = useState<AgendaFiltersState>({
    ...DEFAULT_FILTERS,
    ...initial,
  })

  const setStatus = useCallback((status: string) => {
    setFilters((prev) => ({ ...prev, status }))
  }, [])

  const setType = useCallback((type: string) => {
    setFilters((prev) => ({ ...prev, type }))
  }, [])

  const setSearch = useCallback((search: string) => {
    setFilters((prev) => ({ ...prev, search }))
  }, [])

  const setViewMode = useCallback((viewMode: AgendaViewMode) => {
    setFilters((prev) => ({ ...prev, viewMode }))
  }, [])

  const toggleCollaborator = useCallback((id: string) => {
    setFilters((prev) => {
      const exists = prev.collaborators.includes(id)
      return {
        ...prev,
        collaborators: exists
          ? prev.collaborators.filter((item) => item !== id)
          : [...prev.collaborators, id],
      }
    })
  }, [])

  const selectAllCollaborators = useCallback((ids: string[]) => {
    setFilters((prev) => ({ ...prev, collaborators: [...ids] }))
  }, [])

  const clearCollaborators = useCallback(() => {
    setFilters((prev) => ({ ...prev, collaborators: [] }))
  }, [])

  const reset = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
  }, [])

  const actions: AgendaFiltersActions = useMemo(
    () => ({
      setStatus,
      setType,
      setSearch,
      setViewMode,
      toggleCollaborator,
      selectAllCollaborators,
      clearCollaborators,
      reset,
    }),
    [clearCollaborators, reset, selectAllCollaborators, setSearch, setStatus, setType, setViewMode, toggleCollaborator]
  )

  return { filters, actions }
}
