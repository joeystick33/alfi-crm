import { NextResponse } from 'next/server'
import { prisma } from '@/app/_common/lib/prisma'

interface ServiceStatus {
  status: 'ok' | 'error'
  latencyMs?: number
  error?: string
}

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  version: string
  uptime: number
  services: {
    database: ServiceStatus
    redis: ServiceStatus
  }
}

async function checkDatabase(): Promise<ServiceStatus> {
  const start = Date.now()
  try {
    await prisma.$queryRaw`SELECT 1`
    return { status: 'ok', latencyMs: Date.now() - start }
  } catch (error) {
    return {
      status: 'error',
      latencyMs: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown database error',
    }
  }
}

async function checkRedis(): Promise<ServiceStatus> {
  const start = Date.now()
  try {
    const { redisHealthCheck } = await import('@/lib/redis')
    const result = await redisHealthCheck()
    return {
      status: result.connected ? 'ok' : 'error',
      latencyMs: result.latency ?? (Date.now() - start),
      error: result.connected ? undefined : 'Redis not connected',
    }
  } catch (error) {
    return {
      status: 'error',
      latencyMs: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown Redis error',
    }
  }
}

const startTime = Date.now()

export async function GET() {
  const [database, redis] = await Promise.all([
    checkDatabase(),
    checkRedis(),
  ])

  const allOk = database.status === 'ok' && redis.status === 'ok'
  const allDown = database.status === 'error' && redis.status === 'error'

  const response: HealthResponse = {
    status: allDown ? 'unhealthy' : allOk ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '0.1.0',
    uptime: Math.floor((Date.now() - startTime) / 1000),
    services: { database, redis },
  }

  const httpStatus = response.status === 'unhealthy' ? 503 : 200
  return NextResponse.json(response, { status: httpStatus })
}
