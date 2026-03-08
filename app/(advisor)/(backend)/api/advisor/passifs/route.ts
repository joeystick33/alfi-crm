 
import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { PassifService } from '@/app/_common/lib/services/passif-service'
import { logger } from '@/app/_common/lib/logger'
export async function GET(request: NextRequest) {
    try {
        const context = await requireAuth(request)
        const { user } = context
        const searchParams = request.nextUrl.searchParams

        if (!isRegularUser(user)) {
            return createErrorResponse('Invalid user type', 400)
        }

        const service = new PassifService(context.cabinetId, user.id, context.isSuperAdmin)

        const filters = {
            type: searchParams.get('type') as any || undefined,
            search: searchParams.get('search') || undefined,
            clientId: searchParams.get('clientId') || undefined,
        }

        const data = await service.listPassifsWithClients(filters)
        return createSuccessResponse(data)
    } catch (error: any) {
        logger.error('Error listing passifs:', { error: error instanceof Error ? error.message : String(error) })
        if (error instanceof Error && error.message === 'Unauthorized') {
            return createErrorResponse('Unauthorized', 401)
        }
        return createErrorResponse('Internal server error', 500)
    }
}

export async function POST(request: NextRequest) {
    try {
        const context = await requireAuth(request)
        const { user } = context

        if (!isRegularUser(user)) {
            return createErrorResponse('Invalid user type', 400)
        }

        const body = await request.json()
        const service = new PassifService(context.cabinetId, user.id, context.isSuperAdmin)

        const data = await service.createPassif(body)
        return createSuccessResponse(data)
    } catch (error: any) {
        logger.error('Error creating passif:', { error: error instanceof Error ? error.message : String(error) })
        if (error instanceof Error && error.message === 'Unauthorized') {
            return createErrorResponse('Unauthorized', 401)
        }
        return createErrorResponse('Internal server error', 500)
    }
}
