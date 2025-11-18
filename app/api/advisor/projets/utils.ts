/**
 * Validation utilities for projets API routes
 * 
 * Provides functions to parse query parameters and normalize request payloads.
 * All functions throw descriptive errors for invalid input.
 */

import { ProjetType, ProjetStatus } from '@prisma/client'

export type ProjetFilters = {
  type?: ProjetType
  status?: ProjetStatus
  clientId?: string
  startDateAfter?: Date
  startDateBefore?: Date
  targetDateAfter?: Date
  targetDateBefore?: Date
  estimatedBudgetMin?: number
  estimatedBudgetMax?: number
  actualBudgetMin?: number
  actualBudgetMax?: number
  search?: string
}

export type CreateProjetPayload = {
  clientId: string
  name: string
  description?: string
  type: ProjetType
  estimatedBudget?: number
  actualBudget?: number
  startDate?: Date
  targetDate?: Date
  endDate?: Date
  progress?: number
  status?: ProjetStatus
}

export type UpdateProjetPayload = Partial<Omit<CreateProjetPayload, 'clientId'>>

const PROJET_TYPE_VALUES = new Set<string>(Object.values(ProjetType))
const PROJET_STATUS_VALUES = new Set<string>(Object.values(ProjetStatus))

/**
 * Ensures a value is a valid string
 */
function ensureString(value: unknown, field: string, required = false): string | undefined {
  if (value === null || value === undefined) {
    if (required) throw new Error(`Missing field: ${field}`)
    return undefined
  }

  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Invalid string for field: ${field}`)
  }

  return value.trim()
}

/**
 * Ensures a value is a valid number
 */
function ensureNumber(value: unknown, field: string, required = false): number | undefined {
  if (value === null || value === undefined) {
    if (required) throw new Error(`Missing field: ${field}`)
    return undefined
  }

  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid number for field: ${field}`)
  }

  return parsed
}

/**
 * Ensures a value is a valid date
 */
function ensureDate(value: unknown, field: string, required = false): Date | undefined {
  if (value === null || value === undefined) {
    if (required) throw new Error(`Missing field: ${field}`)
    return undefined
  }

  const date = new Date(value as string)
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date for field: ${field}`)
  }

  return date
}

/**
 * Ensures a value is a valid enum value
 */
function ensureEnumValue<T extends string>(
  value: unknown,
  field: string,
  allowed: Set<string>,
  required = false
): T | undefined {
  if (value === null || value === undefined) {
    if (required) throw new Error(`Missing field: ${field}`)
    return undefined
  }

  if (typeof value !== 'string' || !allowed.has(value)) {
    throw new Error(`Invalid ${field}: ${value}`)
  }

  return value as T
}

/**
 * Parses and validates URLSearchParams for projet filters
 */
export function parseProjetFilters(searchParams: URLSearchParams): ProjetFilters {
  const type = ensureEnumValue<ProjetType>(
    searchParams.get('type'),
    'type',
    PROJET_TYPE_VALUES
  )
  
  const status = ensureEnumValue<ProjetStatus>(
    searchParams.get('status'),
    'status',
    PROJET_STATUS_VALUES
  )
  
  const clientId = ensureString(searchParams.get('clientId'), 'clientId')
  const search = ensureString(searchParams.get('search'), 'search')
  
  const startDateAfter = ensureDate(searchParams.get('startDateAfter'), 'startDateAfter')
  const startDateBefore = ensureDate(searchParams.get('startDateBefore'), 'startDateBefore')
  const targetDateAfter = ensureDate(searchParams.get('targetDateAfter'), 'targetDateAfter')
  const targetDateBefore = ensureDate(searchParams.get('targetDateBefore'), 'targetDateBefore')
  
  const estimatedBudgetMin = ensureNumber(searchParams.get('estimatedBudgetMin'), 'estimatedBudgetMin')
  const estimatedBudgetMax = ensureNumber(searchParams.get('estimatedBudgetMax'), 'estimatedBudgetMax')
  const actualBudgetMin = ensureNumber(searchParams.get('actualBudgetMin'), 'actualBudgetMin')
  const actualBudgetMax = ensureNumber(searchParams.get('actualBudgetMax'), 'actualBudgetMax')

  // Validate budget ranges
  if (estimatedBudgetMin !== undefined && estimatedBudgetMin < 0) {
    throw new Error('estimatedBudgetMin must be non-negative')
  }
  if (estimatedBudgetMax !== undefined && estimatedBudgetMax < 0) {
    throw new Error('estimatedBudgetMax must be non-negative')
  }
  if (actualBudgetMin !== undefined && actualBudgetMin < 0) {
    throw new Error('actualBudgetMin must be non-negative')
  }
  if (actualBudgetMax !== undefined && actualBudgetMax < 0) {
    throw new Error('actualBudgetMax must be non-negative')
  }

  // Validate date ranges
  if (startDateAfter && startDateBefore && startDateAfter > startDateBefore) {
    throw new Error('startDateAfter must be before startDateBefore')
  }
  if (targetDateAfter && targetDateBefore && targetDateAfter > targetDateBefore) {
    throw new Error('targetDateAfter must be before targetDateBefore')
  }

  return {
    type,
    status,
    clientId,
    startDateAfter,
    startDateBefore,
    targetDateAfter,
    targetDateBefore,
    estimatedBudgetMin,
    estimatedBudgetMax,
    actualBudgetMin,
    actualBudgetMax,
    search,
  }
}

/**
 * Validates and normalizes POST request body for projet creation
 */
export function normalizeProjetCreatePayload(body: unknown): CreateProjetPayload {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid payload')
  }

  const clientId = ensureString((body as any).clientId, 'clientId', true)!
  const name = ensureString((body as any).name, 'name', true)!
  const description = ensureString((body as any).description, 'description')
  
  const type = ensureEnumValue<ProjetType>(
    (body as any).type,
    'type',
    PROJET_TYPE_VALUES,
    true
  )!
  
  const status = ensureEnumValue<ProjetStatus>(
    (body as any).status,
    'status',
    PROJET_STATUS_VALUES
  )
  
  const estimatedBudget = ensureNumber((body as any).estimatedBudget, 'estimatedBudget')
  const actualBudget = ensureNumber((body as any).actualBudget, 'actualBudget')
  const progress = ensureNumber((body as any).progress, 'progress')
  
  const startDate = ensureDate((body as any).startDate, 'startDate')
  const targetDate = ensureDate((body as any).targetDate, 'targetDate')
  const endDate = ensureDate((body as any).endDate, 'endDate')

  // Validate budget values are non-negative
  if (estimatedBudget !== undefined && estimatedBudget < 0) {
    throw new Error('estimatedBudget must be non-negative')
  }
  if (actualBudget !== undefined && actualBudget < 0) {
    throw new Error('actualBudget must be non-negative')
  }

  // Validate progress is between 0 and 100
  if (progress !== undefined && (progress < 0 || progress > 100)) {
    throw new Error('progress must be between 0 and 100')
  }

  // Validate date logic
  if (startDate && targetDate && startDate > targetDate) {
    throw new Error('startDate must be before targetDate')
  }
  if (startDate && endDate && startDate > endDate) {
    throw new Error('startDate must be before endDate')
  }

  const payload: CreateProjetPayload = {
    clientId,
    name,
    type,
  }

  if (description !== undefined) payload.description = description
  if (status !== undefined) payload.status = status
  if (estimatedBudget !== undefined) payload.estimatedBudget = estimatedBudget
  if (actualBudget !== undefined) payload.actualBudget = actualBudget
  if (progress !== undefined) payload.progress = progress
  if (startDate !== undefined) payload.startDate = startDate
  if (targetDate !== undefined) payload.targetDate = targetDate
  if (endDate !== undefined) payload.endDate = endDate

  return payload
}

/**
 * Validates and normalizes PATCH request body for projet updates
 */
export function normalizeProjetUpdatePayload(body: unknown): UpdateProjetPayload {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid payload')
  }

  const update: UpdateProjetPayload = {}

  const name = ensureString((body as any).name, 'name')
  if (name !== undefined) update.name = name

  const description = ensureString((body as any).description, 'description')
  if (description !== undefined) update.description = description

  const type = ensureEnumValue<ProjetType>(
    (body as any).type,
    'type',
    PROJET_TYPE_VALUES
  )
  if (type !== undefined) update.type = type

  const status = ensureEnumValue<ProjetStatus>(
    (body as any).status,
    'status',
    PROJET_STATUS_VALUES
  )
  if (status !== undefined) update.status = status

  const estimatedBudget = ensureNumber((body as any).estimatedBudget, 'estimatedBudget')
  if (estimatedBudget !== undefined) {
    if (estimatedBudget < 0) {
      throw new Error('estimatedBudget must be non-negative')
    }
    update.estimatedBudget = estimatedBudget
  }

  const actualBudget = ensureNumber((body as any).actualBudget, 'actualBudget')
  if (actualBudget !== undefined) {
    if (actualBudget < 0) {
      throw new Error('actualBudget must be non-negative')
    }
    update.actualBudget = actualBudget
  }

  const progress = ensureNumber((body as any).progress, 'progress')
  if (progress !== undefined) {
    if (progress < 0 || progress > 100) {
      throw new Error('progress must be between 0 and 100')
    }
    update.progress = progress
  }

  const startDate = ensureDate((body as any).startDate, 'startDate')
  if (startDate !== undefined) update.startDate = startDate

  const targetDate = ensureDate((body as any).targetDate, 'targetDate')
  if (targetDate !== undefined) update.targetDate = targetDate

  const endDate = ensureDate((body as any).endDate, 'endDate')
  if (endDate !== undefined) update.endDate = endDate

  if (Object.keys(update).length === 0) {
    throw new Error('No valid fields provided for update')
  }

  return update
}
