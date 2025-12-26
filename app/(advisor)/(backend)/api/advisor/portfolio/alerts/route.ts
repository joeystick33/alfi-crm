import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/_common/lib/prisma'
import { getAuthUser } from '@/app/_common/lib/auth-helpers'
import { isSuperAdmin, isRegularUser } from '@/app/_common/lib/auth-types'

interface Alert {
  id: string
  type: 'contract_expiry' | 'no_contact' | 'opportunity' | 'risk'
  title: string
  description: string
  clientId: string
  clientName: string
  priority: 'high' | 'medium' | 'low'
  date?: string
}

/**
 * GET /api/advisor/portfolio/alerts
 * Retourne les alertes et opportunités du portefeuille
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user || isSuperAdmin(user) || !isRegularUser(user)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const cabinetId = user.cabinetId
    const alerts: Alert[] = []
    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

    // 1. Contrats arrivant à échéance dans 30 jours
    const expiringContracts = await prisma.contrat.findMany({
      where: {
        cabinetId,
        status: 'ACTIF',
        endDate: {
          gte: now,
          lte: thirtyDaysFromNow,
        },
      },
      include: {
        client: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      take: 10,
    })

    expiringContracts.forEach((contract) => {
      alerts.push({
        id: `contract-${contract.id}`,
        type: 'contract_expiry',
        title: `Contrat ${contract.name} à échéance`,
        description: `Expire le ${contract.endDate?.toLocaleDateString('fr-FR')}`,
        clientId: contract.clientId,
        clientName: `${contract.client.firstName} ${contract.client.lastName}`,
        priority: 'high',
        date: contract.endDate?.toISOString().split('T')[0],
      })
    })

    // 2. Clients sans contact depuis 90 jours
    const allClients = await prisma.client.findMany({
      where: {
        cabinetId,
        status: 'ACTIF',
      },
      include: {
        rendezvous: {
          orderBy: { startDate: 'desc' },
          take: 1,
        },
      },
    })

    allClients.forEach((client) => {
      const lastRdv = client.rendezvous[0]
      if (!lastRdv || new Date(lastRdv.startDate) < ninetyDaysAgo) {
        alerts.push({
          id: `nocontact-${client.id}`,
          type: 'no_contact',
          title: 'Client sans contact > 90j',
          description: lastRdv 
            ? `Dernier contact le ${new Date(lastRdv.startDate).toLocaleDateString('fr-FR')}`
            : 'Aucun rendez-vous enregistré',
          clientId: client.id,
          clientName: `${client.firstName} ${client.lastName}`,
          priority: 'medium',
          date: lastRdv?.startDate?.toISOString().split('T')[0],
        })
      }
    })

    // 3. Opportunités commerciales (clients avec TMI élevé sans PER)
    const clientsWithHighTMI = await prisma.client.findMany({
      where: {
        cabinetId,
        status: 'ACTIF',
        taxBracket: {
          in: ['41', '45', '41%', '45%'],
        },
      },
      include: {
        contrats: {
          where: {
            type: 'EPARGNE_RETRAITE',
          },
        },
      },
      take: 5,
    })

    clientsWithHighTMI.forEach((client) => {
      if (client.contrats.length === 0) {
        alerts.push({
          id: `opportunity-per-${client.id}`,
          type: 'opportunity',
          title: 'Opportunité PER',
          description: `TMI ${client.taxBracket} - Versement PER recommandé`,
          clientId: client.id,
          clientName: `${client.firstName} ${client.lastName}`,
          priority: 'high',
        })
      }
    })

    // 4. Risques de concentration
    const clientActifs = await prisma.clientActif.findMany({
      where: {
        client: {
          cabinetId,
          status: 'ACTIF',
        },
      },
      include: {
        actif: true,
        client: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    })

    // Grouper par client
    const clientPatrimoines: Record<string, { 
      clientId: string
      clientName: string
      total: number
      immobilier: number 
    }> = {}

    clientActifs.forEach((ca) => {
      const clientId = ca.clientId
      const value = Number(ca.actif.value || 0) * (Number(ca.ownershipPercentage) / 100)
      const isImmobilier = ['REAL_ESTATE', 'MAIN_RESIDENCE', 'SECONDARY_RESIDENCE', 'RENTAL_PROPERTY', 'LAND', 'COMMERCIAL_PROPERTY', 'SCPI'].includes(ca.actif.category) ||
                          ['REAL_ESTATE', 'MAIN_RESIDENCE', 'SECONDARY_RESIDENCE', 'RENTAL_PROPERTY', 'LAND', 'COMMERCIAL_PROPERTY', 'SCPI'].includes(ca.actif.type)

      if (!clientPatrimoines[clientId]) {
        clientPatrimoines[clientId] = {
          clientId,
          clientName: `${ca.client.firstName} ${ca.client.lastName}`,
          total: 0,
          immobilier: 0,
        }
      }
      clientPatrimoines[clientId].total += value
      if (isImmobilier) {
        clientPatrimoines[clientId].immobilier += value
      }
    })

    // Détecter concentration > 80%
    Object.values(clientPatrimoines).forEach((cp) => {
      if (cp.total > 0 && (cp.immobilier / cp.total) > 0.8) {
        alerts.push({
          id: `risk-concentration-${cp.clientId}`,
          type: 'risk',
          title: 'Concentration risque',
          description: `Plus de 80% du patrimoine en immobilier`,
          clientId: cp.clientId,
          clientName: cp.clientName,
          priority: 'medium',
        })
      }
    })

    // Trier par priorité
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    alerts.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

    return NextResponse.json(alerts.slice(0, 20))
  } catch (error) {
    console.error('Erreur alerts portfolio:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
