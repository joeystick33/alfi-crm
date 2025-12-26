import { PrismaClient } from '@prisma/client'
import { prisma } from '@/app/_common/lib/prisma'

export interface CreateEmailTemplateInput {
  name: string
  description?: string
  category?: string
  subject: string
  previewText?: string
  htmlContent: string
  plainContent?: string
  variables?: string[]
  tags?: string[]
  notes?: string
  isSystem?: boolean
}

export interface UpdateEmailTemplateInput {
  name?: string
  description?: string
  category?: string
  subject?: string
  previewText?: string
  htmlContent?: string
  plainContent?: string
  variables?: string[]
  tags?: string[]
  notes?: string
  isActive?: boolean
}

export interface EmailTemplateFilters {
  category?: string
  isActive?: boolean
  isSystem?: boolean
  search?: string
  tags?: string[]
  limit?: number
  offset?: number
  sortBy?: 'createdAt' | 'name' | 'category' | 'updatedAt'
  sortOrder?: 'asc' | 'desc'
}

export class EmailTemplateService {
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
   * Créer un nouveau template email
   */
  async createTemplate(input: CreateEmailTemplateInput) {
    // Validation contenu
    if (!input.name || input.name.trim() === '') {
      throw new Error('Le nom du template est requis')
    }

    if (!input.subject || input.subject.trim() === '') {
      throw new Error('Le sujet du template est requis')
    }

    if (!input.htmlContent || input.htmlContent.trim() === '') {
      throw new Error('Le contenu HTML du template est requis')
    }

    // Vérifier unicité du nom
    const existing = await this.prisma.emailTemplate.findFirst({
      where: {
        cabinetId: this.cabinetId,
        name: input.name,
        isActive: false,
      },
    })

    if (existing) {
      throw new Error('Un template avec ce nom existe déjà')
    }

    const template = await this.prisma.emailTemplate.create({
      data: {
        cabinetId: this.cabinetId,
        createdBy: this.userId,
        name: input.name,
        description: input.description,
        category: input.category,
        subject: input.subject,
        previewText: input.previewText,
        htmlContent: input.htmlContent,
        plainContent: input.plainContent,
        variables: input.variables || [],
        isActive: true,
        isSystem: input.isSystem || false,
        tags: input.tags || [],
        notes: input.notes,
      },
      include: {
        createdByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            campaigns: true,
            scenarios: true,
            messages: true,
          },
        },
      },
    })

    return template
  }

  /**
   * Lister les templates avec filtres
   */
  async listTemplates(filters: EmailTemplateFilters = {}) {
     
    const where: any = {
      cabinetId: this.cabinetId,
    }

    if (filters.category) where.category = filters.category
    if (filters.isActive !== undefined) where.isActive = filters.isActive
    if (filters.isSystem !== undefined) where.isSystem = filters.isSystem

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { subject: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    if (filters.tags && filters.tags.length > 0) {
      where.tags = {
        hasSome: filters.tags,
      }
    }

     
    const orderBy: any = {}
    const sortBy = filters.sortBy || 'createdAt'
    const sortOrder = filters.sortOrder || 'desc'
    orderBy[sortBy] = sortOrder

    const limit = filters.limit || 50
    const offset = filters.offset || 0

    const [templates, total] = await Promise.all([
      this.prisma.emailTemplate.findMany({
        where,
        orderBy,
        take: limit,
        skip: offset,
        include: {
          createdByUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: {
              campaigns: true,
              scenarios: true,
              messages: true,
            },
          },
        },
      }),
      this.prisma.emailTemplate.count({ where }),
    ])

    return {
      data: templates,
      total,
      limit,
      offset,
    }
  }

  /**
   * Obtenir un template par ID
   */
  async getTemplateById(id: string) {
    const template = await this.prisma.emailTemplate.findFirst({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
      include: {
        createdByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        campaigns: {
          take: 10,
          select: {
            id: true,
            name: true,
            status: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        scenarios: {
          take: 10,
          select: {
            id: true,
            name: true,
            status: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            campaigns: true,
            scenarios: true,
            messages: true,
          },
        },
      },
    })

    if (!template) {
      throw new Error('Template non trouvé')
    }

    return template
  }

  /**
   * Mettre à jour un template
   */
  async updateTemplate(id: string, input: UpdateEmailTemplateInput) {
    const existing = await this.prisma.emailTemplate.findFirst({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
    })

    if (!existing) {
      throw new Error('Template non trouvé')
    }

    // Ne peut modifier les templates système que si super admin
    if (existing.isSystem && !this.isSuperAdmin) {
      throw new Error('Les templates système ne peuvent pas être modifiés')
    }

    // Vérifier unicité du nom si changé
    if (input.name && input.name !== existing.name) {
      const duplicate = await this.prisma.emailTemplate.findFirst({
        where: {
          cabinetId: this.cabinetId,
          name: input.name,
          isActive: false,
          id: { not: id },
        },
      })

      if (duplicate) {
        throw new Error('Un template avec ce nom existe déjà')
      }
    }

     
    const updateData: any = {}
    if (input.name !== undefined) updateData.name = input.name
    if (input.description !== undefined) updateData.description = input.description
    if (input.category !== undefined) updateData.category = input.category
    if (input.subject !== undefined) updateData.subject = input.subject
    if (input.previewText !== undefined) updateData.previewText = input.previewText
    if (input.htmlContent !== undefined) updateData.htmlContent = input.htmlContent
    if (input.plainContent !== undefined) updateData.plainContent = input.plainContent
    if (input.variables !== undefined) updateData.variables = input.variables
    if (input.isActive !== undefined) updateData.isActive = input.isActive
    if (input.tags !== undefined) updateData.tags = input.tags
    if (input.notes !== undefined) updateData.notes = input.notes

    const updated = await this.prisma.emailTemplate.update({
      where: { id },
      data: updateData,
      include: {
        createdByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            campaigns: true,
            scenarios: true,
            messages: true,
          },
        },
      },
    })

    return updated
  }

  /**
   * Dupliquer un template
   */
  async duplicateTemplate(id: string, newName?: string) {
    const original = await this.prisma.emailTemplate.findFirst({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
    })

    if (!original) {
      throw new Error('Template non trouvé')
    }

    // Générer nom unique
    const baseName = newName || `${original.name} (copie)`
    let duplicateName = baseName
    let counter = 1

    while (
      await this.prisma.emailTemplate.findFirst({
        where: {
          cabinetId: this.cabinetId,
          name: duplicateName,
          isActive: false,
        },
      })
    ) {
      duplicateName = `${baseName} ${counter}`
      counter++
    }

    const duplicate = await this.prisma.emailTemplate.create({
      data: {
        cabinetId: this.cabinetId,
        createdBy: this.userId,
        name: duplicateName,
        description: original.description,
        category: original.category,
        subject: original.subject,
        previewText: original.previewText,
        htmlContent: original.htmlContent,
        plainContent: original.plainContent,
        variables: original.variables,
        isActive: false, // Inactif par défaut pour la copie
        isSystem: false, // Les copies ne sont jamais système
        tags: original.tags,
        notes: original.notes,
      },
      include: {
        createdByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    return duplicate
  }

  /**
   * Archiver un template
   */
  async archiveTemplate(id: string) {
    const template = await this.prisma.emailTemplate.findFirst({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
    })

    if (!template) {
      throw new Error('Template non trouvé')
    }

    if (template.isSystem && !this.isSuperAdmin) {
      throw new Error('Les templates système ne peuvent pas être archivés')
    }

    // Vérifier qu'il n'est pas utilisé par des campagnes/scénarios actifs
    const [activeCampaigns, activeScenarios] = await Promise.all([
      this.prisma.campaign.count({
        where: {
          emailTemplateId: id,
          status: { in: ['PLANIFIEE', 'EN_COURS'] },
        },
      }),
      this.prisma.scenario.count({
        where: {
          emailTemplateId: id,
          status: 'ACTIF',
        },
      }),
    ])

    if (activeCampaigns > 0 || activeScenarios > 0) {
      throw new Error(
        'Ce template est utilisé par des campagnes planifiées/en cours ou des scénarios actifs et ne peut être archivé'
      )
    }

    const updated = await this.prisma.emailTemplate.update({
      where: { id },
      data: {
        isActive: false, // Désactiver
      },
      include: {
        createdByUser: true,
      },
    })

    return updated
  }

  /**
   * Restaurer un template archivé
   */
  async unarchiveTemplate(id: string) {
    const template = await this.prisma.emailTemplate.findFirst({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
    })

    if (!template) {
      throw new Error('Template non trouvé')
    }

    if (!template.isActive) {
      throw new Error('Le template n\'est pas archivé')
    }

    const updated = await this.prisma.emailTemplate.update({
      where: { id },
      data: {
        isActive: true, // Réactiver
      },
      include: {
        createdByUser: true,
      },
    })

    return updated
  }

  /**
   * Supprimer définitivement un template
   */
  async deleteTemplate(id: string) {
    const template = await this.prisma.emailTemplate.findFirst({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
    })

    if (!template) {
      throw new Error('Template non trouvé')
    }

    if (template.isSystem && !this.isSuperAdmin) {
      throw new Error('Les templates système ne peuvent pas être supprimés')
    }

    // Vérifier qu'il n'est pas utilisé
    const [campaignsCount, scenariosCount, messagesCount] = await Promise.all([
      this.prisma.campaign.count({
        where: { emailTemplateId: id },
      }),
      this.prisma.scenario.count({
        where: { emailTemplateId: id },
      }),
      this.prisma.emailMessage.count({
        where: { emailTemplateId: id },
      }),
    ])

    if (campaignsCount > 0 || scenariosCount > 0 || messagesCount > 0) {
      throw new Error(
        'Ce template est utilisé par des campagnes, scénarios ou messages et ne peut être supprimé. Archivez-le plutôt.'
      )
    }

    await this.prisma.emailTemplate.delete({
      where: { id },
    })

    return { success: true }
  }

  /**
   * Obtenir les catégories de templates disponibles
   */
  async getCategories() {
    const templates = await this.prisma.emailTemplate.findMany({
      where: {
        cabinetId: this.cabinetId,
        isActive: false,
        category: {
          not: null,
        },
      },
      select: {
        category: true,
      },
      distinct: ['category'],
    })

    const categories = templates
      .map((t) => t.category)
      .filter((c): c is string => c !== null)
      .sort()

    return categories
  }

  /**
   * Obtenir les variables disponibles dans les templates
   */
  async getAllVariables() {
    const templates = await this.prisma.emailTemplate.findMany({
      where: {
        cabinetId: this.cabinetId,
        isActive: false,
      },
      select: {
        variables: true,
      },
    })

    const allVariables = new Set<string>()
    templates.forEach((t) => {
      t.variables.forEach((v) => allVariables.add(v))
    })

    return Array.from(allVariables).sort()
  }

  /**
   * Prévisualiser un template avec des données de test
   */
  async previewTemplate(id: string, testData?: Record<string, any>) {
    const template = await this.getTemplateById(id)

    // Données par défaut pour preview
    const defaultData: Record<string, string> = {
      firstName: 'Jean',
      lastName: 'Dupont',
      clientName: 'Jean Dupont',
      email: 'jean.dupont@example.com',
      conseillerName: 'Marie Martin',
      conseillerEmail: 'marie.martin@cabinet.fr',
      cabinetName: 'Cabinet Conseil',
      today: new Date().toLocaleDateString('fr-FR'),
    }

    const data = { ...defaultData, ...testData }

    // Remplacer variables dans contenu
    let htmlPreview = template.htmlContent
    let plainPreview = template.plainContent || ''
    let subjectPreview = template.subject

    Object.entries(data).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
      htmlPreview = htmlPreview.replace(regex, value)
      plainPreview = plainPreview.replace(regex, value)
      subjectPreview = subjectPreview.replace(regex, value)
    })

    return {
      template,
      preview: {
        subject: subjectPreview,
        htmlContent: htmlPreview,
        plainContent: plainPreview,
      },
      testData: data,
    }
  }

  /**
   * Obtenir les statistiques globales des templates
   */
  async getTemplateStats(filters: Partial<EmailTemplateFilters> = {}) {
    const where: any = {
      cabinetId: this.cabinetId,
    }

    if (filters.category) where.category = filters.category
    if (filters.isSystem !== undefined) where.isSystem = filters.isSystem

    const [
      total,
      active,
      inactive,
      archived,
      system,
    ] = await Promise.all([
      this.prisma.emailTemplate.count({ where }),
      this.prisma.emailTemplate.count({ where: { ...where, isActive: true } }),
      this.prisma.emailTemplate.count({ where: { ...where, isActive: false } }),
      this.prisma.emailTemplate.count({ where: { ...where, isActive: false } }),
      this.prisma.emailTemplate.count({ where: { ...where, isSystem: true } }),
    ])

    return {
      total,
      active,
      inactive,
      archived,
      system,
    }
  }
}
