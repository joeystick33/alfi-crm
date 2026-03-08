import { NextResponse } from 'next/server'
import { aiStatus } from '@/app/_common/lib/services/ai-service'

// ============================================================================
// API Route — Health check pour le service IA
// GET : vérification de disponibilité du backend IA + métriques basiques
// ============================================================================

export async function GET() {
  const start = Date.now()

  try {
    const status = await aiStatus()
    const latencyMs = Date.now() - start

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      ai: {
        ...status,
        healthCheckLatencyMs: latencyMs,
      },
    })
  } catch (error: unknown) {
    const latencyMs = Date.now() - start
    return NextResponse.json({
      status: 'degraded',
      timestamp: new Date().toISOString(),
      ai: {
        available: false,
        provider: 'none',
        healthCheckLatencyMs: latencyMs,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    }, { status: 503 })
  }
}
