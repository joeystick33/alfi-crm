import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/supabase/auth-helpers'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    await requireSuperAdmin()

    const body = await request.json()
    const { email, password, firstName, lastName, role, cabinetId } = body

    if (!email || !password || !firstName || !lastName || !cabinetId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Create user in Supabase Auth
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
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

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 500 }
      )
    }

    // Hash password for Prisma DB
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user in Prisma
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName,
        lastName,
        role: role || 'ADVISOR',
        cabinetId,
        isActive: true,
      },
      include: {
        cabinet: true,
      }
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        cabinetId: user.cabinetId,
        cabinetName: user.cabinet.name,
      }
    })
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
