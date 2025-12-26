/**
 * Service de gestion des templates de documents réglementaires
 * 
 * Ce service gère les templates de documents par association CGP:
 * - Récupération des templates avec filtres
 * - Création et mise à jour de templates
 * - Support des associations (CNCGP, ANACOFI, CNCEF, Generic)
 * 
 * @module lib/documents/services/template-service
 * @requirements 17.1-17.7
 */

import { prisma } from '@/app/_common/lib/prisma'
import {
  type RegulatoryDocumentType,
  type AssociationType,
  type DocumentTemplate,
  type DocumentTemplateContent,
  ASSOCIATION_TYPE_LABELS,
  REGULATORY_DOCUMENT_TYPE_LABELS,
} from '../types'
import {
  createDocumentTemplateSchema,
  updateDocumentTemplateSchema,
  documentTemplateFiltersSchema,
  type CreateDocumentTemplateInput,
  type UpdateDocumentTemplateInput,
  type DocumentTemplateFiltersInput,
} from '../schemas'

// ============================================================================
// Types
// ============================================================================

export interface TemplateServiceResult<T> {
  success: boolean
  data?: T
  error?: string
}

export interface DocumentTemplateWithRelations {
  id: string
  cabinetId: string
  documentType: string
  associationType: string
  providerId: string | null
  name: string
  version: string
  content: DocumentTemplateContent
  mandatorySections: string[]
  customizableSections: string[]
  isActive: boolean
  createdById: string
  createdAt: Date
  updatedAt: Date
  createdBy: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  provider?: {
    id: string
    name: string
  } | null
}

// ============================================================================
// Template Service
// ============================================================================

/**
 * Récupère tous les templates d'un cabinet avec filtres optionnels
 * 
 * @requirements 17.1 - THE Association_Templates SHALL provide pre-configured templates for associations
 * @requirements 17.5 - THE Template_Manager SHALL allow CGPs to customize association templates
 */
export async function getTemplates(
  cabinetId: string,
  filters?: DocumentTemplateFiltersInput
): Promise<TemplateServiceResult<DocumentTemplateWithRelations[]>> {
  try {
    // Build where clause
    const where: Record<string, unknown> = {
      cabinetId,
    }

    if (filters) {
      const validatedFilters = documentTemplateFiltersSchema.parse(filters)

      if (validatedFilters.documentType && validatedFilters.documentType.length > 0) {
        where.documentType = { in: validatedFilters.documentType }
      }

      if (validatedFilters.associationType && validatedFilters.associationType.length > 0) {
        where.associationType = { in: validatedFilters.associationType }
      }

      if (validatedFilters.providerId) {
        where.providerId = validatedFilters.providerId
      }

      if (validatedFilters.isActive !== undefined) {
        where.isActive = validatedFilters.isActive
      }
    }

    const templates = await prisma.regulatoryDocumentTemplate.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        provider: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { documentType: 'asc' },
        { associationType: 'asc' },
        { name: 'asc' },
      ],
    })

    return {
      success: true,
      data: templates.map(t => ({
        ...t,
        content: t.content as unknown as DocumentTemplateContent,
      })) as DocumentTemplateWithRelations[],
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la récupération des templates'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Récupère un template par type de document et association
 * 
 * @requirements 17.2 - WHEN setting up a cabinet, THE Template_Manager SHALL allow selection of the primary association affiliation
 * @requirements 17.4 - WHEN generating a DER, THE Association_Templates SHALL include association-specific sections
 */
export async function getTemplateByType(
  cabinetId: string,
  documentType: RegulatoryDocumentType,
  associationType: AssociationType = 'GENERIC',
  providerId?: string
): Promise<TemplateServiceResult<DocumentTemplateWithRelations>> {
  try {
    // Build where clause - try to find the most specific template
    const where: Record<string, unknown> = {
      cabinetId,
      documentType,
      isActive: true,
    }

    // First try with provider-specific template if providerId is given
    if (providerId) {
      const providerTemplate = await prisma.regulatoryDocumentTemplate.findFirst({
        where: {
          ...where,
          providerId,
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
          provider: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })

      if (providerTemplate) {
        return {
          success: true,
          data: {
            ...providerTemplate,
            content: providerTemplate.content as unknown as DocumentTemplateContent,
          } as DocumentTemplateWithRelations,
        }
      }
    }

    // Then try with association-specific template
    const associationTemplate = await prisma.regulatoryDocumentTemplate.findFirst({
      where: {
        ...where,
        associationType,
        providerId: null,
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
        provider: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (associationTemplate) {
      return {
        success: true,
        data: {
          ...associationTemplate,
          content: associationTemplate.content as unknown as DocumentTemplateContent,
        } as DocumentTemplateWithRelations,
      }
    }

    // Finally, fall back to GENERIC template
    if (associationType !== 'GENERIC') {
      const genericTemplate = await prisma.regulatoryDocumentTemplate.findFirst({
        where: {
          ...where,
          associationType: 'GENERIC',
          providerId: null,
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
          provider: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })

      if (genericTemplate) {
        return {
          success: true,
          data: {
            ...genericTemplate,
            content: genericTemplate.content as unknown as DocumentTemplateContent,
          } as DocumentTemplateWithRelations,
        }
      }
    }

    return {
      success: false,
      error: `Aucun template trouvé pour le type "${REGULATORY_DOCUMENT_TYPE_LABELS[documentType]}" et l'association "${ASSOCIATION_TYPE_LABELS[associationType]}"`,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la récupération du template'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Récupère un template par son ID
 */
export async function getTemplateById(
  templateId: string
): Promise<TemplateServiceResult<DocumentTemplateWithRelations>> {
  try {
    const template = await prisma.regulatoryDocumentTemplate.findUnique({
      where: { id: templateId },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        provider: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!template) {
      return {
        success: false,
        error: 'Template non trouvé',
      }
    }

    return {
      success: true,
      data: {
        ...template,
        content: template.content as unknown as DocumentTemplateContent,
      } as DocumentTemplateWithRelations,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la récupération du template'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Crée un nouveau template de document
 * 
 * @requirements 17.3 - THE Association_Templates SHALL include association-specific document headers, footers, disclaimers
 * @requirements 17.5 - THE Template_Manager SHALL allow CGPs to customize association templates while preserving mandatory sections
 */
export async function createTemplate(
  input: CreateDocumentTemplateInput
): Promise<TemplateServiceResult<DocumentTemplateWithRelations>> {
  try {
    // Validate input
    const validatedInput = createDocumentTemplateSchema.parse(input)

    // Check if a template with the same type/association/provider already exists
    const existingTemplate = await prisma.regulatoryDocumentTemplate.findFirst({
      where: {
        cabinetId: validatedInput.cabinetId,
        documentType: validatedInput.documentType,
        associationType: validatedInput.associationType,
        providerId: validatedInput.providerId ?? null,
        isActive: true,
      },
    })

    if (existingTemplate) {
      return {
        success: false,
        error: `Un template actif existe déjà pour ce type de document et cette association`,
      }
    }

    // Create the template
    const template = await prisma.regulatoryDocumentTemplate.create({
      data: {
        cabinetId: validatedInput.cabinetId,
        documentType: validatedInput.documentType,
        associationType: validatedInput.associationType,
        providerId: validatedInput.providerId ?? null,
        name: validatedInput.name,
        version: validatedInput.version,
        content: validatedInput.content,
        mandatorySections: validatedInput.mandatorySections,
        customizableSections: validatedInput.customizableSections,
        isActive: true,
        createdById: validatedInput.createdById,
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
        provider: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return {
      success: true,
      data: {
        ...template,
        content: template.content as unknown as DocumentTemplateContent,
      } as DocumentTemplateWithRelations,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la création du template'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Met à jour un template existant
 * 
 * @requirements 17.5 - THE Template_Manager SHALL allow CGPs to customize association templates while preserving mandatory sections
 * @requirements 17.7 - THE Association_Templates SHALL be versioned to track regulatory changes over time
 */
export async function updateTemplate(
  templateId: string,
  input: UpdateDocumentTemplateInput
): Promise<TemplateServiceResult<DocumentTemplateWithRelations>> {
  try {
    // Validate input
    const validatedInput = updateDocumentTemplateSchema.parse(input)

    // Check if template exists
    const existingTemplate = await prisma.regulatoryDocumentTemplate.findUnique({
      where: { id: templateId },
    })

    if (!existingTemplate) {
      return {
        success: false,
        error: 'Template non trouvé',
      }
    }

    // Update the template
    const template = await prisma.regulatoryDocumentTemplate.update({
      where: { id: templateId },
      data: {
        ...(validatedInput.documentType && { documentType: validatedInput.documentType }),
        ...(validatedInput.associationType && { associationType: validatedInput.associationType }),
        ...(validatedInput.providerId !== undefined && { providerId: validatedInput.providerId ?? null }),
        ...(validatedInput.name && { name: validatedInput.name }),
        ...(validatedInput.version && { version: validatedInput.version }),
        ...(validatedInput.content && { content: validatedInput.content }),
        ...(validatedInput.mandatorySections && { mandatorySections: validatedInput.mandatorySections }),
        ...(validatedInput.customizableSections && { customizableSections: validatedInput.customizableSections }),
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
        provider: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return {
      success: true,
      data: {
        ...template,
        content: template.content as unknown as DocumentTemplateContent,
      } as DocumentTemplateWithRelations,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la mise à jour du template'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Désactive un template (soft delete)
 * 
 * @requirements 17.7 - THE Association_Templates SHALL be versioned to track regulatory changes over time
 */
export async function deactivateTemplate(
  templateId: string
): Promise<TemplateServiceResult<DocumentTemplateWithRelations>> {
  try {
    // Check if template exists
    const existingTemplate = await prisma.regulatoryDocumentTemplate.findUnique({
      where: { id: templateId },
    })

    if (!existingTemplate) {
      return {
        success: false,
        error: 'Template non trouvé',
      }
    }

    // Deactivate the template
    const template = await prisma.regulatoryDocumentTemplate.update({
      where: { id: templateId },
      data: {
        isActive: false,
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
        provider: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return {
      success: true,
      data: {
        ...template,
        content: template.content as unknown as DocumentTemplateContent,
      } as DocumentTemplateWithRelations,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la désactivation du template'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Duplique un template pour créer une nouvelle version
 * 
 * @requirements 17.7 - THE Association_Templates SHALL be versioned to track regulatory changes over time
 */
export async function duplicateTemplate(
  templateId: string,
  newVersion: string,
  createdById: string
): Promise<TemplateServiceResult<DocumentTemplateWithRelations>> {
  try {
    // Get the original template
    const originalTemplate = await prisma.regulatoryDocumentTemplate.findUnique({
      where: { id: templateId },
    })

    if (!originalTemplate) {
      return {
        success: false,
        error: 'Template original non trouvé',
      }
    }

    // Create a new template based on the original
    const template = await prisma.regulatoryDocumentTemplate.create({
      data: {
        cabinetId: originalTemplate.cabinetId,
        documentType: originalTemplate.documentType,
        associationType: originalTemplate.associationType,
        providerId: originalTemplate.providerId,
        name: `${originalTemplate.name} (v${newVersion})`,
        version: newVersion,
        content: originalTemplate.content as object,
        mandatorySections: originalTemplate.mandatorySections,
        customizableSections: originalTemplate.customizableSections,
        isActive: true,
        createdById,
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
        provider: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return {
      success: true,
      data: {
        ...template,
        content: template.content as unknown as DocumentTemplateContent,
      } as DocumentTemplateWithRelations,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la duplication du template'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Récupère les templates par association
 * 
 * @requirements 17.1 - THE Association_Templates SHALL provide pre-configured templates for CNCGP, ANACOFI, CNCEF, Generic
 */
export async function getTemplatesByAssociation(
  cabinetId: string,
  associationType: AssociationType
): Promise<TemplateServiceResult<DocumentTemplateWithRelations[]>> {
  return getTemplates(cabinetId, {
    associationType: [associationType],
    isActive: true,
  })
}

/**
 * Obtient le label français d'un type d'association
 */
export function getAssociationTypeLabel(associationType: AssociationType): string {
  return ASSOCIATION_TYPE_LABELS[associationType]
}

/**
 * Obtient le label français d'un type de document
 */
export function getDocumentTypeLabel(documentType: RegulatoryDocumentType): string {
  return REGULATORY_DOCUMENT_TYPE_LABELS[documentType]
}
