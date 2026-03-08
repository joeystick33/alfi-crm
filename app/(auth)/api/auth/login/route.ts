import { createClient, createAdminClient } from '@/app/_common/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/app/_common/lib/services/auth-service'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.NEXTAUTH_SECRET
const JWT_COOKIE_NAME = 'aura-session'
const JWT_EXPIRY = '7d'

// ── Types ──
interface UserPayload {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  cabinetId?: string
  cabinetName?: string
  permissions: string[]
  avatar?: string
  isSuperAdmin: boolean
  isClient?: boolean
  prismaUserId?: string
  prismaClientId?: string
  conseillerId?: string | null
}

// ── Helper : créer un cookie JWT de session ──
function createSessionCookie(response: NextResponse, payload: UserPayload): void {
  if (!JWT_SECRET) {
    console.warn('[AUTH] NEXTAUTH_SECRET not set — skipping JWT cookie creation')
    return
  }
  const token = jwt.sign(
    {
      sub: payload.id,
      email: payload.email,
      user_metadata: {
        firstName: payload.firstName,
        lastName: payload.lastName,
        role: payload.role,
        cabinetId: payload.cabinetId || '',
        isSuperAdmin: payload.isSuperAdmin,
        isClient: payload.isClient || false,
        prismaUserId: payload.prismaUserId || payload.id,
        prismaClientId: payload.prismaClientId,
        permissions: payload.permissions,
        avatar: payload.avatar,
        cabinetName: payload.cabinetName,
        conseillerId: payload.conseillerId,
      },
      iat: Math.floor(Date.now() / 1000),
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  )

  response.cookies.set(JWT_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 jours
  })
}

// ── Helper : tenter la synchronisation Supabase Auth (non bloquant) ──
async function trySupabaseSync(
  email: string,
  password: string,
  metadata: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabaseAdmin = createAdminClient()
    const emailLower = email.toLowerCase()

    // Chercher ou créer l'utilisateur dans Supabase
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(
      (u: { email?: string }) => u.email?.toLowerCase() === emailLower
    )

    if (existingUser) {
      await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
        password,
        user_metadata: metadata,
      })
    } else {
      const { error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: emailLower,
        password,
        email_confirm: true,
        user_metadata: metadata,
      })
      if (createError) {
        console.warn('[Auth] Supabase user creation warning:', createError.message)
      }
    }

    // Créer la session Supabase
    const supabase = await createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: emailLower,
      password,
    })

    if (signInError) {
      return { success: false, error: signInError.message }
    }

    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.warn('[Auth] Supabase sync failed (using JWT fallback):', message)
    return { success: false, error: message }
  }
}

// ── POST /api/auth/login ──
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // ═══ 1. SuperAdmin ═══
    const superAdmin = await AuthService.loginSuperAdmin(email, password)
    if (superAdmin) {
      const userData: UserPayload = {
        ...superAdmin,
        isSuperAdmin: true,
        prismaUserId: superAdmin.id,
      }

      const supabaseResult = await trySupabaseSync(email, password, {
        firstName: superAdmin.firstName,
        lastName: superAdmin.lastName,
        role: superAdmin.role,
        isSuperAdmin: true,
        prismaUserId: superAdmin.id,
      })

      const response = NextResponse.json({
        success: true,
        user: userData,
        authMode: supabaseResult.success ? 'supabase' : 'jwt-fallback',
      })

      // Toujours créer le cookie JWT (fallback garanti)
      createSessionCookie(response, userData)
      return response
    }

    // ═══ 2. User (cabinet) ═══
    try {
      const user = await AuthService.loginUser(email, password)
      if (user) {
        const userData: UserPayload = {
          ...user,
          isSuperAdmin: false,
          prismaUserId: user.id,
        }

        const supabaseResult = await trySupabaseSync(email, password, {
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          cabinetId: user.cabinetId,
          isSuperAdmin: false,
          prismaUserId: user.id,
        })

        const response = NextResponse.json({
          success: true,
          user: userData,
          authMode: supabaseResult.success ? 'supabase' : 'jwt-fallback',
        })

        createSessionCookie(response, userData)
        return response
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : ''
      if (message === 'Cabinet is not active' || message === 'User is not active') {
        return NextResponse.json({ error: message }, { status: 403 })
      }
      throw error
    }

    // ═══ 3. Client (portal) ═══
    try {
      const client = await AuthService.loginClient(email, password)
      if (client) {
        const userData: UserPayload = {
          id: client.id,
          email: client.email,
          firstName: client.firstName,
          lastName: client.lastName,
          role: 'CLIENT',
          cabinetId: client.cabinetId,
          permissions: [],
          isSuperAdmin: false,
          isClient: true,
          prismaClientId: client.id,
          conseillerId: client.conseillerId,
        }

        const supabaseResult = await trySupabaseSync(email, password, {
          firstName: client.firstName,
          lastName: client.lastName,
          role: 'CLIENT',
          cabinetId: client.cabinetId,
          conseillerId: client.conseillerId,
          isSuperAdmin: false,
          isClient: true,
          prismaClientId: client.id,
        })

        const response = NextResponse.json({
          success: true,
          user: userData,
          authMode: supabaseResult.success ? 'supabase' : 'jwt-fallback',
        })

        createSessionCookie(response, userData)
        return response
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : ''
      if (message === 'Client account is not active') {
        return NextResponse.json({ error: message }, { status: 403 })
      }
      throw error
    }

    // Aucun compte trouvé
    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    )

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('Login error:', message)
    return NextResponse.json(
      {
        error: 'An error occurred during login',
        ...(process.env.NODE_ENV !== 'production' ? { details: message } : {}),
      },
      { status: 500 }
    )
  }
}
