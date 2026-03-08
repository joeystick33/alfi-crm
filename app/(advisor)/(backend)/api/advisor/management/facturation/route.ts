import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { getPrismaClient } from '@/app/_common/lib/prisma'
import { logger } from '@/app/_common/lib/logger'
/**
 * GET /api/advisor/management/facturation
 * Récupère la facturation globale du cabinet et par conseiller
 * Accessible uniquement par les ADMIN
 */
export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    const { user } = context

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    if (user.role !== 'ADMIN') {
      return createErrorResponse('Permission denied: Réservé aux administrateurs', 403)
    }

    const prisma = getPrismaClient(context.cabinetId, context.isSuperAdmin)

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'month'
    const statusFilter = searchParams.get('status')
    const conseillerId = searchParams.get('conseillerId')

    const now = new Date()
    let startDate: Date

    switch (period) {
      case 'quarter':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1)
        break
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      case 'month':
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    }

    // Build where clause for invoices
    const whereClause: { cabinetId: string; issueDate: { gte: Date }; status?: any; conseillerId?: string } = {
      cabinetId: context.cabinetId,
      issueDate: { gte: startDate },
    }

    if (statusFilter && statusFilter !== 'all') {
      whereClause.status = statusFilter
    }

    if (conseillerId) {
      whereClause.conseillerId = conseillerId
    }

    // Get invoices
    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        },
        conseiller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        }
      },
      orderBy: { issueDate: 'desc' },
      take: 100,
    })

    // Calculate stats
    const allInvoices = await prisma.invoice.findMany({
      where: {
        cabinetId: context.cabinetId,
        issueDate: { gte: startDate },
      },
      include: {
        conseiller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        }
      }
    })

    const totalCA = allInvoices.reduce((sum: number, inv: { amountTTC?: { toNumber: () => number } }) =>
      sum + (inv.amountTTC?.toNumber() || 0), 0)

    const paidAmount = allInvoices
      .filter((inv: { status: string }) => inv.status === 'PAYEE')
      .reduce((sum: number, inv: { amountTTC?: { toNumber: () => number } }) => sum + (inv.amountTTC?.toNumber() || 0), 0)

    const pendingAmount = allInvoices
      .filter((inv: { status: string }) => inv.status === 'ENVOYEE' || inv.status === 'BROUILLON')
      .reduce((sum: number, inv: { amountTTC?: { toNumber: () => number } }) => sum + (inv.amountTTC?.toNumber() || 0), 0)

    const overdueAmount = allInvoices
      .filter((inv: { status: string }) => inv.status === 'EN_RETARD')
      .reduce((sum: number, inv: { amountTTC?: { toNumber: () => number } }) => sum + (inv.amountTTC?.toNumber() || 0), 0)

    // Group by conseiller
    const conseillerMap = new Map<string, {
      id: string
      name: string
      totalCA: number
      paid: number
      pending: number
      count: number
    }>()

    allInvoices.forEach((inv: { conseiller?: { id: string; firstName: string; lastName: string }; amountTTC?: { toNumber: () => number }; status: string }) => {
      if (inv.conseiller) {
        const key = inv.conseiller.id
        const existing = conseillerMap.get(key) || {
          id: inv.conseiller.id,
          name: `${inv.conseiller.firstName} ${inv.conseiller.lastName}`,
          totalCA: 0,
          paid: 0,
          pending: 0,
          count: 0,
        }

        existing.totalCA += inv.amountTTC?.toNumber() || 0
        existing.count += 1

        if (inv.status === 'PAYEE') {
          existing.paid += inv.amountTTC?.toNumber() || 0
        } else {
          existing.pending += inv.amountTTC?.toNumber() || 0
        }

        conseillerMap.set(key, existing)
      }
    })

    const facturationParConseiller = Array.from(conseillerMap.values())
      .sort((a, b) => b.totalCA - a.totalCA)

    return createSuccessResponse({
      period,
      stats: {
        totalCA,
        paidAmount,
        pendingAmount,
        overdueAmount,
        invoiceCount: allInvoices.length,
        paidCount: allInvoices.filter((inv: { status: string }) => inv.status === 'PAYEE').length,
        pendingCount: allInvoices.filter((inv: { status: string }) => inv.status !== 'PAYEE').length,
      },
      invoices: invoices.map((inv: any) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        client: inv.client ? `${inv.client.firstName} ${inv.client.lastName}` : null,
        clientId: inv.client?.id,
        conseiller: inv.conseiller ? `${inv.conseiller.firstName} ${inv.conseiller.lastName}` : null,
        conseillerId: inv.conseiller?.id,
        amountHT: inv.amountHT?.toNumber() || 0,
        amountTTC: inv.amountTTC?.toNumber() || 0,
        status: inv.status,
        issueDate: inv.issueDate,
        dueDate: inv.dueDate,
        paidDate: inv.paidDate,
      })),
      facturationParConseiller,
    })
  } catch (error) {
    logger.error('Error in GET /api/advisor/management/facturation:', { error: error instanceof Error ? error.message : String(error) })

    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }

    return createErrorResponse('Internal server error', 500)
  }
}
