import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { isRegularUser } from '@/lib/auth-types';

const taskQuerySchema = z.object({
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 50),
  status: z.string().optional(),
  priority: z.string().optional(),
  type: z.string().optional(),
  clientId: z.string().optional(),
  overdue: z.string().optional().transform(val => val === 'true'),
  dueToday: z.string().optional().transform(val => val === 'true'),
  sort: z.string().optional().default('dueDate'),
  order: z.enum(['asc', 'desc']).optional().default('asc'),
});

const createTaskSchema = z.object({
  title: z.string().min(1, 'Le titre est requis'),
  description: z.string().optional(),
  type: z.enum(['CALL', 'EMAIL', 'MEETING', 'DOCUMENT_REVIEW', 'KYC_UPDATE', 'CONTRACT_RENEWAL', 'FOLLOW_UP', 'ADMINISTRATIVE', 'OTHER']).default('OTHER'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  dueDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  clientId: z.string().optional(),
  projetId: z.string().optional(),
});

/**
 * GET /api/advisor/tasks
 * Get tasks with filtering and sorting
 */
export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request);
    
    if (!isRegularUser(context.user)) {
      return createErrorResponse('Invalid user type', 400);
    }

    const { searchParams } = new URL(request.url);
    const params = taskQuerySchema.parse(Object.fromEntries(searchParams));

    const userId = context.user.id;
    const cabinetId = context.cabinetId;

    // Build where clause
    const where: any = {
      cabinetId,
      assignedToId: userId,
    };

    // Status filter
    if (params.status) {
      const statuses = params.status.split(',').map(s => s.trim().toUpperCase());
      where.status = statuses.length === 1 ? statuses[0] : { in: statuses };
    }

    // Priority filter
    if (params.priority) {
      const priorities = params.priority.split(',').map(p => p.trim().toUpperCase());
      where.priority = priorities.length === 1 ? priorities[0] : { in: priorities };
    }

    // Type filter
    if (params.type) {
      where.type = params.type.toUpperCase();
    }

    // Client filter
    if (params.clientId) {
      where.clientId = params.clientId;
    }

    // Overdue filter
    if (params.overdue) {
      where.dueDate = { lt: new Date() };
      where.status = { notIn: ['COMPLETED', 'CANCELLED'] };
    }

    // Due today filter
    if (params.dueToday) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      where.dueDate = { gte: today, lt: tomorrow };
      where.status = { notIn: ['COMPLETED', 'CANCELLED'] };
    }

    // Build orderBy clause
    let orderBy: any = [];
    if (params.sort) {
      const sortFields = params.sort.split(',').map(s => s.trim());
      orderBy = sortFields.map(field => ({ [field]: params.order || 'asc' }));
    } else {
      orderBy = [{ dueDate: 'asc' }];
    }

    // Execute query
    const tasks = await prisma.tache.findMany({
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
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy,
      take: params.limit,
    });

    // Format response
    const formattedTasks = tasks.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      type: task.type,
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate,
      completedAt: task.completedAt,
      client: task.client ? {
        id: task.client.id,
        firstName: task.client.firstName,
        lastName: task.client.lastName,
        email: task.client.email,
        phone: task.client.phone,
      } : null,
      clientName: task.client 
        ? `${task.client.firstName} ${task.client.lastName}`
        : null,
      assignedTo: task.assignedTo ? {
        id: task.assignedTo.id,
        firstName: task.assignedTo.firstName,
        lastName: task.assignedTo.lastName,
        email: task.assignedTo.email,
      } : null,
      createdBy: task.createdBy ? {
        id: task.createdBy.id,
        firstName: task.createdBy.firstName,
        lastName: task.createdBy.lastName,
      } : null,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    }));

    // Calculate stats
    const stats = {
      total: formattedTasks.length,
      byStatus: {} as Record<string, number>,
      byPriority: {} as Record<string, number>,
      overdue: 0,
    };

    const now = new Date();
    formattedTasks.forEach(task => {
      stats.byStatus[task.status] = (stats.byStatus[task.status] || 0) + 1;
      stats.byPriority[task.priority] = (stats.byPriority[task.priority] || 0) + 1;
      
      if (task.dueDate && new Date(task.dueDate) < now && 
          task.status !== 'COMPLETED' && task.status !== 'CANCELLED') {
        stats.overdue++;
      }
    });

    return createSuccessResponse({
      tasks: formattedTasks,
      stats,
      count: formattedTasks.length,
    });

  } catch (error: any) {
    console.error('Error fetching tasks:', error);
    
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
    
    if (!isRegularUser(context.user)) {
      return createErrorResponse('Invalid user type', 400);
    }

    const body = await request.json();
    const data: any = createTaskSchema.parse(body);

    const userId = context.user.id;
    const cabinetId = context.cabinetId;

    // Create task
    const task = await prisma.tache.create({
      data: {
        cabinetId,
        assignedToId: userId,
        createdById: userId,
        title: data.title,
        description: data.description,
        type: data.type,
        priority: data.priority,
        status: 'TODO',
        dueDate: data.dueDate,
        clientId: data.clientId,
        projetId: data.projetId,
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return createSuccessResponse({
      task: {
        id: task.id,
        title: task.title,
        description: task.description,
        type: task.type,
        priority: task.priority,
        status: task.status,
        dueDate: task.dueDate,
        client: task.client,
        assignedTo: task.assignedTo,
        createdAt: task.createdAt,
      },
      message: 'Tâche créée avec succès',
    }, 201);

  } catch (error: any) {
    console.error('Error creating task:', error);
    
    if (error instanceof z.ZodError) {
      return createErrorResponse('Données invalides', 400);
    }
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401);
    }

    return createErrorResponse('Internal server error', 500);
  }
}
