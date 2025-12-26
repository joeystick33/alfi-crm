// FILE: app/api/admin/queues/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAllQueuesStats, pauseQueue, resumeQueue, drainQueue, QUEUE_NAMES, QueueName } from '@/lib/queues'
import { getCacheStats } from '@/lib/redis/cache'
import { redisHealthCheck } from '@/lib/redis'

/**
 * GET /api/admin/queues
 * 
 * Récupère les statistiques de toutes les queues BullMQ
 * Réservé aux SuperAdmins
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Stats Redis
    const redisHealth = await redisHealthCheck()
    const cacheStats = await getCacheStats()

    // Stats des queues
    const queuesStats = await getAllQueuesStats()

    return NextResponse.json({
      redis: {
        ...redisHealth,
        ...cacheStats,
      },
      queues: queuesStats,
      availableQueues: Object.values(QUEUE_NAMES),
    })
  } catch (error) {
    console.error('Error fetching queue stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch queue stats' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/queues
 * 
 * Actions sur les queues (pause, resume, drain)
 * Réservé aux SuperAdmins
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, queueName } = body as { action: string; queueName: QueueName }

    if (!action || !queueName) {
      return NextResponse.json(
        { error: 'action and queueName are required' },
        { status: 400 }
      )
    }

    if (!Object.values(QUEUE_NAMES).includes(queueName)) {
      return NextResponse.json(
        { error: 'Invalid queue name' },
        { status: 400 }
      )
    }

    switch (action) {
      case 'pause':
        await pauseQueue(queueName)
        return NextResponse.json({ success: true, message: `Queue ${queueName} paused` })

      case 'resume':
        await resumeQueue(queueName)
        return NextResponse.json({ success: true, message: `Queue ${queueName} resumed` })

      case 'drain':
        await drainQueue(queueName)
        return NextResponse.json({ success: true, message: `Queue ${queueName} drained` })

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: pause, resume, drain' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error performing queue action:', error)
    return NextResponse.json(
      { error: 'Failed to perform queue action' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
