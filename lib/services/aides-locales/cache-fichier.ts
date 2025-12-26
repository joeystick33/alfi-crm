/**
 * ══════════════════════════════════════════════════════════════════════════════
 * CACHE FICHIER JSON - AIDES LOCALES
 * Stockage local des données scrapées/API dans des fichiers JSON
 * ══════════════════════════════════════════════════════════════════════════════
 */

import * as fs from 'fs'
import * as path from 'path'
import type { AideLocale } from './anil-scraper'
import type { CommuneInfo } from './dgfip-api'

// ══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ══════════════════════════════════════════════════════════════════════════════

const CACHE_DIR = path.join(process.cwd(), 'data', 'cache', 'aides-locales')
const CACHE_EXPIRY_HOURS = 24 // Durée de validité du cache

// Fichiers de cache
const CACHE_FILES = {
  aidesDepartements: path.join(CACHE_DIR, 'aides-departements.json'),
  communes: path.join(CACHE_DIR, 'communes.json'),
  zonesCommunes: path.join(CACHE_DIR, 'zones-communes.json'),
  lastUpdate: path.join(CACHE_DIR, 'last-update.json'),
}

// ══════════════════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════════════════

interface CacheAidesDepartement {
  departement: string
  region: string
  aides: AideLocale[]
  dateMAJ: string
}

interface CacheCommunes {
  [codeInsee: string]: CommuneInfo & { dateMAJ: string }
}

interface CacheZones {
  [codeInsee: string]: {
    zone: 'A_bis' | 'A' | 'B1' | 'B2' | 'C'
    dateMAJ: string
  }
}

interface CacheLastUpdate {
  aidesDepartements: string
  communes: string
  zonesCommunes: string
}

// ══════════════════════════════════════════════════════════════════════════════
// INITIALISATION
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Crée le dossier de cache s'il n'existe pas
 */
function ensureCacheDir(): void {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true })
    console.log(`[Cache] Dossier créé: ${CACHE_DIR}`)
  }
}

/**
 * Vérifie si le cache est expiré
 */
function isCacheExpired(dateMAJ: string): boolean {
  const lastUpdate = new Date(dateMAJ)
  const now = new Date()
  const diffHours = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60)
  return diffHours > CACHE_EXPIRY_HOURS
}

// ══════════════════════════════════════════════════════════════════════════════
// LECTURE / ÉCRITURE FICHIERS
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Lit un fichier JSON de cache
 */
function readCacheFile<T>(filePath: string): T | null {
  try {
    if (!fs.existsSync(filePath)) {
      return null
    }
    const content = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(content) as T
  } catch (error) {
    console.error(`[Cache] Erreur lecture ${filePath}:`, error)
    return null
  }
}

/**
 * Écrit un fichier JSON de cache
 */
function writeCacheFile<T>(filePath: string, data: T): boolean {
  try {
    ensureCacheDir()
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
    console.log(`[Cache] Fichier mis à jour: ${filePath}`)
    return true
  } catch (error) {
    console.error(`[Cache] Erreur écriture ${filePath}:`, error)
    return false
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// CACHE AIDES PAR DÉPARTEMENT
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Récupère les aides d'un département depuis le cache
 */
export function getCachedAidesDepartement(departement: string): AideLocale[] | null {
  const cache = readCacheFile<Record<string, CacheAidesDepartement>>(CACHE_FILES.aidesDepartements)
  
  if (!cache || !cache[departement]) {
    return null
  }
  
  const entry = cache[departement]
  
  // Vérifier expiration
  if (isCacheExpired(entry.dateMAJ)) {
    console.log(`[Cache] Aides département ${departement} expirées`)
    return null
  }
  
  return entry.aides
}

/**
 * Sauvegarde les aides d'un département dans le cache
 */
export function setCachedAidesDepartement(
  departement: string, 
  region: string,
  aides: AideLocale[]
): boolean {
  const cache = readCacheFile<Record<string, CacheAidesDepartement>>(CACHE_FILES.aidesDepartements) || {}
  
  cache[departement] = {
    departement,
    region,
    aides,
    dateMAJ: new Date().toISOString(),
  }
  
  return writeCacheFile(CACHE_FILES.aidesDepartements, cache)
}

/**
 * Récupère toutes les aides en cache
 */
export function getAllCachedAides(): Record<string, CacheAidesDepartement> {
  return readCacheFile<Record<string, CacheAidesDepartement>>(CACHE_FILES.aidesDepartements) || {}
}

// ══════════════════════════════════════════════════════════════════════════════
// CACHE COMMUNES
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Récupère une commune depuis le cache
 */
export function getCachedCommune(codeInsee: string): CommuneInfo | null {
  const cache = readCacheFile<CacheCommunes>(CACHE_FILES.communes)
  
  if (!cache || !cache[codeInsee]) {
    return null
  }
  
  const entry = cache[codeInsee]
  
  // Les communes n'expirent pas (données stables)
  return {
    codeInsee: entry.codeInsee,
    nom: entry.nom,
    codePostal: entry.codePostal,
    departement: entry.departement,
    region: entry.region,
    zonePTZ: entry.zonePTZ,
    zoneActionLogement: entry.zoneActionLogement,
    population: entry.population,
  }
}

/**
 * Sauvegarde une commune dans le cache
 */
export function setCachedCommune(commune: CommuneInfo): boolean {
  const cache = readCacheFile<CacheCommunes>(CACHE_FILES.communes) || {}
  
  cache[commune.codeInsee] = {
    ...commune,
    dateMAJ: new Date().toISOString(),
  }
  
  return writeCacheFile(CACHE_FILES.communes, cache)
}

/**
 * Sauvegarde plusieurs communes
 */
export function setCachedCommunes(communes: CommuneInfo[]): boolean {
  const cache = readCacheFile<CacheCommunes>(CACHE_FILES.communes) || {}
  const now = new Date().toISOString()
  
  for (const commune of communes) {
    cache[commune.codeInsee] = {
      ...commune,
      dateMAJ: now,
    }
  }
  
  return writeCacheFile(CACHE_FILES.communes, cache)
}

// ══════════════════════════════════════════════════════════════════════════════
// CACHE ZONES PTZ
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Récupère la zone PTZ d'une commune depuis le cache
 */
export function getCachedZone(codeInsee: string): 'A_bis' | 'A' | 'B1' | 'B2' | 'C' | null {
  const cache = readCacheFile<CacheZones>(CACHE_FILES.zonesCommunes)
  
  if (!cache || !cache[codeInsee]) {
    return null
  }
  
  return cache[codeInsee].zone
}

/**
 * Sauvegarde la zone PTZ d'une commune
 */
export function setCachedZone(codeInsee: string, zone: 'A_bis' | 'A' | 'B1' | 'B2' | 'C'): boolean {
  const cache = readCacheFile<CacheZones>(CACHE_FILES.zonesCommunes) || {}
  
  cache[codeInsee] = {
    zone,
    dateMAJ: new Date().toISOString(),
  }
  
  return writeCacheFile(CACHE_FILES.zonesCommunes, cache)
}

// ══════════════════════════════════════════════════════════════════════════════
// STATISTIQUES ET MAINTENANCE
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Récupère les statistiques du cache
 */
export function getCacheStats(): {
  aidesDepartements: number
  communes: number
  zones: number
  lastUpdate: CacheLastUpdate | null
  sizeKB: number
} {
  const aides = readCacheFile<Record<string, CacheAidesDepartement>>(CACHE_FILES.aidesDepartements)
  const communes = readCacheFile<CacheCommunes>(CACHE_FILES.communes)
  const zones = readCacheFile<CacheZones>(CACHE_FILES.zonesCommunes)
  const lastUpdate = readCacheFile<CacheLastUpdate>(CACHE_FILES.lastUpdate)
  
  // Calculer taille totale
  let sizeBytes = 0
  for (const file of Object.values(CACHE_FILES)) {
    if (fs.existsSync(file)) {
      sizeBytes += fs.statSync(file).size
    }
  }
  
  return {
    aidesDepartements: aides ? Object.keys(aides).length : 0,
    communes: communes ? Object.keys(communes).length : 0,
    zones: zones ? Object.keys(zones).length : 0,
    lastUpdate,
    sizeKB: Math.round(sizeBytes / 1024),
  }
}

/**
 * Vide tout le cache
 */
export function clearCache(): boolean {
  try {
    for (const file of Object.values(CACHE_FILES)) {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file)
      }
    }
    console.log('[Cache] Cache vidé')
    return true
  } catch (error) {
    console.error('[Cache] Erreur vidage:', error)
    return false
  }
}

/**
 * Met à jour le timestamp de dernière mise à jour
 */
export function updateLastUpdateTimestamp(type: keyof CacheLastUpdate): boolean {
  const lastUpdate = readCacheFile<CacheLastUpdate>(CACHE_FILES.lastUpdate) || {
    aidesDepartements: '',
    communes: '',
    zonesCommunes: '',
  }
  
  lastUpdate[type] = new Date().toISOString()
  
  return writeCacheFile(CACHE_FILES.lastUpdate, lastUpdate)
}

// ══════════════════════════════════════════════════════════════════════════════
// EXPORT
// ══════════════════════════════════════════════════════════════════════════════

export const CacheFichier = {
  // Aides
  getCachedAidesDepartement,
  setCachedAidesDepartement,
  getAllCachedAides,
  
  // Communes
  getCachedCommune,
  setCachedCommune,
  setCachedCommunes,
  
  // Zones
  getCachedZone,
  setCachedZone,
  
  // Maintenance
  getCacheStats,
  clearCache,
  updateLastUpdateTimestamp,
  
  // Config
  CACHE_DIR,
  CACHE_FILES,
  CACHE_EXPIRY_HOURS,
}

export default CacheFichier
