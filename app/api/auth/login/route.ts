import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/services/auth-service'
import { createErrorResponse, createSuccessResponse } from '@/lib/auth-helpers'

/**
 * POST /api/auth/login
 * Authentifie un utilisateur ou un SuperAdmin
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, isSuperAdmin } = body

    if (!email || !password) {
      return createErrorResponse('Email and password are required', 400)
    }

    let user
    if (isSuperAdmin) {
      user = await AuthService.loginSuperAdmin(email, password)
    } else {
      user = await AuthService.loginUser(email, password)
    }

    if (!user) {
      return createErrorResponse('Invalid credentials', 401)
    }

    // TODO: Créer une session avec NextAuth ou votre système de session
    // Pour l'instant, on retourne juste les données utilisateur
    
    return createSuccessResponse({
      user,
      message: 'Login successful',
    })
  } catch (error: any) {
    console.error('Login error:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('not active')) {
        return createErrorResponse(error.message, 403)
      }
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
