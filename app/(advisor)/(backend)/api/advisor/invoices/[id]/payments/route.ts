import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { InvoiceService } from '@/app/_common/lib/services/invoice-service'
import { normalizeAddPaymentPayload } from '../../utils'
import { logger } from '@/app/_common/lib/logger'
/**
 * POST /api/advisor/invoices/[id]/payments
 * Add payment to invoice
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: invoiceId } = await params
  try {
    const context = await requireAuth(request)
    const { user } = context
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    if (!invoiceId) {
      return createErrorResponse('Missing invoice ID', 400)
    }

    const body = await request.json()
    const payload = normalizeAddPaymentPayload(body)

    const service = new InvoiceService(
      context.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    const payment = await service.addPayment(invoiceId, payload)

    return createSuccessResponse(payment, 201)
  } catch (error) {
    logger.error('Error in POST /api/advisor/invoices/[id]/payments:', { error: error instanceof Error ? error.message : String(error) })
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error && error.message.includes('Validation')) {
      return createErrorResponse(error.message, 400)
    }
    
    if (error instanceof Error) {
      return createErrorResponse(error.message, 400)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
