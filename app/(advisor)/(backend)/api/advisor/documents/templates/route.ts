 
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { DocumentTemplateService } from '@/app/_common/lib/services/document-template-service'
import { isRegularUser } from '@/app/_common/lib/auth-types'

const CreateTemplateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.string(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  fileUrl: z.string().url().optional(),
  variables: z.record(z.string(), z.any()).optional(),
})

/**
 * GET /api/advisor/documents/templates
 * Lists document templates with filtering
 */
export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const { searchParams } = new URL(request.url)
    
    const filters: any = {}
    
    if (searchParams.get('type')) {
      filters.type = searchParams.get('type')
    }
    
    if (searchParams.get('category')) {
      filters.category = searchParams.get('category')
    }
    
    if (searchParams.get('isActive')) {
      filters.isActive = searchParams.get('isActive') === 'true'
    }
    
    if (searchParams.get('search')) {
      filters.search = searchParams.get('search')
    }

    const templateService = new DocumentTemplateService(
      context.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    const templates = await templateService.listTemplates(filters)

    return createSuccessResponse(templates)
  } catch (error: any) {
    console.error('Error in GET /api/advisor/documents/templates:', error)
    
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
 * POST /api/advisor/documents/templates
 * Creates a new document template
 */
export async function POST(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const body = await request.json()
    const validatedData = CreateTemplateSchema.parse(body)

    const templateService = new DocumentTemplateService(
      context.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    const template = await templateService.createTemplate({
      name: validatedData.name,
      description: validatedData.description,
      type: validatedData.type as any,
      category: validatedData.category as any,
      tags: validatedData.tags,
      fileUrl: validatedData.fileUrl,
      variables: validatedData.variables,
    })

    return createSuccessResponse(template, 201)
  } catch (error: any) {
    console.error('Error in POST /api/advisor/documents/templates:', error)
    
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
