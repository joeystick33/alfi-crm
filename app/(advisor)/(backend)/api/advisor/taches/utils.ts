import { TachePriority, TacheStatus, TacheType } from '@prisma/client'

export type TacheFilters = {
  assignedToId?: string
  clientId?: string
  projetId?: string
  type?: TacheType
  status?: TacheStatus
  statusIn?: TacheStatus[]
  priority?: TachePriority
  dueBefore?: Date
  search?: string
  limit?: number
  sort?: string[]
}

export type CreateTachePayload = {
  type: TacheType
  title: string
  description?: string
  assignedToId: string
  clientId?: string
  projetId?: string
  dueDate?: Date
  priority: TachePriority
  reminderDate?: Date
}

export type UpdateTachePayload = Partial<CreateTachePayload> & {
  status?: TacheStatus
}

const TACHE_TYPE_VALUES = new Set<string>(Object.values(TacheType))
const TACHE_STATUS_VALUES = new Set<string>(Object.values(TacheStatus))
const TACHE_PRIORITY_VALUES = new Set<string>(Object.values(TachePriority))

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

function ensureEnumValue<T extends string>(
  value: unknown,
  field: string,
  allowed: Set<string>,
  required = false
): T | undefined {
  if (value === null || value === undefined || value === '') {
    if (required) throw new Error(`Missing field: ${field}`)
    return undefined
  }

  if (typeof value !== 'string') {
    throw new Error(`Invalid value for field: ${field}`)
  }

  // Handle multiple comma-separated values
  if (value.includes(',')) {
    const values = value.split(',').map(v => v.trim())
    for (const v of values) {
      if (!allowed.has(v)) {
        throw new Error(`Invalid value "${v}" for field: ${field}`)
      }
    }
    // We can't return a single T here, so we throw if it's called for a single enum expectation
    // But we will handle this in parseTacheFilters
    throw new Error(`${field} contains multiple values, but only one was expected`)
  }

  if (!allowed.has(value)) {
    throw new Error(`Invalid value "${value}" for field: ${field}`)
  }

  return value as T
}

function ensureEnumValues<T extends string>(
  value: unknown,
  allowed: Set<string>
): T[] | undefined {
  if (typeof value !== 'string' || !value.trim()) {
    return undefined
  }

  const values = value.split(',').map(v => v.trim())
  const validValues: T[] = []

  for (const v of values) {
    if (allowed.has(v)) {
      validValues.push(v as T)
    }
  }

  return validValues.length > 0 ? validValues : undefined
}

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

export function parseTacheFilters(searchParams: URLSearchParams): TacheFilters {
  const statusRaw = searchParams.get('status')
  let status: TacheStatus | undefined
  let statusIn: TacheStatus[] | undefined

  if (statusRaw) {
    if (statusRaw.includes(',')) {
      statusIn = ensureEnumValues<TacheStatus>(statusRaw, TACHE_STATUS_VALUES)
    } else {
      status = ensureEnumValue<TacheStatus>(statusRaw, 'status', TACHE_STATUS_VALUES)
    }
  }

  const type = ensureEnumValue<TacheType>(searchParams.get('type'), 'type', TACHE_TYPE_VALUES)
  const priority = ensureEnumValue<TachePriority>(searchParams.get('priority'), 'priority', TACHE_PRIORITY_VALUES)
  const assignedToId = ensureString(searchParams.get('assignedToId'), 'assignedToId')
  const clientId = ensureString(searchParams.get('clientId'), 'clientId')
  const projetId = ensureString(searchParams.get('projetId'), 'projetId')
  const search = ensureString(searchParams.get('search'), 'search')
  const dueBefore = ensureDate(searchParams.get('dueBefore'), 'dueBefore')

  const limitParam = searchParams.get('limit')
  const limit = limitParam ? parseInt(limitParam, 10) : undefined

  const sortParam = searchParams.get('sort')
  let sort: string[] | undefined
  if (sortParam) {
    // Supprime les indicateurs de direction comme :1 pour le moment car le service ne les gère pas encore vraiment
    // ou on pourrait les nettoyer
    sort = sortParam.split(',').map(s => s.split(':')[0].trim())
  }

  return {
    type,
    status,
    statusIn,
    priority,
    assignedToId,
    clientId,
    projetId,
    search,
    dueBefore,
    limit: !isNaN(limit as number) ? limit : undefined,
    sort,
  }
}

export function normalizeTacheCreatePayload(body: unknown): CreateTachePayload {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid payload')
  }

  const data = body as Record<string, unknown>
  const type = ensureEnumValue<TacheType>(data.type, 'type', TACHE_TYPE_VALUES, true)!
  const title = ensureString(data.title, 'title', true)!
  const description = ensureString(data.description, 'description')
  const assignedToId = ensureString(data.assignedToId, 'assignedToId', true)!
  const clientId = ensureString(data.clientId, 'clientId')
  const projetId = ensureString(data.projetId, 'projetId')
  const dueDate = ensureDate(data.dueDate, 'dueDate')
  const priority = ensureEnumValue<TachePriority>(data.priority, 'priority', TACHE_PRIORITY_VALUES, true)!
  const reminderDate = ensureDate(data.reminderDate, 'reminderDate')

  return {
    type,
    title,
    description,
    assignedToId,
    clientId,
    projetId,
    dueDate,
    priority,
    reminderDate,
  }
}

export function normalizeTacheUpdatePayload(body: unknown): UpdateTachePayload {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid payload')
  }

  const data = body as Record<string, unknown>
  const update: UpdateTachePayload = {}

  const type = ensureEnumValue<TacheType>(data.type, 'type', TACHE_TYPE_VALUES)
  if (type) {
    update.type = type
  }

  const title = ensureString(data.title, 'title')
  if (title) {
    update.title = title
  }

  if (data.description !== undefined) {
    const description = ensureString(data.description, 'description')
    update.description = description
  }

  const assignedToId = ensureString(data.assignedToId, 'assignedToId')
  if (assignedToId) {
    update.assignedToId = assignedToId
  }

  const clientId = ensureString(data.clientId, 'clientId')
  if (clientId) {
    update.clientId = clientId
  }

  const projetId = ensureString(data.projetId, 'projetId')
  if (projetId) {
    update.projetId = projetId
  }

  const dueDate = ensureDate(data.dueDate, 'dueDate')
  if (dueDate) {
    update.dueDate = dueDate
  }

  const reminderDate = ensureDate(data.reminderDate, 'reminderDate')
  if (reminderDate) {
    update.reminderDate = reminderDate
  }

  const priority = ensureEnumValue<TachePriority>(data.priority, 'priority', TACHE_PRIORITY_VALUES)
  if (priority) {
    update.priority = priority
  }

  const status = ensureEnumValue<TacheStatus>(data.status, 'status', TACHE_STATUS_VALUES)
  if (status) {
    update.status = status
  }

  if (Object.keys(update).length === 0) {
    throw new Error('No valid fields provided for update')
  }

  return update
}
