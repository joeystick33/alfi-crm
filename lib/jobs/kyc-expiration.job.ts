// FILE: lib/jobs/kyc-expiration.job.ts

import { prisma } from '@/lib/prisma'

// ===========================================
// KYC EXPIRATION JOB
// ===========================================

export interface KYCExpirationJobResult {
  success: boolean
  message: string
  stats: {
    expiredDocuments: number
    remindersSent: number
    clientsNotified: number
  }
  executionTime: number
}

/**
 * Job CRON pour gérer les expirations KYC
 * - Marque les documents expirés
 * - Envoie des rappels pour les documents expirant bientôt
 * - Met à jour le statut KYC des clients
 * 
 * Exécuté quotidiennement à 6h du matin
 */
export async function runKYCExpirationJob(): Promise<KYCExpirationJobResult> {
  const startTime = Date.now()
  
  console.log('🚀 Starting KYC Expiration Job...')

  let expiredDocuments = 0
  let remindersSent = 0
  let clientsNotified = 0

  try {
    const now = new Date()
    const in30Days = new Date()
    in30Days.setDate(in30Days.getDate() + 30)

    // 1. Marquer les documents expirés
    const expiredResult = await prisma.kYCDocument.updateMany({
      where: {
        expiresAt: { lt: now },
        status: { not: 'EXPIRE' },
      },
      data: {
        status: 'EXPIRE',
      },
    })
    expiredDocuments = expiredResult.count

    console.log(`📋 Expired documents marked: ${expiredDocuments}`)

    // 2. Envoyer des rappels pour documents expirant dans 30 jours
    const expiringDocuments = await prisma.kYCDocument.findMany({
      where: {
        expiresAt: {
          gte: now,
          lte: in30Days,
        },
        status: 'VALIDE',
        reminderSentAt: null,
      },
      include: {
        client: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            cabinetId: true,
          },
        },
      },
    })

    // Marquer les rappels comme envoyés
    for (const doc of expiringDocuments) {
      await prisma.kYCDocument.update({
        where: { id: doc.id },
        data: { reminderSentAt: now },
      })

      // Créer une notification pour le conseiller
      if (doc.client) {
        await prisma.notification.create({
          data: {
            cabinetId: doc.client.cabinetId,
            clientId: doc.client.id,
            type: 'KYC_EXPIRATION',
            title: 'Document KYC bientôt expiré',
            message: `Le document KYC de ${doc.client.firstName} ${doc.client.lastName} expire bientôt.`,
            actionUrl: `/dashboard/clients/${doc.client.id}/kyc`,
          },
        })
        clientsNotified++
      }

      remindersSent++
    }

    console.log(`📧 Reminders sent: ${remindersSent}`)
    console.log(`🔔 Clients notified: ${clientsNotified}`)

    // 3. Mettre à jour le statut KYC des clients avec documents expirés
    const clientsWithExpiredDocs = await prisma.kYCDocument.findMany({
      where: {
        status: 'EXPIRE',
      },
      select: {
        clientId: true,
      },
      distinct: ['clientId'],
    })

    for (const { clientId } of clientsWithExpiredDocs) {
      await prisma.client.update({
        where: { id: clientId },
        data: { kycStatus: 'EXPIRE' },
      })
    }

    const executionTime = Date.now() - startTime

    console.log(`✅ KYC Expiration Job completed in ${executionTime}ms`)

    return {
      success: true,
      message: `Job completed. ${expiredDocuments} documents expired, ${remindersSent} reminders sent.`,
      stats: {
        expiredDocuments,
        remindersSent,
        clientsNotified,
      },
      executionTime,
    }
  } catch (error) {
    const executionTime = Date.now() - startTime

    console.error('❌ KYC Expiration Job failed:', error)

    return {
      success: false,
      message: `Job failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      stats: {
        expiredDocuments,
        remindersSent,
        clientsNotified,
      },
      executionTime,
    }
  }
}
