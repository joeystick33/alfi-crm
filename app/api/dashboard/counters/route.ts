import { NextRequest } from 'next/server';
import { requireAuth, createSuccessResponse, createErrorResponse } from '@/lib/supabase/auth-helpers';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const userId = user.id;
    const cabinetId = user.cabinetId;

    if (!cabinetId) {
      return createErrorResponse('Cabinet ID not found', 400);
    }

    // Get counts concurrently
    const [
      clientsCount,
      activeClientsCount,
      prospectsCount,
      tasksCount,
      overdueTasksCount,
      appointmentsCount,
      todayAppointmentsCount,
      opportunitiesCount,
      qualifiedOpportunitiesCount,
      unreadNotificationsCount
    ] = await Promise.all([
      // Clients
      prisma.client.count({ where: { cabinetId, status: { not: 'ARCHIVED' } } }),
      prisma.client.count({ where: { cabinetId, status: 'ACTIVE' } }),
      prisma.client.count({ where: { cabinetId, status: 'PROSPECT' } }),
      
      // Tasks
      prisma.tache.count({ where: { cabinetId, status: { not: 'COMPLETED' } } }),
      prisma.tache.count({ where: { cabinetId, status: { not: 'COMPLETED' }, dueDate: { lt: new Date() } } }),
      
      // Appointments
      prisma.rendezVous.count({ where: { cabinetId } }),
      prisma.rendezVous.count({ 
        where: { 
          cabinetId, 
          startDate: { 
            gte: new Date(new Date().setHours(0,0,0,0)),
            lt: new Date(new Date().setHours(23,59,59,999))
          } 
        } 
      }),
      
      // Opportunities
      prisma.opportunite.count({ where: { cabinetId } }),
      prisma.opportunite.count({ where: { cabinetId, status: 'QUALIFIED' } }),
      
      // Notifications (Mock for now as Notification model might differ)
      0
    ]);

    return createSuccessResponse({
      clients: {
        total: clientsCount,
        active: activeClientsCount,
        prospects: prospectsCount
      },
      tasks: {
        total: tasksCount,
        overdue: overdueTasksCount,
        today: 0 // To implement if needed
      },
      appointments: {
        total: appointmentsCount,
        today: todayAppointmentsCount
      },
      opportunities: {
        total: opportunitiesCount,
        qualified: qualifiedOpportunitiesCount
      },
      alerts: {
        total: 0,
        kycExpiring: 0
      },
      notifications: {
        unread: unreadNotificationsCount
      }
    });

  } catch (error: any) {
    console.error('Error fetching dashboard counters:', error);
    return createErrorResponse('Internal server error', 500);
  }
}
