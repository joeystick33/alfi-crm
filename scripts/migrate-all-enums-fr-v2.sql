-- ============================================================================
-- MIGRATION COMPLÈTE DES ENUMS VERS FRANÇAIS UNIFORME
-- Version 2.0 - Décembre 2025
-- ============================================================================
-- Ce script migre toutes les valeurs d'enums anglaises vers françaises
-- À exécuter manuellement dans Supabase SQL Editor
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. FAMILY RELATIONSHIP
-- ============================================================================
DO $$
BEGIN
  -- Créer le nouveau type
  CREATE TYPE "FamilyRelationship_new" AS ENUM (
    'CONJOINT', 'ENFANT', 'PARENT', 'FRATRIE', 'PETIT_ENFANT', 'AUTRE', 'ASCENDANT'
  );
  
  -- Migrer les données
  ALTER TABLE "membres_famille" 
    ALTER COLUMN "relationship" TYPE "FamilyRelationship_new" 
    USING (
      CASE "relationship"::text
        WHEN 'SPOUSE' THEN 'CONJOINT'
        WHEN 'CHILD' THEN 'ENFANT'
        WHEN 'PARENT' THEN 'PARENT'
        WHEN 'SIBLING' THEN 'FRATRIE'
        WHEN 'GRANDCHILD' THEN 'PETIT_ENFANT'
        WHEN 'OTHER' THEN 'AUTRE'
        WHEN 'ASCENDANT' THEN 'ASCENDANT'
        ELSE "relationship"::text
      END
    )::"FamilyRelationship_new";
  
  -- Supprimer l'ancien type et renommer
  DROP TYPE IF EXISTS "FamilyRelationship";
  ALTER TYPE "FamilyRelationship_new" RENAME TO "FamilyRelationship";
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'FamilyRelationship migration skipped or already done: %', SQLERRM;
END $$;

-- ============================================================================
-- 2. KYC DOCUMENT TYPE
-- ============================================================================
DO $$
BEGIN
  CREATE TYPE "KYCDocumentType_new" AS ENUM (
    'IDENTITE', 'JUSTIFICATIF_DOMICILE', 'AVIS_IMPOSITION', 'RIB_BANCAIRE', 
    'JUSTIFICATIF_PATRIMOINE', 'ORIGINE_FONDS', 'AUTRE'
  );
  
  ALTER TABLE "kyc_documents" 
    ALTER COLUMN "type" TYPE "KYCDocumentType_new" 
    USING (
      CASE "type"::text
        WHEN 'IDENTITY' THEN 'IDENTITE'
        WHEN 'PROOF_OF_ADDRESS' THEN 'JUSTIFICATIF_DOMICILE'
        WHEN 'TAX_NOTICE' THEN 'AVIS_IMPOSITION'
        WHEN 'BANK_RIB' THEN 'RIB_BANCAIRE'
        WHEN 'WEALTH_JUSTIFICATION' THEN 'JUSTIFICATIF_PATRIMOINE'
        WHEN 'ORIGIN_OF_FUNDS' THEN 'ORIGINE_FONDS'
        WHEN 'OTHER' THEN 'AUTRE'
        ELSE "type"::text
      END
    )::"KYCDocumentType_new";
  
  DROP TYPE IF EXISTS "KYCDocumentType";
  ALTER TYPE "KYCDocumentType_new" RENAME TO "KYCDocumentType";
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'KYCDocumentType migration skipped: %', SQLERRM;
END $$;

-- ============================================================================
-- 3. KYC DOC STATUS
-- ============================================================================
DO $$
BEGIN
  CREATE TYPE "KYCDocStatus_new" AS ENUM (
    'EN_ATTENTE', 'VALIDE', 'REJETE', 'EXPIRE'
  );
  
  ALTER TABLE "kyc_documents" 
    ALTER COLUMN "status" TYPE "KYCDocStatus_new" 
    USING (
      CASE "status"::text
        WHEN 'PENDING' THEN 'EN_ATTENTE'
        WHEN 'VALIDATED' THEN 'VALIDE'
        WHEN 'REJECTED' THEN 'REJETE'
        WHEN 'EXPIRED' THEN 'EXPIRE'
        ELSE "status"::text
      END
    )::"KYCDocStatus_new";
  
  DROP TYPE IF EXISTS "KYCDocStatus";
  ALTER TYPE "KYCDocStatus_new" RENAME TO "KYCDocStatus";
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'KYCDocStatus migration skipped: %', SQLERRM;
END $$;

-- ============================================================================
-- 4. KYC CHECK TYPE
-- ============================================================================
DO $$
BEGIN
  CREATE TYPE "KYCCheckType_new" AS ENUM (
    'VERIFICATION_IDENTITE', 'VERIFICATION_ADRESSE', 'SITUATION_FINANCIERE',
    'CONNAISSANCE_INVESTISSEMENT', 'PROFIL_RISQUE', 'ORIGINE_PATRIMOINE',
    'PERSONNE_EXPOSEE', 'CRIBLAGE_SANCTIONS', 'REVUE_PERIODIQUE', 'AUTRE'
  );
  
  ALTER TABLE "kyc_checks" 
    ALTER COLUMN "type" TYPE "KYCCheckType_new" 
    USING (
      CASE "type"::text
        WHEN 'IDENTITY_VERIFICATION' THEN 'VERIFICATION_IDENTITE'
        WHEN 'ADDRESS_VERIFICATION' THEN 'VERIFICATION_ADRESSE'
        WHEN 'FINANCIAL_SITUATION' THEN 'SITUATION_FINANCIERE'
        WHEN 'INVESTMENT_KNOWLEDGE' THEN 'CONNAISSANCE_INVESTISSEMENT'
        WHEN 'RISK_PROFILE' THEN 'PROFIL_RISQUE'
        WHEN 'WEALTH_ORIGIN' THEN 'ORIGINE_PATRIMOINE'
        WHEN 'POLITICALLY_EXPOSED' THEN 'PERSONNE_EXPOSEE'
        WHEN 'SANCTIONS_SCREENING' THEN 'CRIBLAGE_SANCTIONS'
        WHEN 'PERIODIC_REVIEW' THEN 'REVUE_PERIODIQUE'
        WHEN 'OTHER' THEN 'AUTRE'
        ELSE "type"::text
      END
    )::"KYCCheckType_new";
  
  DROP TYPE IF EXISTS "KYCCheckType";
  ALTER TYPE "KYCCheckType_new" RENAME TO "KYCCheckType";
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'KYCCheckType migration skipped: %', SQLERRM;
END $$;

-- ============================================================================
-- 5. SIGNATURE STATUS
-- ============================================================================
DO $$
BEGIN
  CREATE TYPE "SignatureStatus_new" AS ENUM (
    'EN_ATTENTE', 'EN_COURS', 'SIGNE', 'PARTIELLEMENT_SIGNE', 'REJETE', 'EXPIRE', 'ANNULE'
  );
  
  -- Documents table
  ALTER TABLE "documents" 
    ALTER COLUMN "signatureStatus" TYPE "SignatureStatus_new" 
    USING (
      CASE "signatureStatus"::text
        WHEN 'PENDING' THEN 'EN_ATTENTE'
        WHEN 'IN_PROGRESS' THEN 'EN_COURS'
        WHEN 'SIGNED' THEN 'SIGNE'
        WHEN 'PARTIALLY_SIGNED' THEN 'PARTIELLEMENT_SIGNE'
        WHEN 'REJECTED' THEN 'REJETE'
        WHEN 'EXPIRED' THEN 'EXPIRE'
        WHEN 'CANCELLED' THEN 'ANNULE'
        ELSE "signatureStatus"::text
      END
    )::"SignatureStatus_new";
  
  -- Signature workflow steps
  ALTER TABLE "signature_workflow_steps" 
    ALTER COLUMN "status" TYPE "SignatureStatus_new" 
    USING (
      CASE "status"::text
        WHEN 'PENDING' THEN 'EN_ATTENTE'
        WHEN 'IN_PROGRESS' THEN 'EN_COURS'
        WHEN 'SIGNED' THEN 'SIGNE'
        WHEN 'PARTIALLY_SIGNED' THEN 'PARTIELLEMENT_SIGNE'
        WHEN 'REJECTED' THEN 'REJETE'
        WHEN 'EXPIRED' THEN 'EXPIRE'
        WHEN 'CANCELLED' THEN 'ANNULE'
        ELSE "status"::text
      END
    )::"SignatureStatus_new";
  
  DROP TYPE IF EXISTS "SignatureStatus";
  ALTER TYPE "SignatureStatus_new" RENAME TO "SignatureStatus";
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'SignatureStatus migration skipped: %', SQLERRM;
END $$;

-- ============================================================================
-- 6. SIGNATURE PROVIDER
-- ============================================================================
DO $$
BEGIN
  CREATE TYPE "SignatureProvider_new" AS ENUM (
    'YOUSIGN', 'DOCUSIGN', 'UNIVERSIGN', 'INTERNE', 'AUTRE'
  );
  
  ALTER TABLE "documents" 
    ALTER COLUMN "signatureProvider" TYPE "SignatureProvider_new" 
    USING (
      CASE "signatureProvider"::text
        WHEN 'INTERNAL' THEN 'INTERNE'
        WHEN 'OTHER' THEN 'AUTRE'
        ELSE "signatureProvider"::text
      END
    )::"SignatureProvider_new";
  
  DROP TYPE IF EXISTS "SignatureProvider";
  ALTER TYPE "SignatureProvider_new" RENAME TO "SignatureProvider";
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'SignatureProvider migration skipped: %', SQLERRM;
END $$;

-- ============================================================================
-- 7. OPPORTUNITE TYPE
-- ============================================================================
DO $$
BEGIN
  CREATE TYPE "OpportuniteType_new" AS ENUM (
    'ASSURANCE_VIE', 'EPARGNE_RETRAITE', 'INVESTISSEMENT_IMMOBILIER',
    'INVESTISSEMENT_FINANCIER', 'OPTIMISATION_FISCALE', 'RESTRUCTURATION_CREDIT',
    'TRANSMISSION_PATRIMOINE', 'AUDIT_ASSURANCES', 'AUTRE'
  );
  
  ALTER TABLE "opportunites" 
    ALTER COLUMN "type" TYPE "OpportuniteType_new" 
    USING (
      CASE "type"::text
        WHEN 'LIFE_INSURANCE' THEN 'ASSURANCE_VIE'
        WHEN 'RETIREMENT_SAVINGS' THEN 'EPARGNE_RETRAITE'
        WHEN 'REAL_ESTATE_INVESTMENT' THEN 'INVESTISSEMENT_IMMOBILIER'
        WHEN 'SECURITIES_INVESTMENT' THEN 'INVESTISSEMENT_FINANCIER'
        WHEN 'TAX_OPTIMIZATION' THEN 'OPTIMISATION_FISCALE'
        WHEN 'LOAN_RESTRUCTURING' THEN 'RESTRUCTURATION_CREDIT'
        WHEN 'WEALTH_TRANSMISSION' THEN 'TRANSMISSION_PATRIMOINE'
        WHEN 'INSURANCE_REVIEW' THEN 'AUDIT_ASSURANCES'
        WHEN 'OTHER' THEN 'AUTRE'
        ELSE "type"::text
      END
    )::"OpportuniteType_new";
  
  DROP TYPE IF EXISTS "OpportuniteType";
  ALTER TYPE "OpportuniteType_new" RENAME TO "OpportuniteType";
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'OpportuniteType migration skipped: %', SQLERRM;
END $$;

-- ============================================================================
-- 8. NOTIFICATION TYPE
-- ============================================================================
DO $$
BEGIN
  CREATE TYPE "NotificationType_new" AS ENUM (
    'TACHE_ASSIGNEE', 'TACHE_ECHEANCE', 'RAPPEL_RDV', 'DOCUMENT_TELEVERSE',
    'KYC_EXPIRATION', 'RENOUVELLEMENT_CONTRAT', 'OPPORTUNITE_DETECTEE',
    'MESSAGE_CLIENT', 'SYSTEME', 'AUTRE'
  );
  
  ALTER TABLE "notifications" 
    ALTER COLUMN "type" TYPE "NotificationType_new" 
    USING (
      CASE "type"::text
        WHEN 'TASK_ASSIGNED' THEN 'TACHE_ASSIGNEE'
        WHEN 'TASK_DUE' THEN 'TACHE_ECHEANCE'
        WHEN 'APPOINTMENT_REMINDER' THEN 'RAPPEL_RDV'
        WHEN 'DOCUMENT_UPLOADED' THEN 'DOCUMENT_TELEVERSE'
        WHEN 'KYC_EXPIRING' THEN 'KYC_EXPIRATION'
        WHEN 'CONTRACT_RENEWAL' THEN 'RENOUVELLEMENT_CONTRAT'
        WHEN 'OPPORTUNITY_DETECTED' THEN 'OPPORTUNITE_DETECTEE'
        WHEN 'CLIENT_MESSAGE' THEN 'MESSAGE_CLIENT'
        WHEN 'SYSTEM' THEN 'SYSTEME'
        WHEN 'OTHER' THEN 'AUTRE'
        ELSE "type"::text
      END
    )::"NotificationType_new";
  
  DROP TYPE IF EXISTS "NotificationType";
  ALTER TYPE "NotificationType_new" RENAME TO "NotificationType";
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'NotificationType migration skipped: %', SQLERRM;
END $$;

-- ============================================================================
-- 9. CAMPAGNE TYPE & STATUS
-- ============================================================================
DO $$
BEGIN
  CREATE TYPE "CampagneType_new" AS ENUM ('EMAIL', 'SMS', 'POSTAL', 'MIXTE');
  
  ALTER TABLE "campagnes" 
    ALTER COLUMN "type" TYPE "CampagneType_new" 
    USING (
      CASE "type"::text
        WHEN 'MIXED' THEN 'MIXTE'
        ELSE "type"::text
      END
    )::"CampagneType_new";
  
  DROP TYPE IF EXISTS "CampagneType";
  ALTER TYPE "CampagneType_new" RENAME TO "CampagneType";
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'CampagneType migration skipped: %', SQLERRM;
END $$;

DO $$
BEGIN
  CREATE TYPE "CampagneStatus_new" AS ENUM (
    'BROUILLON', 'PLANIFIEE', 'EN_ENVOI', 'ENVOYEE', 'TERMINEE', 'ANNULEE'
  );
  
  ALTER TABLE "campagnes" 
    ALTER COLUMN "status" TYPE "CampagneStatus_new" 
    USING (
      CASE "status"::text
        WHEN 'DRAFT' THEN 'BROUILLON'
        WHEN 'SCHEDULED' THEN 'PLANIFIEE'
        WHEN 'SENDING' THEN 'EN_ENVOI'
        WHEN 'SENT' THEN 'ENVOYEE'
        WHEN 'COMPLETED' THEN 'TERMINEE'
        WHEN 'CANCELLED' THEN 'ANNULEE'
        ELSE "status"::text
      END
    )::"CampagneStatus_new";
  
  DROP TYPE IF EXISTS "CampagneStatus";
  ALTER TYPE "CampagneStatus_new" RENAME TO "CampagneStatus";
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'CampagneStatus migration skipped: %', SQLERRM;
END $$;

-- ============================================================================
-- 10. EMAIL STATUS & DIRECTION
-- ============================================================================
DO $$
BEGIN
  CREATE TYPE "EmailStatus_new" AS ENUM (
    'BROUILLON', 'PLANIFIE', 'ENVOYE', 'DELIVRE', 'OUVERT', 'CLIQUE', 'REBOND', 'ECHEC'
  );
  
  ALTER TABLE "emails" 
    ALTER COLUMN "status" TYPE "EmailStatus_new" 
    USING (
      CASE "status"::text
        WHEN 'DRAFT' THEN 'BROUILLON'
        WHEN 'SCHEDULED' THEN 'PLANIFIE'
        WHEN 'SENT' THEN 'ENVOYE'
        WHEN 'DELIVERED' THEN 'DELIVRE'
        WHEN 'OPENED' THEN 'OUVERT'
        WHEN 'CLICKED' THEN 'CLIQUE'
        WHEN 'BOUNCED' THEN 'REBOND'
        WHEN 'FAILED' THEN 'ECHEC'
        ELSE "status"::text
      END
    )::"EmailStatus_new";
  
  DROP TYPE IF EXISTS "EmailStatus";
  ALTER TYPE "EmailStatus_new" RENAME TO "EmailStatus";
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'EmailStatus migration skipped: %', SQLERRM;
END $$;

DO $$
BEGIN
  CREATE TYPE "EmailDirection_new" AS ENUM ('ENTRANT', 'SORTANT');
  
  ALTER TABLE "emails_synchronises" 
    ALTER COLUMN "direction" TYPE "EmailDirection_new" 
    USING (
      CASE "direction"::text
        WHEN 'INBOUND' THEN 'ENTRANT'
        WHEN 'OUTBOUND' THEN 'SORTANT'
        ELSE "direction"::text
      END
    )::"EmailDirection_new";
  
  DROP TYPE IF EXISTS "EmailDirection";
  ALTER TYPE "EmailDirection_new" RENAME TO "EmailDirection";
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'EmailDirection migration skipped: %', SQLERRM;
END $$;

-- ============================================================================
-- 11. TEMPLATE TYPE & CATEGORY
-- ============================================================================
DO $$
BEGIN
  CREATE TYPE "TemplateType_new" AS ENUM ('EMAIL', 'COURRIER', 'CONTRAT', 'RAPPORT', 'DOCUMENT');
  
  ALTER TABLE "templates" 
    ALTER COLUMN "type" TYPE "TemplateType_new" 
    USING (
      CASE "type"::text
        WHEN 'LETTER' THEN 'COURRIER'
        WHEN 'CONTRACT' THEN 'CONTRAT'
        WHEN 'REPORT' THEN 'RAPPORT'
        ELSE "type"::text
      END
    )::"TemplateType_new";
  
  DROP TYPE IF EXISTS "TemplateType";
  ALTER TYPE "TemplateType_new" RENAME TO "TemplateType";
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'TemplateType migration skipped: %', SQLERRM;
END $$;

DO $$
BEGIN
  CREATE TYPE "TemplateCategory_new" AS ENUM (
    'CONVENTION_ENTREE', 'LETTRE_MISSION', 'DECLARATION_ADEQUATION', 'PROFIL_INVESTISSEUR',
    'RAPPORT_ANNUEL', 'PROPOSITION', 'DEVIS', 'SUIVI', 'COMPTE_RENDU_RDV', 'NOTE_INTERNE', 'AUTRE'
  );
  
  ALTER TABLE "templates" 
    ALTER COLUMN "category" TYPE "TemplateCategory_new" 
    USING (
      CASE "category"::text
        WHEN 'ENTRY_AGREEMENT' THEN 'CONVENTION_ENTREE'
        WHEN 'MISSION_LETTER' THEN 'LETTRE_MISSION'
        WHEN 'ADEQUACY_DECLARATION' THEN 'DECLARATION_ADEQUATION'
        WHEN 'INVESTOR_PROFILE' THEN 'PROFIL_INVESTISSEUR'
        WHEN 'ANNUAL_REPORT' THEN 'RAPPORT_ANNUEL'
        WHEN 'PROPOSAL' THEN 'PROPOSITION'
        WHEN 'QUOTE' THEN 'DEVIS'
        WHEN 'FOLLOW_UP' THEN 'SUIVI'
        WHEN 'MEETING_MINUTES' THEN 'COMPTE_RENDU_RDV'
        WHEN 'INTERNAL_NOTE' THEN 'NOTE_INTERNE'
        WHEN 'OTHER' THEN 'AUTRE'
        ELSE "category"::text
      END
    )::"TemplateCategory_new";
  
  DROP TYPE IF EXISTS "TemplateCategory";
  ALTER TYPE "TemplateCategory_new" RENAME TO "TemplateCategory";
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'TemplateCategory migration skipped: %', SQLERRM;
END $$;

-- ============================================================================
-- 12. SIMULATION TYPE & STATUS
-- ============================================================================
DO $$
BEGIN
  CREATE TYPE "SimulationType_new" AS ENUM (
    'RETRAITE', 'CREDIT_IMMOBILIER', 'ASSURANCE_VIE', 'TRANSMISSION_PATRIMOINE',
    'OPTIMISATION_FISCALE', 'PROJECTION_INVESTISSEMENT', 'ANALYSE_BUDGET', 'AUTRE'
  );
  
  ALTER TABLE "simulations" 
    ALTER COLUMN "type" TYPE "SimulationType_new" 
    USING (
      CASE "type"::text
        WHEN 'RETIREMENT' THEN 'RETRAITE'
        WHEN 'REAL_ESTATE_LOAN' THEN 'CREDIT_IMMOBILIER'
        WHEN 'LIFE_INSURANCE' THEN 'ASSURANCE_VIE'
        WHEN 'WEALTH_TRANSMISSION' THEN 'TRANSMISSION_PATRIMOINE'
        WHEN 'TAX_OPTIMIZATION' THEN 'OPTIMISATION_FISCALE'
        WHEN 'INVESTMENT_PROJECTION' THEN 'PROJECTION_INVESTISSEMENT'
        WHEN 'BUDGET_ANALYSIS' THEN 'ANALYSE_BUDGET'
        WHEN 'OTHER' THEN 'AUTRE'
        ELSE "type"::text
      END
    )::"SimulationType_new";
  
  DROP TYPE IF EXISTS "SimulationType";
  ALTER TYPE "SimulationType_new" RENAME TO "SimulationType";
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'SimulationType migration skipped: %', SQLERRM;
END $$;

DO $$
BEGIN
  CREATE TYPE "SimulationStatus_new" AS ENUM ('BROUILLON', 'TERMINE', 'PARTAGE', 'ARCHIVE');
  
  ALTER TABLE "simulations" 
    ALTER COLUMN "status" TYPE "SimulationStatus_new" 
    USING (
      CASE "status"::text
        WHEN 'DRAFT' THEN 'BROUILLON'
        WHEN 'COMPLETED' THEN 'TERMINE'
        WHEN 'SHARED' THEN 'PARTAGE'
        WHEN 'ARCHIVED' THEN 'ARCHIVE'
        ELSE "status"::text
      END
    )::"SimulationStatus_new";
  
  DROP TYPE IF EXISTS "SimulationStatus";
  ALTER TYPE "SimulationStatus_new" RENAME TO "SimulationStatus";
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'SimulationStatus migration skipped: %', SQLERRM;
END $$;

-- ============================================================================
-- 13. CONSENTEMENT TYPE
-- ============================================================================
DO $$
BEGIN
  CREATE TYPE "ConsentementType_new" AS ENUM (
    'TRAITEMENT_DONNEES', 'COMMUNICATION_MARKETING', 'PARTAGE_DONNEES', 'PROFILAGE', 'DECISION_AUTOMATISEE'
  );
  
  ALTER TABLE "consentements" 
    ALTER COLUMN "type" TYPE "ConsentementType_new" 
    USING (
      CASE "type"::text
        WHEN 'DATA_PROCESSING' THEN 'TRAITEMENT_DONNEES'
        WHEN 'MARKETING_COMMUNICATION' THEN 'COMMUNICATION_MARKETING'
        WHEN 'DATA_SHARING' THEN 'PARTAGE_DONNEES'
        WHEN 'PROFILING' THEN 'PROFILAGE'
        WHEN 'AUTOMATED_DECISION' THEN 'DECISION_AUTOMATISEE'
        ELSE "type"::text
      END
    )::"ConsentementType_new";
  
  DROP TYPE IF EXISTS "ConsentementType";
  ALTER TYPE "ConsentementType_new" RENAME TO "ConsentementType";
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'ConsentementType migration skipped: %', SQLERRM;
END $$;

-- ============================================================================
-- 14. RECLAMATION TYPE
-- ============================================================================
DO $$
BEGIN
  CREATE TYPE "ReclamationType_new" AS ENUM (
    'QUALITE_SERVICE', 'TARIFICATION', 'QUALITE_CONSEIL', 'COMMUNICATION', 'DOCUMENT', 'AUTRE'
  );
  
  ALTER TABLE "reclamations" 
    ALTER COLUMN "type" TYPE "ReclamationType_new" 
    USING (
      CASE "type"::text
        WHEN 'SERVICE_QUALITY' THEN 'QUALITE_SERVICE'
        WHEN 'FEES' THEN 'TARIFICATION'
        WHEN 'ADVICE_QUALITY' THEN 'QUALITE_CONSEIL'
        WHEN 'OTHER' THEN 'AUTRE'
        ELSE "type"::text
      END
    )::"ReclamationType_new";
  
  DROP TYPE IF EXISTS "ReclamationType";
  ALTER TYPE "ReclamationType_new" RENAME TO "ReclamationType";
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'ReclamationType migration skipped: %', SQLERRM;
END $$;

-- ============================================================================
-- 15. SLA EVENT TYPE
-- ============================================================================
DO $$
BEGIN
  CREATE TYPE "SLAEventType_new" AS ENUM (
    'CREE', 'ASSIGNE', 'STATUT_MODIFIE', 'ESCALADE', 'ECHEANCE_PROCHE',
    'ECHEANCE_DEPASSEE', 'RESOLU', 'REPONSE_ENVOYEE', 'RETOUR_CLIENT', 'NOTE_INTERNE', 'AUTRE'
  );
  
  ALTER TABLE "sla_events" 
    ALTER COLUMN "type" TYPE "SLAEventType_new" 
    USING (
      CASE "type"::text
        WHEN 'CREATED' THEN 'CREE'
        WHEN 'ASSIGNED' THEN 'ASSIGNE'
        WHEN 'STATUS_CHANGED' THEN 'STATUT_MODIFIE'
        WHEN 'ESCALATED' THEN 'ESCALADE'
        WHEN 'DEADLINE_APPROACHING' THEN 'ECHEANCE_PROCHE'
        WHEN 'DEADLINE_BREACHED' THEN 'ECHEANCE_DEPASSEE'
        WHEN 'RESOLVED' THEN 'RESOLU'
        WHEN 'RESPONSE_SENT' THEN 'REPONSE_ENVOYEE'
        WHEN 'CLIENT_FEEDBACK' THEN 'RETOUR_CLIENT'
        WHEN 'INTERNAL_NOTE' THEN 'NOTE_INTERNE'
        WHEN 'OTHER' THEN 'AUTRE'
        ELSE "type"::text
      END
    )::"SLAEventType_new";
  
  DROP TYPE IF EXISTS "SLAEventType";
  ALTER TYPE "SLAEventType_new" RENAME TO "SLAEventType";
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'SLAEventType migration skipped: %', SQLERRM;
END $$;

-- ============================================================================
-- 16. AUDIT ACTION
-- ============================================================================
DO $$
BEGIN
  CREATE TYPE "AuditAction_new" AS ENUM (
    'CREATION', 'MODIFICATION', 'SUPPRESSION', 'CONSULTATION', 'EXPORT', 'PARTAGE', 'SIGNATURE', 'APPROBATION', 'REJET'
  );
  
  ALTER TABLE "journal_audit" 
    ALTER COLUMN "action" TYPE "AuditAction_new" 
    USING (
      CASE "action"::text
        WHEN 'CREATE' THEN 'CREATION'
        WHEN 'UPDATE' THEN 'MODIFICATION'
        WHEN 'DELETE' THEN 'SUPPRESSION'
        WHEN 'VIEW' THEN 'CONSULTATION'
        WHEN 'SHARE' THEN 'PARTAGE'
        WHEN 'SIGN' THEN 'SIGNATURE'
        WHEN 'APPROVE' THEN 'APPROBATION'
        WHEN 'REJECT' THEN 'REJET'
        ELSE "action"::text
      END
    )::"AuditAction_new";
  
  DROP TYPE IF EXISTS "AuditAction";
  ALTER TYPE "AuditAction_new" RENAME TO "AuditAction";
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'AuditAction migration skipped: %', SQLERRM;
END $$;

-- ============================================================================
-- 17. COMMERCIAL ACTION STATUS
-- ============================================================================
DO $$
BEGIN
  CREATE TYPE "CommercialActionStatus_new" AS ENUM (
    'BROUILLON', 'PLANIFIEE', 'EN_COURS', 'TERMINEE', 'ARCHIVEE'
  );
  
  ALTER TABLE "commercial_actions" 
    ALTER COLUMN "status" TYPE "CommercialActionStatus_new" 
    USING (
      CASE "status"::text
        WHEN 'DRAFT' THEN 'BROUILLON'
        WHEN 'SCHEDULED' THEN 'PLANIFIEE'
        WHEN 'IN_PROGRESS' THEN 'EN_COURS'
        WHEN 'COMPLETED' THEN 'TERMINEE'
        WHEN 'ARCHIVED' THEN 'ARCHIVEE'
        ELSE "status"::text
      END
    )::"CommercialActionStatus_new";
  
  DROP TYPE IF EXISTS "CommercialActionStatus";
  ALTER TYPE "CommercialActionStatus_new" RENAME TO "CommercialActionStatus";
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'CommercialActionStatus migration skipped: %', SQLERRM;
END $$;

-- ============================================================================
-- 18. EXPORT TYPE & STATUS
-- ============================================================================
DO $$
BEGIN
  CREATE TYPE "ExportType_new" AS ENUM (
    'CLIENTS', 'ACTIFS', 'PASSIFS', 'CONTRATS', 'DOCUMENTS', 'TACHES', 'RENDEZ_VOUS', 'OPPORTUNITES', 'PATRIMOINE_COMPLET'
  );
  
  ALTER TABLE "export_jobs" 
    ALTER COLUMN "type" TYPE "ExportType_new" 
    USING (
      CASE "type"::text
        WHEN 'FULL_PORTFOLIO' THEN 'PATRIMOINE_COMPLET'
        ELSE "type"::text
      END
    )::"ExportType_new";
  
  DROP TYPE IF EXISTS "ExportType";
  ALTER TYPE "ExportType_new" RENAME TO "ExportType";
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'ExportType migration skipped: %', SQLERRM;
END $$;

DO $$
BEGIN
  CREATE TYPE "ExportStatus_new" AS ENUM ('EN_ATTENTE', 'EN_COURS', 'TERMINE', 'ECHEC');
  
  ALTER TABLE "export_jobs" 
    ALTER COLUMN "status" TYPE "ExportStatus_new" 
    USING (
      CASE "status"::text
        WHEN 'PENDING' THEN 'EN_ATTENTE'
        WHEN 'PROCESSING' THEN 'EN_COURS'
        WHEN 'COMPLETED' THEN 'TERMINE'
        WHEN 'FAILED' THEN 'ECHEC'
        ELSE "status"::text
      END
    )::"ExportStatus_new";
  
  DROP TYPE IF EXISTS "ExportStatus";
  ALTER TYPE "ExportStatus_new" RENAME TO "ExportStatus";
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'ExportStatus migration skipped: %', SQLERRM;
END $$;

-- ============================================================================
-- 19. INVOICE STATUS
-- ============================================================================
DO $$
BEGIN
  CREATE TYPE "InvoiceStatus_new" AS ENUM ('BROUILLON', 'ENVOYEE', 'PAYEE', 'EN_RETARD', 'ANNULEE');
  
  ALTER TABLE "factures" 
    ALTER COLUMN "status" TYPE "InvoiceStatus_new" 
    USING (
      CASE "status"::text
        WHEN 'DRAFT' THEN 'BROUILLON'
        WHEN 'SENT' THEN 'ENVOYEE'
        WHEN 'PAID' THEN 'PAYEE'
        WHEN 'OVERDUE' THEN 'EN_RETARD'
        WHEN 'CANCELLED' THEN 'ANNULEE'
        ELSE "status"::text
      END
    )::"InvoiceStatus_new";
  
  DROP TYPE IF EXISTS "InvoiceStatus";
  ALTER TYPE "InvoiceStatus_new" RENAME TO "InvoiceStatus";
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'InvoiceStatus migration skipped: %', SQLERRM;
END $$;

-- ============================================================================
-- 20. PAYMENT METHOD
-- ============================================================================
DO $$
BEGIN
  CREATE TYPE "PaymentMethod_new" AS ENUM ('VIREMENT', 'CHEQUE', 'ESPECES', 'CARTE_BANCAIRE', 'AUTRE');
  
  ALTER TABLE "payments" 
    ALTER COLUMN "method" TYPE "PaymentMethod_new" 
    USING (
      CASE "method"::text
        WHEN 'BANK_TRANSFER' THEN 'VIREMENT'
        WHEN 'CHECK' THEN 'CHEQUE'
        WHEN 'CASH' THEN 'ESPECES'
        WHEN 'CREDIT_CARD' THEN 'CARTE_BANCAIRE'
        WHEN 'OTHER' THEN 'AUTRE'
        ELSE "method"::text
      END
    )::"PaymentMethod_new";
  
  DROP TYPE IF EXISTS "PaymentMethod";
  ALTER TYPE "PaymentMethod_new" RENAME TO "PaymentMethod";
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'PaymentMethod migration skipped: %', SQLERRM;
END $$;

-- ============================================================================
-- 21. APPORTEUR ENTITY TYPE
-- ============================================================================
DO $$
BEGIN
  CREATE TYPE "ApporteurEntityType_new" AS ENUM ('PERSONNE_PHYSIQUE', 'SOCIETE');
  
  ALTER TABLE "apporteurs" 
    ALTER COLUMN "type" TYPE "ApporteurEntityType_new" 
    USING (
      CASE "type"::text
        WHEN 'INDIVIDUAL' THEN 'PERSONNE_PHYSIQUE'
        WHEN 'COMPANY' THEN 'SOCIETE'
        ELSE "type"::text
      END
    )::"ApporteurEntityType_new";
  
  DROP TYPE IF EXISTS "ApporteurEntityType";
  ALTER TYPE "ApporteurEntityType_new" RENAME TO "ApporteurEntityType";
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'ApporteurEntityType migration skipped: %', SQLERRM;
END $$;

-- ============================================================================
-- 22. COMMISSION TYPE
-- ============================================================================
DO $$
BEGIN
  CREATE TYPE "CommissionType_new" AS ENUM ('POURCENTAGE', 'MONTANT_FIXE');
  
  ALTER TABLE "apporteurs" 
    ALTER COLUMN "commissionType" TYPE "CommissionType_new" 
    USING (
      CASE "commissionType"::text
        WHEN 'PERCENTAGE' THEN 'POURCENTAGE'
        WHEN 'FIXED' THEN 'MONTANT_FIXE'
        ELSE "commissionType"::text
      END
    )::"CommissionType_new";
  
  ALTER TABLE "commissions" 
    ALTER COLUMN "type" TYPE "CommissionType_new" 
    USING (
      CASE "type"::text
        WHEN 'PERCENTAGE' THEN 'POURCENTAGE'
        WHEN 'FIXED' THEN 'MONTANT_FIXE'
        ELSE "type"::text
      END
    )::"CommissionType_new";
  
  DROP TYPE IF EXISTS "CommissionType";
  ALTER TYPE "CommissionType_new" RENAME TO "CommissionType";
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'CommissionType migration skipped: %', SQLERRM;
END $$;

-- ============================================================================
-- 23. REGISTRATION REQUEST STATUS
-- ============================================================================
DO $$
BEGIN
  CREATE TYPE "RegistrationRequestStatus_new" AS ENUM ('EN_ATTENTE', 'APPROUVEE', 'REJETEE');
  
  ALTER TABLE "registration_requests" 
    ALTER COLUMN "status" TYPE "RegistrationRequestStatus_new" 
    USING (
      CASE "status"::text
        WHEN 'PENDING' THEN 'EN_ATTENTE'
        WHEN 'APPROVED' THEN 'APPROUVEE'
        WHEN 'REJECTED' THEN 'REJETEE'
        ELSE "status"::text
      END
    )::"RegistrationRequestStatus_new";
  
  DROP TYPE IF EXISTS "RegistrationRequestStatus";
  ALTER TYPE "RegistrationRequestStatus_new" RENAME TO "RegistrationRequestStatus";
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'RegistrationRequestStatus migration skipped: %', SQLERRM;
END $$;

-- ============================================================================
-- 24. WEBHOOK STATUS
-- ============================================================================
DO $$
BEGIN
  CREATE TYPE "WebhookStatus_new" AS ENUM ('ACTIF', 'INACTIF', 'ERREUR');
  
  ALTER TABLE "webhook_endpoints" 
    ALTER COLUMN "status" TYPE "WebhookStatus_new" 
    USING (
      CASE "status"::text
        WHEN 'ACTIVE' THEN 'ACTIF'
        WHEN 'INACTIVE' THEN 'INACTIF'
        WHEN 'ERROR' THEN 'ERREUR'
        ELSE "status"::text
      END
    )::"WebhookStatus_new";
  
  DROP TYPE IF EXISTS "WebhookStatus";
  ALTER TYPE "WebhookStatus_new" RENAME TO "WebhookStatus";
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'WebhookStatus migration skipped: %', SQLERRM;
END $$;

-- ============================================================================
-- 25. SAAS INVOICE STATUS
-- ============================================================================
DO $$
BEGIN
  CREATE TYPE "SaaSInvoiceStatus_new" AS ENUM (
    'BROUILLON', 'EN_ATTENTE', 'PAYEE', 'EN_RETARD', 'ANNULEE', 'REMBOURSEE'
  );
  
  ALTER TABLE "saas_invoices" 
    ALTER COLUMN "status" TYPE "SaaSInvoiceStatus_new" 
    USING (
      CASE "status"::text
        WHEN 'DRAFT' THEN 'BROUILLON'
        WHEN 'PENDING' THEN 'EN_ATTENTE'
        WHEN 'PAID' THEN 'PAYEE'
        WHEN 'OVERDUE' THEN 'EN_RETARD'
        WHEN 'CANCELLED' THEN 'ANNULEE'
        WHEN 'REFUNDED' THEN 'REMBOURSEE'
        ELSE "status"::text
      END
    )::"SaaSInvoiceStatus_new";
  
  DROP TYPE IF EXISTS "SaaSInvoiceStatus";
  ALTER TYPE "SaaSInvoiceStatus_new" RENAME TO "SaaSInvoiceStatus";
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'SaaSInvoiceStatus migration skipped: %', SQLERRM;
END $$;

COMMIT;

-- ============================================================================
-- FIN DE LA MIGRATION
-- ============================================================================
-- Après l'exécution de ce script:
-- 1. Vérifiez qu'il n'y a pas d'erreurs
-- 2. Régénérez les types Prisma: npx prisma generate
-- 3. Mettez à jour les fichiers frontend/backend avec les nouvelles valeurs
-- ============================================================================
