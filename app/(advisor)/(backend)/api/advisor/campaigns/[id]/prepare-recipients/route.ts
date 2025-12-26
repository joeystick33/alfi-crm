 
import { NextRequest, NextResponse } from 'next/server'
import { CampaignService } from '@/app/_common/lib/services/campaign-service'
import { requireAuth } from '@/app/_common/lib/auth-helpers'

/**
 * POST /api/advisor/campaigns/[id]/prepare-recipients
 * Préparer les destinataires d'une campagne
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

    const service = new CampaignService(cabinet.id, user.id, user.role === 'SUPER_ADMIN')
    const result = await service.prepareRecipients(campaignId)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error(`Erreur POST /api/advisor/campaigns/${campaignId}/prepare-recipients:`, error)

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
