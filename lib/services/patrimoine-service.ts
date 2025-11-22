import { getPrismaClient } from '../prisma'
import { ActifType, ActifCategory, PassifType, ContratType, ContratStatus } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

export interface PatrimoineCalculation {
  totalActifs: number
  totalPassifs: number
  netWealth: number
  managedAssets: number
  unmanagedAssets: number
  actifsByCategory: Record<string, number>
  actifsByType: Record<string, number>
  passifsByType: Record<string, number>
  allocationPercentages: {
    immobilier: number
    financier: number
    professionnel: number
    autre: number
  }
  lastCalculated: Date
}

export interface CreateActifInput {
  type: ActifType
  category: ActifCategory
  name: string
  description?: string
  value: number
  acquisitionDate?: Date
  acquisitionValue?: number
  details?: any
  annualIncome?: number
  taxDetails?: any
  managedByFirm?: boolean
  managementFees?: number
}

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

/**
 * Service de gestion du patrimoine
 * Gère les actifs, passifs, contrats et calculs patrimoniaux
 */
export class PatrimoineService {
  private prisma
  
  constructor(
    private cabinetId: string,
    private userId: string,
    private userRole: string,
    private isSuperAdmin: boolean = false
  ) {
    this.prisma = getPrismaClient(cabinetId, isSuperAdmin)
  }

  private toNumber(value: any) {
    if (value === null || value === undefined) {
      return null
    }

    if (typeof value === 'object' && typeof value?.toNumber === 'function') {
      return value.toNumber()
    }

    return value
  }

  private formatClientActif(clientActif: any) {
    if (!clientActif) {
      return null
    }

    const formatted: any = {
      ...clientActif,
      ownershipPercentage: this.toNumber(clientActif.ownershipPercentage),
    }

    if (clientActif.actif) {
      formatted.actif = this.formatActif(clientActif.actif)
    }

    return formatted
  }

  private formatActif(actif: any) {
    if (!actif) {
      return null
    }

    return {
      ...actif,
      value: this.toNumber(actif.value),
      acquisitionValue: this.toNumber(actif.acquisitionValue),
      annualIncome: this.toNumber(actif.annualIncome),
      managementFees: this.toNumber(actif.managementFees),
      clients: actif.clients?.map((clientActif: any) => this.formatClientActif(clientActif)) ?? [],
    }
  }

  private formatPassif(passif: any) {
    if (!passif) {
      return null
    }

    return {
      ...passif,
      initialAmount: this.toNumber(passif.initialAmount),
      remainingAmount: this.toNumber(passif.remainingAmount),
      interestRate: this.toNumber(passif.interestRate),
      monthlyPayment: this.toNumber(passif.monthlyPayment),
    }
  }

  private formatContrat(contrat: any) {
    if (!contrat) {
      return null
    }

    return {
      ...contrat,
      premium: this.toNumber(contrat.premium),
      coverage: this.toNumber(contrat.coverage),
      value: this.toNumber(contrat.value),
      commission: this.toNumber(contrat.commission),
    }
  }

  // ============================================
  // ACTIFS
  // ============================================

  /**
   * Crée un nouvel actif
   */
  async createActif(data: CreateActifInput) {
    const actif = await this.prisma.actif.create({
      data: {
        cabinetId: this.cabinetId,
        ...data,
        value: new Decimal(data.value),
        acquisitionValue: data.acquisitionValue ? new Decimal(data.acquisitionValue) : undefined,
        annualIncome: data.annualIncome ? new Decimal(data.annualIncome) : undefined,
        managementFees: data.managementFees ? new Decimal(data.managementFees) : undefined,
      },
    })

    return this.getActifById(actif.id)
  }

  /**
   * Lie un actif à un client avec pourcentage de propriété
   */
  async linkActifToClient(
    actifId: string,
    clientId: string,
    ownershipPercentage: number = 100,
    ownershipType?: string
  ) {
    // Vérifier que l'actif et le client existent
    const [actif, client] = await Promise.all([
      this.prisma.actif.findFirst({
        where: {
          id: actifId,
          cabinetId: this.cabinetId,
          isActive: true,
        },
      }),
      this.prisma.client.findFirst({
        where: {
          id: clientId,
          cabinetId: this.cabinetId,
        },
      }),
    ])

    if (!actif) throw new Error('Actif not found')
    if (!client) throw new Error('Client not found')

    const clientActif = await this.prisma.clientActif.create({
      data: {
        clientId,
        actifId,
        ownershipPercentage: new Decimal(ownershipPercentage),
        ownershipType,
      },
    })

    // Créer un événement timeline
    await this.prisma.timelineEvent.create({
      data: {
        cabinetId: this.cabinetId,
        clientId,
        type: 'ASSET_ADDED',
        title: 'Actif ajouté',
        description: `Actif "${actif.name}" ajouté au patrimoine`,
        relatedEntityType: 'Actif',
        relatedEntityId: actifId,
        createdBy: this.userId,
      },
    })

    // Recalculer le patrimoine du client
    await this.calculateAndUpdateClientWealth(clientId)

    return this.formatClientActif(clientActif)
  }

  /**
   * Récupère un actif par ID
   */
  async getActifById(id: string) {
    const actif = await this.prisma.actif.findFirst({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
      include: {
        clients: {
          include: {
            client: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        documents: {
          include: {
            document: true,
          },
        },
      },
    })

    return this.formatActif(actif)
  }

  /**
   * Liste les actifs avec filtres
   */
  async listActifs(filters?: {
    type?: ActifType
    category?: ActifCategory
    clientId?: string
    managedByFirm?: boolean
    minValue?: number
    maxValue?: number
  }) {
    const where: any = {
      isActive: true,
      cabinetId: this.cabinetId,
    }

    if (filters?.type) {
      where.type = filters.type
    }

    if (filters?.category) {
      where.category = filters.category
    }

    if (filters?.managedByFirm !== undefined) {
      where.managedByFirm = filters.managedByFirm
    }

    if (filters?.minValue !== undefined) {
      where.value = { ...where.value, gte: new Decimal(filters.minValue) }
    }

    if (filters?.maxValue !== undefined) {
      where.value = { ...where.value, lte: new Decimal(filters.maxValue) }
    }

    if (filters?.clientId) {
      where.clients = {
        some: {
          clientId: filters.clientId,
        },
      }
    }

    const actifs = await this.prisma.actif.findMany({
      where,
      include: {
        clients: {
          include: {
            client: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: {
        value: 'desc',
      },
    })

    return actifs.map(actif => this.formatActif(actif))
  }

  /**
   * Met à jour un actif
   */
  async updateActif(id: string, data: Partial<CreateActifInput>) {
    const updateData: any = { ...data }
    
    if (data.value !== undefined) {
      updateData.value = new Decimal(data.value)
    }
    if (data.acquisitionValue !== undefined) {
      updateData.acquisitionValue = new Decimal(data.acquisitionValue)
    }
    if (data.annualIncome !== undefined) {
      updateData.annualIncome = new Decimal(data.annualIncome)
    }
    if (data.managementFees !== undefined) {
      updateData.managementFees = new Decimal(data.managementFees)
    }

    const { count } = await this.prisma.actif.updateMany({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
      data: updateData,
    })

    if (count === 0) {
      throw new Error('Actif not found or access denied')
    }

    const actif = await this.getActifById(id)

    // Recalculer le patrimoine des clients liés
    const clientActifs = await this.prisma.clientActif.findMany({
      where: { actifId: id },
      select: { clientId: true },
    })

    for (const ca of clientActifs) {
      await this.calculateAndUpdateClientWealth(ca.clientId)
    }

    return this.getActifById(id)
  }

  /**
   * Supprime un actif (soft delete)
   */
  async deleteActif(id: string) {
    const { count } = await this.prisma.actif.updateMany({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
      data: { isActive: false },
    })

    if (count === 0) {
      throw new Error('Actif not found or access denied')
    }

    // Recalculer le patrimoine des clients liés
    const clientActifs = await this.prisma.clientActif.findMany({
      where: { actifId: id },
      select: { clientId: true },
    })

    for (const ca of clientActifs) {
      await this.calculateAndUpdateClientWealth(ca.clientId)
    }

    return this.getActifById(id)
  }

  // ============================================
  // PASSIFS
  // ============================================

  /**
   * Crée un nouveau passif
   */
  async createPassif(data: CreatePassifInput) {
    const passif = await this.prisma.passif.create({
      data: {
        cabinetId: this.cabinetId,
        ...data,
        initialAmount: new Decimal(data.initialAmount),
        remainingAmount: new Decimal(data.remainingAmount),
        interestRate: new Decimal(data.interestRate),
        monthlyPayment: new Decimal(data.monthlyPayment),
      },
    })

    // Créer un événement timeline
    await this.prisma.timelineEvent.create({
      data: {
        cabinetId: this.cabinetId,
        clientId: data.clientId,
        type: 'OTHER',
        title: 'Passif ajouté',
        description: `Passif "${passif.name}" ajouté`,
        relatedEntityType: 'Passif',
        relatedEntityId: passif.id,
        createdBy: this.userId,
      },
    })

    // Recalculer le patrimoine du client
    await this.calculateAndUpdateClientWealth(data.clientId)

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
          },
        },
        documents: {
          include: {
            document: true,
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

    const passifs = await this.prisma.passif.findMany({
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
        remainingAmount: 'desc',
      },
    })

    return passifs.map(passif => this.formatPassif(passif))
  }

  /**
   * Met à jour un passif
   */
  async updatePassif(id: string, data: Partial<CreatePassifInput>) {
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

    const passif = await this.getPassifById(id)

    // Recalculer le patrimoine du client
    if (passif.clientId) {
      await this.calculateAndUpdateClientWealth(passif.clientId)
    }

    return passif
  }

  /**
   * Supprime un passif (soft delete)
   */
  async deletePassif(id: string) {
    const passif = await this.prisma.passif.findFirst({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
      select: { clientId: true },
    })

    const { count } = await this.prisma.passif.updateMany({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
      data: { isActive: false },
    })

    if (count === 0) {
      throw new Error('Passif not found or access denied')
    }

    // Recalculer le patrimoine du client
    if (passif?.clientId) {
      await this.calculateAndUpdateClientWealth(passif.clientId)
    }

    return { success: true }
  }

  // ============================================
  // CONTRATS
  // ============================================

  /**
   * Crée un nouveau contrat
   */
  async createContrat(data: CreateContratInput) {
    const contrat = await this.prisma.contrat.create({
      data: {
        cabinetId: this.cabinetId,
        ...data,
        premium: data.premium ? new Decimal(data.premium) : undefined,
        coverage: data.coverage ? new Decimal(data.coverage) : undefined,
        value: data.value ? new Decimal(data.value) : undefined,
        commission: data.commission ? new Decimal(data.commission) : undefined,
      },
    })

    // Créer un événement timeline
    await this.prisma.timelineEvent.create({
      data: {
        cabinetId: this.cabinetId,
        clientId: data.clientId,
        type: 'CONTRACT_SIGNED',
        title: 'Contrat signé',
        description: `Contrat "${contrat.name}" signé`,
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
          },
        },
        documents: {
          include: {
            document: true,
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
    renewalDueSoon?: boolean
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

    if (filters?.status) {
      where.status = filters.status
    }

    if (filters?.renewalDueSoon) {
      const threeMonthsFromNow = new Date()
      threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3)
      
      where.nextRenewalDate = {
        lte: threeMonthsFromNow,
        gte: new Date(),
      }
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
        nextRenewalDate: 'asc',
      },
    })

    return contrats.map(contrat => this.formatContrat(contrat))
  }

  /**
   * Met à jour un contrat
   */
  async updateContrat(id: string, data: Partial<CreateContratInput> & { status?: ContratStatus }) {
    const updateData: any = { ...data }
    
    if (data.premium !== undefined) {
      updateData.premium = new Decimal(data.premium)
    }
    if (data.coverage !== undefined) {
      updateData.coverage = new Decimal(data.coverage)
    }
    if (data.value !== undefined) {
      updateData.value = new Decimal(data.value)
    }
    if (data.commission !== undefined) {
      updateData.commission = new Decimal(data.commission)
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
   * Renouvelle un contrat
   */
  async renewContrat(id: string, newEndDate: Date, newPremium?: number) {
    const updateData: any = {
      endDate: newEndDate,
      status: 'ACTIVE',
    }

    if (newPremium !== undefined) {
      updateData.premium = new Decimal(newPremium)
    }

    // Calculer la prochaine date de renouvellement (1 an avant la fin)
    const nextRenewal = new Date(newEndDate)
    nextRenewal.setFullYear(nextRenewal.getFullYear() - 1)
    updateData.nextRenewalDate = nextRenewal

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

    const contrat = await this.getContratById(id)

    if (!contrat) {
      throw new Error('Contrat not found after renewal')
    }

    // Créer un événement timeline
    await this.prisma.timelineEvent.create({
      data: {
        cabinetId: this.cabinetId,
        clientId: contrat.clientId,
        type: 'OTHER',
        title: 'Contrat renouvelé',
        description: `Contrat "${contrat.name}" renouvelé`,
        relatedEntityType: 'Contrat',
        relatedEntityId: contrat.id,
        createdBy: this.userId,
      },
    })

    return contrat
  }

  // ============================================
  // CALCULS PATRIMONIAUX
  // ============================================

  /**
   * Calcule le patrimoine complet d'un client
   */
  async calculateClientWealth(clientId: string): Promise<PatrimoineCalculation> {
    // Récupérer tous les actifs du client
    const clientActifs = await this.prisma.clientActif.findMany({
      where: { clientId, actif: { isActive: true } },
      include: {
        actif: true,
      },
    })

    // Récupérer tous les passifs du client
    const passifs = await this.prisma.passif.findMany({
      where: { clientId, isActive: true },
    })

    // Calculer le total des actifs
    let totalActifs = 0
    let managedAssets = 0
    let unmanagedAssets = 0
    const actifsByCategory: Record<string, number> = {}
    const actifsByType: Record<string, number> = {}

    for (const ca of clientActifs) {
      if (!ca.actif) continue

      const actifValue = this.toNumber(ca.actif.value) ?? 0
      const ownershipPercentage = this.toNumber(ca.ownershipPercentage) ?? 0
      const clientShare = (actifValue * ownershipPercentage) / 100

      totalActifs += clientShare

      // Actifs gérés vs non gérés
      if (ca.actif.managedByFirm) {
        managedAssets += clientShare
      } else {
        unmanagedAssets += clientShare
      }

      // Par catégorie
      const category = ca.actif.category
      actifsByCategory[category] = (actifsByCategory[category] || 0) + clientShare

      // Par type
      const type = ca.actif.type
      actifsByType[type] = (actifsByType[type] || 0) + clientShare
    }

    // Calculer le total des passifs
    let totalPassifs = 0
    const passifsByType: Record<string, number> = {}

    for (const passif of passifs) {
      const passifValue = this.toNumber(passif.remainingAmount) ?? 0
      totalPassifs += passifValue

      const type = passif.type
      passifsByType[type] = (passifsByType[type] || 0) + passifValue
    }

    // Calculer le patrimoine net
    const netWealth = totalActifs - totalPassifs

    // Calculer les pourcentages d'allocation
    const allocationPercentages = {
      immobilier: totalActifs > 0 ? (actifsByCategory['IMMOBILIER'] || 0) / totalActifs * 100 : 0,
      financier: totalActifs > 0 ? (actifsByCategory['FINANCIER'] || 0) / totalActifs * 100 : 0,
      professionnel: totalActifs > 0 ? (actifsByCategory['PROFESSIONNEL'] || 0) / totalActifs * 100 : 0,
      autre: totalActifs > 0 ? (actifsByCategory['AUTRE'] || 0) / totalActifs * 100 : 0,
    }

    return {
      totalActifs,
      totalPassifs,
      netWealth,
      managedAssets,
      unmanagedAssets,
      actifsByCategory,
      actifsByType,
      passifsByType,
      allocationPercentages,
      lastCalculated: new Date(),
    }
  }

  /**
   * Calcule et met à jour le patrimoine d'un client dans la base
   */
  async calculateAndUpdateClientWealth(clientId: string) {
    const wealth = await this.calculateClientWealth(clientId)

    const { count } = await this.prisma.client.updateMany({
      where: {
        id: clientId,
        cabinetId: this.cabinetId,
      },
      data: {
        wealth: wealth as any,
      },
    })

    if (count === 0) {
      throw new Error('Client not found or access denied')
    }

    return wealth
  }

  /**
   * Récupère les actifs d'un client
   */
  async getClientActifs(clientId: string) {
    const clientActifs = await this.prisma.clientActif.findMany({
      where: { clientId, actif: { isActive: true } },
      include: {
        actif: true,
      },
    })

    return clientActifs.map(ca => this.formatClientActif(ca))
  }

  /**
   * Récupère les passifs d'un client
   */
  async getClientPassifs(clientId: string) {
    const passifs = await this.prisma.passif.findMany({
      where: { clientId, isActive: true },
    })

    return passifs.map(passif => this.formatPassif(passif))
  }

  /**
   * Récupère les contrats d'un client
   */
  async getClientContrats(clientId: string) {
    const contrats = await this.prisma.contrat.findMany({
      where: { clientId },
    })

    return contrats.map(contrat => this.formatContrat(contrat))
  }

  /**
   * Récupère le patrimoine complet d'un client (actifs + passifs + contrats)
   */
  async getClientPatrimoine(clientId: string) {
    const [actifs, passifs, contrats, wealth] = await Promise.all([
      this.getClientActifs(clientId),
      this.getClientPassifs(clientId),
      this.getClientContrats(clientId),
      this.calculateClientWealth(clientId),
    ])

    return {
      actifs,
      passifs,
      contrats,
      wealth,
    }
  }

  /**
   * Détecte les opportunités patrimoniales
   */
  async detectPatrimoineOpportunities(clientId: string) {
    const wealth = await this.calculateClientWealth(clientId)
    const opportunities: Array<{
      type: string
      priority: string
      description: string
      estimatedValue?: number
    }> = []

    // Opportunité: Diversification si trop concentré
    if (wealth.allocationPercentages.immobilier > 70) {
      opportunities.push({
        type: 'REAL_ESTATE_INVESTMENT',
        priority: 'HIGH',
        description: 'Patrimoine trop concentré en immobilier (>70%). Diversification recommandée.',
      })
    }

    // Opportunité: Optimisation fiscale si patrimoine élevé
    if (wealth.netWealth > 1300000) {
      opportunities.push({
        type: 'TAX_OPTIMIZATION',
        priority: 'HIGH',
        description: 'Patrimoine net supérieur au seuil IFI. Optimisation fiscale recommandée.',
        estimatedValue: wealth.netWealth * 0.01, // Estimation 1% d'économie
      })
    }

    // Opportunité: Restructuration de dettes
    const highInterestPassifs = await this.prisma.passif.findMany({
      where: {
        clientId,
        isActive: true,
        interestRate: { gte: new Decimal(4) },
      },
    })

    if (highInterestPassifs.length > 0) {
      const totalHighInterest = highInterestPassifs.reduce(
        (sum: number, p: typeof highInterestPassifs[0]) => sum + (this.toNumber(p.remainingAmount) ?? 0),
        0
      )
      opportunities.push({
        type: 'LOAN_RESTRUCTURING',
        priority: 'MEDIUM',
        description: `${highInterestPassifs.length} prêt(s) à taux élevé (>4%). Restructuration possible.`,
        estimatedValue: totalHighInterest * 0.02, // Estimation 2% d'économie
      })
    }

    // Opportunité: Assurance-vie si pas assez d'épargne financière
    if (wealth.allocationPercentages.financier < 20 && wealth.netWealth > 100000) {
      opportunities.push({
        type: 'LIFE_INSURANCE',
        priority: 'MEDIUM',
        description: 'Faible allocation en produits financiers (<20%). Assurance-vie recommandée.',
      })
    }

    return opportunities
  }

  /**
   * Récupère les statistiques globales du patrimoine d'un cabinet
   */
  async getCabinetStats() {
    const [actifs, passifs, contrats] = await Promise.all([
      this.prisma.actif.findMany({
        where: { cabinetId: this.cabinetId, isActive: true },
        select: {
          value: true,
          managedByFirm: true,
        },
      }),
      this.prisma.passif.findMany({
        where: { cabinetId: this.cabinetId, isActive: true },
        select: {
          initialAmount: true,
          remainingAmount: true,
        },
      }),
      this.prisma.contrat.findMany({
        where: { cabinetId: this.cabinetId },
        select: {
          status: true,
          value: true,
        },
      }),
    ])

    const totalActifs = actifs.reduce((sum, actif) => sum + (this.toNumber(actif.value) ?? 0), 0)
    const totalPassifs = passifs.reduce((sum, passif) => sum + (this.toNumber(passif.initialAmount) ?? 0), 0)
    const totalWealth = totalActifs - totalPassifs

    const actifsGeres = actifs.filter(actif => !!actif.managedByFirm).length
    const actifsNonGeres = actifs.length - actifsGeres
    const contratsActifs = contrats.filter(contrat => contrat.status === 'ACTIVE').length

    return {
      totalWealth,
      totalActifs,
      totalPassifs,
      wealthGrowth: 0,
      actifsCount: actifs.length,
      passifsCount: passifs.length,
      contratsCount: contrats.length,
      contratsActifs,
      actifsGeres,
      actifsNonGeres,
    }
  }
}
