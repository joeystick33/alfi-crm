// ============================================================================
// API Guard — Middleware centralisé de permissions pour les routes API
//
// Problème P3-05 : Les checks de permission se font individuellement dans
// chaque route handler, avec risque d'oubli sur les nouveaux endpoints.
//
// Solution : Wrapper HOF (Higher-Order Function) qui encapsule les route
// handlers avec authentification + vérification de permissions automatique.
//
// Usage :
//   export const GET = apiGuard(handler, { permission: 'clients:read' })
//   export const POST = apiGuard(handler, { permission: 'clients:write', adminOnly: true })
//   export const DELETE = apiGuard(handler, { superAdminOnly: true })
// ============================================================================

import { NextRequest } from 'next/server'
import { requireAuth, checkPermission, createErrorResponse } from '../auth-helpers'
import type { AuthContext } from '../auth-types'
import { logger } from '../logger'

// ── TYPES ──────────────────────────────────────────────────────────────────

export interface ApiGuardOptions {
  /** Permission requise (ex: 'clients:read', 'entretiens:write') */
  permission?: string
  /** Plusieurs permissions dont au moins une est requise */
  anyPermission?: string[]
  /** Toutes ces permissions sont requises */
  allPermissions?: string[]
  /** Réservé aux ADMIN du cabinet */
  adminOnly?: boolean
  /** Réservé aux SuperAdmin plateforme */
  superAdminOnly?: boolean
  /** Autoriser les requêtes non authentifiées (routes publiques) */
  public?: boolean
  /** Vérification custom (return string = message d'erreur, return null = OK) */
  customCheck?: (context: AuthContext, request: NextRequest) => string | null | Promise<string | null>
}

export type GuardedHandler = (
  request: NextRequest,
  context: AuthContext,
  params?: any
) => Promise<Response> | Response

// ── MIDDLEWARE ─────────────────────────────────────────────────────────────

/**
 * Wraps a route handler with authentication and permission checks.
 *
 * @example
 * // Simple auth check (logged in user)
 * export const GET = apiGuard(async (req, auth) => {
 *   return createSuccessResponse({ ok: true })
 * })
 *
 * @example
 * // Permission check
 * export const POST = apiGuard(async (req, auth) => {
 *   const prisma = getPrismaClient(auth.cabinetId)
 *   // ...
 * }, { permission: 'clients:write' })
 *
 * @example
 * // Admin only
 * export const DELETE = apiGuard(handler, { adminOnly: true })
 */
export function apiGuard(
  handler: GuardedHandler,
  options: ApiGuardOptions = {}
) {
  return async (request: NextRequest, routeContext?: any) => {
    try {
      // ── Public route — skip auth ──
      if (options.public) {
        const nullContext = {
          user: null as any,
          cabinetId: '',
          cabinet: { id: '' },
          isSuperAdmin: false,
        }
        return await handler(request, nullContext, routeContext?.params)
      }

      // ── Authenticate ──
      let authContext: AuthContext
      try {
        authContext = await requireAuth(request)
      } catch {
        return createErrorResponse('Non autorisé', 401)
      }

      // ── SuperAdmin check ──
      if (options.superAdminOnly && !authContext.isSuperAdmin) {
        logger.warn('API Guard: SuperAdmin access denied', {
          userId: authContext.user?.id,
          path: request.nextUrl.pathname,
          module: 'SECURITY',
        })
        return createErrorResponse('Accès SuperAdmin requis', 403)
      }

      // ── Admin check ──
      if (options.adminOnly) {
        const role = (authContext.user as any)?.role
        if (!authContext.isSuperAdmin && role !== 'ADMIN' && role !== 'ADMIN_CABINET') {
          logger.warn('API Guard: Admin access denied', {
            userId: authContext.user?.id,
            role,
            path: request.nextUrl.pathname,
            module: 'SECURITY',
          })
          return createErrorResponse('Accès administrateur requis', 403)
        }
      }

      // ── Single permission check ──
      if (options.permission) {
        if (!authContext.isSuperAdmin && !checkPermission(authContext, options.permission)) {
          logger.warn('API Guard: Permission denied', {
            userId: authContext.user?.id,
            permission: options.permission,
            path: request.nextUrl.pathname,
            module: 'SECURITY',
          })
          return createErrorResponse(`Permission requise: ${options.permission}`, 403)
        }
      }

      // ── Any of multiple permissions ──
      if (options.anyPermission && options.anyPermission.length > 0) {
        if (!authContext.isSuperAdmin) {
          const hasAny = options.anyPermission.some(p => checkPermission(authContext, p))
          if (!hasAny) {
            return createErrorResponse(
              `Une des permissions requises: ${options.anyPermission.join(', ')}`,
              403
            )
          }
        }
      }

      // ── All permissions required ──
      if (options.allPermissions && options.allPermissions.length > 0) {
        if (!authContext.isSuperAdmin) {
          const missing = options.allPermissions.filter(p => !checkPermission(authContext, p))
          if (missing.length > 0) {
            return createErrorResponse(
              `Permissions manquantes: ${missing.join(', ')}`,
              403
            )
          }
        }
      }

      // ── Custom check ──
      if (options.customCheck) {
        const errorMessage = await options.customCheck(authContext, request)
        if (errorMessage) {
          return createErrorResponse(errorMessage, 403)
        }
      }

      // ── All checks passed — execute handler ──
      return await handler(request, authContext, routeContext?.params)
    } catch (error: any) {
      logger.error('API Guard: Unhandled error', {
        error: error.message,
        path: request.nextUrl.pathname,
        module: 'SECURITY',
      })
      return createErrorResponse(error.message || 'Erreur serveur', 500)
    }
  }
}
