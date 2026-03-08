import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { SignatureService } from '@/app/_common/lib/services/signature-service'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { logger } from '@/app/_common/lib/logger'
const UpdateStepSchema = z.object({
  status: z.enum(['EN_ATTENTE', 'EN_COURS', 'SIGNE', 'PARTIELLEMENT_SIGNE', 'REJETEE', 'EXPIRE', 'ANNULE']),
  signedAt: z.string().datetime().optional(),
  signatureData: z.any().optional(),
})

/**
 * PATCH /api/advisor/documents/signatures/[stepId]
 * Updates a signature step status
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { stepId: string } }
) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const body = await request.json()
    const validatedData = UpdateStepSchema.parse(body)

    const signatureService = new SignatureService(
      context.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    const updatedStep = await signatureService.updateSignatureStep(params.stepId, {
      status: validatedData.status as any,
      signedAt: validatedData.signedAt ? new Date(validatedData.signedAt) : undefined,
      signatureData: validatedData.signatureData,
    })

    return createSuccessResponse(updatedStep)
  } catch (error) {
    logger.error('Error in PATCH /api/advisor/documents/signatures/[stepId]:', { error: error instanceof Error ? error.message : String(error) })
    
    if (error instanceof z.ZodError) {
      const details = error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ')
      return createErrorResponse(`Validation error: ${details}`, 400)
    }
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error) {
      return createErrorResponse(error.message, 400)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
