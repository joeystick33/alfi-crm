// ============================================================================
// Rate Limiter — Protection API contre abus, brute force, DDoS
//
// Deux modes :
//   • Redis (production) — partagé entre instances, persistant
//   • In-memory (fallback) — si Redis indisponible
//
// Algorithme : Sliding Window Counter
// ============================================================================

import type { NextRequest } from 'next/server'

// ── TYPES ──────────────────────────────────────────────────────────────────

interface RateLimitConfig {
  /** Nombre max de requêtes dans la fenêtre */
  maxRequests: number
  /** Durée de la fenêtre en secondes */
  windowSeconds: number
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number // timestamp epoch ms
  retryAfterSeconds: number
}

// ── CONFIGURATIONS PAR ENDPOINT ────────────────────────────────────────────

const DEFAULT_RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  // Auth — protection brute force (prod)
  'auth:login': { maxRequests: 5, windowSeconds: 60 },
  'auth:signup': { maxRequests: 3, windowSeconds: 300 },
  'auth:reset-password': { maxRequests: 3, windowSeconds: 300 },

  // API générales — protection abus
  'api:read': { maxRequests: 100, windowSeconds: 60 },
  'api:write': { maxRequests: 30, windowSeconds: 60 },
  'api:ai': { maxRequests: 10, windowSeconds: 60 },

  // Cron / Webhooks
  'api:cron': { maxRequests: 5, windowSeconds: 60 },

  // Default
  'default': { maxRequests: 60, windowSeconds: 60 },
}

function getRateLimitConfigs(): Record<string, RateLimitConfig> {
  // DX: make local login failures less likely to lock developers for 1 minute.
  if (process.env.NODE_ENV !== 'production') {
    return {
      ...DEFAULT_RATE_LIMIT_CONFIGS,
      'auth:login': { maxRequests: 30, windowSeconds: 60 },
      'auth:signup': { maxRequests: 20, windowSeconds: 300 },
      'auth:reset-password': { maxRequests: 20, windowSeconds: 300 },
      'api:read': { maxRequests: 300, windowSeconds: 60 },
      'api:write': { maxRequests: 120, windowSeconds: 60 },
      'api:ai': { maxRequests: 30, windowSeconds: 60 },
      'default': { maxRequests: 180, windowSeconds: 60 },
    }
  }
  return DEFAULT_RATE_LIMIT_CONFIGS
}

// ── IN-MEMORY STORE (Fallback si Redis indisponible) ───────────────────────

const memoryStore = new Map<string, { count: number; resetAt: number }>()

// Nettoyage périodique des entrées expirées (toutes les 60s)
let cleanupInterval: ReturnType<typeof setInterval> | null = null

function ensureCleanup() {
  if (cleanupInterval) return
  cleanupInterval = setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of memoryStore) {
      if (entry.resetAt <= now) {
        memoryStore.delete(key)
      }
    }
  }, 60_000)
  // Permettre au process de se terminer proprement
  if (typeof cleanupInterval === 'object' && 'unref' in cleanupInterval) {
    cleanupInterval.unref()
  }
}

async function checkMemoryRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  ensureCleanup()
  const now = Date.now()
  const entry = memoryStore.get(key)

  if (!entry || entry.resetAt <= now) {
    const resetAt = now + config.windowSeconds * 1000
    memoryStore.set(key, { count: 1, resetAt })
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt,
      retryAfterSeconds: 0,
    }
  }

  entry.count++
  const allowed = entry.count <= config.maxRequests
  const remaining = Math.max(0, config.maxRequests - entry.count)
  const retryAfterSeconds = allowed ? 0 : Math.ceil((entry.resetAt - now) / 1000)

  return { allowed, remaining, resetAt: entry.resetAt, retryAfterSeconds }
}

// ── REDIS STORE (Production) ───────────────────────────────────────────────

async function checkRedisRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  try {
    const { redis } = await import('@/lib/redis')
    const redisKey = `ratelimit:${key}`
    const now = Date.now()

    const pipe = redis.multi()
    pipe.incr(redisKey)
    pipe.pttl(redisKey)
    const results = await pipe.exec()

    if (!results) throw new Error('Redis pipeline returned null')

    const count = (results[0]?.[1] as number) ?? 1
    const ttl = (results[1]?.[1] as number) ?? -1

    // Si le TTL n'est pas défini (nouvelle clé), le fixer
    if (ttl === -1 || ttl === -2) {
      await redis.pexpire(redisKey, config.windowSeconds * 1000)
    }

    const resetAt = now + (ttl > 0 ? ttl : config.windowSeconds * 1000)
    const allowed = count <= config.maxRequests
    const remaining = Math.max(0, config.maxRequests - count)
    const retryAfterSeconds = allowed ? 0 : Math.ceil((resetAt - now) / 1000)

    return { allowed, remaining, resetAt, retryAfterSeconds }
  } catch {
    // Fallback in-memory si Redis est down
    return checkMemoryRateLimit(key, config)
  }
}

// ── HELPERS ────────────────────────────────────────────────────────────────

/**
 * Extrait l'identifiant unique du requêteur (IP ou userId)
 */
function getRequestIdentifier(request: NextRequest, userId?: string): string {
  if (userId) return `user:${userId}`

  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown'
  return `ip:${ip}`
}

/**
 * Détermine la catégorie de rate limit selon le pathname et la méthode
 */
function resolveCategory(pathname: string, method: string): string {
  // Auth endpoints
  if (pathname.includes('/login') || pathname.includes('/auth/callback')) return 'auth:login'
  if (pathname.includes('/signup') || pathname.includes('/register')) return 'auth:signup'
  if (pathname.includes('/reset-password') || pathname.includes('/forgot-password')) return 'auth:reset-password'

  // AI endpoints (plus restrictifs)
  if (pathname.includes('/traiter') || pathname.includes('/ai/') || pathname.includes('/chat')) return 'api:ai'

  // Cron
  if (pathname.includes('/cron/')) return 'api:cron'

  // Read vs Write
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return 'api:read'
  return 'api:write'
}

const ENDPOINT_SCOPED_CATEGORIES = new Set(['api:read', 'api:write', 'api:ai'])
const DYNAMIC_SEGMENT_PATTERNS = [
  /^\d+$/,
  /^[a-f0-9]{8,}$/i,
  /^c[a-z0-9]{10,}$/i,
  /^[a-z0-9_-]{20,}$/i,
]

function isLikelyDynamicSegment(segment: string): boolean {
  return DYNAMIC_SEGMENT_PATTERNS.some(pattern => pattern.test(segment))
}

function normalizePathForRateLimit(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length === 0) return 'root'

  return segments
    .map((segment, index) => {
      if (index === 0 && segment === 'api') return segment
      return isLikelyDynamicSegment(segment) ? ':id' : segment
    })
    .join('/')
}

function buildRateLimitKey(
  category: string,
  identifier: string,
  pathname: string
): string {
  if (!ENDPOINT_SCOPED_CATEGORIES.has(category)) {
    return `${category}:${identifier}`
  }

  return `${category}:${identifier}:${normalizePathForRateLimit(pathname)}`
}

// ── API PUBLIQUE ───────────────────────────────────────────────────────────

/**
 * Vérifie le rate limit pour une requête.
 * Retourne le résultat avec headers à ajouter à la réponse.
 */
export async function checkRateLimit(
  request: NextRequest,
  options?: { userId?: string; category?: string }
): Promise<RateLimitResult> {
  if (process.env.DISABLE_RATE_LIMIT === 'true') {
    return {
      allowed: true,
      remaining: Number.MAX_SAFE_INTEGER,
      resetAt: Date.now() + 60_000,
      retryAfterSeconds: 0,
    }
  }

  const identifier = getRequestIdentifier(request, options?.userId)
  const category = options?.category || resolveCategory(request.nextUrl.pathname, request.method)
  const rateLimitConfigs = getRateLimitConfigs()
  const config = rateLimitConfigs[category] || rateLimitConfigs['default']
  const key = buildRateLimitKey(category, identifier, request.nextUrl.pathname)

  // Tenter Redis, fallback in-memory
  const useRedis = process.env.REDIS_URL && process.env.REDIS_URL !== ''
  if (useRedis) {
    return checkRedisRateLimit(key, config)
  }
  return checkMemoryRateLimit(key, config)
}

/**
 * Génère les headers de rate limiting pour la réponse HTTP
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
    ...(result.retryAfterSeconds > 0 ? { 'Retry-After': String(result.retryAfterSeconds) } : {}),
  }
}

/**
 * Crée une réponse 429 Too Many Requests
 */
export function createRateLimitResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({
      error: 'Too Many Requests',
      message: `Trop de requêtes. Réessayez dans ${result.retryAfterSeconds} secondes.`,
      retryAfterSeconds: result.retryAfterSeconds,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        ...rateLimitHeaders(result),
      },
    }
  )
}
