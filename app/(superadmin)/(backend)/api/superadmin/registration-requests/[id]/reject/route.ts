import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, createErrorResponse } from '@/app/_common/lib/auth-helpers'
import { prisma } from '@/app/_common/lib/prisma'

/**
 * API SuperAdmin - Rejeter une demande d'inscription
 * POST /api/superadmin/registration-requests/[id]/reject
 */

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { id: requestId } = await params
    
    if (!context.isSuperAdmin) {
      return createErrorResponse('Non autorisé', 403)
    }

    const superAdmin = await prisma.superAdmin.findUnique({
      where: { email: context.user.email! },
    })

    if (!superAdmin || !superAdmin.isActive) {
      return createErrorResponse('Accès refusé', 403)
    }

    const body = await request.json()
    const { reason } = body

    if (!reason || !reason.trim()) {
      return NextResponse.json(
        { error: 'Le motif de rejet est obligatoire' },
        { status: 400 }
      )
    }

    // Récupérer la demande
    const registrationRequest = await prisma.registrationRequest.findUnique({
      where: { id: requestId },
    })

    if (!registrationRequest) {
      return NextResponse.json(
        { error: 'Demande non trouvée' },
        { status: 404 }
      )
    }

    if (registrationRequest.status !== 'EN_ATTENTE') {
      return NextResponse.json(
        { error: 'Cette demande a déjà été traitée' },
        { status: 400 }
      )
    }

    // Mettre à jour la demande
    await prisma.registrationRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJETEE',
        processedAt: new Date(),
        processedBy: superAdmin.id,
        rejectReason: reason,
      },
    })

    // Log d'audit
    await prisma.auditLog.create({
      data: {
        superAdminId: superAdmin.id,
        action: 'MODIFICATION',
        entityType: 'RegistrationRequest',
        entityId: requestId,
        changes: {
          rejected: true,
          reason,
          cabinetName: registrationRequest.cabinetName,
          adminEmail: registrationRequest.adminEmail,
        },
      },
    })

    // TODO: Envoyer un email de notification au demandeur

    return NextResponse.json({
      success: true,
      message: 'Demande rejetée',
    })
  } catch (error) {
    console.error('Erreur rejet demande:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
