/**
 * API Route: /api/advisor/clients/[id]/opportunities
 * GET - Retrieves opportunities with objective matching for a client
 * 
 * **Feature: client360-evolution**
 * **Validates: Requirements 12.1, 12.3**
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import { OpportunitiesDataService } from '@/app/_common/lib/services/opportunities-data-service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { user, cabinetId, isSuperAdmin } = context

    const { id: clientId } = await params

    const service = new OpportunitiesDataService(cabinetId, user.id, isSuperAdmin)
    const data = await service.getOpportunitiesData(clientId)

    return NextResponse.json({
      success: true,
      data: {
        opportunities: data.opportunities,
        matchedObjectives: data.matchedObjectives,
      },
      stats: data.stats,
    })
  } catch (error) {
    console.error('Error fetching opportunities:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des opportunités' },
      { status: 500 }
    )
  }
}
