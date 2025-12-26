 
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import { prisma } from '@/app/_common/lib/prisma'
import { UserService } from '@/app/_common/lib/services/user-service'

// GET - Récupérer un utilisateur
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { userId } = await params

    const user = await prisma.user.findFirst({
      where: { 
        id: userId,
        cabinetId: context.cabinetId!
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        phone: true,
        createdAt: true,
        lastLogin: true,
        permissions: true,
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur introuvable' },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (error: any) {
    console.error('Get user error:', error)

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Erreur lors de la récupération de l\'utilisateur' },
      { status: 500 }
    )
  }
}

// PATCH - Mettre à jour un utilisateur
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { user, isSuperAdmin } = context

    // Vérifier que l'utilisateur est ADMIN du cabinet (ou SuperAdmin)
    if (user.role !== 'ADMIN' && !isSuperAdmin) {
      return NextResponse.json(
        { error: 'Seuls les administrateurs peuvent modifier des utilisateurs' },
        { status: 403 }
      )
    }

    const { userId } = await params
    const body = await request.json()
    const { firstName, lastName, role, isActive, phone, permissions } = body

    // Vérifier que l'utilisateur existe dans le cabinet
    const existingUser = await prisma.user.findFirst({
      where: { 
        id: userId,
        cabinetId: context.cabinetId!
      }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Utilisateur introuvable' },
        { status: 404 }
      )
    }

    // Protection de l'admin principal
    if (existingUser.role === 'ADMIN') {
      // Trouver l'admin primaire (le plus ancien admin du cabinet)
      const primaryAdmin = await prisma.user.findFirst({
        where: {
          cabinetId: context.cabinetId!,
          role: 'ADMIN',
        },
        orderBy: { createdAt: 'asc' },
        select: { id: true }
      })

      const isPrimaryAdmin = primaryAdmin?.id === userId
      const isModifyingSelf = userId === user.id

      if (isPrimaryAdmin && !isSuperAdmin && !isModifyingSelf) {
        // Admin secondaire essaie de modifier l'admin principal
        return NextResponse.json(
          { error: 'Vous ne pouvez pas modifier l\'administrateur principal' },
          { status: 403 }
        )
      }

      // Empêcher la désactivation de l'admin principal par un admin secondaire
      if (isPrimaryAdmin && isActive === false && !isSuperAdmin) {
        return NextResponse.json(
          { error: 'L\'administrateur principal ne peut pas être désactivé' },
          { status: 403 }
        )
      }

      // Ne pas permettre de changer le rôle d'un admin (sauf SuperAdmin)
      if (role && role !== 'ADMIN' && !isSuperAdmin) {
        return NextResponse.json(
          { error: 'Vous ne pouvez pas modifier le rôle d\'un administrateur' },
          { status: 403 }
        )
      }
    }

    // Mettre à jour l'utilisateur
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(role && { role }),
        ...(isActive !== undefined && { isActive }),
        ...(phone !== undefined && { phone }),
        ...(permissions && { permissions }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        phone: true,
        permissions: true,
      }
    })

    return NextResponse.json({
      success: true,
      user: updatedUser
    })
  } catch (error: any) {
    console.error('Update user error:', error)

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de l\'utilisateur' },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer un utilisateur
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { user, isSuperAdmin } = context

    // Vérifier que l'utilisateur est ADMIN du cabinet (ou SuperAdmin)
    if (user.role !== 'ADMIN' && !isSuperAdmin) {
      return NextResponse.json(
        { error: 'Seuls les administrateurs peuvent supprimer des utilisateurs' },
        { status: 403 }
      )
    }

    const { userId } = await params
    const userService = new UserService(context.cabinetId!, user.id, isSuperAdmin)

    // Récupérer l'utilisateur à supprimer
    const userToDelete = await userService.getUserById(userId)

    if (!userToDelete) {
      return NextResponse.json(
        { error: 'Utilisateur introuvable' },
        { status: 404 }
      )
    }

    // Logique spéciale pour les administrateurs
    if (userToDelete.role === 'ADMIN') {
      // Trouver l'admin primaire (le plus ancien admin du cabinet)
      const primaryAdmin = await prisma.user.findFirst({
        where: {
          cabinetId: context.cabinetId!,
          role: 'ADMIN',
        },
        orderBy: { createdAt: 'asc' },
        select: { id: true, email: true }
      })

      const isPrimaryAdmin = primaryAdmin?.id === userId

      if (isPrimaryAdmin) {
        // L'admin primaire ne peut être supprimé que par un SuperAdmin
        if (!isSuperAdmin) {
          return NextResponse.json(
            { error: 'L\'administrateur principal ne peut être supprimé que par le support Aura. Contactez-nous.' },
            { status: 403 }
          )
        }
      } else {
        // Admin secondaire - peut être supprimé par un admin du cabinet
        // mais pas par lui-même
        if (userId === user.id) {
          return NextResponse.json(
            { error: 'Vous ne pouvez pas vous supprimer vous-même' },
            { status: 403 }
          )
        }
      }
    }

    // Supprimer l'utilisateur via le service
    await userService.deleteUser(userId)

    // Mettre à jour l'usage du cabinet
    const cabinet = await prisma.cabinet.findUnique({
      where: { id: context.cabinetId! },
      include: {
        _count: { select: { users: true } }
      }
    })

    if (cabinet) {
      await prisma.cabinet.update({
        where: { id: context.cabinetId! },
        data: {
          usage: {
            ...(cabinet.usage as any),
            users: cabinet._count.users,
          },
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete user error:', error)

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Erreur lors de la suppression de l\'utilisateur' },
      { status: 500 }
    )
  }
}
