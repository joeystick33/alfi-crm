// FILE: app/api/cron/task-reminders/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { runTaskRemindersJob } from '@/lib/jobs/task-reminders.job'

/**
 * POST /api/cron/task-reminders
 * 
 * Job CRON pour les rappels de tâches
 * Configuré dans vercel.json pour s'exécuter quotidiennement à 7h
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

    const result = await runTaskRemindersJob()

    console.log('[CRON] task-reminders:', JSON.stringify(result))

    return NextResponse.json(result, {
      status: result.success ? 200 : 500,
    })
  } catch (error) {
    console.error('[CRON] task-reminders error:', error)
    
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
