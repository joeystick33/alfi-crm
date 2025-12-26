 
/**
 * API Route: /api/advisor/features
 * 
 * Récupère les features activées pour le cabinet de l'utilisateur connecté
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, createErrorResponse } from '@/app/_common/lib/auth-helpers'
import { createFeatureService } from '@/app/_common/lib/features/feature-service'
import { prisma } from '@/app/_common/lib/prisma'

// =============================================================================
// GET /api/advisor/features
// Récupère les features du cabinet de l'utilisateur
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    
    if (!context.cabinetId) {
      return createErrorResponse('Cabinet non trouvé', 400)
    }
    
    // Récupérer le cabinet pour avoir le plan
    const cabinet = await prisma.cabinet.findUnique({
      where: { id: context.cabinetId },
      select: {
        id: true,
        plan: true,
        features: true,
        status: true,
        quotas: true,
      },
    })
    
    if (!cabinet) {
      return createErrorResponse('Cabinet non trouvé', 404)
    }
    
    // Créer le service et récupérer les features
    const featureService = createFeatureService(context.cabinetId)
    const features = await featureService.getCabinetFeatures()
    const usage = await featureService.getUsageStats()
    
    return NextResponse.json({
      success: true,
      features,
      plan: cabinet.plan,
      status: cabinet.status,
      quotas: cabinet.quotas,
      usage,
    })
  } catch (error: any) {
    console.error('GET /api/advisor/features error:', error)
    
    if (error.message?.includes('Non autorisé') || error.message?.includes('Unauthorized')) {
      return createErrorResponse('Non autorisé', 401)
    }
    
    return createErrorResponse(
      error.message || 'Erreur serveur',
      500
    )
  }
}

// =============================================================================
// POST /api/advisor/features/check
// Vérifie l'accès à une feature spécifique
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    
    if (!context.cabinetId) {
      return createErrorResponse('Cabinet non trouvé', 400)
    }
    
    const body = await request.json()
    const { featureCode, featureCodes } = body
    
    const featureService = createFeatureService(context.cabinetId)
    
    // Vérification de plusieurs features
    if (featureCodes && Array.isArray(featureCodes)) {
      const results = await featureService.checkMultipleFeatures(featureCodes)
      return NextResponse.json({
        success: true,
        features: results,
      })
    }
    
    // Vérification d'une seule feature
    if (featureCode) {
      const result = await featureService.checkFeatureAccess(featureCode)
      return NextResponse.json({
        success: true,
        featureCode,
        ...result,
      })
    }
    
    return createErrorResponse('featureCode ou featureCodes requis', 400)
  } catch (error: any) {
    console.error('POST /api/advisor/features error:', error)
    
    return createErrorResponse(
      error.message || 'Erreur serveur',
      500
    )
  }
}
