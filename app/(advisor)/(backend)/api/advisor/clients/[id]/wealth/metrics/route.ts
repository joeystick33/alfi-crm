 
/**
 * API Route: /api/advisor/clients/[id]/wealth/metrics
 * Calcul des métriques patrimoine enrichies + alertes
 * Next.js 14 App Router - Route Handlers
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import { prisma } from '@/app/_common/lib/prisma'
import {
  calculateWealthMetrics,
  detectWealthAlerts,
  calculateIFIFromAssets,
  buildAssetLiabilityLinks,
} from '@/app/_common/lib/services/wealth-service'

// ============================================================================
// GET - Calculer les métriques patrimoine
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

    // Récupérer le client avec actifs et passifs complets
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        cabinetId: auth.cabinetId,
      },
      include: {
        actifs: { include: { actif: true } },
        passifs: true,
      },
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Client non trouvé', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    // Transformer les actifs pour le calcul
    const assets = client.actifs.map(ca => ({
      id: ca.actif.id,
      type: ca.actif.type,
      value: Number(ca.actif.value),
      managedByFirm: ca.actif.managedByFirm,
      fiscalData: ca.actif.fiscalPropertyType ? {
        fiscalPropertyType: ca.actif.fiscalPropertyType as any,
        fiscalRpAbatement: ca.actif.fiscalRpAbatement ?? false,
        fiscalManualDiscount: ca.actif.fiscalManualDiscount ? Number(ca.actif.fiscalManualDiscount) : undefined,
        fiscalIfiValue: ca.actif.fiscalIfiValue ? Number(ca.actif.fiscalIfiValue) : undefined,
      } : undefined,
      linkedPassifId: ca.actif.linkedPassifId,
    }))

    // Transformer les passifs pour le calcul
    const liabilities = client.passifs.map(p => ({
      id: p.id,
      type: p.type,
      remainingAmount: Number(p.remainingAmount),
      linkedActifId: p.linkedActifId,
    }))

    // Calculer les métriques
    const metrics = calculateWealthMetrics(assets, liabilities)

    // Détecter les alertes
    const alerts = detectWealthAlerts(metrics, assets, liabilities)

    // Calculer IFI détaillé
    const ifiDetails = calculateIFIFromAssets(
      assets.map(a => ({
        type: a.type,
        value: a.value,
        fiscalData: a.fiscalData,
      })),
      liabilities.map(l => ({
        type: l.type,
        remainingAmount: l.remainingAmount,
        linkedActifId: l.linkedActifId,
      }))
    )

    // Construire les liens
    const links = buildAssetLiabilityLinks(
      assets.map(a => ({
        id: a.id,
        name: client.actifs.find(x => x.actif.id === a.id)?.actif.name || '',
        type: a.type,
        value: a.value,
        linkedPassifId: a.linkedPassifId,
      })),
      liabilities.map(l => ({
        id: l.id,
        name: client.passifs.find(x => x.id === l.id)?.name || '',
        type: l.type,
        remainingAmount: l.remainingAmount,
        linkedActifId: l.linkedActifId,
        insuranceRate: client.passifs.find(x => x.id === l.id)?.insuranceRate 
          ? Number(client.passifs.find(x => x.id === l.id)!.insuranceRate)
          : null,
      }))
    )

    // Répartition par type d'actif
    const repartitionActifs = {
      immobilier: {
        valeur: metrics.actifsImmobiliers,
        pourcentage: metrics.patrimoineTotal > 0 
          ? Math.round((metrics.actifsImmobiliers / metrics.patrimoineTotal) * 1000) / 10
          : 0,
      },
      financier: {
        valeur: metrics.actifsFinanciers,
        pourcentage: metrics.patrimoineTotal > 0
          ? Math.round((metrics.actifsFinanciers / metrics.patrimoineTotal) * 1000) / 10
          : 0,
      },
      autre: {
        valeur: metrics.actifsAutres,
        pourcentage: metrics.patrimoineTotal > 0
          ? Math.round((metrics.actifsAutres / metrics.patrimoineTotal) * 1000) / 10
          : 0,
      },
    }

    return NextResponse.json({
      success: true,
      data: {
        metrics,
        alerts,
        ifi: ifiDetails,
        links: {
          items: links,
          count: links.length,
          actifsSansLien: metrics.actifsSansLien,
          passifsSansLien: metrics.passifsSansLien,
        },
        repartition: repartitionActifs,
        totaux: {
          actifs: client.actifs.length,
          passifs: client.passifs.length,
        },
      },
    })

  } catch (error) {
    console.error('Erreur GET /wealth/metrics:', error)
    return NextResponse.json(
      { error: 'Erreur serveur', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
