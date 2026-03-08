/**
 * AURA V2 — Chiffrement AES-256-GCM pour tokens OAuth
 * 
 * Tous les tokens d'accès et refresh tokens des connexions IA
 * sont chiffrés côté applicatif avant stockage en base.
 * 
 * Clé de chiffrement : process.env.AI_ENCRYPTION_KEY (32 bytes hex)
 * Fallback : process.env.NEXTAUTH_SECRET (hashé en SHA-256)
 */

import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto'
import type { EncryptedValue } from './types'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const TAG_LENGTH = 16

/**
 * Dérive la clé de chiffrement depuis les variables d'environnement.
 * Priorité : AI_ENCRYPTION_KEY > NEXTAUTH_SECRET (hashé SHA-256)
 */
function getEncryptionKey(): Buffer {
  const envKey = process.env.AI_ENCRYPTION_KEY
  if (envKey) {
    const buf = Buffer.from(envKey, 'hex')
    if (buf.length !== 32) {
      throw new Error('AI_ENCRYPTION_KEY doit être une clé hex de 64 caractères (32 bytes)')
    }
    return buf
  }

  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) {
    throw new Error('AI_ENCRYPTION_KEY ou NEXTAUTH_SECRET requis pour le chiffrement des tokens IA')
  }

  // Dérivation SHA-256 du secret pour obtenir exactement 32 bytes
  return createHash('sha256').update(secret).digest()
}

/**
 * Chiffre une valeur en AES-256-GCM.
 * Retourne un objet sérialisable contenant le ciphertext, IV et tag d'authentification.
 */
export function encrypt(plaintext: string): EncryptedValue {
  const key = getEncryptionKey()
  const iv = randomBytes(IV_LENGTH)

  const cipher = createCipheriv(ALGORITHM, key, iv)
  let encrypted = cipher.update(plaintext, 'utf8', 'base64')
  encrypted += cipher.final('base64')

  const tag = cipher.getAuthTag()

  return {
    ciphertext: encrypted,
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    algorithm: ALGORITHM,
  }
}

/**
 * Déchiffre une valeur chiffrée en AES-256-GCM.
 * Vérifie l'intégrité via le tag d'authentification.
 */
export function decrypt(encrypted: EncryptedValue): string {
  if (encrypted.algorithm !== ALGORITHM) {
    throw new Error(`Algorithme non supporté: ${encrypted.algorithm}`)
  }

  const key = getEncryptionKey()
  const iv = Buffer.from(encrypted.iv, 'base64')
  const tag = Buffer.from(encrypted.tag, 'base64')

  if (tag.length !== TAG_LENGTH) {
    throw new Error('Tag d\'authentification invalide')
  }

  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)

  let decrypted = decipher.update(encrypted.ciphertext, 'base64', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

/**
 * Chiffre un token et retourne la chaîne JSON sérialisée
 * (prête pour stockage en base de données).
 */
export function encryptToken(token: string): string {
  const encrypted = encrypt(token)
  return JSON.stringify(encrypted)
}

/**
 * Déchiffre un token depuis sa représentation JSON sérialisée.
 */
export function decryptToken(encryptedJson: string): string {
  try {
    const encrypted: EncryptedValue = JSON.parse(encryptedJson)
    return decrypt(encrypted)
  } catch (error) {
    // Fallback : si la valeur n'est pas un JSON valide, c'est peut-être un token en clair (migration)
    if (typeof encryptedJson === 'string' && !encryptedJson.startsWith('{')) {
      console.warn('[AURA-V2] Token non chiffré détecté — migration nécessaire')
      return encryptedJson
    }
    throw error
  }
}

/**
 * Masque une valeur sensible pour les logs.
 * Garde les 4 premiers et 4 derniers caractères.
 */
export function maskSensitive(value: string): string {
  if (!value || value.length < 12) return '***'
  return `${value.slice(0, 4)}...${value.slice(-4)}`
}

/**
 * Masque les champs sensibles d'un objet de paramètres.
 */
export function maskParams(
  params: Record<string, unknown>,
  sensitiveFields: string[],
): Record<string, unknown> {
  const masked = { ...params }
  for (const field of sensitiveFields) {
    if (masked[field] && typeof masked[field] === 'string') {
      masked[field] = maskSensitive(masked[field] as string)
    }
  }
  return masked
}
