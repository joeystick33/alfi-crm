import { getPrismaClient, setRLSContext } from '../prisma'
import {
  ClientType,
  ClientStatus,
  MaritalStatus,
  RiskProfile,
  InvestmentHorizon,
  KYCStatus,
} from '@prisma/client'

export interface CreateClientInput {
  clientType: ClientType
  conseillerId: string
  conseillerRemplacantId?: string
  apporteurId?: string
  
  // Informations personnelles
  email?: string
  firstName: string
  lastName: string
  birthDate?: Date
  birthPlace?: string
  nationality?: string
  phone?: string
  mobile?: string
  address?: any
  
  // Situation familiale
  maritalStatus?: MaritalStatus
  marriageRegime?: string
  numberOfChildren?: number
  
  // Professionnel
  profession?: string
  employerName?: string
  professionalStatus?: string
  
  // Pour clients PROFESSIONNELS
  companyName?: string
  siret?: string
  legalForm?: string
  activitySector?: string
  companyCreationDate?: Date
  numberOfEmployees?: number
  annualRevenue?: number
  
  // Financier
  annualIncome?: number
  taxBracket?: string
  fiscalResidence?: string
  
  // Profil investisseur
  riskProfile?: RiskProfile
  investmentHorizon?: InvestmentHorizon
  investmentGoals?: any
  investmentKnowledge?: string
  investmentExperience?: string
}

export interface UpdateClientInput extends Partial<CreateClientInput> {
  status?: ClientStatus
  kycStatus?: KYCStatus
  portalAccess?: boolean
}

/**
 * Service de gestion des clients
 * Gère les opérations CRUD et la logique métier des clients
 */
export class ClientService {
  private prisma
  
  constructor(
    private cabinetId: string,
    private userId: string,
    private userRole: string,
    private isSuperAdmin: boolean = false
  ) {
    this.prisma = getPrismaClient(cabinetId, isSuperAdmin)
  }

  /**
   * Crée un nouveau client
   */
  async createClient(data: CreateClientInput) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    // Vérifier que le conseiller existe
    const conseiller = await this.prisma.user.findUnique({
      where: { id: data.conseillerId },
    })

    if (!conseiller || conseiller.role !== 'ADVISOR') {
      throw new Error('Invalid conseiller')
    }

    // Si conseiller remplaçant, vérifier qu'il existe
    if (data.conseillerRemplacantId) {
      const remplacant = await this.prisma.user.findUnique({
        where: { id: data.conseillerRemplacantId },
      })

      if (!remplacant || remplacant.role !== 'ADVISOR') {
        throw new Error('Invalid conseiller remplaçant')
      }
    }

    // Si apporteur, vérifier qu'il existe
    if (data.apporteurId) {
      const apporteur = await this.prisma.apporteurAffaires.findUnique({
        where: { id: data.apporteurId },
      })

      if (!apporteur) {
        throw new Error('Invalid apporteur')
      }
    }

    const client = await this.prisma.client.create({
      data: {
        cabinetId: this.cabinetId,
        ...data,
        status: 'PROSPECT',
        kycStatus: 'PENDING',
      },
      include: {
        conseiller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        conseillerRemplacant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        apporteur: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            company: true,
          },
        },
      },
    })

    // Créer un événement timeline
    await this.prisma.timelineEvent.create({
      data: {
        clientId: client.id,
        type: 'CLIENT_CREATED',
        title: 'Client créé',
        description: `Client créé par ${conseiller.firstName} ${conseiller.lastName}`,
        createdBy: this.userId,
      },
    })

    return client
  }

  /**
   * Récupère un client par ID
   */
  async getClientById(id: string, includeRelations: boolean = false) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const client = await this.prisma.client.findUnique({
      where: { id },
      include: includeRelations ? {
        conseiller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        conseillerRemplacant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        apporteur: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            company: true,
          },
        },
        familyMembers: true,
        actifs: {
          include: {
            actif: true,
          },
        },
        passifs: true,
        contrats: true,
        objectifs: true,
        opportunites: {
          where: {
            status: { in: ['DETECTED', 'QUALIFIED', 'CONTACTED', 'PRESENTED'] },
          },
        },
        _count: {
          select: {
            documents: true,
            taches: true,
            rendezvous: true,
            simulations: true,
          },
        },
      } : undefined,
    })

    return client
  }

  /**
   * Liste les clients avec filtres
   */
  async listClients(filters?: {
    status?: ClientStatus
    clientType?: ClientType
    conseillerId?: string
    search?: string
    kycStatus?: KYCStatus
    limit?: number
    offset?: number
  }) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const where: any = {}

    // Si ADVISOR, filtrer par ses propres clients
    if (this.userRole === 'ADVISOR' && !this.isSuperAdmin) {
      where.OR = [
        { conseillerId: this.userId },
        { conseillerRemplacantId: this.userId },
      ]
    }

    if (filters?.status) {
      where.status = filters.status
    }

    if (filters?.clientType) {
      where.clientType = filters.clientType
    }

    if (filters?.conseillerId) {
      where.OR = [
        { conseillerId: filters.conseillerId },
        { conseillerRemplacantId: filters.conseillerId },
      ]
    }

    if (filters?.kycStatus) {
      where.kycStatus = filters.kycStatus
    }

    if (filters?.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { companyName: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    const clients = await this.prisma.client.findMany({
      where,
      include: {
        conseiller: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            actifs: true,
            passifs: true,
            contrats: true,
            opportunites: true,
          },
        },
      },
      orderBy: {
        lastName: 'asc',
      },
      take: filters?.limit,
      skip: filters?.offset,
    })

    return clients
  }

  /**
   * Met à jour un client
   */
  async updateClient(id: string, data: UpdateClientInput) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const client = await this.prisma.client.update({
      where: { id },
      data,
    })

    return client
  }

  /**
   * Change le statut d'un client
   */
  async updateClientStatus(id: string, status: ClientStatus) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const client = await this.prisma.client.update({
      where: { id },
      data: { status },
    })

    // Créer un événement timeline
    await this.prisma.timelineEvent.create({
      data: {
        clientId: id,
        type: 'OTHER',
        title: `Statut changé: ${status}`,
        description: `Le statut du client a été changé à ${status}`,
        createdBy: this.userId,
      },
    })

    return client
  }

  /**
   * Archive un client (soft delete)
   */
  async archiveClient(id: string) {
    return this.updateClientStatus(id, 'ARCHIVED')
  }

  /**
   * Change le conseiller principal d'un client
   */
  async changeConseiller(id: string, newConseillerId: string) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    // Vérifier que le nouveau conseiller existe
    const conseiller = await this.prisma.user.findUnique({
      where: { id: newConseillerId },
    })

    if (!conseiller || conseiller.role !== 'ADVISOR') {
      throw new Error('Invalid conseiller')
    }

    const client = await this.prisma.client.update({
      where: { id },
      data: { conseillerId: newConseillerId },
    })

    // Créer un événement timeline
    await this.prisma.timelineEvent.create({
      data: {
        clientId: id,
        type: 'OTHER',
        title: 'Conseiller changé',
        description: `Nouveau conseiller: ${conseiller.firstName} ${conseiller.lastName}`,
        createdBy: this.userId,
      },
    })

    return client
  }

  /**
   * Active/désactive l'accès portail client
   */
  async togglePortalAccess(id: string, enabled: boolean, password?: string) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const data: any = { portalAccess: enabled }

    if (enabled && password) {
      // TODO: Hasher le mot de passe
      data.portalPassword = password
    }

    const client = await this.prisma.client.update({
      where: { id },
      data,
    })

    return client
  }

  /**
   * Récupère la timeline d'un client
   */
  async getClientTimeline(id: string, limit: number = 50) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const events = await this.prisma.timelineEvent.findMany({
      where: { clientId: id },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return events
  }

  /**
   * Recherche de clients (full-text search)
   */
  async searchClients(query: string, limit: number = 20) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const where: any = {
      OR: [
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
        { phone: { contains: query, mode: 'insensitive' } },
        { mobile: { contains: query, mode: 'insensitive' } },
        { companyName: { contains: query, mode: 'insensitive' } },
      ],
    }

    // Si ADVISOR, filtrer par ses propres clients
    if (this.userRole === 'ADVISOR' && !this.isSuperAdmin) {
      where.AND = {
        OR: [
          { conseillerId: this.userId },
          { conseillerRemplacantId: this.userId },
        ],
      }
    }

    const clients = await this.prisma.client.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        status: true,
        clientType: true,
        companyName: true,
      },
      take: limit,
    })

    return clients
  }

  /**
   * Récupère les statistiques d'un client
   */
  async getClientStats(id: string) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            actifs: true,
            passifs: true,
            contrats: true,
            objectifs: true,
            projets: true,
            opportunites: true,
            taches: true,
            rendezvous: true,
            documents: true,
            simulations: true,
          },
        },
      },
    })

    if (!client) {
      throw new Error('Client not found')
    }

    return {
      totalActifs: client._count.actifs,
      totalPassifs: client._count.passifs,
      totalContrats: client._count.contrats,
      totalObjectifs: client._count.objectifs,
      totalProjets: client._count.projets,
      totalOpportunites: client._count.opportunites,
      totalTaches: client._count.taches,
      totalRendezVous: client._count.rendezvous,
      totalDocuments: client._count.documents,
      totalSimulations: client._count.simulations,
      wealth: client.wealth,
    }
  }
}
