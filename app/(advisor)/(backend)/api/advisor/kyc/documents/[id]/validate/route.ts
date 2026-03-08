import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, createErrorResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'


import { KYCService } from '@/app/_common/lib/services/kyc-service'
import { z } from 'zod'
import { logger } from '@/app/_common/lib/logger'
// Schéma de validation
const validateKYCDocumentSchema = z.object({
  status: z.enum(['VALIDE', 'REJETE']),
  rejectionReason: z.string().optional(),
})

/**
 * POST /api/advisor/kyc/documents/[id]/validate
 * Valide ou rejette un document KYC
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(req)
    const { user } = context
    const { id: kycDocumentId } = await params
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const body = await req.json()
    const validatedData = validateKYCDocumentSchema.parse(body)

    const service = new KYCService(
      context.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    const document = await service.validateKYCDocument({
      kycDocumentId,
      status: validatedData.status,
      validatedById: user.id,
      rejectionReason: validatedData.rejectionReason,
    })

    return NextResponse.json(document)
  } catch (error) {
    logger.error('Error validating KYC document:', { error: error instanceof Error ? error.message : String(error) })
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
