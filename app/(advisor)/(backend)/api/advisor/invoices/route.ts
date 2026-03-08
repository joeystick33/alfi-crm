import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { InvoiceService } from '@/app/_common/lib/services/invoice-service'
import { logger } from '@/app/_common/lib/logger'
import {
  normalizeInvoiceCreatePayload,
  parseInvoiceFilters,
} from './utils'

/**
 * GET /api/advisor/invoices
 * List all invoices with filters
 */
export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    // Parse filters from query params
    const { searchParams } = new URL(request.url)
    const filters = parseInvoiceFilters(searchParams)

    // Create service instance
    const service = new InvoiceService(
      context.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    // Get invoices
    const result = await service.listInvoices(filters)

    return createSuccessResponse(result)
  } catch (error) {
    logger.error('Error in GET /api/advisor/invoices:', { error: error instanceof Error ? error.message : String(error) })
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}

/**
 * POST /api/advisor/invoices
 * Create a new invoice
 */
export async function POST(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    // Parse and validate payload
    const body = await request.json()
    const payload = normalizeInvoiceCreatePayload(body)

    // Create service instance
    const service = new InvoiceService(
      context.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    // Create invoice
    const invoice = await service.createInvoice({
      ...payload,
      conseillerId: payload.conseillerId || user.id,
    })

    return createSuccessResponse(invoice, 201)
  } catch (error) {
    logger.error('Error in POST /api/advisor/invoices:', { error: error instanceof Error ? error.message : String(error) })
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    // Zod validation error handled in normalizeInvoiceCreatePayload but re-throwing here for visibility
    if (error instanceof Error && error.message.startsWith('Validation échouée')) {
      logger.error('Validation details: ' + error.message)
      return createErrorResponse(error.message, 400)
    }
    
    if (error instanceof Error) {
      logger.error('Generic error details: ' + error.message)
      return createErrorResponse(error.message, 400)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
