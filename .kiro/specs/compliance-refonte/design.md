# Design Document: Refonte Section Conformité CGP

## Overview

Ce document décrit l'architecture et la conception technique de la refonte complète de la section Conformité du CRM pour les Conseillers en Gestion de Patrimoine (CGP). L'objectif est de créer un système robuste, professionnel et conforme aux exigences réglementaires (AMF, ACPR, MiFID II, DDA).

### Principes de conception

1. **Type Safety** : Utilisation stricte de TypeScript avec `unknown` au lieu de `any`, types discriminés pour les états
2. **Separation of Concerns** : Architecture en couches (UI → Hooks → Services → API → Database)
3. **Audit Trail** : Traçabilité complète de toutes les actions pour conformité réglementaire
4. **Real-time Updates** : Synchronisation des états entre modules interconnectés
5. **No Mocks** : Données réelles uniquement, seed data pour développement/démo

### Modules principaux

```
┌─────────────────────────────────────────────────────────────────────┐
│                        COMPLIANCE SYSTEM                             │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │  Dashboard  │  │    KYC      │  │  Controls   │  │ Reclamations│ │
│  │  Conformité │  │  Documents  │  │   ACPR      │  │    SLA      │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘ │
│         │                │                │                │        │
│  ┌──────┴────────────────┴────────────────┴────────────────┴──────┐ │
│  │                      Alert Engine                               │ │
│  └──────┬────────────────┬────────────────┬────────────────┬──────┘ │
│         │                │                │                │        │
│  ┌──────┴──────┐  ┌──────┴──────┐  ┌──────┴──────┐  ┌──────┴──────┐ │
│  │  Document   │  │   MiFID     │  │  Signature  │  │   Client    │ │
│  │  Generator  │  │Questionnaire│  │   Manager   │  │   Portal    │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │
├─────────────────────────────────────────────────────────────────────┤
│                        OPERATIONS SYSTEM                             │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │  Affaires   │  │  Affaires   │  │ Opérations  │  │  Pilotage   │ │
│  │  Nouvelles  │  │  en Cours   │  │  Gestion    │  │ Commercial  │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘ │
│         │                │                │                │        │
│  ┌──────┴────────────────┴────────────────┴────────────────┴──────┐ │
│  │                    Provider Catalog                             │ │
│  └─────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────┤
│                        SHARED SERVICES                               │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │ Compliance  │  │   Audit     │  │  Template   │  │   Export    │ │
│  │  Timeline   │  │    Log      │  │   Manager   │  │   Service   │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```


## Architecture

### Technology Stack

- **Frontend**: Next.js 14+ (App Router), React 18+, TypeScript 5+
- **UI Components**: shadcn/ui, Radix UI primitives, Tailwind CSS
- **State Management**: React Query (TanStack Query) pour server state, Zustand pour client state
- **Forms**: React Hook Form + Zod validation
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL (via Prisma)
- **PDF Generation**: @react-pdf/renderer ou pdfmake
- **Document Export**: docx (pour Word), jsPDF (pour PDF)

### Directory Structure

```
app/
├── (advisor)/
│   └── (frontend)/
│       └── dashboard/
│           ├── conformite/
│           │   ├── page.tsx                    # Dashboard conformité
│           │   ├── documents/
│           │   │   └── page.tsx                # Gestion documents KYC
│           │   ├── controles/
│           │   │   └── page.tsx                # Contrôles ACPR
│           │   ├── reclamations/
│           │   │   └── page.tsx                # Gestion réclamations
│           │   └── alertes/
│           │       └── page.tsx                # Centre d'alertes
│           ├── operations/
│           │   ├── page.tsx                    # Dashboard opérations
│           │   ├── affaires-nouvelles/
│           │   │   ├── page.tsx                # Liste affaires nouvelles
│           │   │   ├── [id]/
│           │   │   │   └── page.tsx            # Détail affaire
│           │   │   └── nouvelle/
│           │   │       └── page.tsx            # Création affaire
│           │   ├── en-cours/
│           │   │   └── page.tsx                # Affaires en cours
│           │   ├── gestion/
│           │   │   └── page.tsx                # Opérations de gestion
│           │   └── pilotage/
│           │       └── page.tsx                # Dashboard pilotage
│           └── clients/
│               └── [id]/
│                   ├── conformite/
│                   │   └── page.tsx            # Conformité client
│                   └── operations/
│                       └── page.tsx            # Opérations client
├── api/
│   └── v1/
│       ├── compliance/
│       │   ├── documents/
│       │   ├── controls/
│       │   ├── reclamations/
│       │   ├── alerts/
│       │   └── timeline/
│       ├── operations/
│       │   ├── affaires/
│       │   ├── gestion/
│       │   └── providers/
│       └── documents/
│           ├── generate/
│           └── export/
lib/
├── compliance/
│   ├── types.ts                                # Types TypeScript
│   ├── schemas.ts                              # Zod schemas
│   ├── services/
│   │   ├── document-service.ts
│   │   ├── control-service.ts
│   │   ├── reclamation-service.ts
│   │   ├── alert-service.ts
│   │   └── timeline-service.ts
│   └── utils/
│       ├── expiration-calculator.ts
│       ├── sla-calculator.ts
│       └── risk-calculator.ts
├── operations/
│   ├── types.ts
│   ├── schemas.ts
│   ├── services/
│   │   ├── affaire-service.ts
│   │   ├── operation-gestion-service.ts
│   │   └── provider-service.ts
│   └── utils/
│       ├── document-requirements.ts
│       └── commission-calculator.ts
└── documents/
    ├── types.ts
    ├── templates/
    │   ├── der-template.ts
    │   ├── lettre-mission-template.ts
    │   └── recueil-template.ts
    └── generators/
        ├── pdf-generator.ts
        └── docx-generator.ts
```


## Components and Interfaces

### Core Type Definitions

```typescript
// lib/compliance/types.ts

// ============================================
// Document KYC Types
// ============================================

export const KYC_DOCUMENT_TYPES = [
  'PIECE_IDENTITE',
  'JUSTIFICATIF_DOMICILE', 
  'RIB',
  'AVIS_IMPOSITION',
  'JUSTIFICATIF_PATRIMOINE',
  'ORIGINE_FONDS',
] as const;

export type KYCDocumentType = typeof KYC_DOCUMENT_TYPES[number];

export const KYC_DOCUMENT_STATUS = [
  'EN_ATTENTE',
  'VALIDE',
  'REJETE',
  'EXPIRE',
] as const;

export type KYCDocumentStatus = typeof KYC_DOCUMENT_STATUS[number];

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

// Expiration rules by document type (in days)
export const DOCUMENT_EXPIRATION_RULES: Record<KYCDocumentType, number> = {
  PIECE_IDENTITE: 3650,        // 10 years
  JUSTIFICATIF_DOMICILE: 90,   // 3 months
  RIB: 0,                       // No expiration
  AVIS_IMPOSITION: 365,        // 1 year
  JUSTIFICATIF_PATRIMOINE: 365, // 1 year
  ORIGINE_FONDS: 0,            // No expiration (one-time)
};

// ============================================
// Alert Types
// ============================================

export const ALERT_SEVERITY = ['LOW', 'WARNING', 'HIGH', 'CRITICAL'] as const;
export type AlertSeverity = typeof ALERT_SEVERITY[number];

export const ALERT_TYPE = [
  'DOCUMENT_EXPIRING',
  'DOCUMENT_EXPIRED',
  'KYC_INCOMPLETE',
  'CONTROL_OVERDUE',
  'RECLAMATION_SLA_BREACH',
  'MIFID_OUTDATED',
  'OPERATION_BLOCKED',
  'AFFAIRE_INACTIVE',
] as const;
export type AlertType = typeof ALERT_TYPE[number];

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

// ============================================
// Control Types (ACPR)
// ============================================

export const CONTROL_TYPES = [
  'VERIFICATION_IDENTITE',
  'SITUATION_FINANCIERE',
  'PROFIL_RISQUE',
  'ORIGINE_PATRIMOINE',
  'PPE_CHECK',
  'REVUE_PERIODIQUE',
] as const;
export type ControlType = typeof CONTROL_TYPES[number];

export const CONTROL_STATUS = [
  'EN_ATTENTE',
  'EN_COURS',
  'TERMINE',
  'EN_RETARD',
] as const;
export type ControlStatus = typeof CONTROL_STATUS[number];

export const CONTROL_PRIORITY = ['BASSE', 'MOYENNE', 'HAUTE', 'URGENTE'] as const;
export type ControlPriority = typeof CONTROL_PRIORITY[number];

export const RISK_LEVEL = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
export type RiskLevel = typeof RISK_LEVEL[number];

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
  score: number | null;        // 0-100
  riskLevel: RiskLevel | null;
  createdAt: Date;
  updatedAt: Date;
}

// Risk level calculation
export function calculateRiskLevel(score: number): RiskLevel {
  if (score < 30) return 'LOW';
  if (score < 60) return 'MEDIUM';
  if (score < 85) return 'HIGH';
  return 'CRITICAL';
}
```


```typescript
// lib/compliance/types.ts (continued)

// ============================================
// Reclamation Types
// ============================================

export const RECLAMATION_TYPES = [
  'QUALITE_SERVICE',
  'TARIFICATION',
  'QUALITE_CONSEIL',
  'COMMUNICATION',
  'DOCUMENT',
  'AUTRE',
] as const;
export type ReclamationType = typeof RECLAMATION_TYPES[number];

export const RECLAMATION_STATUS = [
  'RECUE',
  'EN_COURS',
  'EN_ATTENTE_INFO',
  'RESOLUE',
  'CLOTUREE',
] as const;
export type ReclamationStatus = typeof RECLAMATION_STATUS[number];

export const SLA_SEVERITY = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
export type SLASeverity = typeof SLA_SEVERITY[number];

// SLA deadlines in days by severity
export const SLA_DEADLINES: Record<SLASeverity, number> = {
  LOW: 60,
  MEDIUM: 30,
  HIGH: 15,
  CRITICAL: 7,
};

export interface Reclamation {
  id: string;
  cabinetId: string;
  clientId: string;
  reference: string;           // REC-YYYY-NNNN
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

// ============================================
// Compliance Timeline Types
// ============================================

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
```

```typescript
// lib/operations/types.ts

// ============================================
// Operation Types
// ============================================

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

export const AFFAIRE_SOURCE = [
  'PROSPECTION',
  'REFERRAL',
  'CLIENT_EXISTANT',
  'PARTENAIRE',
  'SITE_WEB',
  'AUTRE',
] as const;
export type AffaireSource = typeof AFFAIRE_SOURCE[number];

export interface AffaireNouvelle {
  id: string;
  cabinetId: string;
  reference: string;           // AN-YYYY-NNNN
  clientId: string;
  productType: ProductType;
  providerId: string;
  status: AffaireStatus;
  source: AffaireSource;
  estimatedAmount: number;
  actualAmount: number | null;
  targetDate: Date | null;
  
  // Product-specific data
  productDetails: AffaireProductDetails;
  
  // Compliance
  complianceStatus: ComplianceCheckResult;
  requiredDocuments: RequiredDocument[];
  
  // Fees
  entryFees: number | null;
  managementFees: number | null;
  expectedCommission: number | null;
  
  // Tracking
  lastActivityAt: Date;
  pausedAt: Date | null;
  pauseReason: string | null;
  rejectionReason: string | null;
  cancellationReason: string | null;
  
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

// Discriminated union for product-specific details
export type AffaireProductDetails =
  | { type: 'ASSURANCE_VIE'; allocation: FundAllocation[]; beneficiaryClause: string; paymentMode: PaymentMode }
  | { type: 'PER_INDIVIDUEL'; compartment: PERCompartment; beneficiaryClause: string; exitOptions: PERExitOption[] }
  | { type: 'SCPI'; numberOfShares: number; paymentSchedule: PaymentSchedule; dismemberment: DismembermentOption | null }
  | { type: 'COMPTE_TITRES'; allocation: FundAllocation[]; mandateType: MandateType }
  | { type: 'FCPR' | 'FCPI' | 'FIP'; commitmentAmount: number; callSchedule: CallSchedule[]; lockUpPeriod: number }
  | { type: 'OTHER'; data: Record<string, unknown> };

export interface FundAllocation {
  fundId: string;
  fundName: string;
  percentage: number;
}

export type PaymentMode = 'UNIQUE' | 'PROGRAMME' | 'LIBRE';
export type PERCompartment = 'INDIVIDUEL' | 'COLLECTIF' | 'OBLIGATOIRE';
export type PERExitOption = 'CAPITAL' | 'RENTE' | 'MIXTE';
export type MandateType = 'CONSEIL' | 'GESTION_PILOTEE' | 'GESTION_LIBRE';

export interface PaymentSchedule {
  date: Date;
  amount: number;
  status: 'PENDING' | 'PAID';
}

export interface DismembermentOption {
  type: 'NUE_PROPRIETE' | 'USUFRUIT';
  duration: number | null;
  counterpartyId: string | null;
}

export interface CallSchedule {
  callNumber: number;
  expectedDate: Date;
  percentage: number;
  status: 'PENDING' | 'CALLED' | 'PAID';
}
```


```typescript
// lib/operations/types.ts (continued)

// ============================================
// Operation Gestion Types
// ============================================

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

export const OPERATION_GESTION_STATUS = [
  'BROUILLON',
  'EN_ATTENTE_SIGNATURE',
  'ENVOYE',
  'EN_TRAITEMENT',
  'EXECUTE',
  'REJETE',
] as const;
export type OperationGestionStatus = typeof OPERATION_GESTION_STATUS[number];

export interface OperationGestion {
  id: string;
  cabinetId: string;
  reference: string;           // OG-YYYY-NNNN
  clientId: string;
  contractId: string;          // Reference to original contract/affaire
  affaireOrigineId: string;    // Link to original AffaireNouvelle
  type: OperationGestionType;
  status: OperationGestionStatus;
  amount: number | null;
  effectiveDate: Date | null;
  
  // Type-specific details
  operationDetails: OperationGestionDetails;
  
  // Compliance
  requiredDocuments: RequiredDocument[];
  
  // Tracking
  rejectionReason: string | null;
  executedAt: Date | null;
  
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

// Discriminated union for operation-specific details
export type OperationGestionDetails =
  | { type: 'ARBITRAGE'; sourceAllocations: FundAllocation[]; targetAllocations: FundAllocation[]; arbitrageType: 'PONCTUEL' | 'PROGRAMME' }
  | { type: 'RACHAT_PARTIEL' | 'RACHAT_TOTAL'; destinationRib: string; taxSimulation: TaxSimulation }
  | { type: 'VERSEMENT_COMPLEMENTAIRE'; allocation: FundAllocation[]; allocationMode: 'IDENTIQUE' | 'NOUVELLE' }
  | { type: 'MODIFICATION_BENEFICIAIRE'; newClause: string; previousClause: string }
  | { type: 'AVANCE'; duration: number; interestRate: number }
  | { type: 'TRANSFERT'; targetProviderId: string; targetProductId: string }
  | { type: 'OTHER'; data: Record<string, unknown> };

export interface TaxSimulation {
  contractAge: number;
  totalGains: number;
  taxableAmount: number;
  estimatedTax: number;
  taxRate: number;
  socialCharges: number;
}

// ============================================
// Compliance Check for Operations
// ============================================

export interface ComplianceCheckResult {
  isCompliant: boolean;
  kycStatus: 'VALID' | 'EXPIRED' | 'INCOMPLETE';
  mifidStatus: 'VALID' | 'OUTDATED' | 'MISSING';
  lcbftStatus: 'CLEAR' | 'PENDING_REVIEW' | 'HIGH_RISK';
  issues: ComplianceIssue[];
}

export interface ComplianceIssue {
  type: 'KYC_EXPIRED' | 'KYC_MISSING' | 'MIFID_OUTDATED' | 'DOCUMENT_MISSING' | 'HIGH_RISK_ALERT';
  severity: AlertSeverity;
  description: string;
  actionRequired: string;
  actionUrl: string;
}

export interface RequiredDocument {
  documentType: RegulatoryDocumentType;
  status: 'GENERATED' | 'PENDING' | 'MISSING' | 'EXPIRED';
  generatedAt: Date | null;
  signedAt: Date | null;
  documentId: string | null;
  isBlocking: boolean;
}

// ============================================
// Provider and Product Catalog
// ============================================

export const PROVIDER_TYPES = [
  'ASSUREUR',
  'SOCIETE_GESTION',
  'BANQUE',
  'PLATEFORME',
] as const;
export type ProviderType = typeof PROVIDER_TYPES[number];

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
  conventionStatus: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  isFavorite: boolean;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContactInfo {
  name: string;
  email: string;
  phone: string | null;
}

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

export interface ProductCharacteristics {
  entryFees: { min: number; max: number; default: number };
  managementFees: { min: number; max: number; default: number };
  exitFees: number | null;
  options: string[];
}

export interface Fund {
  id: string;
  isin: string;
  name: string;
  category: string;
  riskLevel: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  ongoingCharges: number;
}
```


```typescript
// lib/documents/types.ts

// ============================================
// Regulatory Document Types
// ============================================

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

export const ASSOCIATION_TYPES = [
  'CNCGP',
  'ANACOFI',
  'CNCEF',
  'GENERIC',
] as const;
export type AssociationType = typeof ASSOCIATION_TYPES[number];

export interface DocumentTemplate {
  id: string;
  cabinetId: string;
  documentType: RegulatoryDocumentType;
  associationType: AssociationType;
  providerId: string | null;    // Provider-specific template
  name: string;
  version: string;
  content: DocumentTemplateContent;
  mandatorySections: string[];
  customizableSections: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentTemplateContent {
  header: TemplateSection;
  sections: TemplateSection[];
  footer: TemplateSection;
  styles: DocumentStyles;
}

export interface TemplateSection {
  id: string;
  title: string;
  content: string;              // Markdown with placeholders {{variable}}
  isMandatory: boolean;
  order: number;
}

export interface DocumentStyles {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  logoUrl: string | null;
  headerHeight: number;
  footerHeight: number;
}

// ============================================
// Generated Document
// ============================================

export interface GeneratedDocument {
  id: string;
  cabinetId: string;
  clientId: string;
  operationId: string | null;
  templateId: string;
  documentType: RegulatoryDocumentType;
  fileName: string;
  fileUrl: string;
  format: 'PDF' | 'DOCX';
  status: 'DRAFT' | 'FINAL' | 'SIGNED';
  signatureStatus: SignatureStatus | null;
  generatedData: Record<string, unknown>;  // Data used to generate
  generatedById: string;
  generatedAt: Date;
  signedAt: Date | null;
  expiresAt: Date | null;
}

export interface SignatureStatus {
  signatureRequestId: string;
  signers: SignerStatus[];
  status: 'PENDING' | 'IN_PROGRESS' | 'PARTIALLY_SIGNED' | 'SIGNED' | 'REJECTED' | 'EXPIRED';
  sentAt: Date;
  completedAt: Date | null;
}

export interface SignerStatus {
  email: string;
  name: string;
  role: 'CLIENT' | 'ADVISOR' | 'WITNESS';
  order: number;
  status: 'PENDING' | 'SIGNED' | 'REJECTED';
  signedAt: Date | null;
}

// ============================================
// Document Requirements by Operation Type
// ============================================

export interface DocumentRequirements {
  operationType: 'AFFAIRE_NOUVELLE' | OperationGestionType;
  productType: ProductType | null;
  isFirstRelation: boolean;
  required: DocumentRequirement[];
}

export interface DocumentRequirement {
  documentType: RegulatoryDocumentType;
  condition: DocumentCondition;
  isBlocking: boolean;
}

export type DocumentCondition =
  | { type: 'ALWAYS' }
  | { type: 'IF_FIRST_RELATION' }
  | { type: 'IF_OUTDATED'; maxAgeDays: number }
  | { type: 'IF_AMOUNT_ABOVE'; threshold: number }
  | { type: 'IF_PRODUCT_TYPE'; productTypes: ProductType[] }
  | { type: 'IF_ALLOCATION_CHANGED' };

// Document requirements configuration
export const AFFAIRE_NOUVELLE_REQUIREMENTS: DocumentRequirement[] = [
  { documentType: 'DER', condition: { type: 'IF_FIRST_RELATION' }, isBlocking: true },
  { documentType: 'RECUEIL_INFORMATIONS', condition: { type: 'IF_OUTDATED', maxAgeDays: 365 }, isBlocking: true },
  { documentType: 'QUESTIONNAIRE_MIFID', condition: { type: 'IF_OUTDATED', maxAgeDays: 365 }, isBlocking: true },
  { documentType: 'LETTRE_MISSION', condition: { type: 'ALWAYS' }, isBlocking: true },
  { documentType: 'DECLARATION_ADEQUATION', condition: { type: 'ALWAYS' }, isBlocking: true },
  { documentType: 'BULLETIN_SOUSCRIPTION', condition: { type: 'ALWAYS' }, isBlocking: true },
];

export const ARBITRAGE_REQUIREMENTS: DocumentRequirement[] = [
  { documentType: 'RAPPORT_MISSION', condition: { type: 'ALWAYS' }, isBlocking: true },
  { documentType: 'DECLARATION_ADEQUATION', condition: { type: 'ALWAYS' }, isBlocking: true },
  { documentType: 'ORDRE_ARBITRAGE', condition: { type: 'ALWAYS' }, isBlocking: true },
];

export const RACHAT_REQUIREMENTS: DocumentRequirement[] = [
  { documentType: 'DEMANDE_RACHAT', condition: { type: 'ALWAYS' }, isBlocking: true },
  { documentType: 'SIMULATION_FISCALE', condition: { type: 'ALWAYS' }, isBlocking: false },
  { documentType: 'RAPPORT_MISSION', condition: { type: 'IF_ALLOCATION_CHANGED' }, isBlocking: false },
];

export const VERSEMENT_REQUIREMENTS: DocumentRequirement[] = [
  { documentType: 'BULLETIN_VERSEMENT', condition: { type: 'ALWAYS' }, isBlocking: true },
  { documentType: 'DECLARATION_ADEQUATION', condition: { type: 'IF_ALLOCATION_CHANGED' }, isBlocking: true },
  { documentType: 'RECUEIL_INFORMATIONS', condition: { type: 'IF_OUTDATED', maxAgeDays: 365 }, isBlocking: false },
];
```


## Data Models

### Database Schema Extensions

```prisma
// prisma/schema.prisma - New and updated models

// ============================================
// Compliance Alert Model
// ============================================

model ComplianceAlert {
  id              String        @id @default(cuid())
  cabinetId       String
  cabinet         Cabinet       @relation(fields: [cabinetId], references: [id], onDelete: Cascade)
  clientId        String?
  client          Client?       @relation(fields: [clientId], references: [id], onDelete: Cascade)
  operationId     String?
  type            AlertType
  severity        AlertSeverity
  title           String
  description     String        @db.Text
  actionRequired  String
  actionUrl       String?
  acknowledged    Boolean       @default(false)
  acknowledgedAt  DateTime?
  acknowledgedById String?
  acknowledgedBy  User?         @relation("AlertAcknowledger", fields: [acknowledgedById], references: [id])
  resolved        Boolean       @default(false)
  resolvedAt      DateTime?
  createdAt       DateTime      @default(now())

  @@index([cabinetId])
  @@index([clientId])
  @@index([severity])
  @@index([resolved])
  @@map("compliance_alerts")
}

enum AlertType {
  DOCUMENT_EXPIRING
  DOCUMENT_EXPIRED
  KYC_INCOMPLETE
  CONTROL_OVERDUE
  RECLAMATION_SLA_BREACH
  MIFID_OUTDATED
  OPERATION_BLOCKED
  AFFAIRE_INACTIVE
}

enum AlertSeverity {
  LOW
  WARNING
  HIGH
  CRITICAL
}

// ============================================
// Compliance Timeline Model
// ============================================

model ComplianceTimelineEvent {
  id          String            @id @default(cuid())
  cabinetId   String
  cabinet     Cabinet           @relation(fields: [cabinetId], references: [id], onDelete: Cascade)
  clientId    String
  client      Client            @relation(fields: [clientId], references: [id], onDelete: Cascade)
  operationId String?
  type        TimelineEventType
  title       String
  description String            @db.Text
  metadata    Json?
  userId      String
  user        User              @relation(fields: [userId], references: [id])
  createdAt   DateTime          @default(now())

  @@index([cabinetId])
  @@index([clientId])
  @@index([operationId])
  @@index([type])
  @@index([createdAt])
  @@map("compliance_timeline_events")
}

enum TimelineEventType {
  DOCUMENT_UPLOADED
  DOCUMENT_VALIDATED
  DOCUMENT_REJECTED
  DOCUMENT_EXPIRED
  REMINDER_SENT
  CONTROL_CREATED
  CONTROL_COMPLETED
  QUESTIONNAIRE_COMPLETED
  RECLAMATION_CREATED
  RECLAMATION_RESOLVED
  OPERATION_CREATED
  OPERATION_STATUS_CHANGED
  DOCUMENT_GENERATED
  DOCUMENT_SIGNED
  DOCUMENT_EXPORTED
}

// ============================================
// Affaire Nouvelle Model
// ============================================

model AffaireNouvelle {
  id                  String              @id @default(cuid())
  cabinetId           String
  cabinet             Cabinet             @relation(fields: [cabinetId], references: [id], onDelete: Cascade)
  reference           String              @unique
  clientId            String
  client              Client              @relation(fields: [clientId], references: [id], onDelete: Cascade)
  productType         ProductType
  providerId          String
  provider            Provider            @relation(fields: [providerId], references: [id])
  productId           String?
  product             Product?            @relation(fields: [productId], references: [id])
  status              AffaireStatus       @default(PROSPECT)
  source              AffaireSource
  estimatedAmount     Decimal             @db.Decimal(15, 2)
  actualAmount        Decimal?            @db.Decimal(15, 2)
  targetDate          DateTime?
  productDetails      Json?               // Type-specific details
  entryFees           Decimal?            @db.Decimal(5, 2)
  managementFees      Decimal?            @db.Decimal(5, 2)
  expectedCommission  Decimal?            @db.Decimal(15, 2)
  lastActivityAt      DateTime            @default(now())
  pausedAt            DateTime?
  pauseReason         String?
  rejectionReason     String?             @db.Text
  cancellationReason  String?             @db.Text
  createdById         String
  createdBy           User                @relation("AffaireCreator", fields: [createdById], references: [id])
  createdAt           DateTime            @default(now())
  updatedAt           DateTime            @updatedAt

  // Relations
  operationsGestion   OperationGestion[]
  documents           GeneratedDocument[]
  statusHistory       AffaireStatusHistory[]

  @@index([cabinetId])
  @@index([clientId])
  @@index([status])
  @@index([providerId])
  @@index([lastActivityAt])
  @@map("affaires_nouvelles")
}

model AffaireStatusHistory {
  id          String        @id @default(cuid())
  affaireId   String
  affaire     AffaireNouvelle @relation(fields: [affaireId], references: [id], onDelete: Cascade)
  fromStatus  AffaireStatus?
  toStatus    AffaireStatus
  note        String?       @db.Text
  userId      String
  user        User          @relation(fields: [userId], references: [id])
  createdAt   DateTime      @default(now())

  @@index([affaireId])
  @@map("affaire_status_history")
}

enum ProductType {
  ASSURANCE_VIE
  PER_INDIVIDUEL
  PER_ENTREPRISE
  SCPI
  OPCI
  COMPTE_TITRES
  PEA
  PEA_PME
  CAPITALISATION
  FCPR
  FCPI
  FIP
  IMMOBILIER_DIRECT
  CREDIT_IMMOBILIER
}

enum AffaireStatus {
  PROSPECT
  QUALIFICATION
  CONSTITUTION
  SIGNATURE
  ENVOYE
  EN_TRAITEMENT
  VALIDE
  REJETE
  ANNULE
}

enum AffaireSource {
  PROSPECTION
  REFERRAL
  CLIENT_EXISTANT
  PARTENAIRE
  SITE_WEB
  AUTRE
}
```


```prisma
// prisma/schema.prisma - Continued

// ============================================
// Operation Gestion Model
// ============================================

model OperationGestion {
  id                String                @id @default(cuid())
  cabinetId         String
  cabinet           Cabinet               @relation(fields: [cabinetId], references: [id], onDelete: Cascade)
  reference         String                @unique
  clientId          String
  client            Client                @relation(fields: [clientId], references: [id], onDelete: Cascade)
  contractId        String                // External contract reference
  affaireOrigineId  String
  affaireOrigine    AffaireNouvelle       @relation(fields: [affaireOrigineId], references: [id])
  type              OperationGestionType
  status            OperationGestionStatus @default(BROUILLON)
  amount            Decimal?              @db.Decimal(15, 2)
  effectiveDate     DateTime?
  operationDetails  Json?                 // Type-specific details
  rejectionReason   String?               @db.Text
  executedAt        DateTime?
  createdById       String
  createdBy         User                  @relation("OperationCreator", fields: [createdById], references: [id])
  createdAt         DateTime              @default(now())
  updatedAt         DateTime              @updatedAt

  // Relations
  documents         GeneratedDocument[]
  statusHistory     OperationStatusHistory[]

  @@index([cabinetId])
  @@index([clientId])
  @@index([affaireOrigineId])
  @@index([status])
  @@map("operations_gestion")
}

model OperationStatusHistory {
  id            String              @id @default(cuid())
  operationId   String
  operation     OperationGestion    @relation(fields: [operationId], references: [id], onDelete: Cascade)
  fromStatus    OperationGestionStatus?
  toStatus      OperationGestionStatus
  note          String?             @db.Text
  userId        String
  user          User                @relation(fields: [userId], references: [id])
  createdAt     DateTime            @default(now())

  @@index([operationId])
  @@map("operation_status_history")
}

enum OperationGestionType {
  VERSEMENT_COMPLEMENTAIRE
  ARBITRAGE
  RACHAT_PARTIEL
  RACHAT_TOTAL
  AVANCE
  MODIFICATION_BENEFICIAIRE
  CHANGEMENT_OPTION_GESTION
  TRANSFERT
}

enum OperationGestionStatus {
  BROUILLON
  EN_ATTENTE_SIGNATURE
  ENVOYE
  EN_TRAITEMENT
  EXECUTE
  REJETE
}

// ============================================
// Provider and Product Models
// ============================================

model Provider {
  id                String        @id @default(cuid())
  cabinetId         String
  cabinet           Cabinet       @relation(fields: [cabinetId], references: [id], onDelete: Cascade)
  name              String
  type              ProviderType
  siren             String?
  address           String?
  commercialContact Json?         // ContactInfo
  backOfficeContact Json?         // ContactInfo
  extranetUrl       String?
  extranetNotes     String?       @db.Text
  commissionGridUrl String?
  conventionStatus  ConventionStatus @default(ACTIVE)
  isFavorite        Boolean       @default(false)
  notes             String?       @db.Text
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt

  // Relations
  products          Product[]
  affaires          AffaireNouvelle[]
  templates         DocumentTemplate[]

  @@index([cabinetId])
  @@index([type])
  @@map("providers")
}

model Product {
  id                String      @id @default(cuid())
  providerId        String
  provider          Provider    @relation(fields: [providerId], references: [id], onDelete: Cascade)
  name              String
  code              String
  type              ProductType
  characteristics   Json        // ProductCharacteristics
  availableFunds    Json?       // Fund[]
  minimumInvestment Decimal     @db.Decimal(15, 2)
  documentTemplates String[]    // Template IDs
  isActive          Boolean     @default(true)
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt

  // Relations
  affaires          AffaireNouvelle[]

  @@index([providerId])
  @@index([type])
  @@map("products")
}

enum ProviderType {
  ASSUREUR
  SOCIETE_GESTION
  BANQUE
  PLATEFORME
}

enum ConventionStatus {
  ACTIVE
  INACTIVE
  PENDING
}

// ============================================
// Document Template Model
// ============================================

model DocumentTemplate {
  id                   String                @id @default(cuid())
  cabinetId            String
  cabinet              Cabinet               @relation(fields: [cabinetId], references: [id], onDelete: Cascade)
  documentType         RegulatoryDocumentType
  associationType      AssociationType       @default(GENERIC)
  providerId           String?
  provider             Provider?             @relation(fields: [providerId], references: [id])
  name                 String
  version              String
  content              Json                  // DocumentTemplateContent
  mandatorySections    String[]
  customizableSections String[]
  isActive             Boolean               @default(true)
  createdAt            DateTime              @default(now())
  updatedAt            DateTime              @updatedAt

  // Relations
  generatedDocuments   GeneratedDocument[]

  @@index([cabinetId])
  @@index([documentType])
  @@index([associationType])
  @@map("document_templates")
}

enum RegulatoryDocumentType {
  DER
  RECUEIL_INFORMATIONS
  LETTRE_MISSION
  RAPPORT_MISSION
  CONVENTION_HONORAIRES
  ATTESTATION_CONSEIL
  MANDAT_GESTION
  DECLARATION_ADEQUATION
  QUESTIONNAIRE_MIFID
  BULLETIN_SOUSCRIPTION
  ORDRE_ARBITRAGE
  DEMANDE_RACHAT
  BULLETIN_VERSEMENT
  SIMULATION_FISCALE
}

enum AssociationType {
  CNCGP
  ANACOFI
  CNCEF
  GENERIC
}

// ============================================
// Generated Document Model
// ============================================

model GeneratedDocument {
  id              String                @id @default(cuid())
  cabinetId       String
  cabinet         Cabinet               @relation(fields: [cabinetId], references: [id], onDelete: Cascade)
  clientId        String
  client          Client                @relation(fields: [clientId], references: [id], onDelete: Cascade)
  affaireId       String?
  affaire         AffaireNouvelle?      @relation(fields: [affaireId], references: [id])
  operationId     String?
  operation       OperationGestion?     @relation(fields: [operationId], references: [id])
  templateId      String
  template        DocumentTemplate      @relation(fields: [templateId], references: [id])
  documentType    RegulatoryDocumentType
  fileName        String
  fileUrl         String
  format          DocumentFormat
  status          DocumentStatus        @default(DRAFT)
  signatureStatus Json?                 // SignatureStatus
  generatedData   Json                  // Data used to generate
  generatedById   String
  generatedBy     User                  @relation(fields: [generatedById], references: [id])
  generatedAt     DateTime              @default(now())
  signedAt        DateTime?
  expiresAt       DateTime?

  @@index([cabinetId])
  @@index([clientId])
  @@index([affaireId])
  @@index([operationId])
  @@index([documentType])
  @@map("generated_documents")
}

enum DocumentFormat {
  PDF
  DOCX
}

enum DocumentStatus {
  DRAFT
  FINAL
  SIGNED
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Document Expiration Calculation

*For any* KYC document with a known type and upload date, the calculated expiration date SHALL equal the upload date plus the type-specific expiration period (ID: 10 years, Domicile: 3 months, Tax notice: 1 year, etc.).

**Validates: Requirements 2.6**

### Property 2: Document Status Transitions

*For any* KYC document, the status transitions SHALL follow valid paths:
- Upload → EN_ATTENTE
- EN_ATTENTE → VALIDE (with validation date set)
- EN_ATTENTE → REJETE (with rejection reason required)
- Any status → EXPIRE (when expiration date passed)

**Validates: Requirements 2.2, 2.3, 2.4, 2.5**

### Property 3: Alert Severity Assignment

*For any* document with an expiration date:
- If expired: severity = CRITICAL
- If expiring within 7 days: severity = HIGH
- If expiring within 30 days: severity = WARNING
- Otherwise: no alert

**Validates: Requirements 3.1, 3.2, 3.3**

### Property 4: Risk Level Calculation

*For any* risk score between 0 and 100, the calculated risk level SHALL be:
- 0-29: LOW
- 30-59: MEDIUM
- 60-84: HIGH
- 85-100: CRITICAL

**Validates: Requirements 4.4**

### Property 5: SLA Deadline Calculation

*For any* reclamation with a severity level, the SLA deadline SHALL equal the creation date plus:
- LOW: 60 days
- MEDIUM: 30 days
- HIGH: 15 days
- CRITICAL: 7 days

**Validates: Requirements 5.3**

### Property 6: SLA Breach Detection

*For any* reclamation where current date > SLA deadline AND status NOT IN (RESOLUE, CLOTUREE), the slaBreach flag SHALL be true.

**Validates: Requirements 5.5**

### Property 7: Reference Number Format

*For any* generated reference number:
- Affaire Nouvelle: matches pattern AN-YYYY-NNNN where YYYY is current year
- Operation Gestion: matches pattern OG-YYYY-NNNN where YYYY is current year
- All references within a cabinet are unique

**Validates: Requirements 5.2, 18.2**

### Property 8: Reclamation Status Workflow

*For any* reclamation status transition, the transition SHALL be valid according to:
- RECUE → EN_COURS
- EN_COURS → EN_ATTENTE_INFO | RESOLUE
- EN_ATTENTE_INFO → EN_COURS
- RESOLUE → CLOTUREE

Invalid transitions SHALL be rejected.

**Validates: Requirements 5.4**

### Property 9: Affaire Status Workflow

*For any* Affaire Nouvelle status transition, the transition SHALL follow valid paths:
- PROSPECT → QUALIFICATION → CONSTITUTION → SIGNATURE → ENVOYE → EN_TRAITEMENT → VALIDE
- Any status before ENVOYE → ANNULE
- EN_TRAITEMENT → REJETE

**Validates: Requirements 19.1**

### Property 10: Operation Gestion Status Workflow

*For any* Operation Gestion status transition:
- BROUILLON → EN_ATTENTE_SIGNATURE → ENVOYE → EN_TRAITEMENT → EXECUTE
- EN_TRAITEMENT → REJETE

**Validates: Requirements 21.3**

### Property 11: Audit Log Completeness

*For any* status change on KYCDocument, Reclamation, AffaireNouvelle, or OperationGestion, an audit log entry SHALL be created with timestamp and user ID.

**Validates: Requirements 8.1, 8.2**

### Property 12: Document Filter Correctness

*For any* filter applied to documents (status, type, client, date range), all returned documents SHALL match ALL filter criteria, and no matching documents SHALL be excluded.

**Validates: Requirements 2.7**

### Property 13: Compliance Check Accuracy

*For any* client, the compliance check result SHALL accurately reflect:
- KYC status: VALID if all required documents are valid and not expired
- MiFID status: VALID if questionnaire completed within 12 months
- Issues list contains all actual compliance problems

**Validates: Requirements 18.6, 25.1**

### Property 14: Operation Blocking Rules

*For any* operation (Affaire or Operation Gestion), submission SHALL be blocked if and only if:
- Any required document has status MISSING or EXPIRED
- KYC documents are expired
- MiFID questionnaire is outdated (>12 months)

**Validates: Requirements 22.6**

### Property 15: Affaire "En Cours" Categorization

*For any* Affaire Nouvelle, it SHALL be categorized as "En Cours" if and only if:
- Status is between QUALIFICATION and ENVOYE (exclusive)
- Last activity > 7 days ago OR required documents are missing

**Validates: Requirements 20.1**

### Property 16: MiFID Profile Calculation

*For any* completed MiFID questionnaire with valid answers, the calculated risk profile (Conservative, Prudent, Balanced, Dynamic, Aggressive) and investment horizon (Short, Medium, Long) SHALL be deterministic and consistent.

**Validates: Requirements 9.3, 9.4**

### Property 17: KPI Calculation Accuracy

*For any* set of compliance data, the dashboard KPIs SHALL be accurately calculated:
- Completion rate = (valid documents / total required documents) * 100
- Documents pending = count of documents with status EN_ATTENTE
- Controls overdue = count of controls past due date with status != TERMINE
- Open reclamations = count of reclamations with status NOT IN (RESOLUE, CLOTUREE)
- SLA breach rate = (breached reclamations / total reclamations) * 100

**Validates: Requirements 1.4**

### Property 18: Control Overdue Detection

*For any* control where current date > due date AND status != TERMINE, the control SHALL be marked as EN_RETARD.

**Validates: Requirements 4.5**

### Property 19: Resolution Requires Response

*For any* reclamation transition to RESOLUE status, the responseText field SHALL be non-empty.

**Validates: Requirements 5.6**

### Property 20: Rejection Requires Reason

*For any* document transition to REJETE status, the rejectionReason field SHALL be non-empty.

**Validates: Requirements 2.4**


## Error Handling

### Error Types

```typescript
// lib/compliance/errors.ts

export class ComplianceError extends Error {
  constructor(
    message: string,
    public readonly code: ComplianceErrorCode,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ComplianceError';
  }
}

export type ComplianceErrorCode =
  | 'DOCUMENT_NOT_FOUND'
  | 'INVALID_STATUS_TRANSITION'
  | 'MISSING_REQUIRED_FIELD'
  | 'VALIDATION_FAILED'
  | 'OPERATION_BLOCKED'
  | 'COMPLIANCE_CHECK_FAILED'
  | 'REFERENCE_GENERATION_FAILED'
  | 'DOCUMENT_GENERATION_FAILED'
  | 'UNAUTHORIZED'
  | 'CABINET_MISMATCH';

export function isComplianceError(error: unknown): error is ComplianceError {
  return error instanceof ComplianceError;
}

// Validation result type
export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: ValidationError[] };

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}
```

### Error Handling Strategy

1. **Input Validation**: All inputs validated with Zod schemas before processing
2. **State Transitions**: Invalid transitions throw `INVALID_STATUS_TRANSITION` error
3. **Authorization**: Cabinet ID checked on all operations
4. **Graceful Degradation**: UI displays error messages without losing user input
5. **Audit Logging**: All errors logged with context for debugging

### API Error Responses

```typescript
// Standard API error response format
interface APIErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

// Standard API success response format
interface APISuccessResponse<T> {
  success: true;
  data: T;
}

type APIResponse<T> = APISuccessResponse<T> | APIErrorResponse;
```

## Testing Strategy

### Dual Testing Approach

This system requires both unit tests and property-based tests for comprehensive coverage:

1. **Unit Tests**: Verify specific examples, edge cases, and error conditions
2. **Property-Based Tests**: Verify universal properties across all valid inputs

### Property-Based Testing Configuration

- **Library**: fast-check (TypeScript)
- **Minimum iterations**: 100 per property test
- **Tag format**: `Feature: compliance-refonte, Property {number}: {property_text}`

### Test Structure

```typescript
// tests/compliance/document-expiration.property.test.ts
import fc from 'fast-check';
import { calculateExpirationDate, DOCUMENT_EXPIRATION_RULES } from '@/lib/compliance/utils/expiration-calculator';

describe('Feature: compliance-refonte, Property 1: Document Expiration Calculation', () => {
  it('should calculate correct expiration date for any document type and upload date', () => {
    const documentTypeArb = fc.constantFrom(...Object.keys(DOCUMENT_EXPIRATION_RULES));
    const uploadDateArb = fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') });

    fc.assert(
      fc.property(documentTypeArb, uploadDateArb, (docType, uploadDate) => {
        const expirationDays = DOCUMENT_EXPIRATION_RULES[docType];
        const expectedExpiration = new Date(uploadDate);
        expectedExpiration.setDate(expectedExpiration.getDate() + expirationDays);
        
        const result = calculateExpirationDate(docType, uploadDate);
        
        if (expirationDays === 0) {
          return result === null; // No expiration
        }
        return result?.getTime() === expectedExpiration.getTime();
      }),
      { numRuns: 100 }
    );
  });
});

// tests/compliance/risk-level.property.test.ts
describe('Feature: compliance-refonte, Property 4: Risk Level Calculation', () => {
  it('should calculate correct risk level for any score 0-100', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 100 }), (score) => {
        const result = calculateRiskLevel(score);
        
        if (score < 30) return result === 'LOW';
        if (score < 60) return result === 'MEDIUM';
        if (score < 85) return result === 'HIGH';
        return result === 'CRITICAL';
      }),
      { numRuns: 100 }
    );
  });
});

// tests/compliance/sla-deadline.property.test.ts
describe('Feature: compliance-refonte, Property 5: SLA Deadline Calculation', () => {
  it('should calculate correct SLA deadline for any severity and creation date', () => {
    const severityArb = fc.constantFrom('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
    const creationDateArb = fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') });

    fc.assert(
      fc.property(severityArb, creationDateArb, (severity, creationDate) => {
        const deadlineDays = SLA_DEADLINES[severity];
        const expectedDeadline = new Date(creationDate);
        expectedDeadline.setDate(expectedDeadline.getDate() + deadlineDays);
        
        const result = calculateSLADeadline(severity, creationDate);
        
        return result.getTime() === expectedDeadline.getTime();
      }),
      { numRuns: 100 }
    );
  });
});

// tests/compliance/reference-format.property.test.ts
describe('Feature: compliance-refonte, Property 7: Reference Number Format', () => {
  it('should generate valid reference numbers', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 9999 }), (sequence) => {
        const affaireRef = generateAffaireReference(sequence);
        const operationRef = generateOperationReference(sequence);
        const year = new Date().getFullYear();
        
        const affairePattern = new RegExp(`^AN-${year}-\\d{4}$`);
        const operationPattern = new RegExp(`^OG-${year}-\\d{4}$`);
        
        return affairePattern.test(affaireRef) && operationPattern.test(operationRef);
      }),
      { numRuns: 100 }
    );
  });
});
```

### Unit Test Examples

```typescript
// tests/compliance/document-status.unit.test.ts
describe('Document Status Transitions', () => {
  it('should set status to EN_ATTENTE on upload', async () => {
    const doc = await createKYCDocument({ type: 'PIECE_IDENTITE', clientId: 'client-1' });
    expect(doc.status).toBe('EN_ATTENTE');
  });

  it('should require rejection reason when rejecting', async () => {
    const doc = await createKYCDocument({ type: 'PIECE_IDENTITE', clientId: 'client-1' });
    
    await expect(
      rejectDocument(doc.id, { reason: '' })
    ).rejects.toThrow('MISSING_REQUIRED_FIELD');
  });

  it('should set validation date when validating', async () => {
    const doc = await createKYCDocument({ type: 'PIECE_IDENTITE', clientId: 'client-1' });
    const validated = await validateDocument(doc.id, { userId: 'user-1' });
    
    expect(validated.status).toBe('VALIDE');
    expect(validated.validatedAt).not.toBeNull();
    expect(validated.validatedById).toBe('user-1');
  });
});

// tests/compliance/reclamation-workflow.unit.test.ts
describe('Reclamation Workflow', () => {
  it('should not allow resolution without response text', async () => {
    const reclamation = await createReclamation({ clientId: 'client-1', subject: 'Test' });
    
    await expect(
      resolveReclamation(reclamation.id, { responseText: '' })
    ).rejects.toThrow('MISSING_REQUIRED_FIELD');
  });

  it('should mark as SLA breach when deadline passed', async () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 10);
    
    const reclamation = await createReclamation({
      clientId: 'client-1',
      subject: 'Test',
      severity: 'CRITICAL', // 7 day SLA
      receivedAt: pastDate
    });
    
    const checked = await checkSLABreach(reclamation.id);
    expect(checked.slaBreach).toBe(true);
  });
});
```

### Test Coverage Requirements

- All 20 correctness properties must have corresponding property-based tests
- Critical paths (status transitions, calculations) must have unit tests
- Edge cases (empty inputs, boundary values) must be tested
- Error conditions must be tested for proper error handling

