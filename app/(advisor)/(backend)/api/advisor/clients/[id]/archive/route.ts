/**
 * API Route: /api/advisor/clients/[id]/archive
 * POST - Archive un client (alternative à DELETE sur /clients/[id])
 */

import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { ClientService } from '@/app/_common/lib/services/client-service'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    const { id } = await params

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const service = new ClientService(context.cabinetId, user.id, user.role, context.isSuperAdmin)
    await service.archiveClient(id)

    return createSuccessResponse({ 
      success: true, 
      message: 'Client archived successfully' 
    })
  } catch (error: any) {
    console.error('Error archiving client:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error && error.message.includes('not found')) {
      return createErrorResponse('Client not found', 404)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
