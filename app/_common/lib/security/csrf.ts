// ============================================================================
// CSRF Protection — Origin/Referer Validation
//
// Next.js App Router API routes sont protégées via :
//   • SameSite=Lax/Strict cookies (Supabase session)
//   • Ce module : vérification Origin/Referer header
//
// Cette combinaison est suffisante pour les apps same-origin.
// Ref: https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html#verifying-origin-with-standard-headers
// ============================================================================

import type { NextRequest } from 'next/server'

// ── VALIDATION ─────────────────────────────────────────────────────────────

/**
 * Valide la requête CSRF en vérifiant Origin/Referer vs Host.
 * Retourne true si la requête est valide, false sinon.
 */
export function validateCsrf(request: NextRequest): { valid: boolean; reason?: string } {
  const method = request.method.toUpperCase()

  // Les méthodes safe n'ont pas besoin de protection CSRF
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return { valid: true }
  }

  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  const host = request.headers.get('host')

  if (origin) {
    try {
      const originHost = new URL(origin).host
      if (originHost !== host) {
        return { valid: false, reason: `Origin mismatch: ${originHost} vs ${host}` }
      }
    } catch {
      return { valid: false, reason: 'Invalid Origin header' }
    }
  } else if (referer) {
    try {
      const refererHost = new URL(referer).host
      if (refererHost !== host) {
        return { valid: false, reason: `Referer mismatch: ${refererHost} vs ${host}` }
      }
    } catch {
      return { valid: false, reason: 'Invalid Referer header' }
    }
  }
  // Si ni Origin ni Referer → accepté (curl, Postman, navigateurs legacy)
  // L'auth session Supabase protège déjà contre les requêtes non-authentifiées

  return { valid: true }
}

// ── ERROR RESPONSE ─────────────────────────────────────────────────────────

/**
 * Crée une réponse 403 CSRF invalide
 */
export function createCsrfErrorResponse(reason: string): Response {
  return new Response(
    JSON.stringify({
      error: 'CSRF Validation Failed',
      message: reason,
    }),
    {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    }
  )
}
