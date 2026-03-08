import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { InvoiceService } from '@/app/_common/lib/services/invoice-service'
import { logger } from '@/app/_common/lib/logger'
/**
 * POST /api/advisor/invoices/[id]/cancel
 * Cancel invoice
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const context = await requireAuth(request)
    const { user } = context
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    if (!id) {
      return createErrorResponse('Missing invoice ID', 400)
    }

    const service = new InvoiceService(
      context.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    const invoice = await service.cancelInvoice(id)

    return createSuccessResponse({
      ...invoice,
      message: 'Facture annulée avec succès',
    })
  } catch (error) {
    logger.error('Error in POST /api/advisor/invoices/[id]/cancel:', { error: error instanceof Error ? error.message : String(error) })
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error) {
      return createErrorResponse(error.message, 400)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
