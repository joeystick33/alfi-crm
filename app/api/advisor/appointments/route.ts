import { NextRequest } from 'next/server';
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/supabase/auth-helpers';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { isRegularUser } from '@/lib/auth-types';

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
  type: z.enum(['FIRST_MEETING', 'FOLLOW_UP', 'ANNUAL_REVIEW', 'SIGNING', 'PHONE_CALL', 'VIDEO_CALL', 'OTHER']).default('OTHER'),
  clientId: z.string().optional(),
  notes: z.string().optional(),
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
 * Get appointments with date range filtering
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400);
    }

    const { searchParams } = new URL(request.url);
    const params = appointmentQuerySchema.parse(Object.fromEntries(searchParams));

    const userId = user.id;
    const cabinetId = user.cabinetId;

    // Build where clause
    const where: any = {
      cabinetId,
      conseillerId: userId,
    };

    // Determine date range
    let startDate: Date | null = null;
    let endDate: Date | null = null;

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
      startDate = parseDateParam(params.start);
      endDate = parseDateParam(params.end);
    }

    // Apply date range filter
    if (startDate && endDate) {
      where.startDate = {
        gte: startDate,
        lte: endDate,
      };
    } else if (startDate) {
      where.startDate = { gte: startDate };
    } else if (endDate) {
      where.startDate = { lte: endDate };
    }

    // Status filter
    if (params.status) {
      const statuses = params.status.split(',').map(s => s.trim().toUpperCase());
      where.status = statuses.length === 1 ? statuses[0] : { in: statuses };
    } else if (!params.includeCompleted) {
      where.status = { notIn: ['COMPLETED', 'CANCELLED'] };
    }

    // Type filter
    if (params.type) {
      where.type = params.type.toUpperCase();
    }

    // Client filter
    if (params.clientId) {
      where.clientId = params.clientId;
    }

    // Execute query
    const appointments = await prisma.rendezVous.findMany({
      where,
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
      orderBy: { startDate: 'asc' },
      take: params.limit,
    });

    // Format response
    const formattedAppointments = appointments.map(apt => ({
      id: apt.id,
      title: apt.title,
      description: apt.description,
      startTime: apt.startDate,
      endTime: apt.endDate,
      location: apt.location,
      isVirtual: apt.isVirtual,
      meetingUrl: apt.meetingUrl,
      status: apt.status,
      type: apt.type,
      client: apt.client ? {
        id: apt.client.id,
        firstName: apt.client.firstName,
        lastName: apt.client.lastName,
        email: apt.client.email,
        phone: apt.client.phone,
      } : null,
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

  } catch (error: any) {
    console.error('Error fetching appointments:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401);
    }
    return createErrorResponse('Internal server error', 500);
  }
}

/**
 * POST /api/advisor/appointments
 * Create a new appointment with conflict detection
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400);
    }

    const body = await request.json();
    const data: any = createAppointmentSchema.parse(body);

    // Validate dates
    if (data.endDate <= data.startDate) {
      return createErrorResponse('La date de fin doit être après la date de début', 400);
    }

    if (data.startDate < new Date()) {
      return createErrorResponse('Impossible de créer un rendez-vous dans le passé', 400);
    }

    const userId = user.id;
    const cabinetId = user.cabinetId;

    // Check for conflicts
    const conflicts = await prisma.rendezVous.findMany({
      where: {
        conseillerId: userId,
        status: { notIn: ['CANCELLED', 'COMPLETED'] },
        OR: [
          {
            startDate: { lt: data.endDate },
            endDate: { gt: data.startDate },
          },
        ],
      },
      select: {
        id: true,
        title: true,
        startDate: true,
        endDate: true,
        type: true,
      },
    });

    if (conflicts.length > 0) {
      return createErrorResponse('Conflit de rendez-vous détecté', 409);
    }

    // Create appointment
    const appointment = await prisma.rendezVous.create({
      data: {
        cabinetId,
        conseillerId: userId,
        clientId: data.clientId,
        title: data.title,
        description: data.description,
        startDate: data.startDate,
        endDate: data.endDate,
        location: data.location,
        isVirtual: data.isVirtual,
        meetingUrl: data.meetingUrl,
        type: data.type,
        status: 'SCHEDULED',
        notes: data.notes,
        reminderSent: false,
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
        createdAt: appointment.createdAt,
      },
      message: 'Rendez-vous créé avec succès',
    }, 201);

  } catch (error: any) {
    console.error('Error creating appointment:', error);
    
    if (error instanceof z.ZodError) {
      return createErrorResponse('Données invalides', 400);
    }
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401);
    }

    return createErrorResponse('Internal server error', 500);
  }
}
