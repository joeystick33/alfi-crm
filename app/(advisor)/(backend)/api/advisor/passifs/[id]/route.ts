 
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { PassifService } from '@/app/_common/lib/services/passif-service'
import { PassifType } from '@prisma/client'

const updatePassifSchema = z.object({
    name: z.string().min(1).optional(),
    type: z.nativeEnum(PassifType).optional(),
    description: z.string().optional().nullable(),
    initialAmount: z.number().positive().optional(),
    remainingAmount: z.number().min(0).optional(),
    interestRate: z.number().min(0).max(100).optional(),
    monthlyPayment: z.number().positive().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    linkedActifId: z.string().optional().nullable(),
    insurance: z.any().optional(),
})

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

        const service = new PassifService(context.cabinetId, user.id, context.isSuperAdmin)
        const data = await service.getPassifById(id)

        if (!data) {
            return createErrorResponse('Passif not found', 404)
        }

        return createSuccessResponse(data)
    } catch (error: any) {
        console.error('Error getting passif:', error)
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
        const validatedData = updatePassifSchema.parse(body)

        // Convert string dates to Date objects if present
        const updateData: any = {
            ...validatedData,
            startDate: validatedData.startDate ? new Date(validatedData.startDate) : undefined,
            endDate: validatedData.endDate ? new Date(validatedData.endDate) : undefined,
        }

        const service = new PassifService(context.cabinetId, user.id, context.isSuperAdmin)
        const data = await service.updatePassif(id, updateData)

        return createSuccessResponse(data)
    } catch (error: any) {
        console.error('Error updating passif:', error)
        if (error instanceof z.ZodError) {
            return createErrorResponse('Validation error: ' + error.message, 400)
        }
        if (error instanceof Error && error.message === 'Unauthorized') {
            return createErrorResponse('Unauthorized', 401)
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

        const service = new PassifService(context.cabinetId, user.id, context.isSuperAdmin)
        await service.deletePassif(id)

        return createSuccessResponse({ success: true })
    } catch (error: any) {
        console.error('Error deleting passif:', error)
        if (error instanceof Error && error.message === 'Unauthorized') {
            return createErrorResponse('Unauthorized', 401)
        }
        return createErrorResponse('Internal server error', 500)
    }
}
