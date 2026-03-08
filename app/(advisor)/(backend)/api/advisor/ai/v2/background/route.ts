/**
 * API Route — AURA V2 : Agent autonome background
 * 
 * GET  /api/advisor/ai/v2/background        — Statut + derniers insights
 * POST /api/advisor/ai/v2/background        — Déclencher un scan manuel
 * POST /api/advisor/ai/v2/background/dismiss — Dismiss un insight
 */

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import { runBackgroundScanCycle, type BackgroundJobType } from '@/app/_common/lib/services/aura'

// Singleton Prisma
const globalForPrisma = globalThis as unknown as { __bgPrisma?: PrismaClient }
if (!globalForPrisma.__bgPrisma) {
  globalForPrisma.__bgPrisma = new PrismaClient()
}
const routePrisma = globalForPrisma.__bgPrisma

// In-memory cache pour les derniers résultats background (par cabinet)
// En production, ça serait en Redis ou en BDD
const globalCache = globalThis as unknown as {
  __bgInsightsCache?: Map<string, { results: unknown[]; timestamp: number; durationMs: number }>
}
if (!globalCache.__bgInsightsCache) {
  globalCache.__bgInsightsCache = new Map()
}
const insightsCache = globalCache.__bgInsightsCache

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { cabinetId } = auth
    const userId = auth.user.id

    // Vérifier si le cabinet a une connexion IA active
    const activeConnection = await routePrisma.aIConnection.findFirst({
      where: { cabinetId, status: 'CONNECTED' },
      select: { id: true, provider: true },
    })

    // Récupérer le profil par défaut
    const defaultProfile = await routePrisma.assistantProfile.findFirst({
      where: { cabinetId, isDefault: true, isActive: true },
      select: { id: true, name: true, enabledFeatures: true },
    })

    const features = (defaultProfile?.enabledFeatures as Record<string, boolean>) || {}
    const backgroundEnabled = features.backgroundMonitoring !== false

    // Récupérer les insights en cache
    const cached = insightsCache.get(cabinetId)
    const lastScanAt = cached ? new Date(cached.timestamp).toISOString() : null
    const lastScanDurationMs = cached?.durationMs || 0

    // Stats rapides du cabinet (données réelles, pas de LLM)
    const [
      totalClients,
      clientsSansContact,
      kycExpirant,
      tachesEnRetard,
      reclamationsOuvertes,
    ] = await Promise.all([
      routePrisma.client.count({ where: { cabinetId, status: { not: 'ARCHIVE' } } }),
      routePrisma.client.count({ where: { cabinetId, status: { not: 'ARCHIVE' }, email: null, phone: null } }),
      routePrisma.client.count({
        where: {
          cabinetId,
          status: { not: 'ARCHIVE' },
          kycNextReviewDate: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
        },
      }),
      routePrisma.tache.count({
        where: {
          cabinetId,
          assignedToId: userId,
          status: { in: ['A_FAIRE', 'EN_COURS'] },
          dueDate: { lt: new Date() },
        },
      }),
      routePrisma.reclamation.count({
        where: {
          cabinetId,
          status: { in: ['RECUE', 'EN_COURS'] },
        },
      }),
    ])

    return NextResponse.json({
      status: backgroundEnabled && activeConnection ? 'active' : 'inactive',
      backgroundEnabled,
      hasConnection: !!activeConnection,
      provider: activeConnection?.provider || null,
      profileName: defaultProfile?.name || null,
      lastScanAt,
      lastScanDurationMs,
      insights: cached?.results || [],
      quickStats: {
        totalClients,
        clientsSansContact,
        kycExpirant,
        tachesEnRetard,
        reclamationsOuvertes,
      },
    })
  } catch (error) {
    console.error('[AI V2 Background GET]', error)
    return NextResponse.json(
      { error: 'Failed to load background status' },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { cabinetId } = auth
    const userId = auth.user.id

    // Lire les jobs à exécuter depuis le body (optionnel)
    let jobs: BackgroundJobType[] | undefined
    try {
      const body = await request.json()
      if (body.jobs && Array.isArray(body.jobs)) {
        jobs = body.jobs as BackgroundJobType[]
      }
    } catch {
      // Pas de body — exécuter tous les jobs
    }

    const startTime = Date.now()
    const results = await runBackgroundScanCycle(cabinetId, userId, jobs)
    const durationMs = Date.now() - startTime

    const totalInsights = results.reduce((sum, r) => sum + r.insights.length, 0)
    const totalActions = results.reduce((sum, r) => sum + r.proposedActions.length, 0)

    // Mettre en cache
    const allInsights = results.flatMap(r => [
      ...r.insights.map(i => ({ ...i, jobType: r.jobType })),
    ])
    const allActions = results.flatMap(r => [
      ...r.proposedActions.map(a => ({ ...a, jobType: r.jobType })),
    ])

    insightsCache.set(cabinetId, {
      results: [...allInsights, ...allActions],
      timestamp: Date.now(),
      durationMs,
    })

    return NextResponse.json({
      success: true,
      summary: {
        jobsExecuted: results.length,
        insightsFound: totalInsights,
        actionsProposed: totalActions,
        durationMs,
      },
      insights: allInsights,
      proposedActions: allActions,
    })
  } catch (error) {
    console.error('[AI V2 Background POST]', error)
    return NextResponse.json(
      { error: 'Background scan failed', details: error instanceof Error ? error.message : 'unknown' },
      { status: 500 },
    )
  }
}
