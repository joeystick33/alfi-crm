 
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, createErrorResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'


import { ReclamationService } from '@/app/_common/lib/services/reclamation-service'
import { logger } from '@/app/_common/lib/logger'
/**
 * GET /api/advisor/reclamations/stats
 * Récupère les statistiques des réclamations
 */
export async function GET(req: NextRequest) {
  try {
    const context = await requireAuth(req)
    const { user } = context
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const service = new ReclamationService(
      context.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    const stats = await service.getReclamationStats()
    return NextResponse.json(stats)
  } catch (error: any) {
    logger.error('Error fetching reclamation stats:', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
