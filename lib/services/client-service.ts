import { getPrismaClient } from '@/lib/prisma'
import { UserRole } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

export class ClientService {
  private prisma: any

  constructor(
    private cabinetId: string,
    private userId: string,
    private userRole: UserRole,
    private isSuperAdmin: boolean = false
  ) {
    this.prisma = getPrismaClient(cabinetId, isSuperAdmin)
  }

  /**
   * Converts Decimal fields to numbers
   */
  private toNumber(value: any): number | null {
    if (value === null || value === undefined) {
      return null
    }

    if (typeof value === 'object' && typeof value?.toNumber === 'function') {
      return value.toNumber()
    }

    return value
  }

  /**
   * Formats a client entity with proper type conversions
   */
  private formatClient(client: any): any {
    if (!client) {
      return null
    }

    return {
      ...client,
      // Convert Decimal fields to numbers
      annualRevenue: this.toNumber(client.annualRevenue),
      annualIncome: this.toNumber(client.annualIncome),
      irTaxRate: this.toNumber(client.irTaxRate),
      ifiAmount: this.toNumber(client.ifiAmount),
      managementFees: this.toNumber(client.managementFees),
      // Format nested relations if present
      conseiller: client.conseiller ? {
        ...client.conseiller,
      } : undefined,
      conseillerRemplacant: client.conseillerRemplacant ? {
        ...client.conseillerRemplacant,
      } : undefined,
      apporteur: client.apporteur ? {
        ...client.apporteur,
        commissionRate: this.toNumber(client.apporteur.commissionRate),
      } : undefined,
    }
  }

  async getClientById(id: string, includeRelations: boolean = false) {
    const client = await this.prisma.client.findFirst({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
      include: includeRelations ? {
        conseiller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        conseillerRemplacant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        apporteur: true,
        familyMembers: true,
        actifs: true,
        passifs: true,
        contrats: true,
        objectifs: true,
        projets: true,
        opportunites: true,
        taches: {
          where: {
            status: {
              not: 'COMPLETED'
            }
          },
          orderBy: {
            dueDate: 'asc'
          },
          take: 10
        },
        rendezvous: {
          where: {
            startDate: {
              gte: new Date()
            }
          },
          orderBy: {
            startDate: 'asc'
          },
          take: 10
        },
        documents: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 10,
          include: {
            document: true
          }
        },
        timelineEvents: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 20
        }
      } : undefined
    })

    return this.formatClient(client)
  }

  async updateClient(id: string, data: any) {
    // Prepare update data with Decimal conversions
    const updateData: any = { ...data }

    if (data.annualRevenue !== undefined) {
      updateData.annualRevenue = new Decimal(data.annualRevenue)
    }
    if (data.annualIncome !== undefined) {
      updateData.annualIncome = new Decimal(data.annualIncome)
    }
    if (data.irTaxRate !== undefined) {
      updateData.irTaxRate = new Decimal(data.irTaxRate)
    }
    if (data.ifiAmount !== undefined) {
      updateData.ifiAmount = new Decimal(data.ifiAmount)
    }
    if (data.managementFees !== undefined) {
      updateData.managementFees = new Decimal(data.managementFees)
    }

    const { count } = await this.prisma.client.updateMany({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
      data: updateData,
    })

    if (count === 0) {
      throw new Error('Client not found or access denied')
    }

    return this.getClientById(id)
  }

  async archiveClient(id: string) {
    const { count } = await this.prisma.client.updateMany({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
      data: {
        status: 'ARCHIVED',
      },
    })

    if (count === 0) {
      throw new Error('Client not found or access denied')
    }
  }

  async createClient(data: any) {
    // Prepare data with Decimal conversions
    const createData: any = {
      ...data,
      cabinetId: this.cabinetId,
      conseillerId: data.conseillerId || this.userId,
      status: data.status || 'PROSPECT'
    }

    // Convert numeric fields to Decimal
    if (data.annualRevenue !== undefined) {
      createData.annualRevenue = new Decimal(data.annualRevenue)
    }
    if (data.annualIncome !== undefined) {
      createData.annualIncome = new Decimal(data.annualIncome)
    }
    if (data.irTaxRate !== undefined) {
      createData.irTaxRate = new Decimal(data.irTaxRate)
    }
    if (data.ifiAmount !== undefined) {
      createData.ifiAmount = new Decimal(data.ifiAmount)
    }
    if (data.managementFees !== undefined) {
      createData.managementFees = new Decimal(data.managementFees)
    }

    const client = await this.prisma.client.create({
      data: createData,
      include: {
        conseiller: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    })

    return this.formatClient(client)
  }

  async listClients(filters?: any) {
    const where: any = {
      cabinetId: this.cabinetId,
    }

    // Filtres de recherche
    if (filters?.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } }
      ]
    }

    if (filters?.status) {
      where.status = filters.status
    }

    if (filters?.clientType) {
      where.clientType = filters.clientType
    }

    if (filters?.conseillerId) {
      where.conseillerId = filters.conseillerId
    }

    if (filters?.kycStatus) {
      where.kycStatus = filters.kycStatus
    }

    if (filters?.riskProfile) {
      where.riskProfile = filters.riskProfile
    }

    if (filters?.maritalStatus) {
      where.maritalStatus = filters.maritalStatus
    }

    const clients = await this.prisma.client.findMany({
      where,
      include: {
        conseiller: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        lastName: 'asc'
      },
      take: filters?.limit || 50,
      skip: filters?.offset || 0
    })

    return clients.map((client: any) => this.formatClient(client))
  }

  async getClientStats(id: string) {
    const client = await this.prisma.client.findFirst({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
    })

    if (!client) {
      throw new Error('Client not found')
    }

    // Récupérer les statistiques
    const [
      clientActifsCount,
      passifsCount,
      contratsCount,
      objectifsCount,
      projetsCount,
      opportunitesCount,
      tachesCount,
      rendezvousCount,
      documentsCount,
      timelineEventsCount
    ] = await Promise.all([
      this.prisma.clientActif.count({ where: { clientId: id } }),
      this.prisma.passif.count({ where: { clientId: id, cabinetId: this.cabinetId } }),
      this.prisma.contrat.count({ where: { clientId: id, cabinetId: this.cabinetId } }),
      this.prisma.objectif.count({ where: { clientId: id, cabinetId: this.cabinetId } }),
      this.prisma.projet.count({ where: { clientId: id, cabinetId: this.cabinetId } }),
      this.prisma.opportunite.count({ where: { clientId: id, cabinetId: this.cabinetId } }),
      this.prisma.tache.count({ where: { clientId: id, cabinetId: this.cabinetId, status: { not: 'COMPLETED' } } }),
      this.prisma.rendezVous.count({ where: { clientId: id, cabinetId: this.cabinetId, startDate: { gte: new Date() } } }),
      this.prisma.clientDocument.count({ where: { clientId: id } }),
      this.prisma.timelineEvent.count({ where: { clientId: id, cabinetId: this.cabinetId } }),
    ])

    return {
      actifs: clientActifsCount,
      passifs: passifsCount,
      contrats: contratsCount,
      objectifs: objectifsCount,
      projets: projetsCount,
      opportunites: opportunitesCount,
      taches: tachesCount,
      rendezvous: rendezvousCount,
      documents: documentsCount,
      timelineEvents: timelineEventsCount
    }
  }

  async getClientTimeline(id: string, limit: number = 50) {
    const client = await this.prisma.client.findFirst({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
    })

    if (!client) {
      throw new Error('Client not found')
    }

    const events = await this.prisma.timelineEvent.findMany({
      where: {
        clientId: id
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    })

    return events
  }
}
