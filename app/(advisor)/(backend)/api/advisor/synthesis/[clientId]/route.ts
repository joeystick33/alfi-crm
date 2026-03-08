/**
 * API Route: /api/advisor/synthesis/[clientId]
 * 
 * Récupère la synthèse complète d'un client
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, createErrorResponse } from '@/app/_common/lib/auth-helpers'
import { createSynthesisService } from '@/app/_common/lib/services/synthesis-service'
import { logger } from '@/app/_common/lib/logger'
// =============================================================================
// GET /api/advisor/synthesis/[clientId]
// Récupère la synthèse calculée d'un client
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const context = await requireAuth(request)
    
    if (!context.cabinetId) {
      return createErrorResponse('Cabinet non trouvé', 400)
    }
    
    const { clientId } = await params
    
    if (!clientId) {
      return createErrorResponse('ID client requis', 400)
    }
    
    // Calculer la synthèse
    const synthesisService = createSynthesisService(context.cabinetId)
    const synthesis = await synthesisService.calculateSynthesis(clientId)
    
    return NextResponse.json({
      success: true,
      data: synthesis,
    })
  } catch (error: unknown) {
    logger.error('GET /api/advisor/synthesis/[clientId] error:', { error: error instanceof Error ? error.message : String(error) })
    
    const errorMessage = error instanceof Error ? error.message : 'Erreur serveur'
    
    if (errorMessage === 'Client non trouvé') {
      return createErrorResponse('Client non trouvé', 404)
    }
    
    if (errorMessage.includes('Non autorisé')) {
      return createErrorResponse('Non autorisé', 401)
    }
    
    return createErrorResponse(errorMessage, 500)
  }
}

// =============================================================================
// POST /api/advisor/synthesis/[clientId]
// Force le recalcul de la synthèse (refresh)
// =============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const context = await requireAuth(request)
    
    if (!context.cabinetId) {
      return createErrorResponse('Cabinet non trouvé', 400)
    }
    
    const { clientId } = await params
    
    if (!clientId) {
      return createErrorResponse('ID client requis', 400)
    }
    
    // Forcer le recalcul
    const synthesisService = createSynthesisService(context.cabinetId)
    const synthesis = await synthesisService.calculateSynthesis(clientId)
    
    return NextResponse.json({
      success: true,
      message: 'Synthèse recalculée',
      data: synthesis,
    })
  } catch (error: unknown) {
    logger.error('POST /api/advisor/synthesis/[clientId] error:', { error: error instanceof Error ? error.message : String(error) })
    
    const errorMessage = error instanceof Error ? error.message : 'Erreur serveur'
    
    if (errorMessage === 'Client non trouvé') {
      return createErrorResponse('Client non trouvé', 404)
    }
    
    return createErrorResponse(errorMessage, 500)
  }
}
