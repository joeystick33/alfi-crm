/**
 * API Route: /api/auth/update-password
 * POST - Met à jour le mot de passe dans Prisma après un reset via Supabase
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/app/_common/lib/supabase/server'
import { prisma } from '@/app/_common/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 8 caractères' },
        { status: 400 }
      )
    }

    // Récupérer l'utilisateur connecté via Supabase
    const supabase = await createClient()
    const { data: { user: supabaseUser }, error: authError } = await supabase.auth.getUser()

    if (authError || !supabaseUser?.email) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const email = supabaseUser.email.toLowerCase()
    const hashedPassword = await bcrypt.hash(password, 10)

    // Déterminer le type d'utilisateur et mettre à jour le mot de passe
    const metadata = supabaseUser.user_metadata || {}

    if (metadata.isSuperAdmin) {
      // SuperAdmin
      await prisma.superAdmin.updateMany({
        where: { email },
        data: { password: hashedPassword },
      })
    } else if (metadata.isClient) {
      // Client
      await prisma.client.updateMany({
        where: { email },
        data: { portalPassword: hashedPassword },
      })
    } else {
      // User (conseiller, admin, assistant)
      await prisma.user.updateMany({
        where: { email },
        data: { password: hashedPassword },
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Mot de passe mis à jour',
    })

  } catch (error) {
    console.error('Update password error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du mot de passe' },
      { status: 500 }
    )
  }
}
