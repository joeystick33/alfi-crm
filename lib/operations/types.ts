/**
 * Types TypeScript pour le module Opérations
 * 
 * Ce fichier contient tous les types, interfaces et constantes
 * pour la gestion des opérations CGP (Affaires Nouvelles, Opérations de Gestion, Providers)
 * 
 * @module lib/operations/types
 */

import type { AlertSeverity } from '../compliance/types';

// ============================================
// Product Types
// ============================================

/**
 * Types de produits financiers
 */
export const PRODUCT_TYPES = [
  'ASSURANCE_VIE',
  'PER_INDIVIDUEL',
  'PER_ENTREPRISE',
  'SCPI',
  'OPCI',
  'COMPTE_TITRES',
  'PEA',
  'PEA_PME',
  'CAPITALISATION',
  'FCPR',
  'FCPI',
  'FIP',
  'IMMOBILIER_DIRECT',
  'CREDIT_IMMOBILIER',
] as const;
export type ProductType = typeof PRODUCT_TYPES[number];

/**
 * Labels français pour les types de produits
 */
export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  ASSURANCE_VIE: 'Assurance Vie',
  PER_INDIVIDUEL: 'PER Individuel',
  PER_ENTREPRISE: 'PER Entreprise',
  SCPI: 'SCPI',
  OPCI: 'OPCI',
  COMPTE_TITRES: 'Compte-titres',
  PEA: 'PEA',
  PEA_PME: 'PEA-PME',
  CAPITALISATION: 'Contrat de capitalisation',
  FCPR: 'FCPR',
  FCPI: 'FCPI',
  FIP: 'FIP',
  IMMOBILIER_DIRECT: 'Immobilier direct',
  CREDIT_IMMOBILIER: 'Crédit immobilier',
};

// ============================================
// Affaire Nouvelle Types
// ============================================

/**
 * Statuts d'une affaire nouvelle
 */
export const AFFAIRE_STATUS = [
  'PROSPECT',
  'QUALIFICATION',
  'CONSTITUTION',
  'SIGNATURE',
  'ENVOYE',
  'EN_TRAITEMENT',
  'VALIDE',
  'REJETE',
  'ANNULE',
] as const;
export type AffaireStatus = typeof AFFAIRE_STATUS[number];

/**
 * Sources d'une affaire nouvelle
 */
export const AFFAIRE_SOURCE = [
  'PROSPECTION',
  'REFERRAL',
  'CLIENT_EXISTANT',
  'PARTENAIRE',
  'SITE_WEB',
  'AUTRE',
] as const;
export type AffaireSource = typeof AFFAIRE_SOURCE[number];

/**
 * Labels français pour les statuts d'affaires
 */
export const AFFAIRE_STATUS_LABELS: Record<AffaireStatus, string> = {
  PROSPECT: 'Prospect',
  QUALIFICATION: 'Qualification',
  CONSTITUTION: 'Constitution',
  SIGNATURE: 'Signature',
  ENVOYE: 'Envoyé',
  EN_TRAITEMENT: 'En traitement',
  VALIDE: 'Validé',
  REJETE: 'Rejeté',
  ANNULE: 'Annulé',
};

/**
 * Labels français pour les sources d'affaires
 */
export const AFFAIRE_SOURCE_LABELS: Record<AffaireSource, string> = {
  PROSPECTION: 'Prospection',
  REFERRAL: 'Recommandation',
  CLIENT_EXISTANT: 'Client existant',
  PARTENAIRE: 'Partenaire',
  SITE_WEB: 'Site web',
  AUTRE: 'Autre',
};

/**
 * Transitions de statut valides pour les affaires nouvelles
 */
export const AFFAIRE_STATUS_TRANSITIONS: Record<AffaireStatus, AffaireStatus[]> = {
  PROSPECT: ['QUALIFICATION', 'ANNULE'],
  QUALIFICATION: ['CONSTITUTION', 'ANNULE'],
  CONSTITUTION: ['SIGNATURE', 'ANNULE'],
  SIGNATURE: ['ENVOYE', 'ANNULE'],
  ENVOYE: ['EN_TRAITEMENT', 'ANNULE'],
  EN_TRAITEMENT: ['VALIDE', 'REJETE'],
  VALIDE: [],
  REJETE: [],
  ANNULE: [],
};

/**
 * Vérifie si une transition de statut est valide pour une affaire
 */
export function isValidAffaireTransition(
  fromStatus: AffaireStatus,
  toStatus: AffaireStatus
): boolean {
  return AFFAIRE_STATUS_TRANSITIONS[fromStatus].includes(toStatus);
}

/**
 * Statuts considérés comme "en cours" (pas encore soumis au fournisseur)
 */
export const AFFAIRE_EN_COURS_STATUSES: AffaireStatus[] = [
  'QUALIFICATION',
  'CONSTITUTION',
  'SIGNATURE',
];

/**
 * Seuils d'inactivité pour les affaires en cours (en jours)
 */
export const AFFAIRE_INACTIVITY_THRESHOLDS = {
  GREEN: 7,    // < 7 jours : vert
  ORANGE: 30,  // 7-30 jours : orange
  RED: 30,     // > 30 jours : rouge
} as const;

// ============================================
// Affaire Product Details (Discriminated Union)
// ============================================

/**
 * Mode de paiement
 */
export type PaymentMode = 'UNIQUE' | 'PROGRAMME' | 'LIBRE';

/**
 * Compartiment PER
 */
export type PERCompartment = 'INDIVIDUEL' | 'COLLECTIF' | 'OBLIGATOIRE';

/**
 * Option de sortie PER
 */
export type PERExitOption = 'CAPITAL' | 'RENTE' | 'MIXTE';

/**
 * Type de mandat
 */
export type MandateType = 'CONSEIL' | 'GESTION_PILOTEE' | 'GESTION_LIBRE';

/**
 * Allocation de fonds
 */
export interface FundAllocation {
  fundId: string;
  fundName: string;
  percentage: number;
}

/**
 * Calendrier de paiement
 */
export interface PaymentSchedule {
  date: Date;
  amount: number;
  status: 'PENDING' | 'PAID';
}

/**
 * Option de démembrement
 */
export interface DismembermentOption {
  type: 'NUE_PROPRIETE' | 'USUFRUIT';
  duration: number | null;
  counterpartyId: string | null;
}

/**
 * Calendrier d'appels (Private Equity)
 */
export interface CallSchedule {
  callNumber: number;
  expectedDate: Date;
  percentage: number;
  status: 'PENDING' | 'CALLED' | 'PAID';
}

/**
 * Détails spécifiques par type de produit (Discriminated Union)
 */
export type AffaireProductDetails =
  | { type: 'ASSURANCE_VIE'; allocation: FundAllocation[]; beneficiaryClause: string; paymentMode: PaymentMode }
  | { type: 'PER_INDIVIDUEL'; compartment: PERCompartment; beneficiaryClause: string; exitOptions: PERExitOption[] }
  | { type: 'PER_ENTREPRISE'; compartment: PERCompartment; beneficiaryClause: string; exitOptions: PERExitOption[] }
  | { type: 'SCPI'; numberOfShares: number; paymentSchedule: PaymentSchedule[]; dismemberment: DismembermentOption | null }
  | { type: 'OPCI'; numberOfShares: number; paymentSchedule: PaymentSchedule[]; dismemberment: DismembermentOption | null }
  | { type: 'COMPTE_TITRES'; allocation: FundAllocation[]; mandateType: MandateType }
  | { type: 'PEA'; allocation: FundAllocation[]; mandateType: MandateType }
  | { type: 'PEA_PME'; allocation: FundAllocation[]; mandateType: MandateType }
  | { type: 'CAPITALISATION'; allocation: FundAllocation[]; beneficiaryClause: string; paymentMode: PaymentMode }
  | { type: 'FCPR'; commitmentAmount: number; callSchedule: CallSchedule[]; lockUpPeriod: number }
  | { type: 'FCPI'; commitmentAmount: number; callSchedule: CallSchedule[]; lockUpPeriod: number }
  | { type: 'FIP'; commitmentAmount: number; callSchedule: CallSchedule[]; lockUpPeriod: number }
  | { type: 'IMMOBILIER_DIRECT'; data: Record<string, unknown> }
  | { type: 'CREDIT_IMMOBILIER'; data: Record<string, unknown> }
  | { type: 'OTHER'; data: Record<string, unknown> };

/**
 * Interface pour une affaire nouvelle
 */
export interface AffaireNouvelle {
  id: string;
  cabinetId: string;
  reference: string;
  clientId: string;
  productType: ProductType;
  providerId: string;
  productId: string | null;
  status: AffaireStatus;
  source: AffaireSource;
  estimatedAmount: number;
  actualAmount: number | null;
  targetDate: Date | null;
  productDetails: AffaireProductDetails | null;
  complianceStatus: ComplianceCheckResult;
  requiredDocuments: RequiredDocument[];
  entryFees: number | null;
  managementFees: number | null;
  expectedCommission: number | null;
  lastActivityAt: Date;
  pausedAt: Date | null;
  pauseReason: string | null;
  rejectionReason: string | null;
  cancellationReason: string | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input pour créer une affaire nouvelle
 */
export interface CreateAffaireInput {
  cabinetId: string;
  clientId: string;
  productType: ProductType;
  providerId: string;
  productId?: string;
  source: AffaireSource;
  estimatedAmount: number;
  targetDate?: Date;
  productDetails?: AffaireProductDetails;
  createdById: string;
}

/**
 * Input pour mettre à jour le statut d'une affaire
 */
export interface UpdateAffaireStatusInput {
  affaireId: string;
  newStatus: AffaireStatus;
  userId: string;
  note?: string;
  rejectionReason?: string;
  cancellationReason?: string;
}

// ============================================
// Operation Gestion Types
// ============================================

/**
 * Types d'opérations de gestion
 */
export const OPERATION_GESTION_TYPES = [
  'VERSEMENT_COMPLEMENTAIRE',
  'ARBITRAGE',
  'RACHAT_PARTIEL',
  'RACHAT_TOTAL',
  'AVANCE',
  'MODIFICATION_BENEFICIAIRE',
  'CHANGEMENT_OPTION_GESTION',
  'TRANSFERT',
] as const;
export type OperationGestionType = typeof OPERATION_GESTION_TYPES[number];

/**
 * Statuts des opérations de gestion
 */
export const OPERATION_GESTION_STATUS = [
  'BROUILLON',
  'EN_ATTENTE_SIGNATURE',
  'ENVOYE',
  'EN_TRAITEMENT',
  'EXECUTE',
  'REJETE',
] as const;
export type OperationGestionStatus = typeof OPERATION_GESTION_STATUS[number];

/**
 * Labels français pour les types d'opérations de gestion
 */
export const OPERATION_GESTION_TYPE_LABELS: Record<OperationGestionType, string> = {
  VERSEMENT_COMPLEMENTAIRE: 'Versement complémentaire',
  ARBITRAGE: 'Arbitrage',
  RACHAT_PARTIEL: 'Rachat partiel',
  RACHAT_TOTAL: 'Rachat total',
  AVANCE: 'Avance',
  MODIFICATION_BENEFICIAIRE: 'Modification clause bénéficiaire',
  CHANGEMENT_OPTION_GESTION: 'Changement option de gestion',
  TRANSFERT: 'Transfert',
};

/**
 * Labels français pour les statuts d'opérations de gestion
 */
export const OPERATION_GESTION_STATUS_LABELS: Record<OperationGestionStatus, string> = {
  BROUILLON: 'Brouillon',
  EN_ATTENTE_SIGNATURE: 'En attente de signature',
  ENVOYE: 'Envoyé',
  EN_TRAITEMENT: 'En traitement',
  EXECUTE: 'Exécuté',
  REJETE: 'Rejeté',
};

/**
 * Transitions de statut valides pour les opérations de gestion
 */
export const OPERATION_GESTION_STATUS_TRANSITIONS: Record<OperationGestionStatus, OperationGestionStatus[]> = {
  BROUILLON: ['EN_ATTENTE_SIGNATURE'],
  EN_ATTENTE_SIGNATURE: ['ENVOYE'],
  ENVOYE: ['EN_TRAITEMENT'],
  EN_TRAITEMENT: ['EXECUTE', 'REJETE'],
  EXECUTE: [],
  REJETE: [],
};

/**
 * Vérifie si une transition de statut est valide pour une opération de gestion
 */
export function isValidOperationGestionTransition(
  fromStatus: OperationGestionStatus,
  toStatus: OperationGestionStatus
): boolean {
  return OPERATION_GESTION_STATUS_TRANSITIONS[fromStatus].includes(toStatus);
}

/**
 * Simulation fiscale pour les rachats
 */
export interface TaxSimulation {
  contractAge: number;
  totalGains: number;
  taxableAmount: number;
  estimatedTax: number;
  taxRate: number;
  socialCharges: number;
}

/**
 * Détails spécifiques par type d'opération de gestion (Discriminated Union)
 */
export type OperationGestionDetails =
  | { type: 'ARBITRAGE'; sourceAllocations: FundAllocation[]; targetAllocations: FundAllocation[]; arbitrageType: 'PONCTUEL' | 'PROGRAMME' }
  | { type: 'RACHAT_PARTIEL'; destinationRib: string; taxSimulation: TaxSimulation }
  | { type: 'RACHAT_TOTAL'; destinationRib: string; taxSimulation: TaxSimulation }
  | { type: 'VERSEMENT_COMPLEMENTAIRE'; allocation: FundAllocation[]; allocationMode: 'IDENTIQUE' | 'NOUVELLE' }
  | { type: 'MODIFICATION_BENEFICIAIRE'; newClause: string; previousClause: string }
  | { type: 'AVANCE'; duration: number; interestRate: number }
  | { type: 'TRANSFERT'; targetProviderId: string; targetProductId: string }
  | { type: 'CHANGEMENT_OPTION_GESTION'; newOption: string; previousOption: string }
  | { type: 'OTHER'; data: Record<string, unknown> };

/**
 * Interface pour une opération de gestion
 */
export interface OperationGestion {
  id: string;
  cabinetId: string;
  reference: string;
  clientId: string;
  contractId: string;
  affaireOrigineId: string;
  type: OperationGestionType;
  status: OperationGestionStatus;
  amount: number | null;
  effectiveDate: Date | null;
  operationDetails: OperationGestionDetails | null;
  requiredDocuments: RequiredDocument[];
  rejectionReason: string | null;
  executedAt: Date | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input pour créer une opération de gestion
 */
export interface CreateOperationGestionInput {
  cabinetId: string;
  clientId: string;
  contractId: string;
  affaireOrigineId: string;
  type: OperationGestionType;
  amount?: number;
  effectiveDate?: Date;
  operationDetails?: OperationGestionDetails;
  createdById: string;
}

/**
 * Input pour mettre à jour le statut d'une opération de gestion
 */
export interface UpdateOperationGestionStatusInput {
  operationId: string;
  newStatus: OperationGestionStatus;
  userId: string;
  note?: string;
  rejectionReason?: string;
}

// ============================================
// Compliance Check Types
// ============================================

/**
 * Statut KYC
 */
export type KYCCheckStatus = 'VALID' | 'EXPIRED' | 'INCOMPLETE';

/**
 * Statut MiFID
 */
export type MiFIDCheckStatus = 'VALID' | 'OUTDATED' | 'MISSING';

/**
 * Statut LCB-FT
 */
export type LCBFTCheckStatus = 'CLEAR' | 'PENDING_REVIEW' | 'HIGH_RISK';

/**
 * Résultat de vérification de conformité
 */
export interface ComplianceCheckResult {
  isCompliant: boolean;
  kycStatus: KYCCheckStatus;
  mifidStatus: MiFIDCheckStatus;
  lcbftStatus: LCBFTCheckStatus;
  issues: ComplianceIssue[];
}

/**
 * Types de problèmes de conformité
 */
export type ComplianceIssueType = 
  | 'KYC_EXPIRED' 
  | 'KYC_MISSING' 
  | 'MIFID_OUTDATED' 
  | 'DOCUMENT_MISSING' 
  | 'HIGH_RISK_ALERT';

/**
 * Problème de conformité
 */
export interface ComplianceIssue {
  type: ComplianceIssueType;
  severity: AlertSeverity;
  description: string;
  actionRequired: string;
  actionUrl: string;
}

/**
 * Document requis pour une opération
 */
export interface RequiredDocument {
  documentType: string;
  status: 'GENERATED' | 'PENDING' | 'MISSING' | 'EXPIRED';
  generatedAt: Date | null;
  signedAt: Date | null;
  documentId: string | null;
  isBlocking: boolean;
}

// ============================================
// Provider Types
// ============================================

/**
 * Types de fournisseurs
 */
export const PROVIDER_TYPES = [
  'ASSUREUR',
  'SOCIETE_GESTION',
  'BANQUE',
  'PLATEFORME',
] as const;
export type ProviderType = typeof PROVIDER_TYPES[number];

/**
 * Statuts de convention
 */
export const CONVENTION_STATUS = ['ACTIVE', 'INACTIVE', 'PENDING'] as const;
export type ConventionStatus = typeof CONVENTION_STATUS[number];

/**
 * Labels français pour les types de fournisseurs
 */
export const PROVIDER_TYPE_LABELS: Record<ProviderType, string> = {
  ASSUREUR: 'Assureur',
  SOCIETE_GESTION: 'Société de gestion',
  BANQUE: 'Banque',
  PLATEFORME: 'Plateforme',
};

/**
 * Labels français pour les statuts de convention
 */
export const CONVENTION_STATUS_LABELS: Record<ConventionStatus, string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  PENDING: 'En attente',
};

/**
 * Informations de contact
 */
export interface ContactInfo {
  name: string;
  email: string;
  phone: string | null;
}

/**
 * Interface pour un fournisseur
 */
export interface Provider {
  id: string;
  cabinetId: string;
  name: string;
  type: ProviderType;
  siren: string | null;
  address: string | null;
  commercialContact: ContactInfo | null;
  backOfficeContact: ContactInfo | null;
  extranetUrl: string | null;
  extranetNotes: string | null;
  commissionGridUrl: string | null;
  conventionStatus: ConventionStatus;
  isFavorite: boolean;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input pour créer un fournisseur
 */
export interface CreateProviderInput {
  cabinetId: string;
  name: string;
  type: ProviderType;
  siren?: string;
  address?: string;
  commercialContact?: ContactInfo;
  backOfficeContact?: ContactInfo;
  extranetUrl?: string;
  extranetNotes?: string;
  commissionGridUrl?: string;
  conventionStatus?: ConventionStatus;
  isFavorite?: boolean;
  notes?: string;
}

// ============================================
// Product Types
// ============================================

/**
 * Caractéristiques d'un produit
 */
export interface ProductCharacteristics {
  entryFees: { min: number; max: number; default: number };
  managementFees: { min: number; max: number; default: number };
  exitFees: number | null;
  options: string[];
}

/**
 * Fonds disponible
 */
export interface Fund {
  id: string;
  isin: string;
  name: string;
  category: string;
  riskLevel: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  ongoingCharges: number;
}

/**
 * Interface pour un produit
 */
export interface Product {
  id: string;
  providerId: string;
  name: string;
  code: string;
  type: ProductType;
  characteristics: ProductCharacteristics;
  availableFunds: Fund[] | null;
  minimumInvestment: number;
  documentTemplates: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input pour créer un produit
 */
export interface CreateProductInput {
  providerId: string;
  name: string;
  code: string;
  type: ProductType;
  characteristics: ProductCharacteristics;
  availableFunds?: Fund[];
  minimumInvestment: number;
  documentTemplates?: string[];
  isActive?: boolean;
}

// ============================================
// Reference Number Generation
// ============================================

/**
 * Génère une référence unique pour une affaire nouvelle
 * Format: AN-YYYY-NNNN
 */
export function generateAffaireReference(sequenceNumber: number): string {
  const year = new Date().getFullYear();
  const paddedSequence = sequenceNumber.toString().padStart(4, '0');
  return `AN-${year}-${paddedSequence}`;
}

/**
 * Génère une référence unique pour une opération de gestion
 * Format: OG-YYYY-NNNN
 */
export function generateOperationReference(sequenceNumber: number): string {
  const year = new Date().getFullYear();
  const paddedSequence = sequenceNumber.toString().padStart(4, '0');
  return `OG-${year}-${paddedSequence}`;
}

// ============================================
// Affaire "En Cours" Categorization
// ============================================

/**
 * Catégorie d'inactivité d'une affaire
 */
export type InactivityCategory = 'GREEN' | 'ORANGE' | 'RED';

/**
 * Détermine la catégorie d'inactivité d'une affaire
 */
export function getAffaireInactivityCategory(
  lastActivityAt: Date,
  currentDate: Date = new Date()
): InactivityCategory {
  const daysSinceActivity = Math.floor(
    (currentDate.getTime() - lastActivityAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceActivity < AFFAIRE_INACTIVITY_THRESHOLDS.GREEN) {
    return 'GREEN';
  }
  if (daysSinceActivity <= AFFAIRE_INACTIVITY_THRESHOLDS.ORANGE) {
    return 'ORANGE';
  }
  return 'RED';
}

/**
 * Vérifie si une affaire doit être catégorisée comme "En Cours"
 */
export function isAffaireEnCours(
  status: AffaireStatus,
  lastActivityAt: Date,
  hasRequiredDocumentsMissing: boolean,
  currentDate: Date = new Date()
): boolean {
  // Doit être dans un statut "en cours"
  if (!AFFAIRE_EN_COURS_STATUSES.includes(status)) {
    return false;
  }

  // Plus de 7 jours depuis la dernière activité OU documents manquants
  const daysSinceActivity = Math.floor(
    (currentDate.getTime() - lastActivityAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  return daysSinceActivity > 7 || hasRequiredDocumentsMissing;
}

// ============================================
// Pilotage / KPIs Types
// ============================================

/**
 * KPIs du pipeline commercial
 */
export interface PipelineKPIs {
  totalPipelineValue: number;
  pipelineByStatus: Record<AffaireStatus, number>;
  pipelineByProductType: Record<ProductType, number>;
  conversionRate: number;
  averageTimeToClose: number;
  dropOffRateByStage: Record<AffaireStatus, number>;
  rejectionReasons: { reason: string; count: number }[];
}

/**
 * KPIs des opérations
 */
export interface OperationKPIs {
  totalOperations: number;
  operationsByType: Record<OperationGestionType, number>;
  operationsByStatus: Record<OperationGestionStatus, number>;
  totalAmountByType: Record<OperationGestionType, number>;
  averageProcessingTime: number;
}

/**
 * Statistiques fournisseur
 */
export interface ProviderStats {
  providerId: string;
  providerName: string;
  totalVolume: number;
  activeContracts: number;
  averageProcessingTime: number;
  rejectionRate: number;
}

/**
 * Filtres pour les affaires
 */
export interface AffaireFilters {
  status?: AffaireStatus[];
  productType?: ProductType[];
  providerId?: string;
  source?: AffaireSource[];
  clientId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  enCoursOnly?: boolean;
}

/**
 * Filtres pour les opérations de gestion
 */
export interface OperationGestionFilters {
  status?: OperationGestionStatus[];
  type?: OperationGestionType[];
  clientId?: string;
  contractId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}
