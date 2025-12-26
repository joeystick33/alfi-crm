 
import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { ActifService } from '@/app/_common/lib/services/actif-service'

export async function GET(request: NextRequest) {
    try {
        const context = await requireAuth(request)
        const { user } = context
        const searchParams = request.nextUrl.searchParams

        if (!isRegularUser(user)) {
            return createErrorResponse('Invalid user type', 400)
        }

        const service = new ActifService(context.cabinetId, user.id, context.isSuperAdmin)

        const filters = {
            type: searchParams.get('type') as any || undefined,
            search: searchParams.get('search') || undefined,
        }

        const data = await service.listActifs(filters)
        return createSuccessResponse(data)
    } catch (error: any) {
        console.error('Error listing actifs:', error)
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
        const service = new ActifService(context.cabinetId, user.id, context.isSuperAdmin)

        // Check if we are creating for a specific client
        if (body.clientId) {
            const { clientId, ownershipPercentage, ownershipType, ...actifData } = body
            const data = await service.createActifForClient(clientId, actifData, ownershipPercentage, ownershipType)
            return createSuccessResponse(data)
        } else {
            const data = await service.createActif(body)
            return createSuccessResponse(data)
        }
    } catch (error: any) {
        console.error('Error creating actif:', error)
        if (error instanceof Error && error.message === 'Unauthorized') {
            return createErrorResponse('Unauthorized', 401)
        }
        return createErrorResponse('Internal server error', 500)
    }
}
