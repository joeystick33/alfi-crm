export type AgendaCollaborator = {
  id: string
  name: string
  firstName?: string | null
  lastName?: string | null
  role?: string
  avatar?: string | null
  email?: string | null
  color?: string | null
}

export type ShareLinkEntry = {
  token: string
  createdAt: string
  expiresAt?: string | null
}

export type AgendaNotesPayload = {
  rawNotes: string
  collaborators: AgendaCollaborator[]
  shareLinks: ShareLinkEntry[]
}

const DEFAULT_PAYLOAD: AgendaNotesPayload = {
  rawNotes: '',
  collaborators: [],
  shareLinks: [],
}

const STRUCTURE_KEY = '__agendaNotes'
const STRUCTURE_VERSION = 1

type StoredAgendaNotes = AgendaNotesPayload & {
  [STRUCTURE_KEY]: number
}

const sanitizeCollaborators = (items?: AgendaCollaborator[]) => {
  if (!items?.length) return []
  const seen = new Set<string>()
  return items
    .filter((item) => {
      if (!item?.id) return false
      if (seen.has(item.id)) return false
      seen.add(item.id)
      return true
    })
    .map((item) => ({
      id: item.id,
      name: item.name || 'Collaborateur',
      firstName: item.firstName ?? null,
      lastName: item.lastName ?? null,
      role: item.role,
      avatar: item.avatar ?? null,
      email: item.email ?? null,
      color: item.color ?? null,
    }))
}

const sanitizeShareLinks = (links?: ShareLinkEntry[]) => {
  if (!links?.length) return []
  return links
    .filter((entry) => Boolean(entry?.token))
    .map((entry) => ({
      token: entry.token,
      createdAt: entry.createdAt || new Date().toISOString(),
      expiresAt: entry.expiresAt ?? null,
    }))
}

export function parseAgendaNotes(value?: string | null): AgendaNotesPayload {
  if (!value) return { ...DEFAULT_PAYLOAD }
  try {
    const parsed = JSON.parse(value) as StoredAgendaNotes
    if (parsed && parsed[STRUCTURE_KEY] === STRUCTURE_VERSION) {
      return {
        rawNotes: parsed.rawNotes ?? '',
        collaborators: sanitizeCollaborators(parsed.collaborators),
        shareLinks: sanitizeShareLinks(parsed.shareLinks),
      }
    }
  } catch (error) {
    // Ignore parsing errors and fallback to legacy notes
  }
  return {
    rawNotes: value,
    collaborators: [],
    shareLinks: [],
  }
}

export function serializeAgendaNotes(payload: Partial<AgendaNotesPayload>): string {
  const serialized: StoredAgendaNotes = {
    [STRUCTURE_KEY]: STRUCTURE_VERSION,
    rawNotes: payload.rawNotes ?? '',
    collaborators: sanitizeCollaborators(payload.collaborators),
    shareLinks: sanitizeShareLinks(payload.shareLinks),
  }
  return JSON.stringify(serialized)
}

export function extractRawNotes(value?: string | null) {
  return parseAgendaNotes(value).rawNotes
}
