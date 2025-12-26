/**
 * Validation utilities for rendez-vous API routes
 * 
 * Provides functions to parse query parameters and normalize request payloads.
 * All functions throw descriptive errors for invalid input.
 */

import { RendezVousType, RendezVousStatus } from '@prisma/client'

export type RendezVousFilters = {
  type?: RendezVousType
  status?: RendezVousStatus
  conseillerId?: string
  clientId?: string
  startDate?: Date
  endDate?: Date
  search?: string
}

export type CreateRendezVousPayload = {
  type: RendezVousType
  title: string
  description?: string
  startDate: Date
  endDate: Date
  location?: string
  meetingUrl?: string
  isVirtual?: boolean
  conseillerId: string
  clientId?: string
}

export type UpdateRendezVousPayload = Partial<Omit<CreateRendezVousPayload, 'conseillerId' | 'clientId'>> & {
  status?: RendezVousStatus
  notes?: string
}

const RENDEZ_VOUS_TYPE_VALUES = new Set<string>(Object.values(RendezVousType))
const RENDEZ_VOUS_STATUS_VALUES = new Set<string>(Object.values(RendezVousStatus))

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
 * Ensures a value is a valid boolean
 */
function ensureBoolean(value: unknown, field: string, required = false): boolean | undefined {
  if (value === null || value === undefined) {
    if (required) throw new Error(`Missing field: ${field}`)
    return undefined
  }

  if (typeof value === 'boolean') {
    return value
  }

  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') return true
    if (value.toLowerCase() === 'false') return false
  }

  throw new Error(`Invalid boolean for field: ${field}`)
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
 * Parses and validates URLSearchParams for rendez-vous filters
 */
export function parseRendezVousFilters(searchParams: URLSearchParams): RendezVousFilters {
  const type = ensureEnumValue<RendezVousType>(
    searchParams.get('type'),
    'type',
    RENDEZ_VOUS_TYPE_VALUES
  )
  
  const status = ensureEnumValue<RendezVousStatus>(
    searchParams.get('status'),
    'status',
    RENDEZ_VOUS_STATUS_VALUES
  )
  
  const conseillerId = ensureString(searchParams.get('conseillerId'), 'conseillerId')
  const clientId = ensureString(searchParams.get('clientId'), 'clientId')
  const search = ensureString(searchParams.get('search'), 'search')
  
  const startDate = ensureDate(searchParams.get('startDate'), 'startDate')
  const endDate = ensureDate(searchParams.get('endDate'), 'endDate')

  // Validate date range
  if (startDate && endDate && startDate > endDate) {
    throw new Error('startDate must be before endDate')
  }

  return {
    type,
    status,
    conseillerId,
    clientId,
    startDate,
    endDate,
    search,
  }
}

/**
 * Validates and normalizes POST request body for rendez-vous creation
 */
export function normalizeRendezVousCreatePayload(body: unknown): CreateRendezVousPayload {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid payload')
  }

  const data = body as Record<string, unknown>
  const type = ensureEnumValue<RendezVousType>(
    data.type,
    'type',
    RENDEZ_VOUS_TYPE_VALUES,
    true
  )!
  
  const title = ensureString(data.title, 'title', true)!
  const description = ensureString(data.description, 'description')
  
  const startDate = ensureDate(data.startDate, 'startDate', true)!
  const endDate = ensureDate(data.endDate, 'endDate', true)!
  
  const location = ensureString(data.location, 'location')
  const meetingUrl = ensureString(data.meetingUrl, 'meetingUrl')
  const isVirtual = ensureBoolean(data.isVirtual, 'isVirtual')
  
  const conseillerId = ensureString(data.conseillerId, 'conseillerId', true)!
  const clientId = ensureString(data.clientId, 'clientId')

  // Validate date logic
  if (startDate >= endDate) {
    throw new Error('startDate must be before endDate')
  }

  // Validate that virtual meetings have a meeting URL
  if (isVirtual && !meetingUrl) {
    throw new Error('meetingUrl is required for virtual meetings')
  }

  const payload: CreateRendezVousPayload = {
    type,
    title,
    startDate,
    endDate,
    conseillerId,
  }

  if (description !== undefined) payload.description = description
  if (location !== undefined) payload.location = location
  if (meetingUrl !== undefined) payload.meetingUrl = meetingUrl
  if (isVirtual !== undefined) payload.isVirtual = isVirtual
  if (clientId !== undefined) payload.clientId = clientId

  return payload
}

/**
 * Validates and normalizes PATCH request body for rendez-vous updates
 */
export function normalizeRendezVousUpdatePayload(body: unknown): UpdateRendezVousPayload {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid payload')
  }

  const data = body as Record<string, unknown>
  const update: UpdateRendezVousPayload = {}

  const title = ensureString(data.title, 'title')
  if (title !== undefined) update.title = title

  const description = ensureString(data.description, 'description')
  if (description !== undefined) update.description = description

  const type = ensureEnumValue<RendezVousType>(
    data.type,
    'type',
    RENDEZ_VOUS_TYPE_VALUES
  )
  if (type !== undefined) update.type = type

  const status = ensureEnumValue<RendezVousStatus>(
    data.status,
    'status',
    RENDEZ_VOUS_STATUS_VALUES
  )
  if (status !== undefined) update.status = status

  const startDate = ensureDate(data.startDate, 'startDate')
  if (startDate !== undefined) update.startDate = startDate

  const endDate = ensureDate(data.endDate, 'endDate')
  if (endDate !== undefined) update.endDate = endDate

  const location = ensureString(data.location, 'location')
  if (location !== undefined) update.location = location

  const meetingUrl = ensureString(data.meetingUrl, 'meetingUrl')
  if (meetingUrl !== undefined) update.meetingUrl = meetingUrl

  const isVirtual = ensureBoolean(data.isVirtual, 'isVirtual')
  if (isVirtual !== undefined) update.isVirtual = isVirtual

  const notes = ensureString(data.notes, 'notes')
  if (notes !== undefined) update.notes = notes

  // Validate date logic if both dates are provided
  if (update.startDate && update.endDate && update.startDate >= update.endDate) {
    throw new Error('startDate must be before endDate')
  }

  // Validate that virtual meetings have a meeting URL
  if (update.isVirtual && !update.meetingUrl && !data.meetingUrl) {
    throw new Error('meetingUrl is required for virtual meetings')
  }

  if (Object.keys(update).length === 0) {
    throw new Error('No valid fields provided for update')
  }

  return update
}
