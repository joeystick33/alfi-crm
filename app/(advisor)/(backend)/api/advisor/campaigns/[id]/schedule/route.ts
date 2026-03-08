 
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { CampaignService } from '@/app/_common/lib/services/campaign-service'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import { logger } from '@/app/_common/lib/logger'
const ScheduleSchema = z.object({
  scheduledAt: z.string().datetime('Date de planification invalide'),
})

/**
 * POST /api/advisor/campaigns/[id]/schedule
 * Planifier une campagne
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let campaignId = ''
  try {
    const { user, cabinet } = await requireAuth(request)
    const { id } = await params
    campaignId = id

    if (!user || !cabinet) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { scheduledAt } = ScheduleSchema.parse(body)

    const service = new CampaignService(cabinet.id, user.id, user.role === 'SUPER_ADMIN')
    const campaign = await service.scheduleCampaign(campaignId, new Date(scheduledAt))

    return NextResponse.json(campaign)
  } catch (error: any) {
    logger.error(`Erreur POST /api/advisor/campaigns/${campaignId}/schedule:`, { error: error instanceof Error ? error.message : String(error) })

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      )
    }

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
