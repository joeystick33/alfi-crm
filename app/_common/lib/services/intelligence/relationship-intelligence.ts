/**
 * Relationship Intelligence Engine — Scoring relationnel client 0-100
 * 
 * Inspiré par OpenClaw Personal CRM Prompt #1
 * Adapté au contexte CGP français (patrimoine, conformité, cycle de vie client).
 * 
 * Composants :
 *   1. Relationship Scorer (0-100) — basé sur récence, fréquence, patrimoine, conformité
 *   2. Nudge Generator — alertes intelligentes pour les clients nécessitant attention
 *   3. Relationship Profiler — type de relation, style comm, sujets clés
 *   4. Client Segmentation — segmentation automatique multi-critères
 */

import { getPrismaClient } from '@/app/_common/lib/prisma'

// ============================================================================
// TYPES
// ============================================================================

export interface RelationshipScore {
  clientId: string
  clientName: string
  score: number               // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  trend: 'up' | 'stable' | 'down'
  dimensions: {
    recency: number           // 0-25 — Dernière interaction
    frequency: number         // 0-25 — Fréquence des interactions
    depth: number             // 0-25 — Profondeur (patrimoine, contrats, dossiers)
    compliance: number        // 0-25 — Conformité KYC, documents à jour
  }
  signals: RelationshipSignal[]
  lastInteraction: Date | null
  daysSinceLastContact: number
}

export interface RelationshipSignal {
  type: 'positive' | 'warning' | 'critical'
  category: string
  message: string
  priority: number            // 1-10
  actionable: boolean
}

export interface ClientNudge {
  clientId: string
  clientName: string
  urgency: 'critical' | 'high' | 'medium' | 'low'
  type: NudgeType
  title: string
  description: string
  suggestedAction: string
  dueDate: Date | null
  score: number
}

export type NudgeType =
  | 'contact_overdue'        // Pas de contact depuis X jours
  | 'kyc_expiring'           // KYC expire bientôt
  | 'birthday_upcoming'      // Anniversaire proche
  | 'contract_renewal'       // Contrat à renouveler
  | 'portfolio_drift'        // Patrimoine a significativement changé
  | 'opportunity_detected'   // Opportunité détectée
  | 'task_overdue'           // Tâche en retard
  | 'meeting_followup'       // Suivi post-RDV nécessaire
  | 'document_missing'       // Document manquant
  | 'inactive_prospect'      // Prospect sans activité
  | 'high_value_neglected'   // Client haut patrimoine négligé
  | 'life_event'             // Événement de vie détecté (retraite, divorce, etc.)
  | 'fiscal_deadline'        // Échéance fiscale proche

export interface RelationshipProfile {
  clientId: string
  segment: ClientSegment
  lifeCycleStage: LifeCycleStage
  communicationPreference: 'email' | 'phone' | 'meeting' | 'mixed'
  engagementLevel: 'very_active' | 'active' | 'moderate' | 'passive' | 'dormant'
  keyTopics: string[]
  riskFlags: string[]
  opportunityAreas: string[]
  recommendedFrequency: string // e.g. "1 RDV/trimestre"
}

export type ClientSegment =
  | 'PATRIMOINE_PREMIUM'     // >1M€ net
  | 'PATRIMOINE_AISE'        // 300K-1M€
  | 'PATRIMOINE_STANDARD'    // 100K-300K
  | 'PROSPECT_CHAUD'         // Prospect actif
  | 'PROSPECT_FROID'         // Prospect inactif
  | 'PROFESSIONNEL'          // Client pro/TNS
  | 'RETRAITE'               // Client retraité
  | 'JEUNE_ACTIF'            // <35 ans, début constitution

export type LifeCycleStage =
  | 'ONBOARDING'             // Nouveau client, phase découverte
  | 'CROISSANCE'             // Client actif, patrimoine en croissance
  | 'MATURITE'               // Client fidèle, patrimoine stable
  | 'RENOUVELLEMENT'         // Besoin de revue stratégique
  | 'A_RISQUE'               // Risque de départ / inactivité
  | 'ARCHIVE'                // Client archivé

// ============================================================================
// SCORING ENGINE
// ============================================================================

export class RelationshipIntelligenceEngine {
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
   * Calculer le score relationnel pour un client spécifique
   */
  async scoreClient(clientId: string): Promise<RelationshipScore> {
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, cabinetId: this.cabinetId },
      include: {
        rendezvous: {
          orderBy: { startDate: 'desc' },
          take: 20,
          select: { id: true, startDate: true, status: true, type: true },
        },
        emails: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: { id: true, createdAt: true },
        },
        taches: {
          where: { status: { not: 'ANNULE' } },
          select: { id: true, status: true, dueDate: true },
        },
        contrats: {
          where: { status: 'ACTIF' },
          select: { id: true, type: true, value: true },
        },
        actifs: {
          select: { id: true },
        },
        passifs: {
          select: { id: true },
        },
        kycDocuments: {
          select: { id: true, status: true, expiresAt: true },
        },
        dossiers: {
          select: { id: true, status: true },
        },
        entretiens: {
          orderBy: { dateEntretien: 'desc' },
          take: 10,
          select: { id: true, dateEntretien: true, status: true },
        },
      },
    })

    if (!client) {
      throw new Error(`Client ${clientId} introuvable dans le cabinet`)
    }

    const now = new Date()

    // ── Dimension 1: RECENCY (0-25) ──
    const lastInteractions = [
      ...(client.rendezvous || []).map(r => r.startDate),
      ...(client.emails || []).map(e => e.createdAt),
      ...(client.entretiens || []).map(e => e.dateEntretien),
      client.lastContactDate,
    ].filter(Boolean).sort((a, b) => new Date(b!).getTime() - new Date(a!).getTime())

    const lastInteraction = lastInteractions[0] ? new Date(lastInteractions[0]) : null
    const daysSinceContact = lastInteraction
      ? Math.floor((now.getTime() - lastInteraction.getTime()) / (1000 * 60 * 60 * 24))
      : 999

    let recencyScore: number
    if (daysSinceContact <= 7) recencyScore = 25
    else if (daysSinceContact <= 14) recencyScore = 22
    else if (daysSinceContact <= 30) recencyScore = 18
    else if (daysSinceContact <= 60) recencyScore = 14
    else if (daysSinceContact <= 90) recencyScore = 10
    else if (daysSinceContact <= 180) recencyScore = 5
    else recencyScore = 2

    // ── Dimension 2: FREQUENCY (0-25) ──
    const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    const recentInteractions = [
      ...(client.rendezvous || []).filter(r => new Date(r.startDate) >= threeMonthsAgo),
      ...(client.emails || []).filter(e => new Date(e.createdAt) >= threeMonthsAgo),
      ...(client.entretiens || []).filter(e => new Date(e.dateEntretien) >= threeMonthsAgo),
    ].length

    let frequencyScore: number
    if (recentInteractions >= 10) frequencyScore = 25
    else if (recentInteractions >= 6) frequencyScore = 22
    else if (recentInteractions >= 4) frequencyScore = 18
    else if (recentInteractions >= 2) frequencyScore = 14
    else if (recentInteractions >= 1) frequencyScore = 8
    else frequencyScore = 2

    // ── Dimension 3: DEPTH (0-25) ──
    const activeContracts = (client.contrats || []).length
    const totalAssets = (client.actifs || []).length + (client.passifs || []).length
    const activeDossiers = (client.dossiers || []).filter(d => d.status !== 'ARCHIVE').length
    const patrimoineNet = Number(client.patrimoineNet || 0)

    let depthScore = 0
    // Contrats actifs: max 8 points
    depthScore += Math.min(activeContracts * 2, 8)
    // Actifs/passifs enregistrés: max 5 points
    depthScore += Math.min(totalAssets, 5)
    // Dossiers actifs: max 4 points
    depthScore += Math.min(activeDossiers * 2, 4)
    // Patrimoine net: max 8 points
    if (patrimoineNet >= 1_000_000) depthScore += 8
    else if (patrimoineNet >= 500_000) depthScore += 6
    else if (patrimoineNet >= 200_000) depthScore += 4
    else if (patrimoineNet >= 50_000) depthScore += 2

    depthScore = Math.min(depthScore, 25)

    // ── Dimension 4: COMPLIANCE (0-25) ──
    let complianceScore = 25 // Commence à 25, pénalités

    // KYC
    if (client.kycStatus === 'EN_ATTENTE') complianceScore -= 8
    else if (client.kycStatus === 'EXPIRE') complianceScore -= 12
    else if (client.kycStatus === 'REJETE') complianceScore -= 15

    // Documents KYC expirés
    const expiredDocs = (client.kycDocuments || []).filter(
      d => d.expiresAt && new Date(d.expiresAt) < now
    ).length
    complianceScore -= expiredDocs * 3

    // Tâches en retard
    const overdueTasks = (client.taches || []).filter(
      t => t.status === 'A_FAIRE' && t.dueDate && new Date(t.dueDate) < now
    ).length
    complianceScore -= overdueTasks * 2

    complianceScore = Math.max(complianceScore, 0)

    // ── Total Score ──
    const totalScore = recencyScore + frequencyScore + depthScore + complianceScore

    // ── Grade ──
    let grade: RelationshipScore['grade']
    if (totalScore >= 80) grade = 'A'
    else if (totalScore >= 60) grade = 'B'
    else if (totalScore >= 40) grade = 'C'
    else if (totalScore >= 20) grade = 'D'
    else grade = 'F'

    // ── Signals ──
    const signals: RelationshipSignal[] = []

    if (daysSinceContact > 90) {
      signals.push({
        type: 'warning',
        category: 'contact',
        message: `Aucun contact depuis ${daysSinceContact} jours`,
        priority: daysSinceContact > 180 ? 9 : 7,
        actionable: true,
      })
    }

    if (client.kycStatus === 'EXPIRE') {
      signals.push({
        type: 'critical',
        category: 'compliance',
        message: 'KYC expiré — revue obligatoire',
        priority: 10,
        actionable: true,
      })
    }

    if (overdueTasks > 0) {
      signals.push({
        type: 'warning',
        category: 'tasks',
        message: `${overdueTasks} tâche(s) en retard`,
        priority: 6,
        actionable: true,
      })
    }

    if (patrimoineNet >= 500_000 && daysSinceContact > 60) {
      signals.push({
        type: 'critical',
        category: 'high_value',
        message: 'Client haut patrimoine négligé — contact recommandé',
        priority: 9,
        actionable: true,
      })
    }

    // Birthday check
    if (client.birthDate) {
      const bd = new Date(client.birthDate)
      const nextBirthday = new Date(now.getFullYear(), bd.getMonth(), bd.getDate())
      if (nextBirthday < now) nextBirthday.setFullYear(now.getFullYear() + 1)
      const daysUntilBirthday = Math.floor((nextBirthday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      if (daysUntilBirthday <= 14) {
        signals.push({
          type: 'positive',
          category: 'lifecycle',
          message: `Anniversaire dans ${daysUntilBirthday} jour(s) — opportunité de contact`,
          priority: 5,
          actionable: true,
        })
      }
    }

    // Trend (simplifié: compare score actuel avec données 3 mois)
    const trend: RelationshipScore['trend'] = recentInteractions >= 2 ? 'up' : daysSinceContact > 90 ? 'down' : 'stable'

    return {
      clientId: client.id,
      clientName: `${client.firstName} ${client.lastName}`,
      score: totalScore,
      grade,
      trend,
      dimensions: {
        recency: recencyScore,
        frequency: frequencyScore,
        depth: depthScore,
        compliance: complianceScore,
      },
      signals,
      lastInteraction,
      daysSinceLastContact: daysSinceContact,
    }
  }

  /**
   * Scorer tous les clients du portefeuille et retourner classés
   */
  async scorePortfolio(options?: {
    limit?: number
    minScore?: number
    maxScore?: number
    status?: string
    sortBy?: 'score_asc' | 'score_desc' | 'days_since_contact'
  }): Promise<RelationshipScore[]> {
    const clients = await this.prisma.client.findMany({
      where: {
        cabinetId: this.cabinetId,
        ...(options?.status ? { status: options.status as any } : { status: { notIn: ['ARCHIVE', 'PERDU'] } }),
      },
      select: { id: true },
    })

    const scores: RelationshipScore[] = []
    for (const client of clients) {
      try {
        const score = await this.scoreClient(client.id)
        if (options?.minScore && score.score < options.minScore) continue
        if (options?.maxScore && score.score > options.maxScore) continue
        scores.push(score)
      } catch {
        // Skip clients with errors
      }
    }

    // Sort
    const sortBy = options?.sortBy || 'score_desc'
    if (sortBy === 'score_desc') scores.sort((a, b) => b.score - a.score)
    else if (sortBy === 'score_asc') scores.sort((a, b) => a.score - b.score)
    else if (sortBy === 'days_since_contact') scores.sort((a, b) => b.daysSinceLastContact - a.daysSinceLastContact)

    return options?.limit ? scores.slice(0, options.limit) : scores
  }

  // ============================================================================
  // NUDGE GENERATOR
  // ============================================================================

  /**
   * Générer les nudges (alertes intelligentes) pour le conseiller
   */
  async generateNudges(options?: { limit?: number }): Promise<ClientNudge[]> {
    const now = new Date()
    const nudges: ClientNudge[] = []

    const clients = await this.prisma.client.findMany({
      where: {
        cabinetId: this.cabinetId,
        status: { notIn: ['ARCHIVE', 'PERDU'] },
      },
      include: {
        rendezvous: {
          orderBy: { startDate: 'desc' },
          take: 1,
          select: { startDate: true, status: true },
        },
        taches: {
          where: { status: 'A_FAIRE' },
          select: { id: true, dueDate: true, title: true },
        },
        contrats: {
          where: { status: 'ACTIF' },
          select: { id: true, type: true, endDate: true },
        },
        kycDocuments: {
          select: { expiresAt: true, type: true },
        },
        entretiens: {
          orderBy: { dateEntretien: 'desc' },
          take: 1,
          select: { dateEntretien: true },
        },
      },
    })

    for (const client of clients) {
      const name = `${client.firstName} ${client.lastName}`
      const patrimoineNet = Number(client.patrimoineNet || 0)

      // ── Contact overdue ──
      const lastDates = [
        ...(client.rendezvous || []).map(r => new Date(r.startDate)),
        ...(client.entretiens || []).map(e => new Date(e.dateEntretien)),
      ]
      const lastContact = lastDates.length > 0 ? new Date(Math.max(...lastDates.map(d => d.getTime()))) : null
      const daysSince = lastContact ? Math.floor((now.getTime() - lastContact.getTime()) / (1000 * 60 * 60 * 24)) : 999

      if (daysSince > 90) {
        const urgency = patrimoineNet >= 500_000 ? 'critical' as const
          : daysSince > 180 ? 'high' as const
          : 'medium' as const
        nudges.push({
          clientId: client.id,
          clientName: name,
          urgency,
          type: patrimoineNet >= 500_000 ? 'high_value_neglected' : 'contact_overdue',
          title: patrimoineNet >= 500_000 
            ? `Client premium ${name} sans contact depuis ${daysSince}j`
            : `${name} — dernier contact il y a ${daysSince} jours`,
          description: `Aucune interaction enregistrée depuis ${daysSince} jours.${patrimoineNet > 0 ? ` Patrimoine net: ${(patrimoineNet / 1000).toFixed(0)}K€.` : ''}`,
          suggestedAction: daysSince > 180 ? 'Appel téléphonique de courtoisie + proposition de RDV bilan' : 'Email de suivi personnalisé',
          dueDate: null,
          score: daysSince > 180 ? 95 : daysSince > 120 ? 80 : 60,
        })
      }

      // ── KYC expiring ──
      if (client.kycStatus === 'EXPIRE') {
        nudges.push({
          clientId: client.id,
          clientName: name,
          urgency: 'critical',
          type: 'kyc_expiring',
          title: `KYC expiré — ${name}`,
          description: 'Le KYC est expiré. Revue obligatoire pour conformité DDA/LCB-FT.',
          suggestedAction: 'Planifier une revue KYC et demander les documents à jour',
          dueDate: null,
          score: 100,
        })
      } else if (client.kycNextReviewDate && new Date(client.kycNextReviewDate).getTime() - now.getTime() < 30 * 24 * 60 * 60 * 1000) {
        nudges.push({
          clientId: client.id,
          clientName: name,
          urgency: 'high',
          type: 'kyc_expiring',
          title: `KYC à renouveler — ${name}`,
          description: `Prochaine revue KYC prévue le ${new Date(client.kycNextReviewDate).toLocaleDateString('fr-FR')}.`,
          suggestedAction: 'Anticiper la revue KYC et préparer les documents',
          dueDate: new Date(client.kycNextReviewDate),
          score: 85,
        })
      }

      // ── Birthday upcoming ──
      if (client.birthDate) {
        const bd = new Date(client.birthDate)
        const nextBd = new Date(now.getFullYear(), bd.getMonth(), bd.getDate())
        if (nextBd < now) nextBd.setFullYear(now.getFullYear() + 1)
        const daysUntil = Math.floor((nextBd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        if (daysUntil <= 7 && daysUntil >= 0) {
          const age = now.getFullYear() - bd.getFullYear()
          nudges.push({
            clientId: client.id,
            clientName: name,
            urgency: 'medium',
            type: 'birthday_upcoming',
            title: `Anniversaire ${name} dans ${daysUntil}j (${age} ans)`,
            description: `Opportunité de fidélisation — envoi d'un message personnalisé.${age === 60 || age === 62 || age === 64 ? ` Âge clé pour la retraite.` : ''}`,
            suggestedAction: 'Envoyer un message d\'anniversaire personnalisé',
            dueDate: nextBd,
            score: 40,
          })
        }
      }

      // ── Contract renewals ──
      for (const contrat of client.contrats || []) {
        if (contrat.endDate) {
          const daysUntilEnd = Math.floor((new Date(contrat.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          if (daysUntilEnd > 0 && daysUntilEnd <= 60) {
            nudges.push({
              clientId: client.id,
              clientName: name,
              urgency: daysUntilEnd <= 15 ? 'high' : 'medium',
              type: 'contract_renewal',
              title: `Contrat ${contrat.type} de ${name} expire dans ${daysUntilEnd}j`,
              description: `Le contrat ${contrat.type} arrive à échéance. Planifier un renouvellement ou une alternative.`,
              suggestedAction: 'Proposer un RDV de révision du contrat',
              dueDate: new Date(contrat.endDate),
              score: daysUntilEnd <= 15 ? 85 : 65,
            })
          }
        }
      }

      // ── Overdue tasks ──
      const overdueTasks = (client.taches || []).filter(t => t.dueDate && new Date(t.dueDate) < now)
      if (overdueTasks.length > 0) {
        nudges.push({
          clientId: client.id,
          clientName: name,
          urgency: overdueTasks.length >= 3 ? 'high' : 'medium',
          type: 'task_overdue',
          title: `${overdueTasks.length} tâche(s) en retard — ${name}`,
          description: overdueTasks.map(t => t.title).join(', '),
          suggestedAction: 'Traiter ou reprogrammer les tâches en retard',
          dueDate: null,
          score: 50 + overdueTasks.length * 10,
        })
      }

      // ── Inactive prospect ──
      if (client.status === 'PROSPECT' && daysSince > 30) {
        nudges.push({
          clientId: client.id,
          clientName: name,
          urgency: daysSince > 60 ? 'high' : 'medium',
          type: 'inactive_prospect',
          title: `Prospect inactif — ${name} (${daysSince}j)`,
          description: 'Prospect sans interaction récente. Risque de perte.',
          suggestedAction: daysSince > 60 ? 'Relance urgente ou qualification à froid' : 'Email de relance personnalisé',
          dueDate: null,
          score: daysSince > 60 ? 70 : 50,
        })
      }
    }

    // Sort by score descending
    nudges.sort((a, b) => b.score - a.score)

    return options?.limit ? nudges.slice(0, options.limit) : nudges
  }

  // ============================================================================
  // RELATIONSHIP PROFILER
  // ============================================================================

  /**
   * Profiler un client : segment, cycle de vie, préférence comm, engagement
   */
  async profileClient(clientId: string): Promise<RelationshipProfile> {
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, cabinetId: this.cabinetId },
      include: {
        rendezvous: { select: { id: true, type: true, startDate: true }, orderBy: { startDate: 'desc' }, take: 20 },
        emails: { select: { id: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: 20 },
        contrats: { where: { status: 'ACTIF' }, select: { type: true, value: true } },
        entretiens: { select: { id: true, dateEntretien: true }, orderBy: { dateEntretien: 'desc' }, take: 10 },
        objectifs: { select: { type: true, priority: true } },
      },
    })

    if (!client) throw new Error(`Client ${clientId} introuvable`)

    const now = new Date()
    const patrimoineNet = Number(client.patrimoineNet || 0)
    const age = client.birthDate ? now.getFullYear() - new Date(client.birthDate).getFullYear() : null

    // ── Segment ──
    let segment: ClientSegment
    if (client.clientType === 'PROFESSIONNEL') segment = 'PROFESSIONNEL'
    else if (patrimoineNet >= 1_000_000) segment = 'PATRIMOINE_PREMIUM'
    else if (patrimoineNet >= 300_000) segment = 'PATRIMOINE_AISE'
    else if (patrimoineNet >= 100_000) segment = 'PATRIMOINE_STANDARD'
    else if (age && age >= 62) segment = 'RETRAITE'
    else if (age && age < 35) segment = 'JEUNE_ACTIF'
    else if (client.status === 'PROSPECT') {
      const lastDates = [
        ...(client.rendezvous || []).map(r => new Date(r.startDate)),
        ...(client.entretiens || []).map(e => new Date(e.dateEntretien)),
      ]
      const lastActivity = lastDates.length > 0 ? Math.max(...lastDates.map(d => d.getTime())) : 0
      segment = (now.getTime() - lastActivity) > 30 * 24 * 60 * 60 * 1000 ? 'PROSPECT_FROID' : 'PROSPECT_CHAUD'
    } else {
      segment = 'PATRIMOINE_STANDARD'
    }

    // ── Life Cycle Stage ──
    let lifeCycleStage: LifeCycleStage
    if (client.status === 'ARCHIVE') lifeCycleStage = 'ARCHIVE'
    else {
      const daysSinceCreation = Math.floor((now.getTime() - new Date(client.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      const totalInteractions = (client.rendezvous || []).length + (client.emails || []).length + (client.entretiens || []).length

      const allDates = [
        ...(client.rendezvous || []).map(r => new Date(r.startDate)),
        ...(client.emails || []).map(e => new Date(e.createdAt)),
      ]
      const lastActivity = allDates.length > 0 ? new Date(Math.max(...allDates.map(d => d.getTime()))) : null
      const daysSinceActivity = lastActivity ? Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)) : 999

      if (daysSinceCreation < 90) lifeCycleStage = 'ONBOARDING'
      else if (daysSinceActivity > 180) lifeCycleStage = 'A_RISQUE'
      else if (daysSinceCreation > 730 && totalInteractions > 10) lifeCycleStage = 'MATURITE'
      else if (daysSinceCreation > 365) lifeCycleStage = 'RENOUVELLEMENT'
      else lifeCycleStage = 'CROISSANCE'
    }

    // ── Communication Preference ──
    const meetingCount = (client.rendezvous || []).length + (client.entretiens || []).length
    const emailCount = (client.emails || []).length
    let communicationPreference: RelationshipProfile['communicationPreference']
    if (meetingCount > emailCount * 2) communicationPreference = 'meeting'
    else if (emailCount > meetingCount * 2) communicationPreference = 'email'
    else communicationPreference = 'mixed'

    // ── Engagement Level ──
    const threeMonths = 90 * 24 * 60 * 60 * 1000
    const recentCount = [
      ...(client.rendezvous || []).filter(r => now.getTime() - new Date(r.startDate).getTime() < threeMonths),
      ...(client.emails || []).filter(e => now.getTime() - new Date(e.createdAt).getTime() < threeMonths),
    ].length

    let engagementLevel: RelationshipProfile['engagementLevel']
    if (recentCount >= 8) engagementLevel = 'very_active'
    else if (recentCount >= 4) engagementLevel = 'active'
    else if (recentCount >= 2) engagementLevel = 'moderate'
    else if (recentCount >= 1) engagementLevel = 'passive'
    else engagementLevel = 'dormant'

    // ── Key Topics ──
    const keyTopics: string[] = []
    const contractTypes = [...new Set((client.contrats || []).map(c => c.type))]
    if (contractTypes.includes('ASSURANCE_VIE')) keyTopics.push('Assurance-vie')
    if (contractTypes.includes('PREVOYANCE')) keyTopics.push('Prévoyance')
    if (contractTypes.includes('EPARGNE_RETRAITE')) keyTopics.push('Retraite')
    if (patrimoineNet >= 1_300_000) keyTopics.push('IFI')
    if (client.ifiSubject) keyTopics.push('Optimisation IFI')
    if ((client.objectifs || []).some(o => o.type === 'RETRAITE')) keyTopics.push('Préparation retraite')
    if ((client.objectifs || []).some(o => o.type === 'TRANSMISSION')) keyTopics.push('Transmission')
    if ((client.objectifs || []).some(o => o.type === 'ACHAT_IMMOBILIER')) keyTopics.push('Investissement')
    if (client.clientType === 'PROFESSIONNEL') keyTopics.push('Patrimoine professionnel')

    // ── Risk Flags ──
    const riskFlags: string[] = []
    if (client.kycStatus === 'EXPIRE') riskFlags.push('KYC expiré')
    if (client.isPEP) riskFlags.push('PPE — surveillance renforcée')
    if (lifeCycleStage === 'A_RISQUE') riskFlags.push('Client à risque de départ')

    // ── Opportunity Areas ──
    const opportunityAreas: string[] = []
    if (!(client.contrats || []).some(c => c.type === 'ASSURANCE_VIE') && patrimoineNet >= 50_000) {
      opportunityAreas.push('Assurance-vie non détenue')
    }
    if (!(client.contrats || []).some(c => c.type === 'EPARGNE_RETRAITE') && age && age >= 40) {
      opportunityAreas.push('PER non détenu')
    }
    if (patrimoineNet >= 1_300_000 && !client.ifiSubject) {
      opportunityAreas.push('IFI potentiel — vérification nécessaire')
    }
    if (age && (age === 60 || age === 62 || age === 64)) {
      opportunityAreas.push('Transition retraite imminente')
    }

    // ── Recommended Frequency ──
    let recommendedFrequency: string
    if (segment === 'PATRIMOINE_PREMIUM') recommendedFrequency = '1 RDV/mois + 1 email/semaine'
    else if (segment === 'PATRIMOINE_AISE') recommendedFrequency = '1 RDV/trimestre + 1 email/quinzaine'
    else if (segment === 'PROFESSIONNEL') recommendedFrequency = '1 RDV/trimestre + suivi mensuel'
    else recommendedFrequency = '1 RDV/semestre + 1 email/mois'

    return {
      clientId: client.id,
      segment,
      lifeCycleStage,
      communicationPreference,
      engagementLevel,
      keyTopics,
      riskFlags,
      opportunityAreas,
      recommendedFrequency,
    }
  }

  // ============================================================================
  // PORTFOLIO DASHBOARD — Stats agrégées
  // ============================================================================

  /**
   * Dashboard IA du portefeuille : répartition scores, segments, alertes
   */
  async getPortfolioDashboard(): Promise<{
    totalClients: number
    gradeDistribution: Record<string, number>
    segmentDistribution: Record<string, number>
    averageScore: number
    criticalNudges: number
    topNeglected: RelationshipScore[]
    topPerformers: RelationshipScore[]
  }> {
    const scores = await this.scorePortfolio()
    const nudges = await this.generateNudges()

    const gradeDistribution: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 }
    const segmentDistribution: Record<string, number> = {}
    let totalScore = 0

    for (const s of scores) {
      gradeDistribution[s.grade] = (gradeDistribution[s.grade] || 0) + 1
      totalScore += s.score
    }

    // Get segment distribution
    for (const s of scores) {
      try {
        const profile = await this.profileClient(s.clientId)
        segmentDistribution[profile.segment] = (segmentDistribution[profile.segment] || 0) + 1
      } catch {
        // Skip
      }
    }

    return {
      totalClients: scores.length,
      gradeDistribution,
      segmentDistribution,
      averageScore: scores.length > 0 ? Math.round(totalScore / scores.length) : 0,
      criticalNudges: nudges.filter(n => n.urgency === 'critical').length,
      topNeglected: scores.filter(s => s.grade === 'F' || s.grade === 'D').slice(0, 10),
      topPerformers: scores.filter(s => s.grade === 'A').slice(0, 10),
    }
  }
}
