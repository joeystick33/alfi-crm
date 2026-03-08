import { NextRequest, NextResponse } from 'next/server'
import { EmailTemplateService } from '@/app/_common/lib/services/email-template-service'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import { logger } from '@/app/_common/lib/logger'
/**
 * GET /api/advisor/email-templates/categories
 * Obtenir toutes les catégories de templates disponibles
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

    const service = new EmailTemplateService(cabinet.id, user.id, user.role === 'SUPER_ADMIN')
    const categories = await service.getCategories()

    return NextResponse.json({ categories })
  } catch (error) {
    logger.error('Erreur GET /api/advisor/email-templates/categories:', { error: error instanceof Error ? error.message : String(error) })

    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}
