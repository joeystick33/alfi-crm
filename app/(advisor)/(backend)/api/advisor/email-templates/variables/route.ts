import { NextRequest, NextResponse } from 'next/server'
import { EmailTemplateService } from '@/app/_common/lib/services/email-template-service'
import { requireAuth } from '@/app/_common/lib/auth-helpers'

/**
 * GET /api/advisor/email-templates/variables
 * Obtenir toutes les variables disponibles dans les templates
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
    const variables = await service.getAllVariables()

    return NextResponse.json({ variables })
  } catch (error) {
    console.error('Erreur GET /api/advisor/email-templates/variables:', error)

    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}
