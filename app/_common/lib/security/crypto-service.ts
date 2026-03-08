// ============================================================================
// Crypto Service — Chiffrement/Déchiffrement AES-256-GCM pour secrets en BDD
//
// Utilisé pour :
//   • Tokens OAuth (Google, Microsoft) stockés dans Cabinet
//   • Secrets webhook (WebhookEndpoint.secret)
//   • Clés API intégrations tierces (Integration.config)
//   • Tokens de synchronisation (CalendarSync, EmailIntegration)
//
// Algorithme : AES-256-GCM (authentifié, résistant au tampering)
// Clé : Dérivée de ENCRYPTION_SECRET via PBKDF2
// Format stockage : base64(iv:authTag:ciphertext)
// ============================================================================

import { createCipheriv, createDecipheriv, randomBytes, pbkdf2Sync } from 'crypto'

// ── CONFIGURATION ──────────────────────────────────────────────────────────

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16 // 128 bits
const AUTH_TAG_LENGTH = 16 // 128 bits
const KEY_LENGTH = 32 // 256 bits
const SALT = 'alfi-crm-encryption-salt-v1' // Fixe, changé lors d'une rotation de clé
const ITERATIONS = 100_000

// ── DÉRIVATION DE CLÉ ─────────────────────────────────────────────────────

let cachedKey: Buffer | null = null

function getEncryptionKey(): Buffer {
  if (cachedKey) return cachedKey

  const secret = process.env.ENCRYPTION_SECRET
  if (!secret || secret.length < 32) {
    throw new Error(
      'ENCRYPTION_SECRET manquant ou trop court (min 32 caractères). ' +
      'Ajoutez ENCRYPTION_SECRET à votre .env : openssl rand -hex 32'
    )
  }

  cachedKey = pbkdf2Sync(secret, SALT, ITERATIONS, KEY_LENGTH, 'sha512')
  return cachedKey
}

// ── CHIFFREMENT ────────────────────────────────────────────────────────────

/**
 * Chiffre une valeur en texte clair.
 * Retourne une chaîne base64 contenant iv:authTag:ciphertext
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) return plaintext

  const key = getEncryptionKey()
  const iv = randomBytes(IV_LENGTH)

  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH })
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()

  // Format : iv (16 bytes) + authTag (16 bytes) + ciphertext
  const combined = Buffer.concat([iv, authTag, encrypted])
  return combined.toString('base64')
}

/**
 * Déchiffre une valeur chiffrée par encrypt().
 * Retourne le texte clair original.
 */
export function decrypt(encryptedBase64: string): string {
  if (!encryptedBase64) return encryptedBase64

  // Détecter si la valeur n'est pas chiffrée (migration progressive)
  try {
    const combined = Buffer.from(encryptedBase64, 'base64')

    // Vérifier la taille minimale : iv (16) + authTag (16) + au moins 1 byte
    if (combined.length < IV_LENGTH + AUTH_TAG_LENGTH + 1) {
      // Probablement une valeur en clair non encore migrée
      return encryptedBase64
    }

    const key = getEncryptionKey()
    const iv = combined.subarray(0, IV_LENGTH)
    const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH)
    const ciphertext = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH)

    const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH })
    decipher.setAuthTag(authTag)

    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()])
    return decrypted.toString('utf8')
  } catch {
    // Si le déchiffrement échoue, la valeur est probablement en clair (pré-migration)
    return encryptedBase64
  }
}

// ── HELPERS ────────────────────────────────────────────────────────────────

/**
 * Chiffre un objet JSON (pour Integration.config, etc.)
 */
export function encryptJson(obj: Record<string, unknown>): string {
  return encrypt(JSON.stringify(obj))
}

/**
 * Déchiffre un objet JSON chiffré
 */
export function decryptJson<T = Record<string, unknown>>(encryptedBase64: string): T {
  const plaintext = decrypt(encryptedBase64)
  try {
    return JSON.parse(plaintext) as T
  } catch {
    // Si le parse échoue, la valeur était déjà un objet JSON en clair (pré-migration)
    return JSON.parse(encryptedBase64) as T
  }
}

/**
 * Vérifie si une valeur est chiffrée (base64 valide avec la bonne taille)
 */
export function isEncrypted(value: string): boolean {
  if (!value) return false
  try {
    const buf = Buffer.from(value, 'base64')
    // Taille minimale : iv + authTag + 1 byte de données
    return buf.length >= IV_LENGTH + AUTH_TAG_LENGTH + 1
      && buf.toString('base64') === value // Vérifie que c'est bien du base64 pur
  } catch {
    return false
  }
}

/**
 * Chiffre une valeur seulement si elle n'est pas déjà chiffrée
 * (utile pour la migration progressive)
 */
export function encryptIfNeeded(value: string): string {
  if (!value) return value
  if (isEncrypted(value)) return value
  return encrypt(value)
}
