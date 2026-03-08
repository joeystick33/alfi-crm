import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import { prisma } from '@/app/_common/lib/prisma'

// ============================================================================
// API Route — AI Chat Messages
// POST → Save a message (user or assistant) to a thread
// ============================================================================

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const { user, cabinetId } = await requireAuth(req)
    if (!cabinetId) return NextResponse.json({ error: 'Cabinet requis' }, { status: 400 })

    const { threadId } = await params
    const body = await req.json()

    // Verify thread ownership
    const thread = await prisma.aIChatThread.findFirst({
      where: { id: threadId, cabinetId, userId: user.id },
    })
    if (!thread) {
      return NextResponse.json({ error: 'Thread non trouvé' }, { status: 404 })
    }

    const { role, content, ragSources, agentActions, agentMeta } = body as {
      role: string
      content: string
      ragSources?: unknown
      agentActions?: unknown
      agentMeta?: unknown
    }

    if (!role || !content) {
      return NextResponse.json({ error: 'role et content requis' }, { status: 400 })
    }

    // Save the message
    const message = await prisma.aIChatMessage.create({
      data: {
        threadId,
        role,
        content,
        ragSources: ragSources ? (ragSources as Prisma.InputJsonValue) : Prisma.JsonNull,
        agentActions: agentActions ? (agentActions as Prisma.InputJsonValue) : Prisma.JsonNull,
        agentMeta: agentMeta ? (agentMeta as Prisma.InputJsonValue) : Prisma.JsonNull,
      },
    })

    // Update thread title from first user message if still default
    if (role === 'user' && thread.title === 'Nouvelle conversation') {
      const title = content.slice(0, 80).replace(/\n/g, ' ').trim()
      await prisma.aIChatThread.update({
        where: { id: threadId },
        data: { title, updatedAt: new Date() },
      })
    } else {
      // Touch updatedAt
      await prisma.aIChatThread.update({
        where: { id: threadId },
        data: { updatedAt: new Date() },
      })
    }

    return NextResponse.json({ message })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    console.error('[AI Messages] Error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
