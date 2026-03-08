/**
 * Email Outreach Engine — Campagnes automatisées, follow-ups, scoring
 * 
 * Inspiré par :
 *   - OpenClaw Personal CRM Prompt #1 (email draft system)
 *   - OpenClaw Inbound Sales Prompt #10 (two-layer safety)
 *   - Gist devinschumacher (Best Email Outreach Tools analysis)
 * 
 * Adapté au contexte CGP français — conformité RGPD, opt-in, personnalisation.
 * 
 * Composants :
 *   1. Sequence Builder — Créer des séquences multi-étapes (nurturing, relance, onboarding)
 *   2. Smart Follow-Up — Suivi automatique avec escalation
 *   3. Template Personalizer — Personnalisation dynamique par contexte client
 *   4. Send Scheduler — Planification optimale (heure, jour, fréquence)
 *   5. Performance Tracker — Taux d'ouverture, réponse, conversion
 */

import { getPrismaClient } from '@/app/_common/lib/prisma'

// ============================================================================
// TYPES
// ============================================================================

export type SequenceType =
  | 'ONBOARDING'         // Accueil nouveau client (3-5 emails)
  | 'NURTURING'          // Éducation prospect (5-8 emails)
  | 'RELANCE_PROSPECT'   // Relance prospect froid (3 emails)
  | 'SUIVI_RDV'          // Post-RDV automatique (1-2 emails)
  | 'ANNIVERSARY'        // Email anniversaire (1 email)
  | 'KYC_REMINDER'       // Rappel KYC (3 emails escalation)
  | 'REVUE_ANNUELLE'     // Invitation bilan annuel (2-3 emails)
  | 'FISCAL_DEADLINE'    // Échéance fiscale (2 emails)
  | 'CUSTOM'             // Séquence personnalisée

export interface EmailSequence {
  id: string
  type: SequenceType
  name: string
  description: string
  steps: EmailSequenceStep[]
  status: 'draft' | 'active' | 'paused' | 'completed'
  targetSegment?: string
  totalRecipients: number
  metrics: SequenceMetrics
}

export interface EmailSequenceStep {
  stepNumber: number
  delayDays: number       // Jours après l'étape précédente
  subject: string
  body: string            // Template avec variables {{firstName}}, {{patrimoine}}, etc.
  conditions?: {
    skipIf?: string       // "client_responded" | "kyc_completed" | etc.
    onlyIf?: string       // "no_response" | "opened_previous" | etc.
  }
}

export interface SequenceMetrics {
  sent: number
  opened: number
  clicked: number
  responded: number
  unsubscribed: number
  openRate: number        // %
  clickRate: number       // %
  responseRate: number    // %
}

export interface SmartFollowUp {
  clientId: string
  clientName: string
  lastEmailDate: Date
  daysSinceLastEmail: number
  followUpType: 'first' | 'second' | 'final'
  suggestedSubject: string
  suggestedBody: string
  urgency: 'low' | 'medium' | 'high'
}

export interface PersonalizedEmail {
  to: string
  subject: string
  body: string
  personalizations: { variable: string; value: string }[]
  suggestedSendTime: Date
}

// ============================================================================
// PREDEFINED SEQUENCES — CGP-specific
// ============================================================================

const PREDEFINED_SEQUENCES: Record<SequenceType, EmailSequenceStep[]> = {
  ONBOARDING: [
    {
      stepNumber: 1,
      delayDays: 0,
      subject: 'Bienvenue {{firstName}} — Votre espace patrimonial',
      body: `Bonjour {{firstName}},

Je suis ravi de vous compter parmi nos clients. Voici les prochaines étapes pour mettre en place votre accompagnement patrimonial :

1. **Votre espace client** — Vous pouvez accéder à votre espace personnel à tout moment
2. **Votre dossier** — Je vais préparer votre bilan patrimonial initial
3. **Notre prochain RDV** — Nous fixerons ensemble notre première revue

N'hésitez pas à me contacter pour toute question.

Bien cordialement,
{{advisorName}}`,
    },
    {
      stepNumber: 2,
      delayDays: 3,
      subject: 'Documents nécessaires pour votre dossier patrimonial',
      body: `Bonjour {{firstName}},

Pour préparer au mieux notre premier bilan, voici les documents dont j'aurai besoin :

📋 **Documents d'identité** : CNI ou passeport
📋 **Justificatif de domicile** : Facture récente
📋 **Avis d'imposition** : Le dernier disponible
📋 **Relevés bancaires** : Des 3 derniers mois
📋 **Contrats existants** : Assurance-vie, PER, crédits en cours

Vous pouvez me les transmettre par email sécurisé ou les déposer dans votre espace client.

Cordialement,
{{advisorName}}`,
      conditions: { skipIf: 'kyc_completed' },
    },
    {
      stepNumber: 3,
      delayDays: 7,
      subject: 'Votre bilan patrimonial — prochaines étapes',
      body: `Bonjour {{firstName}},

J'espère que vous avez pu rassembler les documents demandés. Pour rappel, notre objectif est de dresser un bilan complet de votre situation patrimoniale afin de vous proposer une stratégie sur mesure.

**Patrimoine actuel estimé** : {{patrimoineEstime}}

Je vous propose de fixer un rendez-vous pour notre première revue patrimoniale. Quelles sont vos disponibilités dans les 2 prochaines semaines ?

Bien cordialement,
{{advisorName}}`,
    },
  ],

  NURTURING: [
    {
      stepNumber: 1,
      delayDays: 0,
      subject: '{{firstName}}, optimisez votre patrimoine en 2026',
      body: `Bonjour {{firstName}},

En tant que conseiller en gestion de patrimoine, je souhaite partager avec vous quelques pistes d'optimisation adaptées à votre situation.

**Ce que nous pourrions analyser ensemble :**
• Votre fiscalité (TMI, niches fiscales disponibles)
• Votre épargne (rendement, diversification)
• Votre prévoyance (couverture en cas d'aléa)

Un simple échange de 30 minutes pourrait vous faire économiser plusieurs milliers d'euros par an.

Seriez-vous disponible pour un premier entretien ?

{{advisorName}}`,
    },
    {
      stepNumber: 2,
      delayDays: 5,
      subject: 'Avez-vous pensé au PER pour réduire vos impôts ?',
      body: `Bonjour {{firstName}},

Saviez-vous que le Plan d'Épargne Retraite (PER) permet de déduire vos versements de votre revenu imposable ?

**Exemple concret** :
Avec un TMI de 30%, un versement de 10 000€ sur un PER vous fait économiser 3 000€ d'impôt.

C'est l'un des derniers leviers de défiscalisation accessible à tous. La date limite pour en bénéficier cette année approche.

Je serais ravi d'en discuter avec vous.

{{advisorName}}`,
      conditions: { onlyIf: 'no_response' },
    },
    {
      stepNumber: 3,
      delayDays: 10,
      subject: 'Guide gratuit : 5 stratégies patrimoniales pour 2026',
      body: `Bonjour {{firstName}},

Je vous partage notre guide des 5 stratégies patrimoniales les plus efficaces pour 2026 :

1. **Optimisation fiscale via le PER** — Déduction immédiate
2. **Diversification SCPI** — Rendement 4-6% avec gestion déléguée
3. **Assurance-vie luxembourgeoise** — Protection et flexibilité
4. **Investissement forêts/vignobles** — Réduction IFI + IR
5. **Démembrement de propriété** — Transmission optimisée

Chaque stratégie mérite une analyse personnalisée selon votre situation.

Souhaitez-vous qu'on en discute ?

{{advisorName}}`,
      conditions: { onlyIf: 'no_response' },
    },
  ],

  RELANCE_PROSPECT: [
    {
      stepNumber: 1,
      delayDays: 0,
      subject: '{{firstName}}, un point rapide sur votre patrimoine ?',
      body: `Bonjour {{firstName}},

Nous avions échangé il y a quelque temps au sujet de votre situation patrimoniale. Depuis, les marchés et la fiscalité ont évolué.

Je souhaitais savoir si vous seriez intéressé(e) par un point rapide (15-20 min) pour :
• Faire le tour de votre situation actuelle
• Identifier d'éventuelles opportunités

Quand seriez-vous disponible ?

Cordialement,
{{advisorName}}`,
    },
    {
      stepNumber: 2,
      delayDays: 7,
      subject: 'Re: Votre patrimoine — dernière relance',
      body: `Bonjour {{firstName}},

Je comprends que vous êtes occupé(e). Je me permets cette dernière relance car je pense sincèrement pouvoir vous apporter de la valeur.

Si le moment n'est pas opportun, pas de souci. Je reste à votre disposition quand vous le souhaiterez.

Bien cordialement,
{{advisorName}}`,
      conditions: { onlyIf: 'no_response' },
    },
  ],

  SUIVI_RDV: [
    {
      stepNumber: 1,
      delayDays: 1,
      subject: 'Suite de notre entretien — Récapitulatif',
      body: `Bonjour {{firstName}},

Je vous remercie pour notre entretien d'hier. Comme convenu, voici un récapitulatif des points abordés et des prochaines étapes.

Je reste à votre disposition pour toute question.

Cordialement,
{{advisorName}}`,
    },
  ],

  ANNIVERSARY: [
    {
      stepNumber: 1,
      delayDays: 0,
      subject: 'Joyeux anniversaire {{firstName}} ! 🎂',
      body: `Cher(e) {{firstName}},

Toute l'équipe se joint à moi pour vous souhaiter un très joyeux anniversaire !

C'est toujours un plaisir de vous accompagner dans la gestion de votre patrimoine.

Très belles fêtes à vous,
{{advisorName}}`,
    },
  ],

  KYC_REMINDER: [
    {
      stepNumber: 1,
      delayDays: 0,
      subject: 'Mise à jour de votre dossier — Documents requis',
      body: `Bonjour {{firstName}},

Dans le cadre de notre obligation réglementaire (directive DDA), je dois mettre à jour votre dossier de connaissance client (KYC).

Pourriez-vous me transmettre les documents suivants :
• Pièce d'identité en cours de validité
• Justificatif de domicile récent
• Dernier avis d'imposition

Merci de votre collaboration.

{{advisorName}}`,
    },
    {
      stepNumber: 2,
      delayDays: 7,
      subject: 'Rappel : Documents en attente pour votre dossier',
      body: `Bonjour {{firstName}},

Je me permets de vous relancer concernant la mise à jour de votre dossier KYC. Sans ces documents, je ne pourrai malheureusement pas maintenir certains services actifs.

Merci de votre compréhension.

{{advisorName}}`,
      conditions: { skipIf: 'kyc_completed' },
    },
    {
      stepNumber: 3,
      delayDays: 14,
      subject: 'URGENT : Dossier incomplet — Action requise',
      body: `Bonjour {{firstName}},

Votre dossier réglementaire n'est toujours pas à jour. Conformément à nos obligations légales, je suis contraint de suspendre certaines opérations jusqu'à réception des documents.

Je vous propose un appel rapide pour faciliter la démarche. Quand seriez-vous disponible ?

Cordialement,
{{advisorName}}`,
      conditions: { skipIf: 'kyc_completed' },
    },
  ],

  REVUE_ANNUELLE: [
    {
      stepNumber: 1,
      delayDays: 0,
      subject: '{{firstName}}, il est temps de faire le point sur votre patrimoine',
      body: `Bonjour {{firstName}},

Une année s'est écoulée depuis notre dernière revue patrimoniale complète. C'est l'occasion de :

• Analyser la performance de vos investissements
• Ajuster votre stratégie si nécessaire
• Anticiper les évolutions fiscales
• Vérifier l'adéquation de votre couverture prévoyance

Je vous propose un rendez-vous dans les prochaines semaines. Quelles sont vos disponibilités ?

{{advisorName}}`,
    },
    {
      stepNumber: 2,
      delayDays: 10,
      subject: 'Rappel : Votre revue annuelle patrimoine',
      body: `Bonjour {{firstName}},

Je me permets de vous relancer pour notre revue annuelle. C'est un moment important pour s'assurer que votre stratégie patrimoniale reste alignée avec vos objectifs.

N'hésitez pas à me proposer un créneau.

{{advisorName}}`,
      conditions: { onlyIf: 'no_response' },
    },
  ],

  FISCAL_DEADLINE: [
    {
      stepNumber: 1,
      delayDays: 0,
      subject: 'Échéance fiscale : agissez avant le {{deadline}}',
      body: `Bonjour {{firstName}},

Je vous rappelle que la date limite pour {{fiscalAction}} est fixée au {{deadline}}.

Si vous souhaitez optimiser votre situation fiscale cette année, je suis à votre disposition pour en discuter rapidement.

{{advisorName}}`,
    },
  ],

  CUSTOM: [],
}

// ============================================================================
// EMAIL OUTREACH ENGINE
// ============================================================================

export class EmailOutreachEngine {
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
   * Créer une séquence email pour un segment de clients
   */
  async createSequence(params: {
    type: SequenceType
    name?: string
    clientIds?: string[]
    segment?: string
    customSteps?: EmailSequenceStep[]
  }): Promise<EmailSequence> {
    const steps = params.type === 'CUSTOM' && params.customSteps
      ? params.customSteps
      : PREDEFINED_SEQUENCES[params.type] || []

    // Get target recipients
    let recipients: { id: string; firstName: string; lastName: string; email: string | null }[] = []

    if (params.clientIds && params.clientIds.length > 0) {
      recipients = await this.prisma.client.findMany({
        where: { id: { in: params.clientIds }, cabinetId: this.cabinetId },
        select: { id: true, firstName: true, lastName: true, email: true },
      })
    } else if (params.segment) {
      recipients = await this.getSegmentRecipients(params.segment)
    }

    // Filter out clients without email
    recipients = recipients.filter(r => r.email)

    const sequence: EmailSequence = {
      id: crypto.randomUUID(),
      type: params.type,
      name: params.name || `Séquence ${params.type} — ${new Date().toLocaleDateString('fr-FR')}`,
      description: this.getSequenceDescription(params.type),
      steps,
      status: 'draft',
      targetSegment: params.segment,
      totalRecipients: recipients.length,
      metrics: { sent: 0, opened: 0, clicked: 0, responded: 0, unsubscribed: 0, openRate: 0, clickRate: 0, responseRate: 0 },
    }

    // Persist as Campaign
    await this.prisma.campaign.create({
      data: {
        cabinetId: this.cabinetId,
        createdBy: this.userId,
        name: sequence.name,
        type: 'EMAIL',
        status: 'BROUILLON',
        subject: steps[0]?.subject || '',
        plainContent: JSON.stringify({ sequenceId: sequence.id, type: params.type, steps }),
        recipients: {
          create: recipients.map(r => ({
            clientId: r.id,
            email: r.email || '',
            status: 'EN_ATTENTE',
          })),
        },
      },
    })

    return sequence
  }

  /**
   * Personnaliser un email pour un client spécifique
   */
  async personalizeEmail(
    templateSubject: string,
    templateBody: string,
    clientId: string,
  ): Promise<PersonalizedEmail> {
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, cabinetId: this.cabinetId },
      include: {
        contrats: { where: { status: 'ACTIF' }, select: { type: true, value: true } },
      },
    })

    if (!client) throw new Error(`Client ${clientId} introuvable`)

    const advisor = await this.prisma.user.findFirst({
      where: { id: this.userId },
      select: { firstName: true, lastName: true },
    })

    const variables: Record<string, string> = {
      '{{firstName}}': client.firstName,
      '{{lastName}}': client.lastName,
      '{{fullName}}': `${client.firstName} ${client.lastName}`,
      '{{advisorName}}': advisor ? `${advisor.firstName} ${advisor.lastName}` : 'Votre conseiller',
      '{{patrimoine}}': client.patrimoineNet ? `${(Number(client.patrimoineNet) / 1000).toFixed(0)}K€` : 'N/A',
      '{{patrimoineEstime}}': client.patrimoineNet ? `${(Number(client.patrimoineNet) / 1000).toFixed(0)}K€` : 'à déterminer',
      '{{contratsActifs}}': String((client.contrats || []).length),
    }

    let subject = templateSubject
    let body = templateBody
    const personalizations: { variable: string; value: string }[] = []

    for (const [variable, value] of Object.entries(variables)) {
      if (subject.includes(variable) || body.includes(variable)) {
        subject = subject.replace(new RegExp(variable.replace(/[{}]/g, '\\$&'), 'g'), value)
        body = body.replace(new RegExp(variable.replace(/[{}]/g, '\\$&'), 'g'), value)
        personalizations.push({ variable, value })
      }
    }

    // Optimal send time: Tuesday-Thursday, 9h-11h
    const now = new Date()
    const suggestedSendTime = this.getOptimalSendTime(now)

    return {
      to: client.email || '',
      subject,
      body,
      personalizations,
      suggestedSendTime,
    }
  }

  /**
   * Identifier les follow-ups nécessaires dans le portefeuille
   */
  async getSmartFollowUps(options?: { limit?: number }): Promise<SmartFollowUp[]> {
    const now = new Date()
    const followUps: SmartFollowUp[] = []

    // Find clients who received emails but didn't respond
    const recentEmails = await this.prisma.email.findMany({
      where: {
        client: { cabinetId: this.cabinetId },
        createdAt: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
        status: 'ENVOYE',
      },
      include: {
        client: { select: { id: true, firstName: true, lastName: true, email: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Group by client, get latest email per client
    const clientEmailMap = new Map<string, typeof recentEmails[0]>()
    for (const email of recentEmails) {
      if (!clientEmailMap.has(email.clientId!)) {
        clientEmailMap.set(email.clientId!, email)
      }
    }

    for (const [, lastEmail] of clientEmailMap) {
      if (!lastEmail.client) continue

      const daysSince = Math.floor((now.getTime() - new Date(lastEmail.createdAt).getTime()) / (1000 * 60 * 60 * 24))

      // Only suggest follow-up if 3+ days have passed
      if (daysSince < 3) continue

      // Check if there was a response after this email
      const hasResponse = await this.prisma.email.count({
        where: {
          clientId: lastEmail.clientId,
          createdAt: { gt: lastEmail.createdAt },
          // Check for newer emails from this client (potential response)
        },
      })

      if (hasResponse > 0) continue

      const followUpType: SmartFollowUp['followUpType'] =
        daysSince <= 7 ? 'first' : daysSince <= 14 ? 'second' : 'final'

      followUps.push({
        clientId: lastEmail.client.id,
        clientName: `${lastEmail.client.firstName} ${lastEmail.client.lastName}`,
        lastEmailDate: lastEmail.createdAt,
        daysSinceLastEmail: daysSince,
        followUpType,
        suggestedSubject: followUpType === 'final'
          ? `Re: ${lastEmail.subject} — Dernière relance`
          : `Re: ${lastEmail.subject}`,
        suggestedBody: this.generateFollowUpBody(followUpType, lastEmail.client.firstName),
        urgency: followUpType === 'final' ? 'high' : followUpType === 'second' ? 'medium' : 'low',
      })
    }

    followUps.sort((a, b) => {
      const urgencyOrder = { high: 0, medium: 1, low: 2 }
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency]
    })

    return options?.limit ? followUps.slice(0, options.limit) : followUps
  }

  /**
   * Obtenir les séquences prédéfinies disponibles
   */
  getAvailableSequences(): { type: SequenceType; name: string; description: string; stepCount: number }[] {
    return (Object.keys(PREDEFINED_SEQUENCES) as SequenceType[])
      .filter(type => type !== 'CUSTOM')
      .map(type => ({
        type,
        name: this.getSequenceName(type),
        description: this.getSequenceDescription(type),
        stepCount: PREDEFINED_SEQUENCES[type].length,
      }))
  }

  // ── Helpers ──

  private async getSegmentRecipients(segment: string) {
    const where: any = { cabinetId: this.cabinetId, email: { not: null } }

    switch (segment) {
      case 'PROSPECTS': where.status = 'PROSPECT'; break
      case 'ACTIFS': where.status = 'ACTIF'; break
      case 'PREMIUM': where.status = 'ACTIF'; where.patrimoineNet = { gte: 500_000 }; break
      case 'KYC_EXPIRE': where.kycStatus = 'EXPIRE'; break
      case 'INACTIFS':
        where.status = 'ACTIF'
        where.lastContactDate = { lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
        break
      default: break
    }

    return this.prisma.client.findMany({
      where,
      select: { id: true, firstName: true, lastName: true, email: true },
    })
  }

  private getSequenceName(type: SequenceType): string {
    const names: Record<SequenceType, string> = {
      ONBOARDING: 'Onboarding nouveau client',
      NURTURING: 'Nurturing prospect',
      RELANCE_PROSPECT: 'Relance prospect froid',
      SUIVI_RDV: 'Suivi post-RDV',
      ANNIVERSARY: 'Anniversaire client',
      KYC_REMINDER: 'Rappel KYC',
      REVUE_ANNUELLE: 'Invitation revue annuelle',
      FISCAL_DEADLINE: 'Échéance fiscale',
      CUSTOM: 'Séquence personnalisée',
    }
    return names[type]
  }

  private getSequenceDescription(type: SequenceType): string {
    const descriptions: Record<SequenceType, string> = {
      ONBOARDING: 'Séquence d\'accueil pour les nouveaux clients — 3 emails sur 2 semaines',
      NURTURING: 'Éducation et engagement des prospects — 3 emails sur 3 semaines',
      RELANCE_PROSPECT: 'Relance des prospects inactifs — 2 emails sur 1 semaine',
      SUIVI_RDV: 'Récapitulatif automatique post-rendez-vous — 1 email J+1',
      ANNIVERSARY: 'Message d\'anniversaire personnalisé — 1 email',
      KYC_REMINDER: 'Rappels progressifs pour mise à jour KYC — 3 emails avec escalation',
      REVUE_ANNUELLE: 'Invitation à la revue patrimoniale annuelle — 2 emails',
      FISCAL_DEADLINE: 'Alerte échéance fiscale — 1 email',
      CUSTOM: 'Séquence personnalisée',
    }
    return descriptions[type]
  }

  private getOptimalSendTime(now: Date): Date {
    const send = new Date(now)
    // Target: next weekday (Tue-Thu), 9:30 AM
    send.setHours(9, 30, 0, 0)

    // Move to next weekday if weekend
    while (send.getDay() === 0 || send.getDay() === 6 || send <= now) {
      send.setDate(send.getDate() + 1)
    }

    // Prefer Tuesday-Thursday
    while (send.getDay() === 1 || send.getDay() === 5) {
      send.setDate(send.getDate() + 1)
    }

    return send
  }

  private generateFollowUpBody(type: SmartFollowUp['followUpType'], firstName: string): string {
    switch (type) {
      case 'first':
        return `Bonjour ${firstName},\n\nJe me permets de vous relancer suite à mon précédent email. Avez-vous eu le temps d'y jeter un œil ?\n\nJe reste à votre disposition.\n\nCordialement`
      case 'second':
        return `Bonjour ${firstName},\n\nJe reviens vers vous une dernière fois. Si le moment n'est pas opportun, n'hésitez pas à me le dire — je comprendrai parfaitement.\n\nBien cordialement`
      case 'final':
        return `Bonjour ${firstName},\n\nSans nouvelles de votre part, je ne vous relancerai plus sur ce sujet. Sachez que je reste disponible si vous souhaitez en discuter à l'avenir.\n\nCordialement`
    }
  }
}
