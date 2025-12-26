/**
 * Types TypeScript pour le module Documents Réglementaires
 * 
 * Ce fichier contient tous les types, interfaces et constantes
 * pour la gestion des documents réglementaires CGP (DER, Lettre de Mission, etc.)
 * 
 * @module lib/documents/types
 */

import type { ProductType, OperationGestionType } from '../operations/types';

// ============================================
// Regulatory Document Types
// ============================================

/**
 * Types de documents réglementaires
 */
export const REGULATORY_DOCUMENT_TYPES = [
  'DER',                        // Document d'Entrée en Relation
  'RECUEIL_INFORMATIONS',       // Recueil d'Informations Client
  'LETTRE_MISSION',             // Lettre de Mission
  'RAPPORT_MISSION',            // Rapport de Mission / Fiche Conseil
  'CONVENTION_HONORAIRES',      // Convention d'Honoraires
  'ATTESTATION_CONSEIL',        // Attestation de Conseil
  'MANDAT_GESTION',             // Mandat de Gestion
  'DECLARATION_ADEQUATION',     // Déclaration d'Adéquation
  'QUESTIONNAIRE_MIFID',        // Questionnaire MiFID II
  'BULLETIN_SOUSCRIPTION',      // Bulletin de Souscription
  'ORDRE_ARBITRAGE',            // Ordre d'Arbitrage
  'DEMANDE_RACHAT',             // Demande de Rachat
  'BULLETIN_VERSEMENT',         // Bulletin de Versement Complémentaire
  'SIMULATION_FISCALE',         // Simulation Fiscale
] as const;
export type RegulatoryDocumentType = typeof REGULATORY_DOCUMENT_TYPES[number];

/**
 * Labels français pour les types de documents réglementaires
 */
export const REGULATORY_DOCUMENT_TYPE_LABELS: Record<RegulatoryDocumentType, string> = {
  DER: "Document d'Entrée en Relation",
  RECUEIL_INFORMATIONS: "Recueil d'Informations Client",
  LETTRE_MISSION: 'Lettre de Mission',
  RAPPORT_MISSION: 'Rapport de Mission / Fiche Conseil',
  CONVENTION_HONORAIRES: "Convention d'Honoraires",
  ATTESTATION_CONSEIL: 'Attestation de Conseil',
  MANDAT_GESTION: 'Mandat de Gestion',
  DECLARATION_ADEQUATION: "Déclaration d'Adéquation",
  QUESTIONNAIRE_MIFID: 'Questionnaire MiFID II',
  BULLETIN_SOUSCRIPTION: 'Bulletin de Souscription',
  ORDRE_ARBITRAGE: "Ordre d'Arbitrage",
  DEMANDE_RACHAT: 'Demande de Rachat',
  BULLETIN_VERSEMENT: 'Bulletin de Versement Complémentaire',
  SIMULATION_FISCALE: 'Simulation Fiscale',
};

// ============================================
// Association Types
// ============================================

/**
 * Types d'associations CGP
 */
export const ASSOCIATION_TYPES = [
  'CNCGP',
  'ANACOFI',
  'CNCEF',
  'GENERIC',
] as const;
export type AssociationType = typeof ASSOCIATION_TYPES[number];

/**
 * Labels français pour les types d'associations
 */
export const ASSOCIATION_TYPE_LABELS: Record<AssociationType, string> = {
  CNCGP: 'Chambre Nationale des Conseils en Gestion de Patrimoine',
  ANACOFI: 'Association Nationale des Conseils Financiers',
  CNCEF: 'Chambre Nationale des Conseils Experts Financiers',
  GENERIC: 'Générique (non affilié)',
};

// ============================================
// Document Format and Status
// ============================================

/**
 * Formats de documents
 */
export const DOCUMENT_FORMATS = ['PDF', 'DOCX'] as const;
export type DocumentFormat = typeof DOCUMENT_FORMATS[number];

/**
 * Statuts de documents générés
 */
export const DOCUMENT_STATUS = ['DRAFT', 'FINAL', 'SIGNED'] as const;
export type DocumentStatus = typeof DOCUMENT_STATUS[number];

/**
 * Labels français pour les statuts de documents
 */
export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  DRAFT: 'Brouillon',
  FINAL: 'Final',
  SIGNED: 'Signé',
};

// ============================================
// Document Template Types
// ============================================

/**
 * Section de template
 */
export interface TemplateSection {
  id: string;
  title: string;
  content: string;              // Markdown avec placeholders {{variable}}
  isMandatory: boolean;
  order: number;
}

/**
 * Styles de document
 */
export interface DocumentStyles {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  logoUrl: string | null;
  headerHeight: number;
  footerHeight: number;
}

/**
 * Contenu d'un template de document
 */
export interface DocumentTemplateContent {
  header: TemplateSection;
  sections: TemplateSection[];
  footer: TemplateSection;
  styles: DocumentStyles;
}

/**
 * Interface pour un template de document
 */
export interface DocumentTemplate {
  id: string;
  cabinetId: string;
  documentType: RegulatoryDocumentType;
  associationType: AssociationType;
  providerId: string | null;
  name: string;
  version: string;
  content: DocumentTemplateContent;
  mandatorySections: string[];
  customizableSections: string[];
  isActive: boolean;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input pour créer un template de document
 */
export interface CreateDocumentTemplateInput {
  cabinetId: string;
  documentType: RegulatoryDocumentType;
  associationType?: AssociationType;
  providerId?: string;
  name: string;
  version: string;
  content: DocumentTemplateContent;
  mandatorySections: string[];
  customizableSections: string[];
  createdById: string;
}

// ============================================
// Generated Document Types
// ============================================

/**
 * Statut de signature
 */
export type SignatureRequestStatus = 
  | 'PENDING' 
  | 'IN_PROGRESS' 
  | 'PARTIALLY_SIGNED' 
  | 'SIGNED' 
  | 'REJECTED' 
  | 'EXPIRED';

/**
 * Rôle du signataire
 */
export type SignerRole = 'CLIENT' | 'ADVISOR' | 'WITNESS';

/**
 * Statut d'un signataire
 */
export interface SignerStatus {
  email: string;
  name: string;
  role: SignerRole;
  order: number;
  status: 'PENDING' | 'SIGNED' | 'REJECTED';
  signedAt: Date | null;
}

/**
 * Statut de signature complet
 */
export interface SignatureStatus {
  signatureRequestId: string;
  signers: SignerStatus[];
  status: SignatureRequestStatus;
  sentAt: Date;
  completedAt: Date | null;
}

/**
 * Interface pour un document généré
 */
export interface GeneratedDocument {
  id: string;
  cabinetId: string;
  clientId: string;
  affaireId: string | null;
  operationId: string | null;
  templateId: string;
  documentType: RegulatoryDocumentType;
  fileName: string;
  fileUrl: string;
  format: DocumentFormat;
  status: DocumentStatus;
  signatureStatus: SignatureStatus | null;
  generatedData: Record<string, unknown>;
  generatedById: string;
  generatedAt: Date;
  signedAt: Date | null;
  expiresAt: Date | null;
}

/**
 * Input pour générer un document
 */
export interface GenerateDocumentInput {
  cabinetId: string;
  clientId: string;
  affaireId?: string;
  operationId?: string;
  templateId: string;
  documentType: RegulatoryDocumentType;
  format: DocumentFormat;
  generatedById: string;
  customData?: Record<string, unknown>;
}

/**
 * Input pour envoyer un document pour signature
 */
export interface SendForSignatureInput {
  documentId: string;
  signers: Array<{
    email: string;
    name: string;
    role: SignerRole;
    order: number;
  }>;
}

// ============================================
// Document Requirements Types
// ============================================

/**
 * Type d'opération pour les requirements
 */
export type OperationType = 'AFFAIRE_NOUVELLE' | OperationGestionType;

/**
 * Condition pour un document requis
 */
export type DocumentCondition =
  | { type: 'ALWAYS' }
  | { type: 'IF_FIRST_RELATION' }
  | { type: 'IF_OUTDATED'; maxAgeDays: number }
  | { type: 'IF_AMOUNT_ABOVE'; threshold: number }
  | { type: 'IF_PRODUCT_TYPE'; productTypes: ProductType[] }
  | { type: 'IF_ALLOCATION_CHANGED' };

/**
 * Requirement pour un document
 */
export interface DocumentRequirement {
  documentType: RegulatoryDocumentType;
  condition: DocumentCondition;
  isBlocking: boolean;
}

/**
 * Requirements de documents pour une opération
 */
export interface DocumentRequirements {
  operationType: OperationType;
  productType: ProductType | null;
  isFirstRelation: boolean;
  required: DocumentRequirement[];
}

// ============================================
// Document Requirements Configuration
// ============================================

/**
 * Documents requis pour une affaire nouvelle
 */
export const AFFAIRE_NOUVELLE_REQUIREMENTS: DocumentRequirement[] = [
  { documentType: 'DER', condition: { type: 'IF_FIRST_RELATION' }, isBlocking: true },
  { documentType: 'RECUEIL_INFORMATIONS', condition: { type: 'IF_OUTDATED', maxAgeDays: 365 }, isBlocking: true },
  { documentType: 'QUESTIONNAIRE_MIFID', condition: { type: 'IF_OUTDATED', maxAgeDays: 365 }, isBlocking: true },
  { documentType: 'LETTRE_MISSION', condition: { type: 'ALWAYS' }, isBlocking: true },
  { documentType: 'DECLARATION_ADEQUATION', condition: { type: 'ALWAYS' }, isBlocking: true },
  { documentType: 'BULLETIN_SOUSCRIPTION', condition: { type: 'ALWAYS' }, isBlocking: true },
];

/**
 * Documents requis pour un arbitrage
 */
export const ARBITRAGE_REQUIREMENTS: DocumentRequirement[] = [
  { documentType: 'RAPPORT_MISSION', condition: { type: 'ALWAYS' }, isBlocking: true },
  { documentType: 'DECLARATION_ADEQUATION', condition: { type: 'ALWAYS' }, isBlocking: true },
  { documentType: 'ORDRE_ARBITRAGE', condition: { type: 'ALWAYS' }, isBlocking: true },
];

/**
 * Documents requis pour un rachat
 */
export const RACHAT_REQUIREMENTS: DocumentRequirement[] = [
  { documentType: 'DEMANDE_RACHAT', condition: { type: 'ALWAYS' }, isBlocking: true },
  { documentType: 'SIMULATION_FISCALE', condition: { type: 'ALWAYS' }, isBlocking: false },
  { documentType: 'RAPPORT_MISSION', condition: { type: 'IF_ALLOCATION_CHANGED' }, isBlocking: false },
];

/**
 * Documents requis pour un versement complémentaire
 */
export const VERSEMENT_REQUIREMENTS: DocumentRequirement[] = [
  { documentType: 'BULLETIN_VERSEMENT', condition: { type: 'ALWAYS' }, isBlocking: true },
  { documentType: 'DECLARATION_ADEQUATION', condition: { type: 'IF_ALLOCATION_CHANGED' }, isBlocking: true },
  { documentType: 'RECUEIL_INFORMATIONS', condition: { type: 'IF_OUTDATED', maxAgeDays: 365 }, isBlocking: false },
];

/**
 * Documents requis pour une modification de bénéficiaire
 */
export const MODIFICATION_BENEFICIAIRE_REQUIREMENTS: DocumentRequirement[] = [
  { documentType: 'RAPPORT_MISSION', condition: { type: 'ALWAYS' }, isBlocking: true },
];

/**
 * Documents requis pour un transfert
 */
export const TRANSFERT_REQUIREMENTS: DocumentRequirement[] = [
  { documentType: 'RAPPORT_MISSION', condition: { type: 'ALWAYS' }, isBlocking: true },
  { documentType: 'DECLARATION_ADEQUATION', condition: { type: 'ALWAYS' }, isBlocking: true },
  { documentType: 'BULLETIN_SOUSCRIPTION', condition: { type: 'ALWAYS' }, isBlocking: true },
];

/**
 * Documents requis pour une avance
 */
export const AVANCE_REQUIREMENTS: DocumentRequirement[] = [
  { documentType: 'RAPPORT_MISSION', condition: { type: 'ALWAYS' }, isBlocking: true },
];

/**
 * Documents requis pour un changement d'option de gestion
 */
export const CHANGEMENT_OPTION_GESTION_REQUIREMENTS: DocumentRequirement[] = [
  { documentType: 'RAPPORT_MISSION', condition: { type: 'ALWAYS' }, isBlocking: true },
  { documentType: 'DECLARATION_ADEQUATION', condition: { type: 'ALWAYS' }, isBlocking: true },
];

/**
 * Map des requirements par type d'opération
 */
export const OPERATION_REQUIREMENTS_MAP: Record<OperationType, DocumentRequirement[]> = {
  AFFAIRE_NOUVELLE: AFFAIRE_NOUVELLE_REQUIREMENTS,
  ARBITRAGE: ARBITRAGE_REQUIREMENTS,
  RACHAT_PARTIEL: RACHAT_REQUIREMENTS,
  RACHAT_TOTAL: RACHAT_REQUIREMENTS,
  VERSEMENT_COMPLEMENTAIRE: VERSEMENT_REQUIREMENTS,
  MODIFICATION_BENEFICIAIRE: MODIFICATION_BENEFICIAIRE_REQUIREMENTS,
  TRANSFERT: TRANSFERT_REQUIREMENTS,
  AVANCE: AVANCE_REQUIREMENTS,
  CHANGEMENT_OPTION_GESTION: CHANGEMENT_OPTION_GESTION_REQUIREMENTS,
};

/**
 * Récupère les documents requis pour un type d'opération
 */
export function getRequiredDocuments(operationType: OperationType): DocumentRequirement[] {
  return OPERATION_REQUIREMENTS_MAP[operationType] || [];
}

/**
 * Vérifie si une condition de document est satisfaite
 */
export function isDocumentConditionMet(
  condition: DocumentCondition,
  context: {
    isFirstRelation: boolean;
    lastDocumentDate?: Date;
    amount?: number;
    productType?: ProductType;
    allocationChanged?: boolean;
  }
): boolean {
  switch (condition.type) {
    case 'ALWAYS':
      return true;
    
    case 'IF_FIRST_RELATION':
      return context.isFirstRelation;
    
    case 'IF_OUTDATED':
      if (!context.lastDocumentDate) return true;
      const daysSinceDocument = Math.floor(
        (new Date().getTime() - context.lastDocumentDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysSinceDocument > condition.maxAgeDays;
    
    case 'IF_AMOUNT_ABOVE':
      return (context.amount ?? 0) > condition.threshold;
    
    case 'IF_PRODUCT_TYPE':
      return context.productType ? condition.productTypes.includes(context.productType) : false;
    
    case 'IF_ALLOCATION_CHANGED':
      return context.allocationChanged ?? false;
    
    default:
      return false;
  }
}

// ============================================
// Document Export Types
// ============================================

/**
 * Options d'export de document
 */
export interface DocumentExportOptions {
  format: DocumentFormat;
  includeSignaturePlaceholders: boolean;
  applyBranding: boolean;
  watermark?: string;
}

/**
 * Résultat d'export de document
 */
export interface DocumentExportResult {
  success: boolean;
  fileUrl?: string;
  fileName?: string;
  error?: string;
}

/**
 * Input pour export batch de documents
 */
export interface BatchExportInput {
  documentIds: string[];
  options: DocumentExportOptions;
}

// ============================================
// MiFID Questionnaire Types
// ============================================

/**
 * Profils de risque MiFID
 */
export const MIFID_RISK_PROFILES = [
  'CONSERVATEUR',
  'PRUDENT',
  'EQUILIBRE',
  'DYNAMIQUE',
  'OFFENSIF',
] as const;
export type MiFIDRiskProfile = typeof MIFID_RISK_PROFILES[number];

/**
 * Horizons d'investissement MiFID
 */
export const MIFID_INVESTMENT_HORIZONS = [
  'COURT',   // < 3 ans
  'MOYEN',   // 3-8 ans
  'LONG',    // > 8 ans
] as const;
export type MiFIDInvestmentHorizon = typeof MIFID_INVESTMENT_HORIZONS[number];

/**
 * Labels français pour les profils de risque MiFID
 */
export const MIFID_RISK_PROFILE_LABELS: Record<MiFIDRiskProfile, string> = {
  CONSERVATEUR: 'Conservateur - Sécurité maximale',
  PRUDENT: 'Prudent - Risque faible',
  EQUILIBRE: 'Équilibré - Risque modéré',
  DYNAMIQUE: 'Dynamique - Risque élevé',
  OFFENSIF: 'Offensif - Risque maximum',
};

/**
 * Labels français pour les horizons d'investissement
 */
export const MIFID_INVESTMENT_HORIZON_LABELS: Record<MiFIDInvestmentHorizon, string> = {
  COURT: 'Court terme (< 3 ans)',
  MOYEN: 'Moyen terme (3-8 ans)',
  LONG: 'Long terme (> 8 ans)',
};

/**
 * Section du questionnaire MiFID
 */
export interface MiFIDQuestionnaireSection {
  id: string;
  title: string;
  questions: MiFIDQuestion[];
}

/**
 * Question MiFID
 */
export interface MiFIDQuestion {
  id: string;
  text: string;
  type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'SCALE' | 'TEXT';
  options?: { value: string; label: string; score: number }[];
  required: boolean;
}

/**
 * Réponse à une question MiFID
 */
export interface MiFIDAnswer {
  questionId: string;
  value: string | string[] | number;
}

/**
 * Résultat du questionnaire MiFID
 */
export interface MiFIDQuestionnaireResult {
  clientId: string;
  completedAt: Date;
  answers: MiFIDAnswer[];
  riskProfile: MiFIDRiskProfile;
  investmentHorizon: MiFIDInvestmentHorizon;
  totalScore: number;
  recommendations: string[];
}

/**
 * Input pour sauvegarder les réponses MiFID
 */
export interface SaveMiFIDAnswersInput {
  clientId: string;
  answers: MiFIDAnswer[];
  userId: string;
}

// ============================================
// Filtres pour les documents
// ============================================

/**
 * Filtres pour les templates de documents
 */
export interface DocumentTemplateFilters {
  documentType?: RegulatoryDocumentType[];
  associationType?: AssociationType[];
  providerId?: string;
  isActive?: boolean;
}

/**
 * Filtres pour les documents générés
 */
export interface GeneratedDocumentFilters {
  documentType?: RegulatoryDocumentType[];
  status?: DocumentStatus[];
  clientId?: string;
  affaireId?: string;
  operationId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}
