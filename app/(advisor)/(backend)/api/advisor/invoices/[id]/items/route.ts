import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { InvoiceService } from '@/app/_common/lib/services/invoice-service'
import { z } from 'zod'
import { createInvoiceItemSchema } from '../../utils'

/**
 * POST /api/advisor/invoices/[id]/items
 * Add item to invoice
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
    
    // Validate item
    let item
    try {
      item = createInvoiceItemSchema.parse(body)
    } catch (error) {
      if (error instanceof z.ZodError) {
        const messages = error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
        return createErrorResponse(`Validation échouée: ${messages}`, 400)
      }
      throw error
    }

    const service = new InvoiceService(
      context.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    const created = await service.addInvoiceItem(invoiceId, item)

    return createSuccessResponse(created, 201)
  } catch (error) {
    console.error('Error in POST /api/advisor/invoices/[id]/items:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error) {
      return createErrorResponse(error.message, 400)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}

/**
 * DELETE /api/advisor/invoices/[id]/items?itemId=xxx
 * Remove item from invoice
 */
export async function DELETE(
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

    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('itemId')

    if (!invoiceId) {
      return createErrorResponse('Missing invoice ID', 400)
    }

    if (!itemId) {
      return createErrorResponse('Missing item ID', 400)
    }

    const service = new InvoiceService(
      context.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    await service.removeInvoiceItem(invoiceId, itemId)

    return createSuccessResponse({
      success: true,
      message: 'Ligne supprimée avec succès',
    })
  } catch (error) {
    console.error('Error in DELETE /api/advisor/invoices/[id]/items:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error) {
      return createErrorResponse(error.message, 400)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
