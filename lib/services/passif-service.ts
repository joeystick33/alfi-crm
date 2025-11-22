import { getPrismaClient } from '../prisma'
import { PassifType } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

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

  private formatPassif(passif: any) {
    if (!passif) {
      return null
    }

    const toNumber = (value: any) => (value?.toNumber ? value.toNumber() : value ?? null)

    return {
      ...passif,
      initialAmount: toNumber(passif.initialAmount),
      remainingAmount: toNumber(passif.remainingAmount),
      interestRate: toNumber(passif.interestRate),
      monthlyPayment: toNumber(passif.monthlyPayment),
    }
  }

  /**
   * Crée un nouveau passif
   */
  async createPassif(data: CreatePassifInput) {
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

    // Si linkedActifId, vérifier que l'actif existe et appartient au client
    if (data.linkedActifId) {
      const clientActif = await this.prisma.clientActif.findFirst({
        where: {
          clientId: data.clientId,
          actifId: data.linkedActifId,
          actif: {
            cabinetId: this.cabinetId,
          },
        },
      })

      if (!clientActif) {
        throw new Error('Linked actif not found or does not belong to client')
      }
    }

    const passif = await this.prisma.passif.create({
      data: {
        cabinetId: this.cabinetId,
        clientId: data.clientId,
        type: data.type,
        name: data.name,
        description: data.description,
        initialAmount: new Decimal(data.initialAmount),
        remainingAmount: new Decimal(data.remainingAmount),
        interestRate: new Decimal(data.interestRate),
        monthlyPayment: new Decimal(data.monthlyPayment),
        startDate: data.startDate,
        endDate: data.endDate,
        linkedActifId: data.linkedActifId,
        insurance: data.insurance,
        isActive: true,
      },
    })

    return this.getPassifById(passif.id)
  }

  /**
   * Récupère un passif par ID
   */
  async getPassifById(id: string) {
    const passif = await this.prisma.passif.findFirst({
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

    return this.formatPassif(passif)
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
    const where: any = {
      cabinetId: this.cabinetId,
    }

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

    return this.prisma.passif.findMany({
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
      ...this.formatPassif(passif),
      montantRestant: passif.remainingAmount.toNumber(),
      tauxInteret: passif.interestRate.toNumber(),
      mensualite: passif.monthlyPayment.toNumber(),
      montantInitial: passif.initialAmount.toNumber(),
      dateFin: passif.endDate,
      organisme: passif.lender,
      nom: passif.name,
    }))
  }

  /**
   * Liste les passifs d'un client
   */
  async getClientPassifs(clientId: string) {
    const passifs = await this.prisma.passif.findMany({
      where: {
        clientId,
        isActive: true,
      },
      orderBy: {
        remainingAmount: 'desc',
      },
    })

    return passifs.map(passif => this.formatPassif(passif))
  }

  /**
   * Met à jour un passif
   */
  async updatePassif(id: string, data: UpdatePassifInput) {
    const updateData: any = { ...data }

    if (data.initialAmount !== undefined) {
      updateData.initialAmount = new Decimal(data.initialAmount)
    }
    if (data.remainingAmount !== undefined) {
      updateData.remainingAmount = new Decimal(data.remainingAmount)
    }
    if (data.interestRate !== undefined) {
      updateData.interestRate = new Decimal(data.interestRate)
    }
    if (data.monthlyPayment !== undefined) {
      updateData.monthlyPayment = new Decimal(data.monthlyPayment)
    }

    const { count } = await this.prisma.passif.updateMany({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
      data: updateData,
    })

    if (count === 0) {
      throw new Error('Passif not found or access denied')
    }

    return this.getPassifById(id)
  }

  /**
   * Met à jour le montant restant dû
   */
  async updateRemainingAmount(id: string, newAmount: number) {
    const { count } = await this.prisma.passif.updateMany({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
      data: { remainingAmount: new Decimal(newAmount) },
    })

    if (count === 0) {
      throw new Error('Passif not found or access denied')
    }

    // TODO: Déclencher le recalcul du patrimoine du client

    return this.getPassifById(id)
  }

  /**
   * Désactive un passif (remboursé ou clôturé)
   */
  async deactivatePassif(id: string) {
    const { count } = await this.prisma.passif.updateMany({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
      data: {
        isActive: false,
        remainingAmount: new Decimal(0),
      },
    })

    if (count === 0) {
      throw new Error('Passif not found or access denied')
    }

    return this.getPassifById(id)
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
    const passif = await this.prisma.passif.findFirst({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
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
    const passif = await this.prisma.passif.findFirst({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
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

    const totalPaid = schedule.reduce((sum: number, s: AmortizationSchedule) => sum + s.payment, 0)
    const totalInterest = schedule.reduce((sum: number, s: AmortizationSchedule) => sum + s.interest, 0)
    const totalPrincipal = schedule.reduce((sum: number, s: AmortizationSchedule) => sum + s.principal, 0)

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
    const passif = await this.prisma.passif.findFirst({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
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

    return schedule.filter((s: any) => s.date >= now && s.date <= futureDate)
  }

  /**
   * Simule un remboursement anticipé
   */
  async simulateEarlyRepayment(id: string, repaymentAmount: number) {
    const passif = await this.prisma.passif.findFirst({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
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

    const currentTotalInterest = currentSchedule.reduce((sum: any, s: any) => sum + s.interest, 0)
    const newTotalInterest = newSchedule.reduce((sum: any, s: any) => sum + s.interest, 0)
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
    const client = await this.prisma.client.findFirst({
      where: {
        id: clientId,
        cabinetId: this.cabinetId,
      },
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
      (sum: number, p) => sum + p.monthlyPayment.toNumber(),
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
    const futureDate = new Date()
    futureDate.setMonth(futureDate.getMonth() + months)

    const passifs = await this.prisma.passif.findMany({
      where: {
        isActive: true,
        cabinetId: this.cabinetId,
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
    const passifs = await this.prisma.passif.findMany({
      where: { isActive: true, cabinetId: this.cabinetId },
    })

    const totalRemaining = passifs.reduce(
      (sum: number, p) => sum + p.remainingAmount.toNumber(),
      0
    )

    const totalMonthlyPayments = passifs.reduce(
      (sum: number, p) => sum + p.monthlyPayment.toNumber(),
      0
    )

    const byType = passifs.reduce((acc: Record<string, { count: number; totalRemaining: number }>, p) => {
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
        passifs.reduce((sum: number, p) => sum + p.interestRate.toNumber(), 0) / passifs.length || 0,
    }
  }

  /**
   * Supprime (désactive) un passif
   */
  async deletePassif(id: string) {
    const { count } = await this.prisma.passif.updateMany({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    })

    if (count === 0) {
      throw new Error('Passif not found or access denied')
    }

    return this.getPassifById(id)
  }
}
