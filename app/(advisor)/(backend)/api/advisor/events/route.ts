 
import { NextRequest } from 'next/server';
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers';
import { RendezVousService } from '@/app/_common/lib/services/rendez-vous-service';
import { TacheService } from '@/app/_common/lib/services/tache-service';
import { isRegularUser } from '@/app/_common/lib/auth-types';
import { logger } from '@/app/_common/lib/logger'
/**
 * GET /api/advisor/events
 * Fetch calendar events for the advisor using Services
 */
export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request); const { user } = context;

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400);
    }

    const { searchParams } = new URL(request.url);
    const startParam = searchParams.get('startDate');
    const endParam = searchParams.get('endDate');

    const now = new Date();
    const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const startDate = startParam ? new Date(startParam) : defaultStart;
    const endDate = endParam ? new Date(endParam) : defaultEnd;

    const rdvService = new RendezVousService(context.cabinetId, user.id, context.isSuperAdmin);
    const tacheService = new TacheService(context.cabinetId, user.id, context.isSuperAdmin);

    // Fetch appointments and tasks in parallel using services
    const [appointments, tasks] = await Promise.all([
      rdvService.getRendezVous({
        conseillerId: user.id,
        startDate,
        endDate,
      }),
      tacheService.getTaches({
        assignedToId: user.id,
        dueBefore: endDate, // Approximation, service might need 'dueAfter' or range
        status: 'A_FAIRE' // Only pending tasks usually shown in calendar, or filter later
      })
    ]);

    // Filter tasks to ensure they are within range (since service only has dueBefore)
    const filteredTasks = tasks.filter(t =>
      t.dueDate &&
      new Date(t.dueDate) >= startDate &&
      new Date(t.dueDate) <= endDate &&
      t.status !== 'TERMINE'
    );

    // Expand recurring appointments for proper calendar display
    const expandedAppointments = await Promise.all(
      appointments.map(async (rdv: any) => {
        const client = rdv.client
          ? { name: `${rdv.client.firstName} ${rdv.client.lastName}` }
          : null;

        // Non-recurring
        if (!rdv.isRecurring || !rdv.recurrenceRule) {
          return [
            {
              id: rdv.id,
              type: 'rdv',
              title: rdv.title,
              start: rdv.startDate,
              end: rdv.endDate,
              client,
              lieu: rdv.location,
              notes: rdv.notes || undefined,
            },
          ];
        }

        // Recurring parent: expand occurrences for requested range
        try {
          const occurrences = await rdvService.expandRecurrenceForView(rdv.id, startDate, endDate);

          return occurrences.map((occ) => ({
            id: occ.id,
            type: 'rdv',
            title: occ.title,
            start: occ.startDate,
            end: occ.endDate,
            client,
            lieu: rdv.location,
            notes: rdv.notes || undefined,
            isRecurringInstance: true,
            parentId: rdv.id,
            recurrenceOccurrenceDate: occ.recurrenceOccurrenceDate,
          }));
        } catch (e) {
          // If expansion fails, fallback to parent event
          return [
            {
              id: rdv.id,
              type: 'rdv',
              title: rdv.title,
              start: rdv.startDate,
              end: rdv.endDate,
              client,
              lieu: rdv.location,
              notes: rdv.notes || undefined,
              isRecurringInstance: false,
            },
          ];
        }
      })
    );

    const appointmentEvents = expandedAppointments.flat();

    const taskEvents = filteredTasks.map((task: any) => {
      const start = new Date(task.dueDate);
      const end = new Date(start.getTime() + 60 * 60 * 1000); // 1h par défaut

      const priority = (task.priority || 'MOYENNE').toString().toLowerCase();

      return {
        id: task.id,
        type: 'task',
        title: task.title,
        start,
        end,
        priority: priority === 'urgent' ? 'high' : priority,
        client: task.client
          ? { name: `${task.client.firstName} ${task.client.lastName}` }
          : null,
      };
    });

    const events = [...appointmentEvents, ...taskEvents];

    return createSuccessResponse({
      events,
      total: events.length,
      byType: {
        appointment: appointments.length,
        task: filteredTasks.length,
        activity: 0,
      },
    });
  } catch (error) {
    logger.error('Error fetching events:', { error: error instanceof Error ? error.message : String(error) });

    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401);
    }

    return createErrorResponse('Internal server error', 500);
  }
}
