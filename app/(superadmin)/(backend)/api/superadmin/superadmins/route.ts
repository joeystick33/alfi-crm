import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, createErrorResponse } from '@/app/_common/lib/auth-helpers'
import { prisma } from '@/app/_common/lib/prisma'
import { createAdminClient } from '@/app/_common/lib/supabase/server'

/**
 * API SuperAdmin - Gestion des SuperAdmins
 * GET /api/superadmin/superadmins - Liste tous les superadmins
 * POST /api/superadmin/superadmins - Créer un superadmin
 */

export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    
    if (!context.isSuperAdmin) {
      return createErrorResponse('Non autorisé', 403)
    }

    const currentSuperAdmin = await prisma.superAdmin.findUnique({
      where: { email: context.user.email! },
    })

    if (!currentSuperAdmin || !currentSuperAdmin.isActive) {
      return createErrorResponse('Accès refusé', 403)
    }

    // Seuls les OWNER peuvent voir les autres superadmins
    if (currentSuperAdmin.role !== 'OWNER') {
      // Les autres roles ne voient que les infos basiques
      const superAdmins = await prisma.superAdmin.findMany({
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
        },
        orderBy: { createdAt: 'desc' },
      })
      
      return NextResponse.json({ superAdmins })
    }

    // OWNER voit tout
    const superAdmins = await prisma.superAdmin.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        permissions: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true,
        _count: {
          select: {
            auditLogs: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Formater avec count de connexions
     
    const formattedSuperAdmins = superAdmins.map((sa: any) => ({
      id: sa.id,
      email: sa.email,
      firstName: sa.firstName,
      lastName: sa.lastName,
      role: sa.role,
      permissions: sa.permissions || {
        canManageCabinets: true,
        canManageUsers: true,
        canManagePlans: sa.role === 'OWNER',
        canManageBilling: sa.role === 'OWNER',
        canAccessLogs: true,
        canManageConfig: sa.role === 'OWNER',
        canDeleteData: sa.role === 'OWNER',
      },
      isActive: sa.isActive,
      createdAt: sa.createdAt,
      lastLogin: sa.lastLogin,
      loginCount: sa._count.auditLogs,
    }))

    return NextResponse.json({ superAdmins: formattedSuperAdmins })
  } catch (error) {
    console.error('Erreur liste superadmins:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    
    if (!context.isSuperAdmin) {
      return createErrorResponse('Non autorisé', 403)
    }

    const currentSuperAdmin = await prisma.superAdmin.findUnique({
      where: { email: context.user.email! },
    })

    if (!currentSuperAdmin || !currentSuperAdmin.isActive) {
      return createErrorResponse('Accès refusé', 403)
    }

    // Seul OWNER peut créer des superadmins
    if (currentSuperAdmin.role !== 'OWNER') {
      return createErrorResponse('Seul le propriétaire peut créer des superadmins', 403)
    }

    const body = await request.json()
    const { email, firstName, lastName, password, role, permissions } = body

    // Vérifier que l'email n'existe pas
    const existing = await prisma.superAdmin.findUnique({
      where: { email },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Cet email est déjà utilisé' },
        { status: 400 }
      )
    }

    // Hasher le mot de passe
    const bcrypt = await import('bcryptjs')
    const hashedPassword = await bcrypt.hash(password, 10)

    // Créer le superadmin dans Prisma
    const superAdmin = await prisma.superAdmin.create({
      data: {
        email,
        firstName,
        lastName,
        password: hashedPassword,
        role: role || 'ADMIN',
        permissions: permissions || null,
        isActive: true,
      },
    })

    // Créer l'utilisateur dans Supabase Auth pour permettre les emails de reset password
    try {
      const supabase = createAdminClient()
      const { error: authError } = await supabase.auth.admin.createUser({
        email: email.toLowerCase(),
        password,
        email_confirm: true,
        user_metadata: {
          firstName,
          lastName,
          role: role || 'ADMIN',
          isSuperAdmin: true,
          prismaUserId: superAdmin.id,
        },
      })

      if (authError && !authError.message.includes('already')) {
        console.error('Erreur Supabase Auth:', authError)
        // On continue même si Supabase échoue - l'utilisateur existe dans Prisma
      }
    } catch (supabaseError) {
      console.error('Erreur création Supabase:', supabaseError)
    }

    // Log d'audit
    await prisma.auditLog.create({
      data: {
        superAdminId: currentSuperAdmin.id,
        action: 'CREATION',
        entityType: 'SuperAdmin',
        entityId: superAdmin.id,
        changes: {
          created: {
            email,
            firstName,
            lastName,
            role: role || 'ADMIN',
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      superAdmin: {
        id: superAdmin.id,
        email: superAdmin.email,
        firstName: superAdmin.firstName,
        lastName: superAdmin.lastName,
        role: superAdmin.role,
      },
    })
  } catch (error) {
    console.error('Erreur création superadmin:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
