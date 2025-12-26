-- ============================================
-- SCRIPT À EXÉCUTER SUR SUPABASE SQL EDITOR
-- Migration: Harmonisation des enums Budget FR
-- Date: 2024-12-10
-- ============================================

-- ATTENTION: Ce script doit être exécuté en une seule transaction
-- Copiez-collez ce script dans l'éditeur SQL de Supabase

BEGIN;

-- ============================================
-- PARTIE 1: REVENUES - Créer nouveau type et migrer
-- ============================================

-- 1.1 Créer le nouveau type enum RevenueCategory
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'revenuecategory_new') THEN
    CREATE TYPE "RevenueCategory_new" AS ENUM (
      'SALAIRE', 'PRIME', 'BONUS', 'AVANTAGE_NATURE', 'INDEMNITE_LICENCIEMENT', 'INDEMNITE_RUPTURE_CONVENTIONNELLE',
      'BIC', 'BNC', 'BA', 'HONORAIRES', 'DROITS_AUTEUR',
      'REMUNERATION_GERANT', 'DIVIDENDES', 'JETONS_PRESENCE',
      'REVENUS_FONCIERS', 'LMNP', 'LMP', 'LOCATION_SAISONNIERE', 'SCPI',
      'INTERETS', 'PLUS_VALUES_MOBILIERES', 'ASSURANCE_VIE_RACHAT', 'CRYPTO',
      'PENSION_RETRAITE', 'RETRAITE_COMPLEMENTAIRE', 'PER_RENTE', 'PENSION_REVERSION',
      'PENSION_ALIMENTAIRE_RECUE', 'PENSION_INVALIDITE', 'ALLOCATION_CHOMAGE', 'RSA', 'ALLOCATIONS_FAMILIALES', 'APL',
      'RENTE_VIAGERE', 'REVENU_EXCEPTIONNEL', 'AUTRE'
    );
  END IF;
END $$;

-- 1.2 Ajouter colonne temporaire
ALTER TABLE "revenues" ADD COLUMN IF NOT EXISTS "category_new" "RevenueCategory_new";

-- 1.3 Migrer les données
UPDATE "revenues" SET "category_new" = CASE "category"::text
  WHEN 'SALAIRE_NET' THEN 'SALAIRE'::"RevenueCategory_new"
  WHEN 'SALAIRE_BRUT' THEN 'SALAIRE'::"RevenueCategory_new"
  WHEN 'PRIME_BONUS' THEN 'PRIME'::"RevenueCategory_new"
  WHEN 'TREIZIEME_MOIS' THEN 'PRIME'::"RevenueCategory_new"
  WHEN 'PARTICIPATION_INTERESSEMENT' THEN 'PRIME'::"RevenueCategory_new"
  WHEN 'REVENUS_TNS' THEN 'BIC'::"RevenueCategory_new"
  WHEN 'BIC' THEN 'BIC'::"RevenueCategory_new"
  WHEN 'BNC' THEN 'BNC'::"RevenueCategory_new"
  WHEN 'BA' THEN 'BA'::"RevenueCategory_new"
  WHEN 'GERANT_SARL' THEN 'REMUNERATION_GERANT'::"RevenueCategory_new"
  WHEN 'DIRIGEANT_SAS' THEN 'REMUNERATION_GERANT'::"RevenueCategory_new"
  WHEN 'DIVIDENDES' THEN 'DIVIDENDES'::"RevenueCategory_new"
  WHEN 'LOYERS_BRUTS' THEN 'REVENUS_FONCIERS'::"RevenueCategory_new"
  WHEN 'LOYERS_NETS' THEN 'REVENUS_FONCIERS'::"RevenueCategory_new"
  WHEN 'REVENUS_SCPI' THEN 'SCPI'::"RevenueCategory_new"
  WHEN 'INTERETS' THEN 'INTERETS'::"RevenueCategory_new"
  WHEN 'PLUS_VALUES' THEN 'PLUS_VALUES_MOBILIERES'::"RevenueCategory_new"
  WHEN 'RENTES_VIAGERES' THEN 'RENTE_VIAGERE'::"RevenueCategory_new"
  WHEN 'PENSION_RETRAITE' THEN 'PENSION_RETRAITE'::"RevenueCategory_new"
  WHEN 'RETRAITE_COMPLEMENTAIRE' THEN 'RETRAITE_COMPLEMENTAIRE'::"RevenueCategory_new"
  WHEN 'PENSION_INVALIDITE' THEN 'PENSION_INVALIDITE'::"RevenueCategory_new"
  WHEN 'ALLOCATIONS_CHOMAGE' THEN 'ALLOCATION_CHOMAGE'::"RevenueCategory_new"
  WHEN 'RSA' THEN 'RSA'::"RevenueCategory_new"
  WHEN 'ALLOCATIONS_FAMILIALES' THEN 'ALLOCATIONS_FAMILIALES'::"RevenueCategory_new"
  WHEN 'APL' THEN 'APL'::"RevenueCategory_new"
  WHEN 'PENSION_ALIMENTAIRE_RECUE' THEN 'PENSION_ALIMENTAIRE_RECUE'::"RevenueCategory_new"
  WHEN 'AUTRES_REVENUS' THEN 'AUTRE'::"RevenueCategory_new"
  -- Passthrough pour valeurs déjà conformes
  WHEN 'SALAIRE' THEN 'SALAIRE'::"RevenueCategory_new"
  WHEN 'PRIME' THEN 'PRIME'::"RevenueCategory_new"
  WHEN 'BONUS' THEN 'BONUS'::"RevenueCategory_new"
  WHEN 'HONORAIRES' THEN 'HONORAIRES'::"RevenueCategory_new"
  WHEN 'REMUNERATION_GERANT' THEN 'REMUNERATION_GERANT'::"RevenueCategory_new"
  WHEN 'REVENUS_FONCIERS' THEN 'REVENUS_FONCIERS'::"RevenueCategory_new"
  WHEN 'LMNP' THEN 'LMNP'::"RevenueCategory_new"
  WHEN 'LMP' THEN 'LMP'::"RevenueCategory_new"
  WHEN 'SCPI' THEN 'SCPI'::"RevenueCategory_new"
  WHEN 'CRYPTO' THEN 'CRYPTO'::"RevenueCategory_new"
  WHEN 'PER_RENTE' THEN 'PER_RENTE'::"RevenueCategory_new"
  WHEN 'PENSION_REVERSION' THEN 'PENSION_REVERSION'::"RevenueCategory_new"
  WHEN 'ALLOCATION_CHOMAGE' THEN 'ALLOCATION_CHOMAGE'::"RevenueCategory_new"
  WHEN 'AUTRE' THEN 'AUTRE'::"RevenueCategory_new"
  ELSE 'AUTRE'::"RevenueCategory_new"
END
WHERE "category_new" IS NULL;

-- 1.4 Supprimer ancienne colonne et renommer
ALTER TABLE "revenues" DROP COLUMN "category";
ALTER TABLE "revenues" RENAME COLUMN "category_new" TO "category";
ALTER TABLE "revenues" ALTER COLUMN "category" SET NOT NULL;

-- 1.5 Supprimer ancien type et renommer nouveau
DROP TYPE IF EXISTS "RevenueCategory" CASCADE;
ALTER TYPE "RevenueCategory_new" RENAME TO "RevenueCategory";

-- ============================================
-- PARTIE 2: EXPENSES - Créer nouveau type et migrer
-- ============================================

-- 2.1 Créer le nouveau type enum ExpenseCategory
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'expensecategory_new') THEN
    CREATE TYPE "ExpenseCategory_new" AS ENUM (
      'LOYER', 'CHARGES_COPROPRIETE', 'TAXE_FONCIERE', 'TAXE_HABITATION', 'ASSURANCE_HABITATION',
      'ELECTRICITE_GAZ', 'EAU', 'INTERNET_TELEPHONE', 'TRAVAUX_ENTRETIEN', 'FRAIS_GESTION_LOCATIVE',
      'CREDIT_AUTO', 'ASSURANCE_AUTO', 'CARBURANT', 'ENTRETIEN_VEHICULE', 'PARKING', 'TRANSPORT_COMMUN', 'PEAGES',
      'MUTUELLE', 'FRAIS_MEDICAUX', 'OPTIQUE_DENTAIRE',
      'ASSURANCE_VIE_PRIMES', 'PREVOYANCE', 'ASSURANCE_EMPRUNTEUR', 'PROTECTION_JURIDIQUE', 'GAV',
      'GARDE_ENFANTS', 'SCOLARITE', 'ACTIVITES_ENFANTS', 'PENSION_ALIMENTAIRE_VERSEE', 'ETUDES_SUPERIEURES',
      'VERSEMENT_PER', 'VERSEMENT_PERP', 'VERSEMENT_EPARGNE', 'INVESTISSEMENT_FIP_FCPI', 'INVESTISSEMENT_SOFICA',
      'CREDIT_IMMOBILIER_RP', 'CREDIT_IMMOBILIER_LOCATIF', 'CREDIT_CONSOMMATION', 'CREDIT_REVOLVING',
      'COTISATIONS_SOCIALES', 'CFE', 'FRAIS_COMPTABILITE', 'COTISATION_SYNDICALE', 'FORMATION_PROFESSIONNELLE',
      'IMPOT_REVENU', 'IFI', 'PRELEVEMENTS_SOCIAUX',
      'DONS', 'EMPLOI_DOMICILE', 'ABONNEMENTS_LOISIRS', 'ALIMENTATION', 'AUTRE_CHARGE'
    );
  END IF;
END $$;

-- 2.2 Ajouter colonne temporaire
ALTER TABLE "expenses" ADD COLUMN IF NOT EXISTS "category_new" "ExpenseCategory_new";

-- 2.3 Migrer les données
UPDATE "expenses" SET "category_new" = CASE "category"::text
  WHEN 'LOYER_HABITATION' THEN 'LOYER'::"ExpenseCategory_new"
  WHEN 'CHARGES_COPROPRIETE' THEN 'CHARGES_COPROPRIETE'::"ExpenseCategory_new"
  WHEN 'TAXE_HABITATION' THEN 'TAXE_HABITATION'::"ExpenseCategory_new"
  WHEN 'TAXE_FONCIERE' THEN 'TAXE_FONCIERE'::"ExpenseCategory_new"
  WHEN 'ASSURANCE_HABITATION' THEN 'ASSURANCE_HABITATION'::"ExpenseCategory_new"
  WHEN 'ELECTRICITE' THEN 'ELECTRICITE_GAZ'::"ExpenseCategory_new"
  WHEN 'GAZ' THEN 'ELECTRICITE_GAZ'::"ExpenseCategory_new"
  WHEN 'CHAUFFAGE' THEN 'ELECTRICITE_GAZ'::"ExpenseCategory_new"
  WHEN 'EAU' THEN 'EAU'::"ExpenseCategory_new"
  WHEN 'INTERNET_FIXE' THEN 'INTERNET_TELEPHONE'::"ExpenseCategory_new"
  WHEN 'ENTRETIEN_LOGEMENT' THEN 'TRAVAUX_ENTRETIEN'::"ExpenseCategory_new"
  WHEN 'CREDIT_AUTO' THEN 'CREDIT_AUTO'::"ExpenseCategory_new"
  WHEN 'CARBURANT' THEN 'CARBURANT'::"ExpenseCategory_new"
  WHEN 'ASSURANCE_AUTO' THEN 'ASSURANCE_AUTO'::"ExpenseCategory_new"
  WHEN 'ENTRETIEN_VEHICULE' THEN 'ENTRETIEN_VEHICULE'::"ExpenseCategory_new"
  WHEN 'TRANSPORT_COMMUN' THEN 'TRANSPORT_COMMUN'::"ExpenseCategory_new"
  WHEN 'PARKING_PEAGE' THEN 'PARKING'::"ExpenseCategory_new"
  WHEN 'COURSES_ALIMENTAIRES' THEN 'ALIMENTATION'::"ExpenseCategory_new"
  WHEN 'RESTAURANTS' THEN 'ALIMENTATION'::"ExpenseCategory_new"
  WHEN 'CANTINES' THEN 'ALIMENTATION'::"ExpenseCategory_new"
  WHEN 'MUTUELLE' THEN 'MUTUELLE'::"ExpenseCategory_new"
  WHEN 'FRAIS_MEDICAUX_NON_REMBOURSES' THEN 'FRAIS_MEDICAUX'::"ExpenseCategory_new"
  WHEN 'PHARMACIE' THEN 'FRAIS_MEDICAUX'::"ExpenseCategory_new"
  WHEN 'GARDE_ENFANTS' THEN 'GARDE_ENFANTS'::"ExpenseCategory_new"
  WHEN 'SCOLARITE' THEN 'SCOLARITE'::"ExpenseCategory_new"
  WHEN 'ACTIVITES_ENFANTS' THEN 'ACTIVITES_ENFANTS'::"ExpenseCategory_new"
  WHEN 'PENSION_ALIMENTAIRE_VERSEE' THEN 'PENSION_ALIMENTAIRE_VERSEE'::"ExpenseCategory_new"
  WHEN 'VACANCES' THEN 'ABONNEMENTS_LOISIRS'::"ExpenseCategory_new"
  WHEN 'SORTIES_CULTURE' THEN 'ABONNEMENTS_LOISIRS'::"ExpenseCategory_new"
  WHEN 'SPORT_LOISIRS' THEN 'ABONNEMENTS_LOISIRS'::"ExpenseCategory_new"
  WHEN 'ABONNEMENTS_STREAMING' THEN 'ABONNEMENTS_LOISIRS'::"ExpenseCategory_new"
  WHEN 'TELEPHONE_MOBILE' THEN 'INTERNET_TELEPHONE'::"ExpenseCategory_new"
  WHEN 'VETEMENTS' THEN 'AUTRE_CHARGE'::"ExpenseCategory_new"
  WHEN 'CADEAUX' THEN 'AUTRE_CHARGE'::"ExpenseCategory_new"
  WHEN 'DONS' THEN 'DONS'::"ExpenseCategory_new"
  WHEN 'IMPOTS_REVENUS' THEN 'IMPOT_REVENU'::"ExpenseCategory_new"
  WHEN 'CSG_CRDS' THEN 'PRELEVEMENTS_SOCIAUX'::"ExpenseCategory_new"
  WHEN 'IFI' THEN 'IFI'::"ExpenseCategory_new"
  WHEN 'FRAIS_PROFESSIONNELS' THEN 'AUTRE_CHARGE'::"ExpenseCategory_new"
  WHEN 'COTISATIONS_SOCIALES' THEN 'COTISATIONS_SOCIALES'::"ExpenseCategory_new"
  WHEN 'COMPTABLE' THEN 'FRAIS_COMPTABILITE'::"ExpenseCategory_new"
  WHEN 'AUTRES_CHARGES' THEN 'AUTRE_CHARGE'::"ExpenseCategory_new"
  -- Passthrough pour valeurs déjà conformes
  WHEN 'LOYER' THEN 'LOYER'::"ExpenseCategory_new"
  WHEN 'ELECTRICITE_GAZ' THEN 'ELECTRICITE_GAZ'::"ExpenseCategory_new"
  WHEN 'INTERNET_TELEPHONE' THEN 'INTERNET_TELEPHONE'::"ExpenseCategory_new"
  WHEN 'TRAVAUX_ENTRETIEN' THEN 'TRAVAUX_ENTRETIEN'::"ExpenseCategory_new"
  WHEN 'FRAIS_GESTION_LOCATIVE' THEN 'FRAIS_GESTION_LOCATIVE'::"ExpenseCategory_new"
  WHEN 'PARKING' THEN 'PARKING'::"ExpenseCategory_new"
  WHEN 'PEAGES' THEN 'PEAGES'::"ExpenseCategory_new"
  WHEN 'FRAIS_MEDICAUX' THEN 'FRAIS_MEDICAUX'::"ExpenseCategory_new"
  WHEN 'OPTIQUE_DENTAIRE' THEN 'OPTIQUE_DENTAIRE'::"ExpenseCategory_new"
  WHEN 'ASSURANCE_VIE_PRIMES' THEN 'ASSURANCE_VIE_PRIMES'::"ExpenseCategory_new"
  WHEN 'PREVOYANCE' THEN 'PREVOYANCE'::"ExpenseCategory_new"
  WHEN 'ASSURANCE_EMPRUNTEUR' THEN 'ASSURANCE_EMPRUNTEUR'::"ExpenseCategory_new"
  WHEN 'PROTECTION_JURIDIQUE' THEN 'PROTECTION_JURIDIQUE'::"ExpenseCategory_new"
  WHEN 'GAV' THEN 'GAV'::"ExpenseCategory_new"
  WHEN 'ETUDES_SUPERIEURES' THEN 'ETUDES_SUPERIEURES'::"ExpenseCategory_new"
  WHEN 'VERSEMENT_PER' THEN 'VERSEMENT_PER'::"ExpenseCategory_new"
  WHEN 'VERSEMENT_PERP' THEN 'VERSEMENT_PERP'::"ExpenseCategory_new"
  WHEN 'VERSEMENT_EPARGNE' THEN 'VERSEMENT_EPARGNE'::"ExpenseCategory_new"
  WHEN 'INVESTISSEMENT_FIP_FCPI' THEN 'INVESTISSEMENT_FIP_FCPI'::"ExpenseCategory_new"
  WHEN 'INVESTISSEMENT_SOFICA' THEN 'INVESTISSEMENT_SOFICA'::"ExpenseCategory_new"
  WHEN 'CREDIT_IMMOBILIER_RP' THEN 'CREDIT_IMMOBILIER_RP'::"ExpenseCategory_new"
  WHEN 'CREDIT_IMMOBILIER_LOCATIF' THEN 'CREDIT_IMMOBILIER_LOCATIF'::"ExpenseCategory_new"
  WHEN 'CREDIT_CONSOMMATION' THEN 'CREDIT_CONSOMMATION'::"ExpenseCategory_new"
  WHEN 'CREDIT_REVOLVING' THEN 'CREDIT_REVOLVING'::"ExpenseCategory_new"
  WHEN 'CFE' THEN 'CFE'::"ExpenseCategory_new"
  WHEN 'FRAIS_COMPTABILITE' THEN 'FRAIS_COMPTABILITE'::"ExpenseCategory_new"
  WHEN 'COTISATION_SYNDICALE' THEN 'COTISATION_SYNDICALE'::"ExpenseCategory_new"
  WHEN 'FORMATION_PROFESSIONNELLE' THEN 'FORMATION_PROFESSIONNELLE'::"ExpenseCategory_new"
  WHEN 'IMPOT_REVENU' THEN 'IMPOT_REVENU'::"ExpenseCategory_new"
  WHEN 'PRELEVEMENTS_SOCIAUX' THEN 'PRELEVEMENTS_SOCIAUX'::"ExpenseCategory_new"
  WHEN 'EMPLOI_DOMICILE' THEN 'EMPLOI_DOMICILE'::"ExpenseCategory_new"
  WHEN 'ABONNEMENTS_LOISIRS' THEN 'ABONNEMENTS_LOISIRS'::"ExpenseCategory_new"
  WHEN 'ALIMENTATION' THEN 'ALIMENTATION'::"ExpenseCategory_new"
  WHEN 'AUTRE_CHARGE' THEN 'AUTRE_CHARGE'::"ExpenseCategory_new"
  ELSE 'AUTRE_CHARGE'::"ExpenseCategory_new"
END
WHERE "category_new" IS NULL;

-- 2.4 Supprimer ancienne colonne et renommer
ALTER TABLE "expenses" DROP COLUMN "category";
ALTER TABLE "expenses" RENAME COLUMN "category_new" TO "category";
ALTER TABLE "expenses" ALTER COLUMN "category" SET NOT NULL;

-- 2.5 Supprimer ancien type et renommer nouveau
DROP TYPE IF EXISTS "ExpenseCategory" CASCADE;
ALTER TYPE "ExpenseCategory_new" RENAME TO "ExpenseCategory";

-- ============================================
-- PARTIE 3: Recréer les index
-- ============================================
CREATE INDEX IF NOT EXISTS "revenues_category_idx" ON "revenues"("category");
CREATE INDEX IF NOT EXISTS "expenses_category_idx" ON "expenses"("category");

COMMIT;

-- ============================================
-- VÉRIFICATION (exécuter après le COMMIT)
-- ============================================
-- SELECT DISTINCT category FROM revenues;
-- SELECT DISTINCT category FROM expenses;
