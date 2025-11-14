import { getPrismaClient, setRLSContext } from '@/lib/prisma'
import { NotificationType } from '@prisma/client'

// Email templates for notifications
const EMAIL_TEMPLATES = {
  PLAN_CHANGED: {
    subject: (data: any) => `Votre plan a été modifié - ${data.newPlan}`,
    body: (data: any) => `
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
    subject: (data: any) => `Attention: Quota ${data.quotaName} bientôt atteint`,
    body: (data: any) => `
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
    subject: (data: any) => `Quota ${data.quotaName} dépassé`,
    body: (data: any) => `
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
}

/**
 * Notification Service
 * Handles in-app and email notifications
 */
export class NotificationService {
  private prisma

  constructor(
    private cabinetId: string,
    private userId?: string,
    private isSuperAdmin: boolean = false
  ) {
    this.prisma = getPrismaClient(cabinetId, isSuperAdmin)
  }

  /**
   * Create in-app notification
   */
  async createNotification(data: {
    userId?: string
    clientId?: string
    type: NotificationType
    title: string
    message: string
    actionUrl?: string
  }) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    return this.prisma.notification.create({
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
    })
  }

  /**
   * Get notifications for current user
   */
  async getNotifications(filters?: {
    unreadOnly?: boolean
    type?: NotificationType
    limit?: number
    offset?: number
  }) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const where: any = {}

    if (this.userId) {
      where.userId = this.userId
    }

    if (filters?.unreadOnly) {
      where.isRead = false
    }

    if (filters?.type) {
      where.type = filters.type
    }

    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
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
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({
        where: { ...where, isRead: false },
      }),
    ])

    return { notifications, total, unreadCount }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    })
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead() {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const where: any = { isRead: false }

    if (this.userId) {
      where.userId = this.userId
    }

    return this.prisma.notification.updateMany({
      where,
      data: {
        isRead: true,
        readAt: new Date(),
      },
    })
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    return this.prisma.notification.delete({
      where: { id: notificationId },
    })
  }

  /**
   * Get unread count
   */
  async getUnreadCount() {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const where: any = { isRead: false }

    if (this.userId) {
      where.userId = this.userId
    }

    return this.prisma.notification.count({ where })
  }

  /**
   * Send email notification (placeholder - requires email service)
   */
  async sendEmailNotification(type: string, data: any, recipients: string[]) {
    const template = EMAIL_TEMPLATES[type as keyof typeof EMAIL_TEMPLATES]

    if (!template) {
      throw new Error(`Email template not found for type: ${type}`)
    }

    const emailData = {
      to: recipients,
      subject: template.subject(data),
      html: template.body(data),
    }

    // TODO: Integrate with email sending service
    console.log('Email notification to send:', emailData)

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
      type: 'CLIENT_MESSAGE',
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
      type: 'TASK_DUE',
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
      type: 'APPOINTMENT_REMINDER',
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
      type: 'KYC_EXPIRING',
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
      type: 'CONTRACT_RENEWAL',
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
      type: 'OPPORTUNITY_DETECTED',
      title: 'Nouvelle opportunité détectée',
      message: `Opportunité "${opportunityData.title}" (${opportunityData.value}€) pour ${opportunityData.clientName}`,
      actionUrl: `/opportunites/${opportunityData.opportunityId}`,
    })
  }
}
