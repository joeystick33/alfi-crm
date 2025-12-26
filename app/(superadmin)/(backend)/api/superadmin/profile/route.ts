import { NextResponse } from 'next/server'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import { prisma } from '@/app/_common/lib/prisma'

export async function GET() {
  try {
    const context = await requireAuth()
    const { user } = context

    if (!context.isSuperAdmin) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const profile = await prisma.superAdmin.findFirst({
      where: {
        OR: [
          { id: user.id as string },
          user.email ? { email: user.email.toLowerCase() } : undefined,
        ].filter((x): x is { id: string } | { email: string } => Boolean(x)),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true,
        permissions: true,
        isActive: true,
        createdAt: true,
        lastLogin: true,
      },
    })

    if (!profile) {
      return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Get superadmin profile error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
