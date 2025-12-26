// FILE: lib/queues/workers/notification.worker.ts

import { Worker, Job } from 'bullmq'
import { QUEUE_NAMES } from '../index'
import { NotificationSendJobData, NotificationEmailJobData, JobResult } from '../types'
import { prisma } from '@/lib/prisma'

// ===========================================
// CONFIGURATION
// ===========================================

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD,
}

// ===========================================
// NOTIFICATION SEND WORKER
// ===========================================

export const notificationSendWorker = new Worker<NotificationSendJobData, JobResult>(
  QUEUE_NAMES.NOTIFICATION_SEND,
  async (job: Job<NotificationSendJobData>) => {
    const { cabinetId, userId, clientId, type, title, message, actionUrl, channels, metadata } = job.data

    console.log(`[Worker] Processing notification job: ${job.id}`, { type, title })

    try {
      const results = {
        app: false,
        email: false,
        push: false,
      }

      const targetChannels = channels || ['app']

      // 1. Notification in-app (toujours créée)
      if (targetChannels.includes('app')) {
        await prisma.notification.create({
          data: {
            cabinetId,
            userId,
            clientId,
            type: type as never,
            title,
            message,
            actionUrl,
          },
        })
        results.app = true
      }

      // 2. Email notification
      if (targetChannels.includes('email') && userId) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { email: true, firstName: true },
        })

        if (user?.email) {
          // Ajouter à la queue d'envoi d'email
          const { emailSendQueue } = await import('../index')
          await emailSendQueue.add('notification-email', {
            to: user.email,
            subject: title,
            html: generateNotificationEmailHtml(title, message, actionUrl, user.firstName),
            cabinetId,
            userId,
            clientId,
          })
          results.email = true
        }
      }

      // 3. Push notification (placeholder pour future implémentation)
      if (targetChannels.includes('push')) {
        // TODO: Implémenter les push notifications (Firebase, OneSignal, etc.)
        console.log('[Worker] Push notifications not yet implemented')
        results.push = false
      }

      return {
        success: true,
        message: `Notification sent via: ${Object.entries(results)
          .filter(([, v]) => v)
          .map(([k]) => k)
          .join(', ')}`,
        data: { results },
        stats: { processed: 1, succeeded: 1, failed: 0, skipped: 0 },
      }
    } catch (error) {
      console.error(`[Worker] Notification job failed: ${job.id}`, error)
      throw error
    }
  },
  {
    connection,
    concurrency: 10,
  }
)

// ===========================================
// EMAIL NOTIFICATION WORKER
// ===========================================

export const notificationEmailWorker = new Worker<NotificationEmailJobData, JobResult>(
  QUEUE_NAMES.NOTIFICATION_EMAIL,
  async (job: Job<NotificationEmailJobData>) => {
    const { to, subject, template, variables, cabinetId } = job.data

    console.log(`[Worker] Processing email notification job: ${job.id}`, { to, subject })

    try {
      // Charger le template et remplacer les variables
      const htmlContent = await renderEmailTemplate(template, variables)

      // Envoyer l'email via le service d'email
      const { emailSendQueue } = await import('../index')
      await emailSendQueue.add('template-email', {
        to,
        subject,
        html: htmlContent,
        cabinetId,
      })

      return {
        success: true,
        message: `Email queued for ${to}`,
        stats: { processed: 1, succeeded: 1, failed: 0, skipped: 0 },
      }
    } catch (error) {
      console.error(`[Worker] Email notification job failed: ${job.id}`, error)
      throw error
    }
  },
  {
    connection,
    concurrency: 5,
  }
)

// ===========================================
// HELPERS
// ===========================================

function generateNotificationEmailHtml(
  title: string,
  message: string,
  actionUrl?: string,
  firstName?: string
): string {
  const greeting = firstName ? `Bonjour ${firstName},` : 'Bonjour,'
  const actionButton = actionUrl
    ? `<p style="margin-top: 20px;">
        <a href="${process.env.NEXTAUTH_URL}${actionUrl}" 
           style="background-color: #7373FF; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 6px; display: inline-block;">
          Voir les détails
        </a>
      </p>`
    : ''

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                 line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #f9fafb; border-radius: 8px; padding: 30px;">
        <h1 style="color: #7373FF; margin-top: 0; font-size: 24px;">${title}</h1>
        <p>${greeting}</p>
        <p style="color: #666;">${message}</p>
        ${actionButton}
      </div>
      <p style="color: #999; font-size: 12px; margin-top: 30px; text-align: center;">
        Cet email a été envoyé automatiquement par Aura CRM.
      </p>
    </body>
    </html>
  `
}

async function renderEmailTemplate(
  template: string,
  variables: Record<string, unknown>
): Promise<string> {
  // Charger le template depuis la base de données ou les fichiers
  const emailTemplate = await prisma.emailTemplate.findFirst({
    where: { name: template, isActive: true },
  })

  if (!emailTemplate) {
    throw new Error(`Email template not found: ${template}`)
  }

  // Remplacer les variables
  let html = emailTemplate.htmlContent
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
    html = html.replace(regex, String(value))
  }

  return html
}

// ===========================================
// EVENT HANDLERS
// ===========================================

notificationSendWorker.on('completed', (job) => {
  console.log(`[Worker] Notification job ${job.id} completed`)
})

notificationSendWorker.on('failed', (job, err) => {
  console.error(`[Worker] Notification job ${job?.id} failed:`, err.message)
})

notificationEmailWorker.on('completed', (job) => {
  console.log(`[Worker] Email notification ${job.id} completed`)
})

notificationEmailWorker.on('failed', (job, err) => {
  console.error(`[Worker] Email notification ${job?.id} failed:`, err.message)
})

// ===========================================
// EXPORTS
// ===========================================

export default {
  notificationSendWorker,
  notificationEmailWorker,
}
