import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const JWT_COOKIE_NAME = 'aura-session'

/**
 * Décode un JWT (partie payload) SANS vérification de signature.
 * La vérification de signature se fait côté API routes (Node.js runtime)
 * via jsonwebtoken. Le middleware Edge ne fait qu'un décodage basique
 * pour déterminer si l'utilisateur est connecté et effectuer le routage.
 *
 * Sécurité : les API routes vérifient la signature complète avant
 * d'exécuter des opérations protégées.
 */
function tryJwtFallback(request: NextRequest): { id: string; email: string; user_metadata: Record<string, unknown> } | null {
  const token = request.cookies.get(JWT_COOKIE_NAME)?.value
  if (!token) return null

  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    // Décoder le payload (Base64Url → JSON)
    const payload = parts[1]
    const padded = payload.replace(/-/g, '+').replace(/_/g, '/')
    const json = atob(padded)
    const decoded = JSON.parse(json) as {
      sub: string
      email: string
      user_metadata: Record<string, unknown>
      exp?: number
    }

    // Vérifier l'expiration
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      return null
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

export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    // 1. Essayer Supabase Auth
    let user = null
    try {
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return request.cookies.get(name)?.value
                    },
                    set(name: string, value: string, options: CookieOptions) {
                        request.cookies.set({
                            name,
                            value,
                            ...options,
                        })
                        response = NextResponse.next({
                            request: {
                                headers: request.headers,
                            },
                        })
                        response.cookies.set({
                            name,
                            value,
                            ...options,
                        })
                    },
                    remove(name: string, options: CookieOptions) {
                        request.cookies.set({
                            name,
                            value: '',
                            ...options,
                        })
                        response = NextResponse.next({
                            request: {
                                headers: request.headers,
                            },
                        })
                        response.cookies.set({
                            name,
                            value: '',
                            ...options,
                        })
                    },
                },
            }
        )

        const { data } = await supabase.auth.getUser()
        user = data?.user ?? null
    } catch {
        // Supabase inaccessible — fallback JWT
    }

    // 2. Fallback JWT si Supabase n'a pas trouvé d'utilisateur
    if (!user) {
        user = tryJwtFallback(request) as typeof user
    }

    return { supabaseResponse: response, user }
}
