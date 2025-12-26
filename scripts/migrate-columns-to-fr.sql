-- ============================================================================
-- MIGRATION DES COLONNES EN → FR
-- Version 1.0 - Décembre 2025
-- ============================================================================
-- Ce script renomme les colonnes anglaises vers françaises
-- À exécuter manuellement dans Supabase SQL Editor
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. TABLE REVENUES
-- ============================================================================

-- Renommer category → categorie
ALTER TABLE "revenues" RENAME COLUMN "category" TO "categorie";

-- Renommer frequency → frequence
ALTER TABLE "revenues" RENAME COLUMN "frequency" TO "frequence";

-- Renommer isRecurrent → estRecurrent
ALTER TABLE "revenues" RENAME COLUMN "isRecurrent" TO "estRecurrent";

-- Recréer l'index sur categorie
DROP INDEX IF EXISTS "revenues_category_idx";
CREATE INDEX "revenues_categorie_idx" ON "revenues"("categorie");

-- ============================================================================
-- 2. TABLE EXPENSES
-- ============================================================================

-- Renommer category → categorie
ALTER TABLE "expenses" RENAME COLUMN "category" TO "categorie";

-- Renommer frequency → frequence
ALTER TABLE "expenses" RENAME COLUMN "frequency" TO "frequence";

-- Renommer isFixe → estFixe
ALTER TABLE "expenses" RENAME COLUMN "isFixe" TO "estFixe";

-- Renommer isEssentiel → estEssentiel
ALTER TABLE "expenses" RENAME COLUMN "isEssentiel" TO "estEssentiel";

-- Renommer isDeductible → estDeductible
ALTER TABLE "expenses" RENAME COLUMN "isDeductible" TO "estDeductible";

-- Recréer l'index sur categorie
DROP INDEX IF EXISTS "expenses_category_idx";
CREATE INDEX "expenses_categorie_idx" ON "expenses"("categorie");

-- ============================================================================
-- COMMIT
-- ============================================================================

COMMIT;

-- ============================================================================
-- VÉRIFICATION (à exécuter après le commit)
-- ============================================================================
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'revenues';
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'expenses';
