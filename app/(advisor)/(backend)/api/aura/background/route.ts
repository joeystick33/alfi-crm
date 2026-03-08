/**
 * AURA Background CRON API Route
 *
 * Endpoint sécurisé par CRON_SECRET pour exécuter les scans background.
 * Appelé périodiquement (ex: toutes les 5 minutes via Vercel Cron).
 *
 * GET  /api/aura/background — Health check
 * POST /api/aura/background — Exécuter un cycle de scan
 */

import { NextRequest, NextResponse } from 'next/server'
import { runBackgroundScanCycle, type BackgroundJobType } from '@/app/_common/lib/services/aura'
import { getAuthUser } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'

const CRON_SECRET = process.env.CRON_SECRET

export async function GET() {
  return NextResponse.json({
    service: 'aura-background',
    status: 'healthy',
    timestamp: new Date().toISOString(),
  })
}

export async function POST(request: NextRequest) {
  // Authentification : CRON_SECRET header OU session utilisateur
  const cronSecret = request.headers.get('x-cron-secret')
  const isCron = cronSecret && CRON_SECRET && cronSecret === CRON_SECRET

  let cabinetId: string | undefined
  let userId: string | undefined

  if (isCron) {
    // Mode CRON : les IDs sont dans le body
    try {
      const body = await request.json()
      cabinetId = body.cabinetId
      userId = body.userId
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }
  } else {
    // Mode utilisateur : extraire du contexte auth
    const authUser = await getAuthUser()
    if (!authUser || !isRegularUser(authUser)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    cabinetId = authUser.cabinetId
    userId = authUser.id
  }

  if (!cabinetId || !userId) {
    return NextResponse.json({ error: 'Missing cabinetId or userId' }, { status: 400 })
  }

  try {
    // Optionnel : filtrer les jobs à exécuter
    let jobs: BackgroundJobType[] | undefined
    if (!isCron) {
      try {
        const body = await request.clone().json()
        if (body.jobs && Array.isArray(body.jobs)) {
          jobs = body.jobs as BackgroundJobType[]
        }
      } catch {
        // Pas de body ou body invalide — exécuter tous les jobs
      }
    }

    const results = await runBackgroundScanCycle(cabinetId, userId, jobs)

    const totalInsights = results.reduce((sum, r) => sum + r.insights.length, 0)
    const totalActions = results.reduce((sum, r) => sum + r.proposedActions.length, 0)
    const totalDuration = results.reduce((sum, r) => sum + r.durationMs, 0)

    return NextResponse.json({
      success: true,
      summary: {
        jobsExecuted: results.length,
        insightsFound: totalInsights,
        actionsProposed: totalActions,
        totalDurationMs: totalDuration,
      },
      results,
    })
  } catch (error) {
    console.error('[AURA Background] Scan cycle failed:', error)
    return NextResponse.json(
      { error: 'Background scan failed', details: error instanceof Error ? error.message : 'unknown' },
      { status: 500 },
    )
  }
}
