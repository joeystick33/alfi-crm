/**
 * Validation utilities for objectifs API routes
 * 
 * Provides functions to parse query parameters and normalize request payloads.
 * All functions throw descriptive errors for invalid input.
 */

import { ObjectifType, ObjectifStatus, ObjectifPriority } from '@prisma/client'

export type ObjectifFilters = {
  type?: ObjectifType
  status?: ObjectifStatus
  priority?: ObjectifPriority
  clientId?: string
  targetDateAfter?: Date
  targetDateBefore?: Date
  targetAmountMin?: number
  targetAmountMax?: number
  search?: string
}

export type CreateObjectifPayload = {
  clientId: string
  type: ObjectifType
  name: string
  description?: string
  targetAmount: number
  currentAmount?: number
  targetDate: Date
  priority?: ObjectifPriority
  monthlyContribution?: number
}

export type UpdateObjectifPayload = Partial<Omit<CreateObjectifPayload, 'clientId'>> & {
  status?: ObjectifStatus
}

const OBJECTIF_TYPE_VALUES = new Set<string>(Object.values(ObjectifType))
const OBJECTIF_STATUS_VALUES = new Set<string>(Object.values(ObjectifStatus))
const OBJECTIF_PRIORITY_VALUES = new Set<string>(Object.values(ObjectifPriority))

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
 * Parses and validates URLSearchParams for objectif filters
 */
export function parseObjectifFilters(searchParams: URLSearchParams): ObjectifFilters {
  const type = ensureEnumValue<ObjectifType>(
    searchParams.get('type'),
    'type',
    OBJECTIF_TYPE_VALUES
  )
  
  const status = ensureEnumValue<ObjectifStatus>(
    searchParams.get('status'),
    'status',
    OBJECTIF_STATUS_VALUES
  )
  
  const priority = ensureEnumValue<ObjectifPriority>(
    searchParams.get('priority'),
    'priority',
    OBJECTIF_PRIORITY_VALUES
  )
  
  const clientId = ensureString(searchParams.get('clientId'), 'clientId')
  const search = ensureString(searchParams.get('search'), 'search')
  
  const targetDateAfter = ensureDate(searchParams.get('targetDateAfter'), 'targetDateAfter')
  const targetDateBefore = ensureDate(searchParams.get('targetDateBefore'), 'targetDateBefore')
  
  const targetAmountMin = ensureNumber(searchParams.get('targetAmountMin'), 'targetAmountMin')
  const targetAmountMax = ensureNumber(searchParams.get('targetAmountMax'), 'targetAmountMax')

  // Validate amount ranges
  if (targetAmountMin !== undefined && targetAmountMin < 0) {
    throw new Error('targetAmountMin must be non-negative')
  }
  if (targetAmountMax !== undefined && targetAmountMax < 0) {
    throw new Error('targetAmountMax must be non-negative')
  }

  // Validate date ranges
  if (targetDateAfter && targetDateBefore && targetDateAfter > targetDateBefore) {
    throw new Error('targetDateAfter must be before targetDateBefore')
  }

  return {
    type,
    status,
    priority,
    clientId,
    targetDateAfter,
    targetDateBefore,
    targetAmountMin,
    targetAmountMax,
    search,
  }
}

/**
 * Validates and normalizes POST request body for objectif creation
 */
export function normalizeObjectifCreatePayload(body: unknown): CreateObjectifPayload {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid payload')
  }

  const data = body as Record<string, unknown>
  const clientId = ensureString(data.clientId, 'clientId', true)!
  const name = ensureString(data.name, 'name', true)!
  const description = ensureString(data.description, 'description')
  
  const type = ensureEnumValue<ObjectifType>(
    data.type,
    'type',
    OBJECTIF_TYPE_VALUES,
    true
  )!
  
  const priority = ensureEnumValue<ObjectifPriority>(
    data.priority,
    'priority',
    OBJECTIF_PRIORITY_VALUES
  )
  
  const targetAmount = ensureNumber(data.targetAmount, 'targetAmount', true)!
  const currentAmount = ensureNumber(data.currentAmount, 'currentAmount')
  const monthlyContribution = ensureNumber(data.monthlyContribution, 'monthlyContribution')
  
  const targetDate = ensureDate(data.targetDate, 'targetDate', true)!

  // Validate amount values are non-negative
  if (targetAmount < 0) {
    throw new Error('targetAmount must be non-negative')
  }
  if (currentAmount !== undefined && currentAmount < 0) {
    throw new Error('currentAmount must be non-negative')
  }
  if (monthlyContribution !== undefined && monthlyContribution < 0) {
    throw new Error('monthlyContribution must be non-negative')
  }

  // Validate targetDate is in the future
  const now = new Date()
  if (targetDate <= now) {
    throw new Error('targetDate must be in the future')
  }

  const payload: CreateObjectifPayload = {
    clientId,
    name,
    type,
    targetAmount,
    targetDate,
  }

  if (description !== undefined) payload.description = description
  if (priority !== undefined) payload.priority = priority
  if (currentAmount !== undefined) payload.currentAmount = currentAmount
  if (monthlyContribution !== undefined) payload.monthlyContribution = monthlyContribution

  return payload
}

/**
 * Validates and normalizes PATCH request body for objectif updates
 */
export function normalizeObjectifUpdatePayload(body: unknown): UpdateObjectifPayload {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid payload')
  }

  const data = body as Record<string, unknown>
  const update: UpdateObjectifPayload = {}

  const name = ensureString(data.name, 'name')
  if (name !== undefined) update.name = name

  const description = ensureString(data.description, 'description')
  if (description !== undefined) update.description = description

  const type = ensureEnumValue<ObjectifType>(
    data.type,
    'type',
    OBJECTIF_TYPE_VALUES
  )
  if (type !== undefined) update.type = type

  const status = ensureEnumValue<ObjectifStatus>(
    data.status,
    'status',
    OBJECTIF_STATUS_VALUES
  )
  if (status !== undefined) update.status = status

  const priority = ensureEnumValue<ObjectifPriority>(
    data.priority,
    'priority',
    OBJECTIF_PRIORITY_VALUES
  )
  if (priority !== undefined) update.priority = priority

  const targetAmount = ensureNumber(data.targetAmount, 'targetAmount')
  if (targetAmount !== undefined) {
    if (targetAmount < 0) {
      throw new Error('targetAmount must be non-negative')
    }
    update.targetAmount = targetAmount
  }

  const currentAmount = ensureNumber(data.currentAmount, 'currentAmount')
  if (currentAmount !== undefined) {
    if (currentAmount < 0) {
      throw new Error('currentAmount must be non-negative')
    }
    update.currentAmount = currentAmount
  }

  const monthlyContribution = ensureNumber(data.monthlyContribution, 'monthlyContribution')
  if (monthlyContribution !== undefined) {
    if (monthlyContribution < 0) {
      throw new Error('monthlyContribution must be non-negative')
    }
    update.monthlyContribution = monthlyContribution
  }

  const targetDate = ensureDate(data.targetDate, 'targetDate')
  if (targetDate !== undefined) update.targetDate = targetDate

  if (Object.keys(update).length === 0) {
    throw new Error('No valid fields provided for update')
  }

  return update
}
