 
/**
 * Validation utilities for invoices API routes
 * 
 * Provides Zod schemas and helper functions for validating
 * invoice creation, updates, items, payments and filters.
 */

import { z } from 'zod'
import { InvoiceStatus, PaymentMethod } from '@prisma/client'

// ============================================
// Zod Schemas
// ============================================

export const createInvoiceItemSchema = z.object({
  description: z.string().min(1, 'Description requise'),
  quantity: z.number().positive('La quantité doit être positive'),
  unitPrice: z.number().nonnegative('Le prix unitaire ne peut être négatif'),
  tva: z.number().min(0).max(100, 'La TVA doit être entre 0 et 100%'),
})

export const createInvoiceSchema = z.object({
  clientId: z.string().min(1, 'ID client requis'),
  conseillerId: z.string().min(1, 'ID conseiller invalide').optional(),
  
  // Dates - accepter les formats ISO 8601 ou date simple
  issueDate: z.string().optional(),
  dueDate: z.string().min(1, "Date d'échéance requise"),
  
  // Montants (optionnels, calculés automatiquement si items fournis)
  amountHT: z.number().nonnegative().optional(),
  tva: z.number().min(0).max(100).optional(),
  amountTTC: z.number().nonnegative().optional(),
  
  // Description
  description: z.string().optional(),
  notes: z.string().optional(),
  termsAndConditions: z.string().optional(),
  
  // Lignes de facture
  items: z.array(createInvoiceItemSchema).min(1, 'Au moins une ligne requise').optional(),
  
  // Relations optionnelles
  projectId: z.string().optional().nullable(),
  opportunityId: z.string().optional().nullable(),
})

export const updateInvoiceSchema = z.object({
  status: z.nativeEnum(InvoiceStatus).optional(),
  
  // Dates
  issueDate: z.string().datetime().optional(),
  dueDate: z.string().datetime().optional(),
  paidDate: z.string().datetime().optional().nullable(),
  
  // Montants
  amountHT: z.number().nonnegative().optional(),
  tva: z.number().min(0).max(100).optional(),
  amountTTC: z.number().nonnegative().optional(),
  
  // Description
  description: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  termsAndConditions: z.string().optional().nullable(),
  
  // Relations
  projectId: z.string().cuid().optional().nullable(),
  opportunityId: z.string().cuid().optional().nullable(),
})

export const addPaymentSchema = z.object({
  amount: z.number().positive('Le montant doit être positif'),
  method: z.nativeEnum(PaymentMethod),
  reference: z.string().optional().nullable(),
  paidAt: z.string().datetime().optional(), // ISO 8601
  notes: z.string().optional().nullable(),
})

export const invoiceFiltersSchema = z.object({
  status: z.nativeEnum(InvoiceStatus).optional(),
  clientId: z.string().cuid().optional(),
  conseillerId: z.string().cuid().optional(),
  projectId: z.string().cuid().optional(),
  opportunityId: z.string().cuid().optional(),
  
  // Date range filters
  issueDateFrom: z.string().datetime().optional(),
  issueDateTo: z.string().datetime().optional(),
  dueDateFrom: z.string().datetime().optional(),
  dueDateTo: z.string().datetime().optional(),
  
  // Amount range
  amountHTMin: z.number().nonnegative().optional(),
  amountHTMax: z.number().nonnegative().optional(),
  
  // Pagination
  limit: z.number().int().positive().max(200).optional(),
  offset: z.number().int().nonnegative().optional(),
  
  // Sorting
  sortBy: z.enum(['invoiceNumber', 'issueDate', 'dueDate', 'amountTTC', 'status']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
})

// ============================================
// Type exports
// ============================================

export type CreateInvoicePayload = z.infer<typeof createInvoiceSchema>
export type UpdateInvoicePayload = z.infer<typeof updateInvoiceSchema>
export type CreateInvoiceItemPayload = z.infer<typeof createInvoiceItemSchema>
export type AddPaymentPayload = z.infer<typeof addPaymentSchema>
export type InvoiceFilters = z.infer<typeof invoiceFiltersSchema>

// ============================================
// Validation functions
// ============================================

/**
 * Normalize and validate invoice creation payload
 */
export function normalizeInvoiceCreatePayload(body: unknown): CreateInvoicePayload {
  try {
    return createInvoiceSchema.parse(body)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
      throw new Error(`Validation échouée: ${messages}`)
    }
    throw error
  }
}

/**
 * Normalize and validate invoice update payload
 */
export function normalizeInvoiceUpdatePayload(body: unknown): UpdateInvoicePayload {
  try {
    return updateInvoiceSchema.parse(body)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
      throw new Error(`Validation échouée: ${messages}`)
    }
    throw error
  }
}

/**
 * Normalize and validate payment payload
 */
export function normalizeAddPaymentPayload(body: unknown): AddPaymentPayload {
  try {
    return addPaymentSchema.parse(body)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
      throw new Error(`Validation échouée: ${messages}`)
    }
    throw error
  }
}

/**
 * Parse and validate invoice filters from URL search params
 */
export function parseInvoiceFilters(searchParams: URLSearchParams): InvoiceFilters {
  const filters: any = {}

  // Status filter
  const status = searchParams.get('status')
  if (status && Object.values(InvoiceStatus).includes(status as InvoiceStatus)) {
    filters.status = status as InvoiceStatus
  }

  // Client ID
  const clientId = searchParams.get('clientId')
  if (clientId) filters.clientId = clientId

  // Conseiller ID
  const conseillerId = searchParams.get('conseillerId')
  if (conseillerId) filters.conseillerId = conseillerId

  // Project ID
  const projectId = searchParams.get('projectId')
  if (projectId) filters.projectId = projectId

  // Opportunity ID
  const opportunityId = searchParams.get('opportunityId')
  if (opportunityId) filters.opportunityId = opportunityId

  // Date ranges
  const issueDateFrom = searchParams.get('issueDateFrom')
  if (issueDateFrom) filters.issueDateFrom = issueDateFrom

  const issueDateTo = searchParams.get('issueDateTo')
  if (issueDateTo) filters.issueDateTo = issueDateTo

  const dueDateFrom = searchParams.get('dueDateFrom')
  if (dueDateFrom) filters.dueDateFrom = dueDateFrom

  const dueDateTo = searchParams.get('dueDateTo')
  if (dueDateTo) filters.dueDateTo = dueDateTo

  // Amount range
  const amountHTMin = searchParams.get('amountHTMin')
  if (amountHTMin) {
    const parsed = parseFloat(amountHTMin)
    if (!isNaN(parsed)) filters.amountHTMin = parsed
  }

  const amountHTMax = searchParams.get('amountHTMax')
  if (amountHTMax) {
    const parsed = parseFloat(amountHTMax)
    if (!isNaN(parsed)) filters.amountHTMax = parsed
  }

  // Pagination
  const limit = searchParams.get('limit')
  if (limit) {
    const parsed = parseInt(limit, 10)
    if (!isNaN(parsed) && parsed > 0 && parsed <= 200) {
      filters.limit = parsed
    }
  }

  const offset = searchParams.get('offset')
  if (offset) {
    const parsed = parseInt(offset, 10)
    if (!isNaN(parsed) && parsed >= 0) {
      filters.offset = parsed
    }
  }

  // Sorting
  const sortBy = searchParams.get('sortBy')
  if (sortBy && ['invoiceNumber', 'issueDate', 'dueDate', 'amountTTC', 'status'].includes(sortBy)) {
    filters.sortBy = sortBy
  }

  const sortOrder = searchParams.get('sortOrder')
  if (sortOrder && ['asc', 'desc'].includes(sortOrder)) {
    filters.sortOrder = sortOrder
  }

  return filters
}

// ============================================
// Business logic helpers
// ============================================

/**
 * Generate unique invoice number for a cabinet
 * Format: INV-YYYY-NNN (e.g., INV-2024-001)
 */
export async function generateInvoiceNumber(
  cabinetId: string,
  prisma: any
): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `INV-${year}-`

  // Find the last invoice for this year
  const lastInvoice = await prisma.invoice.findFirst({
    where: {
      cabinetId,
      invoiceNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      invoiceNumber: 'desc',
    },
    select: {
      invoiceNumber: true,
    },
  })

  let nextNumber = 1

  if (lastInvoice) {
    // Extract number from last invoice (INV-2024-042 -> 042)
    const match = lastInvoice.invoiceNumber.match(/(\d+)$/)
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1
    }
  }

  // Pad with zeros (001, 002, ..., 999)
  const paddedNumber = nextNumber.toString().padStart(3, '0')

  return `${prefix}${paddedNumber}`
}

/**
 * Calculate invoice totals from items
 */
export function calculateInvoiceTotals(items: CreateInvoiceItemPayload[]): {
  amountHT: number
  amountTTC: number
  averageTVA: number
} {
  if (!items || items.length === 0) {
    return { amountHT: 0, amountTTC: 0, averageTVA: 0 }
  }

  let totalHT = 0
  let totalTTC = 0

  for (const item of items) {
    const itemHT = item.quantity * item.unitPrice
    const itemTTC = itemHT * (1 + item.tva / 100)

    totalHT += itemHT
    totalTTC += itemTTC
  }

  // Calculate average TVA rate
  const averageTVA = totalHT > 0 ? ((totalTTC - totalHT) / totalHT) * 100 : 0

  return {
    amountHT: Math.round(totalHT * 100) / 100, // Round to 2 decimals
    amountTTC: Math.round(totalTTC * 100) / 100,
    averageTVA: Math.round(averageTVA * 100) / 100,
  }
}

/**
 * Calculate item totals
 */
export function calculateItemTotals(item: CreateInvoiceItemPayload): {
  totalHT: number
  totalTTC: number
} {
  const totalHT = item.quantity * item.unitPrice
  const totalTTC = totalHT * (1 + item.tva / 100)

  return {
    totalHT: Math.round(totalHT * 100) / 100,
    totalTTC: Math.round(totalTTC * 100) / 100,
  }
}

/**
 * Validate invoice can be sent
 */
export function canSendInvoice(invoice: any): { valid: boolean; reason?: string } {
  if (invoice.status !== 'BROUILLON') {
    return { valid: false, reason: 'Seules les factures en brouillon peuvent être envoyées' }
  }

  if (!invoice.items || invoice.items.length === 0) {
    return { valid: false, reason: 'La facture doit contenir au moins une ligne' }
  }

  if (!invoice.dueDate) {
    return { valid: false, reason: 'La date d\'échéance est requise' }
  }

  if (!invoice.clientId) {
    return { valid: false, reason: 'Un client doit être associé à la facture' }
  }

  return { valid: true }
}

/**
 * Validate invoice can be marked as paid
 */
export function canMarkAsPaid(invoice: any): { valid: boolean; reason?: string } {
  if (invoice.status === 'PAYEE') {
    return { valid: false, reason: 'La facture est déjà marquée comme payée' }
  }

  if (invoice.status === 'ANNULE') {
    return { valid: false, reason: 'Une facture annulée ne peut être marquée comme payée' }
  }

  if (invoice.status === 'BROUILLON') {
    return { valid: false, reason: 'La facture doit d\'abord être envoyée au client' }
  }

  return { valid: true }
}

/**
 * Check if invoice is overdue
 */
export function isInvoiceOverdue(invoice: any): boolean {
  if (invoice.status === 'PAYEE' || invoice.status === 'ANNULE') {
    return false
  }

  const now = new Date()
  const dueDate = new Date(invoice.dueDate)

  return dueDate < now
}
