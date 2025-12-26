// FILE: lib/redis/index.ts

import Redis, { RedisOptions } from 'ioredis'

// ===========================================
// CONFIGURATION
// ===========================================

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'

// Options de connexion Redis
const redisOptions: RedisOptions = {
  maxRetriesPerRequest: null, // Requis par BullMQ
  enableReadyCheck: false,
  retryStrategy: (times: number) => {
    if (times > 10) {
      console.error('Redis: Max retries reached, giving up')
      return null
    }
    const delay = Math.min(times * 100, 3000)
    console.log(`Redis: Retrying connection in ${delay}ms (attempt ${times})`)
    return delay
  },
  reconnectOnError: (err: Error) => {
    const targetErrors = ['READONLY', 'ECONNRESET', 'ECONNREFUSED']
    return targetErrors.some((e) => err.message.includes(e))
  },
}

// ===========================================
// SINGLETON REDIS CLIENT
// ===========================================

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined
  redisSubscriber: Redis | undefined
}

/**
 * Client Redis principal (pour les opérations générales)
 */
export const redis =
  globalForRedis.redis ??
  new Redis(REDIS_URL, {
    ...redisOptions,
    lazyConnect: true,
  })

/**
 * Client Redis pour les subscriptions (Pub/Sub)
 */
export const redisSubscriber =
  globalForRedis.redisSubscriber ??
  new Redis(REDIS_URL, {
    ...redisOptions,
    lazyConnect: true,
  })

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis
  globalForRedis.redisSubscriber = redisSubscriber
}

// ===========================================
// CONNECTION MANAGEMENT
// ===========================================

/**
 * Connecte le client Redis
 */
export async function connectRedis(): Promise<void> {
  if (redis.status === 'ready') return

  try {
    await redis.connect()
    console.log('✅ Redis connected')
  } catch (error) {
    console.error('❌ Redis connection failed:', error)
    throw error
  }
}

/**
 * Déconnecte le client Redis
 */
export async function disconnectRedis(): Promise<void> {
  try {
    await redis.quit()
    await redisSubscriber.quit()
    console.log('Redis disconnected')
  } catch (error) {
    console.error('Redis disconnect error:', error)
  }
}

/**
 * Vérifie si Redis est connecté
 */
export function isRedisConnected(): boolean {
  return redis.status === 'ready'
}

/**
 * Health check Redis
 */
export async function redisHealthCheck(): Promise<{
  connected: boolean
  latency: number | null
  error?: string
}> {
  try {
    const start = Date.now()
    await redis.ping()
    const latency = Date.now() - start

    return {
      connected: true,
      latency,
    }
  } catch (error) {
    return {
      connected: false,
      latency: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ===========================================
// REDIS EVENT HANDLERS
// ===========================================

redis.on('connect', () => {
  console.log('Redis: Connecting...')
})

redis.on('ready', () => {
  console.log('Redis: Ready')
})

redis.on('error', (error) => {
  console.error('Redis error:', error.message)
})

redis.on('close', () => {
  console.log('Redis: Connection closed')
})

redis.on('reconnecting', () => {
  console.log('Redis: Reconnecting...')
})

// ===========================================
// EXPORTS
// ===========================================

export default redis
export { Redis }
