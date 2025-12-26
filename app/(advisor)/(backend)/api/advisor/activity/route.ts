import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { TimelineService } from '@/app/_common/lib/services/timeline-service'
import { TimelineEventType } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const { user, cabinetId, isSuperAdmin } = await requireAuth(request)

    if (!isRegularUser(user) || !cabinetId) {
      return createErrorResponse('Invalid user type', 400)
    }

    const { searchParams } = new URL(request.url)
    
    // Parser les query params
    const limit = parseInt(searchParams.get('limit') || '200', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)
    const sortBy = searchParams.get('sortBy') as 'createdAt' | 'type' | 'impact' | null
    const sortOrder = searchParams.get('sortOrder') as 'asc' | 'desc' | null
    const createdBy = searchParams.get('createdBy') || undefined
    
    // Parser le filtre de type (peut être multiple: type=A&type=B ou type=A,B)
    const typeParams = searchParams.getAll('type')
    let types: TimelineEventType[] | undefined
    if (typeParams.length > 0) {
      // Support format: ?type=A&type=B ou ?type=A,B
      const allTypes = typeParams.flatMap(t => t.split(','))
      types = allTypes.filter(t => 
        Object.values(TimelineEventType).includes(t as TimelineEventType)
      ) as TimelineEventType[]
    }
    
    // Parser les dates (format ISO 8601)
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')
    
    let startDate: Date | undefined
    let endDate: Date | undefined
    
    if (startDateParam) {
      const parsed = new Date(startDateParam)
      if (!isNaN(parsed.getTime())) {
        startDate = parsed
      }
    }
    
    if (endDateParam) {
      const parsed = new Date(endDateParam)
      if (!isNaN(parsed.getTime())) {
        endDate = parsed
      }
    }

    const service = new TimelineService(cabinetId, user.id, isSuperAdmin)
    const result = await service.getRecentActivity({
      limit,
      offset,
      type: types && types.length > 0 ? types : undefined,
      startDate,
      endDate,
      createdBy,
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder || 'desc',
    })

    return createSuccessResponse(result)
  } catch (error) {
    console.error('Error fetching advisor activity:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }

    return createErrorResponse('Internal server error', 500)
  }
}
