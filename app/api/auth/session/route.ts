import { getAuthUser } from '@/lib/supabase/auth-helpers'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const user = await getAuthUser()
    
    if (!user) {
      return NextResponse.json({ user: null })
    }
    
    return NextResponse.json({ user })
  } catch (error: any) {
    console.error('Session error:', error)
    return NextResponse.json(
      { error: 'An error occurred fetching session' },
      { status: 500 }
    )
  }
}
