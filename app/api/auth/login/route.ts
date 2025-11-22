import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // 1. Check if user exists in our database (SuperAdmin or User)
    const superAdmin = await prisma.superAdmin.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (superAdmin) {
      if (!superAdmin.isActive) {
        return NextResponse.json(
          { error: 'Account is not active' },
          { status: 403 }
        )
      }

      const isValid = await bcrypt.compare(password, superAdmin.password)
      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        )
      }

      // Créer l'utilisateur dans Supabase Auth s'il n'existe pas
      const supabaseAdmin = createAdminClient()
      
      const { error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: email.toLowerCase(),
        password,
        email_confirm: true,
        user_metadata: {
          firstName: superAdmin.firstName,
          lastName: superAdmin.lastName,
          role: superAdmin.role,
          isSuperAdmin: true,
        }
      })

      // Ignorer si l'utilisateur existe déjà
      if (createError && !createError.message.includes('already')) {
        console.error('Erreur création Supabase:', createError)
      }

      // Créer la session Supabase
      const supabase = await createClient()
      console.log('LoginAPI: Attempting Supabase signIn for', email)
      
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password,
      })

      if (signInError) {
        console.error('Erreur connexion Supabase:', signInError)
        return NextResponse.json(
          { error: 'Erreur lors de la création de la session' },
          { status: 500 }
        )
      }

      console.log('LoginAPI: Supabase session created successfully', signInData.session ? 'YES' : 'NO')

      // Update last login
      await prisma.superAdmin.update({
        where: { id: superAdmin.id },
        data: { lastLogin: new Date() },
      })

      return NextResponse.json({ 
        success: true,
        user: {
          id: superAdmin.id,
          email: superAdmin.email,
          firstName: superAdmin.firstName,
          lastName: superAdmin.lastName,
          role: superAdmin.role,
          isSuperAdmin: true,
        }
      })
    }

    // 2. Check regular User
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { cabinet: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Account is not active' },
        { status: 403 }
      )
    }

    // Check cabinet status
    if (user.cabinet.status === 'SUSPENDED' || user.cabinet.status === 'TERMINATED') {
      return NextResponse.json(
        { error: 'Cabinet account is suspended' },
        { status: 403 }
      )
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Créer l'utilisateur dans Supabase Auth s'il n'existe pas
    const supabaseAdmin = createAdminClient()
    
    const { error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: {
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        cabinetId: user.cabinetId,
        isSuperAdmin: false,
      }
    })

    // Ignorer si l'utilisateur existe déjà
    if (createError && !createError.message.includes('already')) {
      console.error('Erreur création Supabase:', createError)
    }

    // Créer la session Supabase
    const supabase = await createClient()
    console.log('LoginAPI: Attempting Supabase signIn for user', email)

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase(),
      password,
    })

    if (signInError) {
      console.error('Erreur connexion Supabase:', signInError)
      return NextResponse.json(
        { error: 'Erreur lors de la création de la session' },
        { status: 500 }
      )
    }

    console.log('LoginAPI: Supabase session created successfully for user', signInData.session ? 'YES' : 'NO')

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
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
        cabinetSlug: user.cabinet.slug,
        isSuperAdmin: false,
      }
    })
  } catch (error: any) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    )
  }
}
