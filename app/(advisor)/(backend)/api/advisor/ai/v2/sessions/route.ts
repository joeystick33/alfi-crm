/**
 * API Route — AURA V2 : Gestion des sessions IA
 * 
 * GET  : Liste les sessions IA de l'utilisateur
 * POST : Crée une nouvelle session IA
 */

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import { logger } from '@/app/_common/lib/logger'

const globalForAISessionsPrisma = globalThis as unknown as {
  aiSessionsPrisma: PrismaClient | undefined
}

const routePrisma = globalForAISessionsPrisma.aiSessionsPrisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') {
  globalForAISessionsPrisma.aiSessionsPrisma = routePrisma
}

export async function GET(req: NextRequest) {
  try {
    const { user, cabinetId } = await requireAuth(req)

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const clientId = searchParams.get('clientId')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const archived = searchParams.get('archived') === 'true'

    const where: Record<string, unknown> = {
      cabinetId,
      userId: user.id,
    }

    if (status) where.status = status
    if (clientId) where.clientId = clientId
    if (!archived) where.status = { not: 'ARCHIVED' }

    const sessions = await routePrisma.aISession.findMany({
      where,
      include: {
        client: {
          select: { id: true, firstName: true, lastName: true },
        },
        _count: {
          select: { runs: true, messages: true },
        },
      },
      orderBy: { lastActiveAt: 'desc' },
      take: limit,
    })

    const formatted = sessions.map(s => ({
      id: s.id,
      title: s.title,
      summary: s.summary,
      status: s.status,
      mode: s.mode,
      client: s.client
        ? { id: s.client.id, name: `${s.client.firstName} ${s.client.lastName}` }
        : null,
      totalRuns: s.totalRuns,
      totalTokens: s.totalTokens.toString(),
      totalToolCalls: s.totalToolCalls,
      totalDuration: s.totalDuration,
      runsCount: s._count.runs,
      messagesCount: s._count.messages,
      startedAt: s.startedAt,
      lastActiveAt: s.lastActiveAt,
      createdAt: s.createdAt,
    }))

    return NextResponse.json({ sessions: formatted })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    logger.error('[AI V2 Sessions GET]', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user, cabinetId } = await requireAuth(req)

    const body = await req.json()
    const { clientId, title, mode, context: sessionContext, profileId } = body as {
      clientId?: string
      title?: string
      mode?: string
      context?: Record<string, unknown>
      profileId?: string
    }

    // Résoudre le profil assistant
    let resolvedProfileId = profileId
    if (!resolvedProfileId) {
      const defaultProfile = await routePrisma.assistantProfile.findFirst({
        where: { cabinetId, isDefault: true, isActive: true },
        select: { id: true },
      })
      resolvedProfileId = defaultProfile?.id
    }

    // Résoudre la connexion active
    const activeConnection = await routePrisma.aIConnection.findFirst({
      where: { cabinetId, status: 'CONNECTED' },
      select: { id: true },
      orderBy: { updatedAt: 'desc' },
    })

    // Générer un titre basé sur le contexte si non fourni
    let sessionTitle = title || 'Nouvelle session'
    if (!title && clientId) {
      const client = await routePrisma.client.findFirst({
        where: { id: clientId, cabinetId },
        select: { firstName: true, lastName: true },
      })
      if (client) {
        sessionTitle = `Session — ${client.firstName} ${client.lastName}`
      }
    }

    const session = await routePrisma.aISession.create({
      data: {
        cabinetId,
        userId: user.id,
        clientId: clientId || null,
        connectionId: activeConnection?.id || null,
        profileId: resolvedProfileId || null,
        status: 'ACTIVE',
        title: sessionTitle,
        mode: mode || 'conversation',
        context: (sessionContext || {}) as import('@prisma/client').Prisma.InputJsonValue,
        startedAt: new Date(),
        lastActiveAt: new Date(),
        // Auto-expire après 24h d'inactivité
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    })

    return NextResponse.json({
      session: {
        id: session.id,
        title: session.title,
        status: session.status,
        mode: session.mode,
        clientId: session.clientId,
        createdAt: session.createdAt,
      },
      message: 'Session créée',
    }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    logger.error('[AI V2 Sessions POST]', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
