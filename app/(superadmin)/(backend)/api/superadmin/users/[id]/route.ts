import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, createErrorResponse } from '@/app/_common/lib/auth-helpers'
import { prisma } from '@/app/_common/lib/prisma'

/**
 * API SuperAdmin - Gestion d'un utilisateur spécifique
 * GET /api/superadmin/users/[id] - Détail d'un utilisateur
 * PATCH /api/superadmin/users/[id] - Modifier un utilisateur
 * DELETE /api/superadmin/users/[id] - Supprimer un utilisateur
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request)
    
    if (!context.isSuperAdmin) {
      return createErrorResponse('Non autorisé', 403)
    }

    const { id } = await params

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        cabinet: {
          select: {
            id: true,
            name: true,
            plan: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Erreur récupération utilisateur:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request)
    
    if (!context.isSuperAdmin) {
      return createErrorResponse('Non autorisé', 403)
    }

    const superAdmin = await prisma.superAdmin.findUnique({
      where: { email: context.user.email! },
    })

    if (!superAdmin || !superAdmin.isActive) {
      return createErrorResponse('Accès refusé', 403)
    }

    const { id } = await params
    const body = await request.json()
    const { isActive, role, firstName, lastName } = body

    // Vérifier que l'utilisateur existe
    const existingUser = await prisma.user.findUnique({
      where: { id },
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    // Construire les données de mise à jour
    const updateData: Record<string, unknown> = {}
    
    if (typeof isActive === 'boolean') {
      updateData.isActive = isActive
    }
    
    if (role) {
      updateData.role = role
    }
    
    if (firstName) {
      updateData.firstName = firstName
    }
    
    if (lastName) {
      updateData.lastName = lastName
    }

    // Mettre à jour l'utilisateur
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
    })

    // Log d'audit
    await prisma.auditLog.create({
      data: {
        superAdminId: superAdmin.id,
        cabinetId: existingUser.cabinetId,
        userId: id,
        action: 'MODIFICATION',
        entityType: 'User',
        entityId: id,
        changes: {
          before: {
            isActive: existingUser.isActive,
            role: existingUser.role,
            firstName: existingUser.firstName,
            lastName: existingUser.lastName,
          },
          after: updateData,
        } as unknown as import('@prisma/client').Prisma.InputJsonValue,
      },
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
      },
    })
  } catch (error) {
    console.error('Erreur modification utilisateur:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request)
    
    if (!context.isSuperAdmin) {
      return createErrorResponse('Non autorisé', 403)
    }

    const superAdmin = await prisma.superAdmin.findUnique({
      where: { email: context.user.email! },
    })

    if (!superAdmin || !superAdmin.isActive) {
      return createErrorResponse('Accès refusé', 403)
    }

    const { id } = await params

    // Vérifier que l'utilisateur existe
    const existingUser = await prisma.user.findUnique({
      where: { id },
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    // Soft delete - désactiver l'utilisateur
    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    })

    // Log d'audit
    await prisma.auditLog.create({
      data: {
        superAdminId: superAdmin.id,
        cabinetId: existingUser.cabinetId,
        userId: id,
        action: 'SUPPRESSION',
        entityType: 'User',
        entityId: id,
        changes: {
          deleted: true,
          email: existingUser.email,
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Utilisateur désactivé',
    })
  } catch (error) {
    console.error('Erreur suppression utilisateur:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
