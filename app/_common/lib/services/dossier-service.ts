 
import { PrismaClient, DossierStatus, DossierType, DossierPriorite } from '@prisma/client'
import { prisma } from '@/app/_common/lib/prisma'

export interface CreateDossierInput {
  clientId: string
  conseillerId: string
  nom: string
  description?: string
  type: DossierType
  priorite?: DossierPriorite
  dateCloturePrevu?: Date
  montantEstime?: number
  budgetAlloue?: number
  objetifs?: string
  risques?: string
  recommandations?: string
  tags?: string[]
}

export interface UpdateDossierInput {
  nom?: string
  description?: string
  type?: DossierType
  priorite?: DossierPriorite
  status?: DossierStatus
  dateCloturePrevu?: Date
  dateClotureReelle?: Date
  montantEstime?: number
  montantRealise?: number
  budgetAlloue?: number
  progressionPct?: number
  objetifs?: string
  risques?: string
  recommandations?: string
  tags?: string[]
  notes?: string
}

export interface DossierFilters {
  clientId?: string
  conseillerId?: string
  status?: DossierStatus
  type?: DossierType
  priorite?: DossierPriorite
  search?: string
  dateOuvertureFrom?: Date
  dateOuvertureTo?: Date
  isArchive?: boolean
  tags?: string[]
  limit?: number
  offset?: number
  sortBy?: 'dateOuverture' | 'dateCloturePrevu' | 'nom' | 'progressionPct' | 'montantEstime'
  sortOrder?: 'asc' | 'desc'
}

export class DossierService {
  private prisma: PrismaClient
  private cabinetId: string
  private userId: string
  private isSuperAdmin: boolean

  constructor(cabinetId: string, userId: string, isSuperAdmin: boolean = false) {
    this.prisma = prisma
    this.cabinetId = cabinetId
    this.userId = userId
    this.isSuperAdmin = isSuperAdmin
  }

  /**
   * Génère une référence unique pour un dossier (DOS-YYYY-NNN)
   */
  private async generateReference(): Promise<string> {
    const year = new Date().getFullYear()
    const prefix = `DOS-${year}-`

    // Trouver le dernier numéro utilisé cette année
    const lastDossier = await this.prisma.dossier.findFirst({
      where: {
        cabinetId: this.cabinetId,
        reference: {
          startsWith: prefix,
        },
      },
      orderBy: {
        reference: 'desc',
      },
      select: {
        reference: true,
      },
    })

    if (!lastDossier) {
      return `${prefix}001`
    }

    // Extraire le numéro et incrémenter
    const lastNumber = parseInt(lastDossier.reference.split('-')[2], 10)
    const nextNumber = lastNumber + 1
    return `${prefix}${nextNumber.toString().padStart(3, '0')}`
  }

  /**
   * Créer un nouveau dossier
   */
  async createDossier(input: CreateDossierInput) {
    // Vérifier que le client existe et appartient au cabinet
    const client = await this.prisma.client.findFirst({
      where: {
        id: input.clientId,
        cabinetId: this.cabinetId,
      },
    })

    if (!client) {
      throw new Error('Client non trouvé ou non accessible')
    }

    // Générer une référence unique
    const reference = await this.generateReference()

    // Créer le dossier
    const dossier = await this.prisma.dossier.create({
      data: {
        cabinetId: this.cabinetId,
        reference,
        nom: input.nom,
        description: input.description,
        type: input.type,
        priorite: input.priorite || 'NORMALE',
        clientId: input.clientId,
        conseillerId: input.conseillerId,
        dateOuverture: new Date(),
        dateCloturePrevu: input.dateCloturePrevu,
        montantEstime: input.montantEstime,
        budgetAlloue: input.budgetAlloue,
        objetifs: input.objetifs,
        risques: input.risques,
        recommandations: input.recommandations,
        tags: input.tags || [],
        status: 'BROUILLON',
        progressionPct: 0,
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
        conseiller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            projets: true,
            opportunites: true,
            taches: true,
            rendezvous: true,
          },
        },
      },
    })

    return dossier
  }

  /**
   * Lister les dossiers avec filtres
   */
  async listDossiers(filters: DossierFilters = {}) {
    const where: any = {
      cabinetId: this.cabinetId,
    }

    // Filtres de base
    if (filters.clientId) where.clientId = filters.clientId
    if (filters.conseillerId) where.conseillerId = filters.conseillerId
    if (filters.status) where.status = filters.status
    if (filters.type) where.type = filters.type
    if (filters.priorite) where.priorite = filters.priorite
    if (filters.isArchive !== undefined) where.isArchive = filters.isArchive

    // Recherche textuelle
    if (filters.search) {
      where.OR = [
        { reference: { contains: filters.search, mode: 'insensitive' } },
        { nom: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    // Filtres de date
    if (filters.dateOuvertureFrom || filters.dateOuvertureTo) {
      where.dateOuverture = {}
      if (filters.dateOuvertureFrom) where.dateOuverture.gte = filters.dateOuvertureFrom
      if (filters.dateOuvertureTo) where.dateOuverture.lte = filters.dateOuvertureTo
    }

    // Filtres par tags
    if (filters.tags && filters.tags.length > 0) {
      where.tags = {
        hasSome: filters.tags,
      }
    }

    // Sorting
    const orderBy: any = {}
    const sortBy = filters.sortBy || 'dateOuverture'
    const sortOrder = filters.sortOrder || 'desc'
    orderBy[sortBy] = sortOrder

    // Pagination
    const limit = filters.limit || 50
    const offset = filters.offset || 0

    const [dossiers, total] = await Promise.all([
      this.prisma.dossier.findMany({
        where,
        orderBy,
        take: limit,
        skip: offset,
        include: {
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          conseiller: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: {
              projets: true,
              opportunites: true,
              taches: true,
              rendezvous: true,
            },
          },
        },
      }),
      this.prisma.dossier.count({ where }),
    ])

    return {
      data: dossiers,
      total,
      limit,
      offset,
    }
  }

  /**
   * Obtenir un dossier par ID avec toutes les relations
   */
  async getDossierById(id: string) {
    const dossier = await this.prisma.dossier.findFirst({
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
            phone: true,
            mobile: true,
            clientType: true,
          },
        },
        conseiller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        projets: {
          select: {
            id: true,
            name: true,
            status: true,
            progress: true,
            estimatedBudget: true,
            startDate: true,
            targetDate: true,
          },
        },
        opportunites: {
          select: {
            id: true,
            name: true,
            status: true,
            estimatedValue: true,
            actionDeadline: true,
          },
        },
        taches: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true,
          },
        },
        rendezvous: {
          select: {
            id: true,
            title: true,
            startDate: true,
            endDate: true,
            status: true,
          },
        },
        _count: {
          select: {
            projets: true,
            opportunites: true,
            taches: true,
            rendezvous: true,
          },
        },
      },
    })

    if (!dossier) {
      throw new Error('Dossier non trouvé')
    }

    return dossier
  }

  /**
   * Mettre à jour un dossier
   */
  async updateDossier(id: string, input: UpdateDossierInput) {
    // Vérifier que le dossier existe
    const existing = await this.prisma.dossier.findFirst({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
    })

    if (!existing) {
      throw new Error('Dossier non trouvé')
    }

    // Préparer les données de mise à jour
    const updateData: any = {}
    if (input.nom !== undefined) updateData.nom = input.nom
    if (input.description !== undefined) updateData.description = input.description
    if (input.type !== undefined) updateData.type = input.type
    if (input.priorite !== undefined) updateData.priorite = input.priorite
    if (input.status !== undefined) updateData.status = input.status
    if (input.dateCloturePrevu !== undefined) updateData.dateCloturePrevu = input.dateCloturePrevu
    if (input.dateClotureReelle !== undefined) updateData.dateClotureReelle = input.dateClotureReelle
    if (input.montantEstime !== undefined) updateData.montantEstime = input.montantEstime
    if (input.montantRealise !== undefined) updateData.montantRealise = input.montantRealise
    if (input.budgetAlloue !== undefined) updateData.budgetAlloue = input.budgetAlloue
    if (input.progressionPct !== undefined) {
      // Valider que la progression est entre 0 et 100
      if (input.progressionPct < 0 || input.progressionPct > 100) {
        throw new Error('La progression doit être entre 0 et 100')
      }
      updateData.progressionPct = input.progressionPct
    }
    if (input.objetifs !== undefined) updateData.objetifs = input.objetifs
    if (input.risques !== undefined) updateData.risques = input.risques
    if (input.recommandations !== undefined) updateData.recommandations = input.recommandations
    if (input.tags !== undefined) updateData.tags = input.tags
    if (input.notes !== undefined) updateData.notes = input.notes

    // Mise à jour automatique du statut si progression = 100%
    if (updateData.progressionPct === 100 && existing.status !== 'TERMINE') {
      updateData.status = 'TERMINE'
      updateData.dateClotureReelle = new Date()
    }

    const updated = await this.prisma.dossier.update({
      where: { id },
      data: updateData,
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        conseiller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            projets: true,
            opportunites: true,
            taches: true,
            rendezvous: true,
          },
        },
      },
    })

    return updated
  }

  /**
   * Supprimer un dossier (seulement si statut BROUILLON)
   */
  async deleteDossier(id: string) {
    const dossier = await this.prisma.dossier.findFirst({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
    })

    if (!dossier) {
      throw new Error('Dossier non trouvé')
    }

    // Ne peut supprimer que les brouillons
    if (dossier.status !== 'BROUILLON') {
      throw new Error('Seuls les dossiers en brouillon peuvent être supprimés')
    }

    await this.prisma.dossier.delete({
      where: { id },
    })

    return { success: true }
  }

  /**
   * Activer un dossier (BROUILLON → ACTIF)
   */
  async activateDossier(id: string) {
    const dossier = await this.prisma.dossier.findFirst({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
    })

    if (!dossier) {
      throw new Error('Dossier non trouvé')
    }

    if (dossier.status !== 'BROUILLON') {
      throw new Error('Seuls les dossiers en brouillon peuvent être activés')
    }

    const updated = await this.prisma.dossier.update({
      where: { id },
      data: {
        status: 'ACTIF',
      },
      include: {
        client: true,
        conseiller: true,
      },
    })

    return updated
  }

  /**
   * Démarrer un dossier (ACTIF → EN_COURS)
   */
  async startDossier(id: string) {
    const dossier = await this.prisma.dossier.findFirst({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
    })

    if (!dossier) {
      throw new Error('Dossier non trouvé')
    }

    if (dossier.status !== 'ACTIF') {
      throw new Error('Seuls les dossiers actifs peuvent être démarrés')
    }

    const updated = await this.prisma.dossier.update({
      where: { id },
      data: {
        status: 'EN_COURS',
      },
      include: {
        client: true,
        conseiller: true,
      },
    })

    return updated
  }

  /**
   * Mettre en attente un dossier (EN_COURS → EN_ATTENTE)
   */
  async pauseDossier(id: string) {
    const dossier = await this.prisma.dossier.findFirst({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
    })

    if (!dossier) {
      throw new Error('Dossier non trouvé')
    }

    if (dossier.status !== 'EN_COURS') {
      throw new Error('Seuls les dossiers en cours peuvent être mis en attente')
    }

    const updated = await this.prisma.dossier.update({
      where: { id },
      data: {
        status: 'EN_ATTENTE',
      },
      include: {
        client: true,
        conseiller: true,
      },
    })

    return updated
  }

  /**
   * Terminer un dossier
   */
  async completeDossier(id: string) {
    const dossier = await this.prisma.dossier.findFirst({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
    })

    if (!dossier) {
      throw new Error('Dossier non trouvé')
    }

    if (dossier.status === 'TERMINE' || dossier.status === 'ANNULE') {
      throw new Error('Le dossier est déjà terminé ou annulé')
    }

    const updated = await this.prisma.dossier.update({
      where: { id },
      data: {
        status: 'TERMINE',
        progressionPct: 100,
        dateClotureReelle: new Date(),
      },
      include: {
        client: true,
        conseiller: true,
      },
    })

    return updated
  }

  /**
   * Annuler un dossier
   */
  async cancelDossier(id: string) {
    const dossier = await this.prisma.dossier.findFirst({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
    })

    if (!dossier) {
      throw new Error('Dossier non trouvé')
    }

    if (dossier.status === 'TERMINE') {
      throw new Error('Un dossier terminé ne peut pas être annulé')
    }

    const updated = await this.prisma.dossier.update({
      where: { id },
      data: {
        status: 'ANNULE',
      },
      include: {
        client: true,
        conseiller: true,
      },
    })

    return updated
  }

  /**
   * Archiver un dossier
   */
  async archiveDossier(id: string) {
    const dossier = await this.prisma.dossier.findFirst({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
    })

    if (!dossier) {
      throw new Error('Dossier non trouvé')
    }

    if (dossier.status !== 'TERMINE' && dossier.status !== 'ANNULE') {
      throw new Error('Seuls les dossiers terminés ou annulés peuvent être archivés')
    }

    const updated = await this.prisma.dossier.update({
      where: { id },
      data: {
        isArchive: true,
        archivedAt: new Date(),
        archivedBy: this.userId,
        status: 'ARCHIVE',
      },
      include: {
        client: true,
        conseiller: true,
      },
    })

    return updated
  }

  /**
   * Désarchiver un dossier
   */
  async unarchiveDossier(id: string) {
    const dossier = await this.prisma.dossier.findFirst({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
    })

    if (!dossier) {
      throw new Error('Dossier non trouvé')
    }

    if (!dossier.isArchive) {
      throw new Error('Le dossier n\'est pas archivé')
    }

    // Déterminer le statut à restaurer
    const restoredStatus = dossier.dateClotureReelle ? 'TERMINE' : 'ACTIF'

    const updated = await this.prisma.dossier.update({
      where: { id },
      data: {
        isArchive: false,
        archivedAt: null,
        archivedBy: null,
        status: restoredStatus,
      },
      include: {
        client: true,
        conseiller: true,
      },
    })

    return updated
  }

  /**
   * Obtenir les statistiques des dossiers
   */
  async getDossierStats(filters: Partial<DossierFilters> = {}) {
    const where: any = {
      cabinetId: this.cabinetId,
    }

    if (filters.clientId) where.clientId = filters.clientId
    if (filters.conseillerId) where.conseillerId = filters.conseillerId
    if (filters.type) where.type = filters.type
    if (filters.isArchive !== undefined) where.isArchive = filters.isArchive

    const [
      total,
      brouillon,
      actif,
      enCours,
      enAttente,
      termine,
      annule,
      archive,
      avgProgression,
      totalMontantEstime,
      totalMontantRealise,
      totalBudgetAlloue,
    ] = await Promise.all([
      this.prisma.dossier.count({ where }),
      this.prisma.dossier.count({ where: { ...where, status: 'BROUILLON' } }),
      this.prisma.dossier.count({ where: { ...where, status: 'ACTIF' } }),
      this.prisma.dossier.count({ where: { ...where, status: 'EN_COURS' } }),
      this.prisma.dossier.count({ where: { ...where, status: 'EN_ATTENTE' } }),
      this.prisma.dossier.count({ where: { ...where, status: 'TERMINE' } }),
      this.prisma.dossier.count({ where: { ...where, status: 'ANNULE' } }),
      this.prisma.dossier.count({ where: { ...where, isArchive: true } }),
      this.prisma.dossier.aggregate({
        where,
        _avg: { progressionPct: true },
      }),
      this.prisma.dossier.aggregate({
        where,
        _sum: { montantEstime: true },
      }),
      this.prisma.dossier.aggregate({
        where,
        _sum: { montantRealise: true },
      }),
      this.prisma.dossier.aggregate({
        where,
        _sum: { budgetAlloue: true },
      }),
    ])

    return {
      total,
      byStatus: {
        brouillon,
        actif,
        enCours,
        enAttente,
        termine,
        annule,
        archive,
      },
      progression: {
        moyenne: Math.round(avgProgression._avg.progressionPct || 0),
      },
      financial: {
        montantEstimeTotal: Number(totalMontantEstime._sum.montantEstime || 0),
        montantRealiseTotal: Number(totalMontantRealise._sum.montantRealise || 0),
        budgetAlloueTotal: Number(totalBudgetAlloue._sum.budgetAlloue || 0),
      },
    }
  }
}
