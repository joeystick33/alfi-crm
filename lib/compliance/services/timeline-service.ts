/**
 * Service de gestion de la timeline de conformité
 * 
 * Ce service gère l'historique chronologique des événements de conformité:
 * - Ajout d'événements à la timeline
 * - Récupération des événements par client avec filtres
 * - Export de la timeline en PDF
 * 
 * @module lib/compliance/services/timeline-service
 * @requirements 11.1-11.5
 */

import { prisma } from '@/app/_common/lib/prisma'
import {
  type TimelineEventType,
  TIMELINE_EVENT_TYPE_LABELS,
} from '../types'
import {
  createTimelineEventSchema,
  timelineFiltersSchema,
  type CreateTimelineEventInput,
  type TimelineFiltersInput,
} from '../schemas'

// ============================================================================
// Types
// ============================================================================

export interface TimelineServiceResult<T> {
  success: boolean
  data?: T
  error?: string
}

export interface TimelineEventWithRelations {
  id: string
  cabinetId: string
  clientId: string
  operationId: string | null
  type: string
  title: string
  description: string
  metadata: Record<string, unknown> | null
  userId: string
  createdAt: Date
  user: {
    id: string
    firstName: string
    lastName: string
  }
  client: {
    id: string
    firstName: string
    lastName: string
  }
}

export interface TimelineExportData {
  client: {
    id: string
    firstName: string
    lastName: string
    email: string | null
  }
  events: TimelineEventWithRelations[]
  exportedAt: Date
  exportedBy: string
}

// ============================================================================
// Timeline Service
// ============================================================================

/**
 * Ajoute un événement à la timeline de conformité
 * 
 * @requirements 11.2 - THE Compliance_Timeline SHALL include events: document uploads, validations, rejections, reminders sent, controls completed, questionnaires filled
 */
export async function addEvent(
  input: CreateTimelineEventInput
): Promise<TimelineServiceResult<TimelineEventWithRelations>> {
  try {
    // Validate input
    const validatedInput = createTimelineEventSchema.parse(input)

    // Create timeline event
    const event = await prisma.complianceTimelineEvent.create({
      data: {
        cabinetId: validatedInput.cabinetId,
        clientId: validatedInput.clientId,
        operationId: validatedInput.operationId ?? null,
        type: validatedInput.type,
        title: validatedInput.title,
        description: validatedInput.description,
        metadata: validatedInput.metadata ? JSON.parse(JSON.stringify(validatedInput.metadata)) : null,
        userId: validatedInput.userId,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    return {
      success: true,
      data: event as unknown as TimelineEventWithRelations,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur lors de l'ajout de l'événement"
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Récupère la timeline de conformité d'un client
 * 
 * @requirements 11.1 - THE Compliance_Timeline SHALL display all compliance events for a client in chronological order
 * @requirements 11.3 - WHEN viewing a client's compliance timeline, THE Compliance_Timeline SHALL allow filtering by event type and date range
 * @requirements 11.4 - THE Compliance_Timeline SHALL display event details including: date, type, user who performed action, notes
 */
export async function getTimelineByClient(
  cabinetId: string,
  clientId: string,
  filters?: TimelineFiltersInput
): Promise<TimelineServiceResult<TimelineEventWithRelations[]>> {
  try {
    // Build where clause
    const where: Record<string, unknown> = {
      cabinetId,
      clientId,
    }

    if (filters) {
      const validatedFilters = timelineFiltersSchema.parse(filters)

      if (validatedFilters.type && validatedFilters.type.length > 0) {
        where.type = { in: validatedFilters.type }
      }

      if (validatedFilters.operationId) {
        where.operationId = validatedFilters.operationId
      }

      if (validatedFilters.dateFrom || validatedFilters.dateTo) {
        where.createdAt = {}
        if (validatedFilters.dateFrom) {
          (where.createdAt as Record<string, Date>).gte = validatedFilters.dateFrom
        }
        if (validatedFilters.dateTo) {
          (where.createdAt as Record<string, Date>).lte = validatedFilters.dateTo
        }
      }
    }

    const events = await prisma.complianceTimelineEvent.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return {
      success: true,
      data: events as unknown as TimelineEventWithRelations[],
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la récupération de la timeline'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Récupère la timeline de conformité d'un cabinet
 */
export async function getTimelineByCabinet(
  cabinetId: string,
  filters?: TimelineFiltersInput
): Promise<TimelineServiceResult<TimelineEventWithRelations[]>> {
  try {
    // Build where clause
    const where: Record<string, unknown> = {
      cabinetId,
    }

    if (filters) {
      const validatedFilters = timelineFiltersSchema.parse(filters)

      if (validatedFilters.clientId) {
        where.clientId = validatedFilters.clientId
      }

      if (validatedFilters.type && validatedFilters.type.length > 0) {
        where.type = { in: validatedFilters.type }
      }

      if (validatedFilters.operationId) {
        where.operationId = validatedFilters.operationId
      }

      if (validatedFilters.dateFrom || validatedFilters.dateTo) {
        where.createdAt = {}
        if (validatedFilters.dateFrom) {
          (where.createdAt as Record<string, Date>).gte = validatedFilters.dateFrom
        }
        if (validatedFilters.dateTo) {
          (where.createdAt as Record<string, Date>).lte = validatedFilters.dateTo
        }
      }
    }

    const events = await prisma.complianceTimelineEvent.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return {
      success: true,
      data: events as unknown as TimelineEventWithRelations[],
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la récupération de la timeline'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Prépare les données pour l'export PDF de la timeline
 * 
 * @requirements 11.5 - THE Compliance_Timeline SHALL be exportable as PDF for audit purposes
 */
export async function prepareTimelineExport(
  cabinetId: string,
  clientId: string,
  exportedByUserId: string,
  filters?: TimelineFiltersInput
): Promise<TimelineServiceResult<TimelineExportData>> {
  try {
    // Get client info
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    })

    if (!client) {
      return {
        success: false,
        error: 'Client non trouvé',
      }
    }

    // Get timeline events
    const eventsResult = await getTimelineByClient(cabinetId, clientId, filters)

    if (!eventsResult.success || !eventsResult.data) {
      return {
        success: false,
        error: eventsResult.error || 'Erreur lors de la récupération des événements',
      }
    }

    // Get exporter info
    const exporter = await prisma.user.findUnique({
      where: { id: exportedByUserId },
      select: {
        firstName: true,
        lastName: true,
      },
    })

    const exporterName = exporter
      ? `${exporter.firstName} ${exporter.lastName}`
      : 'Utilisateur inconnu'

    return {
      success: true,
      data: {
        client,
        events: eventsResult.data,
        exportedAt: new Date(),
        exportedBy: exporterName,
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur lors de la préparation de l'export"
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Génère le contenu HTML pour l'export PDF de la timeline
 * Note: L'export PDF réel sera géré par un service de génération PDF côté client ou serveur
 */
export function generateTimelineHTML(exportData: TimelineExportData): string {
  const { client, events, exportedAt, exportedBy } = exportData

  const eventsHTML = events
    .map(
      (event) => `
      <div class="event">
        <div class="event-date">${event.createdAt.toLocaleDateString('fr-FR')} ${event.createdAt.toLocaleTimeString('fr-FR')}</div>
        <div class="event-type">${TIMELINE_EVENT_TYPE_LABELS[event.type as TimelineEventType] || event.type}</div>
        <div class="event-title">${event.title}</div>
        <div class="event-description">${event.description}</div>
        <div class="event-user">Par: ${event.user.firstName} ${event.user.lastName}</div>
      </div>
    `
    )
    .join('')

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <title>Timeline Conformité - ${client.firstName} ${client.lastName}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
        .header { margin-bottom: 30px; }
        .client-info { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .event { border-left: 3px solid #007bff; padding: 10px 15px; margin-bottom: 15px; background: #fafafa; }
        .event-date { font-size: 12px; color: #666; }
        .event-type { font-weight: bold; color: #007bff; margin: 5px 0; }
        .event-title { font-weight: bold; margin: 5px 0; }
        .event-description { color: #333; margin: 5px 0; }
        .event-user { font-size: 12px; color: #666; font-style: italic; }
        .footer { margin-top: 30px; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 10px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Timeline Conformité</h1>
        <div class="client-info">
          <strong>Client:</strong> ${client.firstName} ${client.lastName}<br>
          <strong>Email:</strong> ${client.email || 'Non renseigné'}
        </div>
      </div>
      
      <div class="events">
        ${eventsHTML || '<p>Aucun événement trouvé.</p>'}
      </div>
      
      <div class="footer">
        Exporté le ${exportedAt.toLocaleDateString('fr-FR')} à ${exportedAt.toLocaleTimeString('fr-FR')} par ${exportedBy}
      </div>
    </body>
    </html>
  `
}

/**
 * Récupère un événement par son ID
 */
export async function getEventById(
  eventId: string
): Promise<TimelineServiceResult<TimelineEventWithRelations>> {
  try {
    const event = await prisma.complianceTimelineEvent.findUnique({
      where: { id: eventId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    if (!event) {
      return {
        success: false,
        error: 'Événement non trouvé',
      }
    }

    return {
      success: true,
      data: event as unknown as TimelineEventWithRelations,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur lors de la récupération de l'événement"
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Compte les événements par type
 */
export async function countEventsByType(
  cabinetId: string,
  clientId?: string
): Promise<TimelineServiceResult<Record<TimelineEventType, number>>> {
  try {
    const where: Record<string, unknown> = { cabinetId }
    if (clientId) {
      where.clientId = clientId
    }

    const counts = await prisma.complianceTimelineEvent.groupBy({
      by: ['type'],
      where,
      _count: { id: true },
    })

    const result: Record<string, number> = {}
    for (const eventType of Object.keys(TIMELINE_EVENT_TYPE_LABELS)) {
      result[eventType] = 0
    }

    for (const count of counts) {
      result[count.type] = count._count.id
    }

    return {
      success: true,
      data: result as Record<TimelineEventType, number>,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors du comptage des événements'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Obtient le label français d'un type d'événement
 */
export function getEventTypeLabel(type: TimelineEventType): string {
  return TIMELINE_EVENT_TYPE_LABELS[type]
}

// ============================================================================
// Helper Functions for Creating Specific Events
// ============================================================================

/**
 * Crée un événement de téléversement de document
 */
export async function addDocumentUploadedEvent(
  cabinetId: string,
  clientId: string,
  userId: string,
  documentType: string,
  documentId: string
): Promise<TimelineServiceResult<TimelineEventWithRelations>> {
  return addEvent({
    cabinetId,
    clientId,
    type: 'DOCUMENT_UPLOADED',
    title: `Document téléversé: ${documentType}`,
    description: `Un document de type "${documentType}" a été téléversé.`,
    metadata: { documentId, documentType },
    userId,
  })
}

/**
 * Crée un événement de validation de document
 */
export async function addDocumentValidatedEvent(
  cabinetId: string,
  clientId: string,
  userId: string,
  documentType: string,
  documentId: string
): Promise<TimelineServiceResult<TimelineEventWithRelations>> {
  return addEvent({
    cabinetId,
    clientId,
    type: 'DOCUMENT_VALIDATED',
    title: `Document validé: ${documentType}`,
    description: `Le document de type "${documentType}" a été validé.`,
    metadata: { documentId, documentType },
    userId,
  })
}

/**
 * Crée un événement de rejet de document
 */
export async function addDocumentRejectedEvent(
  cabinetId: string,
  clientId: string,
  userId: string,
  documentType: string,
  documentId: string,
  rejectionReason: string
): Promise<TimelineServiceResult<TimelineEventWithRelations>> {
  return addEvent({
    cabinetId,
    clientId,
    type: 'DOCUMENT_REJECTED',
    title: `Document rejeté: ${documentType}`,
    description: `Le document de type "${documentType}" a été rejeté. Raison: ${rejectionReason}`,
    metadata: { documentId, documentType, rejectionReason },
    userId,
  })
}

/**
 * Crée un événement d'envoi de relance
 */
export async function addReminderSentEvent(
  cabinetId: string,
  clientId: string,
  userId: string,
  reminderType: string,
  details?: string
): Promise<TimelineServiceResult<TimelineEventWithRelations>> {
  return addEvent({
    cabinetId,
    clientId,
    type: 'REMINDER_SENT',
    title: `Relance envoyée: ${reminderType}`,
    description: details || `Une relance de type "${reminderType}" a été envoyée au client.`,
    metadata: { reminderType },
    userId,
  })
}

/**
 * Crée un événement de création de contrôle
 */
export async function addControlCreatedEvent(
  cabinetId: string,
  clientId: string,
  userId: string,
  controlType: string,
  controlId: string
): Promise<TimelineServiceResult<TimelineEventWithRelations>> {
  return addEvent({
    cabinetId,
    clientId,
    type: 'CONTROL_CREATED',
    title: `Contrôle créé: ${controlType}`,
    description: `Un contrôle de type "${controlType}" a été créé.`,
    metadata: { controlId, controlType },
    userId,
  })
}

/**
 * Crée un événement de complétion de contrôle
 */
export async function addControlCompletedEvent(
  cabinetId: string,
  clientId: string,
  userId: string,
  controlType: string,
  controlId: string,
  riskLevel: string
): Promise<TimelineServiceResult<TimelineEventWithRelations>> {
  return addEvent({
    cabinetId,
    clientId,
    type: 'CONTROL_COMPLETED',
    title: `Contrôle terminé: ${controlType}`,
    description: `Le contrôle de type "${controlType}" a été terminé. Niveau de risque: ${riskLevel}`,
    metadata: { controlId, controlType, riskLevel },
    userId,
  })
}

/**
 * Crée un événement de création de réclamation
 */
export async function addReclamationCreatedEvent(
  cabinetId: string,
  clientId: string,
  userId: string,
  reference: string,
  subject: string
): Promise<TimelineServiceResult<TimelineEventWithRelations>> {
  return addEvent({
    cabinetId,
    clientId,
    type: 'RECLAMATION_CREATED',
    title: `Réclamation créée: ${reference}`,
    description: `Une réclamation a été créée. Sujet: ${subject}`,
    metadata: { reference, subject },
    userId,
  })
}

/**
 * Crée un événement de résolution de réclamation
 */
export async function addReclamationResolvedEvent(
  cabinetId: string,
  clientId: string,
  userId: string,
  reference: string
): Promise<TimelineServiceResult<TimelineEventWithRelations>> {
  return addEvent({
    cabinetId,
    clientId,
    type: 'RECLAMATION_RESOLVED',
    title: `Réclamation résolue: ${reference}`,
    description: `La réclamation ${reference} a été résolue.`,
    metadata: { reference },
    userId,
  })
}

/**
 * Crée un événement de génération de document réglementaire
 * 
 * @requirements 22.8, 25.5 - Tracer dans la timeline quand un document est généré pour une opération
 */
export async function addDocumentGeneratedEvent(
  cabinetId: string,
  clientId: string,
  userId: string,
  documentType: string,
  documentId: string,
  affaireId?: string,
  operationId?: string
): Promise<TimelineServiceResult<TimelineEventWithRelations>> {
  return addEvent({
    cabinetId,
    clientId,
    operationId: operationId ?? affaireId,
    type: 'DOCUMENT_VALIDATED', // Using DOCUMENT_VALIDATED as closest match for generated documents
    title: `Document généré: ${documentType}`,
    description: `Un document réglementaire de type "${documentType}" a été généré${affaireId ? ' pour l\'affaire' : ''}${operationId ? ' pour l\'opération' : ''}.`,
    metadata: { documentId, documentType, affaireId, operationId },
    userId,
  })
}

/**
 * Crée un événement de signature de document
 */
export async function addDocumentSignedEvent(
  cabinetId: string,
  clientId: string,
  userId: string,
  documentType: string,
  documentId: string,
  signedBy: string
): Promise<TimelineServiceResult<TimelineEventWithRelations>> {
  return addEvent({
    cabinetId,
    clientId,
    type: 'DOCUMENT_VALIDATED',
    title: `Document signé: ${documentType}`,
    description: `Le document de type "${documentType}" a été signé par ${signedBy}.`,
    metadata: { documentId, documentType, signedBy },
    userId,
  })
}
