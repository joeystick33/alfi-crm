 
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { DocumentTemplateService } from '@/app/_common/lib/services/document-template-service'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { logger } from '@/app/_common/lib/logger'
const UpdateTemplateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  type: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  fileUrl: z.string().url().optional(),
  variables: z.record(z.string(), z.any()).optional(),
  isActive: z.boolean().optional(),
})

/**
 * GET /api/advisor/documents/templates/[id]
 * Retrieves a single template by ID
 */
export async function GET(
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

    const templateService = new DocumentTemplateService(
      context.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    const template = await templateService.getTemplateById(templateId)

    return createSuccessResponse(template)
  } catch (error: any) {
    logger.error('Error in GET /api/advisor/documents/templates/[id]:', { error: error instanceof Error ? error.message : String(error) })
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error) {
      return createErrorResponse(error.message, 404)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}

/**
 * PATCH /api/advisor/documents/templates/[id]
 * Updates a template
 */
export async function PATCH(
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
    const validatedData = UpdateTemplateSchema.parse(body)

    const templateService = new DocumentTemplateService(
      context.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    const template = await templateService.updateTemplate(templateId, {
      name: validatedData.name,
      description: validatedData.description,
      type: validatedData.type as any,
      category: validatedData.category as any,
      tags: validatedData.tags,
      fileUrl: validatedData.fileUrl,
      variables: validatedData.variables,
      isActive: validatedData.isActive,
    })

    return createSuccessResponse(template)
  } catch (error: any) {
    logger.error('Error in PATCH /api/advisor/documents/templates/[id]:', { error: error instanceof Error ? error.message : String(error) })
    
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
 * DELETE /api/advisor/documents/templates/[id]
 * Deletes a template
 */
export async function DELETE(
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

    const templateService = new DocumentTemplateService(
      context.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    await templateService.deleteTemplate(templateId)

    return createSuccessResponse({ success: true })
  } catch (error: any) {
    logger.error('Error in DELETE /api/advisor/documents/templates/[id]:', { error: error instanceof Error ? error.message : String(error) })
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error) {
      return createErrorResponse(error.message, 400)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
