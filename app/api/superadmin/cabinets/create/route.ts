import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/supabase/auth-helpers'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    // Vérifier que l'utilisateur est SuperAdmin
    await requireSuperAdmin()

    const body = await request.json()
    const { cabinet, quotas, adminUser } = body

    // Validation
    if (!cabinet?.name || !cabinet?.slug || !cabinet?.email) {
      return NextResponse.json(
        { error: 'Informations cabinet manquantes' },
        { status: 400 }
      )
    }

    if (!adminUser?.email || !adminUser?.password || !adminUser?.firstName || !adminUser?.lastName) {
      return NextResponse.json(
        { error: 'Informations administrateur manquantes' },
        { status: 400 }
      )
    }

    // Vérifier que le slug est unique
    const existingCabinet = await prisma.cabinet.findUnique({
      where: { slug: cabinet.slug },
    })

    if (existingCabinet) {
      return NextResponse.json(
        { error: 'Ce slug est déjà utilisé' },
        { status: 409 }
      )
    }

    // Vérifier que l'email admin n'existe pas
    const existingUser = await prisma.user.findUnique({
      where: { email: adminUser.email.toLowerCase() },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Cet email est déjà utilisé' },
        { status: 409 }
      )
    }

    // Créer le cabinet
    const newCabinet = await prisma.cabinet.create({
      data: {
        name: cabinet.name,
        slug: cabinet.slug,
        email: cabinet.email,
        phone: cabinet.phone || null,
        address: cabinet.address || null,
        plan: cabinet.plan || 'BUSINESS',
        status: 'ACTIVE',
        quotas: {
          maxUsers: quotas?.maxUsers || 10,
          maxClients: quotas?.maxClients || 100,
          maxStorage: quotas?.maxStorage || 10737418240,
        },
        usage: {
          users: 0,
          clients: 0,
          storage: 0,
        },
        features: {
          analytics: true,
          emailSync: true,
          advancedReports: cabinet.plan === 'PREMIUM' || cabinet.plan === 'ENTERPRISE',
          api: cabinet.plan === 'ENTERPRISE',
          whiteLabel: cabinet.plan === 'ENTERPRISE',
        },
      },
    })

    // Hash du mot de passe
    const hashedPassword = await bcrypt.hash(adminUser.password, 10)

    // Créer l'utilisateur admin dans Prisma
    const newAdmin = await prisma.user.create({
      data: {
        email: adminUser.email.toLowerCase(),
        password: hashedPassword,
        firstName: adminUser.firstName,
        lastName: adminUser.lastName,
        role: 'ADMIN',
        cabinetId: newCabinet.id,
        isActive: true,
        permissions: {
          canManageUsers: true,
          canManageClients: true,
          canManageDocuments: true,
          canViewReports: true,
          canManageSettings: true,
        },
      },
    })

    // Créer l'utilisateur dans Supabase Auth
    const supabase = await createClient()
    const { error: authError } = await supabase.auth.admin.createUser({
      email: adminUser.email.toLowerCase(),
      password: adminUser.password,
      email_confirm: true,
      user_metadata: {
        firstName: adminUser.firstName,
        lastName: adminUser.lastName,
        role: 'ADMIN',
        cabinetId: newCabinet.id,
        isSuperAdmin: false,
      }
    })

    if (authError) {
      console.error('Erreur Supabase Auth:', authError)
      // On continue quand même, l'utilisateur se créera à la première connexion
    }

    // Mettre à jour l'usage du cabinet
    await prisma.cabinet.update({
      where: { id: newCabinet.id },
      data: {
        usage: {
          users: 1,
          clients: 0,
          storage: 0,
        },
      },
    })

    return NextResponse.json({
      success: true,
      cabinet: newCabinet,
      admin: {
        id: newAdmin.id,
        email: newAdmin.email,
        firstName: newAdmin.firstName,
        lastName: newAdmin.lastName,
      }
    })
  } catch (error: any) {
    console.error('Create cabinet error:', error)
    
    if (error.message === 'Forbidden: SuperAdmin access required') {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: 'Erreur lors de la création du cabinet' },
      { status: 500 }
    )
  }
}
