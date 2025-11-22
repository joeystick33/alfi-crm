import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/supabase/auth-helpers'
import { AuditService } from '@/lib/services/audit-service'
import { isRegularUser } from '@/lib/auth-types'
import { AuditAction } from '@prisma/client'

/**
 * GET /api/audit/logs
 * Récupérer les logs d'audit avec filtres
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const { searchParams } = new URL(request.url)
    
    const actionParam = searchParams.get('action');
    const filters = {
      action: actionParam ? (actionParam as AuditAction) : undefined,
      entityType: searchParams.get('entityType') || undefined,
      entityId: searchParams.get('entityId') || undefined,
      userId: searchParams.get('userId') || undefined,
      startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
      endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100,
    }

    const service = new AuditService(
      user.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    const logs = await service.getAuditLogs(filters)

    return createSuccessResponse(logs)
  } catch (error: any) {
    console.error('Error in GET /api/audit/logs:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
