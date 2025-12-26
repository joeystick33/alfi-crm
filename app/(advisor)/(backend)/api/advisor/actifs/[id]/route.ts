 
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { ActifService } from '@/app/_common/lib/services/actif-service'
import { ActifType, ActifCategory } from '@prisma/client'

const updateActifSchema = z.object({
    name: z.string().min(1).optional(),
    type: z.nativeEnum(ActifType).optional(),
    category: z.nativeEnum(ActifCategory).optional(),
    value: z.number().positive().optional(),
    acquisitionDate: z.string().optional().nullable(),
    acquisitionValue: z.number().optional().nullable(),
    description: z.string().optional().nullable(),
    managedByFirm: z.boolean().optional(),
    managementFees: z.number().optional().nullable(),
    annualIncome: z.number().optional().nullable(),
    details: z.any().optional(),
    taxDetails: z.any().optional(),
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

        const service = new ActifService(context.cabinetId, user.id, context.isSuperAdmin)
        const data = await service.getActifById(id, true)

        if (!data) {
            return createErrorResponse('Actif not found', 404)
        }

        return createSuccessResponse(data)
    } catch (error: any) {
        console.error('Error getting actif:', error)
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
        const validatedData = updateActifSchema.parse(body)

        // Convert string dates to Date objects if present
        const updateData: any = {
            ...validatedData,
            acquisitionDate: validatedData.acquisitionDate ? new Date(validatedData.acquisitionDate) : undefined,
        }

        const service = new ActifService(context.cabinetId, user.id, context.isSuperAdmin)
        const data = await service.updateActif(id, updateData)

        return createSuccessResponse(data)
    } catch (error: any) {
        console.error('Error updating actif:', error)
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

        const service = new ActifService(context.cabinetId, user.id, context.isSuperAdmin)
        await service.deleteActif(id)

        return createSuccessResponse({ success: true })
    } catch (error: any) {
        console.error('Error deleting actif:', error)
        if (error instanceof Error && error.message === 'Unauthorized') {
            return createErrorResponse('Unauthorized', 401)
        }
        return createErrorResponse('Internal server error', 500)
    }
}
