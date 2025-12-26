 
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  requireClientPortalAccess,
  logClientPortalAccess,
  extractClientId,
} from '@/app/_common/lib/client-permissions';
import { PatrimoineService } from '@/app/_common/lib/services/patrimoine-service';
import { RendezVousService } from '@/app/_common/lib/services/rendez-vous-service';
import { ObjectifService } from '@/app/_common/lib/services/objectif-service';
import { TimelineService } from '@/app/_common/lib/services/timeline-service';
import { prisma } from '@/app/_common/lib/prisma'; // Keep for now if services don't cover everything, but try to minimize

const querySchema = z.object({
  clientId: z.string().min(1),
});

/**
 * GET /api/client/dashboard?clientId=xxx
 * Get dashboard data for client portal
 * READ-ONLY access with strict client isolation
 */
export async function GET(request: NextRequest) {
  try {
    const clientId = extractClientId(request);

    if (!clientId) {
      return NextResponse.json(
        { error: 'clientId is required' },
        { status: 400 }
      );
    }

    const { clientId: validatedClientId } = querySchema.parse({ clientId });

    // Verify client portal access
    const accessDenied = await requireClientPortalAccess(request, validatedClientId);
    if (accessDenied) return accessDenied;

    // Log access for audit
    await logClientPortalAccess(validatedClientId, 'CONSULTATION', 'DASHBOARD');

    // We need cabinetId to instantiate services. 
    // Since we don't have a session user with cabinetId, we fetch it from the client.
    const clientRaw = await prisma.client.findUnique({
      where: { id: validatedClientId },
      select: { cabinetId: true, firstName: true, lastName: true, wealth: true }
    });

    if (!clientRaw) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const cabinetId = clientRaw.cabinetId;
    const userId = validatedClientId; // Use client ID as user ID for read-only services
    const userRole = 'CLIENT';

    // Instantiate Services
    const patrimoineService = new PatrimoineService(cabinetId, userId, userRole);
    const rdvService = new RendezVousService(cabinetId, userId, false);
    const objectifService = new ObjectifService(cabinetId, userId, false);
    const timelineService = new TimelineService(cabinetId, userId, false);
    // DocumentService might need refactoring to accept client context or we use prisma for count if simple
    // Let's check if DocumentService has count methods. If not, we might use prisma for simple counts to avoid over-engineering now.

    // 1. Wealth Summary
    const wealth = await patrimoineService.calculateClientWealth(validatedClientId);

    // 2. Documents Count (Direct Prisma for now as Service might be complex)
    const documentsCount = await prisma.clientDocument.count({
      where: { clientId: validatedClientId },
    });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentDocuments = await prisma.clientDocument.count({
      where: {
        clientId: validatedClientId,
        createdAt: { gte: sevenDaysAgo },
      },
    });

    // 3. Next Appointment
    // Service returns all, we filter. Or we use prisma for specific query if service is limited.
    // RendezVousService.getRendezVous supports startDate.
    const appointments = await rdvService.getRendezVous({
      clientId: validatedClientId,
      startDate: new Date(),
      status: 'PLANIFIE' // Service might expect enum
    });
    // Sort and take first
    const nextAppointment = appointments.sort((a, b) => a.startDate.getTime() - b.startDate.getTime())[0] || null;

    // 4. Objectives
    const objectifs = await objectifService.getObjectifs({ clientId: validatedClientId });
    const activeObjectifs = objectifs.filter((o: any) => o.status === 'ACTIF');
    const totalObjectifs = activeObjectifs.length;
    const achievedObjectifs = activeObjectifs.filter((o: any) => (o.progress || 0) >= 100).length;

    // 5. Recent Activity
    const timelineResult = await timelineService.getClientTimeline(validatedClientId, { limit: 5 });
    const recentActivity = timelineResult.events;

    return NextResponse.json({
      client: {
        firstName: clientRaw.firstName,
        lastName: clientRaw.lastName,
      },
      wealth: {
        total: wealth.netWealth,
        actifs: wealth.totalActifs,
        passifs: wealth.totalPassifs,
        evolution: clientRaw.wealth ? (clientRaw.wealth as any).evolution : null,
        byCategory: Object.entries(wealth.actifsByCategory).map(([category, value]) => ({
          category,
          total: value,
          percentage: wealth.totalActifs > 0 ? (value / wealth.totalActifs) * 100 : 0,
          items: [], // We don't need items for dashboard summary usually, or we can fetch if needed
        })),
      },
      stats: {
        documents: {
          total: documentsCount,
          recent: recentDocuments,
        },
        nextAppointment: nextAppointment ? {
          id: nextAppointment.id,
          title: nextAppointment.title,
          startDate: nextAppointment.startDate,
          endDate: nextAppointment.endDate,
          type: nextAppointment.type,
          location: nextAppointment.location,
          isVirtual: nextAppointment.isVirtual,
          meetingUrl: nextAppointment.meetingUrl,
        } : null,
        objectifs: {
          total: totalObjectifs,
          achieved: achievedObjectifs,
          inProgress: totalObjectifs - achievedObjectifs,
        },
      },
      objectifs: activeObjectifs.slice(0, 5),
      recentActivity,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('[Client Dashboard Error]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
