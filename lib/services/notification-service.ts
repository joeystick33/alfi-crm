/**
 * Service de Notifications
 * Gère l'envoi de notifications email et in-app
 */

import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

/**
 * Types de notifications
 */
export enum NotificationType {
  PLAN_CHANGED = 'PLAN_CHANGED',
  ORGANIZATION_RESTRICTED = 'ORGANIZATION_RESTRICTED',
  ORGANIZATION_SUSPENDED = 'ORGANIZATION_SUSPENDED',
  ORGANIZATION_TERMINATED = 'ORGANIZATION_TERMINATED',
  ORGANIZATION_RESTORED = 'ORGANIZATION_RESTORED',
  QUOTA_WARNING = 'QUOTA_WARNING',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  SCHEDULED_ACTION_WARNING = 'SCHEDULED_ACTION_WARNING',
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  TASK_DUE_SOON = 'TASK_DUE_SOON',
  APPOINTMENT_REMINDER = 'APPOINTMENT_REMINDER',
  DOCUMENT_SIGNED = 'DOCUMENT_SIGNED',
  KYC_EXPIRING = 'KYC_EXPIRING',
  CONTRACT_EXPIRING = 'CONTRACT_EXPIRING',
  GOAL_ACHIEVED = 'GOAL_ACHIEVED',
  OPPORTUNITY_CONVERTED = 'OPPORTUNITY_CONVERTED'
}

/**
 * Templates d'emails
 */
const EMAIL_TEMPLATES: Record<string, {
  subject: (data: any) => string;
  body: (data: any) => string;
}> = {
  PLAN_CHANGED: {
    subject: (data) => `Votre plan a été modifié - ${data.newPlan}`,
    body: (data) => `
      <h2>Changement de Plan</h2>
      <p>Bonjour,</p>
      <p>Votre plan d'abonnement a été modifié par un administrateur.</p>
      <ul>
        <li><strong>Ancien plan:</strong> ${data.oldPlan}</li>
        <li><strong>Nouveau plan:</strong> ${data.newPlan}</li>
        <li><strong>Date:</strong> ${new Date().toLocaleDateString('fr-FR')}</li>
      </ul>
      ${data.reason ? `<p><strong>Raison:</strong> ${data.reason}</p>` : ''}
      <p>Pour plus d'informations, connectez-vous à votre espace.</p>
    `
  },

  ORGANIZATION_RESTRICTED: {
    subject: () => 'Votre compte a été restreint',
    body: (data) => `
      <h2>Compte Restreint</h2>
      <p>Bonjour,</p>
      <p>Votre compte a été restreint. Certaines fonctionnalités sont temporairement désactivées.</p>
      <p><strong>Raison:</strong> ${data.reason}</p>
      <p>Veuillez contacter le support pour plus d'informations.</p>
    `
  },

  ORGANIZATION_SUSPENDED: {
    subject: () => 'Votre compte a été suspendu',
    body: (data) => `
      <h2>Compte Suspendu</h2>
      <p>Bonjour,</p>
      <p>Votre compte a été suspendu. L'accès à la plateforme est temporairement bloqué.</p>
      <p><strong>Raison:</strong> ${data.reason}</p>
      <p>Pour réactiver votre compte, veuillez contacter le support.</p>
    `
  },

  QUOTA_WARNING: {
    subject: (data) => `Attention: Quota ${data.quotaName} bientôt atteint`,
    body: (data) => `
      <h2>Alerte Quota</h2>
      <p>Bonjour,</p>
      <p>Vous approchez de la limite de votre quota <strong>${data.quotaName}</strong>.</p>
      <ul>
        <li><strong>Utilisation actuelle:</strong> ${data.current} / ${data.max}</li>
        <li><strong>Pourcentage:</strong> ${data.percentage}%</li>
      </ul>
      <p>Pour augmenter vos quotas, vous pouvez upgrader votre plan d'abonnement.</p>
    `
  },

  TASK_ASSIGNED: {
    subject: (data) => `Nouvelle tâche assignée: ${data.taskTitle}`,
    body: (data) => `
      <h2>Nouvelle Tâche</h2>
      <p>Bonjour,</p>
      <p>Une nouvelle tâche vous a été assignée:</p>
      <ul>
        <li><strong>Titre:</strong> ${data.taskTitle}</li>
        <li><strong>Priorité:</strong> ${data.priority}</li>
        <li><strong>Date d'échéance:</strong> ${data.dueDate ? new Date(data.dueDate).toLocaleDateString('fr-FR') : 'Non définie'}</li>
      </ul>
      ${data.description ? `<p><strong>Description:</strong> ${data.description}</p>` : ''}
      <p>Connectez-vous pour voir les détails.</p>
    `
  },

  APPOINTMENT_REMINDER: {
    subject: (data) => `Rappel: Rendez-vous ${data.title}`,
    body: (data) => `
      <h2>Rappel de Rendez-vous</h2>
      <p>Bonjour,</p>
      <p>Vous avez un rendez-vous prévu:</p>
      <ul>
        <li><strong>Titre:</strong> ${data.title}</li>
        <li><strong>Date:</strong> ${new Date(data.startTime).toLocaleString('fr-FR')}</li>
        <li><strong>Durée:</strong> ${data.duration} minutes</li>
        ${data.location ? `<li><strong>Lieu:</strong> ${data.location}</li>` : ''}
        ${data.visioUrl ? `<li><strong>Lien visio:</strong> <a href="${data.visioUrl}">${data.visioUrl}</a></li>` : ''}
      </ul>
    `
  },

  DOCUMENT_SIGNED: {
    subject: (data) => `Document signé: ${data.documentName}`,
    body: (data) => `
      <h2>Document Signé</h2>
      <p>Bonjour,</p>
      <p>Le document <strong>${data.documentName}</strong> a été signé par ${data.signerName}.</p>
      <p>Connectez-vous pour consulter le document.</p>
    `
  },

  KYC_EXPIRING: {
    subject: () => 'Documents KYC expirant bientôt',
    body: (data) => `
      <h2>Documents KYC à Renouveler</h2>
      <p>Bonjour,</p>
      <p>Les documents KYC suivants expirent bientôt:</p>
      <ul>
        ${data.documents.map((doc: any) => `
          <li><strong>${doc.type}</strong> - Expire le ${new Date(doc.expiryDate).toLocaleDateString('fr-FR')}</li>
        `).join('')}
      </ul>
      <p>Veuillez mettre à jour ces documents.</p>
    `
  },

  CONTRACT_EXPIRING: {
    subject: (data) => `Contrat à renouveler: ${data.contractName}`,
    body: (data) => `
      <h2>Renouvellement de Contrat</h2>
      <p>Bonjour,</p>
      <p>Le contrat <strong>${data.contractName}</strong> arrive à échéance le ${new Date(data.endDate).toLocaleDateString('fr-FR')}.</p>
      <p>Pensez à le renouveler.</p>
    `
  },

  GOAL_ACHIEVED: {
    subject: (data) => `Objectif atteint: ${data.goalTitle}`,
    body: (data) => `
      <h2>🎉 Félicitations !</h2>
      <p>Bonjour,</p>
      <p>L'objectif <strong>${data.goalTitle}</strong> a été atteint !</p>
      <p><strong>Montant cible:</strong> ${data.targetAmount}€</p>
      <p>Bravo pour cette réussite !</p>
    `
  }
};

/**
 * Titres des notifications
 */
function getNotificationTitle(type: string): string {
  const titles: Record<string, string> = {
    PLAN_CHANGED: 'Plan modifié',
    ORGANIZATION_RESTRICTED: 'Compte restreint',
    ORGANIZATION_SUSPENDED: 'Compte suspendu',
    ORGANIZATION_TERMINATED: 'Compte résilié',
    ORGANIZATION_RESTORED: 'Compte restauré',
    QUOTA_WARNING: 'Alerte quota',
    QUOTA_EXCEEDED: 'Quota dépassé',
    SCHEDULED_ACTION_WARNING: 'Action planifiée',
    TASK_ASSIGNED: 'Nouvelle tâche',
    TASK_DUE_SOON: 'Tâche à échéance',
    APPOINTMENT_REMINDER: 'Rappel rendez-vous',
    DOCUMENT_SIGNED: 'Document signé',
    KYC_EXPIRING: 'KYC à renouveler',
    CONTRACT_EXPIRING: 'Contrat à renouveler',
    GOAL_ACHIEVED: 'Objectif atteint',
    OPPORTUNITY_CONVERTED: 'Opportunité convertie'
  };
  return titles[type] || 'Notification';
}

/**
 * Messages des notifications
 */
function getNotificationMessage(type: string, data: any): string {
  const messages: Record<string, (data: any) => string> = {
    PLAN_CHANGED: (d) => `Votre plan a été changé de ${d.oldPlan} à ${d.newPlan}`,
    ORGANIZATION_RESTRICTED: (d) => `Votre compte a été restreint: ${d.reason}`,
    QUOTA_WARNING: (d) => `Attention: ${d.quotaName} à ${d.percentage}%`,
    TASK_ASSIGNED: (d) => `Nouvelle tâche: ${d.taskTitle}`,
    APPOINTMENT_REMINDER: (d) => `Rendez-vous: ${d.title} le ${new Date(d.startTime).toLocaleDateString('fr-FR')}`,
    DOCUMENT_SIGNED: (d) => `${d.documentName} signé par ${d.signerName}`,
    KYC_EXPIRING: (d) => `${d.documents.length} document(s) KYC à renouveler`,
    CONTRACT_EXPIRING: (d) => `${d.contractName} expire le ${new Date(d.endDate).toLocaleDateString('fr-FR')}`,
    GOAL_ACHIEVED: (d) => `Objectif ${d.goalTitle} atteint !`,
    OPPORTUNITY_CONVERTED: (d) => `Opportunité ${d.opportunityTitle} convertie en projet`
  };

  const messageFn = messages[type];
  return messageFn ? messageFn(data) : 'Nouvelle notification';
}

/**
 * Créer une notification in-app
 */
export async function createNotification(
  userId: string,
  type: NotificationType | string,
  data: any
): Promise<string> {
  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      title: getNotificationTitle(type),
      message: getNotificationMessage(type, data),
      data: data as Prisma.InputJsonValue,
      read: false
    }
  });

  return notification.id;
}

/**
 * Envoyer une notification email
 * Note: Nécessite un service d'email (SendGrid, AWS SES, etc.)
 */
export async function sendEmailNotification(
  userId: string,
  type: NotificationType | string,
  data: any
): Promise<void> {
  // Récupérer l'utilisateur
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, firstName: true, lastName: true }
  });

  if (!user || !user.email) {
    console.warn('User not found or no email:', userId);
    return;
  }

  const template = EMAIL_TEMPLATES[type];
  if (!template) {
    console.warn('Email template not found:', type);
    return;
  }

  const emailData = {
    to: user.email,
    subject: template.subject(data),
    html: template.body(data),
    type,
    sentAt: new Date()
  };

  // TODO: Intégrer un service d'email réel (SendGrid, AWS SES, etc.)
  console.log('📧 Email à envoyer:', emailData);

  // Pour le développement, on log seulement
  // En production, utiliser un vrai service d'email
  // await sendGridClient.send(emailData);
}

/**
 * Envoyer une notification complète (in-app + email)
 */
export async function sendNotification(
  userId: string,
  type: NotificationType | string,
  data: any,
  options: {
    emailOnly?: boolean;
    inAppOnly?: boolean;
  } = {}
): Promise<{ notificationId?: string }> {
  const { emailOnly = false, inAppOnly = false } = options;

  let notificationId: string | undefined;

  // Notification in-app
  if (!emailOnly) {
    notificationId = await createNotification(userId, type, data);
  }

  // Notification email
  if (!inAppOnly) {
    await sendEmailNotification(userId, type, data);
  }

  return { notificationId };
}

/**
 * Récupérer les notifications d'un utilisateur
 */
export async function getNotifications(
  userId: string,
  options: {
    unreadOnly?: boolean;
    limit?: number;
    skip?: number;
  } = {}
): Promise<{
  notifications: any[];
  total: number;
  unreadCount: number;
}> {
  const { unreadOnly = false, limit = 50, skip = 0 } = options;

  const where: Prisma.NotificationWhereInput = { userId };
  if (unreadOnly) {
    where.read = false;
  }

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({
      where: { userId, read: false }
    })
  ]);

  return {
    notifications,
    total,
    unreadCount
  };
}

/**
 * Marquer une notification comme lue
 */
export async function markAsRead(notificationId: string): Promise<void> {
  await prisma.notification.update({
    where: { id: notificationId },
    data: {
      read: true,
      readAt: new Date()
    }
  });
}

/**
 * Marquer toutes les notifications comme lues
 */
export async function markAllAsRead(userId: string): Promise<number> {
  const result = await prisma.notification.updateMany({
    where: {
      userId,
      read: false
    },
    data: {
      read: true,
      readAt: new Date()
    }
  });

  return result.count;
}

/**
 * Supprimer une notification
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  await prisma.notification.delete({
    where: { id: notificationId }
  });
}

/**
 * Supprimer les anciennes notifications (> 30 jours)
 */
export async function cleanupOldNotifications(): Promise<number> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const result = await prisma.notification.deleteMany({
    where: {
      createdAt: { lt: thirtyDaysAgo },
      read: true
    }
  });

  return result.count;
}

export default {
  NotificationType,
  createNotification,
  sendEmailNotification,
  sendNotification,
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  cleanupOldNotifications
};
