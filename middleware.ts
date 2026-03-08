import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/app/_common/lib/supabase/middleware'
import { checkRateLimit, createRateLimitResponse } from '@/app/_common/lib/security/rate-limiter'
import { validateCsrf, createCsrfErrorResponse } from '@/app/_common/lib/security/csrf'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Rate Limiting (API routes only) ──
  const isApiRoute = pathname.startsWith('/api/')
  if (isApiRoute) {
    try {
      const rateLimitResult = await checkRateLimit(request)
      if (!rateLimitResult.allowed) {
        return createRateLimitResponse(rateLimitResult)
      }
    } catch {
      // Rate limiter failure should not block requests — fail open
    }
  }

  // ── CSRF Protection (API mutations — Origin/Referer check) ──
  if (isApiRoute && !['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    const csrfResult = validateCsrf(request)
    if (!csrfResult.valid) {
      return createCsrfErrorResponse(csrfResult.reason || 'CSRF validation failed')
    }
  }

  // Update Supabase session
  const { supabaseResponse, user } = await updateSession(request)

  const isLoggedIn = !!user

  // Public routes
  const publicRoutes = ['/login', '/signup', '/forgot-password', '/reset-password']
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  // API routes that don't need auth
  const publicApiRoutes = ['/api/auth']
  const isPublicApiRoute = publicApiRoutes.some(route => pathname.startsWith(route))
  const protectedApiPrefixes = ['/api/advisor', '/api/superadmin', '/api/client']
  const isProtectedApiRoute = protectedApiPrefixes.some(prefix => pathname.startsWith(prefix))

  // Allow root path to handle its own redirect
  if (pathname === '/') {
    return supabaseResponse
  }

  // Redirect logged in users away from auth pages
  if (isLoggedIn && isPublicRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Prevent Staff (Admins/Advisors) from accessing Client portal
  // Only users with 'CLIENT' role (if any) or no role in user_metadata (if specific client auth) should access /client
  // For now, since we only login Admins via this flow, BLOCK /client access entirely for logged in users
  if (isLoggedIn && pathname.startsWith('/client')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Redirect non-logged in users to login (for protected routes)
  if (!isLoggedIn && !isPublicRoute && !isPublicApiRoute) {
    // Protected routes: /dashboard, /client, /superadmin, /simulators
    const protectedPrefixes = ['/dashboard', '/client', '/superadmin', '/simulators']
    const isProtectedRoute = protectedPrefixes.some(prefix => pathname.startsWith(prefix))

    if (isProtectedRoute) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Protected API routes must be authenticated (JSON 401, not redirect)
  if (!isLoggedIn && isProtectedApiRoute) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Only client users should access /api/client endpoints
  if (isLoggedIn && pathname.startsWith('/api/client')) {
    const isClientUser = user?.user_metadata?.isClient === true || user?.user_metadata?.role === 'CLIENT'
    if (!isClientUser) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  // Client users cannot access advisor/superadmin APIs
  if (isLoggedIn && (pathname.startsWith('/api/advisor') || pathname.startsWith('/api/superadmin'))) {
    const isClientUser = user?.user_metadata?.isClient === true || user?.user_metadata?.role === 'CLIENT'
    if (isClientUser) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
}
