/**
 * Types pour l'authentification et les sessions
 */

export interface SessionUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'ADMIN' | 'ADVISOR' | 'ASSISTANT'
  cabinetId: string
  cabinetName: string
  permissions: string[]
  avatar?: string
}

export interface SessionSuperAdmin {
  id: string
  email: string
  firstName: string
  lastName: string
  avatar?: string
  role: 'OWNER' | 'ADMIN' | 'DEVELOPER' | 'SUPPORT' | 'SUPER_ADMIN'
  permissions: string[]
  isSuperAdmin: true
}

export type SessionData = SessionUser | SessionSuperAdmin

export interface AuthContext {
  user: SessionData
  cabinetId: string
  /** @deprecated Use cabinetId instead */
  cabinet: { id: string }
  isSuperAdmin: boolean
}

/**
 * Type guard pour vérifier si l'utilisateur est un SuperAdmin
 */
export function isSuperAdmin(user: SessionData | null | undefined): user is SessionSuperAdmin {
  return !!user && typeof user === 'object' && 'isSuperAdmin' in user && user.isSuperAdmin === true
}

/**
 * Type guard pour vérifier si l'utilisateur est un utilisateur normal
 */
export function isRegularUser(user: SessionData | null | undefined): user is SessionUser {
  return !!user && !isSuperAdmin(user)
}
