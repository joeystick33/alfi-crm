import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { InvoiceService } from '@/app/_common/lib/services/invoice-service'
import { parseInvoiceFilters } from '../utils'
import { logger } from '@/app/_common/lib/logger'
/**
 * GET /api/advisor/invoices/stats
 * Get invoice statistics
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

    const service = new InvoiceService(
      context.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    const stats = await service.getInvoiceStats(filters)

    return createSuccessResponse(stats)
  } catch (error) {
    logger.error('Error in GET /api/advisor/invoices/stats:', { error: error instanceof Error ? error.message : String(error) })
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error) {
      return createErrorResponse(error.message, 400)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
