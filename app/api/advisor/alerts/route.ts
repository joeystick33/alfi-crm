import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/supabase/auth-helpers';
import { isRegularUser } from '@/lib/auth-types';

/**
 * GET /api/advisor/alerts
 * Agrège les alertes critiques pour le conseiller à partir de tâches, KYC et contrats.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    
    if (!isRegularUser(user) || !user.cabinetId) {
      return createErrorResponse('Invalid user type', 400);
    }

    const { searchParams } = new URL(request.url);
    const urgentOnly = searchParams.get('urgent') === 'true';
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const now = new Date();
    const soon = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Overdue or today tasks assigned to this user
    const overdueTasks = await prisma.tache.findMany({
      where: {
        cabinetId: user.cabinetId,
        assignedToId: user.id,
        status: { not: 'COMPLETED' },
        dueDate: { lt: now },
      },
      select: {
        id: true,
        title: true,
        dueDate: true,
        client: { select: { id: true, firstName: true, lastName: true } },
      },
      take: limit,
    });

    // KYC expiring soon
    const kycExpiring = await prisma.client.findMany({
      where: {
        cabinetId: user.cabinetId,
        kycNextReviewDate: {
          gte: now,
          lte: soon,
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        kycNextReviewDate: true,
      },
      take: limit,
    });

    // Contracts renewing soon
    const contractsRenewing = await prisma.contrat.findMany({
      where: {
        cabinetId: user.cabinetId,
        nextRenewalDate: {
          gte: now,
          lte: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000),
        },
      },
      select: {
        id: true,
        name: true,
        nextRenewalDate: true,
        client: { select: { id: true, firstName: true, lastName: true } },
      },
      take: limit,
    });

    const alerts: any[] = [];

    overdueTasks.forEach((task) => {
      alerts.push({
        id: `task-${task.id}`,
        type: 'task',
        severity: 'urgent',
        title: 'Tâche en retard',
        message: task.title,
        particulierId: task.client
          ? { id: task.client.id, firstName: task.client.firstName, lastName: task.client.lastName }
          : null,
      });
    });

    kycExpiring.forEach((client) => {
      alerts.push({
        id: `kyc-${client.id}`,
        type: 'kyc',
        severity: 'high',
        title: 'KYC à renouveler',
        message: `Le KYC de ${client.firstName} ${client.lastName} arrive à échéance le ${client.kycNextReviewDate?.toLocaleDateString('fr-FR')}`,
        particulierId: { id: client.id, firstName: client.firstName, lastName: client.lastName },
      });
    });

    contractsRenewing.forEach((ctr) => {
      alerts.push({
        id: `contract-${ctr.id}`,
        type: 'contract',
        severity: 'medium',
        title: 'Contrat à renouveler',
        message: `Le contrat "${ctr.name}" doit être renouvelé le ${ctr.nextRenewalDate?.toLocaleDateString('fr-FR')}`,
        particulierId: ctr.client
          ? { id: ctr.client.id, firstName: ctr.client.firstName, lastName: ctr.client.lastName }
          : null,
      });
    });

    const filteredAlerts = urgentOnly
      ? alerts.filter((a) => a.severity === 'urgent' || a.severity === 'high')
      : alerts;

    const limitedAlerts = filteredAlerts.slice(0, limit);

    const byType = limitedAlerts.reduce(
      (acc, alert) => {
        acc[alert.type] = (acc[alert.type] || 0) + 1;
        return acc;
      },
      { task: 0, document: 0, appointment: 0, objective: 0, kyc: 0, contract: 0 } as any
    );

    const urgentCount = limitedAlerts.filter(
      (a) => a.severity === 'urgent' || a.severity === 'high'
    ).length;

    return createSuccessResponse({
      alerts: limitedAlerts,
      total: limitedAlerts.length,
      urgent: urgentCount,
      byType,
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401);
    }
    
    return createErrorResponse('Internal server error', 500);
  }
}
