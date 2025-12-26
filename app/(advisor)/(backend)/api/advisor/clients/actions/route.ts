 
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { CommercialActionService } from '@/app/_common/lib/services/commercial-action-service'

const createActionSchema = z.object({
  title: z.string().min(1),
  objective: z.string().optional(),
  segmentKey: z.string().optional(),
  segmentLabel: z.string().optional(),
  channels: z.array(z.string()).optional(),
  scheduledAt: z.string().datetime().optional(),
  notes: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request); const { user } = context

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const service = new CommercialActionService(context.cabinetId, user.id, context.isSuperAdmin)

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const actions = await service.getActions({
      status: status as any || undefined
    })

    return createSuccessResponse(actions)
  } catch (error: any) {
    console.error('Error fetching commercial actions:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }

    return createErrorResponse('Erreur lors de la récupération des actions', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const context = await requireAuth(request); const { user } = context

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const service = new CommercialActionService(context.cabinetId, user.id, context.isSuperAdmin)

    const body = await request.json()
    const data = createActionSchema.parse(body)

    const action = await service.createAction(data)

    return createSuccessResponse(action, 201)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return createErrorResponse('Données invalides', 400)
    }

    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }

    console.error('Error creating commercial action:', error)
    return createErrorResponse('Erreur lors de la création de l\'action', 500)
  }
}
