import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Update Supabase session
  const { supabaseResponse, user } = await updateSession(request)
  
  const isLoggedIn = !!user
  console.log(`Middleware: ${pathname} - LoggedIn: ${isLoggedIn} - User: ${user?.email}`)

  // Public routes
  const publicRoutes = ['/login', '/signup', '/forgot-password', '/reset-password']
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  // API routes that don't need auth
  const publicApiRoutes = ['/api/auth']
  const isPublicApiRoute = publicApiRoutes.some(route => pathname.startsWith(route))

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
    console.log('Middleware: Blocking access to /client for logged in user -> redirecting to /dashboard')
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

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
}
