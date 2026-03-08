 
import { getPrismaClient } from '@/app/_common/lib/prisma'
import { GmailService, GmailMessage } from './email-sync/gmail-service'
import { OutlookService, OutlookMessage } from './email-sync/outlook-service'
import { EmailProvider, EmailDirection } from '@prisma/client'
import { logger } from '@/app/_common/lib/logger'
// Email classification keywords
const CLASSIFICATION_RULES = {
  CLIENT: [
    'client',
    'particulier',
    'rdv',
    'rendez-vous',
    'meeting',
    'bilan',
    'patrimoine',
    'investissement',
    'contrat',
    'signature',
  ],
  PROSPECT: [
    'prospect',
    'nouveau',
    'demande',
    'information',
    'renseignement',
    'intéressé',
    'découverte',
    'premier contact',
  ],
  INTERNAL: ['équipe', 'team', 'réunion interne', 'staff', 'collègue', 'cabinet', 'organisation', 'planning'],
  IMPORTANT: ['urgent', 'important', 'prioritaire', 'asap', 'rapidement', 'immédiat', 'critique'],
}

export class EmailSyncService {
  private prisma

  constructor(
    private cabinetId: string,
    private userId: string,
    private isSuperAdmin: boolean = false
  ) {
    this.prisma = getPrismaClient(cabinetId, isSuperAdmin)
  }

  /**
   * Connect Gmail account
   */
  async connectGmail(code: string): Promise<void> {
    // Exchange code for tokens
    const tokens = await GmailService.getTokens(code)

    // Get user's email address
    const gmailService = new GmailService(tokens)
    const email = await gmailService.getUserEmail()

    // Save integration
    await this.prisma.emailIntegration.upsert({
      where: { userId: this.userId },
      create: {
        userId: this.userId,
        provider: EmailProvider.GMAIL,
        email,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt,
        scope: tokens.scope,
        syncEnabled: true,
        syncFrequency: 5,
      },
      update: {
        email,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt,
        scope: tokens.scope,
        syncEnabled: true,
      },
    })
  }

  /**
   * Connect Outlook account
   */
  async connectOutlook(code: string): Promise<void> {
    // Exchange code for tokens
    const tokens = await OutlookService.getTokens(code)

    // Get user's email address
    const outlookService = new OutlookService(tokens.accessToken)
    const email = await outlookService.getUserEmail()

    // Save integration
    await this.prisma.emailIntegration.upsert({
      where: { userId: this.userId },
      create: {
        userId: this.userId,
        provider: EmailProvider.OUTLOOK,
        email,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt,
        scope: tokens.scope,
        syncEnabled: true,
        syncFrequency: 5,
      },
      update: {
        email,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt,
        scope: tokens.scope,
        syncEnabled: true,
      },
    })
  }

  /**
   * Disconnect email integration
   */
  async disconnect(): Promise<void> {
    await this.prisma.emailIntegration.update({
      where: { userId: this.userId },
      data: {
        syncEnabled: false,
      },
    })
  }

  /**
   * Get email integration status
   */
  async getIntegrationStatus() {
    return this.prisma.emailIntegration.findUnique({
      where: { userId: this.userId },
      select: {
        provider: true,
        email: true,
        syncEnabled: true,
        lastSyncAt: true,
        lastSyncStatus: true,
        syncFrequency: true,
      },
    })
  }

  /**
   * Sync emails for current user
   */
  async syncEmails(): Promise<{ synced: number; errors: number }> {
    const integration = await this.prisma.emailIntegration.findUnique({
      where: { userId: this.userId },
    })

    if (!integration || !integration.syncEnabled) {
      throw new Error('Email integration not found or disabled')
    }

    let synced = 0
    let errors = 0

    try {
      // Check if token needs refresh
      if (integration.expiresAt && new Date() >= integration.expiresAt) {
        await this.refreshTokens(integration)
      }

      if (integration.provider === EmailProvider.GMAIL) {
        const result = await this.syncGmailEmails(integration)
        synced = result.synced
        errors = result.errors
      } else if (integration.provider === EmailProvider.OUTLOOK) {
        const result = await this.syncOutlookEmails(integration)
        synced = result.synced
        errors = result.errors
      }

      // Update last sync
      await this.prisma.emailIntegration.update({
        where: { userId: this.userId },
        data: {
          lastSyncAt: new Date(),
          lastSyncStatus: errors > 0 ? `Synced ${synced}, ${errors} errors` : `Synced ${synced} emails`,
        },
      })
    } catch (error: unknown) {
      await this.prisma.emailIntegration.update({
        where: { userId: this.userId },
        data: {
          lastSyncAt: new Date(),
          lastSyncStatus: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      })
      throw error
    }

    return { synced, errors }
  }

  /**
   * Sync Gmail emails
   */
  private async syncGmailEmails(integration: { accessToken: string; refreshToken: string; expiresAt: Date; autoClassify?: boolean; autoMatchClient?: boolean; email: string }): Promise<{ synced: number; errors: number }> {
    const gmailService = new GmailService({
      accessToken: integration.accessToken,
      refreshToken: integration.refreshToken,
      expiresAt: integration.expiresAt,
    })

    const { messages } = await gmailService.fetchEmails({
      maxResults: 50,
      query: 'is:unread',
    })

    let synced = 0
    let errors = 0

    for (const message of messages) {
      try {
        await this.saveEmail(message, EmailProvider.GMAIL, integration)
        synced++
      } catch (error: unknown) {
        logger.error('Error saving email:', { error: error instanceof Error ? error.message : String(error) })
        errors++
      }
    }

    return { synced, errors }
  }

  /**
   * Sync Outlook emails
   */
  private async syncOutlookEmails(integration: { accessToken: string; refreshToken: string; expiresAt: Date; autoClassify?: boolean; autoMatchClient?: boolean; email: string }): Promise<{ synced: number; errors: number }> {
    const outlookService = new OutlookService(integration.accessToken)

    const { messages } = await outlookService.fetchEmails({
      maxResults: 50,
      filter: 'isRead eq false',
    })

    let synced = 0
    let errors = 0

    for (const message of messages) {
      try {
        await this.saveEmail(message, EmailProvider.OUTLOOK, integration)
        synced++
      } catch (error: unknown) {
        logger.error('Error saving email:', { error: error instanceof Error ? error.message : String(error) })
        errors++
      }
    }

    return { synced, errors }
  }

  /**
   * Save email to database
   */
  private async saveEmail(
    message: GmailMessage | OutlookMessage,
    provider: EmailProvider,
    integration: { autoClassify?: boolean; autoMatchClient?: boolean; email: string }
  ): Promise<void> {
    // Check if email already exists
    const existing = await this.prisma.syncedEmail.findUnique({
      where: {
        externalId_provider: {
          externalId: message.externalId,
          provider,
        },
      },
    })

    if (existing) {
      return // Skip duplicates
    }

    // Classify email
    const classifiedAs = integration.autoClassify ? this.classifyEmail(message) : []

    // Try to match to client
    const clientId = integration.autoMatchClient ? await this.matchClient(message) : null

    // Determine direction
    const direction = this.determineDirection(message.from, integration.email)

    // Save email
    await this.prisma.syncedEmail.create({
      data: {
        cabinetId: this.cabinetId,
        userId: this.userId,
        clientId,
        externalId: message.externalId,
        threadId: message.threadId,
        provider,
        from: message.from,
        to: message.to,
        cc: message.cc,
        subject: message.subject,
        body: message.body,
        bodyHtml: message.bodyHtml,
        snippet: message.snippet,
        direction,
        isRead: message.isRead,
        hasAttachments: message.hasAttachments,
        labels: message.labels,
        autoClassified: classifiedAs.length > 0,
        classifiedAs,
        sentAt: message.sentAt,
        receivedAt: message.receivedAt,
      },
    })

    // TODO: Create notification for important emails
  }

  /**
   * Classify email based on content
   */
  private classifyEmail(message: GmailMessage | OutlookMessage): string[] {
    const text = `${message.subject} ${message.body} ${message.snippet}`.toLowerCase()
    const labels: string[] = []

    for (const [label, keywords] of Object.entries(CLASSIFICATION_RULES)) {
      if (keywords.some((keyword: any) => text.includes(keyword.toLowerCase()))) {
        labels.push(label)
      }
    }

    return labels
  }

  /**
   * Try to match email to a client
   */
  private async matchClient(message: GmailMessage | OutlookMessage): Promise<string | null> {
    const emailAddresses = [message.from, ...message.to, ...message.cc].filter(Boolean)

    for (const emailAddr of emailAddresses) {
      // Extract email from "Name <email@domain.com>" format
      const match = emailAddr.match(/<(.+?)>/)
      const cleanEmail = match ? match[1] : emailAddr

      const client = await this.prisma.client.findFirst({
        where: {
          email: {
            contains: cleanEmail,
            mode: 'insensitive',
          },
        },
      })

      if (client) {
        return client.id
      }
    }

    return null
  }

  /**
   * Determine email direction
   */
  private determineDirection(from: string, userEmail: string): EmailDirection {
    const cleanFrom = from.match(/<(.+?)>/) ? from.match(/<(.+?)>/)![1] : from
    return cleanFrom.toLowerCase().includes(userEmail.toLowerCase())
      ? EmailDirection.SORTANT
      : EmailDirection.ENTRANT
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
      where: { userId: this.userId },
      data: {
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken || integration.refreshToken,
        expiresAt: newTokens.expiresAt,
      },
    })
  }

  /**
   * Get synced emails with filters
   */
  async getSyncedEmails(filters?: {
    clientId?: string
    isRead?: boolean
    search?: string
    limit?: number
    offset?: number
  }) {
    const where: any = {
      userId: this.userId,
    }

    if (filters?.clientId) {
      where.clientId = filters.clientId
    }

    if (filters?.isRead !== undefined) {
      where.isRead = filters.isRead
    }

    if (filters?.search) {
      where.OR = [
        { subject: { contains: filters.search, mode: 'insensitive' } },
        { body: { contains: filters.search, mode: 'insensitive' } },
        { from: { contains: filters.search, mode: 'insensitive' } },
      ]
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
   * Mark email as read
   */
  async markAsRead(emailId: string): Promise<void> {
    await this.prisma.syncedEmail.updateMany({
      where: { id: emailId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    })
  }

  /**
   * Link email to client
   */
  async linkToClient(emailId: string, clientId: string): Promise<void> {
    await this.prisma.syncedEmail.updateMany({
      where: { id: emailId },
      data: { clientId },
    })
  }
}
