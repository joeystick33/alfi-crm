import { getPrismaClient } from '@/app/_common/lib/prisma'
import { ClientStatus, Prisma, UserRole } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

// Internal types for client service
type PrismaClientType = ReturnType<typeof getPrismaClient>
type ClientRecord = any
type ClientFilters = {
  search?: string
  status?: string
  clientType?: string
  conseillerId?: string
  kycStatus?: string
  riskProfile?: string
  maritalStatus?: string
  minPatrimoine?: number
  maxPatrimoine?: number
  limit?: number
  offset?: number
}

export class ClientService {
  private prisma: PrismaClientType

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
  private toNumber(value: unknown): number | null {
    if (value === null || value === undefined) {
      return null
    }

    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : null
    }

    if (value instanceof Decimal) {
      return value.toNumber()
    }

    const asAny = value as any
    if (typeof asAny?.toNumber === 'function') {
      const n = asAny.toNumber()
      return typeof n === 'number' && Number.isFinite(n) ? n : null
    }

    if (typeof value === 'string') {
      const n = Number(value)
      return Number.isFinite(n) ? n : null
    }

    const n = Number(value)
    return Number.isFinite(n) ? n : null
  }

  private toDecimal(value: unknown): Decimal | undefined {
    const n = this.toNumber(value)
    if (n === null) return undefined
    return new Decimal(n)
  }

  /**
   * Formats a client entity with proper type conversions
   */
  private formatClient(client: ClientRecord | null): ClientRecord | null {
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
      // Format actifs (flatten ClientActif -> Actif with ownership info)
      actifs: (client.actifs as Array<Record<string, unknown>>)?.map((ca) => ({
        ...(ca.actif as Record<string, unknown>),
        ownershipPercentage: this.toNumber(ca.ownershipPercentage as Decimal | number | null),
        ownershipType: ca.ownershipType,
        clientActifId: ca.id,
        // Convert Decimal fields in actif
        value: this.toNumber((ca.actif as Record<string, unknown>)?.value as Decimal | number | null),
        acquisitionValue: this.toNumber((ca.actif as Record<string, unknown>)?.acquisitionValue as Decimal | number | null),
        annualIncome: this.toNumber((ca.actif as Record<string, unknown>)?.annualIncome as Decimal | number | null),
      })) || [],
      // Format passifs
      passifs: (client.passifs as Array<Record<string, unknown>>)?.map((p) => ({
        ...p,
        initialAmount: this.toNumber(p.initialAmount as Decimal | number | null),
        remainingAmount: this.toNumber(p.remainingAmount as Decimal | number | null),
        interestRate: this.toNumber(p.interestRate as Decimal | number | null),
        insuranceRate: this.toNumber(p.insuranceRate as Decimal | number | null),
        monthlyPayment: this.toNumber(p.monthlyPayment as Decimal | number | null),
      })) || [],
      // Format contrats
      contrats: (client.contrats as Array<Record<string, unknown>>)?.map((c) => ({
        ...c,
        value: this.toNumber(c.value as Decimal | number | null),
        premium: this.toNumber(c.premium as Decimal | number | null),
        annualPremium: this.toNumber(c.annualPremium as Decimal | number | null),
        managementFees: this.toNumber(c.managementFees as Decimal | number | null),
        entryFees: this.toNumber(c.entryFees as Decimal | number | null),
      })) || [],
      // Format objectifs
      objectifs: (client.objectifs as Array<Record<string, unknown>>)?.map((o) => ({
        ...o,
        targetAmount: this.toNumber(o.targetAmount as Decimal | number | null),
        currentAmount: this.toNumber(o.currentAmount as Decimal | number | null),
      })) || [],
      // Format projets
      projets: (client.projets as Array<Record<string, unknown>>)?.map((p) => ({
        ...p,
        budget: this.toNumber(p.budget as Decimal | number | null),
        currentAmount: this.toNumber(p.currentAmount as Decimal | number | null),
      })) || [],
      // Format familyMembers
      familyMembers: (client.familyMembers as Array<Record<string, unknown>>)?.map((fm) => ({
        ...fm,
        annualIncome: this.toNumber(fm.annualIncome as Decimal | number | null),
        // Compatibilité frontend
        relationshipType: fm.relationship,
      })) || [],
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
        actifs: {
          where: {
            actif: {
              isActive: true
            }
          },
          include: {
            actif: true
          }
        },
        passifs: {
          where: {
            isActive: true
          }
        },
        contrats: true,
        objectifs: true,
        projets: true,
        opportunites: true,
        taches: {
          where: {
            status: {
              not: 'TERMINE'
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

  async updateClient(id: string, data: Record<string, unknown>) {
    // Prepare update data with Decimal conversions
    const updateData: Prisma.ClientUpdateManyMutationInput = { ...data } as Prisma.ClientUpdateManyMutationInput

    if (data.annualRevenue !== undefined) {
      const v = this.toDecimal(data.annualRevenue)
      if (v !== undefined) updateData.annualRevenue = v
    }
    if (data.annualIncome !== undefined) {
      const v = this.toDecimal(data.annualIncome)
      if (v !== undefined) updateData.annualIncome = v
    }
    if (data.irTaxRate !== undefined) {
      const v = this.toDecimal(data.irTaxRate)
      if (v !== undefined) updateData.irTaxRate = v
    }
    if (data.ifiAmount !== undefined) {
      const v = this.toDecimal(data.ifiAmount)
      if (v !== undefined) updateData.ifiAmount = v
    }
    if (data.managementFees !== undefined) {
      const v = this.toDecimal(data.managementFees)
      if (v !== undefined) updateData.managementFees = v
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
        status: 'ARCHIVE',
      },
    })

    if (count === 0) {
      throw new Error('Client not found or access denied')
    }
  }

  async createClient(data: Record<string, unknown>) {
    const rawStatus = typeof data.status === 'string' ? data.status : undefined
    const status = rawStatus && (Object.values(ClientStatus) as string[]).includes(rawStatus)
      ? (rawStatus as ClientStatus)
      : ClientStatus.PROSPECT

    // Prepare data with Decimal conversions
    const createData: Prisma.ClientUncheckedCreateInput = {
      ...(data as unknown as Prisma.ClientUncheckedCreateInput),
      cabinetId: this.cabinetId,
      conseillerId: (data.conseillerId as string) || this.userId,
      status,
    }

    // Convert numeric fields to Decimal
    if (data.annualRevenue !== undefined) {
      const v = this.toDecimal(data.annualRevenue)
      if (v !== undefined) createData.annualRevenue = v
    }
    if (data.annualIncome !== undefined) {
      const v = this.toDecimal(data.annualIncome)
      if (v !== undefined) createData.annualIncome = v
    }
    if (data.irTaxRate !== undefined) {
      const v = this.toDecimal(data.irTaxRate)
      if (v !== undefined) createData.irTaxRate = v
    }
    if (data.ifiAmount !== undefined) {
      const v = this.toDecimal(data.ifiAmount)
      if (v !== undefined) createData.ifiAmount = v
    }
    if (data.managementFees !== undefined) {
      const v = this.toDecimal(data.managementFees)
      if (v !== undefined) createData.managementFees = v
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

  async listClients(filters?: ClientFilters) {
    const where: Record<string, unknown> = {
      cabinetId: this.cabinetId,
    }

    // Filtres de recherche
    if (filters?.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search, mode: 'insensitive' } }
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

    // Filtres par patrimoine
    if (filters?.minPatrimoine !== undefined || filters?.maxPatrimoine !== undefined) {
      // Ces filtres seront appliqués après récupération (pas de champ calculé en DB)
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
        },
        // Inclure actifs pour calculer le patrimoine
        actifs: {
          include: {
            actif: {
              select: {
                id: true,
                value: true,
                annualIncome: true
              }
            }
          }
        },
        // Inclure passifs
        passifs: {
          select: {
            id: true,
            remainingAmount: true,
            monthlyPayment: true
          }
        },
        // Compteurs
        _count: {
          select: {
            actifs: true,
            passifs: true,
            contrats: true,
            documents: true
          }
        }
      },
      orderBy: {
        lastName: 'asc'
      },
      take: filters?.limit || 50,
      skip: filters?.offset || 0
    })

    // Formater avec calcul du patrimoine
    type ClientWithRelations = typeof clients[number]
    const formattedClients = clients.map((client: ClientWithRelations) => {
      // Calculer total actifs
      const totalActifs = client.actifs?.reduce((sum, ca) => {
        const val = ca.actif?.value as Decimal | number | null
        return sum + (val ? (typeof val === 'object' && 'toNumber' in val ? val.toNumber() : Number(val)) : 0)
      }, 0) || 0

      // Calculer revenus des actifs
      const totalRevenusActifs = client.actifs?.reduce((sum, ca) => {
        const val = ca.actif?.annualIncome as Decimal | number | null
        return sum + (val ? (typeof val === 'object' && 'toNumber' in val ? val.toNumber() : Number(val)) : 0)
      }, 0) || 0

      // Calculer total passifs
      const totalPassifs = client.passifs?.reduce((sum, p) => {
        const val = p.remainingAmount as Decimal | number | null
        return sum + (val ? (typeof val === 'object' && 'toNumber' in val ? val.toNumber() : Number(val)) : 0)
      }, 0) || 0

      // Revenus client (annualIncome) + revenus des actifs
      const annualIncome = client.annualIncome 
        ? (typeof client.annualIncome.toNumber === 'function' ? client.annualIncome.toNumber() : Number(client.annualIncome))
        : 0

      const formatted = this.formatClient(client)
      
      // Supprimer les données volumineuses
      delete formatted.actifs
      delete formatted.passifs

      return {
        ...formatted,
        wealth: {
          totalActifs,
          totalPassifs,
          patrimoineNet: totalActifs - totalPassifs,
        },
        income: {
          annualIncome,
          totalRevenusActifs,
          totalRevenus: annualIncome + totalRevenusActifs
        },
        _count: client._count
      }
    })

    // Appliquer filtres par patrimoine si nécessaires
    type FormattedClient = typeof formattedClients[number]
    let result: FormattedClient[] = formattedClients
    if (filters?.minPatrimoine !== undefined) {
      result = result.filter((c) => c.wealth.patrimoineNet >= (filters.minPatrimoine as number))
    }
    if (filters?.maxPatrimoine !== undefined) {
      result = result.filter((c) => c.wealth.patrimoineNet <= (filters.maxPatrimoine as number))
    }

    return result
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
      this.prisma.tache.count({ where: { clientId: id, cabinetId: this.cabinetId, status: { not: 'TERMINE' } } }),
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
