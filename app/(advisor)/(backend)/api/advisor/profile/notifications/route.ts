 
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import { prisma } from '@/app/_common/lib/prisma'

// Préférences de notification par défaut
const DEFAULT_NOTIFICATION_PREFERENCES = {
  email: true,
  tasks: true,
  appointments: true,
  clients: false,
  marketing: false,
}

// GET - Récupérer les préférences de notification
export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    const { user } = context

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { preferences: true }
    })

    const preferences = fullUser?.preferences as any || {}
    const notificationPreferences = preferences.notifications || DEFAULT_NOTIFICATION_PREFERENCES

    return NextResponse.json(notificationPreferences)
  } catch (error: any) {
    console.error('Get notification preferences error:', error)

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Erreur lors de la récupération des préférences' },
      { status: 500 }
    )
  }
}

// PATCH - Mettre à jour les préférences de notification
export async function PATCH(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    const { user } = context

    const body = await request.json()

    // Récupérer les préférences actuelles
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { preferences: true }
    })

    const currentPreferences = fullUser?.preferences as any || {}
    const currentNotifications = currentPreferences.notifications || DEFAULT_NOTIFICATION_PREFERENCES

    // Fusionner avec les nouvelles valeurs
    const updatedNotifications = {
      ...currentNotifications,
      ...body,
    }

    // Mettre à jour
    await prisma.user.update({
      where: { id: user.id },
      data: {
        preferences: {
          ...currentPreferences,
          notifications: updatedNotifications,
        }
      }
    })

    return NextResponse.json({
      success: true,
      notifications: updatedNotifications
    })
  } catch (error: any) {
    console.error('Update notification preferences error:', error)

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour des préférences' },
      { status: 500 }
    )
  }
}
