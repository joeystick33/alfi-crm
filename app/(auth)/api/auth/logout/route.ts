import { createClient } from '@/app/_common/lib/supabase/server'
import { NextResponse } from 'next/server'

const JWT_COOKIE_NAME = 'aura-session'

export async function POST() {
  try {
    // Tenter le signOut Supabase (non bloquant si inaccessible)
    try {
      const supabase = await createClient()
      await supabase.auth.signOut()
    } catch {
      // Supabase inaccessible — on continue
    }

    // Toujours supprimer le cookie JWT local
    const response = NextResponse.json({ success: true })
    response.cookies.set(JWT_COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    })
    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'An error occurred during logout' },
      { status: 500 }
    )
  }
}
