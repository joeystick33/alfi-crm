import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, createErrorResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'


import { KYCService } from '@/app/_common/lib/services/kyc-service'

/**
 * GET /api/advisor/kyc/stats
 * Récupère les statistiques KYC globales
 */
export async function GET(req: NextRequest) {
  try {
    const context = await requireAuth(req)
    const { user } = context
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const service = new KYCService(
      context.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    const [kycStats, checkStats] = await Promise.all([
      service.getKYCStats(),
      service.getKYCCheckStats(),
    ])

    return NextResponse.json({
      documents: kycStats,
      checks: checkStats,
    })
  } catch (error) {
    console.error('Error fetching KYC stats:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
