import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/app/_common/lib/auth-helpers'
import { prisma } from '@/app/_common/lib/prisma'

/**
 * API SuperAdmin - Gestion d'un Client spécifique
 * GET /api/superadmin/clients/[id] - Détails d'un client
 * DELETE /api/superadmin/clients/[id] - Supprimer un client
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireSuperAdmin(request)
    const { id: clientId } = await params

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        cabinet: {
          select: {
            id: true,
            name: true,
            plan: true,
          },
        },
        conseiller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    if (!client) {
      return NextResponse.json({ error: 'Client non trouvé' }, { status: 404 })
    }

    return NextResponse.json({ client })
  } catch (error: any) {
    console.error('Erreur détail client:', error)
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    if (error.message === 'Forbidden: SuperAdmin access required') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireSuperAdmin(request)
    const { id: clientId } = await params

    // Vérifier que le client existe
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true, firstName: true, lastName: true, cabinetId: true },
    })

    if (!client) {
      return NextResponse.json({ error: 'Client non trouvé' }, { status: 404 })
    }

    // Récupérer le superadmin pour l'audit
    const superAdmin = await prisma.superAdmin.findUnique({
      where: { email: context.user.email! },
    })

    // Supprimer le client (cascade configurée dans Prisma)
    await prisma.client.delete({
      where: { id: clientId },
    })

    // Log d'audit
    if (superAdmin) {
      await prisma.auditLog.create({
        data: {
          superAdminId: superAdmin.id,
          cabinetId: client.cabinetId,
          action: 'SUPPRESSION',
          entityType: 'Client',
          entityId: clientId,
          changes: {
            deleted: {
              firstName: client.firstName,
              lastName: client.lastName,
            },
            reason: 'SuperAdmin maintenance',
          },
        },
      })
    }

    return NextResponse.json({ success: true, message: 'Client supprimé' })
  } catch (error: any) {
    console.error('Erreur suppression client:', error)
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    if (error.message === 'Forbidden: SuperAdmin access required') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
