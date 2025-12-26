import { getPrismaClient } from '../prisma'
import type { Prisma } from '@prisma/client'

export interface WealthData {
  totalAssets: number
  totalLiabilities: number
  netWealth: number
  managedAssets: number
  unmanagedAssets: number
  lastCalculated: Date
  breakdown: {
    immobilier: number
    financier: number
    professionnel: number
    autre: number
  }
}

/**
 * Service de calcul du patrimoine
 * Calcule automatiquement le patrimoine net d'un client
 */
export class WealthCalculationService {
  private prisma

  constructor(
    private cabinetId: string,
    private userId: string,
    private isSuperAdmin: boolean = false
  ) {
    this.prisma = getPrismaClient(cabinetId, isSuperAdmin)
  }

  /**
   * Calcule le patrimoine total d'un client
   */
  async calculateClientWealth(clientId: string): Promise<WealthData> {
    if (!clientId) {
      throw new Error('Client ID is required')
    }

    // Récupérer tous les actifs du client
    const clientActifs = await this.prisma.clientActif.findMany({
      where: { clientId },
      include: {
        actif: true,
      },
    })

    // Récupérer tous les passifs du client
    const passifs = await this.prisma.passif.findMany({
      where: { clientId },
    })

    // Calculer le total des actifs
    let totalAssets = 0
    let managedAssets = 0
    let unmanagedAssets = 0
    const breakdown = {
      immobilier: 0,
      financier: 0,
      professionnel: 0,
      autre: 0,
    }

    for (const clientActif of clientActifs) {
      const actif = clientActif.actif
      const value = actif.value.toNumber()
      const percentage = clientActif.ownershipPercentage.toNumber() / 100
      const clientShare = value * percentage

      totalAssets += clientShare

      // Répartir par catégorie
      if (actif.category === 'IMMOBILIER') {
        breakdown.immobilier += clientShare
      } else if (actif.category === 'FINANCIER') {
        breakdown.financier += clientShare
      } else if (actif.category === 'PROFESSIONNEL') {
        breakdown.professionnel += clientShare
      } else {
        breakdown.autre += clientShare
      }

      // Actifs gérés vs non gérés
      if (actif.managedByFirm) {
        managedAssets += clientShare
      } else {
        unmanagedAssets += clientShare
      }
    }

    // Calculer le total des passifs
    let totalLiabilities = 0
    for (const passif of passifs) {
      totalLiabilities += passif.remainingAmount.toNumber()
    }

    // Calculer le patrimoine net
    const netWealth = totalAssets - totalLiabilities

    const wealthData: WealthData = {
      totalAssets,
      totalLiabilities,
      netWealth,
      managedAssets,
      unmanagedAssets,
      lastCalculated: new Date(),
      breakdown,
    }

    // Mettre à jour le client avec les nouvelles données
    const { count } = await this.prisma.client.updateMany({
      where: { id: clientId },
      data: {
        wealth: wealthData as unknown as Prisma.InputJsonValue,
      },
    })

    if (count === 0) {
      throw new Error('Client not found or access denied')
    }

    return wealthData
  }

  /**
   * Calcule le patrimoine de tous les clients d'un conseiller
   */
  async calculateAdvisorClientsWealth(advisorId: string) {
    const clients = await this.prisma.client.findMany({
      where: {
        OR: [
          { conseillerId: advisorId },
          { conseillerRemplacantId: advisorId },
        ],
      },
      select: {
        id: true,
      },
    })

    const results = []
    for (const client of clients) {
      try {
        const wealth = await this.calculateClientWealth(client.id)
        results.push({
          clientId: client.id,
          wealth,
          success: true,
        })
      } catch (error: unknown) {
        results.push({
          clientId: client.id,
          error: error instanceof Error ? error.message : 'Unknown error',
          success: false,
        })
      }
    }

    return results
  }

  /**
   * Calcule le patrimoine total géré par le cabinet
   */
  async calculateCabinetWealth() {
    const clients = await this.prisma.client.findMany({
      where: {
        status: { in: ['ACTIF', 'PROSPECT'] },
      },
      select: {
        id: true,
        wealth: true,
      },
    })

    let totalAssets = 0
    let totalLiabilities = 0
    let totalManagedAssets = 0
    let totalClients = 0
    let clientsWithWealth = 0

    for (const client of clients) {
      totalClients++

      if (client.wealth) {
        const wealth = client.wealth as WealthData
        totalAssets += wealth.totalAssets || 0
        totalLiabilities += wealth.totalLiabilities || 0
        totalManagedAssets += wealth.managedAssets || 0
        clientsWithWealth++
      }
    }

    return {
      totalClients,
      clientsWithWealth,
      totalAssets,
      totalLiabilities,
      netWealth: totalAssets - totalLiabilities,
      totalManagedAssets,
      averageWealthPerClient: clientsWithWealth > 0 ? totalAssets / clientsWithWealth : 0,
    }
  }

  /**
   * Récupère l'évolution du patrimoine d'un client
   */
  async getWealthEvolution(clientId: string, months: number = 12) {
    // TODO: Implémenter l'historisation du patrimoine
    // Pour l'instant, retourne juste le patrimoine actuel
    const client = await this.prisma.client.findFirst({
      where: { id: clientId },
      select: {
        wealth: true,
      },
    })

    if (!client || !client.wealth) {
      return []
    }

    // Retourner un point de données pour l'instant
    return [
      {
        date: new Date(),
        ...client.wealth,
      },
    ]
  }

  /**
   * Compare le patrimoine de plusieurs clients
   */
  async compareClientsWealth(clientIds: string[]) {
    const clients = await this.prisma.client.findMany({
      where: {
        id: { in: clientIds },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        wealth: true,
      },
    })

    return clients.map(client => ({
      clientId: client.id,
      clientName: `${client.firstName} ${client.lastName}`,
      wealth: client.wealth as WealthData | null,
    }))
  }

  /**
   * Calcule le ratio d'endettement d'un client
   */
  async calculateDebtRatio(clientId: string): Promise<number> {
    const client = await this.prisma.client.findFirst({
      where: { id: clientId },
      select: {
        wealth: true,
      },
    })

    if (!client || !client.wealth) {
      return 0
    }

    const wealth = client.wealth as WealthData
    const totalAssets = wealth.totalAssets || 0
    const totalLiabilities = wealth.totalLiabilities || 0

    if (totalAssets === 0) {
      return 0
    }

    return (totalLiabilities / totalAssets) * 100
  }

  /**
   * Identifie les clients avec un patrimoine élevé
   */
  async getHighNetWorthClients(threshold: number = 1000000) {
    const clients = await this.prisma.client.findMany({
      where: {
        status: { in: ['ACTIF', 'PROSPECT'] },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        wealth: true,
        conseiller: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    return clients
      .filter(client => {
        if (!client.wealth) return false
        const wealth = client.wealth as WealthData
        return (wealth.netWealth || 0) >= threshold
      })
      .sort((a, b) => {
        const wealthA = (a.wealth as WealthData | null)?.netWealth || 0
        const wealthB = (b.wealth as WealthData | null)?.netWealth || 0
        return wealthB - wealthA
      })
  }

  /**
   * Calcule la répartition du patrimoine par catégorie
   */
  async getWealthDistribution(clientId: string) {
    const client = await this.prisma.client.findFirst({
      where: { id: clientId },
      select: {
        wealth: true,
      },
    })

    if (!client || !client.wealth) {
      return {
        immobilier: 0,
        financier: 0,
        professionnel: 0,
        autre: 0,
      }
    }

    const wealth = client.wealth as WealthData
    const breakdown = wealth.breakdown || {
      immobilier: 0,
      financier: 0,
      professionnel: 0,
      autre: 0,
    }

    const total = Object.values(breakdown).reduce((sum: number, val: unknown) => sum + (val as number), 0)

    if (total === 0) {
      return breakdown
    }

    // Retourner en pourcentages
    return {
      immobilier: (breakdown.immobilier / total) * 100,
      financier: (breakdown.financier / total) * 100,
      professionnel: (breakdown.professionnel / total) * 100,
      autre: (breakdown.autre / total) * 100,
    }
  }
}
