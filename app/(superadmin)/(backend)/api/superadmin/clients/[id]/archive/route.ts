import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/app/_common/lib/auth-helpers'
import { prisma } from '@/app/_common/lib/prisma'

/**
 * API SuperAdmin - Archiver un Client
 * POST /api/superadmin/clients/[id]/archive - Archiver un client
 */

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireSuperAdmin(request)
    const { id: clientId } = await params

    // Vérifier que le client existe
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true, firstName: true, lastName: true, status: true, cabinetId: true },
    })

    if (!client) {
      return NextResponse.json({ error: 'Client non trouvé' }, { status: 404 })
    }

    // Récupérer le superadmin pour l'audit
    const superAdmin = await prisma.superAdmin.findUnique({
      where: { email: context.user.email! },
    })

    // Archiver le client
    const updatedClient = await prisma.client.update({
      where: { id: clientId },
      data: {
        status: 'ARCHIVE',
        updatedAt: new Date(),
      },
    })

    // Log d'audit
    if (superAdmin) {
      await prisma.auditLog.create({
        data: {
          superAdminId: superAdmin.id,
          cabinetId: client.cabinetId,
          action: 'MODIFICATION',
          entityType: 'Client',
          entityId: clientId,
          changes: {
            field: 'status',
            oldValue: client.status,
            newValue: 'ARCHIVE',
            reason: 'SuperAdmin maintenance',
          },
        },
      })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Client archivé',
      client: {
        id: updatedClient.id,
        status: updatedClient.status,
      }
    })
  } catch (error: any) {
    console.error('Erreur archivage client:', error)
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    if (error.message === 'Forbidden: SuperAdmin access required') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
