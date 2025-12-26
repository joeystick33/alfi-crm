 
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { SignatureService } from '@/app/_common/lib/services/signature-service'
import { isRegularUser } from '@/app/_common/lib/auth-types'

const SignatureStepSchema = z.object({
  signerEmail: z.string().email(),
  signerName: z.string(),
  signerRole: z.string().optional(),
  signatureType: z.enum(['ELECTRONIC', 'ADVANCED', 'QUALIFIEE']).optional(),
  expiresAt: z.string().datetime().optional(),
})

const InitiateSignatureSchema = z.object({
  documentId: z.string(),
  steps: z.array(SignatureStepSchema).min(1),
  provider: z.enum(['YOUSIGN', 'DOCUSIGN', 'UNIVERSIGN', 'INTERNE', 'AUTRE']),
  providerId: z.string().optional(),
})

/**
 * POST /api/advisor/documents/signatures
 * Initiates a signature workflow for a document
 */
export async function POST(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const body = await request.json()
    const validatedData = InitiateSignatureSchema.parse(body)

    const signatureService = new SignatureService(
      context.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    // Convert expiresAt strings to Date objects
    const steps = validatedData.steps.map(step => ({
      ...step,
      expiresAt: step.expiresAt ? new Date(step.expiresAt) : undefined,
    }))

    const workflow = await signatureService.initiateSignature({
      documentId: validatedData.documentId,
      steps,
      provider: validatedData.provider as any,
      providerId: validatedData.providerId,
    })

    return createSuccessResponse(workflow, 201)
  } catch (error: any) {
    console.error('Error in POST /api/advisor/documents/signatures:', error)
    
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

/**
 * GET /api/advisor/documents/signatures?documentId=xxx
 * Retrieves signature steps for a document
 */
export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('documentId')

    if (!documentId) {
      return createErrorResponse('documentId is required', 400)
    }

    const signatureService = new SignatureService(
      context.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    const steps = await signatureService.getSignatureSteps(documentId)

    return createSuccessResponse(steps)
  } catch (error: any) {
    console.error('Error in GET /api/advisor/documents/signatures:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error) {
      return createErrorResponse(error.message, 400)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
