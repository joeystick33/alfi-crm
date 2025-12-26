/**
 * Types TypeScript pour le module Conformité
 * 
 * Ce fichier contient tous les types, interfaces et constantes
 * pour la gestion de la conformité CGP (KYC, Alertes, Contrôles, Réclamations)
 * 
 * @module lib/compliance/types
 */

// ============================================
// Document KYC Types
// ============================================

/**
 * Types de documents KYC supportés
 * Alignés avec l'enum KYCDocumentType de Prisma
 */
export const KYC_DOCUMENT_TYPES = [
  'IDENTITE',
  'JUSTIFICATIF_DOMICILE',
  'AVIS_IMPOSITION',
  'RIB_BANCAIRE',
  'JUSTIFICATIF_PATRIMOINE',
  'ORIGINE_FONDS',
  'AUTRE',
] as const;

export type KYCDocumentType = typeof KYC_DOCUMENT_TYPES[number];

/**
 * Statuts possibles d'un document KYC
 * Alignés avec l'enum KYCDocStatus de Prisma
 */
export const KYC_DOCUMENT_STATUS = [
  'EN_ATTENTE',
  'VALIDE',
  'REJETE',
  'EXPIRE',
] as const;

export type KYCDocumentStatus = typeof KYC_DOCUMENT_STATUS[number];

/**
 * Règles d'expiration par type de document (en jours)
 * 0 = pas d'expiration
 */
export const DOCUMENT_EXPIRATION_RULES: Record<KYCDocumentType, number> = {
  IDENTITE: 3650,              // 10 ans
  JUSTIFICATIF_DOMICILE: 90,   // 3 mois
  AVIS_IMPOSITION: 365,        // 1 an
  RIB_BANCAIRE: 0,             // Pas d'expiration
  JUSTIFICATIF_PATRIMOINE: 365, // 1 an
  ORIGINE_FONDS: 0,            // Pas d'expiration (one-time)
  AUTRE: 365,                  // 1 an par défaut
};

/**
 * Labels français pour les types de documents
 */
export const KYC_DOCUMENT_TYPE_LABELS: Record<KYCDocumentType, string> = {
  IDENTITE: "Pièce d'identité",
  JUSTIFICATIF_DOMICILE: 'Justificatif de domicile',
  AVIS_IMPOSITION: "Avis d'imposition",
  RIB_BANCAIRE: 'RIB bancaire',
  JUSTIFICATIF_PATRIMOINE: 'Justificatif de patrimoine',
  ORIGINE_FONDS: 'Origine des fonds',
  AUTRE: 'Autre document',
};

/**
 * Labels français pour les statuts de documents
 */
export const KYC_DOCUMENT_STATUS_LABELS: Record<KYCDocumentStatus, string> = {
  EN_ATTENTE: 'En attente de validation',
  VALIDE: 'Validé',
  REJETE: 'Rejeté',
  EXPIRE: 'Expiré',
};

/**
 * Interface pour un document KYC
 */
export interface KYCDocument {
  id: string;
  cabinetId: string;
  clientId: string;
  type: KYCDocumentType;
  fileName: string | null;
  fileUrl: string | null;
  status: KYCDocumentStatus;
  validatedAt: Date | null;
  validatedById: string | null;
  rejectionReason: string | null;
  expiresAt: Date | null;
  reminderSentAt: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input pour créer un document KYC
 */
export interface CreateKYCDocumentInput {
  cabinetId: string;
  clientId: string;
  type: KYCDocumentType;
  fileName?: string;
  fileUrl?: string;
  notes?: string;
}

/**
 * Input pour valider un document KYC
 */
export interface ValidateKYCDocumentInput {
  documentId: string;
  validatedById: string;
  notes?: string;
}

/**
 * Input pour rejeter un document KYC
 */
export interface RejectKYCDocumentInput {
  documentId: string;
  rejectionReason: string;
  validatedById: string;
}

// ============================================
// Alert Types
// ============================================

/**
 * Niveaux de sévérité des alertes
 */
export const ALERT_SEVERITY = ['LOW', 'WARNING', 'HIGH', 'CRITICAL'] as const;
export type AlertSeverity = typeof ALERT_SEVERITY[number];

/**
 * Types d'alertes de conformité
 */
export const ALERT_TYPES = [
  'DOCUMENT_EXPIRING',
  'DOCUMENT_EXPIRED',
  'KYC_INCOMPLETE',
  'CONTROL_OVERDUE',
  'RECLAMATION_SLA_BREACH',
  'MIFID_OUTDATED',
  'OPERATION_BLOCKED',
  'AFFAIRE_INACTIVE',
] as const;
export type AlertType = typeof ALERT_TYPES[number];

/**
 * Labels français pour les sévérités d'alertes
 */
export const ALERT_SEVERITY_LABELS: Record<AlertSeverity, string> = {
  LOW: 'Basse',
  WARNING: 'Avertissement',
  HIGH: 'Haute',
  CRITICAL: 'Critique',
};

/**
 * Labels français pour les types d'alertes
 */
export const ALERT_TYPE_LABELS: Record<AlertType, string> = {
  DOCUMENT_EXPIRING: 'Document expirant bientôt',
  DOCUMENT_EXPIRED: 'Document expiré',
  KYC_INCOMPLETE: 'KYC incomplet',
  CONTROL_OVERDUE: 'Contrôle en retard',
  RECLAMATION_SLA_BREACH: 'Dépassement SLA réclamation',
  MIFID_OUTDATED: 'Questionnaire MiFID obsolète',
  OPERATION_BLOCKED: 'Opération bloquée',
  AFFAIRE_INACTIVE: 'Affaire inactive',
};

/**
 * Seuils d'alerte pour les documents expirants (en jours)
 */
export const DOCUMENT_ALERT_THRESHOLDS = {
  WARNING: 30,  // Alerte warning à 30 jours
  HIGH: 7,      // Alerte high à 7 jours
  CRITICAL: 0,  // Alerte critical quand expiré
} as const;

/**
 * Interface pour une alerte de conformité
 */
export interface ComplianceAlert {
  id: string;
  cabinetId: string;
  clientId: string | null;
  operationId: string | null;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  actionRequired: string;
  actionUrl: string | null;
  acknowledged: boolean;
  acknowledgedAt: Date | null;
  acknowledgedById: string | null;
  resolved: boolean;
  resolvedAt: Date | null;
  createdAt: Date;
}

/**
 * Input pour créer une alerte
 */
export interface CreateAlertInput {
  cabinetId: string;
  clientId?: string;
  operationId?: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  actionRequired: string;
  actionUrl?: string;
}

/**
 * Input pour acquitter une alerte
 */
export interface AcknowledgeAlertInput {
  alertId: string;
  acknowledgedById: string;
}

// ============================================
// Control Types (ACPR)
// ============================================

/**
 * Types de contrôles ACPR
 * Alignés avec l'enum KYCCheckType de Prisma
 */
export const CONTROL_TYPES = [
  'VERIFICATION_IDENTITE',
  'SITUATION_FINANCIERE',
  'PROFIL_RISQUE',
  'ORIGINE_PATRIMOINE',
  'PERSONNE_EXPOSEE',
  'REVUE_PERIODIQUE',
] as const;
export type ControlType = typeof CONTROL_TYPES[number];

/**
 * Statuts des contrôles
 * Alignés avec l'enum KYCCheckStatus de Prisma
 */
export const CONTROL_STATUS = [
  'EN_ATTENTE',
  'EN_COURS',
  'TERMINE',
  'EN_RETARD',
] as const;
export type ControlStatus = typeof CONTROL_STATUS[number];

/**
 * Priorités des contrôles
 */
export const CONTROL_PRIORITY = ['BASSE', 'MOYENNE', 'HAUTE', 'URGENTE'] as const;
export type ControlPriority = typeof CONTROL_PRIORITY[number];

/**
 * Niveaux de risque
 */
export const RISK_LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
export type RiskLevel = typeof RISK_LEVELS[number];

/**
 * Labels français pour les types de contrôles
 */
export const CONTROL_TYPE_LABELS: Record<ControlType, string> = {
  VERIFICATION_IDENTITE: "Vérification d'identité",
  SITUATION_FINANCIERE: 'Situation financière',
  PROFIL_RISQUE: 'Profil de risque',
  ORIGINE_PATRIMOINE: 'Origine du patrimoine',
  PERSONNE_EXPOSEE: 'Vérification PPE',
  REVUE_PERIODIQUE: 'Revue périodique',
};

/**
 * Labels français pour les statuts de contrôles
 */
export const CONTROL_STATUS_LABELS: Record<ControlStatus, string> = {
  EN_ATTENTE: 'En attente',
  EN_COURS: 'En cours',
  TERMINE: 'Terminé',
  EN_RETARD: 'En retard',
};

/**
 * Labels français pour les priorités
 */
export const CONTROL_PRIORITY_LABELS: Record<ControlPriority, string> = {
  BASSE: 'Basse',
  MOYENNE: 'Moyenne',
  HAUTE: 'Haute',
  URGENTE: 'Urgente',
};

/**
 * Labels français pour les niveaux de risque
 */
export const RISK_LEVEL_LABELS: Record<RiskLevel, string> = {
  LOW: 'Faible',
  MEDIUM: 'Moyen',
  HIGH: 'Élevé',
  CRITICAL: 'Critique',
};

/**
 * Seuils de score pour le calcul du niveau de risque
 */
export const RISK_LEVEL_THRESHOLDS = {
  LOW: { min: 0, max: 29 },
  MEDIUM: { min: 30, max: 59 },
  HIGH: { min: 60, max: 84 },
  CRITICAL: { min: 85, max: 100 },
} as const;

/**
 * Calcule le niveau de risque à partir d'un score (0-100)
 */
export function calculateRiskLevel(score: number): RiskLevel {
  if (score < 0 || score > 100) {
    throw new Error(`Score must be between 0 and 100, got ${score}`);
  }
  if (score < 30) return 'LOW';
  if (score < 60) return 'MEDIUM';
  if (score < 85) return 'HIGH';
  return 'CRITICAL';
}

/**
 * Interface pour un contrôle ACPR
 */
export interface ComplianceControl {
  id: string;
  cabinetId: string;
  clientId: string;
  type: ControlType;
  status: ControlStatus;
  priority: ControlPriority;
  description: string | null;
  findings: string | null;
  recommendations: string | null;
  dueDate: Date;
  completedAt: Date | null;
  completedById: string | null;
  isACPRMandatory: boolean;
  score: number | null;
  riskLevel: RiskLevel | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input pour créer un contrôle
 */
export interface CreateControlInput {
  cabinetId: string;
  clientId: string;
  type: ControlType;
  priority: ControlPriority;
  description?: string;
  dueDate: Date;
  isACPRMandatory?: boolean;
}

/**
 * Input pour compléter un contrôle
 */
export interface CompleteControlInput {
  controlId: string;
  completedById: string;
  findings: string;
  recommendations?: string;
  score: number;
}

// ============================================
// Reclamation Types
// ============================================

/**
 * Types de réclamations
 */
export const RECLAMATION_TYPES = [
  'QUALITE_SERVICE',
  'TARIFICATION',
  'QUALITE_CONSEIL',
  'COMMUNICATION',
  'DOCUMENT',
  'AUTRE',
] as const;
export type ReclamationType = typeof RECLAMATION_TYPES[number];

/**
 * Statuts des réclamations
 */
export const RECLAMATION_STATUS = [
  'RECUE',
  'EN_COURS',
  'EN_ATTENTE_INFO',
  'RESOLUE',
  'CLOTUREE',
] as const;
export type ReclamationStatus = typeof RECLAMATION_STATUS[number];

/**
 * Niveaux de sévérité SLA
 */
export const SLA_SEVERITY = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
export type SLASeverity = typeof SLA_SEVERITY[number];

/**
 * Délais SLA en jours par niveau de sévérité
 */
export const SLA_DEADLINES: Record<SLASeverity, number> = {
  LOW: 60,
  MEDIUM: 30,
  HIGH: 15,
  CRITICAL: 7,
};

/**
 * Labels français pour les types de réclamations
 */
export const RECLAMATION_TYPE_LABELS: Record<ReclamationType, string> = {
  QUALITE_SERVICE: 'Qualité de service',
  TARIFICATION: 'Tarification',
  QUALITE_CONSEIL: 'Qualité du conseil',
  COMMUNICATION: 'Communication',
  DOCUMENT: 'Document',
  AUTRE: 'Autre',
};

/**
 * Labels français pour les statuts de réclamations
 */
export const RECLAMATION_STATUS_LABELS: Record<ReclamationStatus, string> = {
  RECUE: 'Reçue',
  EN_COURS: 'En cours',
  EN_ATTENTE_INFO: "En attente d'informations",
  RESOLUE: 'Résolue',
  CLOTUREE: 'Clôturée',
};

/**
 * Labels français pour les sévérités SLA
 */
export const SLA_SEVERITY_LABELS: Record<SLASeverity, string> = {
  LOW: 'Basse',
  MEDIUM: 'Moyenne',
  HIGH: 'Haute',
  CRITICAL: 'Critique',
};

/**
 * Transitions de statut valides pour les réclamations
 */
export const RECLAMATION_STATUS_TRANSITIONS: Record<ReclamationStatus, ReclamationStatus[]> = {
  RECUE: ['EN_COURS'],
  EN_COURS: ['EN_ATTENTE_INFO', 'RESOLUE'],
  EN_ATTENTE_INFO: ['EN_COURS'],
  RESOLUE: ['CLOTUREE'],
  CLOTUREE: [],
};

/**
 * Vérifie si une transition de statut est valide
 */
export function isValidReclamationTransition(
  fromStatus: ReclamationStatus,
  toStatus: ReclamationStatus
): boolean {
  return RECLAMATION_STATUS_TRANSITIONS[fromStatus].includes(toStatus);
}

/**
 * Calcule la date limite SLA à partir de la sévérité et de la date de réception
 */
export function calculateSLADeadline(severity: SLASeverity, receivedAt: Date): Date {
  const deadline = new Date(receivedAt);
  deadline.setDate(deadline.getDate() + SLA_DEADLINES[severity]);
  return deadline;
}

/**
 * Vérifie si le SLA est en breach
 */
export function isSLABreached(
  deadline: Date,
  status: ReclamationStatus,
  currentDate: Date = new Date()
): boolean {
  const terminalStatuses: ReclamationStatus[] = ['RESOLUE', 'CLOTUREE'];
  if (terminalStatuses.includes(status)) {
    return false;
  }
  return currentDate > deadline;
}

/**
 * Interface pour une réclamation
 */
export interface Reclamation {
  id: string;
  cabinetId: string;
  clientId: string;
  reference: string;
  subject: string;
  description: string;
  type: ReclamationType;
  status: ReclamationStatus;
  severity: SLASeverity;
  assignedToId: string | null;
  responseText: string | null;
  internalNotes: string | null;
  resolutionDate: Date | null;
  receivedAt: Date;
  deadline: Date;
  slaDeadline: Date;
  slaBreach: boolean;
  slaBreachAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input pour créer une réclamation
 */
export interface CreateReclamationInput {
  cabinetId: string;
  clientId: string;
  subject: string;
  description: string;
  type: ReclamationType;
  severity: SLASeverity;
  assignedToId?: string;
  internalNotes?: string;
}

/**
 * Input pour résoudre une réclamation
 */
export interface ResolveReclamationInput {
  reclamationId: string;
  responseText: string;
  internalNotes?: string;
}

// ============================================
// Compliance Timeline Types
// ============================================

/**
 * Types d'événements de la timeline conformité
 */
export const TIMELINE_EVENT_TYPES = [
  'DOCUMENT_UPLOADED',
  'DOCUMENT_VALIDATED',
  'DOCUMENT_REJECTED',
  'DOCUMENT_EXPIRED',
  'REMINDER_SENT',
  'CONTROL_CREATED',
  'CONTROL_COMPLETED',
  'QUESTIONNAIRE_COMPLETED',
  'RECLAMATION_CREATED',
  'RECLAMATION_RESOLVED',
  'OPERATION_CREATED',
  'OPERATION_STATUS_CHANGED',
  'DOCUMENT_GENERATED',
  'DOCUMENT_SIGNED',
  'DOCUMENT_EXPORTED',
] as const;
export type TimelineEventType = typeof TIMELINE_EVENT_TYPES[number];

/**
 * Labels français pour les types d'événements
 */
export const TIMELINE_EVENT_TYPE_LABELS: Record<TimelineEventType, string> = {
  DOCUMENT_UPLOADED: 'Document téléversé',
  DOCUMENT_VALIDATED: 'Document validé',
  DOCUMENT_REJECTED: 'Document rejeté',
  DOCUMENT_EXPIRED: 'Document expiré',
  REMINDER_SENT: 'Relance envoyée',
  CONTROL_CREATED: 'Contrôle créé',
  CONTROL_COMPLETED: 'Contrôle terminé',
  QUESTIONNAIRE_COMPLETED: 'Questionnaire complété',
  RECLAMATION_CREATED: 'Réclamation créée',
  RECLAMATION_RESOLVED: 'Réclamation résolue',
  OPERATION_CREATED: 'Opération créée',
  OPERATION_STATUS_CHANGED: 'Statut opération modifié',
  DOCUMENT_GENERATED: 'Document généré',
  DOCUMENT_SIGNED: 'Document signé',
  DOCUMENT_EXPORTED: 'Document exporté',
};

/**
 * Interface pour un événement de timeline
 */
export interface TimelineEvent {
  id: string;
  cabinetId: string;
  clientId: string;
  operationId: string | null;
  type: TimelineEventType;
  title: string;
  description: string;
  metadata: Record<string, unknown>;
  userId: string;
  createdAt: Date;
}

/**
 * Input pour créer un événement de timeline
 */
export interface CreateTimelineEventInput {
  cabinetId: string;
  clientId: string;
  operationId?: string;
  type: TimelineEventType;
  title: string;
  description: string;
  metadata?: Record<string, unknown>;
  userId: string;
}

// ============================================
// Compliance Dashboard Types
// ============================================

/**
 * KPIs du dashboard conformité
 */
export interface ComplianceKPIs {
  completionRate: number;
  documentsPending: number;
  documentsExpiringSoon: number;
  documentsExpired: number;
  controlsOverdue: number;
  openReclamations: number;
  slaBreachRate: number;
  totalAlerts: number;
  criticalAlerts: number;
}

/**
 * Filtres pour les documents
 */
export interface DocumentFilters {
  status?: KYCDocumentStatus[];
  type?: KYCDocumentType[];
  clientId?: string;
  expirationDateFrom?: Date;
  expirationDateTo?: Date;
}

/**
 * Filtres pour les contrôles
 */
export interface ControlFilters {
  status?: ControlStatus[];
  type?: ControlType[];
  priority?: ControlPriority[];
  isACPRMandatory?: boolean;
  overdueOnly?: boolean;
  clientId?: string;
}

/**
 * Filtres pour les réclamations
 */
export interface ReclamationFilters {
  status?: ReclamationStatus[];
  type?: ReclamationType[];
  slaBreachOnly?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  clientId?: string;
}

/**
 * Filtres pour les alertes
 */
export interface AlertFilters {
  severity?: AlertSeverity[];
  type?: AlertType[];
  acknowledged?: boolean;
  resolved?: boolean;
  clientId?: string;
}

// ============================================
// Utility Functions
// ============================================

/**
 * Calcule la date d'expiration d'un document
 * @returns null si le document n'expire pas
 */
export function calculateDocumentExpiration(
  type: KYCDocumentType,
  uploadDate: Date
): Date | null {
  const expirationDays = DOCUMENT_EXPIRATION_RULES[type];
  if (expirationDays === 0) {
    return null;
  }
  const expirationDate = new Date(uploadDate);
  expirationDate.setDate(expirationDate.getDate() + expirationDays);
  return expirationDate;
}

/**
 * Détermine la sévérité d'alerte pour un document basé sur sa date d'expiration
 * @returns null si aucune alerte n'est nécessaire
 */
export function getDocumentAlertSeverity(
  expiresAt: Date | null,
  currentDate: Date = new Date()
): AlertSeverity | null {
  if (!expiresAt) {
    return null;
  }

  const daysUntilExpiration = Math.ceil(
    (expiresAt.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysUntilExpiration <= DOCUMENT_ALERT_THRESHOLDS.CRITICAL) {
    return 'CRITICAL';
  }
  if (daysUntilExpiration <= DOCUMENT_ALERT_THRESHOLDS.HIGH) {
    return 'HIGH';
  }
  if (daysUntilExpiration <= DOCUMENT_ALERT_THRESHOLDS.WARNING) {
    return 'WARNING';
  }
  return null;
}

/**
 * Génère une référence unique pour une réclamation
 * Format: REC-YYYY-NNNN
 */
export function generateReclamationReference(sequenceNumber: number): string {
  const year = new Date().getFullYear();
  const paddedSequence = sequenceNumber.toString().padStart(4, '0');
  return `REC-${year}-${paddedSequence}`;
}

/**
 * Vérifie si un contrôle est en retard
 */
export function isControlOverdue(
  dueDate: Date,
  status: ControlStatus,
  currentDate: Date = new Date()
): boolean {
  if (status === 'TERMINE') {
    return false;
  }
  return currentDate > dueDate;
}
