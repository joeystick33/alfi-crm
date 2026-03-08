// ============================================================
// API Route: POST /api/advisor/simulators/succession/succession-simulation
// Proxy vers la route principale — le frontend store appelle ce endpoint
// via calculateSuccession() qui envoie un buildSuccessionPayload()
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/app/_common/lib/logger'
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Forward to the main succession route which handles the full simulation
    const mainUrl = new URL('/api/advisor/simulators/succession', req.url)
    const res = await fetch(mainUrl.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error: any) {
    logger.error('[succession-simulation] Erreur:', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur interne' },
      { status: 500 },
    )
  }
}
