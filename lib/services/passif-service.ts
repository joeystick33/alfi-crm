import { getPrismaClient, setRLSContext } from '../prisma'
import { PassifType } from '@prisma/client'

export interface CreatePassifInput {
  clientId: string
  type: PassifType
  name: string
  description?: string
  initialAmount: number
  remainingAmount: number
  interestRate: number
  monthlyPayment: number
  startDate: Date
  endDate: Date
  linkedActifId?: string
  insurance?: any
}

export interface UpdatePassifInput extends Partial<Omit<CreatePassifInput, 'clientId'>> {
  isActive?: boolean
}

export interface AmortizationSchedule {
  month: number
  date: Date
  payment: number
  principal: number
  interest: number
  remainingBalance: number
}

/**
 * Service de gestion des passifs (dettes et emprunts)
 * Gère les opérations CRUD et les calculs d'échéances
 */
export class PassifService {
  private prisma
  
  constructor(
    private cabinetId: string,
    private userId: string,
    private isSuperAdmin: boolean = false
  ) {
    this.prisma = getPrismaClient(cabinetId, isSuperAdmin)
  }

  /**
   * Crée un nouveau passif
   */
  async createPassif(data: CreatePassifInput) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    // Vérifier que le client existe
    const client = await this.prisma.client.findUnique({
      where: { id: data.clientId },
    })

    if (!client) {
      throw new Error('Client not found')
    }

    // Si linkedActifId, vérifier que l'actif existe et appartient au client
    if (data.linkedActifId) {
      const clientActif = await this.prisma.clientActif.findFirst({
        where: {
          clientId: data.clientId,
          actifId: data.linkedActifId,
        },
      })

      if (!clientActif) {
        throw new Error('Linked actif not found or does not belong to client')
      }
    }

    const passif = await this.prisma.passif.create({
      data: {
        cabinetId: this.cabinetId,
        ...data,
        isActive: true,
      },
    })

    return passif
  }

  /**
   * Récupère un passif par ID
   */
  async getPassifById(id: string) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const passif = await this.prisma.passif.findUnique({
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

    return passif
  }

  /**
   * Liste les passifs avec filtres
   */
  async listPassifs(filters?: {
    clientId?: string
    type?: PassifType
    isActive?: boolean
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

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    const passifs = await this.prisma.passif.findMany({
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
        remainingAmount: 'desc',
      },
    })

    return passifs
  }

  /**
   * Liste les passifs avec informations clients (alias)
   */
  async listPassifsWithClients(filters?: {
    clientId?: string
    type?: PassifType
    isActive?: boolean
    search?: string
  }) {
    const passifs = await this.listPassifs(filters)
    
    // Transform to match expected format
    return passifs.map(passif => ({
      ...passif,
      montantRestant: Number(passif.remainingAmount),
      tauxInteret: Number(passif.interestRate),
      mensualite: Number(passif.monthlyPayment),
      dateFin: passif.endDate,
      organisme: passif.lender,
      nom: passif.name
    }))
  }

  /**
   * Liste les passifs d'un client
   */
  async getClientPassifs(clientId: string) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const passifs = await this.prisma.passif.findMany({
      where: {
        clientId,
        isActive: true,
      },
      orderBy: {
        remainingAmount: 'desc',
      },
    })

    return passifs
  }

  /**
   * Met à jour un passif
   */
  async updatePassif(id: string, data: UpdatePassifInput) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const passif = await this.prisma.passif.update({
      where: { id },
      data,
    })

    return passif
  }

  /**
   * Met à jour le montant restant dû
   */
  async updateRemainingAmount(id: string, newAmount: number) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const passif = await this.prisma.passif.update({
      where: { id },
      data: { remainingAmount: newAmount },
    })

    // TODO: Déclencher le recalcul du patrimoine du client

    return passif
  }

  /**
   * Désactive un passif (remboursé ou clôturé)
   */
  async deactivatePassif(id: string) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const passif = await this.prisma.passif.update({
      where: { id },
      data: {
        isActive: false,
        remainingAmount: 0,
      },
    })

    return passif
  }

  /**
   * Calcule le tableau d'amortissement
   */
  calculateAmortizationSchedule(
    initialAmount: number,
    interestRate: number,
    monthlyPayment: number,
    startDate: Date
  ): AmortizationSchedule[] {
    const schedule: AmortizationSchedule[] = []
    let remainingBalance = initialAmount
    let month = 0
    const monthlyRate = interestRate / 100 / 12

    while (remainingBalance > 0.01 && month < 600) { // Max 50 ans
      month++
      const date = new Date(startDate)
      date.setMonth(date.getMonth() + month)

      const interest = remainingBalance * monthlyRate
      const principal = Math.min(monthlyPayment - interest, remainingBalance)
      remainingBalance -= principal

      schedule.push({
        month,
        date,
        payment: monthlyPayment,
        principal,
        interest,
        remainingBalance: Math.max(0, remainingBalance),
      })

      if (remainingBalance <= 0) break
    }

    return schedule
  }

  /**
   * Récupère le tableau d'amortissement d'un passif
   */
  async getAmortizationSchedule(id: string): Promise<AmortizationSchedule[]> {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const passif = await this.prisma.passif.findUnique({
      where: { id },
    })

    if (!passif) {
      throw new Error('Passif not found')
    }

    return this.calculateAmortizationSchedule(
      passif.initialAmount.toNumber(),
      passif.interestRate.toNumber(),
      passif.monthlyPayment.toNumber(),
      passif.startDate
    )
  }

  /**
   * Calcule le coût total d'un emprunt
   */
  async calculateTotalCost(id: string) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const passif = await this.prisma.passif.findUnique({
      where: { id },
    })

    if (!passif) {
      throw new Error('Passif not found')
    }

    const schedule = this.calculateAmortizationSchedule(
      passif.initialAmount.toNumber(),
      passif.interestRate.toNumber(),
      passif.monthlyPayment.toNumber(),
      passif.startDate
    )

    const totalPaid = schedule.reduce((sum, s) => sum + s.payment, 0)
    const totalInterest = schedule.reduce((sum, s) => sum + s.interest, 0)
    const totalPrincipal = schedule.reduce((sum, s) => sum + s.principal, 0)

    return {
      initialAmount: passif.initialAmount.toNumber(),
      totalPaid,
      totalInterest,
      totalPrincipal,
      costPercentage: (totalInterest / passif.initialAmount.toNumber()) * 100,
      numberOfPayments: schedule.length,
    }
  }

  /**
   * Calcule les échéances à venir
   */
  async getUpcomingPayments(id: string, months: number = 12) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const passif = await this.prisma.passif.findUnique({
      where: { id },
    })

    if (!passif) {
      throw new Error('Passif not found')
    }

    const schedule = this.calculateAmortizationSchedule(
      passif.initialAmount.toNumber(),
      passif.interestRate.toNumber(),
      passif.monthlyPayment.toNumber(),
      passif.startDate
    )

    const now = new Date()
    const futureDate = new Date()
    futureDate.setMonth(futureDate.getMonth() + months)

    return schedule.filter(s => s.date >= now && s.date <= futureDate)
  }

  /**
   * Simule un remboursement anticipé
   */
  async simulateEarlyRepayment(id: string, repaymentAmount: number) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const passif = await this.prisma.passif.findUnique({
      where: { id },
    })

    if (!passif) {
      throw new Error('Passif not found')
    }

    const currentRemaining = passif.remainingAmount.toNumber()
    const newRemaining = Math.max(0, currentRemaining - repaymentAmount)

    // Calculer les économies d'intérêts
    const currentSchedule = this.calculateAmortizationSchedule(
      currentRemaining,
      passif.interestRate.toNumber(),
      passif.monthlyPayment.toNumber(),
      new Date()
    )

    const newSchedule = this.calculateAmortizationSchedule(
      newRemaining,
      passif.interestRate.toNumber(),
      passif.monthlyPayment.toNumber(),
      new Date()
    )

    const currentTotalInterest = currentSchedule.reduce((sum, s) => sum + s.interest, 0)
    const newTotalInterest = newSchedule.reduce((sum, s) => sum + s.interest, 0)
    const interestSaved = currentTotalInterest - newTotalInterest

    const monthsSaved = currentSchedule.length - newSchedule.length

    return {
      currentRemaining,
      repaymentAmount,
      newRemaining,
      interestSaved,
      monthsSaved,
      newEndDate: newSchedule.length > 0 ? newSchedule[newSchedule.length - 1].date : new Date(),
    }
  }

  /**
   * Calcule le taux d'endettement d'un client
   */
  async calculateClientDebtRatio(clientId: string) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
      select: {
        annualIncome: true,
      },
    })

    if (!client || !client.annualIncome) {
      throw new Error('Client income not available')
    }

    const passifs = await this.prisma.passif.findMany({
      where: {
        clientId,
        isActive: true,
      },
    })

    const totalMonthlyPayments = passifs.reduce(
      (sum, p) => sum + p.monthlyPayment.toNumber(),
      0
    )

    const monthlyIncome = client.annualIncome.toNumber() / 12
    const debtRatio = (totalMonthlyPayments / monthlyIncome) * 100

    return {
      monthlyIncome,
      totalMonthlyPayments,
      debtRatio,
      isHealthy: debtRatio <= 33, // Seuil bancaire standard
    }
  }

  /**
   * Récupère les passifs arrivant à échéance
   */
  async getPassifsEndingSoon(months: number = 12) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const futureDate = new Date()
    futureDate.setMonth(futureDate.getMonth() + months)

    const passifs = await this.prisma.passif.findMany({
      where: {
        isActive: true,
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

    return passifs
  }

  /**
   * Récupère les statistiques des passifs du cabinet
   */
  async getCabinetPassifsStats() {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const passifs = await this.prisma.passif.findMany({
      where: { isActive: true },
    })

    const totalRemaining = passifs.reduce(
      (sum, p) => sum + p.remainingAmount.toNumber(),
      0
    )

    const totalMonthlyPayments = passifs.reduce(
      (sum, p) => sum + p.monthlyPayment.toNumber(),
      0
    )

    const byType = passifs.reduce((acc, p) => {
      const type = p.type
      if (!acc[type]) {
        acc[type] = {
          count: 0,
          totalRemaining: 0,
        }
      }
      acc[type].count++
      acc[type].totalRemaining += p.remainingAmount.toNumber()
      return acc
    }, {} as Record<string, { count: number; totalRemaining: number }>)

    return {
      totalPassifs: passifs.length,
      totalRemaining,
      totalMonthlyPayments,
      byType,
      averageInterestRate:
        passifs.reduce((sum, p) => sum + p.interestRate.toNumber(), 0) / passifs.length || 0,
    }
  }
}
