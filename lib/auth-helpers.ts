import { NextRequest } from 'next/server'
import { AuthContext, SessionData, isSuperAdmin } from './auth-types'
import { getPermissions } from './permissions'
import { auth } from './auth'

/**
 * Extrait le contexte d'authentification depuis la requête
 * Utilise NextAuth pour récupérer la session
 */
export async function getAuthContext(request?: NextRequest): Promise<AuthContext | null> {
  const session = await auth()
  
  if (!session?.user) {
    return null
  }

  return {
    user: session.user as unknown as SessionData,
    cabinetId: session.user.cabinetId || '',
    isSuperAdmin: session.user.isSuperAdmin,
  }
}

/**
 * Vérifie si l'utilisateur a une permission spécifique
 */
export function checkPermission(
  context: AuthContext,
  permission: string
): boolean {
  const user = context.user
  
  if (isSuperAdmin(user)) {
    const permissions = getPermissions(user.role, true, user.role)
    return permissions.includes(permission as any)
  }
  
  const permissions = getPermissions(user.role, false)
  return permissions.includes(permission as any)
}

/**
 * Middleware pour protéger les routes API
 * Vérifie que l'utilisateur est authentifié
 */
export async function requireAuth(
  request: NextRequest
): Promise<AuthContext> {
  const context = await getAuthContext(request)
  
  if (!context) {
    throw new Error('Unauthorized')
  }
  
  return context
}

/**
 * Middleware pour vérifier une permission spécifique
 */
export async function requirePermission(
  request: NextRequest,
  permission: string
): Promise<AuthContext> {
  const context = await requireAuth(request)
  
  if (!checkPermission(context, permission)) {
    throw new Error('Forbidden: Missing required permission')
  }
  
  return context
}

/**
 * Middleware pour vérifier que l'utilisateur est SuperAdmin
 */
export async function requireSuperAdmin(
  request: NextRequest
): Promise<AuthContext> {
  const context = await requireAuth(request)
  
  if (!context.isSuperAdmin) {
    throw new Error('Forbidden: SuperAdmin access required')
  }
  
  return context
}

/**
 * Helper pour créer une réponse d'erreur standardisée
 */
export function createErrorResponse(
  message: string,
  status: number = 400
): Response {
  return new Response(
    JSON.stringify({
      error: message,
      timestamp: new Date().toISOString(),
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  )
}

/**
 * Helper pour créer une réponse de succès standardisée
 */
export function createSuccessResponse<T>(
  data: T,
  status: number = 200
): Response {
  return new Response(
    JSON.stringify({
      data,
      timestamp: new Date().toISOString(),
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  )
}
