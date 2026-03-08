/**
 * Meeting Intelligence Engine — Post-RDV automatique
 * 
 * Inspiré par OpenClaw Meeting Intelligence Prompt #2
 * Adapté au workflow CGP : après chaque RDV, extraction auto de :
 *   1. Compte-rendu structuré
 *   2. Actions à faire (tâches)
 *   3. Mise à jour fiche client (objectifs, patrimoine, KYC)
 *   4. Email de suivi proposé
 *   5. Prochain RDV suggéré
 */

import { getPrismaClient } from '@/app/_common/lib/prisma'

// ============================================================================
// TYPES
// ============================================================================

export interface MeetingAnalysis {
  entretienId: string
  clientId: string
  clientName: string
  date: Date
  summary: MeetingSummary
  actionItems: ActionItem[]
  clientUpdates: ClientUpdate[]
  followUpEmail: FollowUpEmailDraft
  nextMeetingSuggestion: NextMeetingSuggestion | null
  signals: MeetingSignal[]
}

export interface MeetingSummary {
  title: string
  duration: string
  participants: string[]
  keyTopics: string[]
  decisions: string[]
  openQuestions: string[]
  clientMood: 'positive' | 'neutral' | 'concerned' | 'negative'
  narratif: string          // Résumé narratif complet
}

export interface ActionItem {
  id: string
  title: string
  description: string
  assignee: 'advisor' | 'client' | 'assistant' | 'other'
  priority: 'HAUTE' | 'NORMALE' | 'BASSE'
  dueDate: Date | null
  category: string          // KYC, contrat, simulation, document, etc.
  autoCreated: boolean      // true si créé automatiquement dans le CRM
}

export interface ClientUpdate {
  field: string
  currentValue: string | null
  suggestedValue: string
  confidence: number        // 0-100
  source: string            // "Mentionné pendant l'entretien"
  applied: boolean
}

export interface FollowUpEmailDraft {
  subject: string
  body: string
  attachmentSuggestions: string[]
  sendDelay: string         // "24h" "48h" "1 semaine"
}

export interface NextMeetingSuggestion {
  type: string              // "Bilan", "Suivi", "Signature"
  suggestedDate: string     // "Dans 2 semaines", "Fin du mois"
  reason: string
  topics: string[]
}

export interface MeetingSignal {
  type: 'opportunity' | 'risk' | 'lifecycle' | 'compliance'
  title: string
  description: string
  priority: number
}

// ============================================================================
// MEETING INTELLIGENCE ENGINE
// ============================================================================

export class MeetingIntelligenceEngine {
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
   * Analyser un entretien terminé et extraire les insights
   */
  async analyzeEntretien(entretienId: string): Promise<MeetingAnalysis> {
    const entretien = await this.prisma.entretien.findFirst({
      where: { id: entretienId, cabinetId: this.cabinetId },
      include: {
        client: {
          select: {
            id: true, firstName: true, lastName: true, email: true,
            status: true, kycStatus: true, patrimoineNet: true,
            objectifs: { select: { type: true, description: true } },
            contrats: { where: { status: 'ACTIF' }, select: { type: true, name: true } },
          },
        },
      },
    })

    if (!entretien) throw new Error(`Entretien ${entretienId} introuvable`)

    const client = entretien.client
    if (!client) throw new Error(`Entretien ${entretienId} n'a pas de client associé`)
    const clientName = `${client.firstName} ${client.lastName}`
    const notes = entretien.notesConseiller || ''
    const transcription = entretien.transcriptionBrute || ''
    const content = `${notes}\n\n${transcription}`.trim()

    // ── Extract structured data from content ──
    const summary = this.extractSummary(entretien, content, clientName)
    const actionItems = await this.extractActionItems(entretien, content, client)
    const clientUpdates = this.detectClientUpdates(content, client)
    const followUpEmail = this.generateFollowUpEmail(summary, actionItems, clientName, client.email)
    const nextMeetingSuggestion = this.suggestNextMeeting(summary, actionItems, client)
    const signals = this.detectSignals(content, client)

    return {
      entretienId,
      clientId: client.id,
      clientName,
      date: entretien.dateEntretien,
      summary,
      actionItems,
      clientUpdates,
      followUpEmail,
      nextMeetingSuggestion,
      signals,
    }
  }

  /**
   * Appliquer automatiquement les actions extraites (créer tâches, etc.)
   */
  async applyActions(analysis: MeetingAnalysis): Promise<{
    tasksCreated: number
    updatesApplied: number
    emailDraftSaved: boolean
  }> {
    let tasksCreated = 0
    let updatesApplied = 0

    // Create tasks from action items
    for (const item of analysis.actionItems) {
      if (item.assignee === 'advisor' || item.assignee === 'assistant') {
        try {
          await this.prisma.tache.create({
            data: {
              cabinetId: this.cabinetId,
              assignedToId: this.userId,
              createdById: this.userId,
              clientId: analysis.clientId,
              title: item.title,
              description: item.description,
              priority: (item.priority === 'NORMALE' ? 'MOYENNE' : item.priority) as any,
              type: 'SUIVI',
              status: 'A_FAIRE',
              dueDate: item.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
          })
          item.autoCreated = true
          tasksCreated++
        } catch {
          // Skip if task creation fails
        }
      }
    }

    // Apply client updates with high confidence
    for (const update of analysis.clientUpdates) {
      if (update.confidence >= 80 && !update.applied) {
        // Only auto-apply safe fields
        const safeFields = ['profession', 'numberOfChildren', 'maritalStatus']
        if (safeFields.includes(update.field)) {
          try {
            await this.prisma.client.update({
              where: { id: analysis.clientId },
              data: { [update.field]: update.suggestedValue },
            })
            update.applied = true
            updatesApplied++
          } catch {
            // Skip
          }
        }
      }
    }

    // Log the analysis in timeline
    await this.prisma.timelineEvent.create({
      data: {
        clientId: analysis.clientId,
        cabinetId: this.cabinetId,
        createdBy: this.userId,
        type: 'CLIENT_UPDATED',
        title: `Analyse post-RDV: ${analysis.summary.title}`,
        description: `${tasksCreated} tâche(s) créée(s), ${updatesApplied} mise(s) à jour appliquée(s). ${analysis.signals.length} signal(s) détecté(s).`,
        relatedEntityType: 'ENTRETIEN',
        relatedEntityId: analysis.entretienId,
      },
    })

    return {
      tasksCreated,
      updatesApplied,
      emailDraftSaved: false, // Email draft is returned but not auto-sent
    }
  }

  /**
   * Obtenir les entretiens récents non analysés
   */
  async getPendingAnalyses(): Promise<{
    entretienId: string
    clientName: string
    date: Date
    type: string
  }[]> {
    const recent = await this.prisma.entretien.findMany({
      where: {
        cabinetId: this.cabinetId,
        status: { in: ['FINALISE', 'TRAITE'] },
        dateEntretien: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      include: {
        client: { select: { firstName: true, lastName: true } },
      },
      orderBy: { dateEntretien: 'desc' },
      take: 20,
    })

    // Filter out already analyzed (check timeline)
    const analyzed = await this.prisma.timelineEvent.findMany({
      where: {
        cabinetId: this.cabinetId,
        type: 'CLIENT_UPDATED',
        title: { startsWith: 'Analyse post-RDV' },
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      select: { relatedEntityId: true },
    })

    const analyzedIds = new Set(
      analyzed.map(a => a.relatedEntityId).filter(Boolean)
    )

    return recent
      .filter(e => !analyzedIds.has(e.id))
      .map(e => ({
        entretienId: e.id,
        clientName: e.client ? `${e.client.firstName} ${e.client.lastName}` : 'Client inconnu',
        date: e.dateEntretien,
        type: e.type,
      }))
  }

  // ============================================================================
  // EXTRACTION METHODS (rule-based, no LLM dependency)
  // ============================================================================

  private extractSummary(entretien: any, content: string, clientName: string): MeetingSummary {
    const lines = content.split('\n').filter(l => l.trim())
    
    // Extract key topics from content
    const topicKeywords: Record<string, string> = {
      'assurance.vie|AV|fonds.euros|UC': 'Assurance-vie',
      'PER|retraite|pension': 'Retraite / PER',
      'immobilier|SCPI|locatif|SCI': 'Immobilier',
      'succession|donation|transmission': 'Transmission',
      'IFI|imp.t|fiscal|TMI|IR': 'Fiscalité',
      'KYC|conform|document|pi.ce': 'Conformité KYC',
      'cr.dit|emprunt|pr.t': 'Financement',
      'pr.voyance|d.c.s|arr.t.travail|Madelin': 'Prévoyance',
      'budget|.pargne|capacit.|revenus': 'Budget / Épargne',
    }

    const keyTopics: string[] = []
    for (const [pattern, topic] of Object.entries(topicKeywords)) {
      if (new RegExp(pattern, 'i').test(content)) {
        keyTopics.push(topic)
      }
    }

    // Detect decisions (lines with action words)
    const decisions = lines.filter(l =>
      /décid|convenu|accord|valid|accept|sign|ok pour|on fait/i.test(l)
    ).slice(0, 5)

    // Detect open questions
    const openQuestions = lines.filter(l =>
      /\?|à vérifier|à confirmer|en attente|reste à|à voir/i.test(l)
    ).slice(0, 5)

    // Client mood detection
    let clientMood: MeetingSummary['clientMood'] = 'neutral'
    if (/satisfait|content|ravi|confiant|bien|positif/i.test(content)) clientMood = 'positive'
    else if (/inqui|préoccup|soucieux|concern|hésit/i.test(content)) clientMood = 'concerned'
    else if (/mécontent|frustré|déçu|en col|négatif/i.test(content)) clientMood = 'negative'

    return {
      title: `Entretien ${entretien.type || 'SUIVI'} — ${clientName}`,
      duration: '',
      participants: [clientName],
      keyTopics: keyTopics.length > 0 ? keyTopics : ['Suivi général'],
      decisions,
      openQuestions,
      clientMood,
      narratif: content.slice(0, 500) + (content.length > 500 ? '...' : ''),
    }
  }

  private async extractActionItems(entretien: any, content: string, client: any): Promise<ActionItem[]> {
    const items: ActionItem[] = []
    const lines = content.split('\n')

    // Pattern matching for action items
    const actionPatterns = [
      { pattern: /envoyer|transmettre|adresser/i, category: 'document', assignee: 'advisor' as const },
      { pattern: /demander|r.cup.rer|obtenir.*document|fournir/i, category: 'KYC', assignee: 'client' as const },
      { pattern: /simuler|simulation|calcul/i, category: 'simulation', assignee: 'advisor' as const },
      { pattern: /signer|signature/i, category: 'contrat', assignee: 'client' as const },
      { pattern: /planifier|programmer|rdv|rendez.vous/i, category: 'rdv', assignee: 'advisor' as const },
      { pattern: /arbitrage|r..quilibr/i, category: 'portfolio', assignee: 'advisor' as const },
      { pattern: /rappeler|relancer|recontacter/i, category: 'suivi', assignee: 'advisor' as const },
      { pattern: /v.rifier|contr.ler|audit/i, category: 'compliance', assignee: 'advisor' as const },
    ]

    for (const line of lines) {
      for (const { pattern, category, assignee } of actionPatterns) {
        if (pattern.test(line) && line.trim().length > 10) {
          items.push({
            id: crypto.randomUUID(),
            title: line.trim().slice(0, 100),
            description: line.trim(),
            assignee,
            priority: category === 'KYC' || category === 'compliance' ? 'HAUTE' : 'NORMALE',
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Default 2 weeks
            category,
            autoCreated: false,
          })
          break // One match per line
        }
      }
    }

    // Auto-detect KYC action if KYC is not complete
    if (client.kycStatus !== 'COMPLET' && /kyc|conform|document/i.test(content)) {
      items.push({
        id: crypto.randomUUID(),
        title: `Compléter le KYC de ${client.firstName} ${client.lastName}`,
        description: 'KYC non complété — mentionné pendant l\'entretien',
        assignee: 'advisor',
        priority: 'HAUTE',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        category: 'KYC',
        autoCreated: false,
      })
    }

    return items
  }

  private detectClientUpdates(content: string, client: any): ClientUpdate[] {
    const updates: ClientUpdate[] = []

    // Detect profession changes
    const professionMatch = content.match(/(?:nouveau poste|promotion|changement.*emploi|nommé|devenu)\s*:?\s*(.{5,50})/i)
    if (professionMatch) {
      updates.push({
        field: 'profession',
        currentValue: client.profession || null,
        suggestedValue: professionMatch[1].trim(),
        confidence: 60,
        source: 'Mentionné pendant l\'entretien',
        applied: false,
      })
    }

    // Detect family changes
    if (/enceinte|bébé|naissance|attend.*enfant/i.test(content)) {
      updates.push({
        field: 'numberOfChildren',
        currentValue: String(client.numberOfChildren || 0),
        suggestedValue: String((client.numberOfChildren || 0) + 1),
        confidence: 70,
        source: 'Naissance/grossesse mentionnée',
        applied: false,
      })
    }

    // Detect marital status changes
    if (/mariage|se marier|fiancé|pacs/i.test(content) && client.maritalStatus !== 'MARIE') {
      updates.push({
        field: 'maritalStatus',
        currentValue: client.maritalStatus || null,
        suggestedValue: /pacs/i.test(content) ? 'PACSE' : 'MARIE',
        confidence: 65,
        source: 'Changement de situation mentionné',
        applied: false,
      })
    }

    if (/divorce|séparation|rupture.*pacs/i.test(content)) {
      updates.push({
        field: 'maritalStatus',
        currentValue: client.maritalStatus || null,
        suggestedValue: 'CELIBATAIRE',
        confidence: 60,
        source: 'Séparation mentionnée',
        applied: false,
      })
    }

    return updates
  }

  private generateFollowUpEmail(
    summary: MeetingSummary,
    actionItems: ActionItem[],
    clientName: string,
    clientEmail: string | null,
  ): FollowUpEmailDraft {
    const advisorItems = actionItems.filter(a => a.assignee === 'advisor')
    const clientItems = actionItems.filter(a => a.assignee === 'client')

    const topicsText = summary.keyTopics.join(', ')
    const decisionsText = summary.decisions.length > 0
      ? summary.decisions.map((d, i) => `${i + 1}. ${d}`).join('\n')
      : 'Aucune décision formelle prise'

    const clientActionsText = clientItems.length > 0
      ? clientItems.map((a, i) => `${i + 1}. ${a.title}`).join('\n')
      : ''

    return {
      subject: `Suite de notre entretien — ${topicsText}`,
      body: `Bonjour ${clientName.split(' ')[0]},

Je vous remercie pour notre entretien. Comme convenu, voici un récapitulatif de nos échanges.

**Sujets abordés** : ${topicsText}

**Décisions prises** :
${decisionsText}
${clientActionsText ? `
**Actions de votre côté** :
${clientActionsText}
` : ''}
**De mon côté**, je m'engage à :
${advisorItems.map((a, i) => `${i + 1}. ${a.title}`).join('\n') || '- Assurer le suivi de nos échanges'}

N'hésitez pas à me contacter si vous avez des questions.

Bien cordialement,`,
      attachmentSuggestions: summary.keyTopics.includes('Fiscalité') ? ['Simulation fiscale', 'Note de synthèse'] : [],
      sendDelay: summary.clientMood === 'concerned' ? '24h' : '48h',
    }
  }

  private suggestNextMeeting(
    summary: MeetingSummary,
    actionItems: ActionItem[],
    client: any,
  ): NextMeetingSuggestion | null {
    if (actionItems.length === 0 && summary.openQuestions.length === 0) return null

    const hasSignature = actionItems.some(a => a.category === 'contrat')
    const hasSimulation = actionItems.some(a => a.category === 'simulation')
    const hasKYC = actionItems.some(a => a.category === 'KYC')

    if (hasSignature) {
      return {
        type: 'Signature',
        suggestedDate: 'Dans 1 à 2 semaines',
        reason: 'Signature de contrat à finaliser',
        topics: ['Signature', ...summary.keyTopics.slice(0, 2)],
      }
    }

    if (hasSimulation) {
      return {
        type: 'Présentation résultats',
        suggestedDate: 'Dans 2 à 3 semaines',
        reason: 'Présentation des simulations demandées',
        topics: ['Résultats simulation', ...summary.keyTopics.slice(0, 2)],
      }
    }

    if (hasKYC) {
      return {
        type: 'Revue conformité',
        suggestedDate: 'Dans 1 mois',
        reason: 'Compléter le dossier KYC',
        topics: ['KYC', 'Documents'],
      }
    }

    return {
      type: 'Suivi',
      suggestedDate: 'Dans 1 mois',
      reason: 'Suivi des actions en cours',
      topics: summary.keyTopics.slice(0, 3),
    }
  }

  private detectSignals(content: string, client: any): MeetingSignal[] {
    const signals: MeetingSignal[] = []

    // Life events
    if (/retraite|partir.*retraite|dernier.*ann/i.test(content)) {
      signals.push({ type: 'lifecycle', title: 'Départ retraite', description: 'Le client mentionne un projet de départ à la retraite', priority: 9 })
    }
    if (/héritage|succession|décès.*proche/i.test(content)) {
      signals.push({ type: 'lifecycle', title: 'Succession', description: 'Événement successoral mentionné', priority: 8 })
    }
    if (/vendre|vente.*maison|déménag/i.test(content)) {
      signals.push({ type: 'opportunity', title: 'Vente immobilière', description: 'Projet de vente immobilière détecté', priority: 7 })
    }
    if (/créer.*entreprise|lancer.*activité|TNS|indépendant/i.test(content)) {
      signals.push({ type: 'opportunity', title: 'Création d\'activité', description: 'Projet entrepreneurial détecté', priority: 7 })
    }

    // Compliance risks
    if (/cash|espèce|liquide|offshore/i.test(content)) {
      signals.push({ type: 'compliance', title: 'Signal LCB-FT', description: 'Mots-clés de vigilance LCB-FT détectés', priority: 10 })
    }

    return signals
  }
}
