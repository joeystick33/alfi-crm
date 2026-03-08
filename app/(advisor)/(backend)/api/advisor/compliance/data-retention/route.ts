import { NextRequest } from 'next/server'
import { requireAuth, createSuccessResponse, createErrorResponse } from '@/app/_common/lib/auth-helpers'
import { DataRetentionService } from '@/app/_common/lib/services/data-retention-service'

/**
 * GET /api/advisor/compliance/data-retention
 * Récupère les politiques de rétention + audit
 * ?audit=true → rapport d'audit des données expirées
 * ?obligations=true → résumé des obligations légales
 */
export async function GET(request: NextRequest) {
  try {
    const { cabinetId } = await requireAuth(request)
    if (!cabinetId) return createErrorResponse('Cabinet non trouvé', 403)

    const { searchParams } = new URL(request.url)
    const audit = searchParams.get('audit')
    const obligations = searchParams.get('obligations')

    if (obligations === 'true') {
      return createSuccessResponse(DataRetentionService.getObligationsSummary())
    }

    if (audit === 'true') {
      const auditResult = await DataRetentionService.auditRetention(cabinetId)
      return createSuccessResponse(auditResult)
    }

    const policies = await DataRetentionService.getPolicies(cabinetId)
    return createSuccessResponse(policies)
  } catch (error: any) {
    return createErrorResponse(error.message || 'Erreur politiques de rétention', 500)
  }
}

/**
 * POST /api/advisor/compliance/data-retention/init
 * Initialise les politiques par défaut pour le cabinet
 */
export async function POST(request: NextRequest) {
  try {
    const { cabinetId } = await requireAuth(request)
    if (!cabinetId) return createErrorResponse('Cabinet non trouvé', 403)

    const result = await DataRetentionService.initializeDefaultPolicies(cabinetId)
    return createSuccessResponse(result)
  } catch (error: any) {
    return createErrorResponse(error.message || 'Erreur initialisation politiques', 500)
  }
}
