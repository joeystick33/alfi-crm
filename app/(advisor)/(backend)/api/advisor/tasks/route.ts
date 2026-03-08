 
import { NextRequest } from 'next/server';
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers';
import { TacheService } from '@/app/_common/lib/services/tache-service';
import { isRegularUser } from '@/app/_common/lib/auth-types';
import { z } from 'zod';
import { TacheType, TacheStatus, TachePriority } from '@prisma/client';
import { logger } from '@/app/_common/lib/logger'
// Type for task returned by TacheService
interface TaskItem {
  id: string;
  title: string;
  description: string | null;
  type: TacheType;
  status: TacheStatus;
  priority: TachePriority;
  dueDate: Date | null;
  reminderDate: Date | null;
  completedAt: Date | null;
  clientId: string | null;
  client: { id: string; firstName: string; lastName: string } | null;
  projetId: string | null;
  projet: { id: string; name: string } | null;
  assignedToId: string;
  assignedTo: { id: string; firstName: string; lastName: string } | null;
  createdById: string;
  createdBy: { id: string; firstName: string; lastName: string } | null;
  createdAt: Date;
  updatedAt: Date;
}

const taskQuerySchema = z.object({
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
  offset: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
  status: z.string().optional(),
  priority: z.string().optional(),
  type: z.string().optional(),
  clientId: z.string().optional(),
  projetId: z.string().optional(),
  assignedToId: z.string().optional(),
  search: z.string().optional(),
  sort: z.string().optional(),
  dueBefore: z.string().optional().transform(val => val ? new Date(val) : undefined),
});

const createTaskSchema = z.object({
  title: z.string().min(1, 'Le titre est requis'),
  description: z.string().optional(),
  type: z.nativeEnum(TacheType).default('AUTRE'),
  priority: z.nativeEnum(TachePriority).default('MOYENNE'),
  assignedToId: z.string().optional(),
  clientId: z.string().optional(),
  projetId: z.string().optional(),
  dueDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  reminderDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
});

/**
 * GET /api/advisor/tasks
 * Get tasks with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request);
    const { user } = context;

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400);
    }

    const { searchParams } = new URL(request.url);
    const params = taskQuerySchema.parse(Object.fromEntries(searchParams));

    const service = new TacheService(
      context.cabinetId,
      user.id,
      context.isSuperAdmin
    );

    // Parse status filter (can be comma-separated)
    let statusFilter: TacheStatus | undefined;
    let statusArray: TacheStatus[] | undefined;
    
    if (params.status) {
      if (params.status.includes(',')) {
        statusArray = params.status.split(',').map(s => s.trim() as TacheStatus);
      } else {
        statusFilter = params.status as TacheStatus;
      }
    }

    // Parse priority filter
    let priorityFilter: TachePriority | undefined;
    if (params.priority) {
      priorityFilter = params.priority as TachePriority;
    }

    // Parse type filter
    let typeFilter: TacheType | undefined;
    if (params.type) {
      typeFilter = params.type as TacheType;
    }

    // Get tasks using service
    let tasks = await service.getTaches({
      assignedToId: params.assignedToId || user.id, // Default to current user's tasks
      clientId: params.clientId,
      projetId: params.projetId,
      type: typeFilter,
      status: statusFilter,
      priority: priorityFilter,
      search: params.search,
      dueBefore: params.dueBefore,
    });

    // Filter by multiple statuses if needed
    if (statusArray && statusArray.length > 0) {
      tasks = tasks.filter((task: TaskItem) => statusArray!.includes(task.status));
    }

    // Apply sorting
    if (params.sort) {
      const sortFields = params.sort.split(',');
      tasks.sort((a: TaskItem, b: TaskItem) => {
        for (const field of sortFields) {
          const isDesc = field.startsWith('-');
          const fieldName = isDesc ? field.slice(1) : field;
          
          let comparison = 0;
          if (fieldName === 'priority') {
            const priorityOrder: Record<TachePriority, number> = {
              URGENTE: 0,
              HAUTE: 1,
              MOYENNE: 2,
              BASSE: 3,
            };
            comparison = priorityOrder[a.priority as TachePriority] - priorityOrder[b.priority as TachePriority];
          } else if (fieldName === 'dueDate') {
            const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
            const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
            comparison = aDate - bDate;
          } else if (fieldName === 'createdAt') {
            comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          } else if (fieldName === 'title') {
            comparison = (a.title || '').localeCompare(b.title || '');
          }
          
          if (comparison !== 0) {
            return isDesc ? -comparison : comparison;
          }
        }
        return 0;
      });
    }

    // Apply offset and limit
    const offset = params.offset || 0;
    const limit = params.limit;
    const total = tasks.length;
    
    if (limit) {
      tasks = tasks.slice(offset, offset + limit);
    } else if (offset > 0) {
      tasks = tasks.slice(offset);
    }

    // Format response
    const formattedTasks = tasks.map((task: TaskItem) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      type: task.type,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      reminderDate: task.reminderDate,
      completedAt: task.completedAt,
      clientId: task.clientId,
      clientName: task.client
        ? `${task.client.firstName} ${task.client.lastName}`
        : null,
      client: task.client,
      projetId: task.projetId,
      projet: task.projet,
      assignedToId: task.assignedToId,
      assignedTo: task.assignedTo,
      createdById: task.createdById,
      createdBy: task.createdBy,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    }));

    return createSuccessResponse({
      tasks: formattedTasks,
      total,
      limit: limit || total,
      offset,
    });

  } catch (error: any) {
    logger.error('Error fetching tasks:', { error: error instanceof Error ? error.message : String(error) });
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401);
    }
    return createErrorResponse('Internal server error', 500);
  }
}

/**
 * POST /api/advisor/tasks
 * Create a new task
 */
export async function POST(request: NextRequest) {
  try {
    const context = await requireAuth(request);
    const { user } = context;

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400);
    }

    const body = await request.json();
    const data = createTaskSchema.parse(body);

    const service = new TacheService(
      context.cabinetId,
      user.id,
      context.isSuperAdmin
    );

    const task = await service.createTache({
      title: data.title,
      description: data.description,
      type: data.type,
      priority: data.priority,
      assignedToId: data.assignedToId || user.id, // Default to current user
      clientId: data.clientId,
      projetId: data.projetId,
      dueDate: data.dueDate,
      reminderDate: data.reminderDate,
    });

    return createSuccessResponse({
      task,
      message: 'Tâche créée avec succès',
    }, 201);

  } catch (error: any) {
    logger.error('Error creating task:', { error: error instanceof Error ? error.message : String(error) });

    if (error instanceof z.ZodError) {
      return createErrorResponse('Données invalides', 400);
    }

    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401);
    }

    if (error.message === 'Assigned user not found') {
      return createErrorResponse('Utilisateur assigné non trouvé', 404);
    }

    if (error.message === 'Client not found') {
      return createErrorResponse('Client non trouvé', 404);
    }

    return createErrorResponse(error.message || 'Internal server error', 500);
  }
}
