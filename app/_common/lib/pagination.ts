/**
 * Utilitaires de pagination pour les API routes
 * Gère pagination, tri et filtrage avec Prisma
 */

import { z } from 'zod'

/**
 * Schéma Zod pour les paramètres de pagination
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export type PaginationParams = z.infer<typeof paginationSchema>

/**
 * Résultat paginé standardisé
 */
export interface PaginatedResult<T> {
  data: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

/**
 * Extrait les paramètres de pagination d'une URL
 */
export function extractPaginationParams(searchParams: URLSearchParams): PaginationParams {
  const rawParams = {
    page: searchParams.get('page') || '1',
    pageSize: searchParams.get('pageSize') || searchParams.get('limit') || '20',
    sortBy: searchParams.get('sortBy') || searchParams.get('sort') || undefined,
    sortOrder: searchParams.get('sortOrder') || searchParams.get('order') || 'desc',
  }

  return paginationSchema.parse(rawParams)
}

/**
 * Convertit les paramètres de pagination en options Prisma
 */
export function toPrismaOptions(params: PaginationParams) {
  return {
    skip: (params.page - 1) * params.pageSize,
    take: params.pageSize,
    orderBy: params.sortBy
      ? { [params.sortBy]: params.sortOrder }
      : { createdAt: params.sortOrder as 'asc' | 'desc' },
  }
}

/**
 * Construit le résultat paginé
 */
export function buildPaginatedResult<T>(
  data: T[],
  total: number,
  params: PaginationParams
): PaginatedResult<T> {
  const totalPages = Math.ceil(total / params.pageSize)

  return {
    data,
    pagination: {
      page: params.page,
      pageSize: params.pageSize,
      total,
      totalPages,
      hasNextPage: params.page < totalPages,
      hasPreviousPage: params.page > 1,
    },
  }
}

/**
 * Helper pour les filtres de recherche texte
 */
export function buildSearchFilter(
  searchTerm: string | null,
  fields: string[]
): object | undefined {
  if (!searchTerm) return undefined

  return {
    OR: fields.map(field => ({
      [field]: {
        contains: searchTerm,
        mode: 'insensitive',
      },
    })),
  }
}

/**
 * Helper pour les filtres de date
 */
export function buildDateFilter(
  startDate: string | null,
  endDate: string | null,
  field: string = 'createdAt'
): object | undefined {
  if (!startDate && !endDate) return undefined

  const filter: { gte?: Date; lte?: Date } = {}
  
  if (startDate) {
    filter.gte = new Date(startDate)
  }
  
  if (endDate) {
    filter.lte = new Date(endDate)
  }

  return { [field]: filter }
}

/**
 * Combine plusieurs filtres en un seul objet where
 */
export function combineFilters(...filters: (object | undefined)[]): object {
  const validFilters = filters.filter(Boolean) as object[]
  
  if (validFilters.length === 0) return {}
  if (validFilters.length === 1) return validFilters[0]
  
  return {
    AND: validFilters,
  }
}
