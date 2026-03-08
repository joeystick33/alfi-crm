 
import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { ContratService } from '@/app/_common/lib/services/contrat-service'
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

        const service = new ContratService(context.cabinetId, user.id, context.isSuperAdmin)
        const data = await service.getContratById(id)

        if (!data) {
            return createErrorResponse('Contrat not found', 404)
        }

        return createSuccessResponse(data)
    } catch (error: any) {
        logger.error('Error getting contrat:', { error: error instanceof Error ? error.message : String(error) })
        if (error instanceof Error && error.message === 'Unauthorized') {
            return createErrorResponse('Unauthorized', 401)
        }
        return createErrorResponse('Internal server error', 500)
    }
}

export async function PUT(
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

        const body = await request.json()
        const service = new ContratService(context.cabinetId, user.id, context.isSuperAdmin)
        const data = await service.updateContrat(id, body)

        return createSuccessResponse(data)
    } catch (error: any) {
        logger.error('Error updating contrat:', { error: error instanceof Error ? error.message : String(error) })
        if (error instanceof Error && error.message === 'Unauthorized') {
            return createErrorResponse('Unauthorized', 401)
        }
        if (error instanceof Error && error.message.includes('not found')) {
            return createErrorResponse('Contrat not found', 404)
        }
        return createErrorResponse('Internal server error', 500)
    }
}

export async function DELETE(
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

        const service = new ContratService(context.cabinetId, user.id, context.isSuperAdmin)
        await service.deleteContrat(id)

        return createSuccessResponse({ success: true })
    } catch (error: any) {
        logger.error('Error deleting contrat:', { error: error instanceof Error ? error.message : String(error) })
        if (error instanceof Error && error.message === 'Unauthorized') {
            return createErrorResponse('Unauthorized', 401)
        }
        return createErrorResponse('Internal server error', 500)
    }
}
