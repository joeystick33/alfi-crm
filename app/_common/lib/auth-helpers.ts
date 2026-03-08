import { NextRequest } from 'next/server'
import { AuthContext, SessionData, isSuperAdmin } from './auth-types'
import { getPrismaClient } from './prisma'
export type AuthUser = SessionData
import { getPermissions } from './permissions'
import { createClient } from './supabase/server'
import { createClient as createBrowserClient } from '@supabase/supabase-js'
import { logger } from './logger'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

const JWT_SECRET = process.env.NEXTAUTH_SECRET
if (!JWT_SECRET) {
  logger.error('NEXTAUTH_SECRET is not set — JWT auth will be unavailable. Set this env var in production.', { module: 'AUTH' })
}
const JWT_COOKIE_NAME = 'aura-session'

// Allowlist emails reconnus comme SuperAdmin (fallback quand le flag Supabase n'est pas présent)
// SECURITY: No default — must be explicitly configured via env var
const SUPERADMIN_ALLOWLIST = (process.env.SUPERADMIN_EMAILS ?? '')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean)

/**
 * Lit le cookie JWT local (fallback quand Supabase Auth est inaccessible).
 */
async function tryJwtFromCookies(): Promise<{ id: string; email: string; user_metadata: Record<string, unknown> } | null> {
  try {
    if (!JWT_SECRET) return null
    const cookieStore = await cookies()
    const token = cookieStore.get(JWT_COOKIE_NAME)?.value
    if (!token) return null

    const decoded = jwt.verify(token, JWT_SECRET) as {
      sub: string
      email: string
      user_metadata: Record<string, unknown>
    }
    return {
      id: decoded.sub,
      email: decoded.email,
      user_metadata: decoded.user_metadata || {},
    }
  } catch {
    return null
  }
}

/**
 * Extrait le contexte d'authentification depuis la requête.
 * Priorité : Bearer header → Supabase cookies → JWT local cookie (fallback).
 */
export async function getAuthContext(request?: NextRequest): Promise<AuthContext | null> {
  let user = null
  let error = null

  // 1. Essayer le token Bearer (mode localStorage / dev multi-IP)
  const authHeader = request?.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    try {
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
      logger.error('Error validating Bearer token', { error: e instanceof Error ? e.message : String(e), module: 'AUTH' })
    }
  }

  // 2. Fallback Supabase cookies
  if (!user) {
    try {
      const supabase = await createClient()
      const result = await supabase.auth.getUser()
      user = result.data?.user
      error = result.error
    } catch {
      // Supabase inaccessible
    }
  }

  // 3. Fallback JWT local cookie (quand Supabase est down)
  if (!user) {
    const jwtUser = request
      ? (() => {
          if (!JWT_SECRET) return null
          const token = request.cookies.get(JWT_COOKIE_NAME)?.value
          if (!token) return null
          try {
            const decoded = jwt.verify(token, JWT_SECRET) as { sub: string; email: string; user_metadata: Record<string, unknown> }
            return { id: decoded.sub, email: decoded.email, user_metadata: decoded.user_metadata || {} }
          } catch { return null }
        })()
      : await tryJwtFromCookies()

    if (jwtUser) {
      user = jwtUser as any
      error = null
    }
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
      const email = user.email.trim()
      // D'abord tenter de retrouver un superadmin par email pour les comptes où le flag metadata manque
      const superAdmin = await prisma.superAdmin.findFirst({
        where: {
          email: {
            equals: email,
            mode: 'insensitive',
          },
        },
      })
      if (superAdmin) {
        prismaUserId = superAdmin.id
        isSuperAdminMeta = true
      } else {
        const dbUser = await prisma.user.findFirst({
          where: {
            email: {
              equals: email,
              mode: 'insensitive',
            },
          },
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
      logger.error('Failed to resolve Prisma user from Supabase session', { error: fallbackError instanceof Error ? fallbackError.message : String(fallbackError), module: 'AUTH' })
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
