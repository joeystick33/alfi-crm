import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  requireClientPortalAccess,
  logClientPortalAccess,
  extractClientId,
} from '@/app/_common/lib/client-permissions';
import { prisma } from '@/app/_common/lib/prisma';

const querySchema = z.object({
  clientId: z.string().min(1),
  status: z.enum(['PLANIFIE', 'TERMINE', 'ANNULE', 'ABSENT']).optional(),
  upcoming: z.coerce.boolean().optional().default(true),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
});

const createRdvRequestSchema = z.object({
  clientId: z.string().min(1),
  type: z.enum(['PHONE', 'VIDEO', 'IN_PERSON']),
  preferredDates: z.array(z.string()).min(1).max(3), // ISO date strings
  subject: z.string().min(1).max(200),
  notes: z.string().max(1000).optional(),
  duration: z.number().min(15).max(180).default(60), // in minutes
});

// Map client-friendly types to Prisma RendezVousType enum
const mapToRendezVousType = (type: 'PHONE' | 'VIDEO' | 'IN_PERSON') => {
  switch (type) {
    case 'PHONE': return 'APPEL_TEL' as const;
    case 'VIDEO': return 'VISIO' as const;
    case 'IN_PERSON': return 'PREMIER_RDV' as const;
    default: return 'AUTRE' as const;
  }
};

/**
 * GET /api/client/rendez-vous?clientId=xxx
 * Get appointments for client portal
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = extractClientId(request);

    if (!clientId) {
      return NextResponse.json(
        { error: 'clientId is required' },
        { status: 400 }
      );
    }

    const params = querySchema.parse({
      clientId,
      status: (searchParams.get('status') as 'PLANIFIE' | 'TERMINE' | 'ANNULE' | 'ABSENT' | null) || undefined,
      upcoming: searchParams.get('upcoming') !== 'false',
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 20,
    });

    // Verify client portal access
    const accessDenied = await requireClientPortalAccess(request, params.clientId);
    if (accessDenied) return accessDenied;

    // Log access for audit
    await logClientPortalAccess(params.clientId, 'CONSULTATION', 'RENDEZ_VOUS');

    // Get client info for service
    const client = await prisma.client.findUnique({
      where: { id: params.clientId },
      select: { cabinetId: true, conseillerId: true },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const skip = (params.page - 1) * params.limit;
    const now = new Date();

    // Build where clause
     
    const where: any = {
      clientId: params.clientId,
    };

    if (params.status) {
      where.status = params.status;
    }

    if (params.upcoming) {
      where.startDate = { gte: now };
    }

    // Get appointments with pagination
    const [appointments, total, nextAppointment] = await Promise.all([
      prisma.rendezVous.findMany({
        where,
        orderBy: { startDate: params.upcoming ? 'asc' : 'desc' },
        skip,
        take: params.limit,
        select: {
          id: true,
          title: true,
          description: true,
          type: true,
          status: true,
          startDate: true,
          endDate: true,
          location: true,
          isVirtual: true,
          meetingUrl: true,
          createdAt: true,
          conseiller: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      prisma.rendezVous.count({ where }),
      // Get next upcoming appointment
      prisma.rendezVous.findFirst({
        where: {
          clientId: params.clientId,
          status: 'PLANIFIE',
          startDate: { gte: now },
        },
        orderBy: { startDate: 'asc' },
        select: {
          id: true,
          title: true,
          startDate: true,
          type: true,
          isVirtual: true,
          meetingUrl: true,
        },
      }),
    ]);

    // Get stats
    const stats = await prisma.rendezVous.groupBy({
      by: ['status'],
      where: { clientId: params.clientId },
      _count: true,
    });

    const statsMap = stats.reduce((acc: Record<string, number>, s: { status: string; _count: number }) => {
      acc[s.status] = s._count;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      appointments: appointments.map((apt) => ({
        ...apt,
        advisorName: apt.conseiller
          ? `${apt.conseiller.firstName} ${apt.conseiller.lastName}`
          : null,
      })),
      nextAppointment,
      stats: {
        total: (Object.values(statsMap) as number[]).reduce((a, b) => a + b, 0),
        scheduled: statsMap['PLANIFIE'] || 0,
        completed: statsMap['TERMINE'] || 0,
        cancelled: statsMap['ANNULE'] || 0,
      },
      pagination: {
        total,
        page: params.page,
        limit: params.limit,
        totalPages: Math.ceil(total / params.limit),
      },
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('[Client Rendez-vous Error]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/client/rendez-vous
 * Request a new appointment (creates a pending request for advisor to confirm)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = createRdvRequestSchema.parse(body);

    // Verify client portal access
    const accessDenied = await requireClientPortalAccess(request, data.clientId);
    if (accessDenied) return accessDenied;

    // Get client info
    const client = await prisma.client.findUnique({
      where: { id: data.clientId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        conseillerId: true,
        cabinetId: true,
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Create appointment request (status: PENDING_CONFIRMATION)
    const rdv = await prisma.rendezVous.create({
      data: {
        cabinetId: client.cabinetId,
        conseillerId: client.conseillerId,
        clientId: data.clientId,
        title: data.subject,
        description: data.notes || '',
        type: mapToRendezVousType(data.type),
        status: 'PLANIFIE', // Or use a custom status like 'PENDING_CONFIRMATION'
        startDate: new Date(data.preferredDates[0]),
        endDate: new Date(new Date(data.preferredDates[0]).getTime() + data.duration * 60000),
        isVirtual: data.type === 'VIDEO' || data.type === 'PHONE',
        notes: JSON.stringify({
          requestedByClient: true,
          preferredDates: data.preferredDates,
          requestedDuration: data.duration,
        }),
      },
      select: {
        id: true,
        title: true,
        type: true,
        status: true,
        startDate: true,
        endDate: true,
      },
    });

    // Log action for audit
    await logClientPortalAccess(data.clientId, 'CREATION', 'RENDEZ_VOUS', rdv.id, {
      subject: data.subject,
      type: data.type,
      preferredDates: data.preferredDates,
    });

    // Create notification for advisor
    await prisma.notification.create({
      data: {
        cabinetId: client.cabinetId,
        userId: client.conseillerId,
        clientId: data.clientId,
        type: 'RAPPEL_RDV',
        title: 'Demande de rendez-vous client',
        message: `${client.firstName} ${client.lastName} demande un rendez-vous: ${data.subject}`,
        actionUrl: `/dashboard/agenda?rdvId=${rdv.id}`,
      },
    });

    return NextResponse.json({
      appointment: rdv,
      message: 'Votre demande de rendez-vous a été envoyée à votre conseiller',
      success: true,
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('[Client Request Appointment Error]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
