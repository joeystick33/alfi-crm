import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import { prisma } from '@/app/_common/lib/prisma'

// ============================================================================
// API Route — Single AI Chat Thread
// GET    → Get thread with all messages
// PATCH  → Update thread (title, pinned, archived)
// DELETE → Delete thread and all messages
// ============================================================================

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const { user, cabinetId } = await requireAuth(req)
    if (!cabinetId) return NextResponse.json({ error: 'Cabinet requis' }, { status: 400 })

    const { threadId } = await params

    const thread = await prisma.aIChatThread.findFirst({
      where: { id: threadId, cabinetId, userId: user.id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            role: true,
            content: true,
            ragSources: true,
            agentActions: true,
            agentMeta: true,
            createdAt: true,
          },
        },
        client: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    })

    if (!thread) {
      return NextResponse.json({ error: 'Thread non trouvé' }, { status: 404 })
    }

    return NextResponse.json({ thread })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const { user, cabinetId } = await requireAuth(req)
    if (!cabinetId) return NextResponse.json({ error: 'Cabinet requis' }, { status: 400 })

    const { threadId } = await params
    const body = await req.json()

    // Verify ownership
    const existing = await prisma.aIChatThread.findFirst({
      where: { id: threadId, cabinetId, userId: user.id },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Thread non trouvé' }, { status: 404 })
    }

    const allowed: Record<string, unknown> = {}
    if (body.title !== undefined) allowed.title = String(body.title).slice(0, 200)
    if (body.pinned !== undefined) allowed.pinned = Boolean(body.pinned)
    if (body.archived !== undefined) allowed.archived = Boolean(body.archived)
    if (body.summary !== undefined) allowed.summary = body.summary ? String(body.summary).slice(0, 2000) : null

    const thread = await prisma.aIChatThread.update({
      where: { id: threadId },
      data: allowed,
    })

    return NextResponse.json({ thread })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const { user, cabinetId } = await requireAuth(req)
    if (!cabinetId) return NextResponse.json({ error: 'Cabinet requis' }, { status: 400 })

    const { threadId } = await params

    // Verify ownership
    const existing = await prisma.aIChatThread.findFirst({
      where: { id: threadId, cabinetId, userId: user.id },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Thread non trouvé' }, { status: 404 })
    }

    await prisma.aIChatThread.delete({ where: { id: threadId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
