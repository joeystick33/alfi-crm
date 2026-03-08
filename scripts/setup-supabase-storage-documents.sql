-- ============================================================================
-- Script de configuration Supabase Storage pour les documents générés
-- 
-- Ce script crée le bucket "documents" et configure les policies RLS
-- pour un accès sécurisé par cabinet.
--
-- Requirements: 3.8, 4.5
-- ============================================================================

-- 1. Créer le bucket "documents" s'il n'existe pas
-- Note: Cette opération doit être faite via l'API Supabase ou le dashboard
-- car les buckets ne peuvent pas être créés via SQL directement.
-- Utilisez le script TypeScript setup-supabase-storage-documents.ts à la place.

-- 2. Policies RLS pour le bucket "documents"
-- Ces policies assurent que:
-- - Les utilisateurs authentifiés peuvent lire les documents de leur cabinet
-- - Les utilisateurs authentifiés peuvent uploader des documents pour leur cabinet
-- - Les utilisateurs authentifiés peuvent supprimer les documents de leur cabinet

-- Policy: Lecture des documents par cabinet
-- Les utilisateurs peuvent lire les fichiers dans le dossier de leur cabinet
CREATE POLICY "Users can read documents from their cabinet"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = (
    SELECT "cabinetId"::text 
    FROM "User" 
    WHERE id = auth.uid()::text
  )
);

-- Policy: Upload de documents par cabinet
-- Les utilisateurs peuvent uploader des fichiers dans le dossier de leur cabinet
CREATE POLICY "Users can upload documents to their cabinet"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = (
    SELECT "cabinetId"::text 
    FROM "User" 
    WHERE id = auth.uid()::text
  )
);

-- Policy: Mise à jour de documents par cabinet
-- Les utilisateurs peuvent mettre à jour les fichiers dans le dossier de leur cabinet
CREATE POLICY "Users can update documents in their cabinet"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'documents'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = (
    SELECT "cabinetId"::text 
    FROM "User" 
    WHERE id = auth.uid()::text
  )
);

-- Policy: Suppression de documents par cabinet
-- Les utilisateurs peuvent supprimer les fichiers dans le dossier de leur cabinet
CREATE POLICY "Users can delete documents from their cabinet"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = (
    SELECT "cabinetId"::text 
    FROM "User" 
    WHERE id = auth.uid()::text
  )
);

-- ============================================================================
-- Notes d'utilisation:
-- 
-- Structure des chemins de fichiers:
--   {cabinetId}/{clientId}/{fileName}
--
-- Exemple:
--   cab_123/cli_456/DER_Dupont_2024-01-15.pdf
--
-- Les policies vérifient que le premier segment du chemin (cabinetId)
-- correspond au cabinet de l'utilisateur authentifié.
-- ============================================================================
