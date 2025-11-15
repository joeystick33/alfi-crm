import { getPrismaClient, setRLSContext } from '../prisma'
import { ContratType, ContratStatus } from '@prisma/client'

export interface CreateContratInput {
  clientId: string
  type: ContratType
  name: string
  provider: string
  contractNumber?: string
  startDate: Date
  endDate?: Date
  premium?: number
  coverage?: number
  value?: number
  beneficiaries?: any
  details?: any
  commission?: number
  nextRenewalDate?: Date
}

export interface UpdateContratInput extends Partial<Omit<CreateContratInput, 'clientId'>> {
  status?: ContratStatus
}

/**
 * Service de gestion des contrats
 * Gère les opérations CRUD et les échéances de renouvellement
 */
export class ContratService {
  private prisma
  
  constructor(
    private cabinetId: string,
    private userId: string,
    private isSuperAdmin: boolean = false
  ) {
    this.prisma = getPrismaClient(cabinetId, isSuperAdmin)
  }

  /**
   * Crée un nouveau contrat
   */
  async createContrat(data: CreateContratInput) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    // Vérifier que le client existe
    const client = await this.prisma.client.findUnique({
      where: { id: data.clientId },
    })

    if (!client) {
      throw new Error('Client not found')
    }

    const contrat = await this.prisma.contrat.create({
      data: {
        cabinetId: this.cabinetId,
        ...data,
        status: 'ACTIVE',
      },
    })

    // Créer un événement timeline
    await this.prisma.timelineEvent.create({
      data: {
        clientId: data.clientId,
        type: 'CONTRACT_SIGNED',
        title: 'Contrat signé',
        description: `${contrat.name} - ${contrat.provider}`,
        relatedEntityType: 'Contrat',
        relatedEntityId: contrat.id,
        createdBy: this.userId,
      },
    })

    return contrat
  }

  /**
   * Récupère un contrat par ID
   */
  async getContratById(id: string) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const contrat = await this.prisma.contrat.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        documents: {
          include: {
            document: {
              select: {
                id: true,
                name: true,
                type: true,
                fileUrl: true,
              },
            },
          },
        },
      },
    })

    return contrat
  }

  /**
   * Liste les contrats avec filtres
   */
  async listContrats(filters?: {
    clientId?: string
    type?: ContratType
    status?: ContratStatus
    provider?: string
    search?: string
  }) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const where: any = {}

    if (filters?.clientId) {
      where.clientId = filters.clientId
    }

    if (filters?.type) {
      where.type = filters.type
    }

    if (filters?.status) {
      where.status = filters.status
    }

    if (filters?.provider) {
      where.provider = { contains: filters.provider, mode: 'insensitive' }
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { provider: { contains: filters.search, mode: 'insensitive' } },
        { contractNumber: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    const contrats = await this.prisma.contrat.findMany({
      where,
      include: {
        client: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        startDate: 'desc',
      },
    })

    return contrats
  }

  /**
   * Liste les contrats avec informations clients (alias)
   */
  async listContratsWithClients(filters?: {
    clientId?: string
    type?: ContratType
    status?: ContratStatus
    provider?: string
    search?: string
  }) {
    const contrats = await this.listContrats(filters)
    
    // Transform to match expected format
    return contrats.map(contrat => ({
      ...contrat,
      numeroContrat: contrat.contractNumber,
      compagnie: contrat.provider,
      valeur: Number(contrat.value),
      primeAnnuelle: Number(contrat.annualPremium || 0),
      dateEcheance: contrat.endDate,
      statut: contrat.status,
      nom: contrat.name
    }))
  }

  /**
   * Liste les contrats d'un client
   */
  async getClientContrats(clientId: string) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const contrats = await this.prisma.contrat.findMany({
      where: { clientId },
      orderBy: {
        startDate: 'desc',
      },
    })

    return contrats
  }

  /**
   * Met à jour un contrat
   */
  async updateContrat(id: string, data: UpdateContratInput) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const contrat = await this.prisma.contrat.update({
      where: { id },
      data,
    })

    return contrat
  }

  /**
   * Change le statut d'un contrat
   */
  async updateContratStatus(id: string, status: ContratStatus) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const contrat = await this.prisma.contrat.update({
      where: { id },
      data: { status },
    })

    return contrat
  }

  /**
   * Suspend un contrat
   */
  async suspendContrat(id: string) {
    return this.updateContratStatus(id, 'SUSPENDED')
  }

  /**
   * Résilie un contrat
   */
  async terminateContrat(id: string) {
    return this.updateContratStatus(id, 'TERMINATED')
  }

  /**
   * Marque un contrat comme expiré
   */
  async expireContrat(id: string) {
    return this.updateContratStatus(id, 'EXPIRED')
  }

  /**
   * Renouvelle un contrat
   */
  async renewContrat(id: string, newEndDate?: Date, newPremium?: number) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const data: any = {
      status: 'ACTIVE',
    }

    if (newEndDate) {
      data.endDate = newEndDate
      // Calculer la prochaine date de renouvellement (1 mois avant)
      const nextRenewal = new Date(newEndDate)
      nextRenewal.setMonth(nextRenewal.getMonth() - 1)
      data.nextRenewalDate = nextRenewal
    }

    if (newPremium !== undefined) {
      data.premium = newPremium
    }

    const contrat = await this.prisma.contrat.update({
      where: { id },
      data,
    })

    // Créer un événement timeline
    await this.prisma.timelineEvent.create({
      data: {
        clientId: contrat.clientId,
        type: 'CONTRACT_SIGNED',
        title: 'Contrat renouvelé',
        description: `${contrat.name} - ${contrat.provider}`,
        relatedEntityType: 'Contrat',
        relatedEntityId: contrat.id,
        createdBy: this.userId,
      },
    })

    return contrat
  }

  /**
   * Récupère les contrats à renouveler
   */
  async getContratsToRenew(days: number = 30) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + days)

    const contrats = await this.prisma.contrat.findMany({
      where: {
        status: 'ACTIVE',
        nextRenewalDate: {
          lte: futureDate,
          gte: new Date(),
        },
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            conseiller: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        nextRenewalDate: 'asc',
      },
    })

    return contrats
  }

  /**
   * Récupère les contrats expirant bientôt
   */
  async getContratsExpiringSoon(days: number = 30) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + days)

    const contrats = await this.prisma.contrat.findMany({
      where: {
        status: 'ACTIVE',
        endDate: {
          lte: futureDate,
          gte: new Date(),
        },
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            conseiller: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: {
        endDate: 'asc',
      },
    })

    return contrats
  }

  /**
   * Calcule le total des primes d'un client
   */
  async calculateClientPremiums(clientId: string) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const contrats = await this.prisma.contrat.findMany({
      where: {
        clientId,
        status: 'ACTIVE',
      },
    })

    const totalMonthly = contrats.reduce((sum, c) => {
      if (!c.premium) return sum
      return sum + c.premium.toNumber()
    }, 0)

    const totalAnnual = totalMonthly * 12

    const byType = contrats.reduce((acc, c) => {
      const type = c.type
      if (!acc[type]) {
        acc[type] = 0
      }
      if (c.premium) {
        acc[type] += c.premium.toNumber()
      }
      return acc
    }, {} as Record<string, number>)

    return {
      totalMonthly,
      totalAnnual,
      byType,
      numberOfContracts: contrats.length,
    }
  }

  /**
   * Calcule le total des couvertures d'un client
   */
  async calculateClientCoverage(clientId: string) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const contrats = await this.prisma.contrat.findMany({
      where: {
        clientId,
        status: 'ACTIVE',
      },
    })

    const totalCoverage = contrats.reduce((sum, c) => {
      if (!c.coverage) return sum
      return sum + c.coverage.toNumber()
    }, 0)

    const byType = contrats.reduce((acc, c) => {
      const type = c.type
      if (!acc[type]) {
        acc[type] = 0
      }
      if (c.coverage) {
        acc[type] += c.coverage.toNumber()
      }
      return acc
    }, {} as Record<string, number>)

    return {
      totalCoverage,
      byType,
    }
  }

  /**
   * Calcule les commissions totales sur les contrats
   */
  async calculateCommissions(filters?: {
    clientId?: string
    startDate?: Date
    endDate?: Date
  }) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const where: any = {
      status: 'ACTIVE',
    }

    if (filters?.clientId) {
      where.clientId = filters.clientId
    }

    if (filters?.startDate || filters?.endDate) {
      where.startDate = {}
      if (filters.startDate) {
        where.startDate.gte = filters.startDate
      }
      if (filters.endDate) {
        where.startDate.lte = filters.endDate
      }
    }

    const contrats = await this.prisma.contrat.findMany({
      where,
      include: {
        client: {
          select: {
            firstName: true,
            lastName: true,
            conseiller: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    })

    const totalCommissions = contrats.reduce((sum, c) => {
      if (!c.commission) return sum
      return sum + c.commission.toNumber()
    }, 0)

    const byAdvisor = contrats.reduce((acc, c) => {
      const advisorId = c.client.conseiller.id
      const advisorName = `${c.client.conseiller.firstName} ${c.client.conseiller.lastName}`
      
      if (!acc[advisorId]) {
        acc[advisorId] = {
          name: advisorName,
          total: 0,
          count: 0,
        }
      }
      
      if (c.commission) {
        acc[advisorId].total += c.commission.toNumber()
      }
      acc[advisorId].count++
      
      return acc
    }, {} as Record<string, { name: string; total: number; count: number }>)

    return {
      totalCommissions,
      numberOfContracts: contrats.length,
      byAdvisor,
    }
  }

  /**
   * Récupère les statistiques des contrats du cabinet
   */
  async getCabinetContratsStats() {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const contrats = await this.prisma.contrat.findMany()

    const byStatus = contrats.reduce((acc, c) => {
      const status = c.status
      if (!acc[status]) {
        acc[status] = 0
      }
      acc[status]++
      return acc
    }, {} as Record<string, number>)

    const byType = contrats.reduce((acc, c) => {
      const type = c.type
      if (!acc[type]) {
        acc[type] = 0
      }
      acc[type]++
      return acc
    }, {} as Record<string, number>)

    const activeContrats = contrats.filter(c => c.status === 'ACTIVE')
    
    const totalPremiums = activeContrats.reduce((sum, c) => {
      if (!c.premium) return sum
      return sum + c.premium.toNumber()
    }, 0)

    const totalCoverage = activeContrats.reduce((sum, c) => {
      if (!c.coverage) return sum
      return sum + c.coverage.toNumber()
    }, 0)

    const totalCommissions = activeContrats.reduce((sum, c) => {
      if (!c.commission) return sum
      return sum + c.commission.toNumber()
    }, 0)

    return {
      totalContrats: contrats.length,
      byStatus,
      byType,
      totalPremiums,
      totalCoverage,
      totalCommissions,
    }
  }

  /**
   * Vérifie les contrats expirés et met à jour leur statut
   */
  async checkExpiredContrats() {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const now = new Date()

    const expiredContrats = await this.prisma.contrat.findMany({
      where: {
        status: 'ACTIVE',
        endDate: {
          lt: now,
        },
      },
    })

    // Mettre à jour le statut
    for (const contrat of expiredContrats) {
      await this.prisma.contrat.update({
        where: { id: contrat.id },
        data: { status: 'EXPIRED' },
      })
    }

    return {
      count: expiredContrats.length,
      contrats: expiredContrats,
    }
  }
}
