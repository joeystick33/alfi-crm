import { getPrismaClient, setRLSContext } from '../prisma'
import { ActifType, ActifCategory } from '@prisma/client'

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

export interface UpdateActifInput extends Partial<CreateActifInput> {
  isActive?: boolean
}

export interface ShareActifInput {
  actifId: string
  clientId: string
  ownershipPercentage: number
  ownershipType?: string
}

/**
 * Service de gestion des actifs
 * Gère les opérations CRUD et la gestion des actifs partagés (indivision)
 */
export class ActifService {
  private prisma
  
  constructor(
    private cabinetId: string,
    private userId: string,
    private isSuperAdmin: boolean = false
  ) {
    this.prisma = getPrismaClient(cabinetId, isSuperAdmin)
  }

  /**
   * Crée un nouvel actif
   */
  async createActif(data: CreateActifInput) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const actif = await this.prisma.actif.create({
      data: {
        cabinetId: this.cabinetId,
        ...data,
        isActive: true,
      },
    })

    return actif
  }

  /**
   * Crée un actif et l'associe directement à un client
   */
  async createActifForClient(
    clientId: string,
    actifData: CreateActifInput,
    ownershipPercentage: number = 100,
    ownershipType?: string
  ) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    // Vérifier que le client existe
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
    })

    if (!client) {
      throw new Error('Client not found')
    }

    // Créer l'actif
    const actif = await this.createActif(actifData)

    // Associer au client
    await this.prisma.clientActif.create({
      data: {
        clientId,
        actifId: actif.id,
        ownershipPercentage,
        ownershipType,
      },
    })

    // Créer un événement timeline
    await this.prisma.timelineEvent.create({
      data: {
        clientId,
        type: 'ASSET_ADDED',
        title: 'Actif ajouté',
        description: `${actif.name} (${actif.value}€)`,
        relatedEntityType: 'Actif',
        relatedEntityId: actif.id,
        createdBy: this.userId,
      },
    })

    return actif
  }

  /**
   * Récupère un actif par ID
   */
  async getActifById(id: string, includeClients: boolean = false) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const actif = await this.prisma.actif.findUnique({
      where: { id },
      include: includeClients ? {
        clients: {
          include: {
            client: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
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
      } : undefined,
    })

    return actif
  }

  /**
   * Liste les actifs avec filtres
   */
  async listActifs(filters?: {
    type?: ActifType
    category?: ActifCategory
    isActive?: boolean
    managedByFirm?: boolean
    search?: string
    minValue?: number
    maxValue?: number
  }) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const where: any = {}

    if (filters?.type) {
      where.type = filters.type
    }

    if (filters?.category) {
      where.category = filters.category
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive
    }

    if (filters?.managedByFirm !== undefined) {
      where.managedByFirm = filters.managedByFirm
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    if (filters?.minValue !== undefined || filters?.maxValue !== undefined) {
      where.value = {}
      if (filters.minValue !== undefined) {
        where.value.gte = filters.minValue
      }
      if (filters.maxValue !== undefined) {
        where.value.lte = filters.maxValue
      }
    }

    const actifs = await this.prisma.actif.findMany({
      where,
      include: {
        _count: {
          select: {
            clients: true,
            documents: true,
          },
        },
      },
      orderBy: {
        value: 'desc',
      },
    })

    return actifs
  }

  /**
   * Liste les actifs avec informations clients
   */
  async listActifsWithClients(filters?: {
    type?: ActifType
    category?: ActifCategory
    isActive?: boolean
    managedByFirm?: boolean
    search?: string
    minValue?: number
    maxValue?: number
  }) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const where: any = {}

    if (filters?.type) {
      where.type = filters.type
    }

    if (filters?.category) {
      where.category = filters.category
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive
    }

    if (filters?.managedByFirm !== undefined) {
      where.managedByFirm = filters.managedByFirm
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    if (filters?.minValue !== undefined || filters?.maxValue !== undefined) {
      where.value = {}
      if (filters.minValue !== undefined) {
        where.value.gte = filters.minValue
      }
      if (filters.maxValue !== undefined) {
        where.value.lte = filters.maxValue
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
                email: true
              }
            }
          }
        },
        _count: {
          select: {
            clients: true,
            documents: true,
          },
        },
      },
      orderBy: {
        value: 'desc',
      },
    })

    // Transform to include primary client info
    return actifs.map(actif => {
      const primaryClient = actif.clients[0]?.client
      return {
        ...actif,
        client: primaryClient,
        clientId: primaryClient?.id,
        valeurActuelle: Number(actif.value),
        gere: actif.managedByFirm,
        performance: 0, // TODO: Calculate from historical data
      }
    })
  }

  /**
   * Liste les actifs d'un client
   */
  async getClientActifs(clientId: string) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const clientActifs = await this.prisma.clientActif.findMany({
      where: { clientId },
      include: {
        actif: true,
      },
      orderBy: {
        actif: {
          value: 'desc',
        },
      },
    })

    return clientActifs.map(ca => ({
      ...ca.actif,
      ownershipPercentage: ca.ownershipPercentage.toNumber(),
      ownershipType: ca.ownershipType,
      clientShare: (ca.actif.value.toNumber() * ca.ownershipPercentage.toNumber()) / 100,
    }))
  }

  /**
   * Met à jour un actif
   */
  async updateActif(id: string, data: UpdateActifInput) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const actif = await this.prisma.actif.update({
      where: { id },
      data,
    })

    return actif
  }

  /**
   * Met à jour la valeur d'un actif
   */
  async updateActifValue(id: string, newValue: number) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const actif = await this.prisma.actif.update({
      where: { id },
      data: { value: newValue },
    })

    // Récupérer tous les clients propriétaires pour mettre à jour leur patrimoine
    const clientActifs = await this.prisma.clientActif.findMany({
      where: { actifId: id },
      select: { clientId: true },
    })

    // TODO: Déclencher le recalcul du patrimoine pour chaque client
    // Peut être fait via un job asynchrone ou un event

    return actif
  }

  /**
   * Désactive un actif (soft delete)
   */
  async deactivateActif(id: string) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const actif = await this.prisma.actif.update({
      where: { id },
      data: { isActive: false },
    })

    return actif
  }

  /**
   * Réactive un actif
   */
  async reactivateActif(id: string) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const actif = await this.prisma.actif.update({
      where: { id },
      data: { isActive: true },
    })

    return actif
  }

  /**
   * Partage un actif avec un autre client (indivision)
   */
  async shareActif(data: ShareActifInput) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    // Vérifier que l'actif existe
    const actif = await this.prisma.actif.findUnique({
      where: { id: data.actifId },
    })

    if (!actif) {
      throw new Error('Actif not found')
    }

    // Vérifier que le client existe
    const client = await this.prisma.client.findUnique({
      where: { id: data.clientId },
    })

    if (!client) {
      throw new Error('Client not found')
    }

    // Vérifier que le total des pourcentages ne dépasse pas 100%
    const existingShares = await this.prisma.clientActif.findMany({
      where: { actifId: data.actifId },
    })

    const totalPercentage = existingShares.reduce(
      (sum, ca) => sum + ca.ownershipPercentage.toNumber(),
      0
    )

    if (totalPercentage + data.ownershipPercentage > 100) {
      throw new Error(
        `Total ownership cannot exceed 100%. Current: ${totalPercentage}%, Trying to add: ${data.ownershipPercentage}%`
      )
    }

    // Créer le partage
    const clientActif = await this.prisma.clientActif.create({
      data: {
        clientId: data.clientId,
        actifId: data.actifId,
        ownershipPercentage: data.ownershipPercentage,
        ownershipType: data.ownershipType,
      },
    })

    // Créer un événement timeline
    await this.prisma.timelineEvent.create({
      data: {
        clientId: data.clientId,
        type: 'ASSET_ADDED',
        title: 'Actif partagé ajouté',
        description: `${actif.name} (${data.ownershipPercentage}% de ${actif.value}€)`,
        relatedEntityType: 'Actif',
        relatedEntityId: actif.id,
        createdBy: this.userId,
      },
    })

    return clientActif
  }

  /**
   * Modifie le pourcentage de propriété d'un client sur un actif
   */
  async updateOwnership(
    actifId: string,
    clientId: string,
    newPercentage: number
  ) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    // Récupérer le partage actuel
    const currentShare = await this.prisma.clientActif.findUnique({
      where: {
        clientId_actifId: {
          clientId,
          actifId,
        },
      },
    })

    if (!currentShare) {
      throw new Error('Client does not own this actif')
    }

    // Vérifier que le nouveau total ne dépasse pas 100%
    const otherShares = await this.prisma.clientActif.findMany({
      where: {
        actifId,
        clientId: { not: clientId },
      },
    })

    const otherTotal = otherShares.reduce(
      (sum, ca) => sum + ca.ownershipPercentage.toNumber(),
      0
    )

    if (otherTotal + newPercentage > 100) {
      throw new Error(
        `Total ownership cannot exceed 100%. Other owners: ${otherTotal}%, Trying to set: ${newPercentage}%`
      )
    }

    // Mettre à jour
    const updated = await this.prisma.clientActif.update({
      where: {
        clientId_actifId: {
          clientId,
          actifId,
        },
      },
      data: {
        ownershipPercentage: newPercentage,
      },
    })

    return updated
  }

  /**
   * Retire un client d'un actif partagé
   */
  async removeClientFromActif(actifId: string, clientId: string) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    await this.prisma.clientActif.delete({
      where: {
        clientId_actifId: {
          clientId,
          actifId,
        },
      },
    })

    return { success: true }
  }

  /**
   * Récupère les propriétaires d'un actif
   */
  async getActifOwners(actifId: string) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const owners = await this.prisma.clientActif.findMany({
      where: { actifId },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    return owners.map(o => ({
      client: o.client,
      ownershipPercentage: o.ownershipPercentage.toNumber(),
      ownershipType: o.ownershipType,
    }))
  }

  /**
   * Calcule le rendement d'un actif
   */
  async calculateActifReturn(id: string): Promise<number> {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const actif = await this.prisma.actif.findUnique({
      where: { id },
    })

    if (!actif) {
      throw new Error('Actif not found')
    }

    const currentValue = actif.value.toNumber()
    const acquisitionValue = actif.acquisitionValue?.toNumber()

    if (!acquisitionValue || acquisitionValue === 0) {
      return 0
    }

    return ((currentValue - acquisitionValue) / acquisitionValue) * 100
  }

  /**
   * Récupère les actifs par catégorie
   */
  async getActifsByCategory() {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const actifs = await this.prisma.actif.findMany({
      where: { isActive: true },
    })

    const byCategory = {
      IMMOBILIER: 0,
      FINANCIER: 0,
      PROFESSIONNEL: 0,
      AUTRE: 0,
    }

    for (const actif of actifs) {
      byCategory[actif.category] += actif.value.toNumber()
    }

    const total = Object.values(byCategory).reduce((sum, val) => sum + val, 0)

    return {
      values: byCategory,
      percentages: {
        IMMOBILIER: total > 0 ? (byCategory.IMMOBILIER / total) * 100 : 0,
        FINANCIER: total > 0 ? (byCategory.FINANCIER / total) * 100 : 0,
        PROFESSIONNEL: total > 0 ? (byCategory.PROFESSIONNEL / total) * 100 : 0,
        AUTRE: total > 0 ? (byCategory.AUTRE / total) * 100 : 0,
      },
      total,
    }
  }

  /**
   * Récupère les actifs gérés par le cabinet
   */
  async getManagedActifs() {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const actifs = await this.prisma.actif.findMany({
      where: {
        isActive: true,
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
      },
      orderBy: {
        value: 'desc',
      },
    })

    // Filtrer les actifs gérés et calculer les totaux
    const managedActifs = actifs.filter((a: any) => a.managedByFirm === true)
    
    const totalValue = managedActifs.reduce((sum, a) => sum + a.value.toNumber(), 0)
    const totalFees = managedActifs.reduce((sum, a: any) => {
      const value = a.value.toNumber()
      const feeRate = a.managementFees?.toNumber() || 0
      return sum + (value * feeRate) / 100
    }, 0)

    return {
      actifs: managedActifs,
      totalValue,
      totalFees,
      count: managedActifs.length,
    }
  }
}
