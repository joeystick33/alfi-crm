import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { KYCService } from '@/app/_common/lib/services/kyc-service'
import { z } from 'zod'

// Schéma de validation
const completeKYCCheckSchema = z.object({
  findings: z.string().min(1),
  recommendations: z.string().optional(),
  score: z.number().int().min(0).max(100).optional(),
  riskLevel: z.enum(['BASSE', 'MOYENNE', 'HAUTE', 'CRITIQUE']).optional(),
})

/**
 * POST /api/advisor/kyc/checks/[id]/complete
 * Complète un contrôle KYC
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(req)
    const { user } = context
    const { id: kycCheckId } = await params

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const body = await req.json()
    const validatedData = completeKYCCheckSchema.parse(body)

    const service = new KYCService(
      context.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    const check = await service.completeKYCCheck({
      kycCheckId,
      completedById: user.id,
      findings: validatedData.findings,
      recommendations: validatedData.recommendations,
      score: validatedData.score,
      riskLevel: validatedData.riskLevel,
    })

    return createSuccessResponse(check)
  } catch (error) {
    console.error('Error completing KYC check:', error)
    
    if (error instanceof z.ZodError) {
      return createErrorResponse(`Validation error: ${JSON.stringify(error.issues)}`, 400)
    }

    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }

    return createErrorResponse('Internal server error', 500)
  }
}
