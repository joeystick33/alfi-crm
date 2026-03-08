/**
 * Agent Workflows — Moteur d'automatisation type n8n/Make
 * 
 * Workflows prédéfinis exécutables par AURA V2 :
 *   • onboarding_client — Dossier + KYC + RDV + email bienvenue
 *   • revue_kyc — Tâches de contrôle KYC
 *   • bilan_annuel — Dossier + simulation + RDV
 *   • relance_inactifs — Tâches + emails pour clients inactifs
 *   • preparation_rdv — Briefing client complet
 *   • suivi_post_rdv — CR + email + mise à jour contact
 *   • anniversaire_clients — Emails anniversaire
 *   • revue_contrats — Alertes échéances contrats
 *   • alerte_echeances — Dashboard alertes
 *   • newsletter_mensuelle — Campagne newsletter
 */

import { getPrismaClient } from '../../prisma'
import type { ToolResult, ToolContext } from './agent-tools'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaInstance = ReturnType<typeof getPrismaClient> & Record<string, any>

type ClientRef = { id: string; firstName: string; lastName: string } | null

export async function executeWorkflow(
  workflowName: string,
  prisma: PrismaInstance,
  context: ToolContext,
  client: ClientRef,
  extraParams: Record<string, unknown>,
): Promise<ToolResult> {
  switch (workflowName) {
    case 'onboarding_client': return wfOnboarding(prisma, context, client, extraParams)
    case 'revue_kyc': return wfRevueKYC(prisma, context, client)
    case 'bilan_annuel': return wfBilanAnnuel(prisma, context, client)
    case 'relance_inactifs': return wfRelanceInactifs(prisma, context)
    case 'preparation_rdv': return wfPreparationRDV(prisma, context, client)
    case 'suivi_post_rdv': return wfSuiviPostRDV(prisma, context, client)
    case 'anniversaire_clients': return wfAnniversaire(prisma, context)
    case 'revue_contrats': return wfRevueContrats(prisma, context, client)
    case 'alerte_echeances': return wfAlerteEcheances(prisma, context)
    case 'newsletter_mensuelle': return wfNewsletter(prisma, context, extraParams)
    default:
      return { success: false, toolName: 'run_workflow', message: `Workflow inconnu: ${workflowName}` }
  }
}

// Helper: générer une référence dossier
async function genDossierRef(prisma: PrismaInstance, cabinetId: string): Promise<string> {
  const count = await prisma.dossier.count({ where: { cabinetId } })
  return `DOS-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`
}

// ============================================================================
// WORKFLOW: Onboarding Client
// ============================================================================

async function wfOnboarding(
  prisma: PrismaInstance, ctx: ToolContext, client: ClientRef,
  extra: Record<string, unknown>,
): Promise<ToolResult> {
  if (!client) return { success: false, toolName: 'run_workflow', message: 'Client requis pour l\'onboarding' }
  const actions: string[] = []

  // 1. Dossier
  const ref = await genDossierRef(prisma, ctx.cabinetId)
  const dossier = await prisma.dossier.create({
    data: {
      cabinetId: ctx.cabinetId, clientId: client.id, conseillerId: ctx.userId,
      reference: ref, nom: `Onboarding ${client.firstName} ${client.lastName}`,
      categorie: 'PATRIMOINE', type: 'BILAN_PATRIMONIAL', priorite: 'HAUTE', status: 'ACTIF',
    },
  })
  actions.push(`Dossier onboarding créé: ${ref}`)

  // 2. Tâches KYC
  const tasks = ['Vérifier pièce d\'identité', 'Justificatif de domicile', 'Questionnaire MiFID', 'Profil de risque', 'Situation patrimoniale']
  for (const t of tasks) {
    await prisma.tache.create({
      data: {
        cabinetId: ctx.cabinetId, assignedToId: ctx.userId, clientId: client.id,
        title: t, type: 'MISE_A_JOUR_KYC', priority: 'HAUTE', status: 'A_FAIRE',
        dueDate: new Date(Date.now() + 7 * 86400000),
        createdById: ctx.userId,
      },
    })
  }
  actions.push(`${tasks.length} tâches KYC créées`)

  // 3. RDV découverte
  const rdvDate = extra.rdvDate ? new Date(extra.rdvDate as string) : new Date(Date.now() + 3 * 86400000)
  await prisma.rendezVous.create({
    data: {
      cabinetId: ctx.cabinetId, conseillerId: ctx.userId, clientId: client.id,
      title: `Entretien découverte — ${client.firstName} ${client.lastName}`,
      type: 'PREMIER_RDV', startDate: rdvDate, endDate: new Date(rdvDate.getTime() + 5400000),
      status: 'PLANIFIE',
    },
  })
  actions.push(`RDV découverte planifié le ${rdvDate.toLocaleDateString('fr-FR')}`)

  // 4. Email bienvenue
  const cd = await prisma.client.findFirst({ where: { id: client.id }, select: { email: true } })
  if (cd?.email) {
    await prisma.email.create({
      data: {
        cabinetId: ctx.cabinetId, senderId: ctx.userId, clientId: client.id,
        subject: `Bienvenue ${client.firstName} — votre parcours patrimonial commence`,
        body: `<p>Bonjour ${client.firstName},</p><p>Votre dossier <strong>${ref}</strong> a été ouvert. Un RDV découverte est prévu le <strong>${rdvDate.toLocaleDateString('fr-FR')}</strong>.</p><p>D'ici là, merci de rassembler vos avis d'imposition, relevés d'épargne et crédits.</p>`,
        to: [cd.email], status: 'ENVOYE', sentAt: new Date(),
      },
    })
    actions.push(`Email de bienvenue envoyé à ${cd.email}`)
  }

  // 5. Statut client
  await prisma.client.update({ where: { id: client.id }, data: { status: 'ACTIF', kycStatus: 'EN_COURS' } })
  actions.push('Client passé en ACTIF, KYC EN_COURS')

  return {
    success: true, toolName: 'run_workflow',
    data: { workflow: 'onboarding_client', dossierId: dossier.id, actions },
    message: `Onboarding de ${client.firstName} ${client.lastName} terminé :\n${actions.map(a => `✅ ${a}`).join('\n')}`,
    actionTaken: 'Workflow onboarding complet',
    navigationUrl: `/dashboard/clients/${client.id}`,
  }
}

// ============================================================================
// WORKFLOW: Revue KYC
// ============================================================================

async function wfRevueKYC(prisma: PrismaInstance, ctx: ToolContext, client: ClientRef): Promise<ToolResult> {
  if (!client) return { success: false, toolName: 'run_workflow', message: 'Client requis' }
  const actions: string[] = []

  const tasks = ['Vérifier identité', 'Contrôler adresse', 'Revalider profil risque', 'Mise à jour patrimoniale', 'Vérification PEP/sanctions']
  for (const t of tasks) {
    await prisma.tache.create({
      data: {
        cabinetId: ctx.cabinetId, assignedToId: ctx.userId, clientId: client.id,
        title: `[KYC] ${t}`, type: 'MISE_A_JOUR_KYC', priority: 'HAUTE', status: 'A_FAIRE',
        dueDate: new Date(Date.now() + 14 * 86400000),
        createdById: ctx.userId,
      },
    })
  }
  actions.push(`${tasks.length} tâches de revue KYC créées`)

  await prisma.client.update({
    where: { id: client.id },
    data: { kycStatus: 'EN_COURS', kycNextReviewDate: new Date(Date.now() + 365 * 86400000) },
  })
  actions.push('Statut KYC → EN_COURS, prochaine revue dans 1 an')

  return {
    success: true, toolName: 'run_workflow',
    data: { workflow: 'revue_kyc', actions },
    message: `Revue KYC lancée pour ${client.firstName} ${client.lastName} :\n${actions.map(a => `✅ ${a}`).join('\n')}`,
    actionTaken: 'Workflow revue KYC lancé',
  }
}

// ============================================================================
// WORKFLOW: Bilan Annuel
// ============================================================================

async function wfBilanAnnuel(prisma: PrismaInstance, ctx: ToolContext, client: ClientRef): Promise<ToolResult> {
  if (!client) return { success: false, toolName: 'run_workflow', message: 'Client requis' }
  const actions: string[] = []

  const cd = await prisma.client.findFirst({
    where: { id: client.id },
    select: { patrimoineNet: true, totalRevenus: true, totalCharges: true, irTaxRate: true },
  })

  const ref = await genDossierRef(prisma, ctx.cabinetId)
  const dossier = await prisma.dossier.create({
    data: {
      cabinetId: ctx.cabinetId, clientId: client.id, conseillerId: ctx.userId,
      reference: ref, nom: `Bilan annuel ${new Date().getFullYear()} — ${client.firstName} ${client.lastName}`,
      categorie: 'PATRIMOINE', type: 'BILAN_PATRIMONIAL', priorite: 'HAUTE', status: 'EN_COURS',
    },
  })
  actions.push(`Dossier bilan annuel créé: ${ref}`)

  // Simulation fiscale
  const revenus = cd?.totalRevenus ? Number(cd.totalRevenus) : 0
  const tmi = cd?.irTaxRate ? Number(cd.irTaxRate) : 30
  const plafondPER = Math.min(revenus * 0.10, 35194)
  await prisma.simulation.create({
    data: {
      cabinetId: ctx.cabinetId, clientId: client.id, createdById: ctx.userId,
      type: 'OPTIMISATION_FISCALE', name: `Opti fiscale ${new Date().getFullYear()}`,
      parameters: { revenus, tmi }, results: { plafondPER, economieIR: plafondPER * tmi / 100 },
      status: 'TERMINE',
    },
  })
  actions.push('Simulation optimisation fiscale réalisée')

  // RDV bilan
  const rdvDate = new Date(Date.now() + 7 * 86400000)
  await prisma.rendezVous.create({
    data: {
      cabinetId: ctx.cabinetId, conseillerId: ctx.userId, clientId: client.id,
      title: `Bilan annuel — ${client.firstName} ${client.lastName}`,
      type: 'BILAN_ANNUEL', startDate: rdvDate, endDate: new Date(rdvDate.getTime() + 3600000), status: 'PLANIFIE',
    },
  })
  actions.push(`RDV bilan planifié le ${rdvDate.toLocaleDateString('fr-FR')}`)

  return {
    success: true, toolName: 'run_workflow',
    data: { workflow: 'bilan_annuel', dossierId: dossier.id, actions },
    message: `Bilan annuel lancé pour ${client.firstName} ${client.lastName} :\n${actions.map(a => `✅ ${a}`).join('\n')}`,
    actionTaken: 'Workflow bilan annuel complet',
    navigationUrl: `/dashboard/dossiers/${dossier.id}`,
  }
}

// ============================================================================
// WORKFLOW: Relance Inactifs
// ============================================================================

async function wfRelanceInactifs(prisma: PrismaInstance, ctx: ToolContext): Promise<ToolResult> {
  const sixMonthsAgo = new Date(Date.now() - 180 * 86400000)
  const inactifs = await prisma.client.findMany({
    where: {
      cabinetId: ctx.cabinetId, status: { in: ['ACTIF', 'INACTIF'] },
      OR: [{ lastContactDate: { lt: sixMonthsAgo } }, { lastContactDate: null }],
    },
    select: { id: true, firstName: true, lastName: true, email: true },
    take: 20,
  })

  const actions: string[] = []
  for (const c of inactifs) {
    await prisma.tache.create({
      data: {
        cabinetId: ctx.cabinetId, assignedToId: ctx.userId, clientId: c.id,
        title: `Relance ${c.firstName} ${c.lastName}`, type: 'SUIVI', priority: 'MOYENNE',
        status: 'A_FAIRE', dueDate: new Date(Date.now() + 7 * 86400000),
        createdById: ctx.userId,
      },
    })
    if (c.email) {
      await prisma.email.create({
        data: {
          cabinetId: ctx.cabinetId, senderId: ctx.userId, clientId: c.id,
          subject: `${c.firstName}, prenons des nouvelles`,
          body: `<p>Bonjour ${c.firstName},</p><p>Cela fait un moment que nous n'avons pas échangé. Je serais ravi de faire le point sur votre situation.</p>`,
          to: [c.email], status: 'BROUILLON',
        },
      })
    }
    actions.push(`${c.firstName} ${c.lastName} — tâche + email brouillon`)
  }

  return {
    success: true, toolName: 'run_workflow',
    data: { workflow: 'relance_inactifs', count: inactifs.length, actions },
    message: `Relance de ${inactifs.length} client(s) inactif(s) :\n${actions.map(a => `📧 ${a}`).join('\n')}`,
    actionTaken: `Workflow relance: ${inactifs.length} clients`,
  }
}

// ============================================================================
// WORKFLOW: Préparation RDV
// ============================================================================

async function wfPreparationRDV(prisma: PrismaInstance, ctx: ToolContext, client: ClientRef): Promise<ToolResult> {
  if (!client) return { success: false, toolName: 'run_workflow', message: 'Client requis' }

  const [cd, actifs, passifs, contrats, taches] = await Promise.all([
    prisma.client.findFirst({
      where: { id: client.id },
      select: { patrimoineNet: true, totalActifs: true, totalPassifs: true, totalRevenus: true, kycStatus: true, riskProfile: true },
    }),
    prisma.actif.count({ where: { cabinetId: ctx.cabinetId, clients: { some: { clientId: client.id } } } }),
    prisma.passif.count({ where: { clientId: client.id } }),
    prisma.contrat.count({ where: { clientId: client.id, status: 'ACTIF' } }),
    prisma.tache.count({ where: { clientId: client.id, status: { in: ['A_FAIRE', 'EN_COURS'] } } }),
  ])

  return {
    success: true, toolName: 'run_workflow',
    data: {
      workflow: 'preparation_rdv',
      briefing: {
        client: `${client.firstName} ${client.lastName}`,
        patrimoine: cd?.patrimoineNet ? Number(cd.patrimoineNet) : 0,
        actifs, passifs, contrats, tachesEnCours: taches,
        profilRisque: cd?.riskProfile, kycStatus: cd?.kycStatus,
      },
    },
    message: `Briefing pour ${client.firstName} ${client.lastName} prêt`,
    actionTaken: 'Briefing client préparé',
  }
}

// ============================================================================
// WORKFLOW: Suivi Post-RDV
// ============================================================================

async function wfSuiviPostRDV(prisma: PrismaInstance, ctx: ToolContext, client: ClientRef): Promise<ToolResult> {
  if (!client) return { success: false, toolName: 'run_workflow', message: 'Client requis' }
  const actions: string[] = []

  await prisma.tache.create({
    data: {
      cabinetId: ctx.cabinetId, assignedToId: ctx.userId, clientId: client.id,
      title: `Rédiger CR RDV — ${client.firstName} ${client.lastName}`,
      type: 'ADMINISTRATIF', priority: 'HAUTE', status: 'A_FAIRE',
      dueDate: new Date(Date.now() + 2 * 86400000),
      createdById: ctx.userId,
    },
  })
  actions.push('Tâche compte-rendu créée (J+2)')

  const cd = await prisma.client.findFirst({ where: { id: client.id }, select: { email: true } })
  if (cd?.email) {
    await prisma.email.create({
      data: {
        cabinetId: ctx.cabinetId, senderId: ctx.userId, clientId: client.id,
        subject: `Suite à notre rendez-vous — ${client.firstName}`,
        body: `<p>Bonjour ${client.firstName},</p><p>Merci pour notre échange. Voici les prochaines étapes : [à compléter]</p>`,
        to: [cd.email], status: 'BROUILLON',
      },
    })
    actions.push('Brouillon email de suivi créé')
  }

  await prisma.client.update({ where: { id: client.id }, data: { lastContactDate: new Date() } })
  actions.push('Date dernier contact mise à jour')

  return {
    success: true, toolName: 'run_workflow',
    data: { workflow: 'suivi_post_rdv', actions },
    message: `Suivi post-RDV pour ${client.firstName} ${client.lastName} :\n${actions.map(a => `✅ ${a}`).join('\n')}`,
    actionTaken: 'Workflow suivi post-RDV terminé',
  }
}

// ============================================================================
// WORKFLOW: Anniversaire Clients
// ============================================================================

async function wfAnniversaire(prisma: PrismaInstance, ctx: ToolContext): Promise<ToolResult> {
  const today = new Date()
  const nextWeek = new Date(Date.now() + 7 * 86400000)

  const clients = await prisma.client.findMany({
    where: { cabinetId: ctx.cabinetId, status: 'ACTIF', birthDate: { not: null } },
    select: { id: true, firstName: true, lastName: true, email: true, birthDate: true },
  })

  const bdays = clients.filter((c: { birthDate: Date | null }) => {
    if (!c.birthDate) return false
    const bd = new Date(c.birthDate)
    const thisYear = new Date(today.getFullYear(), bd.getMonth(), bd.getDate())
    return thisYear >= today && thisYear <= nextWeek
  })

  const actions: string[] = []
  for (const c of bdays) {
    if (c.email) {
      await prisma.email.create({
        data: {
          cabinetId: ctx.cabinetId, senderId: ctx.userId, clientId: c.id,
          subject: `Joyeux anniversaire ${c.firstName} !`,
          body: `<p>Cher(e) ${c.firstName},</p><p>Toute l'équipe vous souhaite un très joyeux anniversaire !</p>`,
          to: [c.email], status: 'BROUILLON',
        },
      })
    }
    actions.push(`${c.firstName} ${c.lastName}`)
  }

  return {
    success: true, toolName: 'run_workflow',
    data: { workflow: 'anniversaire_clients', count: bdays.length, actions },
    message: bdays.length > 0
      ? `${bdays.length} anniversaire(s) cette semaine :\n${actions.map(a => `🎂 ${a}`).join('\n')}`
      : 'Aucun anniversaire dans les 7 prochains jours',
    actionTaken: `Anniversaires: ${bdays.length} trouvés`,
  }
}

// ============================================================================
// WORKFLOW: Revue Contrats
// ============================================================================

async function wfRevueContrats(prisma: PrismaInstance, ctx: ToolContext, client: ClientRef): Promise<ToolResult> {
  const where: Record<string, unknown> = { cabinetId: ctx.cabinetId, status: 'ACTIF' }
  if (client) where.clientId = client.id

  const contrats = await prisma.contrat.findMany({
    where, include: { client: { select: { firstName: true, lastName: true } } }, take: 30,
  })

  const actions: string[] = []
  for (const c of contrats) {
    const name = c.client ? `${c.client.firstName} ${c.client.lastName}` : 'N/A'
    if (c.endDate && new Date(c.endDate) < new Date(Date.now() + 90 * 86400000)) {
      await prisma.tache.create({
        data: {
          cabinetId: ctx.cabinetId, assignedToId: ctx.userId, clientId: c.clientId,
          title: `Renouveler ${c.type} — ${name}`, type: 'RENOUVELLEMENT_CONTRAT', priority: 'HAUTE',
          status: 'A_FAIRE', dueDate: new Date(c.endDate),
          createdById: ctx.userId,
        },
      })
      actions.push(`${c.type} ${name} — échéance ${new Date(c.endDate).toLocaleDateString('fr-FR')}`)
    }
  }

  return {
    success: true, toolName: 'run_workflow',
    data: { workflow: 'revue_contrats', total: contrats.length, alertes: actions.length },
    message: `Revue de ${contrats.length} contrat(s) — ${actions.length} alerte(s) :\n${actions.map(a => `⚠️ ${a}`).join('\n') || 'Aucune échéance critique'}`,
    actionTaken: `Revue contrats: ${actions.length} alertes`,
  }
}

// ============================================================================
// WORKFLOW: Alerte Échéances
// ============================================================================

async function wfAlerteEcheances(prisma: PrismaInstance, ctx: ToolContext): Promise<ToolResult> {
  const [tachesRetard, rdvProches, kycExpiring] = await Promise.all([
    prisma.tache.count({
      where: { cabinetId: ctx.cabinetId, assignedToId: ctx.userId, status: { in: ['A_FAIRE', 'EN_COURS'] }, dueDate: { lt: new Date() } },
    }),
    prisma.rendezVous.count({
      where: { cabinetId: ctx.cabinetId, conseillerId: ctx.userId, startDate: { gte: new Date(), lte: new Date(Date.now() + 7 * 86400000) }, status: 'PLANIFIE' },
    }),
    prisma.client.count({
      where: { cabinetId: ctx.cabinetId, kycNextReviewDate: { lt: new Date(Date.now() + 30 * 86400000) }, kycStatus: { not: 'EXPIRE' } },
    }),
  ])

  return {
    success: true, toolName: 'run_workflow',
    data: { workflow: 'alerte_echeances', tachesRetard, rdvProches, kycExpiring },
    message: `Alertes :\n- ${tachesRetard} tâche(s) en retard\n- ${rdvProches} RDV dans les 7 jours\n- ${kycExpiring} KYC expirant sous 30 jours`,
    actionTaken: 'Vérification échéances',
  }
}

// ============================================================================
// WORKFLOW: Newsletter Mensuelle
// ============================================================================

async function wfNewsletter(prisma: PrismaInstance, ctx: ToolContext, extra: Record<string, unknown>): Promise<ToolResult> {
  const subject = (extra.subject as string) || `Newsletter ${new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`

  const campaign = await prisma.campaign.create({
    data: {
      cabinetId: ctx.cabinetId, createdBy: ctx.userId,
      name: subject, type: 'EMAIL', subject,
      htmlContent: (extra.content as string) || `<h2>${subject}</h2><p>[Contenu à personnaliser]</p>`,
      status: 'BROUILLON', description: 'Newsletter mensuelle',
    },
  })

  const activeClients = await prisma.client.count({
    where: { cabinetId: ctx.cabinetId, status: 'ACTIF', email: { not: null } },
  })

  return {
    success: true, toolName: 'run_workflow',
    data: { workflow: 'newsletter_mensuelle', campaignId: campaign.id, potentialRecipients: activeClients },
    message: `Campagne newsletter créée en brouillon — ${activeClients} destinataires potentiels`,
    actionTaken: 'Campagne newsletter créée',
  }
}
