/**
 * Invoice Service
 * 
 * Business logic for invoice management including:
 * - CRUD operations
 * - Invoice number generation
 * - Status management (DRAFT → SENT → PAID)
 * - Payment tracking
 * - Statistics and reporting
 */

import { Prisma, InvoiceStatus } from '@prisma/client'
import { getPrismaClient } from '../prisma'
import {
  generateInvoiceNumber,
  calculateInvoiceTotals,
  calculateItemTotals,
  canSendInvoice,
  canMarkAsPaid,
  type CreateInvoicePayload,
  type CreateInvoiceItemPayload,
  type AddPaymentPayload,
  type InvoiceFilters,
} from '@/app/(advisor)/(backend)/api/advisor/invoices/utils'

export class InvoiceService {
  private prisma: ReturnType<typeof getPrismaClient>

  constructor(
    private cabinetId: string,
    private userId?: string,
    private isSuperAdmin: boolean = false
  ) {
    this.prisma = getPrismaClient(cabinetId, isSuperAdmin)
  }

  /**
   * Create a new invoice
   */
  async createInvoice(data: CreateInvoicePayload & { conseillerId?: string }) {
    const conseillerId = data.conseillerId || this.userId

    if (!conseillerId) {
      throw new Error('Conseiller ID est requis')
    }

    // Verify client exists
    const client = await this.prisma.client.findFirst({
      where: {
        id: data.clientId,
        cabinetId: this.cabinetId,
      },
    })

    if (!client) {
      throw new Error('Client non trouvé')
    }

    // Generate unique invoice number
    const invoiceNumber = await generateInvoiceNumber(this.cabinetId, this.prisma)

    // Calculate totals if items provided
    let amountHT = data.amountHT
    let amountTTC = data.amountTTC
    let tva = data.tva

    if (data.items && data.items.length > 0) {
      const totals = calculateInvoiceTotals(data.items)
      amountHT = totals.amountHT
      amountTTC = totals.amountTTC
      tva = totals.averageTVA
    }

    if (amountHT === undefined || amountTTC === undefined || tva === undefined) {
      throw new Error('Les montants doivent être fournis ou des lignes de facture doivent être ajoutées')
    }

    // Parse dates
    const issueDate = data.issueDate ? new Date(data.issueDate) : new Date()
    const dueDate = new Date(data.dueDate)

    // Create invoice with items
    const invoice = await this.prisma.invoice.create({
      data: {
        cabinetId: this.cabinetId,
        invoiceNumber,
        clientId: data.clientId,
        conseillerId,
        amountHT,
        tva,
        amountTTC,
        status: InvoiceStatus.BROUILLON,
        issueDate,
        dueDate,
        description: data.description || null,
        notes: data.notes || null,
        termsAndConditions: data.termsAndConditions || null,
        projectId: data.projectId || null,
        opportunityId: data.opportunityId || null,
        items: data.items
          ? {
              create: data.items.map((item, index) => {
                const totals = calculateItemTotals(item)
                return {
                  order: index,
                  description: item.description,
                  quantity: item.quantity,
                  unitPrice: item.unitPrice,
                  totalHT: totals.totalHT,
                  tva: item.tva,
                  totalTTC: totals.totalTTC,
                }
              }),
            }
          : undefined,
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        conseiller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        items: {
          orderBy: { order: 'asc' },
        },
        payments: true,
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        opportunity: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return invoice
  }

  /**
   * List invoices with filters
   */
  async listInvoices(filters: InvoiceFilters = {}) {
    const where: Prisma.InvoiceWhereInput = {
      cabinetId: this.cabinetId,
    }

    // Status filter
    if (filters.status) {
      where.status = filters.status
    }

    // Client filter
    if (filters.clientId) {
      where.clientId = filters.clientId
    }

    // Conseiller filter
    if (filters.conseillerId) {
      where.conseillerId = filters.conseillerId
    }

    // Project filter
    if (filters.projectId) {
      where.projectId = filters.projectId
    }

    // Opportunity filter
    if (filters.opportunityId) {
      where.opportunityId = filters.opportunityId
    }

    // Issue date range
    if (filters.issueDateFrom || filters.issueDateTo) {
      where.issueDate = {}
      if (filters.issueDateFrom) {
        where.issueDate.gte = new Date(filters.issueDateFrom)
      }
      if (filters.issueDateTo) {
        where.issueDate.lte = new Date(filters.issueDateTo)
      }
    }

    // Due date range
    if (filters.dueDateFrom || filters.dueDateTo) {
      where.dueDate = {}
      if (filters.dueDateFrom) {
        where.dueDate.gte = new Date(filters.dueDateFrom)
      }
      if (filters.dueDateTo) {
        where.dueDate.lte = new Date(filters.dueDateTo)
      }
    }

    // Amount range
    if (filters.amountHTMin !== undefined || filters.amountHTMax !== undefined) {
      where.amountHT = {}
      if (filters.amountHTMin !== undefined) {
        where.amountHT.gte = filters.amountHTMin
      }
      if (filters.amountHTMax !== undefined) {
        where.amountHT.lte = filters.amountHTMax
      }
    }

    // Sorting
    const orderBy: Prisma.InvoiceOrderByWithRelationInput = {}
    if (filters.sortBy) {
      orderBy[filters.sortBy] = filters.sortOrder || 'desc'
    } else {
      orderBy.issueDate = 'desc' // Default: most recent first
    }

    const [invoices, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        orderBy,
        take: filters.limit || 50,
        skip: filters.offset || 0,
        include: {
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          conseiller: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          items: {
            orderBy: { order: 'asc' },
          },
          payments: true,
          _count: {
            select: {
              payments: true,
            },
          },
        },
      }),
      this.prisma.invoice.count({ where }),
    ])

    return {
      data: invoices,
      total,
      limit: filters.limit || 50,
      offset: filters.offset || 0,
    }
  }

  /**
   * Get invoice by ID
   */
  async getInvoiceById(id: string) {
    const invoice = await this.prisma.invoice.findFirst({
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
            email: true,
            phone: true,
            mobile: true,
            address: true,
          },
        },
        conseiller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        items: {
          orderBy: { order: 'asc' },
        },
        payments: {
          orderBy: { paidAt: 'desc' },
        },
        project: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        opportunity: {
          select: {
            id: true,
            name: true,
            type: true,
            estimatedValue: true,
          },
        },
      },
    })

    if (!invoice) {
      throw new Error('Facture non trouvée')
    }

    return invoice
  }

  /**
   * Update invoice
   */
  async updateInvoice(id: string, data: Partial<CreateInvoicePayload>) {
    const existing = await this.getInvoiceById(id)

    // Cannot update if status is PAID or CANCELLED
    if (existing.status === InvoiceStatus.PAYEE || existing.status === InvoiceStatus.ANNULEE) {
      throw new Error('Impossible de modifier une facture payée ou annulée')
    }

    const updateData: Prisma.InvoiceUpdateInput = {}

    if (data.description !== undefined) updateData.description = data.description
    if (data.notes !== undefined) updateData.notes = data.notes
    if (data.termsAndConditions !== undefined) updateData.termsAndConditions = data.termsAndConditions
    if (data.issueDate) updateData.issueDate = new Date(data.issueDate)
    if (data.dueDate) updateData.dueDate = new Date(data.dueDate)
    if (data.projectId !== undefined) {
      updateData.project = data.projectId ? { connect: { id: data.projectId } } : { disconnect: true }
    }
    if (data.opportunityId !== undefined) {
      updateData.opportunity = data.opportunityId ? { connect: { id: data.opportunityId } } : { disconnect: true }
    }

    // Recalculate amounts if provided
    if (data.amountHT !== undefined) updateData.amountHT = data.amountHT
    if (data.tva !== undefined) updateData.tva = data.tva
    if (data.amountTTC !== undefined) updateData.amountTTC = data.amountTTC

    const updated = await this.prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        client: true,
        conseiller: true,
        items: {
          orderBy: { order: 'asc' },
        },
        payments: true,
      },
    })

    return updated
  }

  /**
   * Delete invoice (only if DRAFT)
   */
  async deleteInvoice(id: string) {
    const invoice = await this.getInvoiceById(id)

    if (invoice.status !== InvoiceStatus.BROUILLON) {
      throw new Error('Seules les factures en brouillon peuvent être supprimées')
    }

    await this.prisma.invoice.delete({
      where: { id },
    })

    return { success: true }
  }

  /**
   * Add item to invoice
   */
  async addInvoiceItem(invoiceId: string, item: CreateInvoiceItemPayload) {
    const invoice = await this.getInvoiceById(invoiceId)

    if (invoice.status !== InvoiceStatus.BROUILLON) {
      throw new Error('Impossible d\'ajouter des lignes à une facture non brouillon')
    }

    // Get max order
    const maxOrder = invoice.items.reduce((max, i) => Math.max(max, i.order), -1)

    const totals = calculateItemTotals(item)

    const created = await this.prisma.invoiceItem.create({
      data: {
        invoiceId,
        order: maxOrder + 1,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalHT: totals.totalHT,
        tva: item.tva,
        totalTTC: totals.totalTTC,
      },
    })

    // Recalculate invoice totals
    await this.recalculateInvoiceTotals(invoiceId)

    return created
  }

  /**
   * Remove item from invoice
   */
  async removeInvoiceItem(invoiceId: string, itemId: string) {
    const invoice = await this.getInvoiceById(invoiceId)

    if (invoice.status !== InvoiceStatus.BROUILLON) {
      throw new Error('Impossible de supprimer des lignes d\'une facture non brouillon')
    }

    await this.prisma.invoiceItem.delete({
      where: { id: itemId },
    })

    // Recalculate invoice totals
    await this.recalculateInvoiceTotals(invoiceId)

    return { success: true }
  }

  /**
   * Recalculate invoice totals from items
   */
  private async recalculateInvoiceTotals(invoiceId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { items: true },
    })

    if (!invoice) return

    let totalHT = 0
    let totalTTC = 0

    for (const item of invoice.items) {
      totalHT += Number(item.totalHT)
      totalTTC += Number(item.totalTTC)
    }

    const avgTVA = totalHT > 0 ? ((totalTTC - totalHT) / totalHT) * 100 : 0

    await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        amountHT: totalHT,
        amountTTC: totalTTC,
        tva: avgTVA,
      },
    })
  }

  /**
   * Add payment to invoice
   */
  async addPayment(invoiceId: string, payment: AddPaymentPayload) {
    const invoice = await this.getInvoiceById(invoiceId)

    if (invoice.status === InvoiceStatus.ANNULEE) {
      throw new Error('Impossible d\'ajouter un paiement à une facture annulée')
    }

    const paidAt = payment.paidAt ? new Date(payment.paidAt) : new Date()

    const created = await this.prisma.payment.create({
      data: {
        cabinetId: this.cabinetId,
        invoiceId,
        amount: payment.amount,
        method: payment.method,
        reference: payment.reference || null,
        paidAt,
        notes: payment.notes || null,
      },
    })

    // Check if invoice is fully paid
    const totalPaid = await this.prisma.payment.aggregate({
      where: { invoiceId },
      _sum: { amount: true },
    })

    const amountPaid = Number(totalPaid._sum.amount || 0)
    const amountDue = Number(invoice.amountTTC)

    if (amountPaid >= amountDue) {
      await this.prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          status: InvoiceStatus.PAYEE,
          paidDate: paidAt,
        },
      })
    }

    return created
  }

  /**
   * Send invoice (change status DRAFT → SENT)
   */
  async sendInvoice(id: string) {
    const invoice = await this.getInvoiceById(id)

    const validation = canSendInvoice(invoice)
    if (!validation.valid) {
      throw new Error(validation.reason || 'Impossible d\'envoyer la facture')
    }

    const updated = await this.prisma.invoice.update({
      where: { id },
      data: {
        status: InvoiceStatus.ENVOYEE,
      },
      include: {
        client: true,
        items: true,
      },
    })

    return updated
  }

  /**
   * Mark invoice as paid
   */
  async markAsPaid(id: string, paidDate?: Date) {
    const invoice = await this.getInvoiceById(id)

    const validation = canMarkAsPaid(invoice)
    if (!validation.valid) {
      throw new Error(validation.reason || 'Impossible de marquer la facture comme payée')
    }

    const updated = await this.prisma.invoice.update({
      where: { id },
      data: {
        status: InvoiceStatus.PAYEE,
        paidDate: paidDate || new Date(),
      },
    })

    return updated
  }

  /**
   * Cancel invoice
   */
  async cancelInvoice(id: string) {
    const invoice = await this.getInvoiceById(id)

    if (invoice.status === InvoiceStatus.PAYEE) {
      throw new Error('Impossible d\'annuler une facture payée')
    }

    const updated = await this.prisma.invoice.update({
      where: { id },
      data: {
        status: InvoiceStatus.ANNULEE,
      },
    })

    return updated
  }

  /**
   * Update overdue invoices
   */
  async updateOverdueInvoices() {
    const now = new Date()

    const result = await this.prisma.invoice.updateMany({
      where: {
        cabinetId: this.cabinetId,
        status: InvoiceStatus.ENVOYEE,
        dueDate: {
          lt: now,
        },
      },
      data: {
        status: InvoiceStatus.EN_RETARD,
      },
    })

    return result.count
  }

  /**
   * Get invoice statistics
   */
  async getInvoiceStats(filters: InvoiceFilters = {}) {
    const where: Prisma.InvoiceWhereInput = {
      cabinetId: this.cabinetId,
    }

    // Apply same filters as listInvoices
    if (filters.clientId) where.clientId = filters.clientId
    if (filters.conseillerId) where.conseillerId = filters.conseillerId
    if (filters.issueDateFrom || filters.issueDateTo) {
      where.issueDate = {}
      if (filters.issueDateFrom) where.issueDate.gte = new Date(filters.issueDateFrom)
      if (filters.issueDateTo) where.issueDate.lte = new Date(filters.issueDateTo)
    }

    const [
      total,
      draft,
      sent,
      paid,
      overdue,
      cancelled,
      totalAmountHT,
      totalAmountTTC,
      paidAmount,
      overdueAmount,
    ] = await Promise.all([
      this.prisma.invoice.count({ where }),
      this.prisma.invoice.count({ where: { ...where, status: InvoiceStatus.BROUILLON } }),
      this.prisma.invoice.count({ where: { ...where, status: InvoiceStatus.ENVOYEE } }),
      this.prisma.invoice.count({ where: { ...where, status: InvoiceStatus.PAYEE } }),
      this.prisma.invoice.count({ where: { ...where, status: InvoiceStatus.EN_RETARD } }),
      this.prisma.invoice.count({ where: { ...where, status: InvoiceStatus.ANNULEE } }),
      this.prisma.invoice.aggregate({
        where,
        _sum: { amountHT: true },
      }),
      this.prisma.invoice.aggregate({
        where,
        _sum: { amountTTC: true },
      }),
      this.prisma.invoice.aggregate({
        where: { ...where, status: InvoiceStatus.PAYEE },
        _sum: { amountTTC: true },
      }),
      this.prisma.invoice.aggregate({
        where: { ...where, status: InvoiceStatus.EN_RETARD },
        _sum: { amountTTC: true },
      }),
    ])

    return {
      total,
      draft,
      sent,
      paid,
      overdue,
      cancelled,
      totalAmountHT: Number(totalAmountHT._sum.amountHT || 0),
      totalAmountTTC: Number(totalAmountTTC._sum.amountTTC || 0),
      paidAmount: Number(paidAmount._sum.amountTTC || 0),
      overdueAmount: Number(overdueAmount._sum.amountTTC || 0),
      pendingAmount: Number(totalAmountTTC._sum.amountTTC || 0) - Number(paidAmount._sum.amountTTC || 0),
    }
  }
}
