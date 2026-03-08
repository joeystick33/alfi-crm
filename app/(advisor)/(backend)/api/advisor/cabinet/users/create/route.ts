 
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import { prisma } from '@/app/_common/lib/prisma'
import { createAdminClient } from '@/app/_common/lib/supabase/server'
import { UserService } from '@/app/_common/lib/services/user-service'
import { logger } from '@/app/_common/lib/logger'
export async function POST(request: NextRequest) {
  try {
    const context = await requireAuth(request); const { user } = context

    // Vérifier que l'utilisateur est ADMIN du cabinet
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Seuls les administrateurs peuvent créer des utilisateurs' },
        { status: 403 }
      )
    }

    if (!context.cabinetId) {
      return NextResponse.json(
        { error: 'Aucun cabinet associé' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { email, password, firstName, lastName, role, cabinetId } = body

    // Vérifier que le cabinetId correspond bien au cabinet de l'admin
    if (cabinetId !== context.cabinetId) {
      return NextResponse.json(
        { error: 'Vous ne pouvez créer des utilisateurs que pour votre cabinet' },
        { status: 403 }
      )
    }

    // Récupérer le cabinet avec les quotas et compter les utilisateurs par rôle
    const cabinet = await prisma.cabinet.findUnique({
      where: { id: cabinetId },
      include: {
        _count: {
          select: { users: true }
        },
        users: {
          select: { role: true }
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
    const currentAdmins = cabinet.users.filter(u => u.role === 'ADMIN').length

    // Vérifier le quota total d'utilisateurs
    if (currentUsers >= quotas.maxUsers) {
      return NextResponse.json(
        { error: `Quota atteint: ${quotas.maxUsers} utilisateurs maximum. Passez à un plan supérieur.` },
        { status: 429 }
      )
    }

    // Vérifier le quota d'administrateurs si on crée un ADMIN
    const maxAdmins = quotas.maxAdmins ?? 2 // Par défaut 2 si non défini
    if (role === 'ADMIN' && currentAdmins >= maxAdmins) {
      return NextResponse.json(
        { error: `Quota d'administrateurs atteint: ${maxAdmins} admin${maxAdmins > 1 ? 's' : ''} maximum par cabinet.` },
        { status: 429 }
      )
    }

    const userService = new UserService(cabinetId, user.id, context.isSuperAdmin)

    // Créer l'utilisateur via le service (gère le hash password et la création Prisma)
    const newUser = await userService.createUser({
      email,
      password,
      firstName,
      lastName,
      role: role || 'ADVISOR',
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
      }
    })

    // Créer dans Supabase Auth
    // Important: utiliser le client service role pour créer dans Supabase Auth
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

    if (authError) {
      logger.error('Erreur Supabase Auth: ' + authError.message)
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
      user: newUser
    })
  } catch (error: any) {
    logger.error('Create user error:', { error: error instanceof Error ? error.message : String(error) })

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    if (error.message === 'Email already exists') {
      return NextResponse.json(
        { error: 'Cet email est déjà utilisé' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'utilisateur' },
      { status: 500 }
    )
  }
}
