-- ============================================
-- MIGRATION COMPLÉMENTAIRE DES ENUMS RESTANTS
-- Date: 2024-12-10
-- ============================================

BEGIN;

-- ============================================
-- PARTIE 1: KYCCheckStatus
-- ============================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'kyccheckstatus_new') THEN
    CREATE TYPE "KYCCheckStatus_new" AS ENUM ('EN_ATTENTE', 'EN_COURS', 'TERMINE', 'ECHOUE');
  END IF;
END $$;

ALTER TABLE "kyc_checks" ADD COLUMN IF NOT EXISTS "status_new" "KYCCheckStatus_new";

UPDATE "kyc_checks" SET "status_new" = CASE "status"::text
  WHEN 'PENDING' THEN 'EN_ATTENTE'::"KYCCheckStatus_new"
  WHEN 'IN_PROGRESS' THEN 'EN_COURS'::"KYCCheckStatus_new"
  WHEN 'COMPLETED' THEN 'TERMINE'::"KYCCheckStatus_new"
  WHEN 'FAILED' THEN 'ECHOUE'::"KYCCheckStatus_new"
  WHEN 'EN_ATTENTE' THEN 'EN_ATTENTE'::"KYCCheckStatus_new"
  WHEN 'EN_COURS' THEN 'EN_COURS'::"KYCCheckStatus_new"
  WHEN 'TERMINE' THEN 'TERMINE'::"KYCCheckStatus_new"
  WHEN 'ECHOUE' THEN 'ECHOUE'::"KYCCheckStatus_new"
  ELSE 'EN_ATTENTE'::"KYCCheckStatus_new"
END
WHERE "status_new" IS NULL;

ALTER TABLE "kyc_checks" DROP COLUMN IF EXISTS "status";
ALTER TABLE "kyc_checks" RENAME COLUMN "status_new" TO "status";
ALTER TABLE "kyc_checks" ALTER COLUMN "status" SET NOT NULL;
ALTER TABLE "kyc_checks" ALTER COLUMN "status" SET DEFAULT 'EN_ATTENTE'::"KYCCheckStatus_new";
DROP TYPE IF EXISTS "KYCCheckStatus" CASCADE;
ALTER TYPE "KYCCheckStatus_new" RENAME TO "KYCCheckStatus";

-- ============================================
-- PARTIE 2: KYCCheckPriority
-- ============================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'kyccheckpriority_new') THEN
    CREATE TYPE "KYCCheckPriority_new" AS ENUM ('BASSE', 'MOYENNE', 'HAUTE', 'URGENTE');
  END IF;
END $$;

ALTER TABLE "kyc_checks" ADD COLUMN IF NOT EXISTS "priority_new" "KYCCheckPriority_new";

UPDATE "kyc_checks" SET "priority_new" = CASE "priority"::text
  WHEN 'LOW' THEN 'BASSE'::"KYCCheckPriority_new"
  WHEN 'MEDIUM' THEN 'MOYENNE'::"KYCCheckPriority_new"
  WHEN 'HIGH' THEN 'HAUTE'::"KYCCheckPriority_new"
  WHEN 'CRITICAL' THEN 'URGENTE'::"KYCCheckPriority_new"
  WHEN 'BASSE' THEN 'BASSE'::"KYCCheckPriority_new"
  WHEN 'MOYENNE' THEN 'MOYENNE'::"KYCCheckPriority_new"
  WHEN 'HAUTE' THEN 'HAUTE'::"KYCCheckPriority_new"
  WHEN 'URGENTE' THEN 'URGENTE'::"KYCCheckPriority_new"
  ELSE 'MOYENNE'::"KYCCheckPriority_new"
END
WHERE "priority_new" IS NULL;

ALTER TABLE "kyc_checks" DROP COLUMN IF EXISTS "priority";
ALTER TABLE "kyc_checks" RENAME COLUMN "priority_new" TO "priority";
ALTER TABLE "kyc_checks" ALTER COLUMN "priority" SET NOT NULL;
ALTER TABLE "kyc_checks" ALTER COLUMN "priority" SET DEFAULT 'MOYENNE'::"KYCCheckPriority_new";
DROP TYPE IF EXISTS "KYCCheckPriority" CASCADE;
ALTER TYPE "KYCCheckPriority_new" RENAME TO "KYCCheckPriority";

-- ============================================
-- PARTIE 3: OpportunitePriority
-- ============================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'opportunitepriority_new') THEN
    CREATE TYPE "OpportunitePriority_new" AS ENUM ('BASSE', 'MOYENNE', 'HAUTE', 'URGENTE');
  END IF;
END $$;

ALTER TABLE "opportunites" ADD COLUMN IF NOT EXISTS "priority_new" "OpportunitePriority_new";

UPDATE "opportunites" SET "priority_new" = CASE "priority"::text
  WHEN 'LOW' THEN 'BASSE'::"OpportunitePriority_new"
  WHEN 'MEDIUM' THEN 'MOYENNE'::"OpportunitePriority_new"
  WHEN 'HIGH' THEN 'HAUTE'::"OpportunitePriority_new"
  WHEN 'CRITICAL' THEN 'URGENTE'::"OpportunitePriority_new"
  WHEN 'BASSE' THEN 'BASSE'::"OpportunitePriority_new"
  WHEN 'MOYENNE' THEN 'MOYENNE'::"OpportunitePriority_new"
  WHEN 'HAUTE' THEN 'HAUTE'::"OpportunitePriority_new"
  WHEN 'URGENTE' THEN 'URGENTE'::"OpportunitePriority_new"
  ELSE 'MOYENNE'::"OpportunitePriority_new"
END
WHERE "priority_new" IS NULL;

ALTER TABLE "opportunites" DROP COLUMN IF EXISTS "priority";
ALTER TABLE "opportunites" RENAME COLUMN "priority_new" TO "priority";
ALTER TABLE "opportunites" ALTER COLUMN "priority" SET NOT NULL;
ALTER TABLE "opportunites" ALTER COLUMN "priority" SET DEFAULT 'MOYENNE'::"OpportunitePriority_new";
DROP TYPE IF EXISTS "OpportunitePriority" CASCADE;
ALTER TYPE "OpportunitePriority_new" RENAME TO "OpportunitePriority";

-- ============================================
-- PARTIE 4: OpportuniteStatus
-- ============================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'opportunitestatus_new') THEN
    CREATE TYPE "OpportuniteStatus_new" AS ENUM (
      'DETECTEE', 'QUALIFIEE', 'CONTACTEE', 'PRESENTEE', 
      'ACCEPTEE', 'CONVERTIE', 'REJETEE', 'PERDUE'
    );
  END IF;
END $$;

ALTER TABLE "opportunites" ADD COLUMN IF NOT EXISTS "status_new" "OpportuniteStatus_new";

UPDATE "opportunites" SET "status_new" = CASE "status"::text
  WHEN 'DETECTED' THEN 'DETECTEE'::"OpportuniteStatus_new"
  WHEN 'QUALIFIED' THEN 'QUALIFIEE'::"OpportuniteStatus_new"
  WHEN 'CONTACTED' THEN 'CONTACTEE'::"OpportuniteStatus_new"
  WHEN 'PRESENTED' THEN 'PRESENTEE'::"OpportuniteStatus_new"
  WHEN 'ACCEPTED' THEN 'ACCEPTEE'::"OpportuniteStatus_new"
  WHEN 'CONVERTED' THEN 'CONVERTIE'::"OpportuniteStatus_new"
  WHEN 'REJECTED' THEN 'REJETEE'::"OpportuniteStatus_new"
  WHEN 'LOST' THEN 'PERDUE'::"OpportuniteStatus_new"
  -- Passthrough
  WHEN 'DETECTEE' THEN 'DETECTEE'::"OpportuniteStatus_new"
  WHEN 'QUALIFIEE' THEN 'QUALIFIEE'::"OpportuniteStatus_new"
  WHEN 'CONTACTEE' THEN 'CONTACTEE'::"OpportuniteStatus_new"
  WHEN 'PRESENTEE' THEN 'PRESENTEE'::"OpportuniteStatus_new"
  WHEN 'ACCEPTEE' THEN 'ACCEPTEE'::"OpportuniteStatus_new"
  WHEN 'CONVERTIE' THEN 'CONVERTIE'::"OpportuniteStatus_new"
  WHEN 'REJETEE' THEN 'REJETEE'::"OpportuniteStatus_new"
  WHEN 'PERDUE' THEN 'PERDUE'::"OpportuniteStatus_new"
  ELSE 'DETECTEE'::"OpportuniteStatus_new"
END
WHERE "status_new" IS NULL;

ALTER TABLE "opportunites" DROP COLUMN IF EXISTS "status";
ALTER TABLE "opportunites" RENAME COLUMN "status_new" TO "status";
ALTER TABLE "opportunites" ALTER COLUMN "status" SET NOT NULL;
ALTER TABLE "opportunites" ALTER COLUMN "status" SET DEFAULT 'DETECTEE'::"OpportuniteStatus_new";
DROP TYPE IF EXISTS "OpportuniteStatus" CASCADE;
ALTER TYPE "OpportuniteStatus_new" RENAME TO "OpportuniteStatus";

-- ============================================
-- PARTIE 5: TaxOptimizationPriority
-- ============================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'taxoptimizationpriority_new') THEN
    CREATE TYPE "TaxOptimizationPriority_new" AS ENUM ('BASSE', 'MOYENNE', 'HAUTE', 'URGENTE');
  END IF;
END $$;

ALTER TABLE "tax_optimizations" ADD COLUMN IF NOT EXISTS "priority_new" "TaxOptimizationPriority_new";

UPDATE "tax_optimizations" SET "priority_new" = CASE "priority"::text
  WHEN 'LOW' THEN 'BASSE'::"TaxOptimizationPriority_new"
  WHEN 'MEDIUM' THEN 'MOYENNE'::"TaxOptimizationPriority_new"
  WHEN 'HIGH' THEN 'HAUTE'::"TaxOptimizationPriority_new"
  WHEN 'CRITICAL' THEN 'URGENTE'::"TaxOptimizationPriority_new"
  WHEN 'BASSE' THEN 'BASSE'::"TaxOptimizationPriority_new"
  WHEN 'MOYENNE' THEN 'MOYENNE'::"TaxOptimizationPriority_new"
  WHEN 'HAUTE' THEN 'HAUTE'::"TaxOptimizationPriority_new"
  WHEN 'URGENTE' THEN 'URGENTE'::"TaxOptimizationPriority_new"
  ELSE 'MOYENNE'::"TaxOptimizationPriority_new"
END
WHERE "priority_new" IS NULL;

ALTER TABLE "tax_optimizations" DROP COLUMN IF EXISTS "priority";
ALTER TABLE "tax_optimizations" RENAME COLUMN "priority_new" TO "priority";
ALTER TABLE "tax_optimizations" ALTER COLUMN "priority" SET NOT NULL;
ALTER TABLE "tax_optimizations" ALTER COLUMN "priority" SET DEFAULT 'MOYENNE'::"TaxOptimizationPriority_new";
DROP TYPE IF EXISTS "TaxOptimizationPriority" CASCADE;
ALTER TYPE "TaxOptimizationPriority_new" RENAME TO "TaxOptimizationPriority";

-- ============================================
-- PARTIE 6: TaxOptimizationStatus
-- ============================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'taxoptimizationstatus_new') THEN
    CREATE TYPE "TaxOptimizationStatus_new" AS ENUM (
      'DETECTEE', 'EN_COURS', 'APPLIQUEE', 'REJETEE', 'EXPIREE'
    );
  END IF;
END $$;

ALTER TABLE "tax_optimizations" ADD COLUMN IF NOT EXISTS "status_new" "TaxOptimizationStatus_new";

UPDATE "tax_optimizations" SET "status_new" = CASE "status"::text
  WHEN 'DETECTED' THEN 'DETECTEE'::"TaxOptimizationStatus_new"
  WHEN 'IN_PROGRESS' THEN 'EN_COURS'::"TaxOptimizationStatus_new"
  WHEN 'APPLIED' THEN 'APPLIQUEE'::"TaxOptimizationStatus_new"
  WHEN 'REJECTED' THEN 'REJETEE'::"TaxOptimizationStatus_new"
  WHEN 'EXPIRED' THEN 'EXPIREE'::"TaxOptimizationStatus_new"
  WHEN 'DETECTEE' THEN 'DETECTEE'::"TaxOptimizationStatus_new"
  WHEN 'EN_COURS' THEN 'EN_COURS'::"TaxOptimizationStatus_new"
  WHEN 'APPLIQUEE' THEN 'APPLIQUEE'::"TaxOptimizationStatus_new"
  WHEN 'REJETEE' THEN 'REJETEE'::"TaxOptimizationStatus_new"
  WHEN 'EXPIREE' THEN 'EXPIREE'::"TaxOptimizationStatus_new"
  ELSE 'DETECTEE'::"TaxOptimizationStatus_new"
END
WHERE "status_new" IS NULL;

ALTER TABLE "tax_optimizations" DROP COLUMN IF EXISTS "status";
ALTER TABLE "tax_optimizations" RENAME COLUMN "status_new" TO "status";
ALTER TABLE "tax_optimizations" ALTER COLUMN "status" SET NOT NULL;
ALTER TABLE "tax_optimizations" ALTER COLUMN "status" SET DEFAULT 'DETECTEE'::"TaxOptimizationStatus_new";
DROP TYPE IF EXISTS "TaxOptimizationStatus" CASCADE;
ALTER TYPE "TaxOptimizationStatus_new" RENAME TO "TaxOptimizationStatus";

-- ============================================
-- PARTIE 7: CommissionStatus
-- ============================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'commissionstatus_new') THEN
    CREATE TYPE "CommissionStatus_new" AS ENUM ('EN_ATTENTE', 'VALIDEE', 'PAYEE', 'ANNULEE');
  END IF;
END $$;

ALTER TABLE "commissions" ADD COLUMN IF NOT EXISTS "status_new" "CommissionStatus_new";

UPDATE "commissions" SET "status_new" = CASE "status"::text
  WHEN 'PENDING' THEN 'EN_ATTENTE'::"CommissionStatus_new"
  WHEN 'VALIDATED' THEN 'VALIDEE'::"CommissionStatus_new"
  WHEN 'PAID' THEN 'PAYEE'::"CommissionStatus_new"
  WHEN 'CANCELLED' THEN 'ANNULEE'::"CommissionStatus_new"
  WHEN 'EN_ATTENTE' THEN 'EN_ATTENTE'::"CommissionStatus_new"
  WHEN 'VALIDEE' THEN 'VALIDEE'::"CommissionStatus_new"
  WHEN 'PAYEE' THEN 'PAYEE'::"CommissionStatus_new"
  WHEN 'ANNULEE' THEN 'ANNULEE'::"CommissionStatus_new"
  ELSE 'EN_ATTENTE'::"CommissionStatus_new"
END
WHERE "status_new" IS NULL;

ALTER TABLE "commissions" DROP COLUMN IF EXISTS "status";
ALTER TABLE "commissions" RENAME COLUMN "status_new" TO "status";
ALTER TABLE "commissions" ALTER COLUMN "status" SET NOT NULL;
ALTER TABLE "commissions" ALTER COLUMN "status" SET DEFAULT 'EN_ATTENTE'::"CommissionStatus_new";
DROP TYPE IF EXISTS "CommissionStatus" CASCADE;
ALTER TYPE "CommissionStatus_new" RENAME TO "CommissionStatus";

-- ============================================
-- PARTIE 8: ReclamationStatus
-- ============================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reclamationstatus_new') THEN
    CREATE TYPE "ReclamationStatus_new" AS ENUM (
      'RECUE', 'EN_COURS', 'EN_ATTENTE_INFO', 'RESOLUE', 'CLOTUREE', 'ESCALADEE'
    );
  END IF;
END $$;

ALTER TABLE "reclamations" ADD COLUMN IF NOT EXISTS "status_new" "ReclamationStatus_new";

UPDATE "reclamations" SET "status_new" = CASE "status"::text
  WHEN 'RECEIVED' THEN 'RECUE'::"ReclamationStatus_new"
  WHEN 'IN_PROGRESS' THEN 'EN_COURS'::"ReclamationStatus_new"
  WHEN 'WAITING_INFO' THEN 'EN_ATTENTE_INFO'::"ReclamationStatus_new"
  WHEN 'RESOLVED' THEN 'RESOLUE'::"ReclamationStatus_new"
  WHEN 'CLOSED' THEN 'CLOTUREE'::"ReclamationStatus_new"
  WHEN 'ESCALATED' THEN 'ESCALADEE'::"ReclamationStatus_new"
  WHEN 'RECUE' THEN 'RECUE'::"ReclamationStatus_new"
  WHEN 'EN_COURS' THEN 'EN_COURS'::"ReclamationStatus_new"
  WHEN 'EN_ATTENTE_INFO' THEN 'EN_ATTENTE_INFO'::"ReclamationStatus_new"
  WHEN 'RESOLUE' THEN 'RESOLUE'::"ReclamationStatus_new"
  WHEN 'CLOTUREE' THEN 'CLOTUREE'::"ReclamationStatus_new"
  WHEN 'ESCALADEE' THEN 'ESCALADEE'::"ReclamationStatus_new"
  ELSE 'RECUE'::"ReclamationStatus_new"
END
WHERE "status_new" IS NULL;

ALTER TABLE "reclamations" DROP COLUMN IF EXISTS "status";
ALTER TABLE "reclamations" RENAME COLUMN "status_new" TO "status";
ALTER TABLE "reclamations" ALTER COLUMN "status" SET NOT NULL;
ALTER TABLE "reclamations" ALTER COLUMN "status" SET DEFAULT 'RECUE'::"ReclamationStatus_new";
DROP TYPE IF EXISTS "ReclamationStatus" CASCADE;
ALTER TYPE "ReclamationStatus_new" RENAME TO "ReclamationStatus";

COMMIT;
