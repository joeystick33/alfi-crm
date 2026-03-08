/**
 * AURA Brain API — Acquisition et consultation des connaissances
 * 
 * GET  /api/advisor/ai/brain — Stats du cerveau
 * POST /api/advisor/ai/brain — Acquisition de connaissances
 */

import { NextRequest, NextResponse } from 'next/server'
import { auraBrain, type KnowledgeDomain } from '@/app/_common/lib/services/aura/aura-brain'
import { requireAuth } from '@/app/_common/lib/auth-helpers'

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req)
    const stats = auraBrain.getStats()
    return NextResponse.json(stats)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth(req)

    const body = await req.json()
    const { action, domains, query } = body as {
      action: 'acquire' | 'search' | 'acquire_all' | 'reset'
      domains?: KnowledgeDomain[]
      query?: string
    }

    switch (action) {
      case 'acquire_all': {
        const result = await auraBrain.acquireAll(domains)
        return NextResponse.json({ success: true, ...result })
      }

      case 'acquire': {
        if (!domains || domains.length === 0) {
          return NextResponse.json({ error: 'domains requis' }, { status: 400 })
        }
        let total = 0
        for (const domain of domains) {
          total += await auraBrain.acquireKnowledge(domain)
        }
        return NextResponse.json({ success: true, total })
      }

      case 'search': {
        if (!query) {
          return NextResponse.json({ error: 'query requis' }, { status: 400 })
        }
        const result = auraBrain.search(query, domains, 10)
        return NextResponse.json(result)
      }

      case 'reset': {
        auraBrain.reset()
        return NextResponse.json({ success: true })
      }

      default:
        return NextResponse.json({ error: 'Action inconnue' }, { status: 400 })
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    )
  }
}
