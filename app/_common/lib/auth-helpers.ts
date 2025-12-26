import { NextRequest } from 'next/server'
import { AuthContext, SessionData, isSuperAdmin } from './auth-types'
import { getPrismaClient } from './prisma'
export type AuthUser = SessionData
import { getPermissions } from './permissions'
import { createClient } from './supabase/server'
import { createClient as createBrowserClient } from '@supabase/supabase-js'

// Allowlist emails reconnus comme SuperAdmin (fallback quand le flag Supabase n'est pas présent)
const SUPERADMIN_ALLOWLIST = (process.env.SUPERADMIN_EMAILS ?? 'admin@alfi.fr,superadmin@alfi.app')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean)

/**
 * Extrait le contexte d'authentification depuis la requête
 * Utilise Supabase pour récupérer la session
 * Supporte le mode localStorage (token Bearer) pour le développement multi-IP
 */
export async function getAuthContext(request?: NextRequest): Promise<AuthContext | null> {
  let user = null
  let error = null

  // Essayer d'abord de lire le token depuis l'Authorization header (mode localStorage)
  const authHeader = request?.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    try {
      // Créer un client Supabase et vérifier le token
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      const { data, error: tokenError } = await supabase.auth.getUser(token)
      if (!tokenError && data?.user) {
        user = data.user
      } else {
        error = tokenError
      }
    } catch (e) {
      console.error('Error validating Bearer token:', e)
    }
  }

  // Fallback sur les cookies si pas de token Bearer
  if (!user) {
    const supabase = await createClient()
    const result = await supabase.auth.getUser()
    user = result.data?.user
    error = result.error
  }

  if (error || !user) {
    return null
  }

  const metadata = user.user_metadata ?? {}
  const supabaseUserId = user.id
  let prismaUserId = typeof metadata.prismaUserId === 'string' && metadata.prismaUserId.trim().length > 0
    ? metadata.prismaUserId as string
    : undefined

  let cabinetIdMeta = 'cabinetId' in metadata ? metadata.cabinetId : ''
  let isSuperAdminMeta = metadata.isSuperAdmin === true

  // Fallback : email dans l'allowlist SuperAdmin
  if (user.email && SUPERADMIN_ALLOWLIST.includes(user.email.toLowerCase())) {
    isSuperAdminMeta = true
  }

  // Fallback: si l'ID Prisma n'est pas présent (sessions existantes), rechercher via l'email côté Prisma
  if ((!prismaUserId || (!cabinetIdMeta && !isSuperAdminMeta)) && user.email) {
    try {
      const prisma = getPrismaClient('', true)
      // D'abord tenter de retrouver un superadmin par email pour les comptes où le flag metadata manque
      const superAdmin = await prisma.superAdmin.findUnique({ where: { email: user.email.toLowerCase() } })
      if (superAdmin) {
        prismaUserId = superAdmin.id
        isSuperAdminMeta = true
      } else {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email.toLowerCase() },
          select: { id: true, cabinetId: true }
        })
        if (dbUser) {
          prismaUserId = dbUser.id
          if (!cabinetIdMeta) {
            cabinetIdMeta = dbUser.cabinetId
          }
        }
      }
    } catch (fallbackError) {
      console.error('Failed to resolve Prisma user from Supabase session:', fallbackError)
    }
  }

  // Map Supabase user metadata to SessionData, ensuring Prisma ID is used when disponible
  const sessionUser = {
    ...user,
    ...metadata,
    supabaseUserId,
    prismaUserId: prismaUserId ?? null,
    id: prismaUserId || supabaseUserId,
    email: user.email,
  } as unknown as SessionData & { prismaUserId?: string | null; supabaseUserId?: string }

  const cabinetId = cabinetIdMeta || ('cabinetId' in sessionUser ? sessionUser.cabinetId : '')
  // isSuperAdminMeta prend priorité (allowlist ou détection Prisma)
  const finalIsSuperAdmin = isSuperAdminMeta || (sessionUser as any).isSuperAdmin === true

  return {
    user: sessionUser,
    cabinetId: cabinetId || '',
    cabinet: { id: cabinetId || '' }, // Alias for backward compatibility
    isSuperAdmin: finalIsSuperAdmin,
  }
}

/**
 * Récupère l'utilisateur authentifié (raccourci)
 */
export async function getAuthUser(request?: NextRequest) {
  const context = await getAuthContext(request)
  return context?.user || null
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
    return permissions.includes(permission as typeof permissions[number])
  }

  const permissions = getPermissions(user.role, false)
  return permissions.includes(permission as typeof permissions[number])
}

/**
 * Middleware pour protéger les routes API
 * Vérifie que l'utilisateur est authentifié
 */
export async function requireAuth(
  request?: NextRequest
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
  request?: NextRequest
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
      message,
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
