-- Migration: Compliance Refonte Infrastructure
-- Date: 2024-12-26
-- Description: Adds new models for compliance alerts, timeline, operations, providers, products, and regulatory documents

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Compliance Alert Enums
CREATE TYPE "ComplianceAlertType" AS ENUM (
  'DOCUMENT_EXPIRING',
  'DOCUMENT_EXPIRED',
  'KYC_INCOMPLETE',
  'CONTROL_OVERDUE',
  'RECLAMATION_SLA_BREACH',
  'MIFID_OUTDATED',
  'OPERATION_BLOCKED',
  'AFFAIRE_INACTIVE'
);

CREATE TYPE "ComplianceAlertSeverity" AS ENUM (
  'LOW',
  'WARNING',
  'HIGH',
  'CRITICAL'
);

-- Compliance Timeline Enum
CREATE TYPE "ComplianceTimelineEventType" AS ENUM (
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
  'DOCUMENT_EXPORTED'
);

-- Operation Enums
CREATE TYPE "OperationProductType" AS ENUM (
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
  'CREDIT_IMMOBILIER'
);

CREATE TYPE "AffaireNouvelleStatus" AS ENUM (
  'PROSPECT',
  'QUALIFICATION',
  'CONSTITUTION',
  'SIGNATURE',
  'ENVOYE',
  'EN_TRAITEMENT',
  'VALIDE',
  'REJETE',
  'ANNULE'
);

CREATE TYPE "AffaireNouvelleSource" AS ENUM (
  'PROSPECTION',
  'REFERRAL',
  'CLIENT_EXISTANT',
  'PARTENAIRE',
  'SITE_WEB',
  'AUTRE'
);

CREATE TYPE "OperationGestionType" AS ENUM (
  'VERSEMENT_COMPLEMENTAIRE',
  'ARBITRAGE',
  'RACHAT_PARTIEL',
  'RACHAT_TOTAL',
  'AVANCE',
  'MODIFICATION_BENEFICIAIRE',
  'CHANGEMENT_OPTION_GESTION',
  'TRANSFERT'
);

CREATE TYPE "OperationGestionStatus" AS ENUM (
  'BROUILLON',
  'EN_ATTENTE_SIGNATURE',
  'ENVOYE',
  'EN_TRAITEMENT',
  'EXECUTE',
  'REJETE'
);

CREATE TYPE "OperationProviderType" AS ENUM (
  'ASSUREUR',
  'SOCIETE_GESTION',
  'BANQUE',
  'PLATEFORME'
);

CREATE TYPE "OperationConventionStatus" AS ENUM (
  'ACTIVE',
  'INACTIVE',
  'PENDING'
);

-- Document Enums
CREATE TYPE "RegulatoryDocumentType" AS ENUM (
  'DER',
  'RECUEIL_INFORMATIONS',
  'LETTRE_MISSION',
  'RAPPORT_MISSION',
  'CONVENTION_HONORAIRES',
  'ATTESTATION_CONSEIL',
  'MANDAT_GESTION',
  'DECLARATION_ADEQUATION',
  'QUESTIONNAIRE_MIFID',
  'BULLETIN_SOUSCRIPTION',
  'ORDRE_ARBITRAGE',
  'DEMANDE_RACHAT',
  'BULLETIN_VERSEMENT',
  'SIMULATION_FISCALE'
);

CREATE TYPE "RegulatoryAssociationType" AS ENUM (
  'CNCGP',
  'ANACOFI',
  'CNCEF',
  'GENERIC'
);

CREATE TYPE "RegulatoryDocumentFormat" AS ENUM (
  'PDF',
  'DOCX'
);

CREATE TYPE "RegulatoryDocumentStatus" AS ENUM (
  'DRAFT',
  'FINAL',
  'SIGNED'
);


-- ============================================================================
-- TABLES
-- ============================================================================

-- Compliance Alerts
CREATE TABLE "compliance_alerts" (
  "id" TEXT NOT NULL,
  "cabinetId" TEXT NOT NULL,
  "clientId" TEXT,
  "operationId" TEXT,
  "type" "ComplianceAlertType" NOT NULL,
  "severity" "ComplianceAlertSeverity" NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "actionRequired" TEXT NOT NULL,
  "actionUrl" TEXT,
  "acknowledged" BOOLEAN NOT NULL DEFAULT false,
  "acknowledgedAt" TIMESTAMP(3),
  "acknowledgedById" TEXT,
  "resolved" BOOLEAN NOT NULL DEFAULT false,
  "resolvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "compliance_alerts_pkey" PRIMARY KEY ("id")
);

-- Compliance Timeline Events
CREATE TABLE "compliance_timeline_events" (
  "id" TEXT NOT NULL,
  "cabinetId" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "operationId" TEXT,
  "type" "ComplianceTimelineEventType" NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "metadata" JSONB,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "compliance_timeline_events_pkey" PRIMARY KEY ("id")
);

-- Operation Providers
CREATE TABLE "operation_providers" (
  "id" TEXT NOT NULL,
  "cabinetId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" "OperationProviderType" NOT NULL,
  "siren" TEXT,
  "address" TEXT,
  "commercialContact" JSONB,
  "backOfficeContact" JSONB,
  "extranetUrl" TEXT,
  "extranetNotes" TEXT,
  "commissionGridUrl" TEXT,
  "conventionStatus" "OperationConventionStatus" NOT NULL DEFAULT 'ACTIVE',
  "isFavorite" BOOLEAN NOT NULL DEFAULT false,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "operation_providers_pkey" PRIMARY KEY ("id")
);

-- Operation Products
CREATE TABLE "operation_products" (
  "id" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "type" "OperationProductType" NOT NULL,
  "characteristics" JSONB NOT NULL,
  "availableFunds" JSONB,
  "minimumInvestment" DECIMAL(15,2) NOT NULL,
  "documentTemplates" TEXT[],
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "operation_products_pkey" PRIMARY KEY ("id")
);

-- Affaires Nouvelles
CREATE TABLE "affaires_nouvelles" (
  "id" TEXT NOT NULL,
  "cabinetId" TEXT NOT NULL,
  "reference" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "productType" "OperationProductType" NOT NULL,
  "providerId" TEXT NOT NULL,
  "productId" TEXT,
  "status" "AffaireNouvelleStatus" NOT NULL DEFAULT 'PROSPECT',
  "source" "AffaireNouvelleSource" NOT NULL,
  "estimatedAmount" DECIMAL(15,2) NOT NULL,
  "actualAmount" DECIMAL(15,2),
  "targetDate" TIMESTAMP(3),
  "productDetails" JSONB,
  "entryFees" DECIMAL(5,2),
  "managementFees" DECIMAL(5,2),
  "expectedCommission" DECIMAL(15,2),
  "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "pausedAt" TIMESTAMP(3),
  "pauseReason" TEXT,
  "rejectionReason" TEXT,
  "cancellationReason" TEXT,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "affaires_nouvelles_pkey" PRIMARY KEY ("id")
);

-- Affaire Status History
CREATE TABLE "affaire_status_history" (
  "id" TEXT NOT NULL,
  "affaireId" TEXT NOT NULL,
  "fromStatus" "AffaireNouvelleStatus",
  "toStatus" "AffaireNouvelleStatus" NOT NULL,
  "note" TEXT,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "affaire_status_history_pkey" PRIMARY KEY ("id")
);

-- Operations Gestion
CREATE TABLE "operations_gestion" (
  "id" TEXT NOT NULL,
  "cabinetId" TEXT NOT NULL,
  "reference" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "contractId" TEXT NOT NULL,
  "affaireOrigineId" TEXT NOT NULL,
  "type" "OperationGestionType" NOT NULL,
  "status" "OperationGestionStatus" NOT NULL DEFAULT 'BROUILLON',
  "amount" DECIMAL(15,2),
  "effectiveDate" TIMESTAMP(3),
  "operationDetails" JSONB,
  "rejectionReason" TEXT,
  "executedAt" TIMESTAMP(3),
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "operations_gestion_pkey" PRIMARY KEY ("id")
);

-- Operation Status History
CREATE TABLE "operation_status_history" (
  "id" TEXT NOT NULL,
  "operationId" TEXT NOT NULL,
  "fromStatus" "OperationGestionStatus",
  "toStatus" "OperationGestionStatus" NOT NULL,
  "note" TEXT,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "operation_status_history_pkey" PRIMARY KEY ("id")
);

-- Regulatory Document Templates
CREATE TABLE "regulatory_document_templates" (
  "id" TEXT NOT NULL,
  "cabinetId" TEXT NOT NULL,
  "documentType" "RegulatoryDocumentType" NOT NULL,
  "associationType" "RegulatoryAssociationType" NOT NULL DEFAULT 'GENERIC',
  "providerId" TEXT,
  "name" TEXT NOT NULL,
  "version" TEXT NOT NULL,
  "content" JSONB NOT NULL,
  "mandatorySections" TEXT[],
  "customizableSections" TEXT[],
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "regulatory_document_templates_pkey" PRIMARY KEY ("id")
);

-- Regulatory Generated Documents
CREATE TABLE "regulatory_generated_documents" (
  "id" TEXT NOT NULL,
  "cabinetId" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "affaireId" TEXT,
  "operationId" TEXT,
  "templateId" TEXT NOT NULL,
  "documentType" "RegulatoryDocumentType" NOT NULL,
  "fileName" TEXT NOT NULL,
  "fileUrl" TEXT NOT NULL,
  "format" "RegulatoryDocumentFormat" NOT NULL,
  "status" "RegulatoryDocumentStatus" NOT NULL DEFAULT 'DRAFT',
  "signatureStatus" JSONB,
  "generatedData" JSONB NOT NULL,
  "generatedById" TEXT NOT NULL,
  "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "signedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),

  CONSTRAINT "regulatory_generated_documents_pkey" PRIMARY KEY ("id")
);


-- ============================================================================
-- UNIQUE CONSTRAINTS
-- ============================================================================

-- Unique reference per cabinet for affaires_nouvelles
ALTER TABLE "affaires_nouvelles" ADD CONSTRAINT "affaires_nouvelles_cabinetId_reference_key" UNIQUE ("cabinetId", "reference");

-- Unique reference per cabinet for operations_gestion
ALTER TABLE "operations_gestion" ADD CONSTRAINT "operations_gestion_cabinetId_reference_key" UNIQUE ("cabinetId", "reference");


-- ============================================================================
-- FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- Compliance Alerts Foreign Keys
ALTER TABLE "compliance_alerts" ADD CONSTRAINT "compliance_alerts_cabinetId_fkey" 
  FOREIGN KEY ("cabinetId") REFERENCES "cabinets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "compliance_alerts" ADD CONSTRAINT "compliance_alerts_clientId_fkey" 
  FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "compliance_alerts" ADD CONSTRAINT "compliance_alerts_acknowledgedById_fkey" 
  FOREIGN KEY ("acknowledgedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Compliance Timeline Events Foreign Keys
ALTER TABLE "compliance_timeline_events" ADD CONSTRAINT "compliance_timeline_events_cabinetId_fkey" 
  FOREIGN KEY ("cabinetId") REFERENCES "cabinets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "compliance_timeline_events" ADD CONSTRAINT "compliance_timeline_events_clientId_fkey" 
  FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "compliance_timeline_events" ADD CONSTRAINT "compliance_timeline_events_userId_fkey" 
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Operation Providers Foreign Keys
ALTER TABLE "operation_providers" ADD CONSTRAINT "operation_providers_cabinetId_fkey" 
  FOREIGN KEY ("cabinetId") REFERENCES "cabinets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Operation Products Foreign Keys
ALTER TABLE "operation_products" ADD CONSTRAINT "operation_products_providerId_fkey" 
  FOREIGN KEY ("providerId") REFERENCES "operation_providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Affaires Nouvelles Foreign Keys
ALTER TABLE "affaires_nouvelles" ADD CONSTRAINT "affaires_nouvelles_cabinetId_fkey" 
  FOREIGN KEY ("cabinetId") REFERENCES "cabinets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "affaires_nouvelles" ADD CONSTRAINT "affaires_nouvelles_clientId_fkey" 
  FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "affaires_nouvelles" ADD CONSTRAINT "affaires_nouvelles_providerId_fkey" 
  FOREIGN KEY ("providerId") REFERENCES "operation_providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "affaires_nouvelles" ADD CONSTRAINT "affaires_nouvelles_productId_fkey" 
  FOREIGN KEY ("productId") REFERENCES "operation_products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "affaires_nouvelles" ADD CONSTRAINT "affaires_nouvelles_createdById_fkey" 
  FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Affaire Status History Foreign Keys
ALTER TABLE "affaire_status_history" ADD CONSTRAINT "affaire_status_history_affaireId_fkey" 
  FOREIGN KEY ("affaireId") REFERENCES "affaires_nouvelles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "affaire_status_history" ADD CONSTRAINT "affaire_status_history_userId_fkey" 
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Operations Gestion Foreign Keys
ALTER TABLE "operations_gestion" ADD CONSTRAINT "operations_gestion_cabinetId_fkey" 
  FOREIGN KEY ("cabinetId") REFERENCES "cabinets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "operations_gestion" ADD CONSTRAINT "operations_gestion_clientId_fkey" 
  FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "operations_gestion" ADD CONSTRAINT "operations_gestion_affaireOrigineId_fkey" 
  FOREIGN KEY ("affaireOrigineId") REFERENCES "affaires_nouvelles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "operations_gestion" ADD CONSTRAINT "operations_gestion_createdById_fkey" 
  FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Operation Status History Foreign Keys
ALTER TABLE "operation_status_history" ADD CONSTRAINT "operation_status_history_operationId_fkey" 
  FOREIGN KEY ("operationId") REFERENCES "operations_gestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "operation_status_history" ADD CONSTRAINT "operation_status_history_userId_fkey" 
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Regulatory Document Templates Foreign Keys
ALTER TABLE "regulatory_document_templates" ADD CONSTRAINT "regulatory_document_templates_cabinetId_fkey" 
  FOREIGN KEY ("cabinetId") REFERENCES "cabinets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "regulatory_document_templates" ADD CONSTRAINT "regulatory_document_templates_providerId_fkey" 
  FOREIGN KEY ("providerId") REFERENCES "operation_providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "regulatory_document_templates" ADD CONSTRAINT "regulatory_document_templates_createdById_fkey" 
  FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Regulatory Generated Documents Foreign Keys
ALTER TABLE "regulatory_generated_documents" ADD CONSTRAINT "regulatory_generated_documents_cabinetId_fkey" 
  FOREIGN KEY ("cabinetId") REFERENCES "cabinets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "regulatory_generated_documents" ADD CONSTRAINT "regulatory_generated_documents_clientId_fkey" 
  FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "regulatory_generated_documents" ADD CONSTRAINT "regulatory_generated_documents_affaireId_fkey" 
  FOREIGN KEY ("affaireId") REFERENCES "affaires_nouvelles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "regulatory_generated_documents" ADD CONSTRAINT "regulatory_generated_documents_operationId_fkey" 
  FOREIGN KEY ("operationId") REFERENCES "operations_gestion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "regulatory_generated_documents" ADD CONSTRAINT "regulatory_generated_documents_templateId_fkey" 
  FOREIGN KEY ("templateId") REFERENCES "regulatory_document_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "regulatory_generated_documents" ADD CONSTRAINT "regulatory_generated_documents_generatedById_fkey" 
  FOREIGN KEY ("generatedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- ============================================================================
-- INDEXES
-- ============================================================================

-- Compliance Alerts Indexes
CREATE INDEX "compliance_alerts_cabinetId_idx" ON "compliance_alerts"("cabinetId");
CREATE INDEX "compliance_alerts_clientId_idx" ON "compliance_alerts"("clientId");
CREATE INDEX "compliance_alerts_type_idx" ON "compliance_alerts"("type");
CREATE INDEX "compliance_alerts_severity_idx" ON "compliance_alerts"("severity");
CREATE INDEX "compliance_alerts_resolved_idx" ON "compliance_alerts"("resolved");
CREATE INDEX "compliance_alerts_cabinetId_resolved_severity_idx" ON "compliance_alerts"("cabinetId", "resolved", "severity");

-- Compliance Timeline Events Indexes
CREATE INDEX "compliance_timeline_events_cabinetId_idx" ON "compliance_timeline_events"("cabinetId");
CREATE INDEX "compliance_timeline_events_clientId_idx" ON "compliance_timeline_events"("clientId");
CREATE INDEX "compliance_timeline_events_type_idx" ON "compliance_timeline_events"("type");
CREATE INDEX "compliance_timeline_events_createdAt_idx" ON "compliance_timeline_events"("createdAt");
CREATE INDEX "compliance_timeline_events_clientId_createdAt_idx" ON "compliance_timeline_events"("clientId", "createdAt");

-- Operation Providers Indexes
CREATE INDEX "operation_providers_cabinetId_idx" ON "operation_providers"("cabinetId");
CREATE INDEX "operation_providers_type_idx" ON "operation_providers"("type");
CREATE INDEX "operation_providers_conventionStatus_idx" ON "operation_providers"("conventionStatus");
CREATE INDEX "operation_providers_cabinetId_type_idx" ON "operation_providers"("cabinetId", "type");

-- Operation Products Indexes
CREATE INDEX "operation_products_providerId_idx" ON "operation_products"("providerId");
CREATE INDEX "operation_products_type_idx" ON "operation_products"("type");
CREATE INDEX "operation_products_isActive_idx" ON "operation_products"("isActive");
CREATE INDEX "operation_products_providerId_type_idx" ON "operation_products"("providerId", "type");

-- Affaires Nouvelles Indexes
CREATE INDEX "affaires_nouvelles_cabinetId_idx" ON "affaires_nouvelles"("cabinetId");
CREATE INDEX "affaires_nouvelles_clientId_idx" ON "affaires_nouvelles"("clientId");
CREATE INDEX "affaires_nouvelles_providerId_idx" ON "affaires_nouvelles"("providerId");
CREATE INDEX "affaires_nouvelles_status_idx" ON "affaires_nouvelles"("status");
CREATE INDEX "affaires_nouvelles_productType_idx" ON "affaires_nouvelles"("productType");
CREATE INDEX "affaires_nouvelles_cabinetId_status_idx" ON "affaires_nouvelles"("cabinetId", "status");
CREATE INDEX "affaires_nouvelles_cabinetId_clientId_idx" ON "affaires_nouvelles"("cabinetId", "clientId");
CREATE INDEX "affaires_nouvelles_lastActivityAt_idx" ON "affaires_nouvelles"("lastActivityAt");

-- Affaire Status History Indexes
CREATE INDEX "affaire_status_history_affaireId_idx" ON "affaire_status_history"("affaireId");
CREATE INDEX "affaire_status_history_createdAt_idx" ON "affaire_status_history"("createdAt");

-- Operations Gestion Indexes
CREATE INDEX "operations_gestion_cabinetId_idx" ON "operations_gestion"("cabinetId");
CREATE INDEX "operations_gestion_clientId_idx" ON "operations_gestion"("clientId");
CREATE INDEX "operations_gestion_affaireOrigineId_idx" ON "operations_gestion"("affaireOrigineId");
CREATE INDEX "operations_gestion_status_idx" ON "operations_gestion"("status");
CREATE INDEX "operations_gestion_type_idx" ON "operations_gestion"("type");
CREATE INDEX "operations_gestion_cabinetId_status_idx" ON "operations_gestion"("cabinetId", "status");
CREATE INDEX "operations_gestion_cabinetId_clientId_idx" ON "operations_gestion"("cabinetId", "clientId");

-- Operation Status History Indexes
CREATE INDEX "operation_status_history_operationId_idx" ON "operation_status_history"("operationId");
CREATE INDEX "operation_status_history_createdAt_idx" ON "operation_status_history"("createdAt");

-- Regulatory Document Templates Indexes
CREATE INDEX "regulatory_document_templates_cabinetId_idx" ON "regulatory_document_templates"("cabinetId");
CREATE INDEX "regulatory_document_templates_documentType_idx" ON "regulatory_document_templates"("documentType");
CREATE INDEX "regulatory_document_templates_associationType_idx" ON "regulatory_document_templates"("associationType");
CREATE INDEX "regulatory_document_templates_isActive_idx" ON "regulatory_document_templates"("isActive");
CREATE INDEX "regulatory_document_templates_cabinetId_documentType_idx" ON "regulatory_document_templates"("cabinetId", "documentType");

-- Regulatory Generated Documents Indexes
CREATE INDEX "regulatory_generated_documents_cabinetId_idx" ON "regulatory_generated_documents"("cabinetId");
CREATE INDEX "regulatory_generated_documents_clientId_idx" ON "regulatory_generated_documents"("clientId");
CREATE INDEX "regulatory_generated_documents_affaireId_idx" ON "regulatory_generated_documents"("affaireId");
CREATE INDEX "regulatory_generated_documents_operationId_idx" ON "regulatory_generated_documents"("operationId");
CREATE INDEX "regulatory_generated_documents_templateId_idx" ON "regulatory_generated_documents"("templateId");
CREATE INDEX "regulatory_generated_documents_documentType_idx" ON "regulatory_generated_documents"("documentType");
CREATE INDEX "regulatory_generated_documents_status_idx" ON "regulatory_generated_documents"("status");
CREATE INDEX "regulatory_generated_documents_generatedAt_idx" ON "regulatory_generated_documents"("generatedAt");
CREATE INDEX "regulatory_generated_documents_clientId_documentType_idx" ON "regulatory_generated_documents"("clientId", "documentType");
