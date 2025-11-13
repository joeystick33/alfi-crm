/**
 * Service d'Automatisation
 * Gère les tâches automatiques et les actions planifiées
 */

import prisma from '@/lib/prisma';
import { sendNotification, NotificationType } from './notification-service';
import { Prisma } from '@prisma/client';

/**
 * Types d'actions planifiées
 */
export enum ScheduledActionType {
  SUSPEND = 'SUSPEND',
  TERMINATE = 'TERMINATE',
  RESTORE = 'RESTORE',
  DOWNGRADE_PLAN = 'DOWNGRADE_PLAN'
}

/**
 * Créer une action planifiée
 */
export async function scheduleAction(
  cabinetId: string,
  action: ScheduledActionType,
  scheduledFor: Date,
  reason: string,
  performedBy: string
): Promise<string> {
  const scheduledAction = await prisma.scheduledAction.create({
    data: {
      cabinetId,
      action,
      scheduledFor,
      reason,
      performedBy,
      status: 'PENDING'
    }
  });

  return scheduledAction.id;
}

/**
 * Exécuter une action planifiée
 */
async function executeAction(action: any): Promise<void> {
  const { cabinetId, action: actionType, reason } = action;

  switch (actionType) {
    case ScheduledActionType.SUSPEND:
      // Suspendre le cabinet
      await prisma.cabinet.update({
        where: { id: cabinetId },
        data: {
          status: 'SUSPENDED',
          suspendedAt: new Date(),
          suspensionReason: reason
        }
      });

      // Notifier les admins du cabinet
      const admins = await prisma.user.findMany({
        where: {
          cabinetId,
          role: { in: ['ADMIN', 'OWNER'] }
        },
        select: { id: true }
      });

      for (const admin of admins) {
        await sendNotification(
          admin.id,
          NotificationType.ORGANIZATION_SUSPENDED,
          { reason }
        );
      }
      break;

    case ScheduledActionType.TERMINATE:
      // Résilier le cabinet
      await prisma.cabinet.update({
        where: { id: cabinetId },
        data: {
          status: 'TERMINATED',
          terminatedAt: new Date(),
          terminationReason: reason
        }
      });

      // Notifier
      const terminateAdmins = await prisma.user.findMany({
        where: {
          cabinetId,
          role: { in: ['ADMIN', 'OWNER'] }
        },
        select: { id: true }
      });

      for (const admin of terminateAdmins) {
        await sendNotification(
          admin.id,
          NotificationType.ORGANIZATION_TERMINATED,
          { reason }
        );
      }
      break;

    case ScheduledActionType.RESTORE:
      // Restaurer le cabinet
      await prisma.cabinet.update({
        where: { id: cabinetId },
        data: {
          status: 'ACTIVE',
          suspendedAt: null,
          suspensionReason: null
        }
      });
      break;

    default:
      throw new Error(`Action non supportée: ${actionType}`);
  }

  // Logger l'action
  await prisma.auditLog.create({
    data: {
      cabinetId,
      action: 'SCHEDULED_ACTION_EXECUTED',
      entityType: 'Cabinet',
      entityId: cabinetId,
      userId: 'SYSTEM',
      metadata: {
        actionType,
        reason,
        scheduledActionId: action.id
      } as Prisma.InputJsonValue
    }
  });
}

/**
 * Exécuter les actions planifiées
 * À appeler via un cron job quotidien
 */
export async function executeScheduledActions(): Promise<{
  executed: number;
  failed: number;
}> {
  const now = new Date();
  let executed = 0;
  let failed = 0;

  const actions = await prisma.scheduledAction.findMany({
    where: {
      status: 'PENDING',
      scheduledFor: { lte: now }
    }
  });

  console.log(`🤖 Exécution de ${actions.length} actions planifiées`);

  for (const action of actions) {
    try {
      await executeAction(action);

      // Marquer comme exécutée
      await prisma.scheduledAction.update({
        where: { id: action.id },
        data: {
          status: 'EXECUTED',
          executedAt: new Date()
        }
      });

      executed++;
    } catch (error) {
      console.error('Erreur exécution action:', action.id, error);

      // Marquer comme échouée
      await prisma.scheduledAction.update({
        where: { id: action.id },
        data: {
          status: 'FAILED',
          error: error instanceof Error ? error.message : 'Unknown error',
          failedAt: new Date()
        }
      });

      failed++;
    }
  }

  return { executed, failed };
}

/**
 * Envoyer des alertes pour les actions planifiées à venir
 */
export async function sendScheduledActionWarnings(): Promise<number> {
  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  let warnings = 0;

  const upcomingActions = await prisma.scheduledAction.findMany({
    where: {
      status: 'PENDING',
      scheduledFor: {
        gte: now,
        lte: in7Days
      },
      lastWarningAt: null
    }
  });

  for (const action of upcomingActions) {
    const daysRemaining = Math.ceil(
      (action.scheduledFor.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
    );

    // Envoyer alerte si 7, 3 ou 1 jour restant
    if ([7, 3, 1].includes(daysRemaining)) {
      // Notifier les admins
      const admins = await prisma.user.findMany({
        where: {
          cabinetId: action.cabinetId,
          role: { in: ['ADMIN', 'OWNER'] }
        },
        select: { id: true }
      });

      for (const admin of admins) {
        await sendNotification(
          admin.id,
          NotificationType.SCHEDULED_ACTION_WARNING,
          {
            action: action.action,
            scheduledFor: action.scheduledFor,
            daysRemaining,
            reason: action.reason
          }
        );
      }

      // Marquer l'alerte comme envoyée
      await prisma.scheduledAction.update({
        where: { id: action.id },
        data: { lastWarningAt: new Date() }
      });

      warnings++;
    }
  }

  return warnings;
}

/**
 * Vérifier les quotas et envoyer des alertes
 */
export async function checkQuotasAndAlert(): Promise<number> {
  let alertsSent = 0;

  const cabinets = await prisma.cabinet.findMany({
    where: {
      status: 'ACTIVE'
    }
  });

  for (const cabinet of cabinets) {
    const quotas = cabinet.quotas as any || {};
    const usage = cabinet.usage as any || {};

    // Vérifier chaque quota
    const quotaChecks = [
      { name: 'Conseillers', current: usage.advisorsCount || 0, max: quotas.maxAdvisors },
      { name: 'Clients', current: usage.clientsCount || 0, max: quotas.maxClients },
      { name: 'Stockage', current: usage.storageUsedGB || 0, max: quotas.maxStorageGB }
    ];

    for (const quota of quotaChecks) {
      if (quota.max === -1) continue; // Illimité

      const percentage = Math.round((quota.current / quota.max) * 100);

      // Alerte à 80%
      if (percentage >= 80 && percentage < 100) {
        // Vérifier si une alerte a déjà été envoyée dans les dernières 24h
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentAlert = await prisma.quotaAlert.findFirst({
          where: {
            cabinetId: cabinet.id,
            quotaName: quota.name,
            level: 'WARNING',
            createdAt: { gte: yesterday }
          }
        });

        if (!recentAlert) {
          // Notifier les admins
          const admins = await prisma.user.findMany({
            where: {
              cabinetId: cabinet.id,
              role: { in: ['ADMIN', 'OWNER'] }
            },
            select: { id: true }
          });

          for (const admin of admins) {
            await sendNotification(
              admin.id,
              NotificationType.QUOTA_WARNING,
              {
                quotaName: quota.name,
                current: quota.current,
                max: quota.max,
                percentage
              }
            );
          }

          // Enregistrer l'alerte
          await prisma.quotaAlert.create({
            data: {
              cabinetId: cabinet.id,
              quotaName: quota.name,
              level: 'WARNING',
              percentage
            }
          });

          alertsSent++;
        }
      }

      // Alerte à 100%
      if (percentage >= 100) {
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentAlert = await prisma.quotaAlert.findFirst({
          where: {
            cabinetId: cabinet.id,
            quotaName: quota.name,
            level: 'CRITICAL',
            createdAt: { gte: yesterday }
          }
        });

        if (!recentAlert) {
          const admins = await prisma.user.findMany({
            where: {
              cabinetId: cabinet.id,
              role: { in: ['ADMIN', 'OWNER'] }
            },
            select: { id: true }
          });

          for (const admin of admins) {
            await sendNotification(
              admin.id,
              NotificationType.QUOTA_EXCEEDED,
              {
                quotaName: quota.name,
                current: quota.current,
                max: quota.max
              }
            );
          }

          await prisma.quotaAlert.create({
            data: {
              cabinetId: cabinet.id,
              quotaName: quota.name,
              level: 'CRITICAL',
              percentage
            }
          });

          alertsSent++;
        }
      }
    }
  }

  return alertsSent;
}

/**
 * Envoyer des rappels pour les tâches à échéance
 */
export async function sendTaskReminders(): Promise<number> {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const endOfTomorrow = new Date(tomorrow);
  endOfTomorrow.setHours(23, 59, 59, 999);

  // Tâches dues demain
  const tasks = await prisma.tache.findMany({
    where: {
      status: { not: 'COMPLETED' },
      dueDate: {
        gte: tomorrow,
        lte: endOfTomorrow
      }
    },
    include: {
      assignedToUser: {
        select: { id: true, firstName: true, lastName: true }
      }
    }
  });

  for (const task of tasks) {
    if (task.assignedToUser) {
      await sendNotification(
        task.assignedToUser.id,
        NotificationType.TASK_DUE_SOON,
        {
          taskTitle: task.title,
          dueDate: task.dueDate,
          priority: task.priority
        }
      );
    }
  }

  return tasks.length;
}

/**
 * Envoyer des rappels pour les rendez-vous
 */
export async function sendAppointmentReminders(): Promise<number> {
  const now = new Date();
  const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  // Rendez-vous dans les prochaines 24h
  const appointments = await prisma.rendezVous.findMany({
    where: {
      status: 'SCHEDULED',
      startTime: {
        gte: now,
        lte: in24Hours
      },
      reminderSent: false
    },
    include: {
      user: {
        select: { id: true }
      },
      client: {
        select: { email: true, firstName: true, lastName: true }
      }
    }
  });

  for (const appointment of appointments) {
    // Notifier le conseiller
    if (appointment.user) {
      await sendNotification(
        appointment.user.id,
        NotificationType.APPOINTMENT_REMINDER,
        {
          title: appointment.title,
          startTime: appointment.startTime,
          duration: appointment.duration,
          location: appointment.location,
          visioUrl: appointment.visioUrl
        }
      );
    }

    // Marquer le rappel comme envoyé
    await prisma.rendezVous.update({
      where: { id: appointment.id },
      data: { reminderSent: true }
    });
  }

  return appointments.length;
}

/**
 * Vérifier les documents KYC expirant
 */
export async function checkExpiringKYC(): Promise<number> {
  const in30Days = new Date();
  in30Days.setDate(in30Days.getDate() + 30);

  const expiringDocs = await prisma.kYCDocument.findMany({
    where: {
      expiryDate: {
        lte: in30Days,
        gte: new Date()
      },
      status: 'VALIDATED'
    },
    include: {
      client: {
        include: {
          conseillerPrincipal: {
            select: { id: true }
          }
        }
      }
    }
  });

  // Grouper par conseiller
  const byAdvisor = new Map<string, any[]>();

  for (const doc of expiringDocs) {
    const advisorId = doc.client.conseillerPrincipal?.id;
    if (advisorId) {
      if (!byAdvisor.has(advisorId)) {
        byAdvisor.set(advisorId, []);
      }
      byAdvisor.get(advisorId)!.push({
        clientName: `${doc.client.firstName} ${doc.client.lastName}`,
        type: doc.type,
        expiryDate: doc.expiryDate
      });
    }
  }

  // Envoyer une notification par conseiller
  for (const [advisorId, documents] of byAdvisor.entries()) {
    await sendNotification(
      advisorId,
      NotificationType.KYC_EXPIRING,
      { documents }
    );
  }

  return byAdvisor.size;
}

/**
 * Vérifier les contrats expirant
 */
export async function checkExpiringContracts(): Promise<number> {
  const in60Days = new Date();
  in60Days.setDate(in60Days.getDate() + 60);

  const expiringContracts = await prisma.contrat.findMany({
    where: {
      endDate: {
        lte: in60Days,
        gte: new Date()
      },
      status: 'ACTIVE',
      renewalReminderSent: false
    },
    include: {
      client: {
        include: {
          conseillerPrincipal: {
            select: { id: true }
          }
        }
      }
    }
  });

  for (const contract of expiringContracts) {
    const advisorId = contract.client.conseillerPrincipal?.id;
    if (advisorId) {
      await sendNotification(
        advisorId,
        NotificationType.CONTRACT_EXPIRING,
        {
          contractName: contract.name,
          clientName: `${contract.client.firstName} ${contract.client.lastName}`,
          endDate: contract.endDate
        }
      );

      // Marquer le rappel comme envoyé
      await prisma.contrat.update({
        where: { id: contract.id },
        data: { renewalReminderSent: true }
      });
    }
  }

  return expiringContracts.length;
}

/**
 * Tâche principale à exécuter quotidiennement
 */
export async function runDailyTasks(): Promise<{
  scheduledActions: { executed: number; failed: number };
  warnings: number;
  quotaAlerts: number;
  taskReminders: number;
  appointmentReminders: number;
  kycAlerts: number;
  contractAlerts: number;
}> {
  console.log('🤖 Démarrage des tâches automatiques quotidiennes');

  const results = {
    scheduledActions: await executeScheduledActions(),
    warnings: await sendScheduledActionWarnings(),
    quotaAlerts: await checkQuotasAndAlert(),
    taskReminders: await sendTaskReminders(),
    appointmentReminders: await sendAppointmentReminders(),
    kycAlerts: await checkExpiringKYC(),
    contractAlerts: await checkExpiringContracts()
  };

  console.log('✅ Tâches quotidiennes terminées:', results);
  return results;
}

/**
 * Tâche hebdomadaire
 */
export async function runWeeklyTasks(): Promise<{
  notificationsDeleted: number;
}> {
  console.log('🤖 Démarrage des tâches automatiques hebdomadaires');

  const { cleanupOldNotifications } = await import('./notification-service');
  const notificationsDeleted = await cleanupOldNotifications();

  console.log('✅ Tâches hebdomadaires terminées');
  return { notificationsDeleted };
}

export default {
  ScheduledActionType,
  scheduleAction,
  executeScheduledActions,
  sendScheduledActionWarnings,
  checkQuotasAndAlert,
  sendTaskReminders,
  sendAppointmentReminders,
  checkExpiringKYC,
  checkExpiringContracts,
  runDailyTasks,
  runWeeklyTasks
};
