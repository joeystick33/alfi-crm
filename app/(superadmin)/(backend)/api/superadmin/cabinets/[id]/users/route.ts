import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, createErrorResponse } from '@/app/_common/lib/auth-helpers'
import { prisma } from '@/app/_common/lib/prisma'
import { createAdminClient } from '@/app/_common/lib/supabase/server'
import bcrypt from 'bcryptjs'

/**
 * API SuperAdmin - Gestion des utilisateurs d'un cabinet
 * GET /api/superadmin/cabinets/[id]/users - Liste les utilisateurs
 * POST /api/superadmin/cabinets/[id]/users - Créer un utilisateur
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { id: cabinetId } = await params
    
    if (!context.isSuperAdmin) {
      return createErrorResponse('Non autorisé', 403)
    }

    const users = await prisma.user.findMany({
      where: { cabinetId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLogin: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Erreur liste utilisateurs cabinet:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { id: cabinetId } = await params
    
    if (!context.isSuperAdmin) {
      return createErrorResponse('Non autorisé', 403)
    }

    const superAdmin = await prisma.superAdmin.findUnique({
      where: { email: context.user.email! },
    })

    if (!superAdmin || !superAdmin.isActive) {
      return createErrorResponse('Accès refusé', 403)
    }
    const body = await request.json()
    const { email, password, firstName, lastName, phone, role } = body

    // Validation
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Champs obligatoires manquants' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 6 caractères' },
        { status: 400 }
      )
    }

    // Vérifier que le cabinet existe
    const cabinet = await prisma.cabinet.findUnique({
      where: { id: cabinetId },
      include: {
        _count: { select: { users: true } },
      },
    })

    if (!cabinet) {
      return NextResponse.json(
        { error: 'Cabinet non trouvé' },
        { status: 404 }
      )
    }

    // Vérifier les quotas
     
    const quotas = cabinet.quotas as any
    const maxUsers = quotas?.maxUsers || 10
    
    if (maxUsers !== -1 && cabinet._count.users >= maxUsers) {
      return NextResponse.json(
        { error: `Quota atteint: ${maxUsers} utilisateurs maximum` },
        { status: 400 }
      )
    }

    // Vérifier que l'email n'existe pas déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Cet email est déjà utilisé' },
        { status: 409 }
      )
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10)

    // Créer l'utilisateur dans Prisma
    const newUser = await prisma.user.create({
      data: {
        cabinetId,
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName,
        lastName,
        phone: phone || null,
        role: role || 'ADVISOR',
        isActive: true,
        permissions: getDefaultPermissions(role || 'ADVISOR'),
      },
    })

    // Créer l'utilisateur dans Supabase Auth
    try {
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
        },
      })

      if (authError && !authError.message.includes('already')) {
        console.error('Erreur Supabase Auth:', authError)
        // On continue même si Supabase échoue
      }
    } catch (supabaseError) {
      console.error('Erreur création Supabase:', supabaseError)
    }

    // Mettre à jour l'usage du cabinet
     
    const currentUsage = cabinet.usage as any || { users: 0, clients: 0, storage: 0 }
    await prisma.cabinet.update({
      where: { id: cabinetId },
      data: {
        usage: {
          ...currentUsage,
          users: cabinet._count.users + 1,
        },
      },
    })

    // Log d'audit
    await prisma.auditLog.create({
      data: {
        superAdminId: superAdmin.id,
        cabinetId,
        action: 'CREATION',
        entityType: 'User',
        entityId: newUser.id,
        changes: {
          email: newUser.email,
          role: newUser.role,
          createdBySuperAdmin: true,
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
      },
    })
  } catch (error) {
    console.error('Erreur création utilisateur cabinet:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

function getDefaultPermissions(role: string) {
  switch (role) {
    case 'ADMIN':
      return {
        canManageUsers: true,
        canManageClients: true,
        canManageDocuments: true,
        canViewReports: true,
        canManageSettings: true,
        canExportData: true,
      }
    case 'ADVISOR':
      return {
        canManageUsers: false,
        canManageClients: true,
        canManageDocuments: true,
        canViewReports: true,
        canManageSettings: false,
        canExportData: true,
      }
    case 'ASSISTANT':
      return {
        canManageUsers: false,
        canManageClients: false,
        canManageDocuments: true,
        canViewReports: false,
        canManageSettings: false,
        canExportData: false,
      }
    default:
      return {}
  }
}
