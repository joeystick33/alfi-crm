/**
 * Notification Batching Engine — File d'attente prioritaire intelligente
 * 
 * Inspiré par OpenClaw Notification Batching Prompt #9
 * Adapté au CRM AURA pour réduire la fatigue des alertes CGP.
 * 
 * Architecture :
 *   1. Trois tiers de priorité (critique/haute/moyenne)
 *   2. Classification par type de message
 *   3. Regroupement par client/sujet
 *   4. Digest formaté pour le conseiller
 */

import { getPrismaClient } from '@/app/_common/lib/prisma'

// ============================================================================
// TYPES
// ============================================================================

export type NotificationTier = 'critical' | 'high' | 'medium'

export type NotificationCategory =
  | 'kyc_compliance'     // KYC, conformité
  | 'task_alert'         // Tâches en retard
  | 'appointment'        // RDV à venir
  | 'client_lifecycle'   // Événements client (anniversaire, etc.)
  | 'pipeline'           // Pipeline prospect
  | 'portfolio'          // Patrimoine, allocation
  | 'system'             // Système (erreurs, quotas)
  | 'commercial'         // Actions commerciales
  | 'document'           // Documents expirés/manquants

export interface BatchedNotification {
  id: string
  tier: NotificationTier
  category: NotificationCategory
  title: string
  body: string
  clientId?: string
  clientName?: string
  actionUrl?: string
  metadata?: Record<string, unknown>
  createdAt: Date
  batchedAt?: Date       // Quand elle a été incluse dans un digest
  deliveredAt?: Date     // Quand elle a été livrée
}

export interface NotificationDigest {
  id: string
  tier: NotificationTier
  generatedAt: Date
  notifications: BatchedNotification[]
  summary: string
  groupedByCategory: Record<string, BatchedNotification[]>
  totalCount: number
}

// ============================================================================
// CLASSIFICATION RULES
// ============================================================================

/** Règles de classification automatique par type */
const CLASSIFICATION_RULES: Record<string, { tier: NotificationTier; category: NotificationCategory }> = {
  // Critique — livré immédiatement
  'kyc_expired': { tier: 'critical', category: 'kyc_compliance' },
  'system_error': { tier: 'critical', category: 'system' },
  'budget_exceeded': { tier: 'critical', category: 'system' },
  'urgent_task': { tier: 'critical', category: 'task_alert' },
  'compliance_breach': { tier: 'critical', category: 'kyc_compliance' },

  // Haute — batchée toutes les heures
  'task_overdue': { tier: 'high', category: 'task_alert' },
  'appointment_today': { tier: 'high', category: 'appointment' },
  'prospect_hot': { tier: 'high', category: 'pipeline' },
  'contract_expiring': { tier: 'high', category: 'portfolio' },
  'kyc_expiring': { tier: 'high', category: 'kyc_compliance' },
  'document_missing': { tier: 'high', category: 'document' },

  // Moyenne — batchée toutes les 3 heures
  'birthday_reminder': { tier: 'medium', category: 'client_lifecycle' },
  'newsletter_sent': { tier: 'medium', category: 'commercial' },
  'prospect_stale': { tier: 'medium', category: 'pipeline' },
  'portfolio_drift': { tier: 'medium', category: 'portfolio' },
  'task_due_soon': { tier: 'medium', category: 'task_alert' },
  'meeting_followup': { tier: 'medium', category: 'appointment' },
}

// ============================================================================
// NOTIFICATION BATCHING ENGINE
// ============================================================================

export class NotificationBatchingEngine {
  private cabinetId: string
  private userId: string

  constructor(cabinetId: string, userId: string) {
    this.cabinetId = cabinetId
    this.userId = userId
  }

  private get prisma() {
    return getPrismaClient(this.cabinetId)
  }

  /**
   * Soumettre une notification dans la file d'attente
   */
  async enqueue(notification: {
    type: string
    title: string
    body: string
    clientId?: string
    clientName?: string
    actionUrl?: string
    metadata?: Record<string, unknown>
    forceTier?: NotificationTier
  }): Promise<BatchedNotification> {
    const rule = CLASSIFICATION_RULES[notification.type]
    const tier = notification.forceTier || rule?.tier || 'medium'
    const category = rule?.category || 'system'

    const batched: BatchedNotification = {
      id: crypto.randomUUID(),
      tier,
      category,
      title: notification.title,
      body: notification.body,
      clientId: notification.clientId,
      clientName: notification.clientName,
      actionUrl: notification.actionUrl,
      metadata: notification.metadata,
      createdAt: new Date(),
    }

    // Persister dans la table Notification
    await this.prisma.notification.create({
      data: {
        cabinetId: this.cabinetId,
        userId: this.userId,
        clientId: notification.clientId,
        type: notification.type as any,
        title: notification.title,
        message: notification.body,
        priority: tier === 'critical' ? 'URGENTE' : tier === 'high' ? 'HAUTE' : 'NORMALE',
        actionUrl: notification.actionUrl,
        metadata: (notification.metadata || {}) as any,
        isRead: tier === 'critical' ? false : false,
      },
    })

    // Si critique → livrer immédiatement (marquer comme livrée)
    if (tier === 'critical') {
      batched.deliveredAt = new Date()
    }

    return batched
  }

  /**
   * Flush les notifications d'un tier donné — les regrouper en digest
   */
  async flush(tier: NotificationTier): Promise<NotificationDigest | null> {
    // Récupérer toutes les notifications en attente pour ce tier
    const priorityMap: Record<NotificationTier, string> = {
      critical: 'URGENTE',
      high: 'HAUTE',
      medium: 'NORMALE',
    }

    const pending = await this.prisma.notification.findMany({
      where: {
        cabinetId: this.cabinetId,
        userId: this.userId,
        isRead: false,
        priority: priorityMap[tier],
      },
      include: {
        client: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (pending.length === 0) return null

    // Convertir en BatchedNotification
    const notifications: BatchedNotification[] = pending.map(n => ({
      id: n.id,
      tier,
      category: this.typeToCategory(n.type),
      title: n.title,
      body: n.message || '',
      clientId: n.clientId || undefined,
      clientName: n.client ? `${n.client.firstName} ${n.client.lastName}` : undefined,
      actionUrl: n.actionUrl || undefined,
      metadata: (n.metadata as Record<string, unknown>) || undefined,
      createdAt: n.createdAt,
      batchedAt: new Date(),
    }))

    // Grouper par catégorie
    const groupedByCategory: Record<string, BatchedNotification[]> = {}
    for (const n of notifications) {
      if (!groupedByCategory[n.category]) groupedByCategory[n.category] = []
      groupedByCategory[n.category].push(n)
    }

    // Générer un résumé
    const summary = this.generateDigestSummary(groupedByCategory, tier)

    // Marquer comme livrées
    await this.prisma.notification.updateMany({
      where: { id: { in: pending.map(n => n.id) } },
      data: { isRead: true, readAt: new Date() },
    })

    return {
      id: crypto.randomUUID(),
      tier,
      generatedAt: new Date(),
      notifications,
      summary,
      groupedByCategory,
      totalCount: notifications.length,
    }
  }

  /**
   * Obtenir toutes les notifications non lues pour le conseiller
   */
  async getUnread(): Promise<{
    critical: BatchedNotification[]
    high: BatchedNotification[]
    medium: BatchedNotification[]
    total: number
  }> {
    const unread = await this.prisma.notification.findMany({
      where: {
        cabinetId: this.cabinetId,
        userId: this.userId,
        isRead: false,
      },
      include: {
        client: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    const categorize = (n: typeof unread[0]): BatchedNotification => ({
      id: n.id,
      tier: n.priority === 'URGENTE' ? 'critical' : n.priority === 'HAUTE' ? 'high' : 'medium',
      category: this.typeToCategory(n.type),
      title: n.title,
      body: n.message || '',
      clientId: n.clientId || undefined,
      clientName: n.client ? `${n.client.firstName} ${n.client.lastName}` : undefined,
      actionUrl: n.actionUrl || undefined,
      createdAt: n.createdAt,
    })

    const all = unread.map(categorize)

    return {
      critical: all.filter(n => n.tier === 'critical'),
      high: all.filter(n => n.tier === 'high'),
      medium: all.filter(n => n.tier === 'medium'),
      total: all.length,
    }
  }

  /**
   * Marquer les notifications comme lues
   */
  async markAsRead(notificationIds: string[]): Promise<number> {
    const result = await this.prisma.notification.updateMany({
      where: { id: { in: notificationIds }, userId: this.userId },
      data: { isRead: true, readAt: new Date() },
    })
    return result.count
  }

  // ── Helpers ──

  private typeToCategory(type: string): NotificationCategory {
    return CLASSIFICATION_RULES[type]?.category || 'system'
  }

  private generateDigestSummary(
    grouped: Record<string, BatchedNotification[]>,
    tier: NotificationTier,
  ): string {
    const parts: string[] = []
    const tierLabel = tier === 'critical' ? '🚨 URGENT' : tier === 'high' ? '⚡ Important' : '📋 Résumé'

    parts.push(`${tierLabel} — ${Object.values(grouped).flat().length} notification(s)`)

    const CATEGORY_LABELS: Record<string, string> = {
      kyc_compliance: 'Conformité KYC',
      task_alert: 'Tâches',
      appointment: 'Rendez-vous',
      client_lifecycle: 'Vie client',
      pipeline: 'Pipeline',
      portfolio: 'Patrimoine',
      system: 'Système',
      commercial: 'Commercial',
      document: 'Documents',
    }

    for (const [category, notifications] of Object.entries(grouped)) {
      const label = CATEGORY_LABELS[category] || category
      parts.push(`• ${label}: ${notifications.length}`)
    }

    return parts.join('\n')
  }
}
