import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { getPrismaClient } from '@/app/_common/lib/prisma'
import { logger } from '@/app/_common/lib/logger'
import { InvoiceStatus } from '@prisma/client'
/**
 * GET /api/advisor/ma-facturation
 * Récupère les factures personnelles du conseiller connecté
 */
export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    const { user } = context

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const prisma = getPrismaClient(context.cabinetId, context.isSuperAdmin)
    const userId = user.id

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'month'
    const status = searchParams.get('status')

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

    // Build where clause

    const whereClause: any = {
      conseillerId: userId,
      issueDate: { gte: startDate },
    }

    if (status && status !== 'all') {
      whereClause.status = status
    }

    // Get user's invoices
    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        }
      },
      orderBy: { issueDate: 'desc' },
    })

    // Get all invoices for stats
    const allInvoices = await prisma.invoice.findMany({
      where: {
        conseillerId: userId,
        issueDate: { gte: startDate },
      }
    })

    // Calculate stats
    const totalCA = allInvoices.reduce((sum: number, inv) =>
      sum + (Number(inv.amountTTC) || 0), 0)

    const totalPaye = allInvoices
      .filter((inv) => inv.status === 'PAYEE')
      .reduce((sum: number, inv) => sum + (Number(inv.amountTTC) || 0), 0)

    const totalEnAttente = allInvoices
      .filter((inv) => inv.status !== 'PAYEE' && inv.status !== 'ANNULEE')
      .reduce((sum: number, inv) => sum + (Number(inv.amountTTC) || 0), 0)

    return createSuccessResponse({
      period,
      stats: {
        totalCA,
        totalPaye,
        totalEnAttente,
        nbFactures: allInvoices.length,
        nbPayees: allInvoices.filter((inv) => inv.status === 'PAYEE').length,
        nbEnAttente: allInvoices.filter((inv) => inv.status !== 'PAYEE' && inv.status !== 'ANNULEE').length,
      },
      factures: invoices.map((inv) => ({
        id: inv.id,
        numero: inv.invoiceNumber,
        type: 'HONORAIRES',
        montant: inv.amountTTC?.toNumber() || 0,
        status: inv.status,
        client: inv.client ? {
          id: inv.client.id,
          firstName: inv.client.firstName,
          lastName: inv.client.lastName,
        } : null,
        description: inv.description || '',
        dateCreation: inv.createdAt?.toISOString().split('T')[0],
        dateSoumission: inv.issueDate?.toISOString().split('T')[0],
        datePaiement: inv.paidDate?.toISOString().split('T')[0] || null,
      })),
    })
  } catch (error) {
    logger.error('Error in GET /api/advisor/ma-facturation:', { error: error instanceof Error ? error.message : String(error) })

    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }

    return createErrorResponse('Internal server error', 500)
  }
}

/**
 * POST /api/advisor/ma-facturation
 * Créer une nouvelle facture personnelle
 */
export async function POST(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    const { user } = context

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const prisma = getPrismaClient(context.cabinetId, context.isSuperAdmin)
    const body = await request.json()

    const { type, clientId, montant, description } = body

    if (!type || !montant) {
      return createErrorResponse('Champs requis: type, montant', 400)
    }

    // Generate invoice number
    const count = await prisma.invoice.count({
      where: { cabinetId: context.cabinetId }
    })
    const invoiceNumber = `FACT-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`

    // Create invoice
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 30) // 30 days payment term

    const invoice = await prisma.invoice.create({
      data: {
        cabinetId: context.cabinetId,
        conseillerId: user.id,
        clientId: clientId,
        invoiceNumber,
        amountHT: montant / 1.2, // Assuming 20% VAT
        tva: 20, // 20% VAT rate
        amountTTC: montant,
        description: description || '',
        status: 'BROUILLON',
        issueDate: new Date(),
        dueDate,
      },
      include: {
        client: {
          select: {
            firstName: true,
            lastName: true,
          }
        }
      }
    })

    return createSuccessResponse({
      id: invoice.id,
      numero: invoice.invoiceNumber,
      type: type,
      montant: montant,
      status: 'BROUILLON',
      client: invoice.client ? {
        firstName: invoice.client.firstName,
        lastName: invoice.client.lastName,
      } : null,
      description: description,
      dateCreation: invoice.createdAt.toISOString().split('T')[0],
    }, 201)
  } catch (error) {
    logger.error('Error in POST /api/advisor/ma-facturation:', { error: error instanceof Error ? error.message : String(error) })

    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }

    return createErrorResponse('Internal server error', 500)
  }
}

const patchSchema = z.object({
  factureId: z.string().min(1),
  action: z.enum(['submit', 'cancel']),
})

/**
 * PATCH /api/advisor/ma-facturation
 * Soumettre ou annuler une facture personnelle
 */
export async function PATCH(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    const { user } = context

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const body = await request.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return createErrorResponse(
        'Données invalides: ' + parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', '),
        400
      )
    }

    const { factureId, action } = parsed.data
    const prisma = getPrismaClient(context.cabinetId, context.isSuperAdmin)

    // Verify invoice belongs to this user
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: factureId,
        conseillerId: user.id,
        cabinetId: context.cabinetId,
      },
    })

    if (!invoice) {
      return createErrorResponse('Facture non trouvée', 404)
    }

    if (action === 'submit') {
      if (invoice.status !== InvoiceStatus.BROUILLON) {
        return createErrorResponse('Seules les factures en brouillon peuvent être soumises', 400)
      }

      const updated = await prisma.invoice.update({
        where: { id: factureId },
        data: { status: InvoiceStatus.ENVOYEE },
      })

      return createSuccessResponse({
        id: updated.id,
        status: updated.status,
        message: 'Facture soumise avec succès',
      })
    }

    if (action === 'cancel') {
      if (invoice.status === InvoiceStatus.PAYEE) {
        return createErrorResponse('Impossible d\'annuler une facture payée', 400)
      }

      const updated = await prisma.invoice.update({
        where: { id: factureId },
        data: { status: InvoiceStatus.ANNULEE },
      })

      return createSuccessResponse({
        id: updated.id,
        status: updated.status,
        message: 'Facture annulée',
      })
    }

    return createErrorResponse('Action inconnue', 400)
  } catch (error) {
    logger.error('Error in PATCH /api/advisor/ma-facturation:', { error: error instanceof Error ? error.message : String(error) })

    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }

    return createErrorResponse('Internal server error', 500)
  }
}
