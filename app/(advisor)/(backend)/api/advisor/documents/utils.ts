 
/**
 * Validation utilities for documents API routes
 * 
 * Provides functions to parse query parameters and normalize request payloads.
 * All functions throw descriptive errors for invalid input.
 */

import { DocumentType, DocumentCategory, SignatureStatus } from '@prisma/client'

export type DocumentFilters = {
  type?: DocumentType
  category?: DocumentCategory
  clientId?: string
  projetId?: string
  tacheId?: string
  uploadedBy?: string
  signatureStatus?: SignatureStatus
  uploadedAfter?: Date
  uploadedBefore?: Date
  search?: string
  isConfidential?: boolean
}

export type CreateDocumentPayload = {
  name: string
  description?: string
  fileUrl: string
  fileSize: number
  mimeType: string
  type: DocumentType
  category?: DocumentCategory
  tags?: string[]
  isConfidential?: boolean
  accessLevel?: string
  signatureStatus?: SignatureStatus
  clientId?: string
  projetId?: string
  tacheId?: string
  // Métadonnées de stockage (facultatives)
  storageProvider?: string
  storageBucket?: string | null
  storageKey?: string | null
  storageRegion?: string | null
  checksum?: string | null
  metadata?: any
}

export type UpdateDocumentPayload = Partial<CreateDocumentPayload> & {
  signatureProvider?: string
  signedAt?: Date
  signedBy?: any
}

const DOCUMENT_TYPE_VALUES = new Set<string>(Object.values(DocumentType))
const DOCUMENT_CATEGORY_VALUES = new Set<string>(Object.values(DocumentCategory))
const SIGNATURE_STATUS_VALUES = new Set<string>(Object.values(SignatureStatus))

interface RawDocumentPayload {
  name?: string
  description?: string
  fileUrl?: string
  fileSize?: number
  mimeType?: string
  type?: string
  category?: string
  tags?: string[]
  isConfidential?: boolean
  accessLevel?: string
  signatureStatus?: string
  clientId?: string
  projetId?: string
  tacheId?: string
  storageProvider?: string
  storageBucket?: string
  storageKey?: string
  storageRegion?: string
  checksum?: string
  metadata?: any
  signatureProvider?: string
  signedAt?: Date | string
  signedBy?: any
}

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
 * Parses and validates URLSearchParams for document filters
 */
export function parseDocumentFilters(searchParams: URLSearchParams): DocumentFilters {
  const type = ensureEnumValue<DocumentType>(
    searchParams.get('type'),
    'type',
    DOCUMENT_TYPE_VALUES
  )
  
  const category = ensureEnumValue<DocumentCategory>(
    searchParams.get('category'),
    'category',
    DOCUMENT_CATEGORY_VALUES
  )
  
  const signatureStatus = ensureEnumValue<SignatureStatus>(
    searchParams.get('signatureStatus'),
    'signatureStatus',
    SIGNATURE_STATUS_VALUES
  )
  
  const clientId = ensureString(searchParams.get('clientId'), 'clientId')
  const projetId = ensureString(searchParams.get('projetId'), 'projetId')
  const tacheId = ensureString(searchParams.get('tacheId'), 'tacheId')
  const uploadedBy = ensureString(searchParams.get('uploadedBy'), 'uploadedBy')
  const search = ensureString(searchParams.get('search'), 'search')
  
  const uploadedAfter = ensureDate(searchParams.get('uploadedAfter'), 'uploadedAfter')
  const uploadedBefore = ensureDate(searchParams.get('uploadedBefore'), 'uploadedBefore')
  
  const isConfidential = parseBoolean(searchParams.get('isConfidential'))

  return {
    type,
    category,
    clientId,
    projetId,
    tacheId,
    uploadedBy,
    signatureStatus,
    uploadedAfter,
    uploadedBefore,
    search,
    isConfidential,
  }
}

/**
 * Validates and normalizes POST request body for document creation
 */
export function normalizeDocumentCreatePayload(body: unknown): CreateDocumentPayload {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid payload')
  }

  const data = body as RawDocumentPayload

  const name = ensureString(data.name, 'name', true)!
  const description = ensureString(data.description, 'description')
  const fileUrl = ensureString(data.fileUrl, 'fileUrl', true)!
  const fileSize = ensureNumber(data.fileSize, 'fileSize', true)!
  const mimeType = ensureString(data.mimeType, 'mimeType', true)!
  
  const type = ensureEnumValue<DocumentType>(
    data.type,
    'type',
    DOCUMENT_TYPE_VALUES,
    true
  )!
  
  const category = ensureEnumValue<DocumentCategory>(
    data.category,
    'category',
    DOCUMENT_CATEGORY_VALUES
  )
  
  const signatureStatus = ensureEnumValue<SignatureStatus>(
    data.signatureStatus,
    'signatureStatus',
    SIGNATURE_STATUS_VALUES
  )
  
  const accessLevel = ensureString(data.accessLevel, 'accessLevel')
  const clientId = ensureString(data.clientId, 'clientId')
  const projetId = ensureString(data.projetId, 'projetId')
  const tacheId = ensureString(data.tacheId, 'tacheId')

  // Validate fileSize is positive
  if (fileSize < 0) {
    throw new Error('fileSize must be a positive number')
  }

  const payload: CreateDocumentPayload = {
    name,
    fileUrl,
    fileSize,
    mimeType,
    type,
  }

  if (description !== undefined) payload.description = description
  if (category !== undefined) payload.category = category
  if (signatureStatus !== undefined) payload.signatureStatus = signatureStatus
  if (accessLevel !== undefined) payload.accessLevel = accessLevel
  if (clientId !== undefined) payload.clientId = clientId
  if (projetId !== undefined) payload.projetId = projetId
  if (tacheId !== undefined) payload.tacheId = tacheId

  if (data.tags !== undefined) {
    if (Array.isArray(data.tags)) {
      payload.tags = data.tags
    }
  }

  if (data.isConfidential !== undefined) {
    payload.isConfidential = Boolean(data.isConfidential)
  }

  // Métadonnées de stockage (facultatives et sans validation forte pour laisser la flexibilité au StorageService)
  if (data.storageProvider !== undefined) {
    payload.storageProvider = String(data.storageProvider)
  }
  if (data.storageBucket !== undefined) {
    payload.storageBucket = data.storageBucket ?? null
  }
  if (data.storageKey !== undefined) {
    payload.storageKey = data.storageKey ?? null
  }
  if (data.storageRegion !== undefined) {
    payload.storageRegion = data.storageRegion ?? null
  }
  if (data.checksum !== undefined) {
    payload.checksum = data.checksum ?? null
  }
  if (data.metadata !== undefined) {
    payload.metadata = data.metadata
  }

  return payload
}

/**
 * Validates and normalizes PATCH request body for document updates
 */
export function normalizeDocumentUpdatePayload(body: unknown): UpdateDocumentPayload {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid payload')
  }

  const data = body as RawDocumentPayload
  const update: UpdateDocumentPayload = {}

  const name = ensureString(data.name, 'name')
  if (name !== undefined) update.name = name

  const description = ensureString(data.description, 'description')
  if (description !== undefined) update.description = description

  const fileUrl = ensureString(data.fileUrl, 'fileUrl')
  if (fileUrl !== undefined) update.fileUrl = fileUrl

  const fileSize = ensureNumber(data.fileSize, 'fileSize')
  if (fileSize !== undefined) {
    if (fileSize < 0) {
      throw new Error('fileSize must be a positive number')
    }
    update.fileSize = fileSize
  }

  const mimeType = ensureString(data.mimeType, 'mimeType')
  if (mimeType !== undefined) update.mimeType = mimeType

  const type = ensureEnumValue<DocumentType>(
    data.type,
    'type',
    DOCUMENT_TYPE_VALUES
  )
  if (type !== undefined) update.type = type

  const category = ensureEnumValue<DocumentCategory>(
    data.category,
    'category',
    DOCUMENT_CATEGORY_VALUES
  )
  if (category !== undefined) update.category = category

  const signatureStatus = ensureEnumValue<SignatureStatus>(
    data.signatureStatus,
    'signatureStatus',
    SIGNATURE_STATUS_VALUES
  )
  if (signatureStatus !== undefined) update.signatureStatus = signatureStatus

  const accessLevel = ensureString(data.accessLevel, 'accessLevel')
  if (accessLevel !== undefined) update.accessLevel = accessLevel

  const signatureProvider = ensureString(data.signatureProvider, 'signatureProvider')
  if (signatureProvider !== undefined) update.signatureProvider = signatureProvider

  const signedAt = ensureDate(data.signedAt, 'signedAt')
  if (signedAt !== undefined) update.signedAt = signedAt

  if (data.signedBy !== undefined) {
    update.signedBy = data.signedBy
  }

  if (data.tags !== undefined) {
    if (Array.isArray(data.tags)) {
      update.tags = data.tags
    }
  }

  if (data.isConfidential !== undefined) {
    update.isConfidential = Boolean(data.isConfidential)
  }

  if (Object.keys(update).length === 0) {
    throw new Error('No valid fields provided for update')
  }

  return update
}
