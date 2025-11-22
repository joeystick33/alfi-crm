import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/supabase/auth-helpers'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const user = await requireAuth()

    // Vérifier que l'utilisateur est ADMIN du cabinet
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Seuls les administrateurs peuvent supprimer des utilisateurs' },
        { status: 403 }
      )
    }

    const { userId } = params

    // Récupérer l'utilisateur à supprimer
    const userToDelete = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!userToDelete) {
      return NextResponse.json(
        { error: 'Utilisateur introuvable' },
        { status: 404 }
      )
    }

    // Vérifier que c'est bien un utilisateur du même cabinet
    if (userToDelete.cabinetId !== user.cabinetId) {
      return NextResponse.json(
        { error: 'Vous ne pouvez supprimer que les utilisateurs de votre cabinet' },
        { status: 403 }
      )
    }

    // Ne pas permettre de supprimer un autre admin
    if (userToDelete.role === 'ADMIN') {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas supprimer un administrateur' },
        { status: 403 }
      )
    }

    // Supprimer l'utilisateur
    await prisma.user.delete({
      where: { id: userId },
    })

    // Mettre à jour l'usage du cabinet
    const cabinet = await prisma.cabinet.findUnique({
      where: { id: user.cabinetId! },
      include: {
        _count: { select: { users: true } }
      }
    })

    if (cabinet) {
      await prisma.cabinet.update({
        where: { id: user.cabinetId! },
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
