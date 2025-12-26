// FILE: app/api/cron/cleanup-audit-logs/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { runCleanupAuditLogsJob } from '@/lib/jobs/cleanup-audit-logs.job'

/**
 * POST /api/cron/cleanup-audit-logs
 * 
 * Job CRON pour nettoyer les données anciennes
 * Configuré dans vercel.json pour s'exécuter hebdomadairement le dimanche à 4h
 */
export async function POST(request: NextRequest) {
  try {
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

    const result = await runCleanupAuditLogsJob()

    console.log('[CRON] cleanup-audit-logs:', JSON.stringify(result))

    return NextResponse.json(result, {
      status: result.success ? 200 : 500,
    })
  } catch (error) {
    console.error('[CRON] cleanup-audit-logs error:', error)
    
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
