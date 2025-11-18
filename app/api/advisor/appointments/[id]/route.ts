import { NextRequest } from 'next/server';
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { isRegularUser } from '@/lib/auth-types';

const updateAppointmentSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  startDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  endDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  location: z.string().optional(),
  isVirtual: z.boolean().optional(),
  meetingUrl: z.string().optional(),
  type: z.enum(['FIRST_MEETING', 'FOLLOW_UP', 'ANNUAL_REVIEW', 'SIGNING', 'PHONE_CALL', 'VIDEO_CALL', 'OTHER']).optional(),
  status: z.enum(['SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).optional(),
  notes: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await requireAuth(request);
    
    if (!isRegularUser(context.user)) {
      return createErrorResponse('Invalid user type', 400);
    }

    const appointment = await prisma.rendezVous.findFirst({
      where: {
        id: params.id,
        conseillerId: context.user.id,
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!appointment) {
      return createErrorResponse('Rendez-vous non trouvé', 404);
    }

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
    console.error('Error fetching appointment:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401);
    }
    return createErrorResponse('Internal server error', 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await requireAuth(request);
    
    if (!isRegularUser(context.user)) {
      return createErrorResponse('Invalid user type', 400);
    }

    const body = await request.json();
    const data: any = updateAppointmentSchema.parse(body);

    const existingAppointment = await prisma.rendezVous.findFirst({
      where: {
        id: params.id,
        conseillerId: context.user.id,
      },
    });

    if (!existingAppointment) {
      return createErrorResponse('Rendez-vous non trouvé', 404);
    }

    if (data.startDate && data.endDate) {
      if (data.endDate <= data.startDate) {
        return createErrorResponse('La date de fin doit être après la date de début', 400);
      }

      const conflicts = await prisma.rendezVous.findMany({
        where: {
          id: { not: params.id },
          conseillerId: context.user.id,
          status: { not: 'CANCELLED' },
          OR: [
            {
              startDate: { lt: data.endDate },
              endDate: { gt: data.startDate },
            },
          ],
        },
      });

      if (conflicts.length > 0) {
        return createErrorResponse('Conflit de rendez-vous détecté', 409);
      }
    }

    const updatedAppointment = await prisma.rendezVous.update({
      where: { id: params.id },
      data: {
        title: data.title,
        description: data.description,
        startDate: data.startDate,
        endDate: data.endDate,
        location: data.location,
        isVirtual: data.isVirtual,
        meetingUrl: data.meetingUrl,
        type: data.type,
        status: data.status,
        notes: data.notes,
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

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
    console.error('Error updating appointment:', error);
    
    if (error instanceof z.ZodError) {
      return createErrorResponse('Données invalides', 400);
    }
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401);
    }

    return createErrorResponse('Internal server error', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await requireAuth(request);
    
    if (!isRegularUser(context.user)) {
      return createErrorResponse('Invalid user type', 400);
    }

    const appointment = await prisma.rendezVous.findFirst({
      where: {
        id: params.id,
        conseillerId: context.user.id,
      },
    });

    if (!appointment) {
      return createErrorResponse('Rendez-vous non trouvé', 404);
    }

    await prisma.rendezVous.update({
      where: { id: params.id },
      data: { 
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    });

    return createSuccessResponse({
      message: 'Rendez-vous annulé avec succès',
    });
  } catch (error: any) {
    console.error('Error deleting appointment:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401);
    }
    return createErrorResponse('Internal server error', 500);
  }
}
