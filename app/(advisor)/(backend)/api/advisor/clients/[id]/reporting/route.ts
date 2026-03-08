import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { ReportingService } from '@/app/_common/lib/services/reporting-service'
import { logger } from '@/app/_common/lib/logger'
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const context = await requireAuth(request)
        const { user } = context
        const { id } = await params

        if (!isRegularUser(user)) {
            return createErrorResponse('Invalid user type', 400)
        }

        const service = new ReportingService(context.cabinetId, user.id, context.isSuperAdmin)
        const data = await service.getClientPortfolio(id)

        return createSuccessResponse(data)
    } catch (error) {
        logger.error('Error loading client reporting:', { error: error instanceof Error ? error.message : String(error) })
        if (error instanceof Error && error.message === 'Unauthorized') {
            return createErrorResponse('Unauthorized', 401)
        }
        return createErrorResponse('Internal server error', 500)
    }
}
