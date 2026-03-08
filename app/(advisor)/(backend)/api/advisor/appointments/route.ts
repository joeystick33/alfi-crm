import { NextRequest } from 'next/server';
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers';
import { RendezVousService } from '@/app/_common/lib/services/rendez-vous-service';
import { isRegularUser } from '@/app/_common/lib/auth-types';
import { z } from 'zod';
import { logger } from '@/app/_common/lib/logger'
const appointmentQuerySchema = z.object({
  date: z.string().optional(),
  start: z.string().optional(),
  end: z.string().optional(),
  view: z.enum(['day', 'week', 'month']).optional(),
  status: z.string().optional(),
  clientId: z.string().optional(),
  type: z.string().optional(),
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
  includeCompleted: z.string().optional().transform(val => val !== 'false'),
});

const createAppointmentSchema = z.object({
  title: z.string().min(1, 'Le titre est requis'),
  description: z.string().optional(),
  startDate: z.string().transform(val => new Date(val)),
  endDate: z.string().transform(val => new Date(val)),
  location: z.string().optional(),
  isVirtual: z.boolean().optional().default(false),
  meetingUrl: z.string().optional(),
  type: z.enum(['PREMIER_RDV', 'SUIVI', 'BILAN_ANNUEL', 'SIGNATURE', 'APPEL_TEL', 'VISIO', 'AUTRE']).default('AUTRE'),
  clientId: z.string().optional(),
  notes: z.string().optional(),
  // Récurrence
  isRecurring: z.boolean().optional().default(false),
  recurrenceRule: z.string().optional(), // Format RRULE RFC 5545
  recurrenceEndDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
});

function parseDateParam(dateParam: string | undefined): Date | null {
  if (!dateParam) return null;

  if (dateParam === 'today') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }

  if (dateParam === 'tomorrow') {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  }

  const date = new Date(dateParam);
  return isNaN(date.getTime()) ? null : date;
}

function getDateRangeForView(view: string, currentDate: Date = new Date()): { start: Date; end: Date } | null {
  const start = new Date(currentDate);
  const end = new Date(currentDate);

  switch (view) {
    case 'day':
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;

    case 'week':
      const dayOfWeek = start.getDay();
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      start.setDate(start.getDate() + diff);
      start.setHours(0, 0, 0, 0);

      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      break;

    case 'month':
      start.setDate(1);
      start.setHours(0, 0, 0, 0);

      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
      end.setHours(23, 59, 59, 999);
      break;

    default:
      return null;
  }

  return { start, end };
}

/**
 * GET /api/advisor/appointments
 * Get appointments using RendezVousService
 */
export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request); const { user } = context;

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400);
    }

    const { searchParams } = new URL(request.url);
    const params = appointmentQuerySchema.parse(Object.fromEntries(searchParams));

    const service = new RendezVousService(
      context.cabinetId,
      user.id,
      context.isSuperAdmin
    );

    // Determine date range
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (params.view) {
      const currentDate = params.date ? parseDateParam(params.date) : new Date();
      const range = currentDate ? getDateRangeForView(params.view, currentDate) : null;
      if (range) {
        startDate = range.start;
        endDate = range.end;
      }
    } else if (params.date) {
      const date = parseDateParam(params.date);
      if (date) {
        startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);
      }
    } else {
      startDate = parseDateParam(params.start) || undefined;
      endDate = parseDateParam(params.end) || undefined;
    }

    // Status filter
    let status: string | undefined = undefined;
    if (params.status) {
      status = params.status.toUpperCase();
    } else if (!params.includeCompleted) {
      // Service doesn't support "notIn" directly in simple filters, 
      // but we can filter post-fetch or update service. 
      // For now, let's fetch and filter if needed, or rely on service default.
      // The service `getRendezVous` supports specific status.
      // If no status provided, it returns all.
    }

    const appointments = await service.getRendezVous({
      conseillerId: user.id,
      clientId: params.clientId,
      type: params.type as 'PREMIER_RDV' | 'SUIVI' | 'BILAN_ANNUEL' | 'SIGNATURE' | 'APPEL_TEL' | 'VISIO' | 'AUTRE' | undefined,
      status: status as any, // Cast to any or RendezVousStatus to fix build error
      startDate,
      endDate,
    });

    // Filter out completed/cancelled if requested (since service might return them)
    let filteredAppointments = appointments;
    if (!params.status && !params.includeCompleted) {
      filteredAppointments = appointments.filter(apt =>
        apt.status !== 'TERMINE' && apt.status !== 'ANNULE'
      );
    }

    // Apply limit if needed
    if (params.limit) {
      filteredAppointments = filteredAppointments.slice(0, params.limit);
    }

    // Format response to match expected frontend structure
    const formattedAppointments = filteredAppointments.map(apt => ({
      id: apt.id,
      title: apt.title,
      description: apt.description,
      startTime: apt.startDate, // Frontend expects startTime/endTime
      endTime: apt.endDate,
      location: apt.location,
      isVirtual: apt.isVirtual,
      meetingUrl: apt.meetingUrl,
      status: apt.status,
      type: apt.type,
      client: apt.client,
      clientName: apt.client
        ? `${apt.client.firstName} ${apt.client.lastName}`
        : null,
      notes: apt.notes,
      reminderSent: apt.reminderSent,
      createdAt: apt.createdAt,
      updatedAt: apt.updatedAt,
    }));

    return createSuccessResponse({
      appointments: formattedAppointments,
      count: formattedAppointments.length,
      meta: {
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString(),
        view: params.view || 'custom',
      },
    });

  } catch (error: unknown) {
    logger.error('Error fetching appointments:', { error: error instanceof Error ? error.message : String(error) });
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401);
    }
    return createErrorResponse('Internal server error', 500);
  }
}

/**
 * POST /api/advisor/appointments
 * Create a new appointment using RendezVousService
 */
export async function POST(request: NextRequest) {
  try {
    const context = await requireAuth(request); const { user } = context;

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400);
    }

    const body = await request.json();
    const data = createAppointmentSchema.parse(body);

    // Validate dates
    if (data.endDate <= data.startDate) {
      return createErrorResponse('La date de fin doit être après la date de début', 400);
    }

    if (data.startDate < new Date()) {
      return createErrorResponse('Impossible de créer un rendez-vous dans le passé', 400);
    }

    const service = new RendezVousService(
      context.cabinetId,
      user.id,
      context.isSuperAdmin
    );

    try {
      let appointment;

      // Créer rendez-vous récurrent ou simple selon flag
      if (data.isRecurring) {
        // Valider que recurrenceRule est fourni
        if (!data.recurrenceRule) {
          return createErrorResponse('recurrenceRule est requis pour un rendez-vous récurrent', 400);
        }

        appointment = await service.createRecurringRendezVous({
          conseillerId: user.id,
          clientId: data.clientId,
          title: data.title,
          description: data.description,
          startDate: data.startDate,
          endDate: data.endDate,
          location: data.location,
          isVirtual: data.isVirtual,
          meetingUrl: data.meetingUrl,
          type: data.type,
          recurrenceRule: data.recurrenceRule,
          recurrenceEndDate: data.recurrenceEndDate,
        });
      } else {
        appointment = await service.createRendezVous({
          conseillerId: user.id,
          clientId: data.clientId,
          title: data.title,
          description: data.description,
          startDate: data.startDate,
          endDate: data.endDate,
          location: data.location,
          isVirtual: data.isVirtual,
          meetingUrl: data.meetingUrl,
          type: data.type,
        });
      }

      // Service returns formatted appointment, but we might need to adapt keys
      return createSuccessResponse({
        appointment: {
          ...appointment,
          startTime: appointment.startDate,
          endTime: appointment.endDate,
        },
        message: data.isRecurring
          ? 'Rendez-vous récurrent créé avec succès'
          : 'Rendez-vous créé avec succès',
      }, 201);

    } catch (serviceError: unknown) {
      if ((serviceError as Error).message === 'Time slot conflict detected') {
        return createErrorResponse('Conflit de rendez-vous détecté', 409);
      }
      if ((serviceError as Error).message?.startsWith('Conflits détectés aux dates')) {
        return createErrorResponse((serviceError as Error).message, 409);
      }
      if ((serviceError as Error).message?.startsWith('RRULE invalide')) {
        return createErrorResponse((serviceError as Error).message, 400);
      }
      throw serviceError;
    }

  } catch (error: unknown) {
    logger.error('Error creating appointment:', { error: error instanceof Error ? error.message : String(error) });

    if (error instanceof z.ZodError) {
      return createErrorResponse('Données invalides', 400);
    }

    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401);
    }

    return createErrorResponse((error as Error).message || 'Internal server error', 500);
  }
}
