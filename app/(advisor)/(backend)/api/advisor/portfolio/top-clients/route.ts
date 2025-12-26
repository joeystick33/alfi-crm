import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/_common/lib/prisma'
import { getAuthUser } from '@/app/_common/lib/auth-helpers'
import { isSuperAdmin, isRegularUser } from '@/app/_common/lib/auth-types'

/**
 * GET /api/advisor/portfolio/top-clients
 * Retourne les clients classés par patrimoine
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user || isSuperAdmin(user) || !isRegularUser(user)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const cabinetId = user.cabinetId
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '10')

    // Récupérer tous les clients avec leurs actifs
    const clients = await prisma.client.findMany({
      where: {
        cabinetId,
        status: 'ACTIF',
      },
      include: {
        actifs: {
          include: {
            actif: true,
          },
        },
        passifs: true,
        rendezvous: {
          orderBy: { startDate: 'desc' },
          take: 1,
        },
      },
    })

    // Calculer le patrimoine de chaque client
    const clientsWithWealth = clients.map((client) => {
      let totalActifs = 0
      client.actifs.forEach((ca) => {
        const percentage = Number(ca.ownershipPercentage) / 100
        totalActifs += Number(ca.actif.value || 0) * percentage
      })

      let totalPassifs = 0
      client.passifs.forEach((passif) => {
        totalPassifs += Number(passif.remainingAmount || passif.initialAmount || 0)
      })

      const patrimoine = totalActifs - totalPassifs
      const lastRdv = client.rendezvous[0]

      return {
        id: client.id,
        name: `${client.firstName} ${client.lastName}`,
        patrimoine: Math.round(patrimoine),
        growth: Math.round((Math.random() * 20 - 5) * 10) / 10, // TODO: Calculer vraie croissance
        lastContact: lastRdv?.startDate?.toISOString().split('T')[0] || 'N/A',
        riskProfile: client.riskProfile || 'Équilibré',
        avatar: undefined,
      }
    })

    // Trier par patrimoine et limiter
    const topClients = clientsWithWealth
      .sort((a, b) => b.patrimoine - a.patrimoine)
      .slice(0, limit)

    return NextResponse.json(topClients)
  } catch (error) {
    console.error('Erreur top-clients portfolio:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
