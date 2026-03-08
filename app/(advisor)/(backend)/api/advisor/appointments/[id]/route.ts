 
import { NextRequest } from 'next/server';
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers';
import { z } from 'zod';
import { isRegularUser } from '@/app/_common/lib/auth-types';
import { RendezVousService } from '@/app/_common/lib/services/rendez-vous-service';
import { logger } from '@/app/_common/lib/logger'
const updateAppointmentSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  startDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  endDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  location: z.string().optional(),
  isVirtual: z.boolean().optional(),
  meetingUrl: z.string().optional(),
  type: z.enum(['FIRST_MEETING', 'SUIVI', 'ANNUAL_REVIEW', 'SIGNING', 'PHONE_CALL', 'VIDEO_CALL', 'AUTRE']).optional(),
  status: z.enum(['PLANIFIE', 'CONFIRME', 'TERMINE', 'ANNULE', 'ABSENT']).optional(),
  notes: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request); const { user } = context;
    const { id: appointmentId } = await params;

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400);
    }

    const service = new RendezVousService(context.cabinetId, user.id, context.isSuperAdmin);
    const appointment = await service.getRendezVousById(appointmentId);

    if (!appointment) {
      return createErrorResponse('Rendez-vous non trouvé', 404);
    }

    // Security check: ensure the appointment belongs to the user's cabinet
    // The service already enforces cabinet isolation, but we might want to check advisor ownership if strict
    // For now, cabinet isolation is sufficient as per service design

    return createSuccessResponse({
      appointment: {
        id: appointment.id,
        title: appointment.title,
        description: appointment.description,
        startTime: appointment.startDate,
        endTime: appointment.endDate,
        location: appointment.location,
        isVirtual: appointment.isVirtual,
        meetingUrl: appointment.meetingUrl,
        status: appointment.status,
        type: appointment.type,
        client: appointment.client,
        notes: appointment.notes,
        reminderSent: appointment.reminderSent,
        createdAt: appointment.createdAt,
        updatedAt: appointment.updatedAt,
      },
    });
  } catch (error: any) {
    logger.error('Error fetching appointment:', { error: error instanceof Error ? error.message : String(error) });
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401);
    }
    return createErrorResponse('Internal server error', 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request); const { user } = context;
    const { id: appointmentId } = await params;

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400);
    }

    const body = await request.json();
    const data = updateAppointmentSchema.parse(body);

    const service = new RendezVousService(context.cabinetId, user.id, context.isSuperAdmin);

    // Check existence first
    const existingAppointment = await service.getRendezVousById(appointmentId);
    if (!existingAppointment) {
      return createErrorResponse('Rendez-vous non trouvé', 404);
    }

    const updatedAppointment = await service.updateRendezVous(appointmentId, data);

    return createSuccessResponse({
      appointment: {
        id: updatedAppointment.id,
        title: updatedAppointment.title,
        description: updatedAppointment.description,
        startTime: updatedAppointment.startDate,
        endTime: updatedAppointment.endDate,
        location: updatedAppointment.location,
        isVirtual: updatedAppointment.isVirtual,
        meetingUrl: updatedAppointment.meetingUrl,
        status: updatedAppointment.status,
        type: updatedAppointment.type,
        client: updatedAppointment.client,
        notes: updatedAppointment.notes,
        updatedAt: updatedAppointment.updatedAt,
      },
      message: 'Rendez-vous mis à jour avec succès',
    });
  } catch (error: any) {
    logger.error('Error updating appointment:', { error: error instanceof Error ? error.message : String(error) });

    if (error instanceof z.ZodError) {
      return createErrorResponse('Données invalides', 400);
    }

    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401);
    }

    if (error.message === 'Time slot conflict detected') {
      return createErrorResponse('Conflit de rendez-vous détecté', 409);
    }

    return createErrorResponse('Internal server error', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request); const { user } = context;
    const { id: appointmentId } = await params;

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400);
    }

    const service = new RendezVousService(context.cabinetId, user.id, context.isSuperAdmin);

    // Check existence
    const appointment = await service.getRendezVousById(appointmentId);
    if (!appointment) {
      return createErrorResponse('Rendez-vous non trouvé', 404);
    }

    // Use cancel instead of delete for better traceability, or delete if requested
    // The original code used update to CANCELLED
    await service.cancelRendezVous(appointmentId);

    return createSuccessResponse({
      message: 'Rendez-vous annulé avec succès',
    });
  } catch (error: any) {
    logger.error('Error deleting appointment:', { error: error instanceof Error ? error.message : String(error) });
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401);
    }
    return createErrorResponse('Internal server error', 500);
  }
}
