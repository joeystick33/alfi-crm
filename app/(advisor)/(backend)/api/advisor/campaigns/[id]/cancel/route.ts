 
import { NextRequest, NextResponse } from 'next/server'
import { CampaignService } from '@/app/_common/lib/services/campaign-service'
import { requireAuth, createErrorResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { logger } from '@/app/_common/lib/logger'
/**
 * POST /api/advisor/campaigns/[id]/cancel
 * Annuler une campagne planifiée ou en cours
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let campaignId = ''
  try {
    const context = await requireAuth(request)
    const { user } = context
    const { id } = await params
    campaignId = id

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const service = new CampaignService(context.cabinetId, user.id, context.isSuperAdmin)
    const campaign = await service.cancelCampaign(campaignId)

    return NextResponse.json(campaign)
  } catch (error: any) {
    logger.error(`Erreur POST /api/advisor/campaigns/${campaignId}/cancel:`, { error: error instanceof Error ? error.message : String(error) })

    if (error.message === 'Campagne non trouvée') {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 400 }
    )
  }
}
