import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, createErrorResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { EntretienService } from '@/app/_common/lib/services/entretien-service'
import { logger } from '@/app/_common/lib/logger'
export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    if (!isRegularUser(user)) return createErrorResponse('Invalid user type', 400)

    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId') || undefined

    const service = new EntretienService(context.cabinetId, user.id, context.isSuperAdmin)
    const result = await service.getActionsEnAttente({ conseillerId: user.id, clientId })

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') return createErrorResponse('Unauthorized', 401)
    logger.error('Error in GET /api/advisor/entretiens/actions:', { error: error instanceof Error ? error.message : String(error) })
    return createErrorResponse('Internal server error', 500)
  }
}
