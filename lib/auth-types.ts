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
  role: 'OWNER' | 'ADMIN' | 'DEVELOPER' | 'SUPPORT'
  permissions: string[]
  isSuperAdmin: true
}

export type SessionData = SessionUser | SessionSuperAdmin

export interface AuthContext {
  user: SessionData
  cabinetId: string
  isSuperAdmin: boolean
}

/**
 * Type guard pour vérifier si l'utilisateur est un SuperAdmin
 */
export function isSuperAdmin(user: SessionData): user is SessionSuperAdmin {
  return 'isSuperAdmin' in user && user.isSuperAdmin === true
}

/**
 * Type guard pour vérifier si l'utilisateur est un utilisateur normal
 */
export function isRegularUser(user: SessionData): user is SessionUser {
  return !isSuperAdmin(user)
}
