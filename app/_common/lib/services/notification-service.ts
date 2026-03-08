import { getPrismaClient } from '@/app/_common/lib/prisma'
import type { NotificationFilters, CreateNotificationPayload } from '@/app/_common/lib/api-types'
import { EmailAdvancedService } from './email-advanced-service'
import { logger } from '@/app/_common/lib/logger'

// Email template data types
type PlanChangedData = {
  oldPlan: string
  newPlan: string
  reason?: string
}

type QuotaWarningData = {
  quotaName: string
  current: number
  max: number
  percentage: number
}

type QuotaExceededData = {
  quotaName: string
  current: number
  max: number
}

type AppointmentEmailData = {
  clientNom: string
  clientPrenom?: string
  typeName: string
  dateFormatted: string
  heureDebut: string
  heureFin: string
  location?: string
  videoLink?: string
  conseillerNom: string
  cabinetNom: string
}

// Email templates for notifications
const EMAIL_TEMPLATES = {
  PLAN_CHANGED: {
    subject: (data: PlanChangedData) => `Votre plan a été modifié - ${data.newPlan}`,
    body: (data: PlanChangedData) => `
      <h2>Changement de Plan</h2>
      <p>Bonjour,</p>
      <p>Votre plan d'abonnement a été modifié par un administrateur.</p>
      <ul>
        <li><strong>Ancien plan:</strong> ${data.oldPlan}</li>
        <li><strong>Nouveau plan:</strong> ${data.newPlan}</li>
        <li><strong>Date:</strong> ${new Date().toLocaleDateString('fr-FR')}</li>
      </ul>
      ${data.reason ? `<p><strong>Raison:</strong> ${data.reason}</p>` : ''}
      <p>Pour plus d'informations, connectez-vous à votre espace.</p>
    `,
  },
  QUOTA_WARNING: {
    subject: (data: QuotaWarningData) => `Attention: Quota ${data.quotaName} bientôt atteint`,
    body: (data: QuotaWarningData) => `
      <h2>Alerte Quota</h2>
      <p>Bonjour,</p>
      <p>Vous approchez de la limite de votre quota <strong>${data.quotaName}</strong>.</p>
      <ul>
        <li><strong>Utilisation actuelle:</strong> ${data.current} / ${data.max}</li>
        <li><strong>Pourcentage:</strong> ${data.percentage}%</li>
      </ul>
      <p>Pour augmenter vos quotas, vous pouvez upgrader votre plan d'abonnement.</p>
    `,
  },
  QUOTA_EXCEEDED: {
    subject: (data: QuotaExceededData) => `Quota ${data.quotaName} dépassé`,
    body: (data: QuotaExceededData) => `
      <h2>Quota Dépassé</h2>
      <p>Bonjour,</p>
      <p>Vous avez atteint la limite de votre quota <strong>${data.quotaName}</strong>.</p>
      <ul>
        <li><strong>Limite:</strong> ${data.max}</li>
        <li><strong>Utilisation actuelle:</strong> ${data.current}</li>
      </ul>
      <p><strong>Impact:</strong> Certaines fonctionnalités peuvent être temporairement bloquées.</p>
    `,
  },
  APPOINTMENT_CONFIRMATION: {
    subject: (data: AppointmentEmailData) => `Confirmation RDV : ${data.typeName} le ${data.dateFormatted}`,
    body: (data: AppointmentEmailData) => `
      <h2>Votre rendez-vous est confirmé</h2>
      <p>Bonjour ${data.clientPrenom || ''} ${data.clientNom},</p>
      <p>Votre rendez-vous a bien été enregistré :</p>
      <table style="border-collapse:collapse;width:100%;max-width:500px;">
        <tr><td style="padding:8px;background:#f8fafc;font-weight:600;border:1px solid #e2e8f0;">Type</td><td style="padding:8px;border:1px solid #e2e8f0;">${data.typeName}</td></tr>
        <tr><td style="padding:8px;background:#f8fafc;font-weight:600;border:1px solid #e2e8f0;">Date</td><td style="padding:8px;border:1px solid #e2e8f0;">${data.dateFormatted}</td></tr>
        <tr><td style="padding:8px;background:#f8fafc;font-weight:600;border:1px solid #e2e8f0;">Heure</td><td style="padding:8px;border:1px solid #e2e8f0;">${data.heureDebut} — ${data.heureFin}</td></tr>
        ${data.location ? `<tr><td style="padding:8px;background:#f8fafc;font-weight:600;border:1px solid #e2e8f0;">Lieu</td><td style="padding:8px;border:1px solid #e2e8f0;">${data.location}</td></tr>` : ''}
        ${data.videoLink ? `<tr><td style="padding:8px;background:#f8fafc;font-weight:600;border:1px solid #e2e8f0;">Visio</td><td style="padding:8px;border:1px solid #e2e8f0;"><a href="${data.videoLink}">Rejoindre la visio</a></td></tr>` : ''}
        <tr><td style="padding:8px;background:#f8fafc;font-weight:600;border:1px solid #e2e8f0;">Conseiller</td><td style="padding:8px;border:1px solid #e2e8f0;">${data.conseillerNom}</td></tr>
      </table>
      <p style="margin-top:16px;color:#64748b;font-size:12px;">Cabinet ${data.cabinetNom}</p>
    `,
  },
  APPOINTMENT_REMINDER: {
    subject: (data: AppointmentEmailData) => `Rappel : ${data.typeName} demain à ${data.heureDebut}`,
    body: (data: AppointmentEmailData) => `
      <h2>Rappel de votre rendez-vous</h2>
      <p>Bonjour ${data.clientPrenom || ''} ${data.clientNom},</p>
      <p>Nous vous rappelons votre rendez-vous <strong>${data.typeName}</strong> prévu :</p>
      <p><strong>${data.dateFormatted} de ${data.heureDebut} à ${data.heureFin}</strong></p>
      ${data.location ? `<p>Lieu : ${data.location}</p>` : ''}
      ${data.videoLink ? `<p><a href="${data.videoLink}" style="color:#2B7A78;font-weight:600;">Rejoindre la visio</a></p>` : ''}
      <p style="color:#64748b;font-size:12px;">Si vous devez annuler ou reporter, contactez-nous au plus vite.</p>
    `,
  },
  APPOINTMENT_CANCELLED: {
    subject: (data: AppointmentEmailData) => `Annulation RDV : ${data.typeName} du ${data.dateFormatted}`,
    body: (data: AppointmentEmailData) => `
      <h2>Rendez-vous annulé</h2>
      <p>Bonjour ${data.clientPrenom || ''} ${data.clientNom},</p>
      <p>Votre rendez-vous <strong>${data.typeName}</strong> du <strong>${data.dateFormatted}</strong> a été annulé.</p>
      <p>Pour prendre un nouveau rendez-vous, rendez-vous sur notre page de réservation.</p>
      <p style="color:#64748b;font-size:12px;">Cabinet ${data.cabinetNom}</p>
    `,
  },
}

/**
 * Notification Service
 * 
 * Manages notification entities with tenant isolation.
 * Provides CRUD operations and domain-specific business logic.
 * 
 * @example
 * const service = new NotificationService(cabinetId, userId, userRole, isSuperAdmin)
 * const notification = await service.createNotification(data)
 */
export class NotificationService {
  private prisma

  constructor(
    private cabinetId: string,
    private userId?: string,
    private userRole?: string,
    private isSuperAdmin: boolean = false
  ) {
    this.prisma = getPrismaClient(cabinetId, isSuperAdmin)
  }

  /**
   * Format notification entity with nested relations
   */
  private formatNotification(notification: unknown): unknown {
    if (!notification || typeof notification !== 'object') {
      return null
    }

    const notif = notification as Record<string, unknown>

    return {
      ...notif,
      client: notif.client && typeof notif.client === 'object' ? {
        id: (notif.client as Record<string, unknown>).id,
        firstName: (notif.client as Record<string, unknown>).firstName,
        lastName: (notif.client as Record<string, unknown>).lastName,
      } : null,
    }
  }

  /**
   * Create in-app notification
   */
  async createNotification(data: CreateNotificationPayload) {
    // Validate client exists if clientId provided
    if (data.clientId) {
      const client = await this.prisma.client.findFirst({
        where: {
          id: data.clientId,
          cabinetId: this.cabinetId,
        },
      })

      if (!client) {
        throw new Error('Client not found')
      }
    }

    const notification = await this.prisma.notification.create({
      data: {
        cabinetId: this.cabinetId,
        userId: data.userId,
        clientId: data.clientId,
        type: data.type,
        title: data.title,
        message: data.message,
        actionUrl: data.actionUrl,
        isRead: false,
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    return this.formatNotification(notification)
  }

  /**
   * Get notification by ID
   */
  async getNotificationById(id: string) {
    const notification = await this.prisma.notification.findFirst({
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
      },
    })

    return this.formatNotification(notification)
  }

  /**
   * List notifications with filters
   */
  async listNotifications(filters?: NotificationFilters) {
    const where: Record<string, unknown> = {
      cabinetId: this.cabinetId,
    }

    // Filter by userId if provided or use current user
    if (filters?.userId) {
      where.userId = filters.userId
    } else if (this.userId) {
      where.userId = this.userId
    }

    if (filters?.isRead !== undefined) {
      where.isRead = filters.isRead
    }

    if (filters?.type) {
      where.type = filters.type
    }

    if (filters?.clientId) {
      where.clientId = filters.clientId
    }

    if (filters?.createdAfter || filters?.createdBefore) {
      const createdAt: Record<string, Date> = {}
      if (filters.createdAfter) {
        createdAt.gte = new Date(filters.createdAfter)
      }
      if (filters.createdBefore) {
        createdAt.lte = new Date(filters.createdBefore)
      }
      where.createdAt = createdAt
    }

    try {
      const notifications = await this.prisma.notification.findMany({
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
        orderBy: { createdAt: 'desc' },
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
      })

      return notifications.map(n => this.formatNotification(n))
    } catch (error) {
      // Fallback defensif: si la jointure relationnelle échoue, on renvoie
      // les notifications sans relation client pour éviter un 500 côté UI.
      logger.warn('NotificationService.listNotifications include(client) failed, retrying without relation', { module: 'Notification', action: 'LIST', metadata: { error: String(error) } } as any)

      const notifications = await this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
      })

      return notifications.map(n => this.formatNotification({
        ...n,
        client: null,
      }))
    }
  }

  /**
   * Update notification
   */
  async updateNotification(id: string, updateData: { isRead?: boolean; readAt?: Date }) {
    const { count } = await this.prisma.notification.updateMany({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
      data: updateData,
    })

    if (count === 0) {
      throw new Error('Notification not found or access denied')
    }

    return this.getNotificationById(id)
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string) {
    return this.updateNotification(notificationId, {
      isRead: true,
      readAt: new Date(),
    })
  }

  /**
   * Mark multiple notifications as read/unread
   */
  async bulkUpdateNotifications(notificationIds: string[], isRead: boolean) {
    const where: Record<string, unknown> = {
      id: { in: notificationIds },
      cabinetId: this.cabinetId,
    }

    // Optionally filter by userId for additional security
    if (this.userId) {
      where.userId = this.userId
    }

    const updateData: Record<string, unknown> = { isRead }
    if (isRead) {
      updateData.readAt = new Date()
    }

    const { count } = await this.prisma.notification.updateMany({
      where,
      data: updateData,
    })

    return { success: true, updated: count }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead() {
    const where: Record<string, unknown> = {
      cabinetId: this.cabinetId,
      isRead: false,
    }

    if (this.userId) {
      where.userId = this.userId
    }

    const { count } = await this.prisma.notification.updateMany({
      where,
      data: {
        isRead: true,
        readAt: new Date(),
      },
    })

    return { success: true, updated: count }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string) {
    const { count } = await this.prisma.notification.deleteMany({
      where: {
        id: notificationId,
        cabinetId: this.cabinetId,
      },
    })

    if (count === 0) {
      throw new Error('Notification not found or access denied')
    }

    return { success: true }
  }

  /**
   * Delete multiple notifications
   */
  async bulkDeleteNotifications(notificationIds: string[]) {
    const where: Record<string, unknown> = {
      id: { in: notificationIds },
      cabinetId: this.cabinetId,
    }

    // Optionally filter by userId for additional security
    if (this.userId) {
      where.userId = this.userId
    }

    const { count } = await this.prisma.notification.deleteMany({
      where,
    })

    return { success: true, deleted: count }
  }

  /**
   * Get unread count
   */
  async getUnreadCount() {
    const where: Record<string, unknown> = {
      cabinetId: this.cabinetId,
      isRead: false,
    }

    if (this.userId) {
      where.userId = this.userId
    }

    return this.prisma.notification.count({ where })
  }

  /**
   * Get total count with filters
   */
  async getCount(filters?: NotificationFilters) {
    const where: Record<string, unknown> = {
      cabinetId: this.cabinetId,
    }

    if (filters?.userId) {
      where.userId = filters.userId
    } else if (this.userId) {
      where.userId = this.userId
    }

    if (filters?.isRead !== undefined) {
      where.isRead = filters.isRead
    }

    if (filters?.type) {
      where.type = filters.type
    }

    if (filters?.clientId) {
      where.clientId = filters.clientId
    }

    if (filters?.createdAfter || filters?.createdBefore) {
      const createdAt: Record<string, Date> = {}
      if (filters.createdAfter) {
        createdAt.gte = new Date(filters.createdAfter)
      }
      if (filters.createdBefore) {
        createdAt.lte = new Date(filters.createdBefore)
      }
      where.createdAt = createdAt
    }

    return this.prisma.notification.count({ where })
  }

  /**
   * Send email notification (placeholder - requires email service)
   */
  async sendEmailNotification(
    type: keyof typeof EMAIL_TEMPLATES,
    data: PlanChangedData | QuotaWarningData | QuotaExceededData,
    recipients: string[]
  ) {
    const template = EMAIL_TEMPLATES[type]

    if (!template) {
      throw new Error(`Email template not found for type: ${type}`)
    }

    const emailData = {
      to: recipients,
      subject: template.subject(data as never),
      html: template.body(data as never),
    }

    // Envoi via EmailAdvancedService si un userId est configuré
    try {
      if (this.userId) {
        const emailService = new EmailAdvancedService(this.cabinetId, this.userId, this.isSuperAdmin)
        await emailService.sendEmail({
          to: recipients,
          subject: emailData.subject,
          body: emailData.html,
        })
        logger.info('Email notification sent', { module: 'Notification', action: 'SEND_EMAIL', metadata: { type, recipientCount: recipients.length } } as any)
      } else {
        logger.warn('Email notification skipped — no userId configured for sending', { module: 'Notification', action: 'SEND_EMAIL', metadata: { type } } as any)
      }
    } catch (emailError: any) {
      // Ne pas bloquer la notification in-app si l'envoi email échoue
      logger.error('Email notification failed — falling back to in-app only', { module: 'Notification', action: 'SEND_EMAIL', metadata: { type, error: emailError.message } } as any)
    }

    return emailData
  }

  /**
   * Notify about important email
   */
  async notifyImportantEmail(emailData: {
    from: string
    subject: string
    emailId: string
    userId: string
  }) {
    return this.createNotification({
      userId: emailData.userId,
      type: 'MESSAGE_CLIENT',
      title: 'Nouvel email important',
      message: `De: ${emailData.from}\nSujet: ${emailData.subject}`,
      actionUrl: `/emails/${emailData.emailId}`,
    })
  }

  /**
   * Notify about task due
   */
  async notifyTaskDue(taskData: {
    title: string
    dueDate: Date
    taskId: string
    userId: string
  }) {
    return this.createNotification({
      userId: taskData.userId,
      type: 'TACHE_ECHEANCE',
      title: 'Tâche à échéance',
      message: `La tâche "${taskData.title}" est due le ${taskData.dueDate.toLocaleDateString('fr-FR')}`,
      actionUrl: `/taches/${taskData.taskId}`,
    })
  }

  /**
   * Notify about appointment reminder
   */
  async notifyAppointmentReminder(appointmentData: {
    title: string
    startDate: Date
    appointmentId: string
    userId: string
  }) {
    return this.createNotification({
      userId: appointmentData.userId,
      type: 'RAPPEL_RDV',
      title: 'Rappel de rendez-vous',
      message: `Rendez-vous "${appointmentData.title}" le ${appointmentData.startDate.toLocaleDateString('fr-FR')} à ${appointmentData.startDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
      actionUrl: `/rendez-vous/${appointmentData.appointmentId}`,
    })
  }

  /**
   * Notify about KYC expiring
   */
  async notifyKYCExpiring(kycData: {
    clientName: string
    expiryDate: Date
    clientId: string
    userId: string
  }) {
    return this.createNotification({
      userId: kycData.userId,
      type: 'KYC_EXPIRATION',
      title: 'KYC à renouveler',
      message: `Le KYC de ${kycData.clientName} expire le ${kycData.expiryDate.toLocaleDateString('fr-FR')}`,
      actionUrl: `/clients/${kycData.clientId}/kyc`,
    })
  }

  /**
   * Notify about contract renewal
   */
  async notifyContractRenewal(contractData: {
    contractName: string
    renewalDate: Date
    contractId: string
    userId: string
  }) {
    return this.createNotification({
      userId: contractData.userId,
      type: 'RENOUVELLEMENT_CONTRAT',
      title: 'Contrat à renouveler',
      message: `Le contrat "${contractData.contractName}" doit être renouvelé le ${contractData.renewalDate.toLocaleDateString('fr-FR')}`,
      actionUrl: `/contrats/${contractData.contractId}`,
    })
  }

  /**
   * Notify about opportunity detected
   */
  async notifyOpportunityDetected(opportunityData: {
    title: string
    value: number
    clientName: string
    opportunityId: string
    userId: string
  }) {
    return this.createNotification({
      userId: opportunityData.userId,
      type: 'OPPORTUNITE_DETECTEE',
      title: 'Nouvelle opportunité détectée',
      message: `Opportunité "${opportunityData.title}" (${opportunityData.value}€) pour ${opportunityData.clientName}`,
      actionUrl: `/opportunites/${opportunityData.opportunityId}`,
    })
  }
}
