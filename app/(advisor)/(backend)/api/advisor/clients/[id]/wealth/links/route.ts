 
/**
 * API Route: /api/advisor/clients/[id]/wealth/links
 * Gestion des liens Actifs ↔ Passifs
 * Next.js 14 App Router - Route Handlers
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import { prisma } from '@/app/_common/lib/prisma'
import { z } from 'zod'
import {
  buildAssetLiabilityLinks,
  validateAssetLiabilityLink,
} from '@/app/_common/lib/services/wealth-service'

// ============================================================================
// Validation Schemas
// ============================================================================

const createLinkSchema = z.object({
  actifId: z.string().min(1, 'actifId requis'),
  passifId: z.string().min(1, 'passifId requis'),
})

const deleteLinkSchema = z.object({
  actifId: z.string().optional(),
  passifId: z.string().optional(),
}).refine(data => data.actifId || data.passifId, {
  message: 'actifId ou passifId requis',
})

// ============================================================================
// GET - Récupérer tous les liens actifs/passifs d'un client
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request)
    if (!auth.user) {
      return NextResponse.json(
        { error: 'Non authentifié', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    const { id: clientId } = await params

    // Vérifier que le client appartient au cabinet
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        cabinetId: auth.cabinetId,
      },
      include: {
        actifs: {
          include: {
            actif: {
              select: {
                id: true,
                name: true,
                type: true,
                value: true,
                linkedPassifId: true,
              },
            },
          },
        },
        passifs: {
          select: {
            id: true,
            name: true,
            type: true,
            remainingAmount: true,
            linkedActifId: true,
            insuranceRate: true,
          },
        },
      },
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Client non trouvé', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    // Construire les liens
    const assets = client.actifs.map(a => ({
      id: a.actif.id,
      name: a.actif.name,
      type: a.actif.type,
      value: Number(a.actif.value),
      linkedPassifId: a.actif.linkedPassifId,
    }))

    const liabilities = client.passifs.map(p => ({
      id: p.id,
      name: p.name,
      type: p.type,
      remainingAmount: Number(p.remainingAmount),
      linkedActifId: p.linkedActifId,
      insuranceRate: p.insuranceRate ? Number(p.insuranceRate) : null,
    }))

    const links = buildAssetLiabilityLinks(assets, liabilities)

    // Actifs et passifs sans lien
    const actifsSansLien = assets.filter(a => 
      !a.linkedPassifId && !liabilities.some(l => l.linkedActifId === a.id)
    )

    const passifsSansLien = liabilities.filter(l =>
      !l.linkedActifId && !assets.some(a => a.linkedPassifId === l.id)
    )

    return NextResponse.json({
      success: true,
      data: {
        links,
        actifsSansLien,
        passifsSansLien,
        totalLinks: links.length,
        totalActifs: assets.length,
        totalPassifs: liabilities.length,
      },
    })

  } catch (error) {
    console.error('Erreur GET /wealth/links:', error)
    return NextResponse.json(
      { error: 'Erreur serveur', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST - Créer un lien actif/passif
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request)
    if (!auth.user) {
      return NextResponse.json(
        { error: 'Non authentifié', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    const { id: clientId } = await params
    const body = await request.json()

    // Validation
    const validation = createLinkSchema.safeParse(body)
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

    const { actifId, passifId } = validation.data

    // Vérifier que le client appartient au cabinet
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        cabinetId: auth.cabinetId,
      },
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Client non trouvé', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    // Vérifier que l'actif existe et appartient au client
    const actif = await prisma.actif.findFirst({
      where: {
        id: actifId,
        clients: { some: { clientId } },
      },
    })

    if (!actif) {
      return NextResponse.json(
        { error: 'Actif non trouvé', code: 'ASSET_NOT_FOUND' },
        { status: 404 }
      )
    }

    // Vérifier que le passif existe et appartient au client
    const passif = await prisma.passif.findFirst({
      where: {
        id: passifId,
        clientId,
      },
    })

    if (!passif) {
      return NextResponse.json(
        { error: 'Passif non trouvé', code: 'LIABILITY_NOT_FOUND' },
        { status: 404 }
      )
    }

    // Valider la cohérence du lien
    const linkValidation = validateAssetLiabilityLink(actif.type, passif.type)
    if (!linkValidation.valid) {
      return NextResponse.json(
        { error: linkValidation.message, code: 'INVALID_LINK' },
        { status: 400 }
      )
    }

    // Créer le lien bidirectionnel (transaction)
    await prisma.$transaction([
      prisma.actif.update({
        where: { id: actifId },
        data: { linkedPassifId: passifId },
      }),
      prisma.passif.update({
        where: { id: passifId },
        data: { linkedActifId: actifId },
      }),
    ])

    // Récupérer les données mises à jour
    const updatedActif = await prisma.actif.findUnique({
      where: { id: actifId },
      select: {
        id: true,
        name: true,
        type: true,
        value: true,
        linkedPassifId: true,
      },
    })

    const updatedPassif = await prisma.passif.findUnique({
      where: { id: passifId },
      select: {
        id: true,
        name: true,
        type: true,
        remainingAmount: true,
        linkedActifId: true,
        insuranceRate: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        link: {
          actifId,
          passifId,
          actifName: updatedActif?.name,
          passifName: updatedPassif?.name,
          actifValue: Number(updatedActif?.value),
          passifAmount: Number(updatedPassif?.remainingAmount),
          netValue: Number(updatedActif?.value) - Number(updatedPassif?.remainingAmount),
        },
        message: 'Lien créé avec succès',
      },
    })

  } catch (error) {
    console.error('Erreur POST /wealth/links:', error)
    return NextResponse.json(
      { error: 'Erreur serveur', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

// ============================================================================
// DELETE - Supprimer un lien actif/passif
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request)
    if (!auth.user) {
      return NextResponse.json(
        { error: 'Non authentifié', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    const { id: clientId } = await params
    const { searchParams } = new URL(request.url)
    const actifId = searchParams.get('actifId')
    const passifId = searchParams.get('passifId')

    if (!actifId && !passifId) {
      return NextResponse.json(
        { error: 'actifId ou passifId requis', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    // Vérifier que le client appartient au cabinet
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        cabinetId: auth.cabinetId,
      },
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Client non trouvé', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    const updates: Promise<any>[] = []

    // Si actifId fourni, supprimer le lien côté actif
    if (actifId) {
      const actif = await prisma.actif.findFirst({
        where: { id: actifId, clients: { some: { clientId } } },
      })

      if (actif) {
        // Supprimer le lien côté actif
        updates.push(
          prisma.actif.update({
            where: { id: actifId },
            data: { linkedPassifId: null },
          })
        )

        // Supprimer le lien côté passif correspondant
        if (actif.linkedPassifId) {
          updates.push(
            prisma.passif.update({
              where: { id: actif.linkedPassifId },
              data: { linkedActifId: null },
            })
          )
        }
      }
    }

    // Si passifId fourni, supprimer le lien côté passif
    if (passifId) {
      const passif = await prisma.passif.findFirst({
        where: { id: passifId, clientId },
      })

      if (passif) {
        // Supprimer le lien côté passif
        updates.push(
          prisma.passif.update({
            where: { id: passifId },
            data: { linkedActifId: null },
          })
        )

        // Supprimer le lien côté actif correspondant
        if (passif.linkedActifId) {
          updates.push(
            prisma.actif.update({
              where: { id: passif.linkedActifId },
              data: { linkedPassifId: null },
            })
          )
        }
      }
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'Aucun lien trouvé', code: 'LINK_NOT_FOUND' },
        { status: 404 }
      )
    }

    await Promise.all(updates)

    return NextResponse.json({
      success: true,
      data: {
        message: 'Lien supprimé avec succès',
      },
    })

  } catch (error) {
    console.error('Erreur DELETE /wealth/links:', error)
    return NextResponse.json(
      { error: 'Erreur serveur', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
