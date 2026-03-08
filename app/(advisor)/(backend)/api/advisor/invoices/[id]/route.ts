 
import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { InvoiceService } from '@/app/_common/lib/services/invoice-service'
import { normalizeInvoiceUpdatePayload } from '../utils'
import { logger } from '@/app/_common/lib/logger'
/**
 * GET /api/advisor/invoices/[id]
 * Get invoice by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const { id } = await params

    if (!id) {
      return createErrorResponse('Missing invoice ID', 400)
    }

    const prismaUserId = (user as any)?.prismaUserId || user.id

    const service = new InvoiceService(
      context.cabinetId,
      prismaUserId,
      context.isSuperAdmin
    )

    const invoice = await service.getInvoiceById(id)

    return createSuccessResponse(invoice)
  } catch (error) {
    logger.error('Error in GET /api/advisor/invoices/[id]:', { error: error instanceof Error ? error.message : String(error) })
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error && error.message.includes('non trouvée')) {
      return createErrorResponse(error.message, 404)
    }
    
    if (error instanceof Error) {
      return createErrorResponse(error.message, 400)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}

/**
 * PATCH /api/advisor/invoices/[id]
 * Update invoice
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    
    if (!isRegularUser(user)) {
      return createErrorResponse("Type d'utilisateur invalide", 400)
    }

    const { id } = await params

    if (!id) {
      return createErrorResponse('Missing invoice ID', 400)
    }

    const body = await request.json()
    const payload = normalizeInvoiceUpdatePayload(body)

    const prismaUserId = (user as any)?.prismaUserId || user.id

    const service = new InvoiceService(
      context.cabinetId,
      prismaUserId,
      context.isSuperAdmin
    )

    const updated = await service.updateInvoice(id, payload)

    return createSuccessResponse(updated)
  } catch (error) {
    logger.error('Error in PATCH /api/advisor/invoices/[id]:', { error: error instanceof Error ? error.message : String(error) })
    
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

/**
 * DELETE /api/advisor/invoices/[id]
 * Delete invoice (DRAFT only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const { id } = await params

    if (!id) {
      return createErrorResponse('Missing invoice ID', 400)
    }

    const prismaUserId = (user as any)?.prismaUserId || user.id

    const service = new InvoiceService(
      context.cabinetId,
      prismaUserId,
      context.isSuperAdmin
    )

    await service.deleteInvoice(id)

    return createSuccessResponse({
      success: true,
      message: 'Facture supprimée avec succès',
    })
  } catch (error) {
    logger.error('Error in DELETE /api/advisor/invoices/[id]:', { error: error instanceof Error ? error.message : String(error) })
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error) {
      return createErrorResponse(error.message, 400)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
