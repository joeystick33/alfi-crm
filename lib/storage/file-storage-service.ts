/**
 * Service de stockage de fichiers pour les documents générés
 * Utilise Supabase Storage pour le stockage réel des fichiers PDF et DOCX
 * 
 * Requirements: 3.8, 4.5
 */

import { createAdminClient } from '@/app/_common/lib/supabase/server'

// Nom du bucket pour les documents
export const DOCUMENTS_BUCKET = 'documents'

// Types de contenu supportés
export const CONTENT_TYPES = {
  PDF: 'application/pdf',
  DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  CSV: 'text/csv',
  XLSX: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
} as const

export type ContentType = typeof CONTENT_TYPES[keyof typeof CONTENT_TYPES]

/**
 * Résultat d'une opération de stockage
 */
export interface StorageResult {
  success: boolean
  publicUrl?: string
  signedUrl?: string
  path?: string
  fileSize?: number
  error?: string
}

/**
 * Options pour l'upload de fichier
 */
export interface UploadOptions {
  /** Durée de validité de l'URL signée en secondes (défaut: 1 heure) */
  signedUrlExpiresIn?: number
  /** Métadonnées personnalisées */
  metadata?: Record<string, string>
  /** Remplacer si le fichier existe déjà */
  upsert?: boolean
}

/**
 * Options pour la récupération d'URL signée
 */
export interface SignedUrlOptions {
  /** Durée de validité en secondes (défaut: 1 heure) */
  expiresIn?: number
  /** Téléchargement forcé avec nom de fichier */
  download?: string | boolean
}

/**
 * Upload un document dans Supabase Storage
 * 
 * @param cabinetId - ID du cabinet (pour l'organisation des fichiers)
 * @param clientId - ID du client
 * @param fileName - Nom du fichier
 * @param fileBuffer - Contenu du fichier en Buffer
 * @param contentType - Type MIME du fichier
 * @param options - Options supplémentaires
 * @returns Résultat de l'upload avec URL
 */
export async function uploadDocument(
  cabinetId: string,
  clientId: string,
  fileName: string,
  fileBuffer: Buffer | Uint8Array,
  contentType: ContentType,
  options: UploadOptions = {}
): Promise<StorageResult> {
  try {
    const supabase = createAdminClient()
    
    // Construire le chemin du fichier: cabinetId/clientId/fileName
    const path = `${cabinetId}/${clientId}/${fileName}`
    
    // Upload du fichier
    const { data, error } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .upload(path, fileBuffer, {
        contentType,
        upsert: options.upsert ?? false,
        metadata: options.metadata,
      })
    
    if (error) {
      console.error('[FileStorage] Upload error:', error)
      return { 
        success: false, 
        error: `Erreur d'upload: ${error.message}` 
      }
    }
    
    // Générer une URL signée pour le téléchargement
    const expiresIn = options.signedUrlExpiresIn ?? 3600 // 1 heure par défaut
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .createSignedUrl(path, expiresIn, {
        download: fileName,
      })
    
    if (signedUrlError) {
      console.error('[FileStorage] Signed URL error:', signedUrlError)
      // L'upload a réussi mais on n'a pas pu générer l'URL signée
      return {
        success: true,
        path: data.path,
        fileSize: fileBuffer.length,
        error: `Upload réussi mais erreur URL signée: ${signedUrlError.message}`,
      }
    }
    
    // Obtenir l'URL publique (si le bucket est public)
    const { data: publicUrlData } = supabase.storage
      .from(DOCUMENTS_BUCKET)
      .getPublicUrl(path)
    
    return {
      success: true,
      publicUrl: publicUrlData.publicUrl,
      signedUrl: signedUrlData.signedUrl,
      path: data.path,
      fileSize: fileBuffer.length,
    }
  } catch (error) {
    console.error('[FileStorage] Unexpected error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inattendue',
    }
  }
}

/**
 * Génère une URL signée pour télécharger un document
 * 
 * @param path - Chemin du fichier dans le bucket
 * @param options - Options pour l'URL signée
 * @returns URL signée ou erreur
 */
export async function getSignedUrl(
  path: string,
  options: SignedUrlOptions = {}
): Promise<StorageResult> {
  try {
    const supabase = createAdminClient()
    
    const { data, error } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .createSignedUrl(path, options.expiresIn ?? 3600, {
        download: options.download,
      })
    
    if (error) {
      return {
        success: false,
        error: `Erreur URL signée: ${error.message}`,
      }
    }
    
    return {
      success: true,
      signedUrl: data.signedUrl,
      path,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inattendue',
    }
  }
}

/**
 * Supprime un document du storage
 * 
 * @param path - Chemin du fichier à supprimer
 * @returns Résultat de la suppression
 */
export async function deleteDocument(path: string): Promise<StorageResult> {
  try {
    const supabase = createAdminClient()
    
    const { error } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .remove([path])
    
    if (error) {
      return {
        success: false,
        error: `Erreur de suppression: ${error.message}`,
      }
    }
    
    return {
      success: true,
      path,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inattendue',
    }
  }
}

/**
 * Liste les documents d'un client
 * 
 * @param cabinetId - ID du cabinet
 * @param clientId - ID du client
 * @returns Liste des fichiers ou erreur
 */
export async function listClientDocuments(
  cabinetId: string,
  clientId: string
): Promise<{ success: boolean; files?: string[]; error?: string }> {
  try {
    const supabase = createAdminClient()
    
    const { data, error } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .list(`${cabinetId}/${clientId}`)
    
    if (error) {
      return {
        success: false,
        error: `Erreur de listage: ${error.message}`,
      }
    }
    
    return {
      success: true,
      files: data.map(file => file.name),
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inattendue',
    }
  }
}

/**
 * Vérifie si un fichier existe dans le storage
 * 
 * @param path - Chemin du fichier
 * @returns true si le fichier existe
 */
export async function documentExists(path: string): Promise<boolean> {
  try {
    const supabase = createAdminClient()
    
    // Essayer de récupérer les métadonnées du fichier
    const { data, error } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .list(path.split('/').slice(0, -1).join('/'), {
        search: path.split('/').pop(),
      })
    
    if (error || !data) {
      return false
    }
    
    const fileName = path.split('/').pop()
    return data.some(file => file.name === fileName)
  } catch {
    return false
  }
}

/**
 * Télécharge un document depuis le storage
 * 
 * @param path - Chemin du fichier
 * @returns Buffer du fichier ou erreur
 */
export async function downloadDocument(
  path: string
): Promise<{ success: boolean; data?: Blob; error?: string }> {
  try {
    const supabase = createAdminClient()
    
    const { data, error } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .download(path)
    
    if (error) {
      return {
        success: false,
        error: `Erreur de téléchargement: ${error.message}`,
      }
    }
    
    return {
      success: true,
      data,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inattendue',
    }
  }
}
