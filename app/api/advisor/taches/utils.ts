import { TachePriority, TacheStatus, TacheType } from '@prisma/client'

export type TacheFilters = {
  assignedToId?: string
  clientId?: string
  projetId?: string
  type?: TacheType
  status?: TacheStatus
  priority?: TachePriority
  dueBefore?: Date
  search?: string
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
  if (value === null || value === undefined) {
    if (required) throw new Error(`Missing field: ${field}`)
    return undefined
  }

  if (typeof value !== 'string' || !allowed.has(value)) {
    throw new Error(`Invalid value for field: ${field}`)
  }

  return value as T
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
  const type = ensureEnumValue<TacheType>(searchParams.get('type'), 'type', TACHE_TYPE_VALUES)
  const status = ensureEnumValue<TacheStatus>(searchParams.get('status'), 'status', TACHE_STATUS_VALUES)
  const priority = ensureEnumValue<TachePriority>(searchParams.get('priority'), 'priority', TACHE_PRIORITY_VALUES)
  const assignedToId = ensureString(searchParams.get('assignedToId'), 'assignedToId')
  const clientId = ensureString(searchParams.get('clientId'), 'clientId')
  const projetId = ensureString(searchParams.get('projetId'), 'projetId')
  const search = ensureString(searchParams.get('search'), 'search')
  const dueBefore = ensureDate(searchParams.get('dueBefore'), 'dueBefore')

  return {
    type,
    status,
    priority,
    assignedToId,
    clientId,
    projetId,
    search,
    dueBefore,
  }
}

export function normalizeTacheCreatePayload(body: unknown): CreateTachePayload {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid payload')
  }

  const type = ensureEnumValue<TacheType>((body as any).type, 'type', TACHE_TYPE_VALUES, true)!
  const title = ensureString((body as any).title, 'title', true)!
  const description = ensureString((body as any).description, 'description')
  const assignedToId = ensureString((body as any).assignedToId, 'assignedToId', true)!
  const clientId = ensureString((body as any).clientId, 'clientId')
  const projetId = ensureString((body as any).projetId, 'projetId')
  const dueDate = ensureDate((body as any).dueDate, 'dueDate')
  const priority = ensureEnumValue<TachePriority>((body as any).priority, 'priority', TACHE_PRIORITY_VALUES, true)!
  const reminderDate = ensureDate((body as any).reminderDate, 'reminderDate')

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

  const update: UpdateTachePayload = {}

  const type = ensureEnumValue<TacheType>((body as any).type, 'type', TACHE_TYPE_VALUES)
  if (type) {
    update.type = type
  }

  const title = ensureString((body as any).title, 'title')
  if (title) {
    update.title = title
  }

  if ((body as any).description !== undefined) {
    const description = ensureString((body as any).description, 'description')
    update.description = description
  }

  const assignedToId = ensureString((body as any).assignedToId, 'assignedToId')
  if (assignedToId) {
    update.assignedToId = assignedToId
  }

  const clientId = ensureString((body as any).clientId, 'clientId')
  if (clientId) {
    update.clientId = clientId
  }

  const projetId = ensureString((body as any).projetId, 'projetId')
  if (projetId) {
    update.projetId = projetId
  }

  const dueDate = ensureDate((body as any).dueDate, 'dueDate')
  if (dueDate) {
    update.dueDate = dueDate
  }

  const reminderDate = ensureDate((body as any).reminderDate, 'reminderDate')
  if (reminderDate) {
    update.reminderDate = reminderDate
  }

  const priority = ensureEnumValue<TachePriority>((body as any).priority, 'priority', TACHE_PRIORITY_VALUES)
  if (priority) {
    update.priority = priority
  }

  const status = ensureEnumValue<TacheStatus>((body as any).status, 'status', TACHE_STATUS_VALUES)
  if (status) {
    update.status = status
  }

  if (Object.keys(update).length === 0) {
    throw new Error('No valid fields provided for update')
  }

  return update
}
