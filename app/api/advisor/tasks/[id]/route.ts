import { NextRequest } from 'next/server';
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { isRegularUser } from '@/lib/auth-types';

const updateTaskSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  type: z.enum(['CALL', 'EMAIL', 'MEETING', 'DOCUMENT_REVIEW', 'KYC_UPDATE', 'CONTRACT_RENEWAL', 'FOLLOW_UP', 'ADMINISTRATIVE', 'OTHER']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  dueDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
});

const patchTaskSchema = z.object({
  status: z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dueDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
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

    const task = await prisma.tache.findFirst({
      where: {
        id: params.id,
        assignedToId: context.user.id,
      },
      include: {
        client: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        projet: { select: { id: true, name: true } },
      },
    });

    if (!task) {
      return createErrorResponse('Tâche non trouvée', 404);
    }

    return createSuccessResponse({ task });
  } catch (error: any) {
    console.error('Error fetching task:', error);
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
    const data: any = updateTaskSchema.parse(body);

    const existingTask = await prisma.tache.findFirst({
      where: { id: params.id, assignedToId: context.user.id },
    });

    if (!existingTask) {
      return createErrorResponse('Tâche non trouvée', 404);
    }

    const updateData: any = { ...data };
    
    if (data.status === 'COMPLETED' && existingTask.status !== 'COMPLETED') {
      updateData.completedAt = new Date();
    }
    
    if (data.status && data.status !== 'COMPLETED' && existingTask.status === 'COMPLETED') {
      updateData.completedAt = null;
    }

    const updatedTask = await prisma.tache.update({
      where: { id: params.id },
      data: updateData,
      include: {
        client: { select: { id: true, firstName: true, lastName: true, email: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    return createSuccessResponse({ task: updatedTask, message: 'Tâche mise à jour avec succès' });
  } catch (error: any) {
    console.error('Error updating task:', error);
    if (error instanceof z.ZodError) {
      return createErrorResponse('Données invalides', 400);
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401);
    }
    return createErrorResponse('Internal server error', 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await requireAuth(request);
    
    if (!isRegularUser(context.user)) {
      return createErrorResponse('Invalid user type', 400);
    }

    const body = await request.json();
    const data: any = patchTaskSchema.parse(body);

    const existingTask = await prisma.tache.findFirst({
      where: { id: params.id, assignedToId: context.user.id },
    });

    if (!existingTask) {
      return createErrorResponse('Tâche non trouvée', 404);
    }

    const updateData: any = {};
    
    if (data.status !== undefined) {
      updateData.status = data.status;
      
      if (data.status === 'COMPLETED' && existingTask.status !== 'COMPLETED') {
        updateData.completedAt = new Date();
      } else if (data.status !== 'COMPLETED' && existingTask.status === 'COMPLETED') {
        updateData.completedAt = null;
      }
    }
    
    if (data.priority !== undefined) {
      updateData.priority = data.priority;
    }
    
    if (data.dueDate !== undefined) {
      updateData.dueDate = data.dueDate;
    }

    const updatedTask = await prisma.tache.update({
      where: { id: params.id },
      data: updateData,
      include: {
        client: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    return createSuccessResponse({ task: updatedTask, message: 'Tâche mise à jour avec succès' });
  } catch (error: any) {
    console.error('Error patching task:', error);
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

    const task = await prisma.tache.findFirst({
      where: { id: params.id, assignedToId: context.user.id },
    });

    if (!task) {
      return createErrorResponse('Tâche non trouvée', 404);
    }

    await prisma.tache.update({
      where: { id: params.id },
      data: { status: 'CANCELLED' },
    });

    return createSuccessResponse({ message: 'Tâche annulée avec succès' });
  } catch (error: any) {
    console.error('Error deleting task:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401);
    }
    return createErrorResponse('Internal server error', 500);
  }
}
