 
import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/app/_common/lib/auth-helpers'
import { UserService } from '@/app/_common/lib/services/user-service'
import { createAdminClient } from '@/app/_common/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const context = await requireSuperAdmin(request)
    const superAdmin = context.user

    const body = await request.json()
    const { email, password, firstName, lastName, role, cabinetId } = body

    if (!email || !password || !firstName || !lastName || !cabinetId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Instantiate UserService for the target cabinet as SuperAdmin
    const userService = new UserService(cabinetId, superAdmin.id, true)

    try {
      // Create user in DB
      const user = await userService.createUser({
        email,
        password,
        firstName,
        lastName,
        role: role || 'ADVISOR',
        permissions: undefined // Default permissions will be handled if needed or passed
      })

      // Create user in Supabase Auth
      const supabase = createAdminClient()
      const { error: authError } = await supabase.auth.admin.createUser({
        email: email.toLowerCase(),
        password,
        email_confirm: true,
        user_metadata: {
          firstName,
          lastName,
          role: role || 'ADVISOR',
          cabinetId,
          isSuperAdmin: false,
        }
      })

      if (authError && !authError.message.includes('already')) {
        console.error('Erreur Supabase Auth:', authError)
        // Don't fail if Supabase creation fails (can be retried)
      }

      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          cabinetId: cabinetId,
        }
      })

    } catch (error: any) {
      if (error.message === 'Email already exists') {
        return NextResponse.json(
          { error: 'User with this email already exists' },
          { status: 409 }
        )
      }
      throw error
    }

  } catch (error: any) {
    console.error('Create user error:', error)

    if (error.message === 'Forbidden: SuperAdmin access required') {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: 'An error occurred creating user' },
      { status: 500 }
    )
  }
}
