/**
 * Validation utilities for notifications API routes
 * 
 * Provides functions to parse query parameters and normalize request payloads.
 * All functions throw descriptive errors for invalid input.
 */

import { NotificationType } from '@prisma/client'

export type NotificationFilters = {
  type?: NotificationType
  isRead?: boolean
  userId?: string
  clientId?: string
  createdAfter?: Date
  createdBefore?: Date
  limit?: number
  offset?: number
}

export type CreateNotificationPayload = {
  userId?: string
  clientId?: string
  type: NotificationType
  title: string
  message: string
  actionUrl?: string
}

export type UpdateNotificationPayload = {
  isRead?: boolean
  readAt?: Date
}

export type BulkUpdateNotificationPayload = {
  notificationIds: string[]
  isRead: boolean
}

const NOTIFICATION_TYPE_VALUES = new Set<string>(Object.values(NotificationType))

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
 * Parses boolean from string parameter
 */
function parseBoolean(param: string | null): boolean | undefined {
  if (param === null) return undefined
  if (param === 'true') return true
  if (param === 'false') return false
  return undefined
}

/**
 * Parses and validates URLSearchParams for notification filters
 */
export function parseNotificationFilters(searchParams: URLSearchParams): NotificationFilters {
  const type = ensureEnumValue<NotificationType>(
    searchParams.get('type'),
    'type',
    NOTIFICATION_TYPE_VALUES
  )
  
  const userId = ensureString(searchParams.get('userId'), 'userId')
  const clientId = ensureString(searchParams.get('clientId'), 'clientId')
  
  const isRead = parseBoolean(searchParams.get('isRead'))
  
  const createdAfter = ensureDate(searchParams.get('createdAfter'), 'createdAfter')
  const createdBefore = ensureDate(searchParams.get('createdBefore'), 'createdBefore')
  
  const limit = ensureNumber(searchParams.get('limit'), 'limit')
  const offset = ensureNumber(searchParams.get('offset'), 'offset')
  
  // Validate limit and offset are positive
  if (limit !== undefined && limit < 0) {
    throw new Error('limit must be a positive number')
  }
  if (offset !== undefined && offset < 0) {
    throw new Error('offset must be a positive number')
  }

  return {
    type,
    userId,
    clientId,
    isRead,
    createdAfter,
    createdBefore,
    limit,
    offset,
  }
}

/**
 * Validates and normalizes POST request body for notification creation
 */
export function normalizeNotificationCreatePayload(body: unknown): CreateNotificationPayload {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid payload')
  }

  const data = body as Record<string, unknown>

  const type = ensureEnumValue<NotificationType>(
    data.type,
    'type',
    NOTIFICATION_TYPE_VALUES,
    true
  )!
  
  const title = ensureString(data.title, 'title', true)!
  const message = ensureString(data.message, 'message', true)!
  
  const userId = ensureString(data.userId, 'userId')
  const clientId = ensureString(data.clientId, 'clientId')
  const actionUrl = ensureString(data.actionUrl, 'actionUrl')

  const payload: CreateNotificationPayload = {
    type,
    title,
    message,
  }

  if (userId !== undefined) payload.userId = userId
  if (clientId !== undefined) payload.clientId = clientId
  if (actionUrl !== undefined) payload.actionUrl = actionUrl

  return payload
}

/**
 * Validates and normalizes PATCH request body for notification updates
 */
export function normalizeNotificationUpdatePayload(body: unknown): UpdateNotificationPayload {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid payload')
  }

  const data = body as Record<string, unknown>
  const update: UpdateNotificationPayload = {}

  if (data.isRead !== undefined) {
    update.isRead = Boolean(data.isRead)
    
    // If marking as read, set readAt to now
    if (update.isRead) {
      update.readAt = new Date()
    }
  }

  if (Object.keys(update).length === 0) {
    throw new Error('No valid fields provided for update')
  }

  return update
}

/**
 * Validates and normalizes bulk update request body
 */
export function normalizeBulkUpdatePayload(body: unknown): BulkUpdateNotificationPayload {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid payload')
  }

  const data = body as Record<string, unknown>

  const notificationIds = data.notificationIds
  if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
    throw new Error('notificationIds must be a non-empty array')
  }

  // Validate all IDs are strings
  for (const id of notificationIds) {
    if (typeof id !== 'string' || !id.trim()) {
      throw new Error('All notificationIds must be valid strings')
    }
  }

  const isRead = data.isRead
  if (typeof isRead !== 'boolean') {
    throw new Error('isRead must be a boolean')
  }

  return {
    notificationIds,
    isRead,
  }
}
