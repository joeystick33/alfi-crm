/**
 * Validation utilities for opportunites API routes
 * 
 * Provides functions to parse query parameters and normalize request payloads.
 * All functions throw descriptive errors for invalid input.
 */

import { OpportuniteType, OpportuniteStatus, OpportunitePriority } from '@prisma/client'

export type OpportuniteFilters = {
  type?: OpportuniteType
  status?: OpportuniteStatus
  priority?: OpportunitePriority
  clientId?: string
  conseillerId?: string
  detectedAfter?: Date
  detectedBefore?: Date
  expectedCloseDateAfter?: Date
  expectedCloseDateBefore?: Date
  minEstimatedValue?: number
  maxEstimatedValue?: number
  minProbability?: number
  maxProbability?: number
  search?: string
}

export type CreateOpportunitePayload = {
  clientId: string
  conseillerId: string
  type: OpportuniteType
  name: string
  description?: string
  estimatedValue?: number
  probability?: number
  priority?: OpportunitePriority
  status?: OpportuniteStatus
  expectedCloseDate?: Date
  notes?: string
}

export type UpdateOpportunitePayload = Partial<Omit<CreateOpportunitePayload, 'clientId' | 'conseillerId'>> & {
  convertedToProjetId?: string
  rejectionReason?: string
}

const OPPORTUNITE_TYPE_VALUES = new Set<string>(Object.values(OpportuniteType))
const OPPORTUNITE_STATUS_VALUES = new Set<string>(Object.values(OpportuniteStatus))
const OPPORTUNITE_PRIORITY_VALUES = new Set<string>(Object.values(OpportunitePriority))

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
 * Parses and validates URLSearchParams for opportunite filters
 */
export function parseOpportuniteFilters(searchParams: URLSearchParams): OpportuniteFilters {
  const type = ensureEnumValue<OpportuniteType>(
    searchParams.get('type'),
    'type',
    OPPORTUNITE_TYPE_VALUES
  )
  
  const status = ensureEnumValue<OpportuniteStatus>(
    searchParams.get('status'),
    'status',
    OPPORTUNITE_STATUS_VALUES
  )
  
  const priority = ensureEnumValue<OpportunitePriority>(
    searchParams.get('priority'),
    'priority',
    OPPORTUNITE_PRIORITY_VALUES
  )
  
  const clientId = ensureString(searchParams.get('clientId'), 'clientId')
  const conseillerId = ensureString(searchParams.get('conseillerId'), 'conseillerId')
  const search = ensureString(searchParams.get('search'), 'search')
  
  const detectedAfter = ensureDate(searchParams.get('detectedAfter'), 'detectedAfter')
  const detectedBefore = ensureDate(searchParams.get('detectedBefore'), 'detectedBefore')
  const expectedCloseDateAfter = ensureDate(searchParams.get('expectedCloseDateAfter'), 'expectedCloseDateAfter')
  const expectedCloseDateBefore = ensureDate(searchParams.get('expectedCloseDateBefore'), 'expectedCloseDateBefore')
  
  const minEstimatedValue = ensureNumber(searchParams.get('minEstimatedValue'), 'minEstimatedValue')
  const maxEstimatedValue = ensureNumber(searchParams.get('maxEstimatedValue'), 'maxEstimatedValue')
  const minProbability = ensureNumber(searchParams.get('minProbability'), 'minProbability')
  const maxProbability = ensureNumber(searchParams.get('maxProbability'), 'maxProbability')

  // Validate value ranges
  if (minEstimatedValue !== undefined && minEstimatedValue < 0) {
    throw new Error('minEstimatedValue must be non-negative')
  }
  if (maxEstimatedValue !== undefined && maxEstimatedValue < 0) {
    throw new Error('maxEstimatedValue must be non-negative')
  }

  // Validate probability ranges (0-100)
  if (minProbability !== undefined && (minProbability < 0 || minProbability > 100)) {
    throw new Error('minProbability must be between 0 and 100')
  }
  if (maxProbability !== undefined && (maxProbability < 0 || maxProbability > 100)) {
    throw new Error('maxProbability must be between 0 and 100')
  }

  // Validate date ranges
  if (detectedAfter && detectedBefore && detectedAfter > detectedBefore) {
    throw new Error('detectedAfter must be before detectedBefore')
  }
  if (expectedCloseDateAfter && expectedCloseDateBefore && expectedCloseDateAfter > expectedCloseDateBefore) {
    throw new Error('expectedCloseDateAfter must be before expectedCloseDateBefore')
  }

  return {
    type,
    status,
    priority,
    clientId,
    conseillerId,
    detectedAfter,
    detectedBefore,
    expectedCloseDateAfter,
    expectedCloseDateBefore,
    minEstimatedValue,
    maxEstimatedValue,
    minProbability,
    maxProbability,
    search,
  }
}

/**
 * Validates and normalizes POST request body for opportunite creation
 */
export function normalizeOpportuniteCreatePayload(body: unknown): CreateOpportunitePayload {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid payload')
  }

  const clientId = ensureString((body as any).clientId, 'clientId', true)!
  const conseillerId = ensureString((body as any).conseillerId, 'conseillerId', true)!
  const name = ensureString((body as any).name, 'name', true)!
  const description = ensureString((body as any).description, 'description')
  const notes = ensureString((body as any).notes, 'notes')
  
  const type = ensureEnumValue<OpportuniteType>(
    (body as any).type,
    'type',
    OPPORTUNITE_TYPE_VALUES,
    true
  )!
  
  const status = ensureEnumValue<OpportuniteStatus>(
    (body as any).status,
    'status',
    OPPORTUNITE_STATUS_VALUES
  )
  
  const priority = ensureEnumValue<OpportunitePriority>(
    (body as any).priority,
    'priority',
    OPPORTUNITE_PRIORITY_VALUES
  )
  
  const estimatedValue = ensureNumber((body as any).estimatedValue, 'estimatedValue')
  const probability = ensureNumber((body as any).probability, 'probability')
  
  const expectedCloseDate = ensureDate((body as any).expectedCloseDate, 'expectedCloseDate')

  // Validate estimatedValue is non-negative
  if (estimatedValue !== undefined && estimatedValue < 0) {
    throw new Error('estimatedValue must be non-negative')
  }

  // Validate probability is between 0 and 100
  if (probability !== undefined && (probability < 0 || probability > 100)) {
    throw new Error('probability must be between 0 and 100')
  }

  const payload: CreateOpportunitePayload = {
    clientId,
    conseillerId,
    name,
    type,
  }

  if (description !== undefined) payload.description = description
  if (notes !== undefined) payload.notes = notes
  if (status !== undefined) payload.status = status
  if (priority !== undefined) payload.priority = priority
  if (estimatedValue !== undefined) payload.estimatedValue = estimatedValue
  if (probability !== undefined) payload.probability = probability
  if (expectedCloseDate !== undefined) payload.expectedCloseDate = expectedCloseDate

  return payload
}

/**
 * Validates and normalizes PATCH request body for opportunite updates
 */
export function normalizeOpportuniteUpdatePayload(body: unknown): UpdateOpportunitePayload {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid payload')
  }

  const update: UpdateOpportunitePayload = {}

  const name = ensureString((body as any).name, 'name')
  if (name !== undefined) update.name = name

  const description = ensureString((body as any).description, 'description')
  if (description !== undefined) update.description = description

  const notes = ensureString((body as any).notes, 'notes')
  if (notes !== undefined) update.notes = notes

  const rejectionReason = ensureString((body as any).rejectionReason, 'rejectionReason')
  if (rejectionReason !== undefined) update.rejectionReason = rejectionReason

  const convertedToProjetId = ensureString((body as any).convertedToProjetId, 'convertedToProjetId')
  if (convertedToProjetId !== undefined) update.convertedToProjetId = convertedToProjetId

  const type = ensureEnumValue<OpportuniteType>(
    (body as any).type,
    'type',
    OPPORTUNITE_TYPE_VALUES
  )
  if (type !== undefined) update.type = type

  const status = ensureEnumValue<OpportuniteStatus>(
    (body as any).status,
    'status',
    OPPORTUNITE_STATUS_VALUES
  )
  if (status !== undefined) update.status = status

  const priority = ensureEnumValue<OpportunitePriority>(
    (body as any).priority,
    'priority',
    OPPORTUNITE_PRIORITY_VALUES
  )
  if (priority !== undefined) update.priority = priority

  const estimatedValue = ensureNumber((body as any).estimatedValue, 'estimatedValue')
  if (estimatedValue !== undefined) {
    if (estimatedValue < 0) {
      throw new Error('estimatedValue must be non-negative')
    }
    update.estimatedValue = estimatedValue
  }

  const probability = ensureNumber((body as any).probability, 'probability')
  if (probability !== undefined) {
    if (probability < 0 || probability > 100) {
      throw new Error('probability must be between 0 and 100')
    }
    update.probability = probability
  }

  const expectedCloseDate = ensureDate((body as any).expectedCloseDate, 'expectedCloseDate')
  if (expectedCloseDate !== undefined) update.expectedCloseDate = expectedCloseDate

  if (Object.keys(update).length === 0) {
    throw new Error('No valid fields provided for update')
  }

  return update
}
