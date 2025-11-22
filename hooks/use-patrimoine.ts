/**
 * usePatrimoine Hook
 * React Query hooks for patrimoine (wealth) management with Prisma
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, buildQueryString } from '@/lib/api-client'
import type {
  Actif,
  Passif,
  Contrat,
  ActifType,
  ActifCategory,
  PassifType,
  ContratType,
  ContratStatus,
} from '@prisma/client'

// ============================================
// TYPES
// ============================================

export interface PatrimoineCalculation {
  totalActifs: number
  totalPassifs: number
  netWealth: number
  managedAssets: number
  unmanagedAssets: number
  actifsByCategory: Record<string, number>
  actifsByType: Record<string, number>
  passifsByType: Record<string, number>
  allocationPercentages: {
    immobilier: number
    financier: number
    professionnel: number
    autre: number
  }
  lastCalculated: Date
}

export interface ActifFilters {
  type?: ActifType
  category?: ActifCategory
  clientId?: string
  managedByFirm?: boolean
  minValue?: number
  maxValue?: number
}

export interface PassifFilters {
  clientId?: string
  type?: PassifType
  isActive?: boolean
}

export interface ContratFilters {
  clientId?: string
  type?: ContratType
  status?: ContratStatus
  renewalDueSoon?: boolean
}

export interface CreateActifData {
  type: ActifType
  category: ActifCategory
  name: string
  description?: string
  value: number
  acquisitionDate?: Date | string
  acquisitionValue?: number
  details?: any
  annualIncome?: number
  taxDetails?: any
  managedByFirm?: boolean
  managementFees?: number
}

export interface CreatePassifData {
  clientId: string
  type: PassifType
  name: string
  description?: string
  initialAmount: number
  remainingAmount: number
  interestRate: number
  monthlyPayment: number
  startDate: Date | string
  endDate: Date | string
  linkedActifId?: string
  insurance?: any
}

export interface CreateContratData {
  clientId: string
  type: ContratType
  name: string
  provider: string
  contractNumber?: string
  startDate: Date | string
  endDate?: Date | string
  premium?: number
  coverage?: number
  value?: number
  beneficiaries?: any
  details?: any
  commission?: number
  nextRenewalDate?: Date | string
}

// ============================================
// QUERY KEYS
// ============================================

export const patrimoineKeys = {
  all: ['patrimoine'] as const,
  
  // Actifs
  actifs: () => [...patrimoineKeys.all, 'actifs'] as const,
  actifsList: (filters: ActifFilters) => [...patrimoineKeys.actifs(), 'list', filters] as const,
  actif: (id: string) => [...patrimoineKeys.actifs(), 'detail', id] as const,
  clientActifs: (clientId: string) => [...patrimoineKeys.actifs(), 'client', clientId] as const,
  
  // Passifs
  passifs: () => [...patrimoineKeys.all, 'passifs'] as const,
  passifsList: (filters: PassifFilters) => [...patrimoineKeys.passifs(), 'list', filters] as const,
  passif: (id: string) => [...patrimoineKeys.passifs(), 'detail', id] as const,
  clientPassifs: (clientId: string) => [...patrimoineKeys.passifs(), 'client', clientId] as const,
  
  // Contrats
  contrats: () => [...patrimoineKeys.all, 'contrats'] as const,
  contratsList: (filters: ContratFilters) => [...patrimoineKeys.contrats(), 'list', filters] as const,
  contrat: (id: string) => [...patrimoineKeys.contrats(), 'detail', id] as const,
  clientContrats: (clientId: string) => [...patrimoineKeys.contrats(), 'client', clientId] as const,
  
  // Calculations
  wealth: (clientId: string) => [...patrimoineKeys.all, 'wealth', clientId] as const,
  clientPatrimoine: (clientId: string) => [...patrimoineKeys.all, 'client', clientId] as const,
  opportunities: (clientId: string) => [...patrimoineKeys.all, 'opportunities', clientId] as const,
}

// ============================================
// ACTIFS QUERIES
// ============================================

/**
 * Fetch a single actif by ID
 */
export function useActif(id: string) {
  return useQuery({
    queryKey: patrimoineKeys.actif(id),
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: Actif }>(
        `/api/patrimoine/actifs/${id}`
      )
      return response.data
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Fetch list of actifs with filters
 */
export function useActifs(filters: ActifFilters = {}) {
  return useQuery({
    queryKey: patrimoineKeys.actifsList(filters),
    queryFn: async () => {
      const queryString = buildQueryString(filters)
      const response = await api.get<{ success: boolean; data: Actif[] }>(
        `/api/patrimoine/actifs${queryString}`
      )
      return response.data
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Fetch actifs for a specific client
 */
export function useClientActifs(clientId: string) {
  return useQuery({
    queryKey: patrimoineKeys.clientActifs(clientId),
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: any[] }>(
        `/api/clients/${clientId}/actifs`
      )
      return response.data
    },
    enabled: !!clientId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

// ============================================
// PASSIFS QUERIES
// ============================================

/**
 * Fetch a single passif by ID
 */
export function usePassif(id: string) {
  return useQuery({
    queryKey: patrimoineKeys.passif(id),
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: Passif }>(
        `/api/patrimoine/passifs/${id}`
      )
      return response.data
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Fetch list of passifs with filters
 */
export function usePassifs(filters: PassifFilters = {}) {
  return useQuery({
    queryKey: patrimoineKeys.passifsList(filters),
    queryFn: async () => {
      const queryString = buildQueryString(filters)
      const response = await api.get<{ success: boolean; data: Passif[] }>(
        `/api/patrimoine/passifs${queryString}`
      )
      return response.data
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Fetch passifs for a specific client
 */
export function useClientPassifs(clientId: string) {
  return useQuery({
    queryKey: patrimoineKeys.clientPassifs(clientId),
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: Passif[] }>(
        `/api/clients/${clientId}/passifs`
      )
      return response.data
    },
    enabled: !!clientId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

// ============================================
// CONTRATS QUERIES
// ============================================

/**
 * Fetch a single contrat by ID
 */
export function useContrat(id: string) {
  return useQuery({
    queryKey: patrimoineKeys.contrat(id),
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: Contrat }>(
        `/api/patrimoine/contrats/${id}`
      )
      return response.data
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Fetch list of contrats with filters
 */
export function useContrats(filters: ContratFilters = {}) {
  return useQuery({
    queryKey: patrimoineKeys.contratsList(filters),
    queryFn: async () => {
      const queryString = buildQueryString(filters)
      const response = await api.get<{ success: boolean; data: Contrat[] }>(
        `/api/patrimoine/contrats${queryString}`
      )
      return response.data
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Fetch contrats for a specific client
 */
export function useClientContrats(clientId: string) {
  return useQuery({
    queryKey: patrimoineKeys.clientContrats(clientId),
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: Contrat[] }>(
        `/api/clients/${clientId}/contrats`
      )
      return response.data
    },
    enabled: !!clientId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

// ============================================
// WEALTH CALCULATIONS
// ============================================

/**
 * Calculate client wealth
 */
export function useClientWealth(clientId: string) {
  return useQuery({
    queryKey: patrimoineKeys.wealth(clientId),
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: PatrimoineCalculation }>(
        `/api/clients/${clientId}/wealth`
      )
      return response.data
    },
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Fetch complete patrimoine for a client (actifs + passifs + contrats + wealth)
 */
export function useClientPatrimoine(clientId: string) {
  return useQuery({
    queryKey: patrimoineKeys.clientPatrimoine(clientId),
    queryFn: async () => {
      const response = await api.get<{
        success: boolean
        data: {
          actifs: any[]
          passifs: Passif[]
          contrats: Contrat[]
          wealth: PatrimoineCalculation
        }
      }>(`/api/clients/${clientId}/patrimoine`)
      return response.data
    },
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Detect patrimoine opportunities for a client
 */
export function usePatrimoineOpportunities(clientId: string) {
  return useQuery({
    queryKey: patrimoineKeys.opportunities(clientId),
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: any[] }>(
        `/api/clients/${clientId}/patrimoine/opportunities`
      )
      return response.data
    },
    enabled: !!clientId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

// ============================================
// ACTIFS MUTATIONS
// ============================================

/**
 * Create a new actif
 */
export function useCreateActif() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateActifData) => {
      const response = await api.post<{ success: boolean; data: Actif }>(
        '/api/patrimoine/actifs',
        data
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: patrimoineKeys.actifs() })
    },
  })
}

/**
 * Link actif to client
 */
export function useLinkActifToClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      actifId,
      clientId,
      ownershipPercentage,
      ownershipType,
    }: {
      actifId: string
      clientId: string
      ownershipPercentage?: number
      ownershipType?: string
    }) => {
      const response = await api.post<{ success: boolean; data: any }>(
        `/api/patrimoine/actifs/${actifId}/link`,
        { clientId, ownershipPercentage, ownershipType }
      )
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: patrimoineKeys.clientActifs(variables.clientId) })
      queryClient.invalidateQueries({ queryKey: patrimoineKeys.wealth(variables.clientId) })
      queryClient.invalidateQueries({ queryKey: patrimoineKeys.clientPatrimoine(variables.clientId) })
    },
  })
}

/**
 * Update an actif
 */
export function useUpdateActif() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateActifData> }) => {
      const response = await api.put<{ success: boolean; data: Actif }>(
        `/api/patrimoine/actifs/${id}`,
        data
      )
      return response.data
    },
    onSuccess: (data: any, variables: any) => {
      queryClient.setQueryData(patrimoineKeys.actif(variables.id), data)
      queryClient.invalidateQueries({ queryKey: patrimoineKeys.actifs() })
      // Invalidate wealth for all linked clients
      queryClient.invalidateQueries({ queryKey: patrimoineKeys.all })
    },
  })
}

/**
 * Delete an actif
 */
export function useDeleteActif() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete<{ success: boolean; data: Actif }>(
        `/api/patrimoine/actifs/${id}`
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: patrimoineKeys.actifs() })
      queryClient.invalidateQueries({ queryKey: patrimoineKeys.all })
    },
  })
}

// ============================================
// PASSIFS MUTATIONS
// ============================================

/**
 * Create a new passif
 */
export function useCreatePassif() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreatePassifData) => {
      const response = await api.post<{ success: boolean; data: Passif }>(
        '/api/patrimoine/passifs',
        data
      )
      return response.data
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: patrimoineKeys.passifs() })
      queryClient.invalidateQueries({ queryKey: patrimoineKeys.clientPassifs(data.clientId) })
      queryClient.invalidateQueries({ queryKey: patrimoineKeys.wealth(data.clientId) })
      queryClient.invalidateQueries({ queryKey: patrimoineKeys.clientPatrimoine(data.clientId) })
    },
  })
}

/**
 * Update a passif
 */
export function useUpdatePassif() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreatePassifData> }) => {
      const response = await api.put<{ success: boolean; data: Passif }>(
        `/api/patrimoine/passifs/${id}`,
        data
      )
      return response.data
    },
    onSuccess: (data: any, variables: any) => {
      queryClient.setQueryData(patrimoineKeys.passif(variables.id), data)
      queryClient.invalidateQueries({ queryKey: patrimoineKeys.passifs() })
      if (data.clientId) {
        queryClient.invalidateQueries({ queryKey: patrimoineKeys.clientPassifs(data.clientId) })
        queryClient.invalidateQueries({ queryKey: patrimoineKeys.wealth(data.clientId) })
        queryClient.invalidateQueries({ queryKey: patrimoineKeys.clientPatrimoine(data.clientId) })
      }
    },
  })
}

/**
 * Delete a passif
 */
export function useDeletePassif() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete<{ success: boolean }>(
        `/api/patrimoine/passifs/${id}`
      )
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: patrimoineKeys.passifs() })
      queryClient.invalidateQueries({ queryKey: patrimoineKeys.all })
    },
  })
}

// ============================================
// CONTRATS MUTATIONS
// ============================================

/**
 * Create a new contrat
 */
export function useCreateContrat() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateContratData) => {
      const response = await api.post<{ success: boolean; data: Contrat }>(
        '/api/patrimoine/contrats',
        data
      )
      return response.data
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: patrimoineKeys.contrats() })
      queryClient.invalidateQueries({ queryKey: patrimoineKeys.clientContrats(data.clientId) })
      queryClient.invalidateQueries({ queryKey: patrimoineKeys.clientPatrimoine(data.clientId) })
    },
  })
}

/**
 * Update a contrat
 */
export function useUpdateContrat() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string
      data: Partial<CreateContratData> & { status?: ContratStatus }
    }) => {
      const response = await api.put<{ success: boolean; data: Contrat }>(
        `/api/patrimoine/contrats/${id}`,
        data
      )
      return response.data
    },
    onSuccess: (data: any, variables: any) => {
      queryClient.setQueryData(patrimoineKeys.contrat(variables.id), data)
      queryClient.invalidateQueries({ queryKey: patrimoineKeys.contrats() })
      queryClient.invalidateQueries({ queryKey: patrimoineKeys.clientContrats(data.clientId) })
      queryClient.invalidateQueries({ queryKey: patrimoineKeys.clientPatrimoine(data.clientId) })
    },
  })
}

/**
 * Renew a contrat
 */
export function useRenewContrat() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      newEndDate,
      newPremium,
    }: {
      id: string
      newEndDate: Date | string
      newPremium?: number
    }) => {
      const response = await api.post<{ success: boolean; data: Contrat }>(
        `/api/patrimoine/contrats/${id}/renew`,
        { newEndDate, newPremium }
      )
      return response.data
    },
    onSuccess: (data: any, variables: any) => {
      queryClient.setQueryData(patrimoineKeys.contrat(variables.id), data)
      queryClient.invalidateQueries({ queryKey: patrimoineKeys.contrats() })
      queryClient.invalidateQueries({ queryKey: patrimoineKeys.clientContrats(data.clientId) })
    },
  })
}
