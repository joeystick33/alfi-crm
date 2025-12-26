import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { DocumentTemplateService } from '@/app/_common/lib/services/document-template-service'
import { isRegularUser } from '@/app/_common/lib/auth-types'

const GenerateDocumentSchema = z.object({
  variableValues: z.record(z.string(), z.any()),
  documentName: z.string().optional(),
  clientId: z.string().optional(),
})

/**
 * POST /api/advisor/documents/templates/[id]/generate
 * Generates a document from a template
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    const { id: templateId } = await params
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const body = await request.json()
    const validatedData = GenerateDocumentSchema.parse(body)

    const templateService = new DocumentTemplateService(
      context.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    const document = await templateService.generateFromTemplate({
      templateId,
      variableValues: validatedData.variableValues,
      documentName: validatedData.documentName,
      clientId: validatedData.clientId,
    })

    return createSuccessResponse(document, 201)
  } catch (error) {
    console.error('Error in POST /api/advisor/documents/templates/[id]/generate:', error)
    
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
