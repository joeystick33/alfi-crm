// FILE: app/api/cron/patrimoine-snapshot/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { runPatrimoineSnapshotJob } from '@/lib/jobs/patrimoine-snapshot.job'

// ===========================================
// CRON ENDPOINT - PATRIMOINE SNAPSHOT
// ===========================================

/**
 * POST /api/cron/patrimoine-snapshot
 * 
 * Job CRON pour créer les snapshots patrimoine mensuels
 * Configuré dans vercel.json pour s'exécuter le 1er de chaque mois à 3h
 * 
 * Headers requis:
 * - Authorization: Bearer {CRON_SECRET}
 */
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification CRON
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret) {
      console.error('CRON_SECRET not configured')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.warn('Unauthorized CRON request')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Exécuter le job
    const result = await runPatrimoineSnapshotJob()

    // Log pour monitoring
    console.log('[CRON] patrimoine-snapshot:', JSON.stringify(result))

    return NextResponse.json(result, {
      status: result.success ? 200 : 500,
    })
  } catch (error) {
    console.error('[CRON] patrimoine-snapshot error:', error)
    
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// Désactiver le cache pour les endpoints CRON
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
