/**
 * API Route: /api/advisor/clients/[id]/contracts/data
 * Client 360 Contracts Data API
 * Returns contracts by type with summary for TabContrats
 * 
 * Requirements: 9.1, 9.3
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import { ContractsDataService } from '@/app/_common/lib/services/contracts-data-service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { id: clientId } = await params

    const service = new ContractsDataService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    const data = await service.getContratsData(clientId)

    return NextResponse.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Error fetching contracts data:', error)
    
    if (error instanceof Error && error.message === 'Client not found') {
      return NextResponse.json(
        { error: 'Client non trouvé', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Erreur serveur', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
