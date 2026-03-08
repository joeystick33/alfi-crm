/**
 * ProviderService - Service de gestion des fournisseurs (assureurs, sociétés de gestion)
 * 
 * Gère les opérations CRUD pour les fournisseurs et leurs produits
 */

import { prisma } from '@/app/_common/lib/prisma'
import type { Prisma } from '@prisma/client'

export interface ProviderFilters {
  type?: string[]
  conventionStatus?: string[]
  isFavorite?: boolean
  search?: string
}

export interface ProductFilters {
  providerId?: string
  type?: string[]
  isActive?: boolean
  search?: string
}

export interface CreateProviderData {
  name: string
  type: string
  siren?: string
  address?: string
  commercialContact?: { name?: string; email?: string; phone?: string }
  backOfficeContact?: { name?: string; email?: string; phone?: string }
  extranetUrl?: string
  extranetNotes?: string
  commissionGridUrl?: string
  conventionStatus?: string
  isFavorite?: boolean
  notes?: string
}

export interface CreateProductData {
  providerId: string
  name: string
  code: string
  type: string
  characteristics?: Record<string, unknown>
  availableFunds?: unknown[]
  minimumInvestment?: number
  documentTemplates?: string[]
  isActive?: boolean
}

export class ProviderService {
  constructor(
    private cabinetId: string,
    private userId: string,
    private isSuperAdmin: boolean = false
  ) {}

  /**
   * Liste les fournisseurs avec filtres
   */
  async getProviders(filters?: ProviderFilters) {
    const where: Prisma.OperationProviderWhereInput = {
      cabinetId: this.cabinetId,
    }

    if (filters?.type?.length) {
      where.type = { in: filters.type as any }
    }

    if (filters?.conventionStatus?.length) {
      where.conventionStatus = { in: filters.conventionStatus as any }
    }

    if (filters?.isFavorite !== undefined) {
      where.isFavorite = filters.isFavorite
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { siren: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    const providers = await prisma.operationProvider.findMany({
      where,
      orderBy: [
        { isFavorite: 'desc' },
        { name: 'asc' },
      ],
      include: {
        _count: {
          select: { products: true, affaires: true },
        },
      },
    })

    return providers
  }

  /**
   * Récupère un fournisseur par ID
   */
  async getProvider(id: string) {
    const provider = await prisma.operationProvider.findFirst({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
      include: {
        products: {
          where: { isActive: true },
          orderBy: { name: 'asc' },
        },
        _count: {
          select: { affaires: true },
        },
      },
    })

    if (!provider) {
      throw new Error('Provider not found')
    }

    return provider
  }

  /**
   * Crée un nouveau fournisseur
   */
  async createProvider(data: CreateProviderData) {
    return prisma.operationProvider.create({
      data: {
        cabinetId: this.cabinetId,
        name: data.name,
        type: data.type as any,
        siren: data.siren,
        address: data.address,
        commercialContact: data.commercialContact as any,
        backOfficeContact: data.backOfficeContact as any,
        extranetUrl: data.extranetUrl,
        extranetNotes: data.extranetNotes,
        commissionGridUrl: data.commissionGridUrl,
        conventionStatus: (data.conventionStatus as any) || 'ACTIVE',
        isFavorite: data.isFavorite || false,
        notes: data.notes,
      },
    })
  }

  /**
   * Met à jour un fournisseur
   */
  async updateProvider(id: string, data: Partial<CreateProviderData>) {
    const existing = await prisma.operationProvider.findFirst({
      where: { id, cabinetId: this.cabinetId },
    })

    if (!existing) {
      throw new Error('Provider not found')
    }

    return prisma.operationProvider.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.type && { type: data.type as any }),
        ...(data.siren !== undefined && { siren: data.siren }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.commercialContact !== undefined && { commercialContact: data.commercialContact as any }),
        ...(data.backOfficeContact !== undefined && { backOfficeContact: data.backOfficeContact as any }),
        ...(data.extranetUrl !== undefined && { extranetUrl: data.extranetUrl }),
        ...(data.extranetNotes !== undefined && { extranetNotes: data.extranetNotes }),
        ...(data.commissionGridUrl !== undefined && { commissionGridUrl: data.commissionGridUrl }),
        ...(data.conventionStatus && { conventionStatus: data.conventionStatus as any }),
        ...(data.isFavorite !== undefined && { isFavorite: data.isFavorite }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
    })
  }

  /**
   * Supprime un fournisseur
   */
  async deleteProvider(id: string) {
    const existing = await prisma.operationProvider.findFirst({
      where: { id, cabinetId: this.cabinetId },
      include: { _count: { select: { affaires: true } } },
    })

    if (!existing) {
      throw new Error('Provider not found')
    }

    if (existing._count.affaires > 0) {
      throw new Error('Cannot delete provider with existing affaires')
    }

    await prisma.operationProvider.delete({ where: { id } })
  }

  /**
   * Liste les produits d'un fournisseur
   */
  async getProducts(filters?: ProductFilters) {
    const where: Prisma.OperationProductWhereInput = {}

    if (filters?.providerId) {
      where.providerId = filters.providerId
      // Vérifier que le provider appartient au cabinet
      const provider = await prisma.operationProvider.findFirst({
        where: { id: filters.providerId, cabinetId: this.cabinetId },
      })
      if (!provider) {
        throw new Error('Provider not found')
      }
    } else {
      // Filtrer par cabinet via le provider
      where.provider = { cabinetId: this.cabinetId }
    }

    if (filters?.type?.length) {
      where.type = { in: filters.type as any }
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { code: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    return prisma.operationProduct.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        provider: {
          select: { id: true, name: true, type: true },
        },
      },
    })
  }

  /**
   * Récupère un produit par ID
   */
  async getProduct(id: string) {
    const product = await prisma.operationProduct.findFirst({
      where: { id },
      include: {
        provider: true,
      },
    })

    if (!product || product.provider.cabinetId !== this.cabinetId) {
      throw new Error('Product not found')
    }

    return product
  }

  /**
   * Crée un nouveau produit
   */
  async createProduct(data: CreateProductData) {
    // Vérifier que le provider appartient au cabinet
    const provider = await prisma.operationProvider.findFirst({
      where: { id: data.providerId, cabinetId: this.cabinetId },
    })

    if (!provider) {
      throw new Error('Provider not found')
    }

    return prisma.operationProduct.create({
      data: {
        providerId: data.providerId,
        name: data.name,
        code: data.code,
        type: data.type as any,
        characteristics: (data.characteristics ?? {}) as Prisma.InputJsonValue,
        availableFunds: (data.availableFunds ?? []) as Prisma.InputJsonValue,
        minimumInvestment: data.minimumInvestment || 0,
        documentTemplates: data.documentTemplates || [],
        isActive: data.isActive ?? true,
      },
    })
  }

  /**
   * Met à jour un produit
   */
  async updateProduct(id: string, data: Partial<CreateProductData>) {
    const existing = await this.getProduct(id)

    return prisma.operationProduct.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.code && { code: data.code }),
        ...(data.type && { type: data.type as any }),
        ...(data.characteristics && {
          characteristics: data.characteristics as Prisma.InputJsonValue,
        }),
        ...(data.availableFunds && {
          availableFunds: data.availableFunds as Prisma.InputJsonValue,
        }),
        ...(data.minimumInvestment !== undefined && { minimumInvestment: data.minimumInvestment }),
        ...(data.documentTemplates && { documentTemplates: data.documentTemplates }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    })
  }

  /**
   * Supprime un produit
   */
  async deleteProduct(id: string) {
    const product = await this.getProduct(id)

    // Vérifier qu'il n'y a pas d'affaires liées
    const affairesCount = await prisma.affaireNouvelle.count({
      where: { productId: id },
    })

    if (affairesCount > 0) {
      throw new Error('Cannot delete product with existing affaires')
    }

    await prisma.operationProduct.delete({ where: { id } })
  }

  /**
   * Statistiques des fournisseurs
   */
  async getStats() {
    const [totalProviders, byType, byStatus, favoriteCount] = await Promise.all([
      prisma.operationProvider.count({ where: { cabinetId: this.cabinetId } }),
      prisma.operationProvider.groupBy({
        by: ['type'],
        where: { cabinetId: this.cabinetId },
        _count: true,
      }),
      prisma.operationProvider.groupBy({
        by: ['conventionStatus'],
        where: { cabinetId: this.cabinetId },
        _count: true,
      }),
      prisma.operationProvider.count({
        where: { cabinetId: this.cabinetId, isFavorite: true },
      }),
    ])

    return {
      total: totalProviders,
      favorites: favoriteCount,
      byType: byType.reduce((acc, item) => {
        acc[item.type] = item._count
        return acc
      }, {} as Record<string, number>),
      byStatus: byStatus.reduce((acc, item) => {
        acc[item.conventionStatus] = item._count
        return acc
      }, {} as Record<string, number>),
    }
  }
}
