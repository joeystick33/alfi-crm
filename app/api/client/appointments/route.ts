import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const querySchema = z.object({
  clientId: z.string().cuid(),
  upcoming: z.string().optional(),
});

/**
 * GET /api/client/appointments?clientId=xxx&upcoming=true
 * Get appointments for client portal (read-only)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const upcoming = searchParams.get('upcoming');

    if (!clientId) {
      return NextResponse.json(
        { error: 'clientId is required' },
        { status: 400 }
      );
    }

    const { clientId: validatedClientId } = querySchema.parse({
      clientId,
      upcoming: upcoming || undefined,
    });

    // Verify client exists and has portal access
    const client = await prisma.client.findUnique({
      where: { id: validatedClientId },
      select: {
        id: true,
        portalAccess: true,
      },
    });

    if (!client || !client.portalAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Build where clause
    const whereClause: any = {
      clientId: validatedClientId,
    };

    if (upcoming === 'true') {
      whereClause.startDate = {
        gte: new Date(),
      };
      whereClause.status = {
        in: ['SCHEDULED', 'CONFIRMED'],
      };
    }

    // Get appointments
    const appointments = await prisma.rendezVous.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        startDate: true,
        endDate: true,
        location: true,
        isVirtual: true,
        meetingUrl: true,
        status: true,
        notes: true,
        conseiller: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: {
        startDate: upcoming === 'true' ? 'asc' : 'desc',
      },
      take: upcoming === 'true' ? 10 : 50,
    });

    // Get next appointment
    const nextAppointment = await prisma.rendezVous.findFirst({
      where: {
        clientId: validatedClientId,
        startDate: {
          gte: new Date(),
        },
        status: {
          in: ['SCHEDULED', 'CONFIRMED'],
        },
      },
      orderBy: {
        startDate: 'asc',
      },
      select: {
        id: true,
        title: true,
        startDate: true,
        endDate: true,
        type: true,
        location: true,
        isVirtual: true,
        meetingUrl: true,
      },
    });

    // Count appointments by status
    const stats = await prisma.rendezVous.groupBy({
      by: ['status'],
      where: {
        clientId: validatedClientId,
      },
      _count: true,
    });

    return NextResponse.json({
      appointments,
      nextAppointment,
      stats: {
        total: appointments.length,
        byStatus: stats.reduce((acc, s) => {
          acc[s.status] = s._count;
          return acc;
        }, {} as Record<string, number>),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('[Client Appointments Error]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
