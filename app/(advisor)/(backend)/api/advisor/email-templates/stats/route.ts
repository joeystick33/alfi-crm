 
import { NextRequest, NextResponse } from 'next/server'
import { EmailTemplateService } from '@/app/_common/lib/services/email-template-service'
import { requireAuth } from '@/app/_common/lib/auth-helpers'

/**
 * GET /api/advisor/email-templates/stats
 * Obtenir les statistiques globales des templates
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

    if (searchParams.get('category')) filters.category = searchParams.get('category')
    if (searchParams.get('isSystem')) filters.isSystem = searchParams.get('isSystem') === 'true'

    const service = new EmailTemplateService(cabinet.id, user.id, user.role === 'SUPER_ADMIN')
    const stats = await service.getTemplateStats(filters)

    return NextResponse.json(stats)
  } catch (error: any) {
    console.error('Erreur GET /api/advisor/email-templates/stats:', error)

    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}
