import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, createErrorResponse } from '@/app/_common/lib/auth-helpers'
import { prisma } from '@/app/_common/lib/prisma'

/**
 * API SuperAdmin - Intégration spécifique
 * PUT /api/superadmin/integrations/[id] - Modifier une intégration
 * DELETE /api/superadmin/integrations/[id] - Supprimer une intégration
 */

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { id: integrationId } = await params
    
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
    const { config } = body

    // Sauvegarder la config de l'intégration
    for (const [key, value] of Object.entries(config)) {
      const configKey = `${integrationId}_${key}`
      const existing = await prisma.systemConfig.findFirst({
        where: { key: configKey },
      })

      if (existing) {
        await prisma.systemConfig.update({
          where: { id: existing.id },
          data: { value: value as string, updatedById: superAdmin.id },
        })
      } else {
        await prisma.systemConfig.create({
          data: {
            key: configKey,
            value: value as string,
            category: 'integrations',
            updatedById: superAdmin.id,
          },
        })
      }
    }

    // Log d'audit
    await prisma.auditLog.create({
      data: {
        superAdminId: superAdmin.id,
        action: 'MODIFICATION',
        entityType: 'Integration',
        entityId: integrationId,
        changes: { integrationId, configKeys: Object.keys(config) },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur modification intégration:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { id: integrationId } = await params
    
    if (!context.isSuperAdmin) {
      return createErrorResponse('Non autorisé', 403)
    }

    const superAdmin = await prisma.superAdmin.findUnique({
      where: { email: context.user.email! },
    })

    if (!superAdmin || !superAdmin.isActive) {
      return createErrorResponse('Accès refusé', 403)
    }

    // Supprimer toutes les configs de cette intégration
    await prisma.systemConfig.deleteMany({
      where: {
        key: { startsWith: `${integrationId}_` },
        category: 'integrations',
      },
    })

    // Log d'audit
    await prisma.auditLog.create({
      data: {
        superAdminId: superAdmin.id,
        action: 'SUPPRESSION',
        entityType: 'Integration',
        entityId: integrationId,
        changes: { integrationId },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur suppression intégration:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
