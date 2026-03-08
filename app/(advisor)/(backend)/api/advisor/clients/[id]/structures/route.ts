/**
 * API Route: /api/advisor/clients/[id]/structures
 * Gestion des structures juridiques (SCI, Holding, SARL, etc.)
 * Next.js 14 App Router - Route Handlers
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import { getPrismaClient } from '@/app/_common/lib/prisma'
import { z } from 'zod'
import { logger } from '@/app/_common/lib/logger'
// ============================================================================
// Validation Schema
// ============================================================================

const structureSchema = z.object({
  type: z.enum(['SCI', 'HOLDING', 'SARL', 'SAS', 'EURL', 'AUTRE']),
  name: z.string().min(1, 'Nom requis'),
  siret: z.string().optional().nullable(),
  ownership: z.number().min(0).max(100).optional(),
  role: z.string().optional(),
})

// ============================================================================
// GET - Liste des structures juridiques du client
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { id: clientId } = await params
    const prisma = getPrismaClient(context.cabinetId, context.isSuperAdmin)

    // Vérifier que le client appartient au cabinet
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        cabinetId: context.cabinetId,
      },
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Client non trouvé', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    // Récupérer les structures du client (stockées dans le champ JSON details ou table dédiée)
    // Pour l'instant, on utilise un champ JSON sur le client
    const structures = (client as Record<string, unknown>).legalStructures || []

    return NextResponse.json({
      success: true,
      data: Array.isArray(structures) ? structures : [],
    })

  } catch (error) {
    logger.error('Erreur GET /structures:', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { error: 'Erreur serveur', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST - Créer une structure juridique
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { id: clientId } = await params
    const body = await request.json()
    const prisma = getPrismaClient(context.cabinetId, context.isSuperAdmin)

    // Validation
    const validation = structureSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Données invalides',
          code: 'VALIDATION_ERROR',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    // Vérifier que le client appartient au cabinet
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        cabinetId: context.cabinetId,
      },
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Client non trouvé', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    // Récupérer les structures existantes
    // LE CHAMP DETAILS N'EXISTE PAS DANS LE SCHEMA CLIENT ACTUEL
    // TODO: Ajouter le champ details ou legalStructures dans le schéma Prisma

    return NextResponse.json(
      { error: 'Fonctionnalité non implémentée (Modèle de données manquant)', code: 'NOT_IMPLEMENTED' },
      { status: 501 }
    )

    /*
    const existingStructures = ((client as Record<string, unknown>).legalStructures as unknown[]) || []
    
    // Créer la nouvelle structure avec un ID unique
    const newStructure = {
      id: `struct_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      ...validation.data,
      createdAt: new Date().toISOString(),
    }

    // Mettre à jour le client avec la nouvelle structure
    await prisma.client.update({
      where: { id: clientId },
      data: {
        // Stocker dans un champ JSON (nécessite un champ legalStructures dans le schéma)
        // Pour l'instant, on stocke dans details si legalStructures n'existe pas
        details: {
          ...(client.details as Record<string, unknown> || {}),
          legalStructures: [...(Array.isArray(existingStructures) ? existingStructures : []), newStructure],
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: newStructure,
      message: 'Structure ajoutée avec succès',
    }, { status: 201 })
    */

  } catch (error) {
    logger.error('Erreur POST /structures:', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { error: 'Erreur serveur', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
