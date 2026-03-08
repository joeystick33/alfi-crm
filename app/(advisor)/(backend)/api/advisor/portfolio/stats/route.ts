import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/_common/lib/prisma'
import { getAuthUser } from '@/app/_common/lib/auth-helpers'
import { isSuperAdmin, isRegularUser } from '@/app/_common/lib/auth-types'
import { logger } from '@/app/_common/lib/logger'
/**
 * GET /api/advisor/portfolio/stats
 * Retourne les statistiques consolidées du portefeuille
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user || isSuperAdmin(user) || !isRegularUser(user)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const cabinetId = user.cabinetId

    // Compter les clients actifs
    const clientsCount = await prisma.client.count({
      where: {
        cabinetId,
        status: 'ACTIF',
      },
    })

    // Récupérer tous les actifs du cabinet avec les % de détention
    const clientActifs = await prisma.clientActif.findMany({
      where: {
        client: {
          cabinetId,
          status: 'ACTIF',
        },
      },
      include: {
        actif: true,
      },
    })

    // Calculer le total des actifs (avec % de détention)
    let totalActifs = 0
    clientActifs.forEach((ca) => {
      const percentage = Number(ca.ownershipPercentage) / 100
      const value = Number(ca.actif.value || 0)
      totalActifs += value * percentage
    })

    // Récupérer tous les passifs du cabinet
    const passifs = await prisma.passif.findMany({
      where: {
        cabinetId,
        isActive: true,
      },
    })

    // Calculer le total des passifs
    let totalPassifs = 0
    passifs.forEach((passif) => {
      totalPassifs += Number(passif.remainingAmount || passif.initialAmount || 0)
    })

    // Compter les contrats actifs
    const totalContrats = await prisma.contrat.count({
      where: {
        cabinetId,
        status: 'ACTIF',
      },
    })

    const netWorth = totalActifs - totalPassifs
    const avgWealthPerClient = clientsCount > 0 ? netWorth / clientsCount : 0

    // Calcul de la croissance (simplifiée - à améliorer avec historique)
    const growthYTD = 8.4 // À calculer avec l'historique
    const growthMTD = 1.2 // À calculer avec l'historique

    return NextResponse.json({
      totalAUM: Math.round(totalActifs),
      totalClients: clientsCount,
      avgWealthPerClient: Math.round(avgWealthPerClient),
      netWorth: Math.round(netWorth),
      totalActifs: Math.round(totalActifs),
      totalPassifs: Math.round(totalPassifs),
      totalContrats,
      growthYTD,
      growthMTD,
    })
  } catch (error) {
    logger.error('Erreur stats portfolio:', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
