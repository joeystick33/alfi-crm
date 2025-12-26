-- ============================================
-- MIGRATION GLOBALE DES ENUMS VERS FR UNIFORME
-- Date: 2024-12-10
-- ============================================

BEGIN;

-- ============================================
-- PARTIE 1: MaritalStatus
-- ============================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'maritalstatus_new') THEN
    CREATE TYPE "MaritalStatus_new" AS ENUM (
      'CELIBATAIRE', 'MARIE', 'DIVORCE', 'VEUF', 'PACSE', 'CONCUBINAGE'
    );
  END IF;
END $$;

ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "maritalStatus_new" "MaritalStatus_new";

UPDATE "clients" SET "maritalStatus_new" = CASE "maritalStatus"::text
  WHEN 'SINGLE' THEN 'CELIBATAIRE'::"MaritalStatus_new"
  WHEN 'MARRIED' THEN 'MARIE'::"MaritalStatus_new"
  WHEN 'DIVORCED' THEN 'DIVORCE'::"MaritalStatus_new"
  WHEN 'WIDOWED' THEN 'VEUF'::"MaritalStatus_new"
  WHEN 'PACS' THEN 'PACSE'::"MaritalStatus_new"
  WHEN 'COHABITATION' THEN 'CONCUBINAGE'::"MaritalStatus_new"
  -- Passthrough nouvelles valeurs
  WHEN 'CELIBATAIRE' THEN 'CELIBATAIRE'::"MaritalStatus_new"
  WHEN 'MARIE' THEN 'MARIE'::"MaritalStatus_new"
  WHEN 'DIVORCE' THEN 'DIVORCE'::"MaritalStatus_new"
  WHEN 'VEUF' THEN 'VEUF'::"MaritalStatus_new"
  WHEN 'PACSE' THEN 'PACSE'::"MaritalStatus_new"
  WHEN 'CONCUBINAGE' THEN 'CONCUBINAGE'::"MaritalStatus_new"
  ELSE 'CELIBATAIRE'::"MaritalStatus_new"
END
WHERE "maritalStatus" IS NOT NULL AND "maritalStatus_new" IS NULL;

ALTER TABLE "clients" DROP COLUMN IF EXISTS "maritalStatus";
ALTER TABLE "clients" RENAME COLUMN "maritalStatus_new" TO "maritalStatus";
DROP TYPE IF EXISTS "MaritalStatus" CASCADE;
ALTER TYPE "MaritalStatus_new" RENAME TO "MaritalStatus";

-- ============================================
-- PARTIE 2: InvestmentHorizon
-- ============================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'investmenthorizon_new') THEN
    CREATE TYPE "InvestmentHorizon_new" AS ENUM ('COURT', 'MOYEN', 'LONG');
  END IF;
END $$;

ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "investmentHorizon_new" "InvestmentHorizon_new";

UPDATE "clients" SET "investmentHorizon_new" = CASE "investmentHorizon"::text
  WHEN 'SHORT' THEN 'COURT'::"InvestmentHorizon_new"
  WHEN 'MEDIUM' THEN 'MOYEN'::"InvestmentHorizon_new"
  WHEN 'LONG' THEN 'LONG'::"InvestmentHorizon_new"
  WHEN 'COURT' THEN 'COURT'::"InvestmentHorizon_new"
  WHEN 'MOYEN' THEN 'MOYEN'::"InvestmentHorizon_new"
  ELSE 'MOYEN'::"InvestmentHorizon_new"
END
WHERE "investmentHorizon" IS NOT NULL AND "investmentHorizon_new" IS NULL;

ALTER TABLE "clients" DROP COLUMN IF EXISTS "investmentHorizon";
ALTER TABLE "clients" RENAME COLUMN "investmentHorizon_new" TO "investmentHorizon";
DROP TYPE IF EXISTS "InvestmentHorizon" CASCADE;
ALTER TYPE "InvestmentHorizon_new" RENAME TO "InvestmentHorizon";

-- ============================================
-- PARTIE 3: KYCStatus
-- ============================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'kycstatus_new') THEN
    CREATE TYPE "KYCStatus_new" AS ENUM ('EN_ATTENTE', 'EN_COURS', 'COMPLET', 'EXPIRE', 'REJETE');
  END IF;
END $$;

ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "kycStatus_new" "KYCStatus_new";

UPDATE "clients" SET "kycStatus_new" = CASE "kycStatus"::text
  WHEN 'PENDING' THEN 'EN_ATTENTE'::"KYCStatus_new"
  WHEN 'IN_PROGRESS' THEN 'EN_COURS'::"KYCStatus_new"
  WHEN 'COMPLETED' THEN 'COMPLET'::"KYCStatus_new"
  WHEN 'EXPIRED' THEN 'EXPIRE'::"KYCStatus_new"
  WHEN 'REJECTED' THEN 'REJETE'::"KYCStatus_new"
  WHEN 'EN_ATTENTE' THEN 'EN_ATTENTE'::"KYCStatus_new"
  WHEN 'EN_COURS' THEN 'EN_COURS'::"KYCStatus_new"
  WHEN 'COMPLET' THEN 'COMPLET'::"KYCStatus_new"
  WHEN 'EXPIRE' THEN 'EXPIRE'::"KYCStatus_new"
  WHEN 'REJETE' THEN 'REJETE'::"KYCStatus_new"
  ELSE 'EN_ATTENTE'::"KYCStatus_new"
END
WHERE "kycStatus" IS NOT NULL AND "kycStatus_new" IS NULL;

ALTER TABLE "clients" DROP COLUMN IF EXISTS "kycStatus";
ALTER TABLE "clients" RENAME COLUMN "kycStatus_new" TO "kycStatus";
DROP TYPE IF EXISTS "KYCStatus" CASCADE;
ALTER TYPE "KYCStatus_new" RENAME TO "KYCStatus";

-- ============================================
-- PARTIE 4: ClientStatus
-- ============================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'clientstatus_new') THEN
    CREATE TYPE "ClientStatus_new" AS ENUM ('PROSPECT', 'ACTIF', 'INACTIF', 'ARCHIVE', 'PERDU');
  END IF;
END $$;

ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "status_new" "ClientStatus_new";

UPDATE "clients" SET "status_new" = CASE "status"::text
  WHEN 'PROSPECT' THEN 'PROSPECT'::"ClientStatus_new"
  WHEN 'ACTIVE' THEN 'ACTIF'::"ClientStatus_new"
  WHEN 'INACTIVE' THEN 'INACTIF'::"ClientStatus_new"
  WHEN 'ARCHIVED' THEN 'ARCHIVE'::"ClientStatus_new"
  WHEN 'LOST' THEN 'PERDU'::"ClientStatus_new"
  WHEN 'ACTIF' THEN 'ACTIF'::"ClientStatus_new"
  WHEN 'INACTIF' THEN 'INACTIF'::"ClientStatus_new"
  WHEN 'ARCHIVE' THEN 'ARCHIVE'::"ClientStatus_new"
  WHEN 'PERDU' THEN 'PERDU'::"ClientStatus_new"
  ELSE 'PROSPECT'::"ClientStatus_new"
END
WHERE "status_new" IS NULL;

ALTER TABLE "clients" DROP COLUMN IF EXISTS "status";
ALTER TABLE "clients" RENAME COLUMN "status_new" TO "status";
ALTER TABLE "clients" ALTER COLUMN "status" SET NOT NULL;
ALTER TABLE "clients" ALTER COLUMN "status" SET DEFAULT 'PROSPECT'::"ClientStatus_new";
DROP TYPE IF EXISTS "ClientStatus" CASCADE;
ALTER TYPE "ClientStatus_new" RENAME TO "ClientStatus";

-- ============================================
-- PARTIE 5: ActifType (66 valeurs)
-- ============================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'actiftype_new') THEN
    CREATE TYPE "ActifType_new" AS ENUM (
      -- Immobilier
      'RESIDENCE_PRINCIPALE', 'IMMOBILIER_LOCATIF', 'RESIDENCE_SECONDAIRE', 'IMMOBILIER_COMMERCIAL',
      'SCPI', 'SCI', 'OPCI', 'CROWDFUNDING_IMMO', 'VIAGER', 'NUE_PROPRIETE', 'USUFRUIT',
      -- Épargne salariale
      'PEE', 'PEG', 'PERCO', 'PERECO', 'CET', 'PARTICIPATION', 'INTERESSEMENT',
      'STOCK_OPTIONS', 'ACTIONS_GRATUITES', 'BSPCE',
      -- Épargne retraite
      'PER', 'PERP', 'MADELIN', 'ARTICLE_83', 'PREFON', 'COREM',
      -- Financier
      'ASSURANCE_VIE', 'CONTRAT_CAPITALISATION', 'COMPTE_TITRES', 'PEA', 'PEA_PME',
      -- Bancaire
      'COMPTE_BANCAIRE', 'LIVRETS', 'PEL', 'CEL', 'COMPTE_A_TERME',
      -- Professionnel
      'PARTS_SOCIALES', 'IMMOBILIER_PRO', 'MATERIEL_PRO', 'FONDS_COMMERCE', 'BREVETS_PI',
      -- Mobilier
      'METAUX_PRECIEUX', 'BIJOUX', 'OEUVRES_ART', 'VINS', 'MONTRES', 'VEHICULES', 'MOBILIER',
      'CRYPTO', 'NFT',
      -- Autre
      'AUTRE'
    );
  END IF;
END $$;

ALTER TABLE "actifs" ADD COLUMN IF NOT EXISTS "type_new" "ActifType_new";

UPDATE "actifs" SET "type_new" = CASE "type"::text
  -- Immobilier
  WHEN 'REAL_ESTATE_MAIN' THEN 'RESIDENCE_PRINCIPALE'::"ActifType_new"
  WHEN 'REAL_ESTATE_RENTAL' THEN 'IMMOBILIER_LOCATIF'::"ActifType_new"
  WHEN 'REAL_ESTATE_SECONDARY' THEN 'RESIDENCE_SECONDAIRE'::"ActifType_new"
  WHEN 'REAL_ESTATE_COMMERCIAL' THEN 'IMMOBILIER_COMMERCIAL'::"ActifType_new"
  WHEN 'SCPI' THEN 'SCPI'::"ActifType_new"
  WHEN 'SCI' THEN 'SCI'::"ActifType_new"
  WHEN 'OPCI' THEN 'OPCI'::"ActifType_new"
  WHEN 'CROWDFUNDING_IMMO' THEN 'CROWDFUNDING_IMMO'::"ActifType_new"
  WHEN 'VIAGER' THEN 'VIAGER'::"ActifType_new"
  WHEN 'NUE_PROPRIETE' THEN 'NUE_PROPRIETE'::"ActifType_new"
  WHEN 'USUFRUIT' THEN 'USUFRUIT'::"ActifType_new"
  -- Épargne salariale
  WHEN 'PEE' THEN 'PEE'::"ActifType_new"
  WHEN 'PEG' THEN 'PEG'::"ActifType_new"
  WHEN 'PERCO' THEN 'PERCO'::"ActifType_new"
  WHEN 'PERECO' THEN 'PERECO'::"ActifType_new"
  WHEN 'CET' THEN 'CET'::"ActifType_new"
  WHEN 'PARTICIPATION' THEN 'PARTICIPATION'::"ActifType_new"
  WHEN 'INTERESSEMENT' THEN 'INTERESSEMENT'::"ActifType_new"
  WHEN 'STOCK_OPTIONS' THEN 'STOCK_OPTIONS'::"ActifType_new"
  WHEN 'ACTIONS_GRATUITES' THEN 'ACTIONS_GRATUITES'::"ActifType_new"
  WHEN 'BSPCE' THEN 'BSPCE'::"ActifType_new"
  -- Épargne retraite
  WHEN 'PER' THEN 'PER'::"ActifType_new"
  WHEN 'PERP' THEN 'PERP'::"ActifType_new"
  WHEN 'MADELIN' THEN 'MADELIN'::"ActifType_new"
  WHEN 'ARTICLE_83' THEN 'ARTICLE_83'::"ActifType_new"
  WHEN 'PREFON' THEN 'PREFON'::"ActifType_new"
  WHEN 'COREM' THEN 'COREM'::"ActifType_new"
  -- Financier
  WHEN 'LIFE_INSURANCE' THEN 'ASSURANCE_VIE'::"ActifType_new"
  WHEN 'CAPITALIZATION_CONTRACT' THEN 'CONTRAT_CAPITALISATION'::"ActifType_new"
  WHEN 'SECURITIES_ACCOUNT' THEN 'COMPTE_TITRES'::"ActifType_new"
  WHEN 'PEA' THEN 'PEA'::"ActifType_new"
  WHEN 'PEA_PME' THEN 'PEA_PME'::"ActifType_new"
  -- Bancaire
  WHEN 'BANK_ACCOUNT' THEN 'COMPTE_BANCAIRE'::"ActifType_new"
  WHEN 'SAVINGS_ACCOUNT' THEN 'LIVRETS'::"ActifType_new"
  WHEN 'PEL' THEN 'PEL'::"ActifType_new"
  WHEN 'CEL' THEN 'CEL'::"ActifType_new"
  WHEN 'TERM_DEPOSIT' THEN 'COMPTE_A_TERME'::"ActifType_new"
  -- Professionnel
  WHEN 'COMPANY_SHARES' THEN 'PARTS_SOCIALES'::"ActifType_new"
  WHEN 'PROFESSIONAL_REAL_ESTATE' THEN 'IMMOBILIER_PRO'::"ActifType_new"
  WHEN 'PROFESSIONAL_EQUIPMENT' THEN 'MATERIEL_PRO'::"ActifType_new"
  WHEN 'GOODWILL' THEN 'FONDS_COMMERCE'::"ActifType_new"
  WHEN 'PATENTS_IP' THEN 'BREVETS_PI'::"ActifType_new"
  -- Mobilier
  WHEN 'PRECIOUS_METALS' THEN 'METAUX_PRECIEUX'::"ActifType_new"
  WHEN 'JEWELRY' THEN 'BIJOUX'::"ActifType_new"
  WHEN 'ART_COLLECTION' THEN 'OEUVRES_ART'::"ActifType_new"
  WHEN 'WINE_COLLECTION' THEN 'VINS'::"ActifType_new"
  WHEN 'WATCHES' THEN 'MONTRES'::"ActifType_new"
  WHEN 'VEHICLES' THEN 'VEHICULES'::"ActifType_new"
  WHEN 'FURNITURE' THEN 'MOBILIER'::"ActifType_new"
  WHEN 'CRYPTO' THEN 'CRYPTO'::"ActifType_new"
  WHEN 'NFT' THEN 'NFT'::"ActifType_new"
  WHEN 'OTHER' THEN 'AUTRE'::"ActifType_new"
  -- Passthrough nouvelles valeurs
  WHEN 'RESIDENCE_PRINCIPALE' THEN 'RESIDENCE_PRINCIPALE'::"ActifType_new"
  WHEN 'IMMOBILIER_LOCATIF' THEN 'IMMOBILIER_LOCATIF'::"ActifType_new"
  WHEN 'ASSURANCE_VIE' THEN 'ASSURANCE_VIE'::"ActifType_new"
  WHEN 'COMPTE_TITRES' THEN 'COMPTE_TITRES'::"ActifType_new"
  WHEN 'COMPTE_BANCAIRE' THEN 'COMPTE_BANCAIRE'::"ActifType_new"
  WHEN 'LIVRETS' THEN 'LIVRETS'::"ActifType_new"
  ELSE 'AUTRE'::"ActifType_new"
END
WHERE "type_new" IS NULL;

ALTER TABLE "actifs" DROP COLUMN IF EXISTS "type";
ALTER TABLE "actifs" RENAME COLUMN "type_new" TO "type";
ALTER TABLE "actifs" ALTER COLUMN "type" SET NOT NULL;
DROP TYPE IF EXISTS "ActifType" CASCADE;
ALTER TYPE "ActifType_new" RENAME TO "ActifType";

-- ============================================
-- PARTIE 6: PassifType
-- ============================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'passiftype_new') THEN
    CREATE TYPE "PassifType_new" AS ENUM (
      'CREDIT_IMMOBILIER', 'PTZ', 'PRET_ACTION_LOGEMENT', 'CREDIT_CONSOMMATION',
      'CREDIT_AUTO', 'PRET_ETUDIANT', 'PRET_PROFESSIONNEL', 'CREDIT_REVOLVING',
      'PRET_RELAIS', 'PRET_IN_FINE', 'PRET_FAMILIAL', 'DECOUVERT', 'LEASING', 'AUTRE'
    );
  END IF;
END $$;

ALTER TABLE "passifs" ADD COLUMN IF NOT EXISTS "type_new" "PassifType_new";

UPDATE "passifs" SET "type_new" = CASE "type"::text
  WHEN 'MORTGAGE' THEN 'CREDIT_IMMOBILIER'::"PassifType_new"
  WHEN 'MORTGAGE_PTZ' THEN 'PTZ'::"PassifType_new"
  WHEN 'MORTGAGE_ACTION_LOG' THEN 'PRET_ACTION_LOGEMENT'::"PassifType_new"
  WHEN 'CONSUMER_LOAN' THEN 'CREDIT_CONSOMMATION'::"PassifType_new"
  WHEN 'CAR_LOAN' THEN 'CREDIT_AUTO'::"PassifType_new"
  WHEN 'STUDENT_LOAN' THEN 'PRET_ETUDIANT'::"PassifType_new"
  WHEN 'PROFESSIONAL_LOAN' THEN 'PRET_PROFESSIONNEL'::"PassifType_new"
  WHEN 'REVOLVING_CREDIT' THEN 'CREDIT_REVOLVING'::"PassifType_new"
  WHEN 'BRIDGE_LOAN' THEN 'PRET_RELAIS'::"PassifType_new"
  WHEN 'IN_FINE_LOAN' THEN 'PRET_IN_FINE'::"PassifType_new"
  WHEN 'FAMILY_LOAN' THEN 'PRET_FAMILIAL'::"PassifType_new"
  WHEN 'OVERDRAFT' THEN 'DECOUVERT'::"PassifType_new"
  WHEN 'LEASING' THEN 'LEASING'::"PassifType_new"
  WHEN 'OTHER' THEN 'AUTRE'::"PassifType_new"
  -- Passthrough
  WHEN 'CREDIT_IMMOBILIER' THEN 'CREDIT_IMMOBILIER'::"PassifType_new"
  WHEN 'CREDIT_CONSOMMATION' THEN 'CREDIT_CONSOMMATION'::"PassifType_new"
  WHEN 'CREDIT_AUTO' THEN 'CREDIT_AUTO'::"PassifType_new"
  ELSE 'AUTRE'::"PassifType_new"
END
WHERE "type_new" IS NULL;

ALTER TABLE "passifs" DROP COLUMN IF EXISTS "type";
ALTER TABLE "passifs" RENAME COLUMN "type_new" TO "type";
ALTER TABLE "passifs" ALTER COLUMN "type" SET NOT NULL;
DROP TYPE IF EXISTS "PassifType" CASCADE;
ALTER TYPE "PassifType_new" RENAME TO "PassifType";

-- ============================================
-- PARTIE 7: ContratType
-- ============================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contrattype_new') THEN
    CREATE TYPE "ContratType_new" AS ENUM (
      'ASSURANCE_VIE', 'MUTUELLE', 'ASSURANCE_HABITATION', 'ASSURANCE_AUTO',
      'ASSURANCE_PRO', 'ASSURANCE_DECES', 'PREVOYANCE', 'EPARGNE_RETRAITE', 'AUTRE'
    );
  END IF;
END $$;

ALTER TABLE "contrats" ADD COLUMN IF NOT EXISTS "type_new" "ContratType_new";

UPDATE "contrats" SET "type_new" = CASE "type"::text
  WHEN 'LIFE_INSURANCE' THEN 'ASSURANCE_VIE'::"ContratType_new"
  WHEN 'HEALTH_INSURANCE' THEN 'MUTUELLE'::"ContratType_new"
  WHEN 'HOME_INSURANCE' THEN 'ASSURANCE_HABITATION'::"ContratType_new"
  WHEN 'CAR_INSURANCE' THEN 'ASSURANCE_AUTO'::"ContratType_new"
  WHEN 'PROFESSIONAL_INSURANCE' THEN 'ASSURANCE_PRO'::"ContratType_new"
  WHEN 'DEATH_INSURANCE' THEN 'ASSURANCE_DECES'::"ContratType_new"
  WHEN 'DISABILITY_INSURANCE' THEN 'PREVOYANCE'::"ContratType_new"
  WHEN 'RETIREMENT_SAVINGS' THEN 'EPARGNE_RETRAITE'::"ContratType_new"
  WHEN 'OTHER' THEN 'AUTRE'::"ContratType_new"
  -- Passthrough
  WHEN 'ASSURANCE_VIE' THEN 'ASSURANCE_VIE'::"ContratType_new"
  WHEN 'MUTUELLE' THEN 'MUTUELLE'::"ContratType_new"
  ELSE 'AUTRE'::"ContratType_new"
END
WHERE "type_new" IS NULL;

ALTER TABLE "contrats" DROP COLUMN IF EXISTS "type";
ALTER TABLE "contrats" RENAME COLUMN "type_new" TO "type";
ALTER TABLE "contrats" ALTER COLUMN "type" SET NOT NULL;
DROP TYPE IF EXISTS "ContratType" CASCADE;
ALTER TYPE "ContratType_new" RENAME TO "ContratType";

-- ============================================
-- PARTIE 8: ContratStatus
-- ============================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contratstatus_new') THEN
    CREATE TYPE "ContratStatus_new" AS ENUM ('ACTIF', 'SUSPENDU', 'RESILIE', 'EXPIRE');
  END IF;
END $$;

ALTER TABLE "contrats" ADD COLUMN IF NOT EXISTS "status_new" "ContratStatus_new";

UPDATE "contrats" SET "status_new" = CASE "status"::text
  WHEN 'ACTIVE' THEN 'ACTIF'::"ContratStatus_new"
  WHEN 'SUSPENDED' THEN 'SUSPENDU'::"ContratStatus_new"
  WHEN 'TERMINATED' THEN 'RESILIE'::"ContratStatus_new"
  WHEN 'EXPIRED' THEN 'EXPIRE'::"ContratStatus_new"
  WHEN 'ACTIF' THEN 'ACTIF'::"ContratStatus_new"
  WHEN 'SUSPENDU' THEN 'SUSPENDU'::"ContratStatus_new"
  WHEN 'RESILIE' THEN 'RESILIE'::"ContratStatus_new"
  WHEN 'EXPIRE' THEN 'EXPIRE'::"ContratStatus_new"
  ELSE 'ACTIF'::"ContratStatus_new"
END
WHERE "status_new" IS NULL;

ALTER TABLE "contrats" DROP COLUMN IF EXISTS "status";
ALTER TABLE "contrats" RENAME COLUMN "status_new" TO "status";
ALTER TABLE "contrats" ALTER COLUMN "status" SET NOT NULL;
ALTER TABLE "contrats" ALTER COLUMN "status" SET DEFAULT 'ACTIF'::"ContratStatus_new";
DROP TYPE IF EXISTS "ContratStatus" CASCADE;
ALTER TYPE "ContratStatus_new" RENAME TO "ContratStatus";

-- ============================================
-- PARTIE 9: DocumentType
-- ============================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'documenttype_new') THEN
    CREATE TYPE "DocumentType_new" AS ENUM (
      'CARTE_IDENTITE', 'PASSEPORT', 'JUSTIFICATIF_DOMICILE', 'AVIS_IMPOSITION',
      'RELEVE_BANCAIRE', 'TITRE_PROPRIETE', 'CONTRAT_PRET', 'CONTRAT_ASSURANCE',
      'RELEVE_PLACEMENT', 'CONVENTION_ENTREE', 'LETTRE_MISSION', 'DECLARATION_ADEQUATION',
      'PROFIL_INVESTISSEUR', 'RAPPORT_ANNUEL', 'PIECE_JOINTE_EMAIL', 'COMPTE_RENDU_RDV',
      'PROPOSITION', 'CONTRAT', 'FACTURE', 'AUTRE'
    );
  END IF;
END $$;

ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "type_new" "DocumentType_new";

UPDATE "documents" SET "type_new" = CASE "type"::text
  WHEN 'ID_CARD' THEN 'CARTE_IDENTITE'::"DocumentType_new"
  WHEN 'PASSPORT' THEN 'PASSEPORT'::"DocumentType_new"
  WHEN 'PROOF_OF_ADDRESS' THEN 'JUSTIFICATIF_DOMICILE'::"DocumentType_new"
  WHEN 'TAX_NOTICE' THEN 'AVIS_IMPOSITION'::"DocumentType_new"
  WHEN 'BANK_STATEMENT' THEN 'RELEVE_BANCAIRE'::"DocumentType_new"
  WHEN 'PROPERTY_DEED' THEN 'TITRE_PROPRIETE'::"DocumentType_new"
  WHEN 'LOAN_AGREEMENT' THEN 'CONTRAT_PRET'::"DocumentType_new"
  WHEN 'INSURANCE_POLICY' THEN 'CONTRAT_ASSURANCE'::"DocumentType_new"
  WHEN 'INVESTMENT_STATEMENT' THEN 'RELEVE_PLACEMENT'::"DocumentType_new"
  WHEN 'ENTRY_AGREEMENT' THEN 'CONVENTION_ENTREE'::"DocumentType_new"
  WHEN 'MISSION_LETTER' THEN 'LETTRE_MISSION'::"DocumentType_new"
  WHEN 'ADEQUACY_DECLARATION' THEN 'DECLARATION_ADEQUATION'::"DocumentType_new"
  WHEN 'INVESTOR_PROFILE' THEN 'PROFIL_INVESTISSEUR'::"DocumentType_new"
  WHEN 'ANNUAL_REPORT' THEN 'RAPPORT_ANNUEL'::"DocumentType_new"
  WHEN 'EMAIL_ATTACHMENT' THEN 'PIECE_JOINTE_EMAIL'::"DocumentType_new"
  WHEN 'MEETING_MINUTES' THEN 'COMPTE_RENDU_RDV'::"DocumentType_new"
  WHEN 'PROPOSAL' THEN 'PROPOSITION'::"DocumentType_new"
  WHEN 'CONTRACT' THEN 'CONTRAT'::"DocumentType_new"
  WHEN 'INVOICE' THEN 'FACTURE'::"DocumentType_new"
  WHEN 'OTHER' THEN 'AUTRE'::"DocumentType_new"
  -- Passthrough
  WHEN 'CARTE_IDENTITE' THEN 'CARTE_IDENTITE'::"DocumentType_new"
  WHEN 'PASSEPORT' THEN 'PASSEPORT'::"DocumentType_new"
  ELSE 'AUTRE'::"DocumentType_new"
END
WHERE "type_new" IS NULL;

ALTER TABLE "documents" DROP COLUMN IF EXISTS "type";
ALTER TABLE "documents" RENAME COLUMN "type_new" TO "type";
ALTER TABLE "documents" ALTER COLUMN "type" SET NOT NULL;
DROP TYPE IF EXISTS "DocumentType" CASCADE;
ALTER TYPE "DocumentType_new" RENAME TO "DocumentType";

-- ============================================
-- PARTIE 10: ObjectifType
-- ============================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'objectiftype_new') THEN
    CREATE TYPE "ObjectifType_new" AS ENUM (
      'RETRAITE', 'ACHAT_IMMOBILIER', 'ETUDES', 'TRANSMISSION',
      'OPTIMISATION_FISCALE', 'REVENUS_COMPLEMENTAIRES', 'PROTECTION_CAPITAL', 'AUTRE'
    );
  END IF;
END $$;

ALTER TABLE "objectifs" ADD COLUMN IF NOT EXISTS "type_new" "ObjectifType_new";

UPDATE "objectifs" SET "type_new" = CASE "type"::text
  WHEN 'RETIREMENT' THEN 'RETRAITE'::"ObjectifType_new"
  WHEN 'REAL_ESTATE_PURCHASE' THEN 'ACHAT_IMMOBILIER'::"ObjectifType_new"
  WHEN 'EDUCATION' THEN 'ETUDES'::"ObjectifType_new"
  WHEN 'WEALTH_TRANSMISSION' THEN 'TRANSMISSION'::"ObjectifType_new"
  WHEN 'TAX_OPTIMIZATION' THEN 'OPTIMISATION_FISCALE'::"ObjectifType_new"
  WHEN 'INCOME_GENERATION' THEN 'REVENUS_COMPLEMENTAIRES'::"ObjectifType_new"
  WHEN 'CAPITAL_PROTECTION' THEN 'PROTECTION_CAPITAL'::"ObjectifType_new"
  WHEN 'OTHER' THEN 'AUTRE'::"ObjectifType_new"
  -- Passthrough
  WHEN 'RETRAITE' THEN 'RETRAITE'::"ObjectifType_new"
  WHEN 'ACHAT_IMMOBILIER' THEN 'ACHAT_IMMOBILIER'::"ObjectifType_new"
  ELSE 'AUTRE'::"ObjectifType_new"
END
WHERE "type_new" IS NULL;

ALTER TABLE "objectifs" DROP COLUMN IF EXISTS "type";
ALTER TABLE "objectifs" RENAME COLUMN "type_new" TO "type";
ALTER TABLE "objectifs" ALTER COLUMN "type" SET NOT NULL;
DROP TYPE IF EXISTS "ObjectifType" CASCADE;
ALTER TYPE "ObjectifType_new" RENAME TO "ObjectifType";

-- ============================================
-- PARTIE 11: ObjectifStatus
-- ============================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'objectifstatus_new') THEN
    CREATE TYPE "ObjectifStatus_new" AS ENUM ('ACTIF', 'ATTEINT', 'ANNULE', 'EN_PAUSE');
  END IF;
END $$;

ALTER TABLE "objectifs" ADD COLUMN IF NOT EXISTS "status_new" "ObjectifStatus_new";

UPDATE "objectifs" SET "status_new" = CASE "status"::text
  WHEN 'ACTIVE' THEN 'ACTIF'::"ObjectifStatus_new"
  WHEN 'ACHIEVED' THEN 'ATTEINT'::"ObjectifStatus_new"
  WHEN 'CANCELLED' THEN 'ANNULE'::"ObjectifStatus_new"
  WHEN 'ON_HOLD' THEN 'EN_PAUSE'::"ObjectifStatus_new"
  WHEN 'ACTIF' THEN 'ACTIF'::"ObjectifStatus_new"
  ELSE 'ACTIF'::"ObjectifStatus_new"
END
WHERE "status_new" IS NULL;

ALTER TABLE "objectifs" DROP COLUMN IF EXISTS "status";
ALTER TABLE "objectifs" RENAME COLUMN "status_new" TO "status";
ALTER TABLE "objectifs" ALTER COLUMN "status" SET NOT NULL;
ALTER TABLE "objectifs" ALTER COLUMN "status" SET DEFAULT 'ACTIF'::"ObjectifStatus_new";
DROP TYPE IF EXISTS "ObjectifStatus" CASCADE;
ALTER TYPE "ObjectifStatus_new" RENAME TO "ObjectifStatus";

-- ============================================
-- PARTIE 12: ObjectifPriority
-- ============================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'objectifpriority_new') THEN
    CREATE TYPE "ObjectifPriority_new" AS ENUM ('BASSE', 'MOYENNE', 'HAUTE', 'URGENTE');
  END IF;
END $$;

ALTER TABLE "objectifs" ADD COLUMN IF NOT EXISTS "priority_new" "ObjectifPriority_new";

UPDATE "objectifs" SET "priority_new" = CASE "priority"::text
  WHEN 'LOW' THEN 'BASSE'::"ObjectifPriority_new"
  WHEN 'MEDIUM' THEN 'MOYENNE'::"ObjectifPriority_new"
  WHEN 'HIGH' THEN 'HAUTE'::"ObjectifPriority_new"
  WHEN 'CRITICAL' THEN 'URGENTE'::"ObjectifPriority_new"
  WHEN 'BASSE' THEN 'BASSE'::"ObjectifPriority_new"
  WHEN 'MOYENNE' THEN 'MOYENNE'::"ObjectifPriority_new"
  WHEN 'HAUTE' THEN 'HAUTE'::"ObjectifPriority_new"
  WHEN 'URGENTE' THEN 'URGENTE'::"ObjectifPriority_new"
  ELSE 'MOYENNE'::"ObjectifPriority_new"
END
WHERE "priority_new" IS NULL;

ALTER TABLE "objectifs" DROP COLUMN IF EXISTS "priority";
ALTER TABLE "objectifs" RENAME COLUMN "priority_new" TO "priority";
ALTER TABLE "objectifs" ALTER COLUMN "priority" SET NOT NULL;
ALTER TABLE "objectifs" ALTER COLUMN "priority" SET DEFAULT 'MOYENNE'::"ObjectifPriority_new";
DROP TYPE IF EXISTS "ObjectifPriority" CASCADE;
ALTER TYPE "ObjectifPriority_new" RENAME TO "ObjectifPriority";

-- ============================================
-- PARTIE 13: ProjetType
-- ============================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'projettype_new') THEN
    CREATE TYPE "ProjetType_new" AS ENUM (
      'ACHAT_IMMOBILIER', 'CREATION_ENTREPRISE', 'PREPARATION_RETRAITE',
      'RESTRUCTURATION_PATRIMOINE', 'OPTIMISATION_FISCALE', 'PLANIFICATION_SUCCESSION', 'AUTRE'
    );
  END IF;
END $$;

ALTER TABLE "projets" ADD COLUMN IF NOT EXISTS "type_new" "ProjetType_new";

UPDATE "projets" SET "type_new" = CASE "type"::text
  WHEN 'REAL_ESTATE_PURCHASE' THEN 'ACHAT_IMMOBILIER'::"ProjetType_new"
  WHEN 'BUSINESS_CREATION' THEN 'CREATION_ENTREPRISE'::"ProjetType_new"
  WHEN 'RETIREMENT_PREPARATION' THEN 'PREPARATION_RETRAITE'::"ProjetType_new"
  WHEN 'WEALTH_RESTRUCTURING' THEN 'RESTRUCTURATION_PATRIMOINE'::"ProjetType_new"
  WHEN 'TAX_OPTIMIZATION' THEN 'OPTIMISATION_FISCALE'::"ProjetType_new"
  WHEN 'SUCCESSION_PLANNING' THEN 'PLANIFICATION_SUCCESSION'::"ProjetType_new"
  WHEN 'OTHER' THEN 'AUTRE'::"ProjetType_new"
  -- Passthrough
  WHEN 'ACHAT_IMMOBILIER' THEN 'ACHAT_IMMOBILIER'::"ProjetType_new"
  ELSE 'AUTRE'::"ProjetType_new"
END
WHERE "type_new" IS NULL;

ALTER TABLE "projets" DROP COLUMN IF EXISTS "type";
ALTER TABLE "projets" RENAME COLUMN "type_new" TO "type";
ALTER TABLE "projets" ALTER COLUMN "type" SET NOT NULL;
DROP TYPE IF EXISTS "ProjetType" CASCADE;
ALTER TYPE "ProjetType_new" RENAME TO "ProjetType";

-- ============================================
-- PARTIE 14: ProjetStatus
-- ============================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'projetstatus_new') THEN
    CREATE TYPE "ProjetStatus_new" AS ENUM ('PLANIFIE', 'EN_COURS', 'TERMINE', 'ANNULE', 'EN_PAUSE');
  END IF;
END $$;

ALTER TABLE "projets" ADD COLUMN IF NOT EXISTS "status_new" "ProjetStatus_new";

UPDATE "projets" SET "status_new" = CASE "status"::text
  WHEN 'PLANNED' THEN 'PLANIFIE'::"ProjetStatus_new"
  WHEN 'IN_PROGRESS' THEN 'EN_COURS'::"ProjetStatus_new"
  WHEN 'COMPLETED' THEN 'TERMINE'::"ProjetStatus_new"
  WHEN 'CANCELLED' THEN 'ANNULE'::"ProjetStatus_new"
  WHEN 'ON_HOLD' THEN 'EN_PAUSE'::"ProjetStatus_new"
  -- Passthrough
  WHEN 'PLANIFIE' THEN 'PLANIFIE'::"ProjetStatus_new"
  WHEN 'EN_COURS' THEN 'EN_COURS'::"ProjetStatus_new"
  WHEN 'TERMINE' THEN 'TERMINE'::"ProjetStatus_new"
  ELSE 'PLANIFIE'::"ProjetStatus_new"
END
WHERE "status_new" IS NULL;

ALTER TABLE "projets" DROP COLUMN IF EXISTS "status";
ALTER TABLE "projets" RENAME COLUMN "status_new" TO "status";
ALTER TABLE "projets" ALTER COLUMN "status" SET NOT NULL;
ALTER TABLE "projets" ALTER COLUMN "status" SET DEFAULT 'PLANIFIE'::"ProjetStatus_new";
DROP TYPE IF EXISTS "ProjetStatus" CASCADE;
ALTER TYPE "ProjetStatus_new" RENAME TO "ProjetStatus";

-- ============================================
-- PARTIE 15: TacheType
-- ============================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tachetype_new') THEN
    CREATE TYPE "TacheType_new" AS ENUM (
      'APPEL', 'EMAIL', 'REUNION', 'REVUE_DOCUMENTS', 'MISE_A_JOUR_KYC',
      'RENOUVELLEMENT_CONTRAT', 'SUIVI', 'ADMINISTRATIF', 'AUTRE'
    );
  END IF;
END $$;

ALTER TABLE "taches" ADD COLUMN IF NOT EXISTS "type_new" "TacheType_new";

UPDATE "taches" SET "type_new" = CASE "type"::text
  WHEN 'CALL' THEN 'APPEL'::"TacheType_new"
  WHEN 'EMAIL' THEN 'EMAIL'::"TacheType_new"
  WHEN 'MEETING' THEN 'REUNION'::"TacheType_new"
  WHEN 'DOCUMENT_REVIEW' THEN 'REVUE_DOCUMENTS'::"TacheType_new"
  WHEN 'KYC_UPDATE' THEN 'MISE_A_JOUR_KYC'::"TacheType_new"
  WHEN 'CONTRACT_RENEWAL' THEN 'RENOUVELLEMENT_CONTRAT'::"TacheType_new"
  WHEN 'FOLLOW_UP' THEN 'SUIVI'::"TacheType_new"
  WHEN 'ADMINISTRATIVE' THEN 'ADMINISTRATIF'::"TacheType_new"
  WHEN 'OTHER' THEN 'AUTRE'::"TacheType_new"
  -- Passthrough
  WHEN 'APPEL' THEN 'APPEL'::"TacheType_new"
  WHEN 'REUNION' THEN 'REUNION'::"TacheType_new"
  ELSE 'AUTRE'::"TacheType_new"
END
WHERE "type_new" IS NULL;

ALTER TABLE "taches" DROP COLUMN IF EXISTS "type";
ALTER TABLE "taches" RENAME COLUMN "type_new" TO "type";
ALTER TABLE "taches" ALTER COLUMN "type" SET NOT NULL;
DROP TYPE IF EXISTS "TacheType" CASCADE;
ALTER TYPE "TacheType_new" RENAME TO "TacheType";

-- ============================================
-- PARTIE 16: TachePriority
-- ============================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tachepriority_new') THEN
    CREATE TYPE "TachePriority_new" AS ENUM ('BASSE', 'MOYENNE', 'HAUTE', 'URGENTE');
  END IF;
END $$;

ALTER TABLE "taches" ADD COLUMN IF NOT EXISTS "priority_new" "TachePriority_new";

UPDATE "taches" SET "priority_new" = CASE "priority"::text
  WHEN 'LOW' THEN 'BASSE'::"TachePriority_new"
  WHEN 'MEDIUM' THEN 'MOYENNE'::"TachePriority_new"
  WHEN 'HIGH' THEN 'HAUTE'::"TachePriority_new"
  WHEN 'URGENT' THEN 'URGENTE'::"TachePriority_new"
  -- Passthrough
  WHEN 'BASSE' THEN 'BASSE'::"TachePriority_new"
  WHEN 'MOYENNE' THEN 'MOYENNE'::"TachePriority_new"
  WHEN 'HAUTE' THEN 'HAUTE'::"TachePriority_new"
  WHEN 'URGENTE' THEN 'URGENTE'::"TachePriority_new"
  ELSE 'MOYENNE'::"TachePriority_new"
END
WHERE "priority_new" IS NULL;

ALTER TABLE "taches" DROP COLUMN IF EXISTS "priority";
ALTER TABLE "taches" RENAME COLUMN "priority_new" TO "priority";
ALTER TABLE "taches" ALTER COLUMN "priority" SET NOT NULL;
ALTER TABLE "taches" ALTER COLUMN "priority" SET DEFAULT 'MOYENNE'::"TachePriority_new";
DROP TYPE IF EXISTS "TachePriority" CASCADE;
ALTER TYPE "TachePriority_new" RENAME TO "TachePriority";

-- ============================================
-- PARTIE 17: TacheStatus
-- ============================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tachestatus_new') THEN
    CREATE TYPE "TacheStatus_new" AS ENUM ('A_FAIRE', 'EN_COURS', 'TERMINE', 'ANNULE');
  END IF;
END $$;

ALTER TABLE "taches" ADD COLUMN IF NOT EXISTS "status_new" "TacheStatus_new";

UPDATE "taches" SET "status_new" = CASE "status"::text
  WHEN 'TODO' THEN 'A_FAIRE'::"TacheStatus_new"
  WHEN 'IN_PROGRESS' THEN 'EN_COURS'::"TacheStatus_new"
  WHEN 'COMPLETED' THEN 'TERMINE'::"TacheStatus_new"
  WHEN 'CANCELLED' THEN 'ANNULE'::"TacheStatus_new"
  -- Passthrough
  WHEN 'A_FAIRE' THEN 'A_FAIRE'::"TacheStatus_new"
  WHEN 'EN_COURS' THEN 'EN_COURS'::"TacheStatus_new"
  WHEN 'TERMINE' THEN 'TERMINE'::"TacheStatus_new"
  WHEN 'ANNULE' THEN 'ANNULE'::"TacheStatus_new"
  ELSE 'A_FAIRE'::"TacheStatus_new"
END
WHERE "status_new" IS NULL;

ALTER TABLE "taches" DROP COLUMN IF EXISTS "status";
ALTER TABLE "taches" RENAME COLUMN "status_new" TO "status";
ALTER TABLE "taches" ALTER COLUMN "status" SET NOT NULL;
ALTER TABLE "taches" ALTER COLUMN "status" SET DEFAULT 'A_FAIRE'::"TacheStatus_new";
DROP TYPE IF EXISTS "TacheStatus" CASCADE;
ALTER TYPE "TacheStatus_new" RENAME TO "TacheStatus";

-- ============================================
-- PARTIE 18: RendezVousType
-- ============================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rendezvoustype_new') THEN
    CREATE TYPE "RendezVousType_new" AS ENUM (
      'PREMIER_RDV', 'SUIVI', 'BILAN_ANNUEL', 'SIGNATURE', 'APPEL_TEL', 'VISIO', 'AUTRE'
    );
  END IF;
END $$;

ALTER TABLE "rendez_vous" ADD COLUMN IF NOT EXISTS "type_new" "RendezVousType_new";

UPDATE "rendez_vous" SET "type_new" = CASE "type"::text
  WHEN 'FIRST_MEETING' THEN 'PREMIER_RDV'::"RendezVousType_new"
  WHEN 'FOLLOW_UP' THEN 'SUIVI'::"RendezVousType_new"
  WHEN 'ANNUAL_REVIEW' THEN 'BILAN_ANNUEL'::"RendezVousType_new"
  WHEN 'SIGNING' THEN 'SIGNATURE'::"RendezVousType_new"
  WHEN 'PHONE_CALL' THEN 'APPEL_TEL'::"RendezVousType_new"
  WHEN 'VIDEO_CALL' THEN 'VISIO'::"RendezVousType_new"
  WHEN 'OTHER' THEN 'AUTRE'::"RendezVousType_new"
  -- Passthrough
  WHEN 'PREMIER_RDV' THEN 'PREMIER_RDV'::"RendezVousType_new"
  WHEN 'SUIVI' THEN 'SUIVI'::"RendezVousType_new"
  ELSE 'AUTRE'::"RendezVousType_new"
END
WHERE "type_new" IS NULL;

ALTER TABLE "rendez_vous" DROP COLUMN IF EXISTS "type";
ALTER TABLE "rendez_vous" RENAME COLUMN "type_new" TO "type";
ALTER TABLE "rendez_vous" ALTER COLUMN "type" SET NOT NULL;
DROP TYPE IF EXISTS "RendezVousType" CASCADE;
ALTER TYPE "RendezVousType_new" RENAME TO "RendezVousType";

-- ============================================
-- PARTIE 19: RendezVousStatus
-- ============================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rendezvousstatus_new') THEN
    CREATE TYPE "RendezVousStatus_new" AS ENUM ('PLANIFIE', 'CONFIRME', 'TERMINE', 'ANNULE', 'ABSENT');
  END IF;
END $$;

ALTER TABLE "rendez_vous" ADD COLUMN IF NOT EXISTS "status_new" "RendezVousStatus_new";

UPDATE "rendez_vous" SET "status_new" = CASE "status"::text
  WHEN 'SCHEDULED' THEN 'PLANIFIE'::"RendezVousStatus_new"
  WHEN 'CONFIRMED' THEN 'CONFIRME'::"RendezVousStatus_new"
  WHEN 'COMPLETED' THEN 'TERMINE'::"RendezVousStatus_new"
  WHEN 'CANCELLED' THEN 'ANNULE'::"RendezVousStatus_new"
  WHEN 'NO_SHOW' THEN 'ABSENT'::"RendezVousStatus_new"
  -- Passthrough
  WHEN 'PLANIFIE' THEN 'PLANIFIE'::"RendezVousStatus_new"
  WHEN 'CONFIRME' THEN 'CONFIRME'::"RendezVousStatus_new"
  WHEN 'TERMINE' THEN 'TERMINE'::"RendezVousStatus_new"
  WHEN 'ANNULE' THEN 'ANNULE'::"RendezVousStatus_new"
  WHEN 'ABSENT' THEN 'ABSENT'::"RendezVousStatus_new"
  ELSE 'PLANIFIE'::"RendezVousStatus_new"
END
WHERE "status_new" IS NULL;

ALTER TABLE "rendez_vous" DROP COLUMN IF EXISTS "status";
ALTER TABLE "rendez_vous" RENAME COLUMN "status_new" TO "status";
ALTER TABLE "rendez_vous" ALTER COLUMN "status" SET NOT NULL;
ALTER TABLE "rendez_vous" ALTER COLUMN "status" SET DEFAULT 'PLANIFIE'::"RendezVousStatus_new";
DROP TYPE IF EXISTS "RendezVousStatus" CASCADE;
ALTER TYPE "RendezVousStatus_new" RENAME TO "RendezVousStatus";

-- ============================================
-- FIN DE LA MIGRATION
-- ============================================

COMMIT;

-- Vérification (à exécuter après)
-- SELECT DISTINCT "maritalStatus" FROM clients;
-- SELECT DISTINCT "status" FROM clients;
-- SELECT DISTINCT "type" FROM actifs;
-- SELECT DISTINCT "type" FROM passifs;
-- SELECT DISTINCT "type" FROM contrats;
-- SELECT DISTINCT "type" FROM documents;
-- SELECT DISTINCT "type" FROM objectifs;
-- SELECT DISTINCT "type" FROM projets;
-- SELECT DISTINCT "type" FROM taches;
-- SELECT DISTINCT "type" FROM rendez_vous;
