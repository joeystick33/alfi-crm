 
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import { prisma } from '@/app/_common/lib/prisma'
import { createAdminClient } from '@/app/_common/lib/supabase/server'
import bcrypt from 'bcryptjs'
import { logger } from '@/app/_common/lib/logger'
// GET - Récupérer l'assistant du conseiller connecté
export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    const { user, cabinetId } = context

    // Seuls les conseillers peuvent avoir un assistant attitré
    if (user.role !== 'ADVISOR') {
      return NextResponse.json(
        { error: 'Cette fonctionnalité est réservée aux conseillers' },
        { status: 403 }
      )
    }

    // Chercher l'assignment de l'assistant
    const assignment = await prisma.assistantAssignment.findFirst({
      where: {
        cabinetId: cabinetId!,
        advisorId: user.id,
      },
      include: {
        assistant: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            isActive: true,
            createdAt: true,
            lastLogin: true,
          }
        }
      }
    })

    if (!assignment) {
      return NextResponse.json({ assistant: null, hasAssistant: false })
    }

    return NextResponse.json({
      assistant: assignment.assistant,
      hasAssistant: true,
      permissions: assignment.permissions,
    })
  } catch (error: any) {
    logger.error('Get assistant error:', { error: error instanceof Error ? error.message : String(error) })

    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Erreur lors de la récupération de l\'assistant' },
      { status: 500 }
    )
  }
}

// POST - Créer un assistant pour le conseiller connecté
export async function POST(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    const { user, cabinetId } = context

    // Seuls les conseillers peuvent créer leur assistant
    if (user.role !== 'ADVISOR') {
      return NextResponse.json(
        { error: 'Cette fonctionnalité est réservée aux conseillers' },
        { status: 403 }
      )
    }

    // Vérifier si le conseiller a déjà un assistant
    const existingAssignment = await prisma.assistantAssignment.findFirst({
      where: {
        cabinetId: cabinetId!,
        advisorId: user.id,
      }
    })

    if (existingAssignment) {
      return NextResponse.json(
        { error: 'Vous avez déjà un assistant. Supprimez-le d\'abord pour en créer un nouveau.' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { email, password, firstName, lastName, phone, permissions } = body

    // Validation
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Email, mot de passe, prénom et nom sont requis' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 8 caractères' },
        { status: 400 }
      )
    }

    // Vérifier que l'email n'existe pas déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Cet email est déjà utilisé' },
        { status: 409 }
      )
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 12)

    // Créer l'assistant dans Prisma
    const assistant = await prisma.user.create({
      data: {
        cabinetId: cabinetId!,
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone || null,
        role: 'ASSISTANT',
        permissions: permissions || {
          canViewClients: true,
          canEditClients: false,
          canViewDocuments: true,
          canUploadDocuments: false,
          canViewCalendar: true,
          canManageCalendar: false,
        },
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true,
        createdAt: true,
      }
    })

    // Créer l'assignment
    await prisma.assistantAssignment.create({
      data: {
        cabinetId: cabinetId!,
        assistantId: assistant.id,
        advisorId: user.id,
        permissions: permissions || {},
      }
    })

    // Créer dans Supabase Auth
    const supabase = createAdminClient()
    const { error: authError } = await supabase.auth.admin.createUser({
      email: email.toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: {
        firstName,
        lastName,
        role: 'ASSISTANT',
        cabinetId,
        linkedAdvisorId: user.id,
        isSuperAdmin: false,
      }
    })

    if (authError) {
      logger.error('Erreur Supabase Auth: ' + authError.message)
      // Continue - l'assistant pourra se créer à la première connexion
    }

    return NextResponse.json({
      success: true,
      assistant,
      message: `${firstName} peut maintenant se connecter avec son email et mot de passe`
    })
  } catch (error: any) {
    logger.error('Create assistant error:', { error: error instanceof Error ? error.message : String(error) })

    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'assistant' },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer l'assistant du conseiller
export async function DELETE(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    const { user, cabinetId } = context

    if (user.role !== 'ADVISOR') {
      return NextResponse.json(
        { error: 'Cette fonctionnalité est réservée aux conseillers' },
        { status: 403 }
      )
    }

    // Trouver l'assignment
    const assignment = await prisma.assistantAssignment.findFirst({
      where: {
        cabinetId: cabinetId!,
        advisorId: user.id,
      }
    })

    if (!assignment) {
      return NextResponse.json(
        { error: 'Vous n\'avez pas d\'assistant à supprimer' },
        { status: 404 }
      )
    }

    // Supprimer l'assignment
    await prisma.assistantAssignment.delete({
      where: { id: assignment.id }
    })

    // Supprimer l'utilisateur assistant
    await prisma.user.delete({
      where: { id: assignment.assistantId }
    })

    // Supprimer de Supabase Auth si possible
    const supabase = createAdminClient()
    const { data: users } = await supabase.auth.admin.listUsers()
    const supabaseUser = users?.users?.find(u => u.id === assignment.assistantId)
    if (supabaseUser) {
      await supabase.auth.admin.deleteUser(supabaseUser.id)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    logger.error('Delete assistant error:', { error: error instanceof Error ? error.message : String(error) })

    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Erreur lors de la suppression de l\'assistant' },
      { status: 500 }
    )
  }
}
