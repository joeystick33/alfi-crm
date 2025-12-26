// FILE: lib/redis/cache.ts

import redis from './index'

// ===========================================
// TYPES
// ===========================================

export interface CacheOptions {
  ttl?: number // Time to live en secondes
  prefix?: string
}

export interface CacheStats {
  hits: number
  misses: number
  keys: number
}

// ===========================================
// PRÉFIXES DE CACHE
// ===========================================

export const CACHE_PREFIXES = {
  // Données de référence
  REFERENCE_DATA: 'ref:',
  
  // Sessions utilisateur
  SESSION: 'session:',
  
  // Données client (patrimoine, KYC)
  CLIENT: 'client:',
  CLIENT_PATRIMOINE: 'client:patrimoine:',
  CLIENT_KYC: 'client:kyc:',
  
  // Dashboard et métriques
  DASHBOARD: 'dashboard:',
  METRICS: 'metrics:',
  
  // Cabinets
  CABINET: 'cabinet:',
  CABINET_STATS: 'cabinet:stats:',
  
  // Rate limiting
  RATE_LIMIT: 'ratelimit:',
  
  // Locks (pour éviter les doublons)
  LOCK: 'lock:',
  
  // Queues BullMQ
  QUEUE: 'bull:',
} as const

// ===========================================
// TTL PAR DÉFAUT (en secondes)
// ===========================================

export const CACHE_TTL = {
  // Données de référence - cache long (1 heure)
  REFERENCE_DATA: 3600,
  
  // Sessions - 24 heures
  SESSION: 86400,
  
  // Données client - 5 minutes
  CLIENT: 300,
  CLIENT_PATRIMOINE: 300,
  CLIENT_KYC: 600,
  
  // Dashboard - 1 minute
  DASHBOARD: 60,
  METRICS: 60,
  
  // Stats cabinet - 5 minutes
  CABINET_STATS: 300,
  
  // Rate limit - 1 minute
  RATE_LIMIT: 60,
  
  // Locks - 30 secondes
  LOCK: 30,
} as const

// ===========================================
// SERVICE DE CACHE
// ===========================================

/**
 * Récupère une valeur du cache
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const value = await redis.get(key)
    if (!value) return null
    return JSON.parse(value) as T
  } catch (error) {
    console.error(`Cache get error for key ${key}:`, error)
    return null
  }
}

/**
 * Stocke une valeur dans le cache
 */
export async function cacheSet<T>(
  key: string,
  value: T,
  ttl?: number
): Promise<boolean> {
  try {
    const serialized = JSON.stringify(value)
    if (ttl) {
      await redis.setex(key, ttl, serialized)
    } else {
      await redis.set(key, serialized)
    }
    return true
  } catch (error) {
    console.error(`Cache set error for key ${key}:`, error)
    return false
  }
}

/**
 * Supprime une valeur du cache
 */
export async function cacheDel(key: string): Promise<boolean> {
  try {
    await redis.del(key)
    return true
  } catch (error) {
    console.error(`Cache del error for key ${key}:`, error)
    return false
  }
}

/**
 * Supprime toutes les clés avec un préfixe
 */
export async function cacheDelByPrefix(prefix: string): Promise<number> {
  try {
    const keys = await redis.keys(`${prefix}*`)
    if (keys.length === 0) return 0
    return await redis.del(...keys)
  } catch (error) {
    console.error(`Cache del by prefix error for ${prefix}:`, error)
    return 0
  }
}

/**
 * Vérifie si une clé existe
 */
export async function cacheExists(key: string): Promise<boolean> {
  try {
    const exists = await redis.exists(key)
    return exists === 1
  } catch (error) {
    console.error(`Cache exists error for key ${key}:`, error)
    return false
  }
}

/**
 * Définit le TTL d'une clé existante
 */
export async function cacheExpire(key: string, ttl: number): Promise<boolean> {
  try {
    const result = await redis.expire(key, ttl)
    return result === 1
  } catch (error) {
    console.error(`Cache expire error for key ${key}:`, error)
    return false
  }
}

/**
 * Incrémente un compteur
 */
export async function cacheIncr(key: string, ttl?: number): Promise<number> {
  try {
    const value = await redis.incr(key)
    if (ttl && value === 1) {
      await redis.expire(key, ttl)
    }
    return value
  } catch (error) {
    console.error(`Cache incr error for key ${key}:`, error)
    return 0
  }
}

// ===========================================
// CACHE WITH FALLBACK (CACHE-ASIDE PATTERN)
// ===========================================

/**
 * Pattern cache-aside : récupère du cache ou exécute la fonction
 */
export async function cacheGetOrSet<T>(
  key: string,
  fallback: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // Essayer de récupérer du cache
  const cached = await cacheGet<T>(key)
  if (cached !== null) {
    return cached
  }

  // Exécuter le fallback
  const value = await fallback()

  // Stocker dans le cache
  await cacheSet(key, value, ttl)

  return value
}

// ===========================================
// CACHE POUR DONNÉES DE RÉFÉRENCE
// ===========================================

/**
 * Cache les données de référence
 */
export async function cacheReferenceData<T>(
  domain: string,
  data: T
): Promise<boolean> {
  const key = `${CACHE_PREFIXES.REFERENCE_DATA}${domain}`
  return cacheSet(key, data, CACHE_TTL.REFERENCE_DATA)
}

/**
 * Récupère les données de référence du cache
 */
export async function getCachedReferenceData<T>(
  domain: string
): Promise<T | null> {
  const key = `${CACHE_PREFIXES.REFERENCE_DATA}${domain}`
  return cacheGet<T>(key)
}

/**
 * Invalide le cache des données de référence
 */
export async function invalidateReferenceDataCache(
  domain?: string
): Promise<number> {
  if (domain) {
    const key = `${CACHE_PREFIXES.REFERENCE_DATA}${domain}`
    await cacheDel(key)
    return 1
  }
  return cacheDelByPrefix(CACHE_PREFIXES.REFERENCE_DATA)
}

// ===========================================
// CACHE POUR DONNÉES CLIENT
// ===========================================

/**
 * Cache le patrimoine d'un client
 */
export async function cacheClientPatrimoine(
  clientId: string,
  data: unknown
): Promise<boolean> {
  const key = `${CACHE_PREFIXES.CLIENT_PATRIMOINE}${clientId}`
  return cacheSet(key, data, CACHE_TTL.CLIENT_PATRIMOINE)
}

/**
 * Récupère le patrimoine d'un client du cache
 */
export async function getCachedClientPatrimoine<T>(
  clientId: string
): Promise<T | null> {
  const key = `${CACHE_PREFIXES.CLIENT_PATRIMOINE}${clientId}`
  return cacheGet<T>(key)
}

/**
 * Invalide le cache d'un client
 */
export async function invalidateClientCache(clientId: string): Promise<void> {
  await cacheDelByPrefix(`${CACHE_PREFIXES.CLIENT}${clientId}`)
}

// ===========================================
// CACHE POUR DASHBOARD
// ===========================================

/**
 * Cache les données du dashboard
 */
export async function cacheDashboard(
  cabinetId: string,
  userId: string,
  data: unknown
): Promise<boolean> {
  const key = `${CACHE_PREFIXES.DASHBOARD}${cabinetId}:${userId}`
  return cacheSet(key, data, CACHE_TTL.DASHBOARD)
}

/**
 * Récupère les données du dashboard du cache
 */
export async function getCachedDashboard<T>(
  cabinetId: string,
  userId: string
): Promise<T | null> {
  const key = `${CACHE_PREFIXES.DASHBOARD}${cabinetId}:${userId}`
  return cacheGet<T>(key)
}

/**
 * Invalide le cache du dashboard d'un cabinet
 */
export async function invalidateDashboardCache(
  cabinetId: string
): Promise<number> {
  return cacheDelByPrefix(`${CACHE_PREFIXES.DASHBOARD}${cabinetId}`)
}

// ===========================================
// RATE LIMITING
// ===========================================

/**
 * Vérifie et incrémente le rate limit
 * Retourne le nombre de requêtes restantes
 */
export async function checkRateLimit(
  identifier: string,
  maxRequests: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  const key = `${CACHE_PREFIXES.RATE_LIMIT}${identifier}`

  try {
    const current = await redis.incr(key)

    if (current === 1) {
      await redis.expire(key, windowSeconds)
    }

    const ttl = await redis.ttl(key)
    const remaining = Math.max(0, maxRequests - current)

    return {
      allowed: current <= maxRequests,
      remaining,
      resetIn: ttl > 0 ? ttl : windowSeconds,
    }
  } catch (error) {
    console.error('Rate limit check error:', error)
    // En cas d'erreur, autoriser la requête
    return { allowed: true, remaining: maxRequests, resetIn: windowSeconds }
  }
}

// ===========================================
// DISTRIBUTED LOCKS
// ===========================================

/**
 * Acquiert un lock distribué
 */
export async function acquireLock(
  lockName: string,
  ttlSeconds: number = CACHE_TTL.LOCK
): Promise<boolean> {
  const key = `${CACHE_PREFIXES.LOCK}${lockName}`
  const result = await redis.set(key, '1', 'EX', ttlSeconds, 'NX')
  return result === 'OK'
}

/**
 * Libère un lock distribué
 */
export async function releaseLock(lockName: string): Promise<boolean> {
  const key = `${CACHE_PREFIXES.LOCK}${lockName}`
  const deleted = await redis.del(key)
  return deleted === 1
}

/**
 * Exécute une fonction avec un lock
 */
export async function withLock<T>(
  lockName: string,
  fn: () => Promise<T>,
  ttlSeconds: number = CACHE_TTL.LOCK
): Promise<T | null> {
  const acquired = await acquireLock(lockName, ttlSeconds)

  if (!acquired) {
    console.log(`Lock ${lockName} already acquired, skipping`)
    return null
  }

  try {
    return await fn()
  } finally {
    await releaseLock(lockName)
  }
}

// ===========================================
// STATS & MONITORING
// ===========================================

/**
 * Récupère les statistiques du cache Redis
 */
export async function getCacheStats(): Promise<{
  connected: boolean
  memoryUsage: string
  totalKeys: number
  uptime: number
}> {
  try {
    const info = await redis.info('memory')
    const keyspace = await redis.info('keyspace')
    const server = await redis.info('server')

    const memoryMatch = info.match(/used_memory_human:(\S+)/)
    const uptimeMatch = server.match(/uptime_in_seconds:(\d+)/)
    const keysMatch = keyspace.match(/keys=(\d+)/)

    return {
      connected: true,
      memoryUsage: memoryMatch ? memoryMatch[1] : 'unknown',
      totalKeys: keysMatch ? parseInt(keysMatch[1], 10) : 0,
      uptime: uptimeMatch ? parseInt(uptimeMatch[1], 10) : 0,
    }
  } catch (error) {
    return {
      connected: false,
      memoryUsage: 'N/A',
      totalKeys: 0,
      uptime: 0,
    }
  }
}
