import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { ActifService } from '@/app/_common/lib/services/actif-service'
import { logger } from '@/app/_common/lib/logger'

const createActifSchema = z.object({
  clientId: z.string().min(1).optional(),
  ownershipPercentage: z.number().min(0).max(100).optional(),
  ownershipType: z.string().optional(),
  type: z.string().min(1, 'Le type d\'actif est requis'),
  category: z.string().min(1, 'La catégorie est requise'),
  name: z.string().min(1, 'Le nom est requis'),
  description: z.string().optional(),
  value: z.number().min(0, 'La valeur doit être positive'),
  acquisitionDate: z.string().datetime().optional().nullable(),
  acquisitionValue: z.number().min(0).optional().nullable(),
  details: z.any().optional().nullable(),
  annualIncome: z.number().optional().nullable(),
  managedByFirm: z.boolean().optional(),
  currency: z.string().default('EUR'),
}).passthrough()

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
        logger.error('Error listing actifs', { module: 'ActifAPI', action: 'LIST', metadata: { error: error.message } } as any)
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
        const parsed = createActifSchema.safeParse(body)
        if (!parsed.success) {
            return createErrorResponse(
                'Données invalides: ' + parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', '),
                400
            )
        }

        const service = new ActifService(context.cabinetId, user.id, context.isSuperAdmin)

        // Check if we are creating for a specific client
        if (parsed.data.clientId) {
            const { clientId, ownershipPercentage, ownershipType, ...actifData } = parsed.data
            const data = await service.createActifForClient(clientId, actifData as any, ownershipPercentage, ownershipType)
            return createSuccessResponse(data)
        } else {
            const data = await service.createActif(parsed.data as any)
            return createSuccessResponse(data)
        }
    } catch (error: any) {
        logger.error('Error creating actif', { module: 'ActifAPI', action: 'CREATE', metadata: { error: error.message } } as any)
        if (error instanceof Error && error.message === 'Unauthorized') {
            return createErrorResponse('Unauthorized', 401)
        }
        return createErrorResponse('Internal server error', 500)
    }
}
