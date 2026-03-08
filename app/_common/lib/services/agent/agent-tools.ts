/**
 * Agent Tools — Outils CRM que l'agent IA peut exécuter
 * 
 * Chaque outil est une action concrète dans le CRM :
 *   • search_clients — Rechercher des clients par critères
 *   • get_client_detail — Récupérer le détail d'un client
 *   • create_task — Créer une tâche
 *   • create_appointment — Planifier un rendez-vous
 *   • search_contracts — Rechercher des contrats
 *   • get_portfolio_summary — Résumé patrimonial d'un client
 *   • get_upcoming_tasks — Tâches à venir
 *   • get_kyc_status — Statut KYC des clients
 *   • create_notification — Créer une notification
 *   • save_instruction — Sauvegarder une instruction utilisateur
 *   • list_instructions — Lister les instructions mémorisées
 *   • delete_instruction — Supprimer une instruction
 * 
 * L'agent choisit quel outil utiliser en fonction de la requête utilisateur.
 * Les outils à risque (create/update/delete) nécessitent une confirmation.
 */

import { getPrismaClient, prisma as basePrisma } from '../../prisma'
import { AgentMemoryService } from './agent-memory'
import { logger } from '@/app/_common/lib/logger'
// Type safe : on utilise le retour de getPrismaClient (PrismaClient étendu tenant)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaInstance = ReturnType<typeof getPrismaClient> & Record<string, any>

// Timeout pour l'exécution des outils (10 secondes)
const TOOL_EXECUTION_TIMEOUT_MS = 10_000

async function withTimeout<T>(promise: Promise<T>, ms: number, toolName: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout: l'outil ${toolName} n'a pas répondu en ${ms / 1000}s`)), ms)
    ),
  ])
}

/** Persiste une action agent dans la table AgentAction pour audit trail */
async function persistAgentAction(
  context: ToolContext,
  toolName: string,
  params: Record<string, unknown>,
  result: ToolResult,
  triggerQuery: string,
  requiresConfirmation: boolean,
): Promise<void> {
  try {
    await basePrisma.agentAction.create({
      data: {
        cabinetId: context.cabinetId,
        userId: context.userId,
        clientId: context.clientId || null,
        toolName,
        toolParams: JSON.parse(JSON.stringify(params)),
        status: result.success ? 'EXECUTED' : 'FAILED',
        result: result.data ? JSON.parse(JSON.stringify(result.data)) : undefined,
        error: result.success ? null : result.message,
        triggerQuery,
        requiresConfirmation,
        executedAt: new Date(),
      },
    })
  } catch (e) {
    logger.warn('[AgentAction] Failed to persist action: ' + (e instanceof Error ? e.message : 'unknown'))
  }
}

// ============================================================================
// TYPES
// ============================================================================

export interface ToolDefinition {
  name: string
  description: string
  parameters: ToolParameter[]
  requiresConfirmation: boolean
  category: 'read' | 'write' | 'memory' | 'navigation'
}

export interface ToolParameter {
  name: string
  type: 'string' | 'number' | 'boolean' | 'date'
  description: string
  required: boolean
  enum?: string[]
}

export interface ToolResult {
  success: boolean
  toolName: string
  data?: unknown
  message: string
  actionTaken?: string
  /** URL de navigation frontend (l'agent demande au frontend de naviguer) */
  navigationUrl?: string
}

export interface ToolContext {
  cabinetId: string
  userId: string
  clientId?: string
}

// ============================================================================
// DÉFINITIONS D'OUTILS (décrites pour le LLM)
// ============================================================================

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  // ── LECTURE ──
  {
    name: 'search_clients',
    description: 'Rechercher des clients dans le CRM par nom, email, statut ou critères patrimoniaux. Peut trier par patrimoine pour trouver les plus gros clients.',
    parameters: [
      { name: 'query', type: 'string', description: 'Nom, prénom ou email du client', required: false },
      { name: 'status', type: 'string', description: 'Statut du client', required: false, enum: ['PROSPECT', 'ACTIF', 'INACTIF', 'ARCHIVE'] },
      { name: 'minPatrimoine', type: 'number', description: 'Patrimoine net minimum (€)', required: false },
      { name: 'orderBy', type: 'string', description: 'Tri des résultats', required: false, enum: ['patrimoine_desc', 'patrimoine_asc', 'nom', 'dernier_contact'] },
      { name: 'limit', type: 'number', description: 'Nombre max de résultats (défaut: 10)', required: false },
    ],
    requiresConfirmation: false,
    category: 'read',
  },
  {
    name: 'get_client_detail',
    description: 'Récupérer les informations détaillées d\'un client (patrimoine, contrats, fiscalité, profil)',
    parameters: [
      { name: 'clientId', type: 'string', description: 'ID du client', required: false },
      { name: 'clientName', type: 'string', description: 'Nom du client (recherche si pas d\'ID)', required: false },
    ],
    requiresConfirmation: false,
    category: 'read',
  },
  {
    name: 'get_portfolio_summary',
    description: 'Obtenir le résumé patrimonial d\'un client (actifs, passifs, patrimoine net, répartition)',
    parameters: [
      { name: 'clientId', type: 'string', description: 'ID du client', required: true },
    ],
    requiresConfirmation: false,
    category: 'read',
  },
  {
    name: 'get_upcoming_tasks',
    description: 'Récupérer les tâches à venir du conseiller (en retard, aujourd\'hui, cette semaine)',
    parameters: [
      { name: 'status', type: 'string', description: 'Filtrer par statut', required: false, enum: ['A_FAIRE', 'EN_COURS'] },
      { name: 'clientId', type: 'string', description: 'Filtrer par client', required: false },
      { name: 'limit', type: 'number', description: 'Nombre max (défaut: 10)', required: false },
    ],
    requiresConfirmation: false,
    category: 'read',
  },
  {
    name: 'get_upcoming_appointments',
    description: 'Récupérer les rendez-vous à venir du conseiller',
    parameters: [
      { name: 'days', type: 'number', description: 'Nombre de jours à regarder (défaut: 7)', required: false },
      { name: 'clientId', type: 'string', description: 'Filtrer par client', required: false },
    ],
    requiresConfirmation: false,
    category: 'read',
  },
  {
    name: 'get_kyc_alerts',
    description: 'Récupérer les alertes KYC : expirations proches, documents manquants',
    parameters: [
      { name: 'daysUntilExpiry', type: 'number', description: 'Jours avant expiration (défaut: 30)', required: false },
    ],
    requiresConfirmation: false,
    category: 'read',
  },
  {
    name: 'search_contracts',
    description: 'Rechercher des contrats (assurance-vie, PER, PEA, etc.) par type, client ou échéance',
    parameters: [
      { name: 'clientId', type: 'string', description: 'ID du client', required: false },
      { name: 'type', type: 'string', description: 'Type de contrat', required: false, enum: ['ASSURANCE_VIE', 'PER', 'PEA', 'COMPTE_TITRES', 'CAPITALISATION', 'PREVOYANCE', 'SANTE', 'EMPRUNTEUR', 'AUTRE'] },
      { name: 'status', type: 'string', description: 'Statut', required: false, enum: ['ACTIF', 'EN_COURS', 'RESILIE', 'EXPIRE'] },
    ],
    requiresConfirmation: false,
    category: 'read',
  },
  {
    name: 'get_dashboard_stats',
    description: 'Récupérer les statistiques du tableau de bord : nombre de clients, tâches en retard, RDV aujourd\'hui, patrimoine géré',
    parameters: [],
    requiresConfirmation: false,
    category: 'read',
  },

  // ── ÉCRITURE (nécessite confirmation) ──
  {
    name: 'create_task',
    description: 'Créer une nouvelle tâche dans le CRM',
    parameters: [
      { name: 'title', type: 'string', description: 'Titre de la tâche', required: true },
      { name: 'description', type: 'string', description: 'Description détaillée', required: false },
      { name: 'type', type: 'string', description: 'Type de tâche', required: true, enum: ['APPEL', 'EMAIL', 'REUNION', 'REVUE_DOCUMENTS', 'MISE_A_JOUR_KYC', 'RENOUVELLEMENT_CONTRAT', 'SUIVI', 'ADMINISTRATIF', 'AUTRE'] },
      { name: 'priority', type: 'string', description: 'Priorité', required: false, enum: ['BASSE', 'MOYENNE', 'HAUTE', 'URGENTE'] },
      { name: 'dueDate', type: 'date', description: 'Date d\'échéance (ISO)', required: false },
      { name: 'clientId', type: 'string', description: 'ID du client concerné', required: false },
      { name: 'clientName', type: 'string', description: 'Nom du client (recherche si pas d\'ID)', required: false },
    ],
    requiresConfirmation: true,
    category: 'write',
  },
  {
    name: 'create_appointment',
    description: 'Planifier un rendez-vous avec un client',
    parameters: [
      { name: 'title', type: 'string', description: 'Titre du RDV', required: true },
      { name: 'clientId', type: 'string', description: 'ID du client', required: false },
      { name: 'clientName', type: 'string', description: 'Nom du client (recherche si pas d\'ID)', required: false },
      { name: 'type', type: 'string', description: 'Type de RDV', required: true, enum: ['PREMIER_RDV', 'SUIVI', 'BILAN_ANNUEL', 'SIGNATURE', 'APPEL_TEL', 'VISIO', 'AUTRE'] },
      { name: 'startDate', type: 'date', description: 'Date et heure de début (ISO)', required: true },
      { name: 'endDate', type: 'date', description: 'Date et heure de fin (ISO)', required: false },
      { name: 'description', type: 'string', description: 'Description / Notes', required: false },
      { name: 'isVirtual', type: 'boolean', description: 'Visioconférence ?', required: false },
    ],
    requiresConfirmation: true,
    category: 'write',
  },
  {
    name: 'create_notification',
    description: 'Créer une notification/rappel',
    parameters: [
      { name: 'title', type: 'string', description: 'Titre de la notification', required: true },
      { name: 'message', type: 'string', description: 'Message détaillé', required: true },
      { name: 'type', type: 'string', description: 'Type', required: false, enum: ['RAPPEL_RDV', 'TACHE_ECHEANCE', 'KYC_EXPIRATION', 'OPPORTUNITE_DETECTEE', 'SYSTEME', 'AUTRE'] },
      { name: 'clientId', type: 'string', description: 'Client concerné', required: false },
    ],
    requiresConfirmation: true,
    category: 'write',
  },

  // ── NAVIGATION ──
  {
    name: 'navigate_to_client',
    description: 'Ouvrir la fiche d\'un client dans le CRM. Utilise cet outil quand l\'utilisateur demande d\'ouvrir, afficher ou aller sur la fiche d\'un client.',
    parameters: [
      { name: 'clientId', type: 'string', description: 'ID du client', required: false },
      { name: 'clientName', type: 'string', description: 'Nom du client (recherche si pas d\'ID)', required: false },
      { name: 'tab', type: 'string', description: 'Onglet à ouvrir', required: false, enum: ['patrimoine', 'contrats', 'taches', 'rdv', 'documents', 'kyc', 'fiscalite'] },
    ],
    requiresConfirmation: false,
    category: 'navigation',
  },
  {
    name: 'navigate_to_page',
    description: 'Naviguer vers une page du CRM (tableau de bord, tâches, rendez-vous, clients, contrats, paramètres, etc.)',
    parameters: [
      { name: 'page', type: 'string', description: 'Page cible', required: true, enum: ['dashboard', 'clients', 'taches', 'rendez-vous', 'contrats', 'patrimoine', 'documents', 'conformite', 'parametres', 'pilotage'] },
    ],
    requiresConfirmation: false,
    category: 'navigation',
  },

  // ── MÉMOIRE ──
  {
    name: 'save_instruction',
    description: 'Mémoriser une instruction ou préférence de l\'utilisateur pour qu\'elle soit appliquée automatiquement',
    parameters: [
      { name: 'instruction', type: 'string', description: 'L\'instruction à mémoriser', required: true },
      { name: 'priority', type: 'number', description: '0=normal, 1=important, 2=critique', required: false },
      { name: 'clientId', type: 'string', description: 'Si lié à un client spécifique', required: false },
    ],
    requiresConfirmation: false,
    category: 'memory',
  },
  {
    name: 'save_fact',
    description: 'Mémoriser un fait ou une information importante sur un client ou le cabinet',
    parameters: [
      { name: 'title', type: 'string', description: 'Titre court du fait', required: true },
      { name: 'content', type: 'string', description: 'Détail du fait mémorisé', required: true },
      { name: 'clientId', type: 'string', description: 'ID du client concerné', required: false },
      { name: 'tags', type: 'string', description: 'Tags séparés par des virgules', required: false },
    ],
    requiresConfirmation: false,
    category: 'memory',
  },
  {
    name: 'list_instructions',
    description: 'Lister toutes les instructions et préférences mémorisées',
    parameters: [],
    requiresConfirmation: false,
    category: 'memory',
  },
  {
    name: 'delete_instruction',
    description: 'Supprimer une instruction ou préférence mémorisée',
    parameters: [
      { name: 'instructionId', type: 'string', description: 'ID de l\'instruction à supprimer', required: true },
    ],
    requiresConfirmation: true,
    category: 'memory',
  },
]

// ============================================================================
// EXÉCUTION DES OUTILS
// ============================================================================

export async function executeTool(
  toolName: string,
  params: Record<string, unknown>,
  context: ToolContext,
  triggerQuery: string = '',
): Promise<ToolResult> {
  const prisma = getPrismaClient(context.cabinetId, false)
  const toolDef = TOOL_DEFINITIONS.find(t => t.name === toolName)

  try {
    let resultPromise: Promise<ToolResult>

    switch (toolName) {
      // ── LECTURE ──
      case 'search_clients':
        resultPromise = execSearchClients(prisma, params, context); break
      case 'get_client_detail':
        resultPromise = execGetClientDetail(prisma, params, context); break
      case 'get_portfolio_summary':
        resultPromise = execGetPortfolioSummary(prisma, params, context); break
      case 'get_upcoming_tasks':
        resultPromise = execGetUpcomingTasks(prisma, params, context); break
      case 'get_upcoming_appointments':
        resultPromise = execGetUpcomingAppointments(prisma, params, context); break
      case 'get_kyc_alerts':
        resultPromise = execGetKycAlerts(prisma, params, context); break
      case 'search_contracts':
        resultPromise = execSearchContracts(prisma, params, context); break
      case 'get_dashboard_stats':
        resultPromise = execGetDashboardStats(prisma, params, context); break

      // ── ÉCRITURE ──
      case 'create_task':
        resultPromise = execCreateTask(prisma, params, context); break
      case 'create_appointment':
        resultPromise = execCreateAppointment(prisma, params, context); break
      case 'create_notification':
        resultPromise = execCreateNotification(prisma, params, context); break

      // ── NAVIGATION ──
      case 'navigate_to_client':
        resultPromise = execNavigateToClient(prisma, params, context); break
      case 'navigate_to_page':
        resultPromise = Promise.resolve(execNavigateToPage(params)); break

      // ── MÉMOIRE ──
      case 'save_instruction':
        resultPromise = execSaveInstruction(params, context); break
      case 'save_fact':
        resultPromise = execSaveFact(params, context); break
      case 'list_instructions':
        resultPromise = execListInstructions(context); break
      case 'delete_instruction':
        resultPromise = execDeleteInstruction(params, context); break

      default:
        return { success: false, toolName, message: `Outil inconnu : ${toolName}` }
    }

    const result = await withTimeout(resultPromise, TOOL_EXECUTION_TIMEOUT_MS, toolName)

    // Persister l'action pour audit trail (fire & forget)
    persistAgentAction(context, toolName, params, result, triggerQuery, toolDef?.requiresConfirmation ?? false)

    return result
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erreur inconnue'
    logger.error(`[AgentTool] ${toolName} failed: ${msg}`)
    const failResult: ToolResult = { success: false, toolName, message: `Erreur lors de l'exécution de ${toolName}: ${msg}` }

    // Persister aussi les échecs
    persistAgentAction(context, toolName, params, failResult, triggerQuery, toolDef?.requiresConfirmation ?? false)

    return failResult
  }
}

// ============================================================================
// IMPLÉMENTATIONS DES OUTILS
// ============================================================================

async function execSearchClients(prisma: PrismaInstance, params: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
  const query = params.query as string | undefined
  const status = params.status as string | undefined
  const minPatrimoine = params.minPatrimoine as number | undefined
  const orderByParam = params.orderBy as string | undefined
  const limit = Math.min((params.limit as number) || 10, 20)

  const where: Record<string, unknown> = { cabinetId: context.cabinetId }

  if (query) {
    where.OR = [
      { firstName: { contains: query, mode: 'insensitive' } },
      { lastName: { contains: query, mode: 'insensitive' } },
      { email: { contains: query, mode: 'insensitive' } },
      { companyName: { contains: query, mode: 'insensitive' } },
    ]
  }
  if (status) where.status = status
  if (minPatrimoine !== undefined && minPatrimoine > 0) where.patrimoineNet = { gte: minPatrimoine }

  // Déterminer le tri
  let orderBy: Record<string, string> = { lastName: 'asc' }
  if (orderByParam === 'patrimoine_desc' || (minPatrimoine === 0 && !query)) {
    orderBy = { patrimoineNet: 'desc' }
  } else if (orderByParam === 'patrimoine_asc') {
    orderBy = { patrimoineNet: 'asc' }
  } else if (orderByParam === 'dernier_contact') {
    orderBy = { lastContactDate: 'desc' }
  }

  const clients = await prisma.client.findMany({
    where,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      status: true,
      clientType: true,
      patrimoineNet: true,
      totalRevenus: true,
      kycStatus: true,
      kycNextReviewDate: true,
      riskProfile: true,
      lastContactDate: true,
    },
    orderBy,
    take: limit,
  })

  const formatted = clients.map((c: Record<string, unknown>) => ({
    id: c.id,
    nom: `${c.firstName} ${c.lastName}`,
    email: c.email,
    telephone: c.phone,
    statut: c.status,
    type: c.clientType,
    patrimoineNet: c.patrimoineNet ? Number(c.patrimoineNet) : null,
    revenus: c.totalRevenus ? Number(c.totalRevenus) : null,
    kycStatut: c.kycStatus,
    kycExpiration: c.kycNextReviewDate,
    profilRisque: c.riskProfile,
    dernierContact: c.lastContactDate,
  }))

  return {
    success: true,
    toolName: 'search_clients',
    data: formatted,
    message: `${formatted.length} client(s) trouvé(s)${query ? ` pour "${query}"` : ''}`,
  }
}

async function execGetClientDetail(prisma: PrismaInstance, params: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
  let clientId = params.clientId as string | undefined
  const clientName = params.clientName as string | undefined

  // Si pas d'ID, chercher par nom
  if (!clientId && clientName) {
    const found = await prisma.client.findFirst({
      where: {
        cabinetId: context.cabinetId,
        OR: [
          { lastName: { contains: clientName, mode: 'insensitive' } },
          { firstName: { contains: clientName, mode: 'insensitive' } },
        ],
      },
      select: { id: true },
    })
    if (!found) return { success: false, toolName: 'get_client_detail', message: `Client "${clientName}" non trouvé` }
    clientId = found.id
  }

  if (!clientId) return { success: false, toolName: 'get_client_detail', message: 'ID ou nom du client requis' }

  const client = await prisma.client.findFirst({
    where: { id: clientId, cabinetId: context.cabinetId },
    include: {
      contrats: { where: { status: 'ACTIF' }, take: 10 },
      _count: { select: { actifs: true, passifs: true, taches: true, rendezvous: true } },
    },
  })

  if (!client) return { success: false, toolName: 'get_client_detail', message: 'Client non trouvé' }

  return {
    success: true,
    toolName: 'get_client_detail',
    data: {
      id: client.id,
      nom: `${client.firstName} ${client.lastName}`,
      email: client.email,
      telephone: client.phone || client.mobile,
      dateNaissance: client.birthDate,
      situationFamiliale: client.maritalStatus,
      enfants: client.numberOfChildren,
      profession: client.profession,
      statut: client.status,
      type: client.clientType,
      patrimoineNet: client.patrimoineNet ? Number(client.patrimoineNet) : null,
      totalActifs: client.totalActifs ? Number(client.totalActifs) : null,
      totalPassifs: client.totalPassifs ? Number(client.totalPassifs) : null,
      revenus: client.totalRevenus ? Number(client.totalRevenus) : null,
      charges: client.totalCharges ? Number(client.totalCharges) : null,
      capaciteEpargne: client.capaciteEpargne ? Number(client.capaciteEpargne) : null,
      tauxEndettement: client.tauxEndettement ? Number(client.tauxEndettement) : null,
      profilRisque: client.riskProfile,
      horizonInvestissement: client.investmentHorizon,
      kycStatut: client.kycStatus,
      ifi: client.ifiSubject,
      tmi: client.irTaxRate ? Number(client.irTaxRate) : null,
      nombreContrats: client.contrats.length,
      nombreActifs: client._count.actifs,
      nombrePassifs: client._count.passifs,
      nombreTaches: client._count.taches,
      nombreRdv: client._count.rendezvous,
      contratsActifs: client.contrats.map((c: Record<string, unknown>) => ({
        type: c.type,
        compagnie: c.compagnie,
        valeur: c.valeurActuelle ? Number(c.valeurActuelle) : null,
      })),
    },
    message: `Fiche client ${client.firstName} ${client.lastName}`,
  }
}

async function execGetPortfolioSummary(prisma: PrismaInstance, params: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
  const clientId = params.clientId as string
  if (!clientId) return { success: false, toolName: 'get_portfolio_summary', message: 'ID client requis' }

  const [client, actifs, passifs] = await Promise.all([
    prisma.client.findFirst({
      where: { id: clientId, cabinetId: context.cabinetId },
      select: { firstName: true, lastName: true, totalActifs: true, totalPassifs: true, patrimoineNet: true },
    }),
    prisma.actif.findMany({
      where: { cabinetId: context.cabinetId, clients: { some: { clientId } } },
      select: { id: true, name: true, type: true, category: true, value: true },
    }),
    prisma.passif.findMany({
      where: { cabinetId: context.cabinetId, clientId },
      select: { id: true, name: true, type: true, remainingAmount: true, monthlyPayment: true },
    }),
  ])

  if (!client) return { success: false, toolName: 'get_portfolio_summary', message: 'Client non trouvé' }

  return {
    success: true,
    toolName: 'get_portfolio_summary',
    data: {
      client: `${client.firstName} ${client.lastName}`,
      totalActifs: client.totalActifs ? Number(client.totalActifs) : 0,
      totalPassifs: client.totalPassifs ? Number(client.totalPassifs) : 0,
      patrimoineNet: client.patrimoineNet ? Number(client.patrimoineNet) : 0,
      actifs: actifs.map((a: Record<string, unknown>) => ({
        nom: a.name,
        type: a.type,
        categorie: a.category,
        valeur: a.value ? Number(a.value) : 0,
      })),
      passifs: passifs.map((p: Record<string, unknown>) => ({
        nom: p.name,
        type: p.type,
        capitalRestant: p.remainingAmount ? Number(p.remainingAmount) : 0,
        mensualite: p.monthlyPayment ? Number(p.monthlyPayment) : 0,
      })),
    },
    message: `Patrimoine de ${client.firstName} ${client.lastName}`,
  }
}

async function execGetUpcomingTasks(prisma: PrismaInstance, params: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
  const status = params.status as string | undefined
  const clientId = params.clientId as string | undefined
  const limit = Math.min((params.limit as number) || 10, 20)

  const where: Record<string, unknown> = {
    cabinetId: context.cabinetId,
    assignedToId: context.userId,
  }
  if (status) where.status = status
  else where.status = { in: ['A_FAIRE', 'EN_COURS'] }
  if (clientId) where.clientId = clientId

  const tasks = await prisma.tache.findMany({
    where,
    include: {
      client: { select: { firstName: true, lastName: true } },
    },
    orderBy: [{ dueDate: 'asc' }, { priority: 'desc' }],
    take: limit,
  })

  const now = new Date()
  const formatted = tasks.map((t: Record<string, unknown> & { client?: { firstName: string; lastName: string } | null }) => {
    const dueDate = t.dueDate as Date | null
    const isOverdue = dueDate && dueDate < now
    return {
      id: t.id,
      titre: t.title,
      type: t.type,
      priorite: t.priority,
      statut: t.status,
      echeance: dueDate,
      enRetard: isOverdue,
      client: t.client ? `${t.client.firstName} ${t.client.lastName}` : null,
    }
  })

  const overdue = formatted.filter(t => t.enRetard).length
  return {
    success: true,
    toolName: 'get_upcoming_tasks',
    data: formatted,
    message: `${formatted.length} tâche(s)${overdue > 0 ? ` dont ${overdue} en retard` : ''}`,
  }
}

async function execGetUpcomingAppointments(prisma: PrismaInstance, params: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
  const days = (params.days as number) || 7
  const clientId = params.clientId as string | undefined

  const startDate = new Date()
  const endDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000)

  const where: Record<string, unknown> = {
    cabinetId: context.cabinetId,
    conseillerId: context.userId,
    startDate: { gte: startDate, lte: endDate },
    status: { in: ['PLANIFIE', 'CONFIRME'] },
  }
  if (clientId) where.clientId = clientId

  const rdvs = await prisma.rendezVous.findMany({
    where,
    include: {
      client: { select: { firstName: true, lastName: true } },
    },
    orderBy: { startDate: 'asc' },
    take: 20,
  })

  const formatted = rdvs.map((r: Record<string, unknown> & { client?: { firstName: string; lastName: string } | null }) => ({
    id: r.id,
    titre: r.title,
    type: r.type,
    debut: r.startDate,
    fin: r.endDate,
    statut: r.status,
    visio: r.isVirtual,
    client: r.client ? `${r.client.firstName} ${r.client.lastName}` : null,
  }))

  return {
    success: true,
    toolName: 'get_upcoming_appointments',
    data: formatted,
    message: `${formatted.length} rendez-vous dans les ${days} prochains jours`,
  }
}

async function execGetKycAlerts(prisma: PrismaInstance, params: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
  const daysUntilExpiry = (params.daysUntilExpiry as number) || 30
  const expiryDate = new Date(Date.now() + daysUntilExpiry * 24 * 60 * 60 * 1000)

  const clients = await prisma.client.findMany({
    where: {
      cabinetId: context.cabinetId,
      conseillerId: context.userId,
      status: 'ACTIF',
      OR: [
        { kycStatus: { in: ['EN_ATTENTE', 'EXPIRE'] } },
        { kycNextReviewDate: { lte: expiryDate } },
      ],
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      kycStatus: true,
      kycNextReviewDate: true,
      kycCompletedAt: true,
    },
    orderBy: { kycNextReviewDate: 'asc' },
    take: 20,
  })

  const formatted = clients.map((c: Record<string, unknown>) => ({
    id: c.id,
    nom: `${c.firstName} ${c.lastName}`,
    statutKYC: c.kycStatus,
    dateExpiration: c.kycNextReviewDate,
    derniereMiseAJour: c.kycCompletedAt,
  }))

  return {
    success: true,
    toolName: 'get_kyc_alerts',
    data: formatted,
    message: `${formatted.length} alerte(s) KYC (expiration < ${daysUntilExpiry} jours)`,
  }
}

async function execSearchContracts(prisma: PrismaInstance, params: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
  const clientId = params.clientId as string | undefined
  const type = params.type as string | undefined
  const status = params.status as string | undefined

  const where: Record<string, unknown> = { cabinetId: context.cabinetId }
  if (clientId) where.clientId = clientId
  if (type) where.type = type
  if (status) where.status = status

  const contrats = await prisma.contrat.findMany({
    where,
    include: {
      client: { select: { firstName: true, lastName: true } },
    },
    orderBy: { startDate: 'desc' },
    take: 15,
  })

  const formatted = contrats.map((c: Record<string, unknown> & { client?: { firstName: string; lastName: string } | null }) => ({
    id: c.id,
    type: c.type,
    compagnie: c.provider,
    numero: c.contractNumber,
    valeur: c.value ? Number(c.value) : null,
    statut: c.status,
    client: c.client ? `${c.client.firstName} ${c.client.lastName}` : null,
    dateEffet: c.startDate,
    dateEcheance: c.endDate,
  }))

  return {
    success: true,
    toolName: 'search_contracts',
    data: formatted,
    message: `${formatted.length} contrat(s) trouvé(s)`,
  }
}

async function execGetDashboardStats(prisma: PrismaInstance, _params: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)

  const [clientCount, activeClients, overdueTasksCount, todayRdvCount, kycAlertCount] = await Promise.all([
    prisma.client.count({ where: { cabinetId: context.cabinetId } }),
    prisma.client.count({ where: { cabinetId: context.cabinetId, status: 'ACTIF' } }),
    prisma.tache.count({
      where: {
        cabinetId: context.cabinetId,
        assignedToId: context.userId,
        status: { in: ['A_FAIRE', 'EN_COURS'] },
        dueDate: { lt: now },
      },
    }),
    prisma.rendezVous.count({
      where: {
        cabinetId: context.cabinetId,
        conseillerId: context.userId,
        startDate: { gte: todayStart, lt: todayEnd },
        status: { in: ['PLANIFIE', 'CONFIRME'] },
      },
    }),
    prisma.client.count({
      where: {
        cabinetId: context.cabinetId,
        conseillerId: context.userId,
        status: 'ACTIF',
        OR: [
          { kycStatus: { in: ['EN_ATTENTE', 'EXPIRE'] } },
          { kycNextReviewDate: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } },
        ],
      },
    }),
  ])

  return {
    success: true,
    toolName: 'get_dashboard_stats',
    data: {
      totalClients: clientCount,
      clientsActifs: activeClients,
      tachesEnRetard: overdueTasksCount,
      rdvAujourdhui: todayRdvCount,
      alertesKYC: kycAlertCount,
    },
    message: `Dashboard : ${activeClients} clients actifs, ${overdueTasksCount} tâches en retard, ${todayRdvCount} RDV aujourd'hui`,
  }
}

// ── ÉCRITURE ──

async function execCreateTask(prisma: PrismaInstance, params: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
  let clientId = params.clientId as string | undefined
  const clientName = params.clientName as string | undefined

  // Résoudre le client par nom si nécessaire
  if (!clientId && clientName) {
    const found = await prisma.client.findFirst({
      where: {
        cabinetId: context.cabinetId,
        OR: [
          { lastName: { contains: clientName, mode: 'insensitive' } },
          { firstName: { contains: clientName, mode: 'insensitive' } },
        ],
      },
      select: { id: true, firstName: true, lastName: true },
    })
    if (found) clientId = found.id
  }

  const task = await prisma.tache.create({
    data: {
      cabinetId: context.cabinetId,
      assignedToId: context.userId,
      createdById: context.userId,
      clientId: clientId || null,
      title: params.title as string,
      description: (params.description as string) || null,
      type: ((params.type as string) || 'AUTRE') as import('@prisma/client').TacheType,
      priority: ((params.priority as string) || 'MOYENNE') as import('@prisma/client').TachePriority,
      status: 'A_FAIRE',
      dueDate: params.dueDate ? new Date(params.dueDate as string) : null,
    },
  })

  return {
    success: true,
    toolName: 'create_task',
    data: { id: task.id, title: task.title },
    message: `Tâche créée : "${task.title}"`,
    actionTaken: `Tâche "${task.title}" créée avec succès`,
  }
}

async function execCreateAppointment(prisma: PrismaInstance, params: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
  let clientId = params.clientId as string | undefined
  const clientName = params.clientName as string | undefined

  if (!clientId && clientName) {
    const found = await prisma.client.findFirst({
      where: {
        cabinetId: context.cabinetId,
        OR: [
          { lastName: { contains: clientName, mode: 'insensitive' } },
          { firstName: { contains: clientName, mode: 'insensitive' } },
        ],
      },
      select: { id: true },
    })
    if (found) clientId = found.id
  }

  const startDate = new Date(params.startDate as string)
  const endDate = params.endDate ? new Date(params.endDate as string) : new Date(startDate.getTime() + 60 * 60 * 1000)

  const rdv = await prisma.rendezVous.create({
    data: {
      cabinetId: context.cabinetId,
      conseillerId: context.userId,
      clientId: clientId || null,
      title: params.title as string,
      description: (params.description as string) || null,
      type: ((params.type as string) || 'AUTRE') as import('@prisma/client').RendezVousType,
      startDate,
      endDate,
      isVirtual: (params.isVirtual as boolean) || false,
      status: 'PLANIFIE',
    },
  })

  return {
    success: true,
    toolName: 'create_appointment',
    data: { id: rdv.id, title: rdv.title, startDate: rdv.startDate },
    message: `Rendez-vous planifié : "${rdv.title}" le ${startDate.toLocaleDateString('fr-FR')} à ${startDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
    actionTaken: `RDV "${rdv.title}" planifié`,
  }
}

async function execCreateNotification(prisma: PrismaInstance, params: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
  const notif = await prisma.notification.create({
    data: {
      cabinetId: context.cabinetId,
      userId: context.userId,
      clientId: (params.clientId as string) || null,
      type: ((params.type as string) || 'AUTRE') as import('@prisma/client').NotificationType,
      title: params.title as string,
      message: params.message as string,
    },
  })

  return {
    success: true,
    toolName: 'create_notification',
    data: { id: notif.id },
    message: `Notification créée : "${notif.title}"`,
    actionTaken: `Notification "${notif.title}" créée`,
  }
}

// ── NAVIGATION ──

const PAGE_ROUTES: Record<string, string> = {
  dashboard: '/dashboard',
  clients: '/dashboard/clients',
  taches: '/dashboard/taches',
  'rendez-vous': '/dashboard/rendez-vous',
  contrats: '/dashboard/contrats',
  patrimoine: '/dashboard/patrimoine',
  documents: '/dashboard/documents',
  conformite: '/dashboard/conformite',
  parametres: '/dashboard/settings',
  pilotage: '/dashboard/pilotage',
}

async function execNavigateToClient(prisma: PrismaInstance, params: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
  let clientId = params.clientId as string | undefined
  const clientName = params.clientName as string | undefined
  const tab = params.tab as string | undefined

  // Résoudre le client par nom si nécessaire
  if (!clientId && clientName) {
    const found = await prisma.client.findFirst({
      where: {
        cabinetId: context.cabinetId,
        OR: [
          { lastName: { contains: clientName, mode: 'insensitive' } },
          { firstName: { contains: clientName, mode: 'insensitive' } },
        ],
      },
      select: { id: true, firstName: true, lastName: true },
    })
    if (!found) return { success: false, toolName: 'navigate_to_client', message: `Client "${clientName}" non trouvé` }
    clientId = found.id
  }

  if (!clientId) return { success: false, toolName: 'navigate_to_client', message: 'ID ou nom du client requis' }

  // Vérifier que le client existe
  const client = await prisma.client.findFirst({
    where: { id: clientId, cabinetId: context.cabinetId },
    select: { id: true, firstName: true, lastName: true },
  })
  if (!client) return { success: false, toolName: 'navigate_to_client', message: 'Client non trouvé' }

  const url = `/dashboard/clients/${client.id}${tab ? `?tab=${tab}` : ''}`
  return {
    success: true,
    toolName: 'navigate_to_client',
    data: { clientId: client.id, clientName: `${client.firstName} ${client.lastName}`, tab },
    message: `Ouverture de la fiche de ${client.firstName} ${client.lastName}`,
    navigationUrl: url,
  }
}

function execNavigateToPage(params: Record<string, unknown>): ToolResult {
  const page = params.page as string
  const url = PAGE_ROUTES[page]

  if (!url) {
    return { success: false, toolName: 'navigate_to_page', message: `Page inconnue : "${page}"` }
  }

  return {
    success: true,
    toolName: 'navigate_to_page',
    data: { page, url },
    message: `Navigation vers ${page}`,
    navigationUrl: url,
  }
}

// ── MÉMOIRE ──

async function execSaveInstruction(params: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
  const memoryService = new AgentMemoryService(context.cabinetId, context.userId)
  const instruction = params.instruction as string

  // Vérifier doublon
  const existing = await memoryService.findSimilarInstruction(instruction)
  if (existing) {
    await memoryService.update(existing.id, { content: instruction })
    return {
      success: true,
      toolName: 'save_instruction',
      data: { id: existing.id, updated: true },
      message: `Instruction mise à jour : "${instruction}"`,
      actionTaken: `Instruction mémorisée (mise à jour)`,
    }
  }

  const memory = await memoryService.create({
    type: 'INSTRUCTION',
    title: instruction.slice(0, 100),
    content: instruction,
    priority: (params.priority as number) || 0,
    clientId: params.clientId as string | undefined,
    tags: ['instruction', 'user-defined'],
    sourceQuery: instruction,
  })

  // Appliquer les limites de mémoire (fire & forget)
  memoryService.enforceMemoryLimits().catch(() => {})

  return {
    success: true,
    toolName: 'save_instruction',
    data: { id: memory.id },
    message: `Instruction mémorisée : "${instruction}"`,
    actionTaken: `Je mémoriserai cette instruction pour toutes nos futures conversations`,
  }
}

async function execSaveFact(params: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
  const memoryService = new AgentMemoryService(context.cabinetId, context.userId)
  const tags = params.tags ? (params.tags as string).split(',').map(t => t.trim()) : []

  const memory = await memoryService.create({
    type: params.clientId ? 'CLIENT_CONTEXT' : 'FACT',
    title: params.title as string,
    content: params.content as string,
    clientId: params.clientId as string | undefined,
    tags: ['fact', ...tags],
  })

  // Appliquer les limites de mémoire (fire & forget)
  memoryService.enforceMemoryLimits().catch(() => {})

  return {
    success: true,
    toolName: 'save_fact',
    data: { id: memory.id },
    message: `Fait mémorisé : "${params.title}"`,
    actionTaken: `Information enregistrée en mémoire`,
  }
}

async function execListInstructions(context: ToolContext): Promise<ToolResult> {
  const memoryService = new AgentMemoryService(context.cabinetId, context.userId)
  const instructions = await memoryService.getActiveInstructions()

  return {
    success: true,
    toolName: 'list_instructions',
    data: instructions.map(i => ({
      id: i.id,
      instruction: i.content,
      priorite: i.priority,
      créé: i.createdAt,
      client: i.clientId,
    })),
    message: `${instructions.length} instruction(s) mémorisée(s)`,
  }
}

async function execDeleteInstruction(params: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
  const memoryService = new AgentMemoryService(context.cabinetId, context.userId)
  const id = params.instructionId as string

  await memoryService.deactivate(id)

  return {
    success: true,
    toolName: 'delete_instruction',
    data: { id },
    message: `Instruction supprimée`,
    actionTaken: `Instruction supprimée de ma mémoire`,
  }
}

// ============================================================================
// UTILITAIRES
// ============================================================================

/**
 * Génère la description textuelle des outils pour injection dans le system prompt
 */
export function getToolDescriptionsForPrompt(): string {
  const lines: string[] = []

  // Grouper par catégorie
  const categories: Record<string, ToolDefinition[]> = {}
  for (const tool of TOOL_DEFINITIONS) {
    const cat = tool.category || 'other'
    if (!categories[cat]) categories[cat] = []
    categories[cat].push(tool)
  }

  const catLabels: Record<string, string> = {
    read: '📖 LECTURE (exécution automatique)',
    write: '✏️ ÉCRITURE (confirmation requise)',
    navigation: '🧭 NAVIGATION (exécution automatique)',
    memory: '🧠 MÉMOIRE (exécution automatique)',
    other: '🔧 AUTRES',
  }

  for (const [cat, tools] of Object.entries(categories)) {
    lines.push(`\n${catLabels[cat] || cat}`)
    for (const tool of tools) {
      const params = tool.parameters.filter(p => p.required || tool.parameters.length <= 3)
      const paramStr = params.map(p => `${p.name}="..."`).join(', ')
      const example = paramStr ? `[ACTION: ${tool.name}(${paramStr})]` : `[ACTION: ${tool.name}()]`
      lines.push(`  • ${tool.name} — ${tool.description}`)
      lines.push(`    Syntaxe : ${example}`)
      if (tool.parameters.length > 0) {
        for (const p of tool.parameters) {
          const req = p.required ? '(requis)' : '(opt.)'
          const values = p.enum ? ` → ${p.enum.join(' | ')}` : ''
          lines.push(`    - ${p.name} ${req}: ${p.description}${values}`)
        }
      }
    }
  }

  lines.push('\nEXEMPLES D\'UTILISATION AUTONOME :')
  lines.push('• Pour chercher un client : [ACTION: search_clients(query="Dupont")]')
  lines.push('• Pour le plus gros client : [ACTION: search_clients(orderBy="patrimoine_desc", limit="1")]')
  lines.push('• Pour naviguer : [ACTION: navigate_to_page(page="taches")]')
  lines.push('• Pour analyser un patrimoine : [ACTION: get_portfolio_summary(clientId="xxx")]')
  lines.push('• Tu peux chaîner : chercher un client PUIS consulter son patrimoine PUIS proposer des optimisations')

  return lines.join('\n')
}
