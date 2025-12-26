import { getPrismaClient } from '../prisma'
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
  isActive?: boolean
}

export interface ApporteurFilters {
  search?: string
  type?: ApporteurType
  isActive?: boolean
}

/**
 * Service de gestion des apporteurs d'affaires
 * Gère les partenaires, prescripteurs et le calcul des commissions
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

  private toNumber(value: unknown): number {
    if (value === null || value === undefined) return 0
    if (typeof value === 'object' && value !== null && 'toNumber' in value && typeof (value as { toNumber: () => number }).toNumber === 'function') {
      return (value as { toNumber: () => number }).toNumber()
    }
    return Number(value) || 0
  }

  /**
   * Créer un nouvel apporteur d'affaires
   */
  async createApporteur(data: CreateApporteurInput) {
    // Vérifier unicité de l'email dans le cabinet
    const existing = await this.prisma.apporteurAffaires.findFirst({
      where: {
        cabinetId: this.cabinetId,
        email: data.email,
      },
    })

    if (existing) {
      throw new Error('Un apporteur avec cet email existe déjà')
    }

    const apporteur = await this.prisma.apporteurAffaires.create({
      data: {
        cabinetId: this.cabinetId,
        ownerId: this.userId,
        type: data.type,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        company: data.company,
        profession: data.profession,
        commissionRate: data.commissionRate,
        stats: {
          totalClients: 0,
          activeClients: 0,
          totalCommissions: 0,
          lastYearCommissions: 0,
        },
      },
    })

    return this.getApporteurById(apporteur.id)
  }

  /**
   * Récupérer un apporteur par ID
   */
  async getApporteurById(id: string) {
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

    if (!apporteur || apporteur.cabinetId !== this.cabinetId) {
      throw new Error('Apporteur non trouvé')
    }

    return {
      ...apporteur,
      commissionRate: this.toNumber(apporteur.commissionRate),
    }
  }

  /**
   * Lister les apporteurs avec filtres
   */
  async listApporteurs(filters: ApporteurFilters = {}) {
    const where: Record<string, unknown> = {
      cabinetId: this.cabinetId,
    }

    if (filters.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { company: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    if (filters.type) {
      where.type = filters.type
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive
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
      orderBy: [{ isActive: 'desc' }, { lastName: 'asc' }],
    })

    return apporteurs.map(a => ({
      ...a,
      commissionRate: this.toNumber(a.commissionRate),
    }))
  }

  /**
   * Mettre à jour un apporteur
   */
  async updateApporteur(id: string, data: UpdateApporteurInput) {
    // Vérifier que l'apporteur appartient au cabinet
    const existing = await this.prisma.apporteurAffaires.findUnique({
      where: { id },
    })

    if (!existing || existing.cabinetId !== this.cabinetId) {
      throw new Error('Apporteur non trouvé')
    }

    // Si changement d'email, vérifier unicité
    if (data.email && data.email !== existing.email) {
      const duplicate = await this.prisma.apporteurAffaires.findFirst({
        where: {
          cabinetId: this.cabinetId,
          email: data.email,
          id: { not: id },
        },
      })

      if (duplicate) {
        throw new Error('Un apporteur avec cet email existe déjà')
      }
    }

    await this.prisma.apporteurAffaires.update({
      where: { id },
      data: {
        ...(data.type && { type: data.type }),
        ...(data.firstName && { firstName: data.firstName }),
        ...(data.lastName && { lastName: data.lastName }),
        ...(data.email && { email: data.email }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.company !== undefined && { company: data.company }),
        ...(data.profession !== undefined && { profession: data.profession }),
        ...(data.commissionRate !== undefined && { commissionRate: data.commissionRate }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    })

    return this.getApporteurById(id)
  }

  /**
   * Supprimer un apporteur (soft delete : désactivation)
   */
  async deleteApporteur(id: string) {
    const existing = await this.prisma.apporteurAffaires.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            clients: true,
          },
        },
      },
    })

    if (!existing || existing.cabinetId !== this.cabinetId) {
      throw new Error('Apporteur non trouvé')
    }

    // Si l'apporteur a des clients actifs, on le désactive seulement
    if (existing._count.clients > 0) {
      await this.prisma.apporteurAffaires.update({
        where: { id },
        data: { isActive: false },
      })
      return { deleted: false, deactivated: true }
    }

    // Sinon on peut le supprimer
    await this.prisma.apporteurAffaires.delete({
      where: { id },
    })

    return { deleted: true, deactivated: false }
  }

  /**
   * Recalculer les stats d'un apporteur
   */
  async refreshApporteurStats(id: string) {
    const apporteur = await this.prisma.apporteurAffaires.findUnique({
      where: { id },
      include: {
        clients: {
          select: {
            status: true,
          },
        },
      },
    })

    if (!apporteur || apporteur.cabinetId !== this.cabinetId) {
      throw new Error('Apporteur non trouvé')
    }

    const totalClients = apporteur.clients.length
    const activeClients = apporteur.clients.filter(c => c.status === 'ACTIF').length

    // TODO: Calculer les commissions réelles quand le système de commissions sera implémenté
    const stats = {
      totalClients,
      activeClients,
      totalCommissions: 0,
      lastYearCommissions: 0,
    }

    await this.prisma.apporteurAffaires.update({
      where: { id },
      data: { stats },
    })

    return stats
  }

  /**
   * Obtenir les statistiques globales des apporteurs
   */
  async getApporteursStats() {
    const [total, active, byType] = await Promise.all([
      this.prisma.apporteurAffaires.count({
        where: { cabinetId: this.cabinetId },
      }),
      this.prisma.apporteurAffaires.count({
        where: { cabinetId: this.cabinetId, isActive: true },
      }),
      this.prisma.apporteurAffaires.groupBy({
        by: ['type'],
        where: { cabinetId: this.cabinetId },
        _count: true,
      }),
    ])

    const typeDistribution: Record<string, number> = {}
    byType.forEach(item => {
      typeDistribution[item.type] = item._count
    })

    // Calculer le nombre total de clients apportés
    const clientsCount = await this.prisma.client.count({
      where: {
        cabinetId: this.cabinetId,
        apporteurId: { not: null },
      },
    })

    return {
      total,
      active,
      inactive: total - active,
      byType: typeDistribution,
      totalClientsApportes: clientsCount,
      // TODO: totalCommissions quand le système sera implémenté
      totalCommissions: 0,
    }
  }
}
