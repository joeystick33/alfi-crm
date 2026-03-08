 
import { NextRequest, NextResponse } from 'next/server'
import { CampaignService } from '@/app/_common/lib/services/campaign-service'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import { logger } from '@/app/_common/lib/logger'
/**
 * GET /api/advisor/campaigns/stats
 * Obtenir les statistiques globales des campagnes
 */
export async function GET(request: NextRequest) {
  try {
    const { user, cabinet } = await requireAuth(request)

    if (!user || !cabinet) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Parser query params
    const { searchParams } = new URL(request.url)
    const filters: any = {}

    if (searchParams.get('type')) filters.type = searchParams.get('type')
    if (searchParams.get('createdBy')) filters.createdBy = searchParams.get('createdBy')

    const service = new CampaignService(cabinet.id, user.id, user.role === 'SUPER_ADMIN')
    const stats = await service.getCampaignStats(filters)

    return NextResponse.json(stats)
  } catch (error: any) {
    logger.error('Erreur GET /api/advisor/campaigns/stats:', { error: error instanceof Error ? error.message : String(error) })

    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}
