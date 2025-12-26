/**
 * API Route: /api/advisor/clients/[id]/portal-access
 * POST - Active l'accès portail pour un client et crée son compte Supabase
 * DELETE - Désactive l'accès portail
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { getPrismaClient } from '@/app/_common/lib/prisma'
import { createAdminClient } from '@/app/_common/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    const { id: clientId } = await params

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const prisma = getPrismaClient(context.cabinetId, context.isSuperAdmin)

    // Récupérer le client
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        cabinetId: context.cabinetId,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        portalAccess: true,
        portalPassword: true,
      },
    })

    if (!client) {
      return createErrorResponse('Client non trouvé', 404)
    }

    if (!client.email) {
      return createErrorResponse('Le client doit avoir une adresse email pour accéder au portail', 400)
    }

    // Si l'accès est déjà activé
    if (client.portalAccess && client.portalPassword) {
      return NextResponse.json({
        success: true,
        message: 'L\'accès portail est déjà activé pour ce client',
        alreadyEnabled: true,
      })
    }

    // Créer l'utilisateur dans Supabase Auth avec invitation par email
    const supabase = createAdminClient()
    
    // Utiliser inviteUserByEmail pour que Supabase envoie l'email de création de mot de passe
    const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
      client.email.toLowerCase(),
      {
        data: {
          firstName: client.firstName,
          lastName: client.lastName,
          role: 'CLIENT',
          cabinetId: context.cabinetId,
          isClient: true,
          prismaClientId: client.id,
        },
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/portal`,
      }
    )

    if (inviteError) {
      // Si l'utilisateur existe déjà, on peut quand même activer l'accès
      if (!inviteError.message.includes('already') && !inviteError.message.includes('exists')) {
        console.error('Erreur Supabase invitation:', inviteError)
        return createErrorResponse(`Erreur lors de l'envoi de l'invitation: ${inviteError.message}`, 500)
      }
    }

    // Mettre à jour le client dans Prisma
    // On ne stocke pas de mot de passe hashé ici car Supabase gère l'authentification
    await prisma.client.update({
      where: { id: clientId },
      data: {
        portalAccess: true,
        // Le portalPassword sera mis à jour lors de la première connexion si nécessaire
      },
    })

    return NextResponse.json({
      success: true,
      message: `Un email d'invitation a été envoyé à ${client.email}. Le client pourra créer son mot de passe et accéder au portail.`,
      invitationSent: true,
      email: client.email,
    })

  } catch (error: unknown) {
    console.error('Error enabling portal access:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    return createErrorResponse('Erreur lors de l\'activation de l\'accès portail', 500)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    const { id: clientId } = await params

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const prisma = getPrismaClient(context.cabinetId, context.isSuperAdmin)

    // Récupérer le client
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        cabinetId: context.cabinetId,
      },
      select: {
        id: true,
        email: true,
        portalAccess: true,
      },
    })

    if (!client) {
      return createErrorResponse('Client non trouvé', 404)
    }

    // Désactiver l'accès dans Prisma
    await prisma.client.update({
      where: { id: clientId },
      data: {
        portalAccess: false,
        portalPassword: null,
      },
    })

    // Optionnel: Supprimer ou désactiver l'utilisateur dans Supabase
    if (client.email) {
      try {
        const supabase = createAdminClient()
        const { data: users } = await supabase.auth.admin.listUsers()
        const supabaseUser = users?.users?.find(
          u => u.email?.toLowerCase() === client.email?.toLowerCase()
        )
        
        if (supabaseUser) {
          // Désactiver plutôt que supprimer pour conserver l'historique
          await supabase.auth.admin.updateUserById(supabaseUser.id, {
            user_metadata: { ...supabaseUser.user_metadata, portalAccessRevoked: true },
            ban_duration: 'none', // ou une durée si on veut bannir temporairement
          })
        }
      } catch (supabaseError) {
        console.error('Erreur désactivation Supabase:', supabaseError)
        // Continue - l'accès Prisma est déjà révoqué
      }
    }

    return createSuccessResponse({
      message: 'Accès portail désactivé',
    })

  } catch (error: unknown) {
    console.error('Error disabling portal access:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    return createErrorResponse('Erreur lors de la désactivation de l\'accès portail', 500)
  }
}

// GET - Vérifier le statut de l'accès portail
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    const { id: clientId } = await params

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const prisma = getPrismaClient(context.cabinetId, context.isSuperAdmin)

    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        cabinetId: context.cabinetId,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        portalAccess: true,
        lastPortalLogin: true,
      },
    })

    if (!client) {
      return createErrorResponse('Client non trouvé', 404)
    }

    return NextResponse.json({
      portalAccess: client.portalAccess,
      hasEmail: !!client.email,
      email: client.email,
      lastLogin: client.lastPortalLogin,
      canEnable: !!client.email,
    })

  } catch (error: unknown) {
    console.error('Error fetching portal access status:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    return createErrorResponse('Erreur lors de la récupération du statut', 500)
  }
}
