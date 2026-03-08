/**
 * Lead Pipeline Engine — Scoring LLM + State Machine + Audit Trail
 * 
 * Inspiré par OpenClaw Inbound Sales / Lead Pipeline Prompt #10
 * Adapté au contexte CGP français.
 * 
 * Composants :
 *   1. Lead Scoring — scoring multi-dimensionnel (fit, potentiel, maturité, confiance, timeline)
 *   2. Stage Machine — transitions validées avec audit trail
 *   3. Drift Detection — détection d'incohérences entre stages
 *   4. Auto-Classification — classification automatique des prospects
 */

import { getPrismaClient } from '@/app/_common/lib/prisma'

// ============================================================================
// TYPES
// ============================================================================

/** Étapes du pipeline prospect CGP */
export type PipelineStage =
  | 'NOUVEAU'           // Prospect identifié, pas encore qualifié
  | 'PREMIER_CONTACT'   // Premier échange (email, téléphone, formulaire)
  | 'QUALIFIE'          // Besoins et potentiel confirmés
  | 'DECOUVERTE'        // RDV de découverte réalisé
  | 'PROPOSITION'       // Proposition / lettre de mission envoyée
  | 'NEGOCIATION'       // En discussion sur les termes
  | 'SIGNE'             // Lettre de mission signée → Client
  | 'PERDU'             // Prospect perdu (avec raison)

/** Transitions légales entre stages */
const LEGAL_TRANSITIONS: Record<PipelineStage, PipelineStage[]> = {
  NOUVEAU: ['PREMIER_CONTACT', 'QUALIFIE', 'PERDU'],
  PREMIER_CONTACT: ['QUALIFIE', 'PERDU'],
  QUALIFIE: ['DECOUVERTE', 'PERDU'],
  DECOUVERTE: ['PROPOSITION', 'QUALIFIE', 'PERDU'],  // Retour possible si besoin de re-qualification
  PROPOSITION: ['NEGOCIATION', 'SIGNE', 'PERDU'],
  NEGOCIATION: ['SIGNE', 'PROPOSITION', 'PERDU'],     // Retour possible si nouvelle proposition
  SIGNE: [],                                           // Terminal
  PERDU: ['NOUVEAU'],                                  // Réactivation possible
}

export interface LeadScore {
  clientId: string
  clientName: string
  totalScore: number        // 0-100
  bucket: 'exceptional' | 'high' | 'medium' | 'low' | 'disqualified'
  dimensions: {
    fit: number             // 0-20 — Adéquation profil (patrimoine, âge, CSP)
    potential: number       // 0-20 — Potentiel de revenu (patrimoine estimé, contrats possibles)
    maturity: number        // 0-20 — Maturité du besoin (a-t-il un besoin identifié?)
    trust: number           // 0-20 — Niveau de confiance (source, recommandation, interactions)
    timeline: number        // 0-20 — Timeline (urgence du besoin)
  }
  flags: LeadFlag[]
  recommendedAction: string
  estimatedRevenue: number  // Estimation CA annuel potentiel
}

export interface LeadFlag {
  type: 'positive' | 'warning' | 'blocker'
  label: string
  detail: string
}

export interface StageTransition {
  id: string
  clientId: string
  fromStage: PipelineStage
  toStage: PipelineStage
  reason: string
  triggeredBy: string       // userId
  timestamp: Date
  metadata?: Record<string, unknown>
}

export interface PipelineStats {
  totalProspects: number
  byStage: Record<PipelineStage, number>
  conversionRate: number    // % NOUVEAU → SIGNE sur 12 mois
  averageCycleDays: number  // Jours moyens NOUVEAU → SIGNE
  lostReasons: { reason: string; count: number }[]
  topScored: LeadScore[]
  staleLeads: { clientId: string; clientName: string; stage: PipelineStage; daysSinceUpdate: number }[]
}

// ============================================================================
// LEAD SCORING ENGINE
// ============================================================================

export class LeadPipelineEngine {
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
   * Scorer un prospect en multi-dimensions
   */
  async scoreProspect(clientId: string): Promise<LeadScore> {
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, cabinetId: this.cabinetId },
      include: {
        rendezvous: { select: { id: true, startDate: true, type: true, status: true }, orderBy: { startDate: 'desc' }, take: 10 },
        emails: { select: { id: true, createdAt: true }, take: 10 },
        entretiens: { select: { id: true, dateEntretien: true }, take: 5 },
        contrats: { select: { id: true, type: true, value: true } },
        objectifs: { select: { type: true, priority: true, description: true } },
        opportunites: { select: { id: true, status: true, estimatedValue: true } },
      },
    })

    if (!client) throw new Error(`Client ${clientId} introuvable`)

    const now = new Date()
    const flags: LeadFlag[] = []

    // ── FIT (0-20) : Adéquation profil ──
    let fit = 0
    const patrimoineNet = Number(client.patrimoineNet || 0)
    const annualIncome = Number(client.annualIncome || 0)
    const age = client.birthDate ? now.getFullYear() - new Date(client.birthDate).getFullYear() : null

    // Patrimoine
    if (patrimoineNet >= 1_000_000) { fit += 8; flags.push({ type: 'positive', label: 'HNWI', detail: 'Patrimoine > 1M€' }) }
    else if (patrimoineNet >= 300_000) fit += 6
    else if (patrimoineNet >= 100_000) fit += 4
    else if (patrimoineNet > 0) fit += 2

    // Revenus
    if (annualIncome >= 150_000) fit += 5
    else if (annualIncome >= 80_000) fit += 4
    else if (annualIncome >= 40_000) fit += 2

    // Profil CSP
    if (['CADRE_SUP', 'PROFESS_LIB', 'CHEF_ENTR'].includes(client.professionCategory || '')) fit += 4
    else if (['CADRE', 'RETRAITE'].includes(client.professionCategory || '')) fit += 3
    else fit += 1

    // Situation familiale (capacité d'épargne)
    if (client.maritalStatus && client.numberOfChildren !== null) {
      if (client.numberOfChildren === 0) fit += 3
      else if ((client.numberOfChildren || 0) <= 2) fit += 2
    }

    fit = Math.min(fit, 20)

    // ── POTENTIAL (0-20) : Potentiel CA ──
    let potential = 0

    // Actifs potentiels non encore gérés
    if (patrimoineNet >= 500_000 && (client.contrats || []).length === 0) {
      potential += 8
      flags.push({ type: 'positive', label: 'Potentiel inexploité', detail: 'Patrimoine important sans contrat' })
    } else if (patrimoineNet >= 200_000) {
      potential += 5
    }

    // Opportunités identifiées
    const openOpps = (client.opportunites || []).filter(o => o.status === 'DETECTEE' || o.status === 'QUALIFIEE')
    const estimatedOppValue = openOpps.reduce((sum, o) => sum + Number(o.estimatedValue || 0), 0)
    if (estimatedOppValue >= 50_000) potential += 6
    else if (estimatedOppValue >= 10_000) potential += 4
    else if (openOpps.length > 0) potential += 2

    // Objectifs patrimoniaux exprimés
    const objectifCount = (client.objectifs || []).length
    if (objectifCount >= 3) potential += 6
    else if (objectifCount >= 1) potential += 3

    potential = Math.min(potential, 20)

    // ── MATURITY (0-20) : Maturité du besoin ──
    let maturity = 0

    // Nombre d'interactions
    const totalInteractions = (client.rendezvous || []).length + (client.emails || []).length + (client.entretiens || []).length
    if (totalInteractions >= 5) maturity += 6
    else if (totalInteractions >= 3) maturity += 4
    else if (totalInteractions >= 1) maturity += 2

    // A eu un RDV de découverte ?
    const hadDiscovery = (client.rendezvous || []).some(r => r.type === 'PREMIER_RDV')
    if (hadDiscovery) { maturity += 5; flags.push({ type: 'positive', label: 'Découverte faite', detail: 'RDV de découverte réalisé' }) }

    // Objectifs clairement définis ?
    if ((client.objectifs || []).some(o => o.priority === 'HAUTE' || o.priority === 'URGENTE')) {
      maturity += 5
      flags.push({ type: 'positive', label: 'Besoin prioritaire', detail: 'Objectif haute priorité identifié' })
    }

    // KYC en cours ou complété (signe de maturité)
    if (client.kycStatus === 'COMPLET') maturity += 4
    else if (client.kycStatus === 'EN_COURS') maturity += 2

    maturity = Math.min(maturity, 20)

    // ── TRUST (0-20) : Confiance ──
    let trust = 0

    // Source d'acquisition
    if (client.apporteurId) { trust += 6; flags.push({ type: 'positive', label: 'Recommandation', detail: 'Apporté par un apporteur d\'affaires' }) }
    
    // Ancienneté de la relation
    const daysSinceCreation = Math.floor((now.getTime() - new Date(client.createdAt).getTime()) / (1000 * 60 * 60 * 24))
    if (daysSinceCreation > 365) trust += 4
    else if (daysSinceCreation > 90) trust += 3
    else if (daysSinceCreation > 30) trust += 2

    // Emails échangés (signe d'engagement)
    if ((client.emails || []).length >= 5) trust += 5
    else if ((client.emails || []).length >= 2) trust += 3

    // Entretiens réalisés
    if ((client.entretiens || []).length >= 2) trust += 5
    else if ((client.entretiens || []).length >= 1) trust += 3

    trust = Math.min(trust, 20)

    // ── TIMELINE (0-20) : Urgence ──
    let timeline = 0

    // Récence des interactions
    const lastDates = [
      ...(client.rendezvous || []).map(r => new Date(r.startDate)),
      ...(client.emails || []).map(e => new Date(e.createdAt)),
      ...(client.entretiens || []).map(e => new Date(e.dateEntretien)),
    ].sort((a, b) => b.getTime() - a.getTime())

    const daysSinceLastInteraction = lastDates.length > 0
      ? Math.floor((now.getTime() - lastDates[0].getTime()) / (1000 * 60 * 60 * 24))
      : 999

    if (daysSinceLastInteraction <= 7) timeline += 8
    else if (daysSinceLastInteraction <= 14) timeline += 6
    else if (daysSinceLastInteraction <= 30) timeline += 4
    else if (daysSinceLastInteraction <= 60) timeline += 2

    // Âge clé (départ retraite, succession)
    if (age) {
      if (age >= 58 && age <= 65) { timeline += 6; flags.push({ type: 'positive', label: 'Transition retraite', detail: `${age} ans — planning retraite prioritaire` }) }
      else if (age >= 70) { timeline += 5; flags.push({ type: 'positive', label: 'Transmission', detail: `${age} ans — sujet transmission pertinent` }) }
    }

    // RDV programmé à venir ?
    const futureRdv = (client.rendezvous || []).find(r => new Date(r.startDate) > now && r.status === 'PLANIFIE')
    if (futureRdv) { timeline += 6; flags.push({ type: 'positive', label: 'RDV planifié', detail: 'Un rendez-vous à venir est programmé' }) }

    timeline = Math.min(timeline, 20)

    // ── Blockers ──
    if (!client.email && !client.phone && !client.mobile) {
      flags.push({ type: 'blocker', label: 'Injoignable', detail: 'Aucun moyen de contact (email, téléphone)' })
    }
    if (daysSinceLastInteraction > 180) {
      flags.push({ type: 'warning', label: 'Inactif', detail: `Aucune interaction depuis ${daysSinceLastInteraction} jours` })
    }

    // ── Total ──
    const totalScore = fit + potential + maturity + trust + timeline

    // ── Bucket ──
    let bucket: LeadScore['bucket']
    if (flags.some(f => f.type === 'blocker')) bucket = 'disqualified'
    else if (totalScore >= 80) bucket = 'exceptional'
    else if (totalScore >= 60) bucket = 'high'
    else if (totalScore >= 40) bucket = 'medium'
    else bucket = 'low'

    // ── Estimated Revenue ──
    let estimatedRevenue = 0
    if (patrimoineNet >= 1_000_000) estimatedRevenue = patrimoineNet * 0.01  // ~1% AUM fees
    else if (patrimoineNet >= 300_000) estimatedRevenue = patrimoineNet * 0.008
    else if (patrimoineNet >= 100_000) estimatedRevenue = patrimoineNet * 0.005
    else estimatedRevenue = 500 // Minimum floor

    // ── Recommended Action ──
    let recommendedAction: string
    if (bucket === 'exceptional') recommendedAction = 'Priorité absolue — planifier RDV dans la semaine'
    else if (bucket === 'high') recommendedAction = 'Envoyer proposition personnalisée sous 48h'
    else if (bucket === 'medium') recommendedAction = 'Email de relance + prise de RDV'
    else if (bucket === 'low') recommendedAction = 'Nurturing automatique (newsletter, contenus)'
    else recommendedAction = 'Compléter les informations de contact avant de poursuivre'

    return {
      clientId: client.id,
      clientName: `${client.firstName} ${client.lastName}`,
      totalScore,
      bucket,
      dimensions: { fit, potential, maturity, trust, timeline },
      flags,
      recommendedAction,
      estimatedRevenue: Math.round(estimatedRevenue),
    }
  }

  // ============================================================================
  // STAGE MACHINE
  // ============================================================================

  /**
   * Avancer un prospect dans le pipeline avec validation et audit trail
   */
  async advanceStage(
    clientId: string,
    toStage: PipelineStage,
    reason: string,
  ): Promise<{ success: boolean; message: string; transition?: StageTransition }> {
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, cabinetId: this.cabinetId },
      select: { id: true, firstName: true, lastName: true, status: true },
    })

    if (!client) return { success: false, message: `Client ${clientId} introuvable` }

    // Map client status to pipeline stage
    const currentStage = this.statusToStage(client.status)
    
    // Validate transition
    const allowedTransitions = LEGAL_TRANSITIONS[currentStage] || []
    if (!allowedTransitions.includes(toStage)) {
      return {
        success: false,
        message: `Transition illégale: ${currentStage} → ${toStage}. Transitions autorisées: ${allowedTransitions.join(', ')}`,
      }
    }

    // Map stage back to client status
    const newStatus = this.stageToStatus(toStage)

    // Execute transition
    await this.prisma.client.update({
      where: { id: clientId },
      data: { status: newStatus as any, updatedAt: new Date() },
    })

    // Audit trail
    const transition: StageTransition = {
      id: crypto.randomUUID(),
      clientId,
      fromStage: currentStage,
      toStage,
      reason,
      triggeredBy: this.userId,
      timestamp: new Date(),
    }

    // Log to AuditLog
    await this.prisma.auditLog.create({
      data: {
        cabinetId: this.cabinetId,
        userId: this.userId,
        action: 'MODIFICATION',
        entityType: 'CLIENT',
        entityId: clientId,
        changes: {
          type: 'PIPELINE_TRANSITION',
          fromStage: currentStage,
          toStage,
          reason,
        },
      },
    })

    // If signed → convert to ACTIF client
    if (toStage === 'SIGNE') {
      await this.prisma.client.update({
        where: { id: clientId },
        data: { status: 'ACTIF' },
      })
    }

    return {
      success: true,
      message: `Pipeline avancé: ${currentStage} → ${toStage} pour ${client.firstName} ${client.lastName}`,
      transition,
    }
  }

  /**
   * Obtenir les statistiques complètes du pipeline
   */
  async getPipelineStats(): Promise<PipelineStats> {
    const prospects = await this.prisma.client.findMany({
      where: {
        cabinetId: this.cabinetId,
        status: { in: ['PROSPECT', 'ACTIF'] },
      },
      select: { id: true, firstName: true, lastName: true, status: true, updatedAt: true, createdAt: true },
    })

    const now = new Date()
    const byStage: Record<string, number> = {}
    const staleLeads: PipelineStats['staleLeads'] = []

    for (const p of prospects) {
      const stage = this.statusToStage(p.status)
      byStage[stage] = (byStage[stage] || 0) + 1

      const daysSinceUpdate = Math.floor((now.getTime() - new Date(p.updatedAt).getTime()) / (1000 * 60 * 60 * 24))
      if (daysSinceUpdate > 30 && p.status === 'PROSPECT') {
        staleLeads.push({
          clientId: p.id,
          clientName: `${p.firstName} ${p.lastName}`,
          stage,
          daysSinceUpdate,
        })
      }
    }

    // Score top prospects
    const topScored: LeadScore[] = []
    const prospectClients = prospects.filter(p => p.status === 'PROSPECT').slice(0, 20)
    for (const p of prospectClients) {
      try {
        const score = await this.scoreProspect(p.id)
        topScored.push(score)
      } catch { /* skip */ }
    }
    topScored.sort((a, b) => b.totalScore - a.totalScore)

    // Conversion rate (simplified — last 12 months)
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
    const recentAuditLogs = await this.prisma.auditLog.findMany({
      where: {
        cabinetId: this.cabinetId,
        action: 'MODIFICATION',
        createdAt: { gte: oneYearAgo },
      },
      select: { changes: true, createdAt: true, entityId: true },
    })

    const pipelineLogs = recentAuditLogs.filter(l => (l.changes as any)?.type === 'PIPELINE_TRANSITION')
    const signed = pipelineLogs.filter(l => (l.changes as any)?.toStage === 'SIGNE').length
    const totalNew = prospects.filter(p => new Date(p.createdAt) >= oneYearAgo).length
    const conversionRate = totalNew > 0 ? Math.round((signed / totalNew) * 100) : 0

    // Lost reasons (from audit logs)
    const lostLogs = pipelineLogs.filter(l => (l.changes as any)?.toStage === 'PERDU')
    const lostReasonsMap = new Map<string, number>()
    for (const log of lostLogs) {
      const reason = (log.changes as any)?.reason || 'Non spécifié'
      lostReasonsMap.set(reason, (lostReasonsMap.get(reason) || 0) + 1)
    }
    const lostReasons = [...lostReasonsMap.entries()]
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)

    return {
      totalProspects: prospects.length,
      byStage: byStage as Record<PipelineStage, number>,
      conversionRate,
      averageCycleDays: 0, // TODO: calculate from actual audit trail data
      lostReasons,
      topScored: topScored.slice(0, 10),
      staleLeads: staleLeads.sort((a, b) => b.daysSinceUpdate - a.daysSinceUpdate).slice(0, 10),
    }
  }

  // ── Helpers ──

  private statusToStage(status: string): PipelineStage {
    switch (status) {
      case 'PROSPECT': return 'NOUVEAU'
      case 'EN_COURS': return 'QUALIFIE'
      case 'ACTIF': return 'SIGNE'
      case 'ARCHIVE': return 'PERDU'
      case 'PERDU': return 'PERDU'
      default: return 'NOUVEAU'
    }
  }

  private stageToStatus(stage: PipelineStage): string {
    switch (stage) {
      case 'NOUVEAU':
      case 'PREMIER_CONTACT':
        return 'PROSPECT'
      case 'QUALIFIE':
      case 'DECOUVERTE':
      case 'PROPOSITION':
      case 'NEGOCIATION':
        return 'EN_COURS'
      case 'SIGNE':
        return 'ACTIF'
      case 'PERDU':
        return 'PERDU'
    }
  }
}
