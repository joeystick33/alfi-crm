 
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import { prisma } from '@/app/_common/lib/prisma'
import { createClient } from '@/app/_common/lib/supabase/server'
import bcrypt from 'bcryptjs'
import { logger } from '@/app/_common/lib/logger'
// GET - Récupérer le profil de l'utilisateur connecté
export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    const { user } = context

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        avatar: true,
        isActive: true,
        createdAt: true,
        lastLogin: true,
        preferences: true,
        cabinet: {
          select: {
            id: true,
            name: true,
            plan: true,
            status: true,
          }
        }
      }
    })

    if (!fullUser) {
      return NextResponse.json(
        { error: 'Utilisateur introuvable' },
        { status: 404 }
      )
    }

    return NextResponse.json(fullUser)
  } catch (error: any) {
    logger.error('Get profile error:', { error: error instanceof Error ? error.message : String(error) })

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Erreur lors de la récupération du profil' },
      { status: 500 }
    )
  }
}

// PATCH - Mettre à jour le profil
export async function PATCH(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    const { user } = context

    const body = await request.json()
    const { firstName, lastName, phone, avatar, preferences } = body

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(phone !== undefined && { phone }),
        ...(avatar !== undefined && { avatar }),
        ...(preferences && { preferences }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        avatar: true,
        preferences: true,
      }
    })

    // Mettre à jour les métadonnées Supabase
    const supabase = await createClient()
    await supabase.auth.updateUser({
      data: {
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
      }
    })

    return NextResponse.json({
      success: true,
      user: updatedUser
    })
  } catch (error: any) {
    logger.error('Update profile error:', { error: error instanceof Error ? error.message : String(error) })

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du profil' },
      { status: 500 }
    )
  }
}

// POST - Changer le mot de passe
export async function POST(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    const { user } = context

    const body = await request.json()
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Mot de passe actuel et nouveau mot de passe requis' },
        { status: 400 }
      )
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Le nouveau mot de passe doit contenir au moins 8 caractères' },
        { status: 400 }
      )
    }

    // Récupérer l'utilisateur avec le hash du mot de passe
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { password: true, email: true }
    })

    if (!fullUser || !fullUser.password) {
      return NextResponse.json(
        { error: 'Utilisateur introuvable' },
        { status: 404 }
      )
    }

    // Vérifier le mot de passe actuel
    const isValid = await bcrypt.compare(currentPassword, fullUser.password)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Mot de passe actuel incorrect' },
        { status: 401 }
      )
    }

    // Hasher le nouveau mot de passe
    const newPasswordHash = await bcrypt.hash(newPassword, 12)

    // Mettre à jour dans Prisma
    await prisma.user.update({
      where: { id: user.id },
      data: { password: newPasswordHash }
    })

    // Mettre à jour dans Supabase
    const supabase = await createClient()
    const { error: authError } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (authError) {
      logger.error('Erreur Supabase password update: ' + authError.message)
      // On continue, le mot de passe Prisma est mis à jour
    }

    return NextResponse.json({
      success: true,
      message: 'Mot de passe mis à jour avec succès'
    })
  } catch (error: any) {
    logger.error('Change password error:', { error: error instanceof Error ? error.message : String(error) })

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Erreur lors du changement de mot de passe' },
      { status: 500 }
    )
  }
}
