/**
 * API Route: /api/advisor/clients/[id]/alerts
 * Récupère les alertes spécifiques à un client
 */

import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { prisma } from '@/app/_common/lib/prisma'
import { logger } from '@/app/_common/lib/logger'
interface ClientAlert {
  id: string
  type: 'task' | 'kyc' | 'contract' | 'document' | 'opportunity'
  severity: 'urgent' | 'warning' | 'info'
  title: string
  description: string
  date: string
  clientId: string
  actionUrl?: string
}

/**
 * GET /api/advisor/clients/[id]/alerts
 * Returns all alerts related to a specific client
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { user, cabinetId } = context

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const { id: clientId } = await params
    const now = new Date()
    const soon = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 jours

    const alerts: ClientAlert[] = []

    // 1. Tâches en retard ou à venir pour ce client
    const overdueTasks = await prisma.tache.findMany({
      where: {
        cabinetId,
        clientId,
        status: { not: 'TERMINE' },
        dueDate: { lte: soon },
      },
      select: {
        id: true,
        title: true,
        dueDate: true,
        priority: true,
      },
      orderBy: { dueDate: 'asc' },
      take: 10,
    })

    overdueTasks.forEach((task) => {
      const isOverdue = task.dueDate && task.dueDate < now
      alerts.push({
        id: `task-${task.id}`,
        type: 'task',
        severity: isOverdue ? 'urgent' : 'warning',
        title: isOverdue ? 'Tâche en retard' : 'Tâche à venir',
        description: task.title,
        date: task.dueDate?.toISOString() || now.toISOString(),
        clientId,
        actionUrl: `/dashboard/taches/${task.id}`,
      })
    })

    // 2. KYC expirant bientôt
    const client = await prisma.client.findFirst({
      where: { id: clientId, cabinetId },
      select: {
        kycNextReviewDate: true,
        kycStatus: true,
      },
    })

    if (client?.kycNextReviewDate) {
      const kycDate = new Date(client.kycNextReviewDate)
      if (kycDate <= soon) {
        const isExpired = kycDate < now
        alerts.push({
          id: `kyc-${clientId}`,
          type: 'kyc',
          severity: isExpired ? 'urgent' : 'warning',
          title: isExpired ? 'KYC expiré' : 'KYC à renouveler',
          description: `Révision KYC ${isExpired ? 'était prévue' : 'prévue'} le ${kycDate.toLocaleDateString('fr-FR')}`,
          date: kycDate.toISOString(),
          clientId,
          actionUrl: `/dashboard/clients/${clientId}?tab=documents`,
        })
      }
    }

    // 3. Contrats à renouveler
    const contractsRenewing = await prisma.contrat.findMany({
      where: {
        cabinetId,
        clientId,
        nextRenewalDate: {
          gte: now,
          lte: soon,
        },
      },
      select: {
        id: true,
        name: true,
        nextRenewalDate: true,
      },
      take: 5,
    })

    contractsRenewing.forEach((contract) => {
      alerts.push({
        id: `contract-${contract.id}`,
        type: 'contract',
        severity: 'warning',
        title: 'Contrat à renouveler',
        description: `${contract.name} - Renouvellement le ${contract.nextRenewalDate?.toLocaleDateString('fr-FR')}`,
        date: contract.nextRenewalDate?.toISOString() || now.toISOString(),
        clientId,
        actionUrl: `/dashboard/clients/${clientId}?tab=contrats`,
      })
    })

    // 4. Documents manquants ou expirés
    const clientDocs = await prisma.clientDocument.findMany({
      where: { clientId },
      include: {
        document: {
          select: {
            id: true,
            name: true,
            type: true,
            uploadedAt: true,
          },
        },
      },
    })

    // Vérifier les documents KYC obligatoires manquants
    const requiredDocTypes = ['CNI', 'JUSTIF_DOMICILE', 'JUSTIF_REVENUS']
    const existingDocTypes = clientDocs.map((cd) => String(cd.document.type))
    
    requiredDocTypes.forEach((docType) => {
      if (!existingDocTypes.includes(docType)) {
        alerts.push({
          id: `doc-missing-${docType}`,
          type: 'document',
          severity: 'warning',
          title: 'Document manquant',
          description: `Document obligatoire manquant: ${docType}`,
          date: now.toISOString(),
          clientId,
          actionUrl: `/dashboard/clients/${clientId}?tab=documents`,
        })
      }
    })

    // 5. Opportunités détectées (si le client a des opportunités non traitées)
    const opportunities = await prisma.opportunite.findMany({
      where: {
        cabinetId,
        clientId,
        status: 'DETECTEE',
      },
      select: {
        id: true,
        name: true,
        type: true,
        createdAt: true,
      },
      take: 3,
    })

    opportunities.forEach((opp) => {
      alerts.push({
        id: `opportunity-${opp.id}`,
        type: 'opportunity',
        severity: 'info',
        title: 'Opportunité détectée',
        description: opp.name,
        date: opp.createdAt.toISOString(),
        clientId,
        actionUrl: `/dashboard/clients/${clientId}?tab=opportunites`,
      })
    })

    // Trier par sévérité puis par date
    const severityOrder = { urgent: 0, warning: 1, info: 2 }
    alerts.sort((a, b) => {
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity]
      if (severityDiff !== 0) return severityDiff
      return new Date(a.date).getTime() - new Date(b.date).getTime()
    })

    return createSuccessResponse({
      alerts,
      summary: {
        total: alerts.length,
        urgent: alerts.filter((a) => a.severity === 'urgent').length,
        warning: alerts.filter((a) => a.severity === 'warning').length,
        info: alerts.filter((a) => a.severity === 'info').length,
      },
    })
  } catch (error) {
    logger.error('Get client alerts error:', { error: error instanceof Error ? error.message : String(error) })

    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }

    return createErrorResponse('Internal server error', 500)
  }
}
