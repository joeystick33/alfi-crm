/**
 * Types helpers pour les requêtes Prisma dynamiques
 * Évite l'utilisation de `any` pour les clauses where, orderBy, etc.
 */

// ══════════════════════════════════════════════════════════════════════════════
// TYPES DE FILTRES DE DATE
// ══════════════════════════════════════════════════════════════════════════════

export interface DateFilter {
  gte?: Date
  lte?: Date
  gt?: Date
  lt?: Date
  equals?: Date
  not?: Date | DateFilter
}

// ══════════════════════════════════════════════════════════════════════════════
// TYPES DE FILTRES STRING
// ══════════════════════════════════════════════════════════════════════════════

export interface StringFilter {
  equals?: string
  not?: string | StringFilter
  in?: string[]
  notIn?: string[]
  contains?: string
  startsWith?: string
  endsWith?: string
  mode?: 'default' | 'insensitive'
}

// ══════════════════════════════════════════════════════════════════════════════
// TYPES DE FILTRES NUMÉRIQUES
// ══════════════════════════════════════════════════════════════════════════════

export interface NumberFilter {
  equals?: number
  not?: number | NumberFilter
  in?: number[]
  notIn?: number[]
  lt?: number
  lte?: number
  gt?: number
  gte?: number
}

// ══════════════════════════════════════════════════════════════════════════════
// CLAUSES WHERE GÉNÉRIQUES
// ══════════════════════════════════════════════════════════════════════════════

export interface BaseWhereClause {
  id?: string | StringFilter
  cabinetId?: string
  createdAt?: DateFilter
  updatedAt?: DateFilter
  AND?: BaseWhereClause[]
  OR?: BaseWhereClause[]
  NOT?: BaseWhereClause
  [key: string]: unknown
}

// ══════════════════════════════════════════════════════════════════════════════
// CLAUSES WHERE SPÉCIFIQUES PAR ENTITÉ
// ══════════════════════════════════════════════════════════════════════════════

export interface ClientWhereClause extends BaseWhereClause {
  firstName?: string | StringFilter
  lastName?: string | StringFilter
  email?: string | StringFilter | { not: null }
  phone?: string | StringFilter
  isActive?: boolean
  clientType?: string
  ownerId?: string
}

export interface AuditLogWhereClause extends BaseWhereClause {
  userId?: string
  action?: string
  entityType?: string
  entityId?: string
}

export interface TimelineEventWhereClause extends BaseWhereClause {
  clientId?: string
  type?: string | { in: string[] }
  title?: string | StringFilter
  description?: string | StringFilter
  relatedEntityType?: string | { in: string[] }
  createdBy?: string
}

export interface CampaignWhereClause extends BaseWhereClause {
  status?: string | { in: string[] }
  type?: string
  name?: string | StringFilter
  scheduledAt?: DateFilter
}

export interface ContractWhereClause extends BaseWhereClause {
  clientId?: string
  status?: string | { in: string[] }
  type?: string
  startDate?: DateFilter
  endDate?: DateFilter
}

export interface OpportunityWhereClause extends BaseWhereClause {
  clientId?: string
  status?: string | { in: string[] }
  priority?: string
  assignedToId?: string
  dueDate?: DateFilter
}

export interface DocumentWhereClause extends BaseWhereClause {
  clientId?: string
  type?: string | { in: string[] }
  status?: string
  category?: string
}

export interface TaskWhereClause extends BaseWhereClause {
  assignedToId?: string
  clientId?: string
  status?: string | { in: string[] }
  priority?: string
  dueDate?: DateFilter
}

export interface RendezVousWhereClause extends BaseWhereClause {
  clientId?: string
  advisorId?: string
  status?: string | { in: string[] }
  startDate?: DateFilter
  endDate?: DateFilter
}

// ══════════════════════════════════════════════════════════════════════════════
// TYPES POUR LES RÉSULTATS PRISMA AGRÉGÉS
// ══════════════════════════════════════════════════════════════════════════════

export interface PrismaGroupByResult<T extends string> {
  _count: number
  [key: string]: unknown
}

export interface EntityTypeGroupResult {
  entityType: string
  _count: number
}

export interface UserGroupResult {
  userId: string
  _count: number
}

export interface StatusGroupResult {
  status: string
  _count: number
}

// ══════════════════════════════════════════════════════════════════════════════
// TYPES POUR LES DONNÉES DE MISE À JOUR
// ══════════════════════════════════════════════════════════════════════════════

export interface BaseUpdateData {
  updatedAt?: Date
  [key: string]: unknown
}

// ══════════════════════════════════════════════════════════════════════════════
// HELPER POUR CONVERSION DECIMAL -> NUMBER
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Convertit une valeur Prisma Decimal ou autre en number
 */
export function toNumber(value: unknown): number {
  if (value === null || value === undefined) return 0
  if (typeof value === 'number') return value
  if (typeof value === 'string') return Number(value) || 0
  if (typeof value === 'object' && value !== null && 'toNumber' in value) {
    const decimalValue = value as { toNumber: () => number }
    if (typeof decimalValue.toNumber === 'function') {
      return decimalValue.toNumber()
    }
  }
  return Number(value) || 0
}

/**
 * Convertit une valeur en string de manière sûre
 */
export function toString(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value
  return String(value)
}

/**
 * Vérifie si une valeur est un objet non-null
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
