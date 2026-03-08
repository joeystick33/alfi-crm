/**
 * AURA V2 — Tool Access Layer
 * 
 * Couche d'accès aux outils avec :
 * - Vérification des permissions par cabinet/rôle/utilisateur
 * - Validation des paramètres d'entrée (JSON Schema)
 * - Masquage des données sensibles dans les logs
 * - Rate limiting par outil
 * - Audit trail complet (RGPD Art. 30)
 * - Timeout et retry
 * - Idempotence pour les opérations d'écriture
 * 
 * Principe : Tout appel d'outil passe par cette couche.
 * Aucun outil n'est exécuté sans vérification préalable.
 */

import type {
  ToolDefinitionV2,
  ToolParameterV2,
  ToolCallInput,
  ToolCallResult,
  ToolCategory,
  ToolPermissionSpec,
  AgentContext,
} from './types'
import { maskParams } from './encryption'
import { getPrismaClient } from '../../prisma'

// ============================================================================
// TOOL REGISTRY — Définitions de tous les outils disponibles
// ============================================================================

/**
 * Registre centralisé de tous les outils AURA V2.
 * Chaque outil est défini avec ses métadonnées, paramètres, permissions et comportement.
 */
export const TOOL_REGISTRY: ToolDefinitionV2[] = [
  // ── LECTURE (read) ──
  {
    name: 'search_clients',
    description: 'Recherche des clients par nom, prénom, email, téléphone ou statut. Retourne une liste paginée.',
    category: 'read',
    parameters: [
      { name: 'query', type: 'string', description: 'Terme de recherche', required: true },
      { name: 'status', type: 'string', description: 'Filtrer par statut', required: false, enum: ['PROSPECT', 'ACTIF', 'INACTIF', 'ARCHIVE'] },
      { name: 'limit', type: 'number', description: 'Nombre max de résultats', required: false, default: 10, validation: { min: 1, max: 50 } },
    ],
    requiresConfirmation: false,
    idempotent: true,
    sensitiveFields: [],
    permissions: { minRole: 'ASSISTANT', scopes: ['clients:read'], requiresClientAccess: false, onlyOwnClients: false },
    timeout: 10_000,
    retryable: true,
    maxRetries: 2,
  },
  {
    name: 'get_client_details',
    description: 'Récupère les détails complets d\'un client : identité, patrimoine, contrats, fiscalité, KYC.',
    category: 'read',
    parameters: [
      { name: 'clientId', type: 'string', description: 'ID du client', required: true },
      { name: 'sections', type: 'array', description: 'Sections à inclure', required: false },
    ],
    requiresConfirmation: false,
    idempotent: true,
    sensitiveFields: ['clientId'],
    permissions: { minRole: 'ASSISTANT', scopes: ['clients:read'], requiresClientAccess: true, onlyOwnClients: true },
    timeout: 15_000,
    retryable: true,
    maxRetries: 2,
  },
  {
    name: 'get_client_patrimoine',
    description: 'Récupère le patrimoine détaillé d\'un client : actifs, passifs, patrimoine net, contrats.',
    category: 'read',
    parameters: [
      { name: 'clientId', type: 'string', description: 'ID du client', required: true },
    ],
    requiresConfirmation: false,
    idempotent: true,
    sensitiveFields: ['clientId'],
    permissions: { minRole: 'ADVISOR', scopes: ['clients:read', 'patrimoine:read'], requiresClientAccess: true, onlyOwnClients: true },
    timeout: 15_000,
    retryable: true,
    maxRetries: 2,
  },
  {
    name: 'get_client_contrats',
    description: 'Liste les contrats d\'un client avec détails : type, fournisseur, montant, date.',
    category: 'read',
    parameters: [
      { name: 'clientId', type: 'string', description: 'ID du client', required: true },
      { name: 'type', type: 'string', description: 'Filtrer par type de contrat', required: false },
    ],
    requiresConfirmation: false,
    idempotent: true,
    sensitiveFields: ['clientId'],
    permissions: { minRole: 'ASSISTANT', scopes: ['contrats:read'], requiresClientAccess: true, onlyOwnClients: true },
    timeout: 10_000,
    retryable: true,
    maxRetries: 2,
  },
  {
    name: 'get_tasks',
    description: 'Liste les tâches du conseiller, filtrées par statut, priorité ou client.',
    category: 'read',
    parameters: [
      { name: 'status', type: 'string', description: 'Filtrer par statut', required: false, enum: ['EN_ATTENTE', 'EN_COURS', 'TERMINEE', 'ANNULEE'] },
      { name: 'clientId', type: 'string', description: 'Filtrer par client', required: false },
      { name: 'priority', type: 'string', description: 'Filtrer par priorité', required: false, enum: ['BASSE', 'NORMALE', 'HAUTE', 'URGENTE'] },
      { name: 'limit', type: 'number', description: 'Nombre max', required: false, default: 20, validation: { min: 1, max: 100 } },
    ],
    requiresConfirmation: false,
    idempotent: true,
    sensitiveFields: [],
    permissions: { minRole: 'ASSISTANT', scopes: ['tasks:read'], requiresClientAccess: false, onlyOwnClients: false },
    timeout: 10_000,
    retryable: true,
    maxRetries: 2,
  },
  {
    name: 'get_appointments',
    description: 'Liste les rendez-vous du conseiller, filtrés par date ou client.',
    category: 'read',
    parameters: [
      { name: 'startDate', type: 'string', description: 'Date de début (ISO 8601)', required: false },
      { name: 'endDate', type: 'string', description: 'Date de fin (ISO 8601)', required: false },
      { name: 'clientId', type: 'string', description: 'Filtrer par client', required: false },
      { name: 'limit', type: 'number', description: 'Nombre max', required: false, default: 20 },
    ],
    requiresConfirmation: false,
    idempotent: true,
    sensitiveFields: [],
    permissions: { minRole: 'ASSISTANT', scopes: ['appointments:read'], requiresClientAccess: false, onlyOwnClients: false },
    timeout: 10_000,
    retryable: true,
    maxRetries: 2,
  },
  {
    name: 'get_opportunities',
    description: 'Liste les opportunités commerciales, filtrées par statut ou client.',
    category: 'read',
    parameters: [
      { name: 'status', type: 'string', description: 'Filtrer par statut', required: false },
      { name: 'clientId', type: 'string', description: 'Filtrer par client', required: false },
      { name: 'limit', type: 'number', description: 'Nombre max', required: false, default: 20 },
    ],
    requiresConfirmation: false,
    idempotent: true,
    sensitiveFields: [],
    permissions: { minRole: 'ADVISOR', scopes: ['opportunities:read'], requiresClientAccess: false, onlyOwnClients: true },
    timeout: 10_000,
    retryable: true,
    maxRetries: 2,
  },
  {
    name: 'get_dashboard_stats',
    description: 'Récupère les statistiques du tableau de bord : clients actifs, CA, tâches en retard, prochains RDV.',
    category: 'read',
    parameters: [],
    requiresConfirmation: false,
    idempotent: true,
    sensitiveFields: [],
    permissions: { minRole: 'ADVISOR', scopes: ['dashboard:read'], requiresClientAccess: false, onlyOwnClients: false },
    timeout: 15_000,
    retryable: true,
    maxRetries: 2,
  },

  // ── ÉCRITURE (write) ──
  {
    name: 'create_task',
    description: 'Crée une nouvelle tâche pour le conseiller ou un client spécifique.',
    category: 'write',
    parameters: [
      { name: 'title', type: 'string', description: 'Titre de la tâche', required: true, validation: { maxLength: 200 } },
      { name: 'description', type: 'string', description: 'Description détaillée', required: false, validation: { maxLength: 2000 } },
      { name: 'clientId', type: 'string', description: 'ID du client associé', required: false },
      { name: 'priority', type: 'string', description: 'Priorité', required: false, enum: ['BASSE', 'NORMALE', 'HAUTE', 'URGENTE'], default: 'NORMALE' },
      { name: 'dueDate', type: 'string', description: 'Date d\'échéance (ISO 8601)', required: false },
      { name: 'category', type: 'string', description: 'Catégorie', required: false },
    ],
    requiresConfirmation: true,
    idempotent: false,
    sensitiveFields: [],
    permissions: { minRole: 'ASSISTANT', scopes: ['tasks:write'], requiresClientAccess: false, onlyOwnClients: false },
    timeout: 10_000,
    retryable: false,
    maxRetries: 0,
  },
  {
    name: 'update_client',
    description: 'Met à jour les informations d\'un client existant.',
    category: 'write',
    parameters: [
      { name: 'clientId', type: 'string', description: 'ID du client', required: true },
      { name: 'updates', type: 'object', description: 'Champs à mettre à jour', required: true },
    ],
    requiresConfirmation: true,
    idempotent: true,
    sensitiveFields: ['clientId'],
    permissions: { minRole: 'ADVISOR', scopes: ['clients:write'], requiresClientAccess: true, onlyOwnClients: true },
    timeout: 10_000,
    retryable: false,
    maxRetries: 0,
  },
  {
    name: 'create_appointment',
    description: 'Crée un nouveau rendez-vous.',
    category: 'write',
    parameters: [
      { name: 'clientId', type: 'string', description: 'ID du client', required: true },
      { name: 'title', type: 'string', description: 'Titre du RDV', required: true },
      { name: 'date', type: 'string', description: 'Date et heure (ISO 8601)', required: true },
      { name: 'duration', type: 'number', description: 'Durée en minutes', required: false, default: 60, validation: { min: 15, max: 480 } },
      { name: 'type', type: 'string', description: 'Type de RDV', required: false },
      { name: 'notes', type: 'string', description: 'Notes préparatoires', required: false },
    ],
    requiresConfirmation: true,
    idempotent: false,
    sensitiveFields: ['clientId'],
    permissions: { minRole: 'ADVISOR', scopes: ['appointments:write'], requiresClientAccess: true, onlyOwnClients: true },
    timeout: 10_000,
    retryable: false,
    maxRetries: 0,
  },
  {
    name: 'create_opportunity',
    description: 'Crée une nouvelle opportunité commerciale.',
    category: 'write',
    parameters: [
      { name: 'clientId', type: 'string', description: 'ID du client', required: true },
      { name: 'title', type: 'string', description: 'Titre de l\'opportunité', required: true },
      { name: 'type', type: 'string', description: 'Type d\'opportunité', required: true },
      { name: 'estimatedAmount', type: 'number', description: 'Montant estimé (€)', required: false },
      { name: 'notes', type: 'string', description: 'Notes', required: false },
    ],
    requiresConfirmation: true,
    idempotent: false,
    sensitiveFields: ['clientId'],
    permissions: { minRole: 'ADVISOR', scopes: ['opportunities:write'], requiresClientAccess: true, onlyOwnClients: true },
    timeout: 10_000,
    retryable: false,
    maxRetries: 0,
  },

  // ── NAVIGATION ──
  {
    name: 'navigate_to',
    description: 'Navigue vers une page spécifique du CRM (client, tâche, simulateur, etc.).',
    category: 'navigate',
    parameters: [
      { name: 'page', type: 'string', description: 'Type de page', required: true, enum: ['client', 'task', 'appointment', 'simulator', 'dashboard', 'settings'] },
      { name: 'entityId', type: 'string', description: 'ID de l\'entité', required: false },
      { name: 'tab', type: 'string', description: 'Onglet spécifique', required: false },
    ],
    requiresConfirmation: false,
    idempotent: true,
    sensitiveFields: [],
    permissions: { minRole: 'ASSISTANT', scopes: [], requiresClientAccess: false, onlyOwnClients: false },
    timeout: 5_000,
    retryable: false,
    maxRetries: 0,
  },

  // ── MÉMOIRE ──
  {
    name: 'save_instruction',
    description: 'Sauvegarde une instruction permanente de l\'utilisateur dans la mémoire de l\'agent.',
    category: 'memory',
    parameters: [
      { name: 'instruction', type: 'string', description: 'Contenu de l\'instruction', required: true, validation: { maxLength: 1000 } },
      { name: 'priority', type: 'number', description: 'Priorité (0=normal, 1=important, 2=critique)', required: false, default: 0, validation: { min: 0, max: 2 } },
    ],
    requiresConfirmation: true,
    idempotent: true,
    sensitiveFields: [],
    permissions: { minRole: 'ADVISOR', scopes: ['memory:write'], requiresClientAccess: false, onlyOwnClients: false },
    timeout: 5_000,
    retryable: true,
    maxRetries: 2,
  },
  {
    name: 'save_fact',
    description: 'Sauvegarde un fait appris sur un client ou le cabinet dans la mémoire de l\'agent.',
    category: 'memory',
    parameters: [
      { name: 'title', type: 'string', description: 'Titre court du fait', required: true, validation: { maxLength: 200 } },
      { name: 'content', type: 'string', description: 'Description détaillée', required: true, validation: { maxLength: 2000 } },
      { name: 'clientId', type: 'string', description: 'ID du client concerné', required: false },
      { name: 'tags', type: 'array', description: 'Tags pour indexation', required: false },
    ],
    requiresConfirmation: false,
    idempotent: true,
    sensitiveFields: ['clientId'],
    permissions: { minRole: 'ADVISOR', scopes: ['memory:write'], requiresClientAccess: false, onlyOwnClients: false },
    timeout: 5_000,
    retryable: true,
    maxRetries: 2,
  },
  {
    name: 'search_memory',
    description: 'Recherche dans la mémoire de l\'agent par mots-clés.',
    category: 'memory',
    parameters: [
      { name: 'query', type: 'string', description: 'Terme de recherche', required: true },
      { name: 'limit', type: 'number', description: 'Nombre max de résultats', required: false, default: 5 },
    ],
    requiresConfirmation: false,
    idempotent: true,
    sensitiveFields: [],
    permissions: { minRole: 'ADVISOR', scopes: ['memory:read'], requiresClientAccess: false, onlyOwnClients: false },
    timeout: 5_000,
    retryable: true,
    maxRetries: 2,
  },

  // ── SIMULATION ──
  {
    name: 'run_simulation',
    description: 'Lance une simulation fiscale/patrimoniale via les simulateurs backend. Le backend calcule, l\'agent n\'invente JAMAIS les résultats.',
    category: 'simulate',
    parameters: [
      { name: 'simulator', type: 'string', description: 'Type de simulateur', required: true, enum: ['ir', 'per', 'assurance-vie', 'succession', 'ifi', 'prevoyance-tns', 'immobilier'] },
      { name: 'inputs', type: 'object', description: 'Paramètres de simulation', required: true },
      { name: 'clientId', type: 'string', description: 'Client pour pré-remplissage', required: false },
    ],
    requiresConfirmation: true,
    idempotent: true,
    sensitiveFields: ['clientId'],
    permissions: { minRole: 'ADVISOR', scopes: ['simulations:execute'], requiresClientAccess: false, onlyOwnClients: false },
    timeout: 30_000,
    retryable: true,
    maxRetries: 1,
  },

  // ── ANALYSE ──
  {
    name: 'analyze_patrimoine',
    description: 'Déclenche une analyse patrimoniale complète d\'un client via le backend. Les calculs sont effectués côté serveur.',
    category: 'analyze',
    parameters: [
      { name: 'clientId', type: 'string', description: 'ID du client', required: true },
      { name: 'focus', type: 'string', description: 'Focus d\'analyse', required: false, enum: ['global', 'fiscal', 'retraite', 'succession', 'protection', 'immobilier'] },
    ],
    requiresConfirmation: false,
    idempotent: true,
    sensitiveFields: ['clientId'],
    permissions: { minRole: 'ADVISOR', scopes: ['analysis:execute'], requiresClientAccess: true, onlyOwnClients: true },
    timeout: 30_000,
    retryable: true,
    maxRetries: 1,
  },

  // ── DONNÉES IMMOBILIÈRES (DVF) ──
  {
    name: 'dvf_price_lookup',
    description: 'Recherche les prix immobiliers réels (transactions DVF) pour une commune ou un code postal. Retourne le prix médian au m², les statistiques et les dernières transactions. Données DGFiP depuis 2014, hors Alsace/Moselle/Mayotte.',
    category: 'read',
    parameters: [
      { name: 'codePostal', type: 'string', description: 'Code postal (ex: 75008, 69001)', required: false },
      { name: 'codeCommune', type: 'string', description: 'Code INSEE de la commune (ex: 75108)', required: false },
      { name: 'typeLocal', type: 'string', description: 'Type de bien', required: false, enum: ['Maison', 'Appartement'] },
      { name: 'lat', type: 'number', description: 'Latitude GPS (pour recherche par proximité)', required: false },
      { name: 'lon', type: 'number', description: 'Longitude GPS (pour recherche par proximité)', required: false },
    ],
    requiresConfirmation: false,
    idempotent: true,
    sensitiveFields: [],
    permissions: { minRole: 'ADVISOR', scopes: [], requiresClientAccess: false, onlyOwnClients: false },
    timeout: 15_000,
    retryable: true,
    maxRetries: 2,
  },

  // ── DONNÉES DE MARCHÉ ──
  {
    name: 'market_data',
    description: 'Récupère des données financières temps réel : cotations (actions, indices, ETF), aperçu des marchés (CAC 40, S&P 500, etc.), taux d\'intérêt clés (BCE, Livret A, Euribor), recherche de symboles. Utilise cet outil quand l\'utilisateur demande des informations sur les marchés financiers, les taux ou les cours de bourse.',
    category: 'read',
    parameters: [
      { name: 'action', type: 'string', description: 'Type de requête', required: true, enum: ['quotes', 'overview', 'rates', 'search'] },
      { name: 'symbols', type: 'array', description: 'Symboles financiers (ex: [\"^FCHI\", \"MC.PA\", \"AAPL\"]). Requis pour action=quotes.', required: false },
      { name: 'query', type: 'string', description: 'Terme de recherche (ex: \"LVMH\", \"CAC 40\"). Requis pour action=search.', required: false },
    ],
    requiresConfirmation: false,
    idempotent: true,
    sensitiveFields: [],
    permissions: { minRole: 'ADVISOR', scopes: [], requiresClientAccess: false, onlyOwnClients: false },
    timeout: 15_000,
    retryable: true,
    maxRetries: 2,
  },

  // ── RECHERCHE WEB ──
  {
    name: 'web_search',
    description: 'Recherche sur le web pour obtenir des informations actualisées : réglementation, fiscalité, taux, marchés financiers, actualités juridiques, produits financiers. Utilise cet outil quand la question porte sur des données récentes ou extérieures au CRM.',
    category: 'read',
    parameters: [
      { name: 'query', type: 'string', description: 'Requête de recherche (en français de préférence)', required: true, validation: { maxLength: 500 } },
      { name: 'domain', type: 'string', description: 'Domaine préféré pour la recherche (ex: legifrance.gouv.fr, bofip.impots.gouv.fr)', required: false },
      { name: 'limit', type: 'number', description: 'Nombre max de résultats', required: false, default: 5, validation: { min: 1, max: 10 } },
    ],
    requiresConfirmation: false,
    idempotent: true,
    sensitiveFields: [],
    permissions: { minRole: 'ADVISOR', scopes: [], requiresClientAccess: false, onlyOwnClients: false },
    timeout: 15_000,
    retryable: true,
    maxRetries: 2,
  },

  // ── EXPORT ──
  {
    name: 'generate_document_draft',
    description: 'Génère un brouillon de document (rapport, lettre de mission, bilan). Le document est un BROUILLON — jamais officiel sans validation humaine.',
    category: 'export',
    parameters: [
      { name: 'type', type: 'string', description: 'Type de document', required: true, enum: ['rapport_conseil', 'lettre_mission', 'bilan_patrimonial', 'fiche_client', 'diagnostic_successoral'] },
      { name: 'clientId', type: 'string', description: 'ID du client', required: true },
      { name: 'options', type: 'object', description: 'Options de génération', required: false },
    ],
    requiresConfirmation: true,
    idempotent: true,
    sensitiveFields: ['clientId'],
    permissions: { minRole: 'ADVISOR', scopes: ['documents:write'], requiresClientAccess: true, onlyOwnClients: true },
    timeout: 60_000,
    retryable: false,
    maxRetries: 0,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // OUTILS MIGRÉS DEPUIS CLOUDBOT V1 (extended + base + MCP)
  // ══════════════════════════════════════════════════════════════════════════

  // ── CLIENT WRITE ──
  {
    name: 'archive_client',
    description: "Archiver un client (le passe en statut ARCHIVE). Pas de suppression — traçabilité.",
    category: 'write',
    parameters: [
      { name: 'clientId', type: 'string', description: 'ID du client', required: false },
      { name: 'clientName', type: 'string', description: 'Nom du client', required: false },
      { name: 'reason', type: 'string', description: "Raison de l'archivage", required: false },
    ],
    requiresConfirmation: true,
    idempotent: true,
    sensitiveFields: ['clientId'],
    permissions: { minRole: 'ADVISOR', scopes: ['clients:write'], requiresClientAccess: true, onlyOwnClients: true },
    timeout: 10_000,
    retryable: false,
    maxRetries: 0,
  },

  // ── PATRIMOINE WRITE ──
  {
    name: 'create_actif',
    description: "Ajouter un actif au patrimoine d'un client (immobilier, financier, épargne, etc.)",
    category: 'write',
    parameters: [
      { name: 'clientId', type: 'string', description: 'ID du client', required: false },
      { name: 'clientName', type: 'string', description: 'Nom du client', required: false },
      { name: 'name', type: 'string', description: "Nom de l'actif", required: true },
      { name: 'type', type: 'string', description: "Type d'actif", required: true, enum: ['RESIDENCE_PRINCIPALE', 'IMMOBILIER_LOCATIF', 'RESIDENCE_SECONDAIRE', 'SCPI', 'ASSURANCE_VIE', 'PER', 'PEA', 'COMPTE_TITRES', 'LIVRET_A', 'LDD', 'PEL', 'PEE', 'PERCO'] },
      { name: 'category', type: 'string', description: 'Catégorie', required: true, enum: ['IMMOBILIER', 'FINANCIER', 'EPARGNE_SALARIALE', 'EPARGNE_RETRAITE', 'PROFESSIONNEL', 'MOBILIER', 'AUTRE'] },
      { name: 'value', type: 'number', description: 'Valeur actuelle (€)', required: true },
      { name: 'annualIncome', type: 'number', description: 'Revenu annuel (€)', required: false },
      { name: 'description', type: 'string', description: 'Description', required: false },
    ],
    requiresConfirmation: true,
    idempotent: false,
    sensitiveFields: ['clientId'],
    permissions: { minRole: 'ADVISOR', scopes: ['patrimoine:write'], requiresClientAccess: true, onlyOwnClients: true },
    timeout: 10_000,
    retryable: false,
    maxRetries: 0,
  },
  {
    name: 'create_passif',
    description: "Ajouter un passif/dette au patrimoine d'un client (crédit immobilier, conso, etc.)",
    category: 'write',
    parameters: [
      { name: 'clientId', type: 'string', description: 'ID du client', required: false },
      { name: 'clientName', type: 'string', description: 'Nom du client', required: false },
      { name: 'name', type: 'string', description: 'Nom du passif', required: true },
      { name: 'type', type: 'string', description: 'Type', required: true, enum: ['CREDIT_IMMOBILIER', 'CREDIT_CONSOMMATION', 'CREDIT_AUTO', 'PRET_ETUDIANT', 'PRET_PROFESSIONNEL', 'PRET_IN_FINE', 'AUTRE'] },
      { name: 'initialAmount', type: 'number', description: 'Montant initial (€)', required: true },
      { name: 'remainingAmount', type: 'number', description: 'Capital restant dû (€)', required: true },
      { name: 'monthlyPayment', type: 'number', description: 'Mensualité (€)', required: false },
      { name: 'interestRate', type: 'number', description: "Taux d'intérêt (%)", required: false },
      { name: 'endDate', type: 'string', description: 'Date de fin (ISO)', required: false },
    ],
    requiresConfirmation: true,
    idempotent: false,
    sensitiveFields: ['clientId'],
    permissions: { minRole: 'ADVISOR', scopes: ['patrimoine:write'], requiresClientAccess: true, onlyOwnClients: true },
    timeout: 10_000,
    retryable: false,
    maxRetries: 0,
  },

  // ── CONTRATS WRITE ──
  {
    name: 'create_contrat',
    description: "Créer un nouveau contrat pour un client (assurance-vie, mutuelle, prévoyance, etc.)",
    category: 'write',
    parameters: [
      { name: 'clientId', type: 'string', description: 'ID du client', required: false },
      { name: 'clientName', type: 'string', description: 'Nom du client', required: false },
      { name: 'type', type: 'string', description: 'Type de contrat', required: true, enum: ['ASSURANCE_VIE', 'MUTUELLE', 'ASSURANCE_HABITATION', 'ASSURANCE_AUTO', 'PREVOYANCE', 'EPARGNE_RETRAITE', 'AUTRE'] },
      { name: 'provider', type: 'string', description: 'Compagnie/fournisseur', required: true },
      { name: 'contractNumber', type: 'string', description: 'Numéro de contrat', required: false },
      { name: 'value', type: 'number', description: 'Valeur/encours (€)', required: false },
      { name: 'premium', type: 'number', description: 'Prime/cotisation (€)', required: false },
      { name: 'startDate', type: 'string', description: "Date d'effet (ISO)", required: false },
      { name: 'endDate', type: 'string', description: "Date d'échéance (ISO)", required: false },
    ],
    requiresConfirmation: true,
    idempotent: false,
    sensitiveFields: ['clientId'],
    permissions: { minRole: 'ADVISOR', scopes: ['contrats:write'], requiresClientAccess: true, onlyOwnClients: true },
    timeout: 10_000,
    retryable: false,
    maxRetries: 0,
  },
  {
    name: 'update_contrat',
    description: "Mettre à jour un contrat existant (valeur, statut, etc.)",
    category: 'write',
    parameters: [
      { name: 'contratId', type: 'string', description: 'ID du contrat', required: true },
      { name: 'value', type: 'number', description: 'Nouvelle valeur (€)', required: false },
      { name: 'status', type: 'string', description: 'Nouveau statut', required: false, enum: ['ACTIF', 'EN_COURS', 'RESILIE', 'EXPIRE'] },
      { name: 'premium', type: 'number', description: 'Nouvelle prime (€)', required: false },
      { name: 'notes', type: 'string', description: 'Notes', required: false },
    ],
    requiresConfirmation: true,
    idempotent: true,
    sensitiveFields: [],
    permissions: { minRole: 'ADVISOR', scopes: ['contrats:write'], requiresClientAccess: false, onlyOwnClients: false },
    timeout: 10_000,
    retryable: false,
    maxRetries: 0,
  },

  // ── DOSSIERS ──
  {
    name: 'create_dossier',
    description: "Créer un nouveau dossier pour un client (patrimoine, succession, investissement, etc.)",
    category: 'write',
    parameters: [
      { name: 'clientId', type: 'string', description: 'ID du client', required: false },
      { name: 'clientName', type: 'string', description: 'Nom du client', required: false },
      { name: 'nom', type: 'string', description: 'Nom du dossier', required: true },
      { name: 'categorie', type: 'string', description: 'Catégorie', required: true, enum: ['PATRIMOINE', 'SUCCESSION', 'RETRAITE', 'INVESTISSEMENT', 'IMMOBILIER', 'CREDIT', 'ASSURANCE_PERSONNES', 'ASSURANCE_BIENS'] },
      { name: 'type', type: 'string', description: 'Type de dossier', required: false, enum: ['BILAN_PATRIMONIAL', 'AUDIT_FISCAL', 'ETUDE_SUCCESSION', 'PROJET_IMMOBILIER', 'AUTRE'] },
      { name: 'description', type: 'string', description: 'Description', required: false },
      { name: 'priorite', type: 'string', description: 'Priorité', required: false, enum: ['BASSE', 'NORMALE', 'HAUTE', 'URGENTE'] },
    ],
    requiresConfirmation: true,
    idempotent: false,
    sensitiveFields: ['clientId'],
    permissions: { minRole: 'ADVISOR', scopes: ['dossiers:write'], requiresClientAccess: true, onlyOwnClients: true },
    timeout: 10_000,
    retryable: false,
    maxRetries: 0,
  },
  {
    name: 'update_dossier',
    description: "Mettre à jour le statut ou les infos d'un dossier",
    category: 'write',
    parameters: [
      { name: 'dossierId', type: 'string', description: 'ID du dossier', required: true },
      { name: 'status', type: 'string', description: 'Nouveau statut', required: false, enum: ['BROUILLON', 'ACTIF', 'EN_COURS', 'EN_ATTENTE', 'A_VALIDER', 'VALIDE', 'ARCHIVE'] },
      { name: 'priorite', type: 'string', description: 'Priorité', required: false, enum: ['BASSE', 'NORMALE', 'HAUTE', 'URGENTE'] },
      { name: 'notes', type: 'string', description: 'Notes', required: false },
    ],
    requiresConfirmation: true,
    idempotent: true,
    sensitiveFields: [],
    permissions: { minRole: 'ADVISOR', scopes: ['dossiers:write'], requiresClientAccess: false, onlyOwnClients: false },
    timeout: 10_000,
    retryable: false,
    maxRetries: 0,
  },
  {
    name: 'list_dossiers',
    description: "Lister les dossiers d'un client ou du cabinet",
    category: 'read',
    parameters: [
      { name: 'clientId', type: 'string', description: 'Filtrer par client', required: false },
      { name: 'status', type: 'string', description: 'Filtrer par statut', required: false, enum: ['BROUILLON', 'ACTIF', 'EN_COURS', 'EN_ATTENTE', 'A_VALIDER', 'VALIDE'] },
      { name: 'categorie', type: 'string', description: 'Filtrer par catégorie', required: false },
    ],
    requiresConfirmation: false,
    idempotent: true,
    sensitiveFields: [],
    permissions: { minRole: 'ASSISTANT', scopes: ['dossiers:read'], requiresClientAccess: false, onlyOwnClients: false },
    timeout: 10_000,
    retryable: true,
    maxRetries: 2,
  },

  // ── DOSSIER BILAN PATRIMONIAL ──
  {
    name: 'add_simulation_to_dossier',
    description: "Ajouter une simulation au dossier bilan patrimonial d'un client.",
    category: 'write',
    parameters: [
      { name: 'dossierId', type: 'string', description: 'ID du dossier', required: true },
      { name: 'simulateurType', type: 'string', description: 'Type de simulateur', required: true, enum: ['FISCAL_IR', 'FISCAL_IFI', 'SUCCESSION', 'RETRAITE', 'CAPACITE_EMPRUNT', 'ASSURANCE_VIE', 'EPARGNE', 'IMMOBILIER', 'PER', 'PREVOYANCE', 'PLUS_VALUES', 'BUDGET'] },
      { name: 'nom', type: 'string', description: 'Nom de la simulation', required: true },
      { name: 'parametres', type: 'string', description: 'Paramètres en JSON', required: false },
      { name: 'resultats', type: 'string', description: 'Résultats en JSON', required: false },
    ],
    requiresConfirmation: true,
    idempotent: false,
    sensitiveFields: [],
    permissions: { minRole: 'ADVISOR', scopes: ['dossiers:write', 'simulations:execute'], requiresClientAccess: false, onlyOwnClients: false },
    timeout: 15_000,
    retryable: false,
    maxRetries: 0,
  },
  {
    name: 'generate_dossier_preconisations',
    description: "Générer automatiquement des préconisations IA pour un dossier bilan patrimonial.",
    category: 'analyze',
    parameters: [
      { name: 'dossierId', type: 'string', description: 'ID du dossier', required: true },
    ],
    requiresConfirmation: true,
    idempotent: true,
    sensitiveFields: [],
    permissions: { minRole: 'ADVISOR', scopes: ['dossiers:write', 'analysis:execute'], requiresClientAccess: false, onlyOwnClients: false },
    timeout: 30_000,
    retryable: true,
    maxRetries: 1,
  },
  {
    name: 'advance_dossier_etape',
    description: "Avancer l'étape du workflow d'un dossier bilan patrimonial (COLLECTE → ANALYSE → PRECONISATION → VALIDATION → CLOTURE).",
    category: 'write',
    parameters: [
      { name: 'dossierId', type: 'string', description: 'ID du dossier', required: true },
      { name: 'etape', type: 'string', description: 'Étape cible', required: true, enum: ['COLLECTE', 'ANALYSE', 'PRECONISATION', 'VALIDATION', 'CLOTURE'] },
    ],
    requiresConfirmation: true,
    idempotent: true,
    sensitiveFields: [],
    permissions: { minRole: 'ADVISOR', scopes: ['dossiers:write'], requiresClientAccess: false, onlyOwnClients: false },
    timeout: 10_000,
    retryable: false,
    maxRetries: 0,
  },
  {
    name: 'generate_bilan_pdf',
    description: "Générer le PDF du bilan patrimonial professionnel pour un dossier.",
    category: 'export',
    parameters: [
      { name: 'dossierId', type: 'string', description: 'ID du dossier', required: true },
    ],
    requiresConfirmation: true,
    idempotent: true,
    sensitiveFields: [],
    permissions: { minRole: 'ADVISOR', scopes: ['documents:write'], requiresClientAccess: false, onlyOwnClients: false },
    timeout: 60_000,
    retryable: false,
    maxRetries: 0,
  },

  // ── KYC ──
  {
    name: 'get_kyc_alerts',
    description: "Récupérer les alertes KYC : expirations proches, documents manquants.",
    category: 'read',
    parameters: [
      { name: 'daysUntilExpiry', type: 'number', description: "Jours avant expiration (défaut: 30)", required: false, default: 30 },
    ],
    requiresConfirmation: false,
    idempotent: true,
    sensitiveFields: [],
    permissions: { minRole: 'ASSISTANT', scopes: ['kyc:read'], requiresClientAccess: false, onlyOwnClients: false },
    timeout: 10_000,
    retryable: true,
    maxRetries: 2,
  },
  {
    name: 'update_kyc_status',
    description: "Mettre à jour le statut KYC d'un client et planifier la prochaine revue.",
    category: 'write',
    parameters: [
      { name: 'clientId', type: 'string', description: 'ID du client', required: false },
      { name: 'clientName', type: 'string', description: 'Nom du client', required: false },
      { name: 'status', type: 'string', description: 'Nouveau statut KYC', required: true, enum: ['EN_ATTENTE', 'EN_COURS', 'COMPLET', 'EXPIRE', 'REJETE'] },
      { name: 'nextReviewDate', type: 'string', description: 'Date prochaine revue (ISO)', required: false },
      { name: 'notes', type: 'string', description: 'Notes de revue', required: false },
    ],
    requiresConfirmation: true,
    idempotent: true,
    sensitiveFields: ['clientId'],
    permissions: { minRole: 'ADVISOR', scopes: ['kyc:write'], requiresClientAccess: true, onlyOwnClients: true },
    timeout: 10_000,
    retryable: false,
    maxRetries: 0,
  },

  // ── EMAIL ──
  {
    name: 'send_email',
    description: "Envoyer un email à un client. Génère automatiquement le contenu si non fourni.",
    category: 'write',
    parameters: [
      { name: 'clientId', type: 'string', description: 'ID du client destinataire', required: false },
      { name: 'clientName', type: 'string', description: 'Nom du client', required: false },
      { name: 'subject', type: 'string', description: "Sujet de l'email", required: true },
      { name: 'body', type: 'string', description: "Corps de l'email (HTML ou texte)", required: true },
      { name: 'templateId', type: 'string', description: "ID d'un template à utiliser", required: false },
    ],
    requiresConfirmation: true,
    idempotent: false,
    sensitiveFields: ['clientId'],
    permissions: { minRole: 'ADVISOR', scopes: ['emails:write'], requiresClientAccess: true, onlyOwnClients: true },
    timeout: 15_000,
    retryable: false,
    maxRetries: 0,
  },
  {
    name: 'draft_email',
    description: "Créer un brouillon d'email pour un client (ne l'envoie pas).",
    category: 'write',
    parameters: [
      { name: 'clientId', type: 'string', description: 'ID du client', required: false },
      { name: 'clientName', type: 'string', description: 'Nom du client', required: false },
      { name: 'subject', type: 'string', description: 'Sujet', required: true },
      { name: 'body', type: 'string', description: "Corps de l'email", required: true },
      { name: 'emailType', type: 'string', description: "Type d'email", required: false, enum: ['relance', 'confirmation_rdv', 'envoi_bilan', 'information', 'anniversaire', 'suivi_preco', 'newsletter'] },
    ],
    requiresConfirmation: false,
    idempotent: false,
    sensitiveFields: ['clientId'],
    permissions: { minRole: 'ADVISOR', scopes: ['emails:write'], requiresClientAccess: true, onlyOwnClients: true },
    timeout: 10_000,
    retryable: false,
    maxRetries: 0,
  },
  {
    name: 'create_email_template',
    description: "Créer un modèle d'email réutilisable.",
    category: 'write',
    parameters: [
      { name: 'name', type: 'string', description: 'Nom du template', required: true },
      { name: 'category', type: 'string', description: 'Catégorie', required: true, enum: ['PROSPECTION', 'SUIVI', 'RELANCE', 'BIENVENUE', 'NEWSLETTER', 'ANNIVERSAIRE', 'BILAN', 'AUTRE'] },
      { name: 'subject', type: 'string', description: 'Sujet (avec variables {{firstName}} etc.)', required: true },
      { name: 'htmlContent', type: 'string', description: 'Contenu HTML du template', required: true },
      { name: 'description', type: 'string', description: 'Description du template', required: false },
    ],
    requiresConfirmation: true,
    idempotent: false,
    sensitiveFields: [],
    permissions: { minRole: 'ADVISOR', scopes: ['emails:write'], requiresClientAccess: false, onlyOwnClients: false },
    timeout: 10_000,
    retryable: false,
    maxRetries: 0,
  },
  {
    name: 'list_email_templates',
    description: "Lister les modèles d'email disponibles.",
    category: 'read',
    parameters: [
      { name: 'category', type: 'string', description: 'Filtrer par catégorie', required: false },
    ],
    requiresConfirmation: false,
    idempotent: true,
    sensitiveFields: [],
    permissions: { minRole: 'ASSISTANT', scopes: ['emails:read'], requiresClientAccess: false, onlyOwnClients: false },
    timeout: 10_000,
    retryable: true,
    maxRetries: 2,
  },

  // ── AGENDA WRITE ──
  {
    name: 'update_appointment',
    description: "Modifier un rendez-vous existant (date, type, notes).",
    category: 'write',
    parameters: [
      { name: 'appointmentId', type: 'string', description: 'ID du RDV', required: true },
      { name: 'startDate', type: 'string', description: 'Nouvelle date de début (ISO)', required: false },
      { name: 'endDate', type: 'string', description: 'Nouvelle date de fin (ISO)', required: false },
      { name: 'status', type: 'string', description: 'Nouveau statut', required: false, enum: ['PLANIFIE', 'CONFIRME', 'ANNULE', 'REPORTE', 'REALISE'] },
      { name: 'notes', type: 'string', description: 'Notes', required: false },
    ],
    requiresConfirmation: true,
    idempotent: true,
    sensitiveFields: [],
    permissions: { minRole: 'ADVISOR', scopes: ['appointments:write'], requiresClientAccess: false, onlyOwnClients: false },
    timeout: 10_000,
    retryable: false,
    maxRetries: 0,
  },
  {
    name: 'cancel_appointment',
    description: "Annuler un rendez-vous.",
    category: 'write',
    parameters: [
      { name: 'appointmentId', type: 'string', description: 'ID du RDV à annuler', required: true },
      { name: 'reason', type: 'string', description: "Raison de l'annulation", required: false },
    ],
    requiresConfirmation: true,
    idempotent: true,
    sensitiveFields: [],
    permissions: { minRole: 'ADVISOR', scopes: ['appointments:write'], requiresClientAccess: false, onlyOwnClients: false },
    timeout: 10_000,
    retryable: false,
    maxRetries: 0,
  },

  // ── TÂCHES AVANCÉES ──
  {
    name: 'update_task',
    description: "Mettre à jour une tâche existante (statut, priorité, date, etc.).",
    category: 'write',
    parameters: [
      { name: 'taskId', type: 'string', description: 'ID de la tâche', required: true },
      { name: 'status', type: 'string', description: 'Nouveau statut', required: false, enum: ['A_FAIRE', 'EN_COURS', 'TERMINEE', 'ANNULEE'] },
      { name: 'priority', type: 'string', description: 'Priorité', required: false, enum: ['BASSE', 'MOYENNE', 'HAUTE', 'URGENTE'] },
      { name: 'dueDate', type: 'string', description: 'Nouvelle échéance (ISO)', required: false },
      { name: 'notes', type: 'string', description: 'Notes', required: false },
    ],
    requiresConfirmation: true,
    idempotent: true,
    sensitiveFields: [],
    permissions: { minRole: 'ASSISTANT', scopes: ['tasks:write'], requiresClientAccess: false, onlyOwnClients: false },
    timeout: 10_000,
    retryable: false,
    maxRetries: 0,
  },
  {
    name: 'complete_task',
    description: "Marquer une tâche comme terminée.",
    category: 'write',
    parameters: [
      { name: 'taskId', type: 'string', description: 'ID de la tâche', required: true },
    ],
    requiresConfirmation: true,
    idempotent: true,
    sensitiveFields: [],
    permissions: { minRole: 'ASSISTANT', scopes: ['tasks:write'], requiresClientAccess: false, onlyOwnClients: false },
    timeout: 10_000,
    retryable: false,
    maxRetries: 0,
  },

  // ── SIMULATIONS READ ──
  {
    name: 'list_simulations',
    description: "Lister les simulations d'un client.",
    category: 'read',
    parameters: [
      { name: 'clientId', type: 'string', description: 'ID du client', required: false },
      { name: 'clientName', type: 'string', description: 'Nom du client', required: false },
      { name: 'type', type: 'string', description: 'Filtrer par type', required: false },
    ],
    requiresConfirmation: false,
    idempotent: true,
    sensitiveFields: ['clientId'],
    permissions: { minRole: 'ADVISOR', scopes: ['simulations:read'], requiresClientAccess: false, onlyOwnClients: false },
    timeout: 10_000,
    retryable: true,
    maxRetries: 2,
  },

  // ── DOCUMENTS RÉGLEMENTAIRES ──
  {
    name: 'generate_regulatory_doc',
    description: "Générer un document réglementaire (DER, lettre de mission, rapport, questionnaire MiFID, etc.).",
    category: 'export',
    parameters: [
      { name: 'clientId', type: 'string', description: 'ID du client', required: false },
      { name: 'clientName', type: 'string', description: 'Nom du client', required: false },
      { name: 'documentType', type: 'string', description: 'Type de document', required: true, enum: ['DER', 'RECUEIL_INFORMATIONS', 'LETTRE_MISSION', 'RAPPORT_MISSION', 'CONVENTION_HONORAIRES', 'ATTESTATION_CONSEIL', 'QUESTIONNAIRE_MIFID', 'BULLETIN_SOUSCRIPTION'] },
      { name: 'dossierId', type: 'string', description: 'ID du dossier associé', required: false },
    ],
    requiresConfirmation: true,
    idempotent: true,
    sensitiveFields: ['clientId'],
    permissions: { minRole: 'ADVISOR', scopes: ['documents:write'], requiresClientAccess: true, onlyOwnClients: true },
    timeout: 30_000,
    retryable: false,
    maxRetries: 0,
  },

  // ── COMMERCIAL ──
  {
    name: 'create_commercial_action',
    description: "Créer une action commerciale (campagne ciblée, relance segment, etc.).",
    category: 'write',
    parameters: [
      { name: 'title', type: 'string', description: "Titre de l'action", required: true },
      { name: 'objective', type: 'string', description: "Objectif de l'action", required: true },
      { name: 'segmentLabel', type: 'string', description: 'Segment ciblé (ex: clients patrimoine >500K)', required: false },
      { name: 'channels', type: 'string', description: 'Canaux (email,telephone,rdv)', required: false },
      { name: 'scheduledAt', type: 'string', description: 'Date planifiée (ISO)', required: false },
      { name: 'notes', type: 'string', description: 'Notes', required: false },
    ],
    requiresConfirmation: true,
    idempotent: false,
    sensitiveFields: [],
    permissions: { minRole: 'ADVISOR', scopes: ['commercial:write'], requiresClientAccess: false, onlyOwnClients: false },
    timeout: 10_000,
    retryable: false,
    maxRetries: 0,
  },
  {
    name: 'create_campaign',
    description: "Créer une campagne email/newsletter.",
    category: 'write',
    parameters: [
      { name: 'name', type: 'string', description: 'Nom de la campagne', required: true },
      { name: 'type', type: 'string', description: 'Type', required: false, enum: ['EMAIL', 'SMS', 'POSTAL', 'MULTI_CANAL'] },
      { name: 'subject', type: 'string', description: "Sujet de l'email", required: false },
      { name: 'htmlContent', type: 'string', description: 'Contenu HTML', required: false },
      { name: 'description', type: 'string', description: 'Description', required: false },
      { name: 'templateId', type: 'string', description: 'ID du template à utiliser', required: false },
    ],
    requiresConfirmation: true,
    idempotent: false,
    sensitiveFields: [],
    permissions: { minRole: 'ADVISOR', scopes: ['commercial:write'], requiresClientAccess: false, onlyOwnClients: false },
    timeout: 10_000,
    retryable: false,
    maxRetries: 0,
  },

  // ── NOTIFICATIONS ──
  {
    name: 'create_notification',
    description: "Créer une notification/rappel.",
    category: 'write',
    parameters: [
      { name: 'title', type: 'string', description: 'Titre de la notification', required: true },
      { name: 'message', type: 'string', description: 'Message détaillé', required: true },
      { name: 'type', type: 'string', description: 'Type', required: false, enum: ['RAPPEL_RDV', 'TACHE_ECHEANCE', 'KYC_EXPIRATION', 'OPPORTUNITE_DETECTEE', 'SYSTEME', 'AUTRE'] },
      { name: 'clientId', type: 'string', description: 'Client concerné', required: false },
    ],
    requiresConfirmation: true,
    idempotent: false,
    sensitiveFields: ['clientId'],
    permissions: { minRole: 'ASSISTANT', scopes: ['notifications:write'], requiresClientAccess: false, onlyOwnClients: false },
    timeout: 10_000,
    retryable: false,
    maxRetries: 0,
  },

  // ── MÉMOIRE AVANCÉE ──
  {
    name: 'list_instructions',
    description: "Lister toutes les instructions et préférences mémorisées.",
    category: 'memory',
    parameters: [],
    requiresConfirmation: false,
    idempotent: true,
    sensitiveFields: [],
    permissions: { minRole: 'ADVISOR', scopes: ['memory:read'], requiresClientAccess: false, onlyOwnClients: false },
    timeout: 5_000,
    retryable: true,
    maxRetries: 2,
  },
  {
    name: 'delete_instruction',
    description: "Supprimer une instruction ou préférence mémorisée.",
    category: 'memory',
    parameters: [
      { name: 'instructionId', type: 'string', description: "ID de l'instruction à supprimer", required: true },
    ],
    requiresConfirmation: true,
    idempotent: true,
    sensitiveFields: [],
    permissions: { minRole: 'ADVISOR', scopes: ['memory:write'], requiresClientAccess: false, onlyOwnClients: false },
    timeout: 5_000,
    retryable: false,
    maxRetries: 0,
  },

  // ── WORKFLOWS AUTOMATISÉS ──
  {
    name: 'run_workflow',
    description: "Exécuter un workflow automatisé prédéfini (onboarding, revue KYC, bilan annuel, relance, newsletter, etc.).",
    category: 'write',
    parameters: [
      { name: 'workflow', type: 'string', description: 'Workflow à exécuter', required: true, enum: ['onboarding_client', 'revue_kyc', 'bilan_annuel', 'relance_inactifs', 'preparation_rdv', 'suivi_post_rdv', 'anniversaire_clients', 'revue_contrats', 'alerte_echeances', 'newsletter_mensuelle'] },
      { name: 'clientId', type: 'string', description: 'Client concerné (si applicable)', required: false },
      { name: 'clientName', type: 'string', description: 'Nom du client', required: false },
      { name: 'params', type: 'string', description: 'Paramètres additionnels (JSON)', required: false },
    ],
    requiresConfirmation: true,
    idempotent: false,
    sensitiveFields: ['clientId'],
    permissions: { minRole: 'ADVISOR', scopes: ['workflows:execute'], requiresClientAccess: false, onlyOwnClients: false },
    timeout: 30_000,
    retryable: false,
    maxRetries: 0,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // MCP GOUVERNEMENTAL — Données ouvertes (data.gouv.fr, INSEE SIRENE)
  // ══════════════════════════════════════════════════════════════════════════
  {
    name: 'mcp_search_datasets',
    description: "Rechercher des jeux de données sur data.gouv.fr (open data gouvernemental). Utile pour trouver des données publiques sur l'immobilier, la population, les entreprises, la fiscalité, etc.",
    category: 'read',
    parameters: [
      { name: 'query', type: 'string', description: 'Mots-clés de recherche', required: true },
      { name: 'pageSize', type: 'number', description: 'Nombre de résultats (max 100)', required: false, default: 10 },
    ],
    requiresConfirmation: false,
    idempotent: true,
    sensitiveFields: [],
    permissions: { minRole: 'ADVISOR', scopes: [], requiresClientAccess: false, onlyOwnClients: false },
    timeout: 15_000,
    retryable: true,
    maxRetries: 2,
  },
  {
    name: 'mcp_query_data',
    description: "Interroger les données d'une ressource data.gouv.fr. Permet de requêter directement le contenu d'un fichier CSV/JSON publié par le gouvernement.",
    category: 'read',
    parameters: [
      { name: 'resourceId', type: 'string', description: "ID de la ressource data.gouv.fr", required: true },
      { name: 'question', type: 'string', description: 'Question sur les données', required: true },
    ],
    requiresConfirmation: false,
    idempotent: true,
    sensitiveFields: [],
    permissions: { minRole: 'ADVISOR', scopes: [], requiresClientAccess: false, onlyOwnClients: false },
    timeout: 15_000,
    retryable: true,
    maxRetries: 2,
  },
  {
    name: 'mcp_search_entreprise',
    description: "Rechercher une entreprise française par nom, SIREN ou SIRET via l'API INSEE SIRENE. Utile pour la vérification KYC, l'onboarding client professionnel, et la récupération d'informations légales.",
    category: 'read',
    parameters: [
      { name: 'siren', type: 'string', description: 'Numéro SIREN (9 chiffres)', required: false },
      { name: 'siret', type: 'string', description: 'Numéro SIRET (14 chiffres)', required: false },
      { name: 'name', type: 'string', description: 'Nom ou raison sociale', required: false },
    ],
    requiresConfirmation: false,
    idempotent: true,
    sensitiveFields: [],
    permissions: { minRole: 'ADVISOR', scopes: [], requiresClientAccess: false, onlyOwnClients: false },
    timeout: 15_000,
    retryable: true,
    maxRetries: 2,
  },
  {
    name: 'mcp_search_apis',
    description: "Rechercher des APIs gouvernementales disponibles sur data.gouv.fr (Adresse, SIRENE, DVF, etc.).",
    category: 'read',
    parameters: [
      { name: 'query', type: 'string', description: 'Mots-clés de recherche', required: true },
    ],
    requiresConfirmation: false,
    idempotent: true,
    sensitiveFields: [],
    permissions: { minRole: 'ADVISOR', scopes: [], requiresClientAccess: false, onlyOwnClients: false },
    timeout: 15_000,
    retryable: true,
    maxRetries: 2,
  },
  {
    name: 'mcp_dvf_immobilier',
    description: "Rechercher les données de transactions immobilières (DVF — Demandes de Valeurs Foncières) pour une commune via data.gouv.fr. Alternative au dvf_price_lookup.",
    category: 'read',
    parameters: [
      { name: 'commune', type: 'string', description: 'Nom de la commune', required: true },
    ],
    requiresConfirmation: false,
    idempotent: true,
    sensitiveFields: [],
    permissions: { minRole: 'ADVISOR', scopes: [], requiresClientAccess: false, onlyOwnClients: false },
    timeout: 15_000,
    retryable: true,
    maxRetries: 2,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // INTELLIGENCE ENGINES — Moteurs d'intelligence avancés AURA
  // ══════════════════════════════════════════════════════════════════════════

  // ── Relationship Intelligence ──
  {
    name: 'score_client_relationship',
    description: "Calculer le score relationnel (0-100) d'un client avec analyse multi-dimensionnelle : récence, fréquence, profondeur patrimoine, conformité. Retourne le grade (A-F), les signaux et la tendance.",
    category: 'analyze',
    parameters: [
      { name: 'clientId', type: 'string', description: 'ID du client à scorer', required: true },
    ],
    requiresConfirmation: false,
    idempotent: true,
    sensitiveFields: [],
    permissions: { minRole: 'ADVISOR', scopes: ['client:read'], requiresClientAccess: true, onlyOwnClients: true },
    timeout: 10_000,
    retryable: true,
    maxRetries: 1,
  },
  {
    name: 'score_portfolio_relationships',
    description: "Scorer tous les clients du portefeuille et retourner le classement par score relationnel. Permet de visualiser la santé relationnelle globale.",
    category: 'analyze',
    parameters: [
      { name: 'limit', type: 'number', description: 'Nombre max de résultats', required: false },
      { name: 'sortBy', type: 'string', description: 'Tri: score_asc, score_desc, days_since_contact', required: false, enum: ['score_asc', 'score_desc', 'days_since_contact'] },
      { name: 'minScore', type: 'number', description: 'Score minimum à inclure', required: false },
      { name: 'maxScore', type: 'number', description: 'Score maximum à inclure', required: false },
    ],
    requiresConfirmation: false,
    idempotent: true,
    sensitiveFields: [],
    permissions: { minRole: 'ADVISOR', scopes: ['client:read'], requiresClientAccess: false, onlyOwnClients: false },
    timeout: 30_000,
    retryable: true,
    maxRetries: 1,
  },
  {
    name: 'generate_nudges',
    description: "Générer les nudges (alertes intelligentes) pour le conseiller : clients à recontacter, KYC expirants, anniversaires, contrats à renouveler, tâches en retard, prospects inactifs. Classés par score d'urgence.",
    category: 'analyze',
    parameters: [
      { name: 'limit', type: 'number', description: 'Nombre max de nudges', required: false },
    ],
    requiresConfirmation: false,
    idempotent: true,
    sensitiveFields: [],
    permissions: { minRole: 'ADVISOR', scopes: ['client:read'], requiresClientAccess: false, onlyOwnClients: false },
    timeout: 30_000,
    retryable: true,
    maxRetries: 1,
  },
  {
    name: 'profile_client_relationship',
    description: "Profiler un client : segment (premium/aisé/standard/prospect/pro/retraité/jeune actif), cycle de vie, préférence de communication, niveau d'engagement, sujets clés, risques, opportunités détectées, fréquence recommandée.",
    category: 'analyze',
    parameters: [
      { name: 'clientId', type: 'string', description: 'ID du client', required: true },
    ],
    requiresConfirmation: false,
    idempotent: true,
    sensitiveFields: [],
    permissions: { minRole: 'ADVISOR', scopes: ['client:read'], requiresClientAccess: true, onlyOwnClients: true },
    timeout: 10_000,
    retryable: true,
    maxRetries: 1,
  },
  {
    name: 'get_portfolio_dashboard',
    description: "Dashboard IA du portefeuille : distribution des grades relationnels, segmentation, score moyen, alertes critiques, clients négligés et top performers.",
    category: 'analyze',
    parameters: [],
    requiresConfirmation: false,
    idempotent: true,
    sensitiveFields: [],
    permissions: { minRole: 'ADVISOR', scopes: ['client:read'], requiresClientAccess: false, onlyOwnClients: false },
    timeout: 60_000,
    retryable: true,
    maxRetries: 1,
  },

  // ── Lead Pipeline ──
  {
    name: 'score_prospect',
    description: "Scorer un prospect en multi-dimensions : fit (profil), potentiel (CA estimé), maturité (besoin), confiance, timeline (urgence). Retourne le bucket (exceptional/high/medium/low/disqualified) et l'action recommandée.",
    category: 'analyze',
    parameters: [
      { name: 'clientId', type: 'string', description: 'ID du prospect', required: true },
    ],
    requiresConfirmation: false,
    idempotent: true,
    sensitiveFields: [],
    permissions: { minRole: 'ADVISOR', scopes: ['client:read'], requiresClientAccess: true, onlyOwnClients: true },
    timeout: 10_000,
    retryable: true,
    maxRetries: 1,
  },
  {
    name: 'advance_pipeline_stage',
    description: "Avancer un prospect dans le pipeline commercial (NOUVEAU → PREMIER_CONTACT → QUALIFIE → DECOUVERTE → PROPOSITION → NEGOCIATION → SIGNE). Valide la transition, crée un audit trail.",
    category: 'write',
    parameters: [
      { name: 'clientId', type: 'string', description: 'ID du prospect', required: true },
      { name: 'toStage', type: 'string', description: 'Étape cible', required: true, enum: ['NOUVEAU', 'PREMIER_CONTACT', 'QUALIFIE', 'DECOUVERTE', 'PROPOSITION', 'NEGOCIATION', 'SIGNE', 'PERDU'] },
      { name: 'reason', type: 'string', description: 'Raison de la transition', required: true },
    ],
    requiresConfirmation: true,
    idempotent: false,
    sensitiveFields: [],
    permissions: { minRole: 'ADVISOR', scopes: ['client:write'], requiresClientAccess: true, onlyOwnClients: true },
    timeout: 10_000,
    retryable: false,
    maxRetries: 0,
  },
  {
    name: 'get_pipeline_stats',
    description: "Statistiques complètes du pipeline commercial : répartition par étape, taux de conversion, cycle moyen, raisons de perte, top prospects scorés, prospects stagnants.",
    category: 'analyze',
    parameters: [],
    requiresConfirmation: false,
    idempotent: true,
    sensitiveFields: [],
    permissions: { minRole: 'ADVISOR', scopes: ['client:read'], requiresClientAccess: false, onlyOwnClients: false },
    timeout: 30_000,
    retryable: true,
    maxRetries: 1,
  },

  // ── Business Intelligence Council ──
  {
    name: 'run_bi_council',
    description: "Exécuter le Business Intelligence Council — 6 experts analysent le portefeuille en parallèle (Fiscal, Immobilier, Assurance-Vie, Retraite, Conformité, Commercial) et produisent un digest avec recommandations classées, actions urgentes, focus hebdomadaire.",
    category: 'analyze',
    parameters: [],
    requiresConfirmation: false,
    idempotent: true,
    sensitiveFields: [],
    permissions: { minRole: 'ADVISOR', scopes: ['client:read'], requiresClientAccess: false, onlyOwnClients: false },
    timeout: 120_000,
    retryable: true,
    maxRetries: 1,
  },
  {
    name: 'run_bi_expert',
    description: "Exécuter un expert spécifique du Business Intelligence Council : FISCAL, IMMOBILIER, ASSURANCE_VIE, RETRAITE, CONFORMITE ou COMMERCIAL.",
    category: 'analyze',
    parameters: [
      { name: 'expert', type: 'string', description: 'Expert à exécuter', required: true, enum: ['FISCAL', 'IMMOBILIER', 'ASSURANCE_VIE', 'RETRAITE', 'CONFORMITE', 'COMMERCIAL'] },
    ],
    requiresConfirmation: false,
    idempotent: true,
    sensitiveFields: [],
    permissions: { minRole: 'ADVISOR', scopes: ['client:read'], requiresClientAccess: false, onlyOwnClients: false },
    timeout: 60_000,
    retryable: true,
    maxRetries: 1,
  },

  // ── Portfolio Allocation ──
  {
    name: 'analyze_allocation',
    description: "Analyser l'allocation actuelle d'un client vs son profil de risque (Prudent/Équilibré/Dynamique/Offensif). Détecte les dérives, propose des actions de rééquilibrage avec montants et rationale.",
    category: 'analyze',
    parameters: [
      { name: 'clientId', type: 'string', description: 'ID du client', required: true },
    ],
    requiresConfirmation: false,
    idempotent: true,
    sensitiveFields: [],
    permissions: { minRole: 'ADVISOR', scopes: ['client:read'], requiresClientAccess: true, onlyOwnClients: true },
    timeout: 15_000,
    retryable: true,
    maxRetries: 1,
  },
  {
    name: 'distribute_contribution',
    description: "Distribuer un versement programmé de manière optimale pour se rapprocher de l'allocation cible. Algorithme greedy : priorise les classes d'actifs les plus sous-pondérées.",
    category: 'simulate',
    parameters: [
      { name: 'clientId', type: 'string', description: 'ID du client', required: true },
      { name: 'monthlyAmount', type: 'number', description: 'Montant mensuel en euros', required: true },
    ],
    requiresConfirmation: false,
    idempotent: true,
    sensitiveFields: [],
    permissions: { minRole: 'ADVISOR', scopes: ['client:read'], requiresClientAccess: true, onlyOwnClients: true },
    timeout: 15_000,
    retryable: true,
    maxRetries: 1,
  },
  {
    name: 'detect_portfolio_drifts',
    description: "Détecter les dérives d'allocation sur tout le portefeuille du cabinet. Retourne les clients avec drift significatif classés par urgence.",
    category: 'analyze',
    parameters: [],
    requiresConfirmation: false,
    idempotent: true,
    sensitiveFields: [],
    permissions: { minRole: 'ADVISOR', scopes: ['client:read'], requiresClientAccess: false, onlyOwnClients: false },
    timeout: 60_000,
    retryable: true,
    maxRetries: 1,
  },

  // ── Meeting Intelligence ──
  {
    name: 'analyze_meeting',
    description: "Analyser un entretien terminé : générer CR structuré, actions à faire, mises à jour client suggérées, email de suivi proposé, prochain RDV suggéré, signaux détectés (opportunités, risques, conformité).",
    category: 'analyze',
    parameters: [
      { name: 'entretienId', type: 'string', description: 'ID de l\'entretien', required: true },
    ],
    requiresConfirmation: false,
    idempotent: true,
    sensitiveFields: [],
    permissions: { minRole: 'ADVISOR', scopes: ['client:read'], requiresClientAccess: false, onlyOwnClients: false },
    timeout: 15_000,
    retryable: true,
    maxRetries: 1,
  },
  {
    name: 'apply_meeting_actions',
    description: "Appliquer automatiquement les actions extraites d'un entretien : créer les tâches, mettre à jour la fiche client, logger dans la timeline.",
    category: 'write',
    parameters: [
      { name: 'entretienId', type: 'string', description: 'ID de l\'entretien à traiter', required: true },
    ],
    requiresConfirmation: true,
    idempotent: false,
    sensitiveFields: [],
    permissions: { minRole: 'ADVISOR', scopes: ['client:write', 'task:write'], requiresClientAccess: false, onlyOwnClients: false },
    timeout: 15_000,
    retryable: false,
    maxRetries: 0,
  },
  {
    name: 'get_pending_meeting_analyses',
    description: "Lister les entretiens récents terminés qui n'ont pas encore été analysés par le Meeting Intelligence Engine.",
    category: 'read',
    parameters: [],
    requiresConfirmation: false,
    idempotent: true,
    sensitiveFields: [],
    permissions: { minRole: 'ADVISOR', scopes: [], requiresClientAccess: false, onlyOwnClients: false },
    timeout: 10_000,
    retryable: true,
    maxRetries: 1,
  },

  // ── Email Outreach ──
  {
    name: 'create_email_sequence',
    description: "Créer une séquence email automatisée : ONBOARDING, NURTURING, RELANCE_PROSPECT, SUIVI_RDV, ANNIVERSARY, KYC_REMINDER, REVUE_ANNUELLE, FISCAL_DEADLINE. Personnalisation automatique par client.",
    category: 'write',
    parameters: [
      { name: 'type', type: 'string', description: 'Type de séquence', required: true, enum: ['ONBOARDING', 'NURTURING', 'RELANCE_PROSPECT', 'SUIVI_RDV', 'ANNIVERSARY', 'KYC_REMINDER', 'REVUE_ANNUELLE', 'FISCAL_DEADLINE', 'CUSTOM'] },
      { name: 'name', type: 'string', description: 'Nom de la séquence', required: false },
      { name: 'clientIds', type: 'string', description: 'IDs des clients cibles (séparés par virgule)', required: false },
      { name: 'segment', type: 'string', description: 'Segment cible: PROSPECTS, ACTIFS, PREMIUM, KYC_EXPIRE, INACTIFS', required: false, enum: ['PROSPECTS', 'ACTIFS', 'PREMIUM', 'KYC_EXPIRE', 'INACTIFS'] },
    ],
    requiresConfirmation: true,
    idempotent: false,
    sensitiveFields: [],
    permissions: { minRole: 'ADVISOR', scopes: ['email:write'], requiresClientAccess: false, onlyOwnClients: false },
    timeout: 15_000,
    retryable: false,
    maxRetries: 0,
  },
  {
    name: 'get_smart_followups',
    description: "Identifier les follow-ups email nécessaires : clients ayant reçu un email sans réponse depuis 3+ jours. Propose le type de relance (first/second/final) et le contenu suggéré.",
    category: 'read',
    parameters: [
      { name: 'limit', type: 'number', description: 'Nombre max de follow-ups', required: false },
    ],
    requiresConfirmation: false,
    idempotent: true,
    sensitiveFields: [],
    permissions: { minRole: 'ADVISOR', scopes: ['email:read'], requiresClientAccess: false, onlyOwnClients: false },
    timeout: 15_000,
    retryable: true,
    maxRetries: 1,
  },
  {
    name: 'personalize_email',
    description: "Personnaliser un template email pour un client : remplace les variables ({{firstName}}, {{patrimoine}}, etc.) et suggère l'heure optimale d'envoi.",
    category: 'read',
    parameters: [
      { name: 'subject', type: 'string', description: 'Template du sujet', required: true },
      { name: 'body', type: 'string', description: 'Template du corps', required: true },
      { name: 'clientId', type: 'string', description: 'ID du client', required: true },
    ],
    requiresConfirmation: false,
    idempotent: true,
    sensitiveFields: [],
    permissions: { minRole: 'ADVISOR', scopes: ['client:read'], requiresClientAccess: true, onlyOwnClients: true },
    timeout: 10_000,
    retryable: true,
    maxRetries: 1,
  },
  {
    name: 'list_email_sequences',
    description: "Lister les séquences email prédéfinies disponibles avec description et nombre d'étapes.",
    category: 'read',
    parameters: [],
    requiresConfirmation: false,
    idempotent: true,
    sensitiveFields: [],
    permissions: { minRole: 'ADVISOR', scopes: [], requiresClientAccess: false, onlyOwnClients: false },
    timeout: 5_000,
    retryable: true,
    maxRetries: 1,
  },

  // ── Notification Intelligence ──
  {
    name: 'get_notification_digest',
    description: "Obtenir le digest des notifications non lues regroupées par priorité (critique/haute/moyenne) et par catégorie.",
    category: 'read',
    parameters: [],
    requiresConfirmation: false,
    idempotent: true,
    sensitiveFields: [],
    permissions: { minRole: 'ADVISOR', scopes: [], requiresClientAccess: false, onlyOwnClients: false },
    timeout: 10_000,
    retryable: true,
    maxRetries: 1,
  },

  // ── LLM Cost Tracking ──
  {
    name: 'get_ai_usage_report',
    description: "Rapport d'utilisation IA : tokens consommés, coûts estimés, répartition par modèle/tâche/utilisateur, tendance quotidienne. Période configurable.",
    category: 'read',
    parameters: [
      { name: 'period', type: 'string', description: 'Période: month, week, today', required: false, enum: ['month', 'week', 'today'] },
    ],
    requiresConfirmation: false,
    idempotent: true,
    sensitiveFields: [],
    permissions: { minRole: 'ADMIN', scopes: [], requiresClientAccess: false, onlyOwnClients: false },
    timeout: 15_000,
    retryable: true,
    maxRetries: 1,
  },
  {
    name: 'check_ai_budget',
    description: "Vérifier les alertes budgétaires IA : seuils de consommation par cabinet et par utilisateur.",
    category: 'read',
    parameters: [],
    requiresConfirmation: false,
    idempotent: true,
    sensitiveFields: [],
    permissions: { minRole: 'ADMIN', scopes: [], requiresClientAccess: false, onlyOwnClients: false },
    timeout: 10_000,
    retryable: true,
    maxRetries: 1,
  },
]

// ============================================================================
// TOOL ACCESS LAYER — Classe principale
// ============================================================================

export class ToolAccessLayer {
  private prisma: ReturnType<typeof getPrismaClient>
  private toolMap: Map<string, ToolDefinitionV2>

  constructor(private cabinetId: string) {
    this.prisma = getPrismaClient(cabinetId, false)
    this.toolMap = new Map(TOOL_REGISTRY.map(t => [t.name, t]))
  }

  // ── Résolution d'un outil ──

  /**
   * Retourne la définition d'un outil par son nom.
   */
  getToolDefinition(toolName: string): ToolDefinitionV2 | null {
    return this.toolMap.get(toolName) || null
  }

  /**
   * Liste tous les outils disponibles pour un rôle donné.
   */
  async getAvailableTools(userRole: string): Promise<ToolDefinitionV2[]> {
    const roleLevel = this.getRoleLevel(userRole)
    const permissions = await this.getToolPermissions()

    return TOOL_REGISTRY.filter(tool => {
      // Vérifier le rôle minimum
      const minLevel = this.getRoleLevel(tool.permissions.minRole)
      if (roleLevel < minLevel) return false

      // Vérifier les permissions par cabinet
      const perm = permissions.get(tool.name)
      if (perm && !perm.enabled) return false
      if (perm?.allowedRoles?.length && !perm.allowedRoles.includes(userRole)) return false

      return true
    })
  }

  /**
   * Formate les outils disponibles pour injection dans le prompt LLM (format function calling).
   */
  async getToolsForLLM(userRole: string): Promise<Array<{ type: 'function'; function: { name: string; description: string; parameters: Record<string, unknown> } }>> {
    const tools = await this.getAvailableTools(userRole)

    return tools.map(tool => ({
      type: 'function' as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: {
          type: 'object',
          properties: Object.fromEntries(
            tool.parameters.map(p => [
              p.name,
              {
                type: p.type,
                description: p.description,
                ...(p.type === 'array'
                  ? {
                      items: {
                        type: 'string',
                      },
                    }
                  : {}),
                ...(p.enum ? { enum: p.enum } : {}),
                ...(p.default !== undefined ? { default: p.default } : {}),
                ...(p.validation?.min !== undefined ? { minimum: p.validation.min } : {}),
                ...(p.validation?.max !== undefined ? { maximum: p.validation.max } : {}),
                ...(p.validation?.minLength !== undefined ? { minLength: p.validation.minLength } : {}),
                ...(p.validation?.maxLength !== undefined ? { maxLength: p.validation.maxLength } : {}),
              },
            ])
          ),
          required: tool.parameters.filter(p => p.required).map(p => p.name),
        },
      },
    }))
  }

  // ── Vérification des permissions ──

  /**
   * Vérifie si un appel d'outil est autorisé pour le contexte donné.
   * Retourne un objet avec le résultat et le motif de refus éventuel.
   */
  async checkPermission(
    toolName: string,
    context: AgentContext,
    params: Record<string, unknown>,
  ): Promise<{ allowed: boolean; reason?: string; requiresConfirmation: boolean }> {
    const tool = this.toolMap.get(toolName)
    if (!tool) {
      return { allowed: false, reason: `Outil inconnu: ${toolName}`, requiresConfirmation: false }
    }

    // 1. Vérifier le rôle minimum
    const roleLevel = this.getRoleLevel(context.userRole)
    const minLevel = this.getRoleLevel(tool.permissions.minRole)
    if (roleLevel < minLevel) {
      return { allowed: false, reason: `Rôle insuffisant: ${context.userRole} < ${tool.permissions.minRole}`, requiresConfirmation: false }
    }

    // 2. Vérifier les permissions par cabinet
    const permission = await this.getToolPermission(toolName)
    if (permission && !permission.enabled) {
      return { allowed: false, reason: `Outil désactivé par l'administrateur du cabinet`, requiresConfirmation: false }
    }
    if (permission?.allowedRoles?.length && !permission.allowedRoles.includes(context.userRole)) {
      return { allowed: false, reason: `Rôle non autorisé pour cet outil`, requiresConfirmation: false }
    }

    // 3. Vérifier le rate limiting
    if (permission?.maxCallsPerHour || permission?.maxCallsPerDay) {
      const rateLimitOk = await this.checkRateLimit(toolName, context.userId, permission)
      if (!rateLimitOk) {
        return { allowed: false, reason: `Limite d'appels atteinte pour ${toolName}`, requiresConfirmation: false }
      }
    }

    // 4. Vérifier l'accès au client si nécessaire
    if (tool.permissions.requiresClientAccess && params.clientId) {
      const clientAccess = await this.checkClientAccess(context.userId, params.clientId as string, tool.permissions.onlyOwnClients, context.userRole)
      if (!clientAccess) {
        return { allowed: false, reason: `Accès non autorisé au client ${params.clientId}`, requiresConfirmation: false }
      }
    }

    // 5. Déterminer si la confirmation est requise
    let requiresConfirmation = tool.requiresConfirmation
    if (permission?.requiresConfirmation !== undefined) {
      requiresConfirmation = permission.requiresConfirmation
    }
    // Override par le contexte : si le profil force la confirmation pour les writes
    if (context.requireConfirmForWrites && tool.category === 'write') {
      requiresConfirmation = true
    }

    return { allowed: true, requiresConfirmation }
  }

  // ── Validation des paramètres ──

  /**
   * Valide les paramètres d'un appel d'outil selon sa définition.
   */
  validateParams(
    toolName: string,
    params: Record<string, unknown>,
  ): { valid: boolean; errors: string[] } {
    const tool = this.toolMap.get(toolName)
    if (!tool) return { valid: false, errors: [`Outil inconnu: ${toolName}`] }

    const errors: string[] = []

    for (const paramDef of tool.parameters) {
      const value = params[paramDef.name]

      // Vérifier les champs requis
      if (paramDef.required && (value === undefined || value === null || value === '')) {
        errors.push(`Paramètre requis manquant: ${paramDef.name}`)
        continue
      }

      if (value === undefined || value === null) continue

      // Vérifier le type
      if (paramDef.type === 'number' && typeof value !== 'number') {
        errors.push(`${paramDef.name} doit être un nombre`)
      }
      if (paramDef.type === 'string' && typeof value !== 'string') {
        errors.push(`${paramDef.name} doit être une chaîne`)
      }
      if (paramDef.type === 'boolean' && typeof value !== 'boolean') {
        errors.push(`${paramDef.name} doit être un booléen`)
      }
      if (paramDef.type === 'array' && !Array.isArray(value)) {
        errors.push(`${paramDef.name} doit être un tableau`)
      }
      if (paramDef.type === 'object' && (typeof value !== 'object' || Array.isArray(value))) {
        errors.push(`${paramDef.name} doit être un objet`)
      }

      // Vérifier les enum
      if (paramDef.enum && typeof value === 'string' && !paramDef.enum.includes(value)) {
        errors.push(`${paramDef.name} doit être l'une des valeurs: ${paramDef.enum.join(', ')}`)
      }

      // Vérifier les validations numériques
      if (paramDef.validation && typeof value === 'number') {
        if (paramDef.validation.min !== undefined && value < paramDef.validation.min) {
          errors.push(`${paramDef.name} doit être >= ${paramDef.validation.min}`)
        }
        if (paramDef.validation.max !== undefined && value > paramDef.validation.max) {
          errors.push(`${paramDef.name} doit être <= ${paramDef.validation.max}`)
        }
      }

      // Vérifier les validations de chaînes
      if (paramDef.validation && typeof value === 'string') {
        if (paramDef.validation.maxLength && value.length > paramDef.validation.maxLength) {
          errors.push(`${paramDef.name} dépasse la longueur maximale de ${paramDef.validation.maxLength}`)
        }
        if (paramDef.validation.pattern && !new RegExp(paramDef.validation.pattern).test(value)) {
          errors.push(`${paramDef.name} ne correspond pas au format attendu`)
        }
      }
    }

    return { valid: errors.length === 0, errors }
  }

  // ── Masquage pour audit ──

  /**
   * Masque les données sensibles des paramètres pour les logs d'audit.
   */
  maskParamsForAudit(
    toolName: string,
    params: Record<string, unknown>,
  ): Record<string, unknown> {
    const tool = this.toolMap.get(toolName)
    if (!tool) return params

    return maskParams(params, tool.sensitiveFields)
  }

  // ── Audit Trail ──

  /**
   * Enregistre un appel d'outil dans l'audit trail.
   */
  async logToolCall(
    input: ToolCallInput,
    context: AgentContext,
    result: ToolCallResult,
    permissionCheck: { allowed: boolean; reason?: string; requiresConfirmation: boolean },
    runId?: string,
  ): Promise<string> {
    const tool = this.toolMap.get(input.toolName)

    const record = await this.prisma.aIToolCall.create({
      data: {
        cabinetId: this.cabinetId,
        userId: context.userId,
        runId: runId || undefined,
        toolName: input.toolName,
        toolCategory: tool?.category || 'unknown',
        toolParams: input.params as import('@prisma/client').Prisma.InputJsonValue,
        toolParamsMasked: this.maskParamsForAudit(input.toolName, input.params) as import('@prisma/client').Prisma.InputJsonValue,
        status: permissionCheck.allowed
          ? (result.success ? 'COMPLETED' : 'FAILED')
          : 'DENIED',
        result: result.success ? ((result.data || null) as import('@prisma/client').Prisma.InputJsonValue) : undefined,
        resultSummary: result.message,
        error: result.error || null,
        requiresConfirmation: permissionCheck.requiresConfirmation,
        reasoning: input.reasoning,
        dataAccessed: result.dataAccessed,
        durationMs: result.durationMs,
        idempotencyKey: input.idempotencyKey || null,
        permissionUsed: permissionCheck.allowed ? 'granted' : permissionCheck.reason || 'denied',
        executedAt: new Date(),
        completedAt: new Date(),
      },
    })

    return record.id
  }

  /**
   * Enregistre un accès aux données pour le registre RGPD.
   */
  async logDataAccess(
    context: AgentContext,
    entityType: string,
    entityId: string,
    fields: string[],
    operation: 'read' | 'write' | 'delete',
    toolCallId?: string,
    runId?: string,
  ): Promise<void> {
    await this.prisma.aIDataAccessLog.create({
      data: {
        cabinetId: this.cabinetId,
        userId: context.userId,
        clientId: context.clientId || null,
        entityType,
        entityId,
        fields,
        operation,
        source: 'agent_tool',
        toolCallId: toolCallId || null,
        runId: runId || null,
        purpose: 'Traitement par agent IA pour assistance au conseil',
        legalBasis: 'Intérêt légitime — assistance au conseil patrimonial',
      },
    })
  }

  // ── Utilitaires internes ──

  private getRoleLevel(role: string): number {
    const levels: Record<string, number> = {
      'ASSISTANT': 1,
      'ADVISOR': 2,
      'ADMIN': 3,
      'SUPERADMIN': 4,
    }
    return levels[role] || 0
  }

  private async getToolPermissions(): Promise<Map<string, {
    enabled: boolean
    requiresConfirmation: boolean
    allowedRoles: string[]
    maxCallsPerHour: number | null
    maxCallsPerDay: number | null
  }>> {
    const permissions = await this.prisma.aIToolPermission.findMany({
      where: { cabinetId: this.cabinetId },
    })

    return new Map(permissions.map(p => [p.toolName, {
      enabled: p.enabled,
      requiresConfirmation: p.requiresConfirmation,
      allowedRoles: p.allowedRoles,
      maxCallsPerHour: p.maxCallsPerHour,
      maxCallsPerDay: p.maxCallsPerDay,
    }]))
  }

  private async getToolPermission(toolName: string) {
    return this.prisma.aIToolPermission.findUnique({
      where: { cabinetId_toolName: { cabinetId: this.cabinetId, toolName } },
    })
  }

  private async checkRateLimit(
    toolName: string,
    userId: string,
    permission: { maxCallsPerHour: number | null; maxCallsPerDay: number | null },
  ): Promise<boolean> {
    if (permission.maxCallsPerHour) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
      const count = await this.prisma.aIToolCall.count({
        where: {
          cabinetId: this.cabinetId,
          userId,
          toolName,
          createdAt: { gte: oneHourAgo },
          status: { not: 'DENIED' },
        },
      })
      if (count >= permission.maxCallsPerHour) return false
    }

    if (permission.maxCallsPerDay) {
      const startOfDay = new Date()
      startOfDay.setHours(0, 0, 0, 0)
      const count = await this.prisma.aIToolCall.count({
        where: {
          cabinetId: this.cabinetId,
          userId,
          toolName,
          createdAt: { gte: startOfDay },
          status: { not: 'DENIED' },
        },
      })
      if (count >= permission.maxCallsPerDay) return false
    }

    return true
  }

  private async checkClientAccess(
    userId: string,
    clientId: string,
    onlyOwnClients: boolean,
    userRole?: string,
  ): Promise<boolean> {
    if (!onlyOwnClients) return true

    // ADMIN and SUPERADMIN have access to all clients in their cabinet
    if (userRole === 'ADMIN' || userRole === 'SUPERADMIN') return true

    const client = await this.prisma.client.findFirst({
      where: {
        id: clientId,
        cabinetId: this.cabinetId,
        OR: [
          { conseillerId: userId },
          { conseillerRemplacantId: userId },
        ],
      },
      select: { id: true },
    })

    return !!client
  }
}
