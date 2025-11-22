import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/supabase/auth-helpers'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()

    // Vérifier que l'utilisateur est ADMIN du cabinet
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Seuls les administrateurs peuvent créer des utilisateurs' },
        { status: 403 }
      )
    }

    if (!user.cabinetId) {
      return NextResponse.json(
        { error: 'Aucun cabinet associé' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { email, password, firstName, lastName, role, cabinetId } = body

    // Vérifier que le cabinetId correspond bien au cabinet de l'admin
    if (cabinetId !== user.cabinetId) {
      return NextResponse.json(
        { error: 'Vous ne pouvez créer des utilisateurs que pour votre cabinet' },
        { status: 403 }
      )
    }

    // Récupérer le cabinet avec les quotas
    const cabinet = await prisma.cabinet.findUnique({
      where: { id: cabinetId },
      include: {
        _count: {
          select: { users: true }
        }
      }
    })

    if (!cabinet) {
      return NextResponse.json(
        { error: 'Cabinet introuvable' },
        { status: 404 }
      )
    }

    // Vérifier les quotas
    const quotas = cabinet.quotas as any
    const currentUsers = cabinet._count.users

    if (currentUsers >= quotas.maxUsers) {
      return NextResponse.json(
        { error: `Quota atteint: ${quotas.maxUsers} utilisateurs maximum. Passez à un plan supérieur.` },
        { status: 429 }
      )
    }

    // Vérifier que l'email n'existe pas
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Cet email est déjà utilisé' },
        { status: 409 }
      )
    }

    // Hash du mot de passe
    const hashedPassword = await bcrypt.hash(password, 10)

    // Créer l'utilisateur dans Prisma
    const newUser = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName,
        lastName,
        role: role || 'ADVISOR',
        cabinetId,
        isActive: true,
        permissions: role === 'ADMIN' ? {
          canManageUsers: true,
          canManageClients: true,
          canManageDocuments: true,
          canViewReports: true,
          canManageSettings: true,
        } : {
          canManageClients: true,
          canManageDocuments: true,
          canViewReports: role !== 'ASSISTANT',
        },
      },
      include: {
        cabinet: true,
      }
    })

    // Créer dans Supabase Auth
    const supabase = await createClient()
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

    if (authError) {
      console.error('Erreur Supabase Auth:', authError)
      // On continue, l'utilisateur se créera à la première connexion
    }

    // Mettre à jour l'usage du cabinet
    await prisma.cabinet.update({
      where: { id: cabinetId },
      data: {
        usage: {
          ...(cabinet.usage as any),
          users: currentUsers + 1,
        },
      },
    })

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
      }
    })
  } catch (error: any) {
    console.error('Create user error:', error)

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'utilisateur' },
      { status: 500 }
    )
  }
}
