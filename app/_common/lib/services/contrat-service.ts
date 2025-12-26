import { getPrismaClient } from '../prisma'
import { ContratType, ContratStatus, type Prisma } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

// Using Record for dynamic Prisma queries
type ContratWhereInput = Prisma.ContratWhereInput
type ContratUpdateData = Prisma.ContratUpdateManyMutationInput

type WithDecimalFields = {
  premium?: Decimal | null
  coverage?: Decimal | null
  value?: Decimal | null
  commission?: Decimal | null
}

type FormattedContrat<T> = Omit<T, 'premium' | 'coverage' | 'value' | 'commission'> & {
  premium?: number | null
  coverage?: number | null
  value?: number | null
  commission?: number | null
}

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
  beneficiaries?: Array<{ name?: string; share?: number }>
  details?: Record<string, unknown>
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
  private prisma: ReturnType<typeof getPrismaClient>
  
  constructor(
    private cabinetId: string,
    private userId: string,
    private isSuperAdmin: boolean = false
  ) {
    this.prisma = getPrismaClient(cabinetId, isSuperAdmin)
  }

  private formatContrat<T extends WithDecimalFields>(contrat: null): null
  private formatContrat<T extends WithDecimalFields>(contrat: T): FormattedContrat<T>
  private formatContrat<T extends WithDecimalFields>(contrat: T | null): FormattedContrat<T> | null {
    if (!contrat) {
      return null
    }

    const toNumber = (value: Decimal | number | null | undefined): number | null => {
      if (value === null || value === undefined) return null
      return typeof value === 'object' && 'toNumber' in value ? (value as Decimal).toNumber() : value
    }

    return {
      ...contrat,
      premium: (contrat as WithDecimalFields).premium !== undefined ? toNumber((contrat as WithDecimalFields).premium ?? null) : undefined,
      coverage: (contrat as WithDecimalFields).coverage !== undefined ? toNumber((contrat as WithDecimalFields).coverage ?? null) : undefined,
      value: (contrat as WithDecimalFields).value !== undefined ? toNumber((contrat as WithDecimalFields).value ?? null) : undefined,
      commission: (contrat as WithDecimalFields).commission !== undefined ? toNumber((contrat as WithDecimalFields).commission ?? null) : undefined,
    } as FormattedContrat<T>
  }

  /**
   * Crée un nouveau contrat
   */
  async createContrat(data: CreateContratInput) {
    // Vérifier que le client existe
    const client = await this.prisma.client.findFirst({
      where: {
        id: data.clientId,
        cabinetId: this.cabinetId,
      },
    })

    if (!client) {
      throw new Error('Client not found')
    }

    const createData: Prisma.ContratUncheckedCreateInput = {
      cabinetId: this.cabinetId,
      clientId: data.clientId,
      type: data.type,
      name: data.name,
      provider: data.provider,
      contractNumber: data.contractNumber,
      startDate: data.startDate,
      endDate: data.endDate ?? undefined,
      premium: data.premium !== undefined ? new Decimal(data.premium) : undefined,
      coverage: data.coverage !== undefined ? new Decimal(data.coverage) : undefined,
      value: data.value !== undefined ? new Decimal(data.value) : undefined,
      commission: data.commission !== undefined ? new Decimal(data.commission) : undefined,
      beneficiaries: data.beneficiaries
        ? (data.beneficiaries
            .map((b) => ({
              ...(b.name ? { name: b.name } : {}),
              ...(typeof b.share === 'number' ? { share: b.share } : {}),
            })) as unknown as Prisma.InputJsonValue)
        : undefined,
      details: (data.details as unknown as Prisma.InputJsonValue) ?? undefined,
      nextRenewalDate: data.nextRenewalDate,
      status: ContratStatus.ACTIF,
    }

    const contrat = await this.prisma.contrat.create({ data: createData })

    // Créer un événement timeline
    await this.prisma.timelineEvent.create({
      data: {
        cabinetId: this.cabinetId,
        clientId: data.clientId,
        type: 'CONTRACT_SIGNED',
        title: 'Contrat signé',
        description: `${contrat.name} - ${contrat.provider}`,
        relatedEntityType: 'Contrat',
        relatedEntityId: contrat.id,
        createdBy: this.userId,
      },
    })

    return this.getContratById(contrat.id)
  }

  /**
   * Récupère un contrat par ID
   */
  async getContratById(id: string) {
    const contrat = await this.prisma.contrat.findFirst({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
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

    return this.formatContrat(contrat)
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
    const where: ContratWhereInput = {
      cabinetId: this.cabinetId,
    }

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
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        startDate: 'desc',
      },
    })

    return contrats.map((contrat) => this.formatContrat(contrat))
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
    return contrats.map((contrat) => {
      const formatted = contrat
      const premium = formatted.premium ?? null
      const value = formatted.value ?? null

      return {
        ...formatted,
        numeroContrat: formatted.contractNumber,
        compagnie: formatted.provider,
        valeur: value ?? 0,
        primeAnnuelle: premium ? premium * 12 : 0,
        dateEcheance: formatted.endDate,
        statut: formatted.status,
        nom: formatted.name,
      }
    })
  }

  /**
   * Liste les contrats d'un client
   */
  async getClientContrats(clientId: string) {
    const contrats = await this.prisma.contrat.findMany({
      where: { clientId },
      orderBy: {
        startDate: 'desc',
      },
    })

    return contrats.map(contrat => this.formatContrat(contrat))
  }

  /**
   * Met à jour un contrat
   */
  async updateContrat(id: string, data: UpdateContratInput) {
    const updateData: ContratUpdateData = {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.provider !== undefined ? { provider: data.provider } : {}),
      ...(data.contractNumber !== undefined ? { contractNumber: data.contractNumber } : {}),
      ...(data.type !== undefined ? { type: data.type } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.startDate !== undefined ? { startDate: data.startDate } : {}),
      ...(data.endDate !== undefined ? { endDate: data.endDate } : {}),
      ...(data.nextRenewalDate !== undefined ? { nextRenewalDate: data.nextRenewalDate } : {}),
      ...(data.details !== undefined ? { details: data.details as unknown as Prisma.InputJsonValue } : {}),
      ...(data.beneficiaries !== undefined ? { beneficiaries: data.beneficiaries as unknown as Prisma.InputJsonValue } : {}),
      ...(data.premium !== undefined ? { premium: new Decimal(data.premium) } : {}),
      ...(data.coverage !== undefined ? { coverage: new Decimal(data.coverage) } : {}),
      ...(data.value !== undefined ? { value: new Decimal(data.value) } : {}),
      ...(data.commission !== undefined ? { commission: new Decimal(data.commission) } : {}),
    }

    const { count } = await this.prisma.contrat.updateMany({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
      data: updateData,
    })

    if (count === 0) {
      throw new Error('Contrat not found or access denied')
    }

    return this.getContratById(id)
  }

  /**
   * Change le statut d'un contrat
   */
  async updateContratStatus(id: string, status: ContratStatus) {
    const { count } = await this.prisma.contrat.updateMany({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
      data: { status },
    })

    if (count === 0) {
      throw new Error('Contrat not found or access denied')
    }

    return this.getContratById(id)
  }

  /**
   * Suspend un contrat
   */
  async suspendContrat(id: string) {
    return this.updateContratStatus(id, 'SUSPENDU')
  }

  /**
   * Résilie un contrat
   */
  async terminateContrat(id: string) {
    return this.updateContratStatus(id, 'RESILIE')
  }

  /**
   * Marque un contrat comme expiré
   */
  async expireContrat(id: string) {
    return this.updateContratStatus(id, 'EXPIRE')
  }

  /**
   * Renouvelle un contrat
   */
  async renewContrat(id: string, newEndDate?: Date, newPremium?: number) {
    const data: ContratUpdateData = {
      status: 'ACTIF' as ContratStatus,
    }

    if (newEndDate) {
      data.endDate = newEndDate
      // Calculer la prochaine date de renouvellement (1 mois avant)
      const nextRenewal = new Date(newEndDate)
      nextRenewal.setMonth(nextRenewal.getMonth() - 1)
      data.nextRenewalDate = nextRenewal
    }

    if (newPremium !== undefined) {
      data.premium = new Decimal(newPremium)
    }

    const { count } = await this.prisma.contrat.updateMany({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
      data,
    })

    if (count === 0) {
      throw new Error('Contrat not found or access denied')
    }

    const contrat = await this.getContratById(id)

    if (!contrat) {
      throw new Error('Contrat not found after renewal')
    }

    // Créer un événement timeline
    await this.prisma.timelineEvent.create({
      data: {
        cabinetId: this.cabinetId,
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
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + days)

    const contrats = await this.prisma.contrat.findMany({
      where: {
        status: 'ACTIF',
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
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + days)

    const contrats = await this.prisma.contrat.findMany({
      where: {
        status: 'ACTIF',
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
    const contrats = await this.prisma.contrat.findMany({
      where: {
        clientId,
        status: 'ACTIF',
      },
    })

    const totalMonthly = contrats.reduce((sum, c) => {
      if (!c.premium) return sum
      return sum + (c.premium as Decimal).toNumber()
    }, 0)

    const totalAnnual = totalMonthly * 12

    const byType = contrats.reduce<Record<string, number>>((acc, c) => {
      const type = c.type
      if (!acc[type]) {
        acc[type] = 0
      }
      if (c.premium) {
        acc[type] += (c.premium as Decimal).toNumber()
      }
      return acc
    }, {})

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
    const contrats = await this.prisma.contrat.findMany({
      where: {
        clientId,
        status: 'ACTIF',
      },
    })

    const totalCoverage = contrats.reduce((sum, c) => {
      if (!c.coverage) return sum
      return sum + (c.coverage as Decimal).toNumber()
    }, 0)

    const byType = contrats.reduce<Record<string, number>>((acc, c) => {
      const type = c.type
      if (!acc[type]) {
        acc[type] = 0
      }
      if (c.coverage) {
        acc[type] += (c.coverage as Decimal).toNumber()
      }
      return acc
    }, {})

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
    const where: ContratWhereInput = {
      status: 'ACTIF',
    }

    if (filters?.clientId) {
      where.clientId = filters.clientId
    }

    if (filters?.startDate || filters?.endDate) {
      where.startDate = {
        ...(filters.startDate ? { gte: filters.startDate } : {}),
        ...(filters.endDate ? { lte: filters.endDate } : {}),
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

    type ContratWithClient = typeof contrats[number]
    const totalCommissions = contrats.reduce((sum, c) => {
      if (!c.commission) return sum
      return sum + (c.commission as Decimal).toNumber()
    }, 0)

    const byAdvisor = contrats.reduce<Record<string, { name: string; total: number; count: number }>>((acc, c: ContratWithClient) => {
      const advisorId = c.client.conseiller?.id || 'unknown'
      const advisorName = c.client.conseiller ? `${c.client.conseiller.firstName} ${c.client.conseiller.lastName}` : 'Unknown'
      
      if (!acc[advisorId]) {
        acc[advisorId] = {
          name: advisorName,
          total: 0,
          count: 0,
        }
      }
      
      if (c.commission) {
        acc[advisorId].total += (c.commission as Decimal).toNumber()
      }
      acc[advisorId].count++
      
      return acc
    }, {})

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
    const contrats = await this.prisma.contrat.findMany()

    const byStatus = contrats.reduce<Record<string, number>>((acc, c) => {
      const status = c.status
      if (!acc[status]) {
        acc[status] = 0
      }
      acc[status]++
      return acc
    }, {})

    const byType = contrats.reduce<Record<string, number>>((acc, c) => {
      const type = c.type
      if (!acc[type]) {
        acc[type] = 0
      }
      acc[type]++
      return acc
    }, {})

    const activeContrats = contrats.filter((c) => c.status === 'ACTIF')
    
    const totalPremiums = activeContrats.reduce((sum, c) => {
      if (!c.premium) return sum
      return sum + (c.premium as Decimal).toNumber()
    }, 0)

    const totalCoverage = activeContrats.reduce((sum, c) => {
      if (!c.coverage) return sum
      return sum + (c.coverage as Decimal).toNumber()
    }, 0)

    const totalCommissions = activeContrats.reduce((sum, c) => {
      if (!c.commission) return sum
      return sum + (c.commission as Decimal).toNumber()
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
    const now = new Date()

    const expiredContrats = await this.prisma.contrat.findMany({
      where: {
        status: 'ACTIF',
        endDate: {
          lt: now,
        },
      },
    })

    // Mettre à jour le statut
    for (const contrat of expiredContrats) {
      await this.prisma.contrat.updateMany({
        where: {
          id: contrat.id,
          cabinetId: this.cabinetId,
        },
        data: { status: 'EXPIRE' },
      })
    }

    return {
      count: expiredContrats.length,
      contrats: expiredContrats,
    }
  }

  /**
   * Supprime (désactive) un contrat
   */
  async deleteContrat(id: string) {
    const { count } = await this.prisma.contrat.updateMany({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
      data: {
        status: 'RESILIE',
      },
    })

    if (count === 0) {
      throw new Error('Contrat not found or access denied')
    }

    return this.getContratById(id)
  }
}
