import { getPrismaClient } from '../prisma'
import { DocumentType, DocumentCategory } from '@prisma/client'

export interface CreateTemplateInput {
  name: string
  description?: string
  type: DocumentType
  category?: DocumentCategory
  tags?: string[]
  fileUrl?: string
  variables?: Record<string, unknown>
}

export interface UpdateTemplateInput {
  name?: string
  description?: string
  type?: DocumentType
  category?: DocumentCategory
  tags?: string[]
  fileUrl?: string
  variables?: Record<string, unknown>
  isActive?: boolean
}

export interface GenerateFromTemplateInput {
  templateId: string
  variableValues: Record<string, unknown>
  documentName?: string
  clientId?: string
}

/**
 * Document Template Service
 * 
 * Manages reusable document templates with variable substitution.
 * Enables rapid document generation from predefined templates.
 * 
 * Features:
 * - Template CRUD operations
 * - Variable definition and validation
 * - Document generation from templates
 * - Template versioning support
 * - Usage statistics tracking
 * - Template activation/deactivation
 * 
 * @example
 * const service = new DocumentTemplateService(cabinetId, userId)
 * const template = await service.createTemplate({
 *   name: 'Contrat de gestion',
 *   type: 'CONTRAT',
 *   variables: {
 *     clientName: { type: 'string', required: true },
 *     startDate: { type: 'date', required: true },
 *     fees: { type: 'number', required: true }
 *   }
 * })
 */
export class DocumentTemplateService {
  private prisma
  
  constructor(
    private cabinetId: string,
    private userId: string,
    private isSuperAdmin: boolean = false
  ) {
    this.prisma = getPrismaClient(cabinetId, isSuperAdmin)
  }

  /**
   * Creates a new document template
   * 
   * Templates can include variable placeholders for dynamic content generation.
   * Variables are defined with types and validation rules.
   * 
   * @param data - Template creation data
   * @returns Created template entity
   */
  async createTemplate(data: CreateTemplateInput) {
    const template = await this.prisma.documentTemplate.create({
      data: {
        cabinetId: this.cabinetId,
        createdById: this.userId,
        name: data.name,
        description: data.description,
        type: data.type,
        category: data.category,
        tags: data.tags || [],
        fileUrl: data.fileUrl,
        variables: data.variables || {},
        isActive: true,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    return template
  }

  /**
   * Retrieves a template by ID
   * 
   * @param id - Template ID
   * @returns Template entity with creator info
   * @throws Error if template not found or access denied
   */
  async getTemplateById(id: string) {
    const template = await this.prisma.documentTemplate.findFirst({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            documents: true,
          },
        },
      },
    })

    if (!template) {
      throw new Error('Template not found or access denied')
    }

    return template
  }

  /**
   * Lists all templates with filtering
   * 
   * Supports filtering by type, category, active status, and search terms.
   * Returns templates ordered by creation date (newest first).
   * 
   * @param filters - Optional filter criteria
   * @returns Array of template entities
   */
  async listTemplates(filters?: {
    type?: DocumentType
    category?: DocumentCategory
    isActive?: boolean
    search?: string
    tags?: string[]
  }) {
    const where: Record<string, unknown> = {
      cabinetId: this.cabinetId,
    }

    if (filters?.type) {
      where.type = filters.type
    }

    if (filters?.category) {
      where.category = filters.category
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    const templates = await this.prisma.documentTemplate.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            documents: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return templates
  }

  /**
   * Updates a template
   * 
   * Allows modification of all template properties except creation metadata.
   * 
   * @param id - Template ID
   * @param data - Partial update data
   * @returns Updated template entity
   * @throws Error if template not found or access denied
   */
  async updateTemplate(id: string, data: UpdateTemplateInput) {
    const { count } = await this.prisma.documentTemplate.updateMany({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    })

    if (count === 0) {
      throw new Error('Template not found or access denied')
    }

    return this.getTemplateById(id)
  }

  /**
   * Deletes a template
   * 
   * Note: This will not delete documents created from this template.
   * 
   * @param id - Template ID
   * @returns Success indicator
   * @throws Error if template not found or access denied
   */
  async deleteTemplate(id: string) {
    const { count } = await this.prisma.documentTemplate.deleteMany({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
    })

    if (count === 0) {
      throw new Error('Template not found or access denied')
    }

    return { success: true }
  }

  /**
   * Activates or deactivates a template
   * 
   * Inactive templates are hidden from template selection but remain accessible.
   * 
   * @param id - Template ID
   * @param isActive - New active status
   * @returns Updated template entity
   */
  async setTemplateActive(id: string, isActive: boolean) {
    return this.updateTemplate(id, { isActive })
  }

  /**
   * Generates a document from a template
   * 
   * Creates a new document by applying variable values to the template.
   * Validates that all required variables are provided.
   * 
   * @param data - Generation data with template ID and variable values
   * @returns Created document entity
   * @throws Error if template not found, variables invalid, or generation fails
   */
  async generateFromTemplate(data: GenerateFromTemplateInput) {
    // Get the template
    const template = await this.getTemplateById(data.templateId)

    if (!template.isActive) {
      throw new Error('Template is not active')
    }

    // Validate variables
     
    const templateVars = (template.variables as any) || {}
    const providedVars = data.variableValues

    // Check required variables
    for (const [varName, varDef] of Object.entries(templateVars)) {
       
      const def = varDef as any
      if (def.required && !providedVars[varName]) {
        throw new Error(`Required variable '${varName}' is missing`)
      }
    }

    // Generate document name
    const documentName = data.documentName || this.generateDocumentName(template.name, providedVars)

    // In a real implementation, this would:
    // 1. Load the template file
    // 2. Replace variables with values
    // 3. Generate a new file (PDF, DOCX, etc.)
    // 4. Upload to storage
    // For now, we create a document record pointing to the template

    const document = await this.prisma.document.create({
      data: {
        cabinetId: this.cabinetId,
        uploadedById: this.userId,
        templateId: template.id,
        name: documentName,
        description: `Generated from template: ${template.name}`,
        fileUrl: template.fileUrl || '',
        fileSize: 0, // Would be set after generation
        mimeType: 'application/pdf', // Would depend on template type
        type: template.type,
        category: template.category,
        tags: template.tags as string[],
        metadata: {
          generatedFromTemplate: true,
          templateId: template.id,
          templateName: template.name,
          variableValues: providedVars,
          generatedAt: new Date().toISOString(),
        },
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    // Link to client if provided
    if (data.clientId) {
      await this.prisma.clientDocument.create({
        data: {
          clientId: data.clientId,
          documentId: document.id,
        },
      })

      // Create timeline event
      await this.prisma.timelineEvent.create({
        data: {
          cabinetId: this.cabinetId,
          clientId: data.clientId,
          type: 'AUTRE',
          title: 'Document généré',
          description: `${documentName} généré depuis le template ${template.name}`,
          relatedEntityType: 'Document',
          relatedEntityId: document.id,
          createdBy: this.userId,
        },
      })
    }

    return document
  }

  /**
   * Generates a document name from template and variables
   * 
   * Creates a descriptive name using template name and key variable values.
   * 
   * @param templateName - Base template name
   * @param variables - Variable values
   * @returns Generated document name
   * @private
   */
  private generateDocumentName(templateName: string, variables: Record<string, unknown>): string {
    const timestamp = new Date().toISOString().split('T')[0]
    const clientName = variables.clientName || variables.client || ''
    
    if (clientName) {
      return `${templateName} - ${clientName} - ${timestamp}`
    }
    
    return `${templateName} - ${timestamp}`
  }

  /**
   * Duplicates a template
   * 
   * Creates a copy of an existing template with a new name.
   * Useful for creating variations of templates.
   * 
   * @param id - Template ID to duplicate
   * @param newName - Name for the duplicated template
   * @returns New template entity
   * @throws Error if source template not found
   */
  async duplicateTemplate(id: string, newName?: string) {
    const source = await this.getTemplateById(id)

    const duplicate = await this.prisma.documentTemplate.create({
      data: {
        cabinetId: this.cabinetId,
        createdById: this.userId,
        name: newName || `${source.name} (copie)`,
        description: source.description,
        type: source.type,
        category: source.category,
        tags: source.tags as any,
        fileUrl: source.fileUrl,
        variables: source.variables as Record<string, unknown>,
        isActive: false, // Start as inactive
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    return duplicate
  }

  /**
   * Retrieves template usage statistics
   * 
   * Calculates how many documents have been generated from each template.
   * 
   * @returns Statistics with template usage counts
   */
  async getTemplateStats() {
    const templates = await this.prisma.documentTemplate.findMany({
      where: { cabinetId: this.cabinetId },
      include: {
        _count: {
          select: {
            documents: true,
          },
        },
      },
    })

    const totalTemplates = templates.length
    const activeTemplates = templates.filter(t => t.isActive).length
    const totalDocumentsGenerated = templates.reduce((sum, t) => sum + t._count.documents, 0)

    const byType = templates.reduce((acc, t) => {
      if (!acc[t.type]) {
        acc[t.type] = 0
      }
      acc[t.type]++
      return acc
    }, {} as Record<string, number>)

    const mostUsed = templates
      .sort((a, b) => b._count.documents - a._count.documents)
      .slice(0, 5)
      .map(t => ({
        id: t.id,
        name: t.name,
        type: t.type,
        usageCount: t._count.documents,
      }))

    return {
      totalTemplates,
      activeTemplates,
      inactiveTemplates: totalTemplates - activeTemplates,
      totalDocumentsGenerated,
      byType,
      mostUsed,
    }
  }

  /**
   * Retrieves documents generated from a template
   * 
   * Lists all documents that were created using this template.
   * 
   * @param templateId - Template ID
   * @param limit - Maximum number of documents to return
   * @returns Array of document entities
   */
  async getTemplateDocuments(templateId: string, limit: number = 50) {
    const documents = await this.prisma.document.findMany({
      where: {
        templateId,
        cabinetId: this.cabinetId,
      },
      take: limit,
      include: {
        uploadedBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        clients: {
          include: {
            client: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return documents
  }

  /**
   * Validates template variables
   * 
   * Checks if provided variable values match the template's variable definitions.
   * 
   * @param templateId - Template ID
   * @param variableValues - Variable values to validate
   * @returns Validation result with errors if any
   */
  async validateVariables(
    templateId: string,
    variableValues: Record<string, any>
  ): Promise<{
    valid: boolean
    errors: string[]
  }> {
    const template = await this.getTemplateById(templateId)
    const templateVars = (template.variables as any) || {}
    const errors: string[] = []

    // Check required variables
    for (const [varName, varDef] of Object.entries(templateVars)) {
      const def = varDef as any
      const value = variableValues[varName]

      if (def.required && (value === undefined || value === null || value === '')) {
        errors.push(`Variable '${varName}' is required`)
        continue
      }

      // Type validation
      if (value !== undefined && value !== null && def.type) {
        const actualType = typeof value
        const expectedType = def.type

        if (expectedType === 'number' && actualType !== 'number') {
          errors.push(`Variable '${varName}' must be a number`)
        } else if (expectedType === 'string' && actualType !== 'string') {
          errors.push(`Variable '${varName}' must be a string`)
        } else if (expectedType === 'boolean' && actualType !== 'boolean') {
          errors.push(`Variable '${varName}' must be a boolean`)
        } else if (expectedType === 'date') {
          const date = new Date(value)
          if (isNaN(date.getTime())) {
            errors.push(`Variable '${varName}' must be a valid date`)
          }
        }
      }

      // Pattern validation
      if (value && def.pattern) {
        const regex = new RegExp(def.pattern)
        if (!regex.test(String(value))) {
          errors.push(`Variable '${varName}' does not match required pattern`)
        }
      }

      // Min/Max validation for numbers
      if (typeof value === 'number') {
        if (def.min !== undefined && value < def.min) {
          errors.push(`Variable '${varName}' must be at least ${def.min}`)
        }
        if (def.max !== undefined && value > def.max) {
          errors.push(`Variable '${varName}' must be at most ${def.max}`)
        }
      }

      // Length validation for strings
      if (typeof value === 'string') {
        if (def.minLength !== undefined && value.length < def.minLength) {
          errors.push(`Variable '${varName}' must be at least ${def.minLength} characters`)
        }
        if (def.maxLength !== undefined && value.length > def.maxLength) {
          errors.push(`Variable '${varName}' must be at most ${def.maxLength} characters`)
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }
}
