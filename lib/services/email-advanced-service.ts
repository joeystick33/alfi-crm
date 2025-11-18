import { getPrismaClient } from '@/lib/prisma'
import { GmailService } from './email-sync/gmail-service'
import { OutlookService } from './email-sync/outlook-service'
import { EmailProvider } from '@prisma/client'

/**
 * Email Advanced Service
 * Handles advanced email features: sending, attachments, templates, etc.
 */
export class EmailAdvancedService {
  private prisma

  constructor(
    private cabinetId: string,
    private userId: string,
    private isSuperAdmin: boolean = false
  ) {
    this.prisma = getPrismaClient(cabinetId, isSuperAdmin)
  }

  /**
   * Send email via Gmail or Outlook
   */
  async sendEmail(data: {
    to: string[]
    subject: string
    body: string
    cc?: string[]
    bcc?: string[]
    replyToEmailId?: string
  }): Promise<{ success: boolean; externalId?: string }> {
    const user = await this.prisma.user.findFirst({
      where: {
        id: this.userId,
        cabinetId: this.cabinetId,
      },
    })

    if (!user) {
      throw new Error('User not found or access denied')
    }

    const integration = await this.prisma.emailIntegration.findUnique({
      where: { userId: this.userId },
    })

    if (!integration || !integration.syncEnabled) {
      throw new Error('Email integration not found or disabled')
    }

    // Check if token needs refresh
    if (integration.expiresAt && new Date() >= integration.expiresAt) {
      await this.refreshTokens(integration)
    }

    let result

    if (integration.provider === EmailProvider.GMAIL) {
      const gmailService = new GmailService({
        accessToken: integration.accessToken,
        refreshToken: integration.refreshToken,
        expiresAt: integration.expiresAt,
      })
      result = await gmailService.sendEmail(data)
    } else {
      const outlookService = new OutlookService(integration.accessToken)
      result = await outlookService.sendEmail(data)
    }

    // Si c'est une réponse, enregistrer la réponse
    if (data.replyToEmailId) {
      const targetEmail = await this.prisma.syncedEmail.findFirst({
        where: {
          id: data.replyToEmailId,
          cabinetId: this.cabinetId,
        },
      })

      if (!targetEmail) {
        throw new Error('Referenced email not found or access denied')
      }

      await this.prisma.emailReply.create({
        data: {
          syncedEmailId: data.replyToEmailId,
          userId: this.userId,
          body: data.body,
          sentAt: new Date(),
          sentVia: integration.provider,
          externalId: result.id || result.messageId,
        },
      })
    }

    return {
      success: true,
      externalId: result.id || result.messageId,
    }
  }

  /**
   * Get email attachments
   */
  async getAttachments(emailId: string) {
    return this.prisma.emailAttachment.findMany({
      where: {
        syncedEmailId: emailId,
        syncedEmail: {
          cabinetId: this.cabinetId,
        },
      },
      orderBy: { createdAt: 'asc' },
    })
  }

  /**
   * Get email replies
   */
  async getEmailReplies(emailId: string) {
    return this.prisma.emailReply.findMany({
      where: {
        syncedEmailId: emailId,
        syncedEmail: {
          cabinetId: this.cabinetId,
        },
      },
      orderBy: { sentAt: 'desc' },
    })
  }

  /**
   * Search emails with full-text search
   */
  async searchEmails(
    query: string,
    filters?: {
      clientId?: string
      isRead?: boolean
      startDate?: Date
      endDate?: Date
      limit?: number
      offset?: number
    }
  ) {
    const where: any = {
      userId: this.userId,
      cabinetId: this.cabinetId,
      OR: [
        { subject: { contains: query, mode: 'insensitive' } },
        { body: { contains: query, mode: 'insensitive' } },
        { from: { contains: query, mode: 'insensitive' } },
      ],
    }

    if (filters?.clientId) {
      where.clientId = filters.clientId
    }

    if (filters?.isRead !== undefined) {
      where.isRead = filters.isRead
    }

    if (filters?.startDate || filters?.endDate) {
      where.receivedAt = {}
      if (filters.startDate) {
        where.receivedAt.gte = filters.startDate
      }
      if (filters.endDate) {
        where.receivedAt.lte = filters.endDate
      }
    }

    const [emails, total] = await Promise.all([
      this.prisma.syncedEmail.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          attachments: true,
        },
        orderBy: { receivedAt: 'desc' },
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
      }),
      this.prisma.syncedEmail.count({ where }),
    ])

    return { emails, total }
  }

  /**
   * Get emails with advanced filters
   */
  async getEmailsAdvanced(filters: {
    clientId?: string
    isRead?: boolean
    hasAttachments?: boolean
    classification?: string[]
    from?: string
    startDate?: Date
    endDate?: Date
    limit?: number
    offset?: number
  }) {
    const where: any = {
      userId: this.userId,
      cabinetId: this.cabinetId,
    }

    if (filters.clientId) {
      where.clientId = filters.clientId
    }

    if (filters.isRead !== undefined) {
      where.isRead = filters.isRead
    }

    if (filters.hasAttachments !== undefined) {
      where.hasAttachments = filters.hasAttachments
    }

    if (filters.from) {
      where.from = { contains: filters.from, mode: 'insensitive' }
    }

    if (filters.startDate || filters.endDate) {
      where.receivedAt = {}
      if (filters.startDate) {
        where.receivedAt.gte = filters.startDate
      }
      if (filters.endDate) {
        where.receivedAt.lte = filters.endDate
      }
    }

    const [emails, total] = await Promise.all([
      this.prisma.syncedEmail.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          attachments: true,
        },
        orderBy: { receivedAt: 'desc' },
        take: filters.limit || 50,
        skip: filters.offset || 0,
      }),
      this.prisma.syncedEmail.count({ where }),
    ])

    // Filter by classification in memory if needed
    let filteredEmails = emails
    if (filters.classification && filters.classification.length > 0) {
      filteredEmails = emails.filter((email: any) => {
        const classified = email.classifiedAs as string[] | null
        if (!classified) return false
        return filters.classification!.some((c: any) => classified.includes(c))
      })
    }

    return {
      emails: filteredEmails,
      total: filters.classification ? filteredEmails.length : total,
    }
  }

  /**
   * Refresh tokens
   */
  private async refreshTokens(integration: any): Promise<void> {
    let newTokens

    if (integration.provider === EmailProvider.GMAIL) {
      const gmailService = new GmailService()
      newTokens = await gmailService.refreshToken(integration.refreshToken)
    } else {
      newTokens = await OutlookService.refreshToken(integration.refreshToken)
    }

    await this.prisma.emailIntegration.update({
      where: { id: integration.id },
      data: {
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken || integration.refreshToken,
        expiresAt: newTokens.expiresAt,
      },
    })
  }
}

/**
 * Email Template Service
 */
export class EmailTemplateService {
  private prisma

  constructor(
    private cabinetId: string,
    private userId: string,
    private isSuperAdmin: boolean = false
  ) {
    this.prisma = getPrismaClient(cabinetId, isSuperAdmin)
  }

  /**
   * Create email template
   */
  async createTemplate(data: {
    name: string
    subject: string
    body: string
    bodyHtml?: string
    category?: string
    variables?: Record<string, string>
  }) {
    return this.prisma.emailTemplate.create({
      data: {
        cabinetId: this.cabinetId,
        createdBy: this.userId,
        name: data.name,
        subject: data.subject,
        body: data.body,
        bodyHtml: data.bodyHtml,
        category: data.category,
        variables: data.variables || {},
        isActive: true,
      },
    })
  }

  /**
   * Get all templates
   */
  async getTemplates(filters?: { category?: string; isActive?: boolean }) {
    const where: any = {
      cabinetId: this.cabinetId,
    }

    if (filters?.category) {
      where.category = filters.category
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive
    }

    return this.prisma.emailTemplate.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Get template by ID
   */
  async getTemplateById(id: string) {
    return this.prisma.emailTemplate.findFirst({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
    })
  }

  /**
   * Update template
   */
  async updateTemplate(
    id: string,
    data: {
      name?: string
      subject?: string
      body?: string
      bodyHtml?: string
      category?: string
      variables?: Record<string, string>
      isActive?: boolean
    }
  ) {
    const { count } = await this.prisma.emailTemplate.updateMany({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
      data,
    })

    if (count === 0) {
      throw new Error('Email template not found or access denied')
    }

    return this.getTemplateById(id)
  }

  /**
   * Delete template
   */
  async deleteTemplate(id: string) {
    const { count } = await this.prisma.emailTemplate.deleteMany({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
    })

    if (count === 0) {
      throw new Error('Email template not found or access denied')
    }

    return { success: true }
  }

  /**
   * Apply template with variables
   */
  applyTemplate(
    template: any,
    variables: Record<string, string>
  ): { subject: string; body: string; bodyHtml?: string } {
    let subject = template.subject
    let body = template.body
    let bodyHtml = template.bodyHtml

    // Replace variables in subject and body
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{${key}}`
      subject = subject.replace(new RegExp(placeholder, 'g'), value)
      body = body.replace(new RegExp(placeholder, 'g'), value)
      if (bodyHtml) {
        bodyHtml = bodyHtml.replace(new RegExp(placeholder, 'g'), value)
      }
    }

    return { subject, body, bodyHtml }
  }
}
