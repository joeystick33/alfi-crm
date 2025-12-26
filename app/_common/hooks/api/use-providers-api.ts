/**
 * React Query hooks for Providers API
 * 
 * Provides hooks for managing providers (assureurs, sociétés de gestion, etc.)
 * and their products catalog.
 * 
 * @module app/_common/hooks/api/use-providers-api
 */

import { 
  useQuery, 
  useMutation, 
  useQueryClient, 
  type UseQueryOptions, 
  type UseMutationOptions 
} from '@tanstack/react-query'
import { api, buildQueryString } from '@/app/_common/lib/api-client'
import { toast } from '@/app/_common/hooks/use-toast'
import type {
  Provider,
  Product,
  ProviderType,
  ConventionStatus,
  ProductType,
  ContactInfo,
  ProductCharacteristics,
  Fund,
} from '@/lib/operations/types'

// ============================================================================
// Query Keys
// ============================================================================

export const providersQueryKeys = {
  // Providers
  providers: ['providers'] as const,
  providerList: (filters?: ProviderFilters) => ['providers', 'list', filters] as const,
  provider: (id: string) => ['providers', id] as const,
  
  // Products
  products: ['products'] as const,
  productList: (filters?: ProductFilters) => ['products', 'list', filters] as const,
  product: (id: string) => ['products', id] as const,
  providerProducts: (providerId: string) => ['providers', providerId, 'products'] as const,
  
  // Stats
  providerStats: ['providers', 'stats'] as const,
}

// ============================================================================
// Types for API Requests
// ============================================================================

interface ProviderFilters {
  type?: ProviderType[]
  conventionStatus?: ConventionStatus[]
  isFavorite?: boolean
  search?: string
}

interface ProductFilters {
  providerId?: string
  type?: ProductType[]
  isActive?: boolean
  search?: string
}

interface CreateProviderRequest {
  name: string
  type: ProviderType
  siren?: string
  address?: string
  commercialContact?: ContactInfo
  backOfficeContact?: ContactInfo
  extranetUrl?: string
  extranetNotes?: string
  commissionGridUrl?: string
  conventionStatus?: ConventionStatus
  isFavorite?: boolean
  notes?: string
}

interface UpdateProviderRequest {
  name?: string
  type?: ProviderType
  siren?: string
  address?: string
  commercialContact?: ContactInfo
  backOfficeContact?: ContactInfo
  extranetUrl?: string
  extranetNotes?: string
  commissionGridUrl?: string
  conventionStatus?: ConventionStatus
  isFavorite?: boolean
  notes?: string
}

interface CreateProductRequest {
  providerId: string
  name: string
  code: string
  type: ProductType
  characteristics: ProductCharacteristics
  availableFunds?: Fund[]
  minimumInvestment: number
  documentTemplates?: string[]
  isActive?: boolean
}

interface UpdateProductRequest {
  name?: string
  code?: string
  type?: ProductType
  characteristics?: ProductCharacteristics
  availableFunds?: Fund[]
  minimumInvestment?: number
  documentTemplates?: string[]
  isActive?: boolean
}

interface ProviderStats {
  totalProviders: number
  providersByType: Record<ProviderType, number>
  providersByConventionStatus: Record<ConventionStatus, number>
  favoriteCount: number
  totalProducts: number
  activeProducts: number
}

// ============================================================================
// Providers Hooks
// ============================================================================

/**
 * Fetch list of providers with filters
 */
export function useProviders(
  filters?: ProviderFilters,
  options?: Omit<UseQueryOptions<{ data: Provider[] }>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: providersQueryKeys.providerList(filters),
    queryFn: () => {
      const queryString = buildQueryString(filters || {})
      return api.get<{ data: Provider[] }>(`/v1/operations/providers${queryString}`)
    },
    ...options,
  })
}

/**
 * Fetch a single provider by ID
 */
export function useProvider(
  id: string,
  options?: Omit<UseQueryOptions<Provider>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: providersQueryKeys.provider(id),
    queryFn: () => api.get<Provider>(`/v1/operations/providers/${id}`),
    enabled: !!id,
    ...options,
  })
}

/**
 * Create a provider
 */
export function useCreateProvider(
  options?: UseMutationOptions<Provider, Error, CreateProviderRequest>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateProviderRequest) =>
      api.post<Provider>('/v1/operations/providers', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: providersQueryKeys.providers })
      queryClient.invalidateQueries({ queryKey: providersQueryKeys.providerStats })
      toast({ title: 'Fournisseur créé', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

/**
 * Update a provider
 */
export function useUpdateProvider(
  options?: UseMutationOptions<Provider, Error, { id: string; data: UpdateProviderRequest }>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProviderRequest }) =>
      api.patch<Provider>(`/v1/operations/providers/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: providersQueryKeys.provider(id) })
      queryClient.invalidateQueries({ queryKey: providersQueryKeys.providers })
      queryClient.invalidateQueries({ queryKey: providersQueryKeys.providerStats })
      toast({ title: 'Fournisseur mis à jour', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

/**
 * Toggle provider favorite status
 */
export function useToggleProviderFavorite(
  options?: UseMutationOptions<Provider, Error, string>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      api.post<Provider>(`/v1/operations/providers/${id}/toggle-favorite`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: providersQueryKeys.provider(id) })
      queryClient.invalidateQueries({ queryKey: providersQueryKeys.providers })
      toast({ title: 'Favori mis à jour', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

/**
 * Delete a provider
 */
export function useDeleteProvider(
  options?: UseMutationOptions<void, Error, string>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.delete(`/v1/operations/providers/${id}`).then(() => {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: providersQueryKeys.providers })
      queryClient.invalidateQueries({ queryKey: providersQueryKeys.providerStats })
      toast({ title: 'Fournisseur supprimé', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

// ============================================================================
// Products Hooks
// ============================================================================

/**
 * Fetch list of products with filters
 */
export function useProducts(
  filters?: ProductFilters,
  options?: Omit<UseQueryOptions<{ data: Product[] }>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: providersQueryKeys.productList(filters),
    queryFn: () => {
      const queryString = buildQueryString(filters || {})
      return api.get<{ data: Product[] }>(`/v1/operations/products${queryString}`)
    },
    ...options,
  })
}

/**
 * Fetch products for a specific provider
 */
export function useProviderProducts(
  providerId: string,
  options?: Omit<UseQueryOptions<{ data: Product[] }>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: providersQueryKeys.providerProducts(providerId),
    queryFn: () => api.get<{ data: Product[] }>(`/v1/operations/providers/${providerId}/products`),
    enabled: !!providerId,
    ...options,
  })
}

/**
 * Fetch a single product by ID
 */
export function useProduct(
  id: string,
  options?: Omit<UseQueryOptions<Product>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: providersQueryKeys.product(id),
    queryFn: () => api.get<Product>(`/v1/operations/products/${id}`),
    enabled: !!id,
    ...options,
  })
}

/**
 * Create a product
 */
export function useCreateProduct(
  options?: UseMutationOptions<Product, Error, CreateProductRequest>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateProductRequest) =>
      api.post<Product>(`/v1/operations/providers/${data.providerId}/products`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: providersQueryKeys.products })
      queryClient.invalidateQueries({ 
        queryKey: providersQueryKeys.providerProducts(variables.providerId) 
      })
      queryClient.invalidateQueries({ queryKey: providersQueryKeys.providerStats })
      toast({ title: 'Produit créé', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

/**
 * Update a product
 */
export function useUpdateProduct(
  options?: UseMutationOptions<Product, Error, { id: string; data: UpdateProductRequest }>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductRequest }) =>
      api.patch<Product>(`/v1/operations/products/${id}`, data),
    onSuccess: (result, { id }) => {
      queryClient.invalidateQueries({ queryKey: providersQueryKeys.product(id) })
      queryClient.invalidateQueries({ queryKey: providersQueryKeys.products })
      queryClient.invalidateQueries({ 
        queryKey: providersQueryKeys.providerProducts(result.providerId) 
      })
      toast({ title: 'Produit mis à jour', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

/**
 * Toggle product active status
 */
export function useToggleProductActive(
  options?: UseMutationOptions<Product, Error, string>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      api.post<Product>(`/v1/operations/products/${id}/toggle-active`),
    onSuccess: (result, id) => {
      queryClient.invalidateQueries({ queryKey: providersQueryKeys.product(id) })
      queryClient.invalidateQueries({ queryKey: providersQueryKeys.products })
      queryClient.invalidateQueries({ 
        queryKey: providersQueryKeys.providerProducts(result.providerId) 
      })
      toast({ title: 'Statut produit mis à jour', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

/**
 * Delete a product
 */
export function useDeleteProduct(
  options?: UseMutationOptions<void, Error, { id: string; providerId: string }>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id }: { id: string; providerId: string }) => 
      api.delete(`/v1/operations/products/${id}`).then(() => {}),
    onSuccess: (_, { providerId }) => {
      queryClient.invalidateQueries({ queryKey: providersQueryKeys.products })
      queryClient.invalidateQueries({ 
        queryKey: providersQueryKeys.providerProducts(providerId) 
      })
      queryClient.invalidateQueries({ queryKey: providersQueryKeys.providerStats })
      toast({ title: 'Produit supprimé', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    },
    ...options,
  })
}

// ============================================================================
// Provider Stats Hook
// ============================================================================

/**
 * Fetch provider statistics
 */
export function useProviderStats(
  options?: Omit<UseQueryOptions<ProviderStats>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: providersQueryKeys.providerStats,
    queryFn: () => api.get<ProviderStats>('/v1/operations/providers/stats'),
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options,
  })
}
