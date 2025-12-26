import { getPrismaClient } from '../prisma'
import type { ActifType, ActifCategory } from '@/app/_common/lib/api-types'
import type { Prisma } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'
import { queuePatrimoineUpdate } from '@/lib/queues/helpers'

export interface CreateActifInput {
  type: ActifType
  category?: ActifCategory
  name: string
  description?: string
  value: number
  acquisitionDate?: Date | string
  acquisitionValue?: number
  details?: Record<string, unknown>
  annualIncome?: number
  taxDetails?: Record<string, unknown>
  managedByFirm?: boolean
  managementFees?: number
  // Immobilier
  propertyAddress?: string
  propertyCity?: string
  propertyPostalCode?: string
  propertySurface?: number
  propertyRooms?: number
  propertyType?: string
  propertyCondition?: string
  // Locatif
  rentalScheme?: string
  rentalSchemeStartDate?: string
  rentalSchemeEndDate?: string
  rentalMonthlyRent?: number
  rentalCharges?: number
  rentalOccupancyRate?: number
  rentalTenantName?: string
  // IFI
  fiscalPropertyType?: string
  fiscalRpAbatement?: boolean
  fiscalManualDiscount?: number
  // Démembrement
  dismembermentType?: string
  dismembermentEndDate?: string
  usufructuaryName?: string
  bareOwnerName?: string
  // Assurance-vie
  insurerName?: string
  contractNumber?: string
  contractOpenDate?: string
  beneficiaryClause?: string
  beneficiaryClauseType?: string
  totalPremiums?: number
  euroFundRate?: number
  managementMode?: string
  // PEA / Compte-titres
  brokerName?: string
  accountNumber?: string
  dividendsReceived?: number
  // Épargne salariale
  employerName?: string
  availabilityDate?: string
  unvestedAmount?: number
  // Mobilier
  objectBrand?: string
  objectModel?: string
  objectSerial?: string
  objectCertificate?: boolean
  objectInsured?: boolean
  objectInsuranceValue?: number
  lastAppraisalDate?: string
  lastAppraisalValue?: number
  // Véhicules
  vehicleBrand?: string
  vehicleModel?: string
  vehicleYear?: number
  vehicleRegistration?: string
  vehicleMileage?: number
  // Crypto
  walletAddress?: string
  exchangePlatform?: string
  tokenSymbol?: string
  tokenQuantity?: number
  // Professionnel
  companyName?: string
  companySiren?: string
  companyLegalForm?: string
  companySharesCount?: number
  companyTotalShares?: number
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
   * Détermine la catégorie par défaut basée sur le type d'actif
   */
  private getDefaultCategory(type: ActifType): ActifCategory {
    const categoryMap: Record<ActifType, ActifCategory> = {
      // Immobilier
      RESIDENCE_PRINCIPALE: 'IMMOBILIER',
      IMMOBILIER_LOCATIF: 'IMMOBILIER',
      RESIDENCE_SECONDAIRE: 'IMMOBILIER',
      IMMOBILIER_COMMERCIAL: 'IMMOBILIER',
      SCPI: 'IMMOBILIER',
      SCI: 'IMMOBILIER',
      OPCI: 'IMMOBILIER',
      CROWDFUNDING_IMMO: 'IMMOBILIER',
      VIAGER: 'IMMOBILIER',
      NUE_PROPRIETE: 'IMMOBILIER',
      USUFRUIT: 'IMMOBILIER',
      // Épargne salariale
      PEE: 'EPARGNE_SALARIALE',
      PEG: 'EPARGNE_SALARIALE',
      PERCO: 'EPARGNE_SALARIALE',
      PERECO: 'EPARGNE_SALARIALE',
      CET: 'EPARGNE_SALARIALE',
      PARTICIPATION: 'EPARGNE_SALARIALE',
      INTERESSEMENT: 'EPARGNE_SALARIALE',
      STOCK_OPTIONS: 'EPARGNE_SALARIALE',
      ACTIONS_GRATUITES: 'EPARGNE_SALARIALE',
      BSPCE: 'EPARGNE_SALARIALE',
      // Épargne retraite
      PER: 'EPARGNE_RETRAITE',
      PERP: 'EPARGNE_RETRAITE',
      MADELIN: 'EPARGNE_RETRAITE',
      ARTICLE_83: 'EPARGNE_RETRAITE',
      PREFON: 'EPARGNE_RETRAITE',
      COREM: 'EPARGNE_RETRAITE',
      // Placements financiers
      ASSURANCE_VIE: 'FINANCIER',
      CONTRAT_CAPITALISATION: 'FINANCIER',
      COMPTE_TITRES: 'FINANCIER',
      PEA: 'FINANCIER',
      PEA_PME: 'FINANCIER',
      // Épargne bancaire
      COMPTE_BANCAIRE: 'FINANCIER',
      LIVRETS: 'FINANCIER',
      PEL: 'FINANCIER',
      CEL: 'FINANCIER',
      COMPTE_A_TERME: 'FINANCIER',
      // Professionnel
      PARTS_SOCIALES: 'PROFESSIONNEL',
      IMMOBILIER_PRO: 'PROFESSIONNEL',
      MATERIEL_PRO: 'PROFESSIONNEL',
      FONDS_COMMERCE: 'PROFESSIONNEL',
      BREVETS_PI: 'PROFESSIONNEL',
      // Mobilier
      METAUX_PRECIEUX: 'MOBILIER',
      BIJOUX: 'MOBILIER',
      OEUVRES_ART: 'MOBILIER',
      VINS: 'MOBILIER',
      MONTRES: 'MOBILIER',
      VEHICULES: 'MOBILIER',
      MOBILIER: 'MOBILIER',
      CRYPTO: 'FINANCIER',
      NFT: 'MOBILIER',
      // Autre
      AUTRE: 'AUTRE',
    }
    return categoryMap[type] || 'AUTRE'
  }

  /**
   * Crée un nouvel actif
   */
  async createActif(data: CreateActifInput) {
    const actif = await this.prisma.actif.create({
      data: {
        cabinetId: this.cabinetId,
        type: data.type,
        category: data.category || this.getDefaultCategory(data.type),
        name: data.name,
        description: data.description,
        value: new Decimal(data.value),
        acquisitionDate: data.acquisitionDate ? new Date(data.acquisitionDate) : null,
        acquisitionValue:
          data.acquisitionValue !== undefined ? new Decimal(data.acquisitionValue) : null,
        details: data.details as unknown,
        annualIncome:
          data.annualIncome !== undefined ? new Decimal(data.annualIncome) : null,
        taxDetails: data.taxDetails as unknown,
        managedByFirm: data.managedByFirm,
        managementFees:
          data.managementFees !== undefined ? new Decimal(data.managementFees) : null,
        isActive: true,
        // Immobilier
        propertyAddress: data.propertyAddress,
        propertyCity: data.propertyCity,
        propertyPostalCode: data.propertyPostalCode,
        propertySurface: data.propertySurface !== undefined ? new Decimal(data.propertySurface) : null,
        propertyRooms: data.propertyRooms,
        propertyType: data.propertyType,
        propertyCondition: data.propertyCondition,
        // Locatif
        rentalScheme: data.rentalScheme,
        rentalSchemeStartDate: data.rentalSchemeStartDate ? new Date(data.rentalSchemeStartDate) : null,
        rentalSchemeEndDate: data.rentalSchemeEndDate ? new Date(data.rentalSchemeEndDate) : null,
        rentalMonthlyRent: data.rentalMonthlyRent !== undefined ? new Decimal(data.rentalMonthlyRent) : null,
        rentalCharges: data.rentalCharges !== undefined ? new Decimal(data.rentalCharges) : null,
        rentalOccupancyRate: data.rentalOccupancyRate !== undefined ? new Decimal(data.rentalOccupancyRate) : null,
        rentalTenantName: data.rentalTenantName,
        // IFI
        fiscalPropertyType: data.fiscalPropertyType,
        fiscalRpAbatement: data.fiscalRpAbatement,
        fiscalManualDiscount: data.fiscalManualDiscount !== undefined ? new Decimal(data.fiscalManualDiscount) : null,
        // Démembrement
        dismembermentType: data.dismembermentType,
        dismembermentEndDate: data.dismembermentEndDate ? new Date(data.dismembermentEndDate) : null,
        usufructuaryName: data.usufructuaryName,
        bareOwnerName: data.bareOwnerName,
        // Assurance-vie
        insurerName: data.insurerName,
        contractNumber: data.contractNumber,
        contractOpenDate: data.contractOpenDate ? new Date(data.contractOpenDate) : null,
        beneficiaryClause: data.beneficiaryClause,
        beneficiaryClauseType: data.beneficiaryClauseType,
        totalPremiums: data.totalPremiums !== undefined ? new Decimal(data.totalPremiums) : null,
        euroFundRate: data.euroFundRate !== undefined ? new Decimal(data.euroFundRate) : null,
        managementMode: data.managementMode,
        // PEA / Compte-titres
        brokerName: data.brokerName,
        accountNumber: data.accountNumber,
        dividendsReceived: data.dividendsReceived !== undefined ? new Decimal(data.dividendsReceived) : null,
        // Épargne salariale
        employerName: data.employerName,
        availabilityDate: data.availabilityDate ? new Date(data.availabilityDate) : null,
        unvestedAmount: data.unvestedAmount !== undefined ? new Decimal(data.unvestedAmount) : null,
        // Mobilier
        objectBrand: data.objectBrand,
        objectModel: data.objectModel,
        objectSerial: data.objectSerial,
        objectCertificate: data.objectCertificate,
        objectInsured: data.objectInsured,
        objectInsuranceValue: data.objectInsuranceValue !== undefined ? new Decimal(data.objectInsuranceValue) : null,
        lastAppraisalDate: data.lastAppraisalDate ? new Date(data.lastAppraisalDate) : null,
        lastAppraisalValue: data.lastAppraisalValue !== undefined ? new Decimal(data.lastAppraisalValue) : null,
        // Véhicules
        vehicleBrand: data.vehicleBrand,
        vehicleModel: data.vehicleModel,
        vehicleYear: data.vehicleYear,
        vehicleRegistration: data.vehicleRegistration,
        vehicleMileage: data.vehicleMileage,
        // Crypto
        walletAddress: data.walletAddress,
        exchangePlatform: data.exchangePlatform,
        tokenSymbol: data.tokenSymbol,
        tokenQuantity: data.tokenQuantity !== undefined ? new Decimal(data.tokenQuantity) : null,
        // Professionnel
        companyName: data.companyName,
        companySiren: data.companySiren,
        companyLegalForm: data.companyLegalForm,
        companySharesCount: data.companySharesCount,
        companyTotalShares: data.companyTotalShares,
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
    // Vérifier que le client existe
    const client = await this.prisma.client.findFirst({
      where: {
        id: clientId,
        cabinetId: this.cabinetId,
      },
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
        ownershipPercentage: new Decimal(ownershipPercentage),
        ownershipType,
      },
    })

    // Créer un événement timeline
    await this.prisma.timelineEvent.create({
      data: {
        cabinet: { connect: { id: this.cabinetId } },
        clientId,
        type: 'ASSET_ADDED',
        title: 'Actif ajouté',
        description: `${actif.name} (${actif.value}€)`,
        relatedEntityType: 'Actif',
        relatedEntityId: actif.id,
        createdBy: this.userId,
      },
    })

    // Déclencher le recalcul du patrimoine (BullMQ)
    await queuePatrimoineUpdate(clientId, this.cabinetId, 'actif', actif.id, this.userId)

    return actif
  }

  /**
   * Récupère un actif par ID
   */
  async getActifById(id: string, includeClients: boolean = false) {
    const actif = await this.prisma.actif.findFirst({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
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
    const where: Prisma.ActifWhereInput = {
      cabinetId: this.cabinetId,
    }

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
        (where.value as Prisma.DecimalFilter).gte = new Decimal(filters.minValue)
      }
      if (filters.maxValue !== undefined) {
        (where.value as Prisma.DecimalFilter).lte = new Decimal(filters.maxValue)
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
    const where: Prisma.ActifWhereInput = {
      cabinetId: this.cabinetId,
    }

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
        (where.value as Prisma.DecimalFilter).gte = new Decimal(filters.minValue)
      }
      if (filters.maxValue !== undefined) {
        (where.value as Prisma.DecimalFilter).lte = new Decimal(filters.maxValue)
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
    // Récupérer l'actif avant modification pour l'historique
    const existingActif = await this.getActifById(id, true)
    if (!existingActif) {
      throw new Error('Actif not found or access denied')
    }

    const updateData: Record<string, unknown> = { ...data }

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

    // Récupérer les clients propriétaires
    const clientActifs = await this.prisma.clientActif.findMany({
      where: { actifId: id },
      select: { clientId: true },
    })

    // Créer un événement timeline pour chaque client propriétaire
    for (const ca of clientActifs) {
      await this.prisma.timelineEvent.create({
        data: {
          cabinet: { connect: { id: this.cabinetId } },
          clientId: ca.clientId,
          type: 'ASSET_UPDATED',
          title: 'Actif modifié',
          description: `${data.name || existingActif.name} - Valeur: ${data.value !== undefined ? data.value : (existingActif.value as Decimal).toNumber()}€`,
          relatedEntityType: 'Actif',
          relatedEntityId: id,
          createdBy: this.userId,
        },
      })

      // Déclencher le recalcul du patrimoine (BullMQ)
      await queuePatrimoineUpdate(ca.clientId, this.cabinetId, 'actif', id, this.userId)
    }

    return this.getActifById(id)
  }

  /**
   * Met à jour la valeur d'un actif
   */
  async updateActifValue(id: string, newValue: number) {
    const { count } = await this.prisma.actif.updateMany({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
      data: { value: new Decimal(newValue) },
    })

    if (count === 0) {
      throw new Error('Actif not found or access denied')
    }

    const actif = await this.getActifById(id)

    // Déclencher le recalcul du patrimoine pour chaque client (BullMQ)
    const clientActifs = await this.prisma.clientActif.findMany({
      where: { actifId: id },
      select: { clientId: true },
    })

    for (const ca of clientActifs) {
      await queuePatrimoineUpdate(ca.clientId, this.cabinetId, 'actif', id, this.userId)
    }

    return actif
  }

  /**
   * Désactive un actif (soft delete)
   */
  async deactivateActif(id: string) {
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

    const actif = await this.getActifById(id)
    if (actif) {
      const clientActifs = await this.prisma.clientActif.findMany({
        where: { actifId: id },
        select: { clientId: true },
      })

      for (const ca of clientActifs) {
        await queuePatrimoineUpdate(ca.clientId, this.cabinetId, 'actif', id, this.userId)
      }
    }

    return actif
  }

  /**
   * Réactive un actif
   */
  async reactivateActif(id: string) {
    const { count } = await this.prisma.actif.updateMany({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
      data: { isActive: true },
    })

    if (count === 0) {
      throw new Error('Actif not found or access denied')
    }

    const actif = await this.getActifById(id)
    if (actif) {
      const clientActifs = await this.prisma.clientActif.findMany({
        where: { actifId: id },
        select: { clientId: true },
      })

      for (const ca of clientActifs) {
        await queuePatrimoineUpdate(ca.clientId, this.cabinetId, 'actif', id, this.userId)
      }
    }

    return actif
  }

  /**
   * Partage un actif avec un autre client (indivision)
   */
  async shareActif(data: ShareActifInput) {
    // Vérifier que l'actif existe
    const actif = await this.prisma.actif.findFirst({
      where: {
        id: data.actifId,
        cabinetId: this.cabinetId,
      },
    })

    if (!actif) {
      throw new Error('Actif not found')
    }

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

    // Vérifier que le total des pourcentages ne dépasse pas 100%
    const existingShares = await this.prisma.clientActif.findMany({
      where: { actifId: data.actifId },
    })

    const totalPercentage = existingShares.reduce(
      (sum: number, ca) => sum + ca.ownershipPercentage.toNumber(),
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
        ownershipPercentage: new Decimal(data.ownershipPercentage),
        ownershipType: data.ownershipType,
      },
    })

    // Créer un événement timeline
    await this.prisma.timelineEvent.create({
      data: {
        cabinet: { connect: { id: this.cabinetId } },
        clientId: data.clientId,
        type: 'ASSET_ADDED',
        title: 'Actif partagé ajouté',
        description: `${actif.name} (${data.ownershipPercentage}% de ${actif.value}€)`,
        relatedEntityType: 'Actif',
        relatedEntityId: actif.id,
        createdBy: this.userId,
      },
    })

    // Déclencher le recalcul du patrimoine (BullMQ)
    await queuePatrimoineUpdate(data.clientId, this.cabinetId, 'actif', actif.id, this.userId)

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
      (sum: number, ca) => sum + ca.ownershipPercentage.toNumber(),
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
        ownershipPercentage: new Decimal(newPercentage),
      },
    })

    // Déclencher le recalcul du patrimoine (BullMQ)
    await queuePatrimoineUpdate(clientId, this.cabinetId, 'actif', actifId, this.userId)

    return updated
  }

  /**
   * Retire un client d'un actif partagé
   */
  async removeClientFromActif(actifId: string, clientId: string) {
    const { count } = await this.prisma.clientActif.deleteMany({
      where: {
        clientId,
        actifId,
        actif: {
          cabinetId: this.cabinetId,
        },
      },
    })

    if (count === 0) {
      throw new Error('Client does not own this actif')
    }

    // Déclencher le recalcul du patrimoine (BullMQ)
    await queuePatrimoineUpdate(clientId, this.cabinetId, 'actif', actifId, this.userId)

    return { success: true }
  }

  /**
   * Récupère les propriétaires d'un actif
   */
  async getActifOwners(actifId: string) {
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

    return owners.map((o) => ({
      client: o.client,
      ownershipPercentage: o.ownershipPercentage.toNumber(),
      ownershipType: o.ownershipType,
    }))
  }

  /**
   * Calcule le rendement d'un actif
   */
  async calculateActifReturn(id: string): Promise<number> {
    const actif = await this.prisma.actif.findFirst({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
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
    const actifs = await this.prisma.actif.findMany({
      where: { isActive: true, cabinetId: this.cabinetId },
    })

    const byCategory: Record<string, number> = {
      IMMOBILIER: 0,
      FINANCIER: 0,
      PROFESSIONNEL: 0,
      AUTRE: 0,
      MOBILIER: 0,
      EPARGNE_SALARIALE: 0,
      EPARGNE_RETRAITE: 0
    }

    for (const actif of actifs) {
      if (!byCategory[actif.category]) byCategory[actif.category] = 0
      byCategory[actif.category] += actif.value.toNumber()
    }

    const total = Object.values(byCategory).reduce((sum: number, val: number) => sum + val, 0)

    const percentages: Record<string, number> = {}
    for (const cat in byCategory) {
      percentages[cat] = total > 0 ? (byCategory[cat] / total) * 100 : 0
    }

    return {
      values: byCategory,
      percentages,
      total,
    }
  }

  /**
   * Récupère les actifs gérés par le cabinet
   */
  async getManagedActifs() {
    const actifs = await this.prisma.actif.findMany({
      where: {
        isActive: true,
        cabinetId: this.cabinetId,
        managedByFirm: true
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

    const totalValue = actifs.reduce((sum: number, a) => sum + a.value.toNumber(), 0)
    const totalFees = actifs.reduce((sum: number, a) => {
      const value = a.value.toNumber()
      const feeRate = a.managementFees?.toNumber() || 0
      return sum + (value * feeRate) / 100
    }, 0)

    return {
      actifs,
      totalValue,
      totalFees,
      count: actifs.length,
    }
  }

  /**
   * Supprime (désactive) un actif
   */
  async deleteActif(id: string) {
    // Récupérer l'actif et ses propriétaires avant suppression
    const existingActif = await this.getActifById(id)
    if (!existingActif) {
      throw new Error('Actif not found or access denied')
    }

    const clientActifs = await this.prisma.clientActif.findMany({
      where: { actifId: id },
      select: { clientId: true },
    })

    const { count } = await this.prisma.actif.updateMany({
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
      throw new Error('Actif not found or access denied')
    }

    // Créer un événement timeline pour chaque client propriétaire
    for (const ca of clientActifs) {
      await this.prisma.timelineEvent.create({
        data: {
          cabinet: { connect: { id: this.cabinetId } },
          clientId: ca.clientId,
          type: 'ASSET_DELETED',
          title: 'Actif supprimé',
          description: `${existingActif.name} (${(existingActif.value as Decimal).toNumber()}€)`,
          relatedEntityType: 'Actif',
          relatedEntityId: id,
          createdBy: this.userId,
        },
      })

      // Déclencher le recalcul du patrimoine (BullMQ)
      await queuePatrimoineUpdate(ca.clientId, this.cabinetId, 'actif', id, this.userId)
    }

    return this.getActifById(id)
  }
}
