// ============================================================================
// AURA — Background Mode (spec §3.1)
//
// Always-on, silent, event-driven monitoring.
// No user prompt required. Never interrupts. Only surfaces insights with
// clear value.
//
// Functions:
//   • Monitor CRM changes (new clients, modified data)
//   • Monitor meeting completions → trigger post-meeting pipeline
//   • Detect inconsistencies, missing data, opportunities
//   • Trigger autonomous workflows
//   • Prepare proposals and queued actions
//
// Activation:
//   Via CRON API route or webhook, not a long-running process.
//   Each invocation runs one scan cycle.
// ============================================================================

import { type AuraModelRole } from './aura-config'
import { callAuraLLM } from './aura-models'
import { getBudgetStatus } from './aura-budget'
import { logger } from '@/app/_common/lib/logger'

// ── TYPES ──────────────────────────────────────────────────────────────────

export type BackgroundJobType =
  | 'crm_monitor'           // Détecter changements CRM
  | 'meeting_completion'    // Post-meeting pipeline trigger
  | 'data_inconsistency'   // Détecter incohérences données
  | 'kyc_expiry'           // Vérifier expirations KYC
  | 'opportunity_detection' // Détecter opportunités commerciales
  | 'task_overdue'         // Détecter tâches en retard
  | 'compliance_check'     // Vérifications conformité

export interface BackgroundJobResult {
  jobType: BackgroundJobType
  cabinetId: string
  /** Insights détectés */
  insights: BackgroundInsight[]
  /** Actions proposées (nécessitent validation) */
  proposedActions: ProposedAction[]
  /** Durée d'exécution */
  durationMs: number
  /** Tokens consommés */
  tokensUsed: number
}

export interface BackgroundInsight {
  id: string
  type: 'anomaly' | 'opportunity' | 'warning' | 'info'
  title: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  /** Client concerné (si applicable) */
  clientId?: string
  clientName?: string
  /** Données structurées associées */
  data?: Record<string, unknown>
  /** Recommandation d'action */
  suggestedAction?: string
}

export interface ProposedAction {
  id: string
  type: 'crm_update' | 'notification' | 'task_creation' | 'email' | 'alert'
  title: string
  description: string
  /** Paramètres de l'action */
  params: Record<string, unknown>
  /** L'action nécessite validation humaine (spec §9) */
  requiresValidation: true
  /** Statut de l'action */
  status: 'proposed' | 'validated' | 'rejected' | 'executed'
}

// ── SCAN CYCLE ─────────────────────────────────────────────────────────────

/**
 * Exécute un cycle de scan background pour un cabinet.
 * Appelé par le CRON ou un webhook.
 *
 * Respecte les règles §3.1 :
 *   - Never chat casually
 *   - Never interrupt user
 *   - Only surface insights with clear value
 */
export async function runBackgroundScanCycle(
  cabinetId: string,
  userId: string,
  jobs?: BackgroundJobType[],
): Promise<BackgroundJobResult[]> {
  const startTime = Date.now()

  // Vérifier le budget — désactiver les jobs non-essentiels si proche du quota
  const budget = await getBudgetStatus(cabinetId, userId)
  if (budget.shortMode) {
    logger.info('[AURA Background] SHORT MODE actif — jobs non-essentiels désactivés', { module: 'aura-background' })
    // En SHORT MODE, ne garder que les vérifications critiques
    jobs = (jobs || ['kyc_expiry', 'task_overdue', 'compliance_check']).filter(
      j => !budget.disabledFeatures.includes('background_monitoring') || j === 'kyc_expiry'
    )
  }

  const jobsToRun = jobs || [
    'kyc_expiry',
    'task_overdue',
    'data_inconsistency',
    'opportunity_detection',
    'compliance_check',
  ]

  const results: BackgroundJobResult[] = []

  for (const jobType of jobsToRun) {
    try {
      const result = await executeBackgroundJob(jobType, cabinetId, userId)
      results.push(result)
    } catch (error) {
      logger.error(`[AURA Background] Job ${jobType} failed`, { module: 'aura-background', action: jobType }, error instanceof Error ? error : undefined)
    }
  }

  const totalDuration = Date.now() - startTime
  const totalInsights = results.reduce((sum, r) => sum + r.insights.length, 0)
  const totalActions = results.reduce((sum, r) => sum + r.proposedActions.length, 0)

  logger.info(`[AURA Background] Cycle terminé: ${totalInsights} insights, ${totalActions} actions proposées (${totalDuration}ms)`, {
    module: 'aura-background',
    duration: totalDuration,
  })

  return results
}

// ── EXECUTION D'UN JOB ─────────────────────────────────────────────────────

async function executeBackgroundJob(
  jobType: BackgroundJobType,
  cabinetId: string,
  userId: string,
): Promise<BackgroundJobResult> {
  const startTime = Date.now()

  switch (jobType) {
    case 'kyc_expiry':
      return await checkKYCExpiry(cabinetId, userId, startTime)

    case 'task_overdue':
      return await checkOverdueTasks(cabinetId, userId, startTime)

    case 'data_inconsistency':
      return await checkDataInconsistencies(cabinetId, userId, startTime)

    case 'opportunity_detection':
      return await detectOpportunities(cabinetId, userId, startTime)

    case 'compliance_check':
      return await checkCompliance(cabinetId, userId, startTime)

    case 'meeting_completion':
      return await checkMeetingCompletions(cabinetId, userId, startTime)

    case 'crm_monitor':
      return await monitorCRMChanges(cabinetId, userId, startTime)

    default:
      return {
        jobType,
        cabinetId,
        insights: [],
        proposedActions: [],
        durationMs: Date.now() - startTime,
        tokensUsed: 0,
      }
  }
}

// ── JOBS CONCRETS ──────────────────────────────────────────────────────────

/**
 * Vérifie les expirations KYC proches (30 jours).
 * Champs réels : kycNextReviewDate, kycStatus (EN_ATTENTE, VALIDE, etc.)
 */
async function checkKYCExpiry(
  cabinetId: string,
  _userId: string,
  startTime: number,
): Promise<BackgroundJobResult> {
  const insights: BackgroundInsight[] = []
  const proposedActions: ProposedAction[] = []

  try {
    const { getPrismaClient } = await import('../../prisma')
    const prisma = getPrismaClient(cabinetId, false)

    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

    const expiringClients = await prisma.client.findMany({
      where: {
        cabinetId,
        status: { not: 'ARCHIVE' },
        OR: [
          { kycNextReviewDate: { lte: thirtyDaysFromNow, gte: new Date() } },
          { kycNextReviewDate: { lte: new Date() } },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        kycNextReviewDate: true,
        kycStatus: true,
      },
      take: 50,
    })

    for (const client of expiringClients) {
      const isExpired = client.kycNextReviewDate && client.kycNextReviewDate <= new Date()
      const daysLeft = client.kycNextReviewDate
        ? Math.ceil((client.kycNextReviewDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : 0

      insights.push({
        id: `kyc-${client.id}`,
        type: 'warning',
        title: isExpired
          ? `KYC expiré — ${client.firstName} ${client.lastName}`
          : `KYC expire dans ${daysLeft}j — ${client.firstName} ${client.lastName}`,
        description: isExpired
          ? `Le KYC de ${client.firstName} ${client.lastName} est expiré depuis ${Math.abs(daysLeft)} jours. Mise à jour urgente requise.`
          : `Le KYC de ${client.firstName} ${client.lastName} expire dans ${daysLeft} jours. Planifier un renouvellement.`,
        severity: isExpired ? 'critical' : daysLeft <= 7 ? 'high' : 'medium',
        clientId: client.id,
        clientName: `${client.firstName} ${client.lastName}`,
        suggestedAction: isExpired
          ? 'Planifier un RDV de mise à jour KYC immédiatement'
          : 'Envoyer un rappel de renouvellement KYC',
      })

      proposedActions.push({
        id: `kyc-task-${client.id}`,
        type: 'task_creation',
        title: `Renouvellement KYC — ${client.firstName} ${client.lastName}`,
        description: `Créer une tâche de renouvellement KYC pour ${client.firstName} ${client.lastName}`,
        params: {
          title: `Renouvellement KYC — ${client.firstName} ${client.lastName}`,
          type: 'MISE_A_JOUR_KYC',
          priority: isExpired ? 'URGENTE' : 'HAUTE',
          clientId: client.id,
          dueDate: isExpired
            ? new Date().toISOString()
            : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
        requiresValidation: true,
        status: 'proposed',
      })
    }
  } catch {
    logger.warn('[AURA Background] KYC check failed', { module: 'aura-background' })
  }

  return {
    jobType: 'kyc_expiry',
    cabinetId,
    insights,
    proposedActions,
    durationMs: Date.now() - startTime,
    tokensUsed: 0,
  }
}

/**
 * Détecte les tâches en retard.
 */
async function checkOverdueTasks(
  cabinetId: string,
  userId: string,
  startTime: number,
): Promise<BackgroundJobResult> {
  const insights: BackgroundInsight[] = []
  let tokensUsed = 0

  try {
    const { getPrismaClient } = await import('../../prisma')
    const prisma = getPrismaClient(cabinetId, false)

    const overdueTasks = await prisma.tache.findMany({
      where: {
        cabinetId,
        assignedToId: userId,
        status: { in: ['A_FAIRE', 'EN_COURS'] },
        dueDate: { lt: new Date() },
      },
      include: {
        client: { select: { firstName: true, lastName: true } },
      },
      take: 20,
      orderBy: { dueDate: 'asc' },
    })

    if (overdueTasks.length > 0) {
      const daysOverdue = (task: { dueDate: Date | null }) =>
        task.dueDate ? Math.ceil((Date.now() - task.dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0

      insights.push({
        id: 'overdue-summary',
        type: 'warning',
        title: `${overdueTasks.length} tâche(s) en retard`,
        description: overdueTasks
          .slice(0, 5)
          .map(t => `• ${t.title} (${daysOverdue(t)}j de retard)${t.client ? ` — ${t.client.firstName} ${t.client.lastName}` : ''}`)
          .join('\n'),
        severity: overdueTasks.some(t => daysOverdue(t) > 7) ? 'high' : 'medium',
        data: {
          count: overdueTasks.length,
          tasks: overdueTasks.slice(0, 5).map(t => ({
            id: t.id,
            title: t.title,
            daysOverdue: daysOverdue(t),
            clientName: t.client ? `${t.client.firstName} ${t.client.lastName}` : null,
          })),
        },
      })
    }
  } catch {
    logger.warn('[AURA Background] Overdue tasks check failed', { module: 'aura-background' })
  }

  return {
    jobType: 'task_overdue',
    cabinetId,
    insights,
    proposedActions: [],
    durationMs: Date.now() - startTime,
    tokensUsed,
  }
}

/**
 * Détecte les incohérences dans les données CRM.
 * Utilise le subagent pour analyser.
 */
async function checkDataInconsistencies(
  cabinetId: string,
  userId: string,
  startTime: number,
): Promise<BackgroundJobResult> {
  const insights: BackgroundInsight[] = []
  let tokensUsed = 0

  try {
    const { getPrismaClient } = await import('../../prisma')
    const prisma = getPrismaClient(cabinetId, false)

    // Clients sans email ni téléphone
    const clientsNoContact = await prisma.client.count({
      where: {
        cabinetId,
        status: { not: 'ARCHIVE' },
        email: null,
        phone: null,
      },
    })

    if (clientsNoContact > 0) {
      insights.push({
        id: 'no-contact-info',
        type: 'anomaly',
        title: `${clientsNoContact} client(s) sans coordonnées`,
        description: `${clientsNoContact} clients actifs n'ont ni email ni téléphone renseigné. Cela empêche toute communication.`,
        severity: 'medium',
        suggestedAction: 'Compléter les coordonnées des clients concernés',
      })
    }

    // Clients actifs sans aucun contrat
    const clientsNoContract = await prisma.client.count({
      where: {
        cabinetId,
        status: 'ACTIF',
        contrats: { none: {} },
      },
    })

    if (clientsNoContract > 0) {
      insights.push({
        id: 'active-no-contract',
        type: 'anomaly',
        title: `${clientsNoContract} client(s) actif(s) sans contrat`,
        description: `${clientsNoContract} clients au statut "Actif" n'ont aucun contrat associé. Vérifier la cohérence.`,
        severity: 'low',
      })
    }
  } catch {
    logger.warn('[AURA Background] Data consistency check failed', { module: 'aura-background' })
  }

  return {
    jobType: 'data_inconsistency',
    cabinetId,
    insights,
    proposedActions: [],
    durationMs: Date.now() - startTime,
    tokensUsed,
  }
}

/**
 * Détecte les opportunités commerciales via analyse IA.
 * Utilise l'orchestrator pour l'analyse stratégique.
 */
async function detectOpportunities(
  cabinetId: string,
  userId: string,
  startTime: number,
): Promise<BackgroundJobResult> {
  const insights: BackgroundInsight[] = []
  let tokensUsed = 0

  try {
    const { getPrismaClient } = await import('../../prisma')
    const prisma = getPrismaClient(cabinetId, false)

    // Clients avec TMI élevée (irTaxRate >= 30%) et sans PER (EPARGNE_RETRAITE)
    const highTMIClients = await prisma.client.findMany({
      where: {
        cabinetId,
        status: { not: 'ARCHIVE' },
        irTaxRate: { gte: 30 },
        contrats: {
          none: {
            type: 'EPARGNE_RETRAITE',
            status: 'ACTIF',
          },
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        irTaxRate: true,
      },
      take: 10,
    })

    for (const client of highTMIClients) {
      const tmi = Number(client.irTaxRate || 0)
      insights.push({
        id: `per-opp-${client.id}`,
        type: 'opportunity',
        title: `Opportunité PER — ${client.firstName} ${client.lastName} (TMI ${tmi}%)`,
        description: `${client.firstName} ${client.lastName} a une TMI de ${tmi}% et ne possède pas de PER. L'économie d'impôt potentielle est significative.`,
        severity: 'medium',
        clientId: client.id,
        clientName: `${client.firstName} ${client.lastName}`,
        suggestedAction: `Proposer un PER à ${client.firstName} ${client.lastName} — économie IR estimée de ${tmi}% sur les versements`,
      })
    }

    // Clients soumis IFI (ifiSubject = true)
    const ifiClients = await prisma.client.findMany({
      where: {
        cabinetId,
        status: { not: 'ARCHIVE' },
        ifiSubject: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        ifiAmount: true,
      },
      take: 10,
    })

    for (const client of ifiClients) {
      const amount = Number(client.ifiAmount || 0)
      insights.push({
        id: `ifi-opp-${client.id}`,
        type: 'opportunity',
        title: `Potentiel optimisation IFI — ${client.firstName} ${client.lastName}`,
        description: `Client soumis à l'IFI${amount > 0 ? ` (${amount.toLocaleString('fr-FR')} €)` : ''}. Vérifier les stratégies d'optimisation (démembrement, assurance-vie luxembourgeoise, dons).`,
        severity: 'low',
        clientId: client.id,
        clientName: `${client.firstName} ${client.lastName}`,
      })
    }
  } catch {
    logger.warn('[AURA Background] Opportunity detection failed', { module: 'aura-background' })
  }

  return {
    jobType: 'opportunity_detection',
    cabinetId,
    insights,
    proposedActions: [],
    durationMs: Date.now() - startTime,
    tokensUsed,
  }
}

/**
 * Vérifications de conformité automatiques.
 */
async function checkCompliance(
  cabinetId: string,
  userId: string,
  startTime: number,
): Promise<BackgroundJobResult> {
  const insights: BackgroundInsight[] = []

  try {
    const { getPrismaClient } = await import('../../prisma')
    const prisma = getPrismaClient(cabinetId, false)

    // Réclamations non traitées depuis plus de 48h
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000)
    const pendingReclamations = await prisma.reclamation.count({
      where: {
        cabinetId,
        status: { in: ['RECUE', 'EN_COURS'] },
        createdAt: { lt: cutoff },
      },
    })

    if (pendingReclamations > 0) {
      insights.push({
        id: 'reclamations-pending',
        type: 'warning',
        title: `${pendingReclamations} réclamation(s) non traitée(s) >48h`,
        description: `${pendingReclamations} réclamation(s) sont en attente de traitement depuis plus de 48 heures. Le délai réglementaire de traitement risque d'être dépassé.`,
        severity: 'high',
        suggestedAction: 'Traiter les réclamations en attente en priorité',
      })
    }
  } catch {
    logger.warn('[AURA Background] Compliance check failed', { module: 'aura-background' })
  }

  return {
    jobType: 'compliance_check',
    cabinetId,
    insights,
    proposedActions: [],
    durationMs: Date.now() - startTime,
    tokensUsed: 0,
  }
}

/**
 * Détecte les entretiens terminés nécessitant un post-traitement.
 */
async function checkMeetingCompletions(
  cabinetId: string,
  userId: string,
  startTime: number,
): Promise<BackgroundJobResult> {
  const insights: BackgroundInsight[] = []
  const proposedActions: ProposedAction[] = []

  try {
    const { getPrismaClient } = await import('../../prisma')
    const prisma = getPrismaClient(cabinetId, false)

    // Entretiens transcrits sans traitement IA
    const untreatedMeetings = await prisma.entretien.findMany({
      where: {
        cabinetId,
        conseillerId: userId,
        status: 'TRANSCRIT',
        traitementType: null,
      },
      select: {
        id: true,
        titre: true,
        dateEntretien: true,
        clientId: true,
      },
      take: 10,
      orderBy: { dateEntretien: 'desc' },
    })

    // Resolve client names in a second query if needed
    const clientIds = untreatedMeetings.map(m => m.clientId).filter(Boolean) as string[]
    const clients = clientIds.length > 0
      ? await prisma.client.findMany({
          where: { id: { in: clientIds } },
          select: { id: true, firstName: true, lastName: true },
        })
      : []
    const clientMap = new Map(clients.map(c => [c.id, `${c.firstName} ${c.lastName}`]))

    for (const meeting of untreatedMeetings) {
      const clientName = meeting.clientId ? clientMap.get(meeting.clientId) || 'Client inconnu' : 'Client inconnu'

      insights.push({
        id: `meeting-untreated-${meeting.id}`,
        type: 'info',
        title: `Entretien non traité — ${clientName}`,
        description: `L'entretien "${meeting.titre}" du ${meeting.dateEntretien ? new Date(meeting.dateEntretien).toLocaleDateString('fr-FR') : '?'} avec ${clientName} n'a pas encore été analysé par l'IA.`,
        severity: 'medium',
        suggestedAction: 'Lancer le pipeline post-meeting AURA',
      })

      proposedActions.push({
        id: `pipeline-${meeting.id}`,
        type: 'notification',
        title: `Lancer l'analyse IA — ${meeting.titre}`,
        description: `Analyser automatiquement l'entretien et extraire le bilan patrimonial`,
        params: {
          entretienId: meeting.id,
          pipelineType: 'post_meeting',
        },
        requiresValidation: true,
        status: 'proposed',
      })
    }
  } catch {
    logger.warn('[AURA Background] Meeting completion check failed', { module: 'aura-background' })
  }

  return {
    jobType: 'meeting_completion',
    cabinetId,
    insights,
    proposedActions,
    durationMs: Date.now() - startTime,
    tokensUsed: 0,
  }
}

/**
 * Monitore les changements CRM récents.
 */
async function monitorCRMChanges(
  cabinetId: string,
  _userId: string,
  startTime: number,
): Promise<BackgroundJobResult> {
  // Stub pour le monitoring CRM — sera enrichi avec les webhooks/triggers
  return {
    jobType: 'crm_monitor',
    cabinetId,
    insights: [],
    proposedActions: [],
    durationMs: Date.now() - startTime,
    tokensUsed: 0,
  }
}
