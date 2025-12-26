import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { getPrismaClient } from '@/app/_common/lib/prisma'
import { 
  calculateOverviewData 
} from '@/app/_common/lib/services/overview-service'

/**
 * GET /api/advisor/clients/[id]/overview
 * Returns aggregated overview data for Client 360 Vue d'ensemble tab
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { user, cabinetId, isSuperAdmin } = context

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const { id } = await params
    const prisma = getPrismaClient(cabinetId, isSuperAdmin)

    // Verify client exists and belongs to cabinet
    const client = await prisma.client.findFirst({
      where: { id, cabinetId },
      include: {
        actifs: {
          include: { actif: true }
        },
        passifs: true,
        contrats: true,
        objectifs: {
          where: { status: 'ACTIF' },
          orderBy: { priority: 'desc' },
          take: 5
        },
        documents: {
          include: { document: true },
          where: {
            document: {
              OR: [
                { expiresAt: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } },
                { expiresAt: null }
              ]
            }
          }
        },
        timelineEvents: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    })

    if (!client) {
      return createErrorResponse('Client not found', 404)
    }

    // Calculate overview data
    const overviewData = await calculateOverviewData(client, prisma, cabinetId)

    return createSuccessResponse(overviewData)
  } catch (error) {
    console.error('Get client overview error:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }

    return createErrorResponse('Internal server error', 500)
  }
}
