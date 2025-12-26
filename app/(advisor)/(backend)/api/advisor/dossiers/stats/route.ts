import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { DossierService } from '@/app/_common/lib/services/dossier-service'

export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    if (!isRegularUser(context.user)) return createErrorResponse('Invalid user type', 400)

    const { searchParams } = new URL(request.url)
    const filters: any = {}
    
    if (searchParams.get('clientId')) filters.clientId = searchParams.get('clientId')!
    if (searchParams.get('conseillerId')) filters.conseillerId = searchParams.get('conseillerId')!
    if (searchParams.get('type')) filters.type = searchParams.get('type')
    if (searchParams.get('isArchive')) filters.isArchive = searchParams.get('isArchive') === 'true'

    const service = new DossierService(context.cabinetId, context.user.id, context.isSuperAdmin)
    const stats = await service.getDossierStats(filters)

    return createSuccessResponse(stats)
  } catch (error) {
    if (error instanceof Error) return createErrorResponse(error.message, 400)
    return createErrorResponse('Internal server error', 500)
  }
}
