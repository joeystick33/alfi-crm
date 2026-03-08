/**
 * API Route: /api/advisor/structures/[id]
 * Gestion d'une structure juridique individuelle (DELETE)
 * Next.js 14 App Router - Route Handlers
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import { getPrismaClient } from '@/app/_common/lib/prisma'
import { logger } from '@/app/_common/lib/logger'
// ============================================================================
// DELETE - Supprimer une structure juridique
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { id: structureId } = await params
    const prisma = getPrismaClient(context.cabinetId, context.isSuperAdmin)

    // Trouver le client qui contient cette structure
    // Les structures sont stockées dans le champ details.legalStructures
    // Trouver le client qui contient cette structure
    // Les structures sont stockées dans le champ details.legalStructures
    // CHAMP DETAILS MANQUANT DANS LE SCHEMA ACTUEL

    return NextResponse.json(
      { error: 'Fonctionnalité non implémentée (Modèle de données manquant)', code: 'NOT_IMPLEMENTED' },
      { status: 501 }
    )

    /*
    const clients = await prisma.client.findMany({
      where: {
        cabinetId: context.cabinetId,
      },
    })

    let found = false
    for (const client of clients) {
      const details = (client.details as Record<string, unknown>) || {}
      const structures = (details.legalStructures as Array<{ id: string }>) || []
      
      const structureIndex = structures.findIndex(s => s.id === structureId)
      if (structureIndex !== -1) {
        // Supprimer la structure
        structures.splice(structureIndex, 1)
        
        await prisma.client.update({
          where: { id: client.id },
          data: {
            details: {
              ...details,
              legalStructures: structures,
            },
          },
        })
        
        found = true
        break
      }
    }

    if (!found) {
      return NextResponse.json(
        { error: 'Structure non trouvée', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }
    */

    return NextResponse.json({
      success: true,
      message: 'Structure supprimée avec succès',
    })

  } catch (error) {
    logger.error('Erreur DELETE /structures/[id]:', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { error: 'Erreur serveur', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
