import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, createErrorResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { EntretienService } from '@/app/_common/lib/services/entretien-service'
import { logger } from '@/app/_common/lib/logger'
export async function GET(request: NextRequest, { params }: { params: Promise<{ clientId: string }> }) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    if (!isRegularUser(user)) return createErrorResponse('Invalid user type', 400)

    const { clientId } = await params
    const service = new EntretienService(context.cabinetId, user.id, context.isSuperAdmin)
    const brief = await service.getClientBrief(clientId)

    return NextResponse.json(brief)
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') return createErrorResponse('Unauthorized', 401)
    if (error instanceof Error && error.message === 'Client non trouvé') return createErrorResponse('Client non trouvé', 404)
    logger.error('Error in GET /api/advisor/entretiens/brief/[clientId]:', { error: error instanceof Error ? error.message : String(error) })
    return createErrorResponse('Internal server error', 500)
  }
}
