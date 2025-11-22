import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/supabase/auth-helpers'
import { AuditService } from '@/lib/services/audit-service'
import { isRegularUser } from '@/lib/auth-types'

/**
 * GET /api/audit/stats
 * Récupérer les statistiques d'audit
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined

    const service = new AuditService(
      user.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    const stats = await service.getStatistics(startDate, endDate)

    return createSuccessResponse(stats)
  } catch (error: any) {
    console.error('Error in GET /api/audit/stats:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
