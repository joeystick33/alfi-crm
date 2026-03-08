/**
 * Module de stockage de fichiers
 * Exporte les services et types pour la gestion des documents
 */

export {
  uploadDocument,
  getSignedUrl,
  deleteDocument,
  listClientDocuments,
  documentExists,
  downloadDocument,
  DOCUMENTS_BUCKET,
  CONTENT_TYPES,
  type StorageResult,
  type UploadOptions,
  type SignedUrlOptions,
  type ContentType,
} from './file-storage-service'
