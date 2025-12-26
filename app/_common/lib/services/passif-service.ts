import { getPrismaClient } from '../prisma'
import type { PassifType } from '@/app/_common/lib/api-types'
import type { Prisma, Passif } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'
import { queuePatrimoineUpdate } from '@/lib/queues/helpers'

export interface CreatePassifInput {
  clientId: string
  type: PassifType
  name: string
  description?: string
  initialAmount: number
  remainingAmount: number
  interestRate: number
  monthlyPayment: number
  startDate?: Date
  endDate?: Date
  linkedActifId?: string
  insurance?: Record<string, unknown>
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


  private formatPassif<T extends object>(
    passif: T | null
  ):
    | (T & {
      initialAmount: number | null
      remainingAmount: number | null
      interestRate: number | null
      monthlyPayment: number | null
    })
    | null {
    if (!passif) {
      return null
    }

    const p = passif as Record<string, unknown>
    const toNumber = (value: unknown): number | null => {
      if (value && typeof value === 'object') {
        const rec = value as Record<string, unknown>
        const maybeToNumber = rec.toNumber
        if (typeof maybeToNumber === 'function') {
          return (maybeToNumber as () => number)()
        }
      }

      if (typeof value === 'number') return value
      if (value instanceof Decimal) return value.toNumber()
      return null
    }

    return {
      ...passif,
      initialAmount: toNumber(p.initialAmount),
      remainingAmount: toNumber(p.remainingAmount),
      interestRate: toNumber(p.interestRate),
      monthlyPayment: toNumber(p.monthlyPayment),
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
        initialAmount: new Decimal(data.initialAmount ?? 0),
        remainingAmount: new Decimal(data.remainingAmount ?? 0),
        interestRate: new Decimal(data.interestRate ?? 0),
        monthlyPayment: new Decimal(data.monthlyPayment ?? 0),
        startDate: data.startDate ?? new Date(),
        endDate: data.endDate,
        linkedActifId: data.linkedActifId,
        insurance: data.insurance as unknown,
        isActive: true,
      },
    })

    // Créer un événement timeline
    await this.prisma.timelineEvent.create({
      data: {
        cabinet: { connect: { id: this.cabinetId } },
        clientId: data.clientId,
        type: 'PASSIF_ADDED',
        title: 'Passif ajouté',
        description: `${data.name} - ${data.remainingAmount ?? data.initialAmount}€`,
        relatedEntityType: 'Passif',
        relatedEntityId: passif.id,
        createdBy: this.userId,
      },
    })

    // Déclencher le recalcul du patrimoine (BullMQ)
    await queuePatrimoineUpdate(data.clientId, this.cabinetId, 'passif', passif.id, this.userId)

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

    return this.formatPassif(passif as Prisma.PassifGetPayload<{ include: { client: true, documents: { include: { document: true } } } }>)
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
    const where: Prisma.PassifWhereInput = {
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
      montantRestant: (passif.remainingAmount as Decimal).toNumber(),
      tauxInteret: (passif.interestRate as Decimal).toNumber(),
      mensualite: (passif.monthlyPayment as Decimal).toNumber(),
      montantInitial: (passif.initialAmount as Decimal).toNumber(),
      dateFin: passif.endDate,
      organisme: (passif as Passif).lenderName,
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
    // Récupérer le passif avant modification pour l'historique
    const existingPassif = await this.getPassifById(id)
    if (!existingPassif) {
      throw new Error('Passif not found or access denied')
    }

    const updateData = {} as Prisma.PassifUncheckedUpdateManyInput

    if (data.type !== undefined) updateData.type = data.type
    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.startDate !== undefined) updateData.startDate = data.startDate
    if (data.endDate !== undefined) updateData.endDate = data.endDate
    if (data.linkedActifId !== undefined) updateData.linkedActifId = data.linkedActifId
    if (data.isActive !== undefined) updateData.isActive = data.isActive
    if (data.insurance !== undefined) updateData.insurance = data.insurance as unknown as Prisma.InputJsonValue

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

    // Créer un événement timeline
    await this.prisma.timelineEvent.create({
      data: {
        cabinet: { connect: { id: this.cabinetId } },
        clientId: existingPassif.clientId,
        type: 'PASSIF_UPDATED',
        title: 'Passif modifié',
        description: `${data.name || (existingPassif as Passif).name} - Restant dû: ${data.remainingAmount !== undefined ? data.remainingAmount : ((existingPassif as Passif).remainingAmount as unknown as Decimal).toNumber()}€`,
        relatedEntityType: 'Passif',
        relatedEntityId: id,
        createdBy: this.userId,
      },
    })

    // Déclencher le recalcul du patrimoine (BullMQ)
    await queuePatrimoineUpdate(existingPassif.clientId, this.cabinetId, 'passif', id, this.userId)

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

    // Déclencher le recalcul du patrimoine (BullMQ)
    const passif = await this.getPassifById(id)
    if (passif) {
      await queuePatrimoineUpdate(passif.clientId, this.cabinetId, 'passif', id, this.userId)
    }

    return passif
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

    const passif = await this.getPassifById(id)
    if (passif) {
      // Déclencher le recalcul du patrimoine (BullMQ)
      await queuePatrimoineUpdate(passif.clientId, this.cabinetId, 'passif', id, this.userId)
    }

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

    return schedule.filter((s) => s.date >= now && s.date <= futureDate)
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
    // Récupérer le passif avant suppression pour l'historique
    const existingPassif = await this.getPassifById(id)
    if (!existingPassif) {
      throw new Error('Passif not found or access denied')
    }

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

    // Créer un événement timeline
    await this.prisma.timelineEvent.create({
      data: {
        cabinet: { connect: { id: this.cabinetId } },
        clientId: existingPassif.clientId,
        type: 'PASSIF_DELETED',
        title: 'Passif supprimé',
        description: `${(existingPassif as Passif).name} (${((existingPassif as Passif).remainingAmount as unknown as Decimal).toNumber()}€)`,
        relatedEntityType: 'Passif',
        relatedEntityId: id,
        createdBy: this.userId,
      },
    })

    // Déclencher le recalcul du patrimoine (BullMQ)
    await queuePatrimoineUpdate(existingPassif.clientId, this.cabinetId, 'passif', id, this.userId)

    return this.getPassifById(id)
  }
}
