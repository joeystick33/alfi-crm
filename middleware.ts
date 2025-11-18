import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req: any) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth

  // Public routes
  const publicRoutes = ['/login', '/signup', '/forgot-password', '/reset-password']
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  // API routes that don't need auth
  const publicApiRoutes = ['/api/auth']
  const isPublicApiRoute = publicApiRoutes.some(route => pathname.startsWith(route))

  // Allow root path to handle its own redirect
  if (pathname === '/') {
    return NextResponse.next()
  }

  // Redirect logged in users away from auth pages
  if (isLoggedIn && isPublicRoute) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Redirect non-logged in users to login (for protected routes)
  if (!isLoggedIn && !isPublicRoute && !isPublicApiRoute) {
    // Protected routes: /dashboard, /client, /superadmin
    const protectedPrefixes = ['/dashboard', '/client', '/superadmin']
    const isProtectedRoute = protectedPrefixes.some(prefix => pathname.startsWith(prefix))
    
    if (isProtectedRoute) {
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
}
