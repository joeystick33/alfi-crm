/**
 * useSimulation Hook
 * React Query hooks for simulation management with Prisma
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, buildQueryString } from '@/app/_common/lib/api-client'
import type { Simulation, SimulationType, SimulationStatus } from '@prisma/client'

// ============================================
// TYPES
// ============================================

export interface SimulationFilters {
  clientId?: string
  type?: SimulationType
  status?: SimulationStatus
  search?: string
}

export interface CreateSimulationData {
  clientId: string
  type: SimulationType
  name: string
  description?: string
  parameters: Record<string, unknown>
  results: Record<string, unknown>
  recommendations?: Record<string, unknown>
  feasibilityScore?: number
  sharedWithClient?: boolean
}

export interface UpdateSimulationData {
  name?: string
  description?: string
  parameters?: Record<string, unknown>
  results?: Record<string, unknown>
  recommendations?: Record<string, unknown>
  feasibilityScore?: number
  status?: SimulationStatus
  sharedWithClient?: boolean
}

export interface SimulationWithRelations extends Simulation {
  client?: {
    id: string
    firstName: string
    lastName: string
  }
  createdBy?: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
}

// ============================================
// QUERY KEYS
// ============================================

export const simulationKeys = {
  all: ['simulations'] as const,
  lists: () => [...simulationKeys.all, 'list'] as const,
  list: (filters: SimulationFilters) => [...simulationKeys.lists(), filters] as const,
  details: () => [...simulationKeys.all, 'detail'] as const,
  detail: (id: string) => [...simulationKeys.details(), id] as const,
  clientHistory: (clientId: string) => [...simulationKeys.all, 'client', clientId] as const,
  recent: (limit: number) => [...simulationKeys.all, 'recent', limit] as const,
  statistics: () => [...simulationKeys.all, 'statistics'] as const,
}

// ============================================
// QUERIES
// ============================================

/**
 * Fetch a single simulation by ID
 */
export function useSimulation(id: string) {
  return useQuery({
    queryKey: simulationKeys.detail(id),
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: SimulationWithRelations }>(
        `/api/simulations/${id}`
      )
      return response.data
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Fetch list of simulations with filters
 */
export function useSimulations(filters: SimulationFilters = {}) {
  return useQuery({
    queryKey: simulationKeys.list(filters),
    queryFn: async () => {
      const queryString = buildQueryString(filters)
      const response = await api.get<{ success: boolean; data: SimulationWithRelations[] }>(
        `/api/simulations${queryString}`
      )
      return response.data
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Fetch simulation history for a specific client
 */
export function useClientSimulationHistory(clientId: string) {
  return useQuery({
    queryKey: simulationKeys.clientHistory(clientId),
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: SimulationWithRelations[] }>(
        `/api/clients/${clientId}/simulations`
      )
      return response.data
    },
    enabled: !!clientId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Fetch recent simulations
 */
export function useRecentSimulations(limit: number = 10) {
  return useQuery({
    queryKey: simulationKeys.recent(limit),
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: SimulationWithRelations[] }>(
        `/api/simulations/recent?limit=${limit}`
      )
      return response.data
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}

/**
 * Fetch simulation statistics
 */
export function useSimulationStatistics() {
  return useQuery({
    queryKey: simulationKeys.statistics(),
    queryFn: async () => {
      const response = await api.get<{
        success: boolean
        data: {
          total: number
          completed: number
          shared: number
          archived: number
          byType: Record<string, number>
        }
      }>('/api/simulations/statistics')
      return response.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// ============================================
// MUTATIONS
// ============================================

/**
 * Create a new simulation
 */
export function useCreateSimulation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateSimulationData) => {
      const response = await api.post<{ success: boolean; data: Simulation }>(
        '/api/simulations',
        data
      )
      return response.data
    },
    onSuccess: (data: Simulation) => {
      // Invalidate all simulation lists
      queryClient.invalidateQueries({ queryKey: simulationKeys.lists() })
      // Invalidate client history
      queryClient.invalidateQueries({ queryKey: simulationKeys.clientHistory(data.clientId) })
      // Invalidate recent simulations
      queryClient.invalidateQueries({ queryKey: simulationKeys.recent(10) })
      // Invalidate statistics
      queryClient.invalidateQueries({ queryKey: simulationKeys.statistics() })
    },
  })
}

/**
 * Update a simulation
 */
export function useUpdateSimulation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateSimulationData }) => {
      const response = await api.put<{ success: boolean; data: Simulation }>(
        `/api/simulations/${id}`,
        data
      )
      return response.data
    },
    onSuccess: (data: Simulation, variables: { id: string; data: UpdateSimulationData }) => {
      // Update the specific simulation in cache
      queryClient.setQueryData(simulationKeys.detail(variables.id), data)
      // Invalidate lists to reflect changes
      queryClient.invalidateQueries({ queryKey: simulationKeys.lists() })
      // Invalidate client history
      queryClient.invalidateQueries({ queryKey: simulationKeys.clientHistory(data.clientId) })
      // Invalidate statistics if status changed
      if (variables.data.status) {
        queryClient.invalidateQueries({ queryKey: simulationKeys.statistics() })
      }
    },
  })
}

/**
 * Delete a simulation
 */
export function useDeleteSimulation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete<{ success: boolean }>(
        `/api/simulations/${id}`
      )
      return response
    },
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: simulationKeys.detail(id) })
      // Invalidate all lists
      queryClient.invalidateQueries({ queryKey: simulationKeys.lists() })
      // Invalidate statistics
      queryClient.invalidateQueries({ queryKey: simulationKeys.statistics() })
    },
  })
}

/**
 * Archive a simulation
 */
export function useArchiveSimulation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.patch<{ success: boolean; data: Simulation }>(
        `/api/simulations/${id}/archive`
      )
      return response.data
    },
    onSuccess: (data: Simulation, id: string) => {
      // Update the specific simulation in cache
      queryClient.setQueryData(simulationKeys.detail(id), data)
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: simulationKeys.lists() })
      // Invalidate client history
      queryClient.invalidateQueries({ queryKey: simulationKeys.clientHistory(data.clientId) })
      // Invalidate statistics
      queryClient.invalidateQueries({ queryKey: simulationKeys.statistics() })
    },
  })
}

/**
 * Share simulation with client
 */
export function useShareSimulation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post<{ success: boolean; data: Simulation }>(
        `/api/simulations/${id}/share`
      )
      return response.data
    },
    onSuccess: (data: Simulation, id: string) => {
      // Update the specific simulation in cache
      queryClient.setQueryData(simulationKeys.detail(id), data)
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: simulationKeys.lists() })
      // Invalidate client history
      queryClient.invalidateQueries({ queryKey: simulationKeys.clientHistory(data.clientId) })
      // Invalidate statistics
      queryClient.invalidateQueries({ queryKey: simulationKeys.statistics() })
    },
  })
}

// ============================================
// OPTIMISTIC UPDATES
// ============================================

/**
 * Optimistically update a simulation in the cache
 */
export function useOptimisticSimulationUpdate() {
  const queryClient = useQueryClient()

  return (id: string, updates: Partial<Simulation>) => {
    queryClient.setQueryData(
      simulationKeys.detail(id),
      (old: Simulation | undefined) => {
        if (!old) return old
        return { ...old, ...updates }
      }
    )
  }
}

// ============================================
// HELPER HOOKS
// ============================================

/**
 * Hook to check if a simulation can be shared
 */
export function useCanShareSimulation(simulation?: Simulation) {
  if (!simulation) return false
  return simulation.status === 'TERMINE' && !simulation.sharedWithClient
}

/**
 * Hook to check if a simulation can be edited
 */
export function useCanEditSimulation(simulation?: Simulation) {
  if (!simulation) return false
  return simulation.status !== 'ARCHIVE'
}

/**
 * Hook to get simulation type label
 */
export function useSimulationTypeLabel(type: SimulationType): string {
  const labels: Record<SimulationType, string> = {
    RETRAITE: 'Retraite',
    CREDIT_IMMOBILIER: 'Prêt immobilier',
    ASSURANCE_VIE: 'Assurance-vie',
    TRANSMISSION_PATRIMOINE: 'Transmission de patrimoine',
    OPTIMISATION_FISCALE: 'Optimisation fiscale',
    PROJECTION_INVESTISSEMENT: 'Projection d\'investissement',
    ANALYSE_BUDGET: 'Analyse budgétaire',
    AUTRE: 'Autre',
  }
  return labels[type] || type
}

/**
 * Hook to get simulation status label
 */
export function useSimulationStatusLabel(status: SimulationStatus): string {
  const labels: Record<SimulationStatus, string> = {
    BROUILLON: 'Brouillon',
    TERMINE: 'Terminée',
    PARTAGE: 'Partagée',
    ARCHIVE: 'Archivée',
  }
  return labels[status] || status
}

/**
 * Hook to get simulation status color
 */
export function useSimulationStatusColor(status: SimulationStatus): string {
  const colors: Record<SimulationStatus, string> = {
    BROUILLON: 'gray',
    TERMINE: 'green',
    PARTAGE: 'blue',
    ARCHIVE: 'gray',
  }
  return colors[status] || 'gray'
}
