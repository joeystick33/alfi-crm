import { getPrismaClient, setRLSContext } from '../prisma'
import { ApporteurType } from '@prisma/client'

export interface CreateApporteurInput {
  type: ApporteurType
  firstName: string
  lastName: string
  email: string
  phone?: string
  company?: string
  profession?: string
  commissionRate?: number
  ownerId?: string
}

export interface UpdateApporteurInput {
  type?: ApporteurType
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  company?: string
  profession?: string
  commissionRate?: number
  ownerId?: string
  isActive?: boolean
}

/**
 * Service de gestion des apporteurs d'affaires
 * Gère les opérations CRUD et le calcul des commissions
 */
export class ApporteurService {
  private prisma
  
  constructor(
    private cabinetId: string,
    private userId: string,
    private isSuperAdmin: boolean = false
  ) {
    this.prisma = getPrismaClient(cabinetId, isSuperAdmin)
  }

  /**
   * Crée un nouvel apporteur d'affaires
   */
  async createApporteur(data: CreateApporteurInput) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    // Vérifier que l'email n'existe pas déjà
    const existing = await this.prisma.apporteurAffaires.findFirst({
      where: {
        cabinetId: this.cabinetId,
        email: data.email,
      },
    })

    if (existing) {
      throw new Error('Email already exists for this cabinet')
    }

    const apporteur = await this.prisma.apporteurAffaires.create({
      data: {
        cabinetId: this.cabinetId,
        type: data.type,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        company: data.company,
        profession: data.profession,
        commissionRate: data.commissionRate,
        ownerId: data.ownerId,
        isActive: true,
      },
    })

    return apporteur
  }

  /**
   * Récupère un apporteur par ID
   */
  async getApporteurById(id: string) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const apporteur = await this.prisma.apporteurAffaires.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            clients: true,
          },
        },
      },
    })

    return apporteur
  }

  /**
   * Liste tous les apporteurs du cabinet
   */
  async listApporteurs(filters?: {
    type?: ApporteurType
    isActive?: boolean
    ownerId?: string
    search?: string
  }) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const where: any = {}

    if (filters?.type) {
      where.type = filters.type
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive
    }

    if (filters?.ownerId) {
      where.ownerId = filters.ownerId
    }

    if (filters?.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { company: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    const apporteurs = await this.prisma.apporteurAffaires.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            clients: true,
          },
        },
      },
      orderBy: {
        lastName: 'asc',
      },
    })

    return apporteurs
  }

  /**
   * Met à jour un apporteur
   */
  async updateApporteur(id: string, data: UpdateApporteurInput) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    // Vérifier que l'apporteur existe
    const existing = await this.prisma.apporteurAffaires.findUnique({
      where: { id },
    })

    if (!existing) {
      throw new Error('Apporteur not found')
    }

    // Si l'email change, vérifier qu'il n'est pas déjà utilisé
    if (data.email && data.email !== existing.email) {
      const emailExists = await this.prisma.apporteurAffaires.findFirst({
        where: {
          cabinetId: this.cabinetId,
          email: data.email,
          id: { not: id },
        },
      })

      if (emailExists) {
        throw new Error('Email already exists')
      }
    }

    const apporteur = await this.prisma.apporteurAffaires.update({
      where: { id },
      data,
    })

    return apporteur
  }

  /**
   * Désactive un apporteur (soft delete)
   */
  async deactivateApporteur(id: string) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const apporteur = await this.prisma.apporteurAffaires.update({
      where: { id },
      data: { isActive: false },
    })

    return apporteur
  }

  /**
   * Réactive un apporteur
   */
  async reactivateApporteur(id: string) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const apporteur = await this.prisma.apporteurAffaires.update({
      where: { id },
      data: { isActive: true },
    })

    return apporteur
  }

  /**
   * Récupère les clients apportés par un apporteur
   */
  async getApporteurClients(id: string) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const clients = await this.prisma.client.findMany({
      where: {
        apporteurId: id,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        status: true,
        createdAt: true,
        conseiller: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return clients
  }

  /**
   * Calcule les commissions d'un apporteur
   */
  async calculateCommissions(
    id: string,
    startDate?: Date,
    endDate?: Date
  ) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const apporteur = await this.prisma.apporteurAffaires.findUnique({
      where: { id },
      include: {
        clients: {
          include: {
            contrats: {
              where: {
                status: 'ACTIVE',
                ...(startDate && endDate && {
                  startDate: {
                    gte: startDate,
                    lte: endDate,
                  },
                }),
              },
            },
          },
        },
      },
    })

    if (!apporteur) {
      throw new Error('Apporteur not found')
    }

    // Calculer les commissions sur les contrats
    let totalCommissions = 0
    const commissionDetails: any[] = []

    for (const client of apporteur.clients) {
      for (const contrat of client.contrats) {
        if (contrat.commission && apporteur.commissionRate) {
          const commission = (contrat.commission.toNumber() * apporteur.commissionRate.toNumber()) / 100
          totalCommissions += commission

          commissionDetails.push({
            clientId: client.id,
            clientName: `${client.firstName} ${client.lastName}`,
            contratId: contrat.id,
            contratName: contrat.name,
            contratCommission: contrat.commission.toNumber(),
            apporteurRate: apporteur.commissionRate.toNumber(),
            calculatedCommission: commission,
          })
        }
      }
    }

    return {
      apporteurId: apporteur.id,
      apporteurName: `${apporteur.firstName} ${apporteur.lastName}`,
      commissionRate: apporteur.commissionRate?.toNumber(),
      totalClients: apporteur.clients.length,
      totalCommissions,
      details: commissionDetails,
    }
  }

  /**
   * Récupère les statistiques d'un apporteur
   */
  async getApporteurStats(id: string) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const apporteur = await this.prisma.apporteurAffaires.findUnique({
      where: { id },
      include: {
        clients: {
          include: {
            _count: {
              select: {
                contrats: true,
                actifs: true,
              },
            },
          },
        },
      },
    })

    if (!apporteur) {
      throw new Error('Apporteur not found')
    }

    const totalClients = apporteur.clients.length
    const activeClients = apporteur.clients.filter(c => c.status === 'ACTIVE').length
    const totalContrats = apporteur.clients.reduce((sum, c) => sum + c._count.contrats, 0)
    const totalActifs = apporteur.clients.reduce((sum, c) => sum + c._count.actifs, 0)

    return {
      totalClients,
      activeClients,
      prospectClients: apporteur.clients.filter(c => c.status === 'PROSPECT').length,
      totalContrats,
      totalActifs,
    }
  }

  /**
   * Met à jour les statistiques d'un apporteur
   */
  async updateApporteurStats(id: string) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const stats = await this.getApporteurStats(id)
    const commissions = await this.calculateCommissions(id)

    await this.prisma.apporteurAffaires.update({
      where: { id },
      data: {
        stats: {
          ...stats,
          totalCommissions: commissions.totalCommissions,
          lastUpdated: new Date(),
        },
      },
    })

    return { ...stats, totalCommissions: commissions.totalCommissions }
  }
}
