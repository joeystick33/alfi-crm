/**
 * API Route for Affaires En Cours
 * 
 * GET /api/v1/operations/affaires/en-cours - Get affaires that need attention
 * 
 * @requirements 20.1-20.5
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import { getAffairesEnCours } from '@/lib/operations/services/affaire-service'

/**
 * GET /api/v1/operations/affaires/en-cours
 * Get affaires that are inactive or need attention
 * 
 * @requirements 20.1 - THE Operations_Manager SHALL automatically categorize an Affaire Nouvelle as "En Cours"
 * @requirements 20.2 - THE Operations_Manager SHALL display "Affaires En Cours" in a dedicated dashboard section
 */
export async function GET(request: NextRequest) {
  try {
    const { user, cabinetId } = await requireAuth(request)

    if (!cabinetId) {
      return NextResponse.json(
        { error: 'Cabinet non trouvé' },
        { status: 400 }
      )
    }

    // Parse optional daysInactive parameter
    const { searchParams } = new URL(request.url)
    const daysInactiveParam = searchParams.get('daysInactive')
    const daysInactive = daysInactiveParam ? parseInt(daysInactiveParam, 10) : 7

    if (isNaN(daysInactive) || daysInactive < 1) {
      return NextResponse.json(
        { error: 'Le paramètre daysInactive doit être un nombre positif' },
        { status: 400 }
      )
    }

    const result = await getAffairesEnCours(cabinetId, daysInactive)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: result.data })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    const message = error instanceof Error ? error.message : 'Erreur serveur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
