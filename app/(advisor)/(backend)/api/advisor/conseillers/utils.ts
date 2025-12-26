/**
 * Validation utilities for conseillers API routes
 * 
 * Provides Zod schemas and helper functions for validating
 * user/conseiller creation, updates, and filters.
 */

import { z } from 'zod'
import { UserRole } from '@prisma/client'

// Zod Schemas
export const createConseillerSchema = z.object({
  email: z.string().email('Email invalide').toLowerCase(),
  firstName: z.string().min(1, 'Prénom requis').max(100),
  lastName: z.string().min(1, 'Nom requis').max(100),
  phone: z.string().optional().nullable(),
  role: z.enum(['ADVISOR', 'ASSISTANT', 'MANAGER']),
  permissions: z.record(z.string(), z.boolean()).optional().nullable(),
  avatar: z.string().url().optional().nullable(),
})

export const updateConseillerSchema = z.object({
  email: z.string().email().toLowerCase().optional(),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().optional().nullable(),
  role: z.enum(['ADVISOR', 'ASSISTANT', 'MANAGER']).optional(),
  permissions: z.record(z.string(), z.boolean()).optional().nullable(),
  avatar: z.string().url().optional().nullable(),
  isActive: z.boolean().optional(),
})

export const assignmentSchema = z.object({
  assistantId: z.string().cuid(),
  permissions: z.record(z.string(), z.boolean()).optional().nullable(),
})

// Type exports
export type CreateConseillerPayload = z.infer<typeof createConseillerSchema>
export type UpdateConseillerPayload = z.infer<typeof updateConseillerSchema>
export type AssignmentPayload = z.infer<typeof assignmentSchema>

export interface ConseillerFilters {
  role?: UserRole
  isActive?: boolean
  search?: string
  limit?: number
  offset?: number
  sortBy?: 'firstName' | 'lastName' | 'email' | 'createdAt' | 'lastLoginAt'
  sortOrder?: 'asc' | 'desc'
}

/**
 * Parse and validate conseiller filters from URL search params
 */
export function parseConseillerFilters(searchParams: URLSearchParams): ConseillerFilters {
  const filters: ConseillerFilters = {}

  // Role filter
  const role = searchParams.get('role')
  if (role && ['ADVISOR', 'ASSISTANT', 'MANAGER'].includes(role)) {
    filters.role = role as UserRole
  }

  // Active filter
  const isActive = searchParams.get('isActive')
  if (isActive === 'true') {
    filters.isActive = true
  } else if (isActive === 'false') {
    filters.isActive = false
  }

  // Search filter
  const search = searchParams.get('search')
  if (search && search.trim()) {
    filters.search = search.trim()
  }

  // Pagination
  const limit = searchParams.get('limit')
  if (limit) {
    const parsed = parseInt(limit, 10)
    if (!isNaN(parsed) && parsed > 0 && parsed <= 200) {
      filters.limit = parsed
    }
  }

  const offset = searchParams.get('offset')
  if (offset) {
    const parsed = parseInt(offset, 10)
    if (!isNaN(parsed) && parsed >= 0) {
      filters.offset = parsed
    }
  }

  // Sorting
  const sortBy = searchParams.get('sortBy')
  if (sortBy && ['firstName', 'lastName', 'email', 'createdAt', 'lastLoginAt'].includes(sortBy)) {
    filters.sortBy = sortBy as ConseillerFilters['sortBy']
  }

  const sortOrder = searchParams.get('sortOrder')
  if (sortOrder && ['asc', 'desc'].includes(sortOrder)) {
    filters.sortOrder = sortOrder as 'asc' | 'desc'
  }

  return filters
}

/**
 * Normalize and validate conseiller creation payload
 */
export function normalizeConseillerCreatePayload(body: unknown): CreateConseillerPayload {
  try {
    return createConseillerSchema.parse(body)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
      throw new Error(`Validation échouée: ${messages}`)
    }
    throw error
  }
}

/**
 * Normalize and validate conseiller update payload
 */
export function normalizeConseillerUpdatePayload(body: unknown): UpdateConseillerPayload {
  try {
    return updateConseillerSchema.parse(body)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
      throw new Error(`Validation échouée: ${messages}`)
    }
    throw error
  }
}

/**
 * Normalize and validate assignment payload
 */
export function normalizeAssignmentPayload(body: unknown): AssignmentPayload {
  try {
    return assignmentSchema.parse(body)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
      throw new Error(`Validation échouée: ${messages}`)
    }
    throw error
  }
}

/**
 * Generate a temporary password for new users
 * Pattern: Uppercase + lowercase + numbers + special char (12 chars)
 */
export function generateTemporaryPassword(): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const special = '!@#$%^&*'
  
  const all = uppercase + lowercase + numbers + special
  
  let password = ''
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += special[Math.floor(Math.random() * special.length)]
  
  for (let i = 4; i < 12; i++) {
    password += all[Math.floor(Math.random() * all.length)]
  }
  
  // Shuffle
  return password.split('').sort(() => Math.random() - 0.5).join('')
}
