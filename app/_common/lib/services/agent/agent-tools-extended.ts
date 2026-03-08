/**
 * Agent Tools Extended — Outils CRM complets pour AURA V2
 * 
 * Couvre TOUTES les opérations du CRM :
 *   • Client: update, onboarding, archivage
 *   • Patrimoine: CRUD actifs/passifs
 *   • Contrats: CRUD, suivi
 *   • Dossiers: CRUD, workflow
 *   • KYC: review, update, alertes
 *   • Email: envoi, brouillons, templates
 *   • Agenda: update/cancel RDV, disponibilités
 *   • Simulations: lancer, consulter
 *   • Documents réglementaires: générer
 *   • Commercial: actions, campagnes, opportunités
 *   • Workflows: automatisations prédéfinies
 */

import { getPrismaClient } from '../../prisma'
import type { ToolDefinition, ToolResult, ToolContext } from './agent-tools'
import { executeWorkflow } from './agent-workflows'
import { RULES } from '@/app/_common/lib/rules/fiscal-rules'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaInstance = ReturnType<typeof getPrismaClient> & Record<string, any>

// ============================================================================
// TOOL DEFINITIONS — Décrites pour le LLM (OpenAI function calling)
// ============================================================================

export const EXTENDED_TOOL_DEFINITIONS: ToolDefinition[] = [
  // ── CLIENT MANAGEMENT ──
  {
    name: 'update_client',
    description: 'Mettre à jour les informations d\'un client (email, téléphone, adresse, situation familiale, profession, etc.)',
    parameters: [
      { name: 'clientId', type: 'string', description: 'ID du client', required: false },
      { name: 'clientName', type: 'string', description: 'Nom du client (recherche si pas d\'ID)', required: false },
      { name: 'email', type: 'string', description: 'Nouvel email', required: false },
      { name: 'phone', type: 'string', description: 'Nouveau téléphone', required: false },
      { name: 'mobile', type: 'string', description: 'Nouveau mobile', required: false },
      { name: 'address', type: 'string', description: 'Nouvelle adresse', required: false },
      { name: 'city', type: 'string', description: 'Ville', required: false },
      { name: 'zipCode', type: 'string', description: 'Code postal', required: false },
      { name: 'profession', type: 'string', description: 'Profession', required: false },
      { name: 'maritalStatus', type: 'string', description: 'Situation familiale', required: false, enum: ['CELIBATAIRE', 'MARIE', 'PACSE', 'DIVORCE', 'VEUF', 'UNION_LIBRE'] },
      { name: 'status', type: 'string', description: 'Statut client', required: false, enum: ['PROSPECT', 'ACTIF', 'INACTIF', 'ARCHIVE'] },
      { name: 'riskProfile', type: 'string', description: 'Profil de risque', required: false, enum: ['PRUDENT', 'EQUILIBRE', 'DYNAMIQUE', 'OFFENSIF'] },
      { name: 'notes', type: 'string', description: 'Notes additionnelles', required: false },
    ],
    requiresConfirmation: false,
    category: 'write',
  },
  {
    name: 'archive_client',
    description: 'Archiver un client (le passe en statut ARCHIVE)',
    parameters: [
      { name: 'clientId', type: 'string', description: 'ID du client', required: false },
      { name: 'clientName', type: 'string', description: 'Nom du client', required: false },
      { name: 'reason', type: 'string', description: 'Raison de l\'archivage', required: false },
    ],
    requiresConfirmation: false,
    category: 'write',
  },

  // ── PATRIMOINE ──
  {
    name: 'create_actif',
    description: 'Ajouter un actif au patrimoine d\'un client (immobilier, financier, épargne, etc.)',
    parameters: [
      { name: 'clientId', type: 'string', description: 'ID du client', required: false },
      { name: 'clientName', type: 'string', description: 'Nom du client', required: false },
      { name: 'name', type: 'string', description: 'Nom de l\'actif', required: true },
      { name: 'type', type: 'string', description: 'Type d\'actif', required: true, enum: ['RESIDENCE_PRINCIPALE', 'IMMOBILIER_LOCATIF', 'RESIDENCE_SECONDAIRE', 'SCPI', 'ASSURANCE_VIE', 'PER', 'PEA', 'COMPTE_TITRES', 'LIVRET_A', 'LDD', 'PEL', 'PEE', 'PERCO'] },
      { name: 'category', type: 'string', description: 'Catégorie', required: true, enum: ['IMMOBILIER', 'FINANCIER', 'EPARGNE_SALARIALE', 'EPARGNE_RETRAITE', 'PROFESSIONNEL', 'MOBILIER', 'AUTRE'] },
      { name: 'value', type: 'number', description: 'Valeur actuelle (€)', required: true },
      { name: 'annualIncome', type: 'number', description: 'Revenu annuel (€)', required: false },
      { name: 'description', type: 'string', description: 'Description', required: false },
    ],
    requiresConfirmation: false,
    category: 'write',
  },
  {
    name: 'create_passif',
    description: 'Ajouter un passif/dette au patrimoine d\'un client (crédit immobilier, conso, etc.)',
    parameters: [
      { name: 'clientId', type: 'string', description: 'ID du client', required: false },
      { name: 'clientName', type: 'string', description: 'Nom du client', required: false },
      { name: 'name', type: 'string', description: 'Nom du passif', required: true },
      { name: 'type', type: 'string', description: 'Type', required: true, enum: ['CREDIT_IMMOBILIER', 'CREDIT_CONSOMMATION', 'CREDIT_AUTO', 'PRET_ETUDIANT', 'PRET_PROFESSIONNEL', 'PRET_IN_FINE', 'AUTRE'] },
      { name: 'initialAmount', type: 'number', description: 'Montant initial (€)', required: true },
      { name: 'remainingAmount', type: 'number', description: 'Capital restant dû (€)', required: true },
      { name: 'monthlyPayment', type: 'number', description: 'Mensualité (€)', required: false },
      { name: 'interestRate', type: 'number', description: 'Taux d\'intérêt (%)', required: false },
      { name: 'endDate', type: 'date', description: 'Date de fin', required: false },
    ],
    requiresConfirmation: false,
    category: 'write',
  },

  // ── CONTRATS ──
  {
    name: 'create_contrat',
    description: 'Créer un nouveau contrat pour un client (assurance-vie, mutuelle, prévoyance, etc.)',
    parameters: [
      { name: 'clientId', type: 'string', description: 'ID du client', required: false },
      { name: 'clientName', type: 'string', description: 'Nom du client', required: false },
      { name: 'type', type: 'string', description: 'Type de contrat', required: true, enum: ['ASSURANCE_VIE', 'MUTUELLE', 'ASSURANCE_HABITATION', 'ASSURANCE_AUTO', 'PREVOYANCE', 'EPARGNE_RETRAITE', 'AUTRE'] },
      { name: 'provider', type: 'string', description: 'Compagnie/fournisseur', required: true },
      { name: 'contractNumber', type: 'string', description: 'Numéro de contrat', required: false },
      { name: 'value', type: 'number', description: 'Valeur/encours (€)', required: false },
      { name: 'premium', type: 'number', description: 'Prime/cotisation (€)', required: false },
      { name: 'startDate', type: 'date', description: 'Date d\'effet', required: false },
      { name: 'endDate', type: 'date', description: 'Date d\'échéance', required: false },
    ],
    requiresConfirmation: false,
    category: 'write',
  },
  {
    name: 'update_contrat',
    description: 'Mettre à jour un contrat existant (valeur, statut, etc.)',
    parameters: [
      { name: 'contratId', type: 'string', description: 'ID du contrat', required: true },
      { name: 'value', type: 'number', description: 'Nouvelle valeur (€)', required: false },
      { name: 'status', type: 'string', description: 'Nouveau statut', required: false, enum: ['ACTIF', 'EN_COURS', 'RESILIE', 'EXPIRE'] },
      { name: 'premium', type: 'number', description: 'Nouvelle prime (€)', required: false },
      { name: 'notes', type: 'string', description: 'Notes', required: false },
    ],
    requiresConfirmation: false,
    category: 'write',
  },

  // ── DOSSIERS ──
  {
    name: 'create_dossier',
    description: 'Créer un nouveau dossier pour un client (patrimoine, succession, investissement, etc.)',
    parameters: [
      { name: 'clientId', type: 'string', description: 'ID du client', required: false },
      { name: 'clientName', type: 'string', description: 'Nom du client', required: false },
      { name: 'nom', type: 'string', description: 'Nom du dossier', required: true },
      { name: 'categorie', type: 'string', description: 'Catégorie', required: true, enum: ['PATRIMOINE', 'SUCCESSION', 'RETRAITE', 'INVESTISSEMENT', 'IMMOBILIER', 'CREDIT', 'ASSURANCE_PERSONNES', 'ASSURANCE_BIENS'] },
      { name: 'type', type: 'string', description: 'Type de dossier', required: false, enum: ['BILAN_PATRIMONIAL', 'AUDIT_FISCAL', 'ETUDE_SUCCESSION', 'PROJET_IMMOBILIER', 'AUTRE'] },
      { name: 'description', type: 'string', description: 'Description', required: false },
      { name: 'priorite', type: 'string', description: 'Priorité', required: false, enum: ['BASSE', 'NORMALE', 'HAUTE', 'URGENTE'] },
    ],
    requiresConfirmation: false,
    category: 'write',
  },
  {
    name: 'update_dossier',
    description: 'Mettre à jour le statut ou les infos d\'un dossier',
    parameters: [
      { name: 'dossierId', type: 'string', description: 'ID du dossier', required: true },
      { name: 'status', type: 'string', description: 'Nouveau statut', required: false, enum: ['BROUILLON', 'ACTIF', 'EN_COURS', 'EN_ATTENTE', 'A_VALIDER', 'VALIDE', 'ARCHIVE'] },
      { name: 'priorite', type: 'string', description: 'Priorité', required: false, enum: ['BASSE', 'NORMALE', 'HAUTE', 'URGENTE'] },
      { name: 'notes', type: 'string', description: 'Notes', required: false },
    ],
    requiresConfirmation: false,
    category: 'write',
  },
  {
    name: 'list_dossiers',
    description: 'Lister les dossiers d\'un client ou du cabinet',
    parameters: [
      { name: 'clientId', type: 'string', description: 'Filtrer par client', required: false },
      { name: 'status', type: 'string', description: 'Filtrer par statut', required: false, enum: ['BROUILLON', 'ACTIF', 'EN_COURS', 'EN_ATTENTE', 'A_VALIDER', 'VALIDE'] },
      { name: 'categorie', type: 'string', description: 'Filtrer par catégorie', required: false },
    ],
    requiresConfirmation: false,
    category: 'read',
  },

  // ── KYC ──
  {
    name: 'update_kyc_status',
    description: 'Mettre à jour le statut KYC d\'un client et planifier la prochaine revue',
    parameters: [
      { name: 'clientId', type: 'string', description: 'ID du client', required: false },
      { name: 'clientName', type: 'string', description: 'Nom du client', required: false },
      { name: 'status', type: 'string', description: 'Nouveau statut KYC', required: true, enum: ['EN_ATTENTE', 'EN_COURS', 'COMPLET', 'EXPIRE', 'REJETE'] },
      { name: 'nextReviewDate', type: 'date', description: 'Date prochaine revue (ISO)', required: false },
      { name: 'notes', type: 'string', description: 'Notes de revue', required: false },
    ],
    requiresConfirmation: false,
    category: 'write',
  },

  // ── EMAIL ──
  {
    name: 'send_email',
    description: 'Envoyer un email à un client. Génère automatiquement le contenu si non fourni.',
    parameters: [
      { name: 'clientId', type: 'string', description: 'ID du client destinataire', required: false },
      { name: 'clientName', type: 'string', description: 'Nom du client', required: false },
      { name: 'subject', type: 'string', description: 'Sujet de l\'email', required: true },
      { name: 'body', type: 'string', description: 'Corps de l\'email (HTML ou texte)', required: true },
      { name: 'templateId', type: 'string', description: 'ID d\'un template à utiliser', required: false },
    ],
    requiresConfirmation: false,
    category: 'write',
  },
  {
    name: 'draft_email',
    description: 'Créer un brouillon d\'email pour un client (ne l\'envoie pas)',
    parameters: [
      { name: 'clientId', type: 'string', description: 'ID du client', required: false },
      { name: 'clientName', type: 'string', description: 'Nom du client', required: false },
      { name: 'subject', type: 'string', description: 'Sujet', required: true },
      { name: 'body', type: 'string', description: 'Corps de l\'email', required: true },
      { name: 'emailType', type: 'string', description: 'Type d\'email', required: false, enum: ['relance', 'confirmation_rdv', 'envoi_bilan', 'information', 'anniversaire', 'suivi_preco', 'newsletter'] },
    ],
    requiresConfirmation: false,
    category: 'write',
  },
  {
    name: 'create_email_template',
    description: 'Créer un modèle d\'email réutilisable',
    parameters: [
      { name: 'name', type: 'string', description: 'Nom du template', required: true },
      { name: 'category', type: 'string', description: 'Catégorie', required: true, enum: ['PROSPECTION', 'SUIVI', 'RELANCE', 'BIENVENUE', 'NEWSLETTER', 'ANNIVERSAIRE', 'BILAN', 'AUTRE'] },
      { name: 'subject', type: 'string', description: 'Sujet (avec variables {{firstName}} etc.)', required: true },
      { name: 'htmlContent', type: 'string', description: 'Contenu HTML du template', required: true },
      { name: 'description', type: 'string', description: 'Description du template', required: false },
    ],
    requiresConfirmation: false,
    category: 'write',
  },
  {
    name: 'list_email_templates',
    description: 'Lister les modèles d\'email disponibles',
    parameters: [
      { name: 'category', type: 'string', description: 'Filtrer par catégorie', required: false },
    ],
    requiresConfirmation: false,
    category: 'read',
  },

  // ── AGENDA ──
  {
    name: 'update_appointment',
    description: 'Modifier un rendez-vous existant (date, type, notes)',
    parameters: [
      { name: 'appointmentId', type: 'string', description: 'ID du RDV', required: true },
      { name: 'startDate', type: 'date', description: 'Nouvelle date de début', required: false },
      { name: 'endDate', type: 'date', description: 'Nouvelle date de fin', required: false },
      { name: 'status', type: 'string', description: 'Nouveau statut', required: false, enum: ['PLANIFIE', 'CONFIRME', 'ANNULE', 'REPORTE', 'REALISE'] },
      { name: 'notes', type: 'string', description: 'Notes', required: false },
    ],
    requiresConfirmation: false,
    category: 'write',
  },
  {
    name: 'cancel_appointment',
    description: 'Annuler un rendez-vous',
    parameters: [
      { name: 'appointmentId', type: 'string', description: 'ID du RDV à annuler', required: true },
      { name: 'reason', type: 'string', description: 'Raison de l\'annulation', required: false },
    ],
    requiresConfirmation: false,
    category: 'write',
  },

  // ── SIMULATIONS ──
  {
    name: 'run_simulation',
    description: 'Lancer une simulation financière pour un client (retraite, crédit, AV, transmission, fiscale)',
    parameters: [
      { name: 'clientId', type: 'string', description: 'ID du client', required: false },
      { name: 'clientName', type: 'string', description: 'Nom du client', required: false },
      { name: 'type', type: 'string', description: 'Type de simulation', required: true, enum: ['RETRAITE', 'CREDIT_IMMOBILIER', 'ASSURANCE_VIE', 'TRANSMISSION_PATRIMOINE', 'OPTIMISATION_FISCALE', 'PROJECTION_INVESTISSEMENT', 'ANALYSE_BUDGET'] },
      { name: 'name', type: 'string', description: 'Nom de la simulation', required: true },
      { name: 'parameters', type: 'string', description: 'Paramètres en JSON', required: false },
    ],
    requiresConfirmation: false,
    category: 'write',
  },
  {
    name: 'list_simulations',
    description: 'Lister les simulations d\'un client',
    parameters: [
      { name: 'clientId', type: 'string', description: 'ID du client', required: false },
      { name: 'clientName', type: 'string', description: 'Nom du client', required: false },
      { name: 'type', type: 'string', description: 'Filtrer par type', required: false },
    ],
    requiresConfirmation: false,
    category: 'read',
  },

  // ── DOCUMENTS RÉGLEMENTAIRES ──
  {
    name: 'generate_regulatory_doc',
    description: 'Générer un document réglementaire (DER, lettre de mission, rapport, questionnaire MiFID, etc.)',
    parameters: [
      { name: 'clientId', type: 'string', description: 'ID du client', required: false },
      { name: 'clientName', type: 'string', description: 'Nom du client', required: false },
      { name: 'documentType', type: 'string', description: 'Type de document', required: true, enum: ['DER', 'RECUEIL_INFORMATIONS', 'LETTRE_MISSION', 'RAPPORT_MISSION', 'CONVENTION_HONORAIRES', 'ATTESTATION_CONSEIL', 'QUESTIONNAIRE_MIFID', 'BULLETIN_SOUSCRIPTION'] },
      { name: 'dossierId', type: 'string', description: 'ID du dossier associé', required: false },
    ],
    requiresConfirmation: false,
    category: 'write',
  },

  // ── COMMERCIAL ──
  {
    name: 'create_commercial_action',
    description: 'Créer une action commerciale (campagne ciblée, relance segment, etc.)',
    parameters: [
      { name: 'title', type: 'string', description: 'Titre de l\'action', required: true },
      { name: 'objective', type: 'string', description: 'Objectif de l\'action', required: true },
      { name: 'segmentLabel', type: 'string', description: 'Segment ciblé (ex: clients patrimoine >500K)', required: false },
      { name: 'channels', type: 'string', description: 'Canaux (email,telephone,rdv)', required: false },
      { name: 'scheduledAt', type: 'date', description: 'Date planifiée', required: false },
      { name: 'notes', type: 'string', description: 'Notes', required: false },
    ],
    requiresConfirmation: false,
    category: 'write',
  },
  {
    name: 'create_campaign',
    description: 'Créer une campagne email/newsletter',
    parameters: [
      { name: 'name', type: 'string', description: 'Nom de la campagne', required: true },
      { name: 'type', type: 'string', description: 'Type', required: false, enum: ['EMAIL', 'SMS', 'POSTAL', 'MULTI_CANAL'] },
      { name: 'subject', type: 'string', description: 'Sujet de l\'email', required: false },
      { name: 'htmlContent', type: 'string', description: 'Contenu HTML', required: false },
      { name: 'description', type: 'string', description: 'Description', required: false },
      { name: 'templateId', type: 'string', description: 'ID du template à utiliser', required: false },
    ],
    requiresConfirmation: false,
    category: 'write',
  },
  {
    name: 'create_opportunite',
    description: 'Créer une opportunité commerciale pour un client',
    parameters: [
      { name: 'clientId', type: 'string', description: 'ID du client', required: false },
      { name: 'clientName', type: 'string', description: 'Nom du client', required: false },
      { name: 'type', type: 'string', description: 'Type d\'opportunité', required: true, enum: ['ASSURANCE_VIE', 'EPARGNE_RETRAITE', 'INVESTISSEMENT_IMMOBILIER', 'INVESTISSEMENT_FINANCIER', 'OPTIMISATION_FISCALE', 'RESTRUCTURATION_CREDIT', 'TRANSMISSION_PATRIMOINE', 'AUDIT_ASSURANCES'] },
      { name: 'name', type: 'string', description: 'Nom/description', required: true },
      { name: 'estimatedValue', type: 'number', description: 'Valeur estimée (€)', required: false },
      { name: 'priority', type: 'string', description: 'Priorité', required: false, enum: ['BASSE', 'MOYENNE', 'HAUTE', 'URGENTE'] },
    ],
    requiresConfirmation: false,
    category: 'write',
  },
  {
    name: 'list_opportunites',
    description: 'Lister les opportunités commerciales',
    parameters: [
      { name: 'clientId', type: 'string', description: 'Filtrer par client', required: false },
      { name: 'status', type: 'string', description: 'Filtrer par statut', required: false, enum: ['DETECTEE', 'QUALIFIEE', 'CONTACTEE', 'EN_NEGOCIATION', 'GAGNEE', 'PERDUE'] },
    ],
    requiresConfirmation: false,
    category: 'read',
  },

  // ── TACHES AVANCÉES ──
  {
    name: 'update_task',
    description: 'Mettre à jour une tâche existante (statut, priorité, date, etc.)',
    parameters: [
      { name: 'taskId', type: 'string', description: 'ID de la tâche', required: true },
      { name: 'status', type: 'string', description: 'Nouveau statut', required: false, enum: ['A_FAIRE', 'EN_COURS', 'TERMINEE', 'ANNULEE'] },
      { name: 'priority', type: 'string', description: 'Priorité', required: false, enum: ['BASSE', 'MOYENNE', 'HAUTE', 'URGENTE'] },
      { name: 'dueDate', type: 'date', description: 'Nouvelle échéance', required: false },
      { name: 'notes', type: 'string', description: 'Notes', required: false },
    ],
    requiresConfirmation: false,
    category: 'write',
  },
  {
    name: 'complete_task',
    description: 'Marquer une tâche comme terminée',
    parameters: [
      { name: 'taskId', type: 'string', description: 'ID de la tâche', required: true },
    ],
    requiresConfirmation: false,
    category: 'write',
  },

  // ── DOSSIER BILAN PATRIMONIAL ──
  {
    name: 'add_simulation_to_dossier',
    description: 'Ajouter une simulation au dossier bilan patrimonial d\'un client. Crée une DossierSimulation liée au dossier.',
    parameters: [
      { name: 'dossierId', type: 'string', description: 'ID du dossier', required: true },
      { name: 'simulateurType', type: 'string', description: 'Type de simulateur', required: true, enum: ['FISCAL_IR', 'FISCAL_IFI', 'SUCCESSION', 'RETRAITE', 'CAPACITE_EMPRUNT', 'ASSURANCE_VIE', 'EPARGNE', 'IMMOBILIER', 'PER', 'PREVOYANCE', 'PLUS_VALUES', 'BUDGET'] },
      { name: 'nom', type: 'string', description: 'Nom de la simulation', required: true },
      { name: 'parametres', type: 'string', description: 'Paramètres en JSON', required: false },
      { name: 'resultats', type: 'string', description: 'Résultats en JSON', required: false },
    ],
    requiresConfirmation: false,
    category: 'write',
  },
  {
    name: 'generate_dossier_preconisations',
    description: 'Générer automatiquement des préconisations IA pour un dossier bilan patrimonial, basées sur le profil client, son patrimoine et ses simulations.',
    parameters: [
      { name: 'dossierId', type: 'string', description: 'ID du dossier', required: true },
    ],
    requiresConfirmation: false,
    category: 'write',
  },
  {
    name: 'advance_dossier_etape',
    description: 'Avancer l\'\u00e9tape du workflow d\'un dossier bilan patrimonial (COLLECTE → ANALYSE → PRECONISATION → VALIDATION → CLOTURE).',
    parameters: [
      { name: 'dossierId', type: 'string', description: 'ID du dossier', required: true },
      { name: 'etape', type: 'string', description: '\u00c9tape cible', required: true, enum: ['COLLECTE', 'ANALYSE', 'PRECONISATION', 'VALIDATION', 'CLOTURE'] },
    ],
    requiresConfirmation: false,
    category: 'write',
  },
  {
    name: 'generate_bilan_pdf',
    description: 'Générer le PDF du bilan patrimonial professionnel pour un dossier. Inclut audit complet, simulations, préconisations.',
    parameters: [
      { name: 'dossierId', type: 'string', description: 'ID du dossier', required: true },
    ],
    requiresConfirmation: false,
    category: 'write',
  },

  // ── WORKFLOWS AUTOMATISÉS ──
  {
    name: 'run_workflow',
    description: 'Exécuter un workflow automatisé prédéfini (onboarding, revue KYC, bilan annuel, relance, newsletter, etc.)',
    parameters: [
      { name: 'workflow', type: 'string', description: 'Workflow à exécuter', required: true, enum: ['onboarding_client', 'revue_kyc', 'bilan_annuel', 'relance_inactifs', 'preparation_rdv', 'suivi_post_rdv', 'anniversaire_clients', 'revue_contrats', 'alerte_echeances', 'newsletter_mensuelle'] },
      { name: 'clientId', type: 'string', description: 'Client concerné (si applicable)', required: false },
      { name: 'clientName', type: 'string', description: 'Nom du client', required: false },
      { name: 'params', type: 'string', description: 'Paramètres additionnels (JSON)', required: false },
    ],
    requiresConfirmation: false,
    category: 'write',
  },
]

// ============================================================================
// HELPER: Résoudre un client par nom ou ID
// ============================================================================

async function resolveClientId(
  prisma: PrismaInstance,
  context: ToolContext,
  clientId?: string,
  clientName?: string,
): Promise<{ id: string; firstName: string; lastName: string } | null> {
  if (clientId) {
    const c = await prisma.client.findFirst({
      where: { id: clientId, cabinetId: context.cabinetId },
      select: { id: true, firstName: true, lastName: true },
    })
    return c
  }
  if (clientName) {
    const c = await prisma.client.findFirst({
      where: {
        cabinetId: context.cabinetId,
        OR: [
          { lastName: { contains: clientName, mode: 'insensitive' } },
          { firstName: { contains: clientName, mode: 'insensitive' } },
        ],
      },
      select: { id: true, firstName: true, lastName: true },
    })
    return c
  }
  // Use context clientId if available
  if (context.clientId) {
    const c = await prisma.client.findFirst({
      where: { id: context.clientId, cabinetId: context.cabinetId },
      select: { id: true, firstName: true, lastName: true },
    })
    return c
  }
  return null
}

// ============================================================================
// EXÉCUTION DES OUTILS ÉTENDUS
// ============================================================================

export async function executeExtendedTool(
  toolName: string,
  params: Record<string, unknown>,
  context: ToolContext,
): Promise<ToolResult | null> {
  const prisma = getPrismaClient(context.cabinetId, false)

  switch (toolName) {
    // ── CLIENT ──
    case 'update_client': return execUpdateClient(prisma, params, context)
    case 'archive_client': return execArchiveClient(prisma, params, context)

    // ── PATRIMOINE ──
    case 'create_actif': return execCreateActif(prisma, params, context)
    case 'create_passif': return execCreatePassif(prisma, params, context)

    // ── CONTRATS ──
    case 'create_contrat': return execCreateContrat(prisma, params, context)
    case 'update_contrat': return execUpdateContrat(prisma, params, context)

    // ── DOSSIERS ──
    case 'create_dossier': return execCreateDossier(prisma, params, context)
    case 'update_dossier': return execUpdateDossier(prisma, params, context)
    case 'list_dossiers': return execListDossiers(prisma, params, context)

    // ── DOSSIER BILAN PATRIMONIAL ──
    case 'add_simulation_to_dossier': return execAddSimulationToDossier(prisma, params, context)
    case 'generate_dossier_preconisations': return execGenerateDossierPreconisations(prisma, params, context)
    case 'advance_dossier_etape': return execAdvanceDossierEtape(prisma, params, context)
    case 'generate_bilan_pdf': return execGenerateBilanPdf(prisma, params, context)

    // ── KYC ──
    case 'update_kyc_status': return execUpdateKycStatus(prisma, params, context)

    // ── EMAIL ──
    case 'send_email': return execSendEmail(prisma, params, context)
    case 'draft_email': return execDraftEmail(prisma, params, context)
    case 'create_email_template': return execCreateEmailTemplate(prisma, params, context)
    case 'list_email_templates': return execListEmailTemplates(prisma, params, context)

    // ── AGENDA ──
    case 'update_appointment': return execUpdateAppointment(prisma, params, context)
    case 'cancel_appointment': return execCancelAppointment(prisma, params, context)

    // ── SIMULATIONS ──
    case 'run_simulation': return execRunSimulation(prisma, params, context)
    case 'list_simulations': return execListSimulations(prisma, params, context)

    // ── DOCUMENTS ──
    case 'generate_regulatory_doc': return execGenerateRegulatoryDoc(prisma, params, context)

    // ── COMMERCIAL ──
    case 'create_commercial_action': return execCreateCommercialAction(prisma, params, context)
    case 'create_campaign': return execCreateCampaign(prisma, params, context)
    case 'create_opportunite': return execCreateOpportunite(prisma, params, context)
    case 'list_opportunites': return execListOpportunites(prisma, params, context)

    // ── TACHES AVANCÉES ──
    case 'update_task': return execUpdateTask(prisma, params, context)
    case 'complete_task': return execCompleteTask(prisma, params, context)

    // ── WORKFLOWS ──
    case 'run_workflow': return execRunWorkflow(prisma, params, context)

    default: return null // Not an extended tool
  }
}

// ============================================================================
// IMPLÉMENTATIONS
// ============================================================================

// ── CLIENT ──

async function execUpdateClient(prisma: PrismaInstance, params: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
  const client = await resolveClientId(prisma, context, params.clientId as string, params.clientName as string)
  if (!client) return { success: false, toolName: 'update_client', message: 'Client non trouvé' }

  const updateData: Record<string, unknown> = {}
  if (params.email) updateData.email = params.email
  if (params.phone) updateData.phone = params.phone
  if (params.mobile) updateData.mobile = params.mobile
  if (params.address) updateData.address = params.address
  if (params.city) updateData.city = params.city
  if (params.zipCode) updateData.zipCode = params.zipCode
  if (params.profession) updateData.profession = params.profession
  if (params.maritalStatus) updateData.maritalStatus = params.maritalStatus
  if (params.status) updateData.status = params.status
  if (params.riskProfile) updateData.riskProfile = params.riskProfile
  if (params.notes) updateData.notes = params.notes

  if (Object.keys(updateData).length === 0) {
    return { success: false, toolName: 'update_client', message: 'Aucun champ à mettre à jour' }
  }

  await prisma.client.update({ where: { id: client.id }, data: updateData })
  const fields = Object.keys(updateData).join(', ')

  return {
    success: true,
    toolName: 'update_client',
    data: { clientId: client.id, updatedFields: Object.keys(updateData) },
    message: `Client ${client.firstName} ${client.lastName} mis à jour (${fields})`,
    actionTaken: `Fiche client mise à jour : ${fields}`,
  }
}

async function execArchiveClient(prisma: PrismaInstance, params: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
  const client = await resolveClientId(prisma, context, params.clientId as string, params.clientName as string)
  if (!client) return { success: false, toolName: 'archive_client', message: 'Client non trouvé' }

  await prisma.client.update({
    where: { id: client.id },
    data: { status: 'ARCHIVE' as const },
  })

  return {
    success: true,
    toolName: 'archive_client',
    data: { clientId: client.id },
    message: `Client ${client.firstName} ${client.lastName} archivé`,
    actionTaken: `Client archivé`,
  }
}

// ── PATRIMOINE ──

async function execCreateActif(prisma: PrismaInstance, params: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
  const client = await resolveClientId(prisma, context, params.clientId as string, params.clientName as string)
  if (!client) return { success: false, toolName: 'create_actif', message: 'Client non trouvé' }

  const actif = await prisma.actif.create({
    data: {
      cabinetId: context.cabinetId,
      name: params.name as string,
      type: params.type as import('@prisma/client').ActifType,
      category: params.category as import('@prisma/client').ActifCategory,
      value: params.value as number,
      annualIncome: (params.annualIncome as number) || null,
      description: (params.description as string) || null,
      clients: { create: { clientId: client.id } },
    },
  })

  return {
    success: true,
    toolName: 'create_actif',
    data: { id: actif.id, name: actif.name, value: Number(actif.value) },
    message: `Actif "${actif.name}" (${params.type}) ajouté au patrimoine de ${client.firstName} ${client.lastName} — valeur: ${Number(actif.value).toLocaleString('fr-FR')} €`,
    actionTaken: `Actif créé: ${actif.name}`,
  }
}

async function execCreatePassif(prisma: PrismaInstance, params: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
  const client = await resolveClientId(prisma, context, params.clientId as string, params.clientName as string)
  if (!client) return { success: false, toolName: 'create_passif', message: 'Client non trouvé' }

  const passif = await prisma.passif.create({
    data: {
      cabinet: { connect: { id: context.cabinetId } },
      client: { connect: { id: client.id } },
      name: params.name as string,
      type: params.type as import('@prisma/client').PassifType,
      initialAmount: params.initialAmount as number,
      remainingAmount: params.remainingAmount as number,
      monthlyPayment: (params.monthlyPayment as number) || 0,
      interestRate: (params.interestRate as number) || 0,
      startDate: params.startDate ? new Date(params.startDate as string) : new Date(),
      endDate: params.endDate ? new Date(params.endDate as string) : new Date(Date.now() + 365 * 10 * 86400000),
    },
  })

  return {
    success: true,
    toolName: 'create_passif',
    data: { id: passif.id, name: passif.name },
    message: `Passif "${passif.name}" ajouté — capital restant: ${Number(passif.remainingAmount).toLocaleString('fr-FR')} €`,
    actionTaken: `Passif créé: ${passif.name}`,
  }
}

// ── CONTRATS ──

async function execCreateContrat(prisma: PrismaInstance, params: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
  const client = await resolveClientId(prisma, context, params.clientId as string, params.clientName as string)
  if (!client) return { success: false, toolName: 'create_contrat', message: 'Client non trouvé' }

  const contrat = await prisma.contrat.create({
    data: {
      cabinetId: context.cabinetId,
      clientId: client.id,
      type: params.type as import('@prisma/client').ContratType,
      name: (params.name as string) || `${params.type} - ${params.provider}`,
      provider: params.provider as string,
      contractNumber: (params.contractNumber as string) || null,
      value: (params.value as number) || null,
      premium: (params.premium as number) || null,
      startDate: params.startDate ? new Date(params.startDate as string) : new Date(),
      endDate: params.endDate ? new Date(params.endDate as string) : null,
      status: 'ACTIF' as const,
    },
  })

  return {
    success: true,
    toolName: 'create_contrat',
    data: { id: contrat.id, type: contrat.type, provider: contrat.provider },
    message: `Contrat ${contrat.type} créé chez ${contrat.provider} pour ${client.firstName} ${client.lastName}`,
    actionTaken: `Contrat créé: ${contrat.type} - ${contrat.provider}`,
  }
}

async function execUpdateContrat(prisma: PrismaInstance, params: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
  const contratId = params.contratId as string
  if (!contratId) return { success: false, toolName: 'update_contrat', message: 'ID du contrat requis' }

  const existing = await prisma.contrat.findFirst({
    where: { id: contratId, cabinetId: context.cabinetId },
  })
  if (!existing) return { success: false, toolName: 'update_contrat', message: 'Contrat non trouvé' }

  const updateData: Record<string, unknown> = {}
  if (params.value !== undefined) updateData.value = params.value
  if (params.status) updateData.status = params.status
  if (params.premium !== undefined) updateData.premium = params.premium

  await prisma.contrat.update({ where: { id: contratId }, data: updateData })

  return {
    success: true,
    toolName: 'update_contrat',
    data: { contratId, updatedFields: Object.keys(updateData) },
    message: `Contrat mis à jour (${Object.keys(updateData).join(', ')})`,
    actionTaken: `Contrat mis à jour`,
  }
}

// ── DOSSIERS ──

async function execCreateDossier(prisma: PrismaInstance, params: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
  const client = await resolveClientId(prisma, context, params.clientId as string, params.clientName as string)
  if (!client) return { success: false, toolName: 'create_dossier', message: 'Client non trouvé' }

  // Générer une référence unique
  const count = await prisma.dossier.count({ where: { cabinetId: context.cabinetId } })
  const ref = `DOS-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`

  const dossier = await prisma.dossier.create({
    data: {
      cabinetId: context.cabinetId,
      clientId: client.id,
      conseillerId: context.userId,
      reference: ref,
      nom: params.nom as string,
      description: (params.description as string) || null,
      categorie: ((params.categorie as string) || 'AUTRE') as import('@prisma/client').DossierCategorie,
      type: ((params.type as string) || 'AUTRE') as import('@prisma/client').DossierType,
      priorite: ((params.priorite as string) || 'NORMALE') as import('@prisma/client').DossierPriorite,
      status: 'BROUILLON',
    },
  })

  return {
    success: true,
    toolName: 'create_dossier',
    data: { id: dossier.id, reference: ref, nom: dossier.nom },
    message: `Dossier "${dossier.nom}" (${ref}) créé pour ${client.firstName} ${client.lastName}`,
    actionTaken: `Dossier créé: ${ref}`,
    navigationUrl: `/dashboard/dossiers/${dossier.id}`,
  }
}

async function execUpdateDossier(prisma: PrismaInstance, params: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
  const dossierId = params.dossierId as string
  if (!dossierId) return { success: false, toolName: 'update_dossier', message: 'ID du dossier requis' }

  const existing = await prisma.dossier.findFirst({
    where: { id: dossierId, cabinetId: context.cabinetId },
    select: { id: true, nom: true },
  })
  if (!existing) return { success: false, toolName: 'update_dossier', message: 'Dossier non trouvé' }

  const updateData: Record<string, unknown> = {}
  if (params.status) updateData.status = params.status
  if (params.priorite) updateData.priorite = params.priorite
  if (params.notes) updateData.description = params.notes

  await prisma.dossier.update({ where: { id: dossierId }, data: updateData })

  return {
    success: true,
    toolName: 'update_dossier',
    data: { dossierId },
    message: `Dossier "${existing.nom}" mis à jour`,
    actionTaken: `Dossier mis à jour`,
  }
}

async function execListDossiers(prisma: PrismaInstance, params: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
  const where: Record<string, unknown> = { cabinetId: context.cabinetId }
  if (params.clientId) where.clientId = params.clientId
  if (params.status) where.status = params.status
  if (params.categorie) where.categorie = params.categorie

  const dossiers = await prisma.dossier.findMany({
    where,
    include: {
      client: { select: { firstName: true, lastName: true } },
    },
    orderBy: { updatedAt: 'desc' },
    take: 15,
  })

  const formatted = dossiers.map((d: Record<string, unknown> & { client?: { firstName: string; lastName: string } }) => ({
    id: d.id,
    reference: d.reference,
    nom: d.nom,
    categorie: d.categorie,
    status: d.status,
    priorite: d.priorite,
    client: d.client ? `${d.client.firstName} ${d.client.lastName}` : null,
    updatedAt: d.updatedAt,
  }))

  return {
    success: true,
    toolName: 'list_dossiers',
    data: formatted,
    message: `${formatted.length} dossier(s) trouvé(s)`,
  }
}

// ── KYC ──

async function execUpdateKycStatus(prisma: PrismaInstance, params: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
  const client = await resolveClientId(prisma, context, params.clientId as string, params.clientName as string)
  if (!client) return { success: false, toolName: 'update_kyc_status', message: 'Client non trouvé' }

  const updateData: Record<string, unknown> = {
    kycStatus: params.status as string,
  }
  if (params.nextReviewDate) {
    updateData.kycNextReviewDate = new Date(params.nextReviewDate as string)
  }
  if (params.notes) {
    updateData.kycNotes = params.notes
  }

  await prisma.client.update({ where: { id: client.id }, data: updateData })

  // Créer un KYC check entry pour audit trail
  try {
    await prisma.kYCCheck.create({
      data: {
        cabinet: { connect: { id: context.cabinetId } },
        client: { connect: { id: client.id } },
        type: 'REVUE_PERIODIQUE' as import('@prisma/client').KYCCheckType,
        status: (params.status === 'COMPLET' ? 'TERMINE' : 'EN_ATTENTE') as import('@prisma/client').KYCCheckStatus,
        assignedTo: { connect: { id: context.userId } },
        description: (params.notes as string) || `Statut KYC mis à jour: ${params.status}`,
      },
    })
  } catch {
    // KYCCheck model might have different constraints
  }

  return {
    success: true,
    toolName: 'update_kyc_status',
    data: { clientId: client.id, newStatus: params.status },
    message: `Statut KYC de ${client.firstName} ${client.lastName} → ${params.status}`,
    actionTaken: `KYC mis à jour: ${params.status}`,
  }
}

// ── EMAIL ──

async function execSendEmail(prisma: PrismaInstance, params: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
  const client = await resolveClientId(prisma, context, params.clientId as string, params.clientName as string)

  // Récupérer l'email du client si on a un client
  let toEmail: string[] = []
  if (client) {
    const clientData = await prisma.client.findFirst({
      where: { id: client.id },
      select: { email: true },
    })
    if (clientData?.email) toEmail = [clientData.email]
  }

  if (toEmail.length === 0) {
    return { success: false, toolName: 'send_email', message: 'Aucun destinataire trouvé (client sans email?)' }
  }

  const email = await prisma.email.create({
    data: {
      cabinetId: context.cabinetId,
      senderId: context.userId,
      clientId: client?.id || null,
      subject: params.subject as string,
      body: params.body as string,
      to: toEmail,
      status: 'ENVOYE',
      sentAt: new Date(),
      templateId: (params.templateId as string) || null,
    },
  })

  return {
    success: true,
    toolName: 'send_email',
    data: { id: email.id, to: toEmail, subject: email.subject },
    message: `Email envoyé à ${toEmail.join(', ')} — sujet: "${email.subject}"`,
    actionTaken: `Email envoyé: ${email.subject}`,
  }
}

async function execDraftEmail(prisma: PrismaInstance, params: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
  const client = await resolveClientId(prisma, context, params.clientId as string, params.clientName as string)

  let toEmail: string[] = []
  if (client) {
    const clientData = await prisma.client.findFirst({
      where: { id: client.id },
      select: { email: true },
    })
    if (clientData?.email) toEmail = [clientData.email]
  }

  const email = await prisma.email.create({
    data: {
      cabinetId: context.cabinetId,
      senderId: context.userId,
      clientId: client?.id || null,
      subject: params.subject as string,
      body: params.body as string,
      to: toEmail.length > 0 ? toEmail : [],
      status: 'BROUILLON',
    },
  })

  return {
    success: true,
    toolName: 'draft_email',
    data: { id: email.id, subject: email.subject },
    message: `Brouillon créé — sujet: "${email.subject}"${client ? ` pour ${client.firstName} ${client.lastName}` : ''}`,
    actionTaken: `Brouillon email créé`,
  }
}

async function execCreateEmailTemplate(prisma: PrismaInstance, params: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
  const template = await prisma.emailTemplate.create({
    data: {
      cabinetId: context.cabinetId,
      createdBy: context.userId,
      name: params.name as string,
      category: (params.category as string) || null,
      subject: params.subject as string,
      htmlContent: params.htmlContent as string,
      plainContent: (params.htmlContent as string).replace(/<[^>]*>/g, ''),
      description: (params.description as string) || null,
      variables: extractTemplateVariables(params.htmlContent as string),
    },
  })

  return {
    success: true,
    toolName: 'create_email_template',
    data: { id: template.id, name: template.name },
    message: `Template email "${template.name}" créé (catégorie: ${params.category || 'AUTRE'})`,
    actionTaken: `Template email créé: ${template.name}`,
  }
}

/** Extraire les variables {{xxx}} d'un template */
function extractTemplateVariables(html: string): string[] {
  const matches = html.match(/\{\{(\w+)\}\}/g) || []
  return [...new Set(matches.map(m => m.replace(/[{}]/g, '')))]
}

async function execListEmailTemplates(prisma: PrismaInstance, params: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
  const where: Record<string, unknown> = { cabinetId: context.cabinetId }
  if (params.category) where.category = params.category

  const templates = await prisma.emailTemplate.findMany({
    where,
    select: { id: true, name: true, category: true, subject: true, description: true, variables: true },
    orderBy: { updatedAt: 'desc' },
    take: 20,
  })

  return {
    success: true,
    toolName: 'list_email_templates',
    data: templates,
    message: `${templates.length} template(s) trouvé(s)`,
  }
}

// ── AGENDA ──

async function execUpdateAppointment(prisma: PrismaInstance, params: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
  const appointmentId = params.appointmentId as string
  if (!appointmentId) return { success: false, toolName: 'update_appointment', message: 'ID du RDV requis' }

  const existing = await prisma.rendezVous.findFirst({
    where: { id: appointmentId, cabinetId: context.cabinetId },
    select: { id: true, title: true },
  })
  if (!existing) return { success: false, toolName: 'update_appointment', message: 'RDV non trouvé' }

  const updateData: Record<string, unknown> = {}
  if (params.startDate) updateData.startDate = new Date(params.startDate as string)
  if (params.endDate) updateData.endDate = new Date(params.endDate as string)
  if (params.status) updateData.status = params.status
  if (params.notes) updateData.description = params.notes

  await prisma.rendezVous.update({ where: { id: appointmentId }, data: updateData })

  return {
    success: true,
    toolName: 'update_appointment',
    data: { appointmentId },
    message: `RDV "${existing.title}" mis à jour`,
    actionTaken: `RDV mis à jour`,
  }
}

async function execCancelAppointment(prisma: PrismaInstance, params: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
  const appointmentId = params.appointmentId as string
  if (!appointmentId) return { success: false, toolName: 'cancel_appointment', message: 'ID du RDV requis' }

  const existing = await prisma.rendezVous.findFirst({
    where: { id: appointmentId, cabinetId: context.cabinetId },
    select: { id: true, title: true },
  })
  if (!existing) return { success: false, toolName: 'cancel_appointment', message: 'RDV non trouvé' }

  await prisma.rendezVous.update({
    where: { id: appointmentId },
    data: {
      status: 'ANNULE',
      description: params.reason ? `Annulé: ${params.reason}` : undefined,
    },
  })

  return {
    success: true,
    toolName: 'cancel_appointment',
    data: { appointmentId },
    message: `RDV "${existing.title}" annulé`,
    actionTaken: `RDV annulé`,
  }
}

// ── SIMULATIONS ──

async function execRunSimulation(prisma: PrismaInstance, params: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
  const client = await resolveClientId(prisma, context, params.clientId as string, params.clientName as string)
  if (!client) return { success: false, toolName: 'run_simulation', message: 'Client requis pour une simulation' }

  // Charger les données du client pour la simulation
  const clientData = await prisma.client.findFirst({
    where: { id: client.id, cabinetId: context.cabinetId },
    select: {
      totalActifs: true, totalPassifs: true, patrimoineNet: true,
      totalRevenus: true, totalCharges: true, irTaxRate: true,
      birthDate: true, maritalStatus: true, numberOfChildren: true,
    },
  })

  let simulationParams: Record<string, unknown> = {}
  if (params.parameters) {
    try { simulationParams = JSON.parse(params.parameters as string) } catch { simulationParams = {} }
  }

  // Enrichir avec les données client
  simulationParams.patrimoineNet = clientData?.patrimoineNet ? Number(clientData.patrimoineNet) : 0
  simulationParams.totalRevenus = clientData?.totalRevenus ? Number(clientData.totalRevenus) : 0
  simulationParams.totalCharges = clientData?.totalCharges ? Number(clientData.totalCharges) : 0
  simulationParams.tmi = clientData?.irTaxRate ? Number(clientData.irTaxRate) : null
  simulationParams.age = clientData?.birthDate ? Math.floor((Date.now() - new Date(clientData.birthDate as unknown as string).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null
  simulationParams.situationFamiliale = clientData?.maritalStatus
  simulationParams.enfants = clientData?.numberOfChildren

  // Calculer des résultats basiques selon le type
  const results = computeSimulationResults(params.type as string, simulationParams)

  const simulation = await prisma.simulation.create({
    data: {
      cabinetId: context.cabinetId,
      clientId: client.id,
      createdById: context.userId,
      type: params.type as import('@prisma/client').SimulationType,
      name: params.name as string,
      description: `Simulation ${params.type} pour ${client.firstName} ${client.lastName}`,
      parameters: simulationParams as import('@prisma/client').Prisma.InputJsonValue,
      results: results as import('@prisma/client').Prisma.InputJsonValue,
      status: 'TERMINEE' as import('@prisma/client').SimulationStatus,
    },
  })

  return {
    success: true,
    toolName: 'run_simulation',
    data: { id: simulation.id, type: params.type, results },
    message: `Simulation "${params.name}" (${params.type}) réalisée pour ${client.firstName} ${client.lastName}`,
    actionTaken: `Simulation exécutée`,
    navigationUrl: `/dashboard/clients/${client.id}?tab=simulations`,
  }
}

// Barème IR 2025 (CGI art. 197) pour calculs agent
const BAREME_IR_AGENT = [
  { min: 0, max: 11497, taux: 0 },
  { min: 11497, max: 29315, taux: 11 },
  { min: 29315, max: 83823, taux: 30 },
  { min: 83823, max: 180294, taux: 41 },
  { min: 180294, max: Infinity, taux: 45 },
]

// Barème droits de succession en ligne directe
const BAREME_SUCC_AGENT = [
  { min: 0, max: 8072, taux: 5 },
  { min: 8072, max: 12109, taux: 10 },
  { min: 12109, max: 15932, taux: 15 },
  { min: 15932, max: 552324, taux: 20 },
  { min: 552324, max: 902838, taux: 30 },
  { min: 902838, max: 1805677, taux: 40 },
  { min: 1805677, max: Infinity, taux: 45 },
]

function calculerIRBareme(revenuImposable: number, parts: number): { impot: number; tmi: number; tauxEffectif: number } {
  const quotient = revenuImposable / parts
  let irPart = 0, tmi = 0
  for (const t of BAREME_IR_AGENT) {
    if (quotient > t.min) {
      irPart += (Math.min(quotient, t.max) - t.min) * (t.taux / 100)
      if (t.taux > tmi) tmi = t.taux
    }
  }
  const impot = Math.round(irPart * parts)
  return { impot, tmi, tauxEffectif: revenuImposable > 0 ? Math.round(impot / revenuImposable * 10000) / 100 : 0 }
}

function calculerDroitsSuccBareme(taxable: number): number {
  let droits = 0
  for (const t of BAREME_SUCC_AGENT) {
    if (taxable > t.min) {
      droits += (Math.min(taxable, t.max) - t.min) * (t.taux / 100)
    }
  }
  return Math.round(droits)
}

/** Calcule les résultats de simulation enrichis */
function computeSimulationResults(type: string, params: Record<string, unknown>): Record<string, unknown> {
  const revenus = (params.totalRevenus as number) || 0
  const charges = (params.totalCharges as number) || 0
  const patrimoine = (params.patrimoineNet as number) || 0
  const tmiInput = (params.tmi as number) || 0
  const age = (params.age as number) || 45
  const enfants = (params.enfants as number) || 0
  const situation = (params.situationFamiliale as string) || ''

  switch (type) {
    case 'OPTIMISATION_FISCALE': {
      const isCouple = situation.toLowerCase().includes('marié') || situation.toLowerCase().includes('pacsé') || situation === 'MARIE' || situation === 'PACSE'
      let parts = isCouple ? 2 : 1
      if (enfants >= 1) parts += 0.5
      if (enfants >= 2) parts += 0.5
      if (enfants >= 3) parts += (enfants - 2)

      const abattement = Math.min(Math.max(revenus * 0.10, 495), 14171)
      const revenuImposable = Math.max(0, revenus - abattement)
      const ir = calculerIRBareme(revenuImposable, parts)

      const plafondPER = Math.min(revenus * 0.10, 35194)
      const economieIR = Math.round(plafondPER * (ir.tmi / 100))
      const irApresOptimisation = calculerIRBareme(Math.max(0, revenuImposable - plafondPER), parts)

      return {
        revenuBrut: revenus,
        abattement10pct: Math.round(abattement),
        revenuImposable: Math.round(revenuImposable),
        nombreParts: parts,
        impotAvantOptimisation: ir.impot,
        tmi: ir.tmi,
        tauxEffectif: ir.tauxEffectif,
        plafondPER,
        economieIR_PER: economieIR,
        impotApresOptimisation: irApresOptimisation.impot,
        montant: ir.impot,
        recommandations: [
          `IR actuel : ${ir.impot.toLocaleString('fr-FR')} € (TMI ${ir.tmi}%, taux effectif ${ir.tauxEffectif}%)`,
          `Versement PER max : ${plafondPER.toLocaleString('fr-FR')} € → économie : ${economieIR.toLocaleString('fr-FR')} €`,
          `IR après optimisation PER : ${irApresOptimisation.impot.toLocaleString('fr-FR')} €`,
          patrimoine > RULES.ifi.seuil_assujettissement ? '⚠️ Seuil IFI franchi — analyser patrimoine immobilier' : '',
        ].filter(Boolean),
      }
    }
    case 'RETRAITE': {
      const anneesRetraite = Math.max(0, 64 - age)
      const trimestresValides = Math.max(0, (age - 22) * 4)
      const trimestresRequis = 172
      const pensionBase = revenus * 0.50 * Math.min(1, trimestresValides / trimestresRequis) / 12
      const pensionCompl = revenus * 0.25 / 12
      const pensionTotale = Math.round(pensionBase + pensionCompl)
      const tauxRemplacement = revenus > 0 ? Math.round(pensionTotale / (revenus / 12) * 100) : 0
      const gapMensuel = Math.max(0, Math.round(revenus / 12 * 0.8 - pensionTotale))
      const capitalNecessaire = gapMensuel > 0 ? Math.round(gapMensuel * 12 / 0.04) : 0

      const scenarios = [2, 4, 6].map(rendement => {
        const capitalFutur = Math.round(patrimoine * 0.3 * Math.pow(1 + rendement / 100, anneesRetraite))
        return { rendement: `${rendement}%`, capitalProjeté: capitalFutur, revenuMensuel: Math.round(capitalFutur * 0.04 / 12) }
      })

      return {
        ageActuel: age,
        ageDepart: 64,
        anneesAvantRetraite: anneesRetraite,
        trimestresValides,
        trimestresRequis,
        pensionBaseMensuelle: Math.round(pensionBase),
        pensionComplementaireMensuelle: Math.round(pensionCompl),
        pensionTotaleMensuelle: pensionTotale,
        tauxRemplacement: `${tauxRemplacement}%`,
        gapMensuel,
        capitalNecessaire,
        patrimoineActuel: patrimoine,
        scenarios,
        montant: capitalNecessaire,
        recommandations: [
          `Pension estimée : ${pensionTotale.toLocaleString('fr-FR')} €/mois (${tauxRemplacement}% de remplacement)`,
          gapMensuel > 0 ? `Gap mensuel : ${gapMensuel.toLocaleString('fr-FR')} € → capital nécessaire : ${capitalNecessaire.toLocaleString('fr-FR')} €` : '✅ Pension couvre 80% des revenus',
          `Trimestres validés : ${trimestresValides}/${trimestresRequis}`,
          'Véhicules recommandés : PER (déduction fiscale), AV (souplesse), PEA (performance)',
        ],
      }
    }
    case 'TRANSMISSION_PATRIMOINE': {
      const abattementParEnfant = 100000
      const totalAbattement = enfants * abattementParEnfant
      let droitsTotal = 0
      const detailHeritiers = []

      for (let i = 0; i < Math.max(1, enfants); i++) {
        const partBrute = patrimoine / Math.max(1, enfants)
        const taxable = Math.max(0, partBrute - abattementParEnfant)
        const droits = calculerDroitsSuccBareme(taxable)
        droitsTotal += droits
        detailHeritiers.push({ heritier: `Enfant ${i + 1}`, partBrute: Math.round(partBrute), abattement: abattementParEnfant, taxable: Math.round(taxable), droits })
      }

      const tauxEffectif = patrimoine > 0 ? Math.round(droitsTotal / patrimoine * 10000) / 100 : 0
      const abattementAV = enfants > 0 ? enfants * 152500 : 152500
      const economieAV = Math.round(Math.min(abattementAV * 0.20, droitsTotal * 0.5))

      return {
        patrimoineTransmissible: patrimoine,
        nombreHeritiers: enfants,
        abattementLigneDirecte: totalAbattement,
        droitsEstimes: droitsTotal,
        tauxEffectif: `${tauxEffectif}%`,
        detailParHeritier: detailHeritiers,
        abattementAssuranceVie: abattementAV,
        economieViaAV: economieAV,
        montant: droitsTotal,
        recommandations: [
          `Droits de succession : ${droitsTotal.toLocaleString('fr-FR')} € (taux effectif ${tauxEffectif}%)`,
          `Abattement total : ${totalAbattement.toLocaleString('fr-FR')} € (${enfants} enfant${enfants > 1 ? 's' : ''} × 100 000 €)`,
          `Assurance-vie : abattement supplémentaire ${abattementAV.toLocaleString('fr-FR')} € (art. 990I CGI)`,
          'Stratégies : donation-partage, démembrement, AV avant 70 ans',
        ],
      }
    }
    case 'ANALYSE_BUDGET': {
      const revenusMensuels = revenus / 12
      const chargesMensuelles = charges
      const solde = revenusMensuels - chargesMensuelles
      const tauxEpargne = revenusMensuels > 0 ? (solde / revenusMensuels * 100) : 0
      const tauxEndettement = revenusMensuels > 0 ? (chargesMensuelles / revenusMensuels * 100) : 0
      const scoreSante = tauxEndettement > 50 ? 'CRITIQUE' : tauxEndettement > 33 ? 'TENDU' : tauxEndettement > 20 ? 'CORRECT' : 'SAIN'

      return {
        revenusMensuels: Math.round(revenusMensuels),
        chargesMensuelles: Math.round(chargesMensuelles),
        soldeMensuel: Math.round(solde),
        tauxEpargne: `${tauxEpargne.toFixed(1)}%`,
        tauxEndettement: `${tauxEndettement.toFixed(1)}%`,
        scoreSante,
        capaciteEpargneAnnuelle: Math.round(Math.max(0, solde * 12)),
        montant: Math.round(solde),
        recommandations: [
          `Score santé : ${scoreSante} — taux d'endettement ${tauxEndettement.toFixed(1)}%`,
          `Capacité d'épargne : ${Math.round(Math.max(0, solde)).toLocaleString('fr-FR')} €/mois (${tauxEpargne.toFixed(1)}%)`,
          tauxEndettement > 33 ? '⚠️ Restructurer l\'endettement en priorité' : '✅ Budget maîtrisé',
        ],
      }
    }
    case 'CREDIT_IMMOBILIER': {
      const revenusMensuels = revenus / 12
      const mensualitesActuelles = charges
      const capaciteEndettement = revenusMensuels * 0.33
      const capaciteResiduelle = Math.max(0, capaciteEndettement - mensualitesActuelles)
      const taux = 3.5

      const enveloppes = [10, 15, 20, 25].map(duree => {
        const n = duree * 12
        const r = taux / 100 / 12
        const montantMax = r > 0 ? Math.round(capaciteResiduelle * (1 - Math.pow(1 + r, -n)) / r) : 0
        return { duree: `${duree} ans`, mensualite: Math.round(capaciteResiduelle), montantMax, taux: `${taux}%` }
      })

      return {
        revenusMensuels: Math.round(revenusMensuels),
        mensualitesActuelles: Math.round(mensualitesActuelles),
        tauxEndettementActuel: revenusMensuels > 0 ? `${(mensualitesActuelles / revenusMensuels * 100).toFixed(1)}%` : '0%',
        capaciteResiduelle: Math.round(capaciteResiduelle),
        enveloppes,
        capaciteEmprunt: enveloppes[2]?.montantMax || 0,
        montant: enveloppes[2]?.montantMax || 0,
        recommandations: [
          `Capacité d'emprunt résiduelle : ${Math.round(capaciteResiduelle).toLocaleString('fr-FR')} €/mois`,
          `Emprunt max 20 ans à ${taux}% : ${(enveloppes[2]?.montantMax || 0).toLocaleString('fr-FR')} €`,
        ],
      }
    }
    case 'ASSURANCE_VIE': {
      const versementInitial = (params.versementInitial as number) || 10000
      const versementMensuel = (params.versementMensuel as number) || 200
      const rendement = (params.rendement as number) || 3
      const duree = (params.duree as number) || 10

      let capital = versementInitial
      const evolution = []
      for (let a = 1; a <= duree; a++) {
        capital = capital * (1 + rendement / 100) + versementMensuel * 12
        if (a % 2 === 0 || a === duree) evolution.push({ annee: a, capital: Math.round(capital) })
      }

      const totalVerse = versementInitial + versementMensuel * 12 * duree
      const plusValue = Math.round(capital - totalVerse)
      const fiscaliteApres8ans = Math.round(plusValue * RULES.ps.total) // PS uniquement après 8 ans + abattement

      return {
        versementInitial,
        versementMensuel,
        rendementAnnuel: `${rendement}%`,
        duree: `${duree} ans`,
        capitalFinal: Math.round(capital),
        totalVerse,
        plusValue,
        fiscaliteApres8ans,
        evolution,
        montant: Math.round(capital),
        recommandations: [
          `Capital projeté à ${duree} ans : ${Math.round(capital).toLocaleString('fr-FR')} € (dont ${plusValue.toLocaleString('fr-FR')} € de plus-value)`,
          `Fiscalité après 8 ans : abattement 4 600 €/9 200 € couple, puis 7,5% + PS (17,2%)`,
          'Avantage successoral : 152 500 €/bénéficiaire hors succession (art. 990I)',
        ],
      }
    }
    case 'PROJECTION_INVESTISSEMENT': {
      const capitalInitial = (params.capitalInitial as number) || patrimoine * 0.2
      const versementMensuel = (params.versementMensuel as number) || 500
      const duree = (params.duree as number) || 15

      const scenarios = [
        { label: 'Prudent', rendement: 2 },
        { label: 'Équilibré', rendement: 4.5 },
        { label: 'Dynamique', rendement: 7 },
      ].map(s => {
        let cap = capitalInitial
        for (let a = 0; a < duree; a++) cap = cap * (1 + s.rendement / 100) + versementMensuel * 12
        return { ...s, rendement: `${s.rendement}%`, capitalFinal: Math.round(cap), totalVerse: capitalInitial + versementMensuel * 12 * duree, plusValue: Math.round(cap - capitalInitial - versementMensuel * 12 * duree) }
      })

      return {
        capitalInitial,
        versementMensuel,
        duree: `${duree} ans`,
        scenarios,
        montant: scenarios[1]?.capitalFinal || 0,
        recommandations: [
          `Scénario équilibré (4,5%) : ${(scenarios[1]?.capitalFinal || 0).toLocaleString('fr-FR')} € en ${duree} ans`,
          `Total versé : ${(capitalInitial + versementMensuel * 12 * duree).toLocaleString('fr-FR')} €`,
        ],
      }
    }
    default:
      return { patrimoine, revenus, charges, message: 'Simulation générique — résultats bruts' }
  }
}

async function execListSimulations(prisma: PrismaInstance, params: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
  const client = await resolveClientId(prisma, context, params.clientId as string, params.clientName as string)

  const where: Record<string, unknown> = { cabinetId: context.cabinetId }
  if (client) where.clientId = client.id
  if (params.type) where.type = params.type

  const simulations = await prisma.simulation.findMany({
    where,
    include: { client: { select: { firstName: true, lastName: true } } },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  const formatted = simulations.map((s: Record<string, unknown> & { client?: { firstName: string; lastName: string } }) => ({
    id: s.id,
    type: s.type,
    name: s.name,
    status: s.status,
    client: s.client ? `${s.client.firstName} ${s.client.lastName}` : null,
    createdAt: s.createdAt,
  }))

  return {
    success: true,
    toolName: 'list_simulations',
    data: formatted,
    message: `${formatted.length} simulation(s) trouvée(s)`,
  }
}

// ── DOCUMENTS RÉGLEMENTAIRES ──

async function execGenerateRegulatoryDoc(prisma: PrismaInstance, params: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
  const client = await resolveClientId(prisma, context, params.clientId as string, params.clientName as string)
  if (!client) return { success: false, toolName: 'generate_regulatory_doc', message: 'Client requis' }

  const docType = params.documentType as string

  // Chercher un template actif
  const template = await prisma.regulatoryDocumentTemplate.findFirst({
    where: { cabinetId: context.cabinetId, documentType: docType as import('@prisma/client').RegulatoryDocumentType, isActive: true },
    select: { id: true, name: true, content: true, mandatorySections: true },
  })

  // Charger les données du client pour remplir le document
  const clientData = await prisma.client.findFirst({
    where: { id: client.id },
    select: {
      firstName: true, lastName: true, email: true, phone: true,
      birthDate: true, address: true,
      maritalStatus: true, profession: true, patrimoineNet: true,
      riskProfile: true, investmentHorizon: true,
    },
  })

  if (!template) {
    return {
      success: false, toolName: 'generate_regulatory_doc',
      message: `Aucun template actif trouvé pour le type "${docType}". Veuillez d'abord créer un template.`,
    }
  }

  // Créer le document généré
  const fileName = `${docType}_${client.lastName}_${client.firstName}_${Date.now()}.pdf`
  const doc = await prisma.regulatoryGeneratedDocument.create({
    data: {
      cabinetId: context.cabinetId,
      clientId: client.id,
      templateId: template.id,
      documentType: docType as import('@prisma/client').RegulatoryDocumentType,
      status: 'DRAFT' as import('@prisma/client').RegulatoryDocumentStatus,
      format: 'PDF' as import('@prisma/client').RegulatoryDocumentFormat,
      generatedById: context.userId,
      fileName,
      fileUrl: `/documents/regulatory/${fileName}`,
      generatedData: {
        clientInfo: clientData,
        generatedAt: new Date().toISOString(),
        templateUsed: template.name,
        sections: template.mandatorySections || [],
      },
    },
  })

  return {
    success: true,
    toolName: 'generate_regulatory_doc',
    data: { id: doc.id, documentType: docType, clientName: `${client.firstName} ${client.lastName}` },
    message: `Document ${docType} généré pour ${client.firstName} ${client.lastName}`,
    actionTaken: `Document réglementaire ${docType} généré`,
    navigationUrl: `/dashboard/conformite/documents/${doc.id}`,
  }
}

// ── COMMERCIAL ──

async function execCreateCommercialAction(prisma: PrismaInstance, params: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
  const channels = params.channels ? (params.channels as string).split(',').map(c => c.trim()) : ['email']

  const action = await prisma.commercialAction.create({
    data: {
      cabinetId: context.cabinetId,
      createdBy: context.userId,
      title: params.title as string,
      objective: (params.objective as string) || null,
      segmentLabel: (params.segmentLabel as string) || null,
      channels,
      scheduledAt: params.scheduledAt ? new Date(params.scheduledAt as string) : null,
      notes: (params.notes as string) || null,
      status: params.scheduledAt ? 'PLANIFIEE' as const : 'BROUILLON' as const,
    },
  })

  return {
    success: true,
    toolName: 'create_commercial_action',
    data: { id: action.id, title: action.title },
    message: `Action commerciale "${action.title}" créée (canaux: ${channels.join(', ')})`,
    actionTaken: `Action commerciale créée`,
  }
}

async function execCreateCampaign(prisma: PrismaInstance, params: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
  const campaign = await prisma.campaign.create({
    data: {
      cabinetId: context.cabinetId,
      createdBy: context.userId,
      name: params.name as string,
      type: ((params.type as string) || 'EMAIL') as import('@prisma/client').CampaignType,
      description: (params.description as string) || null,
      subject: (params.subject as string) || null,
      htmlContent: (params.htmlContent as string) || null,
      status: 'BROUILLON' as const,
    },
  })

  return {
    success: true,
    toolName: 'create_campaign',
    data: { id: campaign.id, name: campaign.name },
    message: `Campagne "${campaign.name}" créée en brouillon`,
    actionTaken: `Campagne créée`,
  }
}

async function execCreateOpportunite(prisma: PrismaInstance, params: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
  const client = await resolveClientId(prisma, context, params.clientId as string, params.clientName as string)
  if (!client) return { success: false, toolName: 'create_opportunite', message: 'Client requis' }

  const opp = await prisma.opportunite.create({
    data: {
      cabinetId: context.cabinetId,
      conseillerId: context.userId,
      clientId: client.id,
      type: params.type as import('@prisma/client').OpportuniteType,
      name: params.name as string,
      estimatedValue: (params.estimatedValue as number) || null,
      priority: ((params.priority as string) || 'MOYENNE') as import('@prisma/client').OpportunitePriority,
      status: 'DETECTEE' as const,
    },
  })

  return {
    success: true,
    toolName: 'create_opportunite',
    data: { id: opp.id, name: opp.name, type: opp.type },
    message: `Opportunité "${opp.name}" (${opp.type}) créée pour ${client.firstName} ${client.lastName}`,
    actionTaken: `Opportunité créée`,
  }
}

async function execListOpportunites(prisma: PrismaInstance, params: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
  const where: Record<string, unknown> = { cabinetId: context.cabinetId }
  if (params.clientId) where.clientId = params.clientId
  if (params.status) where.status = params.status

  const opps = await prisma.opportunite.findMany({
    where,
    include: { client: { select: { firstName: true, lastName: true } } },
    orderBy: { createdAt: 'desc' },
    take: 15,
  })

  const formatted = opps.map((o: Record<string, unknown> & { client?: { firstName: string; lastName: string } }) => ({
    id: o.id,
    name: o.name,
    type: o.type,
    status: o.status,
    priority: o.priority,
    estimatedValue: o.estimatedValue ? Number(o.estimatedValue) : null,
    client: o.client ? `${o.client.firstName} ${o.client.lastName}` : null,
  }))

  return {
    success: true,
    toolName: 'list_opportunites',
    data: formatted,
    message: `${formatted.length} opportunité(s) trouvée(s)`,
  }
}

// ── TACHES AVANCÉES ──

async function execUpdateTask(prisma: PrismaInstance, params: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
  const taskId = params.taskId as string
  if (!taskId) return { success: false, toolName: 'update_task', message: 'ID de tâche requis' }

  const existing = await prisma.tache.findFirst({
    where: { id: taskId, cabinetId: context.cabinetId },
    select: { id: true, title: true },
  })
  if (!existing) return { success: false, toolName: 'update_task', message: 'Tâche non trouvée' }

  const updateData: Record<string, unknown> = {}
  if (params.status) updateData.status = params.status
  if (params.priority) updateData.priority = params.priority
  if (params.dueDate) updateData.dueDate = new Date(params.dueDate as string)
  if (params.notes) updateData.description = params.notes

  await prisma.tache.update({ where: { id: taskId }, data: updateData })

  return {
    success: true,
    toolName: 'update_task',
    data: { taskId },
    message: `Tâche "${existing.title}" mise à jour`,
    actionTaken: `Tâche mise à jour`,
  }
}

async function execCompleteTask(prisma: PrismaInstance, params: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
  const taskId = params.taskId as string
  if (!taskId) return { success: false, toolName: 'complete_task', message: 'ID de tâche requis' }

  const existing = await prisma.tache.findFirst({
    where: { id: taskId, cabinetId: context.cabinetId },
    select: { id: true, title: true },
  })
  if (!existing) return { success: false, toolName: 'complete_task', message: 'Tâche non trouvée' }

  await prisma.tache.update({
    where: { id: taskId },
    data: { status: 'TERMINE', completedAt: new Date() },
  })

  return {
    success: true,
    toolName: 'complete_task',
    data: { taskId },
    message: `Tâche "${existing.title}" marquée comme terminée ✅`,
    actionTaken: `Tâche terminée`,
  }
}

// ── DOSSIER BILAN PATRIMONIAL ──

async function execAddSimulationToDossier(prisma: PrismaInstance, params: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
  const dossierId = params.dossierId as string
  if (!dossierId) return { success: false, toolName: 'add_simulation_to_dossier', message: 'ID du dossier requis' }

  const dossier = await prisma.dossier.findFirst({
    where: { id: dossierId, cabinetId: context.cabinetId },
    select: { id: true, nom: true },
  })
  if (!dossier) return { success: false, toolName: 'add_simulation_to_dossier', message: 'Dossier non trouvé' }

  let parametres: Record<string, unknown> = {}
  let resultats: Record<string, unknown> = {}
  if (params.parametres) {
    try { parametres = JSON.parse(params.parametres as string) } catch { parametres = {} }
  }
  if (params.resultats) {
    try { resultats = JSON.parse(params.resultats as string) } catch { resultats = {} }
  }

  const count = await prisma.dossierSimulation.count({ where: { dossierId } })

  const simulation = await prisma.dossierSimulation.create({
    data: {
      dossierId,
      simulateurType: params.simulateurType as never,
      nom: params.nom as string,
      parametres: parametres as import('@prisma/client').Prisma.InputJsonValue,
      resultats: resultats as import('@prisma/client').Prisma.InputJsonValue,
      selectionne: true,
      ordre: count,
    },
  })

  return {
    success: true,
    toolName: 'add_simulation_to_dossier',
    data: { id: simulation.id, dossierId, type: params.simulateurType },
    message: `Simulation "${params.nom}" ajoutée au dossier "${dossier.nom}"`,
    actionTaken: `Simulation ajoutée au dossier`,
    navigationUrl: `/dashboard/dossiers/${dossierId}`,
  }
}

async function execGenerateDossierPreconisations(prisma: PrismaInstance, params: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
  const dossierId = params.dossierId as string
  if (!dossierId) return { success: false, toolName: 'generate_dossier_preconisations', message: 'ID du dossier requis' }

  const dossier = await prisma.dossier.findFirst({
    where: { id: dossierId, cabinetId: context.cabinetId },
    include: { client: true, simulations: true, preconisations: true },
  }) as Record<string, unknown> & { client: Record<string, unknown>; simulations: unknown[]; preconisations: unknown[] } | null
  if (!dossier) return { success: false, toolName: 'generate_dossier_preconisations', message: 'Dossier non trouvé' }

  // Fetch client assets/liabilities
  const clientActifs = await prisma.clientActif.findMany({
    where: { clientId: dossier.client.id as string },
    include: { actif: true },
  })
  const actifs = clientActifs.map((ca: Record<string, unknown> & { actif: Record<string, unknown> }) => ca.actif)
  const passifs = await prisma.passif.findMany({ where: { clientId: dossier.client.id as string } })
  const contrats = await prisma.contrat.findMany({ where: { clientId: dossier.client.id as string } })

  const client = dossier.client as Record<string, unknown>
  const totalImmo = actifs.filter((a: Record<string, unknown>) => a.category === 'IMMOBILIER').reduce((s: number, a: Record<string, unknown>) => s + Number(a.value || 0), 0)
  const totalFin = actifs.filter((a: Record<string, unknown>) => ['EPARGNE', 'PLACEMENT', 'RETRAITE', 'FINANCIER'].includes(a.category as string)).reduce((s: number, a: Record<string, unknown>) => s + Number(a.value || 0), 0)
  const totalActifs = totalImmo + totalFin
  const totalPassifs = (passifs as Record<string, unknown>[]).reduce((s: number, p: Record<string, unknown>) => s + Number(p.remainingAmount || 0), 0)
  const patrimoineNet = totalActifs - totalPassifs
  const revenus = Number(client.annualIncome || 0)
  const revenusMensuels = revenus / 12
  const mensualitesCredits = (passifs as Record<string, unknown>[]).reduce((s: number, p: Record<string, unknown>) => s + Number(p.monthlyPayment || 0), 0)
  const tauxEndettement = revenusMensuels > 0 ? (mensualitesCredits / revenusMensuels) * 100 : 0
  const tauxImmo = totalActifs > 0 ? (totalImmo / totalActifs) * 100 : 0

  let age = 0
  if (client.birthDate) {
    const birth = new Date(client.birthDate as string)
    const today = new Date()
    age = today.getFullYear() - birth.getFullYear()
  }
  const enfants = (client.numberOfChildren as number) || 0

  // Generate preconisations
  const precos: Array<{ titre: string; description: string; argumentaire: string; montant: number | null; priorite: number }> = []
  let ordre = dossier.preconisations.length

  if (tauxEndettement > 40) {
    precos.push({ titre: 'Restructuration endettement', description: `Taux d'endettement de ${tauxEndettement.toFixed(1)}% — restructuration recommandée.`, argumentaire: 'Regroupement de crédits ou renégociation pour ramener sous 33%.', montant: null, priorite: 1 })
  }

  if (revenus > 40000 && age >= 30) {
    const tmi = revenus > 168994 ? 45 : revenus > 82341 ? 41 : revenus > 29373 ? 30 : 11
    const plafondPER = Math.min(revenus * 0.10, 35194)
    const eco = plafondPER * (tmi / 100)
    precos.push({ titre: 'Versements PER', description: `Versement PER déductible jusqu'à ${Math.round(plafondPER)} € → économie IR de ${Math.round(eco)} €/an (TMI ${tmi}%).`, argumentaire: 'Art. 163 quatervicies CGI. Capital bloqué jusqu\'à la retraite sauf cas légaux.', montant: plafondPER, priorite: age >= 50 ? 1 : 2 })
  }

  if (tauxImmo > 70 && totalActifs > 100000) {
    precos.push({ titre: 'Diversification financière', description: `Patrimoine concentré à ${tauxImmo.toFixed(0)}% sur l'immobilier. Diversifier vers AV, PEA.`, argumentaire: 'Réduire le risque de concentration et améliorer la liquidité.', montant: null, priorite: 2 })
  }

  if (patrimoineNet > 200000 && enfants > 0) {
    const droitsEstimes = Math.max(0, patrimoineNet - enfants * 100000) * 0.20
    precos.push({ titre: 'Stratégie de transmission', description: `Droits estimés : ${Math.round(droitsEstimes)} €. Donations et assurance-vie recommandées.`, argumentaire: 'Abattement 100 000 €/enfant renouvelable tous les 15 ans. AV : 152 500 €/bénéficiaire (art. 990I).', montant: droitsEstimes, priorite: age >= 60 ? 1 : 3 })
  }

  if (enfants > 0 && !(contrats as Record<string, unknown>[]).some((c: Record<string, unknown>) => c.type && ['PREVOYANCE', 'DECES', 'INVALIDITE'].includes(c.type as string))) {
    precos.push({ titre: 'Prévoyance familiale', description: `Aucun contrat prévoyance identifié. Protection indispensable avec ${enfants} enfant(s).`, argumentaire: 'Capital décès recommandé : 3-5 ans de revenus. Couverture invalidité/incapacité.', montant: null, priorite: 2 })
  }

  // Save to DB
  for (const p of precos) {
    await prisma.dossierPreconisation.create({
      data: { dossierId, titre: p.titre, description: p.description, argumentaire: p.argumentaire, montant: p.montant, priorite: p.priorite, ordre: ordre++, statut: 'PROPOSEE' },
    })
  }

  return {
    success: true,
    toolName: 'generate_dossier_preconisations',
    data: { generated: precos.length, dossierId },
    message: `${precos.length} préconisation(s) générées pour le dossier "${(dossier as Record<string, unknown>).nom}"`,
    actionTaken: `Préconisations IA générées`,
    navigationUrl: `/dashboard/dossiers/${dossierId}`,
  }
}

async function execAdvanceDossierEtape(prisma: PrismaInstance, params: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
  const dossierId = params.dossierId as string
  const etape = params.etape as string
  if (!dossierId || !etape) return { success: false, toolName: 'advance_dossier_etape', message: 'ID du dossier et étape requis' }

  const dossier = await prisma.dossier.findFirst({
    where: { id: dossierId, cabinetId: context.cabinetId },
    select: { id: true, nom: true, etapeActuelle: true },
  })
  if (!dossier) return { success: false, toolName: 'advance_dossier_etape', message: 'Dossier non trouvé' }

  const updateData: Record<string, unknown> = { etapeActuelle: etape }
  if (etape === 'CLOTURE') updateData.status = 'VALIDE'
  if (etape === 'ANALYSE' && (dossier as Record<string, unknown>).etapeActuelle === 'COLLECTE') updateData.status = 'EN_COURS'

  await prisma.dossier.update({ where: { id: dossierId }, data: updateData })

  return {
    success: true,
    toolName: 'advance_dossier_etape',
    data: { dossierId, etape },
    message: `Dossier "${dossier.nom}" avancé à l'étape ${etape}`,
    actionTaken: `Étape dossier → ${etape}`,
    navigationUrl: `/dashboard/dossiers/${dossierId}`,
  }
}

async function execGenerateBilanPdf(prisma: PrismaInstance, params: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
  const dossierId = params.dossierId as string
  if (!dossierId) return { success: false, toolName: 'generate_bilan_pdf', message: 'ID du dossier requis' }

  const dossier = await prisma.dossier.findFirst({
    where: { id: dossierId, cabinetId: context.cabinetId },
    include: { client: { select: { firstName: true, lastName: true } } },
  })
  if (!dossier) return { success: false, toolName: 'generate_bilan_pdf', message: 'Dossier non trouvé' }

  return {
    success: true,
    toolName: 'generate_bilan_pdf',
    data: { dossierId, generateUrl: `/api/advisor/dossiers/${dossierId}/generate-pdf-html` },
    message: `Le PDF du bilan patrimonial est prêt à être généré. Le conseiller peut le télécharger depuis la page du dossier, onglet Validation.`,
    actionTaken: `PDF bilan prêt`,
    navigationUrl: `/dashboard/dossiers/${dossierId}`,
  }
}

// ── WORKFLOWS ──

async function execRunWorkflow(prisma: PrismaInstance, params: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
  const workflowName = params.workflow as string
  const clientId = params.clientId as string | undefined
  const clientName = params.clientName as string | undefined

  const client = await resolveClientId(prisma, context, clientId, clientName)

  let extraParams: Record<string, unknown> = {}
  if (params.params) {
    try { extraParams = JSON.parse(params.params as string) } catch { extraParams = {} }
  }

  return executeWorkflow(workflowName, prisma, context, client, extraParams)
}
