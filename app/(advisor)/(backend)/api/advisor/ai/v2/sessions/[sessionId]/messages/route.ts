/**
 * API Route — AURA V2 : Messages d'une session IA
 * 
 * GET : Liste les messages d'une session (historique de conversation)
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import { logger } from '@/app/_common/lib/logger'
import { getPrismaClient } from '@/app/_common/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { user, cabinetId } = await requireAuth(req)
    const { sessionId } = await params
    const prisma = getPrismaClient(cabinetId, false)

    const { searchParams } = new URL(req.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200)
    const before = searchParams.get('before') // cursor pagination

    // Vérifier l'accès à la session
    const session = await prisma.aISession.findFirst({
      where: { id: sessionId, cabinetId, userId: user.id },
      select: { id: true, title: true, status: true },
    })

    if (!session) {
      return NextResponse.json({ error: 'Session non trouvée' }, { status: 404 })
    }

    const where: Record<string, unknown> = { sessionId }
    if (before) {
      where.createdAt = { lt: new Date(before) }
    }

    const messages = await prisma.aISessionMessage.findMany({
      where,
      include: {
        run: {
          select: {
            id: true,
            status: true,
            type: true,
            intent: true,
            criticScore: true,
            durationMs: true,
            modelUsed: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
    })

    const formatted = messages.map(m => ({
      id: m.id,
      role: m.role,
      content: m.content,
      metadata: m.metadata,
      run: m.run ? {
        id: m.run.id,
        status: m.run.status,
        type: m.run.type,
        intent: m.run.intent,
        criticScore: m.run.criticScore,
        durationMs: m.run.durationMs,
        modelUsed: m.run.modelUsed,
      } : null,
      createdAt: m.createdAt,
    }))

    return NextResponse.json({
      session: {
        id: session.id,
        title: session.title,
        status: session.status,
      },
      messages: formatted,
      hasMore: messages.length === limit,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    logger.error('[AI V2 Messages GET]', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
