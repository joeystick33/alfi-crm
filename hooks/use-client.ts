/**
 * useClient Hook
 * React Query hooks for client management with Prisma
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, buildQueryString } from '@/lib/api-client'
import type { Client, ClientStatus, ClientType, KYCStatus } from '@prisma/client'

// ============================================
// TYPES
// ============================================

export interface ClientFilters {
  status?: ClientStatus
  clientType?: ClientType
  conseillerId?: string
  search?: string
  kycStatus?: KYCStatus
  limit?: number
  offset?: number
}

export interface CreateClientData {
  clientType: ClientType
  conseillerId: string
  conseillerRemplacantId?: string
  apporteurId?: string
  email?: string
  firstName: string
  lastName: string
  birthDate?: Date | string
  birthPlace?: string
  nationality?: string
  phone?: string
  mobile?: string
  address?: any
  maritalStatus?: string
  marriageRegime?: string
  numberOfChildren?: number
  profession?: string
  employerName?: string
  professionalStatus?: string
  companyName?: string
  siret?: string
  legalForm?: string
  activitySector?: string
  companyCreationDate?: Date | string
  numberOfEmployees?: number
  annualRevenue?: number
  annualIncome?: number
  taxBracket?: string
  fiscalResidence?: string
  riskProfile?: string
  investmentHorizon?: string
  investmentGoals?: any
  investmentKnowledge?: string
  investmentExperience?: string
}

export interface UpdateClientData extends Partial<CreateClientData> {
  status?: ClientStatus
  kycStatus?: KYCStatus
  portalAccess?: boolean
}

// ============================================
// QUERY KEYS
// ============================================

export const clientKeys = {
  all: ['clients'] as const,
  lists: () => [...clientKeys.all, 'list'] as const,
  list: (filters: ClientFilters) => [...clientKeys.lists(), filters] as const,
  details: () => [...clientKeys.all, 'detail'] as const,
  detail: (id: string) => [...clientKeys.details(), id] as const,
  timeline: (id: string) => [...clientKeys.detail(id), 'timeline'] as const,
  stats: (id: string) => [...clientKeys.detail(id), 'stats'] as const,
  search: (query: string) => [...clientKeys.all, 'search', query] as const,
}

// ============================================
// QUERIES
// ============================================

/**
 * Fetch a single client by ID
 */
export function useClient(id: string, includeRelations: boolean = false) {
  return useQuery({
    queryKey: clientKeys.detail(id),
    queryFn: async () => {
      const query = includeRelations ? '?includeRelations=true' : ''
      const response = await api.get<{ success: boolean; data: Client }>(
        `/api/clients/${id}${query}`
      )
      return response.data
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Fetch list of clients with filters
 */
export function useClients(filters: ClientFilters = {}) {
  return useQuery({
    queryKey: clientKeys.list(filters),
    queryFn: async () => {
      const queryString = buildQueryString(filters)
      const response = await api.get<{ success: boolean; data: Client[] }>(
        `/api/clients${queryString}`
      )
      return response.data
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Search clients by query
 */
export function useClientSearch(query: string, limit: number = 20) {
  return useQuery({
    queryKey: clientKeys.search(query),
    queryFn: async () => {
      const queryString = buildQueryString({ search: query, limit })
      const response = await api.get<{ success: boolean; data: Client[] }>(
        `/api/clients/search${queryString}`
      )
      return response.data
    },
    enabled: query.length >= 2,
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}

/**
 * Fetch client timeline
 */
export function useClientTimeline(id: string, limit: number = 50) {
  return useQuery({
    queryKey: clientKeys.timeline(id),
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: any[] }>(
        `/api/clients/${id}/timeline?limit=${limit}`
      )
      return response.data
    },
    enabled: !!id,
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}

/**
 * Fetch client statistics
 */
export function useClientStats(id: string) {
  return useQuery({
    queryKey: clientKeys.stats(id),
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: any }>(
        `/api/clients/${id}/stats`
      )
      return response.data
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// ============================================
// MUTATIONS
// ============================================

/**
 * Create a new client
 */
export function useCreateClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateClientData) => {
      const response = await api.post<{ success: boolean; data: Client }>(
        '/api/clients',
        data
      )
      return response.data
    },
    onSuccess: (_data: Client, _variables: CreateClientData) => {
      // Invalidate all client lists
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() })
    },
  })
}

/**
 * Update a client
 */
export function useUpdateClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateClientData }) => {
      const response = await api.put<{ success: boolean; data: Client }>(
        `/api/clients/${id}`,
        data
      )
      return response.data
    },
    onSuccess: (data: Client, variables: { id: string; data: UpdateClientData }) => {
      // Update the specific client in cache
      queryClient.setQueryData(clientKeys.detail(variables.id), data)
      // Invalidate lists to reflect changes
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() })
      // Invalidate stats
      queryClient.invalidateQueries({ queryKey: clientKeys.stats(variables.id) })
    },
  })
}

/**
 * Update client status
 */
export function useUpdateClientStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ClientStatus }) => {
      const response = await api.patch<{ success: boolean; data: Client }>(
        `/api/clients/${id}/status`,
        { status }
      )
      return response.data
    },
    onSuccess: (data: Client, variables: { id: string; status: ClientStatus }) => {
      // Update the specific client in cache
      queryClient.setQueryData(clientKeys.detail(variables.id), data)
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() })
      // Invalidate timeline
      queryClient.invalidateQueries({ queryKey: clientKeys.timeline(variables.id) })
    },
  })
}

/**
 * Archive a client
 */
export function useArchiveClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.patch<{ success: boolean; data: Client }>(
        `/api/clients/${id}/archive`
      )
      return response.data
    },
    onSuccess: (data: Client, id: string) => {
      // Update the specific client in cache
      queryClient.setQueryData(clientKeys.detail(id), data)
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() })
    },
  })
}

/**
 * Change client's conseiller
 */
export function useChangeConseiller() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, conseillerId }: { id: string; conseillerId: string }) => {
      const response = await api.patch<{ success: boolean; data: Client }>(
        `/api/clients/${id}/conseiller`,
        { conseillerId }
      )
      return response.data
    },
    onSuccess: (data: Client, variables: { id: string; conseillerId: string }) => {
      // Update the specific client in cache
      queryClient.setQueryData(clientKeys.detail(variables.id), data)
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() })
      // Invalidate timeline
      queryClient.invalidateQueries({ queryKey: clientKeys.timeline(variables.id) })
    },
  })
}

/**
 * Toggle portal access for client
 */
export function useTogglePortalAccess() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      enabled,
      password,
    }: {
      id: string
      enabled: boolean
      password?: string
    }) => {
      const response = await api.patch<{ success: boolean; data: Client }>(
        `/api/clients/${id}/portal-access`,
        { enabled, password }
      )
      return response.data
    },
    onSuccess: (data: Client, variables: { id: string; enabled: boolean; password?: string }) => {
      // Update the specific client in cache
      queryClient.setQueryData(clientKeys.detail(variables.id), data)
    },
  })
}

// ============================================
// OPTIMISTIC UPDATES
// ============================================

/**
 * Optimistically update a client in the cache
 */
export function useOptimisticClientUpdate() {
  const queryClient = useQueryClient()

  return (id: string, updates: Partial<Client>) => {
    queryClient.setQueryData(clientKeys.detail(id), (old: Client | undefined) => {
      if (!old) return old
      return { ...old, ...updates }
    })
  }
}
