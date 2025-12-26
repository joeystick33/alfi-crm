 
import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { ContratService } from '@/app/_common/lib/services/contrat-service'

export async function GET(request: NextRequest) {
    try {
        const context = await requireAuth(request)
        const { user } = context
        const searchParams = request.nextUrl.searchParams

        if (!isRegularUser(user)) {
            return createErrorResponse('Invalid user type', 400)
        }

        const service = new ContratService(context.cabinetId, user.id, context.isSuperAdmin)

        const filters = {
            type: searchParams.get('type') as any || undefined,
            status: searchParams.get('status') as any || undefined,
            search: searchParams.get('search') || undefined,
            clientId: searchParams.get('clientId') || undefined,
        }

        const data = await service.listContratsWithClients(filters)
        return createSuccessResponse(data)
    } catch (error: any) {
        console.error('Error listing contrats:', error)
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
        const service = new ContratService(context.cabinetId, user.id, context.isSuperAdmin)

        const data = await service.createContrat(body)
        return createSuccessResponse(data)
    } catch (error: any) {
        console.error('Error creating contrat:', error)
        if (error instanceof Error && error.message === 'Unauthorized') {
            return createErrorResponse('Unauthorized', 401)
        }
        return createErrorResponse('Internal server error', 500)
    }
}
