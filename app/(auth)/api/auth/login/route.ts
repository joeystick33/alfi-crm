 
import { createClient, createAdminClient } from '@/app/_common/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/app/_common/lib/services/auth-service'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // 1. Try to login as SuperAdmin
    const superAdmin = await AuthService.loginSuperAdmin(email, password)

    if (superAdmin) {
      // Synchroniser l'utilisateur dans Supabase Auth
      const supabaseAdmin = createAdminClient()
      const emailLower = email.toLowerCase()

      // Chercher si l'utilisateur existe déjà dans Supabase
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
      const existingUser = existingUsers?.users?.find(u => u.email?.toLowerCase() === emailLower)

      if (existingUser) {
        // Mettre à jour le mot de passe et les métadonnées
        await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
          password,
          user_metadata: {
            firstName: superAdmin.firstName,
            lastName: superAdmin.lastName,
            role: superAdmin.role,
            isSuperAdmin: true,
            prismaUserId: superAdmin.id,
          }
        })
      } else {
        // Créer le nouvel utilisateur
        const { error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: emailLower,
          password,
          email_confirm: true,
          user_metadata: {
            firstName: superAdmin.firstName,
            lastName: superAdmin.lastName,
            role: superAdmin.role,
            isSuperAdmin: true,
            prismaUserId: superAdmin.id,
          }
        })

        if (createError) {
          console.error('Erreur création Supabase:', createError)
        }
      }

      // Créer la session Supabase
      const supabase = await createClient()
      console.log('LoginAPI: Attempting Supabase signIn for', email)

      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: emailLower,
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

      return NextResponse.json({
        success: true,
        user: {
          ...superAdmin,
          isSuperAdmin: true,
          prismaUserId: superAdmin.id,
        }
      })
    }

    // 2. Try to login as regular User
    try {
      const user = await AuthService.loginUser(email, password)

      if (user) {
        // Synchroniser l'utilisateur dans Supabase Auth
        const supabaseAdmin = createAdminClient()
        const emailLower = email.toLowerCase()

        // Chercher si l'utilisateur existe déjà dans Supabase
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
        const existingUser = existingUsers?.users?.find(u => u.email?.toLowerCase() === emailLower)

        if (existingUser) {
          // Mettre à jour le mot de passe et les métadonnées
          await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
            password,
            user_metadata: {
              firstName: user.firstName,
              lastName: user.lastName,
              role: user.role,
              cabinetId: user.cabinetId,
              isSuperAdmin: false,
              prismaUserId: user.id,
            }
          })
        } else {
          // Créer le nouvel utilisateur
          const { error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: emailLower,
            password,
            email_confirm: true,
            user_metadata: {
              firstName: user.firstName,
              lastName: user.lastName,
              role: user.role,
              cabinetId: user.cabinetId,
              isSuperAdmin: false,
              prismaUserId: user.id,
            }
          })

          if (createError) {
            console.error('Erreur création Supabase:', createError)
          }
        }

        // Créer la session Supabase
        const supabase = await createClient()
        console.log('LoginAPI: Attempting Supabase signIn for user', email)

        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: emailLower,
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

        return NextResponse.json({
          success: true,
          user: {
            ...user,
            isSuperAdmin: false,
            prismaUserId: user.id,
          }
        })
      }
    } catch (error: any) {
      // Catch specific errors from AuthService (e.g. "Cabinet is not active")
      if (error.message === 'Cabinet is not active' || error.message === 'User is not active') {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        )
      }
      throw error // Re-throw other errors
    }

    // 3. Try to login as Client (portal)
    try {
      const client = await AuthService.loginClient(email, password)

      if (client) {
        // Synchroniser le client dans Supabase Auth
        const supabaseAdmin = createAdminClient()
        const emailLower = email.toLowerCase()

        // Chercher si l'utilisateur existe déjà dans Supabase
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
        const existingUser = existingUsers?.users?.find(u => u.email?.toLowerCase() === emailLower)

        if (existingUser) {
          // Mettre à jour le mot de passe et les métadonnées
          await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
            password,
            user_metadata: {
              firstName: client.firstName,
              lastName: client.lastName,
              role: 'CLIENT',
              cabinetId: client.cabinetId,
              conseillerId: client.conseillerId,
              isSuperAdmin: false,
              isClient: true,
              prismaClientId: client.id,
            }
          })
        } else {
          // Créer le nouvel utilisateur
          const { error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: emailLower,
            password,
            email_confirm: true,
            user_metadata: {
              firstName: client.firstName,
              lastName: client.lastName,
              role: 'CLIENT',
              cabinetId: client.cabinetId,
              conseillerId: client.conseillerId,
              isSuperAdmin: false,
              isClient: true,
              prismaClientId: client.id,
            }
          })

          if (createError) {
            console.error('Erreur création Supabase client:', createError)
          }
        }

        // Créer la session Supabase
        const supabase = await createClient()
        console.log('LoginAPI: Attempting Supabase signIn for client', email)

        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: emailLower,
          password,
        })

        if (signInError) {
          console.error('Erreur connexion Supabase client:', signInError)
          return NextResponse.json(
            { error: 'Erreur lors de la création de la session' },
            { status: 500 }
          )
        }

        console.log('LoginAPI: Supabase session created successfully for client', signInData.session ? 'YES' : 'NO')

        return NextResponse.json({
          success: true,
          user: {
            ...client,
            role: 'CLIENT',
            isSuperAdmin: false,
            isClient: true,
            prismaClientId: client.id,
          }
        })
      }
    } catch (error: any) {
      if (error.message === 'Client account is not active') {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        )
      }
      throw error
    }

    // If neither SuperAdmin, User, nor Client found/valid
    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    )

  } catch (error: any) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    )
  }
}
