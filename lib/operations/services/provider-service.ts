/**
 * Service de gestion des Fournisseurs et Catalogue Produits
 * 
 * Ce service gère les fournisseurs (assureurs, sociétés de gestion, etc.)
 * et leur catalogue de produits:
 * - CRUD des fournisseurs
 * - Gestion du catalogue produits
 * - Recherche et filtrage
 * 
 * @module lib/operations/services/provider-service
 * @requirements 24.1-24.6
 */

import { prisma } from '@/app/_common/lib/prisma'
import {
  type ProviderType,
  type ConventionStatus,
  type ProductType,
  PROVIDER_TYPE_LABELS,
  CONVENTION_STATUS_LABELS,
  PRODUCT_TYPE_LABELS,
} from '../types'
import {
  createProviderSchema,
  updateProviderSchema,
  createProductSchema,
  updateProductSchema,
  type CreateProviderInput,
  type UpdateProviderInput,
  type CreateProductInput,
  type UpdateProductInput,
} from '../schemas'

// ============================================================================
// Types
// ============================================================================

export interface ProviderServiceResult<T> {
  success: boolean
  data?: T
  error?: string
}

export interface ProviderWithProducts {
  id: string
  cabinetId: string
  name: string
  type: string
  typeLabel: string
  siren: string | null
  address: string | null
  commercialContact: unknown
  backOfficeContact: unknown
  extranetUrl: string | null
  extranetNotes: string | null
  commissionGridUrl: string | null
  conventionStatus: string
  conventionStatusLabel: string
  isFavorite: boolean
  notes: string | null
  createdAt: Date
  updatedAt: Date
  productsCount: number
  products?: ProductWithDetails[]
}

export interface ProductWithDetails {
  id: string
  providerId: string
  name: string
  code: string
  type: string
  typeLabel: string
  characteristics: unknown
  availableFunds: unknown
  minimumInvestment: number
  documentTemplates: string[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ProviderFilters {
  type?: ProviderType[]
  conventionStatus?: ConventionStatus[]
  isFavorite?: boolean
  search?: string
}

export interface ProductFilters {
  type?: ProductType[]
  isActive?: boolean
  search?: string
  minInvestment?: number
  maxInvestment?: number
}

// ============================================================================
// Provider Service
// ============================================================================

/**
 * Récupère tous les fournisseurs d'un cabinet
 * 
 * @requirements 24.1 - THE Operations_Manager SHALL provide a provider catalog
 */
export async function getProviders(
  cabinetId: string,
  filters?: ProviderFilters
): Promise<ProviderServiceResult<ProviderWithProducts[]>> {
  try {
    const where = buildProviderWhereClause(cabinetId, filters)

    const providers = await prisma.operationProvider.findMany({
      where,
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: [
        { isFavorite: 'desc' },
        { name: 'asc' },
      ],
    })

    return {
      success: true,
      data: providers.map(provider => transformProvider(provider, provider._count.products)),
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la récupération des fournisseurs'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Récupère un fournisseur par son ID avec ses produits
 * 
 * @requirements 24.3 - THE Operations_Manager SHALL display provider details with products
 */
export async function getProviderById(
  providerId: string,
  includeProducts: boolean = true
): Promise<ProviderServiceResult<ProviderWithProducts>> {
  try {
    const provider = await prisma.operationProvider.findUnique({
      where: { id: providerId },
      include: {
        products: includeProducts,
        _count: {
          select: { products: true },
        },
      },
    })

    if (!provider) {
      return {
        success: false,
        error: 'Fournisseur non trouvé',
      }
    }

    const result = transformProvider(provider, provider._count.products)
    
    if (includeProducts && provider.products) {
      result.products = provider.products.map(transformProduct)
    }

    return {
      success: true,
      data: result,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la récupération du fournisseur'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Crée un nouveau fournisseur
 * 
 * @requirements 24.2 - THE Operations_Manager SHALL allow adding providers
 */
export async function addProvider(
  input: CreateProviderInput
): Promise<ProviderServiceResult<ProviderWithProducts>> {
  try {
    // Validate input
    const validatedInput = createProviderSchema.parse(input)

    const provider = await prisma.operationProvider.create({
      data: {
        cabinetId: validatedInput.cabinetId,
        name: validatedInput.name,
        type: validatedInput.type as ProviderType,
        siren: validatedInput.siren ?? null,
        address: validatedInput.address ?? null,
        commercialContact: validatedInput.commercialContact ?? null,
        backOfficeContact: validatedInput.backOfficeContact ?? null,
        extranetUrl: validatedInput.extranetUrl ?? null,
        extranetNotes: validatedInput.extranetNotes ?? null,
        commissionGridUrl: validatedInput.commissionGridUrl ?? null,
        conventionStatus: validatedInput.conventionStatus ?? 'ACTIVE',
        isFavorite: validatedInput.isFavorite ?? false,
        notes: validatedInput.notes ?? null,
      },
      include: {
        _count: {
          select: { products: true },
        },
      },
    })

    return {
      success: true,
      data: transformProvider(provider, provider._count.products),
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la création du fournisseur'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Met à jour un fournisseur
 */
export async function updateProvider(
  providerId: string,
  input: UpdateProviderInput
): Promise<ProviderServiceResult<ProviderWithProducts>> {
  try {
    // Validate input
    const validatedInput = updateProviderSchema.parse(input)

    const provider = await prisma.operationProvider.update({
      where: { id: providerId },
      data: validatedInput,
      include: {
        _count: {
          select: { products: true },
        },
      },
    })

    return {
      success: true,
      data: transformProvider(provider, provider._count.products),
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la mise à jour du fournisseur'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Supprime un fournisseur
 */
export async function deleteProvider(
  providerId: string
): Promise<ProviderServiceResult<{ deleted: boolean }>> {
  try {
    // Check if provider has any affaires
    const affairesCount = await prisma.affaireNouvelle.count({
      where: { providerId },
    })

    if (affairesCount > 0) {
      return {
        success: false,
        error: `Impossible de supprimer ce fournisseur car il est lié à ${affairesCount} affaire(s)`,
      }
    }

    await prisma.operationProvider.delete({
      where: { id: providerId },
    })

    return {
      success: true,
      data: { deleted: true },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la suppression du fournisseur'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Marque un fournisseur comme favori
 */
export async function toggleProviderFavorite(
  providerId: string
): Promise<ProviderServiceResult<ProviderWithProducts>> {
  try {
    const provider = await prisma.operationProvider.findUnique({
      where: { id: providerId },
    })

    if (!provider) {
      return {
        success: false,
        error: 'Fournisseur non trouvé',
      }
    }

    const updatedProvider = await prisma.operationProvider.update({
      where: { id: providerId },
      data: {
        isFavorite: !provider.isFavorite,
      },
      include: {
        _count: {
          select: { products: true },
        },
      },
    })

    return {
      success: true,
      data: transformProvider(updatedProvider, updatedProvider._count.products),
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la mise à jour du favori'
    return {
      success: false,
      error: message,
    }
  }
}

// ============================================================================
// Product Service
// ============================================================================

/**
 * Récupère les produits d'un fournisseur
 * 
 * @requirements 24.4 - THE Operations_Manager SHALL display products by provider
 */
export async function getProductsByProvider(
  providerId: string,
  filters?: ProductFilters
): Promise<ProviderServiceResult<ProductWithDetails[]>> {
  try {
    const where = buildProductWhereClause(providerId, filters)

    const products = await prisma.operationProduct.findMany({
      where,
      orderBy: [
        { isActive: 'desc' },
        { name: 'asc' },
      ],
    })

    return {
      success: true,
      data: products.map(transformProduct),
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la récupération des produits'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Récupère un produit par son ID
 */
export async function getProductById(
  productId: string
): Promise<ProviderServiceResult<ProductWithDetails>> {
  try {
    const product = await prisma.operationProduct.findUnique({
      where: { id: productId },
    })

    if (!product) {
      return {
        success: false,
        error: 'Produit non trouvé',
      }
    }

    return {
      success: true,
      data: transformProduct(product),
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la récupération du produit'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Crée un nouveau produit
 * 
 * @requirements 24.5 - THE Operations_Manager SHALL allow adding products
 */
export async function addProduct(
  input: CreateProductInput
): Promise<ProviderServiceResult<ProductWithDetails>> {
  try {
    // Validate input
    const validatedInput = createProductSchema.parse(input)

    const product = await prisma.operationProduct.create({
      data: {
        providerId: validatedInput.providerId,
        name: validatedInput.name,
        code: validatedInput.code,
        type: validatedInput.type as ProductType,
        characteristics: validatedInput.characteristics,
        availableFunds: validatedInput.availableFunds ?? null,
        minimumInvestment: validatedInput.minimumInvestment,
        documentTemplates: validatedInput.documentTemplates ?? [],
        isActive: validatedInput.isActive ?? true,
      },
    })

    return {
      success: true,
      data: transformProduct(product),
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la création du produit'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Met à jour un produit
 */
export async function updateProduct(
  productId: string,
  input: UpdateProductInput
): Promise<ProviderServiceResult<ProductWithDetails>> {
  try {
    // Validate input
    const validatedInput = updateProductSchema.parse(input)

    const product = await prisma.operationProduct.update({
      where: { id: productId },
      data: validatedInput,
    })

    return {
      success: true,
      data: transformProduct(product),
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la mise à jour du produit'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Désactive un produit
 */
export async function deactivateProduct(
  productId: string
): Promise<ProviderServiceResult<ProductWithDetails>> {
  try {
    const product = await prisma.operationProduct.update({
      where: { id: productId },
      data: {
        isActive: false,
      },
    })

    return {
      success: true,
      data: transformProduct(product),
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la désactivation du produit'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Active un produit
 */
export async function activateProduct(
  productId: string
): Promise<ProviderServiceResult<ProductWithDetails>> {
  try {
    const product = await prisma.operationProduct.update({
      where: { id: productId },
      data: {
        isActive: true,
      },
    })

    return {
      success: true,
      data: transformProduct(product),
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de l\'activation du produit'
    return {
      success: false,
      error: message,
    }
  }
}

// ============================================================================
// Search and Statistics
// ============================================================================

/**
 * Recherche des fournisseurs par nom
 */
export async function searchProviders(
  cabinetId: string,
  searchTerm: string
): Promise<ProviderServiceResult<ProviderWithProducts[]>> {
  try {
    const providers = await prisma.operationProvider.findMany({
      where: {
        cabinetId,
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { siren: { contains: searchTerm } },
        ],
      },
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: 'asc' },
      take: 20,
    })

    return {
      success: true,
      data: providers.map(provider => transformProvider(provider, provider._count.products)),
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la recherche'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Recherche des produits par nom ou code
 */
export async function searchProducts(
  cabinetId: string,
  searchTerm: string
): Promise<ProviderServiceResult<ProductWithDetails[]>> {
  try {
    const products = await prisma.operationProduct.findMany({
      where: {
        provider: {
          cabinetId,
        },
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { code: { contains: searchTerm, mode: 'insensitive' } },
        ],
        isActive: true,
      },
      orderBy: { name: 'asc' },
      take: 20,
    })

    return {
      success: true,
      data: products.map(transformProduct),
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la recherche'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Récupère les statistiques des fournisseurs
 * 
 * @requirements 24.6 - THE Operations_Manager SHALL display provider statistics
 */
export async function getProviderStats(
  cabinetId: string
): Promise<ProviderServiceResult<{
  totalProviders: number
  byType: Record<string, number>
  byConventionStatus: Record<string, number>
  totalProducts: number
  activeProducts: number
}>> {
  try {
    const providers = await prisma.operationProvider.findMany({
      where: { cabinetId },
      include: {
        _count: {
          select: { products: true },
        },
      },
    })

    const products = await prisma.operationProduct.findMany({
      where: {
        provider: {
          cabinetId,
        },
      },
      select: {
        isActive: true,
      },
    })

    const stats = {
      totalProviders: providers.length,
      byType: {} as Record<string, number>,
      byConventionStatus: {} as Record<string, number>,
      totalProducts: products.length,
      activeProducts: products.filter(p => p.isActive).length,
    }

    for (const provider of providers) {
      // By type
      if (!stats.byType[provider.type]) {
        stats.byType[provider.type] = 0
      }
      stats.byType[provider.type]++

      // By convention status
      if (!stats.byConventionStatus[provider.conventionStatus]) {
        stats.byConventionStatus[provider.conventionStatus] = 0
      }
      stats.byConventionStatus[provider.conventionStatus]++
    }

    return {
      success: true,
      data: stats,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors du calcul des statistiques'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Récupère les fournisseurs favoris
 */
export async function getFavoriteProviders(
  cabinetId: string
): Promise<ProviderServiceResult<ProviderWithProducts[]>> {
  try {
    const providers = await prisma.operationProvider.findMany({
      where: {
        cabinetId,
        isFavorite: true,
        conventionStatus: 'ACTIVE',
      },
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: 'asc' },
    })

    return {
      success: true,
      data: providers.map(provider => transformProvider(provider, provider._count.products)),
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la récupération des favoris'
    return {
      success: false,
      error: message,
    }
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Construit la clause WHERE pour les requêtes de fournisseurs
 */
function buildProviderWhereClause(
  cabinetId: string,
  filters?: ProviderFilters
): Record<string, unknown> {
  const where: Record<string, unknown> = { cabinetId }

  if (!filters) return where

  if (filters.type && filters.type.length > 0) {
    where.type = { in: filters.type }
  }

  if (filters.conventionStatus && filters.conventionStatus.length > 0) {
    where.conventionStatus = { in: filters.conventionStatus }
  }

  if (filters.isFavorite !== undefined) {
    where.isFavorite = filters.isFavorite
  }

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { siren: { contains: filters.search } },
    ]
  }

  return where
}

/**
 * Construit la clause WHERE pour les requêtes de produits
 */
function buildProductWhereClause(
  providerId: string,
  filters?: ProductFilters
): Record<string, unknown> {
  const where: Record<string, unknown> = { providerId }

  if (!filters) return where

  if (filters.type && filters.type.length > 0) {
    where.type = { in: filters.type }
  }

  if (filters.isActive !== undefined) {
    where.isActive = filters.isActive
  }

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { code: { contains: filters.search, mode: 'insensitive' } },
    ]
  }

  if (filters.minInvestment !== undefined || filters.maxInvestment !== undefined) {
    where.minimumInvestment = {}
    if (filters.minInvestment !== undefined) {
      (where.minimumInvestment as Record<string, number>).gte = filters.minInvestment
    }
    if (filters.maxInvestment !== undefined) {
      (where.minimumInvestment as Record<string, number>).lte = filters.maxInvestment
    }
  }

  return where
}

/**
 * Transforme un fournisseur Prisma en type de sortie
 */
function transformProvider(
  provider: {
    id: string
    cabinetId: string
    name: string
    type: string
    siren: string | null
    address: string | null
    commercialContact: unknown
    backOfficeContact: unknown
    extranetUrl: string | null
    extranetNotes: string | null
    commissionGridUrl: string | null
    conventionStatus: string
    isFavorite: boolean
    notes: string | null
    createdAt: Date
    updatedAt: Date
  },
  productsCount: number
): ProviderWithProducts {
  return {
    id: provider.id,
    cabinetId: provider.cabinetId,
    name: provider.name,
    type: provider.type,
    typeLabel: PROVIDER_TYPE_LABELS[provider.type as ProviderType],
    siren: provider.siren,
    address: provider.address,
    commercialContact: provider.commercialContact,
    backOfficeContact: provider.backOfficeContact,
    extranetUrl: provider.extranetUrl,
    extranetNotes: provider.extranetNotes,
    commissionGridUrl: provider.commissionGridUrl,
    conventionStatus: provider.conventionStatus,
    conventionStatusLabel: CONVENTION_STATUS_LABELS[provider.conventionStatus as ConventionStatus],
    isFavorite: provider.isFavorite,
    notes: provider.notes,
    createdAt: provider.createdAt,
    updatedAt: provider.updatedAt,
    productsCount,
  }
}

/**
 * Transforme un produit Prisma en type de sortie
 */
function transformProduct(product: {
  id: string
  providerId: string
  name: string
  code: string
  type: string
  characteristics: unknown
  availableFunds: unknown
  minimumInvestment: { toNumber(): number } | number
  documentTemplates: string[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}): ProductWithDetails {
  return {
    id: product.id,
    providerId: product.providerId,
    name: product.name,
    code: product.code,
    type: product.type,
    typeLabel: PRODUCT_TYPE_LABELS[product.type as ProductType],
    characteristics: product.characteristics,
    availableFunds: product.availableFunds,
    minimumInvestment: typeof product.minimumInvestment === 'number'
      ? product.minimumInvestment
      : product.minimumInvestment.toNumber(),
    documentTemplates: product.documentTemplates,
    isActive: product.isActive,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  }
}

/**
 * Obtient le label français d'un type de fournisseur
 */
export function getProviderTypeLabel(type: ProviderType): string {
  return PROVIDER_TYPE_LABELS[type]
}

/**
 * Obtient le label français d'un statut de convention
 */
export function getConventionStatusLabel(status: ConventionStatus): string {
  return CONVENTION_STATUS_LABELS[status]
}

/**
 * Obtient le label français d'un type de produit
 */
export function getProductTypeLabel(type: ProductType): string {
  return PRODUCT_TYPE_LABELS[type]
}
