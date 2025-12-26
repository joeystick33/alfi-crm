// FILE: lib/queues/workers/email.worker.ts

import { Worker, Job } from 'bullmq'
import { QUEUE_NAMES } from '../index'
import { EmailSendJobData, EmailCampaignJobData, JobResult } from '../types'
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
// EMAIL SEND WORKER
// ===========================================

export const emailSendWorker = new Worker<EmailSendJobData, JobResult>(
  QUEUE_NAMES.EMAIL_SEND,
  async (job: Job<EmailSendJobData>) => {
    const { to, subject, html, text, from, replyTo, cabinetId, userId, clientId, messageId, attachments } = job.data

    console.log(`[Worker] Processing email send job: ${job.id}`, { to, subject })

    try {
      await job.updateProgress({ percentage: 10, stage: 'Preparing email...' })

      // Récupérer la configuration SMTP du cabinet
      const cabinet = await prisma.cabinet.findUnique({
        where: { id: cabinetId },
        select: {
          name: true,
          email: true,
          settings: true,
        },
      })

      if (!cabinet) {
        throw new Error(`Cabinet not found: ${cabinetId}`)
      }

      await job.updateProgress({ percentage: 30, stage: 'Sending email...' })

      // Envoyer l'email via le provider configuré
      const result = await sendEmailViaProvider({
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        text,
        from: from || cabinet.email || process.env.EMAIL_FROM,
        replyTo: replyTo || cabinet.email,
        attachments,
      })

      await job.updateProgress({ percentage: 80, stage: 'Logging...' })

      // Créer un enregistrement EmailMessage si messageId fourni
      if (messageId) {
        await prisma.emailMessage.update({
          where: { id: messageId },
          data: {
            status: 'ENVOYE',
            sentAt: new Date(),
            providerMessageId: result.messageId,
            providerResponse: result.response as never,
          },
        })
      }

      await job.updateProgress({ percentage: 100, stage: 'Completed' })

      return {
        success: true,
        message: `Email sent to ${Array.isArray(to) ? to.join(', ') : to}`,
        data: { messageId: result.messageId },
        stats: { processed: 1, succeeded: 1, failed: 0, skipped: 0 },
      }
    } catch (error) {
      console.error(`[Worker] Email send job failed: ${job.id}`, error)

      // Mettre à jour le status en erreur si messageId fourni
      if (messageId) {
        await prisma.emailMessage.update({
          where: { id: messageId },
          data: {
            status: 'ECHOUE',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
          },
        })
      }

      throw error
    }
  },
  {
    connection,
    concurrency: 5,
    limiter: {
      max: 100,
      duration: 60000, // 100 emails par minute max
    },
  }
)

// ===========================================
// EMAIL CAMPAIGN WORKER
// ===========================================

export const emailCampaignWorker = new Worker<EmailCampaignJobData, JobResult>(
  QUEUE_NAMES.EMAIL_CAMPAIGN,
  async (job: Job<EmailCampaignJobData>) => {
    const { campaignId, cabinetId, action, recipientIds, batchSize = 50, batchIndex = 0 } = job.data

    console.log(`[Worker] Processing email campaign job: ${job.id}`, { campaignId, action })

    try {
      // Récupérer la campagne
      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
        include: {
          recipients: {
            include: {
              client: {
                select: { id: true, email: true, firstName: true, lastName: true },
              },
            },
          },
        },
      })

      if (!campaign) {
        throw new Error(`Campaign not found: ${campaignId}`)
      }

      let result: JobResult

      switch (action) {
        case 'send':
          result = await processCampaignSend(campaign, batchSize, batchIndex, job)
          break

        case 'schedule':
          await prisma.campaign.update({
            where: { id: campaignId },
            data: { status: 'PLANIFIEE' },
          })
          result = {
            success: true,
            message: `Campaign ${campaignId} scheduled`,
            stats: { processed: 1, succeeded: 1, failed: 0, skipped: 0 },
          }
          break

        case 'pause':
          await prisma.campaign.update({
            where: { id: campaignId },
            data: { status: 'EN_PAUSE' },
          })
          result = {
            success: true,
            message: `Campaign ${campaignId} paused`,
            stats: { processed: 1, succeeded: 1, failed: 0, skipped: 0 },
          }
          break

        case 'resume':
          await prisma.campaign.update({
            where: { id: campaignId },
            data: { status: 'EN_COURS' },
          })
          result = {
            success: true,
            message: `Campaign ${campaignId} resumed`,
            stats: { processed: 1, succeeded: 1, failed: 0, skipped: 0 },
          }
          break

        case 'complete':
          await prisma.campaign.update({
            where: { id: campaignId },
            data: {
              status: 'TERMINEE',
              completedAt: new Date(),
            },
          })
          result = {
            success: true,
            message: `Campaign ${campaignId} completed`,
            stats: { processed: 1, succeeded: 1, failed: 0, skipped: 0 },
          }
          break

        default:
          throw new Error(`Unknown campaign action: ${action}`)
      }

      return result
    } catch (error) {
      console.error(`[Worker] Email campaign job failed: ${job.id}`, error)
      throw error
    }
  },
  {
    connection,
    concurrency: 2,
  }
)

// ===========================================
// HELPERS
// ===========================================

interface EmailProviderResult {
  messageId: string
  response: Record<string, unknown>
}

async function sendEmailViaProvider(options: {
  to: string[]
  subject: string
  html: string
  text?: string
  from?: string
  replyTo?: string
  attachments?: Array<{
    filename: string
    content: string | Buffer
    contentType?: string
  }>
}): Promise<EmailProviderResult> {
  // Utiliser le provider configuré (Resend, SendGrid, Nodemailer, etc.)
  const provider = process.env.EMAIL_PROVIDER || 'console'

  switch (provider) {
    case 'resend':
      return sendViaResend(options)
    case 'sendgrid':
      return sendViaSendGrid(options)
    case 'smtp':
      return sendViaSMTP(options)
    case 'console':
    default:
      // Mode développement - log seulement
      console.log('[Email] Would send:', {
        to: options.to,
        subject: options.subject,
        from: options.from,
      })
      return {
        messageId: `dev-${Date.now()}`,
        response: { provider: 'console', logged: true },
      }
  }
}

async function sendViaResend(options: {
  to: string[]
  subject: string
  html: string
  from?: string
  replyTo?: string
}): Promise<EmailProviderResult> {
  try {
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)

    const result = await resend.emails.send({
      from: options.from || process.env.EMAIL_FROM || 'Aura CRM <noreply@aura-crm.com>',
      to: options.to,
      subject: options.subject,
      html: options.html,
      replyTo: options.replyTo,
    })

    if (result.error) {
      throw new Error(result.error.message)
    }

    return {
      messageId: result.data?.id || '',
      response: { provider: 'resend', data: result.data },
    }
  } catch (error) {
    console.error('[Email Worker] Resend package not available or error:', error)
    throw new Error('Resend email provider not configured. Please install resend package.')
  }
}

async function sendViaSendGrid(options: {
  to: string[]
  subject: string
  html: string
  from?: string
}): Promise<EmailProviderResult> {
  try {
    const sgMail = await import('@sendgrid/mail')
    sgMail.default.setApiKey(process.env.SENDGRID_API_KEY || '')

    const result = await sgMail.default.send({
      to: options.to,
      from: options.from || process.env.EMAIL_FROM || 'noreply@aura-crm.com',
      subject: options.subject,
      html: options.html,
    })

    return {
      messageId: result[0].headers['x-message-id'] || '',
      response: { provider: 'sendgrid', statusCode: result[0].statusCode },
    }
  } catch (error) {
    console.error('[Email Worker] SendGrid package not available or error:', error)
    throw new Error('SendGrid email provider not configured. Please install @sendgrid/mail package.')
  }
}

async function sendViaSMTP(options: {
  to: string[]
  subject: string
  html: string
  text?: string
  from?: string
  attachments?: Array<{
    filename: string
    content: string | Buffer
    contentType?: string
  }>
}): Promise<EmailProviderResult> {
  try {
    const nodemailer = await import('nodemailer')

    const transporter = nodemailer.default.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    const result = await transporter.sendMail({
      from: options.from || process.env.EMAIL_FROM,
      to: options.to.join(', '),
      subject: options.subject,
      html: options.html,
      text: options.text,
      attachments: options.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
        contentType: a.contentType,
      })),
    })

    return {
      messageId: result.messageId,
      response: { provider: 'smtp', accepted: result.accepted },
    }
  } catch (error) {
    console.error('[Email Worker] Nodemailer package not available or error:', error)
    throw new Error('SMTP email provider not configured. Please install nodemailer package.')
  }
}

async function processCampaignSend(
  campaign: {
    id: string
    cabinetId: string
    subject: string
    htmlContent: string
    recipients: Array<{
      id: string
      client: { id: string; email: string | null; firstName: string; lastName: string } | null
    }>
  },
  batchSize: number,
  batchIndex: number,
  job: Job
): Promise<JobResult> {
  const recipients = campaign.recipients.slice(
    batchIndex * batchSize,
    (batchIndex + 1) * batchSize
  )

  let succeeded = 0
  let failed = 0
  let skipped = 0

  for (let i = 0; i < recipients.length; i++) {
    const recipient = recipients[i]
    
    await job.updateProgress({
      percentage: Math.round((i / recipients.length) * 100),
      stage: `Sending ${i + 1}/${recipients.length}...`,
      currentItem: i + 1,
      totalItems: recipients.length,
    })

    if (!recipient.client?.email) {
      skipped++
      continue
    }

    try {
      // Personnaliser le contenu
      const personalizedHtml = campaign.htmlContent
        .replace(/{{firstName}}/g, recipient.client.firstName)
        .replace(/{{lastName}}/g, recipient.client.lastName)

      // Créer le message
      const message = await prisma.emailMessage.create({
        data: {
          cabinetId: campaign.cabinetId,
          campaignId: campaign.id,
          clientId: recipient.client.id,
          to: recipient.client.email,
          subject: campaign.subject,
          htmlContent: personalizedHtml,
          status: 'EN_ATTENTE',
        },
      })

      // Envoyer via la queue
      const { emailSendQueue } = await import('../index')
      await emailSendQueue.add(`campaign-${campaign.id}-${recipient.id}`, {
        to: recipient.client.email,
        subject: campaign.subject,
        html: personalizedHtml,
        cabinetId: campaign.cabinetId,
        clientId: recipient.client.id,
        messageId: message.id,
      })

      succeeded++
    } catch (error) {
      console.error(`Failed to queue email for recipient ${recipient.id}:`, error)
      failed++
    }
  }

  // Si il reste des destinataires, créer un nouveau job pour le batch suivant
  const totalRecipients = campaign.recipients.length
  const processedSoFar = (batchIndex + 1) * batchSize

  if (processedSoFar < totalRecipients) {
    const { emailCampaignQueue } = await import('../index')
    await emailCampaignQueue.add(`campaign-${campaign.id}-batch-${batchIndex + 1}`, {
      campaignId: campaign.id,
      cabinetId: campaign.cabinetId,
      action: 'send',
      batchSize,
      batchIndex: batchIndex + 1,
    })
  } else {
    // Tous les batches traités, marquer comme terminée
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: {
        status: 'TERMINEE',
        completedAt: new Date(),
      },
    })
  }

  return {
    success: true,
    message: `Batch ${batchIndex + 1} processed`,
    stats: {
      processed: recipients.length,
      succeeded,
      failed,
      skipped,
    },
  }
}

// ===========================================
// EVENT HANDLERS
// ===========================================

emailSendWorker.on('completed', (job) => {
  console.log(`[Worker] Email send ${job.id} completed`)
})

emailSendWorker.on('failed', (job, err) => {
  console.error(`[Worker] Email send ${job?.id} failed:`, err.message)
})

emailCampaignWorker.on('completed', (job) => {
  console.log(`[Worker] Email campaign ${job.id} completed`)
})

emailCampaignWorker.on('failed', (job, err) => {
  console.error(`[Worker] Email campaign ${job?.id} failed:`, err.message)
})

// ===========================================
// EXPORTS
// ===========================================

export default {
  emailSendWorker,
  emailCampaignWorker,
}
