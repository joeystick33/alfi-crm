/**
 * Validation utilities for simulations API routes
 * 
 * Provides functions to parse query parameters and normalize request payloads.
 * All functions throw descriptive errors for invalid input.
 */

import { SimulationType, SimulationStatus } from '@prisma/client'

// Helper functions for validation and type conversion

function ensureString(value: unknown, field: string, required = false): string | undefined {
  if (value === null || value === undefined || value === '') {
    if (required) {
      throw new Error(`Missing required field: ${field}`)
    }
    return undefined
  }

  if (typeof value !== 'string') {
    throw new Error(`Invalid type for field ${field}: expected string`)
  }

  return value.trim()
}

function ensureNumber(value: unknown, field: string, required = false): number | undefined {
  if (value === null || value === undefined || value === '') {
    if (required) {
      throw new Error(`Missing required field: ${field}`)
    }
    return undefined
  }

  const num = typeof value === 'string' ? parseFloat(value) : Number(value)

  if (isNaN(num)) {
    throw new Error(`Invalid number for field: ${field}`)
  }

  return num
}

function ensureDate(value: unknown, field: string, required = false): Date | undefined {
  if (value === null || value === undefined || value === '') {
    if (required) {
      throw new Error(`Missing required field: ${field}`)
    }
    return undefined
  }

  const date = new Date(value as string)

  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date for field: ${field}`)
  }

  return date
}

function ensureEnumValue<T extends string>(
  value: unknown,
  field: string,
  allowedValues: Set<string>,
  required = false
): T | undefined {
  if (value === null || value === undefined || value === '') {
    if (required) {
      throw new Error(`Missing required field: ${field}`)
    }
    return undefined
  }

  if (typeof value !== 'string') {
    throw new Error(`Invalid type for field ${field}: expected string`)
  }

  if (!allowedValues.has(value)) {
    throw new Error(`Invalid value for ${field}: ${value}. Allowed values: ${Array.from(allowedValues).join(', ')}`)
  }

  return value as T
}

function parseBoolean(param: string | null): boolean | undefined {
  if (param === null || param === undefined || param === '') {
    return undefined
  }

  if (param === 'true' || param === '1') {
    return true
  }

  if (param === 'false' || param === '0') {
    return false
  }

  return undefined
}

// Allowed enum values
const SIMULATION_TYPES = new Set<string>(Object.values(SimulationType))
const SIMULATION_STATUSES = new Set<string>(Object.values(SimulationStatus))

// Filter types
export interface SimulationFilters {
  clientId?: string
  type?: SimulationType
  status?: SimulationStatus
  search?: string
  sharedWithClient?: boolean
  createdAfter?: Date
  createdBefore?: Date
  feasibilityScoreMin?: number
  feasibilityScoreMax?: number
}

// Payload types
export interface CreateSimulationPayload {
  clientId: string
  type: SimulationType
  name: string
  description?: string
  parameters: Record<string, unknown>
  results: Record<string, unknown>
  recommendations?: Record<string, unknown>
  feasibilityScore?: number
  status?: SimulationStatus
  sharedWithClient?: boolean
}

export interface UpdateSimulationPayload {
  name?: string
  description?: string
  parameters?: Record<string, unknown>
  results?: Record<string, unknown>
  recommendations?: Record<string, unknown>
  feasibilityScore?: number
  status?: SimulationStatus
  sharedWithClient?: boolean
}

/**
 * Parse and validate simulation filters from URLSearchParams
 */
export function parseSimulationFilters(searchParams: URLSearchParams): SimulationFilters {
  const filters: SimulationFilters = {}

  // Client ID filter
  const clientId = searchParams.get('clientId')
  if (clientId) {
    filters.clientId = ensureString(clientId, 'clientId')
  }

  // Type filter
  const type = searchParams.get('type')
  if (type) {
    filters.type = ensureEnumValue<SimulationType>(type, 'type', SIMULATION_TYPES)
  }

  // Status filter
  const status = searchParams.get('status')
  if (status) {
    filters.status = ensureEnumValue<SimulationStatus>(status, 'status', SIMULATION_STATUSES)
  }

  // Search filter
  const search = searchParams.get('search')
  if (search) {
    filters.search = ensureString(search, 'search')
  }

  // Shared with client filter
  const sharedWithClient = searchParams.get('sharedWithClient')
  if (sharedWithClient) {
    filters.sharedWithClient = parseBoolean(sharedWithClient)
  }

  // Date range filters
  const createdAfter = searchParams.get('createdAfter')
  if (createdAfter) {
    filters.createdAfter = ensureDate(createdAfter, 'createdAfter')
  }

  const createdBefore = searchParams.get('createdBefore')
  if (createdBefore) {
    filters.createdBefore = ensureDate(createdBefore, 'createdBefore')
  }

  // Feasibility score range filters
  const feasibilityScoreMin = searchParams.get('feasibilityScoreMin')
  if (feasibilityScoreMin) {
    filters.feasibilityScoreMin = ensureNumber(feasibilityScoreMin, 'feasibilityScoreMin')
  }

  const feasibilityScoreMax = searchParams.get('feasibilityScoreMax')
  if (feasibilityScoreMax) {
    filters.feasibilityScoreMax = ensureNumber(feasibilityScoreMax, 'feasibilityScoreMax')
  }

  return filters
}

/**
 * Normalize and validate simulation creation payload
 */
export function normalizeSimulationCreatePayload(body: unknown): CreateSimulationPayload {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid request body')
  }

  const data = body as Record<string, unknown>

  // Required fields
  const clientId = ensureString(data.clientId, 'clientId', true)!
  const type = ensureEnumValue<SimulationType>(data.type, 'type', SIMULATION_TYPES, true)!
  const name = ensureString(data.name, 'name', true)!

  // Validate parameters and results (required JSON fields)
  if (!data.parameters || typeof data.parameters !== 'object') {
    throw new Error('Missing or invalid field: parameters (must be an object)')
  }

  if (!data.results || typeof data.results !== 'object') {
    throw new Error('Missing or invalid field: results (must be an object)')
  }

  // Optional fields
  const description = ensureString(data.description, 'description')
  const recommendations = data.recommendations !== undefined && data.recommendations !== null
    ? (typeof data.recommendations === 'object' ? data.recommendations : undefined)
    : undefined
  const feasibilityScore = ensureNumber(data.feasibilityScore, 'feasibilityScore')
  const status = ensureEnumValue<SimulationStatus>(data.status, 'status', SIMULATION_STATUSES)
  const sharedWithClient = typeof data.sharedWithClient === 'boolean' ? data.sharedWithClient : undefined

  // Validate feasibilityScore range (0-100)
  if (feasibilityScore !== undefined && (feasibilityScore < 0 || feasibilityScore > 100)) {
    throw new Error('feasibilityScore must be between 0 and 100')
  }

  return {
    clientId,
    type,
    name,
    description,
    parameters: data.parameters as Record<string, unknown>,
    results: data.results as Record<string, unknown>,
    recommendations: recommendations as Record<string, unknown> | undefined,
    feasibilityScore,
    status,
    sharedWithClient,
  }
}

/**
 * Normalize and validate simulation update payload
 */
export function normalizeSimulationUpdatePayload(body: unknown): UpdateSimulationPayload {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid request body')
  }

  const data = body as Record<string, unknown>
  const payload: UpdateSimulationPayload = {}

  // Check if at least one field is provided
  const hasFields = Object.keys(data).length > 0

  if (!hasFields) {
    throw new Error('No valid fields provided for update')
  }

  // Optional fields
  if (data.name !== undefined) {
    payload.name = ensureString(data.name, 'name')
  }

  if (data.description !== undefined) {
    payload.description = ensureString(data.description, 'description')
  }

  if (data.parameters !== undefined) {
    if (data.parameters !== null && typeof data.parameters !== 'object') {
      throw new Error('Invalid field: parameters (must be an object)')
    }
    payload.parameters = data.parameters as Record<string, unknown>
  }

  if (data.results !== undefined) {
    if (data.results !== null && typeof data.results !== 'object') {
      throw new Error('Invalid field: results (must be an object)')
    }
    payload.results = data.results as Record<string, unknown>
  }

  if (data.recommendations !== undefined) {
    if (data.recommendations !== null && typeof data.recommendations !== 'object') {
      throw new Error('Invalid field: recommendations (must be an object)')
    }
    payload.recommendations = data.recommendations as Record<string, unknown>
  }

  if (data.feasibilityScore !== undefined) {
    payload.feasibilityScore = ensureNumber(data.feasibilityScore, 'feasibilityScore')

    // Validate range
    if (payload.feasibilityScore !== undefined && (payload.feasibilityScore < 0 || payload.feasibilityScore > 100)) {
      throw new Error('feasibilityScore must be between 0 and 100')
    }
  }

  if (data.status !== undefined) {
    payload.status = ensureEnumValue<SimulationStatus>(data.status, 'status', SIMULATION_STATUSES)
  }

  if (data.sharedWithClient !== undefined) {
    if (typeof data.sharedWithClient !== 'boolean') {
      throw new Error('Invalid type for field sharedWithClient: expected boolean')
    }
    payload.sharedWithClient = data.sharedWithClient
  }

  return payload
}
