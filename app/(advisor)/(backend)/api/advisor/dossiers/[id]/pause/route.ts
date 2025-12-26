import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { DossierService } from '@/app/_common/lib/services/dossier-service'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const context = await requireAuth(request)
    const { id } = await params
    if (!isRegularUser(context.user)) return createErrorResponse('Invalid user type', 400)
    const service = new DossierService(context.cabinetId, context.user.id, context.isSuperAdmin)
    const dossier = await service.pauseDossier(id)
    return createSuccessResponse({ ...dossier, message: 'Dossier mis en attente' })
  } catch (error) {
    if (error instanceof Error) return createErrorResponse(error.message, 400)
    return createErrorResponse('Internal server error', 500)
  }
}
