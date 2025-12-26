/**
 * API Route: Compliance Check
 * 
 * Vérifie la conformité d'un client pour les opérations
 * 
 * @module app/api/v1/compliance/check/route
 * @requirements 25.1-25.3
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import {
  checkClientCompliance,
  getSuggestedCorrectiveActions,
} from '@/lib/operations/services/compliance-check-service'

/**
 * GET /api/v1/compliance/check
 * 
 * Vérifie la conformité d'un client
 * 
 * Query params:
 * - clientId: ID du client à vérifier
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.cabinetId) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')

    if (!clientId) {
      return NextResponse.json(
        { error: 'clientId est requis' },
        { status: 400 }
      )
    }

    // Check compliance
    const complianceResult = await checkClientCompliance(
      session.user.cabinetId,
      clientId
    )

    if (!complianceResult.success || !complianceResult.data) {
      return NextResponse.json(
        { error: complianceResult.error || 'Erreur lors de la vérification' },
        { status: 500 }
      )
    }

    // Get corrective actions if not compliant
    let correctiveActions: { action: string; url: string; priority: 'HIGH' | 'MEDIUM' | 'LOW' }[] = []
    
    if (!complianceResult.data.isCompliant) {
      const actionsResult = await getSuggestedCorrectiveActions(
        session.user.cabinetId,
        clientId
      )
      
      if (actionsResult.success && actionsResult.data) {
        correctiveActions = actionsResult.data
      }
    }

    return NextResponse.json({
      data: {
        ...complianceResult.data,
        correctiveActions,
      },
    })
  } catch (error) {
    console.error('Error checking compliance:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
