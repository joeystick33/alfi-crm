-- CreateEnum
CREATE TYPE "SuperAdminRole" AS ENUM ('OWNER', 'ADMIN', 'DEVELOPER', 'SUPPORT');

-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('TRIAL', 'STARTER', 'BUSINESS', 'PREMIUM', 'ENTERPRISE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "CabinetStatus" AS ENUM ('ACTIVE', 'RESTRICTED', 'SUSPENDED', 'TERMINATED', 'TRIALING');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'ADVISOR', 'ASSISTANT');

-- CreateEnum
CREATE TYPE "ApporteurType" AS ENUM ('NOTAIRE', 'EXPERT_COMPTABLE', 'BANQUIER', 'COURTIER', 'AUTRE');

-- CreateEnum
CREATE TYPE "MaritalStatus" AS ENUM ('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED', 'PACS', 'COHABITATION');

-- CreateEnum
CREATE TYPE "RiskProfile" AS ENUM ('CONSERVATIVE', 'BALANCED', 'DYNAMIC', 'AGGRESSIVE');

-- CreateEnum
CREATE TYPE "InvestmentHorizon" AS ENUM ('SHORT', 'MEDIUM', 'LONG');

-- CreateEnum
CREATE TYPE "KYCStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'EXPIRED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ClientStatus" AS ENUM ('PROSPECT', 'ACTIVE', 'INACTIVE', 'ARCHIVED', 'LOST');

-- CreateEnum
CREATE TYPE "FamilyRelationship" AS ENUM ('SPOUSE', 'CHILD', 'PARENT', 'SIBLING', 'GRANDCHILD', 'OTHER');

-- CreateEnum
CREATE TYPE "ActifType" AS ENUM ('REAL_ESTATE_MAIN', 'REAL_ESTATE_RENTAL', 'REAL_ESTATE_SECONDARY', 'SCPI', 'SCI', 'LIFE_INSURANCE', 'SECURITIES_ACCOUNT', 'PEA', 'PEA_PME', 'BANK_ACCOUNT', 'SAVINGS_ACCOUNT', 'PEL', 'CEL', 'PER', 'PERP', 'MADELIN', 'ARTICLE_83', 'COMPANY_SHARES', 'PROFESSIONAL_REAL_ESTATE', 'PRECIOUS_METALS', 'ART_COLLECTION', 'CRYPTO', 'OTHER');

-- CreateEnum
CREATE TYPE "ActifCategory" AS ENUM ('IMMOBILIER', 'FINANCIER', 'PROFESSIONNEL', 'AUTRE');

-- CreateEnum
CREATE TYPE "PassifType" AS ENUM ('MORTGAGE', 'CONSUMER_LOAN', 'PROFESSIONAL_LOAN', 'REVOLVING_CREDIT', 'BRIDGE_LOAN', 'OTHER');

-- CreateEnum
CREATE TYPE "ContratType" AS ENUM ('LIFE_INSURANCE', 'HEALTH_INSURANCE', 'HOME_INSURANCE', 'CAR_INSURANCE', 'PROFESSIONAL_INSURANCE', 'DEATH_INSURANCE', 'DISABILITY_INSURANCE', 'RETIREMENT_SAVINGS', 'OTHER');

-- CreateEnum
CREATE TYPE "ContratStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'TERMINATED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('ID_CARD', 'PASSPORT', 'PROOF_OF_ADDRESS', 'TAX_NOTICE', 'BANK_STATEMENT', 'PROPERTY_DEED', 'LOAN_AGREEMENT', 'INSURANCE_POLICY', 'INVESTMENT_STATEMENT', 'ENTRY_AGREEMENT', 'MISSION_LETTER', 'ADEQUACY_DECLARATION', 'INVESTOR_PROFILE', 'ANNUAL_REPORT', 'EMAIL_ATTACHMENT', 'MEETING_MINUTES', 'PROPOSAL', 'CONTRACT', 'INVOICE', 'OTHER');

-- CreateEnum
CREATE TYPE "DocumentCategory" AS ENUM ('IDENTITE', 'FISCAL', 'PATRIMOINE', 'REGLEMENTAIRE', 'COMMERCIAL', 'AUTRE');

-- CreateEnum
CREATE TYPE "SignatureStatus" AS ENUM ('PENDING', 'SIGNED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "KYCDocumentType" AS ENUM ('IDENTITY', 'PROOF_OF_ADDRESS', 'TAX_NOTICE', 'BANK_RIB', 'WEALTH_JUSTIFICATION', 'ORIGIN_OF_FUNDS', 'OTHER');

-- CreateEnum
CREATE TYPE "KYCDocStatus" AS ENUM ('PENDING', 'VALIDATED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ObjectifType" AS ENUM ('RETIREMENT', 'REAL_ESTATE_PURCHASE', 'EDUCATION', 'WEALTH_TRANSMISSION', 'TAX_OPTIMIZATION', 'INCOME_GENERATION', 'CAPITAL_PROTECTION', 'OTHER');

-- CreateEnum
CREATE TYPE "ObjectifPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ObjectifStatus" AS ENUM ('ACTIVE', 'ACHIEVED', 'CANCELLED', 'ON_HOLD');

-- CreateEnum
CREATE TYPE "ProjetType" AS ENUM ('REAL_ESTATE_PURCHASE', 'BUSINESS_CREATION', 'RETIREMENT_PREPARATION', 'WEALTH_RESTRUCTURING', 'TAX_OPTIMIZATION', 'SUCCESSION_PLANNING', 'OTHER');

-- CreateEnum
CREATE TYPE "ProjetStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ON_HOLD');

-- CreateEnum
CREATE TYPE "OpportuniteType" AS ENUM ('LIFE_INSURANCE', 'RETIREMENT_SAVINGS', 'REAL_ESTATE_INVESTMENT', 'SECURITIES_INVESTMENT', 'TAX_OPTIMIZATION', 'LOAN_RESTRUCTURING', 'WEALTH_TRANSMISSION', 'INSURANCE_REVIEW', 'OTHER');

-- CreateEnum
CREATE TYPE "OpportunitePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "OpportuniteStatus" AS ENUM ('DETECTED', 'QUALIFIED', 'CONTACTED', 'PRESENTED', 'ACCEPTED', 'CONVERTED', 'REJECTED', 'LOST');

-- CreateEnum
CREATE TYPE "TacheType" AS ENUM ('CALL', 'EMAIL', 'MEETING', 'DOCUMENT_REVIEW', 'KYC_UPDATE', 'CONTRACT_RENEWAL', 'FOLLOW_UP', 'ADMINISTRATIVE', 'OTHER');

-- CreateEnum
CREATE TYPE "TachePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "TacheStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RendezVousType" AS ENUM ('FIRST_MEETING', 'FOLLOW_UP', 'ANNUAL_REVIEW', 'SIGNING', 'PHONE_CALL', 'VIDEO_CALL', 'OTHER');

-- CreateEnum
CREATE TYPE "RendezVousStatus" AS ENUM ('SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "CalendarProvider" AS ENUM ('OUTLOOK', 'GOOGLE', 'APPLE');

-- CreateEnum
CREATE TYPE "EmailStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'SENT', 'DELIVERED', 'OPENED', 'CLICKED', 'BOUNCED', 'FAILED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('TASK_ASSIGNED', 'TASK_DUE', 'APPOINTMENT_REMINDER', 'DOCUMENT_UPLOADED', 'KYC_EXPIRING', 'CONTRACT_RENEWAL', 'OPPORTUNITY_DETECTED', 'CLIENT_MESSAGE', 'SYSTEM', 'OTHER');

-- CreateEnum
CREATE TYPE "CampagneType" AS ENUM ('EMAIL', 'SMS', 'POSTAL', 'MIXED');

-- CreateEnum
CREATE TYPE "CampagneStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TemplateType" AS ENUM ('EMAIL', 'LETTER', 'CONTRACT', 'REPORT', 'DOCUMENT');

-- CreateEnum
CREATE TYPE "TemplateCategory" AS ENUM ('ENTRY_AGREEMENT', 'MISSION_LETTER', 'ADEQUACY_DECLARATION', 'INVESTOR_PROFILE', 'ANNUAL_REPORT', 'PROPOSAL', 'QUOTE', 'FOLLOW_UP', 'MEETING_MINUTES', 'INTERNAL_NOTE', 'OTHER');

-- CreateEnum
CREATE TYPE "SimulationType" AS ENUM ('RETIREMENT', 'REAL_ESTATE_LOAN', 'LIFE_INSURANCE', 'WEALTH_TRANSMISSION', 'TAX_OPTIMIZATION', 'INVESTMENT_PROJECTION', 'BUDGET_ANALYSIS', 'OTHER');

-- CreateEnum
CREATE TYPE "SimulationStatus" AS ENUM ('DRAFT', 'COMPLETED', 'SHARED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ConsentementType" AS ENUM ('DATA_PROCESSING', 'MARKETING_COMMUNICATION', 'DATA_SHARING', 'PROFILING', 'AUTOMATED_DECISION');

-- CreateEnum
CREATE TYPE "ReclamationType" AS ENUM ('SERVICE_QUALITY', 'FEES', 'ADVICE_QUALITY', 'COMMUNICATION', 'DOCUMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "ReclamationStatus" AS ENUM ('RECEIVED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED', 'ESCALATED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'VIEW', 'EXPORT', 'SHARE', 'SIGN', 'APPROVE', 'REJECT');

-- CreateEnum
CREATE TYPE "TimelineEventType" AS ENUM ('CLIENT_CREATED', 'MEETING_HELD', 'DOCUMENT_SIGNED', 'ASSET_ADDED', 'GOAL_ACHIEVED', 'CONTRACT_SIGNED', 'KYC_UPDATED', 'SIMULATION_SHARED', 'EMAIL_SENT', 'OPPORTUNITY_CONVERTED', 'OTHER');

-- CreateEnum
CREATE TYPE "ExportType" AS ENUM ('CLIENTS', 'ACTIFS', 'PASSIFS', 'CONTRATS', 'DOCUMENTS', 'TACHES', 'RENDEZ_VOUS', 'OPPORTUNITES', 'FULL_PORTFOLIO');

-- CreateEnum
CREATE TYPE "ExportFormat" AS ENUM ('CSV', 'EXCEL', 'JSON', 'PDF');

-- CreateEnum
CREATE TYPE "ExportStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "super_admins" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" "SuperAdminRole" NOT NULL DEFAULT 'ADMIN',
    "permissions" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLogin" TIMESTAMP(3),

    CONSTRAINT "super_admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cabinets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "address" JSONB,
    "plan" "SubscriptionPlan" NOT NULL DEFAULT 'TRIAL',
    "status" "CabinetStatus" NOT NULL DEFAULT 'TRIALING',
    "subscriptionStart" TIMESTAMP(3),
    "subscriptionEnd" TIMESTAMP(3),
    "trialEndsAt" TIMESTAMP(3),
    "quotas" JSONB,
    "usage" JSONB,
    "features" JSONB,
    "restrictions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "cabinets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "cabinetId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "avatar" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'ADVISOR',
    "permissions" JSONB,
    "stats" JSONB,
    "preferences" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLogin" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assistant_assignments" (
    "id" TEXT NOT NULL,
    "cabinetId" TEXT NOT NULL,
    "assistantId" TEXT NOT NULL,
    "advisorId" TEXT NOT NULL,
    "permissions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assistant_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "apporteurs_affaires" (
    "id" TEXT NOT NULL,
    "cabinetId" TEXT NOT NULL,
    "ownerId" TEXT,
    "type" "ApporteurType" NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "company" TEXT,
    "profession" TEXT,
    "commissionRate" DECIMAL(5,2),
    "stats" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "apporteurs_affaires_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "cabinetId" TEXT NOT NULL,
    "conseillerId" TEXT NOT NULL,
    "conseillerRemplacantId" TEXT,
    "apporteurId" TEXT,
    "email" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3),
    "birthPlace" TEXT,
    "nationality" TEXT,
    "phone" TEXT,
    "mobile" TEXT,
    "address" JSONB,
    "maritalStatus" "MaritalStatus",
    "marriageRegime" TEXT,
    "numberOfChildren" INTEGER DEFAULT 0,
    "profession" TEXT,
    "employerName" TEXT,
    "professionalStatus" TEXT,
    "annualIncome" DECIMAL(12,2),
    "taxBracket" TEXT,
    "fiscalResidence" TEXT,
    "riskProfile" "RiskProfile",
    "investmentHorizon" "InvestmentHorizon",
    "investmentGoals" JSONB,
    "wealth" JSONB,
    "kycStatus" "KYCStatus" NOT NULL DEFAULT 'PENDING',
    "kycCompletedAt" TIMESTAMP(3),
    "kycNextReviewDate" TIMESTAMP(3),
    "status" "ClientStatus" NOT NULL DEFAULT 'PROSPECT',
    "portalAccess" BOOLEAN NOT NULL DEFAULT false,
    "portalPassword" TEXT,
    "lastPortalLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastContactDate" TIMESTAMP(3),

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "family_members" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3),
    "relationship" "FamilyRelationship" NOT NULL,
    "linkedClientId" TEXT,
    "isBeneficiary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "family_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "actifs" (
    "id" TEXT NOT NULL,
    "cabinetId" TEXT NOT NULL,
    "type" "ActifType" NOT NULL,
    "category" "ActifCategory" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "value" DECIMAL(15,2) NOT NULL,
    "acquisitionDate" TIMESTAMP(3),
    "acquisitionValue" DECIMAL(15,2),
    "details" JSONB,
    "annualIncome" DECIMAL(12,2),
    "taxDetails" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "actifs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_actifs" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "actifId" TEXT NOT NULL,
    "ownershipPercentage" DECIMAL(5,2) NOT NULL DEFAULT 100.00,
    "ownershipType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_actifs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "passifs" (
    "id" TEXT NOT NULL,
    "cabinetId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "type" "PassifType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "initialAmount" DECIMAL(15,2) NOT NULL,
    "remainingAmount" DECIMAL(15,2) NOT NULL,
    "interestRate" DECIMAL(5,2) NOT NULL,
    "monthlyPayment" DECIMAL(12,2) NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "linkedActifId" TEXT,
    "insurance" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "passifs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contrats" (
    "id" TEXT NOT NULL,
    "cabinetId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "type" "ContratType" NOT NULL,
    "name" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "contractNumber" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "premium" DECIMAL(12,2),
    "coverage" DECIMAL(15,2),
    "value" DECIMAL(15,2),
    "beneficiaries" JSONB,
    "details" JSONB,
    "commission" DECIMAL(12,2),
    "nextRenewalDate" TIMESTAMP(3),
    "status" "ContratStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contrats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "cabinetId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "category" "DocumentCategory",
    "tags" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "parentVersion" TEXT,
    "uploadedById" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "signatureStatus" "SignatureStatus",
    "signatureProvider" TEXT,
    "signedAt" TIMESTAMP(3),
    "signedBy" JSONB,
    "isConfidential" BOOLEAN NOT NULL DEFAULT false,
    "accessLevel" TEXT NOT NULL DEFAULT 'NORMAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_documents" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "actif_documents" (
    "id" TEXT NOT NULL,
    "actifId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "actif_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "passif_documents" (
    "id" TEXT NOT NULL,
    "passifId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "passif_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contrat_documents" (
    "id" TEXT NOT NULL,
    "contratId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contrat_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kyc_documents" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "type" "KYCDocumentType" NOT NULL,
    "documentId" TEXT,
    "status" "KYCDocStatus" NOT NULL DEFAULT 'PENDING',
    "validatedAt" TIMESTAMP(3),
    "validatedBy" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kyc_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "objectifs" (
    "id" TEXT NOT NULL,
    "cabinetId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "type" "ObjectifType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "targetAmount" DECIMAL(15,2) NOT NULL,
    "targetDate" TIMESTAMP(3) NOT NULL,
    "currentAmount" DECIMAL(15,2) DEFAULT 0,
    "progress" INTEGER DEFAULT 0,
    "priority" "ObjectifPriority" NOT NULL DEFAULT 'MEDIUM',
    "monthlyContribution" DECIMAL(12,2),
    "recommendations" JSONB,
    "status" "ObjectifStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "achievedAt" TIMESTAMP(3),

    CONSTRAINT "objectifs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projets" (
    "id" TEXT NOT NULL,
    "cabinetId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "ProjetType" NOT NULL,
    "estimatedBudget" DECIMAL(15,2),
    "actualBudget" DECIMAL(15,2),
    "startDate" TIMESTAMP(3),
    "targetDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "progress" INTEGER NOT NULL DEFAULT 0,
    "status" "ProjetStatus" NOT NULL DEFAULT 'PLANNED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projet_documents" (
    "id" TEXT NOT NULL,
    "projetId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "projet_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunites" (
    "id" TEXT NOT NULL,
    "cabinetId" TEXT NOT NULL,
    "conseillerId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "type" "OpportuniteType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "estimatedValue" DECIMAL(15,2),
    "score" INTEGER DEFAULT 0,
    "confidence" DECIMAL(5,2),
    "priority" "OpportunitePriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "OpportuniteStatus" NOT NULL DEFAULT 'DETECTED',
    "stage" TEXT,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "qualifiedAt" TIMESTAMP(3),
    "contactedAt" TIMESTAMP(3),
    "presentedAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "convertedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "actionDeadline" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "convertedToProjetId" TEXT,
    "actions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opportunites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "taches" (
    "id" TEXT NOT NULL,
    "cabinetId" TEXT NOT NULL,
    "assignedToId" TEXT NOT NULL,
    "clientId" TEXT,
    "projetId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "TacheType" NOT NULL,
    "priority" "TachePriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "TacheStatus" NOT NULL DEFAULT 'TODO',
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "reminderDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "taches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tache_documents" (
    "id" TEXT NOT NULL,
    "tacheId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tache_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rendez_vous" (
    "id" TEXT NOT NULL,
    "cabinetId" TEXT NOT NULL,
    "conseillerId" TEXT NOT NULL,
    "clientId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "RendezVousType" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "isVirtual" BOOLEAN NOT NULL DEFAULT false,
    "meetingUrl" TEXT,
    "status" "RendezVousStatus" NOT NULL DEFAULT 'SCHEDULED',
    "reminderSent" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "hasMinutes" BOOLEAN NOT NULL DEFAULT false,
    "minutesDocId" TEXT,
    "externalCalendarId" TEXT,
    "externalEventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cancelledAt" TIMESTAMP(3),

    CONSTRAINT "rendez_vous_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_syncs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "CalendarProvider" NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "calendarId" TEXT,
    "syncEnabled" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncAt" TIMESTAMP(3),
    "lastSyncStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_syncs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emails" (
    "id" TEXT NOT NULL,
    "cabinetId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "clientId" TEXT,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "to" JSONB NOT NULL,
    "cc" JSONB,
    "bcc" JSONB,
    "attachments" JSONB,
    "status" "EmailStatus" NOT NULL DEFAULT 'DRAFT',
    "sentAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),
    "templateId" TEXT,
    "campagneId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "cabinetId" TEXT NOT NULL,
    "userId" TEXT,
    "clientId" TEXT,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "actionUrl" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campagnes" (
    "id" TEXT NOT NULL,
    "cabinetId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "CampagneType" NOT NULL,
    "targetSegment" JSONB,
    "templateId" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "status" "CampagneStatus" NOT NULL DEFAULT 'DRAFT',
    "stats" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),

    CONSTRAINT "campagnes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "templates" (
    "id" TEXT NOT NULL,
    "cabinetId" TEXT NOT NULL,
    "type" "TemplateType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT NOT NULL,
    "variables" JSONB,
    "category" "TemplateCategory" NOT NULL,
    "isRegulatory" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "simulations" (
    "id" TEXT NOT NULL,
    "cabinetId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "type" "SimulationType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "parameters" JSONB NOT NULL,
    "results" JSONB NOT NULL,
    "recommendations" JSONB,
    "feasibilityScore" INTEGER,
    "status" "SimulationStatus" NOT NULL DEFAULT 'DRAFT',
    "sharedWithClient" BOOLEAN NOT NULL DEFAULT false,
    "sharedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "simulations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consentements" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "type" "ConsentementType" NOT NULL,
    "granted" BOOLEAN NOT NULL,
    "grantedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "purpose" TEXT NOT NULL,
    "description" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consentements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reclamations" (
    "id" TEXT NOT NULL,
    "cabinetId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "ReclamationType" NOT NULL,
    "status" "ReclamationStatus" NOT NULL DEFAULT 'RECEIVED',
    "assignedToId" TEXT,
    "responseText" TEXT,
    "resolutionDate" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deadline" TIMESTAMP(3) NOT NULL,
    "escalatedToMediator" BOOLEAN NOT NULL DEFAULT false,
    "escalatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reclamations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "cabinetId" TEXT,
    "userId" TEXT,
    "superAdminId" TEXT,
    "action" "AuditAction" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "changes" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timeline_events" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "type" "TimelineEventType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "relatedEntityType" TEXT,
    "relatedEntityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "timeline_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "export_jobs" (
    "id" TEXT NOT NULL,
    "cabinetId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "type" "ExportType" NOT NULL,
    "filters" JSONB,
    "format" "ExportFormat" NOT NULL DEFAULT 'CSV',
    "status" "ExportStatus" NOT NULL DEFAULT 'PENDING',
    "fileUrl" TEXT,
    "fileSize" INTEGER,
    "recordCount" INTEGER,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "export_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "super_admins_email_key" ON "super_admins"("email");

-- CreateIndex
CREATE INDEX "super_admins_email_idx" ON "super_admins"("email");

-- CreateIndex
CREATE INDEX "super_admins_isActive_idx" ON "super_admins"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "cabinets_slug_key" ON "cabinets"("slug");

-- CreateIndex
CREATE INDEX "cabinets_slug_idx" ON "cabinets"("slug");

-- CreateIndex
CREATE INDEX "cabinets_status_idx" ON "cabinets"("status");

-- CreateIndex
CREATE INDEX "cabinets_plan_idx" ON "cabinets"("plan");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_cabinetId_idx" ON "users"("cabinetId");

-- CreateIndex
CREATE INDEX "users_cabinetId_role_idx" ON "users"("cabinetId", "role");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_isActive_idx" ON "users"("isActive");

-- CreateIndex
CREATE INDEX "assistant_assignments_cabinetId_idx" ON "assistant_assignments"("cabinetId");

-- CreateIndex
CREATE INDEX "assistant_assignments_assistantId_idx" ON "assistant_assignments"("assistantId");

-- CreateIndex
CREATE INDEX "assistant_assignments_advisorId_idx" ON "assistant_assignments"("advisorId");

-- CreateIndex
CREATE UNIQUE INDEX "assistant_assignments_assistantId_advisorId_key" ON "assistant_assignments"("assistantId", "advisorId");

-- CreateIndex
CREATE INDEX "apporteurs_affaires_cabinetId_idx" ON "apporteurs_affaires"("cabinetId");

-- CreateIndex
CREATE INDEX "apporteurs_affaires_ownerId_idx" ON "apporteurs_affaires"("ownerId");

-- CreateIndex
CREATE INDEX "apporteurs_affaires_type_idx" ON "apporteurs_affaires"("type");

-- CreateIndex
CREATE INDEX "clients_cabinetId_idx" ON "clients"("cabinetId");

-- CreateIndex
CREATE INDEX "clients_conseillerId_idx" ON "clients"("conseillerId");

-- CreateIndex
CREATE INDEX "clients_cabinetId_conseillerId_idx" ON "clients"("cabinetId", "conseillerId");

-- CreateIndex
CREATE INDEX "clients_status_idx" ON "clients"("status");

-- CreateIndex
CREATE INDEX "clients_kycStatus_idx" ON "clients"("kycStatus");

-- CreateIndex
CREATE INDEX "clients_email_idx" ON "clients"("email");

-- CreateIndex
CREATE INDEX "family_members_clientId_idx" ON "family_members"("clientId");

-- CreateIndex
CREATE INDEX "actifs_cabinetId_idx" ON "actifs"("cabinetId");

-- CreateIndex
CREATE INDEX "actifs_type_idx" ON "actifs"("type");

-- CreateIndex
CREATE INDEX "actifs_category_idx" ON "actifs"("category");

-- CreateIndex
CREATE INDEX "client_actifs_clientId_idx" ON "client_actifs"("clientId");

-- CreateIndex
CREATE INDEX "client_actifs_actifId_idx" ON "client_actifs"("actifId");

-- CreateIndex
CREATE UNIQUE INDEX "client_actifs_clientId_actifId_key" ON "client_actifs"("clientId", "actifId");

-- CreateIndex
CREATE INDEX "passifs_cabinetId_idx" ON "passifs"("cabinetId");

-- CreateIndex
CREATE INDEX "passifs_clientId_idx" ON "passifs"("clientId");

-- CreateIndex
CREATE INDEX "passifs_type_idx" ON "passifs"("type");

-- CreateIndex
CREATE INDEX "contrats_cabinetId_idx" ON "contrats"("cabinetId");

-- CreateIndex
CREATE INDEX "contrats_clientId_idx" ON "contrats"("clientId");

-- CreateIndex
CREATE INDEX "contrats_type_idx" ON "contrats"("type");

-- CreateIndex
CREATE INDEX "contrats_status_idx" ON "contrats"("status");

-- CreateIndex
CREATE INDEX "documents_cabinetId_idx" ON "documents"("cabinetId");

-- CreateIndex
CREATE INDEX "documents_type_idx" ON "documents"("type");

-- CreateIndex
CREATE INDEX "documents_uploadedById_idx" ON "documents"("uploadedById");

-- CreateIndex
CREATE INDEX "client_documents_clientId_idx" ON "client_documents"("clientId");

-- CreateIndex
CREATE INDEX "client_documents_documentId_idx" ON "client_documents"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "client_documents_clientId_documentId_key" ON "client_documents"("clientId", "documentId");

-- CreateIndex
CREATE UNIQUE INDEX "actif_documents_actifId_documentId_key" ON "actif_documents"("actifId", "documentId");

-- CreateIndex
CREATE UNIQUE INDEX "passif_documents_passifId_documentId_key" ON "passif_documents"("passifId", "documentId");

-- CreateIndex
CREATE UNIQUE INDEX "contrat_documents_contratId_documentId_key" ON "contrat_documents"("contratId", "documentId");

-- CreateIndex
CREATE INDEX "kyc_documents_clientId_idx" ON "kyc_documents"("clientId");

-- CreateIndex
CREATE INDEX "kyc_documents_status_idx" ON "kyc_documents"("status");

-- CreateIndex
CREATE INDEX "objectifs_cabinetId_idx" ON "objectifs"("cabinetId");

-- CreateIndex
CREATE INDEX "objectifs_clientId_idx" ON "objectifs"("clientId");

-- CreateIndex
CREATE INDEX "objectifs_type_idx" ON "objectifs"("type");

-- CreateIndex
CREATE INDEX "objectifs_status_idx" ON "objectifs"("status");

-- CreateIndex
CREATE INDEX "projets_cabinetId_idx" ON "projets"("cabinetId");

-- CreateIndex
CREATE INDEX "projets_clientId_idx" ON "projets"("clientId");

-- CreateIndex
CREATE INDEX "projets_status_idx" ON "projets"("status");

-- CreateIndex
CREATE UNIQUE INDEX "projet_documents_projetId_documentId_key" ON "projet_documents"("projetId", "documentId");

-- CreateIndex
CREATE INDEX "opportunites_cabinetId_idx" ON "opportunites"("cabinetId");

-- CreateIndex
CREATE INDEX "opportunites_conseillerId_idx" ON "opportunites"("conseillerId");

-- CreateIndex
CREATE INDEX "opportunites_clientId_idx" ON "opportunites"("clientId");

-- CreateIndex
CREATE INDEX "opportunites_status_idx" ON "opportunites"("status");

-- CreateIndex
CREATE INDEX "opportunites_type_idx" ON "opportunites"("type");

-- CreateIndex
CREATE INDEX "taches_cabinetId_idx" ON "taches"("cabinetId");

-- CreateIndex
CREATE INDEX "taches_assignedToId_idx" ON "taches"("assignedToId");

-- CreateIndex
CREATE INDEX "taches_clientId_idx" ON "taches"("clientId");

-- CreateIndex
CREATE INDEX "taches_status_idx" ON "taches"("status");

-- CreateIndex
CREATE INDEX "taches_dueDate_idx" ON "taches"("dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "tache_documents_tacheId_documentId_key" ON "tache_documents"("tacheId", "documentId");

-- CreateIndex
CREATE INDEX "rendez_vous_cabinetId_idx" ON "rendez_vous"("cabinetId");

-- CreateIndex
CREATE INDEX "rendez_vous_conseillerId_idx" ON "rendez_vous"("conseillerId");

-- CreateIndex
CREATE INDEX "rendez_vous_clientId_idx" ON "rendez_vous"("clientId");

-- CreateIndex
CREATE INDEX "rendez_vous_startDate_idx" ON "rendez_vous"("startDate");

-- CreateIndex
CREATE INDEX "rendez_vous_status_idx" ON "rendez_vous"("status");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_syncs_userId_key" ON "calendar_syncs"("userId");

-- CreateIndex
CREATE INDEX "calendar_syncs_userId_idx" ON "calendar_syncs"("userId");

-- CreateIndex
CREATE INDEX "emails_cabinetId_idx" ON "emails"("cabinetId");

-- CreateIndex
CREATE INDEX "emails_senderId_idx" ON "emails"("senderId");

-- CreateIndex
CREATE INDEX "emails_clientId_idx" ON "emails"("clientId");

-- CreateIndex
CREATE INDEX "emails_status_idx" ON "emails"("status");

-- CreateIndex
CREATE INDEX "emails_sentAt_idx" ON "emails"("sentAt");

-- CreateIndex
CREATE INDEX "notifications_cabinetId_idx" ON "notifications"("cabinetId");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "notifications_clientId_idx" ON "notifications"("clientId");

-- CreateIndex
CREATE INDEX "notifications_isRead_idx" ON "notifications"("isRead");

-- CreateIndex
CREATE INDEX "campagnes_cabinetId_idx" ON "campagnes"("cabinetId");

-- CreateIndex
CREATE INDEX "campagnes_createdById_idx" ON "campagnes"("createdById");

-- CreateIndex
CREATE INDEX "campagnes_status_idx" ON "campagnes"("status");

-- CreateIndex
CREATE INDEX "templates_cabinetId_idx" ON "templates"("cabinetId");

-- CreateIndex
CREATE INDEX "templates_type_idx" ON "templates"("type");

-- CreateIndex
CREATE INDEX "templates_category_idx" ON "templates"("category");

-- CreateIndex
CREATE INDEX "templates_isRegulatory_idx" ON "templates"("isRegulatory");

-- CreateIndex
CREATE INDEX "simulations_cabinetId_idx" ON "simulations"("cabinetId");

-- CreateIndex
CREATE INDEX "simulations_clientId_idx" ON "simulations"("clientId");

-- CreateIndex
CREATE INDEX "simulations_type_idx" ON "simulations"("type");

-- CreateIndex
CREATE INDEX "simulations_createdById_idx" ON "simulations"("createdById");

-- CreateIndex
CREATE INDEX "consentements_clientId_idx" ON "consentements"("clientId");

-- CreateIndex
CREATE INDEX "consentements_type_idx" ON "consentements"("type");

-- CreateIndex
CREATE INDEX "reclamations_cabinetId_idx" ON "reclamations"("cabinetId");

-- CreateIndex
CREATE INDEX "reclamations_clientId_idx" ON "reclamations"("clientId");

-- CreateIndex
CREATE INDEX "reclamations_status_idx" ON "reclamations"("status");

-- CreateIndex
CREATE INDEX "audit_logs_cabinetId_idx" ON "audit_logs"("cabinetId");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "timeline_events_clientId_idx" ON "timeline_events"("clientId");

-- CreateIndex
CREATE INDEX "timeline_events_type_idx" ON "timeline_events"("type");

-- CreateIndex
CREATE INDEX "timeline_events_createdAt_idx" ON "timeline_events"("createdAt");

-- CreateIndex
CREATE INDEX "export_jobs_cabinetId_idx" ON "export_jobs"("cabinetId");

-- CreateIndex
CREATE INDEX "export_jobs_createdById_idx" ON "export_jobs"("createdById");

-- CreateIndex
CREATE INDEX "export_jobs_status_idx" ON "export_jobs"("status");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_cabinetId_fkey" FOREIGN KEY ("cabinetId") REFERENCES "cabinets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assistant_assignments" ADD CONSTRAINT "assistant_assignments_assistantId_fkey" FOREIGN KEY ("assistantId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apporteurs_affaires" ADD CONSTRAINT "apporteurs_affaires_cabinetId_fkey" FOREIGN KEY ("cabinetId") REFERENCES "cabinets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apporteurs_affaires" ADD CONSTRAINT "apporteurs_affaires_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_cabinetId_fkey" FOREIGN KEY ("cabinetId") REFERENCES "cabinets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_conseillerId_fkey" FOREIGN KEY ("conseillerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_conseillerRemplacantId_fkey" FOREIGN KEY ("conseillerRemplacantId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_apporteurId_fkey" FOREIGN KEY ("apporteurId") REFERENCES "apporteurs_affaires"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_members" ADD CONSTRAINT "family_members_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actifs" ADD CONSTRAINT "actifs_cabinetId_fkey" FOREIGN KEY ("cabinetId") REFERENCES "cabinets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_actifs" ADD CONSTRAINT "client_actifs_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_actifs" ADD CONSTRAINT "client_actifs_actifId_fkey" FOREIGN KEY ("actifId") REFERENCES "actifs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passifs" ADD CONSTRAINT "passifs_cabinetId_fkey" FOREIGN KEY ("cabinetId") REFERENCES "cabinets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passifs" ADD CONSTRAINT "passifs_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contrats" ADD CONSTRAINT "contrats_cabinetId_fkey" FOREIGN KEY ("cabinetId") REFERENCES "cabinets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contrats" ADD CONSTRAINT "contrats_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_cabinetId_fkey" FOREIGN KEY ("cabinetId") REFERENCES "cabinets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_documents" ADD CONSTRAINT "client_documents_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_documents" ADD CONSTRAINT "client_documents_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actif_documents" ADD CONSTRAINT "actif_documents_actifId_fkey" FOREIGN KEY ("actifId") REFERENCES "actifs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actif_documents" ADD CONSTRAINT "actif_documents_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passif_documents" ADD CONSTRAINT "passif_documents_passifId_fkey" FOREIGN KEY ("passifId") REFERENCES "passifs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passif_documents" ADD CONSTRAINT "passif_documents_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contrat_documents" ADD CONSTRAINT "contrat_documents_contratId_fkey" FOREIGN KEY ("contratId") REFERENCES "contrats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contrat_documents" ADD CONSTRAINT "contrat_documents_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kyc_documents" ADD CONSTRAINT "kyc_documents_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "objectifs" ADD CONSTRAINT "objectifs_cabinetId_fkey" FOREIGN KEY ("cabinetId") REFERENCES "cabinets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "objectifs" ADD CONSTRAINT "objectifs_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projets" ADD CONSTRAINT "projets_cabinetId_fkey" FOREIGN KEY ("cabinetId") REFERENCES "cabinets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projets" ADD CONSTRAINT "projets_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projet_documents" ADD CONSTRAINT "projet_documents_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "projets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projet_documents" ADD CONSTRAINT "projet_documents_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunites" ADD CONSTRAINT "opportunites_cabinetId_fkey" FOREIGN KEY ("cabinetId") REFERENCES "cabinets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunites" ADD CONSTRAINT "opportunites_conseillerId_fkey" FOREIGN KEY ("conseillerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunites" ADD CONSTRAINT "opportunites_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taches" ADD CONSTRAINT "taches_cabinetId_fkey" FOREIGN KEY ("cabinetId") REFERENCES "cabinets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taches" ADD CONSTRAINT "taches_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taches" ADD CONSTRAINT "taches_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taches" ADD CONSTRAINT "taches_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "projets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tache_documents" ADD CONSTRAINT "tache_documents_tacheId_fkey" FOREIGN KEY ("tacheId") REFERENCES "taches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tache_documents" ADD CONSTRAINT "tache_documents_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rendez_vous" ADD CONSTRAINT "rendez_vous_cabinetId_fkey" FOREIGN KEY ("cabinetId") REFERENCES "cabinets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rendez_vous" ADD CONSTRAINT "rendez_vous_conseillerId_fkey" FOREIGN KEY ("conseillerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rendez_vous" ADD CONSTRAINT "rendez_vous_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emails" ADD CONSTRAINT "emails_cabinetId_fkey" FOREIGN KEY ("cabinetId") REFERENCES "cabinets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emails" ADD CONSTRAINT "emails_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emails" ADD CONSTRAINT "emails_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_cabinetId_fkey" FOREIGN KEY ("cabinetId") REFERENCES "cabinets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campagnes" ADD CONSTRAINT "campagnes_cabinetId_fkey" FOREIGN KEY ("cabinetId") REFERENCES "cabinets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campagnes" ADD CONSTRAINT "campagnes_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "templates" ADD CONSTRAINT "templates_cabinetId_fkey" FOREIGN KEY ("cabinetId") REFERENCES "cabinets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulations" ADD CONSTRAINT "simulations_cabinetId_fkey" FOREIGN KEY ("cabinetId") REFERENCES "cabinets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulations" ADD CONSTRAINT "simulations_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulations" ADD CONSTRAINT "simulations_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consentements" ADD CONSTRAINT "consentements_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reclamations" ADD CONSTRAINT "reclamations_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_cabinetId_fkey" FOREIGN KEY ("cabinetId") REFERENCES "cabinets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_superAdminId_fkey" FOREIGN KEY ("superAdminId") REFERENCES "super_admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_events" ADD CONSTRAINT "timeline_events_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
